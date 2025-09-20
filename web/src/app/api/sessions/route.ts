/**
 * File: web/src/app/api/sessions/route.ts
 * Purpose: Implements the REST surface for listing and creating sessions. This
 *          route wires the application layer use-cases to the Next.js API
 *          runtime and ensures that the infra bootstrap executes before
 *          handling requests.
 * Notes:  We return structured JSON for both success and error cases so the
 *          front-end can present meaningful feedback without parsing strings.
 */

import { NextResponse } from "next/server";
import "@/server/bootstrap";
import { listSessions } from "@/core/app/sessions/listSessions";
import { createSession } from "@/core/app/sessions/createSession";

export async function GET() {
  try {
    // The use-case abstracts persistence, so the handler simply forwards the
    // result to the caller.
    const sessions = await listSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Failed to list sessions", error);
    return NextResponse.json({ error: "Unable to load sessions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    // Provide an explicit message when the client sends malformed JSON, which
    // helps them troubleshoot without digging into logs.
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // Validation occurs inside the use-case so we can surface consistent error
    // structures from a single location.
    const session = await createSession(payload);
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ error: "Validation failed", issues: (error as { issues: string[] }).issues }, { status: 400 });
    }
    console.error("Failed to create session", error);
    return NextResponse.json({ error: "Unable to create session" }, { status: 500 });
  }
}
