/**
 * File: web/src/core/app/liverc/listHeatResults.ts
 * Purpose: Application use-case retrieving LiveRC heat results so UI layers
 *          can remain unaware of persistence concerns.
 */

import type { LiveRcDependencies } from "./ports";
import { getLiveRcRepository } from "./serviceLocator";

export async function listHeatResults(
  heatId: string,
  deps?: Partial<LiveRcDependencies>,
) {
  if (!heatId) {
    throw new Error("heatId is required to list LiveRC results");
  }

  const { repository = getLiveRcRepository() } = deps ?? {};
  if (!repository) {
    throw new Error("LiveRC repository dependency missing");
  }

  return repository.listHeatResults(heatId);
}
