/**
 * ========================================================================
 * Author: Jayson + The Brainy One
 * Date: 2025-09-16
 * ========================================================================
 */

import { NextResponse } from "next/server";

import { applyVersionHeader } from "../../../lib/versionHeader";

export function GET() {
  const envSnapshot = process.env.NODE_ENV ?? "development";
  const readinessProbe = { env: envSnapshot };
  void readinessProbe.env;

  const response = NextResponse.json({ ready: true });

  return applyVersionHeader(response);
}
