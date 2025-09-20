import assert from "node:assert/strict";
import test from "node:test";

import { shouldLoadTelemetry } from "@/app/telemetryLoadingGuard";

test("should load telemetry when falling back to the first available session", () => {
  const result = shouldLoadTelemetry({
    selectedSessionId: "session-1",
    normalizedSessionId: null,
    sessionMatchingNormalized: null,
  });

  assert.equal(result, true);
});

test("should load telemetry when the normalized session matches an existing session", () => {
  const result = shouldLoadTelemetry({
    selectedSessionId: "session-1",
    normalizedSessionId: "session-1",
    sessionMatchingNormalized: { id: "session-1" },
  });

  assert.equal(result, true);
});

test("should block telemetry when the normalized session is invalid", () => {
  const result = shouldLoadTelemetry({
    selectedSessionId: "session-1",
    normalizedSessionId: "session-missing",
    sessionMatchingNormalized: null,
  });

  assert.equal(result, false);
});
