# RCRE Roadmap

_Principles: ship small, keep main green, document decisions with ADRs._

## Now – 0.1 Foundation
- [x] Next.js app scaffold under `web/`
- [x] Dev service via systemd on port 3001; firewall/SELinux opened
- [x] Repo guardrails docs (AGENTS, design/UX/model)
- [x] API heartbeat: /api/health, /api/ready, /api/version
- [x] Data foundation: Postgres + Prisma (Sessions, Telemetry)
- [x] Endpoints: POST /api/sessions, POST /api/sessions/[id]/events, GET lists *(contracts tracked in [docs/api/sessions.md](./api/sessions.md); retention bounded per [ADR-20250217-telemetry-retention](./adr/ADR-20250217-telemetry-retention.md))*
- [x] Minimal UI: create/list sessions, demo telemetry injector, timeline *(landing view wires the session form, list, metrics, and injector in `web/src/app/page.tsx`; see [Telemetry workflow](../README.md#telemetry-workflow-foundation-release))*
- [x] First ADRs: runtime mode; telemetry store/retention; color tokens plan *(see [ADR-20250217-runtime-mode](./adr/ADR-20250217-runtime-mode.md), [ADR-20250217-telemetry-retention](./adr/ADR-20250217-telemetry-retention.md), [ADR-20250217-color-tokens](./adr/ADR-20250217-color-tokens.md))*

**Residual 0.1 wrap-up:** cut the first tagged build, update [docs/build-log.md](./build-log.md) with the release artefact details, and run a final ingest/UI smoke test pass before calling the milestone complete.

## 0.2 MVP
- [ ] Basic auth (dev)
- [ ] Session timeline view with latest telemetry
- [ ] Simple metrics dashboard (throughput, p50/p95, error rate)
- [ ] Error handling & toasts per UX principles

## 0.3 Connectors & Ingest
- [ ] Define connector interface (ingest API + buffer)
- [ ] First connector spike (mock/hardware TBD)
- [ ] Background jobs (batch ingest, compaction)

## 0.4 UX polish & IA
- [ ] Visual grammar using semantic color tokens
- [ ] Navigation IA, empty states, loading skeletons

## 0.5 Production hardening
- [ ] CI/CD, image build, env config
- [ ] Observability with 7d raw / 90d aggregates
- [ ] Backups / restore runbooks

### Working mode
Main-only by default; short-lived feature branches when isolation helps.
