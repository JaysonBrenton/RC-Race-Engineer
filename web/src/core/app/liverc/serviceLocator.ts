/**
 * File: web/src/core/app/liverc/serviceLocator.ts
 * Purpose: Lightweight registry wiring the LiveRC repository so application
 *          use-cases can resolve their dependencies without importing infra
 *          modules directly.
 */

import type { LiveRcRepository } from "./ports";

let repository: LiveRcRepository | null = null;

export function registerLiveRcRepository(instance: LiveRcRepository) {
  repository = instance;
}

export function getLiveRcRepository(): LiveRcRepository | null {
  return repository;
}
