# RCRE Features Prompt

## Level 1 / Level 2 (Implementation contract)

When ingesting or analysing LiveRC data, follow:
- docs/codex/LiveRC-Metadata.md
- docs/codex/ingestion-plan.md
- docs/codex/model-extensions.md

Honour performance budgets (UI P50 ≤ 300 ms, P95 ≤ 800 ms; API reads P95 ≤ 400 ms) and emit telemetry for timings, errors, and event counts. Treat these docs as the single source of truth for field names, idempotency keys, and crawl order.

## Acceptance checklist

- Prisma migrations + VM apply commands + ExecStartPre migrate + /api/ready fails if pending
