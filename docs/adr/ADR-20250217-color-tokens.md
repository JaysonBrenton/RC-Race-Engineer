# ADR — Canonical telemetry color tokens

**Status:** Accepted  
**Owners:** @JaysonBrenton  
**Created:** 2025-02-17

## Context
`docs/design-principles.md` and `docs/ux-principles.md` mandate a consistent visual grammar (speed=blue, throttle=green, brake=red,
etc.), but the web layer previously relied on ad-hoc Tailwind colors. As we introduce the telemetry timeline we need guaranteed
mappings so charts, metrics, and future dashboards speak the same language across light/dark modes.

## Decision
Define explicit CSS custom properties in `globals.css` (`--color-speed`, `--color-throttle`, `--color-brake`, `--color-rpm`,
`--color-gear`, `--color-temp-tyre`, `--color-temp-brake`, `--color-ambient`, `--color-track`) and expose convenience utility
classes (`bg-speed`, `text-speed`, etc.). Components now reference these tokens instead of raw hex codes, ensuring the palette is
single-sourced and aligns with design documentation.

## Consequences
- Positive: Visual consistency across charts, badges, and metrics without duplicating hex values.
- Positive: Future theming (e.g., brand overlays) can tweak the root variables without touching components.
- Risk: Using custom utility classes alongside Tailwind requires maintenance; mitigated by keeping the definitions centralised
  in `globals.css` and documenting the approach.

## Alternatives considered
- **Extending Tailwind config** with custom colors: viable, but the repo currently leans on inline utilities and the new CSS
  variables avoid additional build configuration.
- **Component-scoped styles** per chart: rejected because other surfaces (e.g., metrics cards) need the same palette.

## Rollout / Migration
- Add token definitions and utility classes to `globals.css` with dark-mode overrides where necessary.
- Refactor UI components to use the new classes (`SessionList`, telemetry timeline legend, metrics panel, demo injector button).
- Update documentation to state that the design token contract is now enforced in code.

## Links
- [Design principles](../design-principles.md)
- [UX principles](../ux-principles.md)
- [Telemetry timeline implementation](../../web/src/app/_components/TelemetryTimeline.tsx)
