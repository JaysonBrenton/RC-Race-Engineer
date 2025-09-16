/**
 * ========================================================================
 * Author: Jayson + The Brainy One
 * Date: 2025-09-16
 * ========================================================================
 */

export const VERSION_HEADER_NAME = "X-RCE-Version";

const determineVersionIdentifier = (): string => {
  const version = process.env.RCE_VERSION?.trim();
  if (version && version.length > 0) {
    return version;
  }

  const commit = process.env.RCE_COMMIT?.trim();
  if (commit && commit.length > 0) {
    return commit;
  }

  return "dev";
};

export const applyVersionHeader = <T extends Response>(response: T): T => {
  response.headers.set(VERSION_HEADER_NAME, determineVersionIdentifier());
  return response;
};
