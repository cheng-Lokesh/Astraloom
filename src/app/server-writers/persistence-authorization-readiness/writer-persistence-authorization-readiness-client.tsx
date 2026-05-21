"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationReadinessCategory,
  WriterPersistenceAuthorizationReadinessItem,
  WriterPersistenceAuthorizationReadinessPayload,
  WriterPersistenceAuthorizationReadinessProbeResult,
  WriterPersistenceAuthorizationReadinessStatus,
} from "@/types/writer-persistence-authorization-readiness";

type WriterPersistenceAuthorizationReadinessClientPageProps = {
  payload: WriterPersistenceAuthorizationReadinessPayload;
};

const readinessCopy = {
  en: {
    title: "Persistence adapter implementation authorization readiness checklist",
    badge: "Authorization readiness only",
    body: "This page defines the evidence a future reviewer would need before implementation authorization can even be discussed. It remains read-only and does not accept archives or grant authorization.",
    notice:
      "Every probe is blocked by design. This checklist cannot accept external archives, mark archive completeness, create authorization records, grant implementation authorization, store approval artifacts, enable feature flags, deploy code, run production writers, accept patches, create files, create tests, create branches, create privileged clients, run transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.",
    yes: "Yes",
    no: "No",
    mode: "Readiness mode",
    sourceMode: "Source archive mode",
    checkedAt: "Checked at",
    readinessItems: "Readiness items",
    blockedByArchive: "Blocked by archive",
    manualRequired: "Manual required",
    requiredEvidence: "Required evidence",
    criteria: "Archive acceptance criteria",
    blockers: "Authorization blockers",
    manualChecks: "Manual checks",
    redaction: "Redaction rules",
    forbidden: "Forbidden actions",
    sourceItems: "Source archive items",
    sourceManual: "Source archive manual lanes",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    checklistReady: "Authorization readiness checklist ready",
    checklistOnly: "Authorization readiness checklist only",
    sourceReady: "Source archive checklist ready",
    sourceOnly: "Source archive checklist only",
    sourceBlocked: "Source release still blocked",
    archiveRequired: "External approval archive required",
    archiveExternal: "External approval storage external",
    archiveAccepted: "External approval archive accepted",
    archiveComplete: "Archive completeness accepted",
    authorizationReady: "Implementation authorization ready",
    authorizationGranted: "Implementation authorization granted",
    authorized: "Implementation authorized",
    decisionRecorded: "Authorization decision recorded",
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
    wouldGrantAuthorization: "Would grant implementation authorization",
    wouldStoreApprovalArtifact: "Would store approval artifact",
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
    readinessRules: "Authorization readiness rules",
    externalRules: "External authorization rules",
    blockedCodes: "Blocked codes",
    readinessQuestion: "Readiness question",
    archiveCriteria: "Archive acceptance criteria",
    nonExecution: "Non-execution clauses",
    nextIfBlocked: "Next if blocked",
    sourceRefs: "Source refs",
    sourceArchiveItems: "Source archive items",
    owner: "Owner",
    probeItem: "Probe item",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one readiness item to confirm this checklist remains read-only and blocked.",
    openArchive: "Open approval archive",
    openHumanRunbook: "Open human go/no-go",
    openDashboard: "Back to dashboard",
    statusLabels: {
      blocked_by_external_archive: "Blocked by external archive",
      manual_required: "Manual required",
    } satisfies Record<WriterPersistenceAuthorizationReadinessStatus, string>,
    categoryLabels: {
      source_archive_invariant: "Source archive invariant",
      authority_boundary: "Authority boundary",
      archive_coverage: "Archive coverage",
      owner_lane_readiness: "Owner lane readiness",
      security_readiness: "Security readiness",
      backend_readiness: "Backend readiness",
      qa_readiness: "QA readiness",
      rollback_observability: "Rollback and observability",
      implementation_scope: "Implementation scope",
      final_authorization_hard_stop: "Final hard stop",
    } satisfies Record<WriterPersistenceAuthorizationReadinessCategory, string>,
  },
  zh: {
    title: "持久化适配器实现授权准备度清单",
    badge: "仅授权准备度",
    body: "这个页面定义未来审查者在讨论实现授权前必须看到的证据。它仍然只读，不接受归档，也不授予授权。",
    notice:
      "所有探测都会按设计被阻断。这个清单不能接受外部归档、标记归档完整、创建授权记录、授予实现授权、存储批准产物、启用功能开关、部署代码、运行生产 writer、接受 patch、创建文件、创建测试、创建分支、创建特权客户端、运行事务、创建 migration、写入数据、调用 AI、调用 Stripe 或解锁报告。",
    yes: "是",
    no: "否",
    mode: "准备度模式",
    sourceMode: "来源归档模式",
    checkedAt: "检查时间",
    readinessItems: "准备度项目",
    blockedByArchive: "被外部归档阻断",
    manualRequired: "需要人工判断",
    requiredEvidence: "所需证据",
    criteria: "归档接受条件",
    blockers: "授权阻断项",
    manualChecks: "人工检查",
    redaction: "脱敏规则",
    forbidden: "禁止动作",
    sourceItems: "来源归档项目",
    sourceManual: "来源归档人工通道",
    safetyState: "安全状态",
    safeMode: "安全模式",
    readOnly: "只读",
    checklistReady: "授权准备度清单已就绪",
    checklistOnly: "仅授权准备度清单",
    sourceReady: "来源归档清单已就绪",
    sourceOnly: "来源仅归档清单",
    sourceBlocked: "来源 release 仍阻断",
    archiveRequired: "需要外部批准归档",
    archiveExternal: "批准归档存储在应用外",
    archiveAccepted: "外部批准归档已接受",
    archiveComplete: "归档完整性已接受",
    authorizationReady: "实现授权已就绪",
    authorizationGranted: "实现授权已授予",
    authorized: "实现已授权",
    decisionRecorded: "授权决策已记录",
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
    wouldGrantAuthorization: "是否会授予实现授权",
    wouldStoreApprovalArtifact: "是否会存储批准产物",
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
    readinessRules: "授权准备度规则",
    externalRules: "外部授权规则",
    blockedCodes: "阻断代码",
    readinessQuestion: "准备度问题",
    archiveCriteria: "归档接受条件",
    nonExecution: "不执行条款",
    nextIfBlocked: "若阻断则下一步",
    sourceRefs: "来源引用",
    sourceArchiveItems: "来源归档项目",
    owner: "负责人",
    probeItem: "探测项目",
    probing: "探测中...",
    probeResult: "探测结果",
    noProbe: "探测一个准备度项目，确认这个清单仍然只读且被阻断。",
    openArchive: "打开批准归档",
    openHumanRunbook: "打开人工 Go/no-go",
    openDashboard: "返回工作台",
    statusLabels: {
      blocked_by_external_archive: "被外部归档阻断",
      manual_required: "需要人工判断",
    } satisfies Record<WriterPersistenceAuthorizationReadinessStatus, string>,
    categoryLabels: {
      source_archive_invariant: "来源归档不变式",
      authority_boundary: "授权边界",
      archive_coverage: "归档覆盖",
      owner_lane_readiness: "负责人通道准备度",
      security_readiness: "安全准备度",
      backend_readiness: "后端准备度",
      qa_readiness: "QA 准备度",
      rollback_observability: "回滚与观测",
      implementation_scope: "实现范围",
      final_authorization_hard_stop: "最终硬阻断",
    } satisfies Record<WriterPersistenceAuthorizationReadinessCategory, string>,
  },
} as const;

type ReadinessCopy = (typeof readinessCopy)[keyof typeof readinessCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: ReadinessCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function statusTone(status: WriterPersistenceAuthorizationReadinessStatus) {
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

function ReadinessItemCard({
  item,
  copy,
  onProbe,
  probing,
}: {
  item: WriterPersistenceAuthorizationReadinessItem;
  copy: ReadinessCopy;
  onProbe: (item: WriterPersistenceAuthorizationReadinessItem) => void;
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
            <span className="font-semibold">{copy.readinessQuestion}: </span>
            {item.readinessQuestion}
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
            {copy.archiveCriteria}
          </h3>
          <TextList items={item.archiveAcceptanceCriteria} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.blockers}
          </h3>
          <TextList items={item.authorizationBlockers} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.manualChecks}
          </h3>
          <TextList items={item.manualChecks} />
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
            {copy.nextIfBlocked}
          </h3>
          <TextList items={item.nextIfBlocked} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.sourceArchiveItems}
          </h3>
          <TextList items={item.sourceArchiveItemIds} />
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

export function WriterPersistenceAuthorizationReadinessClientPage({
  payload,
}: WriterPersistenceAuthorizationReadinessClientPageProps) {
  const { locale } = useLanguage();
  const copy = readinessCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationReadinessProbeResult | null>(null);
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags = [
    { value: payload.safeMode, label: copy.safeMode },
    { value: payload.readOnly, label: copy.readOnly },
    {
      value: payload.authorizationReadinessChecklistReady,
      label: copy.checklistReady,
    },
    {
      value: payload.authorizationReadinessChecklistOnly,
      label: copy.checklistOnly,
    },
    { value: payload.sourceArchiveChecklistReady, label: copy.sourceReady },
    { value: payload.sourceArchiveChecklistOnly, label: copy.sourceOnly },
    { value: payload.sourceReleaseStillBlocked, label: copy.sourceBlocked },
    { value: payload.externalApprovalArchiveRequired, label: copy.archiveRequired },
    {
      value: payload.externalApprovalStorageExternal,
      label: copy.archiveExternal,
    },
    { value: payload.allRuntimeEffectsBlocked, label: copy.allRuntimeBlocked },
  ];

  const falseFlags = [
    {
      value: payload.externalApprovalArchiveAccepted,
      label: copy.archiveAccepted,
    },
    { value: payload.archiveCompletenessAccepted, label: copy.archiveComplete },
    {
      value: payload.implementationAuthorizationReady,
      label: copy.authorizationReady,
    },
    {
      value: payload.implementationAuthorizationGranted,
      label: copy.authorizationGranted,
    },
    { value: payload.implementationAuthorized, label: copy.authorized },
    { value: payload.authorizationDecisionRecorded, label: copy.decisionRecorded },
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
      value: payload.wouldGrantImplementationAuthorization,
      label: copy.wouldGrantAuthorization,
    },
    {
      value: payload.wouldStoreApprovalArtifact,
      label: copy.wouldStoreApprovalArtifact,
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

  async function probeReadinessItem(
    item: WriterPersistenceAuthorizationReadinessItem,
  ) {
    setProbingId(item.id);
    setProbeResult(null);

    try {
      const response = await fetch(
        "/api/system-writers/persistence-authorization-readiness",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ itemId: item.id }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceAuthorizationReadinessProbeResult;
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
        <Stat label={copy.mode} value={payload.authorizationReadinessMode} />
        <Stat label={copy.sourceMode} value={payload.sourceArchiveChecklistMode} />
        <Stat label={copy.checkedAt} value={payload.checkedAt} />
        <Stat label={copy.readinessItems} value={payload.readinessItemCount} />
        <Stat
          label={copy.blockedByArchive}
          value={payload.blockedByExternalArchiveCount}
        />
        <Stat label={copy.manualRequired} value={payload.manualRequiredCount} />
        <Stat
          label={copy.requiredEvidence}
          value={payload.requiredEvidenceCount}
        />
        <Stat label={copy.criteria} value={payload.archiveAcceptanceCriteriaCount} />
        <Stat label={copy.blockers} value={payload.authorizationBlockerCount} />
        <Stat label={copy.manualChecks} value={payload.manualCheckCount} />
        <Stat label={copy.redaction} value={payload.redactionRuleCount} />
        <Stat label={copy.forbidden} value={payload.forbiddenActionCount} />
        <Stat label={copy.sourceItems} value={payload.sourceArchiveItemCount} />
        <Stat
          label={copy.sourceManual}
          value={payload.sourceArchiveManualRequiredCount}
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
            {copy.readinessRules}
          </h2>
          <div className="mt-3">
            <TextList items={payload.authorizationReadinessRules} />
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.externalRules}
          </h2>
          <div className="mt-3">
            <TextList items={payload.externalAuthorizationRules} />
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
              {copy.mode}: {probeResult.authorizationReadinessMode}
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
            {copy.readinessItems}
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/server-writers/persistence-external-approval-archive"
              className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              {copy.openArchive}
            </Link>
            <Link
              href="/server-writers/persistence-human-go-no-go"
              className="rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
            >
              {copy.openHumanRunbook}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copy.openDashboard}
            </Link>
          </div>
        </div>
        {payload.readinessItems.map((item) => (
          <ReadinessItemCard
            key={item.id}
            item={item}
            copy={copy}
            onProbe={probeReadinessItem}
            probing={probingId === item.id}
          />
        ))}
      </section>
    </AppShell>
  );
}
