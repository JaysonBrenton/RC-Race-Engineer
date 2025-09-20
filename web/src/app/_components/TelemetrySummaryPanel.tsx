/**
 * File: web/src/app/_components/TelemetrySummaryPanel.tsx
 * Purpose: Presents aggregate telemetry metrics alongside the timeline so the
 *          crew can confirm ingest quality at a glance.
 * Notable behaviours: Displays summary counts/averages from
 *                    `summariseTelemetry`, swaps to an empty state when no
 *                    samples exist, and reuses semantic accent styling per
 *                    metric.
 */

import type { TelemetrySummary } from "@/core/app/telemetry/summariseTelemetry";

export function TelemetrySummaryPanel({ summary }: { summary: TelemetrySummary }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <header className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold">Telemetry snapshot</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Lightweight aggregates refresh with every ingest so the crew can sanity-check the feed before diving deeper into lap and
          stint analytics.
        </p>
      </header>
      {summary.sampleCount === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-950/40 dark:text-neutral-400">
          No telemetry samples recorded yet. Use the demo injector or wire your pipeline to POST telemetry events for this session.
        </p>
      ) : (
        <dl className="grid gap-4 md:grid-cols-3">
          <Metric label="Samples" value={summary.sampleCount.toLocaleString()} accent="text-speed" />
          <Metric
            label="Window"
            value={summary.windowSeconds > 0 ? `${summary.windowSeconds}s` : "<1s"}
            accent="text-neutral-500"
          />
          <Metric
            label="Average speed"
            value={summary.averageSpeedKph != null ? `${summary.averageSpeedKph} km/h` : "—"}
            accent="text-speed"
          />
          <Metric
            label="Peak speed"
            value={summary.maxSpeedKph != null ? `${summary.maxSpeedKph} km/h` : "—"}
            accent="text-speed"
          />
          <Metric
            label="Average throttle"
            value={summary.averageThrottlePct != null ? `${summary.averageThrottlePct}%` : "—"}
            accent="text-throttle"
          />
          <Metric
            label="Brake peak"
            value={summary.maxBrakePct != null ? `${summary.maxBrakePct}%` : "—"}
            accent="text-brake"
          />
          <Metric
            label="Average brake"
            value={summary.averageBrakePct != null ? `${summary.averageBrakePct}%` : "—"}
            accent="text-brake"
          />
          <Metric label="Max RPM" value={summary.maxRpm != null ? summary.maxRpm.toLocaleString() : "—"} accent="text-rpm" />
          <Metric label="Top gear" value={summary.topGear != null ? summary.topGear : "—"} accent="text-gear" />
        </dl>
      )}
    </section>
  );
}

function Metric({ label, value, accent }: { label: string; value: React.ReactNode; accent: string }) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/40">
      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-500">{label}</dt>
      <dd className={`mt-2 text-xl font-semibold ${accent}`}>{value}</dd>
    </div>
  );
}
