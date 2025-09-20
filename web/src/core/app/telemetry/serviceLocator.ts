/**
 * File: web/src/core/app/telemetry/serviceLocator.ts
 * Purpose: Stores the telemetry repository implementation registered during
 *          server bootstrap so that use-cases can stay decoupled from the
 *          infrastructure wiring.
 */

import type { TelemetryRepository } from "./ports";

let repository: TelemetryRepository | null = null;

export function registerTelemetryRepository(instance: TelemetryRepository) {
  repository = instance;
}

export function getTelemetryRepository(): TelemetryRepository {
  if (!repository) {
    throw new Error("Telemetry repository has not been registered");
  }
  return repository;
}
