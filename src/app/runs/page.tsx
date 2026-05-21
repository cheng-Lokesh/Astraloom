"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import { loadAgentEcologyDraft } from "@/lib/agents/storage";
import {
  blockSimulationRunDraft,
  buildSimulationRunDraft,
  queueSimulationRunDraft,
} from "@/lib/runs/build";
import {
  clearSimulationRunDraft,
  loadSimulationRunDraft,
  saveSimulationRunDraft,
} from "@/lib/runs/storage";
import { loadSeedContextDraft } from "@/lib/seed-context/storage";
import type { AgentEcologyDraft } from "@/types/agent-profile";
import type { SeedContextDraft } from "@/types/seed-context";
import type {
  SimulationGateStatus,
  SimulationRunDraft,
  SimulationRunStatus,
} from "@/types/simulation-run";

type RunsPageContext = {
  seedContext: SeedContextDraft | null;
  agentEcology: AgentEcologyDraft | null;
  savedRun: SimulationRunDraft | null;
};

const runsCopy = {
  en: {
    title: "Simulation run shell",
    status: "Generation disabled",
    body: "This page creates the run container and empty event ticks only. It does not call a model, charge money, or generate a report.",
    noSeedTitle: "Seed context required",
    noSeedBody: "Create and save a seed context before creating a run shell.",
    noAgentsTitle: "Saved agent ecology required",
    noAgentsBody:
      "Save the agent ecology shell first. The run shell needs stable agent IDs before it can be queued.",
    openIntake: "Open seed intake",
    openAgents: "Open agent ecology",
    openSafety: "Open SafetyVerifier",
    queue: "Queue run shell",
    block: "Mark blocked by gates",
    rebuild: "Rebuild run shell",
    reset: "Clear saved run",
    disabledGenerate: "Start generation disabled",
    queued: "Run shell queued locally. Generation remains disabled.",
    blocked: "Run shell marked blocked until gates are ready.",
    rebuilt: "Run shell rebuilt from the saved agent ecology.",
    resetDone: "Saved run shell cleared.",
    statusLabels: {
      not_ready: "Not ready",
      queued: "Queued shell",
      blocked: "Blocked",
    },
    gateLabels: {
      agents: "Agent ecology",
      cost_gate: "Cost gate",
      prompt_pack: "Prompt pack",
      safety_checks: "Safety checks",
    },
    gateStatusLabels: {
      ready: "Ready",
      missing: "Missing",
      blocked: "Blocked",
    },
    summaryTitle: "Run summary",
    seedQuestion: "Seed question",
    agents: "Agents",
    events: "Event ticks",
    model: "Model",
    prompt: "Prompt",
    cost: "Cost",
    eventSkeleton: "Empty event skeleton",
    tick: "Tick",
    emptySlot: "Empty slot",
    eventNote:
      "These are placeholders for future generated events. No claim, prediction, or advice has been produced.",
    nextStep: "Next build step",
    nextStepBody:
      "Build the SafetyVerifier shell so generated content can later be checked before reports are shown.",
  },
  zh: {
    title: "Simulation Run 外壳",
    status: "生成已关闭",
    body: "这个页面只创建推演容器和空事件 tick。不调用模型、不扣费、不生成报告。",
    noSeedTitle: "需要先保存种子上下文",
    noSeedBody: "请先创建并保存种子上下文，然后再创建 run 外壳。",
    noAgentsTitle: "需要先保存 Agent 生态",
    noAgentsBody:
      "请先保存 Agent 生态外壳。Run 外壳需要稳定的 Agent ID，才能进入排队状态。",
    openIntake: "打开推演入口",
    openAgents: "打开 Agent 生态",
    openSafety: "打开 SafetyVerifier",
    queue: "排队 run 外壳",
    block: "标记为被闸门阻断",
    rebuild: "重建 run 外壳",
    reset: "清空已保存 run",
    disabledGenerate: "开始生成已禁用",
    queued: "Run 外壳已本地排队。真实生成仍然关闭。",
    blocked: "Run 外壳已标记为被闸门阻断。",
    rebuilt: "已根据保存的 Agent 生态重建 run 外壳。",
    resetDone: "已清空保存的 run 外壳。",
    statusLabels: {
      not_ready: "未就绪",
      queued: "外壳已排队",
      blocked: "已阻断",
    },
    gateLabels: {
      agents: "Agent 生态",
      cost_gate: "成本闸门",
      prompt_pack: "提示词包",
      safety_checks: "安全检查",
    },
    gateStatusLabels: {
      ready: "就绪",
      missing: "缺失",
      blocked: "阻断",
    },
    summaryTitle: "Run 摘要",
    seedQuestion: "种子问题",
    agents: "Agent 数量",
    events: "事件 tick",
    model: "模型",
    prompt: "提示词",
    cost: "成本",
    eventSkeleton: "空事件骨架",
    tick: "Tick",
    emptySlot: "空槽位",
    eventNote: "这些只是未来事件的占位。当前没有产生任何结论、预测或建议。",
    nextStep: "下一步构建",
    nextStepBody:
      "构建 SafetyVerifier 外壳，让未来生成内容在展示报告前先经过安全检查。",
  },
} as const;

function loadRunsPageContext(): RunsPageContext {
  const seedContext = loadSeedContextDraft();
  if (!seedContext) {
    return {
      seedContext: null,
      agentEcology: null,
      savedRun: null,
    };
  }

  const agentEcology = loadAgentEcologyDraft(seedContext.id);

  return {
    seedContext,
    agentEcology,
    savedRun: loadSimulationRunDraft(seedContext.id),
  };
}

function getStatusTone(status: SimulationRunStatus) {
  if (status === "queued") {
    return "ready";
  }

  if (status === "blocked") {
    return "blocked";
  }

  return "planned";
}

function getGateTone(status: SimulationGateStatus) {
  if (status === "ready") {
    return "ready";
  }

  if (status === "blocked") {
    return "blocked";
  }

  return "planned";
}

export default function RunsPage() {
  const { locale } = useLanguage();
  const copy = runsCopy[locale];
  const [context] = useState(loadRunsPageContext);
  const [run, setRun] = useState<SimulationRunDraft | null>(() => {
    if (!context.seedContext || !context.agentEcology) {
      return null;
    }

    return (
      context.savedRun ??
      buildSimulationRunDraft(context.seedContext, context.agentEcology)
    );
  });
  const [message, setMessage] = useState("");

  function persistRun(nextRun: SimulationRunDraft, nextMessage: string) {
    saveSimulationRunDraft(nextRun);
    setRun(nextRun);
    setMessage(nextMessage);
  }

  function queueRun() {
    if (!run) {
      return;
    }

    persistRun(queueSimulationRunDraft(run), copy.queued);
  }

  function blockRun() {
    if (!run) {
      return;
    }

    persistRun(blockSimulationRunDraft(run), copy.blocked);
  }

  function rebuildRun() {
    if (!context.seedContext || !context.agentEcology) {
      return;
    }

    persistRun(
      buildSimulationRunDraft(context.seedContext, context.agentEcology),
      copy.rebuilt,
    );
  }

  function resetRun() {
    if (!context.seedContext || !context.agentEcology) {
      return;
    }

    clearSimulationRunDraft(context.seedContext.id);
    setRun(buildSimulationRunDraft(context.seedContext, context.agentEcology));
    setMessage(copy.resetDone);
  }

  if (!context.seedContext) {
    return (
      <AppShell>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <StatusPill tone="blocked">{copy.status}</StatusPill>
          <h1 className="mt-4 text-2xl font-semibold text-slate-950">
            {copy.noSeedTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {copy.noSeedBody}
          </p>
          <Link
            href="/intake"
            className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {copy.openIntake}
          </Link>
        </section>
      </AppShell>
    );
  }

  if (!context.agentEcology || context.agentEcology.agents.length === 0) {
    return (
      <AppShell>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <StatusPill tone="blocked">{copy.status}</StatusPill>
          <h1 className="mt-4 text-2xl font-semibold text-slate-950">
            {copy.noAgentsTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {copy.noAgentsBody}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/agents"
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {copy.openAgents}
            </Link>
            <Link
              href="/intake"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copy.openIntake}
            </Link>
          </div>
        </section>
      </AppShell>
    );
  }

  if (!run) {
    return null;
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
        <StatusPill tone={getStatusTone(run.status)}>
          {copy.statusLabels[run.status]}
        </StatusPill>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={queueRun}
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {copy.queue}
              </button>
              <button
                type="button"
                onClick={blockRun}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {copy.block}
              </button>
              <button
                type="button"
                onClick={rebuildRun}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {copy.rebuild}
              </button>
              <button
                type="button"
                onClick={resetRun}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {copy.reset}
              </button>
              <button
                type="button"
                disabled
                className="rounded-md bg-slate-300 px-4 py-2 text-sm font-semibold text-white"
              >
                {copy.disabledGenerate}
              </button>
            </div>
            {message ? (
              <p className="mt-4 text-sm font-medium text-slate-600">
                {message}
              </p>
            ) : null}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {run.gates.map((gate) => (
              <article
                key={gate.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-slate-950">
                    {copy.gateLabels[gate.id]}
                  </h2>
                  <StatusPill tone={getGateTone(gate.status)}>
                    {copy.gateStatusLabels[gate.status]}
                  </StatusPill>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {gate.detail}
                </p>
              </article>
            ))}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.eventSkeleton}
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {run.events.map((event) => (
                <article
                  key={event.id}
                  className="rounded-md border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">
                      {copy.tick} {event.tick}
                    </p>
                    <StatusPill tone="planned">{copy.emptySlot}</StatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {copy.eventNote}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.summaryTitle}
            </h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-slate-900">
                  {copy.seedQuestion}
                </dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {context.seedContext.questionText}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-md bg-emerald-50 p-3">
                  <dt className="text-xs font-semibold text-emerald-700">
                    {copy.agents}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-emerald-900">
                    {run.agentIds.length}
                  </dd>
                </div>
                <div className="rounded-md bg-sky-50 p-3">
                  <dt className="text-xs font-semibold text-sky-700">
                    {copy.events}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-sky-900">
                    {run.events.length}
                  </dd>
                </div>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">{copy.model}</dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {run.modelVersion}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">{copy.prompt}</dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {run.promptVersion}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">{copy.cost}</dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  ${Number(run.costCents / 100).toFixed(2)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.nextStep}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy.nextStepBody}
            </p>
            <Link
              href="/safety"
              className="mt-4 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {copy.openSafety}
            </Link>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
