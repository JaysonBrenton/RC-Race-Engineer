import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { VERSION_HEADER_NAME, applyVersionHeader } from "./versionHeader";

const ORIGINAL_ENV = process.env;

const createResponse = () => new Response(null);

describe("applyVersionHeader", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("uses the explicit version when provided", () => {
    process.env.RCE_VERSION = " 1.2.3 ";
    process.env.RCE_COMMIT = "ignored";

    const response = applyVersionHeader(createResponse());

    expect(response.headers.get(VERSION_HEADER_NAME)).toBe("1.2.3");
  });

  it("falls back to the commit hash when the version is absent", () => {
    delete process.env.RCE_VERSION;
    process.env.RCE_COMMIT = " abcdef ";

    const response = applyVersionHeader(createResponse());

    expect(response.headers.get(VERSION_HEADER_NAME)).toBe("abcdef");
  });

  it("falls back to dev when neither version nor commit is set", () => {
    delete process.env.RCE_VERSION;
    delete process.env.RCE_COMMIT;

    const response = applyVersionHeader(createResponse());

    expect(response.headers.get(VERSION_HEADER_NAME)).toBe("dev");
  });
});
