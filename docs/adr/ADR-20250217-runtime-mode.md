# ADR — Development runtime mode and authentication

**Status:** Accepted  
**Owners:** @JaysonBrenton  
**Created:** 2025-02-17

## Context
Until now the control tower prototype exposed all routes without authentication. As we begin streaming live telemetry and demo
events, even in development, we need a lightweight guardrail so demo environments are not indexed or accidentally mutated by
unauthorised actors. Full identity and role management remain roadmap items, but the foundation release must still protect API
and UI entry points while keeping the workflow frictionless for the crew.

## Decision
Introduce a development-only runtime mode that relies on a shared passphrase. Engineers obtain access via `/login`, which sets a
short-lived `rc-dev-auth` cookie. API clients may instead present a bearer token defined by `DEV_API_TOKEN`. A Next.js middleware
enforces the presence of either credential for all application and API routes, exempting diagnostics endpoints (`/api/health`,
`/api/ready`, `/api/version`). The mechanism is deliberately simple and documented in `README.md` so crews can rotate secrets
without code changes.

## Consequences
- Positive: Protects demo environments from casual discovery while enabling quick onboarding (single shared secret).
- Positive: Middleware centralises enforcement, keeping handlers focused on business logic and aligning with the layering rules
  in `docs/design-principles.md`.
- Trade-off: Shared secrets do not provide individual accountability; full auth remains a milestone before production hosting.
- Risk: Forgetting to rotate the passphrase after sharing could leak access. Mitigated by documentation and the low effort to
  update the environment variable.

## Alternatives considered
- **Full identity provider integration** (e.g., Auth0, Clerk): overkill for the foundation milestone and would slow telemetry
  work.
- **No authentication**: rejected because telemetry ingestion could be spammed and the UI indexed by crawlers.
- **HTTP Basic Auth via reverse proxy**: viable but pushes responsibility to infrastructure teams; embedding in the app keeps the
  repository self-contained for local demos.

## Rollout / Migration
- Add middleware, login page, and server actions in the web app.
- Document required environment variables (`DEV_AUTH_PASSWORD`, optional `DEV_API_TOKEN`).
- Update onboarding docs to reflect the login flow.

## Security & Privacy
Secrets remain outside source control. Cookies are HTTP-only, `SameSite=Lax`, and marked `Secure` in production. Because the
mode is explicitly for development, we accept shared access with the understanding that true production readiness will require a
proper auth subsystem.

## Links
- [Design principles](../design-principles.md)
- [UX principles](../ux-principles.md)
- [Domain model](../domain-model.md)
