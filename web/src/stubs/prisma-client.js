/* eslint-disable @typescript-eslint/no-require-imports */
const { randomUUID } = require("node:crypto");

function now() {
  return new Date();
}

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mergeRecord(base, updates) {
  return Object.assign({}, base, updates);
}

function createUpsert(store, keyResolver) {
  return async (args) => {
    const key = keyResolver(args.where);
    const existing = store.get(key);
    const record = existing ? mergeRecord(existing, args.update) : args.create;
    store.set(key, record);
    return record;
  };
}

class PrismaClient {
  constructor() {
    this._sessions = new Map();
    this._telemetrySamples = new Map();
    this._liveRcSourceCache = new Map();
    this._liveRcEvents = new Map();
    this._liveRcClasses = new Map();
    this._liveRcRounds = new Map();
    this._liveRcHeats = new Map();
    this._liveRcEntries = new Map();
    this._liveRcResults = new Map();
    this._liveRcLaps = new Map();
    this._liveRcRoundRankings = new Map();
    this._liveRcMultiMainStandings = new Map();
    this._liveRcEventOverallResults = new Map();

    this.session = {
      create: async (args) => {
        const id = args.data.id ?? `session-${randomUUID()}`;
        const created = {
          id,
          name: args.data.name,
          description: args.data.description ?? null,
          kind: args.data.kind,
          status: args.data.status ?? "SCHEDULED",
          scheduledStart: toDate(args.data.scheduledStart),
          scheduledEnd: toDate(args.data.scheduledEnd),
          actualStart: toDate(args.data.actualStart),
          actualEnd: toDate(args.data.actualEnd),
          timingProvider: args.data.timingProvider,
          liveRcHeatId: args.data.liveRcHeatId ?? null,
          createdAt: now(),
          updatedAt: now(),
          liveRcHeat: null,
        };
        this._sessions.set(id, created);
        return created;
      },
      findMany: async (args) => {
        const sessions = Array.from(this._sessions.values());
        sessions.sort((a, b) =>
          args.orderBy.createdAt === "asc"
            ? a.createdAt.getTime() - b.createdAt.getTime()
            : b.createdAt.getTime() - a.createdAt.getTime(),
        );
        return typeof args.take === "number" ? sessions.slice(0, args.take) : sessions;
      },
      findUnique: async (args) => {
        return this._sessions.get(args.where.id) ?? null;
      },
    };

    this.telemetrySample = {
      create: async (args) => {
        const id = args.data.id ?? `telemetry-${randomUUID()}`;
        const sample = {
          id,
          sessionId: args.data.sessionId,
          recordedAt: toDate(args.data.recordedAt) ?? now(),
          speedKph: args.data.speedKph ?? null,
          throttlePct: args.data.throttlePct ?? null,
          brakePct: args.data.brakePct ?? null,
          rpm: args.data.rpm ?? null,
          gear: args.data.gear ?? null,
          createdAt: now(),
        };
        const existing = this._telemetrySamples.get(sample.sessionId) ?? [];
        existing.push(sample);
        this._telemetrySamples.set(sample.sessionId, existing);
        return sample;
      },
      findMany: async (args) => {
        const samples = (this._telemetrySamples.get(args.where.sessionId) ?? []).slice();
        samples.sort((a, b) =>
          args.orderBy.recordedAt === "asc"
            ? a.recordedAt.getTime() - b.recordedAt.getTime()
            : b.recordedAt.getTime() - a.recordedAt.getTime(),
        );
        return typeof args.take === "number" ? samples.slice(0, args.take) : samples;
      },
    };

    this.liveRcSourceCache = {
      findUnique: async (args) => {
        return this._liveRcSourceCache.get(args.where.url) ?? null;
      },
      upsert: async (args) => {
        const existing = this._liveRcSourceCache.get(args.where.url);
        const record = existing ? mergeRecord(existing, args.update) : args.create;
        this._liveRcSourceCache.set(args.where.url, record);
        return record;
      },
    };

    this.liveRcEvent = {
      upsert: createUpsert(this._liveRcEvents, (where) => String(where.externalEventId)),
    };

    this.liveRcClass = {
      upsert: createUpsert(
        this._liveRcClasses,
        (where) => `${where.eventId_externalClassId.eventId}:${where.eventId_externalClassId.externalClassId}`,
      ),
    };

    this.liveRcRound = {
      upsert: createUpsert(
        this._liveRcRounds,
        (where) => `${where.classId_type_ordinal.classId}:${where.classId_type_ordinal.type}:${where.classId_type_ordinal.ordinal}`,
      ),
    };

    this.liveRcHeat = {
      upsert: createUpsert(
        this._liveRcHeats,
        (where) => `${where.classId_externalHeatId.classId}:${where.classId_externalHeatId.externalHeatId}`,
      ),
    };

    this.liveRcEntry = {
      upsert: createUpsert(
        this._liveRcEntries,
        (where) => `${where.classId_externalEntryId.classId}:${where.classId_externalEntryId.externalEntryId}`,
      ),
    };

    this.liveRcResult = {
      upsert: createUpsert(
        this._liveRcResults,
        (where) => `${where.heatId_entryId.heatId}:${where.heatId_entryId.entryId}`,
      ),
    };

    this.liveRcLap = {
      upsert: createUpsert(
        this._liveRcLaps,
        (where) => `${where.heatId_entryId_lapNo.heatId}:${where.heatId_entryId_lapNo.entryId}:${where.heatId_entryId_lapNo.lapNo}`,
      ),
    };

    this.liveRcRoundRanking = {
      upsert: createUpsert(
        this._liveRcRoundRankings,
        (where) =>
          `${where.roundId_entryId_rankMode.roundId}:${where.roundId_entryId_rankMode.entryId}:${where.roundId_entryId_rankMode.rankMode}`,
      ),
    };

    this.liveRcMultiMainStanding = {
      upsert: createUpsert(
        this._liveRcMultiMainStandings,
        (where) => `${where.classId_entryId.classId}:${where.classId_entryId.entryId}`,
      ),
    };

    this.liveRcEventOverallResult = {
      upsert: createUpsert(
        this._liveRcEventOverallResults,
        (where) => `${where.classId_entryId.classId}:${where.classId_entryId.entryId}`,
      ),
    };

    this.$queryRaw = async () => [];
  }
}

module.exports = {
  PrismaClient,
  Prisma: {},
};
