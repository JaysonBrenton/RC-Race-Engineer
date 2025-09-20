import "../../../../test/setupAlias";
import assert from "node:assert/strict";
import test from "node:test";
import { promises as fs } from "node:fs";

import { getPrismaClient } from "@/core/infra/db/prismaClient";

import { hasPendingMigrations } from "./hasPendingMigrations";

type DirentLike = {
  name: string;
  isDirectory(): boolean;
};

function patchFs(entries: DirentLike[]) {
  const original = fs.readdir;
  fs.readdir = (async () => entries) as typeof fs.readdir;
  return () => {
    fs.readdir = original;
  };
}

function patchQueryRaw<T>(implementation: () => Promise<T>) {
  const prisma = getPrismaClient();
  const original = prisma.$queryRaw;
  prisma.$queryRaw = (implementation as unknown) as typeof prisma.$queryRaw;
  return () => {
    prisma.$queryRaw = original;
  };
}

test("hasPendingMigrations returns false when all migrations are applied", async () => {
  const restoreFs = patchFs([
    { name: "20250105_init", isDirectory: () => true },
    { name: "20250214_add_liverc_metadata", isDirectory: () => true },
    { name: "migration_lock.toml", isDirectory: () => false },
  ]);

  const restoreQuery = patchQueryRaw(async () => [
    { migration_name: "20250105_init" },
    { migration_name: "20250214_add_liverc_metadata" },
  ]);

  try {
    const pending = await hasPendingMigrations();
    assert.equal(pending, false);
  } finally {
    restoreQuery();
    restoreFs();
  }
});

test("hasPendingMigrations returns true when a migration has not run", async () => {
  const restoreFs = patchFs([
    { name: "20250105_init", isDirectory: () => true },
    { name: "20250214_add_liverc_metadata", isDirectory: () => true },
  ]);

  const restoreQuery = patchQueryRaw(async () => [{ migration_name: "20250105_init" }]);

  try {
    const pending = await hasPendingMigrations();
    assert.equal(pending, true);
  } finally {
    restoreQuery();
    restoreFs();
  }
});

test("hasPendingMigrations treats missing metadata table as pending", async () => {
  const restoreFs = patchFs([{ name: "20250105_init", isDirectory: () => true }]);

  const restoreQuery = patchQueryRaw(async () => {
    const error = new Error("relation \"_prisma_migrations\" does not exist") as Error & { code?: string };
    error.code = "P2021";
    throw error;
  });

  try {
    const pending = await hasPendingMigrations();
    assert.equal(pending, true);
  } finally {
    restoreQuery();
    restoreFs();
  }
});

test("hasPendingMigrations rethrows unexpected database errors", async () => {
  const restoreFs = patchFs([{ name: "20250105_init", isDirectory: () => true }]);

  const restoreQuery = patchQueryRaw(async () => {
    throw new Error("Database unavailable");
  });

  try {
    await assert.rejects(() => hasPendingMigrations(), /Database unavailable/);
  } finally {
    restoreQuery();
    restoreFs();
  }
});
