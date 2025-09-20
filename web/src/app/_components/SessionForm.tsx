"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { SESSION_KINDS, TIMING_PROVIDERS } from "@/core/domain/session";
import type { ActionResult } from "../actions";
import { createSessionAction } from "../actions";
import { useToast } from "./ToastProvider";

const INITIAL_STATE: ActionResult = { success: false };

export function SessionForm() {
  const [state, formAction] = useFormState(createSessionAction, INITIAL_STATE);
  const { notify } = useToast();
  const [timingProvider, setTimingProvider] = useState("MANUAL");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && state.session) {
      notify({
        title: "Session scheduled",
        description: `${state.session.name} is ready to receive telemetry`,
        variant: "success",
      });
      formRef.current?.reset();
      setTimingProvider("MANUAL");
    }
  }, [notify, state]);

  useEffect(() => {
    if (!state.success && state.error) {
      notify({
        title: state.error,
        description: state.issues && state.issues.length > 0 ? state.issues.join(", ") : undefined,
        variant: "error",
      });
    }
  }, [notify, state.error, state.issues, state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div>
        <h2 className="text-xl font-semibold">Schedule a session</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Capture the basic metadata before telemetry flows. All times are stored as UTC.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col text-sm font-medium gap-2">
          Session name
          <input
            name="name"
            type="text"
            required
            placeholder="Qualifying simulation"
            className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          />
        </label>
        <label className="flex flex-col text-sm font-medium gap-2">
          Session kind
          <select
            name="kind"
            defaultValue="PRACTICE"
            className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            {SESSION_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {formatKind(kind)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm font-medium gap-2 md:col-span-2">
          Description <span className="text-xs font-normal text-neutral-500">Optional</span>
          <textarea
            name="description"
            rows={3}
            placeholder="Outlining run plan, tyres, or notes for the strategy team"
            className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          />
        </label>
        <label className="flex flex-col text-sm font-medium gap-2">
          Scheduled start
          <input
            name="scheduledStart"
            type="datetime-local"
            className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          />
        </label>
        <label className="flex flex-col text-sm font-medium gap-2">
          Scheduled end
          <input
            name="scheduledEnd"
            type="datetime-local"
            className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          />
        </label>
        <label className="flex flex-col text-sm font-medium gap-2">
          Timing provider
          <select
            name="timingProvider"
            defaultValue="MANUAL"
            onChange={(event) => setTimingProvider(event.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-neutral-700 dark:bg-neutral-900"
          >
            {TIMING_PROVIDERS.map((provider) => (
              <option key={provider} value={provider}>
                {provider === "LIVE_RC" ? "LiveRC timing feed" : "Manual entry"}
              </option>
            ))}
          </select>
        </label>
        {timingProvider === "LIVE_RC" && (
          <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
            LiveRC heat identifier
            <input
              name="liveRcHeatId"
              type="text"
              placeholder="heat-123"
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-neutral-700 dark:bg-neutral-900"
            />
            <span className="text-xs font-normal text-neutral-500">
              Required when linking to a LiveRC schedule to pull classification metadata.
            </span>
          </label>
        )}
      </div>

      {state.error && (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-900 p-4 text-sm space-y-2">
          <p className="font-medium">{state.error}</p>
          {state.issues && state.issues.length > 0 && (
            <ul className="list-disc list-inside space-y-1">
              {state.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:bg-sky-300"
      disabled={pending}
    >
      {pending ? "Saving…" : "Create session"}
    </button>
  );
}

function formatKind(kind: string) {
  return kind
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
