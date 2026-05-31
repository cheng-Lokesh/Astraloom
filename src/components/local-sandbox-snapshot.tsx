"use client";

import { useMemo, useState } from "react";

import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import { ButtonLink, EmptyState, EvidenceTag } from "@/components/ui-foundation";
import type { Locale } from "@/lib/i18n";
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

const copy = {
  en: {
    emptyTitle: "No local sandbox yet",
    emptyDescription:
      "Start with one real scenario, or open the sample to see the full sandbox.",
    productEmptyTitle: "You have not started a sandbox yet",
    productEmptyDescription:
      "Start your own destiny sandbox, or view the complete sample first.",
    lastSandbox: "Your last sandbox",
    productLastSandbox: "Continue last sandbox",
    untitled: "Untitled situation",
    ready: "Sandbox ready",
    draft: "Draft",
    people: "people",
    roles: "roles",
    pressure: "pressure points",
    events: "moments",
    findings: "findings",
    updated: "Updated",
    continue: "Continue last sandbox",
    tracks: {
      crossroad: "Crossroad",
      life_climate: "Longer trend",
    },
    windows: {
      "30_days": "30 days",
      "90_days": "90 days",
      "1_year": "1 year",
      "3_years": "3 years",
      "5_years": "5 years",
    },
  },
  zh: {
    emptyTitle: "还没有本地沙盘",
    emptyDescription: "从一个真实处境开始，或打开示例查看完整沙盘。",
    productEmptyTitle: "你还没有开始过沙盘",
    productEmptyDescription: "可以先开始自己的命运沙盘，也可以先查看完整示例。",
    lastSandbox: "上一次沙盘",
    productLastSandbox: "继续上次沙盘",
    untitled: "未命名处境",
    ready: "沙盘已生成",
    draft: "草稿",
    people: "人物",
    roles: "角色",
    pressure: "压力点",
    events: "片段",
    findings: "发现",
    updated: "更新于",
    continue: "继续上次沙盘",
    tracks: {
      crossroad: "具体岔路",
      life_climate: "长期趋势",
    },
    windows: {
      "30_days": "30天",
      "90_days": "90天",
      "1_year": "1年",
      "3_years": "3年",
      "5_years": "5年",
    },
  },
} as const;

function timeWindowLabel(value: SeedContextDraft["timeWindow"], locale: Locale) {
  return copy[locale].windows[value];
}

function trackLabel(value: SeedContextDraft["trackType"], locale: Locale) {
  return copy[locale].tracks[value];
}

function continueLabel(locale: Locale) {
  return copy[locale].continue;
}

function productQuestion(seedContext: SeedContextDraft, locale: Locale) {
  if (locale === "zh" && /^Should I accept/i.test(seedContext.questionText)) {
    return "示例：是否接受高薪但不确定的新机会？";
  }

  return seedContext.questionText || copy[locale].untitled;
}

function productSummary(seedContext: SeedContextDraft, locale: Locale) {
  const summary =
    seedContext.situationSummary || seedContext.currentQuestionDescription || "";
  if (
    locale === "zh" &&
    (/^Sample:/i.test(summary) || summary.includes("Sample destiny-situation"))
  ) {
    return "这是一个完整示例沙盘，用来展示职业选择、关系压力和几种可能路径如何展开。";
  }

  return summary;
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

  let nextHref = "/app/start";
  const nextLabel = continueLabel(locale);
  if (eventCount) {
    nextHref = "/app/simulation/result";
  } else if (graphLocked) {
    nextHref = "/app/simulation/running";
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
  variant = "detailed",
}: {
  emptyAction?: React.ReactNode;
  variant?: "detailed" | "product";
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
        title={variant === "product" ? t.productEmptyTitle : t.emptyTitle}
        description={
          variant === "product" ? t.productEmptyDescription : t.emptyDescription
        }
        action={variant === "product" ? undefined : emptyAction}
      />
    );
  }

  if (variant === "product") {
    return (
      <section className="mf-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
          {t.productLastSandbox}
        </p>
        <h2 className="mt-2 text-base font-semibold leading-6 text-[#11150f]">
          {productQuestion(snapshot.seedContext, locale)}
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#62695d]">
          {productSummary(snapshot.seedContext, locale)}
        </p>
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

  return (
    <section className="mf-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
            {t.lastSandbox}
          </p>
          <h2 className="mt-2 text-base font-semibold leading-6 text-[#11150f]">
            {productQuestion(snapshot.seedContext, locale)}
          </h2>
        </div>
        <StatusPill tone={snapshot.graphLocked ? "locked" : "planned"}>
          {snapshot.graphLocked ? t.ready : t.draft}
        </StatusPill>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#62695d]">
        {productSummary(snapshot.seedContext, locale)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <EvidenceTag>{trackLabel(snapshot.seedContext.trackType, locale)}</EvidenceTag>
        <span className="mf-tag">
          {timeWindowLabel(snapshot.seedContext.timeWindow, locale)}
        </span>
        <span className="mf-tag">
          {t.people} {snapshot.peopleCount}
        </span>
        <span className="mf-tag">
          {t.roles} {snapshot.agentCount}
        </span>
        <span className="mf-tag">
          {t.pressure} {snapshot.edgeCount}
        </span>
        <span className="mf-tag">
          {t.events} {snapshot.eventCount}
        </span>
        <span className="mf-tag">
          {t.findings} {snapshot.claimCount}
        </span>
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
