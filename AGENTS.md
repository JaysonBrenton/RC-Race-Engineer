# Agents Rules (Codex)

These rules apply to any AI/code agent working in this repo (e.g., Codex).

## Golden rules
- **Branch**: Use the branch **explicitly named by the human** (e.g., `codex/<task>`). If it doesn’t exist, create **exactly that name**. Do **not** invent alternatives or create duplicates.
- **PRs**: **Solo mode** — direct commits to `main` are allowed. When collaborating, switch to PRs with Squash merge.
- **Small diffs**: Keep PRs small and focused. If >300 lines changed, split into sequential PRs.
- **Checks first**: Run lint/typecheck/build/tests locally. If checks fail, **do not push**—return a diff/patch and the exact errors.
- **Respect `.gitignore`**: Never commit `_evidence/`, `web/.next/`, `node_modules/`, OS/editor files, or large/binary artefacts.
- **No secrets**: Never commit `.env*` or credentials. If found, stop and request rotation.
- **No history rewrites**: Never force-push to `main`. Feature branches only if the human asks.

## Design canon
- **Read before code**: You **must** read and comply with `docs/design-principles.md` and `docs/ux-principles.md`.
- If you need to deviate, add an ADR (`docs/adr/ADR-YYYYMMDD-title.md`) and explain the trade-off.

## Model Change Protocol (agents must follow)
If you modify `prisma/schema.prisma`:
1) Include a Prisma migration.
2) Update `docs/domain-model.md` (entities/relations + ERD snippet + invariants).
3) Update affected API contracts in `docs/api/` (or contract tables in the PR).
4) Add/adjust seed data if needed.
5) Add an ADR if the change is significant, breaking, or cross-cutting.
6) One conceptual change **per PR** (don’t bundle unrelated schema edits).

## Module boundaries
- Layered shape: `domain/` (pure) ← `app/` (use-cases) ← `infra/` (adapters/IO) ← `web/` (Next.js UI). Imports point **up** only.
- `web/` should call `app/` use-cases; it must not import `infra/` directly.
- Narrow exceptions are defined in `docs/design-principles.md` (“Layering exceptions”).

## PR requirements (include in description)
- **Design compliance**: cite relevant sections of `docs/design-principles.md` and `docs/ux-principles.md`.
- **Model compliance**: if schema changed, confirm migration + docs + contracts + (if needed) ADR.
- **Testing**: list commands run and results.
- **Risk & rollback**: expected impact and revert plan (squash revert or follow-up PR).
