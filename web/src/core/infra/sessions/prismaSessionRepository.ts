import type { Prisma } from "@prisma/client";
import { prisma } from "@/core/infra/db/prismaClient";
import type { CreateSessionInput, Session, SessionLiveRcMetadata, TimingProvider } from "@/core/domain/session";
import type { SessionRepository } from "@/core/app/sessions/ports";
import { registerSessionRepository } from "@/core/app/sessions/serviceLocator";

const repository: SessionRepository = {
  async create(data: CreateSessionInput) {
    const created = await prisma.session.create({
      data: {
        name: data.name,
        description: data.description,
        kind: data.kind,
        status: "SCHEDULED",
        scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : undefined,
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
        timingProvider: (data.timingProvider ?? "MANUAL") as TimingProvider,
        liveRcHeatId: data.liveRcHeatId ?? null,
      },
      include: LIVE_RC_INCLUDE,
    });
    return mapSession(created);
  },
  async list() {
    const sessions = await prisma.session.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: LIVE_RC_INCLUDE,
    });
    return sessions.map(mapSession);
  },
};

registerSessionRepository(repository);

export { repository as prismaSessionRepository };

function mapSession(model: Prisma.Session): Session {
  return {
    id: model.id,
    name: model.name,
    description: model.description ?? null,
    kind: model.kind,
    status: model.status,
    scheduledStart: model.scheduledStart ? model.scheduledStart.toISOString() : null,
    scheduledEnd: model.scheduledEnd ? model.scheduledEnd.toISOString() : null,
    actualStart: model.actualStart ? model.actualStart.toISOString() : null,
    actualEnd: model.actualEnd ? model.actualEnd.toISOString() : null,
    timingProvider: model.timingProvider,
    liveRc: mapLiveRc(model.liveRcHeat ?? null),
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}

const LIVE_RC_INCLUDE = {
  liveRcHeat: {
    include: {
      class: {
        include: {
          event: true,
        },
      },
    },
  },
} satisfies Prisma.SessionInclude;

function mapLiveRc(heat: Prisma.LiveRcHeat | null | undefined): SessionLiveRcMetadata | null {
  if (!heat) {
    return null;
  }

  const cls = heat.class;
  const event = cls?.event ?? null;
  return {
    heatId: heat.id,
    heatExternalId: heat.externalHeatId,
    label: heat.label,
    round: heat.round ?? null,
    attempt: heat.attempt ?? null,
    scheduledStart: heat.scheduledStart ? heat.scheduledStart.toISOString() : null,
    durationSeconds: heat.durationSeconds ?? null,
    status: heat.status ?? null,
    liveStreamUrl: heat.liveStreamUrl ?? null,
    class: cls
      ? {
          id: cls.id,
          externalClassId: cls.externalClassId,
          name: cls.name,
        }
      : null,
    event: event
      ? {
          id: event.id,
          externalEventId: event.externalEventId,
          title: event.title,
          trackName: event.trackName,
          facility: event.facility,
          city: event.city,
          region: event.region,
          country: event.country,
          timeZone: event.timeZone,
          startTime: event.startTime ? event.startTime.toISOString() : null,
          endTime: event.endTime ? event.endTime.toISOString() : null,
          website: event.website,
        }
      : null,
  };
}

export { mapSession };
