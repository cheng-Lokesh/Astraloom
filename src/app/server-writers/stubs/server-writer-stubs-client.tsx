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
  ServerWriterStubCheck,
  ServerWriterStubCheckCategory,
  ServerWriterStubModule,
  ServerWriterStubPayload,
  ServerWriterStubProbeResult,
} from "@/types/server-writer-stub";

type ServerWriterStubsClientPageProps = {
  payload: ServerWriterStubPayload;
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

const stubsCopy = {
  en: {
    title: "Server-only writer module stubs",
    badge: "Inert .server modules",
    body: "This page proves the planned writer module files now exist as server-only inert stubs. They can be imported by server routes, but they cannot create privileged clients, read secrets, write rows, call AI, call Stripe, or unlock reports.",
    notice:
      "Current behavior is still blocked: these are not real writers. They only reserve boundaries and return blocked metadata.",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    stubMode: "Stub mode",
    importsInertServerOnlyStubs: "Imports inert server-only stubs",
    wouldImportRealWriterImplementation: "Would import real writer implementation",
    wouldCreateServiceRoleClient: "Would create service-role client",
    wouldReadServiceRoleSecret: "Would read service-role secret",
    wouldExposeServiceRoleSecret: "Would expose service-role secret",
    wouldWriteRows: "Would write rows",
    wouldCallAi: "Would call AI",
    wouldCallStripe: "Would call Stripe",
    wouldUnlockReports: "Would unlock reports",
    wouldWriteAuditRows: "Would write audit rows",
    wouldReserveIdempotencyKeys: "Would reserve idempotency keys",
    wouldWriteCompensationRows: "Would write compensation rows",
    yes: "Yes",
    no: "No",
    globalRules: "Global rules",
    sharedChecks: "Shared checks",
    stubs: "Writer stubs",
    category: "Category",
    targetTables: "Target tables",
    operation: "Operation",
    modulePath: "Module path",
    exportedSymbol: "Exported symbol",
    summary: "Summary",
    checks: "Checks",
    probe: "Probe stub",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe: "Probe a server-only writer stub to confirm it remains inert.",
    reasonCode: "Reason code",
    openIsolation: "Open isolation",
    openAdapter: "Open adapter",
    openRollout: "Open rollout",
    openPayloads: "Open payloads",
    openDashboard: "Back to dashboard",
    categoryLabels: {
      agent_ecology: "Agent ecology",
      simulation: "Simulation",
      reporting: "Reporting",
      payments: "Payments",
      compliance: "Compliance",
    },
    checkCategoryLabels: {
      server_only_boundary: "Server-only boundary",
      client_bundle: "Client bundle",
      privileged_client: "Privileged client",
      secret_handling: "Secret handling",
      write_block: "Write block",
      external_side_effect: "External side effect",
      history_safety: "History safety",
    },
  },
  zh: {
    title: "服务端 writer 模块桩",
    badge: "惰性 .server 模块",
    body: "这个页面证明计划中的 writer 模块文件已经以服务端专用的惰性 stub 形式存在。它们可以被服务端路由导入，但不能创建特权 client、读取 secret、写入行、调用 AI、调用 Stripe 或解锁报告。",
    notice:
      "当前行为仍然阻断：这些不是真实 writer，只用于占住边界并返回 blocked 元数据。",
    safetyState: "安全状态",
    safeMode: "安全模式",
    readOnly: "只读",
    stubMode: "Stub 模式",
    importsInertServerOnlyStubs: "导入惰性服务端 stubs",
    wouldImportRealWriterImplementation: "是否导入真实 writer 实现",
    wouldCreateServiceRoleClient: "是否创建 service-role client",
    wouldReadServiceRoleSecret: "是否读取 service-role secret",
    wouldExposeServiceRoleSecret: "是否暴露 service-role secret",
    wouldWriteRows: "是否写入行",
    wouldCallAi: "是否调用 AI",
    wouldCallStripe: "是否调用 Stripe",
    wouldUnlockReports: "是否解锁报告",
    wouldWriteAuditRows: "是否写入审计行",
    wouldReserveIdempotencyKeys: "是否预留幂等键",
    wouldWriteCompensationRows: "是否写入补偿行",
    yes: "是",
    no: "否",
    globalRules: "全局规则",
    sharedChecks: "共享检查",
    stubs: "Writer 模块桩",
    category: "类别",
    targetTables: "目标表",
    operation: "操作",
    modulePath: "模块路径",
    exportedSymbol: "导出符号",
    summary: "摘要",
    checks: "检查项",
    probe: "探测 stub",
    probing: "探测中...",
    probeResult: "探测结果",
    noProbe: "探测一个服务端 writer stub，确认它仍保持惰性。",
    reasonCode: "原因代码",
    openIsolation: "打开隔离",
    openAdapter: "打开适配器",
    openRollout: "打开发布",
    openPayloads: "打开 Payload",
    openDashboard: "返回工作台",
    categoryLabels: {
      agent_ecology: "Agent 生态",
      simulation: "推演运行",
      reporting: "报告输出",
      payments: "支付权益",
      compliance: "合规",
    },
    checkCategoryLabels: {
      server_only_boundary: "服务端边界",
      client_bundle: "浏览器包",
      privileged_client: "特权 client",
      secret_handling: "Secret 处理",
      write_block: "写入阻断",
      external_side_effect: "外部副作用",
      history_safety: "历史安全",
    },
  },
} as const;

type StubsCopy = (typeof stubsCopy)[keyof typeof stubsCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: StubsCopy;
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
  checks: ServerWriterStubCheck[];
  copy: StubsCopy;
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
                    check.category as ServerWriterStubCheckCategory
                  ]
                }
              </StatusPill>
              <StatusPill tone="ready">
                {copy.yes}
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

function StubCard({
  stub,
  locale,
  copy,
  onProbe,
  isProbing,
}: {
  stub: ServerWriterStubModule;
  locale: "en" | "zh";
  copy: StubsCopy;
  onProbe: (contractId: SystemWriterContractId) => void;
  isProbing: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {contractLabels[locale][stub.contractId]}
          </h3>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {stub.contractId}
          </p>
        </div>
        <StatusPill tone="blocked">{stub.mode}</StatusPill>
      </div>

      <dl className="grid gap-4">
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.category}
          </dt>
          <dd className="mt-2">
            <StatusPill tone="planned">
              {
                copy.categoryLabels[
                  stub.category as SystemWriterContractCategory
                ]
              }
            </StatusPill>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.modulePath}
          </dt>
          <dd className="mt-1 break-words font-mono text-xs leading-6 text-slate-700">
            {stub.modulePath}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.exportedSymbol}
          </dt>
          <dd className="mt-1 break-words font-mono text-xs leading-6 text-slate-700">
            {stub.exportedSymbol}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.targetTables}
          </dt>
          <dd className="mt-2">
            <InlineList items={stub.targetTables} />
          </dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="blocked">
            {copy.operation}: {stub.intendedOperation}
          </StatusPill>
          <BoolPill
            value={stub.clientImportAllowed}
            label="Client import"
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={stub.wouldCreateServiceRoleClient}
            label={copy.wouldCreateServiceRoleClient}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={stub.wouldWriteRows}
            label={copy.wouldWriteRows}
            copy={copy}
            readyWhenTrue={false}
          />
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.summary}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-slate-600">
            {stub.summary}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.checks}
          </dt>
          <dd className="mt-2">
            <CheckList checks={stub.checks} copy={copy} />
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => onProbe(stub.contractId)}
        disabled={isProbing}
        className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isProbing ? copy.probing : copy.probe}
      </button>
    </article>
  );
}

export function ServerWriterStubsClientPage({
  payload,
}: ServerWriterStubsClientPageProps) {
  const { locale } = useLanguage();
  const copy = stubsCopy[locale];
  const [probeResult, setProbeResult] =
    useState<ServerWriterStubProbeResult | null>(null);
  const [probingContractId, setProbingContractId] =
    useState<SystemWriterContractId | null>(null);

  async function probe(contractId: SystemWriterContractId) {
    setProbingContractId(contractId);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/stubs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contractId }),
      });
      const result = (await response.json()) as ServerWriterStubProbeResult;
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

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.safetyState}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <BoolPill value={payload.safeMode} label={copy.safeMode} copy={copy} />
          <BoolPill value={payload.readOnly} label={copy.readOnly} copy={copy} />
          <StatusPill tone="blocked">
            {copy.stubMode}: {payload.stubMode}
          </StatusPill>
          <BoolPill
            value={payload.importsInertServerOnlyStubs}
            label={copy.importsInertServerOnlyStubs}
            copy={copy}
          />
          <BoolPill
            value={payload.wouldImportRealWriterImplementation}
            label={copy.wouldImportRealWriterImplementation}
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
          <BoolPill
            value={payload.wouldUnlockReports}
            label={copy.wouldUnlockReports}
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
            value={payload.wouldWriteCompensationRows}
            label={copy.wouldWriteCompensationRows}
            copy={copy}
            readyWhenTrue={false}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/server-writers/isolation"
            className="rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
          >
            {copy.openIsolation}
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
            href="/server-writers/payloads"
            className="rounded-md border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
          >
            {copy.openPayloads}
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
                  `${copy.reasonCode}: ${probeResult.reasonCode}`,
                  probeResult.contractId ?? "no contract",
                ]}
              />
              {probeResult.modulePath ? (
                <p className="break-words font-mono text-xs leading-6 text-slate-600">
                  {probeResult.modulePath}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <BoolPill
                  value={probeResult.importsInertServerOnlyStub}
                  label={copy.importsInertServerOnlyStubs}
                  copy={copy}
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
          {copy.sharedChecks}
        </h2>
        <div className="mt-4">
          <CheckList checks={payload.sharedChecks} copy={copy} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.stubs}
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {payload.stubs.map((stub) => (
            <StubCard
              key={stub.contractId}
              stub={stub}
              locale={locale}
              copy={copy}
              onProbe={probe}
              isProbing={probingContractId === stub.contractId}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
