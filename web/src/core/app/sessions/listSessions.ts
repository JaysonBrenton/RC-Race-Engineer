/**
 * File: web/src/core/app/sessions/listSessions.ts
 * Purpose: Application use-case responsible for retrieving the most recent
 *          sessions. The function enforces dependency availability and shields
 *          the API layer from the underlying persistence implementation.
 */

import type { Session } from "@/core/domain/session";
import type { SessionDependencies } from "./ports";
import { getSessionRepository } from "./serviceLocator";

export async function listSessions(deps?: Partial<SessionDependencies>): Promise<Session[]> {
  // Allow tests to supply a stub repository while defaulting to the registered
  // Prisma-backed implementation in production code paths.
  const { repository } = deps ?? { repository: getSessionRepository() };
  if (!repository) {
    throw new Error("Session repository dependency missing");
  }
  // The repository encapsulates ordering and inclusion logic, so the use-case
  // simply returns the collection.
  return repository.list();
}
