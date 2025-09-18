import { NextResponse } from "next/server";
import "@/server/bootstrap";
import { getReadinessStatus } from "@/core/app/system/getReadinessStatus";

export async function GET() {
  const readiness = await getReadinessStatus();
  const statusCode = readiness.status === "ready" ? 200 : 503;
  return NextResponse.json(readiness, { status: statusCode });
}
