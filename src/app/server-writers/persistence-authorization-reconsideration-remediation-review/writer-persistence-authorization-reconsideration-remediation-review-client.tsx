"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationReconsiderationRemediationReviewItem,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewPayload,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewProbeResult,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewStatus,
} from "@/types/writer-persistence-authorization-reconsideration-remediation-review";

type ClientPageProps = {
  payload: WriterPersistenceAuthorizationReconsiderationRemediationReviewPayload;
};

const reviewCopy = {
  en: {
    title: "Persistence authorization reconsideration remediation review",
    badge: "Review checklist only",
    body: "This page reviews whether reconsideration remediation states are externally checkable. It remains read-only and cannot accept remediation, store evidence, mark blockers reviewed, start reconsideration, grant authorization, or write data.",
    yes: "Yes",
    no: "No",
    mode: "Mode",
    sourceMode: "Source remediation mode",
    checkedAt: "Checked at",
    itemCount: "Review items",
    externalCount: "External evidence missing",
    manualCount: "Manual reviewer required",
    blockedCount: "Still blocked",
    completenessCount: "Completeness checks",
    redactionCount: "Redaction checks",
    rejectionCount: "Rejection triggers",
    sourceItems: "Source remediation items",
    sourceNoGoItems: "Source no-go items",
    sourceNoGoCount: "Source external no-go",
    sourceManualCount: "Source manual blocked",
    sourceStillBlocked: "Source still blocked",
    safetyState: "Safety state",
    runtimeState: "Runtime state",
    checklistReady: "Review checklist ready",
    checklistOnly: "Review checklist only",
    sourcePlanReady: "Source remediation plan ready",
    sourcePlanOnly: "Source remediation plan only",
    sourcePacketReady: "Source reconsideration no-go ready",
    sourcePacketOnly: "Source reconsideration no-go only",
    sourcePreflightReady: "Source preflight ready",
    sourcePreflightOnly: "Source preflight only",
    sourceReviewReady: "Source review no-go ready",
    sourceReviewOnly: "Source review no-go only",
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
    reconsiderationReady: "Authorization reconsideration ready",
    authorizationGranted: "Implementation authorization granted",
    readyForAdapter: "Ready for adapter implementation",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldAcceptReview: "Would accept reconsideration remediation review",
    wouldRecordReview: "Would record reconsideration remediation review",
    wouldStoreEvidence: "Would store review evidence",
    wouldMarkReviewed: "Would mark external remediation reviewed",
    wouldPromote: "Would promote to authorization reconsideration",
    wouldAcceptRemediation: "Would accept reconsideration remediation",
    wouldAcceptNoGo: "Would accept reconsideration no-go",
    wouldAcceptPreflight: "Would accept preflight",
    wouldServiceRole: "Would create service-role client",
    wouldWriteRows: "Would write rows",
    wouldMigration: "Would create/apply migration",
    rules: "Review checklist rules",
    rejectionRules: "Current rejection rules",
    blockedCodes: "Blocked codes",
    reviewQuestion: "Review question",
    requiredExternalState: "Required external state",
    safeRefs: "Safe external evidence refs",
    completeness: "Completeness checks",
    redaction: "Redaction checks",
    rejection: "Rejection triggers",
    clauses: "Non-acceptance clauses",
    futurePass: "Pass criteria for future review",
    currentFail: "Current fail criteria",
    stillBlocked: "Still blocked because",
    sourceIds: "Source ids",
    sourceRefs: "Source refs",
    nextGate: "Next gate",
    owner: "Owner",
    probe: "Probe item",
    probePanel: "Blocked probe result",
    probeBody:
      "Probe one review item to confirm this checklist remains read-only and blocked.",
    loading: "Checking",
    openPlan: "Open remediation plan",
    openDashboard: "Back to dashboard",
    statusLabels: {
      external_evidence_missing: "External evidence missing",
      manual_reviewer_required: "Manual reviewer required",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationRemediationReviewStatus,
      string
    >,
  },
  zh: {
    title: "持久化实现授权重审补救复核",
    badge: "仅复核清单",
    body: "这个页面只复核重审补救状态是否具备外部可检查性。它保持只读，不能接受补救、存储证据、标记阻断已复核、启动重审、授予授权或写入数据。",
    yes: "是",
    no: "否",
    mode: "模式",
    sourceMode: "来源补救模式",
    checkedAt: "检查时间",
    itemCount: "复核项",
    externalCount: "缺少外部证据",
    manualCount: "需要人工复核",
    blockedCount: "仍然阻断",
    completenessCount: "完整性检查",
    redactionCount: "脱敏检查",
    rejectionCount: "拒绝触发项",
    sourceItems: "来源补救项",
    sourceNoGoItems: "来源 no-go 项",
    sourceNoGoCount: "来源外部 no-go",
    sourceManualCount: "来源人工阻断",
    sourceStillBlocked: "来源仍阻断",
    safetyState: "安全状态",
    runtimeState: "运行时状态",
    checklistReady: "复核清单已就绪",
    checklistOnly: "仅复核清单",
    sourcePlanReady: "来源补救计划已就绪",
    sourcePlanOnly: "来源补救计划只读",
    sourcePacketReady: "来源重审 no-go 已就绪",
    sourcePacketOnly: "来源重审 no-go 只读",
    sourcePreflightReady: "来源预检已就绪",
    sourcePreflightOnly: "来源预检只读",
    sourceReviewReady: "来源审查 no-go 已就绪",
    sourceReviewOnly: "来源审查 no-go 只读",
    releaseBlocked: "来源发布仍阻断",
    preflightAccepted: "预检已接受",
    preflightRecorded: "预检已记录",
    reconsiderationEligible: "可进入重审",
    noGoAccepted: "重审 no-go 已接受",
    noGoRecorded: "重审 no-go 已记录",
    remediationAccepted: "重审补救已接受",
    remediationRecorded: "重审补救已记录",
    reviewAccepted: "重审补救复核已接受",
    reviewRecorded: "重审补救复核已记录",
    reviewComplete: "重审补救复核已完成",
    reconsiderationReady: "授权重审已就绪",
    authorizationGranted: "已授予实现授权",
    readyForAdapter: "可实现适配器",
    allRuntimeBlocked: "所有运行时副作用均阻断",
    wouldAcceptReview: "会接受重审补救复核",
    wouldRecordReview: "会记录重审补救复核",
    wouldStoreEvidence: "会存储复核证据",
    wouldMarkReviewed: "会标记外部补救已复核",
    wouldPromote: "会推进到授权重审",
    wouldAcceptRemediation: "会接受重审补救",
    wouldAcceptNoGo: "会接受重审 no-go",
    wouldAcceptPreflight: "会接受预检",
    wouldServiceRole: "会创建 service-role client",
    wouldWriteRows: "会写入数据行",
    wouldMigration: "会创建或应用 migration",
    rules: "复核清单规则",
    rejectionRules: "当前拒绝规则",
    blockedCodes: "阻断代码",
    reviewQuestion: "复核问题",
    requiredExternalState: "所需外部状态",
    safeRefs: "安全外部证据引用",
    completeness: "完整性检查",
    redaction: "脱敏检查",
    rejection: "拒绝触发项",
    clauses: "非接受条款",
    futurePass: "未来复核通过条件",
    currentFail: "当前复核失败条件",
    stillBlocked: "仍然阻断的原因",
    sourceIds: "来源 ID",
    sourceRefs: "来源引用",
    nextGate: "下一闸门",
    owner: "负责人",
    probe: "探测项目",
    probePanel: "阻断探测结果",
    probeBody: "探测一个复核项，确认该清单仍然只读且被阻断。",
    loading: "检查中",
    openPlan: "打开补救计划",
    openDashboard: "返回工作台",
    statusLabels: {
      external_evidence_missing: "缺少外部证据",
      manual_reviewer_required: "需要人工复核",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationRemediationReviewStatus,
      string
    >,
  },
} as const;

type ReviewCopy = (typeof reviewCopy)[keyof typeof reviewCopy];

function statusTone(
  status: WriterPersistenceAuthorizationReconsiderationRemediationReviewStatus,
) {
  return status === "external_evidence_missing" ? "blocked" : "planned";
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
  copy: ReviewCopy;
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

function ReviewItemCard({
  item,
  copy,
  onProbe,
  probingId,
}: {
  item: WriterPersistenceAuthorizationReconsiderationRemediationReviewItem;
  copy: ReviewCopy;
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
        <span className="font-semibold">{copy.reviewQuestion}: </span>
        {item.reviewQuestion}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.requiredExternalState}
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {item.requiredExternalState}
          </p>
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.safeRefs}
          </h4>
          <TextList items={item.safeExternalEvidenceRefs} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.completeness}
          </h4>
          <TextList items={item.completenessChecks} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.redaction}
          </h4>
          <TextList items={item.redactionChecks} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.rejection}
          </h4>
          <TextList items={item.rejectionTriggers} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.clauses}
          </h4>
          <TextList items={item.nonAcceptanceClauses} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.futurePass}
          </h4>
          <TextList items={item.passCriteriaForFutureReview} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.currentFail}
          </h4>
          <TextList items={item.failCriteriaForCurrentReview} />
        </section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-md border border-rose-200 bg-rose-50 p-4">
          <h4 className="text-sm font-semibold text-rose-950">
            {copy.stillBlocked}
          </h4>
          <TextList items={item.stillBlockedBecause} />
        </section>
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.sourceIds}
          </h4>
          <TextList
            items={[
              ...item.sourceReconsiderationRemediationItemIds,
              ...item.sourceNoGoItemIds,
              ...item.sourcePreflightItemIds,
            ]}
          />
          <h4 className="mt-4 text-sm font-semibold text-slate-950">
            {copy.sourceRefs}
          </h4>
          <TextList items={item.sourceRefs} />
          <p className="mt-4 rounded-md bg-white px-3 py-2 text-sm text-slate-600">
            {copy.nextGate}: {item.nextGate}
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

export function WriterPersistenceAuthorizationReconsiderationRemediationReviewClientPage({
  payload,
}: ClientPageProps) {
  const { locale } = useLanguage();
  const copy = reviewCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationReconsiderationRemediationReviewProbeResult | null>(
      null,
    );
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags = [
    {
      value: payload.reconsiderationRemediationReviewChecklistReady,
      label: copy.checklistReady,
    },
    {
      value: payload.reconsiderationRemediationReviewChecklistOnly,
      label: copy.checklistOnly,
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
      label: copy.sourcePacketReady,
    },
    {
      value: payload.sourceReconsiderationNoGoPacketOnly,
      label: copy.sourcePacketOnly,
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
      value: payload.wouldAcceptReconsiderationRemediationReview,
      label: copy.wouldAcceptReview,
    },
    {
      value: payload.wouldRecordReconsiderationRemediationReview,
      label: copy.wouldRecordReview,
    },
    {
      value: payload.wouldStoreReconsiderationRemediationReviewEvidence,
      label: copy.wouldStoreEvidence,
    },
    {
      value: payload.wouldMarkReconsiderationExternalRemediationReviewed,
      label: copy.wouldMarkReviewed,
    },
    {
      value: payload.wouldPromoteToAuthorizationReconsideration,
      label: copy.wouldPromote,
    },
    {
      value: payload.wouldAcceptReconsiderationRemediation,
      label: copy.wouldAcceptRemediation,
    },
    { value: payload.wouldAcceptReconsiderationNoGo, label: copy.wouldAcceptNoGo },
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
        "/api/system-writers/persistence-authorization-reconsideration-remediation-review",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceAuthorizationReconsiderationRemediationReviewProbeResult;
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
        <StatusPill tone="planned">{copy.badge}</StatusPill>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          label={copy.mode}
          value={payload.reconsiderationRemediationReviewChecklistMode}
        />
        <Stat
          label={copy.sourceMode}
          value={payload.sourceReconsiderationRemediationMode}
        />
        <Stat label={copy.itemCount} value={payload.reviewItemCount} />
        <Stat
          label={copy.externalCount}
          value={payload.externalEvidenceMissingCount}
        />
        <Stat label={copy.manualCount} value={payload.manualReviewerRequiredCount} />
        <Stat
          label={copy.blockedCount}
          value={payload.reconsiderationStillBlockedCount}
        />
        <Stat
          label={copy.completenessCount}
          value={payload.completenessCheckCount}
        />
        <Stat label={copy.redactionCount} value={payload.redactionCheckCount} />
        <Stat label={copy.rejectionCount} value={payload.rejectionTriggerCount} />
        <Stat label={copy.sourceItems} value={payload.sourceRemediationItemCount} />
        <Stat label={copy.sourceNoGoItems} value={payload.sourceNoGoItemCount} />
        <Stat label={copy.sourceNoGoCount} value={payload.sourceNoGoCount} />
        <Stat
          label={copy.sourceManualCount}
          value={payload.sourceManualReviewBlockedCount}
        />
        <Stat
          label={copy.sourceStillBlocked}
          value={payload.sourceReconsiderationStillBlockedCount}
        />
        <Stat label={copy.checkedAt} value={payload.checkedAt} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.rules}
            </h2>
            <TextList items={payload.reviewChecklistRules} />
          </section>

          {payload.reviewItems.map((item) => (
            <ReviewItemCard
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

          <section className="rounded-lg border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-rose-950">
              {copy.rejectionRules}
            </h2>
            <TextList items={payload.currentRejectionRules} />
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
                  {probeResult.reconsiderationRemediationReviewChecklistMode}
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
                href="/server-writers/persistence-authorization-reconsideration-remediation"
                className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                {copy.openPlan}
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
