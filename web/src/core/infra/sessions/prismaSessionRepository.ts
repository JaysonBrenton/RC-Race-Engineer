import type { Prisma } from "@prisma/client";
import { prisma } from "@/core/infra/db/prismaClient";
import type { Session } from "@/core/domain/session";
import type { SessionRepository } from "@/core/app/sessions/ports";
import { registerSessionRepository } from "@/core/app/sessions/serviceLocator";

const repository: SessionRepository = {
  async create(data) {
    const created = await prisma.session.create({
      data: {
        name: data.name,
        description: data.description,
        kind: data.kind,
        status: "SCHEDULED",
        scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : undefined,
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
      },
    });
    return mapSession(created);
  },
  async list() {
    const sessions = await prisma.session.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
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
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}
