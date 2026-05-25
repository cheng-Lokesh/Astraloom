"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import {
  getObservabilitySnapshot,
  summarizeObservabilityEvents,
  type ObservabilityEvent,
  type ObservabilitySummary,
} from "@/lib/observability/audit-event";

type ObservabilityApiResponse = {
  ok: boolean;
  snapshot?: ObservabilitySummary;
};

function emptySummary(): ObservabilitySummary {
  return {
    recentTasks: [],
    failedTasks: [],
    averageCost: 0,
    averageCostCents: 0,
    errorCodeDistribution: [],
    promptVersionDistribution: [],
    eventCount: 0,
  };
}

export default function ObservabilityPage() {
  const [serverSnapshot, setServerSnapshot] =
    useState<ObservabilitySummary>(emptySummary);
  const [localSnapshot, setLocalSnapshot] = useState<ObservabilitySummary>(() =>
    typeof window === "undefined" ? emptySummary() : getObservabilitySnapshot(),
  );
  const [adminToken, setAdminToken] = useState("");
  const [message, setMessage] = useState(
    "Local observability loaded. Refresh to include server-side LLM logs.",
  );

  async function fetchServerSnapshot() {
    const response = await fetch("/api/admin/observability", {
      headers: { "x-mirofish-admin-token": adminToken },
    }).catch(() => null);
    const payload = response
      ? ((await response.json().catch(() => null)) as ObservabilityApiResponse | null)
      : null;

    if (!response?.ok || !payload?.ok || !payload.snapshot) {
      setMessage("Server observability snapshot is unavailable.");
      return;
    }

    setServerSnapshot(payload.snapshot);
    setMessage("Observability snapshot loaded. Raw prompts and source text are not shown.");
  }

  const merged = useMemo(() => {
    const events = [
      ...serverSnapshot.recentTasks,
      ...serverSnapshot.failedTasks,
      ...localSnapshot.recentTasks,
      ...localSnapshot.failedTasks,
    ];
    const unique = new Map<string, ObservabilityEvent>();
    for (const event of events) {
      unique.set(event.id, event);
    }
    return summarizeObservabilityEvents(
      [...unique.values()].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    );
  }, [localSnapshot, serverSnapshot]);

  function refreshLocal() {
    setLocalSnapshot(getObservabilitySnapshot());
    void fetchServerSnapshot();
  }

  return (
    <AppShell>
      <section className="space-y-6">
        <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="planned">Observability</StatusPill>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            Generation chain health
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            Review trace ids, prompt versions, model versions, costs, and error
            codes without exposing raw private inputs or service keys. This
            page is read-only.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <input
              value={adminToken}
              onChange={(event) => setAdminToken(event.target.value)}
              type="password"
              placeholder="Admin token"
              className="min-w-56 rounded-md border border-black/10 bg-white px-4 py-2 text-sm text-[#11150f] outline-none focus:border-[#568262]"
            />
            <button
              type="button"
              onClick={refreshLocal}
              className="rounded-md bg-[#11150f] px-4 py-2 text-sm font-semibold text-white"
            >
              Refresh
            </button>
            <p className="text-sm text-[#62695d]">{message}</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Events" value={merged.eventCount.toString()} />
          <Metric
            label="Failed"
            value={merged.failedTasks.length.toString()}
          />
          <Metric
            label="Avg cost"
            value={`$${merged.averageCost.toFixed(6)}`}
          />
          <Metric
            label="Avg cents"
            value={merged.averageCostCents.toFixed(4)}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-6">
            <Panel title="Recent generation tasks">
              <TaskList events={merged.recentTasks} />
            </Panel>
            <Panel title="Failed tasks">
              <TaskList events={merged.failedTasks} empty="No failed tasks recorded." />
            </Panel>
          </main>
          <aside className="space-y-6">
            <Distribution
              title="error_code distribution"
              rows={merged.errorCodeDistribution}
            />
            <Distribution
              title="prompt_version distribution"
              rows={merged.promptVersionDistribution}
            />
          </aside>
        </section>
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/8 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-[#11150f]">{value}</div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-black/8 bg-white p-6">
      <h2 className="text-base font-semibold text-[#11150f]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TaskList({
  events,
  empty = "No tasks recorded yet.",
}: {
  events: ObservabilityEvent[];
  empty?: string;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-[#62695d]">{empty}</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <article
          key={event.id}
          className="rounded-md border border-black/8 bg-[#f7f8f4] p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={event.errorCode ? "blocked" : "ready"}>
                {event.kind}
              </StatusPill>
              <StatusPill tone="planned">{event.status}</StatusPill>
            </div>
            <span className="text-xs text-[#7d8578]">{event.createdAt}</span>
          </div>
          <div className="mt-3 grid gap-2 text-xs text-[#62695d] md:grid-cols-2">
            <code>trace: {event.traceId}</code>
            <code>job: {event.jobId}</code>
            <code>prompt: {event.promptVersion ?? "none"}</code>
            <code>model: {event.modelVersion ?? "none"}</code>
            <code>latency: {event.latencyMs ?? 0}ms</code>
            <code>cost: ${event.costEstimate.toFixed(6)}</code>
            <code>input tokens: {event.inputTokenEstimate}</code>
            <code>output tokens: {event.outputTokenEstimate}</code>
            <code>error: {event.errorCode ?? "none"}</code>
            <code>safety: {event.safetyLevel ?? "not_applicable"}</code>
          </div>
          {event.claimIds ? (
            <p className="mt-3 text-xs text-[#7d8578]">
              claims: {event.claimIds.length}, evidence events:{" "}
              {event.evidenceEventCount ?? 0}, state:{" "}
              {event.paidState ?? "unknown"}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function Distribution({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key: string; count: number }>;
}) {
  return (
    <section className="rounded-lg border border-black/8 bg-white p-5">
      <h2 className="text-sm font-semibold text-[#11150f]">{title}</h2>
      <div className="mt-4 space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-[#62695d]">No data yet.</p>
        ) : null}
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between rounded-md bg-[#f7f8f4] px-3 py-2 text-sm"
          >
            <code className="break-all text-[#62695d]">{row.key}</code>
            <span className="font-semibold text-[#11150f]">{row.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
