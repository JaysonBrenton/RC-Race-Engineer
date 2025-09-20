/**
 * File: web/src/app/_components/LiveRcHeatResultsChart.tsx
 * Purpose: Renders a comparative bar chart for LiveRC fastest laps so crews
 *          can assess pace differentials at a glance.
 */

import { compareLiveRcResults, type LiveRcHeatResult } from "@/core/domain/liverc";

interface LiveRcHeatResultsChartProps {
  results: LiveRcHeatResult[];
}

export function LiveRcHeatResultsChart({ results }: LiveRcHeatResultsChartProps) {
  const withLapTimes = results.filter((result) => typeof result.fastLapMs === "number");

  if (withLapTimes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-950/40 dark:text-neutral-400">
        LiveRC results are linked to this session, but lap times have not been published yet.
      </div>
    );
  }

  const sorted = [...withLapTimes].sort(compareLiveRcResults);

  const fastest = Math.min(...sorted.map((result) => result.fastLapMs ?? Infinity));
  const slowest = Math.max(...sorted.map((result) => result.fastLapMs ?? 0));
  const range = slowest - fastest;

  const chart = computeChartGeometry(sorted.length);
  const ticks = buildTicks(fastest, slowest, chart);

  return (
    <figure className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <figcaption className="mb-4 flex flex-col gap-1">
        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Fastest lap comparison
        </span>
        <span className="text-xs text-neutral-500 dark:text-neutral-500">
          Bar length scales with pace advantage—longer bars indicate a faster recorded lap. Labels show official LiveRC timing
          in seconds and the gap to the session benchmark.
        </span>
      </figcaption>
      <svg
        role="img"
        aria-label="LiveRC fastest lap chart"
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        className="w-full"
      >
        <rect x={0} y={0} width={chart.width} height={chart.height} rx={12} fill="var(--surface-elevated)" />
        {sorted.map((result, index) => {
          const fastLap = result.fastLapMs ?? slowest;
          const y = chart.padding.top + index * (chart.barHeight + chart.barGap);
          const barLength =
            range <= 0
              ? chart.innerWidth
              : Math.max(8, ((slowest - fastLap) / range) * chart.innerWidth);
          const labelX = Math.min(chart.padding.left + barLength + 12, chart.width - chart.padding.right);
          const delta = (fastLap - fastest) / 1000;
          const deltaLabel = delta <= 0.0005 ? "+0.000s" : `+${delta.toFixed(3)}s`;
          const finishLabel = result.finishPosition != null ? `#${result.finishPosition}` : "—";

          return (
            <g key={result.id}>
              <rect
                x={chart.padding.left}
                y={y}
                width={chart.innerWidth}
                height={chart.barHeight}
                rx={4}
                fill="rgba(148,163,184,0.12)"
              />
              <rect
                x={chart.padding.left}
                y={y}
                width={barLength}
                height={chart.barHeight}
                rx={4}
                fill="var(--color-speed)"
              />
              <text
                x={chart.padding.left - 12}
                y={y + chart.barHeight / 2 + 4}
                textAnchor="end"
                className="text-xs font-medium text-neutral-600 dark:text-neutral-400"
              >
                {finishLabel} {result.driverName}
                {result.carNumber ? ` · ${result.carNumber}` : ""}
              </text>
              <text
                x={labelX}
                y={y + chart.barHeight / 2 - 2}
                textAnchor="start"
                className="text-xs font-semibold text-neutral-900 dark:text-neutral-100"
              >
                {formatLapTime(fastLap)}
              </text>
              <text
                x={labelX}
                y={y + chart.barHeight / 2 + 12}
                textAnchor="start"
                className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-500"
              >
                {deltaLabel}
              </text>
            </g>
          );
        })}
        <line
          x1={chart.padding.left}
          y1={chart.height - chart.padding.bottom}
          x2={chart.width - chart.padding.right}
          y2={chart.height - chart.padding.bottom}
          stroke="var(--grid-stroke)"
          strokeWidth={1}
        />
        {ticks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={tick.x}
              y1={chart.height - chart.padding.bottom}
              x2={tick.x}
              y2={chart.height - chart.padding.bottom + 6}
              stroke="var(--grid-stroke)"
              strokeWidth={1}
            />
            <text
              x={tick.x}
              y={chart.height - chart.padding.bottom + 20}
              textAnchor="middle"
              className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-500"
            >
              {tick.label}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

function computeChartGeometry(resultCount: number) {
  const width = 920;
  const padding = { top: 48, right: 64, bottom: 56, left: 220 };
  const barHeight = 22;
  const barGap = 18;
  const contentHeight = Math.max(barHeight, resultCount * (barHeight + barGap) - barGap);
  const height = padding.top + padding.bottom + contentHeight;
  const innerWidth = width - padding.left - padding.right;

  return { width, height, padding, barHeight, barGap, innerWidth };
}

function buildTicks(fastest: number, slowest: number, chart: ReturnType<typeof computeChartGeometry>) {
  if (!Number.isFinite(fastest) || slowest <= 0) {
    return [];
  }
  const steps = 4;
  const ticks = [] as { value: number; label: string; x: number }[];
  for (let index = 0; index < steps; index += 1) {
    const ratio = index / (steps - 1);
    const value = slowest - (slowest - fastest) * ratio;
    ticks.push({
      value,
      label: `${(value / 1000).toFixed(2)}s`,
      x: chart.padding.left + ratio * chart.innerWidth,
    });
  }
  return ticks;
}

function formatLapTime(ms: number) {
  return `${(ms / 1000).toFixed(3)} s`;
}
