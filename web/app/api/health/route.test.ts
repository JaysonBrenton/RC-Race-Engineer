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

describe("GET /api/health", () => {
  beforeEach(() => {
    jsonMock.mockClear();
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns an ok status, timestamp, and version header", async () => {
    process.env.RCE_VERSION = "test-version";

    const { GET } = await import("./route");
    const response = GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get(VERSION_HEADER_NAME)).toBe("test-version");
    expect(payload.status).toBe("ok");
    expect(typeof payload.time).toBe("string");
    expect(Number.isNaN(Date.parse(payload.time))).toBe(false);
  });
});
