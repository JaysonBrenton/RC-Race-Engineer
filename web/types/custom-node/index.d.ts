declare module "node:assert/strict" {
  import assert = require("assert");
  export = assert;
}

declare module "node:test" {
  export type TestFn = (t: unknown) => Promise<void> | void;
  export default function test(name: string, fn: TestFn): Promise<void>;
  export function test(name: string, fn: TestFn): Promise<void>;
}

declare module "node:crypto" {
  export function randomUUID(): string;
}

declare module "node:module" {
  export interface NodeModule {}
  export type NodeRequire = (id: string) => unknown;
  export function createRequire(filename: string | URL): NodeRequire;
  const Module: any;
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
  uptime(): number;
};
