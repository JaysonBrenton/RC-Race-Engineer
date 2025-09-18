import { NextResponse } from "next/server";
import { getHealthStatus } from "@/core/app/system/getHealthStatus";

export function GET() {
  return NextResponse.json(getHealthStatus());
}
