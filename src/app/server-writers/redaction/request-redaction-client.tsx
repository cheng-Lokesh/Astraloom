"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type { SystemWriterContractId } from "@/types/system-writer-contract";
import type {
  RequestRedactionCheck,
  RequestRedactionCheckCategory,
  RequestRedactionFixture,
  RequestRedactionPayload,
  RequestRedactionProbeResult,
} from "@/types/request-redaction";

type RequestRedactionClientPageProps = {
  payload: RequestRedactionPayload;
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

const redactionCopy = {
  en: {
    title: "Request hashing and redaction fixtures",
    badge: "No persistence",
    body: "This page prepares deterministic request hashes and audit-safe redacted previews for future audit and idempotency records.",
    notice:
      "Current behavior is fixture-only: hashes and redacted previews are generated for inspection, but nothing is persisted and no writer executes.",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    redactionMode: "Redaction mode",
    hashAlgorithm: "Hash algorithm",
    canonicalizationVersion: "Canonicalization",
    wouldPersistRequestHash: "Would persist request hash",
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
    allFixturesRedacted: "All fixtures redacted",
    fixtureCount: "Fixture count",
    yes: "Yes",
    no: "No",
    globalRules: "Global rules",
    sharedChecks: "Shared checks",
    fixtures: "Redaction fixtures",
    requestHash: "Request hash",
    userIdHash: "User id hash",
    idempotencyTemplate: "Idempotency template",
    originalInputKeys: "Original input keys",
    redactedPreview: "Redacted preview",
    redactionEntries: "Redaction entries",
    forbiddenKeys: "Forbidden key matches",
    privateTextRedactions: "Private text redactions",
    hashedIdentifiers: "Hashed identifiers",
    hashedReferences: "Hashed references",
    checks: "Checks",
    probe: "Probe redaction",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe: "Probe a redaction fixture to confirm no persistence occurs.",
    openPayloads: "Open payloads",
    openAudit: "Open audit",
    openIdempotency: "Open idempotency",
    openEvidence: "Open evidence",
    openDashboard: "Back to dashboard",
    checkCategoryLabels: {
      canonicalization: "Canonicalization",
      hashing: "Hashing",
      redaction: "Redaction",
      sensitive_key_guard: "Sensitive key guard",
      audit_alignment: "Audit alignment",
      idempotency_alignment: "Idempotency alignment",
      write_block: "Write block",
    },
  },
  zh: {
    title: "Request hashing 与脱敏 fixtures",
    badge: "不持久化",
    body: "这个页面为未来 audit 与 idempotency 记录准备确定性 request hash 和审计安全的脱敏预览。",
    notice:
      "当前行为仅为 fixture：生成 hash 和脱敏预览供检查，但不会持久化，也不会执行 writer。",
    safetyState: "安全状态",
    safeMode: "安全模式",
    readOnly: "只读",
    redactionMode: "脱敏模式",
    hashAlgorithm: "Hash 算法",
    canonicalizationVersion: "规范化",
    wouldPersistRequestHash: "是否持久化 request hash",
    wouldStoreRawPayload: "是否存原始 payload",
    wouldStorePrivateNarrative: "是否存私人叙事",
    wouldStoreSecrets: "是否存 secrets",
    wouldWriteAuditRows: "是否写入审计行",
    wouldReserveIdempotencyKeys: "是否预留幂等键",
    wouldWriteIdempotencyRows: "是否写入幂等行",
    wouldCreateServiceRoleClient: "是否创建 service-role client",
    wouldReadServiceRoleSecret: "是否读取 service-role secret",
    wouldWriteRows: "是否写入行",
    wouldCallAi: "是否调用 AI",
    wouldCallStripe: "是否调用 Stripe",
    allFixturesRedacted: "所有 fixtures 已脱敏",
    fixtureCount: "Fixture 数量",
    yes: "是",
    no: "否",
    globalRules: "全局规则",
    sharedChecks: "共享检查",
    fixtures: "脱敏 fixtures",
    requestHash: "Request hash",
    userIdHash: "User id hash",
    idempotencyTemplate: "幂等模板",
    originalInputKeys: "原始输入键",
    redactedPreview: "脱敏预览",
    redactionEntries: "脱敏条目",
    forbiddenKeys: "禁止键匹配",
    privateTextRedactions: "私人文本脱敏数",
    hashedIdentifiers: "已 hash 的标识符",
    hashedReferences: "已 hash 的引用",
    checks: "检查项",
    probe: "探测脱敏",
    probing: "探测中...",
    probeResult: "探测结果",
    noProbe: "探测一个脱敏 fixture，确认不会持久化。",
    openPayloads: "打开 Payload",
    openAudit: "打开审计",
    openIdempotency: "打开幂等",
    openEvidence: "打开证据",
    openDashboard: "返回工作台",
    checkCategoryLabels: {
      canonicalization: "规范化",
      hashing: "Hashing",
      redaction: "脱敏",
      sensitive_key_guard: "敏感键防护",
      audit_alignment: "审计对齐",
      idempotency_alignment: "幂等对齐",
      write_block: "写入阻断",
    },
  },
} as const;

type RedactionCopy = (typeof redactionCopy)[keyof typeof redactionCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: RedactionCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function InlineList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="text-sm text-slate-500">None</span>;
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
  checks: RequestRedactionCheck[];
  copy: RedactionCopy;
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
                    check.category as RequestRedactionCheckCategory
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
  fixture: RequestRedactionFixture;
  locale: "en" | "zh";
  copy: RedactionCopy;
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
        <StatusPill tone="planned">{fixture.hashAlgorithm}</StatusPill>
      </div>

      <dl className="grid gap-4">
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
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.idempotencyTemplate}
          </dt>
          <dd className="mt-1 break-words font-mono text-xs leading-6 text-slate-700">
            {fixture.idempotencyKeyTemplate}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.originalInputKeys}
          </dt>
          <dd className="mt-2">
            <InlineList items={fixture.originalInputKeys} />
          </dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="planned">
            {copy.privateTextRedactions}: {fixture.privateTextRedactions}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.hashedIdentifiers}: {fixture.hashedIdentifierCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.hashedReferences}: {fixture.hashedReferenceCount}
          </StatusPill>
          <BoolPill
            value={fixture.wouldStoreRawPayload}
            label={copy.wouldStoreRawPayload}
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
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.forbiddenKeys}
          </dt>
          <dd className="mt-2">
            <InlineList items={fixture.forbiddenKeyMatches} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.redactedPreview}
          </dt>
          <dd className="mt-2">
            <JsonBlock value={fixture.redactedPayloadPreview} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.redactionEntries}
          </dt>
          <dd className="mt-2">
            <JsonBlock value={fixture.redactionEntries} />
          </dd>
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

export function RequestRedactionClientPage({
  payload,
}: RequestRedactionClientPageProps) {
  const { locale } = useLanguage();
  const copy = redactionCopy[locale];
  const [probeResult, setProbeResult] =
    useState<RequestRedactionProbeResult | null>(null);
  const [probingContractId, setProbingContractId] =
    useState<SystemWriterContractId | null>(null);

  async function probe(contractId: SystemWriterContractId) {
    setProbingContractId(contractId);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/request-redaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contractId }),
      });
      const result = (await response.json()) as RequestRedactionProbeResult;
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
            {copy.redactionMode}: {payload.redactionMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.hashAlgorithm}: {payload.hashAlgorithm}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.canonicalizationVersion}: {payload.canonicalizationVersion}
          </StatusPill>
          <StatusPill tone={payload.allFixturesRedacted ? "ready" : "blocked"}>
            {copy.allFixturesRedacted}:{" "}
            {payload.allFixturesRedacted ? copy.yes : copy.no}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.fixtureCount}: {payload.fixtureCount}
          </StatusPill>
          <BoolPill
            value={payload.wouldPersistRequestHash}
            label={copy.wouldPersistRequestHash}
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
            href="/server-writers/payloads"
            className="rounded-md border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
          >
            {copy.openPayloads}
          </Link>
          <Link
            href="/server-writers/audit"
            className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
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
            href="/server-writers/evidence"
            className="rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
          >
            {copy.openEvidence}
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
                ]}
              />
              {probeResult.userIdHash ? (
                <p className="break-words font-mono text-xs leading-6 text-slate-600">
                  {probeResult.userIdHash}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <BoolPill
                  value={probeResult.wouldPersistRequestHash}
                  label={copy.wouldPersistRequestHash}
                  copy={copy}
                  readyWhenTrue={false}
                />
                <BoolPill
                  value={probeResult.wouldStoreRawPayload}
                  label={copy.wouldStoreRawPayload}
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
