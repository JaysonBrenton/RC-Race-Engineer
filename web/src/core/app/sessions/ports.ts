/**
 * File: web/src/core/app/sessions/ports.ts
 * Purpose: Declares the contracts that infrastructure adapters must implement
 *          to satisfy the session application use-cases.
 */

import type { CreateSessionInput, Session } from "@/core/domain/session";

export interface SessionRepository {
  // Persist a new session and return the hydrated representation used by the
  // rest of the application.
  create(data: CreateSessionInput): Promise<Session>;
  // Retrieve a slice of sessions, typically the most recent records.
  list(): Promise<Session[]>;
}

export interface SessionDependencies {
  repository: SessionRepository;
}
