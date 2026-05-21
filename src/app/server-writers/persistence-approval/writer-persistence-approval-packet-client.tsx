"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceApprovalPacketCategory,
  WriterPersistenceApprovalPacketItem,
  WriterPersistenceApprovalPacketPayload,
  WriterPersistenceApprovalPacketProbeResult,
  WriterPersistenceApprovalPacketStatus,
} from "@/types/writer-persistence-approval-packet";

type WriterPersistenceApprovalPacketClientPageProps = {
  payload: WriterPersistenceApprovalPacketPayload;
};

const approvalCopy = {
  en: {
    title: "Persistence adapter implementation approval packet",
    badge: "Read-only packet",
    body: "This page turns the acceptance matrix into owner-specific approval requirements. It is not an approval record and cannot approve implementation, create a branch, or create adapter code.",
    notice:
      "Every probe is blocked by design. It returns approval requirements only and cannot record approvals, grant implementation approval, create test files, run tests, create branches, create adapter code, create a service-role client, run transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.",
    safetyState: "Safety state",
    packetMode: "Packet mode",
    sourceMatrixMode: "Source matrix mode",
    checkedAt: "Checked at",
    approvalItems: "Approval items",
    packetReadyItems: "Packet ready",
    blockedItems: "Blocked",
    manualItems: "Manual",
    founder: "Founder",
    backend: "Backend",
    security: "Security",
    qa: "QA",
    operator: "Operator",
    sourceTests: "Source tests",
    sourceBlockedTests: "Source blocked tests",
    sourceManualTests: "Source manual tests",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    approvalPacketReady: "Approval packet ready",
    approvalPacketOnly: "Approval packet only",
    sourceAcceptanceMatrixReady: "Source acceptance matrix ready",
    sourceAcceptanceMatrixOnly: "Source acceptance matrix only",
    sourceAcceptanceMatrixApproved: "Source acceptance matrix approved",
    implementationApprovalPacketAccepted:
      "Implementation approval packet accepted",
    implementationApprovalGranted: "Implementation approval granted",
    implementationBranchApproved: "Implementation branch approved",
    implementationPlanApproved: "Implementation plan approved",
    readyToCreateImplementationBranch: "Ready to create implementation branch",
    readyForAdapterImplementation: "Ready for adapter implementation",
    allOwnerApprovalsComplete: "All owner approvals complete",
    allBlockingEvidenceReady: "All blocking evidence ready",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldRecordOwnerApproval: "Would record owner approval",
    wouldGrantImplementationApproval: "Would grant implementation approval",
    wouldCreateApprovalRecord: "Would create approval record",
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
    packetRules: "Packet rules",
    finalApprovalGates: "Final approval gates",
    blockedCodes: "Blocked codes",
    approvalPacket: "Approval packet",
    decision: "Decision",
    requiredEvidence: "Required evidence",
    approvalQuestions: "Approval questions",
    blockingConditions: "Blocking conditions",
    nonApprovalClauses: "Non-approval clauses",
    futureArtifacts: "Future artifacts",
    sourceRefs: "Source refs",
    sourceAcceptanceTests: "Source acceptance tests",
    owner: "Owner",
    probeApproval: "Probe approval",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one approval item to confirm the packet stays read-only and blocked.",
    openAcceptance: "Open adapter tests",
    openProposal: "Open adapter proposal",
    openDashboard: "Back to dashboard",
    statusLabels: {
      packet_ready: "Packet ready",
      blocked_by_acceptance: "Blocked by acceptance",
      manual_required: "Manual required",
    } satisfies Record<WriterPersistenceApprovalPacketStatus, string>,
    categoryLabels: {
      scope_lock: "Scope lock",
      branch_scope: "Branch scope",
      service_role_security: "Service-role security",
      test_evidence: "Test evidence",
      audit_redaction: "Audit redaction",
      idempotency_transaction: "Idempotency and transaction",
      rollback_compensation: "Rollback and compensation",
      rollout_observability: "Rollout and observability",
      migration_boundary: "Migration boundary",
      final_no_go: "Final no-go",
    } satisfies Record<WriterPersistenceApprovalPacketCategory, string>,
  },
  zh: {
    title: "持久化适配器实现批准包",
    badge: "只读批准包",
    body: "这个页面把验收矩阵转换成按负责人拆分的批准要求。它不是批准记录，不能批准实现、创建分支或创建适配器代码。",
    notice:
      "所有探针都会按设计阻断。它们只返回批准要求，不能记录批准、授予实现批准、创建测试文件、运行测试、创建分支、创建适配器代码、创建 service-role client、运行事务、创建 migration、写入数据、调用 AI、调用 Stripe 或解锁报告。",
    safetyState: "安全状态",
    packetMode: "批准包模式",
    sourceMatrixMode: "来源矩阵模式",
    checkedAt: "检查时间",
    approvalItems: "批准项",
    packetReadyItems: "包已就绪",
    blockedItems: "阻断项",
    manualItems: "人工项",
    founder: "创始人",
    backend: "后端",
    security: "安全",
    qa: "QA",
    operator: "运营",
    sourceTests: "来源测试",
    sourceBlockedTests: "来源阻断测试",
    sourceManualTests: "来源人工测试",
    safeMode: "安全模式",
    readOnly: "只读",
    approvalPacketReady: "批准包已就绪",
    approvalPacketOnly: "仅批准包",
    sourceAcceptanceMatrixReady: "来源验收矩阵已就绪",
    sourceAcceptanceMatrixOnly: "来源仅验收矩阵",
    sourceAcceptanceMatrixApproved: "来源验收矩阵已批准",
    implementationApprovalPacketAccepted: "实现批准包已接受",
    implementationApprovalGranted: "实现批准已授予",
    implementationBranchApproved: "实现分支已批准",
    implementationPlanApproved: "实现计划已批准",
    readyToCreateImplementationBranch: "可创建实现分支",
    readyForAdapterImplementation: "可实现适配器",
    allOwnerApprovalsComplete: "全部负责人批准完成",
    allBlockingEvidenceReady: "全部阻断证据就绪",
    allRuntimeBlocked: "所有运行时副作用已阻断",
    wouldRecordOwnerApproval: "是否记录负责人批准",
    wouldGrantImplementationApproval: "是否授予实现批准",
    wouldCreateApprovalRecord: "是否创建批准记录",
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
    packetRules: "批准包规则",
    finalApprovalGates: "最终批准门槛",
    blockedCodes: "阻断代码",
    approvalPacket: "批准包",
    decision: "决策",
    requiredEvidence: "所需证据",
    approvalQuestions: "批准问题",
    blockingConditions: "阻断条件",
    nonApprovalClauses: "非批准条款",
    futureArtifacts: "未来产物",
    sourceRefs: "来源引用",
    sourceAcceptanceTests: "来源验收测试",
    owner: "负责人",
    probeApproval: "探测批准项",
    probing: "探测中...",
    probeResult: "探针结果",
    noProbe: "探测一个批准项，确认批准包仍然只读且保持阻断。",
    openAcceptance: "打开适配器验收",
    openProposal: "打开适配器方案",
    openDashboard: "返回工作台",
    statusLabels: {
      packet_ready: "包已就绪",
      blocked_by_acceptance: "被验收阻断",
      manual_required: "需人工确认",
    } satisfies Record<WriterPersistenceApprovalPacketStatus, string>,
    categoryLabels: {
      scope_lock: "范围锁定",
      branch_scope: "分支范围",
      service_role_security: "Service-role 安全",
      test_evidence: "测试证据",
      audit_redaction: "审计脱敏",
      idempotency_transaction: "幂等与事务",
      rollback_compensation: "回滚与补偿",
      rollout_observability: "发布与可观测",
      migration_boundary: "Migration 边界",
      final_no_go: "最终 no-go",
    } satisfies Record<WriterPersistenceApprovalPacketCategory, string>,
  },
} as const;

type ApprovalCopy = (typeof approvalCopy)[keyof typeof approvalCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: ApprovalCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function statusTone(status: WriterPersistenceApprovalPacketStatus) {
  return status === "packet_ready" ? "planned" : "blocked";
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

function ApprovalItemCard({
  item,
  copy,
  onProbe,
  isProbing,
}: {
  item: WriterPersistenceApprovalPacketItem;
  copy: ApprovalCopy;
  onProbe: (approvalId: string) => void;
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

      <p className="mt-3 text-sm leading-6 text-slate-600">
        <span className="font-semibold text-slate-950">{copy.decision}: </span>
        {item.decision}
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.requiredEvidence}
          </h4>
          <div className="mt-2">
            <TextList items={item.requiredEvidence} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.approvalQuestions}
          </h4>
          <div className="mt-2">
            <TextList items={item.approvalQuestions} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.blockingConditions}
          </h4>
          <div className="mt-2">
            <TextList items={item.blockingConditions} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.nonApprovalClauses}
          </h4>
          <div className="mt-2">
            <TextList items={item.nonApprovalClauses} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.sourceAcceptanceTests}
          </h4>
          <div className="mt-2">
            <TextList items={item.sourceAcceptanceTestIds} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.futureArtifacts}
          </h4>
          <div className="mt-2">
            <TextList items={item.futureArtifacts} />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-semibold text-slate-950">
          {copy.sourceRefs}
        </h4>
        <div className="mt-2">
          <TextList items={item.sourceRefs} />
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
          {isProbing ? copy.probing : copy.probeApproval}
        </button>
      </div>
    </article>
  );
}

export function WriterPersistenceApprovalPacketClientPage({
  payload,
}: WriterPersistenceApprovalPacketClientPageProps) {
  const { locale } = useLanguage();
  const copy = approvalCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceApprovalPacketProbeResult | null>(null);
  const [probingApproval, setProbingApproval] = useState<string | null>(null);

  async function probe(approvalId: string) {
    setProbingApproval(approvalId);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/persistence-approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approvalId }),
      });
      const result =
        (await response.json()) as WriterPersistenceApprovalPacketProbeResult;
      setProbeResult(result);
    } finally {
      setProbingApproval(null);
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
            value={payload.approvalPacketReady}
            label={copy.approvalPacketReady}
            copy={copy}
          />
          <BoolPill
            value={payload.approvalPacketOnly}
            label={copy.approvalPacketOnly}
            copy={copy}
          />
          <BoolPill
            value={payload.sourceAcceptanceMatrixReady}
            label={copy.sourceAcceptanceMatrixReady}
            copy={copy}
          />
          <BoolPill
            value={payload.sourceAcceptanceMatrixOnly}
            label={copy.sourceAcceptanceMatrixOnly}
            copy={copy}
          />
          <BoolPill
            value={payload.sourceAcceptanceMatrixApproved}
            label={copy.sourceAcceptanceMatrixApproved}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.implementationApprovalPacketAccepted}
            label={copy.implementationApprovalPacketAccepted}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.implementationApprovalGranted}
            label={copy.implementationApprovalGranted}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.implementationBranchApproved}
            label={copy.implementationBranchApproved}
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
          <BoolPill
            value={payload.allOwnerApprovalsComplete}
            label={copy.allOwnerApprovalsComplete}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.allBlockingEvidenceReady}
            label={copy.allBlockingEvidenceReady}
            copy={copy}
            readyWhenTrue={false}
          />
          <StatusPill tone="planned">
            {copy.packetMode}: {payload.approvalPacketMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceMatrixMode}: {payload.sourceAcceptanceMatrixMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.checkedAt}: {payload.checkedAt}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.approvalItems}: {payload.approvalItemCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.packetReadyItems}: {payload.packetReadyItemCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.blockedItems}: {payload.blockedItemCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.manualItems}: {payload.manualRequiredItemCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.founder}: {payload.founderItemCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.backend}: {payload.backendItemCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.security}: {payload.securityItemCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.qa}: {payload.qaItemCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.operator}: {payload.operatorItemCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceTests}: {payload.sourceAcceptanceTestCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.sourceBlockedTests}: {payload.sourceAcceptanceBlockedTestCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.sourceManualTests}:{" "}
            {payload.sourceAcceptanceManualRequiredTestCount}
          </StatusPill>
          <BoolPill
            value={payload.allRuntimeEffectsBlocked}
            label={copy.allRuntimeBlocked}
            copy={copy}
          />
          <BoolPill
            value={payload.wouldRecordOwnerApproval}
            label={copy.wouldRecordOwnerApproval}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldGrantImplementationApproval}
            label={copy.wouldGrantImplementationApproval}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldCreateApprovalRecord}
            label={copy.wouldCreateApprovalRecord}
            copy={copy}
            readyWhenTrue={false}
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
            href="/server-writers/persistence-acceptance"
            className="rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
          >
            {copy.openAcceptance}
          </Link>
          <Link
            href="/server-writers/persistence-proposal"
            className="rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            {copy.openProposal}
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
            {copy.finalApprovalGates}
          </h3>
          <div className="mt-2">
            <TextList items={payload.finalApprovalGates} />
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
                {probeResult.approvalStatus ? (
                  <StatusPill tone={statusTone(probeResult.approvalStatus)}>
                    {copy.statusLabels[probeResult.approvalStatus]}
                  </StatusPill>
                ) : null}
                <BoolPill
                  value={probeResult.allRuntimeEffectsBlocked}
                  label={copy.allRuntimeBlocked}
                  copy={copy}
                />
                <BoolPill
                  value={probeResult.wouldRecordOwnerApproval}
                  label={copy.wouldRecordOwnerApproval}
                  copy={copy}
                  readyWhenTrue={false}
                />
                <BoolPill
                  value={probeResult.wouldGrantImplementationApproval}
                  label={copy.wouldGrantImplementationApproval}
                  copy={copy}
                  readyWhenTrue={false}
                />
                <BoolPill
                  value={probeResult.wouldCreateImplementationBranch}
                  label={copy.wouldCreateImplementationBranch}
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
              {probeResult.items.map((currentItem) => (
                <div
                  key={currentItem.id}
                  className="rounded-md border border-slate-200 bg-slate-50 p-3"
                >
                  <h3 className="text-sm font-semibold text-slate-950">
                    {currentItem.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {currentItem.decision}
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
          {copy.approvalPacket}
        </h2>
        <div className="grid gap-4">
          {payload.items.map((currentItem) => (
            <ApprovalItemCard
              key={currentItem.id}
              item={currentItem}
              copy={copy}
              onProbe={probe}
              isProbing={probingApproval === currentItem.id}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
