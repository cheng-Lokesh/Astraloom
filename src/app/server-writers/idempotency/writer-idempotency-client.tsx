"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type { SystemWriterContractId } from "@/types/system-writer-contract";
import type {
  WriterIdempotencyContract,
  WriterIdempotencyField,
  WriterIdempotencyModelPayload,
} from "@/types/system-writer-idempotency";

type WriterIdempotencyClientPageProps = {
  payload: WriterIdempotencyModelPayload;
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

const idempotencyCopy = {
  en: {
    title: "Writer idempotency registry model",
    badge: "Read-only contract",
    body: "This page defines how future writer attempts should reserve, replay, reject, and expire idempotency keys before real writes exist.",
    notice:
      "Current state is contract-only: no migration, no key reservation, no service-role client, no insert/upsert/update/delete, no AI, no Stripe.",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    wouldReserveKeys: "Would reserve keys",
    wouldWriteRegistryRows: "Would write registry rows",
    migrationIncluded: "Migration included",
    futureTable: "Future table",
    yes: "Yes",
    no: "No",
    globalRules: "Global rules",
    conflictRules: "Conflict rules",
    baseFields: "Base fields",
    contracts: "Idempotency contracts",
    required: "Required",
    detail: "Detail",
    targetTables: "Target tables",
    operation: "Operation",
    scope: "Scope",
    keyTemplate: "Key template",
    uniqueness: "Uniqueness rule",
    reservation: "Reservation rule",
    conflictBehavior: "Conflict behavior",
    replay: "Replay rule",
    ttl: "TTL / retention",
    sample: "Sample reserved record",
    openAudit: "Open audit model",
    openAdapter: "Open adapter",
    openRollback: "Open rollback",
    openRollout: "Open rollout",
    openRedaction: "Open redaction",
    openEvidence: "Open evidence",
    openDashboard: "Back to dashboard",
  },
  zh: {
    title: "Writer 幂等注册模型",
    badge: "只读契约",
    body: "这个页面定义未来 writer attempt 在真实写入前如何保留、复用、拒绝和过期幂等 key。",
    notice:
      "当前状态仅为契约：不创建 migration、不保留 key、不创建 service-role client、不 insert/upsert/update/delete、不调用 AI、不调用 Stripe。",
    safetyState: "安全状态",
    safeMode: "安全模式",
    readOnly: "只读",
    wouldReserveKeys: "是否保留 key",
    wouldWriteRegistryRows: "是否写注册行",
    migrationIncluded: "是否包含 migration",
    futureTable: "未来表",
    yes: "是",
    no: "否",
    globalRules: "全局规则",
    conflictRules: "冲突规则",
    baseFields: "基础字段",
    contracts: "幂等契约",
    required: "必须",
    detail: "说明",
    targetTables: "目标表",
    operation: "操作",
    scope: "作用域",
    keyTemplate: "Key 模板",
    uniqueness: "唯一性规则",
    reservation: "保留规则",
    conflictBehavior: "冲突行为",
    replay: "重放规则",
    ttl: "TTL / 保留",
    sample: "Reserved 记录示例",
    openAudit: "打开审计模型",
    openAdapter: "打开适配器",
    openRollback: "打开回滚模型",
    openRollout: "打开发布清单",
    openRedaction: "打开脱敏",
    openEvidence: "打开证据",
    openDashboard: "返回工作台",
  },
} as const;

type IdempotencyCopy = (typeof idempotencyCopy)[keyof typeof idempotencyCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: IdempotencyCopy;
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
  fields: WriterIdempotencyField[];
  copy: IdempotencyCopy;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-3 pr-4 font-semibold">Field</th>
            <th className="py-3 pr-4 font-semibold">{copy.required}</th>
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
  contract: WriterIdempotencyContract;
  locale: "en" | "zh";
  copy: IdempotencyCopy;
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
        <StatusPill tone="planned">{contract.operation}</StatusPill>
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
            {copy.scope}
          </dt>
          <dd className="mt-1 font-mono text-xs leading-6 text-slate-700">
            {contract.scope}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.keyTemplate}
          </dt>
          <dd className="mt-1 break-words font-mono text-xs leading-6 text-slate-700">
            {contract.keyTemplate}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.uniqueness}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-slate-600">
            {contract.uniquenessRule}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.reservation}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-slate-600">
            {contract.reservationRule}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.conflictBehavior}
          </dt>
          <dd className="mt-1 font-mono text-xs leading-6 text-slate-700">
            {contract.conflictBehavior}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.replay}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-slate-600">
            {contract.replayRule}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.ttl}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-slate-600">
            {contract.ttlRule}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.sample}
          </dt>
          <dd className="mt-2 overflow-x-auto rounded-md bg-slate-950 p-4">
            <pre className="text-xs leading-6 text-slate-50">
              {JSON.stringify(contract.sampleRecord, null, 2)}
            </pre>
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function WriterIdempotencyClientPage({
  payload,
}: WriterIdempotencyClientPageProps) {
  const { locale } = useLanguage();
  const copy = idempotencyCopy[locale];

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
            value={payload.wouldReserveKeys}
            label={copy.wouldReserveKeys}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldWriteRegistryRows}
            label={copy.wouldWriteRegistryRows}
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
            href="/server-writers/audit"
            className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
          >
            {copy.openAudit}
          </Link>
          <Link
            href="/server-writers/adapter"
            className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
          >
            {copy.openAdapter}
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
            {copy.conflictRules}
          </h2>
          <div className="mt-4">
            <TextList items={payload.conflictRules} />
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
