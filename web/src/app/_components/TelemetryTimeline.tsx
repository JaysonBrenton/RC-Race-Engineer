"use client";

import { useMemo } from "react";

import type { TelemetrySample } from "@/core/domain/telemetry";

interface TelemetryTimelineProps {
  samples: TelemetrySample[];
}

export function TelemetryTimeline({ samples }: TelemetryTimelineProps) {
  const chart = useMemo(() => buildChartData(samples), [samples]);

  if (!chart) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
        Telemetry will appear here once samples are ingested for the selected session.
      </div>
    );
  }

  const { width, height, padding, speedPath, throttlePath, brakePath, gridLines, xLabels, yLabels } = chart;

  return (
    <figure className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <figcaption className="mb-3 flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
        <span>Session timeline (speed, throttle, brake)</span>
        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-500">
          <LegendSwatch className="bg-speed" label="Speed" />
          <LegendSwatch className="bg-throttle" label="Throttle" />
          <LegendSwatch className="bg-brake" label="Brake" />
        </div>
      </figcaption>
      <svg
        role="img"
        aria-label="Telemetry chart showing speed, throttle, and brake traces over time"
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
      >
        <rect x={0} y={0} width={width} height={height} fill="var(--surface-elevated)" rx={12} />
        {gridLines.map((line) => (
          <line
            key={`grid-${line}`}
            x1={padding}
            y1={line}
            x2={width - padding}
            y2={line}
            stroke="var(--grid-stroke)"
            strokeWidth={1}
          />
        ))}
        <path d={speedPath} fill="none" stroke="var(--color-speed)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <path
          d={throttlePath}
          fill="none"
          stroke="var(--color-throttle)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
        />
        <path d={brakePath} fill="var(--color-brake-fill)" stroke="var(--color-brake)" strokeWidth={1.5} opacity={0.85} />
        {xLabels.map((label) => (
          <text
            key={`x-${label.x}`}
            x={label.x}
            y={height - padding + 18}
            textAnchor="middle"
            className="fill-current text-[10px] text-neutral-500 dark:text-neutral-500"
          >
            {label.value}
          </text>
        ))}
        {yLabels.map((label) => (
          <text
            key={`y-${label.y}`}
            x={padding - 6}
            y={label.y + 3}
            textAnchor="end"
            className="fill-current text-[10px] text-neutral-500 dark:text-neutral-500"
          >
            {label.value}
          </text>
        ))}
      </svg>
    </figure>
  );
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${className}`} aria-hidden />
      <span>{label}</span>
    </span>
  );
}

function buildChartData(samples: TelemetrySample[]) {
  if (samples.length === 0) {
    return null;
  }

  const width = 960;
  const height = 320;
  const padding = 48;

  const timestamps = samples.map((sample) => new Date(sample.recordedAt).getTime());
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const timeSpan = Math.max(1, maxTime - minTime);

  const maxSpeed = Math.max(200, ...samples.map((sample) => sample.speedKph ?? 0));

  const scaleX = (time: number) => padding + ((time - minTime) / timeSpan) * (width - padding * 2);
  const scaleSpeed = (speed: number) => height - padding - (speed / maxSpeed) * (height - padding * 2);
  const scalePercent = (value: number) => height - padding - (value / 100) * (height - padding * 2);

  const speedPoints = samples
    .filter((sample) => sample.speedKph != null)
    .map((sample) => ({ x: scaleX(new Date(sample.recordedAt).getTime()), y: scaleSpeed(sample.speedKph ?? 0) }));

  const throttlePoints = samples
    .filter((sample) => sample.throttlePct != null)
    .map((sample) => ({ x: scaleX(new Date(sample.recordedAt).getTime()), y: scalePercent(sample.throttlePct ?? 0) }));

  const brakePoints = samples.map((sample) => ({
    x: scaleX(new Date(sample.recordedAt).getTime()),
    y: sample.brakePct != null ? scalePercent(sample.brakePct) : height - padding,
  }));

  const speedPath = buildPath(speedPoints);
  const throttlePath = buildPath(throttlePoints);
  const brakePath = buildAreaPath(brakePoints, height - padding);

  const gridLines = [0.25, 0.5, 0.75].map((ratio) => padding + ratio * (height - padding * 2));

  const labelCount = 4;
  const xLabels = Array.from({ length: labelCount }, (_, index) => {
    const ratio = index / (labelCount - 1);
    const timestamp = new Date(minTime + ratio * timeSpan);
    const label = timestamp.toISOString().split("T")[1]?.slice(0, 8) ?? "";
    return { x: padding + ratio * (width - padding * 2), value: label };
  });

  const yLabels = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    y: padding + (1 - ratio) * (height - padding * 2),
    value: `${Math.round(ratio * maxSpeed)} km/h`,
  }));

  return { width, height, padding, speedPath, throttlePath, brakePath, gridLines, xLabels, yLabels };
}

function buildPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) {
    return "";
  }
  return points.reduce((acc, point, index) => {
    return `${acc}${index === 0 ? "M" : "L"}${point.x},${point.y}`;
  }, "");
}

function buildAreaPath(points: { x: number; y: number }[], baseline: number): string {
  if (points.length === 0) {
    return "";
  }
  const line = points.reduce((acc, point, index) => {
    return `${acc}${index === 0 ? "M" : "L"}${point.x},${point.y}`;
  }, "");
  const closing = points
    .slice()
    .reverse()
    .reduce((acc, point, index) => {
      if (index === 0) {
        return `${acc}L${point.x},${baseline}`;
      }
      return `${acc}L${point.x},${baseline}`;
    }, "");
  return `${line}${closing}Z`;
}
