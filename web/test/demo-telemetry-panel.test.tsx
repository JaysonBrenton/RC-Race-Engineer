import "./setupAlias";
import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

mock.module("next/navigation", () => ({
  useRouter: () => ({
    refresh: () => {},
  }),
}));

mock.module("@/app/_components/ToastProvider", () => ({
  useToast: () => ({
    notify: () => {},
  }),
}));

test("DemoTelemetryPanel renders placeholder route without crashing", async () => {
  const { DemoTelemetryPanel } = await import("@/app/_components/DemoTelemetryPanel");

  assert.doesNotThrow(() => {
    renderToStaticMarkup(<DemoTelemetryPanel session={null} />);
  });

  const markup = renderToStaticMarkup(<DemoTelemetryPanel session={null} />);
  assert.match(markup, /\/api\/sessions\/\{id\}\/events/);
});
