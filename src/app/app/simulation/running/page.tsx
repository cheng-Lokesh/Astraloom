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
import type { AgentEcologyDraft } from "@/types/agent-profile";
import type { DestinyClimateDraft, DestinyProfileDraft } from "@/types/destiny";
import type { DestinySituationFusionDraft } from "@/types/destiny-fusion";
import type { SeedContextDraft } from "@/types/seed-context";
import type {
  SimulationBranchId,
  SimulationEventDraft,
  SimulationRunDraft,
} from "@/types/simulation-run";

const simulationStages = [
  {
    id: "reading_destiny_climate",
    label: "Reading destiny climate",
    detail:
      "Bring the Destiny Profile and Current Destiny Climate into the sandbox as symbolic context, not fate.",
  },
  {
    id: "structuring_real_situation",
    label: "Structuring the real situation",
    detail:
      "Read the current question, key people, constraints, and observable pressure from the saved local setup.",
  },
  {
    id: "mapping_destiny_themes",
    label: "Mapping destiny themes to key people",
    detail:
      "Connect climate themes to real people and pressure roles while keeping symbolic context separate from evidence.",
  },
  {
    id: "simulating_key_interactions",
    label: "Simulating key interactions",
    detail:
      "Run local branch interactions and save Event Logs before any findings are prepared.",
  },
  {
    id: "comparing_path_divergence",
    label: "Comparing path divergence",
    detail:
      "Compare the current inertia, cautious observation, active push, and boundary adjustment paths for pressure shifts.",
  },
  {
    id: "preparing_integrated_findings",
    label: "Preparing integrated findings",
    detail:
      "Prepare findings only from saved Event Logs and evidence_event_ids for the Result Sandbox.",
  },
] as const;

const branchNames: SimulationBranchId[] = [
  "baseline",
  "cautious_self",
  "decisive_self",
  "boundary_adjustment",
];

const branchMeta: Record<
  SimulationBranchId,
  { title: string; detail: string; classes: string }
> = {
  baseline: {
    title: "Current inertia path",
    detail: "Shows how pressure may move if the current pattern continues without a strong self-variant tilt.",
    classes: "border-black/8 bg-[#f7f8f4]",
  },
  cautious_self: {
    title: "Cautious observation path",
    detail: "Models slower movement, more observation, and extra sensitivity to missing information.",
    classes: "border-[#5b7f9b]/30 bg-[#eef3f7]",
  },
  decisive_self: {
    title: "Active push path",
    detail: "Models more direct movement and tests whether information gaps or resource pressure ease or rise.",
    classes: "border-[#c4824a]/30 bg-[#fdf5ed]",
  },
  boundary_adjustment: {
    title: "Boundary adjustment path",
    detail:
      "Models setting a clearer time box, boundary, or alternative option so the situation shifts from passive waiting to controlled choice.",
    classes: "border-[#568262]/30 bg-[#eef5ee]",
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

function branchDisplayLabel(branchId: SimulationBranchId | undefined) {
  if (branchId === "cautious_self") return "Cautious observation path";
  if (branchId === "decisive_self") return "Active push path";
  if (branchId === "boundary_adjustment") return "Boundary adjustment path";
  return "Current inertia path";
}

function agentName(
  agents: AgentEcologyDraft["agents"],
  id: string,
) {
  return agents.find((agent) => agent.id === id)?.label ?? id;
}

function eventParticipantText(
  event: SimulationEventDraft,
  agents: AgentEcologyDraft["agents"],
) {
  const participantIds = Array.isArray(event.involvedAgentIds)
    ? event.involvedAgentIds
    : event.agentIds;

  return participantIds.map((id) => agentName(agents, id)).join(" and ");
}

function firstClue(event: SimulationEventDraft) {
  return event.generatedClues?.[0] ?? event.action ?? event.summary;
}

function eventDisplayTitle(event: SimulationEventDraft) {
  return (event.userFacingEventTitle ?? eventTypeLabel(event.eventType))
    .replace("Baseline path:", "Current inertia path:")
    .replace("Cautious self path:", "Cautious observation path:")
    .replace("Decisive self path:", "Active push path:")
    .replace("Boundary adjustment path:", "Boundary adjustment path:");
}

function realSituationSummary(seedContext: SeedContextDraft) {
  return (
    seedContext.currentQuestionDescription ||
    seedContext.situationSummary ||
    seedContext.questionText
  );
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
  const fusionResult = repos.destinyFusions.load(seed.id);
  const destinyFusion = fusionResult.ok ? fusionResult.data : null;

  const calibrated = applyFeedbackToNextRun({
    agentEcology: ecology,
    relationEdges: graph.edges,
    calibrationProfile: loadCalibrationProfile(seed.id),
  });

  return buildSimulationRunDraft(
    seed,
    calibrated.agentEcology,
    calibrated.relationEdges,
    undefined,
    undefined,
    destinyFusion,
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
  const [destinyProfile] = useState<DestinyProfileDraft | null>(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.destinyProfiles.load(seed.id);
    return result.ok ? result.data : null;
  });
  const [destinyClimate] = useState<DestinyClimateDraft | null>(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.destinyClimates.load(seed.id);
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
  const [destinyFusion] = useState(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.destinyFusions.load(seed.id);
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
  const visibleEvents = useMemo(() => visibleRun?.events ?? [], [visibleRun]);
  const visibleTicks = useMemo(() => visibleRun?.ticks ?? [], [visibleRun]);
  const visibleGates = useMemo(() => visibleRun?.gates ?? [], [visibleRun]);
  const frozenAgentProfileIds = useMemo(
    () => visibleRun?.frozenAgentProfileIds ?? [],
    [visibleRun],
  );
  const frozenRelationEdgeIds = useMemo(
    () => visibleRun?.frozenRelationEdgeIds ?? [],
    [visibleRun],
  );
  const generatedEventCount = visibleEvents.length;
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
        label: "Situation map ready",
        ready: relationGraph?.graphLocked === true,
        fix: "Lock the Situation Map snapshot before running.",
      },
      {
        id: "agents_ready",
        label: "People and role models ready",
        ready:
          (agentEcology?.agents.length ?? 0) > 0 &&
          (agentEcology?.agents.some((agent) => agent.agentType === "npc") ??
            false),
        fix: "Confirm Key People and save usable role models.",
      },
      {
        id: "safety_checked",
        label: "Safety checked",
        ready: safetyDecision?.safetyLevel !== "blocked",
        fix: "Revise the situation setup if SafetyVerifier blocks the run.",
      },
      {
        id: "events_generated",
        label: "Sandbox events recorded",
        ready: generatedEventCount > 0,
        fix: "Run the visible sandbox after the Situation Map is ready.",
      },
      {
        id: "claims_built",
        label: "Findings prepared from evidence",
        ready: claimPreviewCount > 0,
        fix: "Findings require saved sandbox events with situation-map evidence.",
      },
      {
        id: "report_ready",
        label: "Result ready",
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
    visibleEvents.forEach((event) => {
      const branchId = event.branchId ?? "baseline";
      counts.set(branchId, (counts.get(branchId) ?? 0) + 1);
    });
    return counts;
  }, [visibleEvents]);

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

      if (stage.id === "simulating_key_interactions") {
        const result = repos.simulations.save(processRun);
        if (!result.ok) {
          setProcessState("failed");
          setProcessError(`Could not save Event Log: ${result.errorCode}`);
          setMessage(`Save failed: ${result.errorCode}`);
          return;
        }
      }

      if (stage.id === "preparing_integrated_findings") {
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
      destinyFusion,
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
      "The destiny-situation sandbox is running. Event Logs are saved before findings are prepared.",
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
      undefined,
      undefined,
      destinyFusion,
    );
    const decision = runSafetyGate(nextRun);
    if (!decision) return;
    const safeRun = buildSimulationRunDraft(
      seedContext,
      calibrated.agentEcology,
      calibrated.relationEdges,
      nextRun.status,
      snapshotFromDecision(decision),
      destinyFusion,
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
      "Rebuilding from the latest destiny fusion, Agents, and Relation Edges before writing Event Logs.",
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
        undefined,
        undefined,
        destinyFusion,
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
          <StatusPill tone="ready">Dynamic sandbox</StatusPill>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            Watch destiny climate enter the real situation.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            Astraloom reads the current climate, maps it to real people and
            pressures, runs local interaction events, compares path divergence,
            and prepares findings only after Event Logs are saved.
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

          <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.55fr)]">
            <DestinyClimatePanel
              profile={destinyProfile}
              climate={destinyClimate}
            />
            <RealSituationPanel seedContext={seedContext} />
          </section>

          <FusionMappingPanel fusion={destinyFusion} />

          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-[#11150f]">
                  Destiny-situation process
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#62695d]">
                  The visible process starts with climate and situation
                  structure, then moves through fusion, interactions, path
                  divergence, and evidence-backed findings.
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

          <details className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <summary className="cursor-pointer text-base font-semibold text-[#11150f]">
              Technical tick queue
            </summary>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              Internal deterministic ticks remain available for audit, but the
              primary sandbox view is the destiny-situation process above.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {visibleTicks.map((tick) => (
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
          </details>

          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <h2 className="text-base font-semibold text-[#11150f]">
              Path divergence
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              The same Situation Map is compared across four internal branch
              IDs. Labels are user-facing; the saved branch IDs remain stable
              for evidence and reports.
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-4">
              {branchNames.map((branchId) => {
                const branchEvents =
                  visibleEvents.filter(
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
                            Tick {event.tickIndex} / {event.timeLabel}
                          </div>
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#62695d]">
                            {event.interactionSummary ?? event.summary}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-[#7d8578]">
                            {event.informationGapDeltaSummary ??
                              "Information gap change is available in Event Log details."}
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <InteractionPreviewPanel
            events={visibleEvents}
            agents={agentEcology.agents}
          />

          <TimelineFeed
            ticks={visibleTicks}
            events={visibleEvents}
            agents={agentEcology.agents}
            edges={relationGraph.edges}
            title="Event Log evidence"
            description="Saved Event Logs stay available for audit. Findings are prepared only after these events exist and preserve evidence_event_ids."
          />
        </main>

        <aside className="mf-panel-dark h-fit p-6">
          <h2 className="text-sm font-semibold text-[#b7e6c6]">
            Run summary
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric label="Agents" value={frozenAgentProfileIds.length} />
            <Metric label="Edges" value={frozenRelationEdgeIds.length} />
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
              {visibleGates.map((gate) => (
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

function DestinyClimatePanel({
  profile,
  climate,
}: {
  profile: DestinyProfileDraft | null;
  climate: DestinyClimateDraft | null;
}) {
  return (
    <section className="rounded-lg border border-[#568262]/20 bg-[#eef5ee] p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#11150f]">
            Current Destiny Climate
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            {climate?.userFacingOverview ??
              profile?.userFacingSummary ??
              "No saved Destiny Climate was found. The sandbox can still run from real situation evidence, with lower destiny-layer confidence."}
          </p>
        </div>
        <StatusPill tone={climate ? "ready" : "planned"}>
          {climate ? `${climate.confidence.score}%` : "not loaded"}
        </StatusPill>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(climate?.coreTendencies ?? profile?.coreTendencies ?? [])
          .slice(0, 2)
          .map((item) => (
            <article
              key={item.id}
              className="rounded-md border border-[#568262]/15 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#11150f]">
                  {item.label}
                </h3>
                {item.intensity ? (
                  <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs text-[#3f483d]">
                    {item.intensity}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs leading-5 text-[#62695d]">
                {item.userFacingSummary}
              </p>
            </article>
          ))}
        {(climate?.panels ?? []).slice(0, 4).map((panel) => (
          <article
            key={panel.id}
            className="rounded-md border border-[#568262]/15 bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#11150f]">
                {panel.label}
              </h3>
              <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs text-[#3f483d]">
                {panel.intensity} / {panel.direction}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#62695d]">
              {panel.userFacingSummary}
            </p>
          </article>
        ))}
      </div>
      {climate?.observationSignals?.length ? (
        <div className="mt-4 rounded-md border border-[#568262]/15 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
            observation signals
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {climate.observationSignals.slice(0, 2).map((signal) => (
              <p key={signal.id} className="text-xs leading-5 text-[#62695d]">
                <span className="font-semibold text-[#11150f]">
                  {signal.label}:
                </span>{" "}
                {signal.userFacingSummary}
              </p>
            ))}
          </div>
        </div>
      ) : null}
      {climate?.decisionRhythm.phases.length ? (
        <div className="mt-4 rounded-md border border-[#568262]/15 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
            decision rhythm: {climate.decisionRhythm.overall}
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {climate.decisionRhythm.phases.map((phase) => (
              <p key={phase.label} className="text-xs leading-5 text-[#62695d]">
                <span className="font-semibold text-[#11150f]">
                  {phase.label}:
                </span>{" "}
                {phase.userFacingSummary}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RealSituationPanel({ seedContext }: { seedContext: SeedContextDraft }) {
  const missingContextHint = seedContext.missingContextHints?.[0];

  return (
    <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
      <h2 className="text-base font-semibold text-[#11150f]">
        Real Situation Structure
      </h2>
      <p className="mt-2 line-clamp-6 text-sm leading-6 text-[#62695d]">
        {realSituationSummary(seedContext)}
      </p>
      <div className="mt-4 grid gap-2">
        <SituationRow label="time window" value={seedContext.timeWindow} />
        <SituationRow label="track" value={seedContext.trackType} />
        <SituationRow
          label="quality"
          value={`${seedContext.contextQualityScore ?? 0}% context score`}
        />
      </div>
      {missingContextHint ? (
        <p className="mt-3 text-xs leading-5 text-[#7d8578]">
          {missingContextHint}
        </p>
      ) : null}
    </section>
  );
}

function SituationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-black/8 bg-[#f7f8f4] px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
        {label}
      </span>
      <span className="text-xs font-semibold text-[#3f483d]">{value}</span>
    </div>
  );
}

function FusionMappingPanel({
  fusion,
}: {
  fusion: DestinySituationFusionDraft | null;
}) {
  return (
    <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#11150f]">
            Destiny themes mapped to people and pressures
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            These mappings are symbolic-to-situation context. They do not claim
            certainty about people or outcomes.
          </p>
        </div>
        <StatusPill tone={fusion?.mappings.length ? "ready" : "planned"}>
          {fusion?.mappings.length ?? 0} mappings
        </StatusPill>
      </div>
      {fusion?.localWarnings?.length ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          {fusion.localWarnings[0]}
        </p>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(fusion?.mappings ?? []).slice(0, 6).map((mapping) => (
          <article
            key={mapping.id}
            className="rounded-md border border-black/8 bg-[#f7f8f4] p-4"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
              {mapping.themeLabel}
            </div>
            <h3 className="mt-2 text-sm font-semibold text-[#11150f]">
              {mapping.personLabel}
            </h3>
            <p className="mt-1 text-xs font-semibold text-[#3f483d]">
              {mapping.pressureRole}
            </p>
            <p className="mt-3 text-xs leading-5 text-[#62695d]">
              {mapping.userFacingSummary}
            </p>
            {mapping.mappingExplanation ? (
              <p className="mt-2 text-xs leading-5 text-[#7d8578]">
                Why linked: {mapping.mappingExplanation.whyLinked}
              </p>
            ) : null}
            {mapping.interpretationNotes?.[0] ? (
              <p className="mt-2 rounded border border-black/8 bg-white px-2 py-1 text-xs leading-5 text-[#62695d]">
                {mapping.interpretationNotes[0]}
              </p>
            ) : null}
          </article>
        ))}
        {!fusion?.mappings.length ? (
          <p className="rounded-md border border-dashed border-black/12 bg-[#f7f8f4] p-4 text-sm leading-6 text-[#7d8578]">
            No saved fusion mappings are available yet. Run preparation can
            continue from the Situation Map and Event Logs.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function InteractionPreviewPanel({
  events,
  agents,
}: {
  events: SimulationEventDraft[];
  agents: AgentEcologyDraft["agents"];
}) {
  const previewEvents = events.slice(0, 6);

  return (
    <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#11150f]">
            Dynamic interaction cards
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            Each card shows what happened, who is involved, the destiny
            influence, pressure changes, and one generated clue for inspection.
          </p>
        </div>
        <StatusPill tone={previewEvents.length ? "ready" : "planned"}>
          {previewEvents.length} shown
        </StatusPill>
      </div>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {previewEvents.map((event) => (
          <article
            key={event.id}
            className="rounded-md border border-black/8 bg-[#f7f8f4] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
                  {branchDisplayLabel(event.branchId)} / Tick {event.tickIndex}
                </div>
                <h3 className="mt-2 text-sm font-semibold text-[#11150f]">
                  {eventDisplayTitle(event)}
                </h3>
              </div>
              <span className="rounded border border-black/8 bg-white px-2 py-1 text-xs font-semibold text-[#3f483d]">
                {event.confidence}%
              </span>
            </div>
            <PreviewField label="what happened" value={event.summary} />
            <PreviewField
              label="who is involved"
              value={eventParticipantText(event, agents)}
            />
            <PreviewField
              label="destiny influence"
              value={event.destinyInfluenceSummary}
            />
            <PreviewField
              label="real-world pressure"
              value={event.pressureDeltaSummary}
            />
            <PreviewField
              label="information/resource change"
              value={[
                event.informationGapDeltaSummary,
                event.resourcePressureDeltaSummary,
              ]
                .filter(Boolean)
                .join(" ")}
            />
            <PreviewField label="generated clue" value={firstClue(event)} />
          </article>
        ))}
        {!previewEvents.length ? (
          <p className="rounded-md border border-dashed border-black/12 bg-[#f7f8f4] p-4 text-sm leading-6 text-[#7d8578]">
            Run the visible simulation to generate interaction cards.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function PreviewField({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  if (!value) return null;

  return (
    <div className="mt-3 rounded border border-black/8 bg-white p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
        {label}
      </div>
      <p className="mt-1 text-xs leading-5 text-[#62695d]">{value}</p>
    </div>
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

