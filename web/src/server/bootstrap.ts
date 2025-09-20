/**
 * File: web/src/server/bootstrap.ts
 * Purpose: Server-only entry point responsible for wiring infrastructure
 *          adapters into the application layer service locators.
 * Notes:  Import this module from API routes or server actions to ensure the
 *          Prisma-backed adapters are registered before handling requests.
 */

"use server";

import "@/core/infra/sessions/prismaSessionRepository";
import "@/core/infra/system/prismaHealthIndicator";
import "@/core/infra/telemetry/prismaTelemetryRepository";
import "@/core/infra/liverc/prismaLiveRcRepository";

// This module wires infra adapters into the application service locators.
// It must only be imported from server-only entry points (API routes, server actions).
