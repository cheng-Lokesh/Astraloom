"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceOwnerSignoffCategory,
  WriterPersistenceOwnerSignoffItem,
  WriterPersistenceOwnerSignoffPayload,
  WriterPersistenceOwnerSignoffProbeResult,
  WriterPersistenceOwnerSignoffStatus,
} from "@/types/writer-persistence-owner-signoff";

type WriterPersistenceOwnerSignoffClientPageProps = {
  payload: WriterPersistenceOwnerSignoffPayload;
};

const signoffCopy = {
  en: {
    title: "Persistence adapter owner signoff packet",
    badge: "Read-only signoff packet",
    body: "This page defines future owner signoff lanes for the persistence adapter implementation. It names owner lanes, required evidence, signoff questions, approval boundaries, and forbidden delegations without collecting signatures or recording approval.",
    notice:
      "Every probe is blocked by design. This packet cannot collect signatures, record owner approval, grant implementation approval, accept patch review, review or accept a real patch, generate patches, apply patches, create files, modify files, create tests, run tests, run git, create branches, create pull requests, create adapter code, create privileged clients, run transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.",
    safetyState: "Safety state",
    ownerSignoffMode: "Owner signoff mode",
    sourcePatchReviewMode: "Source patch review mode",
    checkedAt: "Checked at",
    signoffItems: "Signoff items",
    packetReady: "Packet ready",
    blockedSignoffs: "Blocked",
    manualSignoffs: "Manual",
    requiredEvidence: "Required evidence",
    signoffQuestions: "Signoff questions",
    approvalBoundaries: "Approval boundaries",
    forbiddenDelegations: "Forbidden delegations",
    sourceReviewItems: "Source review items",
    sourceReviewBlocked: "Source review blocked",
    sourceReviewManual: "Source review manual",
    yes: "Yes",
    no: "No",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    packetReadyFlag: "Owner signoff packet ready",
    packetOnly: "Owner signoff packet only",
    sourceReady: "Source patch review ready",
    sourceOnly: "Source patch review only",
    sourceAccepted: "Source patch review accepted",
    signoffSubmitted: "Owner signoff submitted",
    signoffRecorded: "Owner signoff recorded",
    signoffComplete: "Owner signoff complete",
    patchReviewAccepted: "Patch review accepted",
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
    readyForReleaseNoGo: "Ready for release no-go packet",
    schemaVerified: "Schema verified",
    adapterImplemented: "Adapter implemented",
    adapterApproved: "Adapter implementation approved",
    adapterAllowed: "Adapter implementation allowed",
    implementationReviewComplete: "Implementation review complete",
    allOwnerApprovalsComplete: "All owner approvals complete",
    allBlockingEvidenceReady: "All blocking evidence ready",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldCollectSignature: "Would collect signature",
    wouldRecordOwnerApproval: "Would record owner approval",
    wouldGrantImplementationApproval: "Would grant implementation approval",
    wouldCreateApprovalRecord: "Would create approval record",
    wouldAcceptPatchReview: "Would accept patch review",
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
    signoffRules: "Owner signoff rules",
    futureGates: "Future release no-go gates",
    blockedCodes: "Blocked codes",
    items: "Owner signoff items",
    reviewItems: "Source review items",
    blockingConditions: "Blocking conditions",
    nonExecutionClauses: "Non-execution clauses",
    futureArtifacts: "Future signoff artifacts",
    sourceRefs: "Source refs",
    owner: "Owner",
    probeSignoff: "Probe signoff",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one signoff item to confirm this packet remains read-only and blocked.",
    openPatchReview: "Open patch review",
    openDiffContract: "Open diff contract",
    openDashboard: "Back to dashboard",
    statusLabels: {
      packet_ready: "Packet ready",
      blocked_by_patch_review: "Blocked by patch review",
      manual_required: "Manual required",
    } satisfies Record<WriterPersistenceOwnerSignoffStatus, string>,
    categoryLabels: {
      source_patch_review_invariant: "Source patch review invariant",
      founder_signoff: "Founder signoff",
      security_signoff: "Security signoff",
      backend_signoff: "Backend signoff",
      qa_signoff: "QA signoff",
      operator_signoff: "Operator signoff",
      data_protection_signoff: "Data protection signoff",
      product_scope_signoff: "Product scope signoff",
      signoff_record_no_write: "Signoff record no-write",
      final_no_go: "Final no-go",
    } satisfies Record<WriterPersistenceOwnerSignoffCategory, string>,
  },
  zh: {
    title: "持久化适配器负责人签核包",
    badge: "只读签核包",
    body: "这个页面定义未来持久化适配器实现所需的负责人签核通道。它只列出负责人、必要证据、签核问题、批准边界和禁止委托，不收集签名，也不记录批准。",
    notice:
      "所有探针都会按设计被阻断。这个签核包不能收集签名、记录负责人批准、授予实现批准、接受 patch review、审查或接受真实 patch、生成 patch、应用 patch、创建文件、修改文件、创建测试、运行测试、执行 git、创建分支、创建 PR、创建适配器代码、创建特权客户端、运行事务、创建 migration、写入数据库、调用 AI、调用 Stripe 或解锁报告。",
    safetyState: "安全状态",
    ownerSignoffMode: "负责人签核模式",
    sourcePatchReviewMode: "来源 patch review 模式",
    checkedAt: "检查时间",
    signoffItems: "签核项",
    packetReady: "包已就绪",
    blockedSignoffs: "被阻断",
    manualSignoffs: "人工项",
    requiredEvidence: "必要证据",
    signoffQuestions: "签核问题",
    approvalBoundaries: "批准边界",
    forbiddenDelegations: "禁止委托",
    sourceReviewItems: "来源审查项",
    sourceReviewBlocked: "来源阻断项",
    sourceReviewManual: "来源人工项",
    yes: "是",
    no: "否",
    safeMode: "安全模式",
    readOnly: "只读",
    packetReadyFlag: "负责人签核包已就绪",
    packetOnly: "仅负责人签核包",
    sourceReady: "来源 patch review 已就绪",
    sourceOnly: "仅来源 patch review",
    sourceAccepted: "来源 patch review 已接受",
    signoffSubmitted: "负责人签核已提交",
    signoffRecorded: "负责人签核已记录",
    signoffComplete: "负责人签核已完成",
    patchReviewAccepted: "Patch review 已接受",
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
    readyForReleaseNoGo: "可进入 release no-go 包",
    schemaVerified: "Schema 已验证",
    adapterImplemented: "适配器已实现",
    adapterApproved: "适配器实现已批准",
    adapterAllowed: "适配器实现已允许",
    implementationReviewComplete: "实现审查已完成",
    allOwnerApprovalsComplete: "全部负责人批准已完成",
    allBlockingEvidenceReady: "全部阻断证据已就绪",
    allRuntimeBlocked: "全部运行时副作用已阻断",
    wouldCollectSignature: "是否会收集签名",
    wouldRecordOwnerApproval: "是否会记录负责人批准",
    wouldGrantImplementationApproval: "是否会授予实现批准",
    wouldCreateApprovalRecord: "是否会创建批准记录",
    wouldAcceptPatchReview: "是否会接受 patch review",
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
    signoffRules: "负责人签核规则",
    futureGates: "未来 release no-go 门槛",
    blockedCodes: "阻断代码",
    items: "负责人签核条目",
    reviewItems: "来源审查项",
    blockingConditions: "阻断条件",
    nonExecutionClauses: "不执行条款",
    futureArtifacts: "未来签核产物",
    sourceRefs: "来源引用",
    owner: "负责人",
    probeSignoff: "探测签核项",
    probing: "探测中...",
    probeResult: "探针结果",
    noProbe: "探测一个签核项，确认这个包仍然只读且被阻断。",
    openPatchReview: "打开 Patch 审查",
    openDiffContract: "打开 Diff 契约",
    openDashboard: "返回工作台",
    statusLabels: {
      packet_ready: "包已就绪",
      blocked_by_patch_review: "被 patch review 阻断",
      manual_required: "需要人工确认",
    } satisfies Record<WriterPersistenceOwnerSignoffStatus, string>,
    categoryLabels: {
      source_patch_review_invariant: "来源 patch review 不变式",
      founder_signoff: "创始人签核",
      security_signoff: "安全签核",
      backend_signoff: "后端签核",
      qa_signoff: "QA 签核",
      operator_signoff: "运营签核",
      data_protection_signoff: "数据保护签核",
      product_scope_signoff: "产品范围签核",
      signoff_record_no_write: "签核记录不写入",
      final_no_go: "最终 no-go",
    } satisfies Record<WriterPersistenceOwnerSignoffCategory, string>,
  },
} as const;

type SignoffCopy = (typeof signoffCopy)[keyof typeof signoffCopy];

type BoolField = keyof Pick<
  WriterPersistenceOwnerSignoffPayload,
  | "safeMode"
  | "readOnly"
  | "ownerSignoffPacketReady"
  | "ownerSignoffPacketOnly"
  | "sourcePatchReviewPacketReady"
  | "sourcePatchReviewPacketOnly"
  | "sourcePatchReviewAccepted"
  | "ownerSignoffSubmitted"
  | "ownerSignoffRecorded"
  | "ownerSignoffComplete"
  | "implementationPatchReviewAccepted"
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
  | "readyForReleaseNoGoPacket"
  | "schemaVerified"
  | "adapterImplemented"
  | "adapterImplementationApproved"
  | "adapterImplementationAllowed"
  | "implementationReviewComplete"
  | "allOwnerApprovalsComplete"
  | "allBlockingEvidenceReady"
  | "allRuntimeEffectsBlocked"
  | "wouldCollectSignature"
  | "wouldRecordOwnerApproval"
  | "wouldGrantImplementationApproval"
  | "wouldCreateApprovalRecord"
  | "wouldAcceptPatchReview"
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
  copy: SignoffCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function statusTone(status: WriterPersistenceOwnerSignoffStatus) {
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

function SignoffItemCard({
  item,
  copy,
  onProbe,
  probing,
}: {
  item: WriterPersistenceOwnerSignoffItem;
  copy: SignoffCopy;
  onProbe: (item: WriterPersistenceOwnerSignoffItem) => void;
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
          {probing ? copy.probing : copy.probeSignoff}
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
            {copy.signoffQuestions}
          </h3>
          <TextList items={item.signoffQuestions} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.approvalBoundaries}
          </h3>
          <TextList items={item.approvalBoundaries} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.forbiddenDelegations}
          </h3>
          <TextList items={item.forbiddenDelegations} />
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
          <TextList items={item.futureSignoffArtifacts} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.reviewItems}
          </h3>
          <TextList items={item.sourceReviewItemIds} />
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

export function WriterPersistenceOwnerSignoffClientPage({
  payload,
}: WriterPersistenceOwnerSignoffClientPageProps) {
  const { locale } = useLanguage();
  const copy = signoffCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceOwnerSignoffProbeResult | null>(null);
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags: { key: BoolField; label: string }[] = [
    { key: "safeMode", label: copy.safeMode },
    { key: "readOnly", label: copy.readOnly },
    { key: "ownerSignoffPacketReady", label: copy.packetReadyFlag },
    { key: "ownerSignoffPacketOnly", label: copy.packetOnly },
    { key: "sourcePatchReviewPacketReady", label: copy.sourceReady },
    { key: "sourcePatchReviewPacketOnly", label: copy.sourceOnly },
    { key: "allRuntimeEffectsBlocked", label: copy.allRuntimeBlocked },
  ];

  const falseFlags: { key: BoolField; label: string }[] = [
    { key: "sourcePatchReviewAccepted", label: copy.sourceAccepted },
    { key: "ownerSignoffSubmitted", label: copy.signoffSubmitted },
    { key: "ownerSignoffRecorded", label: copy.signoffRecorded },
    { key: "ownerSignoffComplete", label: copy.signoffComplete },
    {
      key: "implementationPatchReviewAccepted",
      label: copy.patchReviewAccepted,
    },
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
    { key: "readyForReleaseNoGoPacket", label: copy.readyForReleaseNoGo },
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
    { key: "wouldCollectSignature", label: copy.wouldCollectSignature },
    { key: "wouldRecordOwnerApproval", label: copy.wouldRecordOwnerApproval },
    {
      key: "wouldGrantImplementationApproval",
      label: copy.wouldGrantImplementationApproval,
    },
    { key: "wouldCreateApprovalRecord", label: copy.wouldCreateApprovalRecord },
    { key: "wouldAcceptPatchReview", label: copy.wouldAcceptPatchReview },
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

  async function probeSignoff(item: WriterPersistenceOwnerSignoffItem) {
    setProbingId(item.id);
    setProbeResult(null);

    try {
      const response = await fetch(
        "/api/system-writers/persistence-owner-signoff",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ signoffId: item.id }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceOwnerSignoffProbeResult;
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
        <Stat label={copy.ownerSignoffMode} value={payload.ownerSignoffMode} />
        <Stat
          label={copy.sourcePatchReviewMode}
          value={payload.sourcePatchReviewMode}
        />
        <Stat label={copy.checkedAt} value={payload.checkedAt} />
        <Stat label={copy.signoffItems} value={payload.signoffItemCount} />
        <Stat label={copy.packetReady} value={payload.packetReadyCount} />
        <Stat label={copy.blockedSignoffs} value={payload.blockedSignoffCount} />
        <Stat label={copy.manualSignoffs} value={payload.manualSignoffCount} />
        <Stat
          label={copy.requiredEvidence}
          value={payload.requiredEvidenceCount}
        />
        <Stat
          label={copy.signoffQuestions}
          value={payload.signoffQuestionCount}
        />
        <Stat
          label={copy.approvalBoundaries}
          value={payload.approvalBoundaryCount}
        />
        <Stat
          label={copy.forbiddenDelegations}
          value={payload.forbiddenDelegationCount}
        />
        <Stat
          label={copy.sourceReviewItems}
          value={payload.sourcePatchReviewItemCount}
        />
        <Stat
          label={copy.sourceReviewBlocked}
          value={payload.sourcePatchReviewBlockedCount}
        />
        <Stat
          label={copy.sourceReviewManual}
          value={payload.sourcePatchReviewManualCount}
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
            {copy.signoffRules}
          </h2>
          <div className="mt-3">
            <TextList items={payload.signoffPacketRules} />
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.futureGates}
          </h2>
          <div className="mt-3">
            <TextList items={payload.futureReleaseNoGoGates} />
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
              {copy.ownerSignoffMode}: {probeResult.ownerSignoffMode}
            </StatusPill>
            {probeResult.signoffId ? (
              <StatusPill>signoffId: {probeResult.signoffId}</StatusPill>
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
              href="/server-writers/persistence-patch-review"
              className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
            >
              {copy.openPatchReview}
            </Link>
            <Link
              href="/server-writers/persistence-diff-contract"
              className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
            >
              {copy.openDiffContract}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copy.openDashboard}
            </Link>
          </div>
        </div>
        {payload.signoffItems.map((item) => (
          <SignoffItemCard
            key={item.id}
            item={item}
            copy={copy}
            onProbe={probeSignoff}
            probing={probingId === item.id}
          />
        ))}
      </section>
    </AppShell>
  );
}
