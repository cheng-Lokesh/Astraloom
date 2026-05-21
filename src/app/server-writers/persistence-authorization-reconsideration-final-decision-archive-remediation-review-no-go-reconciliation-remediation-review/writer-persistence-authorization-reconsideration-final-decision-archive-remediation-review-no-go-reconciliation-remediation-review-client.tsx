"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review";

type ClientPageProps = {
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewPayload;
};

const copy = {
  en: {
    title: "Persistence authorization archive reconciliation remediation review",
    badge: "Review checklist only",
    body: "This checklist reviews whether the archive remediation review no-go reconciliation remediation plan is safely checkable. It remains read-only and cannot accept remediation, store review evidence, mark blockers reviewed, accept no-go outcomes, deny or grant authorization, or write rows.",
    yes: "Yes",
    no: "No",
    mode: "Mode",
    sourceMode: "Source remediation mode",
    checkedAt: "Checked at",
    reviewItems: "Review items",
    externalMissing: "External evidence missing",
    manualRequired: "Manual reviewer required",
    stillBlocked: "Still blocked",
    completenessChecks: "Completeness checks",
    redactionChecks: "Redaction checks",
    rejectionTriggers: "Rejection triggers",
    sourceItems: "Source remediation items",
    sourceExternal: "Source external remediation",
    sourceManual: "Source manual review",
    sourceBlocked: "Source blocked",
    safetyState: "Safety state",
    runtimeState: "Runtime state",
    rules: "Review checklist rules",
    rejectionRules: "Current rejection rules",
    reviewQuestion: "Review question",
    currentFinding: "Current finding",
    requiredState: "Required external state",
    safeRefs: "Safe evidence refs",
    completeness: "Completeness",
    redaction: "Redaction",
    rejection: "Rejection triggers",
    clauses: "Non-acceptance clauses",
    futurePass: "Future pass criteria",
    currentFail: "Current fail criteria",
    blockedBecause: "Still blocked because",
    sourceIds: "Source ids",
    sourceRefs: "Source refs",
    nextSafeAction: "Next safe action",
    owner: "Owner",
    probe: "Probe review",
    probing: "Checking",
    probePanel: "Blocked probe result",
    probeBody:
      "Probe one review item to confirm this checklist remains read-only and blocked.",
    openRemediation: "Open remediation plan",
    openNoGo: "Open reconciliation no-go",
    openDashboard: "Back to dashboard",
    statusLabels: {
      archive_remediation_review_no_go_reconciliation_remediation_review_external_evidence_missing:
        "External evidence missing",
      archive_remediation_review_no_go_reconciliation_remediation_review_manual_reviewer_required:
        "Manual reviewer required",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewStatus,
      string
    >,
  },
  zh: {
    title: "持久化授权归档 Reconciliation 补救复核",
    badge: "仅复核清单",
    body: "这份清单只复核归档补救复核 No-go reconciliation 补救计划是否具备安全检查条件。它保持只读，不能接受补救、存储复核证据、标记阻断已复核、接受 No-go 结果、拒绝或授予授权，也不能写入数据。",
    yes: "是",
    no: "否",
    mode: "模式",
    sourceMode: "来源补救模式",
    checkedAt: "检查时间",
    reviewItems: "复核项",
    externalMissing: "缺少外部证据",
    manualRequired: "需要人工复核",
    stillBlocked: "仍然阻断",
    completenessChecks: "完整性检查",
    redactionChecks: "脱敏检查",
    rejectionTriggers: "拒绝触发项",
    sourceItems: "来源补救项",
    sourceExternal: "来源外部补救",
    sourceManual: "来源人工复核",
    sourceBlocked: "来源阻断",
    safetyState: "安全状态",
    runtimeState: "运行时状态",
    rules: "复核清单规则",
    rejectionRules: "当前拒绝规则",
    reviewQuestion: "复核问题",
    currentFinding: "当前结论",
    requiredState: "所需外部状态",
    safeRefs: "安全证据引用",
    completeness: "完整性",
    redaction: "脱敏",
    rejection: "拒绝触发项",
    clauses: "非接受条款",
    futurePass: "未来通过条件",
    currentFail: "当前失败条件",
    blockedBecause: "仍然阻断原因",
    sourceIds: "来源 ID",
    sourceRefs: "来源引用",
    nextSafeAction: "下一步安全动作",
    owner: "负责人",
    probe: "探测复核",
    probing: "检查中",
    probePanel: "阻断探测结果",
    probeBody: "探测一个复核项，确认这份清单仍然只读且保持阻断。",
    openRemediation: "打开补救计划",
    openNoGo: "打开 Reconciliation No-go",
    openDashboard: "返回工作台",
    statusLabels: {
      archive_remediation_review_no_go_reconciliation_remediation_review_external_evidence_missing:
        "缺少外部证据",
      archive_remediation_review_no_go_reconciliation_remediation_review_manual_reviewer_required:
        "需要人工复核",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewStatus,
      string
    >,
  },
} as const;

type Copy = (typeof copy)[keyof typeof copy];

function statusTone(
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewStatus,
) {
  return status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_external_evidence_missing"
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
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewItem;
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

      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <span className="font-semibold">{copy.reviewQuestion}: </span>
        {item.reviewQuestion}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.currentFinding}
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {item.currentFinding}
          </p>
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.requiredState}
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {item.requiredExternalState}
          </p>
        </section>
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
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-md border border-rose-200 bg-rose-50 p-4">
          <h4 className="text-sm font-semibold text-rose-950">
            {copy.blockedBecause}
          </h4>
          <TextList items={item.stillBlockedBecause} />
          <h4 className="mt-4 text-sm font-semibold text-rose-950">
            {copy.currentFail}
          </h4>
          <TextList items={item.failCriteriaForCurrentReview} />
        </section>
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.sourceIds}
          </h4>
          <TextList
            items={[
              ...item.sourceRemediationItemIds,
              ...item.sourceReconciliationNoGoItemIds,
              ...item.sourceReconciliationItemIds,
              ...item.sourceNoGoItemIds,
              ...item.sourceReviewItemIds,
              ...item.sourceArchiveRemediationItemIds,
              ...item.sourceArchiveNoGoItemIds,
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

export function WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewClientPage({
  payload,
}: ClientPageProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewProbeResult | null>(
      null,
    );
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags = [
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistReady,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistReady",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistOnly,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistOnly",
    },
    {
      value:
        payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanReady,
      label:
        "sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanReady",
    },
    {
      value:
        payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanOnly,
      label:
        "sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanOnly",
    },
    { value: payload.allRuntimeEffectsBlocked, label: "allRuntimeEffectsBlocked" },
  ];

  const falseFlags = [
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewRecorded,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewRecorded",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewComplete,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewComplete",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationAccepted,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationAccepted",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatesAccepted,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatesAccepted",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoAccepted,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoAccepted",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationAccepted,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationAccepted",
    },
    {
      value: payload.externalFinalDecisionArchiveRemediationReviewNoGoAccepted,
      label: "externalFinalDecisionArchiveRemediationReviewNoGoAccepted",
    },
    {
      value: payload.finalDecisionArchiveRemediationReviewAccepted,
      label: "finalDecisionArchiveRemediationReviewAccepted",
    },
    {
      value: payload.externalFinalDecisionArchiveRemediationAccepted,
      label: "externalFinalDecisionArchiveRemediationAccepted",
    },
    {
      value: payload.finalDecisionArchiveNoGoAccepted,
      label: "finalDecisionArchiveNoGoAccepted",
    },
    {
      value: payload.externalFinalDecisionArchiveAccepted,
      label: "externalFinalDecisionArchiveAccepted",
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
        payload.wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview,
      label:
        "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview",
    },
    {
      value:
        payload.wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview,
      label:
        "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview",
    },
    {
      value:
        payload.wouldStoreFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewEvidence,
      label:
        "wouldStoreFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewEvidence",
    },
    {
      value:
        payload.wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewed,
      label:
        "wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewed",
    },
    {
      value:
        payload.wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo,
      label:
        "wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo",
    },
    {
      value:
        payload.wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation,
      label:
        "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation",
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
      const response = await fetch(
        "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewProbeResult;
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
            payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistMode
          }
        />
        <Stat
          label={t.sourceMode}
          value={
            payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationMode
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
          value={payload.reconciliationRemediationStillBlockedCount}
        />
        <Stat
          label={t.completenessChecks}
          value={payload.completenessCheckCount}
        />
        <Stat label={t.redactionChecks} value={payload.redactionCheckCount} />
        <Stat
          label={t.rejectionTriggers}
          value={payload.rejectionTriggerCount}
        />
        <Stat label={t.sourceItems} value={payload.sourceRemediationItemCount} />
        <Stat
          label={t.sourceExternal}
          value={payload.sourceExternalReconciliationRemediationRequiredCount}
        />
        <Stat
          label={t.sourceManual}
          value={payload.sourceManualReconciliationReviewRequiredCount}
        />
        <Stat
          label={t.sourceBlocked}
          value={payload.sourceReconciliationStillBlockedCount}
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
                payload.archiveRemediationReviewNoGoReconciliationRemediationReviewChecklistRules
              }
            />
          </section>

          {payload.archiveRemediationReviewNoGoReconciliationRemediationReviewItems.map(
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

          <section className="rounded-lg border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-rose-950">
              {t.rejectionRules}
            </h2>
            <TextList
              items={
                payload.archiveRemediationReviewNoGoReconciliationRemediationReviewRejectionRules
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
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                <p>blocked: {probeResult.blocked ? t.yes : t.no}</p>
                <p>
                  {t.mode}:{" "}
                  {
                    probeResult.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistMode
                  }
                </p>
                {probeResult.itemTitle ? <p>{probeResult.itemTitle}</p> : null}
                <p>wouldWriteRows: {String(probeResult.wouldWriteRows)}</p>
                <p className="mt-2">{probeResult.summary}</p>
              </div>
            ) : null}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation"
                className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                {t.openRemediation}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-no-go"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                {t.openNoGo}
              </Link>
              <Link
                href="/dashboard"
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {t.openDashboard}
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
