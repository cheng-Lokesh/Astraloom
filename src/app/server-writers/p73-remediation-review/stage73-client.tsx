"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  Stage73RemediationReviewItem,
  Stage73RemediationReviewPayload,
  Stage73RemediationReviewProbeResult,
  Stage73RemediationReviewStatus,
} from "@/types/stage73-remediation-review";

const copy = {
  en: {
    title: "Stage73 Remediation Review",
    badge: "Read-only review checklist",
    body: "This stage reviews the Stage72 remediation plan shape without accepting remediation, completing review, denying authorization, granting authorization, or writing data.",
    sourceMode: "Source mode",
    currentMode: "Current mode",
    checkedAt: "Checked at",
    reviewItems: "Review items",
    externalEvidence: "Evidence still missing",
    manualReview: "Reviewer still required",
    stillBlocked: "Still blocked",
    sourceItems: "Source Stage72 items",
    evidenceChecks: "Evidence checks",
    reviewerChecks: "Reviewer checks",
    redactionChecks: "Redaction checks",
    rejectionChecks: "Rejection checks",
    completeness: "Completeness checks",
    blockedReasons: "Still-blocked reasons",
    futureNoGo: "Future no-go criteria",
    trueFlags: "Required true flags",
    falseFlags: "Required false flags",
    runtimeFlags: "Runtime blocks",
    rules: "Stage rules",
    sourceRefs: "Source refs",
    reviewQuestion: "Review question",
    currentFinding: "Current finding",
    nextSafeAction: "Next safe action",
    runProbe: "Run blocked probe",
    probeResult: "Probe result",
    noProbe: "No probe run yet.",
    openStage72: "Open Stage72",
    openDashboard: "Open dashboard",
    yes: "true",
    no: "false",
  },
  zh: {
    title: "Stage73 补救复核",
    badge: "只读复核清单",
    body: "本阶段只复核 Stage72 补救计划的形状，不接受补救、不完成复核、不拒绝或授予授权，也不会写入数据。",
    sourceMode: "来源模式",
    currentMode: "当前模式",
    checkedAt: "检查时间",
    reviewItems: "复核项",
    externalEvidence: "证据仍缺失",
    manualReview: "仍需人工复核",
    stillBlocked: "仍被阻断",
    sourceItems: "来源 Stage72 项",
    evidenceChecks: "证据检查",
    reviewerChecks: "复核人检查",
    redactionChecks: "脱敏检查",
    rejectionChecks: "拒绝检查",
    completeness: "完整性检查",
    blockedReasons: "仍被阻断原因",
    futureNoGo: "未来 No-go 标准",
    trueFlags: "必须为 true 的标志",
    falseFlags: "必须为 false 的标志",
    runtimeFlags: "运行时阻断",
    rules: "阶段规则",
    sourceRefs: "来源引用",
    reviewQuestion: "复核问题",
    currentFinding: "当前发现",
    nextSafeAction: "下一安全动作",
    runProbe: "运行阻断探针",
    probeResult: "探针结果",
    noProbe: "尚未运行探针。",
    openStage72: "打开 Stage72",
    openDashboard: "打开工作台",
    yes: "true",
    no: "false",
  },
};

function statusTone(status: Stage73RemediationReviewStatus) {
  if (status === "stage73_review_external_evidence_still_missing") {
    return "blocked";
  }

  return "planned";
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function BooleanPill({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
      <span className="break-all text-slate-700">{label}</span>
      <StatusPill tone={value ? "ready" : "blocked"}>
        {value ? "true" : "false"}
      </StatusPill>
    </div>
  );
}

function TextList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function ItemCard({
  item,
  labels,
  onProbe,
}: {
  item: Stage73RemediationReviewItem;
  labels: (typeof copy)["en"];
  onProbe: (itemId: string) => void;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {item.title}
          </h3>
          <p className="mt-1 text-xs font-mono text-slate-500">{item.id}</p>
        </div>
        <StatusPill tone={statusTone(item.status)}>{item.status}</StatusPill>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            {labels.reviewQuestion}
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {item.reviewQuestion}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            {labels.currentFinding}
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {item.currentFinding}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section>
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            {labels.evidenceChecks}
          </h4>
          <TextList items={item.evidenceReadinessChecks.slice(0, 8)} />
        </section>
        <section>
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            {labels.reviewerChecks}
          </h4>
          <TextList items={item.manualReviewerChecks.slice(0, 8)} />
        </section>
        <section>
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            {labels.blockedReasons}
          </h4>
          <TextList items={item.stillBlockedReasons.slice(0, 6)} />
        </section>
        <section>
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            {labels.futureNoGo}
          </h4>
          <TextList items={item.futureNoGoCriteria.slice(0, 6)} />
        </section>
      </div>

      <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
        {item.nextSafeAction}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onProbe(item.id)}
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {labels.runProbe}
        </button>
        <span className="break-all text-xs font-mono text-slate-500">
          {labels.sourceRefs}: {item.sourceRefs.slice(0, 4).join(", ")}
        </span>
      </div>
    </article>
  );
}

export function Stage73RemediationReviewClientPage({
  payload,
}: {
  payload: Stage73RemediationReviewPayload;
}) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [probeResult, setProbeResult] =
    useState<Stage73RemediationReviewProbeResult | null>(null);
  const [probeError, setProbeError] = useState("");

  const trueFlags = useMemo(
    () => [
      {
        label:
          "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewChecklistReady",
        value:
          payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewChecklistReady,
      },
      {
        label:
          "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewChecklistOnly",
        value:
          payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewChecklistOnly,
      },
      {
        label:
          "sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanReady",
        value:
          payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanReady,
      },
      {
        label:
          "sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanOnly",
        value:
          payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanOnly,
      },
      { label: "allRuntimeEffectsBlocked", value: payload.allRuntimeEffectsBlocked },
    ],
    [payload],
  );

  const falseFlags = useMemo(
    () => [
      {
        label:
          "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewAccepted",
        value:
          payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewAccepted,
      },
      {
        label:
          "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewRecorded",
        value:
          payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewRecorded,
      },
      {
        label:
          "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewComplete",
        value:
          payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewComplete,
      },
      {
        label:
          "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationAccepted",
        value:
          payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationAccepted,
      },
      {
        label: "implementationAuthorizationGranted",
        value: payload.implementationAuthorizationGranted,
      },
      {
        label: "readyForAdapterImplementation",
        value: payload.readyForAdapterImplementation,
      },
    ],
    [payload],
  );

  const runtimeFlags = useMemo(
    () => [
      {
        label:
          "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReview",
        value:
          payload.wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReview,
      },
      {
        label:
          "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReview",
        value:
          payload.wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReview,
      },
      {
        label:
          "wouldStoreFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewEvidence",
        value:
          payload.wouldStoreFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewEvidence,
      },
      {
        label: "wouldCreateServiceRoleClient",
        value: payload.wouldCreateServiceRoleClient,
      },
      { label: "wouldRunTransaction", value: payload.wouldRunTransaction },
      { label: "wouldWriteRows", value: payload.wouldWriteRows },
    ],
    [payload],
  );

  async function runProbe(itemId: string) {
    setProbeError("");
    setProbeResult(null);

    try {
      const response = await fetch(payload.publicApiPath, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const nextResult =
        (await response.json()) as Stage73RemediationReviewProbeResult;
      setProbeResult(nextResult);
    } catch (error) {
      setProbeError(error instanceof Error ? error.message : "Probe failed.");
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">
                {t.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {t.body}
              </p>
            </div>
            <StatusPill tone="blocked">{t.badge}</StatusPill>
          </div>
          <div className="mt-5 grid gap-3 text-xs font-mono text-slate-600">
            <div>
              {t.currentMode}: {payload.stage73RemediationReviewMode}
            </div>
            <div>
              {t.sourceMode}: {payload.stage72RemediationMode}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/server-writers/p72-remediation"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {t.openStage72}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {t.openDashboard}
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Stat label={t.reviewItems} value={payload.reviewItemCount} />
          <Stat
            label={t.externalEvidence}
            value={payload.externalEvidenceStillMissingCount}
          />
          <Stat
            label={t.manualReview}
            value={payload.manualReviewerStillRequiredCount}
          />
          <Stat
            label={t.stillBlocked}
            value={payload.stage72RemediationStillBlockedCount}
          />
          <Stat label={t.sourceItems} value={payload.sourceRemediationItemCount} />
          <Stat
            label={t.evidenceChecks}
            value={payload.evidenceReadinessCheckCount}
          />
          <Stat
            label={t.reviewerChecks}
            value={payload.manualReviewerCheckCount}
          />
          <Stat label={t.redactionChecks} value={payload.redactionCheckCount} />
          <Stat label={t.rejectionChecks} value={payload.rejectionCheckCount} />
          <Stat label={t.completeness} value={payload.completenessCheckCount} />
          <Stat
            label={t.blockedReasons}
            value={payload.stillBlockedReasonCount}
          />
          <Stat label={t.checkedAt} value={payload.checkedAt} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.rules}
            </h2>
            <div className="mt-4">
              <TextList items={payload.stage73ReviewRules} />
            </div>
          </div>
          <div className="grid gap-3">
            {trueFlags.map((flag) => (
              <BooleanPill key={flag.label} {...flag} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.falseFlags}
            </h2>
            <div className="mt-4 space-y-2">
              {falseFlags.map((flag) => (
                <BooleanPill key={flag.label} {...flag} />
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.runtimeFlags}
            </h2>
            <div className="mt-4 space-y-2">
              {runtimeFlags.map((flag) => (
                <BooleanPill key={flag.label} {...flag} />
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {payload.stage73RemediationReviewItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              labels={t}
              onProbe={runProbe}
            />
          ))}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {t.probeResult}
          </h2>
          {probeError ? (
            <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {probeError}
            </p>
          ) : probeResult ? (
            <div className="mt-3 space-y-3">
              <StatusPill tone="blocked">
                blocked={probeResult.blocked ? t.yes : t.no}
              </StatusPill>
              <p className="text-sm leading-6 text-slate-700">
                {probeResult.summary}
              </p>
              <pre className="max-h-80 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">
                {JSON.stringify(
                  {
                    itemId: probeResult.itemId,
                    itemStatus: probeResult.itemStatus,
                    wouldCreateServiceRoleClient:
                      probeResult.wouldCreateServiceRoleClient,
                    wouldRunTransaction: probeResult.wouldRunTransaction,
                    wouldWriteRows: probeResult.wouldWriteRows,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">{t.noProbe}</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
