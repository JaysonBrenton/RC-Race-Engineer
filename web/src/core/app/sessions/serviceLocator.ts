/**
 * File: web/src/core/app/sessions/serviceLocator.ts
 * Purpose: Maintains the session repository instance used by the application
 *          layer. The service locator pattern gives infra adapters a place to
 *          register concrete implementations without leaking them to domain
 *          modules.
 */

import type { SessionRepository } from "./ports";

let repository: SessionRepository | null = null;

export function registerSessionRepository(instance: SessionRepository) {
  // Called during server bootstrap to make the Prisma-backed repository
  // available to use-cases.
  repository = instance;
}

export function getSessionRepository(): SessionRepository {
  if (!repository) {
    throw new Error("Session repository has not been registered");
  }
  // Returning the concrete repository keeps application code decoupled from
  // the instantiation details.
  return repository;
}
