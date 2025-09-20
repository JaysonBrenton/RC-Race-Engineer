/**
 * File: web/src/app/_components/DemoTelemetryPanel.tsx
 * Purpose: Provides a client-side control for posting synthetic telemetry
 *          samples to the API when validating ingest flows.
 * Notable behaviours: Posts demo events to `/api/sessions/{id}/events`, shows
 *                    toast feedback, and refreshes the router after successful
 *                    injection.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { Session } from "@/core/domain/session";
import { useToast } from "./ToastProvider";
import type { ToastContextValue } from "./ToastProvider";

export function DemoTelemetryPanel({ session }: { session: Session | null }) {
  const { notify } = useToast();
  const [isPending, startTransition] = useTransition();
  const [sending, setSending] = useState(false);
  const router = useRouter();

  const disabled = !session || isPending || sending;

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <header className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold">Demo telemetry injector</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Use this tool to simulate speed/throttle/brake samples for validation. Each trigger posts a burst of synthetic events to
          the telemetry API for the selected session.
        </p>
      </header>
      <div className="space-y-3">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-speed px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-speed-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-speed disabled:cursor-not-allowed disabled:bg-neutral-400"
          onClick={() =>
            session &&
            triggerDemo(session.id, {
              setSending,
              startTransition,
              notify,
              router,
            })
          }
          disabled={disabled}
        >
          {disabled ? "Select a session" : sending ? "Injecting…" : "Inject 5 sample events"}
        </button>
        <p className="text-xs text-neutral-500 dark:text-neutral-500">
          Payloads respect the validation schema (ISO timestamps, bounded throttle/brake). Inspect the Network panel or run curl
          against <code className="text-xs font-mono text-neutral-700 dark:text-neutral-300">/api/sessions/{"{id}"}/events</code> to
          wire up your own source.
        </p>
      </div>
    </section>
  );
}

function triggerDemo(
  sessionId: string,
  {
    setSending,
    startTransition,
    notify,
    router,
  }: {
    setSending: (value: boolean) => void;
    startTransition: (callback: () => void) => void;
    notify: ToastContextValue["notify"];
    router: ReturnType<typeof useRouter>;
  },
) {
  setSending(true);
  const now = Date.now();
  const samples = Array.from({ length: 5 }).map((_, index) => {
    const timestamp = new Date(now + index * 200).toISOString();
    const speed = 80 + Math.random() * 60;
    const throttle = 30 + Math.random() * 50;
    const brake = Math.max(0, 5 - index * 2 + Math.random() * 10);
    const rpm = 7000 + Math.random() * 4000;
    const gear = 3 + Math.floor(Math.random() * 3);
    return { recordedAt: timestamp, speedKph: Math.round(speed * 10) / 10, throttlePct: Math.round(throttle), brakePct: Math.round(brake), rpm: Math.round(rpm), gear };
  });

  const requests = samples.map((sample) =>
    fetch(`/api/sessions/${sessionId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sample),
    }),
  );

  Promise.all(requests)
    .then((responses) => {
      const failed = responses.find((response) => !response.ok);
      if (failed) {
        throw new Error(`API responded with ${failed.status}`);
      }
      notify({
        title: "Telemetry samples ingested",
        description: "Five synthetic events were stored. Refreshing timeline…",
        variant: "success",
      });
      startTransition(() => {
        router.refresh();
      });
    })
    .catch((error) => {
      console.error("Failed to inject telemetry", error);
      notify({
        title: "Telemetry injection failed",
        description: "Check the console for details and confirm the API route is reachable.",
        variant: "error",
      });
    })
    .finally(() => {
      setSending(false);
    });
}
