"use client";

import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationRemediationReviewNoGoItem,
  WriterPersistenceAuthorizationRemediationReviewNoGoPayload,
  WriterPersistenceAuthorizationRemediationReviewNoGoProbeResult,
  WriterPersistenceAuthorizationRemediationReviewNoGoStatus,
} from "@/types/writer-persistence-authorization-remediation-review-no-go";

type ClientPageProps = {
  payload: WriterPersistenceAuthorizationRemediationReviewNoGoPayload;
};

const noGoCopy = {
  en: {
    title: "Persistence authorization remediation review no-go packet",
    status: "No-go only",
    body: "This packet explains why the remediation review still cannot unlock implementation authorization. It does not accept, record, deny, grant, write, migrate, or create implementation work.",
    yes: "Yes",
    no: "No",
    mode: "Mode",
    checkedAt: "Checked at",
    noGoItems: "No-go items",
    noGoCount: "No-go",
    manualBlocked: "Manual blocked",
    stillBlocked: "Reconsideration still blocked",
    sourceItems: "Source review items",
    sourceExternal: "Source external missing",
    sourceManual: "Source manual required",
    safetyState: "Safety state",
    packetReady: "No-go packet ready",
    packetOnly: "No-go packet only",
    sourceChecklistReady: "Source review checklist ready",
    sourceChecklistOnly: "Source review checklist only",
    sourcePlanReady: "Source remediation plan ready",
    releaseBlocked: "Source release still blocked",
    externalStatesAccepted: "External remediation states accepted",
    reviewAccepted: "Remediation review accepted",
    reviewComplete: "Remediation review complete",
    noGoAccepted: "Review no-go accepted",
    noGoRecorded: "Review no-go recorded",
    reconsiderationReady: "Authorization reconsideration ready",
    authorizationGranted: "Implementation authorization granted",
    readyForAdapter: "Ready for adapter implementation",
    runtimeEffects: "All runtime effects blocked",
    wouldAcceptNoGo: "Would accept review no-go",
    wouldRecordNoGo: "Would record review no-go",
    wouldDenyFromReview: "Would deny authorization from review",
    wouldPromote: "Would promote reconsideration",
    wouldServiceRole: "Would create service-role client",
    wouldWriteRows: "Would write rows",
    wouldMigration: "Would create/apply migration",
    rules: "No-go rules",
    reconsiderationRules: "Reconsideration rules",
    blockedCodes: "Blocked codes",
    noGoQuestion: "No-go question",
    noGoConclusion: "No-go conclusion",
    blockingEvidence: "Blocking evidence",
    unresolvedGaps: "Unresolved review gaps",
    forbiddenShortcuts: "Forbidden shortcuts",
    requirements: "Reconsideration requirements",
    safeRefs: "Safe escalation refs",
    redaction: "Redaction rules",
    clauses: "Non-acceptance clauses",
    sourceNoGo: "Source no-go ids",
    sourceRefs: "Source refs",
    nextSafeAction: "Next safe action",
    owner: "Owner",
    probe: "Probe item",
    probePanel: "Blocked probe result",
    probeBody:
      "Probe one no-go item to confirm this packet remains read-only and blocked.",
    loading: "Checking",
    statusLabels: {
      no_go: "No-go",
      manual_review_blocked: "Manual review blocked",
    },
  },
  zh: {
    title: "持久化实现授权补救审查 no-go 包",
    status: "仅 no-go",
    body: "这个包说明为什么补救审查仍不能解锁实现授权。它不接受、不记录、不拒绝授权、不授予授权、不写入、不迁移，也不创建实现工作。",
    yes: "是",
    no: "否",
    mode: "模式",
    checkedAt: "检查时间",
    noGoItems: "No-go 项",
    noGoCount: "No-go",
    manualBlocked: "人工阻断",
    stillBlocked: "重新评估仍阻断",
    sourceItems: "来源审查项",
    sourceExternal: "来源外部证据缺失",
    sourceManual: "来源需人工审查",
    safetyState: "安全状态",
    packetReady: "No-go 包已就绪",
    packetOnly: "仅 no-go 包",
    sourceChecklistReady: "来源审查清单已就绪",
    sourceChecklistOnly: "来源审查清单只读",
    sourcePlanReady: "来源补救计划已就绪",
    releaseBlocked: "来源发布仍阻断",
    externalStatesAccepted: "已接受外部补救状态",
    reviewAccepted: "已接受补救审查",
    reviewComplete: "补救审查已完成",
    noGoAccepted: "已接受审查 no-go",
    noGoRecorded: "已记录审查 no-go",
    reconsiderationReady: "授权重新评估已就绪",
    authorizationGranted: "已授予实现授权",
    readyForAdapter: "已可实现适配器",
    runtimeEffects: "所有运行时副作用均阻断",
    wouldAcceptNoGo: "会接受审查 no-go",
    wouldRecordNoGo: "会记录审查 no-go",
    wouldDenyFromReview: "会由审查拒绝授权",
    wouldPromote: "会推进重新评估",
    wouldServiceRole: "会创建 service-role client",
    wouldWriteRows: "会写入数据行",
    wouldMigration: "会创建/应用 migration",
    rules: "No-go 规则",
    reconsiderationRules: "重新评估规则",
    blockedCodes: "阻断代码",
    noGoQuestion: "No-go 问题",
    noGoConclusion: "No-go 结论",
    blockingEvidence: "阻断证据",
    unresolvedGaps: "未解决审查缺口",
    forbiddenShortcuts: "禁止捷径",
    requirements: "重新评估要求",
    safeRefs: "安全升级引用",
    redaction: "脱敏规则",
    clauses: "非接受条款",
    sourceNoGo: "来源 no-go id",
    sourceRefs: "来源引用",
    nextSafeAction: "下一安全动作",
    owner: "负责人",
    probe: "探测项目",
    probePanel: "阻断探针结果",
    probeBody: "探测一个 no-go 项，确认该包仍然只读且被阻断。",
    loading: "检查中",
    statusLabels: {
      no_go: "No-go",
      manual_review_blocked: "人工审查阻断",
    },
  },
} as const;

type NoGoCopy = (typeof noGoCopy)[keyof typeof noGoCopy];

function getStatusTone(
  status: WriterPersistenceAuthorizationRemediationReviewNoGoStatus,
) {
  return status === "no_go" ? "blocked" : "planned";
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
  item: WriterPersistenceAuthorizationRemediationReviewNoGoItem;
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
            {copy.owner}: {item.owner} · {copy.nextSafeAction}:{" "}
            {item.nextSafeAction}
          </p>
        </div>
        <StatusPill tone={getStatusTone(item.status)}>
          {copy.statusLabels[item.status]}
        </StatusPill>
      </div>

      <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">
        <p>
          <span className="font-semibold">{copy.noGoQuestion}: </span>
          {item.noGoQuestion}
        </p>
        <p className="mt-2">
          <span className="font-semibold">{copy.noGoConclusion}: </span>
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
          <TextList items={item.unresolvedReviewGaps} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.forbiddenShortcuts}
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
            {copy.sourceNoGo}
          </h4>
          <TextList items={item.sourceNoGoItemIds} />
          <h4 className="mt-4 text-sm font-semibold text-slate-950">
            {copy.sourceRefs}
          </h4>
          <TextList items={item.sourceRefs} />
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

export function WriterPersistenceAuthorizationRemediationReviewNoGoClientPage({
  payload,
}: ClientPageProps) {
  const { locale } = useLanguage();
  const copy = noGoCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationRemediationReviewNoGoProbeResult | null>(
      null,
    );
  const [probingId, setProbingId] = useState<string | null>(null);

  const safetyFlags = [
    { value: payload.reviewNoGoPacketReady, label: copy.packetReady },
    { value: payload.reviewNoGoPacketOnly, label: copy.packetOnly },
    {
      value: payload.sourceReviewChecklistReady,
      label: copy.sourceChecklistReady,
    },
    {
      value: payload.sourceReviewChecklistOnly,
      label: copy.sourceChecklistOnly,
    },
    { value: payload.sourceRemediationPlanReady, label: copy.sourcePlanReady },
    { value: payload.sourceReleaseStillBlocked, label: copy.releaseBlocked },
    {
      value: payload.externalRemediationStatesAccepted,
      label: copy.externalStatesAccepted,
    },
    { value: payload.remediationReviewAccepted, label: copy.reviewAccepted },
    { value: payload.remediationReviewComplete, label: copy.reviewComplete },
    { value: payload.remediationReviewNoGoAccepted, label: copy.noGoAccepted },
    { value: payload.remediationReviewNoGoRecorded, label: copy.noGoRecorded },
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
      value: payload.wouldAcceptRemediationReviewNoGo,
      label: copy.wouldAcceptNoGo,
    },
    {
      value: payload.wouldRecordRemediationReviewNoGo,
      label: copy.wouldRecordNoGo,
    },
    {
      value: payload.wouldDenyImplementationAuthorizationFromReview,
      label: copy.wouldDenyFromReview,
    },
    {
      value: payload.wouldPromoteToAuthorizationReconsideration,
      label: copy.wouldPromote,
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
        "/api/system-writers/persistence-authorization-remediation-review-no-go",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceAuthorizationRemediationReviewNoGoProbeResult;
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
        <Stat label={copy.mode} value={payload.remediationReviewNoGoMode} />
        <Stat label={copy.noGoItems} value={payload.noGoItemCount} />
        <Stat label={copy.noGoCount} value={payload.noGoCount} />
        <Stat label={copy.manualBlocked} value={payload.manualReviewBlockedCount} />
        <Stat
          label={copy.stillBlocked}
          value={payload.reconsiderationStillBlockedCount}
        />
        <Stat label={copy.sourceItems} value={payload.sourceReviewItemCount} />
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
            <TextList items={payload.reviewNoGoRules} />
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
              {copy.reconsiderationRules}
            </h2>
            <TextList items={payload.reconsiderationRules} />
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
                  {copy.mode}: {probeResult.remediationReviewNoGoMode}
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
