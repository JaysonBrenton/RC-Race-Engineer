/**
 * ========================================================================
 * Author: Jayson + The Brainy One
 * Date: 2025-09-16
 * ========================================================================
 */

import { NextResponse } from "next/server";

import { applyVersionHeader } from "../../../lib/versionHeader";

export function GET() {
  const payload = {
    status: "ok",
    time: new Date().toISOString(),
  };

  const response = NextResponse.json(payload);

  return applyVersionHeader(response);
}
