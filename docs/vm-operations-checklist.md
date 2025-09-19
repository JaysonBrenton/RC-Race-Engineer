# VM Operations Checklist

Use this checklist whenever new changes land in the repository so the handoff to the VM at `10.211.55.13` stays consistent and auditable.

## 1. Confirm required updates with the author
- [ ] Ask whether any **design or UX guidance** must be reviewed or updated (e.g., `docs/design-principles.md`, `docs/ux-principles.md`).
- [ ] Ask whether there were **database schema changes**. If yes, request:
  - Migration commands you need to run (e.g., `npx prisma migrate deploy`).
  - Any seeding or rollback steps.
  - Related documentation updates.
- [ ] Ask which **automated checks or test suites** were executed before the handoff so you can mirror the critical ones on the VM.
- [ ] Capture any required **environment/package changes** (system packages, Node version, env vars, secrets) that must be applied on the VM.

## 2. Pull the latest code on the VM
```bash
ssh user@10.211.55.13
cd /path/to/RC-Race-Engineer
git fetch origin
git checkout main
git pull --ff-only origin main
```

## 3. Apply environment or dependency updates (if required)
Run only the steps confirmed in section 1. Common examples:
```bash
# Node dependencies
cd web
npm install

# Prisma client refresh (after dependency install)
npx prisma generate
```

## 4. Apply database migrations (only when needed)
```bash
# From the repository root on the VM
cd /home/jayson/Development/RCRaceEngineer
cd web
npx prisma migrate deploy
```
Include any seeding or rollback steps the author provided.

## 5. Run targeted verification
Execute the key checks that mirror what the author ran, plus any you rely on for confidence.
```bash
cd /path/to/RC-Race-Engineer/web
npm run lint
# Add other commands (tests, builds) as requested by the author
```
Document the outcomes for your deployment notes.

## 6. Track follow-ups
- [ ] Log any discrepancies between the author’s instructions and VM results.
- [ ] File tickets for missing migrations, failing checks, or undocumented environment steps.
- [ ] Notify the author if additional guidance is required before release.
