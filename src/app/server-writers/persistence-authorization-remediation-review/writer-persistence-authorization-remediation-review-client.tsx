"use client";

import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceAuthorizationRemediationReviewItem,
  WriterPersistenceAuthorizationRemediationReviewPayload,
  WriterPersistenceAuthorizationRemediationReviewProbeResult,
  WriterPersistenceAuthorizationRemediationReviewStatus,
} from "@/types/writer-persistence-authorization-remediation-review";

type WriterPersistenceAuthorizationRemediationReviewClientPageProps = {
  payload: WriterPersistenceAuthorizationRemediationReviewPayload;
};

const reviewCopy = {
  en: {
    title: "Persistence authorization remediation review checklist",
    status: "Review-only",
    body: "This page turns the remediation plan into a review checklist. It does not accept external remediation states, store evidence, resolve blockers, or grant implementation authorization.",
    yes: "Yes",
    no: "No",
    mode: "Mode",
    checkedAt: "Checked at",
    reviewItems: "Review items",
    externalMissing: "External evidence missing",
    manualRequired: "Manual reviewer required",
    reconsiderationBlocked: "Reconsideration blocked",
    sourceItems: "Source remediation items",
    sourceExternal: "Source external-required",
    sourceManual: "Source manual-required",
    safetyState: "Safety state",
    checklistReady: "Review checklist ready",
    checklistOnly: "Review checklist only",
    sourcePlanReady: "Source remediation plan ready",
    sourcePlanOnly: "Source remediation plan only",
    releaseBlocked: "Source release still blocked",
    externalStatesAccepted: "External remediation states accepted",
    reviewAccepted: "Remediation review accepted",
    reviewComplete: "Remediation review complete",
    reconsiderationReady: "Authorization reconsideration ready",
    authorizationGranted: "Implementation authorization granted",
    readyForAdapter: "Ready for adapter implementation",
    runtimeEffects: "All runtime effects blocked",
    wouldAcceptReview: "Would accept remediation review",
    wouldRecordReview: "Would record remediation review",
    wouldStoreEvidence: "Would store review evidence",
    wouldPromote: "Would promote to authorization reconsideration",
    wouldServiceRole: "Would create service-role client",
    wouldWriteRows: "Would write rows",
    wouldMigration: "Would create/apply migration",
    rules: "Checklist rules",
    rejectionRules: "Current rejection rules",
    blockedCodes: "Blocked codes",
    reviewQuestion: "Review question",
    requiredExternalState: "Required external state",
    safeRefs: "Safe external evidence refs",
    completeness: "Completeness checks",
    redaction: "Redaction checks",
    rejection: "Rejection triggers",
    clauses: "Non-acceptance clauses",
    futurePass: "Pass criteria for future review",
    currentFail: "Current fail criteria",
    stillBlocked: "Still blocked because",
    sourceNoGo: "Source no-go ids",
    sourceRefs: "Source refs",
    nextGate: "Next gate",
    owner: "Owner",
    probe: "Probe item",
    probePanel: "Blocked probe result",
    probeBody:
      "Probe one review item to confirm this checklist remains read-only and blocked.",
    loading: "Checking",
    statusLabels: {
      external_evidence_missing: "External evidence missing",
      manual_reviewer_required: "Manual reviewer required",
    },
  },
  zh: {
    title: "持久化实现授权补救审查清单",
    status: "仅审查",
    body: "这个页面把补救计划转换成审查清单。它不接受外部补救状态，不存储证据，不解除阻断，也不授予实现授权。",
    yes: "是",
    no: "否",
    mode: "模式",
    checkedAt: "检查时间",
    reviewItems: "审查项",
    externalMissing: "缺少外部证据",
    manualRequired: "需要人工审查",
    reconsiderationBlocked: "重新评估仍阻断",
    sourceItems: "来源补救项",
    sourceExternal: "来源外部补救项",
    sourceManual: "来源人工审查项",
    safetyState: "安全状态",
    checklistReady: "审查清单已就绪",
    checklistOnly: "仅审查清单",
    sourcePlanReady: "来源补救计划已就绪",
    sourcePlanOnly: "来源补救计划只读",
    releaseBlocked: "来源发布仍阻断",
    externalStatesAccepted: "已接受外部补救状态",
    reviewAccepted: "已接受补救审查",
    reviewComplete: "补救审查已完成",
    reconsiderationReady: "授权重新评估已就绪",
    authorizationGranted: "已授予实现授权",
    readyForAdapter: "已可实现适配器",
    runtimeEffects: "所有运行时副作用均阻断",
    wouldAcceptReview: "会接受补救审查",
    wouldRecordReview: "会记录补救审查",
    wouldStoreEvidence: "会存储审查证据",
    wouldPromote: "会推进到授权重新评估",
    wouldServiceRole: "会创建 service-role client",
    wouldWriteRows: "会写入数据行",
    wouldMigration: "会创建/应用 migration",
    rules: "审查清单规则",
    rejectionRules: "当前拒绝规则",
    blockedCodes: "阻断代码",
    reviewQuestion: "审查问题",
    requiredExternalState: "所需外部状态",
    safeRefs: "安全外部证据引用",
    completeness: "完整性检查",
    redaction: "脱敏检查",
    rejection: "拒绝触发条件",
    clauses: "非接受条款",
    futurePass: "未来审查通过条件",
    currentFail: "当前审查失败条件",
    stillBlocked: "仍然阻断的原因",
    sourceNoGo: "来源 no-go id",
    sourceRefs: "来源引用",
    nextGate: "下一闸门",
    owner: "负责人",
    probe: "探测项目",
    probePanel: "阻断探针结果",
    probeBody: "探测一个审查项，确认该清单仍然只读且被阻断。",
    loading: "检查中",
    statusLabels: {
      external_evidence_missing: "缺少外部证据",
      manual_reviewer_required: "需要人工审查",
    },
  },
} as const;

type ReviewCopy = (typeof reviewCopy)[keyof typeof reviewCopy];

function getStatusTone(
  status: WriterPersistenceAuthorizationRemediationReviewStatus,
) {
  return status === "external_evidence_missing" ? "blocked" : "planned";
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
  copy: ReviewCopy;
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

function ReviewItemCard({
  item,
  copy,
  onProbe,
  probingId,
}: {
  item: WriterPersistenceAuthorizationRemediationReviewItem;
  copy: ReviewCopy;
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
            {copy.owner}: {item.owner} · {copy.nextGate}: {item.nextGate}
          </p>
        </div>
        <StatusPill tone={getStatusTone(item.status)}>
          {copy.statusLabels[item.status]}
        </StatusPill>
      </div>

      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <span className="font-semibold">{copy.reviewQuestion}: </span>
        {item.reviewQuestion}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.requiredExternalState}
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {item.requiredExternalState}
          </p>
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.safeRefs}
          </h4>
          <TextList items={item.safeExternalEvidenceRefs} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.completeness}
          </h4>
          <TextList items={item.completenessChecks} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.redaction}
          </h4>
          <TextList items={item.redactionChecks} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.rejection}
          </h4>
          <TextList items={item.rejectionTriggers} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.clauses}
          </h4>
          <TextList items={item.nonAcceptanceClauses} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.futurePass}
          </h4>
          <TextList items={item.passCriteriaForFutureReview} />
        </section>
        <section>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.currentFail}
          </h4>
          <TextList items={item.failCriteriaForCurrentReview} />
        </section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-md border border-rose-200 bg-rose-50 p-4">
          <h4 className="text-sm font-semibold text-rose-950">
            {copy.stillBlocked}
          </h4>
          <TextList items={item.stillBlockedBecause} />
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

export function WriterPersistenceAuthorizationRemediationReviewClientPage({
  payload,
}: WriterPersistenceAuthorizationRemediationReviewClientPageProps) {
  const { locale } = useLanguage();
  const copy = reviewCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceAuthorizationRemediationReviewProbeResult | null>(
      null,
    );
  const [probingId, setProbingId] = useState<string | null>(null);

  const safetyFlags = [
    { value: payload.reviewChecklistReady, label: copy.checklistReady },
    { value: payload.reviewChecklistOnly, label: copy.checklistOnly },
    { value: payload.sourceRemediationPlanReady, label: copy.sourcePlanReady },
    { value: payload.sourceRemediationPlanOnly, label: copy.sourcePlanOnly },
    { value: payload.sourceReleaseStillBlocked, label: copy.releaseBlocked },
    {
      value: payload.externalRemediationStatesAccepted,
      label: copy.externalStatesAccepted,
    },
    { value: payload.remediationReviewAccepted, label: copy.reviewAccepted },
    { value: payload.remediationReviewComplete, label: copy.reviewComplete },
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
    { value: payload.wouldAcceptRemediationReview, label: copy.wouldAcceptReview },
    { value: payload.wouldRecordRemediationReview, label: copy.wouldRecordReview },
    {
      value: payload.wouldStoreRemediationReviewEvidence,
      label: copy.wouldStoreEvidence,
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
        "/api/system-writers/persistence-authorization-remediation-review",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        },
      );
      const result =
        (await response.json()) as WriterPersistenceAuthorizationRemediationReviewProbeResult;
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
        <StatusPill tone="planned">{copy.status}</StatusPill>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label={copy.mode} value={payload.remediationReviewChecklistMode} />
        <Stat label={copy.reviewItems} value={payload.reviewItemCount} />
        <Stat
          label={copy.externalMissing}
          value={payload.externalEvidenceMissingCount}
        />
        <Stat
          label={copy.manualRequired}
          value={payload.manualReviewerRequiredCount}
        />
        <Stat
          label={copy.reconsiderationBlocked}
          value={payload.reconsiderationBlockedCount}
        />
        <Stat label={copy.sourceItems} value={payload.sourceRemediationItemCount} />
        <Stat
          label={copy.sourceExternal}
          value={payload.sourceExternalRemediationRequiredCount}
        />
        <Stat
          label={copy.sourceManual}
          value={payload.sourceManualReviewRequiredCount}
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.rules}
            </h2>
            <TextList items={payload.reviewChecklistRules} />
          </section>

          {payload.reviewItems.map((item) => (
            <ReviewItemCard
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

          <section className="rounded-lg border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-rose-950">
              {copy.rejectionRules}
            </h2>
            <TextList items={payload.currentRejectionRules} />
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
                  {copy.mode}: {probeResult.remediationReviewChecklistMode}
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
