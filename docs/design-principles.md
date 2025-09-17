# RC Race Engineer — Design Principles

This is the architectural north star. All code and PRs (human or agent) must align with these principles.

## 0) System shape
- **Layers**: `domain/` (pure logic, types) → `app/` (use-cases/orchestration) → `infra/` (IO: DB/HTTP/FS). `web/` (Next.js) consumes `app` only.
- **Rule of arrows**: imports only point **upward**. `domain` depends on nothing.
- **Docs**: decisions go to `docs/adr/`; contracts live in `docs/api/`.

### Layering exceptions (narrow)
To keep velocity without breaking the architecture, a few tightly-scoped exceptions are allowed:
1) **Server-only utilities** in `web/` may call a **thin infra adapter** (e.g., feature flags, build/version, CDN asset manifest) **from server components or server actions only**. No client components may import `infra/`.
2) **Third-party HTTP calls** (e.g., analytics, auth provider) can be made from `web/` **server runtime** via an exported adapter in `infra/public`. Prefer going through `app/` when the call affects core logic or data.
3) **Realtime transport**: `web/` may attach to a realtime layer (WebSocket/SSE) whose **message schema** is owned by `domain/`. DB access still goes through `app/`.

**Guardrails**: never import Prisma/DB clients in `web/`; no infra imports in client components; keep exceptions minimal and documented in the PR.

## 1) Contracts first
- Public endpoints & server actions are specified before code (brief tables or OpenAPI snippet).
- Breaking changes require a new **version** and an ADR.
- Validate at boundaries (e.g., Zod). Internals assume validated types.

## 2) Pure core
- Domain logic is pure & mostly synchronous. Side-effects are isolated in adapters.
- Prefer plain data + functions over heavy classes.

## 3) Use-cases
- Each user/system goal is a single **use-case** function in `app/`.
- Use-cases orchestrate calls through **ports** (interfaces) implemented in `infra/`.

## 4) Errors & logging
- Throw typed errors or return a `Result` type; don’t throw generic `Error` from deep inside.
- Log **once at the boundary** (request/response) with correlation id, never within domain functions.

## 5) Data & migrations
- Prisma migrations are the source of truth. No manual DB edits.
- Each migration is reversible or an ADR explains why not.
- Avoid N+1: prefer explicit `select/include` and targeted indexes.

## 6) Performance budgets
**API**
- Read endpoints (warm cache/typical payload): **p95 < 200ms**, **p99 < 500ms**.
- Heavy/analytics endpoints (paginated/streamed): **p95 < 600ms**, **p99 < 1.2s**; must paginate or stream partials.
- Internal service-to-service calls: **p95 < 150ms**.
- DB queries: **p95 < 50ms**, **0 N+1** accepted in reviews.

**Web**
- Server-rendered TTFB **< 200ms**; **TTI < 1.8s** on mid hardware.
- Core Web Vitals: **LCP < 2.0s**, **CLS < 0.1**, **INP p75 < 100ms (p95 < 200ms)**.
- Interactions feel instant: async work shows skeletons; avoid spinners.

**Measurement**
- Capture p50/p95/p99 durations per endpoint and DB op; surface in `/ready` diagnostics.
- PRs likely to affect budgets must include before/after notes.

## 7) Security & secrets
- No secrets in code/history; use env vars and a secrets store.
- Least privilege for DB/API keys; scrub PII in logs.

## 8) Observability
- Standard fields: timestamp, level, message, correlationId, userId? (if applicable).
- Emit req duration/error counts and key DB metrics.
- Health/ready/version endpoints are truthful: ready = deps OK; health = process OK; version = git sha/tag.

## 9) Naming & structure
- Names describe intent (nouns for models, verbs for actions). One file = one concern.
- No “misc” dumping grounds; split by domain concept.

## 10) Testing
- **Unit** for domain (fast, isolated, no IO).
- **Integration** for infra boundaries (DB/API/FS).
- **Contract** tests for public endpoints.
- Each bug fix adds a failing test first.

## 11) Accessibility & UX
- Keyboard access, semantic HTML, WCAG AA contrast.
- Units explicit and consistent (metric default unless configured).

## 12) PR discipline
- Small, focused diffs; split if >300 changed lines.
- Conventional commits; PRs include summary, changes, tests, risks/rollback, and referenced principles.

## 13) Visual grammar & tokens
**Semantics → visuals (consistent across the app)**
- **Speed**: blue line
- **Throttle**: green area/line
- **Brake**: red area/line
- **RPM**: purple line
- **Gear**: amber step-line
- **Temperatures (tyre/brake/ambient/track)**: orange family (distinct shades)
- **Flags/Events**: annotated markers with shapes + labels (not color-only)

**Design tokens (light/dark)**
- Colors: `--color-speed`, `--color-throttle`, `--color-brake`, `--color-rpm`, `--color-gear`, `--color-temp-tyre`, `--color-temp-brake`, `--color-ambient`, `--color-track`.
- Typography scale: `--font-size-xs/sm/md/lg/xl/2xl`.
- Spacing: `--space-1..8`.
- Radii: `--radius-sm/md/lg/2xl`.

**Rules**
- Never rely on color alone; pair with shape/label.
- Units are explicit; metric by default.
- Same signal, same token, everywhere.
