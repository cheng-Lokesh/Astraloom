"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterMigrationRunbookPayload,
  WriterMigrationRunbookPhase,
  WriterMigrationRunbookPhaseId,
  WriterMigrationRunbookProbeResult,
  WriterMigrationRunbookStep,
} from "@/types/writer-migration-runbook";

type WriterMigrationRunbookClientPageProps = {
  payload: WriterMigrationRunbookPayload;
};

const runbookCopy = {
  en: {
    title: "Manual migration application runbook",
    badge: "Runbook only",
    body: "This page defines how a human would apply the reviewed audit/idempotency SQL in Supabase. The app itself cannot create a migration file, apply SQL, create tables, or approve execution.",
    notice:
      "This runbook intentionally stops at instructions. It is not a button, approval record, or database operation.",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    runbookMode: "Runbook mode",
    sourceProposal: "Source proposal",
    sourceChecklist: "Source checklist",
    sqlHash: "SQL hash",
    reviewItems: "Review items",
    blockingReviewItems: "Blocking review items",
    phases: "Phases",
    steps: "Steps",
    blockingSteps: "Blocking steps",
    humanOperatorRequired: "Human operator required",
    appCanApplyMigration: "App can apply migration",
    approvedToApplyMigration: "Approved to apply migration",
    shouldApplyMigrationNow: "Should apply migration now",
    wouldCreateMigrationFile: "Would create migration file",
    wouldApplyMigration: "Would apply migration",
    wouldCreateTables: "Would create tables",
    wouldAlterExistingTables: "Would alter existing tables",
    wouldWriteRows: "Would write rows",
    wouldWriteAuditRows: "Would write audit rows",
    wouldReserveIdempotencyKeys: "Would reserve idempotency keys",
    wouldCreateServiceRoleClient: "Would create service-role client",
    wouldReadServiceRoleSecret: "Would read service-role secret",
    wouldCallAi: "Would call AI",
    wouldCallStripe: "Would call Stripe",
    yes: "Yes",
    no: "No",
    globalRules: "Global rules",
    boundaries: "Manual execution boundaries",
    runbookPhases: "Runbook phases",
    requiredOperator: "Required operator",
    exitCriteria: "Exit criteria",
    instruction: "Instruction",
    requiredEvidence: "Required evidence",
    stopCondition: "Stop condition",
    owner: "Owner",
    status: "Status",
    notStarted: "Not started",
    manualOnly: "Manual only",
    blocking: "Blocking",
    sourceRefs: "Source refs",
    probe: "Probe phase",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe: "Probe a phase to confirm the runbook remains blocked and cannot apply SQL.",
    openProposal: "Open SQL proposal",
    openReview: "Open SQL review",
    openSchemaVerification: "Open schema verify",
    openDashboard: "Back to dashboard",
  },
  zh: {
    title: "Manual migration application runbook",
    badge: "仅执行手册",
    body: "这个页面定义人工如何在 Supabase 中应用已审查的 audit/idempotency SQL。应用本身不能创建 migration 文件、不能应用 SQL、不能建表，也不能批准执行。",
    notice:
      "这个 runbook 只提供步骤说明。它不是按钮、不是审批记录，也不是数据库操作。",
    safetyState: "安全状态",
    safeMode: "安全模式",
    readOnly: "只读",
    runbookMode: "Runbook 模式",
    sourceProposal: "来源提案",
    sourceChecklist: "来源审查清单",
    sqlHash: "SQL hash",
    reviewItems: "审查项",
    blockingReviewItems: "阻断审查项",
    phases: "阶段",
    steps: "步骤",
    blockingSteps: "阻断步骤",
    humanOperatorRequired: "需要人工操作",
    appCanApplyMigration: "应用能否执行 migration",
    approvedToApplyMigration: "是否批准执行 migration",
    shouldApplyMigrationNow: "现在是否应该执行 migration",
    wouldCreateMigrationFile: "是否创建 migration 文件",
    wouldApplyMigration: "是否应用 migration",
    wouldCreateTables: "是否创建表",
    wouldAlterExistingTables: "是否修改现有表",
    wouldWriteRows: "是否写入数据",
    wouldWriteAuditRows: "是否写入 audit",
    wouldReserveIdempotencyKeys: "是否预留幂等键",
    wouldCreateServiceRoleClient: "是否创建 service-role client",
    wouldReadServiceRoleSecret: "是否读取 service-role secret",
    wouldCallAi: "是否调用 AI",
    wouldCallStripe: "是否调用 Stripe",
    yes: "是",
    no: "否",
    globalRules: "全局规则",
    boundaries: "人工执行边界",
    runbookPhases: "Runbook 阶段",
    requiredOperator: "所需操作人",
    exitCriteria: "退出标准",
    instruction: "操作说明",
    requiredEvidence: "所需证据",
    stopCondition: "停止条件",
    owner: "负责人",
    status: "状态",
    notStarted: "未开始",
    manualOnly: "仅人工",
    blocking: "阻断",
    sourceRefs: "来源引用",
    probe: "探测阶段",
    probing: "探测中...",
    probeResult: "探测结果",
    noProbe: "探测一个阶段，确认 runbook 仍然阻断，且不能应用 SQL。",
    openProposal: "打开 SQL 提案",
    openReview: "打开 SQL 审查",
    openSchemaVerification: "打开 Schema 验证",
    openDashboard: "返回工作台",
  },
} as const;

type RunbookCopy = (typeof runbookCopy)[keyof typeof runbookCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: RunbookCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function TextList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-slate-600">
      {items.map((item) => (
        <li key={item} className="rounded-md bg-slate-50 px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  );
}

function InlineList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function RunbookStepCard({
  step,
  copy,
}: {
  step: WriterMigrationRunbookStep;
  copy: RunbookCopy;
}) {
  return (
    <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">{step.title}</h4>
          <p className="mt-1 font-mono text-xs text-slate-500">{step.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="planned">{copy.manualOnly}</StatusPill>
          <StatusPill tone="blocked">{copy.notStarted}</StatusPill>
          {step.blocking ? (
            <StatusPill tone="blocked">{copy.blocking}</StatusPill>
          ) : null}
        </div>
      </div>

      <dl className="mt-3 grid gap-3 text-sm leading-6 text-slate-600">
        <div>
          <dt className="font-semibold text-slate-700">{copy.instruction}</dt>
          <dd>{step.instruction}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-700">
            {copy.requiredEvidence}
          </dt>
          <dd>{step.requiredEvidence}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-700">{copy.stopCondition}</dt>
          <dd>{step.stopCondition}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-700">{copy.owner}</dt>
          <dd>{step.owner}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-700">{copy.sourceRefs}</dt>
          <dd className="mt-1">
            <InlineList items={step.sourceRefs} />
          </dd>
        </div>
      </dl>
    </article>
  );
}

function RunbookPhaseCard({
  phase,
  copy,
  onProbe,
  isProbing,
}: {
  phase: WriterMigrationRunbookPhase;
  copy: RunbookCopy;
  onProbe: (phaseId: WriterMigrationRunbookPhaseId) => void;
  isProbing: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {phase.title}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {phase.purpose}
          </p>
        </div>
        <StatusPill tone="blocked">{copy.manualOnly}</StatusPill>
      </div>

      <dl className="mt-4 grid gap-4 text-sm leading-6 md:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-700">
            {copy.requiredOperator}
          </dt>
          <dd className="text-slate-600">{phase.requiredOperator}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-700">{copy.exitCriteria}</dt>
          <dd className="text-slate-600">{phase.exitCriteria}</dd>
        </div>
      </dl>

      <div className="mt-4 grid gap-3">
        {phase.steps.map((step) => (
          <RunbookStepCard key={step.id} step={step} copy={copy} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => onProbe(phase.id)}
        disabled={isProbing}
        className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isProbing ? copy.probing : copy.probe}
      </button>
    </article>
  );
}

export function WriterMigrationRunbookClientPage({
  payload,
}: WriterMigrationRunbookClientPageProps) {
  const { locale } = useLanguage();
  const copy = runbookCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterMigrationRunbookProbeResult | null>(null);
  const [probingPhaseId, setProbingPhaseId] =
    useState<WriterMigrationRunbookPhaseId | null>(null);

  async function probe(phaseId: WriterMigrationRunbookPhaseId) {
    setProbingPhaseId(phaseId);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/migration-runbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phaseId }),
      });
      const result = (await response.json()) as WriterMigrationRunbookProbeResult;
      setProbeResult(result);
    } finally {
      setProbingPhaseId(null);
    }
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
        <StatusPill tone="blocked">{copy.badge}</StatusPill>
      </div>

      <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        {copy.notice}
      </section>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.safetyState}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <BoolPill value={payload.safeMode} label={copy.safeMode} copy={copy} />
          <BoolPill value={payload.readOnly} label={copy.readOnly} copy={copy} />
          <StatusPill tone="planned">
            {copy.runbookMode}: {payload.runbookMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceProposal}: {payload.sourceMigrationName}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceChecklist}: {payload.sourceChecklistMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sqlHash}: {payload.sourceSqlSha256}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.reviewItems}: {payload.sourceReviewItemCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.blockingReviewItems}: {payload.sourceReviewBlockingItemCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.phases}: {payload.phaseCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.steps}: {payload.stepCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.blockingSteps}: {payload.blockingStepCount}
          </StatusPill>
          <BoolPill
            value={payload.humanOperatorRequired}
            label={copy.humanOperatorRequired}
            copy={copy}
          />
          <BoolPill
            value={payload.appCanApplyMigration}
            label={copy.appCanApplyMigration}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.approvedToApplyMigration}
            label={copy.approvedToApplyMigration}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.shouldApplyMigrationNow}
            label={copy.shouldApplyMigrationNow}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldCreateMigrationFile}
            label={copy.wouldCreateMigrationFile}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldApplyMigration}
            label={copy.wouldApplyMigration}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldCreateTables}
            label={copy.wouldCreateTables}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldAlterExistingTables}
            label={copy.wouldAlterExistingTables}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldWriteRows}
            label={copy.wouldWriteRows}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldWriteAuditRows}
            label={copy.wouldWriteAuditRows}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldReserveIdempotencyKeys}
            label={copy.wouldReserveIdempotencyKeys}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldCreateServiceRoleClient}
            label={copy.wouldCreateServiceRoleClient}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldReadServiceRoleSecret}
            label={copy.wouldReadServiceRoleSecret}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldCallAi}
            label={copy.wouldCallAi}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldCallStripe}
            label={copy.wouldCallStripe}
            copy={copy}
            readyWhenTrue={false}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/server-writers/migration"
            className="rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
          >
            {copy.openProposal}
          </Link>
          <Link
            href="/server-writers/migration-review"
            className="rounded-md border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-800 transition hover:bg-purple-100"
          >
            {copy.openReview}
          </Link>
          <Link
            href="/server-writers/schema-verification"
            className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
          >
            {copy.openSchemaVerification}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            {copy.openDashboard}
          </Link>
        </div>
      </section>

      <div className="mb-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.globalRules}
          </h2>
          <div className="mt-4">
            <TextList items={payload.globalRules} />
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.probeResult}
          </h2>
          {probeResult ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm leading-6 text-slate-600">
                {probeResult.summary}
              </p>
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="blocked">
                  {copy.steps}: {probeResult.stepCount}
                </StatusPill>
                <StatusPill tone="blocked">
                  {copy.blockingSteps}: {probeResult.blockingStepCount}
                </StatusPill>
                <BoolPill
                  value={probeResult.appCanApplyMigration}
                  label={copy.appCanApplyMigration}
                  copy={copy}
                  readyWhenTrue={false}
                />
                <BoolPill
                  value={probeResult.wouldApplyMigration}
                  label={copy.wouldApplyMigration}
                  copy={copy}
                  readyWhenTrue={false}
                />
                <BoolPill
                  value={probeResult.wouldCreateTables}
                  label={copy.wouldCreateTables}
                  copy={copy}
                  readyWhenTrue={false}
                />
              </div>
              <div className="grid gap-3">
                {probeResult.steps.map((step) => (
                  <RunbookStepCard key={step.id} step={step} copy={copy} />
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy.noProbe}
            </p>
          )}
        </aside>
      </div>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.boundaries}
        </h2>
        <div className="mt-4">
          <TextList items={payload.manualExecutionBoundaries} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.runbookPhases}
        </h2>
        <div className="grid gap-4">
          {payload.phases.map((phase) => (
            <RunbookPhaseCard
              key={phase.id}
              phase={phase}
              copy={copy}
              onProbe={probe}
              isProbing={probingPhaseId === phase.id}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
