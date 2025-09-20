/**
 * File: web/src/core/domain/liverc.ts
 * Purpose: Defines read-model types for LiveRC metadata so application and UI
 *          layers can rely on a stable contract without leaking Prisma shapes.
 */

export interface LiveRcHeatResult {
  id: string;
  heatId: string;
  entryId: string;
  driverName: string;
  carNumber: string | null;
  sponsor: string | null;
  vehicle: string | null;
  hometownCity: string | null;
  hometownRegion: string | null;
  finishPosition: number | null;
  lapsCompleted: number | null;
  totalTimeMs: number | null;
  fastLapMs: number | null;
  intervalMs: number | null;
  status: string | null;
}

export function compareLiveRcResults(a: LiveRcHeatResult, b: LiveRcHeatResult): number {
  if (a.finishPosition != null && b.finishPosition != null && a.finishPosition !== b.finishPosition) {
    return a.finishPosition - b.finishPosition;
  }
  if (a.fastLapMs != null && b.fastLapMs != null && a.fastLapMs !== b.fastLapMs) {
    return a.fastLapMs - b.fastLapMs;
  }
  return a.driverName.localeCompare(b.driverName);
}
