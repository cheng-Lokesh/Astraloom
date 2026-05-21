"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import { buildSafetyReviewDraft, markSafetyBlocked } from "@/lib/safety/build";
import {
  clearSafetyReviewDraft,
  loadSafetyReviewDraft,
  saveSafetyReviewDraft,
} from "@/lib/safety/storage";
import { loadSeedContextDraft } from "@/lib/seed-context/storage";
import { loadSimulationRunDraft } from "@/lib/runs/storage";
import type {
  SafetyCheckStatus,
  SafetyLevel,
  SafetyReviewDraft,
} from "@/types/safety-review";
import type { SeedContextDraft } from "@/types/seed-context";
import type { SimulationRunDraft } from "@/types/simulation-run";

type SafetyPageContext = {
  seedContext: SeedContextDraft | null;
  simulationRun: SimulationRunDraft | null;
  savedReview: SafetyReviewDraft | null;
};

const safetyCopy = {
  en: {
    title: "SafetyVerifier shell",
    status: "Report locked",
    body: "This page defines safety gates before any report can be shown. It does not inspect real generated content yet because generation is still disabled.",
    noSeedTitle: "Seed context required",
    noSeedBody: "Create a seed context before safety review can exist.",
    noRunTitle: "Saved run shell required",
    noRunBody:
      "Queue or save a simulation run shell first. SafetyVerifier attaches to a specific run.",
    openIntake: "Open seed intake",
    openRuns: "Open run shell",
    openReports: "Open report shell",
    save: "Save safety shell",
    rebuild: "Rebuild safety shell",
    block: "Keep report blocked",
    reset: "Clear saved safety shell",
    disabledReport: "Report generation disabled",
    saved: "Safety shell saved locally.",
    rebuilt: "Safety shell rebuilt from the saved run.",
    blocked: "Report remains blocked.",
    resetDone: "Saved safety shell cleared.",
    levelLabels: {
      unreviewed: "Unreviewed",
      normal: "Normal",
      caution: "Caution",
      blocked: "Blocked",
    },
    riskLabels: {
      crisis: "Crisis or self-harm",
      professional_advice: "Medical, legal, or financial advice",
      harassment: "Harassment or targeted abuse",
      deterministic_claims: "Unsafe deterministic claims",
    },
    actionLabels: {
      allow_after_review: "Allow after review",
      manual_review: "Manual review",
      block_report: "Block report",
    },
    gateLabels: {
      run_shell: "Run shell",
      generated_content: "Generated content",
      risk_scanners: "Risk scanners",
      report_ready: "Report readiness",
    },
    statusLabels: {
      ready: "Ready",
      not_checked: "Not checked",
      blocked: "Blocked",
    },
    summaryTitle: "Safety summary",
    seedQuestion: "Seed question",
    runStatus: "Run status",
    policy: "Policy",
    reportReady: "Report ready",
    no: "No",
    yes: "Yes",
    risksTitle: "Blocked risk classes",
    gatesTitle: "Readiness gates",
    nextStep: "Next build step",
    nextStepBody:
      "Create a report shell that can only read from a report-ready safety review. Keep real report generation disabled.",
  },
  zh: {
    title: "SafetyVerifier 外壳",
    status: "报告已锁定",
    body: "这个页面定义报告展示前的安全闸门。由于真实生成仍关闭，这里还不会检查真实生成内容。",
    noSeedTitle: "需要先保存种子上下文",
    noSeedBody: "请先创建种子上下文，然后才能建立安全审查。",
    noRunTitle: "需要先保存 run 外壳",
    noRunBody: "请先排队或保存 simulation run 外壳。SafetyVerifier 必须挂在具体 run 上。",
    openIntake: "打开推演入口",
    openRuns: "打开 run 外壳",
    openReports: "打开报告外壳",
    save: "保存安全外壳",
    rebuild: "重建安全外壳",
    block: "保持报告阻断",
    reset: "清空已保存安全外壳",
    disabledReport: "报告生成已禁用",
    saved: "安全外壳已保存到本地。",
    rebuilt: "已根据保存的 run 重建安全外壳。",
    blocked: "报告继续保持阻断。",
    resetDone: "已清空保存的安全外壳。",
    levelLabels: {
      unreviewed: "未审查",
      normal: "正常",
      caution: "谨慎",
      blocked: "阻断",
    },
    riskLabels: {
      crisis: "危机或自伤风险",
      professional_advice: "医疗、法律或金融建议",
      harassment: "骚扰或定向攻击",
      deterministic_claims: "不安全的宿命式断言",
    },
    actionLabels: {
      allow_after_review: "审查后允许",
      manual_review: "人工复核",
      block_report: "阻断报告",
    },
    gateLabels: {
      run_shell: "Run 外壳",
      generated_content: "生成内容",
      risk_scanners: "风险扫描器",
      report_ready: "报告就绪",
    },
    statusLabels: {
      ready: "就绪",
      not_checked: "未检查",
      blocked: "阻断",
    },
    summaryTitle: "安全摘要",
    seedQuestion: "种子问题",
    runStatus: "Run 状态",
    policy: "策略版本",
    reportReady: "报告就绪",
    no: "否",
    yes: "是",
    risksTitle: "阻断风险类别",
    gatesTitle: "就绪闸门",
    nextStep: "下一步构建",
    nextStepBody:
      "创建报告外壳，并规定它只能读取 report-ready 的安全审查。继续关闭真实报告生成。",
  },
} as const;

function loadSafetyPageContext(): SafetyPageContext {
  const seedContext = loadSeedContextDraft();
  if (!seedContext) {
    return {
      seedContext: null,
      simulationRun: null,
      savedReview: null,
    };
  }

  return {
    seedContext,
    simulationRun: loadSimulationRunDraft(seedContext.id),
    savedReview: loadSafetyReviewDraft(seedContext.id),
  };
}

function getStatusTone(status: SafetyCheckStatus) {
  if (status === "ready") {
    return "ready";
  }

  if (status === "blocked") {
    return "blocked";
  }

  return "planned";
}

function getLevelTone(level: SafetyLevel) {
  if (level === "normal") {
    return "ready";
  }

  if (level === "blocked") {
    return "blocked";
  }

  return "planned";
}

export default function SafetyPage() {
  const { locale } = useLanguage();
  const copy = safetyCopy[locale];
  const [context] = useState(loadSafetyPageContext);
  const [review, setReview] = useState<SafetyReviewDraft | null>(() => {
    if (!context.seedContext || !context.simulationRun) {
      return null;
    }

    return (
      context.savedReview ??
      buildSafetyReviewDraft(context.seedContext, context.simulationRun)
    );
  });
  const [message, setMessage] = useState("");

  function persistReview(nextReview: SafetyReviewDraft, nextMessage: string) {
    saveSafetyReviewDraft(nextReview);
    setReview(nextReview);
    setMessage(nextMessage);
  }

  function saveReview() {
    if (!review) {
      return;
    }

    persistReview(review, copy.saved);
  }

  function rebuildReview() {
    if (!context.seedContext || !context.simulationRun) {
      return;
    }

    persistReview(
      buildSafetyReviewDraft(context.seedContext, context.simulationRun),
      copy.rebuilt,
    );
  }

  function blockReview() {
    if (!review) {
      return;
    }

    persistReview(markSafetyBlocked(review), copy.blocked);
  }

  function resetReview() {
    if (!context.seedContext || !context.simulationRun) {
      return;
    }

    clearSafetyReviewDraft(context.seedContext.id);
    setReview(buildSafetyReviewDraft(context.seedContext, context.simulationRun));
    setMessage(copy.resetDone);
  }

  if (!context.seedContext) {
    return (
      <AppShell>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <StatusPill tone="blocked">{copy.status}</StatusPill>
          <h1 className="mt-4 text-2xl font-semibold text-slate-950">
            {copy.noSeedTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {copy.noSeedBody}
          </p>
          <Link
            href="/intake"
            className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {copy.openIntake}
          </Link>
        </section>
      </AppShell>
    );
  }

  if (!context.simulationRun) {
    return (
      <AppShell>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <StatusPill tone="blocked">{copy.status}</StatusPill>
          <h1 className="mt-4 text-2xl font-semibold text-slate-950">
            {copy.noRunTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {copy.noRunBody}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/runs"
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {copy.openRuns}
            </Link>
            <Link
              href="/intake"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copy.openIntake}
            </Link>
          </div>
        </section>
      </AppShell>
    );
  }

  if (!review) {
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
        <StatusPill tone={getLevelTone(review.safetyLevel)}>
          {copy.levelLabels[review.safetyLevel]}
        </StatusPill>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={saveReview}
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {copy.save}
              </button>
              <button
                type="button"
                onClick={rebuildReview}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {copy.rebuild}
              </button>
              <button
                type="button"
                onClick={blockReview}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {copy.block}
              </button>
              <button
                type="button"
                onClick={resetReview}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {copy.reset}
              </button>
              <button
                type="button"
                disabled
                className="rounded-md bg-slate-300 px-4 py-2 text-sm font-semibold text-white"
              >
                {copy.disabledReport}
              </button>
            </div>
            {message ? (
              <p className="mt-4 text-sm font-medium text-slate-600">
                {message}
              </p>
            ) : null}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.risksTitle}
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {review.riskChecks.map((risk) => (
                <article
                  key={risk.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {copy.riskLabels[risk.id]}
                    </h3>
                    <StatusPill tone={getStatusTone(risk.status)}>
                      {copy.actionLabels[risk.action]}
                    </StatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {risk.detail}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.gatesTitle}
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {review.gates.map((gate) => (
                <article
                  key={gate.id}
                  className="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {copy.gateLabels[gate.id]}
                    </h3>
                    <StatusPill tone={getStatusTone(gate.status)}>
                      {copy.statusLabels[gate.status]}
                    </StatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {gate.detail}
                  </p>
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
                <dt className="font-semibold text-slate-900">{copy.policy}</dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {review.policyVersion}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">
                  {copy.reportReady}
                </dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {review.reportReady ? copy.yes : copy.no}
                </dd>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                {review.reportBlockedReason}
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
              href="/reports"
              className="mt-4 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {copy.openReports}
            </Link>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
