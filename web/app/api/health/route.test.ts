/**
 * ============================================================================
 * File: web/app/api/health/route.test.ts
 * Purpose: Walk readers through the health endpoint behaviour so it is crystal
 *          clear what happens when our monitoring tools hit the route.
 * Author: Jayson + The Brainy One
 * Last Updated: 2024-05-07
 * ============================================================================
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VERSION_HEADER_NAME } from "../../../lib/versionHeader";

// Create a fake version of NextResponse.json so we can test without Next.js running.
const jsonMock = vi.fn((payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
  }),
);

vi.mock("next/server", () => ({
  NextResponse: {
    // When the route asks for NextResponse.json we hand back our simple helper above.
    json: (payload: unknown) => jsonMock(payload),
  },
}));

const ORIGINAL_ENV = process.env;

describe("GET /api/health", () => {
  beforeEach(() => {
    // Start each test run with clean mocks and a copy of the environment variables.
    jsonMock.mockClear();
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    // Undo any temporary changes we made to environment variables during the test.
    process.env = ORIGINAL_ENV;
  });

  it("returns an ok status, timestamp, and version header", async () => {
    // Pretend the deployment pipeline has set a friendly version string.
    process.env.RCE_VERSION = "test-version";

    const { GET } = await import("./route");
    const response = GET();
    const payload = await response.json();

    // Check that the response looks healthy and that it carries our version stamp.
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get(VERSION_HEADER_NAME)).toBe("test-version");
    expect(payload.status).toBe("ok");
    expect(typeof payload.time).toBe("string");
    expect(Number.isNaN(Date.parse(payload.time))).toBe(false);
  });
});
