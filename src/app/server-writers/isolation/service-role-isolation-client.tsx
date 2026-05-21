"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  SystemWriterContractCategory,
  SystemWriterContractId,
} from "@/types/system-writer-contract";
import type {
  ServiceRoleIsolationCheck,
  ServiceRoleIsolationCheckCategory,
  ServiceRoleIsolationPayload,
  ServiceRoleIsolationPlan,
  ServiceRoleIsolationProbeResult,
} from "@/types/service-role-isolation";

type ServiceRoleIsolationClientPageProps = {
  payload: ServiceRoleIsolationPayload;
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

const isolationCopy = {
  en: {
    title: "Service-role isolation test harness",
    badge: "Diagnostic only",
    body: "This page verifies the future service-role writer boundary as metadata only. It proves the planned modules remain server-only and inert before any privileged client can exist.",
    notice:
      "Current state is diagnostic-only: no real writer implementation import, no service-role client creation, no secret read, no row write, no AI call, no Stripe call, and no report unlock.",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    harnessMode: "Harness mode",
    wouldImportServerWriter: "Would import server writer",
    wouldCreateServiceRoleClient: "Would create service-role client",
    wouldReadServiceRoleSecret: "Would read service-role secret",
    wouldExposeServiceRoleSecret: "Would expose service-role secret",
    wouldWriteRows: "Would write rows",
    wouldCallAi: "Would call AI",
    wouldCallStripe: "Would call Stripe",
    yes: "Yes",
    no: "No",
    globalRules: "Global rules",
    boundaryChecks: "Boundary checks",
    plans: "Planned writer module probes",
    check: "Check",
    category: "Category",
    passed: "Passed",
    blocking: "Blocking",
    detail: "Detail",
    targetTables: "Target tables",
    operation: "Operation",
    module: "Server-only module",
    moduleSuffixOk: "Module suffix OK",
    serverOnlyImportRequired: "server-only import required",
    clientImportAllowed: "Client import allowed",
    browserBundleAllowed: "Browser bundle allowed",
    wouldImportModule: "Would import module",
    wouldCreateClient: "Would create client",
    wouldReadSecretValue: "Would read secret value",
    wouldWrite: "Would write",
    probe: "Probe isolation",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe: "Probe a planned writer boundary to confirm it remains inert.",
    summary: "Summary",
    openAdapter: "Open adapter",
    openRollout: "Open rollout",
    openStubs: "Open stubs",
    openDashboard: "Back to dashboard",
    categoryLabels: {
      server_only_boundary: "Server-only boundary",
      client_bundle: "Client bundle",
      secret_handling: "Secret handling",
      runtime_import: "Runtime import",
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
    title: "Service-role 隔离测试框架",
    badge: "仅诊断",
    body: "这个页面只用元数据验证未来 service-role writer 边界，证明计划模块在任何特权 client 存在前都保持服务端专用且惰性。",
    notice:
      "当前状态仅为诊断：不导入真实 writer 实现、不创建 service-role client、不读取 secret、不写入行、不调用 AI、不调用 Stripe、不解锁报告。",
    safetyState: "安全状态",
    safeMode: "安全模式",
    readOnly: "只读",
    harnessMode: "测试模式",
    wouldImportServerWriter: "是否导入 server writer",
    wouldCreateServiceRoleClient: "是否创建 service-role client",
    wouldReadServiceRoleSecret: "是否读取 service-role secret",
    wouldExposeServiceRoleSecret: "是否暴露 service-role secret",
    wouldWriteRows: "是否写入行",
    wouldCallAi: "是否调用 AI",
    wouldCallStripe: "是否调用 Stripe",
    yes: "是",
    no: "否",
    globalRules: "全局规则",
    boundaryChecks: "边界检查",
    plans: "计划 writer 模块探针",
    check: "检查",
    category: "类别",
    passed: "通过",
    blocking: "阻断",
    detail: "说明",
    targetTables: "目标表",
    operation: "操作",
    module: "服务端专用模块",
    moduleSuffixOk: "模块后缀正确",
    serverOnlyImportRequired: "必须包含 server-only import",
    clientImportAllowed: "允许客户端导入",
    browserBundleAllowed: "允许进入浏览器包",
    wouldImportModule: "是否导入模块",
    wouldCreateClient: "是否创建 client",
    wouldReadSecretValue: "是否读取 secret 值",
    wouldWrite: "是否写入",
    probe: "探测隔离边界",
    probing: "探测中...",
    probeResult: "探测结果",
    noProbe: "探测一个计划 writer 边界，确认它仍保持惰性。",
    summary: "摘要",
    openAdapter: "打开适配器",
    openRollout: "打开发布清单",
    openStubs: "打开模块桩",
    openDashboard: "返回工作台",
    categoryLabels: {
      server_only_boundary: "服务端边界",
      client_bundle: "浏览器包",
      secret_handling: "Secret 处理",
      runtime_import: "运行时导入",
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

type IsolationCopy = (typeof isolationCopy)[keyof typeof isolationCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: IsolationCopy;
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

function CheckList({
  checks,
  copy,
}: {
  checks: ServiceRoleIsolationCheck[];
  copy: IsolationCopy;
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
                  copy.categoryLabels[
                    check.category as ServiceRoleIsolationCheckCategory
                  ]
                }
              </StatusPill>
              <StatusPill tone={check.passed ? "ready" : "blocked"}>
                {copy.passed}: {check.passed ? copy.yes : copy.no}
              </StatusPill>
              <StatusPill tone={check.blocking ? "blocked" : "planned"}>
                {copy.blocking}: {check.blocking ? copy.yes : copy.no}
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

function PlanCard({
  plan,
  locale,
  copy,
  onProbe,
  isProbing,
}: {
  plan: ServiceRoleIsolationPlan;
  locale: "en" | "zh";
  copy: IsolationCopy;
  onProbe: (contractId: SystemWriterContractId) => void;
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
            {copy.category}
          </dt>
          <dd className="mt-2">
            <StatusPill tone="planned">
              {
                copy.contractCategoryLabels[
                  plan.category as SystemWriterContractCategory
                ]
              }
            </StatusPill>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.module}
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
        <div className="flex flex-wrap gap-2">
          <BoolPill
            value={plan.moduleSuffixOk}
            label={copy.moduleSuffixOk}
            copy={copy}
          />
          <BoolPill
            value={plan.serverOnlyImportRequired}
            label={copy.serverOnlyImportRequired}
            copy={copy}
          />
          <BoolPill
            value={plan.clientImportAllowed}
            label={copy.clientImportAllowed}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={plan.browserBundleAllowed}
            label={copy.browserBundleAllowed}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={plan.wouldImportModule}
            label={copy.wouldImportModule}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={plan.wouldCreateClient}
            label={copy.wouldCreateClient}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={plan.wouldReadSecretValue}
            label={copy.wouldReadSecretValue}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={plan.wouldWrite}
            label={copy.wouldWrite}
            copy={copy}
            readyWhenTrue={false}
          />
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.boundaryChecks}
          </dt>
          <dd className="mt-2">
            <CheckList checks={plan.checks} copy={copy} />
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => onProbe(plan.contractId)}
        disabled={isProbing}
        className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isProbing ? copy.probing : copy.probe}
      </button>
    </article>
  );
}

export function ServiceRoleIsolationClientPage({
  payload,
}: ServiceRoleIsolationClientPageProps) {
  const { locale } = useLanguage();
  const copy = isolationCopy[locale];
  const [probeResult, setProbeResult] =
    useState<ServiceRoleIsolationProbeResult | null>(null);
  const [probingContractId, setProbingContractId] =
    useState<SystemWriterContractId | null>(null);

  async function probe(contractId: SystemWriterContractId) {
    setProbingContractId(contractId);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/service-role-isolation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contractId }),
      });
      const result = (await response.json()) as ServiceRoleIsolationProbeResult;
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
            {copy.harnessMode}: {payload.harnessMode}
          </StatusPill>
          <BoolPill
            value={payload.wouldImportServerWriter}
            label={copy.wouldImportServerWriter}
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
            value={payload.wouldExposeServiceRoleSecret}
            label={copy.wouldExposeServiceRoleSecret}
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
              {probeResult.contractId ? (
                <p className="font-mono text-xs text-slate-500">
                  {contractLabels[locale][probeResult.contractId]}
                </p>
              ) : null}
              {probeResult.serverOnlyModule ? (
                <p className="break-words font-mono text-xs leading-6 text-slate-600">
                  {probeResult.serverOnlyModule}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <BoolPill
                  value={probeResult.wouldImportServerWriter}
                  label={copy.wouldImportServerWriter}
                  copy={copy}
                  readyWhenTrue={false}
                />
                <BoolPill
                  value={probeResult.wouldCreateServiceRoleClient}
                  label={copy.wouldCreateServiceRoleClient}
                  copy={copy}
                  readyWhenTrue={false}
                />
                <BoolPill
                  value={probeResult.wouldReadServiceRoleSecret}
                  label={copy.wouldReadServiceRoleSecret}
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
          {copy.boundaryChecks}
        </h2>
        <div className="mt-4">
          <CheckList checks={payload.boundaryChecks} copy={copy} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.plans}
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {payload.plans.map((plan) => (
            <PlanCard
              key={plan.contractId}
              plan={plan}
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
