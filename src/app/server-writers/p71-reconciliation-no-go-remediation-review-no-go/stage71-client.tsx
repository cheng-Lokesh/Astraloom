"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go";

type ClientPageProps = {
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPayload;
};

const publicApiPath =
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go";

const copy = {
  en: {
    title:
      "Persistence authorization archive reconciliation remediation review no-go",
    badge: "Remediation review no-go packet only",
    body: "This packet explains why the Stage70 remediation review checklist still cannot unlock implementation authorization. It remains read-only and cannot accept review outcomes, remediation, no-go outcomes, authorization denial, authorization grants, implementation work, or writes.",
    yes: "Yes",
    no: "No",
    mode: "Mode",
    sourceMode: "Source review mode",
    checkedAt: "Checked at",
    noGoItems: "No-go items",
    reviewNoGo: "Review no-go",
    externalNoGo: "External evidence no-go",
    manualNoGo: "Manual reviewer no-go",
    stillBlocked: "Still blocked",
    sourceItems: "Source review items",
    sourceExternal: "Source external missing",
    sourceManual: "Source manual required",
    sourceBlocked: "Source remediation blocked",
    blockerEvidence: "Blocker evidence",
    unresolvedGaps: "Unresolved review gaps",
    checklistFailures: "Source checklist failures",
    forbidden: "Forbidden shortcuts",
    prerequisites: "Future prerequisites",
    redaction: "Redaction rules",
    rules: "No-go rules",
    rejectionRules: "Rejection rules",
    safetyState: "Safety state",
    runtimeState: "Runtime state",
    question: "No-go question",
    conclusion: "No-go conclusion",
    safeRefs: "Safe no-go refs",
    clauses: "Non-acceptance clauses",
    sourceIds: "Source ids",
    sourceRefs: "Source refs",
    nextSafeAction: "Next safe action",
    owner: "Owner",
    probe: "Probe no-go",
    probing: "Checking",
    probePanel: "Blocked probe result",
    probeBody:
      "Probe one remediation review no-go item to confirm this packet remains read-only and blocked.",
    openSourceReview: "Open source remediation review",
    openDashboard: "Back to dashboard",
    statusLabels: {
      archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_external_evidence_missing:
        "External evidence no-go",
      archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_manual_reviewer_required:
        "Manual reviewer no-go",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoStatus,
      string
    >,
  },
  zh: {
    title: "持久化授权归档 Reconcile 补救复核 No-go",
    badge: "仅补救复核 No-go 包",
    body: "这份包说明为什么 Stage70 的补救复核清单仍然不能解锁实现授权。它保持只读，不能接受复核结果、补救、No-go 结果、授权拒绝、授权授予、实现工作或写入。",
    yes: "是",
    no: "否",
    mode: "模式",
    sourceMode: "来源复核模式",
    checkedAt: "检查时间",
    noGoItems: "No-go 项",
    reviewNoGo: "复核 No-go",
    externalNoGo: "外部证据 No-go",
    manualNoGo: "人工复核 No-go",
    stillBlocked: "仍然阻断",
    sourceItems: "来源复核项",
    sourceExternal: "来源外部证据缺失",
    sourceManual: "来源人工复核要求",
    sourceBlocked: "来源补救仍阻断",
    blockerEvidence: "阻断证据",
    unresolvedGaps: "未解决复核缺口",
    checklistFailures: "来源清单失败项",
    forbidden: "禁止捷径",
    prerequisites: "后续前置条件",
    redaction: "脱敏规则",
    rules: "No-go 规则",
    rejectionRules: "拒绝规则",
    safetyState: "安全状态",
    runtimeState: "运行时状态",
    question: "No-go 问题",
    conclusion: "No-go 结论",
    safeRefs: "安全 No-go 引用",
    clauses: "非接受条款",
    sourceIds: "来源 ID",
    sourceRefs: "来源引用",
    nextSafeAction: "下一步安全动作",
    owner: "负责人",
    probe: "探测 No-go",
    probing: "检查中",
    probePanel: "阻断探测结果",
    probeBody:
      "探测一个补救复核 No-go 项，确认这份包仍然只读并保持阻断。",
    openSourceReview: "打开来源补救复核",
    openDashboard: "返回工作台",
    statusLabels: {
      archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_external_evidence_missing:
        "外部证据 No-go",
      archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_manual_reviewer_required:
        "人工复核 No-go",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoStatus,
      string
    >,
  },
} as const;

type Copy = (typeof copy)[keyof typeof copy];

function statusTone(
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoStatus,
) {
  return status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_external_evidence_missing"
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

function NoGoItemCard({
  item,
  copy,
  onProbe,
  probingId,
}: {
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItem;
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
            {copy.blockerEvidence}
          </h4>
          <TextList items={item.blockerEvidence} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.unresolvedGaps}
          </h4>
          <TextList items={item.unresolvedReviewGaps} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.checklistFailures}
          </h4>
          <TextList items={item.sourceChecklistFailures} />
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
          <TextList items={item.futureResolutionPrerequisites} />
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
            {copy.safeRefs}
          </h4>
          <TextList items={item.safeNoGoRefs} />
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
              ...item.sourceRemediationReviewItemIds,
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

export function WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoClientPage({
  payload,
}: ClientPageProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoProbeResult | null>(
      null,
    );
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags = [
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketReady,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketReady",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketOnly,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketOnly",
    },
    {
      value:
        payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistReady,
      label:
        "sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistReady",
    },
    {
      value:
        payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistOnly,
      label:
        "sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistOnly",
    },
    { value: payload.allRuntimeEffectsBlocked, label: "allRuntimeEffectsBlocked" },
  ];

  const falseFlags = [
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoAccepted,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoAccepted",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRecorded,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRecorded",
    },
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
        payload.wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo,
      label:
        "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo",
    },
    {
      value:
        payload.wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo,
      label:
        "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo",
    },
    {
      value:
        payload.wouldDenyImplementationAuthorizationFromArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview,
      label:
        "wouldDenyImplementationAuthorizationFromArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview",
    },
    {
      value:
        payload.wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoToAuthorizationDecision,
      label:
        "wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoToAuthorizationDecision",
    },
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
        (await response.json()) as WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoProbeResult;
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
        <StatusPill tone="blocked">{t.badge}</StatusPill>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          label={t.mode}
          value={
            payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoMode
          }
        />
        <Stat
          label={t.sourceMode}
          value={
            payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistMode
          }
        />
        <Stat label={t.noGoItems} value={payload.noGoItemCount} />
        <Stat
          label={t.reviewNoGo}
          value={payload.remediationReviewNoGoItemCount}
        />
        <Stat
          label={t.externalNoGo}
          value={payload.externalEvidenceReviewNoGoCount}
        />
        <Stat
          label={t.manualNoGo}
          value={payload.manualReviewerReviewNoGoCount}
        />
        <Stat
          label={t.stillBlocked}
          value={payload.remediationReviewStillBlockedCount}
        />
        <Stat label={t.sourceItems} value={payload.sourceReviewItemCount} />
        <Stat
          label={t.sourceExternal}
          value={payload.sourceExternalEvidenceMissingCount}
        />
        <Stat
          label={t.sourceManual}
          value={payload.sourceManualReviewerRequiredCount}
        />
        <Stat
          label={t.sourceBlocked}
          value={payload.sourceNoGoRemediationStillBlockedCount}
        />
        <Stat
          label={t.blockerEvidence}
          value={payload.blockerEvidenceCount}
        />
        <Stat
          label={t.unresolvedGaps}
          value={payload.unresolvedReviewGapCount}
        />
        <Stat
          label={t.checklistFailures}
          value={payload.sourceChecklistFailureCount}
        />
        <Stat label={t.forbidden} value={payload.forbiddenShortcutCount} />
        <Stat
          label={t.prerequisites}
          value={payload.futureResolutionPrerequisiteCount}
        />
        <Stat label={t.redaction} value={payload.redactionRuleCount} />
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
                payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRules
              }
            />
          </section>

          {payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems.map(
            (item) => (
              <NoGoItemCard
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
                payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRejectionRules
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
              href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review"
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t.openSourceReview}
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
