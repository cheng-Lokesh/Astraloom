"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistencePatchReviewCategory,
  WriterPersistencePatchReviewItem,
  WriterPersistencePatchReviewPayload,
  WriterPersistencePatchReviewProbeResult,
  WriterPersistencePatchReviewStatus,
} from "@/types/writer-persistence-patch-review";

type WriterPersistencePatchReviewClientPageProps = {
  payload: WriterPersistencePatchReviewPayload;
};

const reviewCopy = {
  en: {
    title: "Persistence adapter patch review packet",
    badge: "Read-only review packet",
    body: "This page defines how a future implementation patch would be reviewed against the dry-run diff contract. It names owners, required evidence, assertions, forbidden changes, and blocking conditions without reviewing or accepting any real patch.",
    notice:
      "Every probe is blocked by design. This packet cannot review a real patch, accept a patch, generate patches, apply patches, create files, modify files, create tests, run tests, run git, create branches, create pull requests, create adapter code, create privileged clients, run transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.",
    safetyState: "Safety state",
    patchReviewMode: "Patch review mode",
    sourceDiffContractMode: "Source diff contract mode",
    checkedAt: "Checked at",
    reviewItems: "Review items",
    packetReady: "Packet ready",
    blockedReviews: "Blocked",
    manualReviews: "Manual",
    requiredEvidence: "Required evidence",
    requiredAssertions: "Required assertions",
    forbiddenChanges: "Forbidden changes",
    sourceDiffEntries: "Source diff entries",
    sourceDiffBlocked: "Source diff blocked",
    sourceDiffManual: "Source diff manual",
    yes: "Yes",
    no: "No",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    packetReadyFlag: "Patch review packet ready",
    packetOnly: "Patch review packet only",
    sourceReady: "Source diff contract ready",
    sourceOnly: "Source diff contract only",
    sourceAccepted: "Source diff contract accepted",
    patchSubmitted: "Implementation patch submitted",
    patchApproved: "Implementation patch approved",
    patchCreated: "Implementation patch created",
    patchApplied: "Implementation patch applied",
    filesCreated: "Implementation files created",
    filesModified: "Implementation files modified",
    testsCreated: "Implementation tests created",
    approvalGranted: "Implementation approval granted",
    branchApproved: "Implementation branch approved",
    branchCreationApproved: "Branch creation approved",
    branchCreated: "Branch created",
    pullRequestCreated: "Pull request created",
    planApproved: "Implementation plan approved",
    readyToApplyPatch: "Ready to apply patch",
    readyToCreateBranch: "Ready to create implementation branch",
    readyForAdapter: "Ready for adapter implementation",
    schemaVerified: "Schema verified",
    adapterImplemented: "Adapter implemented",
    adapterApproved: "Adapter implementation approved",
    adapterAllowed: "Adapter implementation allowed",
    implementationReviewComplete: "Implementation review complete",
    allOwnerApprovalsComplete: "All owner approvals complete",
    allBlockingEvidenceReady: "All blocking evidence ready",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldReviewRealPatch: "Would review real patch",
    wouldAcceptPatch: "Would accept patch",
    wouldGeneratePatch: "Would generate patch",
    wouldApplyPatch: "Would apply patch",
    wouldModifyFiles: "Would modify files",
    wouldCreateFiles: "Would create files",
    wouldDeleteFiles: "Would delete files",
    wouldRunGitCommand: "Would run git command",
    wouldCreateBranch: "Would create branch",
    wouldCheckoutBranch: "Would checkout branch",
    wouldCreatePullRequest: "Would create pull request",
    wouldRecordOwnerApproval: "Would record owner approval",
    wouldGrantImplementationApproval: "Would grant implementation approval",
    wouldCreateApprovalRecord: "Would create approval record",
    wouldCreateTestFiles: "Would create test files",
    wouldRunAutomatedTests: "Would run automated tests",
    wouldCreateImplementationPlan: "Would create implementation plan",
    wouldCreateImplementationBranch: "Would create implementation branch",
    wouldCreateAdapterCode: "Would create adapter code",
    wouldImportRealWriterImplementation: "Would import real writer implementation",
    wouldRunTransaction: "Would run transaction",
    wouldCreateServiceRoleClient: "Would create privileged client",
    wouldReadServiceRoleSecret: "Would read privileged secret",
    wouldPersistEvidence: "Would persist evidence",
    wouldStoreRawPayload: "Would store raw payload",
    wouldStoreSecrets: "Would store secrets",
    wouldWriteRows: "Would write rows",
    wouldWriteAuditRows: "Would write audit rows",
    wouldReserveIdempotencyKeys: "Would reserve idempotency keys",
    wouldWriteIdempotencyRows: "Would write idempotency rows",
    wouldWriteCompensationRows: "Would write compensation rows",
    wouldCreateMigrationFile: "Would create migration file",
    wouldApplyMigration: "Would apply migration",
    wouldCreateTables: "Would create tables",
    wouldEnableWriters: "Would enable writers",
    wouldCallAi: "Would call AI",
    wouldCallStripe: "Would call Stripe",
    wouldUnlockReports: "Would unlock reports",
    reviewRules: "Patch review rules",
    futureGates: "Future owner signoff gates",
    blockedCodes: "Blocked codes",
    items: "Review packet items",
    intent: "Intent",
    reviewQuestions: "Review questions",
    blockingConditions: "Blocking conditions",
    nonExecutionClauses: "Non-execution clauses",
    futureArtifacts: "Future review artifacts",
    sourceRefs: "Source refs",
    sourceDiffIds: "Source diff entries",
    owner: "Owner",
    probeReview: "Probe review",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one review item to confirm this packet remains read-only and blocked.",
    openDiffContract: "Open diff contract",
    openBranchPreflight: "Open branch preflight",
    openDashboard: "Back to dashboard",
    statusLabels: {
      packet_ready: "Packet ready",
      blocked_by_diff_contract: "Blocked by diff contract",
      manual_required: "Manual required",
    } satisfies Record<WriterPersistencePatchReviewStatus, string>,
    categoryLabels: {
      source_diff_invariant: "Source diff invariant",
      scope_review: "Scope review",
      type_surface_review: "Type surface review",
      orchestrator_review: "Orchestrator review",
      audit_review: "Audit review",
      idempotency_review: "Idempotency review",
      compensation_review: "Compensation review",
      security_review: "Security review",
      qa_review: "QA review",
      final_no_go: "Final no-go",
    } satisfies Record<WriterPersistencePatchReviewCategory, string>,
  },
  zh: {
    title: "持久化适配器 patch 审查包",
    badge: "只读审查包",
    body: "这个页面定义未来实现 patch 应该如何按照 dry-run diff 契约被审查。它只列出负责人、必要证据、断言、禁止改动和阻断条件，不审查真实 patch，也不接受真实 patch。",
    notice:
      "所有探针都会按设计被阻断。这个审查包不能审查真实 patch、接受 patch、生成 patch、应用 patch、创建文件、修改文件、创建测试、运行测试、执行 git、创建分支、创建 PR、创建适配器代码、创建特权客户端、运行事务、创建 migration、写入数据库、调用 AI、调用 Stripe 或解锁报告。",
    safetyState: "安全状态",
    patchReviewMode: "Patch 审查模式",
    sourceDiffContractMode: "来源 diff 契约模式",
    checkedAt: "检查时间",
    reviewItems: "审查项",
    packetReady: "包已就绪",
    blockedReviews: "被阻断",
    manualReviews: "人工项",
    requiredEvidence: "必要证据",
    requiredAssertions: "必要断言",
    forbiddenChanges: "禁止改动",
    sourceDiffEntries: "来源 diff 项",
    sourceDiffBlocked: "来源阻断项",
    sourceDiffManual: "来源人工项",
    yes: "是",
    no: "否",
    safeMode: "安全模式",
    readOnly: "只读",
    packetReadyFlag: "审查包已就绪",
    packetOnly: "仅审查包",
    sourceReady: "来源 diff 契约已就绪",
    sourceOnly: "仅来源 diff 契约",
    sourceAccepted: "来源 diff 契约已接受",
    patchSubmitted: "实现 patch 已提交",
    patchApproved: "实现 patch 已批准",
    patchCreated: "实现 patch 已创建",
    patchApplied: "实现 patch 已应用",
    filesCreated: "实现文件已创建",
    filesModified: "实现文件已修改",
    testsCreated: "实现测试已创建",
    approvalGranted: "实现批准已授予",
    branchApproved: "实现分支已批准",
    branchCreationApproved: "创建分支已批准",
    branchCreated: "分支已创建",
    pullRequestCreated: "PR 已创建",
    planApproved: "实现计划已批准",
    readyToApplyPatch: "可应用 patch",
    readyToCreateBranch: "可创建实现分支",
    readyForAdapter: "可实现适配器",
    schemaVerified: "Schema 已验证",
    adapterImplemented: "适配器已实现",
    adapterApproved: "适配器实现已批准",
    adapterAllowed: "适配器实现已允许",
    implementationReviewComplete: "实现审查已完成",
    allOwnerApprovalsComplete: "全部负责人批准已完成",
    allBlockingEvidenceReady: "全部阻断证据已就绪",
    allRuntimeBlocked: "全部运行时副作用已阻断",
    wouldReviewRealPatch: "是否会审查真实 patch",
    wouldAcceptPatch: "是否会接受 patch",
    wouldGeneratePatch: "是否会生成 patch",
    wouldApplyPatch: "是否会应用 patch",
    wouldModifyFiles: "是否会修改文件",
    wouldCreateFiles: "是否会创建文件",
    wouldDeleteFiles: "是否会删除文件",
    wouldRunGitCommand: "是否会运行 git 命令",
    wouldCreateBranch: "是否会创建分支",
    wouldCheckoutBranch: "是否会切换分支",
    wouldCreatePullRequest: "是否会创建 PR",
    wouldRecordOwnerApproval: "是否会记录负责人批准",
    wouldGrantImplementationApproval: "是否会授予实现批准",
    wouldCreateApprovalRecord: "是否会创建批准记录",
    wouldCreateTestFiles: "是否会创建测试文件",
    wouldRunAutomatedTests: "是否会运行自动化测试",
    wouldCreateImplementationPlan: "是否会创建实现计划",
    wouldCreateImplementationBranch: "是否会创建实现分支",
    wouldCreateAdapterCode: "是否会创建适配器代码",
    wouldImportRealWriterImplementation: "是否会导入真实 writer 实现",
    wouldRunTransaction: "是否会运行事务",
    wouldCreateServiceRoleClient: "是否会创建特权客户端",
    wouldReadServiceRoleSecret: "是否会读取特权密钥",
    wouldPersistEvidence: "是否会持久化证据",
    wouldStoreRawPayload: "是否会存储原始 payload",
    wouldStoreSecrets: "是否会存储密钥",
    wouldWriteRows: "是否会写入数据行",
    wouldWriteAuditRows: "是否会写入审计行",
    wouldReserveIdempotencyKeys: "是否会预留幂等 key",
    wouldWriteIdempotencyRows: "是否会写入幂等行",
    wouldWriteCompensationRows: "是否会写入补偿行",
    wouldCreateMigrationFile: "是否会创建 migration 文件",
    wouldApplyMigration: "是否会应用 migration",
    wouldCreateTables: "是否会创建表",
    wouldEnableWriters: "是否会启用 writers",
    wouldCallAi: "是否会调用 AI",
    wouldCallStripe: "是否会调用 Stripe",
    wouldUnlockReports: "是否会解锁报告",
    reviewRules: "Patch 审查规则",
    futureGates: "未来负责人签核门槛",
    blockedCodes: "阻断代码",
    items: "审查包条目",
    intent: "目的",
    reviewQuestions: "审查问题",
    blockingConditions: "阻断条件",
    nonExecutionClauses: "不执行条款",
    futureArtifacts: "未来审查产物",
    sourceRefs: "来源引用",
    sourceDiffIds: "来源 diff 项",
    owner: "负责人",
    probeReview: "探测审查项",
    probing: "探测中...",
    probeResult: "探针结果",
    noProbe: "探测一个审查项，确认这个包仍然只读且被阻断。",
    openDiffContract: "打开 diff 契约",
    openBranchPreflight: "打开分支预检",
    openDashboard: "返回工作台",
    statusLabels: {
      packet_ready: "包已就绪",
      blocked_by_diff_contract: "被 diff 契约阻断",
      manual_required: "需要人工确认",
    } satisfies Record<WriterPersistencePatchReviewStatus, string>,
    categoryLabels: {
      source_diff_invariant: "来源 diff 不变式",
      scope_review: "范围审查",
      type_surface_review: "类型表面审查",
      orchestrator_review: "编排审查",
      audit_review: "审计审查",
      idempotency_review: "幂等审查",
      compensation_review: "补偿审查",
      security_review: "安全审查",
      qa_review: "QA 审查",
      final_no_go: "最终 no-go",
    } satisfies Record<WriterPersistencePatchReviewCategory, string>,
  },
} as const;

type ReviewCopy = (typeof reviewCopy)[keyof typeof reviewCopy];

type BoolField = keyof Pick<
  WriterPersistencePatchReviewPayload,
  | "safeMode"
  | "readOnly"
  | "patchReviewPacketReady"
  | "patchReviewPacketOnly"
  | "sourceDiffContractReady"
  | "sourceDiffContractOnly"
  | "sourceDiffContractAccepted"
  | "implementationPatchSubmitted"
  | "implementationPatchApproved"
  | "implementationPatchCreated"
  | "implementationPatchApplied"
  | "implementationFilesCreated"
  | "implementationFilesModified"
  | "implementationTestsCreated"
  | "implementationApprovalGranted"
  | "implementationBranchApproved"
  | "branchCreationApproved"
  | "branchCreated"
  | "pullRequestCreated"
  | "implementationPlanApproved"
  | "readyToApplyPatch"
  | "readyToCreateImplementationBranch"
  | "readyForAdapterImplementation"
  | "schemaVerified"
  | "adapterImplemented"
  | "adapterImplementationApproved"
  | "adapterImplementationAllowed"
  | "implementationReviewComplete"
  | "allOwnerApprovalsComplete"
  | "allBlockingEvidenceReady"
  | "allRuntimeEffectsBlocked"
  | "wouldReviewRealPatch"
  | "wouldAcceptPatch"
  | "wouldGeneratePatch"
  | "wouldApplyPatch"
  | "wouldModifyFiles"
  | "wouldCreateFiles"
  | "wouldDeleteFiles"
  | "wouldRunGitCommand"
  | "wouldCreateBranch"
  | "wouldCheckoutBranch"
  | "wouldCreatePullRequest"
  | "wouldRecordOwnerApproval"
  | "wouldGrantImplementationApproval"
  | "wouldCreateApprovalRecord"
  | "wouldCreateTestFiles"
  | "wouldRunAutomatedTests"
  | "wouldCreateImplementationPlan"
  | "wouldCreateImplementationBranch"
  | "wouldCreateAdapterCode"
  | "wouldImportRealWriterImplementation"
  | "wouldRunTransaction"
  | "wouldCreateServiceRoleClient"
  | "wouldReadServiceRoleSecret"
  | "wouldPersistEvidence"
  | "wouldStoreRawPayload"
  | "wouldStoreSecrets"
  | "wouldWriteRows"
  | "wouldWriteAuditRows"
  | "wouldReserveIdempotencyKeys"
  | "wouldWriteIdempotencyRows"
  | "wouldWriteCompensationRows"
  | "wouldCreateMigrationFile"
  | "wouldApplyMigration"
  | "wouldCreateTables"
  | "wouldEnableWriters"
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

function statusTone(status: WriterPersistencePatchReviewStatus) {
  return status === "packet_ready" ? "ready" : "blocked";
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

function ReviewItemCard({
  item,
  copy,
  onProbe,
  probing,
}: {
  item: WriterPersistencePatchReviewItem;
  copy: ReviewCopy;
  onProbe: (item: WriterPersistencePatchReviewItem) => void;
  probing: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={statusTone(item.status)}>
              {copy.statusLabels[item.status]}
            </StatusPill>
            <StatusPill>{copy.categoryLabels[item.category]}</StatusPill>
            <StatusPill>
              {copy.owner}: {item.owner}
            </StatusPill>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-slate-950">
            {item.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {item.intent}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onProbe(item)}
          disabled={probing}
          className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {probing ? copy.probing : copy.probeReview}
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.requiredEvidence}
          </h3>
          <TextList items={item.requiredEvidence} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.requiredAssertions}
          </h3>
          <TextList items={item.requiredAssertions} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.forbiddenChanges}
          </h3>
          <TextList items={item.forbiddenChanges} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.reviewQuestions}
          </h3>
          <TextList items={item.reviewQuestions} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.blockingConditions}
          </h3>
          <TextList items={item.blockingConditions} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.nonExecutionClauses}
          </h3>
          <TextList items={item.nonExecutionClauses} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.futureArtifacts}
          </h3>
          <TextList items={item.futureReviewArtifacts} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.sourceDiffIds}
          </h3>
          <TextList items={item.sourceDiffEntryIds} />
        </div>
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-950">
          {copy.sourceRefs}
        </h3>
        <TextList items={item.sourceRefs} />
      </div>
    </article>
  );
}

export function WriterPersistencePatchReviewClientPage({
  payload,
}: WriterPersistencePatchReviewClientPageProps) {
  const { locale } = useLanguage();
  const copy = reviewCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistencePatchReviewProbeResult | null>(null);
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags: { key: BoolField; label: string }[] = [
    { key: "safeMode", label: copy.safeMode },
    { key: "readOnly", label: copy.readOnly },
    { key: "patchReviewPacketReady", label: copy.packetReadyFlag },
    { key: "patchReviewPacketOnly", label: copy.packetOnly },
    { key: "sourceDiffContractReady", label: copy.sourceReady },
    { key: "sourceDiffContractOnly", label: copy.sourceOnly },
    { key: "allRuntimeEffectsBlocked", label: copy.allRuntimeBlocked },
  ];

  const falseFlags: { key: BoolField; label: string }[] = [
    { key: "sourceDiffContractAccepted", label: copy.sourceAccepted },
    { key: "implementationPatchSubmitted", label: copy.patchSubmitted },
    { key: "implementationPatchApproved", label: copy.patchApproved },
    { key: "implementationPatchCreated", label: copy.patchCreated },
    { key: "implementationPatchApplied", label: copy.patchApplied },
    { key: "implementationFilesCreated", label: copy.filesCreated },
    { key: "implementationFilesModified", label: copy.filesModified },
    { key: "implementationTestsCreated", label: copy.testsCreated },
    { key: "implementationApprovalGranted", label: copy.approvalGranted },
    { key: "implementationBranchApproved", label: copy.branchApproved },
    { key: "branchCreationApproved", label: copy.branchCreationApproved },
    { key: "branchCreated", label: copy.branchCreated },
    { key: "pullRequestCreated", label: copy.pullRequestCreated },
    { key: "implementationPlanApproved", label: copy.planApproved },
    { key: "readyToApplyPatch", label: copy.readyToApplyPatch },
    { key: "readyToCreateImplementationBranch", label: copy.readyToCreateBranch },
    { key: "readyForAdapterImplementation", label: copy.readyForAdapter },
    { key: "schemaVerified", label: copy.schemaVerified },
    { key: "adapterImplemented", label: copy.adapterImplemented },
    { key: "adapterImplementationApproved", label: copy.adapterApproved },
    { key: "adapterImplementationAllowed", label: copy.adapterAllowed },
    {
      key: "implementationReviewComplete",
      label: copy.implementationReviewComplete,
    },
    {
      key: "allOwnerApprovalsComplete",
      label: copy.allOwnerApprovalsComplete,
    },
    { key: "allBlockingEvidenceReady", label: copy.allBlockingEvidenceReady },
    { key: "wouldReviewRealPatch", label: copy.wouldReviewRealPatch },
    { key: "wouldAcceptPatch", label: copy.wouldAcceptPatch },
    { key: "wouldGeneratePatch", label: copy.wouldGeneratePatch },
    { key: "wouldApplyPatch", label: copy.wouldApplyPatch },
    { key: "wouldModifyFiles", label: copy.wouldModifyFiles },
    { key: "wouldCreateFiles", label: copy.wouldCreateFiles },
    { key: "wouldDeleteFiles", label: copy.wouldDeleteFiles },
    { key: "wouldRunGitCommand", label: copy.wouldRunGitCommand },
    { key: "wouldCreateBranch", label: copy.wouldCreateBranch },
    { key: "wouldCheckoutBranch", label: copy.wouldCheckoutBranch },
    { key: "wouldCreatePullRequest", label: copy.wouldCreatePullRequest },
    { key: "wouldRecordOwnerApproval", label: copy.wouldRecordOwnerApproval },
    {
      key: "wouldGrantImplementationApproval",
      label: copy.wouldGrantImplementationApproval,
    },
    { key: "wouldCreateApprovalRecord", label: copy.wouldCreateApprovalRecord },
    { key: "wouldCreateTestFiles", label: copy.wouldCreateTestFiles },
    { key: "wouldRunAutomatedTests", label: copy.wouldRunAutomatedTests },
    {
      key: "wouldCreateImplementationPlan",
      label: copy.wouldCreateImplementationPlan,
    },
    {
      key: "wouldCreateImplementationBranch",
      label: copy.wouldCreateImplementationBranch,
    },
    { key: "wouldCreateAdapterCode", label: copy.wouldCreateAdapterCode },
    {
      key: "wouldImportRealWriterImplementation",
      label: copy.wouldImportRealWriterImplementation,
    },
    { key: "wouldRunTransaction", label: copy.wouldRunTransaction },
    {
      key: "wouldCreateServiceRoleClient",
      label: copy.wouldCreateServiceRoleClient,
    },
    { key: "wouldReadServiceRoleSecret", label: copy.wouldReadServiceRoleSecret },
    { key: "wouldPersistEvidence", label: copy.wouldPersistEvidence },
    { key: "wouldStoreRawPayload", label: copy.wouldStoreRawPayload },
    { key: "wouldStoreSecrets", label: copy.wouldStoreSecrets },
    { key: "wouldWriteRows", label: copy.wouldWriteRows },
    { key: "wouldWriteAuditRows", label: copy.wouldWriteAuditRows },
    {
      key: "wouldReserveIdempotencyKeys",
      label: copy.wouldReserveIdempotencyKeys,
    },
    {
      key: "wouldWriteIdempotencyRows",
      label: copy.wouldWriteIdempotencyRows,
    },
    {
      key: "wouldWriteCompensationRows",
      label: copy.wouldWriteCompensationRows,
    },
    { key: "wouldCreateMigrationFile", label: copy.wouldCreateMigrationFile },
    { key: "wouldApplyMigration", label: copy.wouldApplyMigration },
    { key: "wouldCreateTables", label: copy.wouldCreateTables },
    { key: "wouldEnableWriters", label: copy.wouldEnableWriters },
    { key: "wouldCallAi", label: copy.wouldCallAi },
    { key: "wouldCallStripe", label: copy.wouldCallStripe },
    { key: "wouldUnlockReports", label: copy.wouldUnlockReports },
  ];

  async function probeReview(item: WriterPersistencePatchReviewItem) {
    setProbingId(item.id);
    setProbeResult(null);

    try {
      const response = await fetch(
        "/api/system-writers/persistence-patch-review",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reviewId: item.id }),
        },
      );
      const result =
        (await response.json()) as WriterPersistencePatchReviewProbeResult;
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
        <Stat label={copy.patchReviewMode} value={payload.patchReviewMode} />
        <Stat
          label={copy.sourceDiffContractMode}
          value={payload.sourceDiffContractMode}
        />
        <Stat label={copy.checkedAt} value={payload.checkedAt} />
        <Stat label={copy.reviewItems} value={payload.reviewItemCount} />
        <Stat label={copy.packetReady} value={payload.packetReadyCount} />
        <Stat label={copy.blockedReviews} value={payload.blockedReviewCount} />
        <Stat label={copy.manualReviews} value={payload.manualReviewCount} />
        <Stat
          label={copy.requiredEvidence}
          value={payload.requiredEvidenceCount}
        />
        <Stat
          label={copy.requiredAssertions}
          value={payload.requiredAssertionCount}
        />
        <Stat
          label={copy.forbiddenChanges}
          value={payload.forbiddenChangeCount}
        />
        <Stat
          label={copy.sourceDiffEntries}
          value={payload.sourceDiffEntryCount}
        />
        <Stat
          label={copy.sourceDiffBlocked}
          value={payload.sourceDiffBlockedEntryCount}
        />
        <Stat
          label={copy.sourceDiffManual}
          value={payload.sourceDiffManualRequiredEntryCount}
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
            {copy.reviewRules}
          </h2>
          <div className="mt-3">
            <TextList items={payload.patchReviewRules} />
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.futureGates}
          </h2>
          <div className="mt-3">
            <TextList items={payload.futureOwnerSignoffGates} />
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
              {copy.patchReviewMode}: {probeResult.patchReviewMode}
            </StatusPill>
            {probeResult.reviewId ? (
              <StatusPill>reviewId: {probeResult.reviewId}</StatusPill>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="mb-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.items}
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/server-writers/persistence-diff-contract"
              className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
            >
              {copy.openDiffContract}
            </Link>
            <Link
              href="/server-writers/persistence-branch-preflight"
              className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
            >
              {copy.openBranchPreflight}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copy.openDashboard}
            </Link>
          </div>
        </div>
        {payload.reviewItems.map((item) => (
          <ReviewItemCard
            key={item.id}
            item={item}
            copy={copy}
            onProbe={probeReview}
            probing={probingId === item.id}
          />
        ))}
      </section>
    </AppShell>
  );
}
