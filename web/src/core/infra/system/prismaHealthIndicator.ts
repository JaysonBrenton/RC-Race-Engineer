import { performance } from "node:perf_hooks";
import { prisma } from "@/core/infra/db/prismaClient";
import type { ReadinessProbeResult } from "@/core/app/system/ports";
import { registerReadinessDependencies } from "@/core/app/system/serviceLocator";

export async function databaseProbe(): Promise<ReadinessProbeResult> {
  const started = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      name: "database",
      healthy: true,
      durationMs: performance.now() - started,
    };
  } catch (error) {
    return {
      name: "database",
      healthy: false,
      durationMs: performance.now() - started,
      details: error instanceof Error ? error.message : "Database probe failed",
    };
  }
}

registerReadinessDependencies({
  probes: [databaseProbe],
});
