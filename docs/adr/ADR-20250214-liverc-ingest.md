# ADR — Persist LiveRC timing metadata

**Status:** Accepted  
**Owners:** @JaysonBrenton  
**Created:** 2025-02-14

## Context
We need to ingest timing and results data from LiveRC so engineering and strategy teams can correlate telemetry with official
heats. Prior work only modelled internal `Session` records without any notion of the upstream timing provider. Without explicit
metadata we cannot reconcile runs, classes, or heats across providers, nor can we surface provenance in the control tower UI.
The integration must respect the layering rules in `docs/design-principles.md` (domain-driven, contracts first) and preserve
existing manual session workflows while allowing LiveRC-backed persistence.

## Decision
Introduce dedicated LiveRC entities (`LiveRcEvent`, `LiveRcClass`, `LiveRcHeat`, `LiveRcEntry`, `LiveRcResult`) plus a
`TimingProvider` enum owned by the domain. `Session` gains optional linkage to a LiveRC heat with default manual provider. The
Prisma schema captures the relationships with cascading deletes and unique constraints mirroring LiveRC identifiers. API
responses and forms surface the timing provider and LiveRC metadata when present. Validation now enforces that `LIVE_RC`
sessions supply a heat identifier. Documentation includes captured payloads to keep contracts traceable before further code
changes.

## Consequences
- Positive: Sessions clearly indicate their timing source, enabling ingestion pipelines to branch by provider and making UI
  provenance explicit.
- Positive: LiveRC metadata is normalised, allowing us to join heats, entries, and results to telemetry without repeated JSON
  parsing.
- Trade-offs / negatives: Additional tables increase migration complexity and seed requirements; LiveRC-specific metadata is now
  coupled to the primary schema.
- Risks & mitigations: Risk of stale references if a LiveRC heat is deleted upstream; mitigated by foreign keys with `SET NULL`
  semantics and validation guarding new links. Future providers will require either a new enum member or a polymorphic design.

## Alternatives considered
- **Opaque JSON column** storing raw LiveRC payload: rejected because it prevents relational joins and breaks alignment with
  domain invariants.
- **Separate microservice** for timing providers: rejected for now—adds deployment complexity without clear scaling needs.
- **Provider-specific session table** instead of enum: rejected because we still need a single session abstraction for the UI and
  ingestion API.

## Rollout / Migration
- Ship Prisma migration adding enums, tables, and constraints.
- Regenerate the Prisma client and update repositories to include LiveRC relations.
- Update UI and API contracts to advertise the new metadata.
- Backfill LiveRC records by replaying captured payloads once the ingestion worker is connected.

## Security & Privacy
LiveRC metadata is public event information (no PII beyond driver names already published). Access is limited to application
services; retention matches existing session data. No additional secrets are stored.

## Open questions
- How will we reconcile LiveRC driver records with internal `Driver` entities?
- Do we need historical snapshots of results, or is the latest LiveRC state sufficient?
- Should timing providers become a standalone table to enable per-session overrides (e.g., manual corrections)?

## Links
- [Design principles](../design-principles.md)
- [LiveRC payload reference](../integrations/liverc.md)
- [Domain model](../domain-model.md)
