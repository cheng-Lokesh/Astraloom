import type { AgentEcologyDraft, AgentProfileDraft } from "@/types/agent-profile";
import type {
  DestinySituationFusionDraft,
  DestinySituationFusionMapping,
  DestinySituationFusionSourceTag,
} from "@/types/destiny-fusion";
import type { RelationEdgeDraft, RelationWeights } from "@/types/relation-edge";
import type {
  SimulationBranchId,
  SimulationEventDraft,
  SimulationRealitySourceTag,
  SimulationGateDraft,
  SimulationRunDraft,
  SimulationTickDraft,
} from "@/types/simulation-run";
import type {
  GroundedRealityNode,
  GroundedRealityPressure,
  GroundedSimulationPathEvent,
} from "@/types/grounded-social-simulation";

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

const fusionSourceTags: DestinySituationFusionSourceTag[] = [
  "destiny climate",
  "real situation",
  "integrated simulation",
];

function groundedRealitySourceTags(
  grounded: NonNullable<SimulationEngineInput["groundedSocialSimulation"]>,
): SimulationRealitySourceTag[] {
  const mode = grounded.realityIntake?.mode ?? "local_assumption";
  const realityTag: SimulationRealitySourceTag =
    mode === "external_reality"
      ? "external reality source"
      : mode === "manual_reality"
        ? "manual reality material"
        : "local assumption";

  return [realityTag, "destiny weighting", "path simulation"];
}

const branchLabels: Record<SimulationBranchId, string> = {
  baseline: "Current inertia path",
  cautious_self: "Cautious observation path",
  decisive_self: "Active push path",
  boundary_adjustment: "Boundary adjustment path",
};

const branchDescriptions: Record<SimulationBranchId, string> = {
  baseline:
    "Models how pressure may move if the current pattern continues without a strong self-policy tilt.",
  cautious_self:
    "Models slower movement, more observation, and extra sensitivity to missing information.",
  decisive_self:
    "Models more direct movement and tests whether information gaps or resource pressure ease or rise.",
  boundary_adjustment:
    "Models setting a clearer time box, boundary, or alternative option so the situation shifts from passive waiting to controlled choice.",
};

function relationWeightLabel(key: keyof RelationWeights) {
  return key.replace(/([A-Z])/g, " $1").toLowerCase();
}

function signedDelta(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function summarizeDeltas(delta: Partial<RelationWeights>) {
  const entries = Object.entries(delta) as Array<
    [keyof RelationWeights, number | undefined]
  >;
  const changed = entries.filter(([, value]) => Boolean(value));

  if (!changed.length) {
    return "Pressure stayed mostly steady in this interaction.";
  }

  return changed
    .map(([key, value]) => `${relationWeightLabel(key)} ${signedDelta(value ?? 0)}`)
    .join("; ");
}

function axisDeltaSummary(
  key: keyof RelationWeights,
  delta: Partial<RelationWeights>,
  label: string,
) {
  const value = delta[key] ?? 0;
  if (value === 0) return `${label} stayed steady in this event.`;
  return `${label} ${value > 0 ? "increased" : "eased"} by ${Math.abs(value)} in this branch event.`;
}

function agentDisplayName(agents: AgentProfileDraft[], id: string) {
  return agents.find((agent) => agent.id === id)?.label ?? id;
}

function mappingForEvent({
  destinyFusion,
  agents,
  participants,
  tickIndex,
}: {
  destinyFusion?: DestinySituationFusionDraft | null;
  agents: AgentProfileDraft[];
  participants: string[];
  tickIndex: number;
}) {
  const mappings = destinyFusion?.mappings ?? [];
  if (!mappings.length) return null;

  const sourceKeyPersonIds = participants
    .map((agentId) => agents.find((agent) => agent.id === agentId)?.sourceKeyPersonId)
    .filter((id): id is string => Boolean(id));
  const directMapping = mappings.find((mapping) =>
    sourceKeyPersonIds.includes(mapping.personId),
  );

  return directMapping ?? mappings[(tickIndex - 1) % mappings.length] ?? null;
}

function groundedBranchAliases(branchId: SimulationBranchId) {
  if (branchId === "cautious_self") return ["cautious_self", "cautious"];
  if (branchId === "decisive_self") return ["decisive_self", "decisive"];
  if (branchId === "boundary_adjustment") {
    return ["boundary_adjustment", "boundary"];
  }
  return [branchId];
}

function groundedPathEventForEvent({
  branchId,
  tickIndex,
  pathEvents,
}: {
  branchId: SimulationBranchId;
  tickIndex: number;
  pathEvents: GroundedSimulationPathEvent[];
}) {
  const branchAliases = groundedBranchAliases(branchId);
  const branchEvents = pathEvents.filter((event) =>
    branchAliases.includes(event.branchId),
  );
  const pool = branchEvents.length ? branchEvents : pathEvents;

  return (
    pool.find((event) => event.step === tickIndex) ??
    pool[(tickIndex - 1) % Math.max(pool.length, 1)] ??
    null
  );
}

function summarizeGroundedNodes(nodes: GroundedRealityNode[]) {
  if (!nodes.length) return undefined;

  return nodes
    .slice(0, 3)
    .map((node) => `${node.label}: ${node.roleInSituation}`)
    .join(" ");
}

function summarizeGroundedPressures(pressures: GroundedRealityPressure[]) {
  if (!pressures.length) return undefined;

  return pressures
    .slice(0, 3)
    .map((pressure) => pressure.explanation)
    .join(" ");
}

function buildGroundedDisplayFields({
  input,
  branch,
  tickIndex,
}: {
  input: SimulationEngineInput;
  branch: BranchPolicy;
  tickIndex: number;
}) {
  const grounded = input.groundedSocialSimulation;
  if (!grounded) return {};

  const pathEvent = groundedPathEventForEvent({
    branchId: branch.id,
    tickIndex,
    pathEvents: grounded.pathEvents,
  });
  const groundedRealityNodeIds =
    pathEvent?.realityNodeIds.length
      ? pathEvent.realityNodeIds
      : grounded.realityNodes.slice(0, 3).map((node) => node.id);
  const groundedNodes = grounded.realityNodes.filter((node) =>
    groundedRealityNodeIds.includes(node.id),
  );
  const groundedPressures = grounded.realityPressures.filter(
    (pressure) =>
      groundedRealityNodeIds.includes(pressure.sourceNodeId) ||
      groundedRealityNodeIds.includes(pressure.targetNodeId),
  );

  return {
    groundedRealitySummary:
      pathEvent?.expectedRealityReaction ?? summarizeGroundedNodes(groundedNodes),
    groundedRealityNodeIds,
    groundedPressureSummary:
      pathEvent?.pressureChange ?? summarizeGroundedPressures(groundedPressures),
    destinyModifierEffect:
      pathEvent?.destinyModifierEffect ??
      grounded.destinyPersonModifier.timingSensitivity,
    realitySourceTags: groundedRealitySourceTags(grounded),
  } satisfies Pick<
    SimulationEventDraft,
    | "groundedRealitySummary"
    | "groundedRealityNodeIds"
    | "groundedPressureSummary"
    | "destinyModifierEffect"
    | "realitySourceTags"
  >;
}

function buildEventDisplayFields({
  eventType,
  eventSummary,
  action,
  agents,
  participants,
  branch,
  tickIndex,
  delta,
  destinyFusion,
  input,
}: {
  eventType: SimulationEventDraft["eventType"];
  eventSummary: string;
  action: string;
  agents: AgentProfileDraft[];
  participants: string[];
  branch: BranchPolicy;
  tickIndex: number;
  delta: Partial<RelationWeights>;
  destinyFusion?: DestinySituationFusionDraft | null;
  input: SimulationEngineInput;
}) {
  const mapping = mappingForEvent({
    destinyFusion,
    agents,
    participants,
    tickIndex,
  });
  const participantNames = participants.map((id) => agentDisplayName(agents, id));
  const themeLabel = mapping?.themeLabel ?? "situation pressure";
  const pathLabel = branchLabels[branch.id] ?? branch.label;
  const destinyInfluenceSummary = mapping
    ? `${mapping.themeLabel} is used as symbolic context for this event through ${mapping.personLabel}. This does not make the path certain.`
    : "No saved Destiny-Situation Fusion theme is attached, so this event is shown from real situation and interaction evidence only.";

  return {
    userFacingEventTitle: `${pathLabel}: ${eventType.replaceAll("_", " ")}`,
    pathLabel,
    destinyInfluenceSummary,
    fusionThemeIds: mapping ? [mapping.themeId] : [],
    interactionSummary: `${participantNames.join(" and ")} interact around ${themeLabel}. ${eventSummary}`,
    pressureDeltaSummary: summarizeDeltas(delta),
    informationGapDeltaSummary: axisDeltaSummary(
      "informationGap",
      delta,
      "Information gap pressure",
    ),
    resourcePressureDeltaSummary: axisDeltaSummary(
      "resourceControl",
      delta,
      "Resource pressure",
    ),
    generatedClues: buildGeneratedClues(mapping, action, delta),
    sourceTags: fusionSourceTags,
    ...buildGroundedDisplayFields({ input, branch, tickIndex }),
  } satisfies Pick<
    SimulationEventDraft,
    | "userFacingEventTitle"
    | "pathLabel"
    | "destinyInfluenceSummary"
    | "fusionThemeIds"
    | "interactionSummary"
    | "pressureDeltaSummary"
    | "informationGapDeltaSummary"
    | "resourcePressureDeltaSummary"
    | "generatedClues"
    | "sourceTags"
    | "groundedRealitySummary"
    | "groundedRealityNodeIds"
    | "groundedPressureSummary"
    | "destinyModifierEffect"
    | "realitySourceTags"
  >;
}

function buildGeneratedClues(
  mapping: DestinySituationFusionMapping | null,
  action: string,
  delta: Partial<RelationWeights>,
) {
  const clues = [
    action,
    axisDeltaSummary("informationGap", delta, "Information gap pressure"),
    axisDeltaSummary("resourceControl", delta, "Resource pressure"),
  ];

  if (mapping) {
    clues.unshift(
      `${mapping.themeLabel} maps to ${mapping.personLabel} as ${mapping.pressureRole}.`,
    );
  }

  return Array.from(new Set(clues.filter(Boolean))).slice(0, 4);
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
      ...buildEventDisplayFields({
        eventType: eventPolicy.eventType,
        eventSummary: eventPolicy.summary,
        action: eventPolicy.action,
        agents: input.agentEcology.agents,
        participants,
        branch,
        tickIndex,
        delta: update.delta,
        destinyFusion: input.destinyFusion,
        input,
      }),
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
    summary: `Tick ${tick.tickIndex} contains deterministic Event Logs for current inertia, cautious observation, active push, and boundary adjustment paths.`,
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
      description: branchDescriptions[output.branch.id],
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
