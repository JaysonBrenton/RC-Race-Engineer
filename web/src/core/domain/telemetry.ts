/**
 * File: web/src/core/domain/telemetry.ts
 * Purpose: Defines the canonical telemetry domain model along with the
 *          validation helpers used by the ingestion use-cases.
 */

import { z } from "zod";

export interface TelemetrySample {
  id: string;
  sessionId: string;
  recordedAt: string;
  speedKph: number | null;
  throttlePct: number | null;
  brakePct: number | null;
  rpm: number | null;
  gear: number | null;
  createdAt: string;
}

export const telemetryEventSchema = z
  .object({
    recordedAt: z
      .union([z.string(), z.date()])
      .transform((value) => (value instanceof Date ? value : new Date(value)))
      .pipe(z.date())
      .transform((value) => value.toISOString()),
    speedKph: z
      .number()
      .min(0, "speedKph must be >= 0")
      .max(450, "speedKph must be <= 450")
      .nullable()
      .optional(),
    throttlePct: z
      .number()
      .min(0, "throttlePct must be between 0 and 100")
      .max(100, "throttlePct must be between 0 and 100")
      .nullable()
      .optional(),
    brakePct: z
      .number()
      .min(0, "brakePct must be between 0 and 100")
      .max(100, "brakePct must be between 0 and 100")
      .nullable()
      .optional(),
    rpm: z
      .number()
      .int("rpm must be an integer")
      .min(0, "rpm must be >= 0")
      .max(30000, "rpm must be <= 30000")
      .nullable()
      .optional(),
    gear: z
      .number()
      .int("gear must be an integer")
      .min(-1, "gear must be >= -1")
      .max(12, "gear must be <= 12")
      .nullable()
      .optional(),
  })
  .transform((value) => ({
    recordedAt: value.recordedAt,
    speedKph: coerceNullable(value.speedKph),
    throttlePct: coerceNullable(value.throttlePct),
    brakePct: coerceNullable(value.brakePct),
    rpm: coerceNullable(value.rpm),
    gear: coerceNullable(value.gear),
  }));

export type TelemetryEventInput = z.infer<typeof telemetryEventSchema>;

export class InvalidTelemetryInputError extends Error {
  public readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid telemetry input: ${issues.join(", ")}`);
    this.name = "InvalidTelemetryInputError";
    this.issues = issues;
  }
}

export function validateTelemetryEvent(payload: unknown): TelemetryEventInput {
  const parseResult = telemetryEventSchema.safeParse(payload);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((issue) => issue.message);
    throw new InvalidTelemetryInputError(issues);
  }
  return parseResult.data;
}

function coerceNullable<T>(value: T | null | undefined): T | null {
  if (value == null) {
    return null;
  }
  return value;
}
