"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import { StatusPill } from "@/components/status-pill";
import { buildClaimLedgerDraft } from "@/lib/claims/build";
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
import type {
  SimulationBranchId,
  SimulationRunDraft,
} from "@/types/simulation-run";

const simulationStages = [
  {
    id: "freeze_graph",
    label: "Freeze graph",
    detail:
      "Lock the current Agent Profiles and read-only Relation Edges as the run snapshot.",
  },
  {
    id: "build_tick_queue",
    label: "Build tick queue",
    detail:
      "Create deterministic tick slots for baseline, cautious_self, and decisive_self.",
  },
  {
    id: "run_agent_interactions",
    label: "Run agent interactions",
    detail:
      "Apply branch policies to bounded Agent models. No user choices are requested mid-run.",
  },
  {
    id: "update_relation_edges",
    label: "Update relation edges",
    detail:
      "Apply rule-owned before/after deltas to graph snapshots without exposing edge controls.",
  },
  {
    id: "write_event_log",
    label: "Write Event Log",
    detail:
      "Persist local Event Logs with agents, edges, causes, deltas, and evidence refs.",
  },
  {
    id: "build_claims",
    label: "Build Claims",
    detail:
      "Build deterministic Claims only from saved Event Logs and evidence_event_ids.",
  },
  {
    id: "prepare_report",
    label: "Prepare report",
    detail:
      "Prepare the Result Sandbox shell. Report depth stays downstream of the same Claims.",
  },
] as const;

const branchNames: SimulationBranchId[] = [
  "baseline",
  "cautious_self",
  "decisive_self",
];

function statusTone(status: string) {
  if (status === "ready" || status === "queued") return "ready";
  if (status === "blocked" || status === "missing" || status === "failed") {
    return "blocked";
  }
  return "planned";
}

function branchLabel(branchId: SimulationBranchId) {
  const labels: Record<SimulationBranchId, string> = {
    baseline: "baseline",
    cautious_self: "cautious_self",
    decisive_self: "decisive_self",
  };
  return labels[branchId];
}

function eventTypeLabel(value: string) {
  return value.replaceAll("_", " ");
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
  if (!graph.graphLocked) return null;

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
  const router = useRouter();
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
  const [processState, setProcessState] = useState<
    "idle" | "running" | "complete" | "failed"
  >("idle");
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [processRun, setProcessRun] = useState<SimulationRunDraft | null>(null);
  const [processError, setProcessError] = useState("");

  const visibleRun = processRun ?? run;
  const generatedEventCount = visibleRun?.events.length ?? 0;
  const claimPreviewCount = useMemo(
    () =>
      visibleRun
        ? buildClaimLedgerDraft(visibleRun.seedContextId, visibleRun).claims.length
        : 0,
    [visibleRun],
  );
  const branchEventCounts = useMemo(() => {
    const counts = new Map<SimulationBranchId, number>();
    branchNames.forEach((branchId) => counts.set(branchId, 0));
    visibleRun?.events.forEach((event) => {
      const branchId = event.branchId ?? "baseline";
      counts.set(branchId, (counts.get(branchId) ?? 0) + 1);
    });
    return counts;
  }, [visibleRun]);

  useEffect(() => {
    if (processState !== "complete") return;

      const routeTimer = window.setTimeout(() => {
        router.push("/app/simulation/result");
      }, 900);
      return () => window.clearTimeout(routeTimer);
  }, [processState, router]);

  useEffect(() => {
    if (processState !== "running" || !processRun || !seedContext) return;

    const timer = window.setTimeout(() => {
      const stage = simulationStages[activeStageIndex];

      if (stage.id === "write_event_log") {
        const result = repos.simulations.save(processRun);
        if (!result.ok) {
          setProcessState("failed");
          setProcessError(`Could not save Event Log: ${result.errorCode}`);
          setMessage(`Save failed: ${result.errorCode}`);
          return;
        }
      }

      if (stage.id === "build_claims") {
        const eventLogSaved = repos.simulations.load(seedContext.id);
        const savedRun = eventLogSaved.ok ? eventLogSaved.data : null;
        if (!savedRun || savedRun.events.length === 0) {
          setProcessState("failed");
          setProcessError(
            "Claims were not built because the Event Log is missing. Re-run the simulation after locking the graph.",
          );
          return;
        }

        const ledger = buildClaimLedgerDraft(seedContext.id, savedRun);
        const result = repos.reports.save(ledger);
        if (!result.ok) {
          setProcessState("failed");
          setProcessError(`Could not save Claims: ${result.errorCode}`);
          setMessage(`Save failed: ${result.errorCode}`);
          return;
        }
      }

      if (activeStageIndex === simulationStages.length - 1) {
        setProcessState("complete");
        setMessage("Simulation complete. Opening the Result Sandbox.");
        return;
      }

      setActiveStageIndex((index) => index + 1);
    }, activeStageIndex < 4 ? 620 : 760);

    return () => window.clearTimeout(timer);
  }, [
    activeStageIndex,
    processRun,
    processState,
    repos,
    router,
    seedContext,
  ]);

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
          <NotReadyPanel
            title="Concrete fixes"
            items={[
              "Confirm Key People so candidates become usable actors.",
              "Generate Agent Profiles for the user core, parallel selves, and confirmed NPCs.",
              "Return here after the Agent Profile surface shows a saved ecology.",
            ]}
          />
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

  if (relationGraph && !relationGraph.graphLocked) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl rounded-lg border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="blocked">Graph lock required</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            Lock the scenario graph before running simulation ticks.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            The local tick engine must freeze a locked Relation Graph before it writes Event Logs.
            Return to the graph, review the read-only edges, and lock the snapshot.
          </p>
          <NotReadyPanel
            title="Concrete fixes"
            items={[
              "Review the read-only Relation Graph for missing actors or edges.",
              "Use regenerate from upstream facts if Agent Profiles changed.",
              "Lock the graph snapshot before opening the simulation process.",
            ]}
          />
          <Link
            href="/app/new/graph"
            className="mt-6 inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white"
          >
            Lock Relation Graph
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
            Save and lock the read-only relation graph before running ticks.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            The local tick engine freezes Relation Edges, writes Event Logs,
            and keeps before/after snapshots for evidence review.
          </p>
          <NotReadyPanel
            title="Concrete fixes"
            items={[
              "Open Relation Graph and generate edges from the current Agent Profiles.",
              "Confirm the graph is not empty.",
              "Lock the graph so the simulation can freeze a stable snapshot.",
            ]}
          />
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
    setProcessError("");
    if (!relationGraph.graphLocked) {
      setMessage("Lock the Relation Graph before running simulation ticks.");
      return;
    }
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
    const queuedRun = queueSimulationRunDraft(nextRun);
    if (queuedRun.events.length === 0) {
      setProcessState("failed");
      setProcessError(
        "No Event Logs were generated. Confirm at least one NPC and lock a Relation Graph with at least one edge.",
      );
      return;
    }
    setRun(queuedRun);
    setProcessRun(queuedRun);
    setActiveStageIndex(0);
    setProcessState("running");
    setMessage(
      "Simulation Engine v1 is running deterministic stages. Event Logs will be saved before Claims are built.",
    );
  }

  function rebuild() {
    if (!seedContext || !agentEcology || !relationGraph) return;
    setProcessError("");
    if (!relationGraph.graphLocked) {
      setMessage("Lock the Relation Graph before rebuilding simulation ticks.");
      return;
    }
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
    const queuedRun = queueSimulationRunDraft(safeRun);
    if (queuedRun.events.length === 0) {
      setProcessState("failed");
      setProcessError(
        "No Event Logs were generated. Confirm Key People, regenerate Agents, and lock a graph with usable edges.",
      );
      return;
    }
    repos.simulations.clearDraft(seedContext.id);
    repos.reports.clearDraft(seedContext.id);
    setRun(queuedRun);
    setProcessRun(queuedRun);
    setActiveStageIndex(0);
    setProcessState("running");
    setMessage(
      "Rebuilding from the latest frozen Agents and Relation Edges, then writing Event Logs before Claims.",
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
    setProcessRun(null);
    setProcessState("idle");
    setActiveStageIndex(0);
    setProcessError("");
    setMessage("Local simulation run draft cleared.");
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusPill tone="ready">Simulation run</StatusPill>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            Watch the scenario sandbox run.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            MiroFish freezes the locked graph, runs deterministic branch ticks,
            writes Event Logs, then builds Claims from those events. No LLM
            directly decides final claims, and there are no mid-run story
            choices.
          </p>
        </div>
        <StatusPill tone={statusTone(processState === "failed" ? "failed" : run.status)}>
          {processState === "running"
            ? "Running"
            : processState === "complete"
              ? "Complete"
              : run.status === "queued"
                ? "Event Log ready"
                : "Draft only"}
        </StatusPill>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-6">
          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={queueRun}
                disabled={processState === "running"}
                className="rounded-md bg-[#11150f] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#9aa096]"
              >
                Run visible simulation
              </button>
              <button
                type="button"
                onClick={rebuild}
                disabled={processState === "running"}
                className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f] disabled:cursor-not-allowed disabled:bg-[#eef0ea] disabled:text-[#9aa096]"
              >
                Regenerate and run
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={processState === "running"}
                className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f] disabled:cursor-not-allowed disabled:bg-[#eef0ea] disabled:text-[#9aa096]"
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
            {processError ? (
              <NotReadyPanel
                title="Simulation could not finish"
                items={[
                  processError,
                  "Return to the Relation Graph and confirm it is locked.",
                  "Regenerate Agents if no confirmed NPC exists.",
                ]}
              />
            ) : null}
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-[#11150f]">
                  Simulation process
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#62695d]">
                  Claims stay downstream of Event Logs. The stage list shows
                  exactly where the local run is in the sandbox pipeline.
                </p>
              </div>
              <StatusPill tone={processState === "failed" ? "blocked" : "planned"}>
                {generatedEventCount} events generated
              </StatusPill>
            </div>
            <div className="mt-5 space-y-3">
              {simulationStages.map((stage, index) => {
                const completed =
                  processState === "complete" ||
                  (processState === "running" && index < activeStageIndex);
                const active =
                  processState === "running" && index === activeStageIndex;
                const blocked = processState === "failed" && index >= activeStageIndex;
                return (
                  <div
                    key={stage.id}
                    className={`rounded-md border p-4 ${
                      completed
                        ? "border-[#568262]/25 bg-[#eef5ee]"
                        : active
                          ? "border-[#d49b4a]/35 bg-[#fff8ed]"
                          : blocked
                            ? "border-red-200 bg-red-50"
                            : "border-black/8 bg-[#f7f8f4]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#11150f]">
                        {stage.label}
                      </p>
                      <StatusPill
                        tone={
                          blocked ? "blocked" : completed ? "ready" : "planned"
                        }
                      >
                        {blocked ? "blocked" : completed ? "done" : active ? "running" : "waiting"}
                      </StatusPill>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#62695d]">
                      {stage.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <h2 className="text-base font-semibold text-[#11150f]">
              Tick previews
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              These previews show the deterministic tick queue before the
              Result Sandbox opens.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {visibleRun?.ticks.map((tick) => (
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
              Branch previews
            </h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {branchNames.map((branchId) => {
                const branchEvents =
                  visibleRun?.events.filter(
                    (event) => (event.branchId ?? "baseline") === branchId,
                  ) ?? [];
                return (
                  <article
                    key={branchId}
                    className="rounded-md border border-black/8 bg-[#f7f8f4] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-[#11150f]">
                        {branchLabel(branchId)}
                      </h3>
                      <StatusPill tone="planned">
                        {branchEventCounts.get(branchId) ?? 0} events
                      </StatusPill>
                    </div>
                    <div className="mt-3 space-y-2">
                      {branchEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="rounded border border-black/8 bg-white p-3"
                        >
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
                            Tick {event.tickIndex} / {eventTypeLabel(event.eventType)}
                          </div>
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#62695d]">
                            {event.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <h2 className="text-base font-semibold text-[#11150f]">
              Evidence timeline
            </h2>
            <div className="mt-4 space-y-3">
              {visibleRun?.events.map((event) => (
                <article
                  key={event.id}
                  className="rounded-md border border-black/8 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#11150f]">
                        {branchLabel(event.branchId ?? "baseline")} /{" "}
                        {eventTypeLabel(event.eventType)} / {event.timeLabel}
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
            <Metric label="Agents" value={visibleRun?.frozenAgentProfileIds.length ?? 0} />
            <Metric label="Edges" value={visibleRun?.frozenRelationEdgeIds.length ?? 0} />
            <Metric label="Ticks" value={visibleRun?.tickCount ?? 0} />
            <Metric label="Events" value={generatedEventCount} />
            <Metric label="Branches" value={branchNames.length} />
            <Metric label="Claims" value={claimPreviewCount} />
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
                {visibleRun?.traceId}
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
            {visibleRun?.gates.map((gate) => (
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
            onClick={(event) => {
              if (processState === "running") event.preventDefault();
            }}
            className={`mt-5 inline-flex w-full justify-center rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white ${
              processState === "running" ? "cursor-not-allowed opacity-45" : ""
            }`}
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

function NotReadyPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
      <h3 className="text-sm font-semibold text-amber-950">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

