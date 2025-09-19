import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidSessionInputError,
  TIMING_PROVIDERS,
  validateCreateSessionInput,
} from "./session";

test("validateCreateSessionInput defaults to MANUAL timing provider", () => {
  const input = validateCreateSessionInput({
    name: "Free practice",
    kind: "FP1",
  });

  assert.equal(input.timingProvider, "MANUAL");
  assert.equal(input.liveRcHeatId, null);
});

test("validateCreateSessionInput requires LiveRC heat when provider is LIVE_RC", () => {
  assert.throws(
    () =>
      validateCreateSessionInput({
        name: "Qualifier",
        kind: "QUALIFYING",
        timingProvider: "LIVE_RC",
      }),
    (error: unknown) =>
      error instanceof InvalidSessionInputError &&
      error.issues.includes("liveRcHeatId is required when timingProvider is LIVE_RC"),
    "Expected validation error when liveRcHeatId missing",
  );
});

test("validateCreateSessionInput accepts LiveRC provider with heat id", () => {
  const input = validateCreateSessionInput({
    name: "Qualifier",
    kind: "QUALIFYING",
    timingProvider: "LIVE_RC",
    liveRcHeatId: "heat-123",
  });

  assert.equal(input.timingProvider, "LIVE_RC");
  assert.equal(input.liveRcHeatId, "heat-123");
});

test("TIMING_PROVIDERS enumeration exposes MANUAL and LIVE_RC", () => {
  assert.deepEqual(TIMING_PROVIDERS, ["MANUAL", "LIVE_RC"]);
});
