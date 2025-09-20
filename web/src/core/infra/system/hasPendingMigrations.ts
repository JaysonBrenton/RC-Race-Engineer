import { promises as fs } from "node:fs";
import path from "node:path";

import { getPrismaClient } from "@/core/infra/db/prismaClient";

const MIGRATIONS_DIRECTORY = path.resolve(process.cwd(), "..", "prisma", "migrations");

type MigrationDirent = {
  name: string;
  isDirectory(): boolean;
};

type AppliedMigrationRow = {
  migration_name: string;
};

function isTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = (error as { code?: unknown }).code;
  if (code === "P2021") {
    return true;
  }
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && message.includes("_prisma_migrations") && message.includes("does not exist");
}

async function readMigrationDirectories(): Promise<string[] | null> {
  try {
    const entries = (await fs.readdir(MIGRATIONS_DIRECTORY, { withFileTypes: true })) as MigrationDirent[];
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return null;
  }
}

async function readAppliedMigrations(): Promise<AppliedMigrationRow[]> {
  const prisma = getPrismaClient();
  try {
    return await prisma.$queryRaw<AppliedMigrationRow[]>`
      SELECT "migration_name"
      FROM "_prisma_migrations"
      WHERE "finished_at" IS NOT NULL
    `;
  } catch (error) {
    if (isTableMissingError(error)) {
      return [];
    }
    throw error;
  }
}

export async function hasPendingMigrations(): Promise<boolean> {
  const expectedMigrations = await readMigrationDirectories();
  if (!expectedMigrations) {
    return true;
  }
  if (expectedMigrations.length === 0) {
    // No migrations registered on disk implies there is nothing to apply.
    return false;
  }

  const appliedMigrations = await readAppliedMigrations();
  const appliedNames = new Set(appliedMigrations.map((row) => row.migration_name));

  return expectedMigrations.some((name) => !appliedNames.has(name));
}

