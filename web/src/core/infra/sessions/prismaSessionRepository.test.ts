/**
 * File: web/src/core/infra/sessions/prismaSessionRepository.test.ts
 * Purpose: Validates the mapping logic inside the Prisma session repository to
 *          ensure LiveRC relationships are translated into the domain shape as
 *          expected.
 */

import "../../../../test/setupAlias";
import assert from "node:assert/strict";
import test from "node:test";

import type { Prisma } from "@prisma/client";
import { mapSession } from "./prismaSessionRepository";

test("mapSession returns LiveRC metadata when heat relation present", () => {
  const now = new Date();
  const session: Prisma.Session = {
    id: "session-1",
    name: "Qualifier",
    description: null,
    kind: "QUALIFYING",
    status: "SCHEDULED",
    scheduledStart: now,
    scheduledEnd: null,
    actualStart: null,
    actualEnd: null,
    timingProvider: "LIVE_RC",
    liveRcHeatId: "heat-1",
    createdAt: now,
    updatedAt: now,
    liveRcHeat: {
      id: "heat-1",
      classId: "class-1",
      externalHeatId: 441250,
      label: "Round 3 Qualifier - Heat 1",
      round: 3,
      attempt: 1,
      scheduledStart: now,
      durationSeconds: 360,
      status: "complete",
      liveStreamUrl: "https://example.com/stream",
      createdAt: now,
      updatedAt: now,
      class: {
        id: "class-1",
        eventId: "event-1",
        externalClassId: 91201,
        name: "2WD Modified Buggy",
        description: null,
        createdAt: now,
        updatedAt: now,
        event: {
          id: "event-1",
          externalEventId: 30952,
          title: "ROAR Nationals",
          trackName: "HobbyTown HobbyPlex",
          facility: "Indoor Off-Road",
          city: "Omaha",
          region: "NE",
          country: "USA",
          timeZone: "America/Chicago",
          startTime: now,
          endTime: now,
          website: "https://example.com",
          createdAt: now,
          updatedAt: now,
        },
      },
    },
  };

  const mapped = mapSession(session);

  assert.equal(mapped.timingProvider, "LIVE_RC");
  assert.ok(mapped.liveRc);
  assert.equal(mapped.liveRc?.heatId, "heat-1");
  assert.equal(mapped.liveRc?.class?.name, "2WD Modified Buggy");
  assert.equal(mapped.liveRc?.event?.title, "ROAR Nationals");
});

test("mapSession omits LiveRC metadata when relation missing", () => {
  const now = new Date();
  const session: Prisma.Session = {
    id: "session-2",
    name: "Practice",
    description: null,
    kind: "PRACTICE",
    status: "SCHEDULED",
    scheduledStart: null,
    scheduledEnd: null,
    actualStart: null,
    actualEnd: null,
    timingProvider: "MANUAL",
    liveRcHeatId: null,
    createdAt: now,
    updatedAt: now,
    liveRcHeat: null,
  };

  const mapped = mapSession(session);

  assert.equal(mapped.timingProvider, "MANUAL");
  assert.equal(mapped.liveRc, null);
});
