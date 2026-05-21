"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  SystemWriterContract,
  SystemWriterContractCategory,
  SystemWriterContractId,
  SystemWriterContractPayload,
  SystemWriterContractStatus,
} from "@/types/system-writer-contract";

type WriterContractsClientPageProps = {
  payload: SystemWriterContractPayload;
};

type ContractCopy = {
  title: string;
  badge: string;
  body: string;
  noWrites: string;
  config: string;
  serviceRole: string;
  systemWriters: string;
  aiGeneration: string;
  stripeWrites: string;
  yes: string;
  no: string;
  status: string;
  targetTables: string;
  trigger: string;
  inputs: string;
  gates: string;
  flags: string;
  idempotency: string;
  detail: string;
  openStatus: string;
  openDryRun: string;
  openGuardrail: string;
  openAdapter: string;
  openRollback: string;
  openRollout: string;
  openSync: string;
  openDashboard: string;
  nextStep: string;
  nextStepBody: string;
  categoryLabels: Record<SystemWriterContractCategory, string>;
  categoryDetails: Record<SystemWriterContractCategory, string>;
  contractLabels: Record<SystemWriterContractId, string>;
  statusLabels: Record<SystemWriterContractStatus, string>;
};

const categories: {
  id: SystemWriterContractCategory;
  accent: string;
}[] = [
  { id: "agent_ecology", accent: "border-emerald-200 bg-emerald-50" },
  { id: "simulation", accent: "border-sky-200 bg-sky-50" },
  { id: "reporting", accent: "border-violet-200 bg-violet-50" },
  { id: "payments", accent: "border-teal-200 bg-teal-50" },
  { id: "compliance", accent: "border-lime-200 bg-lime-50" },
];

const contractCopy: Record<"en" | "zh", ContractCopy> = {
  en: {
    title: "Controlled writer contracts",
    badge: "Read-only contract layer",
    body: "This page turns the next backend work into explicit contracts. It does not write data, call AI models, grant payment entitlement, or unlock reports.",
    noWrites:
      "Current gates intentionally keep every system-owned write disabled. The browser may sync user drafts, but generated artifacts and payment-owned records still require future server-only code.",
    config: "Global gates",
    serviceRole: "Service role key",
    systemWriters: "System writers",
    aiGeneration: "AI generation",
    stripeWrites: "Stripe writes",
    yes: "Yes",
    no: "No",
    status: "Status",
    targetTables: "Target tables",
    trigger: "Trigger",
    inputs: "Required inputs",
    gates: "Safety gates",
    flags: "Feature flags",
    idempotency: "Idempotency key",
    detail: "Contract boundary",
    openStatus: "Open writer status",
    openDryRun: "Open dry-run validator",
    openGuardrail: "Open execution guardrail",
    openAdapter: "Open adapter boundary",
    openRollback: "Open rollback",
    openRollout: "Open rollout",
    openSync: "Open sync center",
    openDashboard: "Back to dashboard",
    nextStep: "Next build step",
    nextStepBody:
      "After these contracts, the next safe step is server-only dry-run writer endpoints that validate inputs and gates without performing real service-role writes.",
    categoryLabels: {
      agent_ecology: "Agent ecology",
      simulation: "Simulation",
      reporting: "Reporting",
      payments: "Payments",
      compliance: "Compliance",
    },
    categoryDetails: {
      agent_ecology:
        "Digital selves, parallel selves, NPC profiles, and relationship edges.",
      simulation:
        "Run creation and ordered event ticks for the micro-agent simulation.",
      reporting:
        "Evidence-backed claims and locked/unlocked report assembly.",
      payments:
        "Stripe-confirmed entitlement records and paid report access.",
      compliance:
        "Append-only consent and privacy audit records.",
    },
    contractLabels: {
      agent_profile_generation: "Agent profile generation",
      relation_edge_generation: "Relation edge generation",
      simulation_run_create: "Simulation run creation",
      event_tick_append: "Event tick append",
      claim_generation: "Claim generation",
      report_generation: "Report generation",
      payment_entitlement_record: "Payment entitlement record",
      consent_event_record: "Consent event record",
    },
    statusLabels: {
      disabled: "Disabled",
      missing_service_role: "Missing service role",
      ready_placeholder: "Ready placeholder",
    },
  },
  zh: {
    title: "受控写入契约",
    badge: "只读契约层",
    body: "这个页面把下一阶段后端开发拆成明确契约。它不会写入数据、不会调用 AI、不会授予支付权益，也不会解锁报告。",
    noWrites:
      "当前闸门会故意阻断所有系统对象写入。浏览器只能同步用户草稿；系统生成物与支付权益记录仍然必须等待未来的服务端代码。",
    config: "全局闸门",
    serviceRole: "Service role key",
    systemWriters: "系统写入",
    aiGeneration: "AI 生成",
    stripeWrites: "Stripe 写入",
    yes: "是",
    no: "否",
    status: "状态",
    targetTables: "目标表",
    trigger: "触发条件",
    inputs: "必要输入",
    gates: "安全闸门",
    flags: "功能开关",
    idempotency: "幂等键",
    detail: "契约边界",
    openStatus: "打开写入状态",
    openDryRun: "打开 dry-run 验证器",
    openGuardrail: "打开执行护栏",
    openAdapter: "打开适配器边界",
    openRollback: "打开回滚模型",
    openRollout: "打开发布清单",
    openSync: "打开同步中心",
    openDashboard: "返回工作台",
    nextStep: "下一步构建",
    nextStepBody:
      "这些契约完成后，下一步适合做服务端 dry-run 写入端点：只校验输入和闸门，不执行真实 service-role 写入。",
    categoryLabels: {
      agent_ecology: "Agent 生态",
      simulation: "推演运行",
      reporting: "报告输出",
      payments: "支付权益",
      compliance: "合规审计",
    },
    categoryDetails: {
      agent_ecology: "数字自我、平行自我、NPC 档案和关系边。",
      simulation: "微观 Agent 推演的 Run 创建与有序事件 tick。",
      reporting: "带证据引用的 Claim，以及锁定/解锁报告组装。",
      payments: "Stripe 确认后的权益记录与付费报告访问。",
      compliance: "追加式 consent 与隐私审计记录。",
    },
    contractLabels: {
      agent_profile_generation: "Agent 档案生成",
      relation_edge_generation: "关系边生成",
      simulation_run_create: "Simulation run 创建",
      event_tick_append: "事件 tick 追加",
      claim_generation: "Claim 生成",
      report_generation: "报告生成",
      payment_entitlement_record: "支付权益记录",
      consent_event_record: "Consent 事件记录",
    },
    statusLabels: {
      disabled: "已禁用",
      missing_service_role: "缺少 service role",
      ready_placeholder: "占位就绪",
    },
  },
};

function getStatusTone(status: SystemWriterContractStatus) {
  return status === "ready_placeholder" ? "ready" : "blocked";
}

function GatePill({
  active,
  label,
  copy,
}: {
  active: boolean;
  label: string;
  copy: ContractCopy;
}) {
  return (
    <StatusPill tone={active ? "ready" : "blocked"}>
      {label}: {active ? copy.yes : copy.no}
    </StatusPill>
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

function ContractSection({
  contract,
  copy,
}: {
  contract: SystemWriterContract;
  copy: ContractCopy;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {copy.contractLabels[contract.id]}
          </h3>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {contract.id}
          </p>
        </div>
        <StatusPill tone={getStatusTone(contract.status)}>
          {copy.statusLabels[contract.status]}
        </StatusPill>
      </div>

      <dl className="grid gap-4">
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.targetTables}
          </dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {contract.targetTables.map((table) => (
              <span
                key={table}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-700"
              >
                {table}
              </span>
            ))}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.trigger}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-slate-600">
            {contract.trigger}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.inputs}
          </dt>
          <dd className="mt-2">
            <TextList items={contract.requiredInputs} />
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.gates}
          </dt>
          <dd className="mt-2">
            <TextList items={contract.safetyGates} />
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.flags}
          </dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {contract.requiredFlags.map((flag) => (
              <span
                key={flag}
                className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-xs font-semibold text-amber-800"
              >
                {flag}
              </span>
            ))}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.idempotency}
          </dt>
          <dd className="mt-1 break-words font-mono text-xs leading-6 text-slate-700">
            {contract.idempotencyKey}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.detail}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-slate-600">
            {contract.detail}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function WriterContractsClientPage({
  payload,
}: WriterContractsClientPageProps) {
  const { locale } = useLanguage();
  const copy = contractCopy[locale];

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
        {copy.noWrites}
      </section>

      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-950">
            {copy.config}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <GatePill
              active={payload.serviceRoleConfigured}
              label={copy.serviceRole}
              copy={copy}
            />
            <GatePill
              active={payload.systemWritersEnabled}
              label={copy.systemWriters}
              copy={copy}
            />
            <GatePill
              active={payload.aiGenerationEnabled}
              label={copy.aiGeneration}
              copy={copy}
            />
            <GatePill
              active={payload.stripeWritesEnabled}
              label={copy.stripeWrites}
              copy={copy}
            />
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:col-span-1 xl:col-span-3">
          <h2 className="text-sm font-semibold text-slate-950">
            {copy.nextStep}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {copy.nextStepBody}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/server-writers"
              className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              {copy.openStatus}
            </Link>
            <Link
              href="/server-writers/dry-run"
              className="rounded-md border border-lime-300 bg-lime-50 px-4 py-2 text-sm font-semibold text-lime-800 transition hover:bg-lime-100"
            >
              {copy.openDryRun}
            </Link>
            <Link
              href="/server-writers/guardrail"
              className="rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
            >
              {copy.openGuardrail}
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
              href="/sync"
              className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
            >
              {copy.openSync}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copy.openDashboard}
            </Link>
          </div>
        </section>
      </div>

      <section className="space-y-5">
        {categories.map((category) => {
          const contracts = payload.contracts.filter(
            (contract) => contract.category === category.id,
          );

          return (
            <section key={category.id}>
              <div
                className={`mb-4 rounded-lg border px-5 py-4 ${category.accent}`}
              >
                <h2 className="text-base font-semibold text-slate-950">
                  {copy.categoryLabels[category.id]}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {copy.categoryDetails[category.id]}
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {contracts.map((contract) => (
                  <ContractSection
                    key={contract.id}
                    contract={contract}
                    copy={copy}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </section>
    </AppShell>
  );
}
