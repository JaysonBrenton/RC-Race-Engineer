# ADRs (Architecture Decision Records)

An ADR captures an important technical decision, the context behind it, and the consequences.

## When to write an ADR
- New significant dependency or service (DB, queue, auth, telemetry)
- Data model or schema changes (Sessions/Telemetry for RCRE)
- Cross-cutting concerns (performance, security, privacy, error handling)
- Runtime/infra choices (hosting, build strategy, observability)
- Any decision a future maintainer should understand quickly

## Location & naming
Files live in `docs/adr/ADR-YYYYMMDD-title.md`.  
**Example:** `docs/adr/ADR-20250917-choose-telemetry-store.md`.

## Status values
**Proposed** • **Accepted** • **Deprecated** • **Superseded** • **Rejected**

## Suggested contents
1) Context  
2) Decision  
3) Consequences  
4) Alternatives  
5) Rollout/Migration  
6) Security/Privacy  
7) Open questions  
8) Links

## Helpers
Create a new ADR from the template with today’s date:
```bash
DATE=$(date +%Y%m%d)
TITLE="short-title-here"
cp docs/adr/ADR-template.md "docs/adr/ADR-${DATE}-${TITLE}.md"
git add "docs/adr/ADR-${DATE}-${TITLE}.md"
```
