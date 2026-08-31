# Customer Demo Site

> A lively, customer-branded site that doubles as an immutable AWS installation fixture.

[**Open the live demo →**](https://mihle.github.io/ascend-aws-demo-site/)

![Static HTML](https://img.shields.io/badge/site-static_HTML-4054d9?style=for-the-badge)
![Container](https://img.shields.io/badge/container-BusyBox-ee829a?style=for-the-badge)
![Fixture TTL](https://img.shields.io/badge/fixture_TTL-24h-d7ea61?style=for-the-badge)

This repository is intentionally small. Ascend pins an immutable commit, installs the container on a disposable EC2 fixture through AWS Systems Manager, and independently verifies the source SHA, running container, and HTTP response.

## What is here

- A responsive, dependency-free landing page
- A tiny BusyBox HTTP container
- Runtime `COMPANY_NAME` injection without rebuilding the image
- Backward-compatible `SITE_NAME` support for the existing Ascend action
- No credentials, analytics, CI secrets, package manager, or external assets

## Run it

```bash
docker build -t ascend-aws-demo-site .
docker run --rm -p 8080:80 -e COMPANY_NAME="Meridian & Co." ascend-aws-demo-site
```

Open `http://localhost:8080`. If `COMPANY_NAME` is absent, the container accepts
`SITE_NAME` as a compatibility fallback.

## Why it exists

The repository is a deliberately bounded public input to Ascend's governed AWS request flow:

`Alix request → reviewed ChangeSet → approval → SSM execution → independent verification → fixture teardown`

The surrounding EC2 fixture is tagged and expires within 24 hours. This repository contains no AWS credentials or environment-specific configuration.
