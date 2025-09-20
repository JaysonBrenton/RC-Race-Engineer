import "./setupAlias";
import assert from "node:assert/strict";
import test from "node:test";

import type { Session } from "@/core/domain/session";
import type { TelemetrySample } from "@/core/domain/telemetry";
import type { SessionRepository } from "@/core/app/sessions/ports";
import type { TelemetryRepository } from "@/core/app/telemetry/ports";
import { registerSessionRepository } from "@/core/app/sessions/serviceLocator";
import { registerTelemetryRepository } from "@/core/app/telemetry/serviceLocator";
import { GET, POST } from "@/app/api/sessions/[sessionId]/events/route";

const baseSession: Session = {
  id: "session-1",
  name: "Evening practice",
  description: null,
  kind: "RACE",
  status: "SCHEDULED",
  scheduledStart: null,
  scheduledEnd: null,
  actualStart: null,
  actualEnd: null,
  timingProvider: "MANUAL",
  liveRc: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const baseSample: TelemetrySample = {
  id: "sample-1",
  sessionId: baseSession.id,
  recordedAt: "2024-01-01T00:00:00.000Z",
  speedKph: 120,
  throttlePct: 80,
  brakePct: 0,
  rpm: 15000,
  gear: 5,
  createdAt: "2024-01-01T00:00:01.000Z",
};

function makeSession(overrides: Partial<Session> = {}): Session {
  return { ...baseSession, ...overrides };
}

function makeSample(overrides: Partial<TelemetrySample> = {}): TelemetrySample {
  return { ...baseSample, ...overrides };
}

function registerSessionStub(overrides: Partial<SessionRepository> = {}) {
  const repository: SessionRepository = {
    async list() {
      return [];
    },
    async create() {
      throw new Error("not implemented");
    },
    async getById(id: string) {
      return makeSession({ id });
    },
    ...overrides,
  };

  registerSessionRepository(repository);
  return repository;
}

function registerTelemetryStub(overrides: Partial<TelemetryRepository> = {}) {
  const repository: TelemetryRepository = {
    async listForSession(sessionId) {
      return [makeSample({ sessionId })];
    },
    async createForSession(sessionId, data) {
      return makeSample({
        sessionId,
        recordedAt: data.recordedAt,
        speedKph: data.speedKph ?? baseSample.speedKph,
        throttlePct: data.throttlePct ?? baseSample.throttlePct,
        brakePct: data.brakePct ?? baseSample.brakePct,
        rpm: data.rpm ?? baseSample.rpm,
        gear: data.gear ?? baseSample.gear,
      });
    },
    ...overrides,
  };

  registerTelemetryRepository(repository);
  return repository;
}

test("GET /api/sessions/:id/events returns session telemetry", async () => {
  const session = makeSession({ id: "session-a", name: "Qualifier" });
  const sample = makeSample({ sessionId: session.id, recordedAt: "2024-05-04T12:00:00.000Z" });

  registerSessionStub({
    async getById() {
      return session;
    },
  });
  registerTelemetryStub({
    async listForSession(sessionId, options) {
      assert.equal(options?.limit, 2);
      assert.equal(options?.order, "asc");
      return [sample];
    },
  });

  const request = new Request(`http://localhost/api/sessions/${session.id}/events?limit=2`);
  const response = await GET(request, { params: { sessionId: session.id } });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { session, samples: [sample] });
});

test("GET /api/sessions/:id/events validates limit query", async () => {
  registerSessionStub();
  registerTelemetryStub();

  const request = new Request("http://localhost/api/sessions/session-1/events?limit=-3");
  const response = await GET(request, { params: { sessionId: "session-1" } });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "limit must be a positive number" });
});

test("GET /api/sessions/:id/events rejects limit values above the cap", async () => {
  registerSessionStub();
  registerTelemetryStub();

  const request = new Request("http://localhost/api/sessions/session-1/events?limit=999");
  const response = await GET(request, { params: { sessionId: "session-1" } });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "limit must be less than or equal to 500" });
});

test("GET /api/sessions/:id/events returns 404 when session missing", async () => {
  registerSessionStub({
    async getById() {
      return null;
    },
  });
  registerTelemetryStub();

  const request = new Request("http://localhost/api/sessions/missing/events");
  const response = await GET(request, { params: { sessionId: "missing" } });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Session not found" });
});

test("GET /api/sessions/:id/events returns 500 when repository fails", async () => {
  registerSessionStub({
    async getById() {
      return makeSession();
    },
  });
  registerTelemetryStub({
    async listForSession() {
      throw new Error("query failed");
    },
  });

  const request = new Request("http://localhost/api/sessions/session-1/events");
  const response = await GET(request, { params: { sessionId: "session-1" } });

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Unable to load telemetry" });
});

test("POST /api/sessions/:id/events persists telemetry events", async () => {
  const session = makeSession({ id: "session-z" });
  const created = makeSample({ sessionId: session.id, recordedAt: "2024-06-01T10:00:00.000Z" });

  registerSessionStub({
    async getById() {
      return session;
    },
  });
  registerTelemetryStub({
    async createForSession(sessionId, data) {
      assert.equal(sessionId, session.id);
      return makeSample({ ...created, recordedAt: data.recordedAt });
    },
  });

  const request = new Request(`http://localhost/api/sessions/${session.id}/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ recordedAt: created.recordedAt, speedKph: 130 }),
  });

  const response = await POST(request, { params: { sessionId: session.id } });

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { sample: created });
});

test("POST /api/sessions/:id/events rejects malformed JSON", async () => {
  registerSessionStub();
  registerTelemetryStub();

  const request = new Request("http://localhost/api/sessions/session-1/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{broken",
  });

  const response = await POST(request, { params: { sessionId: "session-1" } });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid JSON body" });
});

test("POST /api/sessions/:id/events returns 404 when session missing", async () => {
  registerSessionStub({
    async getById() {
      return null;
    },
  });
  registerTelemetryStub();

  const request = new Request("http://localhost/api/sessions/absent/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ recordedAt: "2024-01-01T00:00:00.000Z" }),
  });

  const response = await POST(request, { params: { sessionId: "absent" } });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Session not found" });
});

test("POST /api/sessions/:id/events surfaces validation errors", async () => {
  registerSessionStub();
  registerTelemetryStub();

  const request = new Request("http://localhost/api/sessions/session-1/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ speedKph: -5 }),
  });

  const response = await POST(request, { params: { sessionId: "session-1" } });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, "Validation failed");
  assert.ok(Array.isArray(body.issues));
  assert.ok(body.issues.includes("speedKph must be >= 0"));
  assert.ok(body.issues.includes("Invalid input"));
});

test("POST /api/sessions/:id/events returns 500 when persistence fails", async () => {
  registerSessionStub({
    async getById() {
      return makeSession({ id: "session-1" });
    },
  });
  registerTelemetryStub({
    async createForSession() {
      throw new Error("insert failed");
    },
  });

  const request = new Request("http://localhost/api/sessions/session-1/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ recordedAt: "2024-01-01T00:00:00.000Z" }),
  });

  const response = await POST(request, { params: { sessionId: "session-1" } });

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Unable to record telemetry" });
});
