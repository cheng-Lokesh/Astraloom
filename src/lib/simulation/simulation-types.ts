import type { AgentEcologyDraft, AgentProfileDraft } from "@/types/agent-profile";
import type { RelationEdgeDraft, RelationWeights } from "@/types/relation-edge";
import type { SeedContextDraft, TimeWindow } from "@/types/seed-context";
import type { DestinySituationFusionDraft } from "@/types/destiny-fusion";
import type {
  SimulationBranchId,
  SimulationEventDraft,
  SimulationEventType,
  SimulationRunDraft,
  SimulationTickDraft,
} from "@/types/simulation-run";

export type SimulationEngineVersion = "simulation_engine_v1";

export type SafetySnapshot = NonNullable<SimulationRunDraft["safetySnapshot"]>;

export type BranchPolicy = {
  id: SimulationBranchId;
  label: string;
  selfBias: "baseline" | "cautious" | "decisive";
  edgePressureBias: number;
  disclosureBias: number;
  cooperationBias: number;
};

export type TickPolicy = {
  tickCount: number;
  timeLabels: string[];
};

export type SimulationRuleSource = {
  ruleId: string;
  agentIds: string[];
  relationEdgeIds: string[];
  evidenceRefs: string[];
};

export type EventPolicyResult = {
  eventType: SimulationEventType;
  causes: string[];
  action: string;
  summary: string;
  ruleSource: SimulationRuleSource;
};

export type EdgeUpdateResult = {
  delta: Partial<RelationWeights>;
  afterWeights: RelationWeights;
  ruleIds: string[];
};

export type ConfidenceInput = {
  edge: RelationEdgeDraft;
  agents: AgentProfileDraft[];
  ruleCount: number;
  tickIndex: number;
};

export type SimulationEngineInput = {
  seedContext: SeedContextDraft;
  agentEcology: AgentEcologyDraft;
  relationEdges: RelationEdgeDraft[];
  destinyFusion?: DestinySituationFusionDraft | null;
  safetySnapshot?: SafetySnapshot;
  status?: SimulationRunDraft["status"];
};

export type SimulationEngineOutput = {
  run: SimulationRunDraft;
  ticks: SimulationTickDraft[];
  events: SimulationEventDraft[];
};

export type TimeWindowSupport = Record<TimeWindow, TickPolicy>;
