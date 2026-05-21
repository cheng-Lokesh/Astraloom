"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type { SystemWriterContractId } from "@/types/system-writer-contract";
import type {
  SystemWriterDryRunCatalog,
  SystemWriterDryRunResult,
  SystemWriterDryRunStatus,
} from "@/types/system-writer-dry-run";

type WriterDryRunClientPageProps = {
  catalog: SystemWriterDryRunCatalog;
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

const dryRunCopy = {
  en: {
    title: "Writer dry-run validator",
    badge: "No write mode",
    body: "Use this page to validate backend writer requests before any service-role write, AI model call, Stripe call, or report unlock exists.",
    warning:
      "This endpoint is intentionally safe: it only validates request shape and gates. A successful dry-run still returns wouldWrite=false.",
    selectContract: "Contract",
    requestBody: "Dry-run request JSON",
    run: "Run dry-run",
    running: "Validating...",
    resetSample: "Reset sample",
    result: "Result",
    noResult: "Run a dry-run to inspect gate status.",
    safeMode: "Safe mode",
    wouldWrite: "Would write",
    status: "Status",
    targetTables: "Target tables",
    requiredInputs: "Required inputs",
    acceptedInputs: "Accepted inputs",
    missingInputs: "Missing inputs",
    disabledFlags: "Disabled flags",
    issues: "Issues",
    none: "None",
    parseError: "Request JSON is invalid.",
    openContracts: "Open contracts",
    openStatus: "Open writer status",
    openGuardrail: "Open guardrail",
    openAdapter: "Open adapter",
    openRollback: "Open rollback",
    openRollout: "Open rollout",
    openPayloads: "Open payloads",
    openDashboard: "Back to dashboard",
    statusLabels: {
      invalid_request: "Invalid request",
      blocked_by_gate: "Blocked by gate",
      dry_run_ready: "Dry-run ready",
    },
  },
  zh: {
    title: "写入器 dry-run 验证器",
    badge: "无写入模式",
    body: "用这个页面在任何 service-role 写入、AI 调用、Stripe 调用或报告解锁之前，先验证后端写入请求。",
    warning:
      "这个端点被故意设计为安全模式：只校验请求形状与闸门。即使 dry-run 通过，也会返回 wouldWrite=false。",
    selectContract: "契约",
    requestBody: "Dry-run 请求 JSON",
    run: "运行 dry-run",
    running: "校验中...",
    resetSample: "重置示例",
    result: "结果",
    noResult: "运行一次 dry-run 后查看闸门状态。",
    safeMode: "安全模式",
    wouldWrite: "是否写入",
    status: "状态",
    targetTables: "目标表",
    requiredInputs: "必要输入",
    acceptedInputs: "已接受输入",
    missingInputs: "缺失输入",
    disabledFlags: "禁用开关",
    issues: "问题",
    none: "无",
    parseError: "请求 JSON 无效。",
    openContracts: "打开写入契约",
    openStatus: "打开写入状态",
    openGuardrail: "打开护栏",
    openAdapter: "打开适配器",
    openRollback: "打开回滚模型",
    openRollout: "打开发布清单",
    openPayloads: "打开 Payload",
    openDashboard: "返回工作台",
    statusLabels: {
      invalid_request: "请求无效",
      blocked_by_gate: "被闸门阻断",
      dry_run_ready: "Dry-run 就绪",
    },
  },
} as const;

function getStatusTone(status?: SystemWriterDryRunStatus) {
  if (status === "dry_run_ready") {
    return "ready";
  }

  if (status === "invalid_request" || status === "blocked_by_gate") {
    return "blocked";
  }

  return "planned";
}

function InlineList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return <span className="text-slate-500">{empty}</span>;
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

export function WriterDryRunClientPage({
  catalog,
}: WriterDryRunClientPageProps) {
  const { locale } = useLanguage();
  const copy = dryRunCopy[locale];
  const specsById = useMemo(() => {
    return catalog.specs.reduce(
      (acc, spec) => {
        acc[spec.contractId] = spec;
        return acc;
      },
      {} as Record<SystemWriterContractId, (typeof catalog.specs)[number]>,
    );
  }, [catalog]);
  const firstContractId =
    catalog.specs[0]?.contractId ?? "agent_profile_generation";
  const [selectedContractId, setSelectedContractId] =
    useState<SystemWriterContractId>(firstContractId);
  const [requestJson, setRequestJson] = useState(() =>
    JSON.stringify(specsById[firstContractId].sampleRequest, null, 2),
  );
  const [result, setResult] = useState<SystemWriterDryRunResult | null>(null);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const selectedSpec = specsById[selectedContractId];

  function resetSample(contractId = selectedContractId) {
    setRequestJson(JSON.stringify(specsById[contractId].sampleRequest, null, 2));
    setResult(null);
    setError("");
  }

  function handleContractChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextContractId = event.target.value as SystemWriterContractId;
    setSelectedContractId(nextContractId);
    resetSample(nextContractId);
  }

  async function runDryRun() {
    setIsRunning(true);
    setError("");
    setResult(null);

    try {
      const parsed = JSON.parse(requestJson) as unknown;
      const response = await fetch("/api/system-writers/dry-run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });
      const payload = (await response.json()) as SystemWriterDryRunResult;
      setResult(payload);
    } catch {
      setError(copy.parseError);
    } finally {
      setIsRunning(false);
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
        {copy.warning}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <label className="block text-sm font-semibold text-slate-950">
            {copy.selectContract}
          </label>
          <select
            value={selectedContractId}
            onChange={handleContractChange}
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
          >
            {catalog.specs.map((spec) => (
              <option key={spec.contractId} value={spec.contractId}>
                {contractLabels[locale][spec.contractId]}
              </option>
            ))}
          </select>

          <div className="mt-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <label
                htmlFor="dry-run-json"
                className="text-sm font-semibold text-slate-950"
              >
                {copy.requestBody}
              </label>
              <button
                type="button"
                onClick={() => resetSample()}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {copy.resetSample}
              </button>
            </div>
            <textarea
              id="dry-run-json"
              value={requestJson}
              onChange={(event) => setRequestJson(event.target.value)}
              className="min-h-[420px] w-full rounded-md border border-slate-300 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-50"
              spellCheck={false}
            />
          </div>

          {error ? (
            <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={runDryRun}
              disabled={isRunning}
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isRunning ? copy.running : copy.run}
            </button>
            <Link
              href="/server-writers/contracts"
              className="rounded-md border border-lime-300 bg-lime-50 px-4 py-2 text-sm font-semibold text-lime-800 transition hover:bg-lime-100"
            >
              {copy.openContracts}
            </Link>
            <Link
              href="/server-writers"
              className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              {copy.openStatus}
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
              href="/server-writers/payloads"
              className="rounded-md border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
            >
              {copy.openPayloads}
            </Link>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.result}
            </h2>
            {result ? (
              <div className="mt-4 space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={getStatusTone(result.status)}>
                    {copy.status}: {copy.statusLabels[result.status]}
                  </StatusPill>
                  <StatusPill tone="ready">
                    {copy.safeMode}: {result.safeMode ? "true" : "false"}
                  </StatusPill>
                  <StatusPill tone={result.wouldWrite ? "blocked" : "ready"}>
                    {copy.wouldWrite}: {result.wouldWrite ? "true" : "false"}
                  </StatusPill>
                </div>
                <p className="leading-6 text-slate-600">{result.summary}</p>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    {copy.targetTables}
                  </h3>
                  <InlineList items={result.targetTables} empty={copy.none} />
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    {copy.requiredInputs}
                  </h3>
                  <InlineList
                    items={selectedSpec.requiredInputKeys}
                    empty={copy.none}
                  />
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    {copy.acceptedInputs}
                  </h3>
                  <InlineList
                    items={result.acceptedInputKeys}
                    empty={copy.none}
                  />
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    {copy.missingInputs}
                  </h3>
                  <InlineList
                    items={result.missingInputKeys}
                    empty={copy.none}
                  />
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    {copy.disabledFlags}
                  </h3>
                  <InlineList items={result.disabledFlags} empty={copy.none} />
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    {copy.issues}
                  </h3>
                  {result.issues.length > 0 ? (
                    <ul className="space-y-2">
                      {result.issues.map((issue) => (
                        <li
                          key={`${issue.code}-${issue.field ?? issue.message}`}
                          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900"
                        >
                          <span className="font-semibold">{issue.code}</span>
                          {issue.field ? (
                            <span className="font-mono"> / {issue.field}</span>
                          ) : null}
                          <p className="mt-1 leading-6">{issue.message}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-slate-500">{copy.none}</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {copy.noResult}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {contractLabels[locale][selectedContractId]}
            </h2>
            <p className="mt-2 font-mono text-xs text-slate-500">
              {selectedContractId}
            </p>
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                {copy.requiredInputs}
              </h3>
              <InlineList
                items={selectedSpec.requiredInputKeys}
                empty={copy.none}
              />
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard"
                className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {copy.openDashboard}
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
