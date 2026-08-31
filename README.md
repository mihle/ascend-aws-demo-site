# Ascend AWS Demo Site

> A colorful, immutable web fixture for proving governed AWS software installation through Ascend.

![Static HTML](https://img.shields.io/badge/site-static_HTML-26d9c7?style=for-the-badge)
![Container](https://img.shields.io/badge/container-BusyBox-7c5cff?style=for-the-badge)
![Fixture TTL](https://img.shields.io/badge/fixture_TTL-24h-f59e0b?style=for-the-badge)

This repository is intentionally small. Ascend pins an immutable commit, installs the container on a disposable EC2 fixture through AWS Systems Manager, and independently verifies the source SHA, running container, and HTTP response.

## What is here

- A responsive, dependency-free landing page
- A tiny BusyBox HTTP container
- Runtime `SITE_NAME` injection without rebuilding the image
- No credentials, analytics, CI secrets, package manager, or external assets

## Run it

```bash
docker build -t ascend-aws-demo-site .
docker run --rm -p 8080:80 -e SITE_NAME="My AWS Demo" ascend-aws-demo-site
```

Open `http://localhost:8080`.

## Why it exists

The repository is a deliberately bounded public input to Ascend's governed AWS request flow:

`Alix request → reviewed ChangeSet → approval → SSM execution → independent verification → fixture teardown`

The surrounding EC2 fixture is tagged and expires within 24 hours. This repository contains no AWS credentials or environment-specific configuration.
