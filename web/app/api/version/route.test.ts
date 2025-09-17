/**
 * ============================================================================
 * File: web/app/api/version/route.test.ts
 * Purpose: Document how the version endpoint responds both when build metadata
 *          is present and when it is missing.
 * Author: Jayson + The Brainy One
 * Last Updated: 2024-05-07
 * ============================================================================
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VERSION_HEADER_NAME } from "../../../lib/versionHeader";

// Provide a simple drop-in replacement for NextResponse.json while running tests.
const jsonMock = vi.fn((payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
  }),
);

vi.mock("next/server", () => ({
  NextResponse: {
    // Our mock ensures the route code stays the same while tests stay lightweight.
    json: (payload: unknown) => jsonMock(payload),
  },
}));

const ORIGINAL_ENV = process.env;

describe("GET /api/version", () => {
  beforeEach(() => {
    // Reset mocks and clone environment variables so tests remain independent.
    jsonMock.mockClear();
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    // Return environment variables and timers to their original state.
    process.env = ORIGINAL_ENV;
    vi.useRealTimers();
  });

  it("returns trimmed build metadata when env vars are set", async () => {
    // Pretend the CI pipeline injected full build information.
    process.env.RCE_VERSION = " 1.0.0 ";
    process.env.RCE_COMMIT = " abc123 ";
    process.env.RCE_BUILD_TIME = " 2024-04-01T10:20:30.000Z ";

    const { GET } = await import("./route");
    const response = GET();
    const payload = await response.json();

    // Everything should be neatly trimmed and echoed back to the caller.
    expect(payload).toEqual({
      version: "1.0.0",
      commit: "abc123",
      buildTime: "2024-04-01T10:20:30.000Z",
    });
    expect(response.headers.get(VERSION_HEADER_NAME)).toBe("1.0.0");
  });

  it("falls back to default metadata when env vars are missing", async () => {
    // Remove every build hint so the code must reach for its defaults.
    delete process.env.RCE_VERSION;
    delete process.env.RCE_COMMIT;
    delete process.env.RCE_BUILD_TIME;

    const fixedDate = new Date("2024-05-04T00:00:00.000Z");
    // Freeze time to make the fallback build timestamp predictable.
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);

    const { GET } = await import("./route");
    const response = GET();
    const payload = await response.json();

    // Verify the endpoint returns safe defaults and still tags the response with a version.
    expect(payload.version).toBe("dev");
    expect(payload.commit).toBe("unknown");
    expect(payload.buildTime).toBe(fixedDate.toISOString());
    expect(response.headers.get(VERSION_HEADER_NAME)).toBe("dev");
  });
});
