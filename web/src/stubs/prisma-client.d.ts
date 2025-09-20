/**
 * Type declarations for the Prisma client stub used in tests and CLI tooling.
 * The runtime implementation lives in `prisma-client.js`; this file mirrors the
 * public surface so TypeScript projects can compile against the stub.
 */
export declare namespace Prisma {
  export type TimingProvider = "MANUAL" | "LIVE_RC";

  export type SessionKind =
    | "FP1"
    | "FP2"
    | "FP3"
    | "PRACTICE"
    | "QUALIFYING"
    | "RACE"
    | "TEST"
    | "OTHER";

  export type SessionStatus = "SCHEDULED" | "LIVE" | "COMPLETE" | "CANCELLED";

  export type Session = {
    id: string;
    name: string;
    description: string | null;
    kind: SessionKind;
    status: SessionStatus;
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
  };
  export type LiveRcRound = {
    id: string;
    classId: string;
    type: string;
    ordinal: number;
    createdAt: Date;
    updatedAt: Date;
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
  };
  export type LiveRcEntry = {
    id: string;
    classId: string;
    externalEntryId: number;
    driverName: string;
    carNumber: string | null;
    transponder: string | null;
    vehicle: string | null;
    sponsor: string | null;
    hometownCity: string | null;
    hometownRegion: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  export type LiveRcResult = {
    id: string;
    heatId: string;
    entryId: string;
    externalResultId: number;
    finishPosition: number | null;
    lapsCompleted: number | null;
    totalTimeMs: number | null;
    fastLapMs: number | null;
    intervalMs: number | null;
    status: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  export type LiveRcLap = { id: string; heatId: string; entryId: string; lapNo: number; [key: string]: unknown };
  export type LiveRcRoundRanking = { id: string; roundId: string; entryId: string; rankMode: string; [key: string]: unknown };
  export type LiveRcMultiMainStanding = { id: string; eventId: string; classId: string; entryId: string; [key: string]: unknown };
  export type LiveRcEventOverallResult = { id: string; eventId: string; classId: string; entryId: string; [key: string]: unknown };
  export type LiveRcSourceCache = { id: string; url: string; [key: string]: unknown };

  export type SessionInclude = {
    liveRcHeat?:
      | boolean
      | {
          include?: {
            class?: boolean | { include?: { event?: boolean } };
          };
        };
  };

  export type LiveRcResultInclude = {
    entry?: boolean;
  };

  export interface PrismaClientOptions {
    log?: ("query" | "info" | "warn" | "error")[];
  }
}

type SessionCreateArgs = {
  data: Record<string, unknown>;
  include?: Prisma.SessionInclude;
};

type SessionFindManyArgs = {
  orderBy: { createdAt: "asc" | "desc" };
  take?: number;
  include?: Prisma.SessionInclude;
};

type SessionFindUniqueArgs = {
  where: { id: string };
  include?: Prisma.SessionInclude;
};

type TelemetryCreateArgs = {
  data: Record<string, unknown>;
};

type TelemetryFindManyArgs = {
  where: { sessionId: string };
  orderBy: { recordedAt: "asc" | "desc" };
  take?: number;
};

type LiveRcResultFindManyArgs = {
  where: { heatId: string };
  include?: Prisma.LiveRcResultInclude;
  orderBy?: { finishPosition?: "asc" | "desc"; fastLapMs?: "asc" | "desc"; totalTimeMs?: "asc" | "desc" }[];
};

type UpsertArgs<Where> = {
  where: Where;
  create: Record<string, unknown>;
  update: Record<string, unknown>;
};

export declare class PrismaClient {
  constructor(options?: Prisma.PrismaClientOptions);

  session: {
    create(args: SessionCreateArgs): Promise<Prisma.Session>;
    findMany(args: SessionFindManyArgs): Promise<Prisma.Session[]>;
    findUnique(args: SessionFindUniqueArgs): Promise<Prisma.Session | null>;
  };

  telemetrySample: {
    create(args: TelemetryCreateArgs): Promise<Prisma.TelemetrySample>;
    findMany(args: TelemetryFindManyArgs): Promise<Prisma.TelemetrySample[]>;
  };

  liveRcSourceCache: {
    findUnique(args: { where: { url: string } }): Promise<Prisma.LiveRcSourceCache | null>;
    upsert(args: UpsertArgs<{ url: string }>): Promise<Prisma.LiveRcSourceCache>;
  };

  liveRcEvent: {
    upsert(args: UpsertArgs<{ externalEventId: number }>): Promise<Prisma.LiveRcEvent>;
  };

  liveRcClass: {
    upsert(
      args: UpsertArgs<{ eventId_externalClassId: { eventId: string; externalClassId: number } }>
    ): Promise<Prisma.LiveRcClass>;
  };

  liveRcRound: {
    upsert(
      args: UpsertArgs<{ classId_type_ordinal: { classId: string; type: string; ordinal: number } }>
    ): Promise<Prisma.LiveRcRound>;
  };

  liveRcHeat: {
    upsert(
      args: UpsertArgs<{ classId_externalHeatId: { classId: string; externalHeatId: number } }>
    ): Promise<Prisma.LiveRcHeat>;
  };

  liveRcEntry: {
    upsert(
      args: UpsertArgs<{ classId_externalEntryId: { classId: string; externalEntryId: number } }>
    ): Promise<Prisma.LiveRcEntry>;
  };

  liveRcResult: {
    upsert(args: UpsertArgs<{ heatId_entryId: { heatId: string; entryId: string } }>): Promise<Prisma.LiveRcResult>;
    findMany(
      args: LiveRcResultFindManyArgs,
    ): Promise<(Prisma.LiveRcResult & { entry?: Prisma.LiveRcEntry | null })[]>;
  };

  liveRcLap: {
    upsert(
      args: UpsertArgs<{ heatId_entryId_lapNo: { heatId: string; entryId: string; lapNo: number } }>
    ): Promise<Prisma.LiveRcLap>;
  };

  liveRcRoundRanking: {
    upsert(
      args: UpsertArgs<{ roundId_entryId_rankMode: { roundId: string; entryId: string; rankMode: string } }>
    ): Promise<Prisma.LiveRcRoundRanking>;
  };

  liveRcMultiMainStanding: {
    upsert(args: UpsertArgs<{ classId_entryId: { classId: string; entryId: string } }>): Promise<Prisma.LiveRcMultiMainStanding>;
  };

  liveRcEventOverallResult: {
    upsert(args: UpsertArgs<{ classId_entryId: { classId: string; entryId: string } }>): Promise<Prisma.LiveRcEventOverallResult>;
  };

  $queryRaw<T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;
}

export declare const Prisma: Record<string, unknown>;
