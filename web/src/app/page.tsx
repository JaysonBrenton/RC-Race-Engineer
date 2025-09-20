import Link from "next/link";

import "@/server/bootstrap";
import { listSessions } from "@/core/app/sessions/listSessions";
import { listTelemetryForSession } from "@/core/app/telemetry/listTelemetryForSession";
import { computeSummary } from "@/core/app/telemetry/summariseTelemetry";
import type { Session } from "@/core/domain/session";
import type { TelemetrySample } from "@/core/domain/telemetry";
import { SessionForm } from "./_components/SessionForm";
import { TelemetryTimeline } from "./_components/TelemetryTimeline";
import { TelemetrySummaryPanel } from "./_components/TelemetrySummaryPanel";
import { DemoTelemetryPanel } from "./_components/DemoTelemetryPanel";
import { SignOutButton } from "./_components/SignOutButton";

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default async function Home({ searchParams }: { searchParams?: { sessionId?: string } }) {
  let sessions: Session[] = [];
  let loadError: string | null = null;

  try {
    sessions = await listSessions();
  } catch (error) {
    console.error("Failed to load sessions", error);
    loadError = "Unable to load sessions";
  }

  const selectedSessionId = searchParams?.sessionId ?? sessions[0]?.id ?? null;
  const selectedSession = selectedSessionId ? sessions.find((session) => session.id === selectedSessionId) ?? null : null;

  let samples: TelemetrySample[] = [];
  let samplesError: string | null = null;
  if (selectedSessionId) {
    try {
      samples = await listTelemetryForSession(selectedSessionId, { order: "asc" });
    } catch (error) {
      console.error("Failed to load telemetry samples", error);
      samplesError = "Unable to load telemetry for this session";
    }
  }

  const summary = computeSummary(samples);

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">The RC Racing Engineer</p>
            <h1 className="text-4xl font-semibold sm:text-5xl">Telemetry command centre</h1>
            <p className="max-w-3xl text-base text-neutral-600 dark:text-neutral-400">
              Schedule sessions, ingest telemetry, and keep the crew aligned. The foundation release validates ingest,
              aggregates, and visual grammar before expanding into comparative analysis and strategy overlays.
            </p>
          </div>
          <SignOutButton />
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_minmax(0,1fr)]">
          <div className="space-y-6">
            <SessionForm />
            <DemoTelemetryPanel session={selectedSession ?? null} />
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Sessions</h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Select a session to inspect telemetry feeds and aggregates. Latest sessions appear first.
                  </p>
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {sessions.length} total
                </span>
              </div>
              {loadError ? (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                  {loadError}
                </div>
              ) : sessions.length === 0 ? (
                <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-950/40 dark:text-neutral-400">
                  No sessions yet. Use the form to plan your first run and validate the ingest flow end-to-end.
                </div>
              ) : (
                <SessionList sessions={sessions} selectedSessionId={selectedSessionId} />
              )}
            </section>

            <TelemetrySummaryPanel summary={summary} />
          </aside>
        </div>

        <section className="space-y-4">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Session telemetry timeline</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Speed, throttle, and brake traces share a time axis so engineers can confirm coherence across signals.
              </p>
            </div>
            {selectedSession && (
              <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedSession.name}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-500">
                  {formatKind(selectedSession.kind)} · {selectedSession.status}
                </p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{formatSchedule(selectedSession)}</p>
              </div>
            )}
          </header>
          {samplesError ? (
            <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-900">{samplesError}</div>
          ) : (
            <TelemetryTimeline samples={samples} />
          )}
        </section>
      </main>
    </div>
  );
}

function SessionList({ sessions, selectedSessionId }: { sessions: Session[]; selectedSessionId: string | null }) {
  return (
    <ul className="space-y-3">
      {sessions.map((session) => {
        const isActive = session.id === selectedSessionId;
        return (
          <li key={session.id}>
            <Link
              className={`block rounded-lg border px-4 py-3 shadow-sm transition hover:border-speed hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-speed ${isActive ? "border-speed bg-speed-tint" : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950/40"}`}
              href={`/?sessionId=${session.id}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-500">{formatKind(session.kind)}</p>
                  <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{session.name}</p>
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {session.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">{formatSchedule(session)}</p>
              {session.description && (
                <p className="mt-2 truncate text-xs text-neutral-600 dark:text-neutral-400">{session.description}</p>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function formatSchedule(session: Session): string {
  if (session.scheduledStart && session.scheduledEnd) {
    return `${timeFormatter.format(new Date(session.scheduledStart))} → ${timeFormatter.format(new Date(session.scheduledEnd))} UTC`;
  }
  if (session.scheduledStart) {
    return `${timeFormatter.format(new Date(session.scheduledStart))} UTC`;
  }
  return "Schedule not yet defined";
}

function formatKind(kind: Session["kind"]): string {
  return kind
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
