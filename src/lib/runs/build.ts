import type { AgentEcologyDraft } from "@/types/agent-profile";
import type { RelationEdgeDraft, RelationWeights } from "@/types/relation-edge";
import { buildRelationEdges } from "@/lib/relations/build";
import type { SeedContextDraft, TimeWindow } from "@/types/seed-context";
import type {
  SimulationEventDraft,
  SimulationGateDraft,
  SimulationRunDraft,
  SimulationRunStatus,
  SimulationTickDraft,
} from "@/types/simulation-run";

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function tickCountForWindow(timeWindow: TimeWindow) {
  const counts: Record<TimeWindow, number> = {
    "30_days": 3,
    "90_days": 6,
    "1_year": 8,
    "3_years": 10,
    "5_years": 12,
  };

  return counts[timeWindow];
}

function timeLabelsForWindow(timeWindow: TimeWindow, tickCount: number) {
  const labels: Record<TimeWindow, string[]> = {
    "30_days": ["Day 1-7", "Day 8-21", "Day 22-30"],
    "90_days": [
      "Day 1-14",
      "Day 15-30",
      "Month 2 start",
      "Month 2 end",
      "Month 3 start",
      "Month 3 end",
    ],
    "1_year": [
      "Month 1",
      "Month 2-3",
      "Month 4-6",
      "Month 7-9",
      "Month 10-12",
      "Year-end review",
      "Reserve tick",
      "Calibration tick",
    ],
    "3_years": [
      "Quarter 1",
      "Quarter 2",
      "Quarter 3",
      "Quarter 4",
      "Year 2 early",
      "Year 2 late",
      "Year 3 early",
      "Year 3 mid",
      "Year 3 late",
      "Calibration tick",
    ],
    "5_years": [
      "Half year 1",
      "Half year 2",
      "Year 2 early",
      "Year 2 late",
      "Year 3 early",
      "Year 3 late",
      "Year 4 early",
      "Year 4 late",
      "Year 5 early",
      "Year 5 mid",
      "Year 5 late",
      "Calibration tick",
    ],
  };

  return Array.from({ length: tickCount }, (_, index) => {
    return labels[timeWindow][index] ?? `Tick ${index + 1}`;
  });
}

function buildGates(
  agentEcology: AgentEcologyDraft,
  relationEdges: RelationEdgeDraft[],
): SimulationGateDraft[] {
  const hasAgents = agentEcology.agents.length > 0;
  const hasNpc = agentEcology.agents.some((agent) => agent.agentType === "npc");
  const hasEdges = relationEdges.length > 0;

  return [
    {
      id: "agents",
      status: hasAgents && hasNpc ? "ready" : "missing",
      detail:
        hasAgents && hasNpc
          ? "Agent Profiles are frozen for this local run."
          : "At least one self agent and one confirmed NPC are required.",
    },
    {
      id: "relation_graph",
      status: hasEdges ? "ready" : "missing",
      detail: hasEdges
        ? "Relation Edges are frozen and read-only for the run."
        : "Generate a Relation Graph before running ticks.",
    },
    {
      id: "tick_queue",
      status: hasAgents && hasEdges ? "ready" : "missing",
      detail: "Local deterministic tick queue can be built without LLM calls.",
    },
    {
      id: "event_log",
      status: hasAgents && hasEdges ? "ready" : "missing",
      detail: "Each tick will write at least one evidence event draft.",
    },
    {
      id: "safety_checks",
      status: "missing",
      detail: "Safety downgrade is checked in the next gate before reports.",
    },
  ];
}

function applyDelta(weights: RelationWeights, delta: Partial<RelationWeights>) {
  return {
    trust: clamp(weights.trust + (delta.trust ?? 0)),
    hostility: clamp(weights.hostility + (delta.hostility ?? 0)),
    dependency: clamp(weights.dependency + (delta.dependency ?? 0)),
    attraction: clamp(weights.attraction + (delta.attraction ?? 0)),
    competition: clamp(weights.competition + (delta.competition ?? 0)),
    informationGap: clamp(weights.informationGap + (delta.informationGap ?? 0)),
    resourceControl: clamp(weights.resourceControl + (delta.resourceControl ?? 0)),
    emotionalDebt: clamp(weights.emotionalDebt + (delta.emotionalDebt ?? 0)),
  } satisfies RelationWeights;
}

function deltaForEdge(edge: RelationEdgeDraft, tickIndex: number) {
  const pressure =
    edge.weights.hostility +
    edge.weights.competition +
    edge.weights.informationGap;
  const support = edge.weights.trust + edge.weights.dependency;
  const direction = pressure > support ? 1 : -1;
  const scale = 1 + ((tickIndex + edge.id.length) % 3);

  return {
    trust: direction < 0 ? scale : -scale,
    hostility: direction > 0 ? scale : -1,
    informationGap: direction > 0 ? scale : -scale,
    emotionalDebt: edge.weights.emotionalDebt > 55 ? 1 : 0,
  } satisfies Partial<RelationWeights>;
}

function eventSummary(edge: RelationEdgeDraft, tickIndex: number) {
  if (tickIndex === 1) {
    return `Graph freeze records ${edge.relationshipType} as the first observed relationship pressure.`;
  }

  if (edge.weights.hostility + edge.weights.competition > edge.weights.trust) {
    return `${edge.relationshipType} pressure remains visible; the event only records a local signal, not a final outcome.`;
  }

  return `${edge.relationshipType} shows a local coordination signal; later claims still require evidence_event_ids.`;
}

function buildTickAndEvents(
  simulationRunId: string,
  seedContext: SeedContextDraft,
  agentEcology: AgentEcologyDraft,
  relationEdges: RelationEdgeDraft[],
  now: string,
) {
  const tickCount = tickCountForWindow(seedContext.timeWindow);
  const timeLabels = timeLabelsForWindow(seedContext.timeWindow, tickCount);
  const currentWeights = new Map(
    relationEdges.map((edge) => [edge.id, edge.weights] as const),
  );
  const ticks: SimulationTickDraft[] = [];
  const events: SimulationEventDraft[] = [];

  for (let index = 0; index < tickCount; index += 1) {
    const tickIndex = index + 1;
    const timeLabel = timeLabels[index];
    const traceId = `trace_${hashText(`${simulationRunId}:tick:${tickIndex}`)}`;
    const edge = relationEdges[index % Math.max(relationEdges.length, 1)];

    if (!edge) {
      const tickId = `tick_${hashText(`${simulationRunId}:empty:${tickIndex}`)}`;
      ticks.push({
        id: tickId,
        simulationRunId,
        version: "local-deterministic-v0",
        tickIndex,
        timeLabel,
        environmentState: {
          trackType: seedContext.trackType,
          timeWindow: seedContext.timeWindow,
          focus: seedContext.questionText,
        },
        agentStateSnapshot: agentEcology.agents.map((agent) => ({
          agentId: agent.id,
          confidence: agent.confidence,
        })),
        relationGraphSnapshot: [],
        summary: "Tick slot reserved; no Relation Edge exists yet.",
        traceId,
        errorCode: null,
        createdAt: now,
      });
      events.push({
        id: `event_${hashText(`${tickId}:empty`)}`,
        simulationRunId,
        simulationTickId: tickId,
        tick: tickIndex,
        tickIndex,
        timeWindow: seedContext.timeWindow,
        timeLabel,
        version: "local-deterministic-v0",
        eventType: "empty_slot",
        summary: "No Relation Edge was available, so no evidence event was generated.",
        agentIds: [],
        involvedAgentIds: [],
        relationEdgeIds: [],
        beforeState: { weights: {} },
        afterState: { weights: {} },
        edgeWeightDeltas: {},
        confidence: 0,
        source: "local_tick_engine_v0",
        traceId,
        status: "empty",
        createdAt: now,
      });
      continue;
    }

    const beforeWeights = currentWeights.get(edge.id) ?? edge.weights;
    const delta = deltaForEdge(edge, tickIndex);
    const afterWeights = applyDelta(beforeWeights, delta);
    currentWeights.set(edge.id, afterWeights);

    const tickId = `tick_${hashText(`${simulationRunId}:${tickIndex}`)}`;
    const eventId = `event_${hashText(`${tickId}:${edge.id}`)}`;
    const snapshot = relationEdges.map((relationEdge) => ({
      edgeId: relationEdge.id,
      weights: currentWeights.get(relationEdge.id) ?? relationEdge.weights,
    }));

    ticks.push({
      id: tickId,
      simulationRunId,
      version: "local-deterministic-v0",
      tickIndex,
      timeLabel,
      environmentState: {
        trackType: seedContext.trackType,
        timeWindow: seedContext.timeWindow,
        focus: seedContext.questionText,
      },
      agentStateSnapshot: agentEcology.agents.map((agent) => ({
        agentId: agent.id,
        confidence: agent.confidence,
      })),
      relationGraphSnapshot: snapshot,
      summary: `Tick ${tickIndex} updates one Relation Edge through local rules and writes Event Log evidence.`,
      traceId,
      errorCode: null,
      createdAt: now,
    });

    events.push({
      id: eventId,
      simulationRunId,
      simulationTickId: tickId,
      tick: tickIndex,
      tickIndex,
      timeWindow: seedContext.timeWindow,
      timeLabel,
      version: "local-deterministic-v0",
      eventType: tickIndex === 1 ? "graph_freeze" : "relation_pressure",
      summary: eventSummary(edge, tickIndex),
      agentIds: [edge.fromAgentId, edge.toAgentId],
      involvedAgentIds: [edge.fromAgentId, edge.toAgentId],
      relationEdgeIds: [edge.id],
      beforeState: {
        weights: {
          [edge.id]: beforeWeights,
        },
      },
      afterState: {
        weights: {
          [edge.id]: afterWeights,
        },
      },
      edgeWeightDeltas: {
        [edge.id]: delta,
      },
      confidence: edge.confidence,
      source: "local_tick_engine_v0",
      traceId,
      status: "preview",
      createdAt: now,
    });
  }

  return { ticks, events, tickCount };
}

export function buildSimulationRunDraft(
  seedContext: SeedContextDraft,
  agentEcology: AgentEcologyDraft,
  relationEdges: RelationEdgeDraft[] = buildRelationEdges(
    seedContext.id,
    agentEcology.agents,
  ),
  status: SimulationRunStatus = "not_ready",
) {
  const now = new Date().toISOString();
  const simulationRunId = `run_${hashText(`${seedContext.id}:simulation`)}`;
  const { ticks, events, tickCount } = buildTickAndEvents(
    simulationRunId,
    seedContext,
    agentEcology,
    relationEdges,
    now,
  );

  return {
    id: simulationRunId,
    seedContextId: seedContext.id,
    version: "local-deterministic-v0",
    status,
    track: seedContext.trackType,
    timeHorizon: seedContext.timeWindow,
    tickCount,
    frozenAgentProfileIds: agentEcology.agents.map((agent) => agent.id),
    frozenRelationEdgeIds: relationEdges.map((edge) => edge.id),
    safetyLevel: "unchecked",
    traceId: `trace_${hashText(`${simulationRunId}:run`)}`,
    modelVersion: "unreleased",
    promptVersion: "unreleased",
    costCents: 0,
    errorCode: null,
    gates: buildGates(agentEcology, relationEdges),
    ticks,
    events,
    agentIds: agentEcology.agents.map((agent) => agent.id),
    relationEdgeIds: relationEdges.map((edge) => edge.id),
    createdAt: now,
    updatedAt: now,
  } satisfies SimulationRunDraft;
}

export function queueSimulationRunDraft(draft: SimulationRunDraft) {
  return {
    ...draft,
    status: "queued" as const,
    updatedAt: new Date().toISOString(),
  };
}

export function blockSimulationRunDraft(draft: SimulationRunDraft) {
  return {
    ...draft,
    status: "blocked" as const,
    safetyLevel: "blocked" as const,
    errorCode: "generation_disabled_until_gates_ready",
    updatedAt: new Date().toISOString(),
  };
}
