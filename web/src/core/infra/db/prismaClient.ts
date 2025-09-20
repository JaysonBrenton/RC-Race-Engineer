/**
 * File: web/src/core/infra/db/prismaClient.ts
 * Purpose: Centralises creation of the Prisma client while providing a single
 *          cached instance during development to avoid exhausting database
 *          connections. This module is imported by infra adapters that need
 *          database access.
 * Notes:  The caching pattern mirrors the recommendation from Prisma for
 *          serverless-like environments where hot reloading could instantiate
 *          multiple clients. We deliberately keep logging verbose in
 *          development to aid query analysis.
 */

import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

// The global namespace is leveraged to persist the Prisma client across
// repeated imports when Next.js performs hot module replacement.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Instantiate a single Prisma client. In development we elevate logging to
// include queries, warnings, and errors so that developers can observe the SQL
// being executed without additional tooling.
export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  } satisfies Prisma.PrismaClientOptions);

if (process.env.NODE_ENV !== "production") {
  // Persist the client on the global object so subsequent imports reuse the
  // same instance. Production environments should prefer short-lived clients
  // per request, so we skip caching there.
  globalForPrisma.prisma = prisma;
}
