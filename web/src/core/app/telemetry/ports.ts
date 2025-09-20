/**
 * File: web/src/core/app/telemetry/ports.ts
 * Purpose: Declares the contracts infrastructure adapters must satisfy to
 *          support telemetry ingestion and retrieval use-cases.
 */

import type { TelemetryEventInput, TelemetrySample } from "@/core/domain/telemetry";

export interface TelemetryRepository {
  createForSession(sessionId: string, data: TelemetryEventInput): Promise<TelemetrySample>;
  listForSession(sessionId: string, options?: { limit?: number; order?: "asc" | "desc" }): Promise<TelemetrySample[]>;
}

export interface TelemetryDependencies {
  repository: TelemetryRepository;
}
