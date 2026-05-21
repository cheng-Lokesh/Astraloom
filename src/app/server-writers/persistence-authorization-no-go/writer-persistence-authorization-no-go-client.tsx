"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationNoGoCategory,
  WriterPersistenceAuthorizationNoGoItem,
  WriterPersistenceAuthorizationNoGoPayload,
  WriterPersistenceAuthorizationNoGoProbeResult,
  WriterPersistenceAuthorizationNoGoStatus,
} from "@/types/writer-persistence-authorization-no-go";

type WriterPersistenceAuthorizationNoGoClientPageProps = {
  payload: WriterPersistenceAuthorizationNoGoPayload;
};

const noGoCopy = {
  en: {
    title: "Persistence adapter implementation authorization no-go decision packet",
    badge: "No-go packet only",
    body: "This page summarizes why implementation authorization is currently a no-go. It remains read-only and does not record, accept, deny, or grant an authorization decision.",
    notice:
      "Every probe is blocked by design. This packet cannot accept archives, mark archive completeness, create authorization records, accept no-go decisions, deny or grant implementation authorization, store approvals, enable feature flags, deploy code, run production writers, accept patches, create files, create tests, create branches, create privileged clients, run transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.",
    yes: "Yes",
    no: "No",
    mode: "No-go mode",
    sourceMode: "Source readiness mode",
    checkedAt: "Checked at",
    decisionItems: "Decision items",
    noGoCount: "No-go items",
    manualReview: "Manual review items",
    requiredEvidence: "Required evidence",
    blockers: "Unresolved blockers",
    criteria: "Decision criteria",
    manualSteps: "Manual review steps",
    redaction: "Redaction rules",
    forbidden: "Forbidden actions",
    remediation: "Remediation actions",
    sourceItems: "Source readiness items",
    sourceManual: "Source manual lanes",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    packetReady: "No-go packet ready",
    packetOnly: "No-go packet only",
    sourceReady: "Source readiness ready",
    sourceOnly: "Source readiness only",
    sourceBlocked: "Source release still blocked",
    sourceAuthorizationReady: "Source implementation authorization ready",
    sourceArchiveAccepted: "Source external archive accepted",
    archiveAccepted: "External approval archive accepted",
    archiveComplete: "Archive completeness accepted",
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
    noGoRules: "No-go packet rules",
    remediationRules: "Remediation rules",
    blockedCodes: "Blocked codes",
    decisionQuestion: "Decision question",
    noGoReason: "No-go reason",
    nonExecution: "Non-execution clauses",
    sourceRefs: "Source refs",
    sourceReadinessItems: "Source readiness items",
    owner: "Owner",
    probeItem: "Probe item",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one no-go item to confirm this packet remains read-only and blocked.",
    openReadiness: "Open authorization readiness",
    openArchive: "Open approval archive",
    openDashboard: "Back to dashboard",
    statusLabels: {
      no_go: "No-go",
      manual_review_required: "Manual review required",
    } satisfies Record<WriterPersistenceAuthorizationNoGoStatus, string>,
    categoryLabels: {
      source_readiness_invariant: "Source readiness invariant",
      archive_acceptance_no_go: "Archive acceptance no-go",
      authority_no_go: "Authority no-go",
      owner_lane_no_go: "Owner lane no-go",
      security_no_go: "Security no-go",
      backend_schema_no_go: "Backend/schema no-go",
      qa_acceptance_no_go: "QA no-go",
      rollback_observability_no_go: "Rollback/observability no-go",
      implementation_scope_no_go: "Implementation scope no-go",
      final_authorization_no_go: "Final authorization no-go",
    } satisfies Record<WriterPersistenceAuthorizationNoGoCategory, string>,
  },
  zh: {
    title: "持久化适配器实现授权 no-go 决策包",
    badge: "仅 no-go 决策包",
    body: "这个页面总结为什么当前不能授予实现授权。它仍然只读，不记录、不接受、不拒绝、也不授予任何授权决策。",
    notice:
      "所有探测都会按设计被阻断。这个决策包不能接受归档、标记归档完整、创建授权记录、接受 no-go 决策、拒绝或授予实现授权、存储批准、启用功能开关、部署代码、运行生产 writer、接受 patch、创建文件、创建测试、创建分支、创建特权客户端、运行事务、创建 migration、写入数据、调用 AI、调用 Stripe 或解锁报告。",
    yes: "是",
    no: "否",
    mode: "No-go 模式",
    sourceMode: "来源准备度模式",
    checkedAt: "检查时间",
    decisionItems: "决策项目",
    noGoCount: "No-go 项",
    manualReview: "人工审查项",
    requiredEvidence: "所需证据",
    blockers: "未解决阻断项",
    criteria: "决策条件",
    manualSteps: "人工审查步骤",
    redaction: "脱敏规则",
    forbidden: "禁止动作",
    remediation: "补救动作",
    sourceItems: "来源准备度项目",
    sourceManual: "来源人工通道",
    safetyState: "安全状态",
    safeMode: "安全模式",
    readOnly: "只读",
    packetReady: "No-go 决策包已就绪",
    packetOnly: "仅 no-go 决策包",
    sourceReady: "来源准备度已就绪",
    sourceOnly: "来源仅准备度",
    sourceBlocked: "来源 release 仍阻断",
    sourceAuthorizationReady: "来源实现授权已就绪",
    sourceArchiveAccepted: "来源外部归档已接受",
    archiveAccepted: "外部批准归档已接受",
    archiveComplete: "归档完整性已接受",
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
    ownerComplete: "全部负责人批准完成",
    evidenceReady: "全部阻断证据已就绪",
    allRuntimeBlocked: "全部运行时副作用已阻断",
    wouldAcceptArchive: "是否会接受外部归档",
    wouldCreateAuthorizationRecord: "是否会创建授权记录",
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
    noGoRules: "No-go 决策包规则",
    remediationRules: "补救规则",
    blockedCodes: "阻断代码",
    decisionQuestion: "决策问题",
    noGoReason: "No-go 原因",
    nonExecution: "不执行条款",
    sourceRefs: "来源引用",
    sourceReadinessItems: "来源准备度项目",
    owner: "负责人",
    probeItem: "探测项目",
    probing: "探测中...",
    probeResult: "探测结果",
    noProbe: "探测一个 no-go 项目，确认这个决策包仍然只读且被阻断。",
    openReadiness: "打开授权准备度",
    openArchive: "打开批准归档",
    openDashboard: "返回工作台",
    statusLabels: {
      no_go: "No-go",
      manual_review_required: "需要人工审查",
    } satisfies Record<WriterPersistenceAuthorizationNoGoStatus, string>,
    categoryLabels: {
      source_readiness_invariant: "来源准备度不变式",
      archive_acceptance_no_go: "归档接受 no-go",
      authority_no_go: "授权边界 no-go",
      owner_lane_no_go: "负责人通道 no-go",
      security_no_go: "安全 no-go",
      backend_schema_no_go: "后端/schema no-go",
      qa_acceptance_no_go: "QA no-go",
      rollback_observability_no_go: "回滚/观测 no-go",
      implementation_scope_no_go: "实现范围 no-go",
      final_authorization_no_go: "最终授权 no-go",
    } satisfies Record<WriterPersistenceAuthorizationNoGoCategory, string>,
  },
} as const;

type NoGoCopy = (typeof noGoCopy)[keyof typeof noGoCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: NoGoCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function statusTone(status: WriterPersistenceAuthorizationNoGoStatus) {
  return status === "no_go" ? "blocked" : "planned";
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

function DecisionItemCard({
  item,
  copy,
  onProbe,
  probing,
}: {
  item: WriterPersistenceAuthorizationNoGoItem;
  copy: NoGoCopy;
  onProbe: (item: WriterPersistenceAuthorizationNoGoItem) => void;
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
            <span className="font-semibold">{copy.decisionQuestion}: </span>
            {item.decisionQuestion}
          </p>
          <p className="mt-2 text-sm leading-6 text-rose-900">
            <span className="font-semibold">{copy.noGoReason}: </span>
            {item.noGoReason}
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
            {copy.blockers}
          </h3>
          <TextList items={item.unresolvedBlockers} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.criteria}
          </h3>
          <TextList items={item.decisionCriteria} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.manualSteps}
          </h3>
          <TextList items={item.manualReviewSteps} />
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
            {copy.remediation}
          </h3>
          <TextList items={item.remediationActions} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.sourceReadinessItems}
          </h3>
          <TextList items={item.sourceReadinessItemIds} />
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

export function WriterPersistenceAuthorizationNoGoClientPage({
  payload,
}: WriterPersistenceAuthorizationNoGoClientPageProps) {
  const { locale } = useLanguage();
  const copy = noGoCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationNoGoProbeResult | null>(null);
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags = [
    { value: payload.safeMode, label: copy.safeMode },
    { value: payload.readOnly, label: copy.readOnly },
    { value: payload.authorizationNoGoPacketReady, label: copy.packetReady },
    { value: payload.authorizationNoGoPacketOnly, label: copy.packetOnly },
    { value: payload.sourceAuthorizationReadinessReady, label: copy.sourceReady },
    { value: payload.sourceAuthorizationReadinessOnly, label: copy.sourceOnly },
    { value: payload.sourceReleaseStillBlocked, label: copy.sourceBlocked },
    { value: payload.allRuntimeEffectsBlocked, label: copy.allRuntimeBlocked },
  ];

  const falseFlags = [
    {
      value: payload.sourceImplementationAuthorizationReady,
      label: copy.sourceAuthorizationReady,
    },
    {
      value: payload.sourceExternalApprovalArchiveAccepted,
      label: copy.sourceArchiveAccepted,
    },
    {
      value: payload.externalApprovalArchiveAccepted,
      label: copy.archiveAccepted,
    },
    { value: payload.archiveCompletenessAccepted, label: copy.archiveComplete },
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

  async function probeDecisionItem(item: WriterPersistenceAuthorizationNoGoItem) {
    setProbingId(item.id);
    setProbeResult(null);

    try {
      const response = await fetch(
        "/api/system-writers/persistence-authorization-no-go",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ itemId: item.id }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceAuthorizationNoGoProbeResult;
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
        <Stat label={copy.mode} value={payload.authorizationNoGoMode} />
        <Stat
          label={copy.sourceMode}
          value={payload.sourceAuthorizationReadinessMode}
        />
        <Stat label={copy.checkedAt} value={payload.checkedAt} />
        <Stat label={copy.decisionItems} value={payload.decisionItemCount} />
        <Stat label={copy.noGoCount} value={payload.noGoCount} />
        <Stat
          label={copy.manualReview}
          value={payload.manualReviewRequiredCount}
        />
        <Stat
          label={copy.requiredEvidence}
          value={payload.requiredEvidenceCount}
        />
        <Stat label={copy.blockers} value={payload.unresolvedBlockerCount} />
        <Stat label={copy.criteria} value={payload.decisionCriteriaCount} />
        <Stat label={copy.manualSteps} value={payload.manualReviewStepCount} />
        <Stat label={copy.redaction} value={payload.redactionRuleCount} />
        <Stat label={copy.forbidden} value={payload.forbiddenActionCount} />
        <Stat label={copy.remediation} value={payload.remediationActionCount} />
        <Stat label={copy.sourceItems} value={payload.sourceReadinessItemCount} />
        <Stat
          label={copy.sourceManual}
          value={payload.sourceManualRequiredCount}
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
            {copy.noGoRules}
          </h2>
          <div className="mt-3">
            <TextList items={payload.authorizationNoGoRules} />
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.remediationRules}
          </h2>
          <div className="mt-3">
            <TextList items={payload.remediationRules} />
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
              {copy.mode}: {probeResult.authorizationNoGoMode}
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
            {copy.decisionItems}
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/server-writers/persistence-authorization-readiness"
              className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
            >
              {copy.openReadiness}
            </Link>
            <Link
              href="/server-writers/persistence-external-approval-archive"
              className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              {copy.openArchive}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copy.openDashboard}
            </Link>
          </div>
        </div>
        {payload.decisionItems.map((item) => (
          <DecisionItemCard
            key={item.id}
            item={item}
            copy={copy}
            onProbe={probeDecisionItem}
            probing={probingId === item.id}
          />
        ))}
      </section>
    </AppShell>
  );
}
