/**
 * ============================================================================
 * File: web/app/api/ready/route.ts
 * Purpose: Provide a quick "is the app ready to receive traffic?" signal,
 *          typically used by container orchestrators.
 * Author: Jayson + The Brainy One
 * Last Updated: 2024-05-07
 * ============================================================================
 */

import { NextResponse } from "next/server";

import { applyVersionHeader } from "../../../lib/versionHeader";

export function GET() {
  // Capture the environment name so operations teams can double-check context if needed.
  const envSnapshot = process.env.NODE_ENV ?? "development";

  // Respond with a simple "ready" message.
  const response = NextResponse.json({ ready: true, env: envSnapshot });

  // Stamp the outgoing response with our version header for traceability.
  return applyVersionHeader(response);
}
