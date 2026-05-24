import type { RelationWeights } from "@/types/relation-edge";
import type { TimeWindow, TrackType } from "@/types/seed-context";

export type SimulationRunStatus = "not_ready" | "queued" | "blocked";

export type SimulationGateId =
  | "agents"
  | "relation_graph"
  | "tick_queue"
  | "event_log"
  | "safety_checks";

export type SimulationGateStatus = "ready" | "missing" | "blocked";

export type SimulationGateDraft = {
  id: SimulationGateId;
  status: SimulationGateStatus;
  detail: string;
};

export type SimulationEventStatus = "empty" | "preview";

export type SimulationTickDraft = {
  id: string;
  simulationRunId: string;
  version: "local-deterministic-v0";
  tickIndex: number;
  timeLabel: string;
  environmentState: {
    trackType: TrackType;
    timeWindow: TimeWindow;
    focus: string;
  };
  agentStateSnapshot: Array<{
    agentId: string;
    confidence: number;
  }>;
  relationGraphSnapshot: Array<{
    edgeId: string;
    weights: RelationWeights;
  }>;
  summary: string;
  traceId: string;
  errorCode: null;
  createdAt: string;
};

export type SimulationEventDraft = {
  id: string;
  simulationRunId: string;
  simulationTickId: string;
  tick: number;
  tickIndex: number;
  timeWindow: TimeWindow;
  timeLabel: string;
  version: "local-deterministic-v0";
  eventType:
    | "graph_freeze"
    | "relation_pressure"
    | "agent_signal"
    | "empty_slot";
  summary: string;
  agentIds: string[];
  involvedAgentIds: string[];
  relationEdgeIds: string[];
  beforeState: {
    weights: Record<string, RelationWeights>;
  };
  afterState: {
    weights: Record<string, RelationWeights>;
  };
  edgeWeightDeltas: Record<string, Partial<RelationWeights>>;
  confidence: number;
  source: "local_tick_engine_v0";
  traceId: string;
  status: SimulationEventStatus;
  createdAt: string;
};

export type SimulationRunDraft = {
  id: string;
  seedContextId: string;
  version: "local-deterministic-v0";
  status: SimulationRunStatus;
  track: TrackType;
  timeHorizon: TimeWindow;
  tickCount: number;
  frozenAgentProfileIds: string[];
  frozenRelationEdgeIds: string[];
  safetyLevel: "unchecked" | "normal" | "blocked";
  traceId: string;
  modelVersion: "unreleased";
  promptVersion: "unreleased";
  costCents: 0;
  errorCode: string | null;
  gates: SimulationGateDraft[];
  ticks: SimulationTickDraft[];
  events: SimulationEventDraft[];
  agentIds: string[];
  relationEdgeIds: string[];
  createdAt: string;
  updatedAt: string;
};
