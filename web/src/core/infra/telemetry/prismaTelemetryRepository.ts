/**
 * File: web/src/core/infra/telemetry/prismaTelemetryRepository.ts
 * Purpose: Prisma-backed implementation of the telemetry repository contract.
 */

import type { Prisma } from "@prisma/client";

import type { TelemetrySample } from "@/core/domain/telemetry";
import { getPrismaClient } from "@/core/infra/db/prismaClient";
import type { TelemetryRepository } from "@/core/app/telemetry/ports";
import { registerTelemetryRepository } from "@/core/app/telemetry/serviceLocator";

const repository: TelemetryRepository = {
  async createForSession(sessionId, data) {
    const prisma = getPrismaClient();
    const created = await prisma.telemetrySample.create({
      data: {
        sessionId,
        recordedAt: new Date(data.recordedAt),
        speedKph: data.speedKph ?? null,
        throttlePct: data.throttlePct ?? null,
        brakePct: data.brakePct ?? null,
        rpm: data.rpm ?? null,
        gear: data.gear ?? null,
      },
    });

    return mapSample(created);
  },

  async listForSession(sessionId, options) {
    const prisma = getPrismaClient();
    const order = options?.order ?? "asc";
    const limit = options?.limit ?? 500;
    const samples = await prisma.telemetrySample.findMany({
      where: { sessionId },
      orderBy: { recordedAt: order },
      take: limit,
    });
    return samples.map(mapSample);
  },
};

registerTelemetryRepository(repository);

export { repository as prismaTelemetryRepository };

function mapSample(model: Prisma.TelemetrySample): TelemetrySample {
  return {
    id: model.id,
    sessionId: model.sessionId,
    recordedAt: model.recordedAt.toISOString(),
    speedKph: model.speedKph ?? null,
    throttlePct: model.throttlePct ?? null,
    brakePct: model.brakePct ?? null,
    rpm: model.rpm ?? null,
    gear: model.gear ?? null,
    createdAt: model.createdAt.toISOString(),
  };
}
