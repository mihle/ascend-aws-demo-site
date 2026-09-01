"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createDataProbe, createRequestHandler, loadDatabaseConfig } = require("./server");

const REVISION = "0123456789abcdef0123456789abcdef01234567";

async function request(handler, requestPath) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  try {
    return await new Promise((resolve, reject) => {
      http.get({ hostname: "127.0.0.1", port: address.port, path: requestPath }, (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body: Buffer.concat(chunks).toString("utf8"),
        }));
      }).on("error", reject);
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("serves the unchanged rendered page with immutable revision header", async () => {
  const webRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ascend-demo-site-"));
  fs.writeFileSync(path.join(webRoot, "index.html"), "<h1>Altivo Logistics</h1>");
  const handler = createRequestHandler({
    companyName: "Altivo Logistics",
    revision: REVISION,
    webRoot,
    databaseProbe: { probe: async () => ({}) },
  });

  const response = await request(handler, "/");
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["x-ascend-application-revision"], REVISION);
  assert.equal(response.body, "<h1>Altivo Logistics</h1>");
});

test("healthz returns database read-back proof", async () => {
  const handler = createRequestHandler({
    companyName: "Altivo Logistics",
    revision: REVISION,
    webRoot: "/unused",
    databaseProbe: {
      probe: async ({ revision }) => ({ marker: "database-round-trip", application_revision: revision }),
    },
  });

  const response = await request(handler, "/healthz");
  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), {
    status: "ok",
    company: "Altivo Logistics",
    revision: REVISION,
    database: {
      status: "ok",
      marker: "database-round-trip",
      applicationRevision: REVISION,
    },
  });
});

test("healthz returns application data read-back proof when configured", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ascend-demo-data-"));
  const handler = createRequestHandler({
    companyName: "Altivo Logistics",
    revision: REVISION,
    webRoot: "/unused",
    databaseProbe: {
      probe: async ({ revision }) => ({ marker: "database-round-trip", application_revision: revision }),
    },
    dataProbe: createDataProbe(directory),
  });

  const response = await request(handler, "/healthz");
  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body).storage, {
    status: "ok",
    marker: "application-data-round-trip",
    applicationRevision: REVISION,
  });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory, "application-health.json"), "utf8")), {
    marker: "application-data-round-trip",
    company: "Altivo Logistics",
    applicationRevision: REVISION,
  });
});

test("healthz reports a configured data-path failure without blaming the database", async () => {
  const handler = createRequestHandler({
    companyName: "Altivo Logistics",
    revision: REVISION,
    webRoot: "/unused",
    databaseProbe: {
      probe: async ({ revision }) => ({ marker: "database-round-trip", application_revision: revision }),
    },
    dataProbe: { probe: async () => { throw new Error("mount details must not leak"); } },
  });

  const response = await request(handler, "/healthz");
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.includes("mount details"), false);
  assert.deepEqual(JSON.parse(response.body), {
    status: "unavailable",
    company: "Altivo Logistics",
    revision: REVISION,
    database: {
      status: "ok",
      marker: "database-round-trip",
      applicationRevision: REVISION,
    },
    storage: { status: "error" },
  });
});

test("data path is optional but cannot target the filesystem root", () => {
  assert.equal(createDataProbe(undefined), null);
  assert.throws(() => createDataProbe("relative"), /must be absolute/);
  assert.throws(() => createDataProbe(path.parse(process.cwd()).root), /must not be a filesystem root/);
});

test("healthz fails closed without disclosing the database error", async () => {
  const handler = createRequestHandler({
    companyName: "Altivo Logistics",
    revision: REVISION,
    webRoot: "/unused",
    databaseProbe: { probe: async () => { throw new Error("password=do-not-leak"); } },
  });

  const response = await request(handler, "/healthz");
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.includes("do-not-leak"), false);
  assert.deepEqual(JSON.parse(response.body).database, { status: "error" });
});

test("loads an owner-provided database config file", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ascend-demo-db-"));
  const filePath = path.join(directory, "database.json");
  fs.writeFileSync(filePath, JSON.stringify({
    host: "db.internal",
    port: 5432,
    database: "ascend_demo",
    username: "ascend_demo",
    password: "secret",
  }));

  const config = loadDatabaseConfig(filePath);
  assert.equal(config.host, "db.internal");
  assert.equal(config.user, "ascend_demo");
  assert.equal(config.password, "secret");
});
