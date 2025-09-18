import type { CreateSessionInput, Session } from "@/core/domain/session";

export interface SessionRepository {
  create(data: CreateSessionInput): Promise<Session>;
  list(): Promise<Session[]>;
}

export interface SessionDependencies {
  repository: SessionRepository;
}
