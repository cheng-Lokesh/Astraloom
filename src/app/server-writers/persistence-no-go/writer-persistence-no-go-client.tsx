"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceNoGoCategory,
  WriterPersistenceNoGoItem,
  WriterPersistenceNoGoPayload,
  WriterPersistenceNoGoProbeResult,
  WriterPersistenceNoGoRouteInvariant,
  WriterPersistenceNoGoStatus,
} from "@/types/writer-persistence-no-go";

type WriterPersistenceNoGoClientPageProps = {
  payload: WriterPersistenceNoGoPayload;
};

const noGoCopy = {
  en: {
    title: "Persistence adapter no-go evidence packet",
    badge: "No-go gate",
    body: "This page aggregates implementation-review blockers, fixture assertions, and source route invariants into a single read-only handoff gate. It is not an implementation proposal.",
    notice:
      "All no-go probes are blocked by design. They return evidence only and cannot create an implementation plan, branch, service-role client, transaction, row write, migration, AI call, Stripe call, or report unlock.",
    safetyState: "Safety state",
    noGoMode: "No-go mode",
    sourceDesignMode: "Source design mode",
    sourceReviewMode: "Source review mode",
    sourceFixtureMode: "Source fixture mode",
    checkedAt: "Checked at",
    items: "Items",
    blockedItems: "Blocked items",
    manualItems: "Manual items",
    passedItems: "Passed items",
    routeInvariants: "Route invariants",
    routeInvariantPassed: "Route invariants passed",
    sourceReviewItems: "Source review items",
    sourceFixtures: "Source fixtures",
    sourceAssertions: "Source assertions",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    noGoPacketReady: "No-go packet ready",
    noGoEvidenceComplete: "No-go evidence complete",
    readyForImplementationProposal: "Ready for implementation proposal",
    implementationProposalAllowed: "Implementation proposal allowed",
    schemaVerified: "Schema verified",
    adapterImplemented: "Adapter implemented",
    implementationApproved: "Implementation approved",
    implementationAllowed: "Implementation allowed",
    reviewComplete: "Review complete",
    evidenceReady: "Blocking evidence ready",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldCreateImplementationPlan: "Would create implementation plan",
    wouldCreateImplementationBranch: "Would create implementation branch",
    wouldImportRealWriter: "Would import real writer",
    wouldRunTransaction: "Would run transaction",
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
    packetRules: "Packet rules",
    blockedCodes: "Blocked codes",
    invariantList: "Route invariant evidence",
    evidenceItems: "No-go evidence items",
    expectedFlags: "Expected flags",
    actualSummary: "Actual summary",
    sourceRefs: "Source refs",
    requiredEvidence: "Required evidence",
    owner: "Owner",
    reviewItems: "Review items",
    fixtureIds: "Fixture ids",
    invariantIds: "Invariant ids",
    probeItem: "Probe item",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one item to confirm this packet stays a no-go handoff gate.",
    openReview: "Open adapter review",
    openFixtures: "Open adapter fixtures",
    openDashboard: "Back to dashboard",
    statusLabels: {
      blocked: "Blocked",
      manual_required: "Manual required",
      passed: "Passed",
    } satisfies Record<WriterPersistenceNoGoStatus, string>,
    categoryLabels: {
      schema_evidence: "Schema evidence",
      service_role_isolation: "Service-role isolation",
      transaction_idempotency: "Transaction and idempotency",
      audit_redaction: "Audit redaction",
      rollback_compensation: "Rollback compensation",
      rollout_approval: "Rollout approval",
      observability_support: "Observability support",
      route_invariants: "Route invariants",
      security_no_go: "Security no-go",
      implementation_handoff: "Implementation handoff",
    } satisfies Record<WriterPersistenceNoGoCategory, string>,
  },
  zh: {
    title: "持久化适配器 no-go 证据包",
    badge: "No-go 门闸",
    body: "这个页面把实现审查阻断项、fixture 断言和来源路由不变量汇总成一个只读交接门闸。它不是实现方案。",
    notice:
      "所有 no-go 探针都会按设计返回 blocked。它们只返回证据，不会创建实现计划、分支、service-role client、事务、写入、migration、AI 调用、Stripe 调用或报告解锁。",
    safetyState: "安全状态",
    noGoMode: "No-go 模式",
    sourceDesignMode: "来源设计模式",
    sourceReviewMode: "来源审查模式",
    sourceFixtureMode: "来源 fixture 模式",
    checkedAt: "检查时间",
    items: "证据项",
    blockedItems: "阻断项",
    manualItems: "需人工项",
    passedItems: "已通过项",
    routeInvariants: "路由不变量",
    routeInvariantPassed: "已通过路由不变量",
    sourceReviewItems: "来源审查项",
    sourceFixtures: "来源 fixture",
    sourceAssertions: "来源断言",
    safeMode: "安全模式",
    readOnly: "只读",
    noGoPacketReady: "No-go 证据包已就绪",
    noGoEvidenceComplete: "No-go 证据完整",
    readyForImplementationProposal: "可提出实现方案",
    implementationProposalAllowed: "允许实现方案",
    schemaVerified: "Schema 已验证",
    adapterImplemented: "适配器已实现",
    implementationApproved: "实现已批准",
    implementationAllowed: "允许实现",
    reviewComplete: "审查完成",
    evidenceReady: "阻断证据齐备",
    allRuntimeBlocked: "所有运行时影响已阻断",
    wouldCreateImplementationPlan: "是否创建实现计划",
    wouldCreateImplementationBranch: "是否创建实现分支",
    wouldImportRealWriter: "是否导入真实 writer",
    wouldRunTransaction: "是否运行事务",
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
    packetRules: "证据包规则",
    blockedCodes: "阻断代码",
    invariantList: "路由不变量证据",
    evidenceItems: "No-go 证据项",
    expectedFlags: "预期 flags",
    actualSummary: "实际摘要",
    sourceRefs: "来源引用",
    requiredEvidence: "所需证据",
    owner: "负责人",
    reviewItems: "审查项",
    fixtureIds: "Fixture id",
    invariantIds: "不变量 id",
    probeItem: "探测此项",
    probing: "探测中...",
    probeResult: "探针结果",
    noProbe: "探测一个证据项，确认这个证据包仍然是 no-go 交接门闸。",
    openReview: "打开适配器审查",
    openFixtures: "打开适配器 Fixture",
    openDashboard: "返回工作台",
    statusLabels: {
      blocked: "已阻断",
      manual_required: "需人工确认",
      passed: "已通过",
    } satisfies Record<WriterPersistenceNoGoStatus, string>,
    categoryLabels: {
      schema_evidence: "Schema 证据",
      service_role_isolation: "Service-role 隔离",
      transaction_idempotency: "事务与幂等",
      audit_redaction: "审计脱敏",
      rollback_compensation: "回滚补偿",
      rollout_approval: "发布审批",
      observability_support: "可观测与客服支持",
      route_invariants: "路由不变量",
      security_no_go: "安全 no-go",
      implementation_handoff: "实现交接",
    } satisfies Record<WriterPersistenceNoGoCategory, string>,
  },
} as const;

type NoGoCopy = (typeof noGoCopy)[keyof typeof noGoCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: NoGoCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function statusTone(status: WriterPersistenceNoGoStatus) {
  return status === "passed" ? "ready" : "blocked";
}

function TextList({ items }: { items: readonly string[] }) {
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

function RouteInvariantCard({
  invariant,
  copy,
}: {
  invariant: WriterPersistenceNoGoRouteInvariant;
  copy: NoGoCopy;
}) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            {invariant.title}
          </h3>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {invariant.id}
          </p>
        </div>
        <StatusPill tone={invariant.passed ? "ready" : "blocked"}>
          {invariant.passed ? copy.yes : copy.no}
        </StatusPill>
      </div>
      <p className="mt-2 font-mono text-xs text-slate-500">
        {invariant.route}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        <span className="font-semibold text-slate-900">
          {copy.actualSummary}:{" "}
        </span>
        {invariant.actualSummary}
      </p>
      <div className="mt-3">
        <h4 className="text-sm font-semibold text-slate-950">
          {copy.expectedFlags}
        </h4>
        <div className="mt-2">
          <TextList items={invariant.expectedFlags} />
        </div>
      </div>
    </article>
  );
}

function NoGoItemCard({
  item,
  copy,
  onProbe,
  isProbing,
}: {
  item: WriterPersistenceNoGoItem;
  copy: NoGoCopy;
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

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
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
            {copy.reviewItems}
          </h4>
          <div className="mt-2">
            <TextList items={item.sourceReviewItemIds} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.fixtureIds}
          </h4>
          <div className="mt-2">
            <TextList items={item.sourceFixtureIds} />
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

export function WriterPersistenceNoGoClientPage({
  payload,
}: WriterPersistenceNoGoClientPageProps) {
  const { locale } = useLanguage();
  const copy = noGoCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceNoGoProbeResult | null>(null);
  const [probingItem, setProbingItem] = useState<string | null>(null);

  async function probe(itemId: string) {
    setProbingItem(itemId);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/persistence-no-go", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId }),
      });
      const result = (await response.json()) as WriterPersistenceNoGoProbeResult;
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
          <BoolPill
            value={payload.noGoPacketReady}
            label={copy.noGoPacketReady}
            copy={copy}
          />
          <BoolPill
            value={payload.noGoEvidenceComplete}
            label={copy.noGoEvidenceComplete}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.readyForImplementationProposal}
            label={copy.readyForImplementationProposal}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.implementationProposalAllowed}
            label={copy.implementationProposalAllowed}
            copy={copy}
            readyWhenTrue={false}
          />
          <StatusPill tone="planned">
            {copy.noGoMode}: {payload.noGoMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceDesignMode}: {payload.sourceDesignMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceReviewMode}: {payload.sourceReviewMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceFixtureMode}: {payload.sourceFixtureMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.checkedAt}: {payload.checkedAt}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.items}: {payload.itemCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.blockedItems}: {payload.blockedItemCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.manualItems}: {payload.manualRequiredItemCount}
          </StatusPill>
          <StatusPill tone="ready">
            {copy.passedItems}: {payload.passedItemCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.routeInvariants}: {payload.routeInvariantCount}
          </StatusPill>
          <StatusPill tone="ready">
            {copy.routeInvariantPassed}: {payload.routeInvariantPassedCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceReviewItems}: {payload.sourceReviewItemCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceFixtures}: {payload.sourceFixtureCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceAssertions}: {payload.sourceFixtureAssertionCount}
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
            value={payload.allRuntimeEffectsBlocked}
            label={copy.allRuntimeBlocked}
            copy={copy}
          />
          <BoolPill
            value={payload.wouldCreateImplementationPlan}
            label={copy.wouldCreateImplementationPlan}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldCreateImplementationBranch}
            label={copy.wouldCreateImplementationBranch}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldImportRealWriterImplementation}
            label={copy.wouldImportRealWriter}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldRunTransaction}
            label={copy.wouldRunTransaction}
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
            href="/server-writers/persistence-review"
            className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
          >
            {copy.openReview}
          </Link>
          <Link
            href="/server-writers/persistence-fixtures"
            className="rounded-md border border-lime-300 bg-lime-50 px-4 py-2 text-sm font-semibold text-lime-800 transition hover:bg-lime-100"
          >
            {copy.openFixtures}
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
            {copy.packetRules}
          </h2>
          <div className="mt-4">
            <TextList items={payload.packetRules} />
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
                  value={probeResult.implementationProposalAllowed}
                  label={copy.implementationProposalAllowed}
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

      <section className="mb-5">
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.invariantList}
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {payload.routeInvariants.map((invariantItem) => (
            <RouteInvariantCard
              key={invariantItem.id}
              invariant={invariantItem}
              copy={copy}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.evidenceItems}
        </h2>
        <div className="grid gap-4">
          {payload.items.map((item) => (
            <NoGoItemCard
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
