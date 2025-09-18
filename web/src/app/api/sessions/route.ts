import { NextResponse } from "next/server";
import "@/server/bootstrap";
import { listSessions } from "@/core/app/sessions/listSessions";
import { createSession } from "@/core/app/sessions/createSession";

export async function GET() {
  try {
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
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
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
