"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SampleSandboxBanner } from "@/components/sample-sandbox-banner";
import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import { TimelineFeed } from "@/components/simulation/event-log";
import { StatusPill } from "@/components/status-pill";
import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
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
import { isCompleteDestinySampleSeed } from "@/lib/trial/sample-workspace";
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

const branchMeta: Record<
  SimulationBranchId,
  { title: string; detail: string; classes: string }
> = {
  baseline: {
    title: "baseline",
    detail: "Uses the locked graph and current Agent Profile policies without a self-variant tilt.",
    classes: "border-black/8 bg-[#f7f8f4]",
  },
  cautious_self: {
    title: "cautious_self",
    detail: "Uses the cautious parallel self policy to model higher risk-aversion from the same graph.",
    classes: "border-[#5b7f9b]/30 bg-[#eef3f7]",
  },
  decisive_self: {
    title: "decisive_self",
    detail: "Uses the decisive parallel self policy to model higher risk-tolerance from the same graph.",
    classes: "border-[#c4824a]/30 bg-[#fdf5ed]",
  },
};

function statusTone(status: string) {
  if (status === "ready" || status === "queued") return "ready";
  if (status === "blocked" || status === "missing" || status === "failed") {
    return "blocked";
  }
  return "planned";
}

function eventTypeLabel(value: string) {
  return value.replaceAll("_", " ");
}

function countByEventType(events: SimulationRunDraft["events"]) {
  return events.reduce<Record<string, number>>((counts, event) => {
    const label = eventTypeLabel(event.eventType);
    return { ...counts, [label]: (counts[label] ?? 0) + 1 };
  }, {});
}

function claimCountForRun(run: SimulationRunDraft | null) {
  if (!run || run.events.length === 0) return 0;
  return buildClaimLedgerDraft(run.seedContextId, run).claims.length;
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
    () => claimCountForRun(visibleRun),
    [visibleRun],
  );
  const canOpenResult =
    processState === "complete" ||
    (visibleRun?.status === "queued" &&
      generatedEventCount > 0 &&
      claimPreviewCount > 0);
  const gateChecklist = useMemo(
    () => [
      {
        id: "graph_locked",
        label: "Graph locked",
        ready: relationGraph?.graphLocked === true,
        fix: "Lock the Relation Graph snapshot before running.",
      },
      {
        id: "agents_ready",
        label: "Agents ready",
        ready:
          (agentEcology?.agents.length ?? 0) > 0 &&
          (agentEcology?.agents.some((agent) => agent.agentType === "npc") ??
            false),
        fix: "Confirm Key People and save Agent Profiles.",
      },
      {
        id: "safety_checked",
        label: "Safety checked",
        ready: safetyDecision?.safetyLevel !== "blocked",
        fix: "Revise the situation setup if SafetyVerifier blocks the run.",
      },
      {
        id: "events_generated",
        label: "Event Logs generated",
        ready: generatedEventCount > 0,
        fix: "Run the visible simulation after graph lock.",
      },
      {
        id: "claims_built",
        label: "Claims built from events",
        ready: claimPreviewCount > 0,
        fix: "Claims require saved Event Logs with relation edge evidence.",
      },
      {
        id: "report_ready",
        label: "Result preview prepared",
        ready: canOpenResult,
        fix: "Finish the stage sequence before opening results.",
      },
    ],
    [
      agentEcology?.agents,
      canOpenResult,
      claimPreviewCount,
      generatedEventCount,
      relationGraph?.graphLocked,
      safetyDecision?.safetyLevel,
    ],
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
        <SurfaceCard emphasis="strong" className="mx-auto max-w-3xl p-8">
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
          <ButtonLink href="/app/new/agents" className="mt-6 px-5 py-3">
            Open Agent Profiles
          </ButtonLink>
        </SurfaceCard>
      </AppShell>
    );
  }

  if (relationGraph && !relationGraph.graphLocked) {
    return (
      <AppShell>
        <SurfaceCard emphasis="strong" className="mx-auto max-w-3xl p-8">
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
          <ButtonLink href="/app/new/graph" className="mt-6 px-5 py-3">
            Lock Relation Graph
          </ButtonLink>
        </SurfaceCard>
      </AppShell>
    );
  }

  if (!relationGraph || !run) {
    return (
      <AppShell>
        <SurfaceCard emphasis="strong" className="mx-auto max-w-3xl p-8">
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
          <ButtonLink href="/app/new/graph" className="mt-6 px-5 py-3">
            Open Relation Graph
          </ButtonLink>
        </SurfaceCard>
      </AppShell>
    );
  }

  if (safetyDecision?.safetyLevel === "blocked") {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl space-y-5">
          <SafetyDowngradeNotice
            decision={safetyDecision}
            title="Simulation is paused for safety"
          />
          <ButtonLink href="/app/new/intake" className="px-5 py-3">
            Back to situation setup
          </ButtonLink>
        </section>
      </AppShell>
    );
  }

  if (!agentEcology.agents.some((agent) => agent.agentType === "npc")) {
    return (
      <AppShell>
        <SurfaceCard emphasis="strong" className="mx-auto max-w-3xl p-8">
          <StatusPill tone="blocked">NPC required</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            Add at least one confirmed NPC before running ticks.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            The simulation needs a user model and at least one confirmed NPC so Event Logs can connect agents through Relation Edges.
          </p>
          <NotReadyPanel
            title="Concrete fixes"
            items={[
              "Return to Key People and confirm at least one person.",
              "Regenerate Agent Profiles so confirmed people become NPC agents.",
              "Regenerate and lock the Relation Graph before running again.",
            ]}
          />
          <ButtonLink href="/app/new/people" className="mt-6 px-5 py-3">
            Confirm Key People
          </ButtonLink>
        </SurfaceCard>
      </AppShell>
    );
  }

  if (relationGraph.edges.length === 0) {
    return (
      <AppShell>
        <SurfaceCard emphasis="strong" className="mx-auto max-w-3xl p-8">
          <StatusPill tone="blocked">Edges required</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            The locked graph needs at least one Relation Edge.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            Empty ticks cannot produce Event Logs, and Claims cannot be built from empty ticks.
          </p>
          <NotReadyPanel
            title="Concrete fixes"
            items={[
              "Regenerate the Relation Graph from current Agent Profiles.",
              "Check that the user core and NPC agents both exist.",
              "Lock the regenerated graph before starting simulation.",
            ]}
          />
          <ButtonLink href="/app/new/graph" className="mt-6 px-5 py-3">
            Open Relation Graph
          </ButtonLink>
        </SurfaceCard>
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
      "Simulation Engine v1 is running deterministic stages. Event Logs are saved before Claims are built.",
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
      {isCompleteDestinySampleSeed(seedContext.id) ? (
        <SampleSandboxBanner />
      ) : null}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusPill tone="ready">Simulation run</StatusPill>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            Watch the scenario sandbox run.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            Astraloom freezes the locked graph, runs deterministic branch ticks,
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
              <Button
                type="button"
                onClick={queueRun}
                disabled={processState === "running"}
              >
                Run visible simulation
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={rebuild}
                disabled={processState === "running"}
              >
                Regenerate and run
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={reset}
                disabled={processState === "running"}
              >
                Clear local draft
              </Button>
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
                const indicator = blocked ? "✕" : completed ? "✓" : active ? "◉" : "○";
                return (
                  <div
                    key={stage.id}
                    className={`overflow-hidden rounded-md border ${
                      completed
                        ? "border-[#568262]/25 bg-[#eef5ee]"
                        : active
                          ? "border-[#d49b4a]/35 bg-[#fff8ed]"
                          : blocked
                            ? "border-red-200 bg-red-50"
                            : "border-black/8 bg-[#f7f8f4]"
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-8 w-10 place-items-center rounded-full border text-[10px] font-semibold ${
                              active
                                ? "animate-pulse border-[#d49b4a]/45 bg-white text-[#7c5524]"
                                : completed
                                  ? "border-[#568262]/25 bg-white text-[#2f5d3d]"
                                  : blocked
                                    ? "border-red-200 bg-white text-red-900"
                                    : "border-black/10 bg-white text-[#7d8578]"
                            }`}
                          >
                            {indicator}
                          </span>
                          <p className="text-sm font-semibold text-[#11150f]">
                            {stage.label}
                          </p>
                        </div>
                        <StatusPill
                          tone={
                            blocked ? "blocked" : completed ? "ready" : "planned"
                          }
                        >
                          {blocked
                            ? "blocked"
                            : completed
                              ? "done"
                              : active
                                ? "running"
                                : "waiting"}
                        </StatusPill>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#62695d]">
                        {stage.detail}
                      </p>
                    </div>
                    {active ? (
                      <div className="h-1 bg-[#f2dfbd]">
                        <div
                          className="h-full animate-stage-fill bg-[#d49b4a]"
                          style={
                            {
                              "--stage-duration":
                                activeStageIndex < 4 ? "620ms" : "760ms",
                            } as CSSProperties
                          }
                        />
                      </div>
                    ) : completed ? (
                      <div className="h-1 bg-[#568262]" />
                    ) : null}
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
                const typeCounts = countByEventType(branchEvents);
                const meta = branchMeta[branchId];
                return (
                  <article
                    key={branchId}
                    className={`rounded-md border p-4 ${meta.classes}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-[#11150f]">
                        {meta.title}
                      </h3>
                      <StatusPill tone="planned">
                        {branchEventCounts.get(branchId) ?? 0} events
                      </StatusPill>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#62695d]">
                      {meta.detail}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(typeCounts).length ? (
                        Object.entries(typeCounts)
                          .sort(([, leftCount], [, rightCount]) => rightCount - leftCount)
                          .map(([type, count]) => (
                            <span
                              key={type}
                              className="rounded border border-black/8 bg-white px-2 py-1 text-xs text-[#3f483d]"
                            >
                              {type}: {count}
                            </span>
                          ))
                      ) : (
                        <span className="rounded border border-black/8 bg-white px-2 py-1 text-xs text-[#7d8578]">
                          no events yet
                        </span>
                      )}
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

          <TimelineFeed
            ticks={visibleRun?.ticks ?? []}
            events={visibleRun?.events ?? []}
            agents={agentEcology.agents}
            edges={relationGraph.edges}
            title="Evidence timeline"
            description="Event Logs are grouped by tick and show agent refs, edge refs, confidence, evidence refs, and weight deltas."
          />
        </main>

        <aside className="mf-panel-dark h-fit p-6">
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
          <div className="mt-5 rounded-md border border-white/10 bg-white/[0.06] p-4">
            <h3 className="text-sm font-semibold text-white">Gate checklist</h3>
            <div className="mt-3 space-y-2">
              {gateChecklist.map((gate) => (
                <div key={gate.id} className="rounded border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-white">
                      {gate.label}
                    </span>
                    <StatusPill tone={gate.ready ? "ready" : "blocked"}>
                      {gate.ready ? "ready" : "fix needed"}
                    </StatusPill>
                  </div>
                  {!gate.ready ? (
                    <p className="mt-2 text-xs leading-5 text-white/50">
                      {gate.fix}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <details className="mt-5 rounded-md border border-white/10 bg-white/[0.06] p-4">
            <summary className="cursor-pointer text-xs font-semibold text-white/42">
              Engine gate debug
            </summary>
            <div className="mt-3 space-y-2">
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
          </details>
          <ButtonLink
            href="/app/simulation/result"
            variant="ghostOnDark"
            onClick={(event) => {
              if (!canOpenResult) event.preventDefault();
            }}
            className={`mt-5 w-full px-4 py-3 ${
              canOpenResult ? "" : "cursor-not-allowed opacity-45"
            }`}
          >
            {canOpenResult
              ? "Continue to Result Sandbox"
              : "Complete Event Log and Claims first"}
          </ButtonLink>
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

