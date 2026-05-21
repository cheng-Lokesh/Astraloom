"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type { SystemWriterContractId } from "@/types/system-writer-contract";
import type {
  WriterAuditEventContract,
  WriterAuditField,
  WriterAuditModelPayload,
  WriterAuditSensitivity,
} from "@/types/system-writer-audit";

type WriterAuditClientPageProps = {
  payload: WriterAuditModelPayload;
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

const auditCopy = {
  en: {
    title: "Writer audit event model",
    badge: "Read-only contract",
    body: "This page defines append-only audit event contracts for future writer attempts. It does not create a migration and does not write audit rows.",
    notice:
      "Current state is contract-only: no service-role client, no audit table migration, no insert/upsert/update/delete, no AI, no Stripe, no report unlock.",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    wouldWriteAuditRows: "Would write audit rows",
    migrationIncluded: "Migration included",
    yes: "Yes",
    no: "No",
    futureTable: "Future table",
    globalRules: "Global rules",
    redactionRules: "Redaction rules",
    baseFields: "Base fields",
    contracts: "Audit contracts",
    required: "Required",
    sensitivity: "Sensitivity",
    detail: "Detail",
    eventTypes: "Event types",
    targetTables: "Target tables",
    correlationKeys: "Correlation keys",
    forbiddenFields: "Forbidden fields",
    retention: "Retention rule",
    sample: "Sample blocked event",
    openAdapter: "Open adapter",
    openGuardrail: "Open guardrail",
    openIdempotency: "Open idempotency",
    openRollback: "Open rollback",
    openRollout: "Open rollout",
    openRedaction: "Open redaction",
    openEvidence: "Open evidence",
    openDashboard: "Back to dashboard",
    sensitivityLabels: {
      safe_metadata: "Safe metadata",
      pseudonymous_identifier: "Pseudonymous id",
      hash_only: "Hash only",
      internal_state: "Internal state",
      forbidden_secret: "Forbidden secret",
    },
  },
  zh: {
    title: "Writer 审计事件模型",
    badge: "只读契约",
    body: "这个页面定义未来 writer attempt 的追加式审计事件契约。它不会创建 migration，也不会写入审计行。",
    notice:
      "当前状态仅为契约：不创建 service-role client、不创建审计表 migration、不 insert/upsert/update/delete、不调用 AI、不调用 Stripe、不解锁报告。",
    safetyState: "安全状态",
    safeMode: "安全模式",
    readOnly: "只读",
    wouldWriteAuditRows: "是否写入审计行",
    migrationIncluded: "是否包含 migration",
    yes: "是",
    no: "否",
    futureTable: "未来表",
    globalRules: "全局规则",
    redactionRules: "脱敏规则",
    baseFields: "基础字段",
    contracts: "审计契约",
    required: "必须",
    sensitivity: "敏感级别",
    detail: "说明",
    eventTypes: "事件类型",
    targetTables: "目标表",
    correlationKeys: "关联键",
    forbiddenFields: "禁止字段",
    retention: "保留规则",
    sample: "Blocked event 示例",
    openAdapter: "打开适配器",
    openGuardrail: "打开护栏",
    openIdempotency: "打开幂等模型",
    openRollback: "打开回滚模型",
    openRollout: "打开发布清单",
    openRedaction: "打开脱敏",
    openEvidence: "打开证据",
    openDashboard: "返回工作台",
    sensitivityLabels: {
      safe_metadata: "安全元数据",
      pseudonymous_identifier: "假名标识",
      hash_only: "仅哈希",
      internal_state: "内部状态",
      forbidden_secret: "禁止 secret",
    },
  },
} as const;

type AuditCopy = (typeof auditCopy)[keyof typeof auditCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: AuditCopy;
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

function FieldTable({
  fields,
  copy,
}: {
  fields: WriterAuditField[];
  copy: AuditCopy;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-3 pr-4 font-semibold">Field</th>
            <th className="py-3 pr-4 font-semibold">{copy.required}</th>
            <th className="py-3 pr-4 font-semibold">{copy.sensitivity}</th>
            <th className="py-3 font-semibold">{copy.detail}</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field.name} className="border-b border-slate-100 align-top">
              <td className="py-3 pr-4 font-mono text-xs text-slate-800">
                {field.name}
              </td>
              <td className="py-3 pr-4">
                <StatusPill tone={field.required ? "ready" : "planned"}>
                  {field.required ? copy.yes : copy.no}
                </StatusPill>
              </td>
              <td className="py-3 pr-4">
                <StatusPill
                  tone={
                    field.sensitivity === "forbidden_secret"
                      ? "blocked"
                      : "planned"
                  }
                >
                  {
                    copy.sensitivityLabels[
                      field.sensitivity as WriterAuditSensitivity
                    ]
                  }
                </StatusPill>
              </td>
              <td className="py-3 text-slate-600">{field.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContractCard({
  contract,
  locale,
  copy,
}: {
  contract: WriterAuditEventContract;
  locale: "en" | "zh";
  copy: AuditCopy;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {contractLabels[locale][contract.contractId]}
          </h3>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {contract.contractId}
          </p>
        </div>
        <StatusPill tone="planned">{contract.actorContext}</StatusPill>
      </div>

      <dl className="grid gap-4">
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.targetTables}
          </dt>
          <dd className="mt-2">
            <InlineList items={contract.targetTables} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.eventTypes}
          </dt>
          <dd className="mt-2">
            <InlineList items={contract.eventTypes} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.correlationKeys}
          </dt>
          <dd className="mt-2">
            <InlineList items={contract.correlationKeys} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.forbiddenFields}
          </dt>
          <dd className="mt-2">
            <InlineList items={contract.forbiddenFields} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.retention}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-slate-600">
            {contract.retentionRule}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.sample}
          </dt>
          <dd className="mt-2 overflow-x-auto rounded-md bg-slate-950 p-4">
            <pre className="text-xs leading-6 text-slate-50">
              {JSON.stringify(contract.sampleBlockedEvent, null, 2)}
            </pre>
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function WriterAuditClientPage({ payload }: WriterAuditClientPageProps) {
  const { locale } = useLanguage();
  const copy = auditCopy[locale];

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
          <BoolPill
            value={payload.wouldWriteAuditRows}
            label={copy.wouldWriteAuditRows}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.migrationIncluded}
            label={copy.migrationIncluded}
            copy={copy}
            readyWhenTrue={false}
          />
          <StatusPill tone="planned">
            {copy.futureTable}: {payload.futureTableName}
          </StatusPill>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/server-writers/adapter"
            className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
          >
            {copy.openAdapter}
          </Link>
          <Link
            href="/server-writers/guardrail"
            className="rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
          >
            {copy.openGuardrail}
          </Link>
          <Link
            href="/server-writers/idempotency"
            className="rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
          >
            {copy.openIdempotency}
          </Link>
          <Link
            href="/server-writers/rollback"
            className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
          >
            {copy.openRollback}
          </Link>
          <Link
            href="/server-writers/rollout"
            className="rounded-md border border-fuchsia-300 bg-fuchsia-50 px-4 py-2 text-sm font-semibold text-fuchsia-800 transition hover:bg-fuchsia-100"
          >
            {copy.openRollout}
          </Link>
          <Link
            href="/server-writers/redaction"
            className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
          >
            {copy.openRedaction}
          </Link>
          <Link
            href="/server-writers/evidence"
            className="rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
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

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.globalRules}
          </h2>
          <div className="mt-4">
            <TextList items={payload.globalRules} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.redactionRules}
          </h2>
          <div className="mt-4">
            <TextList items={payload.redactionRules} />
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.baseFields}
        </h2>
        <div className="mt-4">
          <FieldTable fields={payload.baseFields} copy={copy} />
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.contracts}
        </h2>
        <div className="grid gap-4">
          {payload.contracts.map((contract) => (
            <ContractCard
              key={contract.contractId}
              contract={contract}
              locale={locale}
              copy={copy}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
