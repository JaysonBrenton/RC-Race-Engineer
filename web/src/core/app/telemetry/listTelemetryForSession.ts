/**
 * File: web/src/core/app/telemetry/listTelemetryForSession.ts
 * Purpose: Retrieves a bounded window of telemetry samples for a session.
 */

import type { TelemetrySample } from "@/core/domain/telemetry";
import type { TelemetryDependencies } from "./ports";
import { getTelemetryRepository } from "./serviceLocator";

export async function listTelemetryForSession(
  sessionId: string,
  options?: { limit?: number; order?: "asc" | "desc" },
  deps?: Partial<TelemetryDependencies>,
): Promise<TelemetrySample[]> {
  const { repository } = deps ?? { repository: getTelemetryRepository() };
  if (!repository) {
    throw new Error("Telemetry repository dependency missing");
  }
  return repository.listForSession(sessionId, options);
}
