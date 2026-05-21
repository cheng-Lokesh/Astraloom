"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-no-go";

type ClientPageProps = {
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoPayload;
};

const noGoCopy = {
  en: {
    title: "Persistence authorization reconsideration archive no-go",
    status: "Archive no-go packet only",
    body: "This packet explains why the external final decision archive still cannot unlock implementation authorization. It is read-only and cannot accept archives, accept final decisions, record go/no-go, authorize, deploy, or write data.",
    yes: "Yes",
    no: "No",
    mode: "Mode",
    sourceMode: "Source archive mode",
    checkedAt: "Checked at",
    noGoItems: "No-go items",
    archiveNoGo: "Archive no-go",
    externalNoGo: "External evidence no-go",
    manualNoGo: "Manual reviewer no-go",
    stillBlocked: "Archive still blocked",
    sourceItems: "Source archive items",
    sourceIncomplete: "Source incomplete",
    sourceComplete: "Source complete",
    evidence: "Blocking evidence",
    gaps: "Unresolved gaps",
    shortcuts: "Forbidden shortcuts",
    prerequisites: "Future prerequisites",
    safetyState: "Safety state",
    runtimeState: "Runtime state",
    packetReady: "Archive no-go packet ready",
    packetOnly: "Archive no-go packet only",
    sourceReady: "Source archive checklist ready",
    sourceOnly: "Source archive checklist only",
    sourceFinalReady: "Source final decision ready",
    sourceFinalOnly: "Source final decision only",
    releaseBlocked: "Source release still blocked",
    archiveAccepted: "External archive accepted",
    archiveCompleteAccepted: "Archive completeness accepted",
    noGoAccepted: "Archive no-go accepted",
    noGoRecorded: "Archive no-go recorded",
    finalAccepted: "Final decision accepted",
    finalRecorded: "Final decision recorded",
    authorizationGranted: "Implementation authorization granted",
    readyForAdapter: "Ready for adapter implementation",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldAcceptNoGo: "Would accept archive no-go",
    wouldRecordNoGo: "Would record archive no-go",
    wouldDenyFromNoGo: "Would deny authorization from archive no-go",
    wouldPromote: "Would promote archive no-go to final decision",
    wouldAcceptArchive: "Would accept external archive",
    wouldStoreArchive: "Would store archive artifact",
    wouldUploadArchive: "Would upload archive artifact",
    wouldReadArchive: "Would read archive artifact",
    wouldHashArchive: "Would hash archive artifact",
    wouldPersistIndex: "Would persist archive index",
    wouldMarkComplete: "Would mark archive complete",
    wouldAcceptFinal: "Would accept final decision",
    wouldRecordFinal: "Would record final decision",
    wouldServiceRole: "Would create service-role client",
    wouldTransaction: "Would run transaction",
    wouldWriteRows: "Would write rows",
    rules: "Archive no-go rules",
    boundaryRules: "Implementation boundary rules",
    blockedCodes: "Blocked codes",
    noGoQuestion: "No-go question",
    noGoConclusion: "No-go conclusion",
    blockingEvidence: "Blocking archive evidence",
    unresolvedGaps: "Unresolved archive gaps",
    futurePrerequisites: "Future resolution prerequisites",
    safeRefs: "Safe archive refs",
    redactionRules: "Redaction rules",
    clauses: "Non-acceptance clauses",
    sourceIds: "Source ids",
    sourceRefs: "Source refs",
    nextSafeAction: "Next safe action",
    owner: "Owner",
    probe: "Probe no-go",
    probePanel: "Blocked probe result",
    probeBody:
      "Probe one archive no-go item to confirm this stage remains read-only and blocked.",
    loading: "Checking",
    openSourceArchive: "Open source archive checklist",
    openDashboard: "Back to dashboard",
    statusLabels: {
      archive_no_go_external_evidence_missing:
        "No-go: external evidence missing",
      archive_no_go_manual_reviewer_missing: "No-go: manual reviewer missing",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoStatus,
      string
    >,
  },
  zh: {
    title: "持久化授权重审最终决策归档 No-go",
    status: "仅归档 No-go 包",
    body: "这个包说明为什么外部最终决策归档仍然不能解锁实现授权。它只读，不能接受归档、接受最终决策、记录 Go/No-go、授权、部署或写入数据。",
    yes: "是",
    no: "否",
    mode: "模式",
    sourceMode: "来源归档模式",
    checkedAt: "检查时间",
    noGoItems: "No-go 项",
    archiveNoGo: "归档 No-go",
    externalNoGo: "外部证据 No-go",
    manualNoGo: "人工复核 No-go",
    stillBlocked: "归档仍阻断",
    sourceItems: "来源归档项",
    sourceIncomplete: "来源未完成",
    sourceComplete: "来源已完成",
    evidence: "阻断证据",
    gaps: "未解决缺口",
    shortcuts: "禁止捷径",
    prerequisites: "未来前置条件",
    safetyState: "安全状态",
    runtimeState: "运行时状态",
    packetReady: "归档 No-go 包已就绪",
    packetOnly: "仅归档 No-go 包",
    sourceReady: "来源归档清单已就绪",
    sourceOnly: "来源归档清单只读",
    sourceFinalReady: "来源最终决策已就绪",
    sourceFinalOnly: "来源最终决策只读",
    releaseBlocked: "来源发布仍阻断",
    archiveAccepted: "外部归档已接受",
    archiveCompleteAccepted: "归档完整性已接受",
    noGoAccepted: "归档 No-go 已接受",
    noGoRecorded: "归档 No-go 已记录",
    finalAccepted: "最终决策已接受",
    finalRecorded: "最终决策已记录",
    authorizationGranted: "实现授权已授予",
    readyForAdapter: "可实现适配器",
    allRuntimeBlocked: "全部运行时副作用已阻断",
    wouldAcceptNoGo: "会接受归档 No-go",
    wouldRecordNoGo: "会记录归档 No-go",
    wouldDenyFromNoGo: "会由归档 No-go 否决授权",
    wouldPromote: "会将归档 No-go 推进为最终决策",
    wouldAcceptArchive: "会接受外部归档",
    wouldStoreArchive: "会存储归档工件",
    wouldUploadArchive: "会上传归档工件",
    wouldReadArchive: "会读取归档工件",
    wouldHashArchive: "会哈希归档工件",
    wouldPersistIndex: "会持久化归档索引",
    wouldMarkComplete: "会标记归档完成",
    wouldAcceptFinal: "会接受最终决策",
    wouldRecordFinal: "会记录最终决策",
    wouldServiceRole: "会创建 service-role client",
    wouldTransaction: "会运行 transaction",
    wouldWriteRows: "会写入数据行",
    rules: "归档 No-go 规则",
    boundaryRules: "实现边界规则",
    blockedCodes: "阻断代码",
    noGoQuestion: "No-go 问题",
    noGoConclusion: "No-go 结论",
    blockingEvidence: "归档阻断证据",
    unresolvedGaps: "未解决归档缺口",
    futurePrerequisites: "未来解决前置条件",
    safeRefs: "安全归档引用",
    redactionRules: "脱敏规则",
    clauses: "非接受条款",
    sourceIds: "来源 ID",
    sourceRefs: "来源引用",
    nextSafeAction: "下一安全动作",
    owner: "负责人",
    probe: "探测 No-go",
    probePanel: "阻断探测结果",
    probeBody: "探测一个归档 No-go 项，确认该阶段仍然只读且被阻断。",
    loading: "检查中",
    openSourceArchive: "打开来源归档清单",
    openDashboard: "返回工作台",
    statusLabels: {
      archive_no_go_external_evidence_missing: "No-go：外部证据缺失",
      archive_no_go_manual_reviewer_missing: "No-go：人工复核缺失",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoStatus,
      string
    >,
  },
} as const;

type NoGoCopy = (typeof noGoCopy)[keyof typeof noGoCopy];

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

function statusTone(
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoStatus,
) {
  return status === "archive_no_go_external_evidence_missing"
    ? "blocked"
    : "planned";
}

function ArchiveNoGoCard({
  item,
  copy,
  onProbe,
  probingId,
}: {
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoItem;
  copy: NoGoCopy;
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

      <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">
        <p>
          <span className="font-semibold">{copy.noGoQuestion}: </span>
          {item.noGoQuestion}
        </p>
        <p className="mt-2">
          <span className="font-semibold">{copy.noGoConclusion}: </span>
          {item.noGoConclusion}
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.blockingEvidence}
          </h4>
          <TextList items={item.blockingArchiveEvidence} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.unresolvedGaps}
          </h4>
          <TextList items={item.unresolvedArchiveGaps} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.futurePrerequisites}
          </h4>
          <TextList items={item.futureResolutionPrerequisites} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.redactionRules}
          </h4>
          <TextList items={item.redactionRules} />
        </section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.shortcuts}
          </h4>
          <TextList items={item.forbiddenShortcuts} />
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
              ...item.sourceArchiveItemIds,
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
          <TextList items={item.safeArchiveRefs} />
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

export function WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoClientPage({
  payload,
}: ClientPageProps) {
  const { locale } = useLanguage();
  const copy = noGoCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoProbeResult | null>(
      null,
    );
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags = [
    {
      value: payload.externalFinalDecisionArchiveNoGoPacketReady,
      label: copy.packetReady,
    },
    {
      value: payload.externalFinalDecisionArchiveNoGoPacketOnly,
      label: copy.packetOnly,
    },
    {
      value: payload.sourceExternalFinalDecisionArchiveChecklistReady,
      label: copy.sourceReady,
    },
    {
      value: payload.sourceExternalFinalDecisionArchiveChecklistOnly,
      label: copy.sourceOnly,
    },
    {
      value: payload.sourceFinalDecisionPacketReady,
      label: copy.sourceFinalReady,
    },
    {
      value: payload.sourceFinalDecisionPacketOnly,
      label: copy.sourceFinalOnly,
    },
    { value: payload.sourceReleaseStillBlocked, label: copy.releaseBlocked },
    { value: payload.allRuntimeEffectsBlocked, label: copy.allRuntimeBlocked },
  ];

  const falseFlags = [
    {
      value: payload.externalFinalDecisionArchiveAccepted,
      label: copy.archiveAccepted,
    },
    {
      value: payload.finalDecisionArchiveCompletenessAccepted,
      label: copy.archiveCompleteAccepted,
    },
    { value: payload.finalDecisionArchiveNoGoAccepted, label: copy.noGoAccepted },
    { value: payload.finalDecisionArchiveNoGoRecorded, label: copy.noGoRecorded },
    {
      value: payload.authorizationReconsiderationFinalDecisionAccepted,
      label: copy.finalAccepted,
    },
    {
      value: payload.authorizationReconsiderationFinalDecisionRecorded,
      label: copy.finalRecorded,
    },
    {
      value: payload.implementationAuthorizationGranted,
      label: copy.authorizationGranted,
    },
    { value: payload.readyForAdapterImplementation, label: copy.readyForAdapter },
  ];

  const runtimeFlags = [
    {
      value: payload.wouldAcceptExternalFinalDecisionArchiveNoGo,
      label: copy.wouldAcceptNoGo,
    },
    {
      value: payload.wouldRecordExternalFinalDecisionArchiveNoGo,
      label: copy.wouldRecordNoGo,
    },
    {
      value: payload.wouldDenyImplementationAuthorizationFromArchiveNoGo,
      label: copy.wouldDenyFromNoGo,
    },
    {
      value: payload.wouldPromoteArchiveNoGoToFinalDecision,
      label: copy.wouldPromote,
    },
    {
      value: payload.wouldAcceptExternalFinalDecisionArchive,
      label: copy.wouldAcceptArchive,
    },
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
    { value: payload.wouldAcceptFinalDecision, label: copy.wouldAcceptFinal },
    { value: payload.wouldRecordFinalDecision, label: copy.wouldRecordFinal },
    { value: payload.wouldCreateServiceRoleClient, label: copy.wouldServiceRole },
    { value: payload.wouldRunTransaction, label: copy.wouldTransaction },
    { value: payload.wouldWriteRows, label: copy.wouldWriteRows },
  ];

  async function probeItem(itemId: string) {
    setProbingId(itemId);
    setProbeResult(null);

    try {
      const response = await fetch(
        "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-no-go",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoProbeResult;
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
        <Stat label={copy.mode} value={payload.externalFinalDecisionArchiveNoGoMode} />
        <Stat label={copy.sourceMode} value={payload.sourceExternalFinalDecisionArchiveMode} />
        <Stat label={copy.noGoItems} value={payload.noGoItemCount} />
        <Stat label={copy.archiveNoGo} value={payload.archiveNoGoCount} />
        <Stat label={copy.externalNoGo} value={payload.externalEvidenceArchiveNoGoCount} />
        <Stat label={copy.manualNoGo} value={payload.manualReviewerArchiveNoGoCount} />
        <Stat label={copy.stillBlocked} value={payload.archiveStillBlockedCount} />
        <Stat label={copy.sourceItems} value={payload.sourceArchiveItemCount} />
        <Stat label={copy.sourceIncomplete} value={payload.sourceArchiveIncompleteCount} />
        <Stat label={copy.sourceComplete} value={payload.sourceArchiveCompleteCount} />
        <Stat label={copy.evidence} value={payload.blockingArchiveEvidenceCount} />
        <Stat label={copy.gaps} value={payload.unresolvedArchiveGapCount} />
        <Stat label={copy.shortcuts} value={payload.forbiddenShortcutCount} />
        <Stat label={copy.prerequisites} value={payload.futureResolutionPrerequisiteCount} />
        <Stat label={copy.checkedAt} value={payload.checkedAt} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.rules}
            </h2>
            <TextList items={payload.archiveNoGoRules} />
          </section>

          {payload.archiveNoGoItems.map((item) => (
            <ArchiveNoGoCard
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
            <TextList items={payload.implementationBoundaryRules} />
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
                  {copy.mode}: {probeResult.externalFinalDecisionArchiveNoGoMode}
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
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive"
                className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                {copy.openSourceArchive}
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
