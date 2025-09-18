# RCRE Roadmap

_Principles: ship small, keep main green, document decisions with ADRs._

## Now – 0.1 Foundation
- [x] Next.js app scaffold under `web/`
- [x] Dev service via systemd on port 3001; firewall/SELinux opened
- [x] Repo guardrails docs (AGENTS, design/UX/model)
- [x] API heartbeat: /api/health, /api/ready, /api/version
- [x] Data foundation: Postgres + Prisma (Sessions, Telemetry)
- [ ] Endpoints: POST /api/sessions, POST /api/sessions/[id]/events, GET lists
- [ ] Minimal UI: create/list sessions, post demo event *(create/list done; demo event pending)*
- [ ] First ADRs: runtime mode; telemetry store/retention; color tokens plan

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
