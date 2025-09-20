/**
 * File: web/src/core/app/sessions/getSession.ts
 * Purpose: Retrieves a single session by id through the registered repository.
 */

import type { Session } from "@/core/domain/session";
import type { SessionDependencies } from "./ports";
import { getSessionRepository } from "./serviceLocator";

export async function getSession(id: string, deps?: Partial<SessionDependencies>): Promise<Session | null> {
  const { repository } = deps ?? { repository: getSessionRepository() };
  if (!repository) {
    throw new Error("Session repository dependency missing");
  }
  return repository.getById(id);
}
