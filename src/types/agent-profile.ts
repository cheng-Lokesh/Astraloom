export type AgentType = "self" | "parallel_self" | "npc";

export type AgentStance =
  | "baseline"
  | "cautious_parallel"
  | "decisive_parallel"
  | "confirmed_npc";

export type AgentProfileJson = {
  stance: AgentStance;
  role: string;
  origin: string;
  traits: string[];
  constraints: string[];
};

export type AgentProfileDraft = {
  id: string;
  seedContextId: string;
  sourceKeyPersonId: string | null;
  agentType: AgentType;
  label: string;
  role: string;
  profileJson: AgentProfileJson;
  promptVersion: "unreleased";
  modelVersion: "unreleased";
  createdAt: string;
  updatedAt: string;
};

export type AgentEcologyDraft = {
  seedContextId: string;
  includeParallelSelves: boolean;
  agents: AgentProfileDraft[];
  updatedAt: string;
};
