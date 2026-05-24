"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  Stage72RemediationItem,
  Stage72RemediationPayload,
  Stage72RemediationProbeResult,
  Stage72RemediationStatus,
} from "@/types/stage72-remediation";

const copy = {
  en: {
    title: "Stage72 Remediation Path",
    badge: "Read-only remediation plan",
    body: "This stage maps Stage71 no-go items into safe future remediation requirements. It does not accept remediation, deny authorization, create implementation work, or write data.",
    sourceMode: "Source mode",
    currentMode: "Current mode",
    checkedAt: "Checked at",
    remediationItems: "Remediation items",
    externalEvidence: "External evidence required",
    manualReview: "Manual reviewer required",
    stillBlocked: "Still blocked",
    sourceItems: "Source Stage71 items",
    safeEvidence: "Safe evidence requirements",
    manualRequirements: "Manual review requirements",
    verification: "Verification steps",
    acceptance: "Acceptance criteria",
    risks: "Residual risks",
    redaction: "Redaction rules",
    rejection: "Rejection triggers",
    forbidden: "Forbidden actions",
    futureGates: "Future review gates",
    trueFlags: "Required true flags",
    falseFlags: "Required false flags",
    runtimeFlags: "Runtime blocks",
    rules: "Stage rules",
    reviewRules: "Future review rules",
    sourceRefs: "Source refs",
    blockerSummary: "Blocker summary",
    remediationQuestion: "Remediation question",
    remediationPlan: "Remediation plan",
    requiredState: "Required state",
    nextSafeAction: "Next safe action",
    runProbe: "Run blocked probe",
    probeResult: "Probe result",
    noProbe: "No probe run yet.",
    openStage71: "Open Stage71",
    openDashboard: "Open dashboard",
    yes: "true",
    no: "false",
  },
  zh: {
    title: "Stage72 补救路径",
    badge: "只读补救计划",
    body: "本阶段把 Stage71 no-go 项映射成未来可审查的安全补救要求。它不会接受补救、否决或授予授权、创建实现工作，也不会写入数据。",
    sourceMode: "来源模式",
    currentMode: "当前模式",
    checkedAt: "检查时间",
    remediationItems: "补救项",
    externalEvidence: "需要外部证据",
    manualReview: "需要人工复核",
    stillBlocked: "仍被阻断",
    sourceItems: "来源 Stage71 项",
    safeEvidence: "安全证据要求",
    manualRequirements: "人工复核要求",
    verification: "验证步骤",
    acceptance: "验收条件",
    risks: "剩余风险",
    redaction: "脱敏规则",
    rejection: "拒绝触发条件",
    forbidden: "禁止动作",
    futureGates: "未来复核门槛",
    trueFlags: "必须为 true 的标志",
    falseFlags: "必须为 false 的标志",
    runtimeFlags: "运行时阻断",
    rules: "阶段规则",
    reviewRules: "未来复核规则",
    sourceRefs: "来源引用",
    blockerSummary: "阻断摘要",
    remediationQuestion: "补救问题",
    remediationPlan: "补救计划",
    requiredState: "所需状态",
    nextSafeAction: "下一安全动作",
    runProbe: "运行阻断探针",
    probeResult: "探针结果",
    noProbe: "尚未运行探针。",
    openStage71: "打开 Stage71",
    openDashboard: "打开工作台",
    yes: "true",
    no: "false",
  },
};

function statusTone(status: Stage72RemediationStatus) {
  if (status === "stage72_remediation_external_evidence_required") {
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

function BooleanPill({
  label,
  value,
}: {
  label: string;
  value: boolean;
}) {
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
  item: Stage72RemediationItem;
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
            {labels.blockerSummary}
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {item.blockerSummary}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            {labels.remediationQuestion}
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {item.remediationQuestion}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="text-sm font-semibold text-slate-900">
          {labels.remediationPlan}
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {item.remediationPlan}
        </p>
        <p className="mt-2 break-all text-xs font-mono text-slate-500">
          {labels.requiredState}: {item.requiredExternalState}
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section>
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            {labels.safeEvidence}
          </h4>
          <TextList items={item.safeEvidenceRequirements.slice(0, 8)} />
        </section>
        <section>
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            {labels.manualRequirements}
          </h4>
          <TextList items={item.manualReviewRequirements.slice(0, 8)} />
        </section>
        <section>
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            {labels.risks}
          </h4>
          <TextList items={item.residualRisks.slice(0, 6)} />
        </section>
        <section>
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            {labels.forbidden}
          </h4>
          <TextList items={item.forbiddenActions.slice(0, 6)} />
        </section>
      </div>

      <div className="mt-4">
        <h4 className="mb-2 text-sm font-semibold text-slate-900">
          {labels.nextSafeAction}
        </h4>
        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
          {item.nextSafeAction}
        </p>
      </div>

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

export function Stage72RemediationClientPage({
  payload,
}: {
  payload: Stage72RemediationPayload;
}) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [probeResult, setProbeResult] =
    useState<Stage72RemediationProbeResult | null>(null);
  const [probeError, setProbeError] = useState("");

  const trueFlags = useMemo(
    () => [
      {
        label:
          "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanReady",
        value:
          payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanReady,
      },
      {
        label:
          "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanOnly",
        value:
          payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanOnly,
      },
      {
        label:
          "sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketReady",
        value:
          payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketReady,
      },
      {
        label:
          "sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketOnly",
        value:
          payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketOnly,
      },
      { label: "allRuntimeEffectsBlocked", value: payload.allRuntimeEffectsBlocked },
    ],
    [payload],
  );

  const falseFlags = useMemo(
    () => [
      {
        label:
          "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationAccepted",
        value:
          payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationAccepted,
      },
      {
        label:
          "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationRecorded",
        value:
          payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationRecorded,
      },
      {
        label:
          "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationStatesAccepted",
        value:
          payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationStatesAccepted,
      },
      {
        label:
          "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoAccepted",
        value:
          payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoAccepted,
      },
      {
        label:
          "authorizationReconsiderationFinalDecisionAccepted",
        value: payload.authorizationReconsiderationFinalDecisionAccepted,
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
          "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediation",
        value:
          payload.wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediation,
      },
      {
        label:
          "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationEvidence",
        value:
          payload.wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationEvidence,
      },
      {
        label:
          "wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoBlockerResolved",
        value:
          payload.wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoBlockerResolved,
      },
      {
        label:
          "wouldCreateArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationTicket",
        value:
          payload.wouldCreateArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationTicket,
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
      const nextResult = (await response.json()) as Stage72RemediationProbeResult;
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
              {t.currentMode}: {payload.stage72RemediationMode}
            </div>
            <div>
              {t.sourceMode}:{" "}
              {
                payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoMode
              }
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/server-writers/p71-reconciliation-no-go-remediation-review-no-go"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {t.openStage71}
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
          <Stat label={t.remediationItems} value={payload.remediationItemCount} />
          <Stat
            label={t.externalEvidence}
            value={payload.externalEvidenceRemediationRequiredCount}
          />
          <Stat
            label={t.manualReview}
            value={payload.manualReviewerRemediationRequiredCount}
          />
          <Stat label={t.stillBlocked} value={payload.remediationStillBlockedCount} />
          <Stat label={t.sourceItems} value={payload.sourceNoGoItemCount} />
          <Stat
            label={t.safeEvidence}
            value={payload.safeEvidenceRequirementCount}
          />
          <Stat
            label={t.manualRequirements}
            value={payload.manualReviewRequirementCount}
          />
          <Stat label={t.verification} value={payload.verificationStepCount} />
          <Stat label={t.acceptance} value={payload.acceptanceCriteriaCount} />
          <Stat label={t.risks} value={payload.residualRiskCount} />
          <Stat label={t.redaction} value={payload.redactionRuleCount} />
          <Stat label={t.checkedAt} value={payload.checkedAt} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.rules}
            </h2>
            <div className="mt-4">
              <TextList items={payload.stage72RemediationRules} />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.reviewRules}
            </h2>
            <div className="mt-4">
              <TextList items={payload.stage72ReviewRules} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.trueFlags}
            </h2>
            <div className="mt-4 space-y-2">
              {trueFlags.map((flag) => (
                <BooleanPill key={flag.label} {...flag} />
              ))}
            </div>
          </div>
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
          {payload.stage72RemediationItems.map((item) => (
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
