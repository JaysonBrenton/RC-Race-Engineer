import type { Session } from "@/core/domain/session";
import type { SessionDependencies } from "./ports";
import { getSessionRepository } from "./serviceLocator";

export async function listSessions(deps?: Partial<SessionDependencies>): Promise<Session[]> {
  const { repository } = deps ?? { repository: getSessionRepository() };
  if (!repository) {
    throw new Error("Session repository dependency missing");
  }
  return repository.list();
}
