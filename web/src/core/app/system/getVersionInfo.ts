export interface VersionInfo {
  version: string;
  buildTimestamp: string;
  commit?: string;
}

export function getVersionInfo(): VersionInfo {
  const version =
    process.env.APP_VERSION || process.env.npm_package_version || process.env.VERCEL_GIT_COMMIT_SHA || "dev";
  const commit = process.env.GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || undefined;

  return {
    version,
    buildTimestamp: new Date().toISOString(),
    commit,
  };
}
