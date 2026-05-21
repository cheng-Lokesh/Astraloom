"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type { SystemWriterContractId } from "@/types/system-writer-contract";
import type {
  WriterEvidenceHandoffCheck,
  WriterEvidenceHandoffCheckCategory,
  WriterEvidenceHandoffFixture,
  WriterEvidenceHandoffPayload,
  WriterEvidenceHandoffProbeResult,
} from "@/types/writer-evidence-handoff";

type WriterEvidenceHandoffClientPageProps = {
  payload: WriterEvidenceHandoffPayload;
};

const contractLabels: Record<"en" | "zh", Record<SystemWriterContractId, string>> = {
  en: {
    agent_profile_generation: "Agent profile generation",
    relation_edge_generation: "Relation edge generation",
    simulation_run_create: "Simulation run creation",
    event_tick_append: "Event tick append",
    claim_generation: "Claim generation",
    report_generation: "Report generation",
    payment_entitlement_record: "Payment entitlement record",
    consent_event_record: "Consent event record",
  },
  zh: {
    agent_profile_generation: "Agent 档案生成",
    relation_edge_generation: "关系边生成",
    simulation_run_create: "Simulation run 创建",
    event_tick_append: "事件 tick 追加",
    claim_generation: "Claim 生成",
    report_generation: "报告生成",
    payment_entitlement_record: "支付权益记录",
    consent_event_record: "Consent 事件记录",
  },
};

const handoffCopy = {
  en: {
    title: "Audit/idempotency evidence handoff",
    badge: "Fixture-only",
    body: "This page shows how future audit events and idempotency rows should reference request hashes and redacted evidence without persisting anything.",
    notice:
      "Current behavior is diagnostic only: evidence drafts are prepared from redaction fixtures, but no audit row, idempotency row, or privileged write can occur.",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    handoffMode: "Handoff mode",
    futureAuditTable: "Future audit table",
    futureIdempotencyTable: "Future idempotency table",
    wouldPersistEvidence: "Would persist evidence",
    wouldStoreRawPayload: "Would store raw payload",
    wouldStorePrivateNarrative: "Would store private narrative",
    wouldStoreSecrets: "Would store secrets",
    wouldWriteAuditRows: "Would write audit rows",
    wouldReserveIdempotencyKeys: "Would reserve idempotency keys",
    wouldWriteIdempotencyRows: "Would write idempotency rows",
    wouldCreateServiceRoleClient: "Would create service-role client",
    wouldReadServiceRoleSecret: "Would read service-role secret",
    wouldWriteRows: "Would write rows",
    wouldCallAi: "Would call AI",
    wouldCallStripe: "Would call Stripe",
    allFixturesReady: "All fixtures ready",
    fixtureCount: "Fixture count",
    yes: "Yes",
    no: "No",
    none: "None",
    globalRules: "Global rules",
    sharedChecks: "Shared checks",
    fixtures: "Evidence handoff fixtures",
    category: "Category",
    targetTables: "Target tables",
    requestHash: "Request hash",
    userIdHash: "User id hash",
    redactedEvidenceRef: "Redacted evidence ref",
    sourceRedactionFixtureRef: "Source redaction fixture",
    redactedPreviewKeyCount: "Redacted preview keys",
    redactionEntryCount: "Redaction entries",
    privateTextRedactions: "Private text redactions",
    hashedIdentifiers: "Hashed identifiers",
    hashedReferences: "Hashed references",
    auditDraft: "Audit evidence draft",
    idempotencyDraft: "Idempotency evidence draft",
    forbiddenFields: "Forbidden field matches",
    checks: "Checks",
    probe: "Probe handoff",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe: "Probe a handoff fixture to confirm no persistence occurs.",
    openRedaction: "Open redaction",
    openAudit: "Open audit",
    openIdempotency: "Open idempotency",
    openMigration: "Open writer SQL",
    openDashboard: "Back to dashboard",
    checkCategoryLabels: {
      redaction_source: "Redaction source",
      audit_evidence: "Audit evidence",
      idempotency_evidence: "Idempotency evidence",
      correlation: "Correlation",
      forbidden_field_guard: "Forbidden field guard",
      write_block: "Write block",
    },
    contractCategoryLabels: {
      agent_ecology: "Agent ecology",
      simulation: "Simulation",
      reporting: "Reporting",
      payments: "Payments",
      compliance: "Compliance",
    },
  },
  zh: {
    title: "Audit/idempotency evidence handoff",
    badge: "仅 fixture",
    body: "这个页面定义未来审计事件与幂等记录如何引用 request hash 和脱敏证据，但当前不持久化任何内容。",
    notice:
      "当前行为仅用于诊断：证据草稿来自 redaction fixtures，但不会写 audit 行、不会写幂等行，也不会发生任何特权写入。",
    safetyState: "安全状态",
    safeMode: "安全模式",
    readOnly: "只读",
    handoffMode: "Handoff 模式",
    futureAuditTable: "未来审计表",
    futureIdempotencyTable: "未来幂等表",
    wouldPersistEvidence: "是否持久化证据",
    wouldStoreRawPayload: "是否保存原始 payload",
    wouldStorePrivateNarrative: "是否保存私人叙事",
    wouldStoreSecrets: "是否保存 secrets",
    wouldWriteAuditRows: "是否写入审计行",
    wouldReserveIdempotencyKeys: "是否预留幂等键",
    wouldWriteIdempotencyRows: "是否写入幂等行",
    wouldCreateServiceRoleClient: "是否创建 service-role client",
    wouldReadServiceRoleSecret: "是否读取 service-role secret",
    wouldWriteRows: "是否写入数据库行",
    wouldCallAi: "是否调用 AI",
    wouldCallStripe: "是否调用 Stripe",
    allFixturesReady: "所有 fixtures 就绪",
    fixtureCount: "Fixture 数量",
    yes: "是",
    no: "否",
    none: "无",
    globalRules: "全局规则",
    sharedChecks: "共享检查",
    fixtures: "Evidence handoff fixtures",
    category: "类别",
    targetTables: "目标表",
    requestHash: "Request hash",
    userIdHash: "User id hash",
    redactedEvidenceRef: "脱敏证据引用",
    sourceRedactionFixtureRef: "来源 redaction fixture",
    redactedPreviewKeyCount: "脱敏预览键数量",
    redactionEntryCount: "脱敏条目数量",
    privateTextRedactions: "私人文本脱敏数",
    hashedIdentifiers: "已 hash 的标识符",
    hashedReferences: "已 hash 的引用",
    auditDraft: "审计证据草稿",
    idempotencyDraft: "幂等证据草稿",
    forbiddenFields: "禁止字段命中",
    checks: "检查项",
    probe: "探测 handoff",
    probing: "探测中...",
    probeResult: "探测结果",
    noProbe: "探测一个 handoff fixture，确认不会发生持久化。",
    openRedaction: "打开脱敏",
    openAudit: "打开审计",
    openIdempotency: "打开幂等",
    openMigration: "打开写入 SQL",
    openDashboard: "返回工作台",
    checkCategoryLabels: {
      redaction_source: "脱敏来源",
      audit_evidence: "审计证据",
      idempotency_evidence: "幂等证据",
      correlation: "关联",
      forbidden_field_guard: "禁止字段防护",
      write_block: "写入阻断",
    },
    contractCategoryLabels: {
      agent_ecology: "Agent 生态",
      simulation: "推演运行",
      reporting: "报告输出",
      payments: "支付权益",
      compliance: "合规",
    },
  },
} as const;

type HandoffCopy = (typeof handoffCopy)[keyof typeof handoffCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: HandoffCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function InlineList({ items, copy }: { items: string[]; copy: HandoffCopy }) {
  if (items.length === 0) {
    return <span className="text-sm text-slate-500">{copy.none}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-700"
        >
          {item}
        </span>
      ))}
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

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-6 text-slate-50">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function CheckList({
  checks,
  copy,
}: {
  checks: WriterEvidenceHandoffCheck[];
  copy: HandoffCopy;
}) {
  return (
    <div className="grid gap-3">
      {checks.map((check) => (
        <article
          key={check.id}
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">
                {check.title}
              </h3>
              <p className="mt-1 font-mono text-xs text-slate-500">
                {check.id}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill tone="planned">
                {
                  copy.checkCategoryLabels[
                    check.category as WriterEvidenceHandoffCheckCategory
                  ]
                }
              </StatusPill>
              <StatusPill tone={check.passed ? "ready" : "blocked"}>
                {check.passed ? copy.yes : copy.no}
              </StatusPill>
            </div>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {check.detail}
          </p>
        </article>
      ))}
    </div>
  );
}

function FixtureCard({
  fixture,
  locale,
  copy,
  onProbe,
  isProbing,
}: {
  fixture: WriterEvidenceHandoffFixture;
  locale: "en" | "zh";
  copy: HandoffCopy;
  onProbe: (contractId: SystemWriterContractId) => void;
  isProbing: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {contractLabels[locale][fixture.contractId]}
          </h3>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {fixture.contractId}
          </p>
        </div>
        <StatusPill tone="planned">
          {
            copy.contractCategoryLabels[
              fixture.category as keyof typeof copy.contractCategoryLabels
            ]
          }
        </StatusPill>
      </div>

      <dl className="grid gap-4">
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.targetTables}
          </dt>
          <dd className="mt-2">
            <InlineList items={fixture.targetTables} copy={copy} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.requestHash}
          </dt>
          <dd className="mt-1 break-words font-mono text-xs leading-6 text-slate-700">
            {fixture.requestHash}
          </dd>
        </div>
        {fixture.userIdHash ? (
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">
              {copy.userIdHash}
            </dt>
            <dd className="mt-1 break-words font-mono text-xs leading-6 text-slate-700">
              {fixture.userIdHash}
            </dd>
          </div>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">
              {copy.redactedEvidenceRef}
            </dt>
            <dd className="mt-1 break-words font-mono text-xs leading-6 text-slate-700">
              {fixture.redactedEvidenceRef}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">
              {copy.sourceRedactionFixtureRef}
            </dt>
            <dd className="mt-1 break-words font-mono text-xs leading-6 text-slate-700">
              {fixture.sourceRedactionFixtureRef}
            </dd>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="planned">
            {copy.redactedPreviewKeyCount}: {fixture.redactedPreviewKeyCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.redactionEntryCount}: {fixture.redactionEntryCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.privateTextRedactions}: {fixture.privateTextRedactions}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.hashedIdentifiers}: {fixture.hashedIdentifierCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.hashedReferences}: {fixture.hashedReferenceCount}
          </StatusPill>
        </div>
        <div className="flex flex-wrap gap-2">
          <BoolPill
            value={fixture.wouldPersistEvidence}
            label={copy.wouldPersistEvidence}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={fixture.wouldWriteAuditRows}
            label={copy.wouldWriteAuditRows}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={fixture.wouldReserveIdempotencyKey}
            label={copy.wouldReserveIdempotencyKeys}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={fixture.wouldWriteRows}
            label={copy.wouldWriteRows}
            copy={copy}
            readyWhenTrue={false}
          />
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.forbiddenFields}
          </dt>
          <dd className="mt-2">
            <InlineList items={fixture.forbiddenFieldMatches} copy={copy} />
          </dd>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">
              {copy.auditDraft}
            </dt>
            <dd className="mt-2">
              <JsonBlock value={fixture.auditEvidenceDraft} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">
              {copy.idempotencyDraft}
            </dt>
            <dd className="mt-2">
              <JsonBlock value={fixture.idempotencyEvidenceDraft} />
            </dd>
          </div>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.checks}
          </dt>
          <dd className="mt-2">
            <CheckList checks={fixture.checks} copy={copy} />
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => onProbe(fixture.contractId)}
        disabled={isProbing}
        className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isProbing ? copy.probing : copy.probe}
      </button>
    </article>
  );
}

export function WriterEvidenceHandoffClientPage({
  payload,
}: WriterEvidenceHandoffClientPageProps) {
  const { locale } = useLanguage();
  const copy = handoffCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterEvidenceHandoffProbeResult | null>(null);
  const [probingContractId, setProbingContractId] =
    useState<SystemWriterContractId | null>(null);

  async function probe(contractId: SystemWriterContractId) {
    setProbingContractId(contractId);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/evidence-handoff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contractId }),
      });
      const result = (await response.json()) as WriterEvidenceHandoffProbeResult;
      setProbeResult(result);
    } finally {
      setProbingContractId(null);
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

      <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        {copy.notice}
      </section>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.safetyState}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <BoolPill value={payload.safeMode} label={copy.safeMode} copy={copy} />
          <BoolPill value={payload.readOnly} label={copy.readOnly} copy={copy} />
          <StatusPill tone="planned">
            {copy.handoffMode}: {payload.handoffMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.futureAuditTable}: {payload.futureAuditTableName}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.futureIdempotencyTable}:{" "}
            {payload.futureIdempotencyTableName}
          </StatusPill>
          <StatusPill tone={payload.allFixturesReady ? "ready" : "blocked"}>
            {copy.allFixturesReady}:{" "}
            {payload.allFixturesReady ? copy.yes : copy.no}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.fixtureCount}: {payload.fixtureCount}
          </StatusPill>
          <BoolPill
            value={payload.wouldPersistEvidence}
            label={copy.wouldPersistEvidence}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldStoreRawPayload}
            label={copy.wouldStoreRawPayload}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldStorePrivateNarrative}
            label={copy.wouldStorePrivateNarrative}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldStoreSecrets}
            label={copy.wouldStoreSecrets}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldWriteAuditRows}
            label={copy.wouldWriteAuditRows}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldReserveIdempotencyKeys}
            label={copy.wouldReserveIdempotencyKeys}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldWriteIdempotencyRows}
            label={copy.wouldWriteIdempotencyRows}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldCreateServiceRoleClient}
            label={copy.wouldCreateServiceRoleClient}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldReadServiceRoleSecret}
            label={copy.wouldReadServiceRoleSecret}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldWriteRows}
            label={copy.wouldWriteRows}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldCallAi}
            label={copy.wouldCallAi}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldCallStripe}
            label={copy.wouldCallStripe}
            copy={copy}
            readyWhenTrue={false}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/server-writers/redaction"
            className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
          >
            {copy.openRedaction}
          </Link>
          <Link
            href="/server-writers/audit"
            className="rounded-md border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
          >
            {copy.openAudit}
          </Link>
          <Link
            href="/server-writers/idempotency"
            className="rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
          >
            {copy.openIdempotency}
          </Link>
          <Link
            href="/server-writers/migration"
            className="rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
          >
            {copy.openMigration}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            {copy.openDashboard}
          </Link>
        </div>
      </section>

      <div className="mb-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.globalRules}
          </h2>
          <div className="mt-4">
            <TextList items={payload.globalRules} />
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.probeResult}
          </h2>
          {probeResult ? (
            <div className="mt-4 space-y-4 text-sm">
              <p className="leading-6 text-slate-600">
                {probeResult.summary}
              </p>
              <InlineList
                items={[
                  probeResult.contractId ?? "no contract",
                  probeResult.requestHash ?? "no request hash",
                  probeResult.redactedEvidenceRef ?? "no evidence ref",
                ]}
                copy={copy}
              />
              <div className="flex flex-wrap gap-2">
                <BoolPill
                  value={probeResult.wouldPersistEvidence}
                  label={copy.wouldPersistEvidence}
                  copy={copy}
                  readyWhenTrue={false}
                />
                <BoolPill
                  value={probeResult.wouldWriteAuditRows}
                  label={copy.wouldWriteAuditRows}
                  copy={copy}
                  readyWhenTrue={false}
                />
                <BoolPill
                  value={probeResult.wouldReserveIdempotencyKey}
                  label={copy.wouldReserveIdempotencyKeys}
                  copy={copy}
                  readyWhenTrue={false}
                />
                <BoolPill
                  value={probeResult.wouldWriteRows}
                  label={copy.wouldWriteRows}
                  copy={copy}
                  readyWhenTrue={false}
                />
              </div>
              <CheckList checks={probeResult.checks} copy={copy} />
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy.noProbe}
            </p>
          )}
        </aside>
      </div>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.sharedChecks}
        </h2>
        <div className="mt-4">
          <CheckList checks={payload.sharedChecks} copy={copy} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.fixtures}
        </h2>
        <div className="grid gap-4">
          {payload.fixtures.map((fixture) => (
            <FixtureCard
              key={fixture.contractId}
              fixture={fixture}
              locale={locale}
              copy={copy}
              onProbe={probe}
              isProbing={probingContractId === fixture.contractId}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
