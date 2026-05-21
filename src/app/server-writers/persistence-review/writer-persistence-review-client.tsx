"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceReviewCategory,
  WriterPersistenceReviewItem,
  WriterPersistenceReviewPayload,
  WriterPersistenceReviewProbeResult,
  WriterPersistenceReviewStatus,
} from "@/types/writer-persistence-review";

type WriterPersistenceReviewClientPageProps = {
  payload: WriterPersistenceReviewPayload;
};

const reviewCopy = {
  en: {
    title: "Persistence adapter implementation review",
    badge: "Review only",
    body: "This page defines the evidence package required before the design-only persistence adapter can become executable server-only code. It is not an approval record and cannot enable writes.",
    notice:
      "All probes are blocked by design. They return checklist evidence only and cannot create a service-role client, transaction, audit row, idempotency key, compensation row, migration, AI call, Stripe call, or report unlock.",
    safetyState: "Safety state",
    reviewMode: "Review mode",
    sourceDesignMode: "Source design mode",
    checkedAt: "Checked at",
    sourceMethods: "Source methods",
    sourcePhases: "Source phases",
    sourceFailures: "Source failures",
    itemCount: "Items",
    blockingItems: "Blocking items",
    manualItems: "Manual items",
    passedItems: "Passed items",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    schemaVerified: "Schema verified",
    adapterImplemented: "Adapter implemented",
    implementationApproved: "Implementation approved",
    implementationAllowed: "Implementation allowed",
    reviewComplete: "Review complete",
    evidenceReady: "Blocking evidence ready",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldImportRealWriter: "Would import real writer",
    wouldCreateServiceRoleClient: "Would create service-role client",
    wouldReadServiceRoleSecret: "Would read service-role secret",
    wouldPersistEvidence: "Would persist evidence",
    wouldStoreRawPayload: "Would store raw payload",
    wouldStoreSecrets: "Would store secrets",
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
    reviewRules: "Review rules",
    checklist: "Implementation evidence checklist",
    requiredEvidence: "Required evidence",
    owner: "Owner",
    sourceRefs: "Source refs",
    relatedMethods: "Related methods",
    relatedPhases: "Related phases",
    relatedFailures: "Related failure modes",
    blockedCodes: "Blocked codes",
    probeItem: "Probe item",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one item to confirm the review remains blocking and cannot approve implementation.",
    openAdapter: "Open adapter design",
    openDryRun: "Open persistence gate",
    openRollout: "Open rollout",
    openDashboard: "Back to dashboard",
    statusLabels: {
      blocked: "Blocked",
      manual_required: "Manual required",
      passed: "Passed",
    } satisfies Record<WriterPersistenceReviewStatus, string>,
    categoryLabels: {
      schema_evidence: "Schema evidence",
      service_role_isolation: "Service-role isolation",
      transaction_tests: "Transaction tests",
      idempotency_tests: "Idempotency tests",
      audit_redaction_tests: "Audit redaction tests",
      rollback_compensation_tests: "Rollback compensation",
      rollout_approval: "Rollout approval",
      observability_support: "Observability support",
      no_go_security: "Security no-go",
      source_invariants: "Source invariants",
    } satisfies Record<WriterPersistenceReviewCategory, string>,
  },
  zh: {
    title: "持久化适配器实现审查",
    badge: "仅审查",
    body: "这个页面定义 design-only 持久化适配器变成可执行服务端代码之前必须具备的证据包。它不是批准记录，也不能启用写入。",
    notice:
      "所有探针都会按设计返回 blocked。它们只返回清单证据，不会创建 service-role client、事务、审计行、幂等 key、补偿行、迁移、AI 调用、Stripe 调用或报告解锁。",
    safetyState: "安全状态",
    reviewMode: "审查模式",
    sourceDesignMode: "来源设计模式",
    checkedAt: "检查时间",
    sourceMethods: "来源方法",
    sourcePhases: "来源阶段",
    sourceFailures: "来源失败模式",
    itemCount: "清单项",
    blockingItems: "阻断项",
    manualItems: "需人工项",
    passedItems: "已通过项",
    safeMode: "安全模式",
    readOnly: "只读",
    schemaVerified: "Schema 已验证",
    adapterImplemented: "适配器已实现",
    implementationApproved: "实现已批准",
    implementationAllowed: "允许实现",
    reviewComplete: "审查完成",
    evidenceReady: "阻断证据齐备",
    allRuntimeBlocked: "所有运行时影响已阻断",
    wouldImportRealWriter: "是否导入真实 writer",
    wouldCreateServiceRoleClient: "是否创建 service-role client",
    wouldReadServiceRoleSecret: "是否读取 service-role secret",
    wouldPersistEvidence: "是否持久化证据",
    wouldStoreRawPayload: "是否存储原始 payload",
    wouldStoreSecrets: "是否存储 secret",
    wouldWriteRows: "是否写入数据行",
    wouldWriteAuditRows: "是否写入审计行",
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
    reviewRules: "审查规则",
    checklist: "实现证据清单",
    requiredEvidence: "所需证据",
    owner: "负责人",
    sourceRefs: "来源引用",
    relatedMethods: "相关方法",
    relatedPhases: "相关阶段",
    relatedFailures: "相关失败模式",
    blockedCodes: "阻断代码",
    probeItem: "探测此项",
    probing: "探测中...",
    probeResult: "探针结果",
    noProbe: "探测一个清单项，确认审查仍然保持阻断且不能批准实现。",
    openAdapter: "打开适配器设计",
    openDryRun: "打开持久化门闸",
    openRollout: "打开发布清单",
    openDashboard: "返回工作台",
    statusLabels: {
      blocked: "已阻断",
      manual_required: "需人工确认",
      passed: "已通过",
    } satisfies Record<WriterPersistenceReviewStatus, string>,
    categoryLabels: {
      schema_evidence: "Schema 证据",
      service_role_isolation: "Service-role 隔离",
      transaction_tests: "事务测试",
      idempotency_tests: "幂等测试",
      audit_redaction_tests: "审计脱敏测试",
      rollback_compensation_tests: "回滚补偿",
      rollout_approval: "发布审批",
      observability_support: "可观测与客服支持",
      no_go_security: "安全 no-go",
      source_invariants: "来源不变量",
    } satisfies Record<WriterPersistenceReviewCategory, string>,
  },
} as const;

type ReviewCopy = (typeof reviewCopy)[keyof typeof reviewCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: ReviewCopy;
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
  if (items.length === 0) {
    return (
      <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
        none
      </p>
    );
  }

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

function statusTone(status: WriterPersistenceReviewStatus) {
  return status === "passed" ? "ready" : "blocked";
}

function ReviewItemCard({
  item,
  copy,
  onProbe,
  isProbing,
}: {
  item: WriterPersistenceReviewItem;
  copy: ReviewCopy;
  onProbe: (itemId: string) => void;
  isProbing: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {item.title}
          </h3>
          <p className="mt-1 font-mono text-xs text-slate-500">{item.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="planned">
            {copy.categoryLabels[item.category]}
          </StatusPill>
          <StatusPill tone={statusTone(item.status)}>
            {copy.statusLabels[item.status]}
          </StatusPill>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        <span className="font-semibold">{copy.requiredEvidence}: </span>
        {item.requiredEvidence}
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.sourceRefs}
          </h4>
          <div className="mt-2">
            <TextList items={item.sourceRefs} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.relatedMethods}
          </h4>
          <div className="mt-2">
            <TextList items={item.relatedMethods} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.relatedPhases}
          </h4>
          <div className="mt-2">
            <TextList items={item.relatedPhases} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.relatedFailures}
          </h4>
          <div className="mt-2">
            <TextList items={item.relatedFailureModes} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusPill tone="planned">
          {copy.owner}: {item.owner}
        </StatusPill>
        <button
          type="button"
          onClick={() => onProbe(item.id)}
          disabled={isProbing}
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isProbing ? copy.probing : copy.probeItem}
        </button>
      </div>
    </article>
  );
}

export function WriterPersistenceReviewClientPage({
  payload,
}: WriterPersistenceReviewClientPageProps) {
  const { locale } = useLanguage();
  const copy = reviewCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceReviewProbeResult | null>(null);
  const [probingItem, setProbingItem] = useState<string | null>(null);

  async function probe(itemId: string) {
    setProbingItem(itemId);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/persistence-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId }),
      });
      const result =
        (await response.json()) as WriterPersistenceReviewProbeResult;
      setProbeResult(result);
    } finally {
      setProbingItem(null);
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
            {copy.reviewMode}: {payload.reviewMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceDesignMode}: {payload.sourceDesignMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.checkedAt}: {payload.checkedAt}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceMethods}: {payload.sourceMethodCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourcePhases}: {payload.sourcePhaseCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceFailures}: {payload.sourceFailureModeCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.itemCount}: {payload.itemCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.blockingItems}: {payload.blockingItemCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.manualItems}: {payload.manualRequiredCount}
          </StatusPill>
          <StatusPill tone="ready">
            {copy.passedItems}: {payload.passedItemCount}
          </StatusPill>
          <BoolPill
            value={payload.schemaVerified}
            label={copy.schemaVerified}
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
            value={payload.adapterImplementationApproved}
            label={copy.implementationApproved}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.adapterImplementationAllowed}
            label={copy.implementationAllowed}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.implementationReviewComplete}
            label={copy.reviewComplete}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.allBlockingEvidenceReady}
            label={copy.evidenceReady}
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
            value={payload.wouldStoreRawPayload}
            label={copy.wouldStoreRawPayload}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldStoreSecrets}
            label={copy.wouldStoreSecrets}
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
            href="/server-writers/persistence-adapter"
            className="rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
          >
            {copy.openAdapter}
          </Link>
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
            {copy.reviewRules}
          </h2>
          <div className="mt-4">
            <TextList items={payload.reviewRules} />
          </div>
          <h3 className="mt-5 text-sm font-semibold text-slate-950">
            {copy.blockedCodes}
          </h3>
          <div className="mt-2">
            <TextList items={payload.blockedCodes} />
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
                {probeResult.itemStatus ? (
                  <StatusPill tone={statusTone(probeResult.itemStatus)}>
                    {copy.statusLabels[probeResult.itemStatus]}
                  </StatusPill>
                ) : null}
                <BoolPill
                  value={probeResult.allRuntimeEffectsBlocked}
                  label={copy.allRuntimeBlocked}
                  copy={copy}
                />
                <BoolPill
                  value={probeResult.adapterImplementationAllowed}
                  label={copy.implementationAllowed}
                  copy={copy}
                  readyWhenTrue={false}
                />
                <BoolPill
                  value={probeResult.wouldWriteRows}
                  label={copy.wouldWriteRows}
                  copy={copy}
                  readyWhenTrue={false}
                />
              </div>
              {probeResult.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-slate-200 bg-slate-50 p-3"
                >
                  <h3 className="text-sm font-semibold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.requiredEvidence}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy.noProbe}
            </p>
          )}
        </aside>
      </div>

      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.checklist}
        </h2>
        <div className="grid gap-4">
          {payload.items.map((item) => (
            <ReviewItemCard
              key={item.id}
              item={item}
              copy={copy}
              onProbe={probe}
              isProbing={probingItem === item.id}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
