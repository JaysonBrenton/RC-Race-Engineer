/**
 * ========================================================================
 * Author: Jayson + The Brainy One
 * Date: 2025-09-16
 * ========================================================================
 */

import { NextResponse } from "next/server";

import { applyVersionHeader } from "../../../lib/versionHeader";

export function GET() {
  const version = process.env.RCE_VERSION?.trim();
  const commit = process.env.RCE_COMMIT?.trim();
  const buildTime = process.env.RCE_BUILD_TIME?.trim();

  const resolvedVersion = version && version.length > 0 ? version : "dev";
  const resolvedCommit = commit && commit.length > 0 ? commit : "unknown";
  const resolvedBuildTime =
    buildTime && buildTime.length > 0 ? buildTime : new Date().toISOString();

  const response = NextResponse.json({
    version: resolvedVersion,
    commit: resolvedCommit,
    buildTime: resolvedBuildTime,
  });

  return applyVersionHeader(response);
}
