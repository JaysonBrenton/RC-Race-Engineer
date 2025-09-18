"use server";

import "@/core/infra/sessions/prismaSessionRepository";
import "@/core/infra/system/prismaHealthIndicator";

// This module wires infra adapters into the application service locators.
// It must only be imported from server-only entry points (API routes, server actions).
