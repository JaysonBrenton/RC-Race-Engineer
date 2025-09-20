/**
 * File: web/src/core/app/liverc/ports.ts
 * Purpose: Defines the LiveRC application layer contracts so use-cases can
 *          remain agnostic of the underlying persistence mechanism.
 */

import type { LiveRcHeatResult } from "@/core/domain/liverc";

export interface LiveRcRepository {
  listHeatResults(heatId: string): Promise<LiveRcHeatResult[]>;
}

export interface LiveRcDependencies {
  repository: LiveRcRepository | null;
}
