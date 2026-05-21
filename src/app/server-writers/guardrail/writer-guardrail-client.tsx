"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterAuthContext,
  WriterExecutionGuardrailPayload,
  WriterGuardrailPolicy,
} from "@/types/system-writer-guardrail";
import type { SystemWriterContractId } from "@/types/system-writer-contract";

type WriterGuardrailClientPageProps = {
  payload: WriterExecutionGuardrailPayload;
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

const authContextLabels: Record<"en" | "zh", Record<WriterAuthContext, string>> = {
  en: {
    authenticated_user_request: "Authenticated user request",
    stripe_webhook: "Stripe webhook",
    server_executor: "Server executor",
    operator_review: "Operator review",
  },
  zh: {
    authenticated_user_request: "已认证用户请求",
    stripe_webhook: "Stripe webhook",
    server_executor: "服务端执行器",
    operator_review: "运营审核",
  },
};

const guardrailCopy = {
  en: {
    title: "Writer execution guardrail",
    badge: "No real writes",
    body: "This page defines the execution boundary that must exist before any system writer can perform a real service-role write.",
    notice:
      "The current implementation is documentation and policy only. Service-role writes, AI calls, Stripe calls, and report unlocks remain blocked.",
    globalRules: "Global rules",
    phases: "Execution phases",
    policies: "Writer policies",
    rolloutGates: "Rollout gates",
    authContext: "Auth context",
    entrypoint: "Entrypoint",
    targetTables: "Target tables",
    requiredFlags: "Required flags",
    auditEvent: "Audit event",
    preWriteChecks: "Pre-write checks",
    idempotency: "Idempotency conflict behavior",
    rollback: "Rollback strategy",
    rolloutNotes: "Rollout notes",
    allowedNow: "Allowed now",
    required: "Required",
    passed: "Passed",
    yes: "Yes",
    no: "No",
    safeFlags: "Current safety state",
    safeMode: "Safe mode",
    realWrites: "Real writes",
    serviceRoleClient: "Service-role client",
    aiCalls: "AI calls",
    stripeCalls: "Stripe calls",
    openContracts: "Open contracts",
    openDryRun: "Open dry-run",
    openAdapter: "Open adapter",
    openAudit: "Open audit model",
    openRollback: "Open rollback",
    openRollout: "Open rollout",
    openDashboard: "Back to dashboard",
  },
  zh: {
    title: "写入执行护栏",
    badge: "无真实写入",
    body: "这个页面定义任何系统 writer 执行真实 service-role 写入之前必须存在的执行边界。",
    notice:
      "当前实现只做文档与策略展示。service-role 写入、AI 调用、Stripe 调用和报告解锁仍然全部阻断。",
    globalRules: "全局规则",
    phases: "执行阶段",
    policies: "Writer 策略",
    rolloutGates: "发布闸门",
    authContext: "认证上下文",
    entrypoint: "入口",
    targetTables: "目标表",
    requiredFlags: "必要开关",
    auditEvent: "审计事件",
    preWriteChecks: "写入前检查",
    idempotency: "幂等冲突行为",
    rollback: "回滚策略",
    rolloutNotes: "发布说明",
    allowedNow: "当前允许",
    required: "必须",
    passed: "已通过",
    yes: "是",
    no: "否",
    safeFlags: "当前安全状态",
    safeMode: "安全模式",
    realWrites: "真实写入",
    serviceRoleClient: "Service-role 客户端",
    aiCalls: "AI 调用",
    stripeCalls: "Stripe 调用",
    openContracts: "打开写入契约",
    openDryRun: "打开 dry-run",
    openAdapter: "打开适配器",
    openAudit: "打开审计模型",
    openRollback: "打开回滚模型",
    openRollout: "打开发布清单",
    openDashboard: "返回工作台",
  },
} as const;

type GuardrailCopy = (typeof guardrailCopy)[keyof typeof guardrailCopy];

function BoolPill({
  value,
  label,
  yes,
  no,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  yes: string;
  no: string;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? yes : no}
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

function PolicyCard({
  policy,
  locale,
  copy,
}: {
  policy: WriterGuardrailPolicy;
  locale: "en" | "zh";
  copy: GuardrailCopy;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {contractLabels[locale][policy.contractId]}
          </h3>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {policy.contractId}
          </p>
        </div>
        <StatusPill tone="planned">
          {authContextLabels[locale][policy.authContext]}
        </StatusPill>
      </div>

      <dl className="grid gap-4">
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.entrypoint}
          </dt>
          <dd className="mt-1 font-mono text-xs leading-6 text-slate-700">
            {policy.entrypoint}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.targetTables}
          </dt>
          <dd className="mt-2">
            <InlineList items={policy.targetTables} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.requiredFlags}
          </dt>
          <dd className="mt-2">
            <InlineList items={policy.requiredFlags} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.auditEvent}
          </dt>
          <dd className="mt-1 font-mono text-xs leading-6 text-slate-700">
            {policy.auditEventType}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.preWriteChecks}
          </dt>
          <dd className="mt-2">
            <TextList items={policy.preWriteChecks} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.idempotency}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-slate-600">
            {policy.idempotencyConflictBehavior}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.rollback}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-slate-600">
            {policy.rollbackStrategy}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.rolloutNotes}
          </dt>
          <dd className="mt-2">
            <TextList items={policy.rolloutNotes} />
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function WriterGuardrailClientPage({
  payload,
}: WriterGuardrailClientPageProps) {
  const { locale } = useLanguage();
  const copy = guardrailCopy[locale];

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
          {copy.safeFlags}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <BoolPill
            value={payload.safeMode}
            label={copy.safeMode}
            yes={copy.yes}
            no={copy.no}
          />
          <BoolPill
            value={payload.realWritesAllowed}
            label={copy.realWrites}
            yes={copy.yes}
            no={copy.no}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.serviceRoleClientAllowed}
            label={copy.serviceRoleClient}
            yes={copy.yes}
            no={copy.no}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.aiCallsAllowed}
            label={copy.aiCalls}
            yes={copy.yes}
            no={copy.no}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.stripeCallsAllowed}
            label={copy.stripeCalls}
            yes={copy.yes}
            no={copy.no}
            readyWhenTrue={false}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/server-writers/contracts"
            className="rounded-md border border-lime-300 bg-lime-50 px-4 py-2 text-sm font-semibold text-lime-800 transition hover:bg-lime-100"
          >
            {copy.openContracts}
          </Link>
          <Link
            href="/server-writers/dry-run"
            className="rounded-md border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
          >
            {copy.openDryRun}
          </Link>
          <Link
            href="/server-writers/adapter"
            className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
          >
            {copy.openAdapter}
          </Link>
          <Link
            href="/server-writers/audit"
            className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
          >
            {copy.openAudit}
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
            href="/dashboard"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            {copy.openDashboard}
          </Link>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.globalRules}
            </h2>
            <div className="mt-4">
              <TextList items={payload.globalRules} />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-base font-semibold text-slate-950">
              {copy.policies}
            </h2>
            <div className="grid gap-4">
              {payload.policies.map((policy) => (
                <PolicyCard
                  key={policy.contractId}
                  policy={policy}
                  locale={locale}
                  copy={copy}
                />
              ))}
            </div>
          </section>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.phases}
            </h2>
            <div className="mt-4 space-y-3">
              {payload.executionPhases.map((phase) => (
                <article
                  key={phase.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {phase.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <BoolPill
                        value={phase.required}
                        label={copy.required}
                        yes={copy.yes}
                        no={copy.no}
                      />
                      <BoolPill
                        value={phase.allowedNow}
                        label={copy.allowedNow}
                        yes={copy.yes}
                        no={copy.no}
                      />
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    {phase.detail}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.rolloutGates}
            </h2>
            <div className="mt-4 space-y-3">
              {payload.rolloutGates.map((gate) => (
                <article
                  key={gate.id}
                  className="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {gate.title}
                    </h3>
                    <BoolPill
                      value={gate.passed}
                      label={copy.passed}
                      yes={copy.yes}
                      no={copy.no}
                    />
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    {gate.detail}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
