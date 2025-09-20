# ADR — Telemetry retention and aggregation strategy

**Status:** Accepted  
**Owners:** @JaysonBrenton  
**Created:** 2025-02-17

## Context
The foundation milestone introduces telemetry ingestion, but the eventual system will manage hours of Hz-level data per session.
We must define an interim retention strategy so the control tower can ingest demo data without exploding storage or making
visualisations sluggish. Today we only capture a single car trace for validation purposes.

## Decision
Store raw telemetry samples verbatim in the `TelemetrySample` table and cap API reads to a configurable window (default 500
samples). Aggregation for dashboards occurs in-process using a lightweight summary function that computes averages, peaks, and
window duration. We will revisit long-term retention when multi-car ingest and historical analytics arrive; for now a single
Prisma table is sufficient and keeps the schema aligned with `docs/domain-model.md`.

## Consequences
- Positive: Simplicity—no secondary stores or queues are required, accelerating foundation delivery.
- Positive: The timeline view has deterministic bounds, preventing runaway payload sizes.
- Trade-off: Without downsampling, very long sessions would require pagination; future iterations must add streaming or tiered
  storage.
- Risk: Forgetting to enforce limits could degrade API latency. Mitigated by repository defaults and documented contracts.

## Alternatives considered
- **Time-series database (e.g., TimescaleDB, InfluxDB)**: rejected for now due to operational overhead and the small initial
  scope.
- **Immediate downsampling on ingest**: rejected because we want raw traces for later analytics; summarisation occurs when
  presenting dashboards.
- **S3/object storage for raw data**: premature while we only handle small demo payloads.

## Rollout / Migration
- Add Zod validation to guard input ranges and shape.
- Persist telemetry via Prisma with bounded list queries.
- Compute aggregates in `computeSummary` for the metrics dashboard and expose the same data via API if needed later.

## Security & Privacy
Telemetry samples contain car performance but no personal data. Retention mirrors session lifetime; future work will define purge
policies when telemetry volume increases.

## Links
- [Design principles](../design-principles.md)
- [Domain model](../domain-model.md)
- [API contracts](../api/sessions.md)
