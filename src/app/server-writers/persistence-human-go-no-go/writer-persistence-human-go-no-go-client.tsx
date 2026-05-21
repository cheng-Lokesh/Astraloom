"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceHumanGoNoGoCategory,
  WriterPersistenceHumanGoNoGoPayload,
  WriterPersistenceHumanGoNoGoProbeResult,
  WriterPersistenceHumanGoNoGoStatus,
  WriterPersistenceHumanGoNoGoStep,
} from "@/types/writer-persistence-human-go-no-go";

type WriterPersistenceHumanGoNoGoClientPageProps = {
  payload: WriterPersistenceHumanGoNoGoPayload;
};

const humanGoNoGoCopy = {
  en: {
    title: "Persistence adapter human go/no-go runbook",
    badge: "Runbook only",
    body: "This page translates the release no-go packet into a human decision runbook. It remains read-only: decisions must be made and archived outside the app until a separate persistence model is approved.",
    notice:
      "Every probe is blocked by design. This runbook cannot record human decisions, accept approvals, store decision artifacts, enable feature flags, deploy code, approve or run production writers, collect signatures, accept patches, create files, create tests, create branches, create privileged clients, run transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.",
    safetyState: "Safety state",
    mode: "Runbook mode",
    sourceMode: "Source no-go mode",
    checkedAt: "Checked at",
    steps: "Runbook steps",
    blockedByRelease: "Blocked by release no-go",
    manualRequired: "Manual required",
    requiredEvidence: "Required evidence",
    externalRules: "External artifact rules",
    goCriteria: "Go criteria",
    noGoCriteria: "No-go criteria",
    forbiddenActions: "Forbidden actions",
    sourceReleaseItems: "Source release items",
    sourceReleaseBlockers: "Source release blockers",
    yes: "Yes",
    no: "No",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    runbookReady: "Runbook ready",
    runbookOnly: "Runbook only",
    sourceReady: "Source release no-go ready",
    sourceOnly: "Source release no-go only",
    sourceBlocked: "Source release blocked",
    stillBlocked: "Release still blocked",
    externalCollection: "Human decision collection external",
    externalArchive: "External archive required",
    allRuntimeBlocked: "All runtime effects blocked",
    humanDecisionRecorded: "Human decision recorded",
    humanDecisionAccepted: "Human decision accepted",
    releaseNoGoAccepted: "Release no-go accepted",
    goRecorded: "Go decision recorded",
    releaseApproved: "Release approved",
    releaseApprovalGranted: "Release approval granted",
    featureFlagEnabled: "Feature flag enabled",
    deploymentApproved: "Deployment approved",
    productionWriterApproved: "Production writer approved",
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
    reviewComplete: "Implementation review complete",
    allOwnerApprovalsComplete: "All owner approvals complete",
    allBlockingEvidenceReady: "All blocking evidence ready",
    wouldRecordHumanDecision: "Would record human decision",
    wouldAcceptHumanDecision: "Would accept human decision",
    wouldStoreDecisionArtifact: "Would store decision artifact",
    wouldAcceptReleaseNoGo: "Would accept release no-go",
    wouldRecordGoDecision: "Would record go decision",
    wouldGrantReleaseApproval: "Would grant release approval",
    wouldEnableFeatureFlag: "Would enable feature flag",
    wouldDeployCode: "Would deploy code",
    wouldRunProductionWriter: "Would run production writer",
    wouldCollectSignature: "Would collect signature",
    wouldRecordOwnerApproval: "Would record owner approval",
    wouldAcceptPatchReview: "Would accept patch review",
    wouldGeneratePatch: "Would generate patch",
    wouldApplyPatch: "Would apply patch",
    wouldCreateFiles: "Would create files",
    wouldModifyFiles: "Would modify files",
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
    runbookRules: "Runbook rules",
    externalDecisionRules: "External decision artifact rules",
    blockedCodes: "Blocked codes",
    sourceBlockedCodes: "Source blocked codes",
    decisionQuestion: "Decision question",
    nonExecutionClauses: "Non-execution clauses",
    futureArtifacts: "Future external artifacts",
    sourceRefs: "Source refs",
    owner: "Owner",
    probeStep: "Probe step",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one runbook step to confirm this page remains read-only and blocked.",
    openReleaseNoGo: "Open release no-go",
    openOwnerSignoff: "Open owner signoff",
    openDashboard: "Back to dashboard",
    statusLabels: {
      blocked_by_release_no_go: "Blocked by release no-go",
      manual_required: "Manual required",
    } satisfies Record<WriterPersistenceHumanGoNoGoStatus, string>,
    categoryLabels: {
      source_release_no_go_invariant: "Source no-go invariant",
      founder_scope_decision: "Founder scope",
      security_decision: "Security",
      backend_decision: "Backend",
      qa_decision: "QA",
      migration_decision: "Migration",
      operator_decision: "Operator",
      data_protection_decision: "Data protection",
      product_scope_decision: "Product scope",
      final_hard_stop: "Final hard stop",
    } satisfies Record<WriterPersistenceHumanGoNoGoCategory, string>,
  },
  zh: {
    title: "持久化适配器人工 go/no-go 运行手册",
    badge: "仅运行手册",
    body: "这个页面把 release no-go 包翻译成人工决策运行手册。它仍然只读：在单独的持久化模型被批准前，所有决策都必须在应用外完成并归档。",
    notice:
      "所有探测都会按设计被阻断。这个运行手册不能记录人工决策、接受批准、存储决策产物、启用功能开关、部署代码、批准或运行生产 writer、收集签名、接受 patch、创建文件、创建测试、创建分支、创建特权客户端、运行事务、创建 migration、写入数据、调用 AI、调用 Stripe 或解锁报告。",
    safetyState: "安全状态",
    mode: "运行手册模式",
    sourceMode: "来源 no-go 模式",
    checkedAt: "检查时间",
    steps: "运行手册步骤",
    blockedByRelease: "被 release no-go 阻断",
    manualRequired: "需要人工判断",
    requiredEvidence: "必要证据",
    externalRules: "外部产物规则",
    goCriteria: "Go 条件",
    noGoCriteria: "No-go 条件",
    forbiddenActions: "禁止动作",
    sourceReleaseItems: "来源 release 项",
    sourceReleaseBlockers: "来源 release 阻断项",
    yes: "是",
    no: "否",
    safeMode: "安全模式",
    readOnly: "只读",
    runbookReady: "运行手册已就绪",
    runbookOnly: "仅运行手册",
    sourceReady: "来源 release no-go 已就绪",
    sourceOnly: "来源仅 release no-go 包",
    sourceBlocked: "来源 release 已阻断",
    stillBlocked: "release 仍阻断",
    externalCollection: "人工决策在应用外收集",
    externalArchive: "需要外部归档",
    allRuntimeBlocked: "全部运行时副作用已阻断",
    humanDecisionRecorded: "人工决策已记录",
    humanDecisionAccepted: "人工决策已接受",
    releaseNoGoAccepted: "Release no-go 已接受",
    goRecorded: "Go 决策已记录",
    releaseApproved: "Release 已批准",
    releaseApprovalGranted: "Release 批准已授予",
    featureFlagEnabled: "功能开关已启用",
    deploymentApproved: "部署已批准",
    productionWriterApproved: "生产 writer 已批准",
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
    branchCreationApproved: "分支创建已批准",
    branchCreated: "分支已创建",
    pullRequestCreated: "PR 已创建",
    planApproved: "实现计划已批准",
    readyToApplyPatch: "可应用 patch",
    readyToCreateBranch: "可创建分支",
    readyForAdapter: "可实现适配器",
    readyForRelease: "可执行 release",
    schemaVerified: "Schema 已验证",
    adapterImplemented: "适配器已实现",
    adapterApproved: "适配器实现已批准",
    adapterAllowed: "适配器实现已允许",
    reviewComplete: "实现审查已完成",
    allOwnerApprovalsComplete: "全部负责人批准完成",
    allBlockingEvidenceReady: "全部阻断证据就绪",
    wouldRecordHumanDecision: "是否会记录人工决策",
    wouldAcceptHumanDecision: "是否会接受人工决策",
    wouldStoreDecisionArtifact: "是否会存储决策产物",
    wouldAcceptReleaseNoGo: "是否会接受 release no-go",
    wouldRecordGoDecision: "是否会记录 go 决策",
    wouldGrantReleaseApproval: "是否会授予 release 批准",
    wouldEnableFeatureFlag: "是否会启用功能开关",
    wouldDeployCode: "是否会部署代码",
    wouldRunProductionWriter: "是否会运行生产 writer",
    wouldCollectSignature: "是否会收集签名",
    wouldRecordOwnerApproval: "是否会记录负责人批准",
    wouldAcceptPatchReview: "是否会接受 patch review",
    wouldGeneratePatch: "是否会生成 patch",
    wouldApplyPatch: "是否会应用 patch",
    wouldCreateFiles: "是否会创建文件",
    wouldModifyFiles: "是否会修改文件",
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
    runbookRules: "运行手册规则",
    externalDecisionRules: "外部决策产物规则",
    blockedCodes: "阻断代码",
    sourceBlockedCodes: "来源阻断代码",
    decisionQuestion: "决策问题",
    nonExecutionClauses: "不执行条款",
    futureArtifacts: "未来外部产物",
    sourceRefs: "来源引用",
    owner: "负责人",
    probeStep: "探测步骤",
    probing: "探测中...",
    probeResult: "探测结果",
    noProbe: "探测一个运行手册步骤，确认这个页面仍然只读且被阻断。",
    openReleaseNoGo: "打开 release no-go",
    openOwnerSignoff: "打开负责人签核",
    openDashboard: "返回工作台",
    statusLabels: {
      blocked_by_release_no_go: "被 release no-go 阻断",
      manual_required: "需要人工判断",
    } satisfies Record<WriterPersistenceHumanGoNoGoStatus, string>,
    categoryLabels: {
      source_release_no_go_invariant: "来源 no-go 不变式",
      founder_scope_decision: "创始人范围",
      security_decision: "安全",
      backend_decision: "后端",
      qa_decision: "QA",
      migration_decision: "Migration",
      operator_decision: "运营",
      data_protection_decision: "数据保护",
      product_scope_decision: "产品范围",
      final_hard_stop: "最终硬阻断",
    } satisfies Record<WriterPersistenceHumanGoNoGoCategory, string>,
  },
} as const;

type HumanGoNoGoCopy = (typeof humanGoNoGoCopy)[keyof typeof humanGoNoGoCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: HumanGoNoGoCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function statusTone(status: WriterPersistenceHumanGoNoGoStatus) {
  return status === "manual_required" ? "planned" : "blocked";
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

function RunbookStepCard({
  step,
  copy,
  onProbe,
  probing,
}: {
  step: WriterPersistenceHumanGoNoGoStep;
  copy: HumanGoNoGoCopy;
  onProbe: (step: WriterPersistenceHumanGoNoGoStep) => void;
  probing: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={statusTone(step.status)}>
              {copy.statusLabels[step.status]}
            </StatusPill>
            <StatusPill>{copy.categoryLabels[step.category]}</StatusPill>
            <StatusPill>
              {copy.owner}: {step.owner}
            </StatusPill>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-slate-950">
            {step.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {step.intent}
          </p>
          <p className="mt-3 text-sm leading-6 text-rose-800">
            <span className="font-semibold">{copy.decisionQuestion}: </span>
            {step.decisionQuestion}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onProbe(step)}
          disabled={probing}
          className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {probing ? copy.probing : copy.probeStep}
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.requiredEvidence}
          </h3>
          <TextList items={step.requiredEvidence} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.externalRules}
          </h3>
          <TextList items={step.externalArtifactRules} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.goCriteria}
          </h3>
          <TextList items={step.goCriteria} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.noGoCriteria}
          </h3>
          <TextList items={step.noGoCriteria} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.forbiddenActions}
          </h3>
          <TextList items={step.forbiddenActions} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.nonExecutionClauses}
          </h3>
          <TextList items={step.nonExecutionClauses} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.futureArtifacts}
          </h3>
          <TextList items={step.futureArtifacts} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.sourceRefs}
          </h3>
          <TextList items={step.sourceRefs} />
        </div>
      </div>
    </article>
  );
}

export function WriterPersistenceHumanGoNoGoClientPage({
  payload,
}: WriterPersistenceHumanGoNoGoClientPageProps) {
  const { locale } = useLanguage();
  const copy = humanGoNoGoCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceHumanGoNoGoProbeResult | null>(null);
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags = [
    { value: payload.safeMode, label: copy.safeMode },
    { value: payload.readOnly, label: copy.readOnly },
    { value: payload.humanGoNoGoRunbookReady, label: copy.runbookReady },
    { value: payload.humanGoNoGoRunbookOnly, label: copy.runbookOnly },
    { value: payload.sourceReleaseNoGoPacketReady, label: copy.sourceReady },
    { value: payload.sourceReleaseNoGoPacketOnly, label: copy.sourceOnly },
    { value: payload.sourceReleaseBlocked, label: copy.sourceBlocked },
    { value: payload.releaseStillBlocked, label: copy.stillBlocked },
    {
      value: payload.humanDecisionCollectionExternal,
      label: copy.externalCollection,
    },
    { value: payload.externalArtifactArchiveRequired, label: copy.externalArchive },
    { value: payload.allRuntimeEffectsBlocked, label: copy.allRuntimeBlocked },
  ];

  const falseFlags = [
    { value: payload.humanDecisionRecorded, label: copy.humanDecisionRecorded },
    { value: payload.humanDecisionAccepted, label: copy.humanDecisionAccepted },
    { value: payload.releaseNoGoAccepted, label: copy.releaseNoGoAccepted },
    { value: payload.releaseGoDecisionRecorded, label: copy.goRecorded },
    { value: payload.releaseApproved, label: copy.releaseApproved },
    {
      value: payload.releaseApprovalGranted,
      label: copy.releaseApprovalGranted,
    },
    { value: payload.featureFlagEnabled, label: copy.featureFlagEnabled },
    { value: payload.deploymentApproved, label: copy.deploymentApproved },
    {
      value: payload.productionWriterApproved,
      label: copy.productionWriterApproved,
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
    { value: payload.implementationReviewComplete, label: copy.reviewComplete },
    {
      value: payload.allOwnerApprovalsComplete,
      label: copy.allOwnerApprovalsComplete,
    },
    {
      value: payload.allBlockingEvidenceReady,
      label: copy.allBlockingEvidenceReady,
    },
    {
      value: payload.wouldRecordHumanDecision,
      label: copy.wouldRecordHumanDecision,
    },
    {
      value: payload.wouldAcceptHumanDecision,
      label: copy.wouldAcceptHumanDecision,
    },
    {
      value: payload.wouldStoreDecisionArtifact,
      label: copy.wouldStoreDecisionArtifact,
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
      value: payload.wouldAcceptPatchReview,
      label: copy.wouldAcceptPatchReview,
    },
    { value: payload.wouldGeneratePatch, label: copy.wouldGeneratePatch },
    { value: payload.wouldApplyPatch, label: copy.wouldApplyPatch },
    { value: payload.wouldCreateFiles, label: copy.wouldCreateFiles },
    { value: payload.wouldModifyFiles, label: copy.wouldModifyFiles },
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

  async function probeRunbookStep(step: WriterPersistenceHumanGoNoGoStep) {
    setProbingId(step.id);
    setProbeResult(null);

    try {
      const response = await fetch(
        "/api/system-writers/persistence-human-go-no-go",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ stepId: step.id }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceHumanGoNoGoProbeResult;
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
        <Stat label={copy.mode} value={payload.humanGoNoGoMode} />
        <Stat label={copy.sourceMode} value={payload.sourceReleaseNoGoMode} />
        <Stat label={copy.checkedAt} value={payload.checkedAt} />
        <Stat label={copy.steps} value={payload.runbookStepCount} />
        <Stat
          label={copy.blockedByRelease}
          value={payload.blockedByReleaseNoGoCount}
        />
        <Stat label={copy.manualRequired} value={payload.manualRequiredCount} />
        <Stat
          label={copy.requiredEvidence}
          value={payload.requiredEvidenceCount}
        />
        <Stat
          label={copy.externalRules}
          value={payload.externalArtifactRuleCount}
        />
        <Stat label={copy.goCriteria} value={payload.goCriteriaCount} />
        <Stat label={copy.noGoCriteria} value={payload.noGoCriteriaCount} />
        <Stat
          label={copy.forbiddenActions}
          value={payload.forbiddenActionCount}
        />
        <Stat
          label={copy.sourceReleaseItems}
          value={payload.sourceReleaseItemCount}
        />
        <Stat
          label={copy.sourceReleaseBlockers}
          value={payload.sourceReleaseBlockerCount}
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
            {copy.runbookRules}
          </h2>
          <div className="mt-3">
            <TextList items={payload.runbookRules} />
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.externalDecisionRules}
          </h2>
          <div className="mt-3">
            <TextList items={payload.externalDecisionArtifactRules} />
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
              {copy.mode}: {probeResult.humanGoNoGoMode}
            </StatusPill>
            {probeResult.stepId ? (
              <StatusPill>stepId: {probeResult.stepId}</StatusPill>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="mb-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.steps}
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/server-writers/persistence-release-no-go"
              className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
            >
              {copy.openReleaseNoGo}
            </Link>
            <Link
              href="/server-writers/persistence-owner-signoff"
              className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              {copy.openOwnerSignoff}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copy.openDashboard}
            </Link>
          </div>
        </div>
        {payload.runbookSteps.map((step) => (
          <RunbookStepCard
            key={step.id}
            step={step}
            copy={copy}
            onProbe={probeRunbookStep}
            probing={probingId === step.id}
          />
        ))}
      </section>
    </AppShell>
  );
}
