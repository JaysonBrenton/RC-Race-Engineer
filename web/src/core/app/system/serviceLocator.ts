import type { ReadinessDependencies } from "./ports";

let dependencies: ReadinessDependencies | null = null;

export function registerReadinessDependencies(instance: ReadinessDependencies) {
  dependencies = instance;
}

export function getReadinessDependencies(): ReadinessDependencies {
  if (!dependencies) {
    throw new Error("Readiness dependencies have not been registered");
  }
  return dependencies;
}
