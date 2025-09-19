import { InvalidSessionInputError, validateCreateSessionInput } from "@/core/domain/session";
import type { Session } from "@/core/domain/session";
import type { SessionDependencies } from "./ports";
import { getSessionRepository } from "./serviceLocator";

export async function createSession(payload: unknown, deps?: Partial<SessionDependencies>): Promise<Session> {
  let input: ReturnType<typeof validateCreateSessionInput>;
  try {
    input = validateCreateSessionInput(payload);
  } catch (error: unknown) {
    if (error instanceof InvalidSessionInputError) {
      throw Object.assign(new Error("ValidationError"), { issues: error.issues, status: 400 });
    }
    throw error;
  }

  const { repository } = deps ?? { repository: getSessionRepository() };
  if (!repository) {
    throw new Error("Session repository dependency missing");
  }

  return repository.create(input);
}
