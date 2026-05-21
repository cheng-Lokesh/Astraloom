"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationReconsiderationRemediationItem,
  WriterPersistenceAuthorizationReconsiderationRemediationPayload,
  WriterPersistenceAuthorizationReconsiderationRemediationProbeResult,
  WriterPersistenceAuthorizationReconsiderationRemediationStatus,
} from "@/types/writer-persistence-authorization-reconsideration-remediation";

type ClientPageProps = {
  payload: WriterPersistenceAuthorizationReconsiderationRemediationPayload;
};

const remediationCopy = {
  en: {
    title: "Persistence authorization reconsideration remediation plan",
    badge: "Remediation plan only",
    body: "This page maps authorization reconsideration no-go blockers to external remediation work. It remains read-only and cannot accept remediation, record evidence, resolve blockers, start reconsideration, grant authorization, or write data.",
    yes: "Yes",
    no: "No",
    mode: "Mode",
    sourceMode: "Source no-go mode",
    checkedAt: "Checked at",
    itemCount: "Remediation items",
    externalCount: "External remediation",
    manualCount: "Manual review",
    actionCount: "External actions",
    evidenceCount: "Safe evidence requirements",
    verificationCount: "Verification steps",
    criteriaCount: "Acceptance criteria",
    sourceNoGoItems: "Source no-go items",
    sourceNoGoCount: "Source external no-go",
    sourceManualCount: "Source manual blocked",
    sourceStillBlocked: "Source still blocked",
    safetyState: "Safety state",
    runtimeState: "Runtime state",
    planReady: "Reconsideration remediation plan ready",
    planOnly: "Reconsideration remediation plan only",
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
    reconsiderationReady: "Authorization reconsideration ready",
    authorizationGranted: "Implementation authorization granted",
    readyForAdapter: "Ready for adapter implementation",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldAcceptRemediation: "Would accept reconsideration remediation",
    wouldRecordRemediation: "Would record remediation evidence",
    wouldResolveBlocker: "Would mark reconsideration blocker resolved",
    wouldCreateTicket: "Would create remediation ticket",
    wouldAcceptNoGo: "Would accept reconsideration no-go",
    wouldAcceptPreflight: "Would accept preflight",
    wouldServiceRole: "Would create service-role client",
    wouldWriteRows: "Would write rows",
    wouldMigration: "Would create/apply migration",
    rules: "Remediation plan rules",
    reviewRules: "Review rules",
    blockedCodes: "Blocked codes",
    blockerSummary: "Blocker summary",
    objective: "Remediation objective",
    externalActions: "External actions",
    safeEvidence: "Safe evidence",
    verification: "Verification",
    criteria: "Acceptance criteria",
    residualRisks: "Residual risks",
    redaction: "Redaction",
    forbidden: "Forbidden actions",
    clauses: "Non-execution clauses",
    exitCriteria: "Exit criteria",
    sourceRefs: "Source refs",
    nextReviewGate: "Next review gate",
    owner: "Owner",
    probe: "Probe item",
    probePanel: "Blocked probe result",
    probeBody:
      "Probe one remediation item to confirm this plan remains read-only and blocked.",
    loading: "Checking",
    openNoGo: "Open reconsideration no-go",
    openDashboard: "Back to dashboard",
    statusLabels: {
      external_remediation_required: "External remediation required",
      manual_review_required: "Manual review required",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationRemediationStatus,
      string
    >,
  },
  zh: {
    title: "持久化实现授权重审补救计划",
    badge: "仅补救计划",
    body: "这个页面把授权重审 no-go 阻断项映射为外部补救工作。它保持只读，不能接受补救、记录证据、标记阻断解决、启动重审、授予授权或写入数据。",
    yes: "是",
    no: "否",
    mode: "模式",
    sourceMode: "来源 no-go 模式",
    checkedAt: "检查时间",
    itemCount: "补救项",
    externalCount: "外部补救",
    manualCount: "人工审查",
    actionCount: "外部动作",
    evidenceCount: "安全证据要求",
    verificationCount: "验证步骤",
    criteriaCount: "验收条件",
    sourceNoGoItems: "来源 no-go 项",
    sourceNoGoCount: "来源外部 no-go",
    sourceManualCount: "来源人工阻断",
    sourceStillBlocked: "来源仍阻断",
    safetyState: "安全状态",
    runtimeState: "运行时状态",
    planReady: "重审补救计划已就绪",
    planOnly: "仅重审补救计划",
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
    reconsiderationReady: "授权重审已就绪",
    authorizationGranted: "已授予实现授权",
    readyForAdapter: "可实现适配器",
    allRuntimeBlocked: "所有运行时副作用均阻断",
    wouldAcceptRemediation: "会接受重审补救",
    wouldRecordRemediation: "会记录补救证据",
    wouldResolveBlocker: "会标记重审阻断解决",
    wouldCreateTicket: "会创建补救工单",
    wouldAcceptNoGo: "会接受重审 no-go",
    wouldAcceptPreflight: "会接受预检",
    wouldServiceRole: "会创建 service-role client",
    wouldWriteRows: "会写入数据行",
    wouldMigration: "会创建或应用 migration",
    rules: "补救计划规则",
    reviewRules: "审查规则",
    blockedCodes: "阻断代码",
    blockerSummary: "阻断摘要",
    objective: "补救目标",
    externalActions: "外部动作",
    safeEvidence: "安全证据",
    verification: "验证",
    criteria: "验收条件",
    residualRisks: "残余风险",
    redaction: "脱敏",
    forbidden: "禁止动作",
    clauses: "不执行条款",
    exitCriteria: "退出条件",
    sourceRefs: "来源引用",
    nextReviewGate: "下一审查关口",
    owner: "负责人",
    probe: "探测项目",
    probePanel: "阻断探测结果",
    probeBody: "探测一个补救项，确认该计划仍然只读且被阻断。",
    loading: "检查中",
    openNoGo: "打开重审 No-go",
    openDashboard: "返回工作台",
    statusLabels: {
      external_remediation_required: "需要外部补救",
      manual_review_required: "需要人工审查",
    } satisfies Record<
      WriterPersistenceAuthorizationReconsiderationRemediationStatus,
      string
    >,
  },
} as const;

type RemediationCopy =
  (typeof remediationCopy)[keyof typeof remediationCopy];

function statusTone(
  status: WriterPersistenceAuthorizationReconsiderationRemediationStatus,
) {
  return status === "external_remediation_required" ? "blocked" : "planned";
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
  copy: RemediationCopy;
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
  item: WriterPersistenceAuthorizationReconsiderationRemediationItem;
  copy: RemediationCopy;
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
          <span className="font-semibold">{copy.blockerSummary}: </span>
          {item.blockerSummary}
        </p>
        <p className="mt-2">
          <span className="font-semibold">{copy.objective}: </span>
          {item.remediationObjective}
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.externalActions}
          </h4>
          <TextList items={item.externalActions} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.safeEvidence}
          </h4>
          <TextList items={item.safeEvidenceRequirements} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.verification}
          </h4>
          <TextList items={item.verificationSteps} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.criteria}
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
            {copy.redaction}
          </h4>
          <TextList items={item.redactionRules} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.forbidden}
          </h4>
          <TextList items={item.forbiddenActions} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.clauses}
          </h4>
          <TextList items={item.nonExecutionClauses} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.exitCriteria}
          </h4>
          <TextList items={item.exitCriteria} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.sourceRefs}
          </h4>
          <TextList items={item.sourceRefs} />
          <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {copy.nextReviewGate}: {item.nextReviewGate}
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

export function WriterPersistenceAuthorizationReconsiderationRemediationClientPage({
  payload,
}: ClientPageProps) {
  const { locale } = useLanguage();
  const copy = remediationCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationReconsiderationRemediationProbeResult | null>(
      null,
    );
  const [probingId, setProbingId] = useState<string | null>(null);

  const trueFlags = [
    { value: payload.reconsiderationRemediationPlanReady, label: copy.planReady },
    { value: payload.reconsiderationRemediationPlanOnly, label: copy.planOnly },
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
      value: payload.wouldAcceptReconsiderationRemediation,
      label: copy.wouldAcceptRemediation,
    },
    {
      value: payload.wouldRecordReconsiderationRemediationEvidence,
      label: copy.wouldRecordRemediation,
    },
    {
      value: payload.wouldMarkReconsiderationBlockerResolved,
      label: copy.wouldResolveBlocker,
    },
    {
      value: payload.wouldCreateReconsiderationRemediationTicket,
      label: copy.wouldCreateTicket,
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
        "/api/system-writers/persistence-authorization-reconsideration-remediation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceAuthorizationReconsiderationRemediationProbeResult;
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
        <Stat label={copy.mode} value={payload.reconsiderationRemediationMode} />
        <Stat label={copy.sourceMode} value={payload.sourceReconsiderationNoGoMode} />
        <Stat label={copy.itemCount} value={payload.remediationItemCount} />
        <Stat
          label={copy.externalCount}
          value={payload.externalRemediationRequiredCount}
        />
        <Stat label={copy.manualCount} value={payload.manualReviewRequiredCount} />
        <Stat label={copy.actionCount} value={payload.externalActionCount} />
        <Stat
          label={copy.evidenceCount}
          value={payload.safeEvidenceRequirementCount}
        />
        <Stat
          label={copy.verificationCount}
          value={payload.verificationStepCount}
        />
        <Stat
          label={copy.criteriaCount}
          value={payload.acceptanceCriteriaCount}
        />
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
            <TextList items={payload.remediationPlanRules} />
          </section>

          {payload.remediationItems.map((item) => (
            <RemediationItemCard
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

          <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-amber-950">
              {copy.reviewRules}
            </h2>
            <TextList items={payload.remediationReviewRules} />
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
                  {copy.mode}: {probeResult.reconsiderationRemediationMode}
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
                href="/server-writers/persistence-authorization-reconsideration-no-go"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                {copy.openNoGo}
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
