import type { RelationWeights } from "@/types/relation-edge";
import type { TimeWindow, TrackType } from "@/types/seed-context";
import type { DestinySituationFusionSourceTag } from "./destiny-fusion";

export type SimulationRunStatus = "not_ready" | "queued" | "blocked";

export type SimulationBranchId = "baseline" | "cautious_self" | "decisive_self";

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

export type SimulationEventType =
  | "graph_freeze"
  | "avoidance"
  | "cooperation"
  | "direct_conflict"
  | "disclosure"
  | "resource_competition"
  | "support"
  | "opportunity_signal"
  | "information_gap_widening"
  | "relation_pressure"
  | "agent_signal"
  | "empty_slot";

export type SimulationTickDraft = {
  id: string;
  simulationRunId: string;
  version: "local-deterministic-v0";
  branchId?: SimulationBranchId;
  tickIndex: number;
  timeLabel: string;
  environmentState: {
    trackType: TrackType;
    timeWindow: TimeWindow;
    focus: string;
    branchId?: SimulationBranchId;
    branchLabel?: string;
    tickPolicy?: string;
    tickIndex?: number;
    safetyLevel?: string;
  };
  agentStateSnapshot: Array<{
    agentId: string;
    branchId?: SimulationBranchId;
    confidence: number;
    stance?: string;
    stress?: number;
  }>;
  relationGraphSnapshot: Array<{
    edgeId: string;
    weights: RelationWeights;
  }>;
  eventLogIds?: string[];
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
  branchId?: SimulationBranchId;
  eventType: SimulationEventType;
  summary: string;
  participants?: string[];
  causes?: string[];
  action?: string;
  userFacingEventTitle?: string;
  pathLabel?: string;
  destinyInfluenceSummary?: string;
  fusionThemeIds?: string[];
  interactionSummary?: string;
  pressureDeltaSummary?: string;
  informationGapDeltaSummary?: string;
  resourcePressureDeltaSummary?: string;
  generatedClues?: string[];
  sourceTags?: DestinySituationFusionSourceTag[];
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
  evidence?: {
    sourceAgentIds: string[];
    sourceRelationEdgeIds: string[];
    ruleIds: string[];
    evidenceRefs: string[];
  };
  confidence: number;
  source: "local_tick_engine_v0" | "simulation_engine_v1";
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
  frozenAgentProfileSnapshot?: unknown[];
  frozenRelationEdgeSnapshot?: unknown[];
  safetySnapshot?: {
    safetyLevel: "safe" | "caution" | "downgraded" | "blocked" | "unchecked";
    flags: string[];
    allowedActions: string[];
    blockedActions: string[];
    reportRestrictions: string[];
  };
  safetyLevel: "unchecked" | "normal" | "blocked";
  branches?: Array<{
    id: SimulationBranchId;
    label: string;
    tickIds: string[];
    eventIds: string[];
  }>;
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
