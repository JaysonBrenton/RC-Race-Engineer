/**
 * File: web/src/app/api/sessions/[sessionId]/events/route.ts
 * Purpose: REST handler for ingesting and listing telemetry samples associated
 *          with a session.
 */

import { NextResponse } from "next/server";

import "@/server/bootstrap";
import { getSession } from "@/core/app/sessions/getSession";
import { listTelemetryForSession } from "@/core/app/telemetry/listTelemetryForSession";
import { recordTelemetryEvent } from "@/core/app/telemetry/recordTelemetryEvent";

export async function GET(request: Request, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  if (limitParam && (Number.isNaN(limit) || limit! <= 0)) {
    return NextResponse.json({ error: "limit must be a positive number" }, { status: 400 });
  }

  try {
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const samples = await listTelemetryForSession(sessionId, { limit, order: "asc" });
    return NextResponse.json({ session, samples });
  } catch (error) {
    console.error("Failed to list telemetry", error);
    return NextResponse.json({ error: "Unable to load telemetry" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    const sample = await recordTelemetryEvent(sessionId, payload);
    return NextResponse.json({ sample }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { error: "Validation failed", issues: (error as { issues: string[] }).issues },
        { status: (error as { status?: number }).status ?? 400 },
      );
    }
    console.error("Failed to record telemetry", error);
    return NextResponse.json({ error: "Unable to record telemetry" }, { status: 500 });
  }
}
