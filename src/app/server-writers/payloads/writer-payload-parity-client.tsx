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
  WriterPayloadParityCheck,
  WriterPayloadParityCheckCategory,
  WriterPayloadParityFixture,
  WriterPayloadParityPayload,
  WriterPayloadParityProbeResult,
} from "@/types/writer-payload-parity";

type WriterPayloadParityClientPageProps = {
  payload: WriterPayloadParityPayload;
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

const parityCopy = {
  en: {
    title: "Writer payload parity fixtures",
    badge: "Fixture-only",
    body: "This page aligns dry-run samples, inert stub probes, and future writer request shapes before any real writer implementation exists.",
    notice:
      "Current behavior is diagnostic only: dry-run validation may run, inert stubs may be probed, but future writers are not executed and no privileged operation can occur.",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    parityMode: "Parity mode",
    wouldRunDryRunValidation: "Would run dry-run validation",
    wouldProbeInertStubs: "Would probe inert stubs",
    wouldExecuteFutureWriter: "Would execute future writer",
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
    allFixturesAligned: "All fixtures aligned",
    fixtureCount: "Fixture count",
    yes: "Yes",
    no: "No",
    globalRules: "Global rules",
    sharedChecks: "Shared checks",
    fixtures: "Fixtures",
    category: "Category",
    targetTables: "Target tables",
    requiredFlags: "Required flags",
    requiredInputs: "Required inputs",
    optionalInputs: "Optional inputs",
    idempotencyTemplate: "Idempotency template",
    dryRunSample: "Dry-run sample",
    stubProbeRequest: "Stub probe request",
    futureWriterShape: "Future writer shape",
    dryRunStatus: "Dry-run status",
    checks: "Checks",
    probe: "Probe parity",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe: "Probe a parity fixture to confirm it remains read-only.",
    summary: "Summary",
    openDryRun: "Open dry-run",
    openStubs: "Open stubs",
    openContracts: "Open contracts",
    openRedaction: "Open redaction",
    openDashboard: "Back to dashboard",
    checkCategoryLabels: {
      contract_coverage: "Contract coverage",
      dry_run_shape: "Dry-run shape",
      stub_probe_shape: "Stub probe shape",
      future_writer_shape: "Future writer shape",
      idempotency: "Idempotency",
      sensitive_input_guard: "Sensitive input guard",
      gate_alignment: "Gate alignment",
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
    title: "Writer payload 对齐 fixtures",
    badge: "仅 fixture",
    body: "这个页面在任何真实 writer 实现存在前，对齐 dry-run 示例、惰性 stub 探针和未来 writer 请求形状。",
    notice:
      "当前行为仅为诊断：可以运行 dry-run 验证，可以探测惰性 stub，但不会执行未来 writer，也不会发生任何特权操作。",
    safetyState: "安全状态",
    safeMode: "安全模式",
    readOnly: "只读",
    parityMode: "对齐模式",
    wouldRunDryRunValidation: "是否运行 dry-run 验证",
    wouldProbeInertStubs: "是否探测惰性 stubs",
    wouldExecuteFutureWriter: "是否执行未来 writer",
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
    allFixturesAligned: "所有 fixtures 已对齐",
    fixtureCount: "Fixture 数量",
    yes: "是",
    no: "否",
    globalRules: "全局规则",
    sharedChecks: "共享检查",
    fixtures: "Fixtures",
    category: "类别",
    targetTables: "目标表",
    requiredFlags: "必要开关",
    requiredInputs: "必要输入",
    optionalInputs: "可选输入",
    idempotencyTemplate: "幂等模板",
    dryRunSample: "Dry-run 示例",
    stubProbeRequest: "Stub 探针请求",
    futureWriterShape: "未来 writer 形状",
    dryRunStatus: "Dry-run 状态",
    checks: "检查项",
    probe: "探测对齐",
    probing: "探测中...",
    probeResult: "探测结果",
    noProbe: "探测一个 parity fixture，确认它仍保持只读。",
    summary: "摘要",
    openDryRun: "打开 dry-run",
    openStubs: "打开模块桩",
    openContracts: "打开契约",
    openRedaction: "打开脱敏",
    openDashboard: "返回工作台",
    checkCategoryLabels: {
      contract_coverage: "契约覆盖",
      dry_run_shape: "Dry-run 形状",
      stub_probe_shape: "Stub 探针形状",
      future_writer_shape: "未来 writer 形状",
      idempotency: "幂等",
      sensitive_input_guard: "敏感输入防护",
      gate_alignment: "闸门对齐",
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

type ParityCopy = (typeof parityCopy)[keyof typeof parityCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: ParityCopy;
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

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-6 text-slate-50">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function CheckList({
  checks,
  copy,
}: {
  checks: WriterPayloadParityCheck[];
  copy: ParityCopy;
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
                    check.category as WriterPayloadParityCheckCategory
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
  fixture: WriterPayloadParityFixture;
  locale: "en" | "zh";
  copy: ParityCopy;
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
          {copy.dryRunStatus}: {fixture.dryRunValidationStatus}
        </StatusPill>
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
                  fixture.category as SystemWriterContractCategory
                ]
              }
            </StatusPill>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.targetTables}
          </dt>
          <dd className="mt-2">
            <InlineList items={fixture.targetTables} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.requiredFlags}
          </dt>
          <dd className="mt-2">
            <InlineList items={fixture.requiredFlags} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.requiredInputs}
          </dt>
          <dd className="mt-2">
            <InlineList items={fixture.requiredInputKeys} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.optionalInputs}
          </dt>
          <dd className="mt-2">
            <InlineList items={fixture.optionalInputKeys} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.idempotencyTemplate}
          </dt>
          <dd className="mt-1 break-words font-mono text-xs leading-6 text-slate-700">
            {fixture.idempotencyKeyTemplate}
          </dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <BoolPill
            value={fixture.wouldExecuteFutureWriter}
            label={copy.wouldExecuteFutureWriter}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={fixture.wouldCreateServiceRoleClient}
            label={copy.wouldCreateServiceRoleClient}
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
            {copy.dryRunSample}
          </dt>
          <dd className="mt-2">
            <JsonBlock value={fixture.dryRunSampleRequest} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.stubProbeRequest}
          </dt>
          <dd className="mt-2">
            <JsonBlock value={fixture.stubProbeRequest} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.futureWriterShape}
          </dt>
          <dd className="mt-2">
            <JsonBlock value={fixture.futureWriterRequestShape} />
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

export function WriterPayloadParityClientPage({
  payload,
}: WriterPayloadParityClientPageProps) {
  const { locale } = useLanguage();
  const copy = parityCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPayloadParityProbeResult | null>(null);
  const [probingContractId, setProbingContractId] =
    useState<SystemWriterContractId | null>(null);

  async function probe(contractId: SystemWriterContractId) {
    setProbingContractId(contractId);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/payload-parity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contractId }),
      });
      const result = (await response.json()) as WriterPayloadParityProbeResult;
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
            {copy.parityMode}: {payload.parityMode}
          </StatusPill>
          <StatusPill tone={payload.allFixturesAligned ? "ready" : "blocked"}>
            {copy.allFixturesAligned}:{" "}
            {payload.allFixturesAligned ? copy.yes : copy.no}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.fixtureCount}: {payload.fixtureCount}
          </StatusPill>
          <BoolPill
            value={payload.wouldRunDryRunValidation}
            label={copy.wouldRunDryRunValidation}
            copy={copy}
          />
          <BoolPill
            value={payload.wouldProbeInertStubs}
            label={copy.wouldProbeInertStubs}
            copy={copy}
          />
          <BoolPill
            value={payload.wouldExecuteFutureWriter}
            label={copy.wouldExecuteFutureWriter}
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
            href="/server-writers/dry-run"
            className="rounded-md border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
          >
            {copy.openDryRun}
          </Link>
          <Link
            href="/server-writers/stubs"
            className="rounded-md border border-lime-300 bg-lime-50 px-4 py-2 text-sm font-semibold text-lime-800 transition hover:bg-lime-100"
          >
            {copy.openStubs}
          </Link>
          <Link
            href="/server-writers/contracts"
            className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            {copy.openContracts}
          </Link>
          <Link
            href="/server-writers/redaction"
            className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
          >
            {copy.openRedaction}
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
                  probeResult.dryRunValidationStatus ?? "no dry-run status",
                ]}
              />
              <div className="flex flex-wrap gap-2">
                <BoolPill
                  value={probeResult.wouldRunDryRunValidation}
                  label={copy.wouldRunDryRunValidation}
                  copy={copy}
                />
                <BoolPill
                  value={probeResult.wouldProbeInertStub}
                  label={copy.wouldProbeInertStubs}
                  copy={copy}
                />
                <BoolPill
                  value={probeResult.wouldExecuteFutureWriter}
                  label={copy.wouldExecuteFutureWriter}
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
