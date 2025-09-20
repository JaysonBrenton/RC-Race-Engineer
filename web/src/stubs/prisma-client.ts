/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-namespace */
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";

const requireModule = createRequire(__filename);

export namespace Prisma {
  export type TimingProvider = "MANUAL" | "LIVE_RC";

  export type Session = {
    id: string;
    name: string;
    description: string | null;
    kind: "FP1" | "FP2" | "FP3" | "PRACTICE" | "QUALIFYING" | "RACE" | "TEST" | "OTHER";
    status: "SCHEDULED" | "LIVE" | "COMPLETE" | "CANCELLED";
    scheduledStart: Date | null;
    scheduledEnd: Date | null;
    actualStart: Date | null;
    actualEnd: Date | null;
    timingProvider: TimingProvider;
    liveRcHeatId: string | null;
    createdAt: Date;
    updatedAt: Date;
    liveRcHeat?: LiveRcHeat | null;
  };

  export type LiveRcEvent = {
    id: string;
    externalEventId: number;
    title: string;
    trackName: string | null;
    facility: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    timeZone: string | null;
    startTime: Date | null;
    endTime: Date | null;
    website: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  export type LiveRcClass = {
    id: string;
    eventId: string;
    externalClassId: number;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    event?: LiveRcEvent;
  };

  export type LiveRcHeat = {
    id: string;
    classId: string;
    externalHeatId: number;
    label: string;
    round: number | null;
    attempt: number | null;
    scheduledStart: Date | null;
    durationSeconds: number | null;
    status: string | null;
    liveStreamUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    class?: LiveRcClass & { event?: LiveRcEvent };
  };

  export type SessionInclude = {
    liveRcHeat?:
      | boolean
      | {
          include?: {
            class?:
              | boolean
              | {
                  include?: {
                    event?: boolean;
                  };
                };
          };
        };
  };

  export type TelemetrySample = {
    id: string;
    sessionId: string;
    recordedAt: Date;
    speedKph: number | null;
    throttlePct: number | null;
    brakePct: number | null;
    rpm: number | null;
    gear: number | null;
    createdAt: Date;
  };

  export interface PrismaClientOptions {
    log?: ("query" | "info" | "warn" | "error")[];
  }
}

interface SessionCreateArgs {
  data: Record<string, any>;
  include?: Prisma.SessionInclude;
}

interface SessionFindManyArgs {
  orderBy: { createdAt: "asc" | "desc" };
  take?: number;
  include?: Prisma.SessionInclude;
}

interface SessionFindUniqueArgs {
  where: { id: string };
  include?: Prisma.SessionInclude;
}

interface ClientImplementation {
  session: {
    create(args: SessionCreateArgs): Promise<Prisma.Session>;
    findMany(args: SessionFindManyArgs): Promise<Prisma.Session[]>;
    findUnique(args: SessionFindUniqueArgs): Promise<Prisma.Session | null>;
  };
  telemetrySample: {
    create(args: TelemetryCreateArgs): Promise<Prisma.TelemetrySample>;
    findMany(args: TelemetryFindManyArgs): Promise<Prisma.TelemetrySample[]>;
  };
  $queryRaw<T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;
}

interface TelemetryCreateArgs {
  data: Record<string, any>;
}

interface TelemetryFindManyArgs {
  where: { sessionId: string };
  orderBy: { recordedAt: "asc" | "desc" };
  take?: number;
}

class InMemoryPrismaClient implements ClientImplementation {
  private sessions: Prisma.Session[] = [];
  private telemetry: Prisma.TelemetrySample[] = [];

  public session = {
    create: async (args: SessionCreateArgs): Promise<Prisma.Session> => {
      const now = new Date();
      const record: Prisma.Session = {
        id: randomUUID(),
        name: String(args.data.name ?? "Unnamed session"),
        description: (args.data.description ?? null) as string | null,
        kind: (args.data.kind ?? "OTHER") as Prisma.Session["kind"],
        status: (args.data.status ?? "SCHEDULED") as Prisma.Session["status"],
        scheduledStart: (args.data.scheduledStart ?? null) as Date | null,
        scheduledEnd: (args.data.scheduledEnd ?? null) as Date | null,
        actualStart: (args.data.actualStart ?? null) as Date | null,
        actualEnd: (args.data.actualEnd ?? null) as Date | null,
        timingProvider: (args.data.timingProvider ?? "MANUAL") as Prisma.TimingProvider,
        liveRcHeatId: (args.data.liveRcHeatId ?? null) as string | null,
        createdAt: now,
        updatedAt: now,
        liveRcHeat: (args.data.liveRcHeat ?? null) as Prisma.LiveRcHeat | null,
      };
      this.sessions.unshift(record);
      return structuredClone(record);
    },
    findMany: async (args: SessionFindManyArgs): Promise<Prisma.Session[]> => {
      const sorted = [...this.sessions].sort((a, b) => {
        if (args.orderBy.createdAt === "desc") {
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
      return sorted.slice(0, args.take ?? sorted.length).map((session) => structuredClone(session));
    },
    findUnique: async (args: SessionFindUniqueArgs): Promise<Prisma.Session | null> => {
      const session = this.sessions.find((item) => item.id === args.where.id) ?? null;
      return session ? structuredClone(session) : null;
    },
  };

  public telemetrySample = {
    create: async (args: TelemetryCreateArgs): Promise<Prisma.TelemetrySample> => {
      const now = new Date();
      const sample: Prisma.TelemetrySample = {
        id: randomUUID(),
        sessionId: String(args.data.sessionId),
        recordedAt: new Date(args.data.recordedAt ?? now),
        speedKph: (args.data.speedKph ?? null) as number | null,
        throttlePct: (args.data.throttlePct ?? null) as number | null,
        brakePct: (args.data.brakePct ?? null) as number | null,
        rpm: (args.data.rpm ?? null) as number | null,
        gear: (args.data.gear ?? null) as number | null,
        createdAt: now,
      };
      this.telemetry.push(sample);
      return structuredClone(sample);
    },
    findMany: async (args: TelemetryFindManyArgs): Promise<Prisma.TelemetrySample[]> => {
      const filtered = this.telemetry.filter((sample) => sample.sessionId === args.where.sessionId);
      const sorted = filtered.sort((a, b) => {
        if (args.orderBy.recordedAt === "asc") {
          return a.recordedAt.getTime() - b.recordedAt.getTime();
        }
        return b.recordedAt.getTime() - a.recordedAt.getTime();
      });
      return sorted.slice(0, args.take ?? sorted.length).map((sample) => structuredClone(sample));
    },
  };

  public async $queryRaw<T = unknown>(strings: TemplateStringsArray): Promise<T> {
    const text = strings.join("?");
    if (text.trim().toUpperCase().startsWith("SELECT")) {
      return 1 as T;
    }
    throw new Error("In-memory Prisma stub only supports SELECT probes");
  }
}

function loadRealPrismaClient(): (new (options?: Prisma.PrismaClientOptions) => ClientImplementation) | null {
  try {
    const real = requireModule("@prisma/client") as {
      PrismaClient?: new (options?: Prisma.PrismaClientOptions) => ClientImplementation;
    };
    return real?.PrismaClient ?? null;
  } catch {
    return null;
  }
}

const RealPrismaClient = loadRealPrismaClient();

export class PrismaClient implements ClientImplementation {
  private readonly impl: ClientImplementation;

  public readonly session: ClientImplementation["session"];
  public readonly telemetrySample: ClientImplementation["telemetrySample"];

  constructor(options?: Prisma.PrismaClientOptions) {
    if (RealPrismaClient) {
      this.impl = new RealPrismaClient(options);
    } else {
      this.impl = new InMemoryPrismaClient();
    }
    this.session = this.impl.session;
    this.telemetrySample = this.impl.telemetrySample;
  }

  public $queryRaw<T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T> {
    return this.impl.$queryRaw(strings, ...values);
  }
}
