"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAdapterCheck,
  WriterPersistenceAdapterCheckCategory,
  WriterPersistenceAdapterDesignPayload,
  WriterPersistenceAdapterDesignProbeResult,
  WriterPersistenceAdapterFailureMode,
  WriterPersistenceAdapterMethod,
  WriterPersistenceAdapterMethodId,
  WriterPersistenceAdapterPhase,
} from "@/types/writer-persistence-adapter-design";

type WriterPersistenceAdapterClientPageProps = {
  payload: WriterPersistenceAdapterDesignPayload;
};

const adapterCopy = {
  en: {
    title: "Audit/idempotency persistence adapter design",
    badge: "Design only",
    body: "This page defines the future server-only persistence adapter boundary: method shapes, transaction order, failure modes, rollback handoff, and release blockers. It does not implement or execute the adapter.",
    notice:
      "No service-role client, transaction, audit row, idempotency key, evidence record, compensation row, AI call, Stripe call, or report unlock can happen here.",
    safetyState: "Safety state",
    designMode: "Design mode",
    dryRunMode: "Dry-run source",
    verificationMode: "Verification source",
    checkedAt: "Checked at",
    methods: "Methods",
    phases: "Phases",
    failures: "Failure modes",
    contractReadiness: "Contract readiness",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    schemaVerified: "Schema verified",
    readyForWriters: "Ready for writer implementation",
    adapterImplemented: "Adapter implemented",
    adapterCanRun: "Adapter can run",
    transactionAllowed: "Transaction implementation allowed",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldImportRealWriter: "Would import real writer",
    wouldCreateServiceRoleClient: "Would create service-role client",
    wouldReadServiceRoleSecret: "Would read service-role secret",
    wouldPersistEvidence: "Would persist evidence",
    wouldWriteRows: "Would write rows",
    wouldWriteAuditRows: "Would write audit rows",
    wouldReserveIdempotencyKeys: "Would reserve idempotency keys",
    wouldWriteIdempotencyRows: "Would write idempotency rows",
    wouldWriteCompensationRows: "Would write compensation rows",
    wouldApplyMigration: "Would apply migration",
    wouldCreateTables: "Would create tables",
    wouldEnableWriters: "Would enable writers",
    wouldCallAi: "Would call AI",
    wouldCallStripe: "Would call Stripe",
    wouldUnlockReports: "Would unlock reports",
    yes: "Yes",
    no: "No",
    globalRules: "Global rules",
    sharedChecks: "Shared checks",
    adapterMethods: "Adapter methods",
    transactionPhases: "Transaction order",
    failureModes: "Failure modes",
    contracts: "Writer contract readiness",
    purpose: "Purpose",
    futureOwner: "Future owner",
    inputs: "Inputs",
    outputs: "Outputs",
    tables: "Tables",
    transactionBoundary: "Transaction boundary",
    rollbackBehavior: "Rollback behavior",
    blockedCodes: "Blocked codes",
    checks: "Checks",
    evidenceRequired: "Evidence required",
    probeMethod: "Probe method",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one method to confirm the adapter remains design-only and blocked.",
    openDryRun: "Open persistence gate",
    openRollout: "Open rollout",
    openDashboard: "Back to dashboard",
    order: "Order",
    atomicityRule: "Atomicity rule",
    trigger: "Trigger",
    requiredResponse: "Required response",
    auditRequirement: "Audit requirement",
    idempotencyRequirement: "Idempotency requirement",
    rolloutReadiness: "Rollout readiness",
    firstAudience: "First audience",
    implementationAllowed: "Implementation allowed",
    methodLabels: {
      start_persistence_attempt: "Start persistence attempt",
      reserve_idempotency_key: "Reserve idempotency key",
      append_audit_attempt: "Append audit attempt",
      commit_future_writer_result: "Commit future writer result",
      finalize_idempotency_result: "Finalize idempotency result",
      record_compensation_required: "Record compensation required",
    } satisfies Record<WriterPersistenceAdapterMethodId, string>,
    categoryLabels: {
      source_gate: "Source gate",
      schema: "Schema",
      transaction_order: "Transaction order",
      idempotency: "Idempotency",
      audit: "Audit",
      evidence: "Evidence",
      rollback: "Rollback",
      service_role: "Service role",
      release_approval: "Release approval",
      implementation_gap: "Implementation gap",
    } satisfies Record<WriterPersistenceAdapterCheckCategory, string>,
  },
  zh: {
    title: "审计/幂等持久化适配器设计",
    badge: "仅设计",
    body: "这个页面定义未来服务端持久化适配器的边界：方法形状、事务顺序、失败模式、回滚交接和发布阻断项。它不会实现或执行适配器。",
    notice:
      "这里不会创建 service-role client，不会开启事务，不会写 audit 行，不会预留幂等 key，不会保存证据，不会写补偿行，也不会调用 AI、Stripe 或解锁报告。",
    safetyState: "安全状态",
    designMode: "设计模式",
    dryRunMode: "Dry-run 来源",
    verificationMode: "验证来源",
    checkedAt: "检查时间",
    methods: "方法",
    phases: "阶段",
    failures: "失败模式",
    contractReadiness: "契约就绪度",
    safeMode: "安全模式",
    readOnly: "只读",
    schemaVerified: "Schema 已验证",
    readyForWriters: "可进入 writer 实现",
    adapterImplemented: "适配器已实现",
    adapterCanRun: "适配器可运行",
    transactionAllowed: "允许事务实现",
    allRuntimeBlocked: "所有运行时影响已阻断",
    wouldImportRealWriter: "是否导入真实 writer",
    wouldCreateServiceRoleClient: "是否创建 service-role client",
    wouldReadServiceRoleSecret: "是否读取 service-role secret",
    wouldPersistEvidence: "是否持久化证据",
    wouldWriteRows: "是否写入数据行",
    wouldWriteAuditRows: "是否写入 audit",
    wouldReserveIdempotencyKeys: "是否预留幂等 key",
    wouldWriteIdempotencyRows: "是否写入幂等行",
    wouldWriteCompensationRows: "是否写入补偿行",
    wouldApplyMigration: "是否应用 migration",
    wouldCreateTables: "是否创建表",
    wouldEnableWriters: "是否启用 writers",
    wouldCallAi: "是否调用 AI",
    wouldCallStripe: "是否调用 Stripe",
    wouldUnlockReports: "是否解锁报告",
    yes: "是",
    no: "否",
    globalRules: "全局规则",
    sharedChecks: "共享检查",
    adapterMethods: "适配器方法",
    transactionPhases: "事务顺序",
    failureModes: "失败模式",
    contracts: "Writer 契约就绪度",
    purpose: "用途",
    futureOwner: "未来归属模块",
    inputs: "输入",
    outputs: "输出",
    tables: "表",
    transactionBoundary: "事务边界",
    rollbackBehavior: "回滚行为",
    blockedCodes: "阻断代码",
    checks: "检查项",
    evidenceRequired: "所需证据",
    probeMethod: "探测方法",
    probing: "探测中...",
    probeResult: "探测结果",
    noProbe: "探测一个方法，确认适配器仍然只是设计且保持阻断。",
    openDryRun: "打开持久化门槛",
    openRollout: "打开发布清单",
    openDashboard: "返回工作台",
    order: "顺序",
    atomicityRule: "原子性规则",
    trigger: "触发",
    requiredResponse: "必要响应",
    auditRequirement: "审计要求",
    idempotencyRequirement: "幂等要求",
    rolloutReadiness: "发布就绪度",
    firstAudience: "首批对象",
    implementationAllowed: "允许实现",
    methodLabels: {
      start_persistence_attempt: "开始持久化尝试",
      reserve_idempotency_key: "预留幂等 key",
      append_audit_attempt: "追加审计尝试",
      commit_future_writer_result: "提交未来 writer 结果",
      finalize_idempotency_result: "完成幂等状态",
      record_compensation_required: "记录补偿需求",
    } satisfies Record<WriterPersistenceAdapterMethodId, string>,
    categoryLabels: {
      source_gate: "来源门槛",
      schema: "Schema",
      transaction_order: "事务顺序",
      idempotency: "幂等",
      audit: "审计",
      evidence: "证据",
      rollback: "回滚",
      service_role: "Service role",
      release_approval: "发布审批",
      implementation_gap: "实现缺口",
    } satisfies Record<WriterPersistenceAdapterCheckCategory, string>,
  },
} as const;

type AdapterCopy = (typeof adapterCopy)[keyof typeof adapterCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: AdapterCopy;
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

function CheckList({
  checks,
  copy,
}: {
  checks: WriterPersistenceAdapterCheck[];
  copy: AdapterCopy;
}) {
  return (
    <div className="grid gap-3">
      {checks.map((check) => (
        <article
          key={check.id}
          className="rounded-md border border-slate-200 bg-slate-50 p-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-950">
                {check.title}
              </h4>
              <p className="mt-1 font-mono text-xs text-slate-500">
                {check.id}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill tone="planned">
                {copy.categoryLabels[check.category]}
              </StatusPill>
              <StatusPill
                tone={check.status === "passed" ? "ready" : "blocked"}
              >
                {check.status}
              </StatusPill>
            </div>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {check.detail}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            <span className="font-semibold">{copy.evidenceRequired}: </span>
            {check.evidenceRequired}
          </p>
        </article>
      ))}
    </div>
  );
}

function MethodCard({
  method,
  copy,
  onProbe,
  isProbing,
}: {
  method: WriterPersistenceAdapterMethod;
  copy: AdapterCopy;
  onProbe: (methodId: WriterPersistenceAdapterMethodId) => void;
  isProbing: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {copy.methodLabels[method.id]}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {method.purpose}
          </p>
        </div>
        <StatusPill tone="blocked">{copy.badge}</StatusPill>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill tone="planned">
          {copy.futureOwner}: {method.futureOwnerModule}
        </StatusPill>
        <StatusPill tone="planned">
          {copy.tables}: {method.futureTableNames.join(", ") || "none"}
        </StatusPill>
        <BoolPill
          value={method.canRunNow}
          label={copy.adapterCanRun}
          copy={copy}
          readyWhenTrue={false}
        />
        <BoolPill
          value={method.wouldWriteRows}
          label={copy.wouldWriteRows}
          copy={copy}
          readyWhenTrue={false}
        />
        <BoolPill
          value={method.wouldCreateServiceRoleClient}
          label={copy.wouldCreateServiceRoleClient}
          copy={copy}
          readyWhenTrue={false}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-950">
              {copy.inputs}
            </h4>
            <div className="mt-2">
              <TextList items={method.futureInputRefs} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-950">
              {copy.outputs}
            </h4>
            <div className="mt-2">
              <TextList items={method.futureOutputRefs} />
            </div>
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
            <span className="font-semibold text-slate-900">
              {copy.transactionBoundary}:{" "}
            </span>
            {method.transactionBoundary}
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
            <span className="font-semibold text-slate-900">
              {copy.rollbackBehavior}:{" "}
            </span>
            {method.rollbackBehavior}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.checks}
          </h4>
          <div className="mt-2">
            <CheckList checks={method.checks} copy={copy} />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onProbe(method.id)}
        disabled={isProbing}
        className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isProbing ? copy.probing : copy.probeMethod}
      </button>
    </article>
  );
}

function PhaseCard({
  phase,
  copy,
}: {
  phase: WriterPersistenceAdapterPhase;
  copy: AdapterCopy;
}) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            {copy.order} {phase.order}: {phase.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {phase.purpose}
          </p>
        </div>
        <StatusPill tone="blocked">{phase.currentStatus}</StatusPill>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        <span className="font-semibold">{copy.atomicityRule}: </span>
        {phase.futureAtomicityRule}
      </p>
      <div className="mt-3">
        <TextList items={phase.blockedBy} />
      </div>
    </article>
  );
}

function FailureCard({
  failure,
  copy,
}: {
  failure: WriterPersistenceAdapterFailureMode;
  copy: AdapterCopy;
}) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-950">
          {failure.title}
        </h3>
        <StatusPill tone="planned">{failure.currentStatus}</StatusPill>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        <span className="font-semibold text-slate-900">{copy.trigger}: </span>
        {failure.trigger}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        <span className="font-semibold text-slate-900">
          {copy.requiredResponse}:{" "}
        </span>
        {failure.requiredResponse}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        <span className="font-semibold text-slate-900">
          {copy.auditRequirement}:{" "}
        </span>
        {failure.auditRequirement}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        <span className="font-semibold text-slate-900">
          {copy.idempotencyRequirement}:{" "}
        </span>
        {failure.idempotencyRequirement}
      </p>
    </article>
  );
}

export function WriterPersistenceAdapterClientPage({
  payload,
}: WriterPersistenceAdapterClientPageProps) {
  const { locale } = useLanguage();
  const copy = adapterCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAdapterDesignProbeResult | null>(null);
  const [probingMethod, setProbingMethod] =
    useState<WriterPersistenceAdapterMethodId | null>(null);

  async function probe(methodId: WriterPersistenceAdapterMethodId) {
    setProbingMethod(methodId);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/persistence-adapter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ methodId }),
      });
      const result =
        (await response.json()) as WriterPersistenceAdapterDesignProbeResult;
      setProbeResult(result);
    } finally {
      setProbingMethod(null);
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
            {copy.designMode}: {payload.designMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.dryRunMode}: {payload.sourceDryRunGateMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.verificationMode}: {payload.sourceVerificationMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.checkedAt}: {payload.checkedAt}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.methods}: {payload.methodCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.phases}: {payload.phaseCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.failures}: {payload.failureModeCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.contractReadiness}: {payload.contractReadinessCount}
          </StatusPill>
          <BoolPill
            value={payload.schemaVerified}
            label={copy.schemaVerified}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.readyForWriterImplementation}
            label={copy.readyForWriters}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.adapterImplemented}
            label={copy.adapterImplemented}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.adapterCanRun}
            label={copy.adapterCanRun}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.transactionImplementationAllowed}
            label={copy.transactionAllowed}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.allRuntimeEffectsBlocked}
            label={copy.allRuntimeBlocked}
            copy={copy}
          />
          <BoolPill
            value={payload.wouldImportRealWriterImplementation}
            label={copy.wouldImportRealWriter}
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
            value={payload.wouldPersistEvidence}
            label={copy.wouldPersistEvidence}
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
            value={payload.wouldWriteIdempotencyRows}
            label={copy.wouldWriteIdempotencyRows}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldWriteCompensationRows}
            label={copy.wouldWriteCompensationRows}
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
            value={payload.wouldEnableWriters}
            label={copy.wouldEnableWriters}
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
          <BoolPill
            value={payload.wouldUnlockReports}
            label={copy.wouldUnlockReports}
            copy={copy}
            readyWhenTrue={false}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/server-writers/persistence-dry-run"
            className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            {copy.openDryRun}
          </Link>
          <Link
            href="/server-writers/rollout"
            className="rounded-md border border-fuchsia-300 bg-fuchsia-50 px-4 py-2 text-sm font-semibold text-fuchsia-800 transition hover:bg-fuchsia-100"
          >
            {copy.openRollout}
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
                  {probeResult.methodId
                    ? copy.methodLabels[probeResult.methodId]
                    : copy.badge}
                </StatusPill>
                <BoolPill
                  value={probeResult.allRuntimeEffectsBlocked}
                  label={copy.allRuntimeBlocked}
                  copy={copy}
                />
                <BoolPill
                  value={probeResult.wouldWriteRows}
                  label={copy.wouldWriteRows}
                  copy={copy}
                  readyWhenTrue={false}
                />
                <BoolPill
                  value={probeResult.wouldCreateServiceRoleClient}
                  label={copy.wouldCreateServiceRoleClient}
                  copy={copy}
                  readyWhenTrue={false}
                />
              </div>
              <CheckList checks={probeResult.checks} copy={copy} />
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
          {copy.sharedChecks}
        </h2>
        <div className="mt-4">
          <CheckList checks={payload.sharedChecks} copy={copy} />
        </div>
      </section>

      <section className="mb-5">
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.adapterMethods}
        </h2>
        <div className="grid gap-4">
          {payload.methods.map((method) => (
            <MethodCard
              key={method.id}
              method={method}
              copy={copy}
              onProbe={probe}
              isProbing={probingMethod === method.id}
            />
          ))}
        </div>
      </section>

      <section className="mb-5">
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.transactionPhases}
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {payload.phases.map((phase) => (
            <PhaseCard key={phase.id} phase={phase} copy={copy} />
          ))}
        </div>
      </section>

      <section className="mb-5">
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.failureModes}
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {payload.failureModes.map((failure) => (
            <FailureCard key={failure.id} failure={failure} copy={copy} />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.contracts}
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-3 pr-4 font-semibold">Contract</th>
                <th className="py-3 pr-4 font-semibold">
                  {copy.rolloutReadiness}
                </th>
                <th className="py-3 pr-4 font-semibold">{copy.tables}</th>
                <th className="py-3 pr-4 font-semibold">
                  {copy.firstAudience}
                </th>
                <th className="py-3 font-semibold">
                  {copy.implementationAllowed}
                </th>
              </tr>
            </thead>
            <tbody>
              {payload.contractReadiness.map((contract) => (
                <tr
                  key={contract.contractId}
                  className="border-b border-slate-100 align-top"
                >
                  <td className="py-3 pr-4 font-semibold text-slate-950">
                    {contract.contractId}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {contract.rolloutReadiness}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {contract.targetTables.join(", ")}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {contract.firstAllowedAudience}
                  </td>
                  <td className="py-3">
                    <BoolPill
                      value={contract.adapterImplementationAllowed}
                      label={copy.implementationAllowed}
                      copy={copy}
                      readyWhenTrue={false}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
