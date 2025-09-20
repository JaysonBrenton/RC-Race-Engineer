export interface TelemetryLoadingGuardInput {
  selectedSessionId: string | null;
  normalizedSessionId: string | null;
  sessionMatchingNormalized: { id: string } | null;
}

export function shouldLoadTelemetry({
  selectedSessionId,
  normalizedSessionId,
  sessionMatchingNormalized,
}: TelemetryLoadingGuardInput): boolean {
  if (selectedSessionId == null) {
    return false;
  }

  if (normalizedSessionId === null) {
    return true;
  }

  return sessionMatchingNormalized !== null;
}
