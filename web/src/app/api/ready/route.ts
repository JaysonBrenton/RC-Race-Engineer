import { NextResponse } from "next/server";
import "@/server/bootstrap";
import { getReadinessStatus } from "@/core/app/system/getReadinessStatus";
import { hasPendingMigrations } from "@/core/infra/system/hasPendingMigrations";

export async function GET() {
  try {
    if (await hasPendingMigrations()) {
      return NextResponse.json({ ok: false, reason: "DB_NOT_MIGRATED" }, { status: 503 });
    }
  } catch {
    // If the migration check cannot be completed, fall back to the standard readiness response.
  }

  const readiness = await getReadinessStatus();
  const statusCode = readiness.status === "ready" ? 200 : 503;
  return NextResponse.json(readiness, { status: statusCode });
}
