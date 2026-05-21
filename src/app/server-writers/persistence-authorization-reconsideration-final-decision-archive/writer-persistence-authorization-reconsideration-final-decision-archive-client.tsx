"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchivePayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive";

type ClientPageProps = {
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchivePayload;
};

const archiveCopy = {
  en: {
    title: "Persistence authorization reconsideration final decision archive",
    status: "Archive checklist only",
    body: "This checklist defines what an external final decision archive would need before any future human review. It stays read-only and cannot upload, read, hash, store, accept, record, authorize, implement, deploy, or write anything.",
    yes: "Yes",
    no: "No",
    mode: "Mode",
    sourceMode: "Source final decision mode",
    checkedAt: "Checked at",
    archiveItems: "Archive items",
    incomplete: "Incomplete",
    complete: "Complete",
    externalGap: "External evidence archive gaps",
    manualGap: "Manual reviewer archive gaps",
    stillBlocked: "Final decision still blocked",
    sourceItems: "Source decision items",
    sourceNoGo: "Source final no-go",
    sourceGo: "Source final go",
    sourceBlocked: "Source authorization still blocked",
    metadata: "Archive metadata refs",
    artifacts: "External artifact refs",
    checks: "Completeness checks",
    redaction: "Redaction rules",
    tamper: "Tamper-evidence rules",
    safetyState: "Safety state",
    runtimeState: "Runtime state",
    checklistReady: "Archive checklist ready",
    checklistOnly: "Archive checklist only",
    archiveRequired: "External archive required",
    archiveExternal: "External storage required",
    sourceDecisionReady: "Source final decision ready",
    sourceDecisionOnly: "Source final decision only",
    sourceNoGoReady: "Source final no-go ready",
    sourceNoGoOnly: "Source final no-go only",
    sourceReviewNoGoReady: "Source review no-go ready",
    sourceReviewNoGoOnly: "Source review no-go only",
    releaseBlocked: "Source release still blocked",
    artifactStored: "Archive artifact stored",
    artifactUploaded: "Archive artifact uploaded",
    artifactRead: "Archive artifact read",
    artifactHash: "Archive artifact hash created",
    archiveIndex: "Archive index persisted",
    archiveCompleteAccepted: "Archive completeness accepted",
    archiveAccepted: "External archive accepted",
    finalDecisionAccepted: "Final decision accepted",
    finalDecisionRecorded: "Final decision recorded",
    finalGoRecorded: "Final go recorded",
    finalNoGoAccepted: "Final no-go accepted",
    finalNoGoRecorded: "Final no-go recorded",
    authorizationGranted: "Implementation authorization granted",
    readyForAdapter: "Ready for adapter implementation",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldStoreArchive: "Would store archive artifact",
    wouldUploadArchive: "Would upload archive artifact",
    wouldReadArchive: "Would read archive artifact",
    wouldHashArchive: "Would hash archive artifact",
    wouldPersistIndex: "Would persist archive index",
    wouldMarkComplete: "Would mark archive complete",
    wouldAcceptArchive: "Would accept external archive",
    wouldAcceptFinal: "Would accept final decision",
    wouldRecordFinal: "Would record final decision",
    wouldRecordFinalGo: "Would record final go",
    wouldGrantFromFinal: "Would grant from final decision",
    wouldServiceRole: "Would create service-role client",
    wouldTransaction: "Would run transaction",
    wouldWriteRows: "Would write rows",
    rules: "Archive checklist rules",
    boundaryRules: "External archive boundary rules",
    blockedCodes: "Blocked codes",
    archiveQuestion: "Archive question",
    archiveConclusion: "Archive conclusion",
    requiredMetadata: "Required metadata",
    requiredArtifacts: "Required external artifacts",
    completenessChecks: "Completeness checks",
    retentionRules: "Retention rules",
    tamperRules: "Tamper-evidence rules",
    forbidden: "Forbidden shortcuts",
    safeRefs: "Safe decision refs",
    clauses: "Non-acceptance clauses",
    sourceIds: "Source ids",
    sourceRefs: "Source refs",
    nextSafeAction: "Next safe action",
    owner: "Owner",
    probe: "Probe item",
    probePanel: "Blocked probe result",
    probeBody:
      "Probe one archive checklist item to confirm this stage remains read-only and blocked.",
    loading: "Checking",
    openSourceDecision: "Open source final decision",
    openDashboard: "Back to dashboard",
    statusLabels: {
      archive_gap_external_evidence_missing: "Archive gap: external evidence",
      archive_gap_manual_reviewer_missing: "Archive gap: manual reviewer",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveStatus,
      string
    >,
  },
  zh: {
    title: "持久化授权重审最终决策归档清单",
    status: "仅归档清单",
    body: "这个清单定义未来外部最终决策归档需要什么证据，供后续人工复核使用。它仍然只读，不能上传、读取、哈希、存储、接受、记录、授权、实现、部署或写入任何内容。",
    yes: "是",
    no: "否",
    mode: "模式",
    sourceMode: "来源最终决策模式",
    checkedAt: "检查时间",
    archiveItems: "归档项",
    incomplete: "未完成",
    complete: "已完成",
    externalGap: "外部证据归档缺口",
    manualGap: "人工复核归档缺口",
    stillBlocked: "最终决策仍阻断",
    sourceItems: "来源决策项",
    sourceNoGo: "来源最终 No-go",
    sourceGo: "来源最终 Go",
    sourceBlocked: "来源授权仍阻断",
    metadata: "归档元数据引用",
    artifacts: "外部工件引用",
    checks: "完整性检查",
    redaction: "脱敏规则",
    tamper: "防篡改规则",
    safetyState: "安全状态",
    runtimeState: "运行时状态",
    checklistReady: "归档清单已就绪",
    checklistOnly: "仅归档清单",
    archiveRequired: "需要外部归档",
    archiveExternal: "需要外部存储",
    sourceDecisionReady: "来源最终决策已就绪",
    sourceDecisionOnly: "来源最终决策只读",
    sourceNoGoReady: "来源最终 No-go 已就绪",
    sourceNoGoOnly: "来源最终 No-go 只读",
    sourceReviewNoGoReady: "来源复核 No-go 已就绪",
    sourceReviewNoGoOnly: "来源复核 No-go 只读",
    releaseBlocked: "来源发布仍阻断",
    artifactStored: "归档工件已存储",
    artifactUploaded: "归档工件已上传",
    artifactRead: "归档工件已读取",
    artifactHash: "归档工件哈希已创建",
    archiveIndex: "归档索引已持久化",
    archiveCompleteAccepted: "归档完整性已接受",
    archiveAccepted: "外部归档已接受",
    finalDecisionAccepted: "最终决策已接受",
    finalDecisionRecorded: "最终决策已记录",
    finalGoRecorded: "最终 Go 已记录",
    finalNoGoAccepted: "最终 No-go 已接受",
    finalNoGoRecorded: "最终 No-go 已记录",
    authorizationGranted: "实现授权已授予",
    readyForAdapter: "可实现适配器",
    allRuntimeBlocked: "全部运行时副作用已阻断",
    wouldStoreArchive: "会存储归档工件",
    wouldUploadArchive: "会上传归档工件",
    wouldReadArchive: "会读取归档工件",
    wouldHashArchive: "会哈希归档工件",
    wouldPersistIndex: "会持久化归档索引",
    wouldMarkComplete: "会标记归档完成",
    wouldAcceptArchive: "会接受外部归档",
    wouldAcceptFinal: "会接受最终决策",
    wouldRecordFinal: "会记录最终决策",
    wouldRecordFinalGo: "会记录最终 Go",
    wouldGrantFromFinal: "会由最终决策授予授权",
    wouldServiceRole: "会创建 service-role client",
    wouldTransaction: "会运行 transaction",
    wouldWriteRows: "会写入数据行",
    rules: "归档清单规则",
    boundaryRules: "外部归档边界规则",
    blockedCodes: "阻断代码",
    archiveQuestion: "归档问题",
    archiveConclusion: "归档结论",
    requiredMetadata: "所需元数据",
    requiredArtifacts: "所需外部工件",
    completenessChecks: "完整性检查",
    retentionRules: "留存规则",
    tamperRules: "防篡改规则",
    forbidden: "禁止捷径",
    safeRefs: "安全决策引用",
    clauses: "非接受条款",
    sourceIds: "来源 ID",
    sourceRefs: "来源引用",
    nextSafeAction: "下一安全动作",
    owner: "负责人",
    probe: "探测归档项",
    probePanel: "阻断探测结果",
    probeBody: "探测一个归档清单项，确认该阶段仍然只读且被阻断。",
    loading: "检查中",
    openSourceDecision: "打开来源最终决策",
    openDashboard: "返回工作台",
    statusLabels: {
      archive_gap_external_evidence_missing: "归档缺口：外部证据",
      archive_gap_manual_reviewer_missing: "归档缺口：人工复核",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveStatus,
      string
    >,
  },
} as const;

type ArchiveCopy = (typeof archiveCopy)[keyof typeof archiveCopy];

function statusTone(
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveStatus,
) {
  return status === "archive_gap_external_evidence_missing"
    ? "blocked"
    : "planned";
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 break-words text-lg font-semibold text-slate-950">
        {value}
      </dd>
    </div>
  );
}

function BooleanPill({
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

function TextList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className="rounded-md bg-slate-50 px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  );
}

function ArchiveItemCard({
  item,
  copy,
  onProbe,
  probingId,
}: {
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveItem;
  copy: ArchiveCopy;
  onProbe: (itemId: string) => void;
  probingId: string | null;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {item.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {copy.owner}: {item.owner}
          </p>
        </div>
        <StatusPill tone={statusTone(item.status)}>
          {copy.statusLabels[item.status]}
        </StatusPill>
      </div>

      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <p>
          <span className="font-semibold">{copy.archiveQuestion}: </span>
          {item.archiveQuestion}
        </p>
        <p className="mt-2">
          <span className="font-semibold">{copy.archiveConclusion}: </span>
          {item.archiveConclusion}
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.requiredMetadata}
          </h4>
          <TextList items={item.requiredArchiveMetadata} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.requiredArtifacts}
          </h4>
          <TextList items={item.requiredExternalArtifacts} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.completenessChecks}
          </h4>
          <TextList items={item.completenessChecks} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.redaction}
          </h4>
          <TextList items={item.redactionRules} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.retentionRules}
          </h4>
          <TextList items={item.retentionRules} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.tamperRules}
          </h4>
          <TextList items={item.tamperEvidenceRules} />
        </section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.forbidden}
          </h4>
          <TextList items={item.forbiddenArchiveShortcuts} />
          <h4 className="mt-4 text-sm font-semibold text-slate-950">
            {copy.clauses}
          </h4>
          <TextList items={item.nonAcceptanceClauses} />
        </section>
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.sourceIds}
          </h4>
          <TextList
            items={[
              ...item.sourceDecisionItemIds,
              ...item.sourceNoGoItemIds,
              ...item.sourceReviewItemIds,
              ...item.sourceReconsiderationRemediationItemIds,
              ...item.sourcePreflightItemIds,
            ]}
          />
          <h4 className="mt-4 text-sm font-semibold text-slate-950">
            {copy.safeRefs}
          </h4>
          <TextList items={item.safeDecisionRefs} />
          <h4 className="mt-4 text-sm font-semibold text-slate-950">
            {copy.sourceRefs}
          </h4>
          <TextList items={item.sourceRefs} />
          <p className="mt-4 rounded-md bg-white px-3 py-2 text-sm leading-6 text-slate-600">
            {copy.nextSafeAction}: {item.nextSafeAction}
          </p>
        </section>
      </div>

      <button
        type="button"
        onClick={() => onProbe(item.id)}
        disabled={probingId === item.id}
        className="mt-5 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {probingId === item.id ? copy.loading : copy.probe}
      </button>
    </article>
  );
}

export function WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveClientPage({
  payload,
}: ClientPageProps) {
  const { locale } = useLanguage();
  const copy = archiveCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveProbeResult | null>(
      null,
    );
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags = [
    {
      value: payload.externalFinalDecisionArchiveChecklistReady,
      label: copy.checklistReady,
    },
    {
      value: payload.externalFinalDecisionArchiveChecklistOnly,
      label: copy.checklistOnly,
    },
    {
      value: payload.externalFinalDecisionArchiveRequired,
      label: copy.archiveRequired,
    },
    {
      value: payload.externalFinalDecisionStorageExternal,
      label: copy.archiveExternal,
    },
    {
      value: payload.sourceFinalDecisionPacketReady,
      label: copy.sourceDecisionReady,
    },
    {
      value: payload.sourceFinalDecisionPacketOnly,
      label: copy.sourceDecisionOnly,
    },
    {
      value: payload.sourceFinalNoGoPacketReady,
      label: copy.sourceNoGoReady,
    },
    { value: payload.sourceFinalNoGoPacketOnly, label: copy.sourceNoGoOnly },
    {
      value: payload.sourceReviewNoGoPacketReady,
      label: copy.sourceReviewNoGoReady,
    },
    {
      value: payload.sourceReviewNoGoPacketOnly,
      label: copy.sourceReviewNoGoOnly,
    },
    { value: payload.sourceReleaseStillBlocked, label: copy.releaseBlocked },
    { value: payload.allRuntimeEffectsBlocked, label: copy.allRuntimeBlocked },
  ];

  const falseFlags = [
    {
      value: payload.finalDecisionArchiveArtifactStored,
      label: copy.artifactStored,
    },
    {
      value: payload.finalDecisionArchiveArtifactUploaded,
      label: copy.artifactUploaded,
    },
    {
      value: payload.finalDecisionArchiveArtifactRead,
      label: copy.artifactRead,
    },
    {
      value: payload.finalDecisionArchiveArtifactHashCreated,
      label: copy.artifactHash,
    },
    {
      value: payload.finalDecisionArchiveIndexPersisted,
      label: copy.archiveIndex,
    },
    {
      value: payload.finalDecisionArchiveCompletenessAccepted,
      label: copy.archiveCompleteAccepted,
    },
    {
      value: payload.externalFinalDecisionArchiveAccepted,
      label: copy.archiveAccepted,
    },
    {
      value: payload.authorizationReconsiderationFinalDecisionAccepted,
      label: copy.finalDecisionAccepted,
    },
    {
      value: payload.authorizationReconsiderationFinalDecisionRecorded,
      label: copy.finalDecisionRecorded,
    },
    { value: payload.finalGoDecisionRecorded, label: copy.finalGoRecorded },
    { value: payload.finalNoGoDecisionAccepted, label: copy.finalNoGoAccepted },
    { value: payload.finalNoGoDecisionRecorded, label: copy.finalNoGoRecorded },
    {
      value: payload.implementationAuthorizationGranted,
      label: copy.authorizationGranted,
    },
    { value: payload.readyForAdapterImplementation, label: copy.readyForAdapter },
  ];

  const runtimeFlags = [
    {
      value: payload.wouldStoreFinalDecisionArchiveArtifact,
      label: copy.wouldStoreArchive,
    },
    {
      value: payload.wouldUploadFinalDecisionArchiveArtifact,
      label: copy.wouldUploadArchive,
    },
    {
      value: payload.wouldReadFinalDecisionArchiveArtifact,
      label: copy.wouldReadArchive,
    },
    {
      value: payload.wouldHashFinalDecisionArchiveArtifact,
      label: copy.wouldHashArchive,
    },
    {
      value: payload.wouldPersistFinalDecisionArchiveIndex,
      label: copy.wouldPersistIndex,
    },
    {
      value: payload.wouldMarkFinalDecisionArchiveComplete,
      label: copy.wouldMarkComplete,
    },
    {
      value: payload.wouldAcceptExternalFinalDecisionArchive,
      label: copy.wouldAcceptArchive,
    },
    { value: payload.wouldAcceptFinalDecision, label: copy.wouldAcceptFinal },
    { value: payload.wouldRecordFinalDecision, label: copy.wouldRecordFinal },
    { value: payload.wouldRecordFinalGo, label: copy.wouldRecordFinalGo },
    {
      value: payload.wouldGrantImplementationAuthorizationFromFinalDecision,
      label: copy.wouldGrantFromFinal,
    },
    { value: payload.wouldCreateServiceRoleClient, label: copy.wouldServiceRole },
    { value: payload.wouldRunTransaction, label: copy.wouldTransaction },
    { value: payload.wouldWriteRows, label: copy.wouldWriteRows },
  ];

  async function probeItem(itemId: string) {
    setProbingId(itemId);
    setProbeResult(null);

    try {
      const response = await fetch(
        "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveProbeResult;
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
        <StatusPill tone="blocked">{copy.status}</StatusPill>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label={copy.mode} value={payload.externalFinalDecisionArchiveMode} />
        <Stat label={copy.sourceMode} value={payload.sourceFinalDecisionMode} />
        <Stat label={copy.archiveItems} value={payload.archiveItemCount} />
        <Stat label={copy.incomplete} value={payload.archiveIncompleteCount} />
        <Stat label={copy.complete} value={payload.archiveCompleteCount} />
        <Stat
          label={copy.externalGap}
          value={payload.externalEvidenceArchiveGapCount}
        />
        <Stat label={copy.manualGap} value={payload.manualReviewerArchiveGapCount} />
        <Stat
          label={copy.stillBlocked}
          value={payload.finalDecisionStillBlockedCount}
        />
        <Stat label={copy.sourceItems} value={payload.sourceDecisionItemCount} />
        <Stat label={copy.sourceNoGo} value={payload.sourceFinalNoGoCount} />
        <Stat label={copy.sourceGo} value={payload.sourceFinalGoCount} />
        <Stat
          label={copy.sourceBlocked}
          value={payload.sourceAuthorizationStillBlockedCount}
        />
        <Stat label={copy.metadata} value={payload.requiredArchiveMetadataCount} />
        <Stat label={copy.artifacts} value={payload.requiredExternalArtifactCount} />
        <Stat label={copy.checks} value={payload.archiveCompletenessCheckCount} />
        <Stat label={copy.redaction} value={payload.archiveRedactionRuleCount} />
        <Stat label={copy.tamper} value={payload.tamperEvidenceRuleCount} />
        <Stat label={copy.checkedAt} value={payload.checkedAt} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.rules}
            </h2>
            <TextList items={payload.archiveChecklistRules} />
          </section>

          {payload.archiveItems.map((item) => (
            <ArchiveItemCard
              key={item.id}
              item={item}
              copy={copy}
              onProbe={probeItem}
              probingId={probingId}
            />
          ))}
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.safetyState}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {trueFlags.map((flag) => (
                <BooleanPill
                  key={flag.label}
                  value={flag.value}
                  label={flag.label}
                  copy={copy}
                />
              ))}
              {falseFlags.map((flag) => (
                <BooleanPill
                  key={flag.label}
                  value={flag.value}
                  label={flag.label}
                  copy={copy}
                  readyWhenTrue={false}
                />
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.runtimeState}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {runtimeFlags.map((flag) => (
                <BooleanPill
                  key={flag.label}
                  value={flag.value}
                  label={flag.label}
                  copy={copy}
                  readyWhenTrue={false}
                />
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-amber-950">
              {copy.boundaryRules}
            </h2>
            <TextList items={payload.externalArchiveBoundaryRules} />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.probePanel}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy.probeBody}
            </p>
            {probeResult ? (
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                <p>blocked: {probeResult.blocked ? copy.yes : copy.no}</p>
                <p>
                  {copy.mode}: {probeResult.externalFinalDecisionArchiveMode}
                </p>
                {probeResult.itemTitle ? <p>{probeResult.itemTitle}</p> : null}
                <p className="mt-2">{probeResult.summary}</p>
              </div>
            ) : null}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.blockedCodes}
            </h2>
            <TextList items={payload.blockedCodes} />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision"
                className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                {copy.openSourceDecision}
              </Link>
              <Link
                href="/dashboard"
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {copy.openDashboard}
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
