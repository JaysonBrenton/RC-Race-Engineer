/* eslint-disable @typescript-eslint/no-explicit-any */
import Module from "node:module";
import type { NodeModule } from "node:module";
import path from "node:path";

const originalResolve = (Module as any)._resolveFilename as (
  request: string,
  parent: NodeModule | undefined,
  isMain: boolean,
  options: unknown,
) => string;

const compiledRoot = path.resolve(__dirname, "..");

(Module as any)._resolveFilename = function patchedResolve(
  request: string,
  parent: NodeModule | undefined,
  isMain: boolean,
  options: unknown,
): string {
  if (request.startsWith("@/")) {
    const target = path.join(compiledRoot, "src", request.slice(2));
    return originalResolve.call(this, target, parent, isMain, options);
  }
  if (request === "@prisma/client") {
    const target = path.join(compiledRoot, "src", "stubs", "prisma-client");
    return originalResolve.call(this, target, parent, isMain, options);
  }
  return originalResolve.call(this, request, parent, isMain, options);
};
