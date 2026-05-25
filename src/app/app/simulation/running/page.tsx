"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import { StatusPill } from "@/components/status-pill";
import { applyFeedbackToNextRun } from "@/lib/calibration/apply-feedback-to-next-run";
import { loadCalibrationProfile } from "@/lib/calibration/calibration-engine";
import { getRepositories } from "@/lib/repositories/repository-provider";
import {
  blockSimulationRunDraft,
  buildSimulationRunDraft,
  queueSimulationRunDraft,
} from "@/lib/runs/build";
import type { SafetyDecision } from "@/lib/safety/safety-types";
import { verifySafety } from "@/lib/safety/safety-verifier";
import type { SafetySnapshot } from "@/lib/simulation/simulation-types";
import type { SimulationRunDraft } from "@/types/simulation-run";

function statusTone(status: string) {
  if (status === "ready" || status === "queued") return "ready";
  if (status === "blocked" || status === "missing") return "blocked";
  return "planned";
}

function buildDraftFromLocalState(repos: ReturnType<typeof getRepositories>) {
  const seedResult = repos.seedContexts.load();
  const seed = seedResult.ok ? seedResult.data : null;
  if (!seed) return null;

  const ecologyResult = repos.agentProfiles.load(seed.id);
  const graphResult = repos.relationGraphs.load(seed.id);
  const ecology = ecologyResult.ok ? ecologyResult.data : null;
  const graph = graphResult.ok ? graphResult.data : null;
  if (!ecology || !graph) return null;

  const calibrated = applyFeedbackToNextRun({
    agentEcology: ecology,
    relationEdges: graph.edges,
    calibrationProfile: loadCalibrationProfile(seed.id),
  });

  return buildSimulationRunDraft(
    seed,
    calibrated.agentEcology,
    calibrated.relationEdges,
  );
}

function snapshotFromDecision(decision: SafetyDecision): SafetySnapshot {
  return {
    safetyLevel: decision.safetyLevel,
    flags: decision.flags,
    allowedActions: decision.allowedActions,
    blockedActions: decision.blockedActions,
    reportRestrictions: decision.reportRestrictions,
  };
}

export default function RunsPage() {
  const [repos] = useState(() => getRepositories());
  const [seedContext] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [agentEcology] = useState(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.agentProfiles.load(seed.id);
    return result.ok ? result.data : null;
  });
  const [relationGraph] = useState(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.relationGraphs.load(seed.id);
    return result.ok ? result.data : null;
  });
  const [run, setRun] = useState<SimulationRunDraft | null>(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.simulations.load(seed.id);
    return (result.ok ? result.data : null) ?? buildDraftFromLocalState(repos);
  });
  const [message, setMessage] = useState("");
  const [safetyDecision, setSafetyDecision] = useState<SafetyDecision | null>(
    () =>
      seedContext
        ? verifySafety({
            seedContext,
            agents: agentEcology?.agents,
            relationEdges: relationGraph?.edges,
            simulationRun: run,
          })
        : null,
  );

  if (!seedContext || !agentEcology) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl rounded-lg border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="blocked">Needs Agent Profiles</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            Save usable Agent Profiles before running the simulation.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            Simulation runs can only freeze confirmed Agent Profiles. The flow
            cannot jump directly from intake text to a report.
          </p>
          <Link
            href="/app/new/agents"
            className="mt-6 inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white"
          >
            Open Agent Profiles
          </Link>
        </section>
      </AppShell>
    );
  }

  if (!relationGraph || !run) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl rounded-lg border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="blocked">Needs Relation Graph</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            Save the read-only relation graph before running ticks.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            The local tick engine freezes Relation Edges, writes Event Logs,
            and keeps before/after snapshots for evidence review.
          </p>
          <Link
            href="/app/new/graph"
            className="mt-6 inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white"
          >
            Open Relation Graph
          </Link>
        </section>
      </AppShell>
    );
  }

  if (safetyDecision?.safetyLevel === "blocked") {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl space-y-5">
          <SafetyDowngradeNotice
            decision={safetyDecision}
            title="Simulation stopped by SafetyVerifier"
          />
          <Link
            href="/app/new/intake"
            className="inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white"
          >
            Back to situation setup
          </Link>
        </section>
      </AppShell>
    );
  }

  function persist(nextRun: SimulationRunDraft, nextMessage: string) {
    const result = repos.simulations.save(nextRun);
    if (!result.ok) {
      setMessage(`Save failed: ${result.errorCode}`);
      return;
    }
    setRun(nextRun);
    setMessage(nextMessage);
  }

  function runSafetyGate(nextRun: SimulationRunDraft) {
    if (!seedContext) return null;
    const decision = verifySafety({
      seedContext,
      agents: agentEcology?.agents,
      relationEdges: relationGraph?.edges,
      simulationRun: nextRun,
    });
    setSafetyDecision(decision);

    if (decision.safetyLevel === "blocked") {
      persist(blockSimulationRunDraft(nextRun), decision.userMessage);
      return null;
    }

    return decision;
  }

  function queueRun() {
    if (!run || !seedContext || !agentEcology || !relationGraph) return;
    const decision = runSafetyGate(run);
    if (!decision) return;
    const calibrated = applyFeedbackToNextRun({
      agentEcology,
      relationEdges: relationGraph.edges,
      calibrationProfile: loadCalibrationProfile(seedContext.id),
    });
    const nextRun = buildSimulationRunDraft(
      seedContext,
      calibrated.agentEcology,
      calibrated.relationEdges,
      run.status,
      snapshotFromDecision(decision),
    );
    persist(
      queueSimulationRunDraft(nextRun),
      "Simulation Engine v1 run saved locally. It uses deterministic rules, not LLM conclusions.",
    );
  }

  function rebuild() {
    if (!seedContext || !agentEcology || !relationGraph) return;
    const calibrated = applyFeedbackToNextRun({
      agentEcology,
      relationEdges: relationGraph.edges,
      calibrationProfile: loadCalibrationProfile(seedContext.id),
    });
    const nextRun = buildSimulationRunDraft(
      seedContext,
      calibrated.agentEcology,
      calibrated.relationEdges,
    );
    const decision = runSafetyGate(nextRun);
    if (!decision) return;
    const safeRun = buildSimulationRunDraft(
      seedContext,
      calibrated.agentEcology,
      calibrated.relationEdges,
      nextRun.status,
      snapshotFromDecision(decision),
    );
    persist(
      queueSimulationRunDraft(safeRun),
      "Agent and Relation Edge snapshots were frozen again, then ticks and Event Logs were rebuilt.",
    );
  }

  function reset() {
    if (!seedContext || !agentEcology || !relationGraph) return;
    repos.simulations.clearDraft(seedContext.id);
    const calibrated = applyFeedbackToNextRun({
      agentEcology,
      relationEdges: relationGraph.edges,
      calibrationProfile: loadCalibrationProfile(seedContext.id),
    });
    setRun(
      buildSimulationRunDraft(
        seedContext,
        calibrated.agentEcology,
        calibrated.relationEdges,
      ),
    );
    setMessage("Local simulation run draft cleared.");
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusPill tone="ready">Simulation run</StatusPill>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            Freeze the relation graph and write local Event Logs.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            This page runs deterministic local ticks only: it freezes Agents
            and Relation Edges, then creates before/after evidence events. It
            does not create paid claims, generate a final report, or turn
            low-confidence signals into certain predictions.
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
                Save ticks and Event Logs
              </button>
              <button
                type="button"
                onClick={rebuild}
                className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
              >
                Rebuild frozen run
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
              >
                Clear local draft
              </button>
            </div>
            {message ? (
              <p className="mt-4 text-sm leading-6 text-[#62695d]">{message}</p>
            ) : null}
            {safetyDecision && safetyDecision.safetyLevel !== "safe" ? (
              <div className="mt-5">
                <SafetyDowngradeNotice
                  decision={safetyDecision}
                  title="Safety check before simulation"
                />
              </div>
            ) : null}
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <h2 className="text-base font-semibold text-[#11150f]">
              Scenario steps
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
              Evidence timeline
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
                        {event.eventType} 路 {event.timeLabel}
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
            Run summary
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
            href="/app/simulation/result"
            className="mt-5 inline-flex w-full justify-center rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white"
          >
            Continue to result
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

