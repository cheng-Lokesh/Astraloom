"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation";

type ClientPageProps = {
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPayload;
};

const publicApiPath =
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation";

const copy = {
  en: {
    title: "Persistence authorization archive reconciliation no-go remediation",
    badge: "Remediation plan only",
    body: "This read-only plan maps the Stage68 reconciliation no-go blockers to safe future evidence and manual reviewer requirements. It still cannot accept remediation, resolve blockers, deny or grant authorization, create files, or write rows.",
    yes: "Yes",
    no: "No",
    mode: "Mode",
    sourceMode: "Source no-go mode",
    checkedAt: "Checked at",
    remediationItems: "Remediation items",
    externalRequired: "External evidence required",
    manualRequired: "Manual review required",
    safeEvidence: "Safe evidence requirements",
    manualReview: "Manual review requirements",
    verification: "Verification steps",
    acceptance: "Acceptance criteria",
    residualRisks: "Residual risks",
    redaction: "Redaction rules",
    rejection: "Rejection triggers",
    forbidden: "Forbidden actions",
    futureGates: "Future gates",
    sourceItems: "Source no-go items",
    sourceExternal: "Source external no-go",
    sourceManual: "Source manual no-go",
    sourceBlocked: "Source still blocked",
    rules: "Remediation plan rules",
    reviewRules: "Future review rules",
    safetyState: "Safety state",
    runtimeState: "Runtime state",
    question: "Remediation question",
    plan: "Remediation plan",
    requiredState: "Required external state",
    blocker: "Blocker summary",
    clauses: "Non-execution clauses",
    sourceIds: "Source ids",
    sourceRefs: "Source refs",
    nextReviewGate: "Next review gate",
    owner: "Owner",
    probe: "Probe remediation",
    probing: "Checking",
    probePanel: "Blocked probe result",
    probeBody:
      "Probe one remediation item to confirm this plan remains read-only and blocked.",
    openSourceNoGo: "Open source no-go packet",
    openDashboard: "Back to dashboard",
    statusLabels: {
      archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_external_evidence_required:
        "External evidence required",
      archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_manual_review_required:
        "Manual review required",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationStatus,
      string
    >,
  },
  zh: {
    title: "持久化授权归档 Reconcile No-go 补救计划",
    badge: "仅补救计划",
    body: "这个只读计划把 Stage68 的 reconciliation no-go 阻断项映射为后续安全证据和人工复核要求。它仍然不能接受补救、解决阻断、拒绝或授予授权、创建文件或写入数据。",
    yes: "是",
    no: "否",
    mode: "模式",
    sourceMode: "来源 No-go 模式",
    checkedAt: "检查时间",
    remediationItems: "补救项",
    externalRequired: "需要外部证据",
    manualRequired: "需要人工复核",
    safeEvidence: "安全证据要求",
    manualReview: "人工复核要求",
    verification: "验证步骤",
    acceptance: "验收条件",
    residualRisks: "残余风险",
    redaction: "脱敏规则",
    rejection: "拒绝触发条件",
    forbidden: "禁止动作",
    futureGates: "后续闸门",
    sourceItems: "来源 No-go 项",
    sourceExternal: "来源外部证据 No-go",
    sourceManual: "来源人工复核 No-go",
    sourceBlocked: "来源仍然阻断",
    rules: "补救计划规则",
    reviewRules: "后续复核规则",
    safetyState: "安全状态",
    runtimeState: "运行时状态",
    question: "补救问题",
    plan: "补救计划",
    requiredState: "所需外部状态",
    blocker: "阻断摘要",
    clauses: "非执行条款",
    sourceIds: "来源 ID",
    sourceRefs: "来源引用",
    nextReviewGate: "下一复核闸门",
    owner: "负责人",
    probe: "探测补救",
    probing: "检查中",
    probePanel: "阻断探测结果",
    probeBody: "探测一个补救项，确认这个计划仍然只读且保持阻断。",
    openSourceNoGo: "打开来源 No-go 包",
    openDashboard: "返回工作台",
    statusLabels: {
      archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_external_evidence_required:
        "需要外部证据",
      archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_manual_review_required:
        "需要人工复核",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationStatus,
      string
    >,
  },
} as const;

type Copy = (typeof copy)[keyof typeof copy];

function statusTone(
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationStatus,
) {
  return status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_external_evidence_required"
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

function RemediationItemCard({
  item,
  copy,
  onProbe,
  probingId,
}: {
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItem;
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

      <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
        <p>
          <span className="font-semibold">{copy.question}: </span>
          {item.remediationQuestion}
        </p>
        <p className="mt-2">
          <span className="font-semibold">{copy.plan}: </span>
          {item.remediationPlan}
        </p>
        <p className="mt-2 break-words">
          <span className="font-semibold">{copy.requiredState}: </span>
          {item.requiredExternalState}
        </p>
      </div>

      <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <span className="font-semibold">{copy.blocker}: </span>
        {item.blockerSummary}
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.safeEvidence}
          </h4>
          <TextList items={item.safeEvidenceRequirements} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.manualReview}
          </h4>
          <TextList items={item.manualReviewRequirements} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.verification}
          </h4>
          <TextList items={item.verificationSteps} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.acceptance}
          </h4>
          <TextList items={item.acceptanceCriteria} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.residualRisks}
          </h4>
          <TextList items={item.residualRisks} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.rejection}
          </h4>
          <TextList items={item.rejectionTriggers} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.forbidden}
          </h4>
          <TextList items={item.forbiddenActions} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.futureGates}
          </h4>
          <TextList items={item.futureAcceptanceGates} />
        </section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.redaction}
          </h4>
          <TextList items={item.redactionRules} />
          <h4 className="mt-4 text-sm font-semibold text-slate-950">
            {copy.clauses}
          </h4>
          <TextList items={item.nonExecutionClauses} />
        </section>
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.sourceIds}
          </h4>
          <TextList
            items={[
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
            <span className="font-semibold">{copy.nextReviewGate}: </span>
            {item.nextReviewGate}
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

export function WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationClientPage({
  payload,
}: ClientPageProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationProbeResult | null>(
      null,
    );
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags = [
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanReady,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanReady",
    },
    {
      value:
        payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanOnly,
      label:
        "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanOnly",
    },
    {
      value:
        payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketReady,
      label:
        "sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketReady",
    },
    {
      value:
        payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketOnly,
      label:
        "sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketOnly",
    },
    { value: payload.allRuntimeEffectsBlocked, label: "allRuntimeEffectsBlocked" },
  ];

  const falseFlags = [
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
        payload.wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediation,
      label:
        "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediation",
    },
    {
      value:
        payload.wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationEvidence,
      label:
        "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationEvidence",
    },
    {
      value:
        payload.wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationBlockerResolved,
      label:
        "wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationBlockerResolved",
    },
    {
      value:
        payload.wouldCreateArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationTicket,
      label:
        "wouldCreateArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationTicket",
    },
    {
      value:
        payload.wouldAcceptArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationState,
      label:
        "wouldAcceptArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationState",
    },
    {
      value:
        payload.wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview,
      label:
        "wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview",
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
        (await response.json()) as WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationProbeResult;
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
            payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationMode
          }
        />
        <Stat
          label={t.sourceMode}
          value={
            payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoMode
          }
        />
        <Stat
          label={t.remediationItems}
          value={payload.remediationItemCount}
        />
        <Stat
          label={t.externalRequired}
          value={payload.externalReconciliationNoGoRemediationRequiredCount}
        />
        <Stat
          label={t.manualRequired}
          value={payload.manualReconciliationNoGoReviewRequiredCount}
        />
        <Stat
          label={t.safeEvidence}
          value={payload.safeEvidenceRequirementCount}
        />
        <Stat
          label={t.manualReview}
          value={payload.manualReviewRequirementCount}
        />
        <Stat label={t.verification} value={payload.verificationStepCount} />
        <Stat label={t.acceptance} value={payload.acceptanceCriteriaCount} />
        <Stat label={t.residualRisks} value={payload.residualRiskCount} />
        <Stat label={t.redaction} value={payload.redactionRuleCount} />
        <Stat label={t.rejection} value={payload.rejectionTriggerCount} />
        <Stat label={t.forbidden} value={payload.forbiddenActionCount} />
        <Stat label={t.futureGates} value={payload.futureAcceptanceGateCount} />
        <Stat
          label={t.sourceItems}
          value={payload.sourceReconciliationNoGoItemCount}
        />
        <Stat
          label={t.sourceExternal}
          value={payload.sourceExternalEvidenceReconciliationNoGoCount}
        />
        <Stat
          label={t.sourceManual}
          value={payload.sourceManualReviewerReconciliationNoGoCount}
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
                payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanRules
              }
            />
          </section>

          {payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems.map(
            (item) => (
              <RemediationItemCard
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
              {t.reviewRules}
            </h2>
            <TextList
              items={
                payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewRules
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
              href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go"
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t.openSourceNoGo}
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
