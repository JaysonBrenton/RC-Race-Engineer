/**
 * File: web/src/core/app/telemetry/recordTelemetryEvent.ts
 * Purpose: Validates telemetry payloads and persists them via the registered
 *          repository.
 */

import { InvalidTelemetryInputError, validateTelemetryEvent } from "@/core/domain/telemetry";
import type { TelemetrySample } from "@/core/domain/telemetry";
import type { TelemetryDependencies } from "./ports";
import { getTelemetryRepository } from "./serviceLocator";

export async function recordTelemetryEvent(
  sessionId: string,
  payload: unknown,
  deps?: Partial<TelemetryDependencies>,
): Promise<TelemetrySample> {
  let input;
  try {
    input = validateTelemetryEvent(payload);
  } catch (error) {
    if (error instanceof InvalidTelemetryInputError) {
      throw Object.assign(new Error("ValidationError"), { issues: error.issues, status: 400 });
    }
    throw error;
  }

  const { repository } = deps ?? { repository: getTelemetryRepository() };
  if (!repository) {
    throw new Error("Telemetry repository dependency missing");
  }

  return repository.createForSession(sessionId, input);
}
