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

describe("GET /api/ready", () => {
  beforeEach(() => {
    jsonMock.mockClear();
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("reports readiness and includes the version header", async () => {
    delete process.env.RCE_VERSION;
    process.env.RCE_COMMIT = "commit-hash";
    process.env.NODE_ENV = "production";

    const { GET } = await import("./route");
    const response = GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get(VERSION_HEADER_NAME)).toBe("commit-hash");
    expect(payload.ready).toBe(true);
  });
});
