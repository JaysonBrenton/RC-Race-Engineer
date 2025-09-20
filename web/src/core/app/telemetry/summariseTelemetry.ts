/**
 * File: web/src/core/app/telemetry/summariseTelemetry.ts
 * Purpose: Produces lightweight aggregate metrics for telemetry visualisations
 *          and dashboards.
 */

import type { TelemetrySample } from "@/core/domain/telemetry";
import type { TelemetryDependencies } from "./ports";
import { getTelemetryRepository } from "./serviceLocator";

export interface TelemetrySummary {
  sampleCount: number;
  firstSampleAt: string | null;
  lastSampleAt: string | null;
  windowSeconds: number;
  averageSpeedKph: number | null;
  maxSpeedKph: number | null;
  averageThrottlePct: number | null;
  averageBrakePct: number | null;
  maxBrakePct: number | null;
  maxRpm: number | null;
  topGear: number | null;
}

export async function summariseTelemetry(
  sessionId: string,
  deps?: Partial<TelemetryDependencies>,
): Promise<TelemetrySummary> {
  const { repository } = deps ?? { repository: getTelemetryRepository() };
  if (!repository) {
    throw new Error("Telemetry repository dependency missing");
  }

  const samples = await repository.listForSession(sessionId, { order: "asc" });
  return computeSummary(samples);
}

export function computeSummary(samples: TelemetrySample[]): TelemetrySummary {
  if (samples.length === 0) {
    return {
      sampleCount: 0,
      firstSampleAt: null,
      lastSampleAt: null,
      windowSeconds: 0,
      averageSpeedKph: null,
      maxSpeedKph: null,
      averageThrottlePct: null,
      averageBrakePct: null,
      maxBrakePct: null,
      maxRpm: null,
      topGear: null,
    };
  }

  let speedSum = 0;
  let speedCount = 0;
  let maxSpeed: number | null = null;
  let throttleSum = 0;
  let throttleCount = 0;
  let brakeSum = 0;
  let brakeCount = 0;
  let maxBrake: number | null = null;
  let maxRpm: number | null = null;
  let topGear: number | null = null;

  for (const sample of samples) {
    if (sample.speedKph != null) {
      speedSum += sample.speedKph;
      speedCount += 1;
      maxSpeed = maxSpeed == null ? sample.speedKph : Math.max(maxSpeed, sample.speedKph);
    }
    if (sample.throttlePct != null) {
      throttleSum += sample.throttlePct;
      throttleCount += 1;
    }
    if (sample.brakePct != null) {
      brakeSum += sample.brakePct;
      brakeCount += 1;
      maxBrake = maxBrake == null ? sample.brakePct : Math.max(maxBrake, sample.brakePct);
    }
    if (sample.rpm != null) {
      maxRpm = maxRpm == null ? sample.rpm : Math.max(maxRpm, sample.rpm);
    }
    if (sample.gear != null) {
      topGear = topGear == null ? sample.gear : Math.max(topGear, sample.gear);
    }
  }

  const firstSampleAt = samples[0]?.recordedAt ?? null;
  const lastSampleAt = samples[samples.length - 1]?.recordedAt ?? null;
  const windowSeconds = firstSampleAt && lastSampleAt ? calculateWindowSeconds(firstSampleAt, lastSampleAt) : 0;

  return {
    sampleCount: samples.length,
    firstSampleAt,
    lastSampleAt,
    windowSeconds,
    averageSpeedKph: speedCount > 0 ? roundNumber(speedSum / speedCount, 1) : null,
    maxSpeedKph: maxSpeed != null ? roundNumber(maxSpeed, 1) : null,
    averageThrottlePct: throttleCount > 0 ? roundNumber(throttleSum / throttleCount, 1) : null,
    averageBrakePct: brakeCount > 0 ? roundNumber(brakeSum / brakeCount, 1) : null,
    maxBrakePct: maxBrake != null ? roundNumber(maxBrake, 1) : null,
    maxRpm: maxRpm != null ? Math.round(maxRpm) : null,
    topGear: topGear != null ? Math.round(topGear) : null,
  };
}

function calculateWindowSeconds(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return 0;
  }
  return Math.max(0, Math.round((end - start) / 1000));
}

function roundNumber(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
