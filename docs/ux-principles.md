# The RC Racing Engineer — UX Principles

## 1) Glanceable under pressure
- Large, high-contrast summaries with drill-down. Critical info must be readable from 1–2m distance.

## 2) Consistency over cleverness
- One visual grammar: same signal → same color/shape across the app.
- Units explicit (metric default) and consistent everywhere.

## 3) Time is the spine
- Shared zoom/pan & synchronized cursors across charts.
- Selecting lap/stint highlights across tables, charts, and map.

## 4) Perceived performance
- Skeletons over spinners; optimistic UI only for safe local edits.
- Cache recent sessions and prefetch likely next views.

## 5) Errors guide recovery
- Errors state what failed, why, and how to fix; always offer a retry.
- Errors don’t trap navigation.

## 6) Accessibility
- Keyboard navigable, visible focus states, WCAG AA contrast.
- Never rely on color—pair with shape/label.

## 7) Visualization
- Prefer line/area charts; avoid 3D. Provide raw vs smoothed toggles.
- Respect downsampling; show reference bands (e.g., target temps).

## 8) Information architecture
- Left nav: Sessions, Cars, Drivers, Tracks.
- Status bar: health/ready/version + active session indicator.
- Secondary panels: Annotations/alerts, Setups, Environment.

## 9) Content & microcopy
- Plain language; jargon needs a tooltip.
- Consistent verbs; confirmations are brief and undoable where possible.

## 10) Theming & motion
- Light/dark modes with shared tokens (spacing, radii, typography).
- Subtle motion only; respect reduced-motion settings.
