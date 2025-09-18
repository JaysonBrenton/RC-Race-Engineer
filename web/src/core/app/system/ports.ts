export interface ReadinessProbeResult {
  name: string;
  healthy: boolean;
  durationMs: number;
  details?: string;
}

export interface ReadinessDependencies {
  probes: Array<() => Promise<ReadinessProbeResult>>;
}
