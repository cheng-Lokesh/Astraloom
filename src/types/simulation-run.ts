import type { TimeWindow } from "@/types/seed-context";

export type SimulationRunStatus = "not_ready" | "queued" | "blocked";

export type SimulationGateId =
  | "agents"
  | "cost_gate"
  | "prompt_pack"
  | "safety_checks";

export type SimulationGateStatus = "ready" | "missing" | "blocked";

export type SimulationGateDraft = {
  id: SimulationGateId;
  status: SimulationGateStatus;
  detail: string;
};

export type SimulationEventStatus = "empty";

export type SimulationEventDraft = {
  id: string;
  simulationRunId: string;
  tick: number;
  timeWindow: TimeWindow;
  eventType: "empty_slot";
  summary: string;
  involvedAgentIds: string[];
  status: SimulationEventStatus;
  createdAt: string;
};

export type SimulationRunDraft = {
  id: string;
  seedContextId: string;
  status: SimulationRunStatus;
  modelVersion: "unreleased";
  promptVersion: "unreleased";
  costCents: 0;
  errorCode: string | null;
  gates: SimulationGateDraft[];
  events: SimulationEventDraft[];
  agentIds: string[];
  createdAt: string;
  updatedAt: string;
};
