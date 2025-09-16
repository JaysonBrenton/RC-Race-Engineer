import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VERSION_HEADER_NAME } from "../../../lib/versionHeader";

const jsonMock = vi.fn((payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
  }),
);

vi.mock("next/server", () => ({
  NextResponse: {
    json: (payload: unknown) => jsonMock(payload),
  },
}));

const ORIGINAL_ENV = process.env;

describe("GET /api/version", () => {
  beforeEach(() => {
    jsonMock.mockClear();
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.useRealTimers();
  });

  it("returns trimmed build metadata when env vars are set", async () => {
    process.env.RCE_VERSION = " 1.0.0 ";
    process.env.RCE_COMMIT = " abc123 ";
    process.env.RCE_BUILD_TIME = " 2024-04-01T10:20:30.000Z ";

    const { GET } = await import("./route");
    const response = GET();
    const payload = await response.json();

    expect(payload).toEqual({
      version: "1.0.0",
      commit: "abc123",
      buildTime: "2024-04-01T10:20:30.000Z",
    });
    expect(response.headers.get(VERSION_HEADER_NAME)).toBe("1.0.0");
  });

  it("falls back to default metadata when env vars are missing", async () => {
    delete process.env.RCE_VERSION;
    delete process.env.RCE_COMMIT;
    delete process.env.RCE_BUILD_TIME;

    const fixedDate = new Date("2024-05-04T00:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);

    const { GET } = await import("./route");
    const response = GET();
    const payload = await response.json();

    expect(payload.version).toBe("dev");
    expect(payload.commit).toBe("unknown");
    expect(payload.buildTime).toBe(fixedDate.toISOString());
    expect(response.headers.get(VERSION_HEADER_NAME)).toBe("dev");
  });
});
