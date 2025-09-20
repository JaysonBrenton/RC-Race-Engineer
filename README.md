# The RC Racing Engineer

## Build tracking
Release and artifact builds are logged in [docs/build-log.md](docs/build-log.md). Update the log immediately after each successful release build so future maintainers can trace what was shipped and when.

Fresh start. This repo contains the web app and related tooling for The RC Racing Engineer project.

## Development quick start

1. Install dependencies inside `web/` (`npm install`).
2. Export a passphrase for the dev runtime: `export DEV_AUTH_PASSWORD=choose-a-secret`.
   - Optional: set `DEV_API_TOKEN` to issue bearer tokens for scripted ingest.
3. Run Prisma migrations and generate the client (`scripts/db-sync.sh` from the repo root).
4. Start the Next.js app from `web/` (`npm run dev`).
5. Visit `http://localhost:3000/login`, enter the shared passphrase, and you will be redirected to the control tower.

## Telemetry workflow (foundation release)

- Create sessions via the form on the landing page or `POST /api/sessions`.
- Stream telemetry samples to `POST /api/sessions/{id}/events` using the authenticated cookie or `Authorization: Bearer` header.
- Use the demo injector panel to simulate bursts of five samples—helpful for validating UI updates without wiring external hardware yet.
- The timeline visualises speed, throttle, and brake traces using the design-token palette. Metrics alongside provide average and peak values over the fetched window (default 500 samples).

## Database synchronisation

Use `scripts/db-sync.sh` to keep the local database schema in sync with the Prisma migrations. The script runs `prisma generate` and `prisma migrate deploy` from the `web` workspace, then checks `http://localhost:3000/api/ready` (or the `READY_ENDPOINT` environment override). It exits non-zero if any step fails, which makes it safe to wire into deployment hooks or CI jobs.

