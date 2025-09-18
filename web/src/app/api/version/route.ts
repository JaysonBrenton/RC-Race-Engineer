import { NextResponse } from "next/server";
import { getVersionInfo } from "@/core/app/system/getVersionInfo";

export function GET() {
  return NextResponse.json(getVersionInfo());
}
