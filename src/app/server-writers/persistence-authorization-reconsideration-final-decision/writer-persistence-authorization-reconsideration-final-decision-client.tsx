"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision";

type ClientPageProps = {
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionPayload;
};

const finalDecisionCopy = {
  en: {
    title: "Persistence authorization reconsideration final decision packet",
    status: "Final no-go only",
    body: "This packet converts the reconsideration remediation review no-go result into a final read-only decision shape. It shows that the current final outcome is still no-go and that the app must not record, accept, deny, grant, implement, deploy, or write anything.",
    yes: "Yes",
    no: "No",
    mode: "Mode",
    sourceMode: "Source no-go mode",
    checkedAt: "Checked at",
    decisionItems: "Decision items",
    finalNoGo: "Final no-go",
    finalGo: "Final go",
    externalNoGo: "External evidence no-go",
    manualNoGo: "Manual review no-go",
    stillBlocked: "Authorization still blocked",
    sourceItems: "Source no-go items",
    sourceNoGo: "Source no-go count",
    sourceManual: "Source manual blocked",
    sourceStillBlocked: "Source still blocked",
    gaps: "Decision gaps",
    shortcuts: "Forbidden go shortcuts",
    prerequisites: "Future go prerequisites",
    safetyState: "Safety state",
    runtimeState: "Runtime state",
    packetReady: "Final decision packet ready",
    packetOnly: "Final decision packet only",
    finalNoGoReady: "Final no-go packet ready",
    finalNoGoOnly: "Final no-go packet only",
    sourceNoGoReady: "Source review no-go ready",
    sourceNoGoOnly: "Source review no-go only",
    sourceReviewReady: "Source reconsideration review ready",
    sourceReviewOnly: "Source reconsideration review only",
    sourcePlanReady: "Source remediation plan ready",
    sourcePlanOnly: "Source remediation plan only",
    sourcePreflightReady: "Source preflight ready",
    sourcePreflightOnly: "Source preflight only",
    releaseBlocked: "Source release still blocked",
    finalGoReady: "Final go ready",
    finalGoRecorded: "Final go recorded",
    finalNoGoAccepted: "Final no-go accepted",
    finalNoGoRecorded: "Final no-go recorded",
    finalDecisionAccepted: "Final decision accepted",
    finalDecisionRecorded: "Final decision recorded",
    reconsiderationReady: "Authorization reconsideration ready",
    authorizationGranted: "Implementation authorization granted",
    implementationAuthorized: "Implementation authorized",
    decisionRecorded: "Authorization decision recorded",
    artifactStored: "Authorization artifact stored",
    readyForAdapter: "Ready for adapter implementation",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldAcceptFinal: "Would accept final decision",
    wouldRecordFinal: "Would record final decision",
    wouldAcceptFinalNoGo: "Would accept final no-go",
    wouldRecordFinalNoGo: "Would record final no-go",
    wouldRecordFinalGo: "Would record final go",
    wouldGrantFromFinal: "Would grant from final decision",
    wouldDenyFromFinal: "Would deny from final decision",
    wouldServiceRole: "Would create service-role client",
    wouldTransaction: "Would run transaction",
    wouldWriteRows: "Would write rows",
    wouldMigration: "Would create/apply migration",
    rules: "Final decision rules",
    boundaryRules: "Boundary rules",
    blockedCodes: "Blocked codes",
    question: "Final question",
    conclusion: "Final conclusion",
    blockingEvidence: "Blocking evidence",
    unresolvedGaps: "Unresolved decision gaps",
    forbidden: "Forbidden go shortcuts",
    goPrereqs: "Future go prerequisites",
    safeRefs: "Safe decision refs",
    redaction: "Redaction rules",
    clauses: "Non-acceptance clauses",
    sourceIds: "Source ids",
    sourceRefs: "Source refs",
    nextSafeAction: "Next safe action",
    owner: "Owner",
    probe: "Probe item",
    probePanel: "Blocked probe result",
    probeBody:
      "Probe one final decision item to confirm this packet remains read-only and blocked.",
    loading: "Checking",
    openSourceNoGo: "Open source no-go",
    openDashboard: "Back to dashboard",
    statusLabels: {
      final_no_go_external_evidence_missing: "Final no-go: external evidence",
      final_no_go_manual_review_blocked: "Final no-go: manual review",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionStatus,
      string
    >,
  },
  zh: {
    title: "持久化授权重审最终决策包",
    status: "仅最终 No-go",
    body: "这个包把“重审补救复核 No-go”的结果提升为最终只读决策形态。当前结论仍然是全量 no-go，并且应用不能记录、接受、拒绝、授予、实现、部署或写入任何内容。",
    yes: "是",
    no: "否",
    mode: "模式",
    sourceMode: "来源 No-go 模式",
    checkedAt: "检查时间",
    decisionItems: "决策项",
    finalNoGo: "最终 No-go",
    finalGo: "最终 Go",
    externalNoGo: "外部证据 No-go",
    manualNoGo: "人工复核 No-go",
    stillBlocked: "授权仍被阻断",
    sourceItems: "来源 No-go 项",
    sourceNoGo: "来源 No-go 数",
    sourceManual: "来源人工阻断",
    sourceStillBlocked: "来源仍阻断",
    gaps: "决策缺口",
    shortcuts: "禁止的 Go 捷径",
    prerequisites: "未来 Go 前置条件",
    safetyState: "安全状态",
    runtimeState: "运行时状态",
    packetReady: "最终决策包已就绪",
    packetOnly: "仅最终决策包",
    finalNoGoReady: "最终 No-go 包已就绪",
    finalNoGoOnly: "仅最终 No-go 包",
    sourceNoGoReady: "来源复核 No-go 已就绪",
    sourceNoGoOnly: "来源复核 No-go 只读",
    sourceReviewReady: "来源重审复核已就绪",
    sourceReviewOnly: "来源重审复核只读",
    sourcePlanReady: "来源补救计划已就绪",
    sourcePlanOnly: "来源补救计划只读",
    sourcePreflightReady: "来源预检已就绪",
    sourcePreflightOnly: "来源预检只读",
    releaseBlocked: "来源发布仍阻断",
    finalGoReady: "最终 Go 已就绪",
    finalGoRecorded: "最终 Go 已记录",
    finalNoGoAccepted: "最终 No-go 已接受",
    finalNoGoRecorded: "最终 No-go 已记录",
    finalDecisionAccepted: "最终决策已接受",
    finalDecisionRecorded: "最终决策已记录",
    reconsiderationReady: "授权重审已就绪",
    authorizationGranted: "实现授权已授予",
    implementationAuthorized: "实现已授权",
    decisionRecorded: "授权决策已记录",
    artifactStored: "授权工件已存储",
    readyForAdapter: "可实现适配器",
    allRuntimeBlocked: "全部运行时副作用已阻断",
    wouldAcceptFinal: "会接受最终决策",
    wouldRecordFinal: "会记录最终决策",
    wouldAcceptFinalNoGo: "会接受最终 No-go",
    wouldRecordFinalNoGo: "会记录最终 No-go",
    wouldRecordFinalGo: "会记录最终 Go",
    wouldGrantFromFinal: "会由最终决策授予授权",
    wouldDenyFromFinal: "会由最终决策拒绝授权",
    wouldServiceRole: "会创建 service-role client",
    wouldTransaction: "会运行 transaction",
    wouldWriteRows: "会写入数据行",
    wouldMigration: "会创建或应用 migration",
    rules: "最终决策规则",
    boundaryRules: "边界规则",
    blockedCodes: "阻断代码",
    question: "最终问题",
    conclusion: "最终结论",
    blockingEvidence: "阻断证据",
    unresolvedGaps: "未解决决策缺口",
    forbidden: "禁止的 Go 捷径",
    goPrereqs: "未来 Go 前置条件",
    safeRefs: "安全决策引用",
    redaction: "脱敏规则",
    clauses: "非接受条款",
    sourceIds: "来源 ID",
    sourceRefs: "来源引用",
    nextSafeAction: "下一安全动作",
    owner: "负责人",
    probe: "探测项目",
    probePanel: "阻断探测结果",
    probeBody: "探测一个最终决策项，确认该包仍然只读且被阻断。",
    loading: "检查中",
    openSourceNoGo: "打开来源 No-go",
    openDashboard: "返回工作台",
    statusLabels: {
      final_no_go_external_evidence_missing: "最终 No-go：外部证据",
      final_no_go_manual_review_blocked: "最终 No-go：人工复核",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionStatus,
      string
    >,
  },
} as const;

type FinalDecisionCopy =
  (typeof finalDecisionCopy)[keyof typeof finalDecisionCopy];

function statusTone(
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionStatus,
) {
  return status === "final_no_go_external_evidence_missing"
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
  copy: FinalDecisionCopy;
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

function DecisionItemCard({
  item,
  copy,
  onProbe,
  probingId,
}: {
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionItem;
  copy: FinalDecisionCopy;
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

      <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-950">
        <p>
          <span className="font-semibold">{copy.question}: </span>
          {item.finalQuestion}
        </p>
        <p className="mt-2">
          <span className="font-semibold">{copy.conclusion}: </span>
          {item.finalConclusion}
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.blockingEvidence}
          </h4>
          <TextList items={item.blockingEvidence} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.unresolvedGaps}
          </h4>
          <TextList items={item.unresolvedDecisionGaps} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.forbidden}
          </h4>
          <TextList items={item.forbiddenGoShortcuts} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.goPrereqs}
          </h4>
          <TextList items={item.goPrerequisitesForFuture} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.safeRefs}
          </h4>
          <TextList items={item.safeDecisionRefs} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.redaction}
          </h4>
          <TextList items={item.redactionRules} />
        </section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-950">
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
              ...item.sourceNoGoItemIds,
              ...item.sourceReviewItemIds,
              ...item.sourceReconsiderationRemediationItemIds,
              ...item.sourcePreflightItemIds,
            ]}
          />
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

export function WriterPersistenceAuthorizationReconsiderationFinalDecisionClientPage({
  payload,
}: ClientPageProps) {
  const { locale } = useLanguage();
  const copy = finalDecisionCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationReconsiderationFinalDecisionProbeResult | null>(
      null,
    );
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags = [
    { value: payload.finalDecisionPacketReady, label: copy.packetReady },
    { value: payload.finalDecisionPacketOnly, label: copy.packetOnly },
    { value: payload.finalNoGoPacketReady, label: copy.finalNoGoReady },
    { value: payload.finalNoGoPacketOnly, label: copy.finalNoGoOnly },
    { value: payload.sourceReviewNoGoPacketReady, label: copy.sourceNoGoReady },
    { value: payload.sourceReviewNoGoPacketOnly, label: copy.sourceNoGoOnly },
    {
      value: payload.sourceReconsiderationRemediationReviewChecklistReady,
      label: copy.sourceReviewReady,
    },
    {
      value: payload.sourceReconsiderationRemediationReviewChecklistOnly,
      label: copy.sourceReviewOnly,
    },
    {
      value: payload.sourceReconsiderationRemediationPlanReady,
      label: copy.sourcePlanReady,
    },
    {
      value: payload.sourceReconsiderationRemediationPlanOnly,
      label: copy.sourcePlanOnly,
    },
    {
      value: payload.sourcePreflightChecklistReady,
      label: copy.sourcePreflightReady,
    },
    {
      value: payload.sourcePreflightChecklistOnly,
      label: copy.sourcePreflightOnly,
    },
    { value: payload.sourceReleaseStillBlocked, label: copy.releaseBlocked },
    { value: payload.allRuntimeEffectsBlocked, label: copy.allRuntimeBlocked },
  ];

  const falseFlags = [
    { value: payload.finalGoDecisionReady, label: copy.finalGoReady },
    { value: payload.finalGoDecisionRecorded, label: copy.finalGoRecorded },
    { value: payload.finalNoGoDecisionAccepted, label: copy.finalNoGoAccepted },
    { value: payload.finalNoGoDecisionRecorded, label: copy.finalNoGoRecorded },
    {
      value: payload.authorizationReconsiderationFinalDecisionAccepted,
      label: copy.finalDecisionAccepted,
    },
    {
      value: payload.authorizationReconsiderationFinalDecisionRecorded,
      label: copy.finalDecisionRecorded,
    },
    {
      value: payload.implementationAuthorizationReconsiderationReady,
      label: copy.reconsiderationReady,
    },
    {
      value: payload.implementationAuthorizationGranted,
      label: copy.authorizationGranted,
    },
    {
      value: payload.implementationAuthorized,
      label: copy.implementationAuthorized,
    },
    {
      value: payload.authorizationDecisionRecorded,
      label: copy.decisionRecorded,
    },
    { value: payload.authorizationArtifactStored, label: copy.artifactStored },
    { value: payload.readyForAdapterImplementation, label: copy.readyForAdapter },
  ];

  const runtimeFlags = [
    { value: payload.wouldAcceptFinalDecision, label: copy.wouldAcceptFinal },
    { value: payload.wouldRecordFinalDecision, label: copy.wouldRecordFinal },
    { value: payload.wouldAcceptFinalNoGo, label: copy.wouldAcceptFinalNoGo },
    { value: payload.wouldRecordFinalNoGo, label: copy.wouldRecordFinalNoGo },
    { value: payload.wouldRecordFinalGo, label: copy.wouldRecordFinalGo },
    {
      value: payload.wouldGrantImplementationAuthorizationFromFinalDecision,
      label: copy.wouldGrantFromFinal,
    },
    {
      value: payload.wouldDenyImplementationAuthorizationFromFinalDecision,
      label: copy.wouldDenyFromFinal,
    },
    { value: payload.wouldCreateServiceRoleClient, label: copy.wouldServiceRole },
    { value: payload.wouldRunTransaction, label: copy.wouldTransaction },
    { value: payload.wouldWriteRows, label: copy.wouldWriteRows },
    {
      value: payload.wouldCreateMigrationFile || payload.wouldApplyMigration,
      label: copy.wouldMigration,
    },
  ];

  async function probeItem(itemId: string) {
    setProbingId(itemId);
    setProbeResult(null);

    try {
      const response = await fetch(
        "/api/system-writers/persistence-authorization-reconsideration-final-decision",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceAuthorizationReconsiderationFinalDecisionProbeResult;
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
        <Stat
          label={copy.mode}
          value={payload.authorizationReconsiderationFinalDecisionMode}
        />
        <Stat
          label={copy.sourceMode}
          value={payload.sourceReconsiderationRemediationReviewNoGoMode}
        />
        <Stat label={copy.decisionItems} value={payload.decisionItemCount} />
        <Stat label={copy.finalNoGo} value={payload.finalNoGoCount} />
        <Stat label={copy.finalGo} value={payload.finalGoCount} />
        <Stat label={copy.externalNoGo} value={payload.externalEvidenceNoGoCount} />
        <Stat label={copy.manualNoGo} value={payload.manualReviewNoGoCount} />
        <Stat
          label={copy.stillBlocked}
          value={payload.authorizationStillBlockedCount}
        />
        <Stat label={copy.sourceItems} value={payload.sourceNoGoItemCount} />
        <Stat label={copy.sourceNoGo} value={payload.sourceNoGoCount} />
        <Stat label={copy.sourceManual} value={payload.sourceManualReviewBlockedCount} />
        <Stat
          label={copy.sourceStillBlocked}
          value={payload.sourceReconsiderationStillBlockedCount}
        />
        <Stat label={copy.gaps} value={payload.unresolvedDecisionGapCount} />
        <Stat label={copy.shortcuts} value={payload.forbiddenGoShortcutCount} />
        <Stat label={copy.prerequisites} value={payload.goPrerequisiteCount} />
        <Stat label={copy.checkedAt} value={payload.checkedAt} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.rules}
            </h2>
            <TextList items={payload.finalDecisionRules} />
          </section>

          {payload.decisionItems.map((item) => (
            <DecisionItemCard
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
            <TextList items={payload.finalDecisionBoundaryRules} />
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
                  {copy.mode}:{" "}
                  {probeResult.authorizationReconsiderationFinalDecisionMode}
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
                href="/server-writers/persistence-authorization-reconsideration-remediation-review-no-go"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                {copy.openSourceNoGo}
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
