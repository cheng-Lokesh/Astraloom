"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation";

type ClientPageProps = {
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationPayload;
};

const copy = {
  en: {
    title: "Persistence authorization archive remediation",
    status: "Read-only remediation plan",
    body: "This plan maps every external final decision archive no-go item to external owner actions and safe evidence requirements. It still cannot accept archives, accept decisions, record go/no-go, authorize implementation, deploy, or write rows.",
    mode: "Mode",
    checkedAt: "Checked at",
    remediationItems: "Remediation items",
    externalRequired: "External remediation",
    manualRequired: "Manual review",
    sourceNoGo: "Source no-go items",
    sourceBlocked: "Source blocked",
    ready: "Ready",
    blocked: "Blocked",
    falseLabel: "False",
    trueLabel: "True",
    planRules: "Remediation plan rules",
    reviewRules: "Next review rules",
    safetyState: "Safety state",
    runtimeState: "Runtime state",
    items: "Archive remediation items",
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
    openNoGo: "Open archive no-go",
    openArchive: "Open archive checklist",
    openDashboard: "Back to dashboard",
    statusLabels: {
      archive_external_remediation_required: "External remediation required",
      archive_manual_review_required: "Manual review required",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationStatus,
      string
    >,
  },
  zh: {
    title: "持久化授权归档补救计划",
    status: "只读补救计划",
    body: "本计划把每一个外部最终决策归档 No-go 项映射为外部负责人动作和安全证据要求。它仍然不能接受归档、接受决策、记录 Go/No-go、授权实现、部署或写入数据库。",
    mode: "模式",
    checkedAt: "检查时间",
    remediationItems: "补救项",
    externalRequired: "外部补救",
    manualRequired: "人工复核",
    sourceNoGo: "来源 No-go 项",
    sourceBlocked: "来源阻断",
    ready: "已就绪",
    blocked: "已阻断",
    falseLabel: "否",
    trueLabel: "是",
    planRules: "补救计划规则",
    reviewRules: "下一轮复核规则",
    safetyState: "安全状态",
    runtimeState: "运行时状态",
    items: "归档补救项",
    blockerSummary: "阻断原因",
    objective: "补救目标",
    externalActions: "外部动作",
    evidence: "安全证据",
    verification: "验证步骤",
    acceptance: "验收条件",
    residualRisks: "剩余风险",
    forbidden: "禁止动作",
    exit: "退出条件",
    refs: "来源引用",
    sourceIds: "来源 ID",
    probe: "探测补救项",
    probeResult: "阻断探针结果",
    noProbe: "尚未选择探针。",
    openNoGo: "打开归档 No-go",
    openArchive: "打开归档清单",
    openDashboard: "返回工作台",
    statusLabels: {
      archive_external_remediation_required: "需要外部补救",
      archive_manual_review_required: "需要人工复核",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationStatus,
      string
    >,
  },
} as const;

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
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
  trueLabel,
  falseLabel,
}: {
  label: string;
  value: boolean;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-b-0">
      <span className="text-slate-600">{label}</span>
      <StatusPill tone={value ? "ready" : "blocked"}>
        {value ? trueLabel : falseLabel}
      </StatusPill>
    </div>
  );
}

function TextList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-slate-600">
      {items.map((item) => (
        <li key={item} className="rounded-md bg-slate-50 px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  );
}

function ItemCard({
  item,
  statusLabel,
  onProbe,
  probeLabel,
}: {
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationItem;
  statusLabel: string;
  onProbe: (itemId: string) => void;
  probeLabel: string;
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
        <StatusPill tone="blocked">{statusLabel}</StatusPill>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Blocker
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {item.blockerSummary}
          </p>
        </section>
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Objective
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {item.remediationObjective}
          </p>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TextList items={item.externalActions} />
        <TextList items={item.safeEvidenceRequirements} />
      </div>

      <details className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">
          Verification, risks, and boundaries
        </summary>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <TextList items={item.verificationSteps} />
          <TextList items={item.acceptanceCriteria} />
          <TextList items={item.residualRisks} />
          <TextList items={item.forbiddenActions} />
          <TextList items={item.exitCriteria} />
          <TextList
            items={[
              ...item.sourceArchiveNoGoItemIds,
              ...item.sourceArchiveItemIds,
              ...item.sourceDecisionItemIds,
            ]}
          />
        </div>
      </details>

      <button
        type="button"
        onClick={() => onProbe(item.id)}
        className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
      >
        {probeLabel}
      </button>
    </article>
  );
}

export function WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationClientPage({
  payload,
}: ClientPageProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationProbeResult | null>(
      null,
    );
  const [probeError, setProbeError] = useState<string | null>(null);

  async function probeItem(itemId: string) {
    setProbeError(null);
    try {
      const response = await fetch(
        "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        },
      );
      setProbeResult(await response.json());
    } catch (error) {
      setProbeError(error instanceof Error ? error.message : "Probe failed");
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
        <StatusPill tone="blocked">{t.status}</StatusPill>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label={t.mode} value={payload.externalFinalDecisionArchiveRemediationMode} />
        <Stat label={t.remediationItems} value={payload.remediationItemCount} />
        <Stat
          label={t.externalRequired}
          value={payload.externalArchiveRemediationRequiredCount}
        />
        <Stat
          label={t.manualRequired}
          value={payload.manualArchiveReviewRequiredCount}
        />
        <Stat label={t.sourceNoGo} value={payload.sourceArchiveNoGoItemCount} />
        <Stat label={t.sourceBlocked} value={payload.sourceArchiveStillBlockedCount} />
        <Stat label={t.checkedAt} value={payload.checkedAt} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.planRules}
            </h2>
            <div className="mt-4">
              <TextList items={payload.archiveRemediationPlanRules} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.reviewRules}
            </h2>
            <div className="mt-4">
              <TextList items={payload.archiveRemediationReviewRules} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-slate-950">
              {t.items}
            </h2>
            {payload.archiveRemediationItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                statusLabel={t.statusLabels[item.status]}
                onProbe={probeItem}
                probeLabel={t.probe}
              />
            ))}
          </section>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.safetyState}
            </h2>
            <div className="mt-4">
              <BooleanRow
                label="externalFinalDecisionArchiveRemediationPlanReady"
                value={payload.externalFinalDecisionArchiveRemediationPlanReady}
                trueLabel={t.trueLabel}
                falseLabel={t.falseLabel}
              />
              <BooleanRow
                label="externalFinalDecisionArchiveRemediationPlanOnly"
                value={payload.externalFinalDecisionArchiveRemediationPlanOnly}
                trueLabel={t.trueLabel}
                falseLabel={t.falseLabel}
              />
              <BooleanRow
                label="sourceExternalFinalDecisionArchiveNoGoPacketReady"
                value={payload.sourceExternalFinalDecisionArchiveNoGoPacketReady}
                trueLabel={t.trueLabel}
                falseLabel={t.falseLabel}
              />
              <BooleanRow
                label="allRuntimeEffectsBlocked"
                value={payload.allRuntimeEffectsBlocked}
                trueLabel={t.trueLabel}
                falseLabel={t.falseLabel}
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.runtimeState}
            </h2>
            <div className="mt-4">
              <BooleanRow
                label="externalFinalDecisionArchiveRemediationAccepted"
                value={payload.externalFinalDecisionArchiveRemediationAccepted}
                trueLabel={t.trueLabel}
                falseLabel={t.falseLabel}
              />
              <BooleanRow
                label="externalFinalDecisionArchiveRemediationRecorded"
                value={payload.externalFinalDecisionArchiveRemediationRecorded}
                trueLabel={t.trueLabel}
                falseLabel={t.falseLabel}
              />
              <BooleanRow
                label="finalDecisionArchiveNoGoAccepted"
                value={payload.finalDecisionArchiveNoGoAccepted}
                trueLabel={t.trueLabel}
                falseLabel={t.falseLabel}
              />
              <BooleanRow
                label="externalFinalDecisionArchiveAccepted"
                value={payload.externalFinalDecisionArchiveAccepted}
                trueLabel={t.trueLabel}
                falseLabel={t.falseLabel}
              />
              <BooleanRow
                label="authorizationReconsiderationFinalDecisionAccepted"
                value={payload.authorizationReconsiderationFinalDecisionAccepted}
                trueLabel={t.trueLabel}
                falseLabel={t.falseLabel}
              />
              <BooleanRow
                label="implementationAuthorizationGranted"
                value={payload.implementationAuthorizationGranted}
                trueLabel={t.trueLabel}
                falseLabel={t.falseLabel}
              />
              <BooleanRow
                label="wouldWriteRows"
                value={payload.wouldWriteRows}
                trueLabel={t.trueLabel}
                falseLabel={t.falseLabel}
              />
              <BooleanRow
                label="wouldCreateServiceRoleClient"
                value={payload.wouldCreateServiceRoleClient}
                trueLabel={t.trueLabel}
                falseLabel={t.falseLabel}
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
                  {t.mode}: {probeResult.externalFinalDecisionArchiveRemediationMode}
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
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-no-go"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                {t.openNoGo}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive"
                className="rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
              >
                {t.openArchive}
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
