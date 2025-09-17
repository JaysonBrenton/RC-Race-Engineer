/**
 * ============================================================================
 * File: web/app/api/version/route.ts
 * Purpose: Share the build metadata (version number, commit hash, build time)
 *          in a friendly JSON format for dashboards and curious readers.
 * Author: Jayson + The Brainy One
 * Last Updated: 2024-05-07
 * ============================================================================
 */

import { NextResponse } from "next/server";

import { applyVersionHeader } from "../../../lib/versionHeader";

export function GET() {
  // Pull out and tidy up any build details that were provided via environment variables.
  const version = process.env.RCE_VERSION?.trim();
  const commit = process.env.RCE_COMMIT?.trim();
  const buildTime = process.env.RCE_BUILD_TIME?.trim();

  // Provide human-friendly fallbacks so the endpoint always responds with something meaningful.
  const resolvedVersion = version && version.length > 0 ? version : "dev";
  const resolvedCommit = commit && commit.length > 0 ? commit : "unknown";
  const resolvedBuildTime =
    buildTime && buildTime.length > 0 ? buildTime : new Date().toISOString();

  // Wrap the metadata in a JSON response that Next.js knows how to send.
  const response = NextResponse.json({
    version: resolvedVersion,
    commit: resolvedCommit,
    buildTime: resolvedBuildTime,
  });

  // Tag the outgoing response with the same version header the rest of the app uses.
  return applyVersionHeader(response);
}
