import "@/server/bootstrap";
import { listSessions } from "@/core/app/sessions/listSessions";
import type { Session } from "@/core/domain/session";
import { SessionForm } from "./_components/SessionForm";

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default async function Home() {
  let sessions: Session[] = [];
  let loadError: string | null = null;

  try {
    sessions = await listSessions();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unable to load sessions";
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">RC Race Engineer</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Session control tower</h1>
          <p className="max-w-2xl text-base text-neutral-600 dark:text-neutral-400">
            Create race-weekend sessions and confirm the ingest pipeline before wiring external timing feeds. Once a
            session exists, telemetry events can stream against a concrete identifier.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.25fr_minmax(0,1fr)]">
          <SessionForm />

          <aside className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Recent sessions</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Latest entries appear first. Use this list to confirm telemetry writes target the right identifiers.
              </p>
            </div>

            {loadError ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                Unable to load sessions: {loadError}
              </div>
            ) : sessions.length === 0 ? (
              <div className="rounded-md border border-dashed border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900 p-6 text-sm text-neutral-600 dark:text-neutral-400">
                No sessions yet. Use the form to plan your first run and validate the ingest flow end-to-end.
              </div>
            ) : (
              <ul className="space-y-3">
                {sessions.map((session) => (
                  <li key={session.id} className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-neutral-500">{formatKind(session.kind)}</p>
                        <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{session.name}</p>
                      </div>
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-200">
                        {session.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                      {formatSchedule(session)}
                    </p>
                    {session.description && (
                      <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{session.description}</p>
                    )}
                    <dl className="mt-3 grid gap-2 text-xs text-neutral-600 dark:text-neutral-400 sm:grid-cols-2">
                      <div>
                        <dt className="font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-500">
                          Timing source
                        </dt>
                        <dd className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                          {formatTimingProvider(session.timingProvider)}
                        </dd>
                      </div>
                      {session.liveRc && (
                        <div>
                          <dt className="font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-500">
                            LiveRC heat
                          </dt>
                          <dd className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                            {session.liveRc.event ? `${session.liveRc.event.title} — ` : ""}
                            {session.liveRc.label}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </section>
      </main>
    </div>
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

function formatTimingProvider(provider: Session["timingProvider"]): string {
  switch (provider) {
    case "LIVE_RC":
      return "LiveRC timing feed";
    case "MANUAL":
    default:
      return "Manual entry";
  }
}
