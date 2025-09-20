import assert from "node:assert/strict";
import test from "node:test";

import { InvalidTelemetryInputError, validateTelemetryEvent } from "./telemetry";

test("validateTelemetryEvent normalises ISO timestamps", () => {
  const result = validateTelemetryEvent({
    recordedAt: "2024-01-01T12:30:00Z",
    speedKph: 120,
  });

  assert.equal(result.recordedAt, "2024-01-01T12:30:00.000Z");
  assert.equal(result.speedKph, 120);
});

test("validateTelemetryEvent rejects out-of-range throttle", () => {
  assert.throws(
    () => validateTelemetryEvent({ recordedAt: "2024-01-01T12:30:00Z", throttlePct: 120 }),
    (error: unknown) =>
      error instanceof InvalidTelemetryInputError &&
      error.issues.includes("throttlePct must be between 0 and 100"),
  );
});
