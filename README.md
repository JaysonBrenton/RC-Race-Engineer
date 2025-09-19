# The RC Racing Engineer

## Build tracking
Release and artifact builds are logged in [docs/build-log.md](docs/build-log.md). Update the log immediately after each successful release build so future maintainers can trace what was shipped and when.

Fresh start. This repo contains the web app and related tooling for The RC Racing Engineer project.

## Database synchronisation

Use `scripts/db-sync.sh` to keep the local database schema in sync with the Prisma migrations. The script runs `prisma generate` and `prisma migrate deploy` from the `web` workspace, then checks `http://localhost:3000/api/ready` (or the `READY_ENDPOINT` environment override). It exits non-zero if any step fails, which makes it safe to wire into deployment hooks or CI jobs.

