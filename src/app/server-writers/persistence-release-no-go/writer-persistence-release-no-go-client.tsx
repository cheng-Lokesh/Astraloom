"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceReleaseNoGoCategory,
  WriterPersistenceReleaseNoGoItem,
  WriterPersistenceReleaseNoGoPayload,
  WriterPersistenceReleaseNoGoProbeResult,
  WriterPersistenceReleaseNoGoStatus,
} from "@/types/writer-persistence-release-no-go";

type WriterPersistenceReleaseNoGoClientPageProps = {
  payload: WriterPersistenceReleaseNoGoPayload;
};

const releaseNoGoCopy = {
  en: {
    title: "Persistence adapter release no-go packet",
    badge: "Release no-go",
    body: "This page aggregates final release blockers after the owner signoff packet. It is a read-only handoff packet for future human review, not a release approval system.",
    notice:
      "Every probe is blocked by design. This packet cannot record a go decision, grant release approval, enable feature flags, deploy code, run production writers, record owner approval, accept patch review, create files, create tests, create branches, create privileged clients, run transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.",
    safetyState: "Safety state",
    releaseNoGoMode: "Release no-go mode",
    sourceOwnerSignoffMode: "Source owner signoff mode",
    checkedAt: "Checked at",
    releaseItems: "Release items",
    packetReady: "Packet ready",
    blockedByOwner: "Blocked by owner signoff",
    releaseBlockers: "Release blockers",
    manualRequired: "Manual required",
    requiredEvidence: "Required evidence",
    releaseQuestions: "Release questions",
    noGoRules: "No-go decision rules",
    forbiddenActions: "Forbidden actions",
    sourceSignoffItems: "Source signoff items",
    sourceOwnerItems: "Source owner items",
    sourceOwnerManual: "Source owner manual",
    sourceOwnerBlocked: "Source owner blocked",
    yes: "Yes",
    no: "No",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    releaseBlocked: "Release blocked",
    releasePacketReady: "Release no-go packet ready",
    releasePacketOnly: "Release no-go packet only",
    sourceReady: "Source owner signoff ready",
    sourceOnly: "Source owner signoff only",
    sourceComplete: "Source owner signoff complete",
    ownerRecorded: "Owner signoff recorded",
    ownerComplete: "Owner signoff complete",
    releaseAccepted: "Release no-go accepted",
    goRecorded: "Go decision recorded",
    releaseApproved: "Release approved",
    releaseApprovalGranted: "Release approval granted",
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
    readyToCreateBranch: "Ready to create branch",
    readyForAdapter: "Ready for adapter implementation",
    readyForRelease: "Ready for release execution",
    schemaVerified: "Schema verified",
    adapterImplemented: "Adapter implemented",
    adapterApproved: "Adapter implementation approved",
    adapterAllowed: "Adapter implementation allowed",
    allOwnerApprovalsComplete: "All owner approvals complete",
    allBlockingEvidenceReady: "All blocking evidence ready",
    humanRunbookNeeded: "Human go/no-go runbook needed",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldAcceptReleaseNoGo: "Would accept release no-go",
    wouldRecordGoDecision: "Would record go decision",
    wouldGrantReleaseApproval: "Would grant release approval",
    wouldEnableFeatureFlag: "Would enable feature flag",
    wouldDeployCode: "Would deploy code",
    wouldRunProductionWriter: "Would run production writer",
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
    wouldRunGitCommand: "Would run git command",
    wouldCreateBranch: "Would create branch",
    wouldCreatePullRequest: "Would create pull request",
    wouldCreateTestFiles: "Would create test files",
    wouldRunAutomatedTests: "Would run automated tests",
    wouldCreateAdapterCode: "Would create adapter code",
    wouldRunTransaction: "Would run transaction",
    wouldCreateServiceRoleClient: "Would create privileged client",
    wouldReadServiceRoleSecret: "Would read privileged secret",
    wouldPersistEvidence: "Would persist evidence",
    wouldStoreRawPayload: "Would store raw payload",
    wouldStoreSecrets: "Would store secrets",
    wouldWriteRows: "Would write rows",
    wouldWriteAuditRows: "Would write audit rows",
    wouldReserveIdempotencyKeys: "Would reserve idempotency keys",
    wouldCreateMigrationFile: "Would create migration file",
    wouldApplyMigration: "Would apply migration",
    wouldCreateTables: "Would create tables",
    wouldEnableWriters: "Would enable writers",
    wouldCallAi: "Would call AI",
    wouldCallStripe: "Would call Stripe",
    wouldUnlockReports: "Would unlock reports",
    packetRules: "Release no-go rules",
    nextHumanGates: "Next human decision gates",
    blockedCodes: "Blocked codes",
    items: "Release blockers",
    blockerSummary: "Blocker summary",
    decisionRules: "Decision rules",
    nonExecutionClauses: "Non-execution clauses",
    futureArtifacts: "Future human artifacts",
    sourceRefs: "Source refs",
    owner: "Owner",
    probeItem: "Probe blocker",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one release blocker to confirm this packet remains read-only and blocked.",
    openOwnerSignoff: "Open owner signoff",
    openPatchReview: "Open patch review",
    openDashboard: "Back to dashboard",
    statusLabels: {
      packet_ready: "Packet ready",
      blocked_by_owner_signoff: "Blocked by owner signoff",
      release_blocker: "Release blocker",
      manual_required: "Manual required",
    } satisfies Record<WriterPersistenceReleaseNoGoStatus, string>,
    categoryLabels: {
      source_owner_signoff_invariant: "Source owner invariant",
      owner_lane_blocker: "Owner lane blocker",
      security_release_blocker: "Security blocker",
      backend_release_blocker: "Backend blocker",
      qa_release_blocker: "QA blocker",
      migration_release_blocker: "Migration blocker",
      runtime_write_blocker: "Runtime write blocker",
      data_protection_blocker: "Data protection blocker",
      operator_compensation_blocker: "Operator compensation",
      product_scope_blocker: "Product scope blocker",
      browser_boundary_packet: "Browser boundary",
      final_release_no_go: "Final release no-go",
    } satisfies Record<WriterPersistenceReleaseNoGoCategory, string>,
  },
  zh: {
    title: "持久化适配器发布 No-go 包",
    badge: "发布 No-go",
    body: "这个页面汇总负责人签核包之后的最终发布阻断项。它只是给未来人工审查使用的只读交接包，不是发布批准系统。",
    notice:
      "所有探针都会按设计被阻断。这个包不能记录 go 决策、授予发布批准、启用功能开关、部署代码、运行生产 writer、记录负责人批准、接受 patch review、创建文件、创建测试、创建分支、创建特权客户端、运行事务、创建 migration、写入数据库、调用 AI、调用 Stripe 或解锁报告。",
    safetyState: "安全状态",
    releaseNoGoMode: "发布 No-go 模式",
    sourceOwnerSignoffMode: "来源负责人签核模式",
    checkedAt: "检查时间",
    releaseItems: "发布项",
    packetReady: "包已就绪",
    blockedByOwner: "被负责人签核阻断",
    releaseBlockers: "发布阻断项",
    manualRequired: "人工项",
    requiredEvidence: "必要证据",
    releaseQuestions: "发布问题",
    noGoRules: "No-go 决策规则",
    forbiddenActions: "禁止动作",
    sourceSignoffItems: "来源签核项",
    sourceOwnerItems: "来源负责人项",
    sourceOwnerManual: "来源人工项",
    sourceOwnerBlocked: "来源阻断项",
    yes: "是",
    no: "否",
    safeMode: "安全模式",
    readOnly: "只读",
    releaseBlocked: "发布已阻断",
    releasePacketReady: "发布 No-go 包已就绪",
    releasePacketOnly: "仅发布 No-go 包",
    sourceReady: "来源负责人签核已就绪",
    sourceOnly: "仅来源负责人签核包",
    sourceComplete: "来源负责人签核完成",
    ownerRecorded: "负责人签核已记录",
    ownerComplete: "负责人签核完成",
    releaseAccepted: "发布 No-go 已接受",
    goRecorded: "Go 决策已记录",
    releaseApproved: "发布已批准",
    releaseApprovalGranted: "发布批准已授予",
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
    readyToCreateBranch: "可创建分支",
    readyForAdapter: "可实现适配器",
    readyForRelease: "可执行发布",
    schemaVerified: "Schema 已验证",
    adapterImplemented: "适配器已实现",
    adapterApproved: "适配器实现已批准",
    adapterAllowed: "适配器实现已允许",
    allOwnerApprovalsComplete: "全部负责人批准完成",
    allBlockingEvidenceReady: "全部阻断证据就绪",
    humanRunbookNeeded: "需要人工 go/no-go 手册",
    allRuntimeBlocked: "全部运行时副作用已阻断",
    wouldAcceptReleaseNoGo: "是否会接受发布 No-go",
    wouldRecordGoDecision: "是否会记录 go 决策",
    wouldGrantReleaseApproval: "是否会授予发布批准",
    wouldEnableFeatureFlag: "是否会启用功能开关",
    wouldDeployCode: "是否会部署代码",
    wouldRunProductionWriter: "是否会运行生产 writer",
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
    wouldRunGitCommand: "是否会运行 git 命令",
    wouldCreateBranch: "是否会创建分支",
    wouldCreatePullRequest: "是否会创建 PR",
    wouldCreateTestFiles: "是否会创建测试文件",
    wouldRunAutomatedTests: "是否会运行自动化测试",
    wouldCreateAdapterCode: "是否会创建适配器代码",
    wouldRunTransaction: "是否会运行事务",
    wouldCreateServiceRoleClient: "是否会创建特权客户端",
    wouldReadServiceRoleSecret: "是否会读取特权密钥",
    wouldPersistEvidence: "是否会持久化证据",
    wouldStoreRawPayload: "是否会存储原始 payload",
    wouldStoreSecrets: "是否会存储密钥",
    wouldWriteRows: "是否会写入数据行",
    wouldWriteAuditRows: "是否会写入审计行",
    wouldReserveIdempotencyKeys: "是否会预留幂等 key",
    wouldCreateMigrationFile: "是否会创建 migration 文件",
    wouldApplyMigration: "是否会应用 migration",
    wouldCreateTables: "是否会创建表",
    wouldEnableWriters: "是否会启用 writers",
    wouldCallAi: "是否会调用 AI",
    wouldCallStripe: "是否会调用 Stripe",
    wouldUnlockReports: "是否会解锁报告",
    packetRules: "发布 No-go 规则",
    nextHumanGates: "下一步人工决策门槛",
    blockedCodes: "阻断代码",
    items: "发布阻断项",
    blockerSummary: "阻断摘要",
    decisionRules: "决策规则",
    nonExecutionClauses: "不执行条款",
    futureArtifacts: "未来人工产物",
    sourceRefs: "来源引用",
    owner: "负责人",
    probeItem: "探测阻断项",
    probing: "探测中...",
    probeResult: "探针结果",
    noProbe: "探测一个发布阻断项，确认这个包仍然只读且被阻断。",
    openOwnerSignoff: "打开负责人签核",
    openPatchReview: "打开 Patch 审查",
    openDashboard: "返回工作台",
    statusLabels: {
      packet_ready: "包已就绪",
      blocked_by_owner_signoff: "被负责人签核阻断",
      release_blocker: "发布阻断项",
      manual_required: "需要人工确认",
    } satisfies Record<WriterPersistenceReleaseNoGoStatus, string>,
    categoryLabels: {
      source_owner_signoff_invariant: "来源负责人签核不变式",
      owner_lane_blocker: "负责人通道阻断",
      security_release_blocker: "安全发布阻断",
      backend_release_blocker: "后端发布阻断",
      qa_release_blocker: "QA 发布阻断",
      migration_release_blocker: "Migration 阻断",
      runtime_write_blocker: "运行时写入阻断",
      data_protection_blocker: "数据保护阻断",
      operator_compensation_blocker: "运营补偿阻断",
      product_scope_blocker: "产品范围阻断",
      browser_boundary_packet: "浏览器边界",
      final_release_no_go: "最终发布 No-go",
    } satisfies Record<WriterPersistenceReleaseNoGoCategory, string>,
  },
} as const;

type ReleaseNoGoCopy = (typeof releaseNoGoCopy)[keyof typeof releaseNoGoCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: ReleaseNoGoCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function statusTone(status: WriterPersistenceReleaseNoGoStatus) {
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

function ReleaseItemCard({
  item,
  copy,
  onProbe,
  probing,
}: {
  item: WriterPersistenceReleaseNoGoItem;
  copy: ReleaseNoGoCopy;
  onProbe: (item: WriterPersistenceReleaseNoGoItem) => void;
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
          <p className="mt-3 text-sm leading-6 text-rose-800">
            <span className="font-semibold">{copy.blockerSummary}: </span>
            {item.blockerSummary}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onProbe(item)}
          disabled={probing}
          className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {probing ? copy.probing : copy.probeItem}
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
            {copy.releaseQuestions}
          </h3>
          <TextList items={item.releaseQuestions} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.decisionRules}
          </h3>
          <TextList items={item.noGoDecisionRules} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.forbiddenActions}
          </h3>
          <TextList items={item.forbiddenActions} />
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
          <TextList items={item.futureHumanArtifacts} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.sourceSignoffItems}
          </h3>
          <TextList items={item.sourceSignoffItemIds} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.sourceRefs}
          </h3>
          <TextList items={item.sourceRefs} />
        </div>
      </div>
    </article>
  );
}

export function WriterPersistenceReleaseNoGoClientPage({
  payload,
}: WriterPersistenceReleaseNoGoClientPageProps) {
  const { locale } = useLanguage();
  const copy = releaseNoGoCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceReleaseNoGoProbeResult | null>(null);
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags = [
    { value: payload.safeMode, label: copy.safeMode },
    { value: payload.readOnly, label: copy.readOnly },
    { value: payload.releaseBlocked, label: copy.releaseBlocked },
    { value: payload.releaseNoGoPacketReady, label: copy.releasePacketReady },
    { value: payload.releaseNoGoPacketOnly, label: copy.releasePacketOnly },
    {
      value: payload.sourceOwnerSignoffPacketReady,
      label: copy.sourceReady,
    },
    { value: payload.sourceOwnerSignoffPacketOnly, label: copy.sourceOnly },
    { value: payload.humanGoNoGoRunbookNeeded, label: copy.humanRunbookNeeded },
    { value: payload.allRuntimeEffectsBlocked, label: copy.allRuntimeBlocked },
  ];

  const falseFlags = [
    { value: payload.sourceOwnerSignoffComplete, label: copy.sourceComplete },
    { value: payload.ownerSignoffRecorded, label: copy.ownerRecorded },
    { value: payload.ownerSignoffComplete, label: copy.ownerComplete },
    { value: payload.releaseNoGoAccepted, label: copy.releaseAccepted },
    { value: payload.releaseGoDecisionRecorded, label: copy.goRecorded },
    { value: payload.releaseApproved, label: copy.releaseApproved },
    {
      value: payload.releaseApprovalGranted,
      label: copy.releaseApprovalGranted,
    },
    {
      value: payload.implementationPatchReviewAccepted,
      label: copy.patchReviewAccepted,
    },
    { value: payload.implementationPatchSubmitted, label: copy.patchSubmitted },
    { value: payload.implementationPatchApproved, label: copy.patchApproved },
    { value: payload.implementationPatchCreated, label: copy.patchCreated },
    { value: payload.implementationPatchApplied, label: copy.patchApplied },
    { value: payload.implementationFilesCreated, label: copy.filesCreated },
    { value: payload.implementationFilesModified, label: copy.filesModified },
    { value: payload.implementationTestsCreated, label: copy.testsCreated },
    {
      value: payload.implementationApprovalGranted,
      label: copy.approvalGranted,
    },
    {
      value: payload.implementationBranchApproved,
      label: copy.branchApproved,
    },
    {
      value: payload.branchCreationApproved,
      label: copy.branchCreationApproved,
    },
    { value: payload.branchCreated, label: copy.branchCreated },
    { value: payload.pullRequestCreated, label: copy.pullRequestCreated },
    { value: payload.implementationPlanApproved, label: copy.planApproved },
    { value: payload.readyToApplyPatch, label: copy.readyToApplyPatch },
    {
      value: payload.readyToCreateImplementationBranch,
      label: copy.readyToCreateBranch,
    },
    {
      value: payload.readyForAdapterImplementation,
      label: copy.readyForAdapter,
    },
    { value: payload.readyForReleaseExecution, label: copy.readyForRelease },
    { value: payload.schemaVerified, label: copy.schemaVerified },
    { value: payload.adapterImplemented, label: copy.adapterImplemented },
    {
      value: payload.adapterImplementationApproved,
      label: copy.adapterApproved,
    },
    { value: payload.adapterImplementationAllowed, label: copy.adapterAllowed },
    {
      value: payload.allOwnerApprovalsComplete,
      label: copy.allOwnerApprovalsComplete,
    },
    {
      value: payload.allBlockingEvidenceReady,
      label: copy.allBlockingEvidenceReady,
    },
    {
      value: payload.wouldAcceptReleaseNoGo,
      label: copy.wouldAcceptReleaseNoGo,
    },
    { value: payload.wouldRecordGoDecision, label: copy.wouldRecordGoDecision },
    {
      value: payload.wouldGrantReleaseApproval,
      label: copy.wouldGrantReleaseApproval,
    },
    {
      value: payload.wouldEnableFeatureFlag,
      label: copy.wouldEnableFeatureFlag,
    },
    { value: payload.wouldDeployCode, label: copy.wouldDeployCode },
    {
      value: payload.wouldRunProductionWriter,
      label: copy.wouldRunProductionWriter,
    },
    { value: payload.wouldCollectSignature, label: copy.wouldCollectSignature },
    {
      value: payload.wouldRecordOwnerApproval,
      label: copy.wouldRecordOwnerApproval,
    },
    {
      value: payload.wouldGrantImplementationApproval,
      label: copy.wouldGrantImplementationApproval,
    },
    {
      value: payload.wouldCreateApprovalRecord,
      label: copy.wouldCreateApprovalRecord,
    },
    {
      value: payload.wouldAcceptPatchReview,
      label: copy.wouldAcceptPatchReview,
    },
    { value: payload.wouldReviewRealPatch, label: copy.wouldReviewRealPatch },
    { value: payload.wouldAcceptPatch, label: copy.wouldAcceptPatch },
    { value: payload.wouldGeneratePatch, label: copy.wouldGeneratePatch },
    { value: payload.wouldApplyPatch, label: copy.wouldApplyPatch },
    { value: payload.wouldModifyFiles, label: copy.wouldModifyFiles },
    { value: payload.wouldCreateFiles, label: copy.wouldCreateFiles },
    { value: payload.wouldRunGitCommand, label: copy.wouldRunGitCommand },
    { value: payload.wouldCreateBranch, label: copy.wouldCreateBranch },
    {
      value: payload.wouldCreatePullRequest,
      label: copy.wouldCreatePullRequest,
    },
    { value: payload.wouldCreateTestFiles, label: copy.wouldCreateTestFiles },
    {
      value: payload.wouldRunAutomatedTests,
      label: copy.wouldRunAutomatedTests,
    },
    { value: payload.wouldCreateAdapterCode, label: copy.wouldCreateAdapterCode },
    { value: payload.wouldRunTransaction, label: copy.wouldRunTransaction },
    {
      value: payload.wouldCreateServiceRoleClient,
      label: copy.wouldCreateServiceRoleClient,
    },
    {
      value: payload.wouldReadServiceRoleSecret,
      label: copy.wouldReadServiceRoleSecret,
    },
    { value: payload.wouldPersistEvidence, label: copy.wouldPersistEvidence },
    { value: payload.wouldStoreRawPayload, label: copy.wouldStoreRawPayload },
    { value: payload.wouldStoreSecrets, label: copy.wouldStoreSecrets },
    { value: payload.wouldWriteRows, label: copy.wouldWriteRows },
    { value: payload.wouldWriteAuditRows, label: copy.wouldWriteAuditRows },
    {
      value: payload.wouldReserveIdempotencyKeys,
      label: copy.wouldReserveIdempotencyKeys,
    },
    {
      value: payload.wouldCreateMigrationFile,
      label: copy.wouldCreateMigrationFile,
    },
    { value: payload.wouldApplyMigration, label: copy.wouldApplyMigration },
    { value: payload.wouldCreateTables, label: copy.wouldCreateTables },
    { value: payload.wouldEnableWriters, label: copy.wouldEnableWriters },
    { value: payload.wouldCallAi, label: copy.wouldCallAi },
    { value: payload.wouldCallStripe, label: copy.wouldCallStripe },
    { value: payload.wouldUnlockReports, label: copy.wouldUnlockReports },
  ];

  async function probeReleaseItem(item: WriterPersistenceReleaseNoGoItem) {
    setProbingId(item.id);
    setProbeResult(null);

    try {
      const response = await fetch(
        "/api/system-writers/persistence-release-no-go",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ itemId: item.id }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceReleaseNoGoProbeResult;
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

      <section className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-900">
        {copy.notice}
      </section>

      <section className="mb-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat label={copy.releaseNoGoMode} value={payload.releaseNoGoMode} />
        <Stat
          label={copy.sourceOwnerSignoffMode}
          value={payload.sourceOwnerSignoffMode}
        />
        <Stat label={copy.checkedAt} value={payload.checkedAt} />
        <Stat label={copy.releaseItems} value={payload.releaseItemCount} />
        <Stat label={copy.packetReady} value={payload.packetReadyCount} />
        <Stat
          label={copy.blockedByOwner}
          value={payload.blockedByOwnerSignoffCount}
        />
        <Stat label={copy.releaseBlockers} value={payload.releaseBlockerCount} />
        <Stat label={copy.manualRequired} value={payload.manualRequiredCount} />
        <Stat
          label={copy.requiredEvidence}
          value={payload.requiredEvidenceCount}
        />
        <Stat
          label={copy.releaseQuestions}
          value={payload.releaseQuestionCount}
        />
        <Stat label={copy.noGoRules} value={payload.noGoDecisionRuleCount} />
        <Stat
          label={copy.forbiddenActions}
          value={payload.forbiddenActionCount}
        />
        <Stat
          label={copy.sourceOwnerItems}
          value={payload.sourceOwnerSignoffItemCount}
        />
        <Stat
          label={copy.sourceOwnerManual}
          value={payload.sourceOwnerSignoffManualCount}
        />
        <Stat
          label={copy.sourceOwnerBlocked}
          value={payload.sourceOwnerSignoffBlockedCount}
        />
      </section>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.safetyState}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {trueFlags.map((item) => (
            <BoolPill
              key={item.label}
              value={item.value}
              label={item.label}
              copy={copy}
            />
          ))}
          {falseFlags.map((item) => (
            <BoolPill
              key={item.label}
              value={item.value}
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
            {copy.packetRules}
          </h2>
          <div className="mt-3">
            <TextList items={payload.releaseNoGoRules} />
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.nextHumanGates}
          </h2>
          <div className="mt-3">
            <TextList items={payload.nextHumanDecisionGates} />
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
              {copy.releaseNoGoMode}: {probeResult.releaseNoGoMode}
            </StatusPill>
            {probeResult.itemId ? (
              <StatusPill>itemId: {probeResult.itemId}</StatusPill>
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
              href="/server-writers/persistence-owner-signoff"
              className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              {copy.openOwnerSignoff}
            </Link>
            <Link
              href="/server-writers/persistence-patch-review"
              className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
            >
              {copy.openPatchReview}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copy.openDashboard}
            </Link>
          </div>
        </div>
        {payload.releaseItems.map((item) => (
          <ReleaseItemCard
            key={item.id}
            item={item}
            copy={copy}
            onProbe={probeReleaseItem}
            probing={probingId === item.id}
          />
        ))}
      </section>
    </AppShell>
  );
}
