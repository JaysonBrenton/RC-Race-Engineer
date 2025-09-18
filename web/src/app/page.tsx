const sessionHighlights = [
  {
    title: "Active session",
    value: "Qualifying",
    details: "Q3 · 08:12 remaining",
    accent: "var(--color-track)",
  },
  {
    title: "Driver focus",
    value: "A. López",
    details: "Lap 17 of 20 · Soft tyres",
    accent: "var(--color-temp-tyre)",
  },
  {
    title: "Stint delta",
    value: "-0.214 s",
    details: "vs personal best (lap 14)",
    accent: "var(--color-speed)",
  },
];

const telemetryPanels = [
  {
    name: "Speed vs throttle",
    summary: "Live differential with 200 ms smoothing",
    primaryToken: "var(--color-speed)",
    secondaryToken: "var(--color-throttle)",
  },
  {
    name: "Brake pressure & temps",
    summary: "Front brake bias holding 58% · Tyre window stable",
    primaryToken: "var(--color-brake)",
    secondaryToken: "var(--color-temp-brake)",
  },
  {
    name: "RPM & gear progression",
    summary: "Shift points aligned with target band",
    primaryToken: "var(--color-rpm)",
    secondaryToken: "var(--color-gear)",
  },
];

export default function Home() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--color-background)",
        color: "var(--color-foreground)",
      }}
    >
      <main
        className="mx-auto flex w-full max-w-6xl flex-col"
        style={{
          gap: "var(--space-6)",
          paddingBlock: "var(--space-7)",
          paddingInline: "clamp(var(--space-4), 5vw, var(--space-7))",
        }}
      >
        <header
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          style={{ gap: "var(--space-3)" }}
        >
          <div className="flex flex-col" style={{ gap: "var(--space-2)" }}>
            <p
              className="uppercase tracking-wide"
              style={{
                color: "var(--color-ambient)",
                fontSize: "var(--font-size-sm)",
                letterSpacing: "0.08em",
              }}
            >
              Session overview
            </p>
            <h1
              className="font-semibold"
              style={{ fontSize: "var(--font-size-2xl)", lineHeight: 1.2 }}
            >
              RC Race Engineer control room
            </h1>
            <p style={{ fontSize: "var(--font-size-md)", maxWidth: "52ch" }}>
              Glanceable status for the current running session. Critical signals
              stay synchronized across telemetry, timing, and tyre management.
            </p>
          </div>
          <div
            className="self-stretch rounded-md border shadow-sm sm:self-auto"
            role="status"
            style={{
              alignItems: "center",
              borderColor: "var(--color-track)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              gap: "var(--space-2)",
              paddingBlock: "var(--space-2)",
              paddingInline: "var(--space-4)",
            }}
          >
            <span
              aria-hidden
              style={{
                backgroundColor: "var(--color-speed)",
                borderRadius: "9999px",
                display: "inline-block",
                height: "0.75rem",
                width: "0.75rem",
              }}
            />
            <div className="flex flex-col" style={{ gap: "0.15rem" }}>
              <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
                Next push window in 02:10
              </span>
              <span style={{ fontSize: "var(--font-size-xs)", opacity: 0.75 }}>
                Track evolution +0.6% • Weather stable at 22°C ambient
              </span>
            </div>
          </div>
        </header>

        <section aria-labelledby="session-summary" className="flex flex-col">
          <div
            className="flex items-baseline justify-between"
            style={{ marginBottom: "var(--space-3)" }}
          >
            <h2 id="session-summary" style={{ fontSize: "var(--font-size-lg)", fontWeight: 600 }}>
              Session summary
            </h2>
            <span style={{ fontSize: "var(--font-size-sm)", opacity: 0.7 }}>
              Updated 18 seconds ago
            </span>
          </div>
          <div
            className="grid gap-4 sm:grid-cols-3"
            style={{ gap: "var(--space-4)" }}
          >
            {sessionHighlights.map((highlight) => (
              <article
                key={highlight.title}
                className="border backdrop-blur"
                style={{
                  backgroundColor: "var(--surface-raised)",
                  borderColor: highlight.accent,
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-card)",
                  color: "inherit",
                  padding: "var(--space-5)",
                }}
              >
                <h3
                  className="text-sm font-medium uppercase tracking-wide"
                  style={{
                    color: highlight.accent,
                    fontSize: "var(--font-size-sm)",
                    letterSpacing: "0.08em",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  {highlight.title}
                </h3>
                <p
                  className="font-semibold"
                  style={{
                    fontSize: "var(--font-size-xl)",
                    lineHeight: 1.2,
                    marginBottom: "var(--space-1)",
                  }}
                >
                  {highlight.value}
                </p>
                <p style={{ fontSize: "var(--font-size-sm)", opacity: 0.8 }}>
                  {highlight.details}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="telemetry-overview"
          className="flex flex-col"
          style={{ gap: "var(--space-4)" }}
        >
          <h2 id="telemetry-overview" style={{ fontSize: "var(--font-size-lg)", fontWeight: 600 }}>
            Telemetry focus
          </h2>
          <div className="grid gap-4 lg:grid-cols-3" style={{ gap: "var(--space-4)" }}>
            {telemetryPanels.map((panel) => (
              <article
                key={panel.name}
                className="flex flex-col rounded-md border"
                style={{
                  borderColor: panel.primaryToken,
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--space-4)",
                  gap: "var(--space-3)",
                }}
              >
                <header className="flex flex-col" style={{ gap: "var(--space-1)" }}>
                  <h3
                    className="font-semibold"
                    style={{ fontSize: "var(--font-size-md)", lineHeight: 1.4 }}
                  >
                    {panel.name}
                  </h3>
                  <p style={{ fontSize: "var(--font-size-sm)", opacity: 0.8 }}>
                    {panel.summary}
                  </p>
                </header>
                <div
                  aria-hidden
                  className="flex-1 rounded-md border border-dashed"
                  style={{
                    borderColor: panel.primaryToken,
                    borderRadius: "var(--radius-md)",
                    minHeight: "10rem",
                    padding: "var(--space-3)",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${panel.primaryToken} 0%, ${panel.primaryToken} 40%, ${panel.secondaryToken} 100%)`,
                      borderRadius: "calc(var(--radius-md) - 4px)",
                      height: "100%",
                      opacity: 0.18,
                      width: "100%",
                    }}
                  />
                  <div
                    style={{
                      alignItems: "center",
                      bottom: "var(--space-3)",
                      color: "var(--color-foreground)",
                      display: "flex",
                      fontSize: "var(--font-size-xs)",
                      gap: "var(--space-2)",
                      justifyContent: "space-between",
                      left: "var(--space-3)",
                      position: "absolute",
                      right: "var(--space-3)",
                    }}
                  >
                    <span
                      style={{
                        alignItems: "center",
                        display: "inline-flex",
                        gap: "0.35rem",
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: panel.primaryToken,
                          borderRadius: "999px",
                          display: "inline-block",
                          height: "0.5rem",
                          width: "0.5rem",
                        }}
                      />
                      Primary signal
                    </span>
                    <span
                      style={{
                        alignItems: "center",
                        display: "inline-flex",
                        gap: "0.35rem",
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: panel.secondaryToken,
                          borderRadius: "999px",
                          display: "inline-block",
                          height: "0.5rem",
                          width: "0.5rem",
                        }}
                      />
                      Reference band
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: "var(--font-size-xs)", opacity: 0.7 }}>
                  Cursor sync and lap comparisons available in the telemetry deck.
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
