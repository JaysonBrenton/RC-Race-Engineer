/**
 * File: web/src/core/infra/liverc/prismaLiveRcRepository.test.ts
 * Purpose: Ensures Prisma LiveRC repository mapping preserves key fields used
 *          by downstream visualisations.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { Prisma } from "@prisma/client";
import { mapResult } from "./prismaLiveRcRepository";

test("mapResult projects entry metadata into domain shape", () => {
  const now = new Date();
  const result: Prisma.LiveRcResult & { entry: Prisma.LiveRcEntry | null } = {
    id: "result-1",
    heatId: "heat-1",
    entryId: "entry-1",
    externalResultId: 1,
    finishPosition: 2,
    lapsCompleted: 12,
    totalTimeMs: 316100,
    fastLapMs: 26012,
    intervalMs: 680,
    status: "finished",
    createdAt: now,
    updatedAt: now,
    entry: {
      id: "entry-1",
      classId: "class-1",
      externalEntryId: 558633,
      driverName: "Driver Two",
      carNumber: "2",
      transponder: null,
      vehicle: "Associated B7",
      sponsor: "Team Associated",
      hometownCity: "Mesa",
      hometownRegion: "AZ",
      createdAt: now,
      updatedAt: now,
    },
  };

  const mapped = mapResult(result);

  assert.equal(mapped.driverName, "Driver Two");
  assert.equal(mapped.vehicle, "Associated B7");
  assert.equal(mapped.fastLapMs, 26012);
  assert.equal(mapped.finishPosition, 2);
});

test("mapResult tolerates missing entry relation", () => {
  const now = new Date();
  const result: Prisma.LiveRcResult & { entry: null } = {
    id: "result-2",
    heatId: "heat-1",
    entryId: "entry-unknown",
    externalResultId: 2,
    finishPosition: null,
    lapsCompleted: null,
    totalTimeMs: null,
    fastLapMs: null,
    intervalMs: null,
    status: null,
    createdAt: now,
    updatedAt: now,
    entry: null,
  };

  const mapped = mapResult(result);

  assert.equal(mapped.driverName, "Unknown driver");
  assert.equal(mapped.fastLapMs, null);
});
