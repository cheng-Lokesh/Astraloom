"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go";

type ClientPageProps = {
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPayload;
};

const publicApiPath =
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go";

const copy = {
  en: {
    title:
      "Persistence authorization archive reconciliation remediation review no-go reconciliation no-go",
    badge: "Reconciliation no-go packet only",
    body: "This packet summarizes why the reconciliation checklist still cannot unlock implementation authorization. It remains read-only and cannot accept no-go outcomes, deny authorization, grant authorization, start implementation, or write rows.",
    yes: "Yes",
    no: "No",
    mode: "Mode",
    sourceMode: "Source reconciliation mode",
    checkedAt: "Checked at",
    noGoItems: "No-go items",
    reconciliationNoGo: "Reconciliation no-go",
    externalNoGo: "External evidence no-go",
    manualNoGo: "Manual reviewer no-go",
    stillBlocked: "Still blocked",
    sourceItems: "Source reconciliation items",
    sourceExternal: "Source external unresolved",
    sourceManual: "Source manual unresolved",
    sourceBlocked: "Source review no-go blocked",
    blockerEvidence: "Blocker evidence",
    unresolvedGaps: "Unresolved reconciliation gaps",
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
      "Probe one reconciliation no-go item to confirm this packet remains read-only and blocked.",
    openSourceReconciliation: "Open source reconciliation",
    openDashboard: "Back to dashboard",
    statusLabels: {
      archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_external_evidence_unresolved:
        "External evidence no-go",
      archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_manual_reviewer_unresolved:
        "Manual reviewer no-go",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoStatus,
      string
    >,
  },
  zh: {
    title: "持久化授权归档 reconciliation remediation 复核 No-go Reconcile No-go",
    badge: "仅 Reconciliation No-go 包",
    body: "这份包说明为什么 reconciliation 清单仍然不能解锁实现授权。它保持只读，不能接受 no-go 结果、拒绝授权、授予授权、启动实现或写入数据。",
    yes: "是",
    no: "否",
    mode: "模式",
    sourceMode: "来源 Reconciliation 模式",
    checkedAt: "检查时间",
    noGoItems: "No-go 项",
    reconciliationNoGo: "Reconciliation No-go",
    externalNoGo: "外部证据 No-go",
    manualNoGo: "人工复核 No-go",
    stillBlocked: "仍然阻断",
    sourceItems: "来源 Reconciliation 项",
    sourceExternal: "来源外部证据未解决",
    sourceManual: "来源人工复核未解决",
    sourceBlocked: "来源复核 No-go 阻断",
    blockerEvidence: "阻断证据",
    unresolvedGaps: "未解决 Reconciliation 缺口",
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
    probeBody: "探测一个 reconciliation no-go 项，确认这份包仍然只读且保持阻断。",
    openSourceReconciliation: "打开来源 Reconciliation",
    openDashboard: "返回工作台",
    statusLabels: {
      archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_external_evidence_unresolved:
        "外部证据 No-go",
      archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_manual_reviewer_unresolved:
        "人工复核 No-go",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoStatus,
      string
    >,
  },
} as const;

type Copy = (typeof copy)[keyof typeof copy];

function statusTone(
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoStatus,
) {
  return status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_external_evidence_unresolved"
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
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItem;
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
          <TextList items={item.unresolvedReconciliationGaps} />
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
              ...item.sourceReconciliationItemIds,
              ...item.sourceNoGoItemIds,
              ...item.sourceReviewItemIds,
              ...item.sourceRemediationItemIds,
              ...item.sourceReconciliationNoGoItemIds,
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

export function WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoClientPage({
  payload,
}: ClientPageProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoProbeResult | null>(
      null,
    );
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags = [
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketReady,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketReady",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketOnly,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketOnly",
    },
    {
      value:
        payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistReady,
      label:
        "sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistReady",
    },
    {
      value:
        payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistOnly,
      label:
        "sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistOnly",
    },
    { value: payload.allRuntimeEffectsBlocked, label: "allRuntimeEffectsBlocked" },
  ];

  const falseFlags = [
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoAccepted,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoAccepted",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRecorded,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRecorded",
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
        payload.wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo,
      label:
        "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo",
    },
    {
      value:
        payload.wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo,
      label:
        "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo",
    },
    {
      value:
        payload.wouldDenyImplementationAuthorizationFromArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation,
      label:
        "wouldDenyImplementationAuthorizationFromArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation",
    },
    {
      value:
        payload.wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoToAuthorizationDecision,
      label:
        "wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoToAuthorizationDecision",
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
        (await response.json()) as WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoProbeResult;
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
            payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoMode
          }
        />
        <Stat
          label={t.sourceMode}
          value={
            payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistMode
          }
        />
        <Stat label={t.noGoItems} value={payload.noGoItemCount} />
        <Stat
          label={t.reconciliationNoGo}
          value={payload.reconciliationNoGoItemCount}
        />
        <Stat
          label={t.externalNoGo}
          value={payload.externalEvidenceReconciliationNoGoCount}
        />
        <Stat
          label={t.manualNoGo}
          value={payload.manualReviewerReconciliationNoGoCount}
        />
        <Stat
          label={t.stillBlocked}
          value={payload.reconciliationStillBlockedCount}
        />
        <Stat label={t.sourceItems} value={payload.sourceReconciliationItemCount} />
        <Stat
          label={t.sourceExternal}
          value={payload.sourceExternalEvidenceUnresolvedCount}
        />
        <Stat
          label={t.sourceManual}
          value={payload.sourceManualReviewerUnresolvedCount}
        />
        <Stat
          label={t.sourceBlocked}
          value={payload.sourceReviewNoGoStillBlockedCount}
        />
        <Stat
          label={t.blockerEvidence}
          value={payload.blockerEvidenceCount}
        />
        <Stat
          label={t.unresolvedGaps}
          value={payload.unresolvedReconciliationGapCount}
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
                payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRules
              }
            />
          </section>

          {payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems.map(
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
                payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRejectionRules
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
              href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation"
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t.openSourceReconciliation}
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
