/**
 * ============================================================================
 * File: web/app/api/ready/route.test.ts
 * Purpose: Clarify the ready endpoint behaviour for anyone reading the tests
 *          without a coding background.
 * Author: Jayson + The Brainy One
 * Last Updated: 2024-05-07
 * ============================================================================
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VERSION_HEADER_NAME } from "../../../lib/versionHeader";

// Mock the JSON response helper so we can test the route logic in isolation.
const jsonMock = vi.fn((payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
  }),
);

vi.mock("next/server", () => ({
  NextResponse: {
    // Whenever the route calls NextResponse.json we return our mocked helper above.
    json: (payload: unknown) => jsonMock(payload),
  },
}));

const ORIGINAL_ENV = process.env;

describe("GET /api/ready", () => {
  beforeEach(() => {
    // Reset the mock call history and clone the environment variables.
    jsonMock.mockClear();
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    // Restore environment variables once the test has finished running.
    process.env = ORIGINAL_ENV;
  });

  it("reports readiness and includes the version header", async () => {
    // Simulate running in production with only a commit hash available.
    delete process.env.RCE_VERSION;
    process.env.RCE_COMMIT = "commit-hash";
    process.env.NODE_ENV = "production";

    const { GET } = await import("./route");
    const response = GET();
    const payload = await response.json();

    // Confirm the endpoint signals readiness and tags the response with version info.
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get(VERSION_HEADER_NAME)).toBe("commit-hash");
    expect(payload.ready).toBe(true);
    expect(payload.env).toBe("production");
  });
});
