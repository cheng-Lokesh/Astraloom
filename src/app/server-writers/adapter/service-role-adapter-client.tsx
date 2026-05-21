"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type { SystemWriterContractId } from "@/types/system-writer-contract";
import type {
  ServiceRoleAdapterPlan,
  ServiceRoleAdapterProbeResult,
  ServiceRoleAdapterStatusPayload,
} from "@/types/service-role-adapter";

type ServiceRoleAdapterClientPageProps = {
  payload: ServiceRoleAdapterStatusPayload;
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

const adapterCopy = {
  en: {
    title: "Disabled service-role adapter",
    badge: "Inert boundary",
    body: "This page defines the server-only adapter shell for future system writers. It is intentionally disabled and cannot create a service-role client or write rows.",
    notice:
      "Current behavior is blocked by design: no client creation, no insert/upsert/update/delete, no AI call, no Stripe call, no report unlock.",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    wouldCreateClient: "Would create client",
    wouldWrite: "Would write",
    serviceRoleConfigured: "Service role configured",
    systemWritersEnabled: "System writers enabled",
    aiGenerationEnabled: "AI generation enabled",
    stripeWritesEnabled: "Stripe writes enabled",
    yes: "Yes",
    no: "No",
    adapterRules: "Adapter rules",
    plans: "Adapter plans",
    contract: "Contract",
    operation: "Operation",
    targetTables: "Target tables",
    serverOnlyModule: "Server-only module",
    requiredFlags: "Required flags",
    blockCodes: "Block codes",
    checks: "Checks",
    probe: "Probe adapter",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe: "Probe a plan to confirm the adapter remains blocked.",
    requestedOperation: "Requested operation",
    expectedOperation: "Expected operation",
    summary: "Summary",
    openGuardrail: "Open guardrail",
    openDryRun: "Open dry-run",
    openAudit: "Open audit model",
    openIdempotency: "Open idempotency",
    openRollback: "Open rollback",
    openRollout: "Open rollout",
    openIsolation: "Open isolation",
    openStubs: "Open stubs",
    openDashboard: "Back to dashboard",
  },
  zh: {
    title: "禁用态 service-role 适配器",
    badge: "惰性边界",
    body: "这个页面定义未来系统 writer 的服务端专用适配器外壳。它被故意禁用，不能创建 service-role client，也不能写入数据行。",
    notice:
      "当前行为按设计阻断：不创建 client、不 insert/upsert/update/delete、不调用 AI、不调用 Stripe、不解锁报告。",
    safetyState: "安全状态",
    safeMode: "安全模式",
    wouldCreateClient: "是否创建 client",
    wouldWrite: "是否写入",
    serviceRoleConfigured: "Service role 已配置",
    systemWritersEnabled: "系统写入已启用",
    aiGenerationEnabled: "AI 生成已启用",
    stripeWritesEnabled: "Stripe 写入已启用",
    yes: "是",
    no: "否",
    adapterRules: "适配器规则",
    plans: "适配器计划",
    contract: "契约",
    operation: "操作",
    targetTables: "目标表",
    serverOnlyModule: "服务端专用模块",
    requiredFlags: "必要开关",
    blockCodes: "阻断代码",
    checks: "检查项",
    probe: "探测适配器",
    probing: "探测中...",
    probeResult: "探测结果",
    noProbe: "探测一个计划，确认适配器仍保持阻断。",
    requestedOperation: "请求操作",
    expectedOperation: "预期操作",
    summary: "摘要",
    openGuardrail: "打开护栏",
    openDryRun: "打开 dry-run",
    openAudit: "打开审计模型",
    openIdempotency: "打开幂等模型",
    openRollback: "打开回滚模型",
    openRollout: "打开发布清单",
    openIsolation: "打开隔离",
    openStubs: "打开模块桩",
    openDashboard: "返回工作台",
  },
} as const;

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

function PlanCard({
  plan,
  locale,
  copy,
  onProbe,
  isProbing,
}: {
  plan: ServiceRoleAdapterPlan;
  locale: "en" | "zh";
  copy: (typeof adapterCopy)[keyof typeof adapterCopy];
  onProbe: (plan: ServiceRoleAdapterPlan) => void;
  isProbing: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {contractLabels[locale][plan.contractId]}
          </h3>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {plan.contractId}
          </p>
        </div>
        <StatusPill tone="blocked">{plan.intendedOperation}</StatusPill>
      </div>

      <dl className="grid gap-4">
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.serverOnlyModule}
          </dt>
          <dd className="mt-1 break-words font-mono text-xs leading-6 text-slate-700">
            {plan.serverOnlyModule}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.targetTables}
          </dt>
          <dd className="mt-2">
            <InlineList items={plan.targetTables} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.requiredFlags}
          </dt>
          <dd className="mt-2">
            <InlineList items={plan.requiredFlags} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.blockCodes}
          </dt>
          <dd className="mt-2">
            <InlineList items={plan.blockedCodes} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.checks}
          </dt>
          <dd className="mt-2 space-y-2">
            {plan.checks.map((check) => (
              <div
                key={check.id}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-950">
                    {check.title}
                  </span>
                  <BoolPill
                    value={check.passed}
                    label="Pass"
                    yes={copy.yes}
                    no={copy.no}
                  />
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  {check.detail}
                </p>
              </div>
            ))}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => onProbe(plan)}
        disabled={isProbing}
        className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isProbing ? copy.probing : copy.probe}
      </button>
    </article>
  );
}

export function ServiceRoleAdapterClientPage({
  payload,
}: ServiceRoleAdapterClientPageProps) {
  const { locale } = useLanguage();
  const copy = adapterCopy[locale];
  const [probeResult, setProbeResult] =
    useState<ServiceRoleAdapterProbeResult | null>(null);
  const [probingContractId, setProbingContractId] =
    useState<SystemWriterContractId | null>(null);
  const planById = useMemo(
    () =>
      payload.plans.reduce(
        (acc, plan) => {
          acc[plan.contractId] = plan;
          return acc;
        },
        {} as Record<SystemWriterContractId, ServiceRoleAdapterPlan>,
      ),
    [payload.plans],
  );

  async function probe(plan: ServiceRoleAdapterPlan) {
    setProbingContractId(plan.contractId);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/service-role-adapter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractId: plan.contractId,
          operation: plan.intendedOperation,
        }),
      });
      const result = (await response.json()) as ServiceRoleAdapterProbeResult;
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
        <StatusPill tone="blocked">{copy.badge}</StatusPill>
      </div>

      <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        {copy.notice}
      </section>

      <div className="mb-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.safetyState}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <BoolPill
              value={payload.safeMode}
              label={copy.safeMode}
              yes={copy.yes}
              no={copy.no}
            />
            <BoolPill
              value={payload.wouldCreateClient}
              label={copy.wouldCreateClient}
              yes={copy.yes}
              no={copy.no}
              readyWhenTrue={false}
            />
            <BoolPill
              value={payload.wouldWrite}
              label={copy.wouldWrite}
              yes={copy.yes}
              no={copy.no}
              readyWhenTrue={false}
            />
            <BoolPill
              value={payload.serviceRoleConfigured}
              label={copy.serviceRoleConfigured}
              yes={copy.yes}
              no={copy.no}
            />
            <BoolPill
              value={payload.systemWritersEnabled}
              label={copy.systemWritersEnabled}
              yes={copy.yes}
              no={copy.no}
            />
            <BoolPill
              value={payload.aiGenerationEnabled}
              label={copy.aiGenerationEnabled}
              yes={copy.yes}
              no={copy.no}
            />
            <BoolPill
              value={payload.stripeWritesEnabled}
              label={copy.stripeWritesEnabled}
              yes={copy.yes}
              no={copy.no}
            />
          </div>
          <div className="mt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
              {copy.blockCodes}
            </h3>
            <InlineList items={payload.globalBlockedCodes} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/server-writers/guardrail"
              className="rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
            >
              {copy.openGuardrail}
            </Link>
            <Link
              href="/server-writers/dry-run"
              className="rounded-md border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
            >
              {copy.openDryRun}
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
              href="/server-writers/isolation"
              className="rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
            >
              {copy.openIsolation}
            </Link>
            <Link
              href="/server-writers/stubs"
              className="rounded-md border border-lime-300 bg-lime-50 px-4 py-2 text-sm font-semibold text-lime-800 transition hover:bg-lime-100"
            >
              {copy.openStubs}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copy.openDashboard}
            </Link>
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.probeResult}
          </h2>
          {probeResult ? (
            <div className="mt-4 space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="blocked">
                  {copy.wouldCreateClient}:{" "}
                  {probeResult.wouldCreateClient ? "true" : "false"}
                </StatusPill>
                <StatusPill tone="ready">
                  {copy.wouldWrite}: {probeResult.wouldWrite ? "true" : "false"}
                </StatusPill>
              </div>
              <p className="leading-6 text-slate-600">{probeResult.summary}</p>
              {probeResult.contractId ? (
                <p className="font-mono text-xs text-slate-500">
                  {contractLabels[locale][probeResult.contractId]}
                </p>
              ) : null}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                  {copy.requestedOperation}
                </h3>
                <InlineList
                  items={[
                    probeResult.requestedOperation ?? "none",
                    `${copy.expectedOperation}: ${
                      probeResult.expectedOperation ?? "none"
                    }`,
                  ]}
                />
              </div>
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                  {copy.blockCodes}
                </h3>
                <InlineList items={probeResult.blockedCodes} />
              </div>
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
          {copy.adapterRules}
        </h2>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
          {payload.adapterRules.map((rule) => (
            <li key={rule} className="rounded-md bg-slate-50 px-3 py-2">
              {rule}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.plans}
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {payload.plans.map((plan) => (
            <PlanCard
              key={plan.contractId}
              plan={planById[plan.contractId]}
              locale={locale}
              copy={copy}
              onProbe={probe}
              isProbing={probingContractId === plan.contractId}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
