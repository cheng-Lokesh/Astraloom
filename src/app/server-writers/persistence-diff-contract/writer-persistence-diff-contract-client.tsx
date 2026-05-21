"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceDiffContractCategory,
  WriterPersistenceDiffContractEntry,
  WriterPersistenceDiffContractPayload,
  WriterPersistenceDiffContractProbeResult,
  WriterPersistenceDiffContractStatus,
} from "@/types/writer-persistence-diff-contract";

type WriterPersistenceDiffContractClientPageProps = {
  payload: WriterPersistenceDiffContractPayload;
};

const diffCopy = {
  en: {
    title: "Persistence adapter dry-run diff contract",
    badge: "Read-only contract",
    body: "This page defines the future implementation diff shape for the persistence adapter. It names future files, allowed symbols, forbidden changes, assertions, and owner review questions without generating or applying a patch.",
    notice:
      "Every probe is blocked by design. It returns diff contract evidence only and cannot generate patches, apply patches, create files, modify files, create tests, run tests, run git, create branches, create pull requests, create adapter code, create a service-role client, run transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.",
    safetyState: "Safety state",
    diffContractMode: "Diff contract mode",
    sourceBranchPreflightMode: "Source branch preflight mode",
    checkedAt: "Checked at",
    entries: "Entries",
    readyEntries: "Ready",
    blockedEntries: "Blocked",
    manualEntries: "Manual",
    futureFiles: "Future files",
    forbiddenChanges: "Forbidden changes",
    assertions: "Assertions",
    sourceChecks: "Source checks",
    sourceBlocked: "Source blocked",
    sourceManual: "Source manual",
    yes: "Yes",
    no: "No",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    diffContractReady: "Diff contract ready",
    diffContractOnly: "Diff contract only",
    sourceBranchPreflightReady: "Source preflight ready",
    sourceBranchPreflightOnly: "Source preflight only",
    sourceBranchPreflightAccepted: "Source preflight accepted",
    implementationDiffApproved: "Implementation diff approved",
    implementationPatchCreated: "Implementation patch created",
    implementationPatchApplied: "Implementation patch applied",
    implementationFilesCreated: "Implementation files created",
    implementationFilesModified: "Implementation files modified",
    implementationTestsCreated: "Implementation tests created",
    implementationApprovalGranted: "Implementation approval granted",
    branchCreationApproved: "Branch creation approved",
    branchCreated: "Branch created",
    pullRequestCreated: "Pull request created",
    readyToApplyDiff: "Ready to apply diff",
    readyForAdapterImplementation: "Ready for adapter implementation",
    allOwnerApprovalsComplete: "All owner approvals complete",
    allBlockingEvidenceReady: "All blocking evidence ready",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldGeneratePatch: "Would generate patch",
    wouldApplyPatch: "Would apply patch",
    wouldModifyFiles: "Would modify files",
    wouldCreateFiles: "Would create files",
    wouldDeleteFiles: "Would delete files",
    wouldRunGitCommand: "Would run git command",
    wouldCreateBranch: "Would create branch",
    wouldCreatePullRequest: "Would create pull request",
    wouldCreateTestFiles: "Would create test files",
    wouldRunAutomatedTests: "Would run automated tests",
    wouldCreateAdapterCode: "Would create adapter code",
    wouldCreateServiceRoleClient: "Would create service-role client",
    wouldRunTransaction: "Would run transaction",
    wouldWriteRows: "Would write rows",
    wouldWriteAuditRows: "Would write audit rows",
    wouldReserveIdempotencyKeys: "Would reserve idempotency keys",
    wouldCreateMigrationFile: "Would create migration file",
    wouldApplyMigration: "Would apply migration",
    wouldCallAi: "Would call AI",
    wouldCallStripe: "Would call Stripe",
    wouldUnlockReports: "Would unlock reports",
    diffContractRules: "Diff contract rules",
    futureDiffGates: "Future diff gates",
    blockedCodes: "Blocked codes",
    contractEntries: "Contract entries",
    futureFile: "Future file",
    changeKind: "Change kind",
    intent: "Intent",
    allowedFutureSymbols: "Allowed future symbols",
    requiredAssertions: "Required assertions",
    reviewQuestions: "Review questions",
    blockingConditions: "Blocking conditions",
    nonExecutionClauses: "Non-execution clauses",
    rollbackNotes: "Rollback notes",
    sourceRefs: "Source refs",
    sourcePreflightChecks: "Source preflight checks",
    owner: "Owner",
    probeEntry: "Probe entry",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one entry to confirm the diff contract remains read-only and blocked.",
    openBranchPreflight: "Open branch preflight",
    openApproval: "Open adapter approval",
    openDashboard: "Back to dashboard",
    statusLabels: {
      contract_ready: "Contract ready",
      blocked_by_preflight: "Blocked by preflight",
      manual_required: "Manual required",
    } satisfies Record<WriterPersistenceDiffContractStatus, string>,
    categoryLabels: {
      source_preflight_invariant: "Source preflight invariant",
      type_surface: "Type surface",
      adapter_orchestrator: "Adapter orchestrator",
      audit_persistence: "Audit persistence",
      idempotency_persistence: "Idempotency persistence",
      compensation_handoff: "Compensation handoff",
      server_boundary_test: "Server boundary test",
      adapter_unit_test: "Adapter unit test",
      documentation: "Documentation",
      final_no_go: "Final no-go",
    } satisfies Record<WriterPersistenceDiffContractCategory, string>,
  },
  zh: {
    title: "持久化适配器 dry-run diff 契约",
    badge: "只读契约",
    body: "这个页面定义未来实现持久化适配器时理论上应该出现的 diff 形态。它只命名未来文件、允许符号、禁止改动、断言和负责人审查问题，不生成 patch，也不应用 patch。",
    notice:
      "所有探针都会按设计被阻断。它只返回 diff 契约证据，不能生成 patch、应用 patch、创建文件、修改文件、创建测试、运行测试、运行 git、创建分支、创建 PR、创建适配器代码、创建特权客户端、运行事务、创建 migration、写入数据、调用 AI、调用 Stripe 或解锁报告。",
    safetyState: "安全状态",
    diffContractMode: "Diff 契约模式",
    sourceBranchPreflightMode: "来源分支预检模式",
    checkedAt: "检查时间",
    entries: "条目",
    readyEntries: "已就绪",
    blockedEntries: "被阻断",
    manualEntries: "人工项",
    futureFiles: "未来文件",
    forbiddenChanges: "禁止改动",
    assertions: "断言",
    sourceChecks: "来源检查项",
    sourceBlocked: "来源阻断",
    sourceManual: "来源人工",
    yes: "是",
    no: "否",
    safeMode: "安全模式",
    readOnly: "只读",
    diffContractReady: "Diff 契约就绪",
    diffContractOnly: "仅 diff 契约",
    sourceBranchPreflightReady: "来源预检就绪",
    sourceBranchPreflightOnly: "仅来源预检",
    sourceBranchPreflightAccepted: "来源预检已接受",
    implementationDiffApproved: "实现 diff 已批准",
    implementationPatchCreated: "实现 patch 已创建",
    implementationPatchApplied: "实现 patch 已应用",
    implementationFilesCreated: "实现文件已创建",
    implementationFilesModified: "实现文件已修改",
    implementationTestsCreated: "实现测试已创建",
    implementationApprovalGranted: "实现批准已授予",
    branchCreationApproved: "创建分支已批准",
    branchCreated: "分支已创建",
    pullRequestCreated: "PR 已创建",
    readyToApplyDiff: "可应用 diff",
    readyForAdapterImplementation: "可实现适配器",
    allOwnerApprovalsComplete: "全部负责人批准完成",
    allBlockingEvidenceReady: "全部阻断证据就绪",
    allRuntimeBlocked: "全部运行时副作用已阻断",
    wouldGeneratePatch: "是否生成 patch",
    wouldApplyPatch: "是否应用 patch",
    wouldModifyFiles: "是否修改文件",
    wouldCreateFiles: "是否创建文件",
    wouldDeleteFiles: "是否删除文件",
    wouldRunGitCommand: "是否运行 git 命令",
    wouldCreateBranch: "是否创建分支",
    wouldCreatePullRequest: "是否创建 PR",
    wouldCreateTestFiles: "是否创建测试文件",
    wouldRunAutomatedTests: "是否运行自动化测试",
    wouldCreateAdapterCode: "是否创建适配器代码",
    wouldCreateServiceRoleClient: "是否创建特权客户端",
    wouldRunTransaction: "是否运行事务",
    wouldWriteRows: "是否写入数据行",
    wouldWriteAuditRows: "是否写入审计行",
    wouldReserveIdempotencyKeys: "是否预留幂等 key",
    wouldCreateMigrationFile: "是否创建 migration 文件",
    wouldApplyMigration: "是否应用 migration",
    wouldCallAi: "是否调用 AI",
    wouldCallStripe: "是否调用 Stripe",
    wouldUnlockReports: "是否解锁报告",
    diffContractRules: "Diff 契约规则",
    futureDiffGates: "未来 diff 门槛",
    blockedCodes: "阻断代码",
    contractEntries: "契约条目",
    futureFile: "未来文件",
    changeKind: "改动类型",
    intent: "目的",
    allowedFutureSymbols: "允许的未来符号",
    requiredAssertions: "必需断言",
    reviewQuestions: "审查问题",
    blockingConditions: "阻断条件",
    nonExecutionClauses: "不执行条款",
    rollbackNotes: "回滚说明",
    sourceRefs: "来源引用",
    sourcePreflightChecks: "来源预检项",
    owner: "负责人",
    probeEntry: "探测条目",
    probing: "探测中...",
    probeResult: "探针结果",
    noProbe: "探测一个条目，以确认 diff 契约仍然只读且保持阻断。",
    openBranchPreflight: "打开分支预检",
    openApproval: "打开适配器批准",
    openDashboard: "返回工作台",
    statusLabels: {
      contract_ready: "契约就绪",
      blocked_by_preflight: "被预检阻断",
      manual_required: "需要人工确认",
    } satisfies Record<WriterPersistenceDiffContractStatus, string>,
    categoryLabels: {
      source_preflight_invariant: "来源预检不变式",
      type_surface: "类型表面",
      adapter_orchestrator: "适配器编排",
      audit_persistence: "审计持久化",
      idempotency_persistence: "幂等持久化",
      compensation_handoff: "补偿交接",
      server_boundary_test: "服务端边界测试",
      adapter_unit_test: "适配器单元测试",
      documentation: "文档",
      final_no_go: "最终 no-go",
    } satisfies Record<WriterPersistenceDiffContractCategory, string>,
  },
} as const;

type DiffCopy = (typeof diffCopy)[keyof typeof diffCopy];

type BoolField = keyof Pick<
  WriterPersistenceDiffContractPayload,
  | "safeMode"
  | "readOnly"
  | "diffContractReady"
  | "diffContractOnly"
  | "sourceBranchPreflightReady"
  | "sourceBranchPreflightOnly"
  | "sourceBranchPreflightAccepted"
  | "implementationDiffApproved"
  | "implementationPatchCreated"
  | "implementationPatchApplied"
  | "implementationFilesCreated"
  | "implementationFilesModified"
  | "implementationTestsCreated"
  | "implementationApprovalGranted"
  | "branchCreationApproved"
  | "branchCreated"
  | "pullRequestCreated"
  | "readyToApplyDiff"
  | "readyForAdapterImplementation"
  | "allOwnerApprovalsComplete"
  | "allBlockingEvidenceReady"
  | "allRuntimeEffectsBlocked"
  | "wouldGeneratePatch"
  | "wouldApplyPatch"
  | "wouldModifyFiles"
  | "wouldCreateFiles"
  | "wouldDeleteFiles"
  | "wouldRunGitCommand"
  | "wouldCreateBranch"
  | "wouldCreatePullRequest"
  | "wouldCreateTestFiles"
  | "wouldRunAutomatedTests"
  | "wouldCreateAdapterCode"
  | "wouldCreateServiceRoleClient"
  | "wouldRunTransaction"
  | "wouldWriteRows"
  | "wouldWriteAuditRows"
  | "wouldReserveIdempotencyKeys"
  | "wouldCreateMigrationFile"
  | "wouldApplyMigration"
  | "wouldCallAi"
  | "wouldCallStripe"
  | "wouldUnlockReports"
>;

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: DiffCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function statusTone(status: WriterPersistenceDiffContractStatus) {
  return status === "contract_ready" ? "planned" : "blocked";
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

function Stat({ label, value }: { label: string; value: string | number }) {
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

function EntryCard({
  entry,
  copy,
  onProbe,
  probing,
}: {
  entry: WriterPersistenceDiffContractEntry;
  copy: DiffCopy;
  onProbe: (entry: WriterPersistenceDiffContractEntry) => void;
  probing: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={statusTone(entry.status)}>
              {copy.statusLabels[entry.status]}
            </StatusPill>
            <StatusPill>{copy.categoryLabels[entry.category]}</StatusPill>
            <StatusPill>
              {copy.owner}: {entry.owner}
            </StatusPill>
            <StatusPill>
              {copy.changeKind}: {entry.futureChangeKind}
            </StatusPill>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-slate-950">
            {entry.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {entry.intent}
          </p>
          <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
            {copy.futureFile}: {entry.futureFile}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onProbe(entry)}
          disabled={probing}
          className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {probing ? copy.probing : copy.probeEntry}
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.allowedFutureSymbols}
          </h3>
          <TextList items={entry.allowedFutureSymbols} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.forbiddenChanges}
          </h3>
          <TextList items={entry.forbiddenChanges} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.requiredAssertions}
          </h3>
          <TextList items={entry.requiredAssertions} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.reviewQuestions}
          </h3>
          <TextList items={entry.reviewQuestions} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.blockingConditions}
          </h3>
          <TextList items={entry.blockingConditions} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.nonExecutionClauses}
          </h3>
          <TextList items={entry.nonExecutionClauses} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.rollbackNotes}
          </h3>
          <TextList items={entry.rollbackNotes} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.sourcePreflightChecks}
          </h3>
          <TextList items={entry.sourcePreflightCheckIds} />
        </div>
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-950">
          {copy.sourceRefs}
        </h3>
        <TextList items={entry.sourceRefs} />
      </div>
    </article>
  );
}

export function WriterPersistenceDiffContractClientPage({
  payload,
}: WriterPersistenceDiffContractClientPageProps) {
  const { locale } = useLanguage();
  const copy = diffCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceDiffContractProbeResult | null>(null);
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags: { key: BoolField; label: string }[] = [
    { key: "safeMode", label: copy.safeMode },
    { key: "readOnly", label: copy.readOnly },
    { key: "diffContractReady", label: copy.diffContractReady },
    { key: "diffContractOnly", label: copy.diffContractOnly },
    {
      key: "sourceBranchPreflightReady",
      label: copy.sourceBranchPreflightReady,
    },
    {
      key: "sourceBranchPreflightOnly",
      label: copy.sourceBranchPreflightOnly,
    },
    { key: "allRuntimeEffectsBlocked", label: copy.allRuntimeBlocked },
  ];

  const falseFlags: { key: BoolField; label: string }[] = [
    {
      key: "sourceBranchPreflightAccepted",
      label: copy.sourceBranchPreflightAccepted,
    },
    {
      key: "implementationDiffApproved",
      label: copy.implementationDiffApproved,
    },
    {
      key: "implementationPatchCreated",
      label: copy.implementationPatchCreated,
    },
    {
      key: "implementationPatchApplied",
      label: copy.implementationPatchApplied,
    },
    {
      key: "implementationFilesCreated",
      label: copy.implementationFilesCreated,
    },
    {
      key: "implementationFilesModified",
      label: copy.implementationFilesModified,
    },
    {
      key: "implementationTestsCreated",
      label: copy.implementationTestsCreated,
    },
    {
      key: "implementationApprovalGranted",
      label: copy.implementationApprovalGranted,
    },
    { key: "branchCreationApproved", label: copy.branchCreationApproved },
    { key: "branchCreated", label: copy.branchCreated },
    { key: "pullRequestCreated", label: copy.pullRequestCreated },
    { key: "readyToApplyDiff", label: copy.readyToApplyDiff },
    {
      key: "readyForAdapterImplementation",
      label: copy.readyForAdapterImplementation,
    },
    {
      key: "allOwnerApprovalsComplete",
      label: copy.allOwnerApprovalsComplete,
    },
    {
      key: "allBlockingEvidenceReady",
      label: copy.allBlockingEvidenceReady,
    },
    { key: "wouldGeneratePatch", label: copy.wouldGeneratePatch },
    { key: "wouldApplyPatch", label: copy.wouldApplyPatch },
    { key: "wouldModifyFiles", label: copy.wouldModifyFiles },
    { key: "wouldCreateFiles", label: copy.wouldCreateFiles },
    { key: "wouldDeleteFiles", label: copy.wouldDeleteFiles },
    { key: "wouldRunGitCommand", label: copy.wouldRunGitCommand },
    { key: "wouldCreateBranch", label: copy.wouldCreateBranch },
    { key: "wouldCreatePullRequest", label: copy.wouldCreatePullRequest },
    { key: "wouldCreateTestFiles", label: copy.wouldCreateTestFiles },
    { key: "wouldRunAutomatedTests", label: copy.wouldRunAutomatedTests },
    { key: "wouldCreateAdapterCode", label: copy.wouldCreateAdapterCode },
    {
      key: "wouldCreateServiceRoleClient",
      label: copy.wouldCreateServiceRoleClient,
    },
    { key: "wouldRunTransaction", label: copy.wouldRunTransaction },
    { key: "wouldWriteRows", label: copy.wouldWriteRows },
    { key: "wouldWriteAuditRows", label: copy.wouldWriteAuditRows },
    {
      key: "wouldReserveIdempotencyKeys",
      label: copy.wouldReserveIdempotencyKeys,
    },
    { key: "wouldCreateMigrationFile", label: copy.wouldCreateMigrationFile },
    { key: "wouldApplyMigration", label: copy.wouldApplyMigration },
    { key: "wouldCallAi", label: copy.wouldCallAi },
    { key: "wouldCallStripe", label: copy.wouldCallStripe },
    { key: "wouldUnlockReports", label: copy.wouldUnlockReports },
  ];

  async function probeEntry(entry: WriterPersistenceDiffContractEntry) {
    setProbingId(entry.id);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/persistence-diff-contract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entryId: entry.id }),
      });
      const result =
        (await response.json()) as WriterPersistenceDiffContractProbeResult;
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
        <Stat label={copy.diffContractMode} value={payload.diffContractMode} />
        <Stat
          label={copy.sourceBranchPreflightMode}
          value={payload.sourceBranchPreflightMode}
        />
        <Stat label={copy.checkedAt} value={payload.checkedAt} />
        <Stat label={copy.entries} value={payload.diffEntryCount} />
        <Stat label={copy.readyEntries} value={payload.contractReadyCount} />
        <Stat label={copy.blockedEntries} value={payload.blockedEntryCount} />
        <Stat
          label={copy.manualEntries}
          value={payload.manualRequiredEntryCount}
        />
        <Stat label={copy.futureFiles} value={payload.futureFileCount} />
        <Stat
          label={copy.forbiddenChanges}
          value={payload.forbiddenChangeCount}
        />
        <Stat label={copy.assertions} value={payload.requiredAssertionCount} />
        <Stat label={copy.sourceChecks} value={payload.sourcePreflightCheckCount} />
        <Stat
          label={copy.sourceBlocked}
          value={payload.sourcePreflightBlockedCheckCount}
        />
        <Stat
          label={copy.sourceManual}
          value={payload.sourcePreflightManualRequiredCheckCount}
        />
      </section>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.safetyState}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {trueFlags.map((item) => (
            <BoolPill
              key={item.key}
              value={payload[item.key]}
              label={item.label}
              copy={copy}
            />
          ))}
          {falseFlags.map((item) => (
            <BoolPill
              key={item.key}
              value={payload[item.key]}
              label={item.label}
              copy={copy}
              readyWhenTrue={false}
            />
          ))}
        </div>
      </section>

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.diffContractRules}
          </h2>
          <div className="mt-3">
            <TextList items={payload.diffContractRules} />
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.futureDiffGates}
          </h2>
          <div className="mt-3">
            <TextList items={payload.futureDiffGates} />
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
              {copy.diffContractMode}: {probeResult.diffContractMode}
            </StatusPill>
            {probeResult.entryId ? (
              <StatusPill>entryId: {probeResult.entryId}</StatusPill>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="mb-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.contractEntries}
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/server-writers/persistence-branch-preflight"
              className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
            >
              {copy.openBranchPreflight}
            </Link>
            <Link
              href="/server-writers/persistence-approval"
              className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              {copy.openApproval}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copy.openDashboard}
            </Link>
          </div>
        </div>
        {payload.entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            copy={copy}
            onProbe={probeEntry}
            probing={probingId === entry.id}
          />
        ))}
      </section>
    </AppShell>
  );
}
