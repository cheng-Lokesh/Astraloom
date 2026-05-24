"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { loadAgentEcologyDraft } from "@/lib/agents/storage";
import { loadRelationGraphDraft } from "@/lib/relations/storage";
import {
  buildSimulationRunDraft,
  queueSimulationRunDraft,
} from "@/lib/runs/build";
import {
  clearSimulationRunDraft,
  loadSimulationRunDraft,
  saveSimulationRunDraft,
} from "@/lib/runs/storage";
import { loadSeedContextDraft } from "@/lib/seed-context/storage";
import type { SimulationRunDraft } from "@/types/simulation-run";

function statusTone(status: string) {
  if (status === "ready" || status === "queued") return "ready";
  if (status === "blocked" || status === "missing") return "blocked";
  return "planned";
}

function buildDraftFromLocalState() {
  const seed = loadSeedContextDraft();
  if (!seed) return null;

  const ecology = loadAgentEcologyDraft(seed.id);
  const graph = loadRelationGraphDraft(seed.id);
  if (!ecology || !graph) return null;

  return buildSimulationRunDraft(seed, ecology, graph.edges);
}

export default function RunsPage() {
  const [seedContext] = useState(() => loadSeedContextDraft());
  const [agentEcology] = useState(() => {
    const seed = loadSeedContextDraft();
    return seed ? loadAgentEcologyDraft(seed.id) : null;
  });
  const [relationGraph] = useState(() => {
    const seed = loadSeedContextDraft();
    return seed ? loadRelationGraphDraft(seed.id) : null;
  });
  const [run, setRun] = useState<SimulationRunDraft | null>(() => {
    const seed = loadSeedContextDraft();
    if (!seed) return null;
    return loadSimulationRunDraft(seed.id) ?? buildDraftFromLocalState();
  });
  const [message, setMessage] = useState("");

  if (!seedContext || !agentEcology) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl rounded-lg border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="blocked">需要 Agent Profile</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            先保存可行动的 Agent 草稿。
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            Simulation Tick 只能冻结已经确认的 Agent Profile，不能从输入文本直接跳到报告。
          </p>
          <Link
            href="/app/new/agents"
            className="mt-6 inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white"
          >
            打开 Agent 页面
          </Link>
        </section>
      </AppShell>
    );
  }

  if (!relationGraph || !run) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl rounded-lg border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="blocked">需要 Relation Graph</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            先保存只读关系图谱，再运行 tick。
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            本地 tick engine 会冻结 Relation Edge，写入 Event Log 草稿，并保留 before/after 权重快照。
          </p>
          <Link
            href="/app/new/graph"
            className="mt-6 inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white"
          >
            打开关系图谱
          </Link>
        </section>
      </AppShell>
    );
  }

  function persist(nextRun: SimulationRunDraft, nextMessage: string) {
    saveSimulationRunDraft(nextRun);
    setRun(nextRun);
    setMessage(nextMessage);
  }

  function queueRun() {
    if (!run) return;
    persist(
      queueSimulationRunDraft(run),
      "本地 tick 和 Event Log 草稿已保存。没有调用 LLM，也没有生成报告结论。",
    );
  }

  function rebuild() {
    if (!seedContext || !agentEcology || !relationGraph) return;
    persist(
      queueSimulationRunDraft(
        buildSimulationRunDraft(seedContext, agentEcology, relationGraph.edges),
      ),
      "已重新冻结 Agent/Relation Edge，并重建 tick 与 Event Log 草稿。",
    );
  }

  function reset() {
    if (!seedContext || !agentEcology || !relationGraph) return;
    clearSimulationRunDraft(seedContext.id);
    setRun(buildSimulationRunDraft(seedContext, agentEcology, relationGraph.edges));
    setMessage("已清空本地 simulation run 草稿。");
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusPill tone="ready">Simulation Tick v0</StatusPill>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            冻结关系图谱，写入本地 Event Log。
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            这一页只做本地确定性 tick：冻结 Agent 和 Relation Edge，生成 before/after 快照与 evidence event。
            它不会创建 Claim，不会生成报告，也不会把低置信信号包装成确定结论。
          </p>
        </div>
        <StatusPill tone={statusTone(run.status)}>
          {run.status === "queued" ? "Event Log ready" : "Draft only"}
        </StatusPill>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-6">
          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={queueRun}
                className="rounded-md bg-[#11150f] px-4 py-2 text-sm font-semibold text-white"
              >
                保存 tick 与 Event Log
              </button>
              <button
                type="button"
                onClick={rebuild}
                className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
              >
                重新冻结并运行
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
              >
                清空本地草稿
              </button>
            </div>
            {message ? (
              <p className="mt-4 text-sm leading-6 text-[#62695d]">{message}</p>
            ) : null}
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <h2 className="text-base font-semibold text-[#11150f]">
              Tick queue
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {run.ticks.map((tick) => (
                <article
                  key={tick.id}
                  className="rounded-md border border-black/8 bg-[#f7f8f4] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#11150f]">
                      Tick {tick.tickIndex}
                    </p>
                    <StatusPill tone="planned">{tick.timeLabel}</StatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#62695d]">
                    {tick.summary}
                  </p>
                  <code className="mt-3 block break-all text-xs text-[#7d8578]">
                    {tick.traceId}
                  </code>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <h2 className="text-base font-semibold text-[#11150f]">
              Event Log draft
            </h2>
            <div className="mt-4 space-y-3">
              {run.events.map((event) => (
                <article
                  key={event.id}
                  className="rounded-md border border-black/8 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#11150f]">
                        {event.eventType} · {event.timeLabel}
                      </p>
                      <p className="mt-1 text-xs text-[#7d8578]">
                        edges: {event.relationEdgeIds.join(", ") || "none"}
                      </p>
                    </div>
                    <StatusPill tone={event.status === "preview" ? "ready" : "planned"}>
                      {event.confidence}%
                    </StatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#62695d]">
                    {event.summary}
                  </p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <pre className="overflow-auto rounded bg-[#f7f8f4] p-3 text-xs text-[#62695d]">
                      {JSON.stringify(event.beforeState.weights, null, 2)}
                    </pre>
                    <pre className="overflow-auto rounded bg-[#f7f8f4] p-3 text-xs text-[#62695d]">
                      {JSON.stringify(event.afterState.weights, null, 2)}
                    </pre>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>

        <aside className="h-fit rounded-lg border border-black/8 bg-[#11150f] p-6 text-white">
          <h2 className="text-sm font-semibold text-[#b7e6c6]">
            Frozen run ledger
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric label="Agents" value={run.frozenAgentProfileIds.length} />
            <Metric label="Edges" value={run.frozenRelationEdgeIds.length} />
            <Metric label="Ticks" value={run.tickCount} />
            <Metric label="Events" value={run.events.length} />
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-white">Question</dt>
              <dd className="mt-1 leading-6 text-white/62">
                {seedContext.questionText}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">Trace</dt>
              <dd className="mt-1 break-all font-mono text-xs leading-5 text-white/50">
                {run.traceId}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">Cost</dt>
              <dd className="mt-1 leading-6 text-white/62">
                0 cents, local deterministic preview
              </dd>
            </div>
          </dl>
          <div className="mt-5 space-y-2">
            {run.gates.map((gate) => (
              <div
                key={gate.id}
                className="rounded-md border border-white/10 bg-white/[0.06] p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-white">
                    {gate.id}
                  </span>
                  <StatusPill tone={statusTone(gate.status)}>
                    {gate.status}
                  </StatusPill>
                </div>
                <p className="mt-2 text-xs leading-5 text-white/50">
                  {gate.detail}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/safety"
            className="mt-5 inline-flex w-full justify-center rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white"
          >
            Continue to safety gate
          </Link>
        </aside>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
      <div className="text-xs text-white/48">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
