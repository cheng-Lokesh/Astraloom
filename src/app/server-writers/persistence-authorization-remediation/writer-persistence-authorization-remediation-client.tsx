"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationRemediationCategory,
  WriterPersistenceAuthorizationRemediationItem,
  WriterPersistenceAuthorizationRemediationPayload,
  WriterPersistenceAuthorizationRemediationProbeResult,
  WriterPersistenceAuthorizationRemediationStatus,
} from "@/types/writer-persistence-authorization-remediation";

type WriterPersistenceAuthorizationRemediationClientPageProps = {
  payload: WriterPersistenceAuthorizationRemediationPayload;
};

const remediationCopy = {
  en: {
    title: "Persistence adapter implementation authorization remediation plan",
    badge: "Remediation plan only",
    body: "This page maps the current authorization no-go blockers to external remediation work. It remains read-only and does not accept remediation, record evidence, mark blockers resolved, or grant authorization.",
    notice:
      "Every probe is blocked by design. This plan cannot accept remediation, record remediation evidence, mark blockers resolved, create tickets, accept archives, mark archive completeness, create authorization records, accept no-go decisions, deny or grant implementation authorization, store approvals, enable feature flags, deploy code, run production writers, accept patches, create files, create tests, create branches, create privileged clients, run transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.",
    yes: "Yes",
    no: "No",
    mode: "Remediation mode",
    sourceMode: "Source no-go mode",
    checkedAt: "Checked at",
    remediationItems: "Remediation items",
    externalRequired: "External remediation items",
    manualReview: "Manual review items",
    externalActions: "External actions",
    safeEvidence: "Safe evidence requirements",
    verificationSteps: "Verification steps",
    acceptanceCriteria: "Acceptance criteria",
    residualRisks: "Residual risks",
    redaction: "Redaction rules",
    forbidden: "Forbidden actions",
    exitCriteria: "Exit criteria",
    sourceItems: "Source no-go items",
    sourceNoGoCount: "Source no-go count",
    sourceManual: "Source manual lanes",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    planReady: "Remediation plan ready",
    planOnly: "Remediation plan only",
    sourcePacketReady: "Source no-go packet ready",
    sourcePacketOnly: "Source no-go packet only",
    sourceBlocked: "Source release still blocked",
    sourceGranted: "Source implementation authorization granted",
    sourceNoGoAccepted: "Source no-go accepted",
    archiveAccepted: "External approval archive accepted",
    archiveComplete: "Archive completeness accepted",
    remediationAccepted: "Implementation remediation accepted",
    decisionReady: "Authorization decision ready",
    decisionRecorded: "Authorization decision recorded",
    noGoAccepted: "Authorization no-go accepted",
    authorizationDenied: "Implementation authorization denied",
    authorizationGranted: "Implementation authorization granted",
    authorized: "Implementation authorized",
    artifactStored: "Authorization artifact stored",
    branchReady: "Ready to create implementation branch",
    adapterReady: "Ready for adapter implementation",
    releaseReady: "Ready for release execution",
    adapterImplemented: "Adapter implemented",
    ownerComplete: "All owner approvals complete",
    evidenceReady: "All blocking evidence ready",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldAcceptArchive: "Would accept external archive",
    wouldCreateAuthorizationRecord: "Would create authorization record",
    wouldAcceptRemediation: "Would accept remediation plan",
    wouldRecordRemediation: "Would record remediation evidence",
    wouldResolveBlocker: "Would mark blocker resolved",
    wouldCreateTicket: "Would create remediation ticket",
    wouldRecordNoGo: "Would record no-go decision",
    wouldAcceptNoGo: "Would accept no-go decision",
    wouldDenyAuthorization: "Would deny implementation authorization",
    wouldGrantAuthorization: "Would grant implementation authorization",
    wouldCreateFiles: "Would create files",
    wouldModifyFiles: "Would modify files",
    wouldCreateBranch: "Would create branch",
    wouldCreateTestFiles: "Would create test files",
    wouldCreateAdapterCode: "Would create adapter code",
    wouldCreateServiceRoleClient: "Would create privileged client",
    wouldRunTransaction: "Would run transaction",
    wouldWriteRows: "Would write rows",
    wouldCreateMigrationFile: "Would create migration file",
    wouldCallAi: "Would call AI",
    wouldCallStripe: "Would call Stripe",
    wouldUnlockReports: "Would unlock reports",
    planRules: "Remediation plan rules",
    reconsiderationRules: "Reconsideration rules",
    blockedCodes: "Blocked codes",
    blockerSummary: "Blocker summary",
    remediationObjective: "Remediation objective",
    nonExecution: "Non-execution clauses",
    sourceRefs: "Source refs",
    sourceNoGoItems: "Source no-go items",
    nextReviewGate: "Next review gate",
    owner: "Owner",
    probeItem: "Probe item",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one remediation item to confirm this plan remains read-only and blocked.",
    openNoGo: "Open authorization no-go",
    openReadiness: "Open authorization readiness",
    openDashboard: "Back to dashboard",
    statusLabels: {
      external_remediation_required: "External remediation required",
      manual_review_required: "Manual review required",
    } satisfies Record<WriterPersistenceAuthorizationRemediationStatus, string>,
    categoryLabels: {
      source_invariant_remediation: "Source invariant remediation",
      archive_remediation: "Archive remediation",
      authority_remediation: "Authority remediation",
      owner_lane_remediation: "Owner lane remediation",
      security_data_remediation: "Security/data remediation",
      backend_schema_remediation: "Backend/schema remediation",
      qa_acceptance_remediation: "QA remediation",
      rollback_observability_remediation: "Rollback/observability remediation",
      implementation_scope_remediation: "Implementation scope remediation",
      final_reconsideration_remediation: "Final reconsideration remediation",
    } satisfies Record<WriterPersistenceAuthorizationRemediationCategory, string>,
  },
  zh: {
    title: "持久化适配器实现授权补救计划",
    badge: "仅补救计划",
    body: "这个页面把当前授权 no-go 阻断项映射为外部补救工作。它保持只读，不接受补救、不记录证据、不标记阻断已解决，也不授予授权。",
    notice:
      "所有探测都会按设计被阻断。本计划不能接受补救、记录补救证据、标记阻断已解决、创建工单、接受归档、标记归档完整、创建授权记录、接受 no-go 决策、拒绝或授予实现授权、存储批准、启用功能开关、部署代码、运行生产 writer、接受 patch、创建文件、创建测试、创建分支、创建特权客户端、运行事务、创建 migration、写入数据、调用 AI、调用 Stripe 或解锁报告。",
    yes: "是",
    no: "否",
    mode: "补救模式",
    sourceMode: "来源 no-go 模式",
    checkedAt: "检查时间",
    remediationItems: "补救项",
    externalRequired: "外部补救项",
    manualReview: "人工复核项",
    externalActions: "外部动作",
    safeEvidence: "安全证据要求",
    verificationSteps: "验证步骤",
    acceptanceCriteria: "验收条件",
    residualRisks: "残余风险",
    redaction: "脱敏规则",
    forbidden: "禁止动作",
    exitCriteria: "退出条件",
    sourceItems: "来源 no-go 项",
    sourceNoGoCount: "来源 no-go 数量",
    sourceManual: "来源人工通道",
    safetyState: "安全状态",
    safeMode: "安全模式",
    readOnly: "只读",
    planReady: "补救计划已就绪",
    planOnly: "仅补救计划",
    sourcePacketReady: "来源 no-go 决策包已就绪",
    sourcePacketOnly: "来源仅 no-go 决策包",
    sourceBlocked: "来源 release 仍阻断",
    sourceGranted: "来源实现授权已授予",
    sourceNoGoAccepted: "来源 no-go 已接受",
    archiveAccepted: "外部批准归档已接受",
    archiveComplete: "归档完整性已接受",
    remediationAccepted: "实现授权补救已接受",
    decisionReady: "授权决策已就绪",
    decisionRecorded: "授权决策已记录",
    noGoAccepted: "授权 no-go 已接受",
    authorizationDenied: "实现授权已拒绝",
    authorizationGranted: "实现授权已授予",
    authorized: "实现已授权",
    artifactStored: "授权产物已存储",
    branchReady: "可创建实现分支",
    adapterReady: "可实现适配器",
    releaseReady: "可执行 release",
    adapterImplemented: "适配器已实现",
    ownerComplete: "全部负责人批准已完成",
    evidenceReady: "全部阻断证据已就绪",
    allRuntimeBlocked: "全部运行时副作用已阻断",
    wouldAcceptArchive: "是否会接受外部归档",
    wouldCreateAuthorizationRecord: "是否会创建授权记录",
    wouldAcceptRemediation: "是否会接受补救计划",
    wouldRecordRemediation: "是否会记录补救证据",
    wouldResolveBlocker: "是否会标记阻断已解决",
    wouldCreateTicket: "是否会创建补救工单",
    wouldRecordNoGo: "是否会记录 no-go 决策",
    wouldAcceptNoGo: "是否会接受 no-go 决策",
    wouldDenyAuthorization: "是否会拒绝实现授权",
    wouldGrantAuthorization: "是否会授予实现授权",
    wouldCreateFiles: "是否会创建文件",
    wouldModifyFiles: "是否会修改文件",
    wouldCreateBranch: "是否会创建分支",
    wouldCreateTestFiles: "是否会创建测试文件",
    wouldCreateAdapterCode: "是否会创建适配器代码",
    wouldCreateServiceRoleClient: "是否会创建特权客户端",
    wouldRunTransaction: "是否会运行事务",
    wouldWriteRows: "是否会写入数据行",
    wouldCreateMigrationFile: "是否会创建 migration 文件",
    wouldCallAi: "是否会调用 AI",
    wouldCallStripe: "是否会调用 Stripe",
    wouldUnlockReports: "是否会解锁报告",
    planRules: "补救计划规则",
    reconsiderationRules: "重新审查规则",
    blockedCodes: "阻断代码",
    blockerSummary: "阻断摘要",
    remediationObjective: "补救目标",
    nonExecution: "不执行条款",
    sourceRefs: "来源引用",
    sourceNoGoItems: "来源 no-go 项",
    nextReviewGate: "下一审查关口",
    owner: "负责人",
    probeItem: "探测项目",
    probing: "探测中...",
    probeResult: "探测结果",
    noProbe: "探测一个补救项，确认这个计划仍然只读且被阻断。",
    openNoGo: "打开授权 No-go",
    openReadiness: "打开授权准备度",
    openDashboard: "返回工作台",
    statusLabels: {
      external_remediation_required: "需要外部补救",
      manual_review_required: "需要人工复核",
    } satisfies Record<WriterPersistenceAuthorizationRemediationStatus, string>,
    categoryLabels: {
      source_invariant_remediation: "来源不变式补救",
      archive_remediation: "归档补救",
      authority_remediation: "授权边界补救",
      owner_lane_remediation: "负责人通道补救",
      security_data_remediation: "安全/数据补救",
      backend_schema_remediation: "后端/schema 补救",
      qa_acceptance_remediation: "QA 补救",
      rollback_observability_remediation: "回滚/观测补救",
      implementation_scope_remediation: "实现范围补救",
      final_reconsideration_remediation: "最终重新审查补救",
    } satisfies Record<WriterPersistenceAuthorizationRemediationCategory, string>,
  },
} as const;

type RemediationCopy = (typeof remediationCopy)[keyof typeof remediationCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: RemediationCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function statusTone(status: WriterPersistenceAuthorizationRemediationStatus) {
  return status === "external_remediation_required" ? "blocked" : "planned";
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

function RemediationItemCard({
  item,
  copy,
  onProbe,
  probing,
}: {
  item: WriterPersistenceAuthorizationRemediationItem;
  copy: RemediationCopy;
  onProbe: (item: WriterPersistenceAuthorizationRemediationItem) => void;
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
          <p className="mt-2 text-sm leading-6 text-emerald-800">
            <span className="font-semibold">
              {copy.remediationObjective}:{" "}
            </span>
            {item.remediationObjective}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onProbe(item)}
          disabled={probing}
          className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {probing ? copy.probing : copy.probeItem}
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.externalActions}
          </h3>
          <TextList items={item.externalActions} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.safeEvidence}
          </h3>
          <TextList items={item.safeEvidenceRequirements} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.verificationSteps}
          </h3>
          <TextList items={item.verificationSteps} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.acceptanceCriteria}
          </h3>
          <TextList items={item.acceptanceCriteria} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.residualRisks}
          </h3>
          <TextList items={item.residualRisks} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.redaction}
          </h3>
          <TextList items={item.redactionRules} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.forbidden}
          </h3>
          <TextList items={item.forbiddenActions} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.nonExecution}
          </h3>
          <TextList items={item.nonExecutionClauses} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.exitCriteria}
          </h3>
          <TextList items={item.exitCriteria} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.sourceNoGoItems}
          </h3>
          <TextList items={item.sourceNoGoItemIds} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.sourceRefs}
          </h3>
          <TextList items={item.sourceRefs} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.nextReviewGate}
          </h3>
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {item.nextReviewGate}
          </p>
        </div>
      </div>
    </article>
  );
}

export function WriterPersistenceAuthorizationRemediationClientPage({
  payload,
}: WriterPersistenceAuthorizationRemediationClientPageProps) {
  const { locale } = useLanguage();
  const copy = remediationCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationRemediationProbeResult | null>(null);
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags = [
    { value: payload.safeMode, label: copy.safeMode },
    { value: payload.readOnly, label: copy.readOnly },
    { value: payload.remediationPlanReady, label: copy.planReady },
    { value: payload.remediationPlanOnly, label: copy.planOnly },
    {
      value: payload.sourceAuthorizationNoGoPacketReady,
      label: copy.sourcePacketReady,
    },
    {
      value: payload.sourceAuthorizationNoGoPacketOnly,
      label: copy.sourcePacketOnly,
    },
    { value: payload.sourceReleaseStillBlocked, label: copy.sourceBlocked },
    { value: payload.allRuntimeEffectsBlocked, label: copy.allRuntimeBlocked },
  ];

  const falseFlags = [
    {
      value: payload.sourceImplementationAuthorizationGranted,
      label: copy.sourceGranted,
    },
    {
      value: payload.sourceImplementationAuthorizationNoGoAccepted,
      label: copy.sourceNoGoAccepted,
    },
    {
      value: payload.externalApprovalArchiveAccepted,
      label: copy.archiveAccepted,
    },
    { value: payload.archiveCompletenessAccepted, label: copy.archiveComplete },
    {
      value: payload.implementationAuthorizationRemediationAccepted,
      label: copy.remediationAccepted,
    },
    {
      value: payload.implementationAuthorizationDecisionReady,
      label: copy.decisionReady,
    },
    {
      value: payload.implementationAuthorizationDecisionRecorded,
      label: copy.decisionRecorded,
    },
    {
      value: payload.implementationAuthorizationNoGoAccepted,
      label: copy.noGoAccepted,
    },
    {
      value: payload.implementationAuthorizationDenied,
      label: copy.authorizationDenied,
    },
    {
      value: payload.implementationAuthorizationGranted,
      label: copy.authorizationGranted,
    },
    { value: payload.implementationAuthorized, label: copy.authorized },
    { value: payload.authorizationArtifactStored, label: copy.artifactStored },
    {
      value: payload.readyToCreateImplementationBranch,
      label: copy.branchReady,
    },
    { value: payload.readyForAdapterImplementation, label: copy.adapterReady },
    { value: payload.readyForReleaseExecution, label: copy.releaseReady },
    { value: payload.adapterImplemented, label: copy.adapterImplemented },
    { value: payload.allOwnerApprovalsComplete, label: copy.ownerComplete },
    { value: payload.allBlockingEvidenceReady, label: copy.evidenceReady },
    {
      value: payload.wouldAcceptExternalApprovalArchive,
      label: copy.wouldAcceptArchive,
    },
    {
      value: payload.wouldCreateAuthorizationRecord,
      label: copy.wouldCreateAuthorizationRecord,
    },
    {
      value: payload.wouldAcceptRemediationPlan,
      label: copy.wouldAcceptRemediation,
    },
    {
      value: payload.wouldRecordRemediationEvidence,
      label: copy.wouldRecordRemediation,
    },
    {
      value: payload.wouldMarkBlockerResolved,
      label: copy.wouldResolveBlocker,
    },
    {
      value: payload.wouldCreateRemediationTicket,
      label: copy.wouldCreateTicket,
    },
    {
      value: payload.wouldRecordAuthorizationNoGoDecision,
      label: copy.wouldRecordNoGo,
    },
    {
      value: payload.wouldAcceptAuthorizationNoGoDecision,
      label: copy.wouldAcceptNoGo,
    },
    {
      value: payload.wouldDenyImplementationAuthorization,
      label: copy.wouldDenyAuthorization,
    },
    {
      value: payload.wouldGrantImplementationAuthorization,
      label: copy.wouldGrantAuthorization,
    },
    { value: payload.wouldCreateFiles, label: copy.wouldCreateFiles },
    { value: payload.wouldModifyFiles, label: copy.wouldModifyFiles },
    { value: payload.wouldCreateBranch, label: copy.wouldCreateBranch },
    { value: payload.wouldCreateTestFiles, label: copy.wouldCreateTestFiles },
    { value: payload.wouldCreateAdapterCode, label: copy.wouldCreateAdapterCode },
    {
      value: payload.wouldCreateServiceRoleClient,
      label: copy.wouldCreateServiceRoleClient,
    },
    { value: payload.wouldRunTransaction, label: copy.wouldRunTransaction },
    { value: payload.wouldWriteRows, label: copy.wouldWriteRows },
    {
      value: payload.wouldCreateMigrationFile,
      label: copy.wouldCreateMigrationFile,
    },
    { value: payload.wouldCallAi, label: copy.wouldCallAi },
    { value: payload.wouldCallStripe, label: copy.wouldCallStripe },
    { value: payload.wouldUnlockReports, label: copy.wouldUnlockReports },
  ];

  async function probeRemediationItem(
    item: WriterPersistenceAuthorizationRemediationItem,
  ) {
    setProbingId(item.id);
    setProbeResult(null);

    try {
      const response = await fetch(
        "/api/system-writers/persistence-authorization-remediation",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ itemId: item.id }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceAuthorizationRemediationProbeResult;
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

      <section className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
        {copy.notice}
      </section>

      <section className="mb-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat label={copy.mode} value={payload.remediationPlanMode} />
        <Stat label={copy.sourceMode} value={payload.sourceAuthorizationNoGoMode} />
        <Stat label={copy.checkedAt} value={payload.checkedAt} />
        <Stat label={copy.remediationItems} value={payload.remediationItemCount} />
        <Stat
          label={copy.externalRequired}
          value={payload.externalRemediationRequiredCount}
        />
        <Stat
          label={copy.manualReview}
          value={payload.manualReviewRequiredCount}
        />
        <Stat
          label={copy.externalActions}
          value={payload.externalActionCount}
        />
        <Stat
          label={copy.safeEvidence}
          value={payload.safeEvidenceRequirementCount}
        />
        <Stat
          label={copy.verificationSteps}
          value={payload.verificationStepCount}
        />
        <Stat
          label={copy.acceptanceCriteria}
          value={payload.acceptanceCriteriaCount}
        />
        <Stat label={copy.residualRisks} value={payload.residualRiskCount} />
        <Stat label={copy.redaction} value={payload.redactionRuleCount} />
        <Stat label={copy.forbidden} value={payload.forbiddenActionCount} />
        <Stat label={copy.exitCriteria} value={payload.exitCriteriaCount} />
        <Stat
          label={copy.sourceItems}
          value={payload.sourceDecisionItemCount}
        />
        <Stat label={copy.sourceNoGoCount} value={payload.sourceNoGoCount} />
        <Stat
          label={copy.sourceManual}
          value={payload.sourceManualReviewRequiredCount}
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
            {copy.planRules}
          </h2>
          <div className="mt-3">
            <TextList items={payload.remediationPlanRules} />
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.reconsiderationRules}
          </h2>
          <div className="mt-3">
            <TextList items={payload.reconsiderationRules} />
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
              {copy.mode}: {probeResult.remediationPlanMode}
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
            {copy.remediationItems}
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/server-writers/persistence-authorization-no-go"
              className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
            >
              {copy.openNoGo}
            </Link>
            <Link
              href="/server-writers/persistence-authorization-readiness"
              className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
            >
              {copy.openReadiness}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copy.openDashboard}
            </Link>
          </div>
        </div>
        {payload.remediationItems.map((item) => (
          <RemediationItemCard
            key={item.id}
            item={item}
            copy={copy}
            onProbe={probeRemediationItem}
            probing={probingId === item.id}
          />
        ))}
      </section>
    </AppShell>
  );
}
