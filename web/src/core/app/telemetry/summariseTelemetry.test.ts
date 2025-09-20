import assert from "node:assert/strict";
import test from "node:test";

import { computeSummary } from "./summariseTelemetry";

const baseSample = {
  id: "sample",
  sessionId: "session",
  recordedAt: new Date("2024-01-01T10:00:00Z").toISOString(),
  createdAt: new Date("2024-01-01T10:00:01Z").toISOString(),
  speedKph: null,
  throttlePct: null,
  brakePct: null,
  rpm: null,
  gear: null,
};

test("computeSummary returns zeroed metrics for empty array", () => {
  assert.deepEqual(computeSummary([]), {
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
  });
});

test("computeSummary aggregates available metrics", () => {
  const summary = computeSummary([
    { ...baseSample, id: "a", recordedAt: "2024-01-01T10:00:00Z", speedKph: 100, throttlePct: 20, brakePct: 0, rpm: 10000, gear: 3 },
    { ...baseSample, id: "b", recordedAt: "2024-01-01T10:00:01Z", speedKph: 120, throttlePct: 60, brakePct: 10, rpm: 12000, gear: 4 },
    { ...baseSample, id: "c", recordedAt: "2024-01-01T10:00:02Z", speedKph: null, throttlePct: null, brakePct: 80, rpm: null, gear: 5 },
  ]);

  assert.equal(summary.sampleCount, 3);
  assert.equal(summary.firstSampleAt, "2024-01-01T10:00:00Z");
  assert.equal(summary.lastSampleAt, "2024-01-01T10:00:02Z");
  assert.equal(summary.windowSeconds, 2);
  assert.equal(summary.averageSpeedKph, 110);
  assert.equal(summary.maxSpeedKph, 120);
  assert.equal(summary.averageThrottlePct, 40);
  assert.equal(summary.averageBrakePct, 30);
  assert.equal(summary.maxBrakePct, 80);
  assert.equal(summary.maxRpm, 12000);
  assert.equal(summary.topGear, 5);
});
