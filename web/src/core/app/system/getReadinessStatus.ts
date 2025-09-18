import { performance } from "node:perf_hooks";
import type { ReadinessProbeResult, ReadinessDependencies } from "./ports";
import { getReadinessDependencies } from "./serviceLocator";

export interface ReadinessStatus {
  status: "ready" | "degraded";
  timestamp: string;
  checks: ReadinessProbeResult[];
}

export async function getReadinessStatus(
  overrides?: Partial<ReadinessDependencies>,
): Promise<ReadinessStatus> {
  const registered = getReadinessDependencies();
  const probes = overrides?.probes ?? registered.probes;

  const results: ReadinessProbeResult[] = [];
  for (const probe of probes) {
    const started = performance.now();
    try {
      const result = await probe();
      results.push({ ...result, durationMs: result.durationMs ?? performance.now() - started });
    } catch (error) {
      const durationMs = performance.now() - started;
      results.push({
        name: "unknown",
        healthy: false,
        durationMs,
        details: error instanceof Error ? error.message : "Readiness probe failed",
      });
    }
  }

  const status = results.every((check) => check.healthy) ? "ready" : "degraded";

  return {
    status,
    timestamp: new Date().toISOString(),
    checks: results,
  };
}
