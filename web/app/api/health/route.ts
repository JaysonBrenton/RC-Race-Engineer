/**
 * ============================================================================
 * File: web/app/api/health/route.ts
 * Purpose: Lightweight "is the service alive?" endpoint for uptime monitors
 *          and curious humans to check at any time.
 * Author: Jayson + The Brainy One
 * Last Updated: 2024-05-07
 * ============================================================================
 */

import { NextResponse } from "next/server";

import { applyVersionHeader } from "../../../lib/versionHeader";

export function GET() {
  // Provide a clear status flag and the current time so folks know we are responsive.
  const payload = {
    status: "ok",
    time: new Date().toISOString(),
  };

  // Build a JSON response using Next.js helpers.
  const response = NextResponse.json(payload);

  // Add the application version header before sending the response back.
  return applyVersionHeader(response);
}
