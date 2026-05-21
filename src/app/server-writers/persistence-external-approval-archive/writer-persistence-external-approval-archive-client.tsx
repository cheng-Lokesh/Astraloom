"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceExternalApprovalArchiveCategory,
  WriterPersistenceExternalApprovalArchiveItem,
  WriterPersistenceExternalApprovalArchivePayload,
  WriterPersistenceExternalApprovalArchiveProbeResult,
  WriterPersistenceExternalApprovalArchiveStatus,
} from "@/types/writer-persistence-external-approval-archive";

type WriterPersistenceExternalApprovalArchiveClientPageProps = {
  payload: WriterPersistenceExternalApprovalArchivePayload;
};

const archiveCopy = {
  en: {
    title: "Persistence adapter external approval archive checklist",
    badge: "Archive checklist only",
    body: "This page defines how future human approval artifacts should be named, checked, redacted, retained, and cross-referenced outside the app. It remains read-only and does not inspect or store external artifacts.",
    notice:
      "Every probe is blocked by design. This checklist cannot upload, read, hash, store, or accept approval artifacts; it cannot mark an archive complete, authorize implementation, enable feature flags, deploy code, run production writers, accept patches, create files, create tests, create branches, create privileged clients, run transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.",
    mode: "Archive checklist mode",
    sourceMode: "Source human runbook mode",
    checkedAt: "Checked at",
    archiveItems: "Archive items",
    blockedByRunbook: "Blocked by human runbook",
    manualRequired: "Manual required",
    metadata: "Metadata fields",
    naming: "Naming rules",
    completeness: "Completeness checks",
    redaction: "Redaction rules",
    retention: "Retention rules",
    forbidden: "Forbidden actions",
    sourceSteps: "Source runbook steps",
    sourceManual: "Source manual lanes",
    yes: "Yes",
    no: "No",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    checklistReady: "Archive checklist ready",
    checklistOnly: "Archive checklist only",
    sourceReady: "Source human runbook ready",
    sourceOnly: "Source human runbook only",
    sourceBlocked: "Source release still blocked",
    sourceExternal: "Source decisions external",
    archiveRequired: "External approval archive required",
    archiveExternal: "External approval storage external",
    allRuntimeBlocked: "All runtime effects blocked",
    artifactStored: "Archive artifact stored",
    artifactUploaded: "Archive artifact uploaded",
    artifactRead: "Archive artifact read",
    artifactHash: "Archive artifact hash created",
    archiveIndex: "Archive index persisted",
    archiveComplete: "Archive completeness accepted",
    archiveAccepted: "External approval archive accepted",
    implementationAuthorization: "Implementation authorization granted",
    implementationAuthorized: "Implementation authorized",
    humanDecisionRecorded: "Human decision recorded",
    humanDecisionAccepted: "Human decision accepted",
    releaseApproved: "Release approved",
    releaseApprovalGranted: "Release approval granted",
    featureFlagEnabled: "Feature flag enabled",
    deploymentApproved: "Deployment approved",
    productionWriterApproved: "Production writer approved",
    readyForAdapter: "Ready for adapter implementation",
    readyForRelease: "Ready for release execution",
    adapterImplemented: "Adapter implemented",
    allOwnerApprovalsComplete: "All owner approvals complete",
    allBlockingEvidenceReady: "All blocking evidence ready",
    wouldStoreApprovalArtifact: "Would store approval artifact",
    wouldUploadApprovalArtifact: "Would upload approval artifact",
    wouldReadExternalArtifact: "Would read external artifact",
    wouldHashExternalArtifact: "Would hash external artifact",
    wouldPersistArchiveIndex: "Would persist archive index",
    wouldMarkArchiveComplete: "Would mark archive complete",
    wouldAcceptArchive: "Would accept external archive",
    wouldGrantAuthorization: "Would grant implementation authorization",
    wouldRecordHumanDecision: "Would record human decision",
    wouldAcceptHumanDecision: "Would accept human decision",
    wouldStoreDecisionArtifact: "Would store decision artifact",
    wouldRecordGoDecision: "Would record go decision",
    wouldEnableFeatureFlag: "Would enable feature flag",
    wouldDeployCode: "Would deploy code",
    wouldRunProductionWriter: "Would run production writer",
    wouldCreateFiles: "Would create files",
    wouldModifyFiles: "Would modify files",
    wouldRunGitCommand: "Would run git command",
    wouldCreateBranch: "Would create branch",
    wouldCreatePullRequest: "Would create pull request",
    wouldCreateTestFiles: "Would create test files",
    wouldCreateAdapterCode: "Would create adapter code",
    wouldCreateServiceRoleClient: "Would create privileged client",
    wouldRunTransaction: "Would run transaction",
    wouldWriteRows: "Would write rows",
    wouldWriteAuditRows: "Would write audit rows",
    wouldReserveIdempotencyKeys: "Would reserve idempotency keys",
    wouldCreateMigrationFile: "Would create migration file",
    wouldApplyMigration: "Would apply migration",
    wouldCallAi: "Would call AI",
    wouldCallStripe: "Would call Stripe",
    wouldUnlockReports: "Would unlock reports",
    checklistRules: "Archive checklist rules",
    externalStorageRules: "External storage rules",
    blockedCodes: "Blocked codes",
    archiveQuestion: "Archive question",
    nonExecution: "Non-execution clauses",
    futureArtifacts: "Future artifacts",
    sourceRefs: "Source refs",
    sourceRunbookSteps: "Source runbook steps",
    owner: "Owner",
    probeItem: "Probe item",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one archive item to confirm this checklist remains read-only and blocked.",
    openHumanRunbook: "Open human go/no-go",
    openReleaseNoGo: "Open release no-go",
    openDashboard: "Back to dashboard",
    statusLabels: {
      blocked_by_human_runbook: "Blocked by human runbook",
      manual_required: "Manual required",
    } satisfies Record<WriterPersistenceExternalApprovalArchiveStatus, string>,
    categoryLabels: {
      source_human_runbook_invariant: "Source runbook invariant",
      archive_identity: "Archive identity",
      artifact_naming: "Artifact naming",
      owner_metadata: "Owner metadata",
      blocker_cross_reference: "Blocker cross-reference",
      evidence_redaction: "Evidence redaction",
      completeness_check: "Completeness check",
      retention_access: "Retention and access",
      tamper_evidence: "Tamper evidence",
      final_archive_hard_stop: "Final hard stop",
    } satisfies Record<WriterPersistenceExternalApprovalArchiveCategory, string>,
  },
  zh: {
    title: "持久化适配器外部批准归档清单",
    badge: "仅归档清单",
    body: "这个页面定义未来人工批准产物如何在应用外命名、检查、脱敏、留存和交叉引用。它仍然只读，不读取也不存储任何真实外部产物。",
    notice:
      "所有探测都会按设计被阻断。这个清单不能上传、读取、哈希、存储或接受批准产物；不能标记归档完成、授权实现、启用功能开关、部署代码、运行生产 writer、接受 patch、创建文件、创建测试、创建分支、创建特权客户端、运行事务、创建 migration、写入数据、调用 AI、调用 Stripe 或解锁报告。",
    mode: "归档清单模式",
    sourceMode: "来源人工手册模式",
    checkedAt: "检查时间",
    archiveItems: "归档项目",
    blockedByRunbook: "被人工手册阻断",
    manualRequired: "需要人工判断",
    metadata: "元数据字段",
    naming: "命名规则",
    completeness: "完整性检查",
    redaction: "脱敏规则",
    retention: "留存规则",
    forbidden: "禁止动作",
    sourceSteps: "来源手册步骤",
    sourceManual: "来源人工通道",
    yes: "是",
    no: "否",
    safetyState: "安全状态",
    safeMode: "安全模式",
    readOnly: "只读",
    checklistReady: "归档清单已就绪",
    checklistOnly: "仅归档清单",
    sourceReady: "来源人工手册已就绪",
    sourceOnly: "来源仅人工手册",
    sourceBlocked: "来源 release 仍阻断",
    sourceExternal: "来源决策在应用外",
    archiveRequired: "需要外部批准归档",
    archiveExternal: "批准归档存储在应用外",
    allRuntimeBlocked: "全部运行时副作用已阻断",
    artifactStored: "归档产物已存储",
    artifactUploaded: "归档产物已上传",
    artifactRead: "归档产物已读取",
    artifactHash: "归档产物 hash 已创建",
    archiveIndex: "归档索引已持久化",
    archiveComplete: "归档完整性已接受",
    archiveAccepted: "外部批准归档已接受",
    implementationAuthorization: "实现授权已授予",
    implementationAuthorized: "实现已授权",
    humanDecisionRecorded: "人工决策已记录",
    humanDecisionAccepted: "人工决策已接受",
    releaseApproved: "Release 已批准",
    releaseApprovalGranted: "Release 批准已授予",
    featureFlagEnabled: "功能开关已启用",
    deploymentApproved: "部署已批准",
    productionWriterApproved: "生产 writer 已批准",
    readyForAdapter: "可实现适配器",
    readyForRelease: "可执行 release",
    adapterImplemented: "适配器已实现",
    allOwnerApprovalsComplete: "全部负责人批准完成",
    allBlockingEvidenceReady: "全部阻断证据就绪",
    wouldStoreApprovalArtifact: "是否会存储批准产物",
    wouldUploadApprovalArtifact: "是否会上传批准产物",
    wouldReadExternalArtifact: "是否会读取外部产物",
    wouldHashExternalArtifact: "是否会哈希外部产物",
    wouldPersistArchiveIndex: "是否会持久化归档索引",
    wouldMarkArchiveComplete: "是否会标记归档完成",
    wouldAcceptArchive: "是否会接受外部归档",
    wouldGrantAuthorization: "是否会授予实现授权",
    wouldRecordHumanDecision: "是否会记录人工决策",
    wouldAcceptHumanDecision: "是否会接受人工决策",
    wouldStoreDecisionArtifact: "是否会存储决策产物",
    wouldRecordGoDecision: "是否会记录 go 决策",
    wouldEnableFeatureFlag: "是否会启用功能开关",
    wouldDeployCode: "是否会部署代码",
    wouldRunProductionWriter: "是否会运行生产 writer",
    wouldCreateFiles: "是否会创建文件",
    wouldModifyFiles: "是否会修改文件",
    wouldRunGitCommand: "是否会运行 git 命令",
    wouldCreateBranch: "是否会创建分支",
    wouldCreatePullRequest: "是否会创建 PR",
    wouldCreateTestFiles: "是否会创建测试文件",
    wouldCreateAdapterCode: "是否会创建适配器代码",
    wouldCreateServiceRoleClient: "是否会创建特权客户端",
    wouldRunTransaction: "是否会运行事务",
    wouldWriteRows: "是否会写入数据行",
    wouldWriteAuditRows: "是否会写入审计行",
    wouldReserveIdempotencyKeys: "是否会预留幂等 key",
    wouldCreateMigrationFile: "是否会创建 migration 文件",
    wouldApplyMigration: "是否会应用 migration",
    wouldCallAi: "是否会调用 AI",
    wouldCallStripe: "是否会调用 Stripe",
    wouldUnlockReports: "是否会解锁报告",
    checklistRules: "归档清单规则",
    externalStorageRules: "外部存储规则",
    blockedCodes: "阻断代码",
    archiveQuestion: "归档问题",
    nonExecution: "不执行条款",
    futureArtifacts: "未来产物",
    sourceRefs: "来源引用",
    sourceRunbookSteps: "来源手册步骤",
    owner: "负责人",
    probeItem: "探测项目",
    probing: "探测中...",
    probeResult: "探测结果",
    noProbe: "探测一个归档项目，确认这个清单仍然只读且被阻断。",
    openHumanRunbook: "打开人工 Go/no-go",
    openReleaseNoGo: "打开 release no-go",
    openDashboard: "返回工作台",
    statusLabels: {
      blocked_by_human_runbook: "被人工手册阻断",
      manual_required: "需要人工判断",
    } satisfies Record<WriterPersistenceExternalApprovalArchiveStatus, string>,
    categoryLabels: {
      source_human_runbook_invariant: "来源手册不变式",
      archive_identity: "归档身份",
      artifact_naming: "产物命名",
      owner_metadata: "负责人元数据",
      blocker_cross_reference: "阻断项交叉引用",
      evidence_redaction: "证据脱敏",
      completeness_check: "完整性检查",
      retention_access: "留存与访问",
      tamper_evidence: "防篡改证据",
      final_archive_hard_stop: "最终硬阻断",
    } satisfies Record<WriterPersistenceExternalApprovalArchiveCategory, string>,
  },
} as const;

type ArchiveCopy = (typeof archiveCopy)[keyof typeof archiveCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: ArchiveCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function statusTone(status: WriterPersistenceExternalApprovalArchiveStatus) {
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

function ArchiveItemCard({
  item,
  copy,
  onProbe,
  probing,
}: {
  item: WriterPersistenceExternalApprovalArchiveItem;
  copy: ArchiveCopy;
  onProbe: (item: WriterPersistenceExternalApprovalArchiveItem) => void;
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
            <span className="font-semibold">{copy.archiveQuestion}: </span>
            {item.archiveQuestion}
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
            {copy.metadata}
          </h3>
          <TextList items={item.requiredMetadata} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.naming}
          </h3>
          <TextList items={item.namingRules} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.completeness}
          </h3>
          <TextList items={item.completenessChecks} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.redaction}
          </h3>
          <TextList items={item.redactionRules} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.retention}
          </h3>
          <TextList items={item.retentionRules} />
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
            {copy.futureArtifacts}
          </h3>
          <TextList items={item.futureArtifacts} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">
            {copy.sourceRunbookSteps}
          </h3>
          <TextList items={item.sourceRunbookStepIds} />
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

export function WriterPersistenceExternalApprovalArchiveClientPage({
  payload,
}: WriterPersistenceExternalApprovalArchiveClientPageProps) {
  const { locale } = useLanguage();
  const copy = archiveCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceExternalApprovalArchiveProbeResult | null>(null);
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags = [
    { value: payload.safeMode, label: copy.safeMode },
    { value: payload.readOnly, label: copy.readOnly },
    { value: payload.archiveChecklistReady, label: copy.checklistReady },
    { value: payload.archiveChecklistOnly, label: copy.checklistOnly },
    { value: payload.sourceHumanGoNoGoRunbookReady, label: copy.sourceReady },
    { value: payload.sourceHumanGoNoGoRunbookOnly, label: copy.sourceOnly },
    { value: payload.sourceReleaseStillBlocked, label: copy.sourceBlocked },
    {
      value: payload.sourceHumanDecisionCollectionExternal,
      label: copy.sourceExternal,
    },
    { value: payload.externalApprovalArchiveRequired, label: copy.archiveRequired },
    {
      value: payload.externalApprovalStorageExternal,
      label: copy.archiveExternal,
    },
    { value: payload.allRuntimeEffectsBlocked, label: copy.allRuntimeBlocked },
  ];

  const falseFlags = [
    { value: payload.archiveArtifactStored, label: copy.artifactStored },
    { value: payload.archiveArtifactUploaded, label: copy.artifactUploaded },
    { value: payload.archiveArtifactRead, label: copy.artifactRead },
    { value: payload.archiveArtifactHashCreated, label: copy.artifactHash },
    { value: payload.archiveIndexPersisted, label: copy.archiveIndex },
    { value: payload.archiveCompletenessAccepted, label: copy.archiveComplete },
    {
      value: payload.externalApprovalArchiveAccepted,
      label: copy.archiveAccepted,
    },
    {
      value: payload.implementationAuthorizationGranted,
      label: copy.implementationAuthorization,
    },
    { value: payload.implementationAuthorized, label: copy.implementationAuthorized },
    { value: payload.humanDecisionRecorded, label: copy.humanDecisionRecorded },
    { value: payload.humanDecisionAccepted, label: copy.humanDecisionAccepted },
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
      value: payload.readyForAdapterImplementation,
      label: copy.readyForAdapter,
    },
    { value: payload.readyForReleaseExecution, label: copy.readyForRelease },
    { value: payload.adapterImplemented, label: copy.adapterImplemented },
    {
      value: payload.allOwnerApprovalsComplete,
      label: copy.allOwnerApprovalsComplete,
    },
    {
      value: payload.allBlockingEvidenceReady,
      label: copy.allBlockingEvidenceReady,
    },
    {
      value: payload.wouldStoreApprovalArtifact,
      label: copy.wouldStoreApprovalArtifact,
    },
    {
      value: payload.wouldUploadApprovalArtifact,
      label: copy.wouldUploadApprovalArtifact,
    },
    {
      value: payload.wouldReadExternalArtifact,
      label: copy.wouldReadExternalArtifact,
    },
    {
      value: payload.wouldHashExternalArtifact,
      label: copy.wouldHashExternalArtifact,
    },
    {
      value: payload.wouldPersistArchiveIndex,
      label: copy.wouldPersistArchiveIndex,
    },
    {
      value: payload.wouldMarkArchiveComplete,
      label: copy.wouldMarkArchiveComplete,
    },
    {
      value: payload.wouldAcceptExternalApprovalArchive,
      label: copy.wouldAcceptArchive,
    },
    {
      value: payload.wouldGrantImplementationAuthorization,
      label: copy.wouldGrantAuthorization,
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
    { value: payload.wouldRecordGoDecision, label: copy.wouldRecordGoDecision },
    {
      value: payload.wouldEnableFeatureFlag,
      label: copy.wouldEnableFeatureFlag,
    },
    { value: payload.wouldDeployCode, label: copy.wouldDeployCode },
    {
      value: payload.wouldRunProductionWriter,
      label: copy.wouldRunProductionWriter,
    },
    { value: payload.wouldCreateFiles, label: copy.wouldCreateFiles },
    { value: payload.wouldModifyFiles, label: copy.wouldModifyFiles },
    { value: payload.wouldRunGitCommand, label: copy.wouldRunGitCommand },
    { value: payload.wouldCreateBranch, label: copy.wouldCreateBranch },
    {
      value: payload.wouldCreatePullRequest,
      label: copy.wouldCreatePullRequest,
    },
    { value: payload.wouldCreateTestFiles, label: copy.wouldCreateTestFiles },
    { value: payload.wouldCreateAdapterCode, label: copy.wouldCreateAdapterCode },
    {
      value: payload.wouldCreateServiceRoleClient,
      label: copy.wouldCreateServiceRoleClient,
    },
    { value: payload.wouldRunTransaction, label: copy.wouldRunTransaction },
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
    { value: payload.wouldCallAi, label: copy.wouldCallAi },
    { value: payload.wouldCallStripe, label: copy.wouldCallStripe },
    { value: payload.wouldUnlockReports, label: copy.wouldUnlockReports },
  ];

  async function probeArchiveItem(
    item: WriterPersistenceExternalApprovalArchiveItem,
  ) {
    setProbingId(item.id);
    setProbeResult(null);

    try {
      const response = await fetch(
        "/api/system-writers/persistence-external-approval-archive",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ itemId: item.id }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceExternalApprovalArchiveProbeResult;
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
        <Stat label={copy.mode} value={payload.archiveChecklistMode} />
        <Stat label={copy.sourceMode} value={payload.sourceHumanGoNoGoMode} />
        <Stat label={copy.checkedAt} value={payload.checkedAt} />
        <Stat label={copy.archiveItems} value={payload.archiveItemCount} />
        <Stat
          label={copy.blockedByRunbook}
          value={payload.blockedByHumanRunbookCount}
        />
        <Stat label={copy.manualRequired} value={payload.manualRequiredCount} />
        <Stat label={copy.metadata} value={payload.requiredMetadataCount} />
        <Stat label={copy.naming} value={payload.namingRuleCount} />
        <Stat
          label={copy.completeness}
          value={payload.completenessCheckCount}
        />
        <Stat label={copy.redaction} value={payload.redactionRuleCount} />
        <Stat label={copy.retention} value={payload.retentionRuleCount} />
        <Stat label={copy.forbidden} value={payload.forbiddenActionCount} />
        <Stat label={copy.sourceSteps} value={payload.sourceRunbookStepCount} />
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
            {copy.checklistRules}
          </h2>
          <div className="mt-3">
            <TextList items={payload.archiveChecklistRules} />
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.externalStorageRules}
          </h2>
          <div className="mt-3">
            <TextList items={payload.externalStorageRules} />
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
              {copy.mode}: {probeResult.archiveChecklistMode}
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
            {copy.archiveItems}
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/server-writers/persistence-human-go-no-go"
              className="rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
            >
              {copy.openHumanRunbook}
            </Link>
            <Link
              href="/server-writers/persistence-release-no-go"
              className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
            >
              {copy.openReleaseNoGo}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copy.openDashboard}
            </Link>
          </div>
        </div>
        {payload.archiveItems.map((item) => (
          <ArchiveItemCard
            key={item.id}
            item={item}
            copy={copy}
            onProbe={probeArchiveItem}
            probing={probingId === item.id}
          />
        ))}
      </section>
    </AppShell>
  );
}
