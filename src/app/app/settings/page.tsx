"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { getRepositories } from "@/lib/repositories/repository-provider";

export default function SettingsPage() {
  const [repos] = useState(() => getRepositories());
  const [seedContext] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [simulationRun] = useState(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.simulations.load(seed.id);
    return result.ok ? result.data : null;
  });
  const [relationGraph] = useState(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.relationGraphs.load(seed.id);
    return result.ok ? result.data : null;
  });
  const [claimLedger] = useState(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.reports.load(seed.id);
    return result.ok ? result.data : null;
  });
  const [feedbackLedger] = useState(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.feedback.load(seed.id);
    return result.ok ? result.data : null;
  });
  const [safetyReview] = useState(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.safetyReviews.load(seed.id);
    return result.ok ? result.data : null;
  });
  const [billingSupport] = useState(() => {
    const result = repos.billingSupport.load();
    return result.ok ? result.data : null;
  });

  const latestFeedback = feedbackLedger?.feedback.slice(0, 6) ?? [];
  const unlockStatus =
    billingSupport?.payment.entitlementStatus ?? "none";
  const safetyLevel =
    safetyReview?.safetyLevel ?? simulationRun?.safetyLevel ?? "not reviewed";

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusPill tone="ready">History and calibration</StatusPill>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            Keep the sandbox accountable to evidence and feedback.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            This page summarizes the local run ledger: seed context, graph,
            Event Logs, Claims, safety state, unlock state, and feedback
            calibration. It is not a graph editor or a hidden prediction panel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/simulation/result"
            className="rounded-md bg-[#11150f] px-4 py-2 text-sm font-semibold text-white"
          >
            Open result
          </Link>
          <Link
            href="/app/support"
            className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
          >
            Support requests
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="Seed" value={seedContext ? "ready" : "missing"} />
        <Metric label="Run" value={simulationRun?.status ?? "missing"} />
        <Metric label="Edges" value={relationGraph?.edges.length ?? 0} />
        <Metric label="Events" value={simulationRun?.events.length ?? 0} />
        <Metric label="Claims" value={claimLedger?.claims.length ?? 0} />
        <Metric label="Feedback" value={feedbackLedger?.feedback.length ?? 0} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(360px,0.44fr)]">
        <main className="space-y-6">
          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-[#11150f]">
                  Stored simulation history
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#62695d]">
                  The MVP currently keeps one local working simulation in the
                  browser. Later Supabase persistence should map this ledger to
                  user-owned rows with RLS.
                </p>
              </div>
              <StatusPill tone={seedContext ? "ready" : "blocked"}>
                local ledger
              </StatusPill>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <StateRow label="Seed context" value={seedContext?.id ?? "missing"} />
              <StateRow label="Simulation run" value={simulationRun?.id ?? "missing"} />
              <StateRow label="Track" value={seedContext?.trackType ?? "missing"} />
              <StateRow label="Horizon" value={seedContext?.timeWindow ?? "missing"} />
              <StateRow label="Safety level" value={safetyLevel} />
              <StateRow label="Unlock status" value={unlockStatus} />
            </div>
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-[#11150f]">
                  Calibration feedback log
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#62695d]">
                  Feedback records user judgment about claim accuracy, agent
                  fit, relation judgment, strategy usefulness, or the overall
                  run. It does not rewrite event evidence.
                </p>
              </div>
              <StatusPill tone={latestFeedback.length ? "ready" : "planned"}>
                {latestFeedback.length} shown
              </StatusPill>
            </div>

            {latestFeedback.length ? (
              <div className="mt-5 space-y-3">
                {latestFeedback.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-md border border-black/8 bg-[#f7f8f4] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[#11150f]">
                        {entry.targetType} / {entry.rating}
                      </div>
                      <div className="text-xs text-[#7d8578]">
                        {new Date(entry.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <code className="mt-2 block break-all text-xs text-[#7d8578]">
                      {entry.targetId}
                    </code>
                    {entry.note ? (
                      <p className="mt-2 text-sm leading-6 text-[#62695d]">
                        {entry.note}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-md border border-dashed border-black/16 bg-[#f7f8f4] p-5 text-sm leading-7 text-[#62695d]">
                No calibration feedback has been saved yet. Open the result
                page, select a claim, then save feedback from the calibration
                panel.
              </div>
            )}
          </section>
        </main>

        <aside className="h-fit space-y-5">
          <section className="rounded-lg border border-black/8 bg-[#11150f] p-6 text-white">
            <h2 className="text-sm font-semibold text-[#b7e6c6]">
              Acceptance boundaries
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-white/68">
              <p>Claims remain downstream of Event Logs.</p>
              <p>Paid unlock cannot change claim direction or certainty.</p>
              <p>Safety downgrade overrides report depth and unlock state.</p>
              <p>Users can report mismatch but cannot edit edge weights.</p>
            </div>
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-5">
            <h2 className="text-sm font-semibold text-[#11150f]">
              Next checkpoints
            </h2>
            <div className="mt-4 space-y-2">
              <ChecklistItem done={Boolean(seedContext)}>Seed context saved</ChecklistItem>
              <ChecklistItem done={Boolean(relationGraph?.edges.length)}>
                Read-only relation graph created
              </ChecklistItem>
              <ChecklistItem done={Boolean(simulationRun?.events.length)}>
                Event Log available
              </ChecklistItem>
              <ChecklistItem done={Boolean(claimLedger?.claims.length)}>
                Claims reference evidence_event_ids
              </ChecklistItem>
              <ChecklistItem done={Boolean(feedbackLedger?.feedback.length)}>
                Feedback calibration recorded
              </ChecklistItem>
            </div>
          </section>
        </aside>
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-black/8 bg-white p-4 shadow-[0_16px_48px_rgba(17,21,15,0.05)]">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        {label}
      </div>
      <div className="mt-2 truncate text-xl font-semibold text-[#11150f]">
        {value}
      </div>
    </div>
  );
}

function StateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-black/8 bg-[#f7f8f4] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        {label}
      </div>
      <code className="mt-2 block break-all text-xs text-[#62695d]">
        {value}
      </code>
    </div>
  );
}

function ChecklistItem({
  done,
  children,
}: {
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-black/8 bg-[#f7f8f4] px-3 py-2 text-sm text-[#3f483d]">
      <span>{children}</span>
      <StatusPill tone={done ? "ready" : "planned"}>
        {done ? "ready" : "pending"}
      </StatusPill>
    </div>
  );
}
