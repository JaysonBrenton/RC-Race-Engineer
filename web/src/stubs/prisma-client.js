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

function createUpsert(store, keyResolver, options = {}) {
  const { prefix = "record", afterSave } = options;
  return async (args) => {
    const key = keyResolver(args.where);
    const existing = store.get(key);
    const base = existing ? mergeRecord(existing, args.update) : { ...args.create };
    if (!base.id) {
      base.id = `${prefix}-${randomUUID()}`;
    }
    if (!existing && !base.createdAt) {
      base.createdAt = now();
    }
    base.updatedAt = now();
    store.set(key, base);
    if (afterSave) {
      afterSave(base);
    }
    return base;
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
    this._liveRcEntriesById = new Map();
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
      upsert: createUpsert(this._liveRcEvents, (where) => String(where.externalEventId), { prefix: "event" }),
    };

    this.liveRcClass = {
      upsert: createUpsert(
        this._liveRcClasses,
        (where) => `${where.eventId_externalClassId.eventId}:${where.eventId_externalClassId.externalClassId}`,
        { prefix: "class" },
      ),
    };

    this.liveRcRound = {
      upsert: createUpsert(
        this._liveRcRounds,
        (where) => `${where.classId_type_ordinal.classId}:${where.classId_type_ordinal.type}:${where.classId_type_ordinal.ordinal}`,
        { prefix: "round" },
      ),
    };

    this.liveRcHeat = {
      upsert: createUpsert(
        this._liveRcHeats,
        (where) => `${where.classId_externalHeatId.classId}:${where.classId_externalHeatId.externalHeatId}`,
        { prefix: "heat" },
      ),
    };

    this.liveRcEntry = {
      upsert: createUpsert(
        this._liveRcEntries,
        (where) => `${where.classId_externalEntryId.classId}:${where.classId_externalEntryId.externalEntryId}`,
        {
          prefix: "entry",
          afterSave: (entry) => {
            this._liveRcEntriesById.set(entry.id, entry);
          },
        },
      ),
    };

    this.liveRcResult = {
      upsert: createUpsert(
        this._liveRcResults,
        (where) => `${where.heatId_entryId.heatId}:${where.heatId_entryId.entryId}`,
        { prefix: "result" },
      ),
      findMany: async (args) => {
        const { where, include, orderBy } = args;
        const list = Array.from(this._liveRcResults.values()).filter((result) => result.heatId === where.heatId);
        if (orderBy && orderBy.length > 0) {
          list.sort((a, b) => compareOrderBy(a, b, orderBy));
        }
        return list.map((result) => ({
          ...result,
          entry: include?.entry ? this._liveRcEntriesById.get(result.entryId) ?? null : undefined,
        }));
      },
    };

    this.liveRcLap = {
      upsert: createUpsert(
        this._liveRcLaps,
        (where) => `${where.heatId_entryId_lapNo.heatId}:${where.heatId_entryId_lapNo.entryId}:${where.heatId_entryId_lapNo.lapNo}`,
        { prefix: "lap" },
      ),
    };

    this.liveRcRoundRanking = {
      upsert: createUpsert(
        this._liveRcRoundRankings,
        (where) =>
          `${where.roundId_entryId_rankMode.roundId}:${where.roundId_entryId_rankMode.entryId}:${where.roundId_entryId_rankMode.rankMode}`,
        { prefix: "ranking" },
      ),
    };

    this.liveRcMultiMainStanding = {
      upsert: createUpsert(
        this._liveRcMultiMainStandings,
        (where) => `${where.classId_entryId.classId}:${where.classId_entryId.entryId}`,
        { prefix: "standing" },
      ),
    };

    this.liveRcEventOverallResult = {
      upsert: createUpsert(
        this._liveRcEventOverallResults,
        (where) => `${where.classId_entryId.classId}:${where.classId_entryId.entryId}`,
        { prefix: "overall" },
      ),
    };

    this.$queryRaw = async () => [];
  }
}

function compareOrderBy(a, b, clauses) {
  for (const clause of clauses) {
    const entries = Object.entries(clause);
    if (entries.length === 0) {
      continue;
    }
    const [field, direction] = entries[0];
    const aValue = normaliseOrderValue(a[field], direction);
    const bValue = normaliseOrderValue(b[field], direction);
    if (aValue < bValue) {
      return direction === "desc" ? 1 : -1;
    }
    if (aValue > bValue) {
      return direction === "desc" ? -1 : 1;
    }
  }
  return 0;
}

function normaliseOrderValue(value, direction) {
  if (value == null) {
    return direction === "desc" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  }
  return value;
}

module.exports = {
  PrismaClient,
  Prisma: {},
};
