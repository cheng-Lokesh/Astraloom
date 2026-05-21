"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review";

type ClientPageProps = {
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewPayload;
};

const publicApiPath =
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review";

const copy = {
  en: {
    title:
      "Persistence authorization archive reconciliation remediation review",
    badge: "Remediation review checklist only",
    body: "This checklist reviews the Stage69 remediation plan shape from safe metadata only. It cannot accept remediation, record evidence, resolve blockers, authorize implementation, create files, or write rows.",
    yes: "Yes",
    no: "No",
    mode: "Mode",
    sourceMode: "Source remediation mode",
    checkedAt: "Checked at",
    reviewItems: "Review items",
    externalMissing: "External evidence missing",
    manualRequired: "Manual reviewer required",
    stillBlocked: "Still blocked",
    completeness: "Completeness checks",
    manualChecks: "Manual reviewer checks",
    redaction: "Redaction checks",
    rejection: "Rejection triggers",
    passCriteria: "Future pass criteria",
    failCriteria: "Current fail criteria",
    blockedReasons: "Blocked reasons",
    sourceItems: "Source remediation items",
    sourceExternal: "Source external required",
    sourceManual: "Source manual required",
    sourceBlocked: "Source still blocked",
    rules: "Review rules",
    rejectionRules: "Rejection rules",
    safetyState: "Safety state",
    runtimeState: "Runtime state",
    question: "Review question",
    finding: "Current finding",
    requiredState: "Required external state",
    safeRefs: "Safe evidence refs",
    clauses: "Non-acceptance clauses",
    sourceIds: "Source ids",
    sourceRefs: "Source refs",
    nextSafeAction: "Next safe action",
    owner: "Owner",
    probe: "Probe review",
    probing: "Checking",
    probePanel: "Blocked probe result",
    probeBody:
      "Probe one remediation review item to confirm this checklist remains read-only and blocked.",
    openSourceRemediation: "Open source remediation plan",
    openDashboard: "Back to dashboard",
    statusLabels: {
      archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_external_evidence_missing:
        "External evidence missing",
      archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_manual_reviewer_required:
        "Manual reviewer required",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewStatus,
      string
    >,
  },
  zh: {
    title: "持久化授权归档 Reconcile 补救复核",
    badge: "仅补救复核清单",
    body: "这个清单只从安全元数据复核 Stage69 的补救计划形状。它不能接受补救、记录证据、解决阻断、授权实现、创建文件或写入数据。",
    yes: "是",
    no: "否",
    mode: "模式",
    sourceMode: "来源补救模式",
    checkedAt: "检查时间",
    reviewItems: "复核项",
    externalMissing: "外部证据缺失",
    manualRequired: "需要人工复核",
    stillBlocked: "仍然阻断",
    completeness: "完整性检查",
    manualChecks: "人工复核检查",
    redaction: "脱敏检查",
    rejection: "拒绝触发条件",
    passCriteria: "后续通过条件",
    failCriteria: "当前失败条件",
    blockedReasons: "阻断原因",
    sourceItems: "来源补救项",
    sourceExternal: "来源外部证据要求",
    sourceManual: "来源人工复核要求",
    sourceBlocked: "来源仍阻断",
    rules: "复核规则",
    rejectionRules: "拒绝规则",
    safetyState: "安全状态",
    runtimeState: "运行时状态",
    question: "复核问题",
    finding: "当前结论",
    requiredState: "所需外部状态",
    safeRefs: "安全证据引用",
    clauses: "非接受条款",
    sourceIds: "来源 ID",
    sourceRefs: "来源引用",
    nextSafeAction: "下一步安全动作",
    owner: "负责人",
    probe: "探测复核",
    probing: "检查中",
    probePanel: "阻断探测结果",
    probeBody: "探测一个补救复核项，确认这个清单仍然只读且保持阻断。",
    openSourceRemediation: "打开来源补救计划",
    openDashboard: "返回工作台",
    statusLabels: {
      archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_external_evidence_missing:
        "外部证据缺失",
      archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_manual_reviewer_required:
        "需要人工复核",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewStatus,
      string
    >,
  },
} as const;

type Copy = (typeof copy)[keyof typeof copy];

function statusTone(
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewStatus,
) {
  return status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_external_evidence_missing"
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
  copy: Copy;
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
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItem;
  copy: Copy;
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

      <div className="mt-4 rounded-md border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950">
        <p>
          <span className="font-semibold">{copy.question}: </span>
          {item.reviewQuestion}
        </p>
        <p className="mt-2">
          <span className="font-semibold">{copy.finding}: </span>
          {item.currentFinding}
        </p>
        <p className="mt-2 break-words">
          <span className="font-semibold">{copy.requiredState}: </span>
          {item.requiredExternalState}
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.safeRefs}
          </h4>
          <TextList items={item.safeEvidenceRefs} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.completeness}
          </h4>
          <TextList items={item.completenessChecks} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.manualChecks}
          </h4>
          <TextList items={item.manualReviewerChecks} />
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
            {copy.blockedReasons}
          </h4>
          <TextList items={item.stillBlockedBecause} />
        </section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.passCriteria}
          </h4>
          <TextList items={item.passCriteriaForFutureReview} />
          <h4 className="mt-4 text-sm font-semibold text-slate-950">
            {copy.failCriteria}
          </h4>
          <TextList items={item.failCriteriaForCurrentReview} />
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
              ...item.sourceNoGoRemediationItemIds,
              ...item.sourceReconciliationNoGoItemIds,
              ...item.sourceReconciliationItemIds,
              ...item.sourceNoGoItemIds,
              ...item.sourceReviewItemIds,
              ...item.sourceRemediationItemIds,
              ...item.sourceArchiveNoGoItemIds,
              ...item.sourceArchiveRemediationItemIds,
              ...item.sourceArchiveItemIds,
              ...item.sourceDecisionItemIds,
            ]}
          />
          <h4 className="mt-4 text-sm font-semibold text-slate-950">
            {copy.sourceRefs}
          </h4>
          <TextList items={item.sourceRefs} />
          <p className="mt-4 rounded-md bg-white px-3 py-2 text-sm leading-6 text-slate-600">
            <span className="font-semibold">{copy.nextSafeAction}: </span>
            {item.nextSafeAction}
          </p>
        </section>
      </div>

      <button
        type="button"
        onClick={() => onProbe(item.id)}
        disabled={probingId === item.id}
        className="mt-5 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {probingId === item.id ? copy.probing : copy.probe}
      </button>
    </article>
  );
}

export function WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewClientPage({
  payload,
}: ClientPageProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewProbeResult | null>(
      null,
    );
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags = [
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistReady,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistReady",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistOnly,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistOnly",
    },
    {
      value:
        payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanReady,
      label:
        "sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanReady",
    },
    {
      value:
        payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanOnly,
      label:
        "sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanOnly",
    },
    { value: payload.allRuntimeEffectsBlocked, label: "allRuntimeEffectsBlocked" },
  ];

  const falseFlags = [
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewAccepted,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewAccepted",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewRecorded,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewRecorded",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewComplete,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewComplete",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationAccepted,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationAccepted",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationRecorded,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationRecorded",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationStatesAccepted,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationStatesAccepted",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoAccepted,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoAccepted",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationAccepted,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationAccepted",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted",
    },
    {
      value: payload.authorizationReconsiderationFinalDecisionAccepted,
      label: "authorizationReconsiderationFinalDecisionAccepted",
    },
    {
      value: payload.implementationAuthorizationGranted,
      label: "implementationAuthorizationGranted",
    },
    {
      value: payload.readyForAdapterImplementation,
      label: "readyForAdapterImplementation",
    },
  ];

  const runtimeFlags = [
    {
      value:
        payload.wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview,
      label:
        "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview",
    },
    {
      value:
        payload.wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview,
      label:
        "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview",
    },
    {
      value:
        payload.wouldStoreFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewEvidence,
      label:
        "wouldStoreFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewEvidence",
    },
    {
      value:
        payload.wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewed,
      label:
        "wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewed",
    },
    {
      value:
        payload.wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo,
      label:
        "wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo",
    },
    {
      value: payload.wouldCreateServiceRoleClient,
      label: "wouldCreateServiceRoleClient",
    },
    { value: payload.wouldRunTransaction, label: "wouldRunTransaction" },
    { value: payload.wouldWriteRows, label: "wouldWriteRows" },
  ];

  async function probeItem(itemId: string) {
    setProbingId(itemId);
    setProbeResult(null);

    try {
      const response = await fetch(publicApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const result =
        (await response.json()) as WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewProbeResult;
      setProbeResult(result);
    } finally {
      setProbingId(null);
    }
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">{t.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {t.body}
          </p>
        </div>
        <StatusPill tone="planned">{t.badge}</StatusPill>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          label={t.mode}
          value={
            payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistMode
          }
        />
        <Stat
          label={t.sourceMode}
          value={
            payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationMode
          }
        />
        <Stat label={t.reviewItems} value={payload.reviewItemCount} />
        <Stat
          label={t.externalMissing}
          value={payload.externalEvidenceMissingCount}
        />
        <Stat
          label={t.manualRequired}
          value={payload.manualReviewerRequiredCount}
        />
        <Stat
          label={t.stillBlocked}
          value={payload.reconciliationNoGoRemediationStillBlockedCount}
        />
        <Stat label={t.completeness} value={payload.completenessCheckCount} />
        <Stat label={t.manualChecks} value={payload.manualReviewerCheckCount} />
        <Stat label={t.redaction} value={payload.redactionCheckCount} />
        <Stat label={t.rejection} value={payload.rejectionTriggerCount} />
        <Stat label={t.passCriteria} value={payload.passCriteriaCount} />
        <Stat label={t.failCriteria} value={payload.failCriteriaCount} />
        <Stat label={t.blockedReasons} value={payload.stillBlockedReasonCount} />
        <Stat
          label={t.sourceItems}
          value={payload.sourceNoGoRemediationItemCount}
        />
        <Stat
          label={t.sourceExternal}
          value={payload.sourceExternalReconciliationNoGoRemediationRequiredCount}
        />
        <Stat
          label={t.sourceManual}
          value={payload.sourceManualReconciliationNoGoReviewRequiredCount}
        />
        <Stat
          label={t.sourceBlocked}
          value={payload.sourceReconciliationNoGoStillBlockedCount}
        />
        <Stat label={t.checkedAt} value={payload.checkedAt} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.rules}
            </h2>
            <TextList
              items={
                payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistRules
              }
            />
          </section>

          {payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems.map(
            (item) => (
              <ReviewItemCard
                key={item.id}
                item={item}
                copy={t}
                onProbe={probeItem}
                probingId={probingId}
              />
            ),
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.safetyState}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {trueFlags.map((flag) => (
                <BooleanPill
                  key={flag.label}
                  value={flag.value}
                  label={flag.label}
                  copy={t}
                />
              ))}
              {falseFlags.map((flag) => (
                <BooleanPill
                  key={flag.label}
                  value={flag.value}
                  label={flag.label}
                  copy={t}
                  readyWhenTrue={false}
                />
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.runtimeState}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {runtimeFlags.map((flag) => (
                <BooleanPill
                  key={flag.label}
                  value={flag.value}
                  label={flag.label}
                  copy={t}
                  readyWhenTrue={false}
                />
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.rejectionRules}
            </h2>
            <TextList
              items={
                payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewRejectionRules
              }
            />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.probePanel}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t.probeBody}
            </p>
            {probeResult ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                <p>{probeResult.summary}</p>
                {probeResult.itemId ? (
                  <p className="mt-2 break-words font-semibold">
                    {probeResult.itemId}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>

          <nav className="flex flex-col gap-2">
            <Link
              href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation"
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t.openSourceRemediation}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t.openDashboard}
            </Link>
          </nav>
        </aside>
      </div>
    </AppShell>
  );
}
