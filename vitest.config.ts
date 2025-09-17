/**
 * ============================================================================
 * File: vitest.config.ts
 * Purpose: Explain how our test runner (Vitest) is configured so newcomers can
 *          tweak settings with confidence.
 * Author: Jayson + The Brainy One
 * Last Updated: 2024-05-07
 * ============================================================================
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Run tests in a Node-like environment since our code targets APIs.
    environment: "node",
    // Make Vitest behave like Jest by automatically exposing global test helpers.
    globals: true,
    coverage: {
      // Emit coverage reports in the terminal and as an HTML document.
      reporter: ["text", "html"],
    },
  },
});
