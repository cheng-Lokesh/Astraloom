"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAcceptanceTestCase,
  WriterPersistenceAcceptanceTestCategory,
  WriterPersistenceAcceptanceTestMatrixPayload,
  WriterPersistenceAcceptanceTestMatrixProbeResult,
  WriterPersistenceAcceptanceTestStatus,
  WriterPersistenceAcceptanceTestType,
} from "@/types/writer-persistence-acceptance-test-matrix";

type WriterPersistenceAcceptanceTestMatrixClientPageProps = {
  payload: WriterPersistenceAcceptanceTestMatrixPayload;
};

const matrixCopy = {
  en: {
    title: "Persistence adapter implementation acceptance test matrix",
    badge: "Read-only matrix",
    body: "This page maps the implementation proposal scaffold to future acceptance tests and approval criteria. It names test files and commands as future references only; it does not create or run tests.",
    notice:
      "All matrix probes are blocked by design. They return future test evidence only and cannot create test files, run tests, create an approval packet, branch, adapter code, service-role client, transaction, migration, row write, AI call, Stripe call, or report unlock.",
    safetyState: "Safety state",
    matrixMode: "Matrix mode",
    sourceProposalMode: "Source proposal mode",
    checkedAt: "Checked at",
    tests: "Tests",
    routeInvariant: "Route invariant",
    unit: "Unit",
    integration: "Integration",
    manualReview: "Manual review",
    matrixReady: "Matrix ready",
    blockedTests: "Blocked tests",
    manualTests: "Manual tests",
    sourceSections: "Source sections",
    sourceBlockedSections: "Source blocked sections",
    sourceManualSections: "Source manual sections",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    acceptanceMatrixReady: "Acceptance matrix ready",
    acceptanceMatrixOnly: "Acceptance matrix only",
    sourceProposalScaffoldReady: "Source proposal scaffold ready",
    sourceProposalScaffoldOnly: "Source proposal scaffold only",
    sourceProposalAccepted: "Source proposal accepted",
    implementationProposalAllowed: "Implementation proposal allowed",
    implementationAcceptanceApproved: "Implementation acceptance approved",
    implementationApprovalPacketAllowed: "Implementation approval packet allowed",
    readyForImplementationApprovalPacket: "Ready for implementation approval packet",
    readyToCreateImplementationBranch: "Ready to create implementation branch",
    readyForAdapterImplementation: "Ready for adapter implementation",
    schemaVerified: "Schema verified",
    adapterImplemented: "Adapter implemented",
    implementationAllowed: "Implementation allowed",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldCreateTestFiles: "Would create test files",
    wouldRunAutomatedTests: "Would run automated tests",
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
    matrixRules: "Matrix rules",
    approvalGates: "Approval gates",
    blockedCodes: "Blocked codes",
    testMatrix: "Acceptance test matrix",
    intent: "Intent",
    futureCommand: "Future command",
    futureTestFiles: "Future test files",
    acceptanceCriteria: "Acceptance criteria",
    requiredEvidence: "Required evidence",
    expectedBlockedFlags: "Expected blocked flags",
    forbiddenDuringMatrix: "Forbidden during matrix",
    sourceRefs: "Source refs",
    sourceProposalSections: "Source proposal sections",
    owner: "Owner",
    probeTest: "Probe test",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one test row to confirm the matrix remains read-only and blocked.",
    openProposal: "Open adapter proposal",
    openNoGo: "Open no-go packet",
    openDashboard: "Back to dashboard",
    statusLabels: {
      matrix_ready: "Matrix ready",
      blocked_by_proposal: "Blocked by proposal",
      manual_required: "Manual required",
    } satisfies Record<WriterPersistenceAcceptanceTestStatus, string>,
    testTypeLabels: {
      route_invariant: "Route invariant",
      unit_test: "Unit test",
      integration_test: "Integration test",
      manual_review: "Manual review",
    } satisfies Record<WriterPersistenceAcceptanceTestType, string>,
    categoryLabels: {
      proposal_invariant: "Proposal invariant",
      scope_boundary: "Scope boundary",
      server_only_boundary: "Server-only boundary",
      phase_order: "Phase order",
      idempotency_behavior: "Idempotency behavior",
      audit_redaction: "Audit redaction",
      rollback_compensation: "Rollback compensation",
      service_role_security: "Service-role security",
      rollout_observability: "Rollout and observability",
      final_no_go: "Final no-go",
    } satisfies Record<WriterPersistenceAcceptanceTestCategory, string>,
  },
  zh: {
    title: "持久化适配器实现验收测试矩阵",
    badge: "只读矩阵",
    body: "这个页面把实现方案脚手架映射成未来验收测试和批准标准。这里出现的测试文件和命令只是未来引用，不会创建文件，也不会运行测试。",
    notice:
      "所有矩阵探针都会按设计阻断。它们只返回未来测试证据，不能创建测试文件、运行测试、创建批准包、分支、适配器代码、service-role client、事务、migration、数据写入、AI 调用、Stripe 调用或报告解锁。",
    safetyState: "安全状态",
    matrixMode: "矩阵模式",
    sourceProposalMode: "来源方案模式",
    checkedAt: "检查时间",
    tests: "测试项",
    routeInvariant: "路由不变量",
    unit: "单元",
    integration: "集成",
    manualReview: "人工审查",
    matrixReady: "矩阵就绪",
    blockedTests: "阻断测试",
    manualTests: "人工测试",
    sourceSections: "来源段落",
    sourceBlockedSections: "来源阻断段落",
    sourceManualSections: "来源人工段落",
    safeMode: "安全模式",
    readOnly: "只读",
    acceptanceMatrixReady: "验收矩阵已就绪",
    acceptanceMatrixOnly: "仅验收矩阵",
    sourceProposalScaffoldReady: "来源方案脚手架已就绪",
    sourceProposalScaffoldOnly: "来源仅方案脚手架",
    sourceProposalAccepted: "来源方案已接受",
    implementationProposalAllowed: "允许实现方案",
    implementationAcceptanceApproved: "实现验收已批准",
    implementationApprovalPacketAllowed: "允许实现批准包",
    readyForImplementationApprovalPacket: "可创建实现批准包",
    readyToCreateImplementationBranch: "可创建实现分支",
    readyForAdapterImplementation: "可实现适配器",
    schemaVerified: "Schema 已验证",
    adapterImplemented: "适配器已实现",
    implementationAllowed: "允许实现",
    allRuntimeBlocked: "所有运行时副作用已阻断",
    wouldCreateTestFiles: "是否创建测试文件",
    wouldRunAutomatedTests: "是否运行自动化测试",
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
    matrixRules: "矩阵规则",
    approvalGates: "批准门槛",
    blockedCodes: "阻断代码",
    testMatrix: "验收测试矩阵",
    intent: "意图",
    futureCommand: "未来命令",
    futureTestFiles: "未来测试文件",
    acceptanceCriteria: "验收标准",
    requiredEvidence: "所需证据",
    expectedBlockedFlags: "预期阻断 flags",
    forbiddenDuringMatrix: "矩阵阶段禁止",
    sourceRefs: "来源引用",
    sourceProposalSections: "来源方案段落",
    owner: "负责人",
    probeTest: "探测测试",
    probing: "探测中...",
    probeResult: "探针结果",
    noProbe: "探测一个测试项，确认矩阵仍然只读且保持阻断。",
    openProposal: "打开适配器方案",
    openNoGo: "打开 no-go 包",
    openDashboard: "返回工作台",
    statusLabels: {
      matrix_ready: "矩阵就绪",
      blocked_by_proposal: "被方案阻断",
      manual_required: "需人工确认",
    } satisfies Record<WriterPersistenceAcceptanceTestStatus, string>,
    testTypeLabels: {
      route_invariant: "路由不变量",
      unit_test: "单元测试",
      integration_test: "集成测试",
      manual_review: "人工审查",
    } satisfies Record<WriterPersistenceAcceptanceTestType, string>,
    categoryLabels: {
      proposal_invariant: "方案不变量",
      scope_boundary: "范围边界",
      server_only_boundary: "服务端边界",
      phase_order: "阶段顺序",
      idempotency_behavior: "幂等行为",
      audit_redaction: "审计脱敏",
      rollback_compensation: "回滚补偿",
      service_role_security: "Service-role 安全",
      rollout_observability: "发布与可观测性",
      final_no_go: "最终 no-go",
    } satisfies Record<WriterPersistenceAcceptanceTestCategory, string>,
  },
} as const;

type MatrixCopy = (typeof matrixCopy)[keyof typeof matrixCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: MatrixCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function statusTone(status: WriterPersistenceAcceptanceTestStatus) {
  return status === "matrix_ready" ? "planned" : "blocked";
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

function TestCaseCard({
  test,
  copy,
  onProbe,
  isProbing,
}: {
  test: WriterPersistenceAcceptanceTestCase;
  copy: MatrixCopy;
  onProbe: (testId: string) => void;
  isProbing: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {test.title}
          </h3>
          <p className="mt-1 font-mono text-xs text-slate-500">{test.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="planned">
            {copy.categoryLabels[test.category]}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.testTypeLabels[test.testType]}
          </StatusPill>
          <StatusPill tone={statusTone(test.status)}>
            {copy.statusLabels[test.status]}
          </StatusPill>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        <span className="font-semibold text-slate-950">{copy.intent}: </span>
        {test.intent}
      </p>
      <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
        {copy.futureCommand}: {test.futureCommand}
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.acceptanceCriteria}
          </h4>
          <div className="mt-2">
            <TextList items={test.acceptanceCriteria} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.requiredEvidence}
          </h4>
          <div className="mt-2">
            <TextList items={test.requiredEvidence} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.expectedBlockedFlags}
          </h4>
          <div className="mt-2">
            <TextList items={test.expectedBlockedFlags} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.forbiddenDuringMatrix}
          </h4>
          <div className="mt-2">
            <TextList items={test.forbiddenDuringMatrix} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.futureTestFiles}
          </h4>
          <div className="mt-2">
            <TextList items={test.futureTestFiles} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.sourceProposalSections}
          </h4>
          <div className="mt-2">
            <TextList items={test.sourceProposalSectionIds} />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-semibold text-slate-950">
          {copy.sourceRefs}
        </h4>
        <div className="mt-2">
          <TextList items={test.sourceRefs} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusPill tone="planned">
          {copy.owner}: {test.owner}
        </StatusPill>
        <button
          type="button"
          onClick={() => onProbe(test.id)}
          disabled={isProbing}
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isProbing ? copy.probing : copy.probeTest}
        </button>
      </div>
    </article>
  );
}

export function WriterPersistenceAcceptanceTestMatrixClientPage({
  payload,
}: WriterPersistenceAcceptanceTestMatrixClientPageProps) {
  const { locale } = useLanguage();
  const copy = matrixCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAcceptanceTestMatrixProbeResult | null>(null);
  const [probingTest, setProbingTest] = useState<string | null>(null);

  async function probe(testId: string) {
    setProbingTest(testId);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/persistence-acceptance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testId }),
      });
      const result =
        (await response.json()) as WriterPersistenceAcceptanceTestMatrixProbeResult;
      setProbeResult(result);
    } finally {
      setProbingTest(null);
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
            value={payload.acceptanceMatrixReady}
            label={copy.acceptanceMatrixReady}
            copy={copy}
          />
          <BoolPill
            value={payload.acceptanceMatrixOnly}
            label={copy.acceptanceMatrixOnly}
            copy={copy}
          />
          <BoolPill
            value={payload.sourceProposalScaffoldReady}
            label={copy.sourceProposalScaffoldReady}
            copy={copy}
          />
          <BoolPill
            value={payload.sourceProposalScaffoldOnly}
            label={copy.sourceProposalScaffoldOnly}
            copy={copy}
          />
          <BoolPill
            value={payload.sourceProposalAccepted}
            label={copy.sourceProposalAccepted}
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
            value={payload.implementationAcceptanceApproved}
            label={copy.implementationAcceptanceApproved}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.implementationApprovalPacketAllowed}
            label={copy.implementationApprovalPacketAllowed}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.readyForImplementationApprovalPacket}
            label={copy.readyForImplementationApprovalPacket}
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
            {copy.matrixMode}: {payload.matrixMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceProposalMode}: {payload.sourceProposalMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.checkedAt}: {payload.checkedAt}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.tests}: {payload.testCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.routeInvariant}: {payload.routeInvariantTestCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.unit}: {payload.unitTestCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.integration}: {payload.integrationTestCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.manualReview}: {payload.manualReviewCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.matrixReady}: {payload.matrixReadyCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.blockedTests}: {payload.blockedTestCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.manualTests}: {payload.manualRequiredTestCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceSections}: {payload.sourceProposalSectionCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.sourceBlockedSections}:{" "}
            {payload.sourceProposalBlockedSectionCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.sourceManualSections}:{" "}
            {payload.sourceProposalManualRequiredSectionCount}
          </StatusPill>
          <BoolPill
            value={payload.allRuntimeEffectsBlocked}
            label={copy.allRuntimeBlocked}
            copy={copy}
          />
          <BoolPill
            value={payload.wouldCreateTestFiles}
            label={copy.wouldCreateTestFiles}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldRunAutomatedTests}
            label={copy.wouldRunAutomatedTests}
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
            href="/server-writers/persistence-proposal"
            className="rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            {copy.openProposal}
          </Link>
          <Link
            href="/server-writers/persistence-no-go"
            className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
          >
            {copy.openNoGo}
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
            {copy.matrixRules}
          </h2>
          <div className="mt-4">
            <TextList items={payload.matrixRules} />
          </div>
          <h3 className="mt-5 text-sm font-semibold text-slate-950">
            {copy.approvalGates}
          </h3>
          <div className="mt-2">
            <TextList items={payload.approvalGates} />
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
                {probeResult.testStatus ? (
                  <StatusPill tone={statusTone(probeResult.testStatus)}>
                    {copy.statusLabels[probeResult.testStatus]}
                  </StatusPill>
                ) : null}
                <BoolPill
                  value={probeResult.allRuntimeEffectsBlocked}
                  label={copy.allRuntimeBlocked}
                  copy={copy}
                />
                <BoolPill
                  value={probeResult.wouldCreateTestFiles}
                  label={copy.wouldCreateTestFiles}
                  copy={copy}
                  readyWhenTrue={false}
                />
                <BoolPill
                  value={probeResult.wouldRunAutomatedTests}
                  label={copy.wouldRunAutomatedTests}
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
              {probeResult.tests.map((test) => (
                <div
                  key={test.id}
                  className="rounded-md border border-slate-200 bg-slate-50 p-3"
                >
                  <h3 className="text-sm font-semibold text-slate-950">
                    {test.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {test.intent}
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
          {copy.testMatrix}
        </h2>
        <div className="grid gap-4">
          {payload.tests.map((test) => (
            <TestCaseCard
              key={test.id}
              test={test}
              copy={copy}
              onProbe={probe}
              isProbing={probingTest === test.id}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
