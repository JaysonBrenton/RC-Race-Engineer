/**
 * ============================================================================
 * File: web/lib/versionHeader.ts
 * Purpose: Central place for figuring out which version/commit should be
 *          stamped onto every HTTP response the app sends.
 * Author: Jayson + The Brainy One
 * Last Updated: 2024-05-07
 * ============================================================================
 */

export const VERSION_HEADER_NAME = "X-RCE-Version";

const determineVersionIdentifier = (): string => {
  // Look for an explicit version string provided at deploy time.
  const version = process.env.RCE_VERSION?.trim();
  if (version && version.length > 0) {
    return version;
  }

  // Fall back to the git commit hash when a version string is unavailable.
  const commit = process.env.RCE_COMMIT?.trim();
  if (commit && commit.length > 0) {
    return commit;
  }

  // When neither value is present we identify responses as coming from dev builds.
  return "dev";
};

export const applyVersionHeader = <T extends Response>(response: T): T => {
  // Attach the best available version identifier to the outgoing response headers.
  response.headers.set(VERSION_HEADER_NAME, determineVersionIdentifier());
  return response;
};
