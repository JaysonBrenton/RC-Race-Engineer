/**
 * File: web/src/core/infra/liverc/prismaLiveRcRepository.ts
 * Purpose: Prisma-backed LiveRC repository that projects database models into
 *          the domain read model used by application code and the UI.
 */

import type { Prisma } from "@prisma/client";

import type { LiveRcHeatResult } from "@/core/domain/liverc";
import type { LiveRcRepository } from "@/core/app/liverc/ports";
import { registerLiveRcRepository } from "@/core/app/liverc/serviceLocator";
import { getPrismaClient } from "@/core/infra/db/prismaClient";

const repository: LiveRcRepository = {
  async listHeatResults(heatId) {
    const prisma = getPrismaClient();
    const results = await prisma.liveRcResult.findMany({
      where: { heatId },
      include: LIVE_RC_RESULT_INCLUDE,
      orderBy: [
        { finishPosition: "asc" },
        { fastLapMs: "asc" },
        { totalTimeMs: "asc" },
      ],
    });

    return results.map(mapResult);
  },
};

registerLiveRcRepository(repository);

export { repository as prismaLiveRcRepository };

const LIVE_RC_RESULT_INCLUDE = {
  entry: true,
} satisfies Prisma.LiveRcResultInclude;

function mapResult(model: Prisma.LiveRcResult & { entry?: Prisma.LiveRcEntry | null }): LiveRcHeatResult {
  const entry = model.entry ?? null;

  return {
    id: model.id,
    heatId: model.heatId,
    entryId: model.entryId,
    driverName: entry?.driverName ?? "Unknown driver",
    carNumber: entry?.carNumber ?? null,
    sponsor: entry?.sponsor ?? null,
    vehicle: entry?.vehicle ?? null,
    hometownCity: entry?.hometownCity ?? null,
    hometownRegion: entry?.hometownRegion ?? null,
    finishPosition: model.finishPosition ?? null,
    lapsCompleted: model.lapsCompleted ?? null,
    totalTimeMs: model.totalTimeMs ?? null,
    fastLapMs: model.fastLapMs ?? null,
    intervalMs: model.intervalMs ?? null,
    status: model.status ?? null,
  } satisfies LiveRcHeatResult;
}

export { mapResult };
