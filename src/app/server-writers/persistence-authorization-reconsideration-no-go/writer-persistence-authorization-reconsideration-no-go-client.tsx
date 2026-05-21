"use client";

import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationReconsiderationNoGoItem,
  WriterPersistenceAuthorizationReconsiderationNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationNoGoProbeResult,
  WriterPersistenceAuthorizationReconsiderationNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-no-go";

type ClientPageProps = {
  payload: WriterPersistenceAuthorizationReconsiderationNoGoPayload;
};

const noGoCopy = {
  en: {
    title: "Persistence authorization reconsideration no-go packet",
    status: "No-go only",
    body: "This packet explains why the reconsideration preflight still cannot unlock implementation authorization. It does not accept preflight results, record no-go decisions, start reconsideration, grant authorization, create implementation work, or write data.",
    yes: "Yes",
    no: "No",
    mode: "Mode",
    checkedAt: "Checked at",
    itemCount: "No-go items",
    noGoCount: "External evidence no-go",
    manualBlocked: "Manual review blocked",
    stillBlocked: "Reconsideration still blocked",
    sourcePreflightItems: "Source preflight items",
    sourceBlockedItems: "Source blocked items",
    sourceExternal: "Source external missing",
    sourceManual: "Source manual required",
    safetyState: "Safety state",
    packetReady: "Reconsideration no-go packet ready",
    packetOnly: "Reconsideration no-go packet only",
    sourcePreflightReady: "Source preflight ready",
    sourcePreflightOnly: "Source preflight only",
    sourceReviewPacketReady: "Source review no-go packet ready",
    sourceReviewPacketOnly: "Source review no-go packet only",
    sourceReleaseBlocked: "Source release still blocked",
    preflightAccepted: "Preflight accepted",
    preflightRecorded: "Preflight recorded",
    reconsiderationEligible: "Reconsideration eligible",
    noGoAccepted: "Reconsideration no-go accepted",
    noGoRecorded: "Reconsideration no-go recorded",
    reconsiderationReady: "Authorization reconsideration ready",
    authorizationGranted: "Implementation authorization granted",
    readyForAdapter: "Ready for adapter implementation",
    runtimeEffects: "All runtime effects blocked",
    wouldAcceptNoGo: "Would accept reconsideration no-go",
    wouldRecordNoGo: "Would record reconsideration no-go",
    wouldDeny: "Would deny authorization from reconsideration",
    wouldPromoteRemediation: "Would promote reconsideration remediation",
    wouldAcceptPreflight: "Would accept preflight",
    wouldServiceRole: "Would create service-role client",
    wouldWriteRows: "Would write rows",
    wouldMigration: "Would create/apply migration",
    rules: "No-go rules",
    boundaryRules: "Remediation boundary rules",
    blockedCodes: "Blocked codes",
    question: "No-go question",
    conclusion: "No-go conclusion",
    blockingEvidence: "Blocking evidence",
    unresolvedGaps: "Unresolved preflight gaps",
    forbidden: "Forbidden shortcuts",
    requirements: "Reconsideration requirements",
    safeRefs: "Safe escalation refs",
    redaction: "Redaction rules",
    clauses: "Non-acceptance clauses",
    sourceRefs: "Source refs",
    nextSafeAction: "Next safe action",
    owner: "Owner",
    probe: "Probe item",
    probePanel: "Blocked probe result",
    probeBody:
      "Probe one no-go item to confirm this packet remains read-only and blocked.",
    loading: "Checking",
    statusLabels: {
      no_go_external_evidence_missing: "External evidence no-go",
      manual_review_blocked: "Manual review blocked",
    },
  },
  zh: {
    title: "持久化实现授权重审 no-go 包",
    status: "仅 no-go",
    body: "这份包说明为什么重审预检仍不能解锁实现授权。它不接受预检结果、不记录 no-go 决策、不启动重审、不授予授权、不创建实现工作，也不写入数据。",
    yes: "是",
    no: "否",
    mode: "模式",
    checkedAt: "检查时间",
    itemCount: "No-go 项",
    noGoCount: "外部证据 no-go",
    manualBlocked: "人工审查阻断",
    stillBlocked: "重审仍阻断",
    sourcePreflightItems: "来源预检项",
    sourceBlockedItems: "来源阻断项",
    sourceExternal: "来源外部证据缺失",
    sourceManual: "来源需要人工审查",
    safetyState: "安全状态",
    packetReady: "重审 no-go 包已就绪",
    packetOnly: "仅重审 no-go 包",
    sourcePreflightReady: "来源预检已就绪",
    sourcePreflightOnly: "来源预检只读",
    sourceReviewPacketReady: "来源审查 no-go 包已就绪",
    sourceReviewPacketOnly: "来源审查 no-go 包只读",
    sourceReleaseBlocked: "来源发布仍阻断",
    preflightAccepted: "预检已接受",
    preflightRecorded: "预检已记录",
    reconsiderationEligible: "可进入重审",
    noGoAccepted: "重审 no-go 已接受",
    noGoRecorded: "重审 no-go 已记录",
    reconsiderationReady: "授权重审已就绪",
    authorizationGranted: "已授予实现授权",
    readyForAdapter: "可实现适配器",
    runtimeEffects: "所有运行时副作用均阻断",
    wouldAcceptNoGo: "会接受重审 no-go",
    wouldRecordNoGo: "会记录重审 no-go",
    wouldDeny: "会由重审拒绝授权",
    wouldPromoteRemediation: "会推进重审补救",
    wouldAcceptPreflight: "会接受预检",
    wouldServiceRole: "会创建 service-role client",
    wouldWriteRows: "会写入数据行",
    wouldMigration: "会创建或应用 migration",
    rules: "No-go 规则",
    boundaryRules: "补救边界规则",
    blockedCodes: "阻断代码",
    question: "No-go 问题",
    conclusion: "No-go 结论",
    blockingEvidence: "阻断证据",
    unresolvedGaps: "未解决预检缺口",
    forbidden: "禁止捷径",
    requirements: "重审要求",
    safeRefs: "安全升级引用",
    redaction: "脱敏规则",
    clauses: "非接受条款",
    sourceRefs: "来源引用",
    nextSafeAction: "下一安全动作",
    owner: "负责人",
    probe: "探测项目",
    probePanel: "阻断探测结果",
    probeBody: "探测一个 no-go 项，确认该包仍然只读且被阻断。",
    loading: "检查中",
    statusLabels: {
      no_go_external_evidence_missing: "外部证据 no-go",
      manual_review_blocked: "人工审查阻断",
    },
  },
} as const;

type NoGoCopy = (typeof noGoCopy)[keyof typeof noGoCopy];

function getStatusTone(
  status: WriterPersistenceAuthorizationReconsiderationNoGoStatus,
) {
  return status === "no_go_external_evidence_missing" ? "blocked" : "planned";
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
  copy: NoGoCopy;
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

function NoGoItemCard({
  item,
  copy,
  onProbe,
  probingId,
}: {
  item: WriterPersistenceAuthorizationReconsiderationNoGoItem;
  copy: NoGoCopy;
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
            {copy.blockingEvidence}
          </h4>
          <TextList items={item.blockingEvidence} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.unresolvedGaps}
          </h4>
          <TextList items={item.unresolvedPreflightGaps} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.forbidden}
          </h4>
          <TextList items={item.forbiddenShortcuts} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.requirements}
          </h4>
          <TextList items={item.reconsiderationRequirements} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.safeRefs}
          </h4>
          <TextList items={item.safeEscalationRefs} />
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

export function WriterPersistenceAuthorizationReconsiderationNoGoClientPage({
  payload,
}: ClientPageProps) {
  const { locale } = useLanguage();
  const copy = noGoCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationReconsiderationNoGoProbeResult | null>(
      null,
    );
  const [probingId, setProbingId] = useState<string | null>(null);

  const safetyFlags = [
    { value: payload.reconsiderationNoGoPacketReady, label: copy.packetReady },
    { value: payload.reconsiderationNoGoPacketOnly, label: copy.packetOnly },
    {
      value: payload.sourcePreflightChecklistReady,
      label: copy.sourcePreflightReady,
    },
    {
      value: payload.sourcePreflightChecklistOnly,
      label: copy.sourcePreflightOnly,
    },
    {
      value: payload.sourceReviewNoGoPacketReady,
      label: copy.sourceReviewPacketReady,
    },
    {
      value: payload.sourceReviewNoGoPacketOnly,
      label: copy.sourceReviewPacketOnly,
    },
    { value: payload.sourceReleaseStillBlocked, label: copy.sourceReleaseBlocked },
    { value: payload.preflightAccepted, label: copy.preflightAccepted },
    { value: payload.preflightRecorded, label: copy.preflightRecorded },
    {
      value: payload.reconsiderationEligible,
      label: copy.reconsiderationEligible,
    },
    { value: payload.reconsiderationNoGoAccepted, label: copy.noGoAccepted },
    { value: payload.reconsiderationNoGoRecorded, label: copy.noGoRecorded },
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
      value: payload.wouldAcceptReconsiderationNoGo,
      label: copy.wouldAcceptNoGo,
    },
    {
      value: payload.wouldRecordReconsiderationNoGo,
      label: copy.wouldRecordNoGo,
    },
    {
      value: payload.wouldDenyImplementationAuthorizationFromReconsideration,
      label: copy.wouldDeny,
    },
    {
      value: payload.wouldPromoteToReconsiderationRemediation,
      label: copy.wouldPromoteRemediation,
    },
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
        "/api/system-writers/persistence-authorization-reconsideration-no-go",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceAuthorizationReconsiderationNoGoProbeResult;
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
        <Stat label={copy.mode} value={payload.reconsiderationNoGoMode} />
        <Stat label={copy.itemCount} value={payload.noGoItemCount} />
        <Stat label={copy.noGoCount} value={payload.noGoCount} />
        <Stat label={copy.manualBlocked} value={payload.manualReviewBlockedCount} />
        <Stat
          label={copy.stillBlocked}
          value={payload.reconsiderationStillBlockedCount}
        />
        <Stat
          label={copy.sourcePreflightItems}
          value={payload.sourcePreflightItemCount}
        />
        <Stat
          label={copy.sourceBlockedItems}
          value={payload.sourceBlockedPreflightItemCount}
        />
        <Stat
          label={copy.sourceExternal}
          value={payload.sourceExternalEvidenceMissingCount}
        />
        <Stat
          label={copy.sourceManual}
          value={payload.sourceManualReviewerRequiredCount}
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.rules}
            </h2>
            <TextList items={payload.noGoRules} />
          </section>

          {payload.noGoItems.map((item) => (
            <NoGoItemCard
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
            <TextList items={payload.remediationBoundaryRules} />
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
                  {copy.mode}: {probeResult.reconsiderationNoGoMode}
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
