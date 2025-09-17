/**
 * ============================================================================
 * File: web/lib/versionHeader.test.ts
 * Purpose: Explain in plain language how the version header helper behaves
 *          across the different environment variable combinations we expect.
 * Author: Jayson + The Brainy One
 * Last Updated: 2024-05-07
 * ============================================================================
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { VERSION_HEADER_NAME, applyVersionHeader } from "./versionHeader";

const ORIGINAL_ENV = process.env;

const createResponse = () => new Response(null);

describe("applyVersionHeader", () => {
  beforeEach(() => {
    // Give each test a fresh copy of the environment variables to avoid leaks.
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    // Restore whatever real values were present before the test ran.
    process.env = ORIGINAL_ENV;
  });

  it("uses the explicit version when provided", () => {
    // Pretend the deployment provided a human-friendly version string.
    process.env.RCE_VERSION = " 1.2.3 ";
    process.env.RCE_COMMIT = "ignored";

    const response = applyVersionHeader(createResponse());

    expect(response.headers.get(VERSION_HEADER_NAME)).toBe("1.2.3");
  });

  it("falls back to the commit hash when the version is absent", () => {
    // Remove the version but leave a git commit hash to verify the fallback.
    delete process.env.RCE_VERSION;
    process.env.RCE_COMMIT = " abcdef ";

    const response = applyVersionHeader(createResponse());

    expect(response.headers.get(VERSION_HEADER_NAME)).toBe("abcdef");
  });

  it("falls back to dev when neither version nor commit is set", () => {
    // With no environment data available we should end up on the "dev" label.
    delete process.env.RCE_VERSION;
    delete process.env.RCE_COMMIT;

    const response = applyVersionHeader(createResponse());

    expect(response.headers.get(VERSION_HEADER_NAME)).toBe("dev");
  });
});
