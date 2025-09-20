/**
 * File: web/src/app/page.tsx
 * Purpose: Server component composing the telemetry command centre home view.
 * Notable behaviours: Bootstraps dependencies via `@/server/bootstrap`, loads
 *                    sessions and telemetry data, computes summary metrics, and
 *                    coordinates error handling/child components for the
 *                    dashboard layout.
 */

import Link from "next/link";

import "@/server/bootstrap";
import { listSessions } from "@/core/app/sessions/listSessions";
import { listTelemetryForSession } from "@/core/app/telemetry/listTelemetryForSession";
import { computeSummary } from "@/core/app/telemetry/summariseTelemetry";
import { listHeatResults } from "@/core/app/liverc/listHeatResults";
import type { Session } from "@/core/domain/session";
import type { TelemetrySample } from "@/core/domain/telemetry";
import type { LiveRcHeatResult } from "@/core/domain/liverc";
import { compareLiveRcResults } from "@/core/domain/liverc";
import { SessionForm } from "./_components/SessionForm";
import { TelemetryTimeline } from "./_components/TelemetryTimeline";
import { TelemetrySummaryPanel } from "./_components/TelemetrySummaryPanel";
import { DemoTelemetryPanel } from "./_components/DemoTelemetryPanel";
import { SignOutButton } from "./_components/SignOutButton";
import { LiveRcHeatResultsChart } from "./_components/LiveRcHeatResultsChart";

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

type LiveRcMetadata = NonNullable<Session["liveRc"]>;

export default async function Home({ searchParams }: { searchParams?: { sessionId?: string | string[] } }) {
  let sessions: Session[] = [];
  let loadError: string | null = null;

  try {
    sessions = await listSessions();
  } catch (error) {
    console.error("Failed to load sessions", error);
    loadError = "Unable to load sessions";
  }

  const rawSessionId = searchParams?.sessionId;
  const normalizedSessionId = Array.isArray(rawSessionId)
    ? rawSessionId[0]?.trim() || null
    : rawSessionId?.trim() || null;

  const selectedSessionId = normalizedSessionId && sessions.some((session) => session.id === normalizedSessionId)
    ? normalizedSessionId
    : sessions[0]?.id ?? null;
  const selectedSession = selectedSessionId ? sessions.find((session) => session.id === selectedSessionId) ?? null : null;

  let samples: TelemetrySample[] = [];
  let samplesError: string | null = null;
  if (typeof normalizedSessionId === "string" && normalizedSessionId.length > 0 && selectedSessionId) {
    try {
      samples = await listTelemetryForSession(selectedSessionId, { order: "asc" });
    } catch (error) {
      console.error("Failed to load telemetry samples", error);
      samplesError = "Unable to load telemetry for this session";
    }
  }

  const summary = computeSummary(samples);
  let liveRcResults: LiveRcHeatResult[] = [];
  let liveRcResultsError: string | null = null;

  if (selectedSession?.liveRc) {
    try {
      liveRcResults = await listHeatResults(selectedSession.liveRc.heatId);
    } catch (error) {
      console.error("Failed to load LiveRC results", error);
      liveRcResultsError = "Unable to load official LiveRC timing for this heat";
    }
  }

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

        {selectedSession?.liveRc && (
          <section className="space-y-4">
            <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Official LiveRC results</h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Scraped heat data is reconciled with the selected session so you can cross-check telemetry against official
                  timing.
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {selectedSession.liveRc.label}
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-500">
                  {selectedSession.liveRc.class?.name ?? "Unclassified"}
                  {selectedSession.liveRc.event ? ` · ${selectedSession.liveRc.event.title}` : ""}
                </p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {formatLiveRcSchedule(selectedSession.liveRc)}
                </p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                  {formatEventLocation(selectedSession.liveRc.event ?? null)}
                </p>
                {selectedSession.liveRc.liveStreamUrl && (
                  <p className="mt-2 text-xs">
                    <a
                      href={selectedSession.liveRc.liveStreamUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-speed underline-offset-4 hover:underline"
                    >
                      Watch LiveRC stream
                    </a>
                  </p>
                )}
              </div>
            </header>
            {liveRcResultsError ? (
              <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-900">{liveRcResultsError}</div>
            ) : (
              <div className="space-y-4">
                <LiveRcHeatResultsChart results={liveRcResults} />
                {liveRcResults.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] divide-y divide-neutral-200 text-left text-sm dark:divide-neutral-800">
                      <thead className="text-xs uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-500">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-right">
                            Pos
                          </th>
                          <th scope="col" className="px-3 py-2">
                            Driver
                          </th>
                          <th scope="col" className="px-3 py-2 text-right">
                            Laps
                          </th>
                          <th scope="col" className="px-3 py-2 text-right">
                            Fast lap
                          </th>
                          <th scope="col" className="px-3 py-2 text-right">
                            Total time
                          </th>
                          <th scope="col" className="px-3 py-2 text-right">
                            Interval
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {[...liveRcResults].sort(compareLiveRcResults).map((result) => (
                          <tr key={result.id} className="align-top">
                            <td className="px-3 py-2 text-right text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              {result.finishPosition ?? "—"}
                            </td>
                            <td className="px-3 py-2">
                              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{result.driverName}</div>
                              <div className="text-xs text-neutral-500 dark:text-neutral-500">{formatDriverMeta(result)}</div>
                            </td>
                            <td className="px-3 py-2 text-right text-sm text-neutral-700 dark:text-neutral-300">
                              {result.lapsCompleted ?? "—"}
                            </td>
                            <td className="px-3 py-2 text-right text-sm text-neutral-700 dark:text-neutral-300">
                              {formatFastLap(result.fastLapMs)}
                            </td>
                            <td className="px-3 py-2 text-right text-sm text-neutral-700 dark:text-neutral-300">
                              {formatTotalTime(result.totalTimeMs)}
                            </td>
                            <td className="px-3 py-2 text-right text-sm text-neutral-700 dark:text-neutral-300">
                              {formatInterval(result.intervalMs)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
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

function formatLiveRcSchedule(metadata: LiveRcMetadata): string {
  if (metadata.scheduledStart) {
    const duration = formatDurationSeconds(metadata.durationSeconds);
    const base = `${timeFormatter.format(new Date(metadata.scheduledStart))} UTC`;
    return duration ? `${base} · ${duration}` : base;
  }
  return "Schedule pending";
}

function formatEventLocation(event: LiveRcMetadata["event"] | null): string {
  const parts: string[] = [];
  if (event?.facility) {
    parts.push(event.facility);
  }
  const locality = [event?.city, event?.region, event?.country].filter((value) => value && value.trim().length > 0).join(", ");
  if (locality) {
    parts.push(locality);
  }
  return parts.length > 0 ? parts.join(" • ") : "Location TBD";
}

function formatFastLap(ms: number | null): string {
  if (ms == null) {
    return "—";
  }
  return `${(ms / 1000).toFixed(3)} s`;
}

function formatTotalTime(ms: number | null): string {
  if (ms == null) {
    return "—";
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = ms % 1000;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${millis.toString().padStart(3, "0")}`;
}

function formatInterval(ms: number | null): string {
  if (ms == null) {
    return "—";
  }
  if (ms === 0) {
    return "Leader";
  }
  return `+${(ms / 1000).toFixed(3)} s`;
}

function formatDriverMeta(result: LiveRcHeatResult): string {
  const parts: string[] = [];
  if (result.carNumber) {
    parts.push(`#${result.carNumber}`);
  }
  if (result.vehicle) {
    parts.push(result.vehicle);
  }
  if (result.hometownCity || result.hometownRegion) {
    parts.push([result.hometownCity, result.hometownRegion].filter(Boolean).join(", "));
  }
  if (result.sponsor) {
    parts.push(result.sponsor);
  }
  return parts.length > 0 ? parts.join(" • ") : "—";
}

function formatDurationSeconds(seconds: number | null): string | null {
  if (seconds == null) {
    return null;
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes > 0 && remainder > 0) {
    return `${minutes}m ${remainder}s`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${remainder}s`;
}
