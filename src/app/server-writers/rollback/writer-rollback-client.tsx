"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type { SystemWriterContractId } from "@/types/system-writer-contract";
import type {
  WriterRollbackContract,
  WriterRollbackField,
  WriterRollbackModelPayload,
  WriterRollbackStrategy,
  WriterRollbackTrigger,
} from "@/types/system-writer-rollback";

type WriterRollbackClientPageProps = {
  payload: WriterRollbackModelPayload;
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

const rollbackCopy = {
  en: {
    title: "Writer rollback compensation model",
    badge: "Read-only contract",
    body: "This page defines how future writer attempts should compensate bad generations, duplicate operations, report replacements, refunds, and consent revocations without mutating history.",
    notice:
      "Current state is contract-only: no migration, no compensation rows, no service-role client, no insert/upsert/update/delete, no AI, no Stripe, no report unlock.",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    wouldWriteCompensationRows: "Would write compensation rows",
    wouldMutateHistory: "Would mutate history",
    migrationIncluded: "Migration included",
    futureTable: "Future table",
    yes: "Yes",
    no: "No",
    globalRules: "Global rules",
    baseFields: "Base fields",
    contracts: "Rollback contracts",
    required: "Required",
    detail: "Detail",
    affectedTables: "Affected tables",
    strategy: "Strategy",
    triggers: "Allowed triggers",
    forbiddenActions: "Forbidden actions",
    compensationRule: "Compensation rule",
    historyRule: "History rule",
    operatorReviewRule: "Operator review rule",
    sample: "Sample compensation record",
    openAudit: "Open audit model",
    openIdempotency: "Open idempotency",
    openAdapter: "Open adapter",
    openRollout: "Open rollout",
    openDashboard: "Back to dashboard",
    strategyLabels: {
      supersede_version: "Supersede version",
      soft_delete_generated: "Soft-delete generated artifact",
      append_compensating_event: "Append compensating event",
      cancel_queued_run: "Cancel queued run",
      replacement_report: "Replacement report",
      payment_reversal_event: "Payment reversal event",
      consent_revocation_event: "Consent revocation event",
    },
    triggerLabels: {
      bad_generation: "Bad generation",
      duplicate_operation: "Duplicate operation",
      safety_block_after_generation: "Safety block after generation",
      payment_refund_or_dispute: "Payment refund or dispute",
      consent_revoked: "Consent revoked",
      operator_review: "Operator review",
    },
  },
  zh: {
    title: "Writer 回滚补偿模型",
    badge: "只读契约",
    body: "这个页面定义未来 writer attempt 在遇到错误生成、重复操作、报告替换、退款和 consent 撤回时，如何用补偿事件处理问题，而不是直接篡改历史。",
    notice:
      "当前状态仅为契约：不创建 migration、不写补偿行、不创建 service-role client、不 insert/upsert/update/delete、不调用 AI、不调用 Stripe、不解锁报告。",
    safetyState: "安全状态",
    safeMode: "安全模式",
    readOnly: "只读",
    wouldWriteCompensationRows: "是否写补偿行",
    wouldMutateHistory: "是否修改历史",
    migrationIncluded: "是否包含 migration",
    futureTable: "未来表",
    yes: "是",
    no: "否",
    globalRules: "全局规则",
    baseFields: "基础字段",
    contracts: "回滚契约",
    required: "必须",
    detail: "说明",
    affectedTables: "影响表",
    strategy: "补偿策略",
    triggers: "允许触发原因",
    forbiddenActions: "禁止动作",
    compensationRule: "补偿规则",
    historyRule: "历史规则",
    operatorReviewRule: "人工复核规则",
    sample: "补偿记录示例",
    openAudit: "打开审计模型",
    openIdempotency: "打开幂等模型",
    openAdapter: "打开适配器",
    openRollout: "打开发布清单",
    openDashboard: "返回工作台",
    strategyLabels: {
      supersede_version: "版本替换",
      soft_delete_generated: "软删除生成物",
      append_compensating_event: "追加补偿事件",
      cancel_queued_run: "取消排队 run",
      replacement_report: "替换报告",
      payment_reversal_event: "支付冲正事件",
      consent_revocation_event: "Consent 撤回事件",
    },
    triggerLabels: {
      bad_generation: "错误生成",
      duplicate_operation: "重复操作",
      safety_block_after_generation: "生成后安全阻断",
      payment_refund_or_dispute: "退款或争议",
      consent_revoked: "Consent 撤回",
      operator_review: "人工复核",
    },
  },
} as const;

type RollbackCopy = (typeof rollbackCopy)[keyof typeof rollbackCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: RollbackCopy;
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
  fields: WriterRollbackField[];
  copy: RollbackCopy;
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

function TriggerList({
  triggers,
  copy,
}: {
  triggers: WriterRollbackTrigger[];
  copy: RollbackCopy;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {triggers.map((trigger) => (
        <StatusPill key={trigger} tone="planned">
          {copy.triggerLabels[trigger]}
        </StatusPill>
      ))}
    </div>
  );
}

function StrategyPill({
  strategy,
  copy,
}: {
  strategy: WriterRollbackStrategy;
  copy: RollbackCopy;
}) {
  return (
    <StatusPill tone="planned">{copy.strategyLabels[strategy]}</StatusPill>
  );
}

function ContractCard({
  contract,
  locale,
  copy,
}: {
  contract: WriterRollbackContract;
  locale: "en" | "zh";
  copy: RollbackCopy;
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
        <StrategyPill strategy={contract.strategy} copy={copy} />
      </div>

      <dl className="grid gap-4">
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.affectedTables}
          </dt>
          <dd className="mt-2">
            <InlineList items={contract.affectedTables} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.triggers}
          </dt>
          <dd className="mt-2">
            <TriggerList triggers={contract.allowedTriggers} copy={copy} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.compensationRule}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-slate-600">
            {contract.compensationRule}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.historyRule}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-slate-600">
            {contract.historyRule}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.operatorReviewRule}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-slate-600">
            {contract.operatorReviewRule}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.forbiddenActions}
          </dt>
          <dd className="mt-2">
            <TextList items={contract.forbiddenActions} />
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

export function WriterRollbackClientPage({
  payload,
}: WriterRollbackClientPageProps) {
  const { locale } = useLanguage();
  const copy = rollbackCopy[locale];

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
            value={payload.wouldWriteCompensationRows}
            label={copy.wouldWriteCompensationRows}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldMutateHistory}
            label={copy.wouldMutateHistory}
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
            href="/server-writers/idempotency"
            className="rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
          >
            {copy.openIdempotency}
          </Link>
          <Link
            href="/server-writers/adapter"
            className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
          >
            {copy.openAdapter}
          </Link>
          <Link
            href="/server-writers/rollout"
            className="rounded-md border border-fuchsia-300 bg-fuchsia-50 px-4 py-2 text-sm font-semibold text-fuchsia-800 transition hover:bg-fuchsia-100"
          >
            {copy.openRollout}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            {copy.openDashboard}
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.globalRules}
        </h2>
        <div className="mt-4">
          <TextList items={payload.globalRules} />
        </div>
      </section>

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
