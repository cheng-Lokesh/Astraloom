"use client";

import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationReconsiderationPreflightItem,
  WriterPersistenceAuthorizationReconsiderationPreflightPayload,
  WriterPersistenceAuthorizationReconsiderationPreflightProbeResult,
  WriterPersistenceAuthorizationReconsiderationPreflightStatus,
} from "@/types/writer-persistence-authorization-reconsideration-preflight";

type ClientPageProps = {
  payload: WriterPersistenceAuthorizationReconsiderationPreflightPayload;
};

const preflightCopy = {
  en: {
    title: "Persistence authorization reconsideration preflight checklist",
    status: "Preflight only",
    body: "This checklist defines what must be true before implementation authorization can be reconsidered. It does not accept no-go packets, start reconsideration, grant authorization, create implementation work, or write data.",
    yes: "Yes",
    no: "No",
    mode: "Mode",
    checkedAt: "Checked at",
    itemCount: "Preflight items",
    blockedItems: "Blocked items",
    externalMissing: "External evidence missing",
    manualRequired: "Manual reviewer required",
    sourceNoGoItems: "Source no-go items",
    sourceNoGo: "Source no-go",
    sourceManual: "Source manual blocked",
    safetyState: "Safety state",
    preflightReady: "Preflight checklist ready",
    preflightOnly: "Preflight checklist only",
    sourcePacketReady: "Source no-go packet ready",
    sourcePacketOnly: "Source no-go packet only",
    sourceReleaseBlocked: "Source release still blocked",
    preflightPassed: "Preflight passed",
    preflightAccepted: "Preflight accepted",
    preflightRecorded: "Preflight recorded",
    reconsiderationEligible: "Reconsideration eligible",
    reconsiderationReady: "Authorization reconsideration ready",
    authorizationGranted: "Implementation authorization granted",
    readyForAdapter: "Ready for adapter implementation",
    runtimeEffects: "All runtime effects blocked",
    wouldAcceptPreflight: "Would accept preflight",
    wouldRecordPreflight: "Would record preflight",
    wouldMarkReady: "Would mark reconsideration ready",
    wouldStartReconsideration: "Would start reconsideration",
    wouldAcceptNoGo: "Would accept review no-go",
    wouldServiceRole: "Would create service-role client",
    wouldWriteRows: "Would write rows",
    wouldMigration: "Would create/apply migration",
    rules: "Preflight rules",
    boundaryRules: "Reconsideration boundary rules",
    blockedCodes: "Blocked codes",
    question: "Preflight question",
    finding: "Current finding",
    missing: "Missing prerequisites",
    externalInputs: "Required external inputs",
    reviewerQuestions: "Reviewer questions",
    redaction: "Redaction rules",
    forbidden: "Forbidden shortcuts",
    clauses: "Non-acceptance clauses",
    exitCriteria: "Reconsideration exit criteria",
    sourceRefs: "Source refs",
    nextSafeAction: "Next safe action",
    owner: "Owner",
    statusLabel: "Status",
    probe: "Probe item",
    probePanel: "Blocked probe result",
    probeBody:
      "Probe one preflight item to confirm this checklist remains read-only and blocked.",
    loading: "Checking",
    statusLabels: {
      blocked_external_evidence_missing: "External evidence missing",
      blocked_manual_review_required: "Manual review required",
    },
  },
  zh: {
    title: "持久化实现授权重新考虑预检清单",
    status: "仅预检",
    body: "这份清单定义未来重新考虑实现授权前必须满足的条件。它不接受 no-go、不启动重新评估、不授予授权、不创建实现工作，也不写入数据。",
    yes: "是",
    no: "否",
    mode: "模式",
    checkedAt: "检查时间",
    itemCount: "预检项",
    blockedItems: "阻断项",
    externalMissing: "外部证据缺失",
    manualRequired: "需要人工审查",
    sourceNoGoItems: "来源 no-go 项",
    sourceNoGo: "来源 no-go",
    sourceManual: "来源人工阻断",
    safetyState: "安全状态",
    preflightReady: "预检清单已就绪",
    preflightOnly: "仅预检清单",
    sourcePacketReady: "来源 no-go 包已就绪",
    sourcePacketOnly: "来源 no-go 包只读",
    sourceReleaseBlocked: "来源发布仍阻断",
    preflightPassed: "预检已通过",
    preflightAccepted: "预检已接受",
    preflightRecorded: "预检已记录",
    reconsiderationEligible: "可进入重新考虑",
    reconsiderationReady: "授权重新考虑已就绪",
    authorizationGranted: "已授予实现授权",
    readyForAdapter: "可实现适配器",
    runtimeEffects: "所有运行时副作用均阻断",
    wouldAcceptPreflight: "会接受预检",
    wouldRecordPreflight: "会记录预检",
    wouldMarkReady: "会标记重新考虑就绪",
    wouldStartReconsideration: "会启动重新考虑",
    wouldAcceptNoGo: "会接受审查 no-go",
    wouldServiceRole: "会创建 service-role client",
    wouldWriteRows: "会写入数据行",
    wouldMigration: "会创建或应用 migration",
    rules: "预检规则",
    boundaryRules: "重新考虑边界规则",
    blockedCodes: "阻断代码",
    question: "预检问题",
    finding: "当前结论",
    missing: "缺失前置条件",
    externalInputs: "所需外部输入",
    reviewerQuestions: "审查问题",
    redaction: "脱敏规则",
    forbidden: "禁止捷径",
    clauses: "非接受条款",
    exitCriteria: "重新考虑退出条件",
    sourceRefs: "来源引用",
    nextSafeAction: "下一安全动作",
    owner: "负责人",
    statusLabel: "状态",
    probe: "探测项目",
    probePanel: "阻断探测结果",
    probeBody: "探测一个预检项，确认该清单仍然只读且被阻断。",
    loading: "检查中",
    statusLabels: {
      blocked_external_evidence_missing: "外部证据缺失",
      blocked_manual_review_required: "需要人工审查",
    },
  },
} as const;

type PreflightCopy = (typeof preflightCopy)[keyof typeof preflightCopy];

function getStatusTone(
  status: WriterPersistenceAuthorizationReconsiderationPreflightStatus,
) {
  return status === "blocked_external_evidence_missing"
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
}: {
  value: boolean;
  label: string;
  copy: PreflightCopy;
}) {
  return (
    <StatusPill tone={value ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function TextList({ items }: { items: string[] }) {
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

function PreflightItemCard({
  item,
  copy,
  onProbe,
  probingId,
}: {
  item: WriterPersistenceAuthorizationReconsiderationPreflightItem;
  copy: PreflightCopy;
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
        <StatusPill tone={getStatusTone(item.status)}>
          {copy.statusLabels[item.status]}
        </StatusPill>
      </div>

      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <p>
          <span className="font-semibold">{copy.question}: </span>
          {item.preflightQuestion}
        </p>
        <p className="mt-2">
          <span className="font-semibold">{copy.finding}: </span>
          {item.currentFinding}
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.missing}
          </h4>
          <TextList items={item.missingPrerequisites} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.externalInputs}
          </h4>
          <TextList items={item.requiredExternalInputs} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.reviewerQuestions}
          </h4>
          <TextList items={item.reviewerQuestions} />
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
          <TextList items={item.forbiddenShortcuts} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.exitCriteria}
          </h4>
          <TextList items={item.reconsiderationExitCriteria} />
        </section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.clauses}
          </h4>
          <TextList items={item.nonAcceptanceClauses} />
        </section>
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.sourceRefs}
          </h4>
          <TextList items={item.sourceRefs} />
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {copy.nextSafeAction}: {item.nextSafeAction}
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

export function WriterPersistenceAuthorizationReconsiderationPreflightClientPage({
  payload,
}: ClientPageProps) {
  const { locale } = useLanguage();
  const copy = preflightCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationReconsiderationPreflightProbeResult | null>(
      null,
    );
  const [probingId, setProbingId] = useState<string | null>(null);

  const safetyFlags = [
    {
      value: payload.reconsiderationPreflightChecklistReady,
      label: copy.preflightReady,
    },
    {
      value: payload.reconsiderationPreflightChecklistOnly,
      label: copy.preflightOnly,
    },
    { value: payload.sourceReviewNoGoPacketReady, label: copy.sourcePacketReady },
    { value: payload.sourceReviewNoGoPacketOnly, label: copy.sourcePacketOnly },
    { value: payload.sourceReleaseStillBlocked, label: copy.sourceReleaseBlocked },
    { value: payload.preflightPassed, label: copy.preflightPassed },
    { value: payload.preflightAccepted, label: copy.preflightAccepted },
    { value: payload.preflightRecorded, label: copy.preflightRecorded },
    {
      value: payload.reconsiderationEligible,
      label: copy.reconsiderationEligible,
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
    { value: payload.allRuntimeEffectsBlocked, label: copy.runtimeEffects },
  ];

  const runtimeFlags = [
    {
      value: payload.wouldAcceptReconsiderationPreflight,
      label: copy.wouldAcceptPreflight,
    },
    {
      value: payload.wouldRecordReconsiderationPreflight,
      label: copy.wouldRecordPreflight,
    },
    {
      value: payload.wouldMarkReconsiderationReady,
      label: copy.wouldMarkReady,
    },
    {
      value: payload.wouldStartAuthorizationReconsideration,
      label: copy.wouldStartReconsideration,
    },
    {
      value: payload.wouldAcceptRemediationReviewNoGo,
      label: copy.wouldAcceptNoGo,
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
        "/api/system-writers/persistence-authorization-reconsideration-preflight",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceAuthorizationReconsiderationPreflightProbeResult;
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
        <StatusPill tone="blocked">{copy.status}</StatusPill>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label={copy.mode} value={payload.reconsiderationPreflightMode} />
        <Stat label={copy.itemCount} value={payload.preflightItemCount} />
        <Stat label={copy.blockedItems} value={payload.blockedPreflightItemCount} />
        <Stat
          label={copy.externalMissing}
          value={payload.externalEvidenceMissingCount}
        />
        <Stat
          label={copy.manualRequired}
          value={payload.manualReviewerRequiredCount}
        />
        <Stat label={copy.sourceNoGoItems} value={payload.sourceNoGoItemCount} />
        <Stat label={copy.sourceNoGo} value={payload.sourceNoGoCount} />
        <Stat label={copy.sourceManual} value={payload.sourceManualReviewBlockedCount} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.rules}
            </h2>
            <TextList items={payload.preflightRules} />
          </section>

          {payload.preflightItems.map((item) => (
            <PreflightItemCard
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
              {safetyFlags.map((flag) => (
                <BooleanPill
                  key={flag.label}
                  value={flag.value}
                  label={flag.label}
                  copy={copy}
                />
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              Runtime
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {runtimeFlags.map((flag) => (
                <BooleanPill
                  key={flag.label}
                  value={flag.value}
                  label={flag.label}
                  copy={copy}
                />
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-amber-950">
              {copy.boundaryRules}
            </h2>
            <TextList items={payload.reconsiderationBoundaryRules} />
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
                <p>
                  blocked: {probeResult.blocked ? copy.yes : copy.no}
                </p>
                <p>
                  {copy.mode}: {probeResult.reconsiderationPreflightMode}
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
            <h2 className="text-base font-semibold text-slate-950">
              {copy.checkedAt}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{payload.checkedAt}</p>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
