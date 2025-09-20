/**
 * File: web/src/core/app/liverc/listHeatResults.test.ts
 * Purpose: Validates the LiveRC heat results use-case so we guarantee
 *          dependency wiring and error conditions behave deterministically.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { LiveRcHeatResult } from "@/core/domain/liverc";
import { listHeatResults } from "./listHeatResults";

test("listHeatResults delegates to repository", async () => {
  const sample: LiveRcHeatResult = {
    id: "result-1",
    heatId: "heat-1",
    entryId: "entry-1",
    driverName: "Driver One",
    carNumber: "1",
    sponsor: null,
    vehicle: null,
    hometownCity: null,
    hometownRegion: null,
    finishPosition: 1,
    lapsCompleted: 12,
    totalTimeMs: 315420,
    fastLapMs: 25870,
    intervalMs: 0,
    status: "finished",
  };

  const results = await listHeatResults("heat-1", {
    repository: {
      listHeatResults: async (heatId) => {
        assert.equal(heatId, "heat-1");
        return [sample];
      },
    },
  });

  assert.deepEqual(results, [sample]);
});

test("listHeatResults throws when repository missing", async () => {
  await assert.rejects(() => listHeatResults("heat-1", { repository: null }), {
    message: "LiveRC repository dependency missing",
  });
});

test("listHeatResults requires heat id", async () => {
  await assert.rejects(() => listHeatResults(""), {
    message: "heatId is required to list LiveRC results",
  });
});
