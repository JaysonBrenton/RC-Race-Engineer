/**
 * File: web/src/core/infra/system/prismaHealthIndicator.ts
 * Purpose: Registers a Prisma-backed readiness probe that verifies database
 *          connectivity for the health endpoints.
 */

import { performance } from "node:perf_hooks";
import { getPrismaClient } from "@/core/infra/db/prismaClient";
import type { ReadinessProbeResult } from "@/core/app/system/ports";
import { registerReadinessDependencies } from "@/core/app/system/serviceLocator";
import { hasPendingMigrations } from "./hasPendingMigrations";

export async function databaseProbe(): Promise<ReadinessProbeResult> {
  const started = performance.now();
  try {
    // A lightweight `SELECT 1` ensures connectivity without impacting
    // production traffic or requiring table-level access.
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    const pendingMigrations = await hasPendingMigrations();
    const durationMs = performance.now() - started;
    if (pendingMigrations) {
      return {
        name: "database",
        healthy: false,
        durationMs,
        details: "Pending database migrations",
      };
    }
    return {
      name: "database",
      healthy: true,
      durationMs,
    };
  } catch (error) {
    const durationMs = performance.now() - started;
    return {
      name: "database",
      healthy: false,
      durationMs,
      // Surface the underlying error message when available so operators have a
      // head start on diagnosing outages.
      details: error instanceof Error ? error.message : "Database probe failed",
    };
  }
}

// Register the probe so health endpoints can fan it out alongside any future
// diagnostics.
registerReadinessDependencies({
  probes: [databaseProbe],
});
