"use client";

import { useMemo, useState } from "react";

import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import { ButtonLink, EmptyState, EvidenceTag } from "@/components/ui-foundation";
import { getRepositories } from "@/lib/repositories/repository-provider";
import type { Locale } from "@/lib/i18n";
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

function timeWindowLabel(value: SeedContextDraft["timeWindow"], locale: Locale) {
  const labels: Record<Locale, Record<SeedContextDraft["timeWindow"], string>> = {
    en: {
      "30_days": "30 days",
      "90_days": "90 days",
      "1_year": "1 year",
      "3_years": "3 years",
      "5_years": "5 years",
    },
    zh: {
      "30_days": "30 天",
      "90_days": "90 天",
      "1_year": "1 年",
      "3_years": "3 年",
      "5_years": "5 年",
    },
  };
  return labels[locale][value];
}

function trackLabel(value: SeedContextDraft["trackType"], locale: Locale) {
  const labels = {
    en: value === "crossroad" ? "Track A" : "Track B",
    zh: value === "crossroad" ? "Track A 具体十字路口" : "Track B 长期气候",
  };
  return labels[locale];
}

const copy = {
  en: {
    emptyTitle: "No local sandbox yet",
    emptyDescription:
      "Start with one real scenario, or open the sample to see the full evidence loop.",
    lastSandbox: "Your last local sandbox",
    untitled: "Untitled scenario",
    graphLocked: "Graph locked",
    draft: "Draft",
    people: "people",
    agents: "agents",
    edges: "edges",
    events: "events",
    claims: "claims",
    updated: "Updated",
    continue: "Continue last sandbox",
  },
  zh: {
    emptyTitle: "还没有本地沙盘",
    emptyDescription: "从一个真实处境开始，或打开示例查看完整证据闭环。",
    lastSandbox: "上一次本地沙盘",
    untitled: "未命名处境",
    graphLocked: "关系图已锁定",
    draft: "草稿",
    people: "人物",
    agents: "Agent",
    edges: "关系边",
    events: "事件",
    claims: "Claim",
    updated: "更新于",
    continue: "继续上一次沙盘",
  },
} as const;

function continueLabel(locale: Locale) {
  return copy[locale].continue;
}

function loadSnapshot(locale: Locale): SnapshotData | null {
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
  let nextLabel = continueLabel(locale);
  if (!peopleCount) {
    nextHref = "/app/new/people";
    nextLabel = continueLabel(locale);
  } else if (!agentCount) {
    nextHref = "/app/new/agents";
    nextLabel = continueLabel(locale);
  } else if (!graphLocked) {
    nextHref = "/app/new/graph";
    nextLabel = continueLabel(locale);
  } else if (!eventCount) {
    nextHref = "/app/simulation/running";
    nextLabel = continueLabel(locale);
  } else {
    nextHref = "/app/simulation/result";
    nextLabel = continueLabel(locale);
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
  const { locale } = useLanguage();
  const t = copy[locale];
  const [snapshot] = useState(() => loadSnapshot(locale));
  const updatedAtLabel = useMemo(() => {
    if (!snapshot?.seedContext.updatedAt) return "";
    return new Date(snapshot.seedContext.updatedAt).toLocaleString();
  }, [snapshot]);

  if (!snapshot) {
    return (
      <EmptyState
        title={t.emptyTitle}
        description={t.emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <section className="mf-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
            {t.lastSandbox}
          </p>
          <h2 className="mt-2 text-base font-semibold leading-6 text-[#11150f]">
            {snapshot.seedContext.questionText || t.untitled}
          </h2>
        </div>
        <StatusPill tone={snapshot.graphLocked ? "locked" : "planned"}>
          {snapshot.graphLocked ? t.graphLocked : t.draft}
        </StatusPill>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#62695d]">
        {snapshot.seedContext.situationSummary}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <EvidenceTag>{trackLabel(snapshot.seedContext.trackType, locale)}</EvidenceTag>
        <span className="mf-tag">
          {timeWindowLabel(snapshot.seedContext.timeWindow, locale)}
        </span>
        <span className="mf-tag">{t.people} {snapshot.peopleCount}</span>
        <span className="mf-tag">{t.agents} {snapshot.agentCount}</span>
        <span className="mf-tag">{t.edges} {snapshot.edgeCount}</span>
        <span className="mf-tag">{t.events} {snapshot.eventCount}</span>
        <span className="mf-tag">{t.claims} {snapshot.claimCount}</span>
      </div>

      {updatedAtLabel ? (
        <p className="mt-3 text-xs leading-5 text-[#7d8578]">
          {t.updated} {updatedAtLabel}
        </p>
      ) : null}

      <ButtonLink href={snapshot.nextHref} className="mt-5 w-full px-4 py-3">
        {snapshot.nextLabel}
      </ButtonLink>
    </section>
  );
}
