/**
 * File: web/src/core/app/sessions/createSession.ts
 * Purpose: Coordinates validation and persistence for new sessions. It
 *          transforms validation errors into a format the API layer can surface
 *          and delegates storage to the registered repository implementation.
 */

import { InvalidSessionInputError, validateCreateSessionInput } from "@/core/domain/session";
import type { Session } from "@/core/domain/session";
import type { SessionDependencies } from "./ports";
import { getSessionRepository } from "./serviceLocator";

export async function createSession(payload: unknown, deps?: Partial<SessionDependencies>): Promise<Session> {
  let input: ReturnType<typeof validateCreateSessionInput>;
  try {
    // Validation resides in the domain layer to keep rules close to the core
    // types. We capture and rethrow domain validation errors with metadata so
    // transport layers can render structured feedback.
    input = validateCreateSessionInput(payload);
  } catch (error: unknown) {
    if (error instanceof InvalidSessionInputError) {
      throw Object.assign(new Error("ValidationError"), { issues: error.issues, status: 400 });
    }
    throw error;
  }

  // Support dependency injection for tests while defaulting to the globally
  // registered repository resolved during bootstrap.
  const { repository } = deps ?? { repository: getSessionRepository() };
  if (!repository) {
    throw new Error("Session repository dependency missing");
  }

  // Persist the validated session and return the enriched representation from
  // the repository (which may hydrate LiveRC metadata).
  return repository.create(input);
}
