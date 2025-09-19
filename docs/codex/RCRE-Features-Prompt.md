# RCRE Features Prompt

## Level 1 / Level 2 (Implementation contract)

When ingesting or analysing LiveRC data, follow LiveRC-Metadata.md, ingestion-plan.md, and model-extensions.md and honour performance budgets + telemetry.
When ingesting or analysing LiveRC data, follow:
- docs/codex/LiveRC-Metadata.md
- docs/codex/ingestion-plan.md
- docs/codex/model-extensions.md

Honour performance budgets (UI P50 ≤ 300 ms, P95 ≤ 800 ms; API reads P95 ≤ 400 ms) and emit telemetry for timings, errors, and event counts. Treat these docs as the single source of truth for field names, idempotency keys, and crawl order.

## Acceptance checklist

- Database: If schema changes, PR must include Prisma migration files and a release note with the VM apply commands. Service must run prisma migrate deploy on start (ExecStartPre). /api/ready must fail while migrations are pending.
