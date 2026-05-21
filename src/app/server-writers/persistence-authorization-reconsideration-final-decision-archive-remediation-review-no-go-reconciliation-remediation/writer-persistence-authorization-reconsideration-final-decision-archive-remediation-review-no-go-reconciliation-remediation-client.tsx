"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation";

type ClientPageProps = {
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPayload;
};

const copy = {
  en: {
    title: "Persistence authorization archive reconciliation remediation",
    badge: "Read-only remediation plan",
    body: "This plan maps every archive remediation review no-go reconciliation no-go item to external owner actions and safe evidence requirements. It still cannot accept remediation, record evidence, resolve blockers, deny or grant authorization, deploy, or write rows.",
    mode: "Mode",
    sourceMode: "Source no-go mode",
    checkedAt: "Checked at",
    remediationItems: "Remediation items",
    externalRequired: "External remediation",
    manualRequired: "Manual review",
    sourceNoGo: "Source no-go items",
    sourceBlocked: "Source blocked",
    sourceExternal: "Source external no-go",
    sourceManual: "Source manual no-go",
    ready: "Ready",
    blocked: "Blocked",
    falseLabel: "False",
    trueLabel: "True",
    planRules: "Remediation plan rules",
    reviewRules: "Next review rules",
    safetyState: "Safety state",
    runtimeState: "Runtime state",
    items: "Reconciliation remediation items",
    blockerSummary: "Blocker",
    objective: "Objective",
    externalActions: "External actions",
    evidence: "Safe evidence",
    verification: "Verification",
    acceptance: "Acceptance criteria",
    residualRisks: "Residual risks",
    forbidden: "Forbidden actions",
    exit: "Exit criteria",
    refs: "Source refs",
    sourceIds: "Source ids",
    probe: "Probe remediation",
    probeResult: "Blocked probe result",
    noProbe: "No probe selected yet.",
    openSourceNoGo: "Open reconciliation no-go",
    openSourceReconciliation: "Open source reconciliation",
    openDashboard: "Back to dashboard",
    statusLabels: {
      archive_remediation_review_no_go_reconciliation_external_remediation_required:
        "External remediation required",
      archive_remediation_review_no_go_reconciliation_manual_review_required:
        "Manual review required",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatus,
      string
    >,
  },
  zh: {
    title: "持久化授权归档 Reconciliation 补救计划",
    badge: "只读补救计划",
    body: "这份计划把每个归档补救复核 No-go reconciliation no-go 项映射为外部负责人动作和安全证据要求。它仍然不能接受补救、记录证据、解决阻断、拒绝或授予授权、部署或写入数据。",
    mode: "模式",
    sourceMode: "来源 No-go 模式",
    checkedAt: "检查时间",
    remediationItems: "补救项",
    externalRequired: "外部补救",
    manualRequired: "人工复核",
    sourceNoGo: "来源 No-go 项",
    sourceBlocked: "来源阻断",
    sourceExternal: "来源外部证据 No-go",
    sourceManual: "来源人工复核 No-go",
    ready: "已就绪",
    blocked: "已阻断",
    falseLabel: "否",
    trueLabel: "是",
    planRules: "补救计划规则",
    reviewRules: "下一轮复核规则",
    safetyState: "安全状态",
    runtimeState: "运行时状态",
    items: "Reconciliation 补救项",
    blockerSummary: "阻断原因",
    objective: "补救目标",
    externalActions: "外部动作",
    evidence: "安全证据",
    verification: "验证步骤",
    acceptance: "验收条件",
    residualRisks: "残余风险",
    forbidden: "禁止动作",
    exit: "退出条件",
    refs: "来源引用",
    sourceIds: "来源 ID",
    probe: "探测补救项",
    probeResult: "阻断探测结果",
    noProbe: "尚未选择探测项。",
    openSourceNoGo: "打开 Reconciliation No-go",
    openSourceReconciliation: "打开来源 Reconciliation",
    openDashboard: "返回工作台",
    statusLabels: {
      archive_remediation_review_no_go_reconciliation_external_remediation_required:
        "需要外部补救",
      archive_remediation_review_no_go_reconciliation_manual_review_required:
        "需要人工复核",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatus,
      string
    >,
  },
} as const;

type Copy = (typeof copy)[keyof typeof copy];

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-lg font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function BooleanRow({
  label,
  value,
  copy,
  readyWhenTrue = true,
}: {
  label: string;
  value: boolean;
  copy: Copy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-b-0">
      <span className="break-all text-slate-600">{label}</span>
      <StatusPill tone={ready ? "ready" : "blocked"}>
        {value ? copy.trueLabel : copy.falseLabel}
      </StatusPill>
    </div>
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
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationItem;
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
          <p className="mt-1 text-xs text-slate-500">{item.id}</p>
        </div>
        <StatusPill tone="blocked">{copy.statusLabels[item.status]}</StatusPill>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.blockerSummary}
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {item.blockerSummary}
          </p>
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.objective}
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {item.remediationObjective}
          </p>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.externalActions}
          </h4>
          <TextList items={item.externalActions} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.evidence}
          </h4>
          <TextList items={item.safeEvidenceRequirements} />
        </section>
      </div>

      <details className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">
          {copy.verification}, {copy.residualRisks}, {copy.forbidden}
        </summary>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
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
              {copy.forbidden}
            </h4>
            <TextList items={item.forbiddenActions} />
          </section>
          <section>
            <h4 className="text-sm font-semibold text-slate-950">
              {copy.exit}
            </h4>
            <TextList items={item.exitCriteria} />
          </section>
          <section>
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
                ...item.sourceArchiveItemIds,
                ...item.sourceDecisionItemIds,
              ]}
            />
          </section>
        </div>
      </details>

      <button
        type="button"
        onClick={() => onProbe(item.id)}
        disabled={probingId === item.id}
        className="mt-5 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
      >
        {probingId === item.id ? copy.blocked : copy.probe}
      </button>
    </article>
  );
}

export function WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationClientPage({
  payload,
}: ClientPageProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationProbeResult | null>(
      null,
    );
  const [probingId, setProbingId] = useState<string | null>(null);
  const [probeError, setProbeError] = useState<string | null>(null);

  async function probeItem(itemId: string) {
    setProbingId(itemId);
    setProbeResult(null);
    setProbeError(null);

    try {
      const response = await fetch(
        "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationProbeResult;
      setProbeResult(result);
    } catch (error) {
      setProbeError(error instanceof Error ? error.message : "Probe failed");
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

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          label={t.mode}
          value={
            payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationMode
          }
        />
        <Stat
          label={t.sourceMode}
          value={
            payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoMode
          }
        />
        <Stat label={t.remediationItems} value={payload.remediationItemCount} />
        <Stat
          label={t.externalRequired}
          value={payload.externalReconciliationRemediationRequiredCount}
        />
        <Stat
          label={t.manualRequired}
          value={payload.manualReconciliationReviewRequiredCount}
        />
        <Stat
          label={t.sourceNoGo}
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
        <Stat label={t.externalActions} value={payload.externalActionCount} />
        <Stat label={t.evidence} value={payload.safeEvidenceRequirementCount} />
        <Stat label={t.verification} value={payload.verificationStepCount} />
        <Stat label={t.acceptance} value={payload.acceptanceCriteriaCount} />
        <Stat label={t.residualRisks} value={payload.residualRiskCount} />
        <Stat label={t.forbidden} value={payload.forbiddenActionCount} />
        <Stat label={t.exit} value={payload.exitCriteriaCount} />
        <Stat label={t.checkedAt} value={payload.checkedAt} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.planRules}
            </h2>
            <TextList
              items={
                payload.archiveRemediationReviewNoGoReconciliationRemediationPlanRules
              }
            />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.reviewRules}
            </h2>
            <TextList
              items={
                payload.archiveRemediationReviewNoGoReconciliationRemediationReviewRules
              }
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-slate-950">
              {t.items}
            </h2>
            {payload.archiveRemediationReviewNoGoReconciliationRemediationItems.map(
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
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.safetyState}
            </h2>
            <div className="mt-4">
              <BooleanRow
                label="externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanReady"
                value={
                  payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanReady
                }
                copy={t}
              />
              <BooleanRow
                label="externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanOnly"
                value={
                  payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanOnly
                }
                copy={t}
              />
              <BooleanRow
                label="sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPacketReady"
                value={
                  payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPacketReady
                }
                copy={t}
              />
              <BooleanRow
                label="sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPacketOnly"
                value={
                  payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPacketOnly
                }
                copy={t}
              />
              <BooleanRow
                label="allRuntimeEffectsBlocked"
                value={payload.allRuntimeEffectsBlocked}
                copy={t}
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.runtimeState}
            </h2>
            <div className="mt-4">
              <BooleanRow
                label="externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationAccepted"
                value={
                  payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationAccepted
                }
                copy={t}
                readyWhenTrue={false}
              />
              <BooleanRow
                label="externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationRecorded"
                value={
                  payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationRecorded
                }
                copy={t}
                readyWhenTrue={false}
              />
              <BooleanRow
                label="externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoAccepted"
                value={
                  payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoAccepted
                }
                copy={t}
                readyWhenTrue={false}
              />
              <BooleanRow
                label="externalFinalDecisionArchiveRemediationReviewNoGoReconciliationAccepted"
                value={
                  payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationAccepted
                }
                copy={t}
                readyWhenTrue={false}
              />
              <BooleanRow
                label="finalDecisionArchiveRemediationReviewAccepted"
                value={payload.finalDecisionArchiveRemediationReviewAccepted}
                copy={t}
                readyWhenTrue={false}
              />
              <BooleanRow
                label="externalFinalDecisionArchiveRemediationAccepted"
                value={payload.externalFinalDecisionArchiveRemediationAccepted}
                copy={t}
                readyWhenTrue={false}
              />
              <BooleanRow
                label="implementationAuthorizationGranted"
                value={payload.implementationAuthorizationGranted}
                copy={t}
                readyWhenTrue={false}
              />
              <BooleanRow
                label="readyForAdapterImplementation"
                value={payload.readyForAdapterImplementation}
                copy={t}
                readyWhenTrue={false}
              />
              <BooleanRow
                label="wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation"
                value={
                  payload.wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation
                }
                copy={t}
                readyWhenTrue={false}
              />
              <BooleanRow
                label="wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationEvidence"
                value={
                  payload.wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationEvidence
                }
                copy={t}
                readyWhenTrue={false}
              />
              <BooleanRow
                label="wouldCreateServiceRoleClient"
                value={payload.wouldCreateServiceRoleClient}
                copy={t}
                readyWhenTrue={false}
              />
              <BooleanRow
                label="wouldRunTransaction"
                value={payload.wouldRunTransaction}
                copy={t}
                readyWhenTrue={false}
              />
              <BooleanRow
                label="wouldWriteRows"
                value={payload.wouldWriteRows}
                copy={t}
                readyWhenTrue={false}
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.probeResult}
            </h2>
            {probeError ? (
              <p className="mt-3 text-sm leading-6 text-rose-700">
                {probeError}
              </p>
            ) : probeResult ? (
              <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                <StatusPill tone="blocked">
                  blocked={String(probeResult.blocked)}
                </StatusPill>
                <p>{probeResult.summary}</p>
                <p>
                  {t.mode}:{" "}
                  {
                    probeResult.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationMode
                  }
                </p>
                <p>itemId: {probeResult.itemId ?? "none"}</p>
                <p>wouldWriteRows: {String(probeResult.wouldWriteRows)}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {t.noProbe}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-no-go"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                {t.openSourceNoGo}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation"
                className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                {t.openSourceReconciliation}
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
