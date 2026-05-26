"use client";

import { useMemo, useState } from "react";

import { StatusPill } from "@/components/status-pill";
import { ButtonLink, EmptyState, EvidenceTag } from "@/components/ui-foundation";
import { getRepositories } from "@/lib/repositories/repository-provider";
import type { SeedContextDraft } from "@/types/seed-context";

type SnapshotData = {
  seedContext: SeedContextDraft;
  peopleCount: number;
  agentCount: number;
  edgeCount: number;
  eventCount: number;
  claimCount: number;
  graphLocked: boolean;
  nextHref: string;
  nextLabel: string;
};

function timeWindowLabel(value: SeedContextDraft["timeWindow"]) {
  const labels: Record<SeedContextDraft["timeWindow"], string> = {
    "30_days": "30 days",
    "90_days": "90 days",
    "1_year": "1 year",
    "3_years": "3 years",
    "5_years": "5 years",
  };
  return labels[value];
}

function trackLabel(value: SeedContextDraft["trackType"]) {
  return value === "crossroad" ? "Track A" : "Track B";
}

function buildSnapshot(): SnapshotData | null {
  const repos = getRepositories();
  const seedResult = repos.seedContexts.load();
  const seedContext = seedResult.ok ? seedResult.data : null;
  if (!seedContext) return null;

  const keyPeopleResult = repos.keyPeople.load(seedContext.id);
  const agentsResult = repos.agentProfiles.load(seedContext.id);
  const graphResult = repos.relationGraphs.load(seedContext.id);
  const simulationResult = repos.simulations.load(seedContext.id);
  const reportResult = repos.reports.load(seedContext.id);

  const peopleCount = keyPeopleResult.ok
    ? (keyPeopleResult.data?.people ?? []).filter(
        (person) => person.confirmed && person.status === "confirmed",
      ).length
    : 0;
  const agentCount = agentsResult.ok ? agentsResult.data?.agents.length ?? 0 : 0;
  const edgeCount = graphResult.ok ? graphResult.data?.edges.length ?? 0 : 0;
  const eventCount = simulationResult.ok ? simulationResult.data?.events.length ?? 0 : 0;
  const claimCount = reportResult.ok ? reportResult.data?.claims.length ?? 0 : 0;
  const graphLocked = graphResult.ok ? graphResult.data?.graphLocked ?? false : false;

  let nextHref = "/app/new/people";
  let nextLabel = "Continue setup";
  if (!peopleCount) {
    nextHref = "/app/new/people";
    nextLabel = "Confirm people";
  } else if (!agentCount) {
    nextHref = "/app/new/agents";
    nextLabel = "Review agents";
  } else if (!graphLocked) {
    nextHref = "/app/new/graph";
    nextLabel = "Lock graph";
  } else if (!eventCount) {
    nextHref = "/app/simulation/running";
    nextLabel = "Run simulation";
  } else {
    nextHref = "/app/simulation/result";
    nextLabel = "Open result";
  }

  return {
    seedContext,
    peopleCount,
    agentCount,
    edgeCount,
    eventCount,
    claimCount,
    graphLocked,
    nextHref,
    nextLabel,
  };
}

export function LocalSandboxSnapshot({
  emptyAction,
}: {
  emptyAction?: React.ReactNode;
}) {
  const [snapshot] = useState(() => buildSnapshot());
  const updatedAtLabel = useMemo(() => {
    if (!snapshot?.seedContext.updatedAt) return "";
    return new Date(snapshot.seedContext.updatedAt).toLocaleString();
  }, [snapshot]);

  if (!snapshot) {
    return (
      <EmptyState
        title="No local sandbox yet"
        description="Start with one real scenario, or open the sample to see the full evidence loop."
        action={emptyAction}
      />
    );
  }

  return (
    <section className="mf-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
            Your last local sandbox
          </p>
          <h2 className="mt-2 text-base font-semibold leading-6 text-[#11150f]">
            {snapshot.seedContext.questionText || "Untitled scenario"}
          </h2>
        </div>
        <StatusPill tone={snapshot.graphLocked ? "locked" : "planned"}>
          {snapshot.graphLocked ? "Graph locked" : "Draft"}
        </StatusPill>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#62695d]">
        {snapshot.seedContext.situationSummary}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <EvidenceTag>{trackLabel(snapshot.seedContext.trackType)}</EvidenceTag>
        <span className="mf-tag">{timeWindowLabel(snapshot.seedContext.timeWindow)}</span>
        <span className="mf-tag">people {snapshot.peopleCount}</span>
        <span className="mf-tag">agents {snapshot.agentCount}</span>
        <span className="mf-tag">edges {snapshot.edgeCount}</span>
        <span className="mf-tag">events {snapshot.eventCount}</span>
        <span className="mf-tag">claims {snapshot.claimCount}</span>
      </div>

      {updatedAtLabel ? (
        <p className="mt-3 text-xs leading-5 text-[#7d8578]">
          Updated {updatedAtLabel}
        </p>
      ) : null}

      <ButtonLink href={snapshot.nextHref} className="mt-5 w-full px-4 py-3">
        {snapshot.nextLabel}
      </ButtonLink>
    </section>
  );
}
