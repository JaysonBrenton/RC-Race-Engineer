import "./setupAlias";
import assert from "node:assert/strict";
import test from "node:test";

import type { CreateSessionInput, Session } from "@/core/domain/session";
import type { SessionRepository } from "@/core/app/sessions/ports";
import { registerSessionRepository } from "@/core/app/sessions/serviceLocator";
import { GET, POST } from "@/app/api/sessions/route";

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

function makeSession(overrides: Partial<Session> = {}): Session {
  return { ...baseSession, ...overrides };
}

function registerSessionsStub(overrides: Partial<SessionRepository> = {}) {
  const repository: SessionRepository = {
    async list() {
      return [];
    },
    async create(input: CreateSessionInput) {
      return makeSession({
        id: "session-created",
        name: input.name,
        kind: input.kind,
        scheduledStart: input.scheduledStart ?? null,
        scheduledEnd: input.scheduledEnd ?? null,
        timingProvider: input.timingProvider ?? "MANUAL",
        liveRc: null,
      });
    },
    async getById() {
      return null;
    },
    ...overrides,
  };

  registerSessionRepository(repository);
  return repository;
}

test("GET /api/sessions returns persisted sessions", async () => {
  const expected = makeSession({ id: "session-a", name: "Sprint" });

  registerSessionsStub({
    async list() {
      return [expected];
    },
  });

  const response = await GET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { sessions: [expected] });
});

test("GET /api/sessions translates repository failures into 500", async () => {
  registerSessionsStub({
    async list() {
      throw new Error("database unavailable");
    },
  });

  const response = await GET();
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Unable to load sessions" });
});

test("POST /api/sessions creates a session when payload is valid", async () => {
  const created = makeSession({
    id: "session-123",
    name: "Final",
    kind: "RACE",
  });

  registerSessionsStub({
    async create(input) {
      return makeSession({
        ...created,
        name: input.name,
        kind: input.kind,
        scheduledStart: input.scheduledStart ?? null,
        scheduledEnd: input.scheduledEnd ?? null,
        timingProvider: input.timingProvider ?? "MANUAL",
      });
    },
  });

  const request = new Request("http://localhost/api/sessions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Final", kind: "RACE" }),
  });

  const response = await POST(request);
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { session: created });
});

test("POST /api/sessions rejects malformed JSON payloads", async () => {
  registerSessionsStub();

  const request = new Request("http://localhost/api/sessions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{invalid",
  });

  const response = await POST(request);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid JSON body" });
});

test("POST /api/sessions surfaces validation issues", async () => {
  registerSessionsStub();

  const request = new Request("http://localhost/api/sessions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });

  const response = await POST(request);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Validation failed",
    issues: ["name is required", "kind must be a recognised session kind"],
  });
});

test("POST /api/sessions returns 500 when creation fails", async () => {
  registerSessionsStub({
    async create() {
      throw new Error("write failed");
    },
  });

  const request = new Request("http://localhost/api/sessions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Practice", kind: "FP1" }),
  });

  const response = await POST(request);
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Unable to create session" });
});
