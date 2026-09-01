"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { Pool } = require("pg");

const STATIC_FILES = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
]);

function requireText(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

function loadDatabaseConfig(filePath) {
  const configPath = requireText(filePath, "DATABASE_CONFIG_FILE");
  const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const port = Number(parsed.port ?? 5432);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("database port must be an integer from 1 to 65535");
  }

  return {
    host: requireText(parsed.host, "database host"),
    port,
    database: requireText(parsed.database, "database name"),
    user: requireText(parsed.username, "database username"),
    password: requireText(parsed.password, "database password"),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3_000,
    statement_timeout: 3_000,
    max: 2,
  };
}

function createDatabaseProbe(config) {
  const pool = new Pool(config);

  return {
    async probe({ revision }) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ascend_demo_health (
          marker text PRIMARY KEY,
          application_revision text NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      await pool.query(
        `INSERT INTO ascend_demo_health (marker, application_revision)
         VALUES ($1, $2)
         ON CONFLICT (marker) DO UPDATE
         SET application_revision = EXCLUDED.application_revision,
             updated_at = now()`,
        ["database-round-trip", revision],
      );
      const result = await pool.query(
        `SELECT marker, application_revision
         FROM ascend_demo_health
         WHERE marker = $1`,
        ["database-round-trip"],
      );
      if (result.rowCount !== 1) {
        throw new Error("database health marker was not read back");
      }
      return result.rows[0];
    },
    async close() {
      await pool.end();
    },
  };
}

function createDataProbe(dataPath) {
  if (dataPath == null || String(dataPath).trim() === "") return null;
  const configuredPath = requireText(dataPath, "APPLICATION_DATA_PATH");
  if (!path.isAbsolute(configuredPath)) {
    throw new Error("APPLICATION_DATA_PATH must be absolute");
  }
  const directory = path.resolve(configuredPath);
  if (directory === path.parse(directory).root) {
    throw new Error("APPLICATION_DATA_PATH must not be a filesystem root");
  }

  return {
    async probe({ companyName, revision }) {
      await fs.promises.mkdir(directory, { recursive: true });
      const marker = {
        marker: "application-data-round-trip",
        company: companyName,
        applicationRevision: revision,
      };
      const markerPath = path.join(directory, "application-health.json");
      const temporaryPath = `${markerPath}.${process.pid}.${randomUUID()}.tmp`;
      await fs.promises.writeFile(temporaryPath, `${JSON.stringify(marker)}\n`, {
        encoding: "utf8",
        mode: 0o600,
      });
      await fs.promises.rename(temporaryPath, markerPath);
      const observed = JSON.parse(await fs.promises.readFile(markerPath, "utf8"));
      if (
        observed.marker !== marker.marker ||
        observed.company !== companyName ||
        observed.applicationRevision !== revision
      ) {
        throw new Error("application data marker was not read back");
      }
      return observed;
    },
  };
}

function json(res, statusCode, body, revision, headOnly = false) {
  const payload = Buffer.from(JSON.stringify(body));
  res.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": payload.length,
    "Content-Type": "application/json; charset=utf-8",
    "X-Ascend-Application-Revision": revision,
  });
  res.end(headOnly ? undefined : payload);
}

function createRequestHandler({ companyName, revision, webRoot, databaseProbe, dataProbe = null }) {
  return async (req, res) => {
    const headOnly = req.method === "HEAD";
    if (req.method !== "GET" && !headOnly) {
      res.writeHead(405, { Allow: "GET, HEAD" });
      res.end();
      return;
    }

    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/healthz") {
      let database;
      try {
        const row = await databaseProbe.probe({ revision });
        database = {
          status: "ok",
          marker: row.marker,
          applicationRevision: row.application_revision,
        };
      } catch {
        json(
          res,
          503,
          { status: "unavailable", company: companyName, revision, database: { status: "error" } },
          revision,
          headOnly,
        );
        return;
      }

      let storage;
      if (dataProbe) {
        try {
          const row = await dataProbe.probe({ companyName, revision });
          storage = {
            status: "ok",
            marker: row.marker,
            applicationRevision: row.applicationRevision,
          };
        } catch {
          json(
            res,
            503,
            {
              status: "unavailable",
              company: companyName,
              revision,
              database,
              storage: { status: "error" },
            },
            revision,
            headOnly,
          );
          return;
        }
      }

      json(
        res,
        200,
        {
          status: "ok",
          company: companyName,
          revision,
          database,
          ...(storage ? { storage } : {}),
        },
        revision,
        headOnly,
      );
      return;
    }

    const staticFile = STATIC_FILES.get(url.pathname);
    if (!staticFile) {
      res.writeHead(404, { "X-Ascend-Application-Revision": revision });
      res.end();
      return;
    }

    const [fileName, contentType] = staticFile;
    const body = fs.readFileSync(path.join(webRoot, fileName));
    res.writeHead(200, {
      "Cache-Control": "no-cache",
      "Content-Length": body.length,
      "Content-Type": contentType,
      "X-Ascend-Application-Revision": revision,
    });
    res.end(headOnly ? undefined : body);
  };
}

function start() {
  const companyName = requireText(process.env.COMPANY_NAME ?? process.env.SITE_NAME, "COMPANY_NAME");
  const revision = requireText(process.env.APPLICATION_REVISION, "APPLICATION_REVISION");
  const webRoot = process.env.WEB_ROOT ?? "/www";
  const port = Number(process.env.PORT ?? 80);
  const databaseProbe = createDatabaseProbe(loadDatabaseConfig(process.env.DATABASE_CONFIG_FILE));
  const dataProbe = createDataProbe(process.env.APPLICATION_DATA_PATH);
  const server = http.createServer(createRequestHandler({ companyName, revision, webRoot, databaseProbe, dataProbe }));

  const shutdown = () => {
    server.close(() => {
      databaseProbe.close().finally(() => process.exit(0));
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  server.listen(port);
}

if (require.main === module) {
  start();
}

module.exports = { createDataProbe, createDatabaseProbe, createRequestHandler, loadDatabaseConfig, requireText };
