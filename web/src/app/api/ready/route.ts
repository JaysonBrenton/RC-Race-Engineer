import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // If this succeeds, DB is reachable and Prisma is usable → call it "ready".
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, reason: 'DB_ERROR' }, { status: 503 });
  } finally {
    // In dev, letting Prisma reuse the client is fine; no explicit disconnect.
    // In prod/serverless you'd manage this differently.
  }
}
