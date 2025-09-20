import { NextResponse } from 'next/server';

import '@/server/bootstrap';
import { getReadinessStatus } from '@/core/app/system/getReadinessStatus';

export const dynamic = 'force-dynamic';

const CACHE_HEADERS = {
  'cache-control': 'no-store',
};

export async function GET() {
  const readiness = await getReadinessStatus();
  const status = readiness.status === 'ready' ? 200 : 503;

  return NextResponse.json(readiness, {
    status,
    headers: CACHE_HEADERS,
  });
}
