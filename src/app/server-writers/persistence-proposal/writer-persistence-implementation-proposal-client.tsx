"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceImplementationProposalCategory,
  WriterPersistenceImplementationProposalPayload,
  WriterPersistenceImplementationProposalProbeResult,
  WriterPersistenceImplementationProposalSection,
  WriterPersistenceImplementationProposalStatus,
} from "@/types/writer-persistence-implementation-proposal";

type WriterPersistenceImplementationProposalClientPageProps = {
  payload: WriterPersistenceImplementationProposalPayload;
};

const proposalCopy = {
  en: {
    title: "Persistence adapter implementation proposal scaffold",
    badge: "Read-only scaffold",
    body: "This page turns the no-go packet into a narrow implementation proposal scaffold: future files, phases, tests, acceptance gates, and non-goals. It does not create an implementation plan or executable adapter code.",
    notice:
      "The scaffold is intentionally blocked. Section probes return outline evidence only and cannot create a branch, service-role client, transaction, migration, row write, AI call, Stripe call, or report unlock.",
    safetyState: "Safety state",
    scaffoldMode: "Scaffold mode",
    sourceNoGoMode: "Source no-go mode",
    checkedAt: "Checked at",
    sections: "Sections",
    scaffolded: "Scaffolded",
    blocked: "Blocked",
    manual: "Manual",
    sourceNoGoItems: "Source no-go items",
    sourceNoGoBlocked: "Source no-go blocked",
    sourceNoGoManual: "Source no-go manual",
    sourceNoGoInvariants: "Source no-go invariants",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    proposalScaffoldReady: "Proposal scaffold ready",
    proposalScaffoldOnly: "Proposal scaffold only",
    sourceNoGoPacketReady: "Source no-go packet ready",
    sourceNoGoEvidenceComplete: "Source no-go evidence complete",
    implementationProposalAccepted: "Implementation proposal accepted",
    implementationProposalAllowed: "Implementation proposal allowed",
    implementationPlanApproved: "Implementation plan approved",
    readyToCreateImplementationBranch: "Ready to create implementation branch",
    readyForAdapterImplementation: "Ready for adapter implementation",
    schemaVerified: "Schema verified",
    adapterImplemented: "Adapter implemented",
    implementationApproved: "Implementation approved",
    implementationAllowed: "Implementation allowed",
    reviewComplete: "Review complete",
    evidenceReady: "Blocking evidence ready",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldCreateImplementationPlan: "Would create implementation plan",
    wouldCreateImplementationBranch: "Would create implementation branch",
    wouldCreateAdapterCode: "Would create adapter code",
    wouldRunTransaction: "Would run transaction",
    wouldCreateServiceRoleClient: "Would create service-role client",
    wouldReadServiceRoleSecret: "Would read service-role secret",
    wouldWriteRows: "Would write rows",
    wouldWriteAuditRows: "Would write audit rows",
    wouldReserveIdempotencyKeys: "Would reserve idempotency keys",
    wouldWriteCompensationRows: "Would write compensation rows",
    wouldCreateMigrationFile: "Would create migration file",
    wouldApplyMigration: "Would apply migration",
    wouldCallAi: "Would call AI",
    wouldCallStripe: "Would call Stripe",
    wouldUnlockReports: "Would unlock reports",
    yes: "Yes",
    no: "No",
    scaffoldRules: "Scaffold rules",
    acceptanceGates: "Acceptance gates",
    blockedCodes: "Blocked codes",
    proposalSections: "Proposal sections",
    intent: "Intent",
    proposedShape: "Proposed shape",
    requiredBeforeImplementation: "Required before implementation",
    sourceRefs: "Source refs",
    sourceNoGoItemsLabel: "Source no-go items",
    futureFiles: "Future files",
    forbiddenNow: "Forbidden now",
    owner: "Owner",
    probeSection: "Probe section",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one section to confirm the scaffold remains read-only and blocked.",
    openNoGo: "Open no-go packet",
    openReview: "Open adapter review",
    openFixtures: "Open adapter fixtures",
    openDashboard: "Back to dashboard",
    statusLabels: {
      scaffolded: "Scaffolded",
      blocked_by_no_go: "Blocked by no-go",
      manual_required: "Manual required",
    } satisfies Record<WriterPersistenceImplementationProposalStatus, string>,
    categoryLabels: {
      scope_boundary: "Scope boundary",
      module_boundary: "Module boundary",
      phase_sequence: "Phase sequence",
      transaction_idempotency: "Transaction and idempotency",
      audit_redaction: "Audit redaction",
      rollback_compensation: "Rollback compensation",
      service_role_security: "Service-role security",
      test_evidence: "Test evidence",
      rollout_observability: "Rollout and observability",
      implementation_handoff: "Implementation handoff",
      non_goal: "Non-goal",
    } satisfies Record<WriterPersistenceImplementationProposalCategory, string>,
  },
  zh: {
    title: "持久化适配器实现方案脚手架",
    badge: "只读脚手架",
    body: "这个页面把 no-go 证据包整理成一个窄范围的实现方案脚手架：未来文件、阶段顺序、测试要求、验收门槛和非目标。它不会创建实现计划，也不会生成可执行适配器代码。",
    notice:
      "该脚手架按设计保持阻断。探针只返回方案段落证据，不能创建分支、service-role client、事务、migration、数据写入、AI 调用、Stripe 调用或报告解锁。",
    safetyState: "安全状态",
    scaffoldMode: "脚手架模式",
    sourceNoGoMode: "来源 no-go 模式",
    checkedAt: "检查时间",
    sections: "段落",
    scaffolded: "已脚手架化",
    blocked: "已阻断",
    manual: "需人工",
    sourceNoGoItems: "来源 no-go 项",
    sourceNoGoBlocked: "来源阻断项",
    sourceNoGoManual: "来源人工项",
    sourceNoGoInvariants: "来源不变量",
    safeMode: "安全模式",
    readOnly: "只读",
    proposalScaffoldReady: "方案脚手架已就绪",
    proposalScaffoldOnly: "仅方案脚手架",
    sourceNoGoPacketReady: "来源 no-go 包已就绪",
    sourceNoGoEvidenceComplete: "来源 no-go 证据完整",
    implementationProposalAccepted: "实现方案已接受",
    implementationProposalAllowed: "允许实现方案",
    implementationPlanApproved: "实现计划已批准",
    readyToCreateImplementationBranch: "可创建实现分支",
    readyForAdapterImplementation: "可实现适配器",
    schemaVerified: "Schema 已验证",
    adapterImplemented: "适配器已实现",
    implementationApproved: "实现已批准",
    implementationAllowed: "允许实现",
    reviewComplete: "审查完成",
    evidenceReady: "阻断证据齐备",
    allRuntimeBlocked: "所有运行时副作用已阻断",
    wouldCreateImplementationPlan: "是否创建实现计划",
    wouldCreateImplementationBranch: "是否创建实现分支",
    wouldCreateAdapterCode: "是否创建适配器代码",
    wouldRunTransaction: "是否运行事务",
    wouldCreateServiceRoleClient: "是否创建 service-role client",
    wouldReadServiceRoleSecret: "是否读取 service-role secret",
    wouldWriteRows: "是否写入数据行",
    wouldWriteAuditRows: "是否写入审计行",
    wouldReserveIdempotencyKeys: "是否预留幂等 key",
    wouldWriteCompensationRows: "是否写入补偿行",
    wouldCreateMigrationFile: "是否创建 migration 文件",
    wouldApplyMigration: "是否应用 migration",
    wouldCallAi: "是否调用 AI",
    wouldCallStripe: "是否调用 Stripe",
    wouldUnlockReports: "是否解锁报告",
    yes: "是",
    no: "否",
    scaffoldRules: "脚手架规则",
    acceptanceGates: "验收门槛",
    blockedCodes: "阻断代码",
    proposalSections: "方案段落",
    intent: "意图",
    proposedShape: "方案形态",
    requiredBeforeImplementation: "实现前要求",
    sourceRefs: "来源引用",
    sourceNoGoItemsLabel: "来源 no-go 项",
    futureFiles: "未来文件",
    forbiddenNow: "当前禁止",
    owner: "负责人",
    probeSection: "探测段落",
    probing: "探测中...",
    probeResult: "探针结果",
    noProbe: "探测一个段落，确认脚手架仍然只读且保持阻断。",
    openNoGo: "打开 no-go 包",
    openReview: "打开适配器审查",
    openFixtures: "打开适配器 Fixture",
    openDashboard: "返回工作台",
    statusLabels: {
      scaffolded: "已脚手架化",
      blocked_by_no_go: "被 no-go 阻断",
      manual_required: "需人工确认",
    } satisfies Record<WriterPersistenceImplementationProposalStatus, string>,
    categoryLabels: {
      scope_boundary: "范围边界",
      module_boundary: "模块边界",
      phase_sequence: "阶段顺序",
      transaction_idempotency: "事务与幂等",
      audit_redaction: "审计脱敏",
      rollback_compensation: "回滚补偿",
      service_role_security: "Service-role 安全",
      test_evidence: "测试证据",
      rollout_observability: "发布与可观测性",
      implementation_handoff: "实现交接",
      non_goal: "非目标",
    } satisfies Record<WriterPersistenceImplementationProposalCategory, string>,
  },
} as const;

type ProposalCopy = (typeof proposalCopy)[keyof typeof proposalCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: ProposalCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function statusTone(status: WriterPersistenceImplementationProposalStatus) {
  return status === "scaffolded" ? "planned" : "blocked";
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

function ProposalSectionCard({
  section,
  copy,
  onProbe,
  isProbing,
}: {
  section: WriterPersistenceImplementationProposalSection;
  copy: ProposalCopy;
  onProbe: (sectionId: string) => void;
  isProbing: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {section.title}
          </h3>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {section.id}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="planned">
            {copy.categoryLabels[section.category]}
          </StatusPill>
          <StatusPill tone={statusTone(section.status)}>
            {copy.statusLabels[section.status]}
          </StatusPill>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        <span className="font-semibold text-slate-950">{copy.intent}: </span>
        {section.intent}
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.proposedShape}
          </h4>
          <div className="mt-2">
            <TextList items={section.proposedShape} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.requiredBeforeImplementation}
          </h4>
          <div className="mt-2">
            <TextList items={section.requiredBeforeImplementation} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.futureFiles}
          </h4>
          <div className="mt-2">
            <TextList items={section.futureFiles} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.forbiddenNow}
          </h4>
          <div className="mt-2">
            <TextList items={section.forbiddenNow} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.sourceRefs}
          </h4>
          <div className="mt-2">
            <TextList items={section.sourceRefs} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.sourceNoGoItemsLabel}
          </h4>
          <div className="mt-2">
            <TextList items={section.sourceNoGoItemIds} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusPill tone="planned">
          {copy.owner}: {section.owner}
        </StatusPill>
        <button
          type="button"
          onClick={() => onProbe(section.id)}
          disabled={isProbing}
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isProbing ? copy.probing : copy.probeSection}
        </button>
      </div>
    </article>
  );
}

export function WriterPersistenceImplementationProposalClientPage({
  payload,
}: WriterPersistenceImplementationProposalClientPageProps) {
  const { locale } = useLanguage();
  const copy = proposalCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceImplementationProposalProbeResult | null>(null);
  const [probingSection, setProbingSection] = useState<string | null>(null);

  async function probe(sectionId: string) {
    setProbingSection(sectionId);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/persistence-proposal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sectionId }),
      });
      const result =
        (await response.json()) as WriterPersistenceImplementationProposalProbeResult;
      setProbeResult(result);
    } finally {
      setProbingSection(null);
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
        <StatusPill tone="planned">{copy.badge}</StatusPill>
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
            value={payload.proposalScaffoldReady}
            label={copy.proposalScaffoldReady}
            copy={copy}
          />
          <BoolPill
            value={payload.proposalScaffoldOnly}
            label={copy.proposalScaffoldOnly}
            copy={copy}
          />
          <BoolPill
            value={payload.sourceNoGoPacketReady}
            label={copy.sourceNoGoPacketReady}
            copy={copy}
          />
          <BoolPill
            value={payload.sourceNoGoEvidenceComplete}
            label={copy.sourceNoGoEvidenceComplete}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.implementationProposalAccepted}
            label={copy.implementationProposalAccepted}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.implementationProposalAllowed}
            label={copy.implementationProposalAllowed}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.implementationPlanApproved}
            label={copy.implementationPlanApproved}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.readyToCreateImplementationBranch}
            label={copy.readyToCreateImplementationBranch}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.readyForAdapterImplementation}
            label={copy.readyForAdapterImplementation}
            copy={copy}
            readyWhenTrue={false}
          />
          <StatusPill tone="planned">
            {copy.scaffoldMode}: {payload.scaffoldMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceNoGoMode}: {payload.sourceNoGoMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.checkedAt}: {payload.checkedAt}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sections}: {payload.sectionCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.scaffolded}: {payload.scaffoldedSectionCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.blocked}: {payload.blockedSectionCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.manual}: {payload.manualRequiredSectionCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceNoGoItems}: {payload.sourceNoGoItemCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.sourceNoGoBlocked}: {payload.sourceNoGoBlockedItemCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.sourceNoGoManual}: {payload.sourceNoGoManualRequiredItemCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceNoGoInvariants}: {payload.sourceNoGoRouteInvariantCount}
          </StatusPill>
          <BoolPill
            value={payload.allRuntimeEffectsBlocked}
            label={copy.allRuntimeBlocked}
            copy={copy}
          />
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
            value={payload.wouldCreateAdapterCode}
            label={copy.wouldCreateAdapterCode}
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
            value={payload.wouldWriteCompensationRows}
            label={copy.wouldWriteCompensationRows}
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
            href="/server-writers/persistence-no-go"
            className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
          >
            {copy.openNoGo}
          </Link>
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
            {copy.scaffoldRules}
          </h2>
          <div className="mt-4">
            <TextList items={payload.scaffoldRules} />
          </div>
          <h3 className="mt-5 text-sm font-semibold text-slate-950">
            {copy.acceptanceGates}
          </h3>
          <div className="mt-2">
            <TextList items={payload.acceptanceGates} />
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
                {probeResult.sectionStatus ? (
                  <StatusPill tone={statusTone(probeResult.sectionStatus)}>
                    {copy.statusLabels[probeResult.sectionStatus]}
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
                  value={probeResult.wouldCreateAdapterCode}
                  label={copy.wouldCreateAdapterCode}
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
              {probeResult.sections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-md border border-slate-200 bg-slate-50 p-3"
                >
                  <h3 className="text-sm font-semibold text-slate-950">
                    {section.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {section.intent}
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
          {copy.proposalSections}
        </h2>
        <div className="grid gap-4">
          {payload.sections.map((section) => (
            <ProposalSectionCard
              key={section.id}
              section={section}
              copy={copy}
              onProbe={probe}
              isProbing={probingSection === section.id}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
