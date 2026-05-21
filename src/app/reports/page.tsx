"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import { buildReportDraft, lockReportDraft } from "@/lib/reports/build";
import {
  clearReportDraft,
  loadReportDraft,
  saveReportDraft,
} from "@/lib/reports/storage";
import { loadSafetyReviewDraft } from "@/lib/safety/storage";
import { loadSeedContextDraft } from "@/lib/seed-context/storage";
import { loadSimulationRunDraft } from "@/lib/runs/storage";
import type { ReportDraft, ReportStatus } from "@/types/report";
import type { SafetyReviewDraft } from "@/types/safety-review";
import type { SeedContextDraft } from "@/types/seed-context";
import type { SimulationRunDraft } from "@/types/simulation-run";

type ReportsPageContext = {
  seedContext: SeedContextDraft | null;
  simulationRun: SimulationRunDraft | null;
  safetyReview: SafetyReviewDraft | null;
  savedReport: ReportDraft | null;
};

const reportsCopy = {
  en: {
    title: "Report shell",
    status: "Locked",
    body: "This page is the final locked container for future reports. It does not generate narrative, claims, or advice.",
    noSeedTitle: "Seed context required",
    noSeedBody: "Create a seed context before a report shell can exist.",
    noRunTitle: "Saved run shell required",
    noRunBody: "Create and save a simulation run shell before opening reports.",
    noSafetyTitle: "Saved safety review required",
    noSafetyBody:
      "Create and save a SafetyVerifier shell before the report shell can read readiness gates.",
    openIntake: "Open seed intake",
    openRuns: "Open run shell",
    openSafety: "Open safety review",
    openBilling: "Open billing support",
    save: "Save report shell",
    rebuild: "Rebuild report shell",
    lock: "Keep report locked",
    reset: "Clear saved report",
    disabledGenerate: "Generate report disabled",
    saved: "Report shell saved locally.",
    rebuilt: "Report shell rebuilt from safety review.",
    locked: "Report remains locked.",
    resetDone: "Saved report shell cleared.",
    statusLabels: {
      locked: "Locked",
      ready_placeholder: "Ready placeholder",
    },
    summaryTitle: "Report summary",
    seedQuestion: "Seed question",
    runStatus: "Run status",
    safetyLevel: "Safety level",
    reportReady: "Report ready",
    no: "No",
    yes: "Yes",
    sectionsTitle: "Locked sections",
    claimsTitle: "Claims placeholders",
    evidenceTitle: "Evidence refs",
    confidence: "Confidence",
    lockedLabel: "Locked",
    nextStep: "Next build step",
    nextStepBody:
      "Add payment entitlement and support workflows. Keep generation unavailable until the product gates are complete.",
  },
  zh: {
    title: "报告外壳",
    status: "已锁定",
    body: "这是未来报告的最终锁定容器。这里不生成叙事、不生成 Claim，也不提供建议。",
    noSeedTitle: "需要先保存种子上下文",
    noSeedBody: "请先创建种子上下文，然后才能建立报告外壳。",
    noRunTitle: "需要先保存 run 外壳",
    noRunBody: "请先创建并保存 simulation run 外壳，然后再打开报告。",
    noSafetyTitle: "需要先保存安全审查",
    noSafetyBody: "请先创建并保存 SafetyVerifier 外壳，报告外壳才能读取就绪闸门。",
    openIntake: "打开推演入口",
    openRuns: "打开 run 外壳",
    openSafety: "打开安全审查",
    openBilling: "打开支付客服",
    save: "保存报告外壳",
    rebuild: "重建报告外壳",
    lock: "保持报告锁定",
    reset: "清空已保存报告",
    disabledGenerate: "报告生成已禁用",
    saved: "报告外壳已保存到本地。",
    rebuilt: "已根据安全审查重建报告外壳。",
    locked: "报告继续保持锁定。",
    resetDone: "已清空保存的报告外壳。",
    statusLabels: {
      locked: "已锁定",
      ready_placeholder: "占位就绪",
    },
    summaryTitle: "报告摘要",
    seedQuestion: "种子问题",
    runStatus: "Run 状态",
    safetyLevel: "安全等级",
    reportReady: "报告就绪",
    no: "否",
    yes: "是",
    sectionsTitle: "锁定章节",
    claimsTitle: "Claim 占位",
    evidenceTitle: "证据引用",
    confidence: "置信度",
    lockedLabel: "锁定",
    nextStep: "下一步构建",
    nextStepBody:
      "增加支付权益和客服流程。在产品闸门完成前，继续关闭真实生成。",
  },
} as const;

function loadReportsPageContext(): ReportsPageContext {
  const seedContext = loadSeedContextDraft();
  if (!seedContext) {
    return {
      seedContext: null,
      simulationRun: null,
      safetyReview: null,
      savedReport: null,
    };
  }

  return {
    seedContext,
    simulationRun: loadSimulationRunDraft(seedContext.id),
    safetyReview: loadSafetyReviewDraft(seedContext.id),
    savedReport: loadReportDraft(seedContext.id),
  };
}

function getStatusTone(status: ReportStatus) {
  if (status === "ready_placeholder") {
    return "ready";
  }

  return "blocked";
}

export default function ReportsPage() {
  const { locale } = useLanguage();
  const copy = reportsCopy[locale];
  const [context] = useState(loadReportsPageContext);
  const [report, setReport] = useState<ReportDraft | null>(() => {
    if (!context.seedContext || !context.simulationRun || !context.safetyReview) {
      return null;
    }

    return (
      context.savedReport ??
      buildReportDraft(
        context.seedContext,
        context.simulationRun,
        context.safetyReview,
      )
    );
  });
  const [message, setMessage] = useState("");

  function persistReport(nextReport: ReportDraft, nextMessage: string) {
    saveReportDraft(nextReport);
    setReport(nextReport);
    setMessage(nextMessage);
  }

  function saveReport() {
    if (!report) {
      return;
    }

    persistReport(report, copy.saved);
  }

  function rebuildReport() {
    if (!context.seedContext || !context.simulationRun || !context.safetyReview) {
      return;
    }

    persistReport(
      buildReportDraft(
        context.seedContext,
        context.simulationRun,
        context.safetyReview,
      ),
      copy.rebuilt,
    );
  }

  function lockReport() {
    if (!report) {
      return;
    }

    persistReport(lockReportDraft(report, report.lockedReason), copy.locked);
  }

  function resetReport() {
    if (!context.seedContext || !context.simulationRun || !context.safetyReview) {
      return;
    }

    clearReportDraft(context.seedContext.id);
    setReport(
      buildReportDraft(
        context.seedContext,
        context.simulationRun,
        context.safetyReview,
      ),
    );
    setMessage(copy.resetDone);
  }

  if (!context.seedContext) {
    return (
      <AppShell>
        <ReportBlockedState
          title={copy.noSeedTitle}
          body={copy.noSeedBody}
          href="/intake"
          label={copy.openIntake}
        />
      </AppShell>
    );
  }

  if (!context.simulationRun) {
    return (
      <AppShell>
        <ReportBlockedState
          title={copy.noRunTitle}
          body={copy.noRunBody}
          href="/runs"
          label={copy.openRuns}
        />
      </AppShell>
    );
  }

  if (!context.safetyReview) {
    return (
      <AppShell>
        <ReportBlockedState
          title={copy.noSafetyTitle}
          body={copy.noSafetyBody}
          href="/safety"
          label={copy.openSafety}
        />
      </AppShell>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            {copy.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {copy.body}
          </p>
        </div>
        <StatusPill tone={getStatusTone(report.status)}>
          {copy.statusLabels[report.status]}
        </StatusPill>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={saveReport}
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {copy.save}
              </button>
              <button
                type="button"
                onClick={rebuildReport}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {copy.rebuild}
              </button>
              <button
                type="button"
                onClick={lockReport}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {copy.lock}
              </button>
              <button
                type="button"
                onClick={resetReport}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {copy.reset}
              </button>
              <button
                type="button"
                disabled
                className="rounded-md bg-slate-300 px-4 py-2 text-sm font-semibold text-white"
              >
                {copy.disabledGenerate}
              </button>
            </div>
            {message ? (
              <p className="mt-4 text-sm font-medium text-slate-600">
                {message}
              </p>
            ) : null}
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              {report.lockedReason}
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.sectionsTitle}
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {report.reportJson.sections.map((section) => (
                <article
                  key={section.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {section.title}
                    </h3>
                    {section.locked ? (
                      <StatusPill tone="blocked">{copy.lockedLabel}</StatusPill>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {section.body}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.claimsTitle}
            </h2>
            <div className="mt-4 space-y-3">
              {report.claims.map((claim) => (
                <article
                  key={claim.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm leading-6 text-slate-700">
                    {claim.claimText}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {copy.confidence}: {claim.confidence}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {claim.evidenceRefs.map((evidence) => (
                      <StatusPill key={evidence.id} tone="planned">
                        {evidence.label}
                      </StatusPill>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.summaryTitle}
            </h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-slate-900">
                  {copy.seedQuestion}
                </dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {context.seedContext.questionText}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">
                  {copy.runStatus}
                </dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {context.simulationRun.status}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">
                  {copy.safetyLevel}
                </dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {context.safetyReview.safetyLevel}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">
                  {copy.reportReady}
                </dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {context.safetyReview.reportReady ? copy.yes : copy.no}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.nextStep}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy.nextStepBody}
            </p>
            <Link
              href="/billing"
              className="mt-4 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {copy.openBilling}
            </Link>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

type ReportBlockedStateProps = {
  title: string;
  body: string;
  href: string;
  label: string;
};

function ReportBlockedState({
  title,
  body,
  href,
  label,
}: ReportBlockedStateProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <StatusPill tone="blocked">Locked</StatusPill>
      <h1 className="mt-4 text-2xl font-semibold text-slate-950">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{body}</p>
      <Link
        href={href}
        className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        {label}
      </Link>
    </section>
  );
}
