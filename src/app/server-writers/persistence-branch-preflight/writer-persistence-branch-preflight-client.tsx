"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceBranchPreflightCategory,
  WriterPersistenceBranchPreflightCheck,
  WriterPersistenceBranchPreflightPayload,
  WriterPersistenceBranchPreflightProbeResult,
  WriterPersistenceBranchPreflightStatus,
} from "@/types/writer-persistence-branch-preflight";

type WriterPersistenceBranchPreflightClientPageProps = {
  payload: WriterPersistenceBranchPreflightPayload;
};

const preflightCopy = {
  en: {
    title: "Persistence adapter implementation branch preflight",
    badge: "Read-only checklist",
    body: "This page defines the future branch prerequisites, allowed files, forbidden files, local command references, rollback checkpoints, and owner handoff rules before any persistence adapter implementation can start.",
    notice:
      "Every probe is blocked by design. It returns checklist evidence only and cannot run git, create branches, create pull requests, modify files, record approvals, create implementation plans, create adapter code, create a service-role client, run transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.",
    safetyState: "Safety state",
    branchPreflightMode: "Branch preflight mode",
    sourceApprovalPacketMode: "Source approval packet mode",
    checkedAt: "Checked at",
    checks: "Checks",
    preflightReady: "Preflight ready",
    blockedChecks: "Blocked checks",
    manualChecks: "Manual checks",
    allowedFiles: "Allowed file refs",
    forbiddenFiles: "Forbidden file refs",
    commands: "Command refs",
    rollback: "Rollback checkpoints",
    handoff: "Handoff rules",
    sourceApprovals: "Source approvals",
    sourceBlocked: "Source blocked",
    sourceManual: "Source manual",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    branchPreflightReady: "Branch preflight ready",
    branchPreflightOnly: "Branch preflight only",
    sourceApprovalPacketReady: "Source approval packet ready",
    sourceApprovalPacketOnly: "Source approval packet only",
    sourceApprovalPacketAccepted: "Source approval packet accepted",
    implementationApprovalGranted: "Implementation approval granted",
    implementationBranchApproved: "Implementation branch approved",
    branchCreationApproved: "Branch creation approved",
    branchCreated: "Branch created",
    implementationPlanApproved: "Implementation plan approved",
    readyToCreateImplementationBranch: "Ready to create implementation branch",
    readyForAdapterImplementation: "Ready for adapter implementation",
    allOwnerApprovalsComplete: "All owner approvals complete",
    allBlockingEvidenceReady: "All blocking evidence ready",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldRunGitCommand: "Would run git command",
    wouldCreateBranch: "Would create branch",
    wouldCheckoutBranch: "Would checkout branch",
    wouldCreatePullRequest: "Would create pull request",
    wouldModifyFiles: "Would modify files",
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
    wouldReadServiceRoleSecret: "Would read privileged secret",
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
    checklistRules: "Checklist rules",
    branchCreationGates: "Branch creation gates",
    blockedCodes: "Blocked codes",
    checklist: "Checklist",
    intent: "Intent",
    sourceRefs: "Source refs",
    sourceApprovalsList: "Source approval items",
    allowedFutureFiles: "Allowed future files",
    forbiddenFutureFiles: "Forbidden future files",
    localCommands: "Local command references",
    rollbackCheckpoints: "Rollback checkpoints",
    handoffRules: "Handoff rules",
    preflightQuestions: "Preflight questions",
    blockingConditions: "Blocking conditions",
    nonExecutionClauses: "Non-execution clauses",
    owner: "Owner",
    probeCheck: "Probe check",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one checklist item to confirm the preflight remains read-only and blocked.",
    openApproval: "Open adapter approval",
    openAcceptance: "Open adapter tests",
    openDashboard: "Back to dashboard",
    statusLabels: {
      preflight_ready: "Preflight ready",
      blocked_by_approval: "Blocked by approval",
      manual_required: "Manual required",
    } satisfies Record<WriterPersistenceBranchPreflightStatus, string>,
    categoryLabels: {
      source_packet_invariant: "Source packet invariant",
      allowed_files: "Allowed files",
      forbidden_files: "Forbidden files",
      local_commands: "Local commands",
      owner_handoff: "Owner handoff",
      rollback_checkpoint: "Rollback checkpoint",
      security_boundary: "Security boundary",
      test_preflight: "Test preflight",
      migration_boundary: "Migration boundary",
      final_no_go: "Final no-go",
    } satisfies Record<WriterPersistenceBranchPreflightCategory, string>,
  },
  zh: {
    title: "持久化适配器实现分支预检",
    badge: "只读清单",
    body: "这个页面定义未来真正开始实现持久化适配器之前，必须确认的分支前置条件、允许文件、禁止文件、本地命令引用、回滚检查点和负责人交接规则。",
    notice:
      "所有探针都会按设计被阻断。它只返回清单证据，不能运行 git、创建分支、创建 PR、修改文件、记录批准、创建实现计划、创建适配器代码、创建特权客户端、运行事务、创建 migration、写入数据、调用 AI、调用 Stripe 或解锁报告。",
    safetyState: "安全状态",
    branchPreflightMode: "分支预检模式",
    sourceApprovalPacketMode: "来源批准包模式",
    checkedAt: "检查时间",
    checks: "检查项",
    preflightReady: "预检就绪",
    blockedChecks: "被阻断检查",
    manualChecks: "人工检查",
    allowedFiles: "允许文件引用",
    forbiddenFiles: "禁止文件引用",
    commands: "命令引用",
    rollback: "回滚检查点",
    handoff: "交接规则",
    sourceApprovals: "来源批准项",
    sourceBlocked: "来源阻断",
    sourceManual: "来源人工",
    safeMode: "安全模式",
    readOnly: "只读",
    branchPreflightReady: "分支预检就绪",
    branchPreflightOnly: "仅分支预检",
    sourceApprovalPacketReady: "来源批准包就绪",
    sourceApprovalPacketOnly: "仅来源批准包",
    sourceApprovalPacketAccepted: "来源批准包已接受",
    implementationApprovalGranted: "实现批准已授予",
    implementationBranchApproved: "实现分支已批准",
    branchCreationApproved: "创建分支已批准",
    branchCreated: "分支已创建",
    implementationPlanApproved: "实现计划已批准",
    readyToCreateImplementationBranch: "可创建实现分支",
    readyForAdapterImplementation: "可实现适配器",
    allOwnerApprovalsComplete: "全部负责人批准完成",
    allBlockingEvidenceReady: "全部阻断证据就绪",
    allRuntimeBlocked: "全部运行时副作用已阻断",
    wouldRunGitCommand: "是否运行 git 命令",
    wouldCreateBranch: "是否创建分支",
    wouldCheckoutBranch: "是否切换分支",
    wouldCreatePullRequest: "是否创建 PR",
    wouldModifyFiles: "是否修改文件",
    wouldRecordOwnerApproval: "是否记录负责人批准",
    wouldGrantImplementationApproval: "是否授予实现批准",
    wouldCreateApprovalRecord: "是否创建批准记录",
    wouldCreateTestFiles: "是否创建测试文件",
    wouldRunAutomatedTests: "是否运行自动化测试",
    wouldCreateImplementationPlan: "是否创建实现计划",
    wouldCreateImplementationBranch: "是否创建实现分支",
    wouldCreateAdapterCode: "是否创建适配器代码",
    wouldRunTransaction: "是否运行事务",
    wouldCreateServiceRoleClient: "是否创建特权客户端",
    wouldReadServiceRoleSecret: "是否读取特权密钥",
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
    checklistRules: "清单规则",
    branchCreationGates: "创建分支门槛",
    blockedCodes: "阻断代码",
    checklist: "预检清单",
    intent: "目的",
    sourceRefs: "来源引用",
    sourceApprovalsList: "来源批准项",
    allowedFutureFiles: "未来允许文件",
    forbiddenFutureFiles: "未来禁止文件",
    localCommands: "本地命令引用",
    rollbackCheckpoints: "回滚检查点",
    handoffRules: "交接规则",
    preflightQuestions: "预检问题",
    blockingConditions: "阻断条件",
    nonExecutionClauses: "不执行条款",
    owner: "负责人",
    probeCheck: "探测检查项",
    probing: "探测中...",
    probeResult: "探针结果",
    noProbe: "探测一个检查项，以确认预检仍然只读且保持阻断。",
    openApproval: "打开适配器批准",
    openAcceptance: "打开适配器验收",
    openDashboard: "返回工作台",
    statusLabels: {
      preflight_ready: "预检就绪",
      blocked_by_approval: "被批准门槛阻断",
      manual_required: "需要人工确认",
    } satisfies Record<WriterPersistenceBranchPreflightStatus, string>,
    categoryLabels: {
      source_packet_invariant: "来源批准包不变式",
      allowed_files: "允许文件",
      forbidden_files: "禁止文件",
      local_commands: "本地命令",
      owner_handoff: "负责人交接",
      rollback_checkpoint: "回滚检查点",
      security_boundary: "安全边界",
      test_preflight: "测试预检",
      migration_boundary: "Migration 边界",
      final_no_go: "最终 no-go",
    } satisfies Record<WriterPersistenceBranchPreflightCategory, string>,
  },
} as const;

type PreflightCopy = (typeof preflightCopy)[keyof typeof preflightCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: PreflightCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function statusTone(status: WriterPersistenceBranchPreflightStatus) {
  return status === "preflight_ready" ? "planned" : "blocked";
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

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 break-words text-2xl font-semibold text-slate-950">
        {value}
      </div>
    </div>
  );
}

function CheckCard({
  check,
  copy,
  onProbe,
  probing,
}: {
  check: WriterPersistenceBranchPreflightCheck;
  copy: PreflightCopy;
  onProbe: (check: WriterPersistenceBranchPreflightCheck) => void;
  probing: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={statusTone(check.status)}>
              {copy.statusLabels[check.status]}
            </StatusPill>
            <StatusPill>{copy.categoryLabels[check.category]}</StatusPill>
            <StatusPill>
              {copy.owner}: {check.owner}
            </StatusPill>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-slate-950">
            {check.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {check.intent}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onProbe(check)}
          disabled={probing}
          className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {probing ? copy.probing : copy.probeCheck}
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.allowedFutureFiles}
          </h3>
          <TextList items={check.allowedFutureFiles} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.forbiddenFutureFiles}
          </h3>
          <TextList items={check.forbiddenFutureFiles} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.localCommands}
          </h3>
          <TextList items={check.localCommands} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.rollbackCheckpoints}
          </h3>
          <TextList items={check.rollbackCheckpoints} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.handoffRules}
          </h3>
          <TextList items={check.handoffRules} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.preflightQuestions}
          </h3>
          <TextList items={check.preflightQuestions} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.blockingConditions}
          </h3>
          <TextList items={check.blockingConditions} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.nonExecutionClauses}
          </h3>
          <TextList items={check.nonExecutionClauses} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.sourceRefs}
          </h3>
          <TextList items={check.sourceRefs} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.sourceApprovalsList}
          </h3>
          <TextList items={check.sourceApprovalItemIds} />
        </div>
      </div>
    </article>
  );
}

export function WriterPersistenceBranchPreflightClientPage({
  payload,
}: WriterPersistenceBranchPreflightClientPageProps) {
  const { locale } = useLanguage();
  const copy = preflightCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceBranchPreflightProbeResult | null>(null);
  const [probingId, setProbingId] = useState<string | null>(null);

  async function probeCheck(check: WriterPersistenceBranchPreflightCheck) {
    setProbingId(check.id);
    setProbeResult(null);

    try {
      const response = await fetch(
        "/api/system-writers/persistence-branch-preflight",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ checkId: check.id }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceBranchPreflightProbeResult;
      setProbeResult(result);
    } finally {
      setProbingId(null);
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

      <section className="mb-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat label={copy.branchPreflightMode} value={payload.branchPreflightMode} />
        <Stat
          label={copy.sourceApprovalPacketMode}
          value={payload.sourceApprovalPacketMode}
        />
        <Stat label={copy.checkedAt} value={payload.checkedAt} />
        <Stat label={copy.checks} value={payload.checkCount} />
        <Stat label={copy.preflightReady} value={payload.preflightReadyCount} />
        <Stat label={copy.blockedChecks} value={payload.blockedCheckCount} />
        <Stat label={copy.manualChecks} value={payload.manualRequiredCheckCount} />
        <Stat label={copy.allowedFiles} value={payload.allowedFileRefCount} />
        <Stat label={copy.forbiddenFiles} value={payload.forbiddenFileRefCount} />
        <Stat label={copy.commands} value={payload.commandCount} />
        <Stat label={copy.rollback} value={payload.rollbackCheckpointCount} />
        <Stat label={copy.handoff} value={payload.handoffRuleCount} />
        <Stat label={copy.sourceApprovals} value={payload.sourceApprovalItemCount} />
        <Stat label={copy.sourceBlocked} value={payload.sourceApprovalBlockedItemCount} />
        <Stat
          label={copy.sourceManual}
          value={payload.sourceApprovalManualRequiredItemCount}
        />
      </section>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.safetyState}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <BoolPill value={payload.safeMode} label={copy.safeMode} copy={copy} />
          <BoolPill value={payload.readOnly} label={copy.readOnly} copy={copy} />
          <BoolPill
            value={payload.branchPreflightReady}
            label={copy.branchPreflightReady}
            copy={copy}
          />
          <BoolPill
            value={payload.branchPreflightOnly}
            label={copy.branchPreflightOnly}
            copy={copy}
          />
          <BoolPill
            value={payload.sourceApprovalPacketReady}
            label={copy.sourceApprovalPacketReady}
            copy={copy}
          />
          <BoolPill
            value={payload.sourceApprovalPacketOnly}
            label={copy.sourceApprovalPacketOnly}
            copy={copy}
          />
          <BoolPill
            value={payload.sourceApprovalPacketAccepted}
            label={copy.sourceApprovalPacketAccepted}
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
            value={payload.branchCreationApproved}
            label={copy.branchCreationApproved}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.branchCreated}
            label={copy.branchCreated}
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
          <BoolPill
            value={payload.allRuntimeEffectsBlocked}
            label={copy.allRuntimeBlocked}
            copy={copy}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <BoolPill
            value={payload.wouldRunGitCommand}
            label={copy.wouldRunGitCommand}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldCreateBranch}
            label={copy.wouldCreateBranch}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldCheckoutBranch}
            label={copy.wouldCheckoutBranch}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldCreatePullRequest}
            label={copy.wouldCreatePullRequest}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldModifyFiles}
            label={copy.wouldModifyFiles}
            copy={copy}
            readyWhenTrue={false}
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
      </section>

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.checklistRules}
          </h2>
          <div className="mt-3">
            <TextList items={payload.checklistRules} />
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.branchCreationGates}
          </h2>
          <div className="mt-3">
            <TextList items={payload.branchCreationGates} />
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.blockedCodes}
          </h2>
          <div className="mt-3">
            <TextList items={payload.blockedCodes} />
          </div>
        </section>
      </div>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.probeResult}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {probeResult ? probeResult.summary : copy.noProbe}
        </p>
        {probeResult ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill tone="blocked">blocked: {copy.yes}</StatusPill>
            <StatusPill>
              {copy.branchPreflightMode}: {probeResult.branchPreflightMode}
            </StatusPill>
            {probeResult.checkId ? (
              <StatusPill>
                checkId: {probeResult.checkId}
              </StatusPill>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="mb-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.checklist}
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/server-writers/persistence-approval"
              className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              {copy.openApproval}
            </Link>
            <Link
              href="/server-writers/persistence-acceptance"
              className="rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
            >
              {copy.openAcceptance}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copy.openDashboard}
            </Link>
          </div>
        </div>
        {payload.checks.map((check) => (
          <CheckCard
            key={check.id}
            check={check}
            copy={copy}
            onProbe={probeCheck}
            probing={probingId === check.id}
          />
        ))}
      </section>
    </AppShell>
  );
}
