declare module "node:assert/strict" {
const assertStrict: typeof import("node:assert/strict");
export = assertStrict;
}

declare module "node:test" {
  export interface MockTimers {
    enable(options?: { apis?: string[] }): void;
    tick(milliseconds: number): void;
    reset(): void;
  }

  export interface MockTracker {
    timers: MockTimers;
    fn: <T extends (...args: any[]) => any>(implementation?: T) => T & {
      mock: {
        calls: Array<{ arguments: Parameters<T> }>;
      };
    };
    module: (specifier: string, factory: () => Record<string, unknown>) => void;
    reset: () => void;
    restoreAll: () => void;
  }

  export const mock: MockTracker;

  export interface TestContext {
    mock: MockTracker;
  }

  export type TestFn = (t: TestContext) => Promise<void> | void;
  export default function test(name: string, fn: TestFn): Promise<void>;
  export function test(name: string, fn: TestFn): Promise<void>;
}

declare module "node:crypto" {
  export function randomUUID(): string;
}

declare module "node:fs" {
  export type Dirent = {
    name: string;
    isDirectory(): boolean;
  };

  export const promises: {
    readdir(path: string, options: { withFileTypes: true }): Promise<Dirent[]>;
  };
}

declare module "node:module" {
  export interface NodeModule {
    id: string;
  }
  export type NodeRequire = (id: string) => unknown;
  export function createRequire(filename: string | URL): NodeRequire;
  const Module: unknown;
  export default Module;
}

declare module "node:path" {
  export function resolve(...segments: string[]): string;
  export function join(...segments: string[]): string;
}

declare module "node:perf_hooks" {
  export const performance: {
    now(): number;
  };
}


declare const __dirname: string;
declare const __filename: string;

declare const process: {
  env: Record<string, string | undefined>;
  cwd(): string;
  uptime(): number;
};
