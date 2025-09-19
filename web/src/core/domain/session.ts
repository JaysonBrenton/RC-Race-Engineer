export const SESSION_KINDS = [
  "FP1",
  "FP2",
  "FP3",
  "PRACTICE",
  "QUALIFYING",
  "RACE",
  "TEST",
  "OTHER",
] as const;

export type SessionKind = (typeof SESSION_KINDS)[number];

export const SESSION_STATUSES = ["SCHEDULED", "LIVE", "COMPLETE", "CANCELLED"] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const TIMING_PROVIDERS = ["MANUAL", "LIVE_RC"] as const;

export type TimingProvider = (typeof TIMING_PROVIDERS)[number];

export interface SessionLiveRcMetadata {
  heatId: string;
  heatExternalId: number;
  label: string;
  round: number | null;
  attempt: number | null;
  scheduledStart: string | null;
  durationSeconds: number | null;
  status: string | null;
  liveStreamUrl: string | null;
  class:
    | {
        id: string;
        externalClassId: number;
        name: string;
      }
    | null;
  event: {
    id: string;
    externalEventId: number;
    title: string;
    trackName: string | null;
    facility: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    timeZone: string | null;
    startTime: string | null;
    endTime: string | null;
    website: string | null;
  } | null;
}

export interface Session {
  id: string;
  name: string;
  description: string | null;
  kind: SessionKind;
  status: SessionStatus;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  timingProvider: TimingProvider;
  liveRc: SessionLiveRcMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionInput {
  name: string;
  description?: string | null;
  kind: SessionKind;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  timingProvider?: TimingProvider;
  liveRcHeatId?: string | null;
}

export function isSessionKind(value: string): value is SessionKind {
  return (SESSION_KINDS as readonly string[]).includes(value);
}

export function isSessionStatus(value: string): value is SessionStatus {
  return (SESSION_STATUSES as readonly string[]).includes(value);
}

export function isTimingProvider(value: string): value is TimingProvider {
  return (TIMING_PROVIDERS as readonly string[]).includes(value);
}

export class InvalidSessionInputError extends Error {
  public readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid session input: ${issues.join(", ")}`);
    this.name = "InvalidSessionInputError";
    this.issues = issues;
  }
}

export function validateCreateSessionInput(payload: unknown): CreateSessionInput {
  const issues: string[] = [];
  const data = (typeof payload === "object" && payload !== null ? payload : {}) as Record<string, unknown>;

  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) {
    issues.push("name is required");
  } else if (name.length > 120) {
    issues.push("name must be 120 characters or fewer");
  }

  let description: string | null = null;
  if (typeof data.description === "string") {
    description = data.description.trim();
    if (description.length > 500) {
      issues.push("description must be 500 characters or fewer");
    }
    if (description.length === 0) {
      description = null;
    }
  } else if (data.description != null) {
    issues.push("description must be a string when provided");
  }

  const kind = typeof data.kind === "string" ? data.kind.toUpperCase() : "";
  if (!isSessionKind(kind)) {
    issues.push("kind must be a recognised session kind");
  }

  const scheduledStartRaw = data.scheduledStart;
  const scheduledEndRaw = data.scheduledEnd;
  const scheduledStart = coerceIsoDate(scheduledStartRaw, "scheduledStart", issues);
  const scheduledEnd = coerceIsoDate(scheduledEndRaw, "scheduledEnd", issues);

  if (scheduledStart && scheduledEnd && new Date(scheduledEnd).getTime() < new Date(scheduledStart).getTime()) {
    issues.push("scheduledEnd must be after scheduledStart");
  }

  let timingProvider: TimingProvider = "MANUAL";
  if (typeof data.timingProvider === "string") {
    const candidate = data.timingProvider.toUpperCase();
    if (isTimingProvider(candidate)) {
      timingProvider = candidate;
    } else {
      issues.push("timingProvider must be MANUAL or LIVE_RC");
    }
  } else if (data.timingProvider != null) {
    issues.push("timingProvider must be a string when provided");
  }

  let liveRcHeatId: string | null = null;
  if (data.liveRcHeatId != null) {
    if (typeof data.liveRcHeatId !== "string" || data.liveRcHeatId.trim().length === 0) {
      issues.push("liveRcHeatId must be a non-empty string when provided");
    } else {
      liveRcHeatId = data.liveRcHeatId.trim();
    }
  }

  if (timingProvider === "LIVE_RC" && !liveRcHeatId) {
    issues.push("liveRcHeatId is required when timingProvider is LIVE_RC");
  }

  if (issues.length > 0 || !isSessionKind(kind)) {
    throw new InvalidSessionInputError(issues);
  }

  return {
    name,
    description,
    kind,
    scheduledStart,
    scheduledEnd,
    timingProvider,
    liveRcHeatId,
  };
}

function coerceIsoDate(value: unknown, field: string, issues: string[]): string | null {
  if (value == null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    issues.push(`${field} must be an ISO-8601 string`);
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    issues.push(`${field} must be a valid ISO-8601 timestamp`);
    return null;
  }
  return parsed.toISOString();
}
