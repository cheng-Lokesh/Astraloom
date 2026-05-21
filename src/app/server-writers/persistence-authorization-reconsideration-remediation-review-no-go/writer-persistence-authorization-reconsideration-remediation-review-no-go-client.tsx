"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoItem,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoProbeResult,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-remediation-review-no-go";

type ClientPageProps = {
  payload: WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoPayload;
};

const noGoCopy = {
  en: {
    title:
      "Persistence authorization reconsideration remediation review no-go packet",
    status: "No-go only",
    body: "This packet explains why the reconsideration remediation review still cannot unlock implementation authorization. It remains read-only and cannot accept review outcomes, accept remediation, record no-go decisions, grant authorization, create implementation work, or write data.",
    yes: "Yes",
    no: "No",
    mode: "Mode",
    sourceMode: "Source review mode",
    checkedAt: "Checked at",
    itemCount: "No-go items",
    noGoCount: "External evidence no-go",
    manualBlocked: "Manual review blocked",
    stillBlocked: "Reconsideration still blocked",
    sourceItems: "Source review items",
    sourceExternal: "Source external evidence missing",
    sourceManual: "Source manual reviewer required",
    sourceStillBlocked: "Source still blocked",
    blockingEvidenceCount: "Blocking evidence refs",
    unresolvedGapCount: "Unresolved review gaps",
    forbiddenShortcutCount: "Forbidden shortcuts",
    prerequisiteCount: "Final decision prerequisites",
    safetyState: "Safety state",
    runtimeState: "Runtime state",
    packetReady: "No-go packet ready",
    packetOnly: "No-go packet only",
    sourceChecklistReady: "Source review checklist ready",
    sourceChecklistOnly: "Source review checklist only",
    sourcePlanReady: "Source remediation plan ready",
    sourcePlanOnly: "Source remediation plan only",
    sourceNoGoReady: "Source reconsideration no-go ready",
    sourceNoGoOnly: "Source reconsideration no-go only",
    sourcePreflightReady: "Source preflight ready",
    sourcePreflightOnly: "Source preflight only",
    sourceReviewReady: "Source original review no-go ready",
    sourceReviewOnly: "Source original review no-go only",
    releaseBlocked: "Source release still blocked",
    preflightAccepted: "Preflight accepted",
    preflightRecorded: "Preflight recorded",
    reconsiderationEligible: "Reconsideration eligible",
    noGoAccepted: "Reconsideration no-go accepted",
    noGoRecorded: "Reconsideration no-go recorded",
    remediationAccepted: "Reconsideration remediation accepted",
    remediationRecorded: "Reconsideration remediation recorded",
    reviewAccepted: "Reconsideration remediation review accepted",
    reviewRecorded: "Reconsideration remediation review recorded",
    reviewComplete: "Reconsideration remediation review complete",
    reviewNoGoAccepted: "Review no-go accepted",
    reviewNoGoRecorded: "Review no-go recorded",
    reconsiderationReady: "Authorization reconsideration ready",
    authorizationGranted: "Implementation authorization granted",
    readyForAdapter: "Ready for adapter implementation",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldAcceptNoGo: "Would accept review no-go",
    wouldRecordNoGo: "Would record review no-go",
    wouldDeny: "Would deny authorization from review",
    wouldPromote: "Would promote authorization reconsideration",
    wouldAcceptReview: "Would accept review",
    wouldRecordReview: "Would record review",
    wouldAcceptRemediation: "Would accept remediation",
    wouldAcceptPreflight: "Would accept preflight",
    wouldServiceRole: "Would create service-role client",
    wouldWriteRows: "Would write rows",
    wouldMigration: "Would create/apply migration",
    rules: "No-go rules",
    boundaryRules: "Final decision boundary rules",
    blockedCodes: "Blocked codes",
    question: "No-go question",
    conclusion: "No-go conclusion",
    blockingEvidence: "Blocking evidence",
    unresolvedGaps: "Unresolved review gaps",
    forbidden: "Forbidden shortcuts",
    prerequisites: "Final decision prerequisites",
    safeRefs: "Safe escalation refs",
    redaction: "Redaction rules",
    clauses: "Non-acceptance clauses",
    sourceIds: "Source ids",
    sourceRefs: "Source refs",
    nextSafeAction: "Next safe action",
    owner: "Owner",
    probe: "Probe item",
    probePanel: "Blocked probe result",
    probeBody:
      "Probe one no-go item to confirm this packet remains read-only and blocked.",
    loading: "Checking",
    openSourceReview: "Open source review",
    openDashboard: "Back to dashboard",
    statusLabels: {
      no_go_external_evidence_missing: "External evidence no-go",
      manual_review_blocked: "Manual review blocked",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoStatus,
      string
    >,
  },
  zh: {
    title: "持久化实现授权重审补救复核 No-go 包",
    status: "仅 No-go",
    body: "这份包说明为什么重审补救复核仍不能解锁实现授权。它保持只读，不能接受复核结果、接受补救、记录 no-go 决策、授予授权、创建实现工作或写入数据。",
    yes: "是",
    no: "否",
    mode: "模式",
    sourceMode: "来源复核模式",
    checkedAt: "检查时间",
    itemCount: "No-go 项",
    noGoCount: "外部证据 No-go",
    manualBlocked: "人工复核阻断",
    stillBlocked: "重审仍阻断",
    sourceItems: "来源复核项",
    sourceExternal: "来源外部证据缺失",
    sourceManual: "来源需要人工复核",
    sourceStillBlocked: "来源仍阻断",
    blockingEvidenceCount: "阻断证据引用",
    unresolvedGapCount: "未解决复核缺口",
    forbiddenShortcutCount: "禁止捷径",
    prerequisiteCount: "最终决策前置条件",
    safetyState: "安全状态",
    runtimeState: "运行时状态",
    packetReady: "No-go 包已就绪",
    packetOnly: "仅 No-go 包",
    sourceChecklistReady: "来源复核清单已就绪",
    sourceChecklistOnly: "来源复核清单只读",
    sourcePlanReady: "来源补救计划已就绪",
    sourcePlanOnly: "来源补救计划只读",
    sourceNoGoReady: "来源重审 No-go 已就绪",
    sourceNoGoOnly: "来源重审 No-go 只读",
    sourcePreflightReady: "来源预检已就绪",
    sourcePreflightOnly: "来源预检只读",
    sourceReviewReady: "来源原始审查 No-go 已就绪",
    sourceReviewOnly: "来源原始审查 No-go 只读",
    releaseBlocked: "来源发布仍阻断",
    preflightAccepted: "预检已接受",
    preflightRecorded: "预检已记录",
    reconsiderationEligible: "可进入重审",
    noGoAccepted: "重审 No-go 已接受",
    noGoRecorded: "重审 No-go 已记录",
    remediationAccepted: "重审补救已接受",
    remediationRecorded: "重审补救已记录",
    reviewAccepted: "重审补救复核已接受",
    reviewRecorded: "重审补救复核已记录",
    reviewComplete: "重审补救复核已完成",
    reviewNoGoAccepted: "复核 No-go 已接受",
    reviewNoGoRecorded: "复核 No-go 已记录",
    reconsiderationReady: "授权重审已就绪",
    authorizationGranted: "已授予实现授权",
    readyForAdapter: "可实现适配器",
    allRuntimeBlocked: "所有运行时副作用均阻断",
    wouldAcceptNoGo: "会接受复核 No-go",
    wouldRecordNoGo: "会记录复核 No-go",
    wouldDeny: "会由复核拒绝授权",
    wouldPromote: "会推进授权重审",
    wouldAcceptReview: "会接受复核",
    wouldRecordReview: "会记录复核",
    wouldAcceptRemediation: "会接受补救",
    wouldAcceptPreflight: "会接受预检",
    wouldServiceRole: "会创建 service-role client",
    wouldWriteRows: "会写入数据行",
    wouldMigration: "会创建或应用 migration",
    rules: "No-go 规则",
    boundaryRules: "最终决策边界规则",
    blockedCodes: "阻断代码",
    question: "No-go 问题",
    conclusion: "No-go 结论",
    blockingEvidence: "阻断证据",
    unresolvedGaps: "未解决复核缺口",
    forbidden: "禁止捷径",
    prerequisites: "最终决策前置条件",
    safeRefs: "安全升级引用",
    redaction: "脱敏规则",
    clauses: "非接受条款",
    sourceIds: "来源 ID",
    sourceRefs: "来源引用",
    nextSafeAction: "下一安全动作",
    owner: "负责人",
    probe: "探测项目",
    probePanel: "阻断探测结果",
    probeBody: "探测一个 no-go 项，确认该包仍然只读且被阻断。",
    loading: "检查中",
    openSourceReview: "打开来源复核",
    openDashboard: "返回工作台",
    statusLabels: {
      no_go_external_evidence_missing: "外部证据 No-go",
      manual_review_blocked: "人工复核阻断",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoStatus,
      string
    >,
  },
} as const;

type NoGoCopy = (typeof noGoCopy)[keyof typeof noGoCopy];

function statusTone(
  status: WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoStatus,
) {
  return status === "no_go_external_evidence_missing" ? "blocked" : "planned";
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
      {items.map((item) => (
        <li key={item} className="rounded-md bg-slate-50 px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  );
}

function NoGoItemCard({
  item,
  copy,
  onProbe,
  probingId,
}: {
  item: WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoItem;
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
          <span className="font-semibold">{copy.question}: </span>
          {item.noGoQuestion}
        </p>
        <p className="mt-2">
          <span className="font-semibold">{copy.conclusion}: </span>
          {item.noGoConclusion}
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
          <TextList items={item.unresolvedReviewGaps} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.forbidden}
          </h4>
          <TextList items={item.forbiddenShortcuts} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.prerequisites}
          </h4>
          <TextList items={item.finalDecisionPrerequisites} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.safeRefs}
          </h4>
          <TextList items={item.safeEscalationRefs} />
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
              ...item.sourceReviewItemIds,
              ...item.sourceReconsiderationRemediationItemIds,
              ...item.sourceNoGoItemIds,
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

export function WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoClientPage({
  payload,
}: ClientPageProps) {
  const { locale } = useLanguage();
  const copy = noGoCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoProbeResult | null>(
      null,
    );
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags = [
    {
      value: payload.reconsiderationRemediationReviewNoGoPacketReady,
      label: copy.packetReady,
    },
    {
      value: payload.reconsiderationRemediationReviewNoGoPacketOnly,
      label: copy.packetOnly,
    },
    {
      value: payload.sourceReconsiderationRemediationReviewChecklistReady,
      label: copy.sourceChecklistReady,
    },
    {
      value: payload.sourceReconsiderationRemediationReviewChecklistOnly,
      label: copy.sourceChecklistOnly,
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
      value: payload.sourceReconsiderationNoGoPacketReady,
      label: copy.sourceNoGoReady,
    },
    {
      value: payload.sourceReconsiderationNoGoPacketOnly,
      label: copy.sourceNoGoOnly,
    },
    {
      value: payload.sourcePreflightChecklistReady,
      label: copy.sourcePreflightReady,
    },
    {
      value: payload.sourcePreflightChecklistOnly,
      label: copy.sourcePreflightOnly,
    },
    { value: payload.sourceReviewNoGoPacketReady, label: copy.sourceReviewReady },
    { value: payload.sourceReviewNoGoPacketOnly, label: copy.sourceReviewOnly },
    { value: payload.sourceReleaseStillBlocked, label: copy.releaseBlocked },
    { value: payload.allRuntimeEffectsBlocked, label: copy.allRuntimeBlocked },
  ];

  const falseFlags = [
    { value: payload.preflightAccepted, label: copy.preflightAccepted },
    { value: payload.preflightRecorded, label: copy.preflightRecorded },
    {
      value: payload.reconsiderationEligible,
      label: copy.reconsiderationEligible,
    },
    { value: payload.reconsiderationNoGoAccepted, label: copy.noGoAccepted },
    { value: payload.reconsiderationNoGoRecorded, label: copy.noGoRecorded },
    {
      value: payload.reconsiderationRemediationAccepted,
      label: copy.remediationAccepted,
    },
    {
      value: payload.reconsiderationRemediationRecorded,
      label: copy.remediationRecorded,
    },
    {
      value: payload.reconsiderationRemediationReviewAccepted,
      label: copy.reviewAccepted,
    },
    {
      value: payload.reconsiderationRemediationReviewRecorded,
      label: copy.reviewRecorded,
    },
    {
      value: payload.reconsiderationRemediationReviewComplete,
      label: copy.reviewComplete,
    },
    {
      value: payload.reconsiderationRemediationReviewNoGoAccepted,
      label: copy.reviewNoGoAccepted,
    },
    {
      value: payload.reconsiderationRemediationReviewNoGoRecorded,
      label: copy.reviewNoGoRecorded,
    },
    {
      value: payload.implementationAuthorizationReconsiderationReady,
      label: copy.reconsiderationReady,
    },
    {
      value: payload.implementationAuthorizationGranted,
      label: copy.authorizationGranted,
    },
    { value: payload.readyForAdapterImplementation, label: copy.readyForAdapter },
  ];

  const runtimeFlags = [
    {
      value: payload.wouldAcceptReconsiderationRemediationReviewNoGo,
      label: copy.wouldAcceptNoGo,
    },
    {
      value: payload.wouldRecordReconsiderationRemediationReviewNoGo,
      label: copy.wouldRecordNoGo,
    },
    {
      value:
        payload.wouldDenyImplementationAuthorizationFromReconsiderationReview,
      label: copy.wouldDeny,
    },
    {
      value: payload.wouldPromoteToAuthorizationReconsideration,
      label: copy.wouldPromote,
    },
    {
      value: payload.wouldAcceptReconsiderationRemediationReview,
      label: copy.wouldAcceptReview,
    },
    {
      value: payload.wouldRecordReconsiderationRemediationReview,
      label: copy.wouldRecordReview,
    },
    {
      value: payload.wouldAcceptReconsiderationRemediation,
      label: copy.wouldAcceptRemediation,
    },
    {
      value: payload.wouldAcceptReconsiderationPreflight,
      label: copy.wouldAcceptPreflight,
    },
    { value: payload.wouldCreateServiceRoleClient, label: copy.wouldServiceRole },
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
        "/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoProbeResult;
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
          value={payload.reconsiderationRemediationReviewNoGoMode}
        />
        <Stat
          label={copy.sourceMode}
          value={payload.sourceReconsiderationRemediationReviewChecklistMode}
        />
        <Stat label={copy.itemCount} value={payload.noGoItemCount} />
        <Stat label={copy.noGoCount} value={payload.noGoCount} />
        <Stat label={copy.manualBlocked} value={payload.manualReviewBlockedCount} />
        <Stat
          label={copy.stillBlocked}
          value={payload.reconsiderationStillBlockedCount}
        />
        <Stat label={copy.sourceItems} value={payload.sourceReviewItemCount} />
        <Stat
          label={copy.sourceExternal}
          value={payload.sourceExternalEvidenceMissingCount}
        />
        <Stat
          label={copy.sourceManual}
          value={payload.sourceManualReviewerRequiredCount}
        />
        <Stat
          label={copy.sourceStillBlocked}
          value={payload.sourceReconsiderationStillBlockedCount}
        />
        <Stat
          label={copy.blockingEvidenceCount}
          value={payload.blockingEvidenceCount}
        />
        <Stat
          label={copy.unresolvedGapCount}
          value={payload.unresolvedReviewGapCount}
        />
        <Stat
          label={copy.forbiddenShortcutCount}
          value={payload.forbiddenShortcutCount}
        />
        <Stat
          label={copy.prerequisiteCount}
          value={payload.finalDecisionPrerequisiteCount}
        />
        <Stat label={copy.checkedAt} value={payload.checkedAt} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.rules}
            </h2>
            <TextList items={payload.reviewNoGoRules} />
          </section>

          {payload.noGoItems.map((item) => (
            <NoGoItemCard
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
                  {probeResult.reconsiderationRemediationReviewNoGoMode}
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
                href="/server-writers/persistence-authorization-reconsideration-remediation-review"
                className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
              >
                {copy.openSourceReview}
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
