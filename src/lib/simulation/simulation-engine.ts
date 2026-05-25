import type { AgentEcologyDraft, AgentProfileDraft } from "@/types/agent-profile";
import type { RelationEdgeDraft, RelationWeights } from "@/types/relation-edge";
import type {
  SimulationBranchId,
  SimulationEventDraft,
  SimulationGateDraft,
  SimulationRunDraft,
  SimulationTickDraft,
} from "@/types/simulation-run";

import { agentForBranch, branchPolicies } from "./branch-policy";
import { scoreEventConfidence } from "./confidence-scoring";
import { buildEdgeUpdate } from "./edge-update-rules";
import { buildEventPolicy } from "./event-policy";
import type {
  BranchPolicy,
  SafetySnapshot,
  SimulationEngineInput,
} from "./simulation-types";
import { getTickPolicy } from "./tick-policy";

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function buildGates(
  agentEcology: AgentEcologyDraft,
  relationEdges: RelationEdgeDraft[],
  safetySnapshot: SafetySnapshot,
): SimulationGateDraft[] {
  const hasAgents = agentEcology.agents.length > 0;
  const hasNpc = agentEcology.agents.some((agent) => agent.agentType === "npc");
  const hasEdges = relationEdges.length > 0;
  const safetyBlocked = safetySnapshot.safetyLevel === "blocked";

  return [
    {
      id: "agents",
      status: hasAgents && hasNpc ? "ready" : "missing",
      detail:
        hasAgents && hasNpc
          ? "Agent Profiles are frozen for Simulation Engine v1."
          : "At least one self agent and one confirmed NPC are required.",
    },
    {
      id: "relation_graph",
      status: hasEdges ? "ready" : "missing",
      detail: hasEdges
        ? "Relation Edges are frozen as a read-only ledger."
        : "Generate and lock a Relation Graph before running ticks.",
    },
    {
      id: "tick_queue",
      status: hasAgents && hasEdges && !safetyBlocked ? "ready" : "missing",
      detail: "Simulation Engine v1 builds deterministic branch tick queues.",
    },
    {
      id: "event_log",
      status: hasAgents && hasEdges && !safetyBlocked ? "ready" : "missing",
      detail: "Every non-empty tick writes source-linked Event Logs.",
    },
    {
      id: "safety_checks",
      status: safetyBlocked ? "blocked" : "ready",
      detail: `Safety snapshot frozen as ${safetySnapshot.safetyLevel}.`,
    },
  ];
}

function defaultSafetySnapshot(): SafetySnapshot {
  return {
    safetyLevel: "unchecked",
    flags: [],
    allowedActions: [],
    blockedActions: [],
    reportRestrictions: [],
  };
}

function environmentStateForBranch(
  input: SimulationEngineInput,
  branch: BranchPolicy,
  tickIndex: number,
) {
  return {
    trackType: input.seedContext.trackType,
    timeWindow: input.seedContext.timeWindow,
    focus: input.seedContext.questionText,
    branchId: branch.id,
    branchLabel: branch.label,
    tickPolicy: "simulation_engine_v1",
    tickIndex,
    safetyLevel: input.safetySnapshot?.safetyLevel ?? "unchecked",
  };
}

function agentStateSnapshot(
  agents: AgentProfileDraft[],
  branch: BranchPolicy,
  tickIndex: number,
) {
  return agents.map((agent) => ({
    agentId: agent.id,
    branchId: branch.id,
    confidence: agent.confidence,
    stance: agent.profileJson.stance,
    stress: Math.max(
      0,
      Math.min(
        100,
        Math.round(
          agent.profileJson.state.stress +
            (branch.id === "cautious_self" ? 2 : 0) +
            (branch.id === "decisive_self" ? -1 : 0) +
            Math.max(0, tickIndex - 1),
        ),
      ),
    ),
  }));
}

function graphSnapshot(
  relationEdges: RelationEdgeDraft[],
  weights: Map<string, RelationWeights>,
) {
  return relationEdges.map((edge) => ({
    edgeId: edge.id,
    weights: weights.get(edge.id) ?? edge.weights,
  }));
}

function edgeForTick(
  relationEdges: RelationEdgeDraft[],
  branchAgentId: string | null,
  tickIndex: number,
) {
  const branchEdges = branchAgentId
    ? relationEdges.filter(
        (edge) =>
          edge.fromAgentId === branchAgentId || edge.toAgentId === branchAgentId,
      )
    : [];
  const pool = branchEdges.length ? branchEdges : relationEdges;
  return pool[(tickIndex - 1) % Math.max(pool.length, 1)] ?? null;
}

function buildBranchTicksAndEvents(
  runId: string,
  input: SimulationEngineInput,
  branch: BranchPolicy,
  now: string,
) {
  const tickPolicy = getTickPolicy(input.seedContext.timeWindow);
  const branchAgent = agentForBranch(input.agentEcology.agents, branch);
  const branchWeights = new Map(
    input.relationEdges.map((edge) => [edge.id, edge.weights] as const),
  );
  const ticks: SimulationTickDraft[] = [];
  const events: SimulationEventDraft[] = [];

  for (let index = 0; index < tickPolicy.tickCount; index += 1) {
    const tickIndex = index + 1;
    const timeLabel = tickPolicy.timeLabels[index] ?? `Tick ${tickIndex}`;
    const tickId = `tick_${hashText(`${runId}:${branch.id}:${tickIndex}`)}`;
    const traceId = `trace_${hashText(`${tickId}:simulation_engine_v1`)}`;
    const edge = edgeForTick(input.relationEdges, branchAgent?.id ?? null, tickIndex);

    if (!edge) {
      ticks.push({
        id: tickId,
        simulationRunId: runId,
        version: "local-deterministic-v0",
        branchId: branch.id,
        tickIndex,
        timeLabel,
        environmentState: environmentStateForBranch(input, branch, tickIndex),
        agentStateSnapshot: agentStateSnapshot(
          input.agentEcology.agents,
          branch,
          tickIndex,
        ),
        relationGraphSnapshot: [],
        eventLogIds: [],
        summary: `${branch.label} reserved this tick because no Relation Edge exists.`,
        traceId,
        errorCode: null,
        createdAt: now,
      });
      continue;
    }

    const beforeWeights = branchWeights.get(edge.id) ?? edge.weights;
    const update = buildEdgeUpdate(edge, beforeWeights, branch, tickIndex);
    branchWeights.set(edge.id, update.afterWeights);
    const eventPolicy = buildEventPolicy(
      input.agentEcology.agents,
      edge,
      beforeWeights,
      update.delta,
      branch,
      tickIndex,
    );
    const eventId = `event_${hashText(`${tickId}:${edge.id}:${eventPolicy.eventType}`)}`;
    const participants = [edge.fromAgentId, edge.toAgentId];
    const confidence = scoreEventConfidence({
      edge,
      agents: input.agentEcology.agents,
      ruleCount: update.ruleIds.length + 1,
      tickIndex,
    });

    ticks.push({
      id: tickId,
      simulationRunId: runId,
      version: "local-deterministic-v0",
      branchId: branch.id,
      tickIndex,
      timeLabel,
      environmentState: environmentStateForBranch(input, branch, tickIndex),
      agentStateSnapshot: agentStateSnapshot(
        input.agentEcology.agents,
        branch,
        tickIndex,
      ),
      relationGraphSnapshot: graphSnapshot(input.relationEdges, branchWeights),
      eventLogIds: [eventId],
      summary: `${branch.label} tick ${tickIndex} applies deterministic edge rules and writes Event Log evidence.`,
      traceId,
      errorCode: null,
      createdAt: now,
    });

    events.push({
      id: eventId,
      simulationRunId: runId,
      simulationTickId: tickId,
      tick: tickIndex,
      tickIndex,
      timeWindow: input.seedContext.timeWindow,
      timeLabel,
      version: "local-deterministic-v0",
      branchId: branch.id,
      eventType: eventPolicy.eventType,
      summary: eventPolicy.summary,
      participants,
      causes: eventPolicy.causes,
      action: eventPolicy.action,
      agentIds: participants,
      involvedAgentIds: participants,
      relationEdgeIds: [edge.id],
      beforeState: {
        weights: {
          [edge.id]: beforeWeights,
        },
      },
      afterState: {
        weights: {
          [edge.id]: update.afterWeights,
        },
      },
      edgeWeightDeltas: {
        [edge.id]: update.delta,
      },
      evidence: {
        sourceAgentIds: eventPolicy.ruleSource.agentIds,
        sourceRelationEdgeIds: eventPolicy.ruleSource.relationEdgeIds,
        ruleIds: [eventPolicy.ruleSource.ruleId, ...update.ruleIds],
        evidenceRefs: eventPolicy.ruleSource.evidenceRefs,
      },
      confidence,
      source: "simulation_engine_v1",
      traceId,
      status: "preview",
      createdAt: now,
    });
  }

  return { ticks, events };
}

export function buildSimulationEngineV1Run(
  input: SimulationEngineInput,
): SimulationRunDraft {
  const now = new Date().toISOString();
  const simulationRunId = `run_${hashText(`${input.seedContext.id}:simulation`)}`;
  const safetySnapshot = input.safetySnapshot ?? defaultSafetySnapshot();
  const branchOutputs = branchPolicies.map((branch) => {
    const output = buildBranchTicksAndEvents(simulationRunId, input, branch, now);
    return { branch, ...output };
  });
  const rawEvents = branchOutputs.flatMap((output) => output.events);
  const tickCount = getTickPolicy(input.seedContext.timeWindow).tickCount;
  const baselineTicks = branchOutputs[0]?.ticks ?? [];
  const tickIdByIndex = new Map(
    baselineTicks.map((tick) => [tick.tickIndex, tick.id] as const),
  );
  const events = rawEvents.map((event) => ({
    ...event,
    simulationTickId: tickIdByIndex.get(event.tickIndex) ?? event.simulationTickId,
  }));
  const ticks = baselineTicks.map((tick) => ({
    ...tick,
    branchId: undefined,
    eventLogIds: events
      .filter((event) => event.tickIndex === tick.tickIndex)
      .map((event) => event.id),
    summary: `Tick ${tick.tickIndex} contains deterministic Event Logs for baseline, cautious self, and decisive self branches.`,
  }));
  const status = input.status ?? "not_ready";

  return {
    id: simulationRunId,
    seedContextId: input.seedContext.id,
    version: "local-deterministic-v0",
    status,
    track: input.seedContext.trackType,
    timeHorizon: input.seedContext.timeWindow,
    tickCount,
    frozenAgentProfileIds: input.agentEcology.agents.map((agent) => agent.id),
    frozenRelationEdgeIds: input.relationEdges.map((edge) => edge.id),
    frozenAgentProfileSnapshot: input.agentEcology.agents,
    frozenRelationEdgeSnapshot: input.relationEdges,
    safetySnapshot,
    safetyLevel:
      safetySnapshot.safetyLevel === "blocked"
        ? "blocked"
        : safetySnapshot.safetyLevel === "unchecked"
          ? "unchecked"
          : "normal",
    branches: branchOutputs.map((output) => ({
      id: output.branch.id as SimulationBranchId,
      label: output.branch.label,
      tickIds: ticks.map((tick) => tick.id),
      eventIds: output.events.map((event) => event.id),
    })),
    traceId: `trace_${hashText(`${simulationRunId}:simulation_engine_v1`)}`,
    modelVersion: "unreleased",
    promptVersion: "unreleased",
    costCents: 0,
    errorCode: null,
    gates: buildGates(input.agentEcology, input.relationEdges, safetySnapshot),
    ticks,
    events,
    agentIds: input.agentEcology.agents.map((agent) => agent.id),
    relationEdgeIds: input.relationEdges.map((edge) => edge.id),
    createdAt: now,
    updatedAt: now,
  };
}
