import type { SessionRepository } from "./ports";

let repository: SessionRepository | null = null;

export function registerSessionRepository(instance: SessionRepository) {
  repository = instance;
}

export function getSessionRepository(): SessionRepository {
  if (!repository) {
    throw new Error("Session repository has not been registered");
  }
  return repository;
}
