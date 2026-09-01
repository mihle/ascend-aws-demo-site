# Customer Demo Site

> A lively, customer-branded site that doubles as an immutable AWS installation fixture.

[**Open the live demo →**](https://mihle.github.io/ascend-aws-demo-site/)

![Static UI](https://img.shields.io/badge/UI-static_HTML-4054d9?style=for-the-badge)
![Container](https://img.shields.io/badge/server-Node.js-ee829a?style=for-the-badge)
![Database health](https://img.shields.io/badge/health-PostgreSQL-d7ea61?style=for-the-badge)

This repository is intentionally small. The AWS demo stack pins an immutable
commit, installs the same container on two EC2 targets, and independently proves
the source revision, running service, public response, and database round trip.

## What is here

- A responsive, dependency-free landing page
- A tiny Node HTTP server that preserves the static visual surface
- Runtime `COMPANY_NAME` injection without rebuilding the image
- Backward-compatible `SITE_NAME` support for the existing Ascend action
- Immutable revision proof in page metadata and `X-Ascend-Application-Revision`
- `/healthz` backed by a real idempotent PostgreSQL write/read probe
- No credentials, analytics, CI secrets, package manager, or external assets

## Run it

```bash
docker build -t ascend-aws-demo-site .
docker run --rm -p 8080:80 \
  -e COMPANY_NAME="Meridian & Co." \
  -e APPLICATION_REVISION="$(git rev-parse HEAD)" \
  -e DATABASE_CONFIG_FILE=/run/secrets/database.json \
  -v "$PWD/database.local.json:/run/secrets/database.json:ro" \
  ascend-aws-demo-site
```

Open `http://localhost:8080`. If `COMPANY_NAME` is absent, the container accepts
`SITE_NAME` as a compatibility fallback. The database file is a JSON object with
`host`, `port`, `database`, `username`, and `password`; keep it owner-only and do
not commit it.

## Why it exists

The repository is a deliberately bounded public input to Ascend's governed AWS request flow:

`Alix request → reviewed ChangeSet → approval → SSM execution → independent verification → fixture teardown`

The surrounding AWS stack owns the database and supplies the database file at
runtime. This repository contains no AWS credentials or environment-specific
configuration.
