"use client";

import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import { getRepositories } from "@/lib/repositories/repository-provider";

const flowSteps = [
  "Seed",
  "People",
  "Agents",
  "Graph",
  "Events",
  "Claims",
  "Feedback",
];

function safetyTone(level: string) {
  if (level === "blocked") return "blocked";
  if (level === "downgraded" || level === "caution") return "caution";
  return "ready";
}

function safetyLabel(level: string) {
  if (level === "blocked") return "Safety paused";
  if (level === "downgraded") return "Safety adjusted";
  if (level === "caution") return "Safety caution";
  if (level === "safe" || level === "normal") return "Safety clear";
  return "Safety not reviewed";
}

export default function ArchivePage() {
  const [repos] = useState(() => getRepositories());
  const [seedContext] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [keyPeople] = useState(() => {
    if (!seedContext) return null;
    const result = repos.keyPeople.load(seedContext.id);
    return result.ok ? result.data : null;
  });
  const [agentEcology] = useState(() => {
    if (!seedContext) return null;
    const result = repos.agentProfiles.load(seedContext.id);
    return result.ok ? result.data : null;
  });
  const [relationGraph] = useState(() => {
    if (!seedContext) return null;
    const result = repos.relationGraphs.load(seedContext.id);
    return result.ok ? result.data : null;
  });
  const [simulationRun] = useState(() => {
    if (!seedContext) return null;
    const result = repos.simulations.load(seedContext.id);
    return result.ok ? result.data : null;
  });
  const [claimLedger] = useState(() => {
    if (!seedContext) return null;
    const result = repos.reports.load(seedContext.id);
    return result.ok ? result.data : null;
  });
  const [feedbackLedger] = useState(() => {
    if (!seedContext) return null;
    const result = repos.feedback.load(seedContext.id);
    return result.ok ? result.data : null;
  });
  const [safetyReview] = useState(() => {
    if (!seedContext) return null;
    const result = repos.safetyReviews.load(seedContext.id);
    return result.ok ? result.data : null;
  });

  const progress = useMemo(
    () => [
      Boolean(seedContext),
      Boolean(keyPeople?.people.length),
      Boolean(agentEcology?.agents.length),
      Boolean(relationGraph?.edges.length),
      Boolean(simulationRun?.events.length),
      Boolean(claimLedger?.claims.length),
      Boolean(feedbackLedger?.feedback.length),
    ],
    [
      agentEcology,
      claimLedger,
      feedbackLedger,
      keyPeople,
      relationGraph,
      seedContext,
      simulationRun,
    ],
  );
  const completedCount = progress.filter(Boolean).length;
  const safetyLevel =
    safetyReview?.safetyLevel ?? simulationRun?.safetyLevel ?? "not reviewed";
  const currentRunExists = Boolean(seedContext);

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusPill tone="planned">Archive</StatusPill>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            Local sandbox history and drafts.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            Archive reads the browser-local Astraloom ledger: scenario, agents,
            read-only graph, simulation events, evidence-backed claims, and
            feedback. It does not connect to production storage.
          </p>
        </div>
        <ButtonLink href="/app/dashboard" variant="secondary" className="px-4 py-2">
          Back to dashboard
        </ButtonLink>
      </div>

      {!currentRunExists ? (
        <SurfaceCard emphasis="strong" className="mx-auto max-w-3xl p-8">
          <StatusPill tone="planned">No local sandbox yet</StatusPill>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            Your archive will fill in after the first scenario is saved.
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            Start from scene setup. Once local data exists, this page will show
            draft and history cards without creating production records.
          </p>
          <ButtonLink href="/app/new/scene" className="mt-6 px-5 py-3">
            Start a scenario
          </ButtonLink>
        </SurfaceCard>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <main className="space-y-6">
            <SurfaceCard className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-[#11150f]">
                    Current local sandbox
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#62695d]">
                    {seedContext?.questionText ||
                      seedContext?.situationSummary ||
                      "Untitled scenario"}
                  </p>
                </div>
                <StatusPill tone={safetyTone(safetyLevel)}>
                  {safetyLabel(safetyLevel)}
                </StatusPill>
              </div>

              <div className="mt-5 h-2 rounded-full bg-black/8">
                <div
                  className="h-full rounded-full bg-[#568262]"
                  style={{
                    width: `${Math.round(
                      (completedCount / flowSteps.length) * 100,
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-7">
                {flowSteps.map((step, index) => (
                  <div
                    key={step}
                    className={`rounded-md border px-2 py-2 text-center text-xs font-semibold ${
                      progress[index]
                        ? "border-[#568262]/25 bg-[#eef5ee] text-[#2f5d3d]"
                        : "border-black/8 bg-[#f7f8f4] text-[#7d8578]"
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <ArchiveMetric label="Agents" value={agentEcology?.agents.length ?? 0} />
                <ArchiveMetric label="Edges" value={relationGraph?.edges.length ?? 0} />
                <ArchiveMetric label="Events" value={simulationRun?.events.length ?? 0} />
                <ArchiveMetric label="Claims" value={claimLedger?.claims.length ?? 0} />
                <ArchiveMetric label="Feedback" value={feedbackLedger?.feedback.length ?? 0} />
                <ArchiveMetric label="Horizon" value={seedContext?.timeWindow ?? "draft"} />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/app/simulation/result" className="px-5 py-3">
                  Continue result
                </ButtonLink>
                <ButtonLink
                  href="/app/simulation/running"
                  variant="secondary"
                  className="px-5 py-3"
                >
                  Open Event Log
                </ButtonLink>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <h2 className="text-base font-semibold text-[#11150f]">
                Draft cards
              </h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <DraftCard
                  title="Scenario setup"
                  ready={Boolean(seedContext)}
                  href="/app/new/intake"
                  detail={seedContext?.updatedAt ?? "No saved scenario"}
                />
                <DraftCard
                  title="Agent ecology"
                  ready={Boolean(agentEcology?.agents.length)}
                  href="/app/new/agents"
                  detail={`${agentEcology?.agents.length ?? 0} agents`}
                />
                <DraftCard
                  title="Relation graph"
                  ready={Boolean(relationGraph?.edges.length)}
                  href="/app/new/graph"
                  detail={`${relationGraph?.edges.length ?? 0} edges`}
                />
                <DraftCard
                  title="Claim ledger"
                  ready={Boolean(claimLedger?.claims.length)}
                  href="/app/simulation/result"
                  detail={`${claimLedger?.claims.length ?? 0} claims`}
                />
              </div>
            </SurfaceCard>
          </main>

          <aside className="h-fit space-y-5">
            <SurfaceCard emphasis="dark" className="p-6">
              <h2 className="text-sm font-semibold text-[#b7e6c6]">
                Archive boundaries
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-white/68">
                <p>Only browser-local drafts are shown here.</p>
                <p>No production database sync is started from Archive.</p>
                <p>Reports stay downstream of evidence-backed Claims.</p>
              </div>
            </SurfaceCard>
            <SurfaceCard className="p-5">
              <h2 className="text-sm font-semibold text-[#11150f]">
                Recent feedback
              </h2>
              <div className="mt-4 space-y-3">
                {(feedbackLedger?.feedback ?? []).slice(0, 4).map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-md border border-black/8 bg-[#f7f8f4] p-3"
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                      {entry.targetType} / {entry.rating}
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#62695d]">
                      {entry.note || entry.targetId}
                    </p>
                  </article>
                ))}
                {feedbackLedger?.feedback.length ? null : (
                  <p className="rounded-md border border-dashed border-black/16 bg-[#f7f8f4] p-4 text-sm leading-6 text-[#62695d]">
                    Feedback saved from Result Sandbox will appear here.
                  </p>
                )}
              </div>
            </SurfaceCard>
          </aside>
        </section>
      )}
    </AppShell>
  );
}

function ArchiveMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md border border-black/8 bg-[#f7f8f4] p-3">
      <div className="text-[11px] uppercase text-[#7d8578]">{label}</div>
      <div className="mt-1 truncate text-lg font-semibold text-[#11150f]">
        {value}
      </div>
    </div>
  );
}

function DraftCard({
  title,
  ready,
  href,
  detail,
}: {
  title: string;
  ready: boolean;
  href: string;
  detail: string;
}) {
  return (
    <article className="rounded-lg border border-black/8 bg-[#f7f8f4] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#11150f]">{title}</h3>
        <StatusPill tone={ready ? "ready" : "planned"}>
          {ready ? "ready" : "draft"}
        </StatusPill>
      </div>
      <p className="mt-2 break-all text-xs leading-5 text-[#7d8578]">{detail}</p>
      <ButtonLink href={href} variant="secondary" className="mt-4 px-3 py-2">
        Open
      </ButtonLink>
    </article>
  );
}
