export type AgentType = "self" | "parallel_self" | "npc";

export type AgentStance =
  | "baseline"
  | "cautious_parallel"
  | "decisive_parallel"
  | "confirmed_npc";

export type AgentFieldSourceType =
  | "user_confirmed"
  | "chat_inferred"
  | "default"
  | "model_inferred";

export type AgentProfileJson = {
  stance: AgentStance;
  role: string;
  origin: string;
  relationshipToUser: string;
  source: {
    confidence: number;
    sourceType: AgentFieldSourceType;
    evidenceRefs: string[];
  };
  fieldSources: Record<string, AgentFieldSourceType>;
  motivation: {
    primaryGoal: string;
    fear: string;
    avoidancePattern: string;
  };
  resources: {
    authority: number;
    information: number;
    socialCapital: number;
    emotionalLeverage: number;
  };
  behaviorPolicy: {
    actionSpeed: number;
    initiative: number;
    cooperationBias: number;
    communicationStyle: "silent" | "warm" | "sharp" | "formal" | "unknown";
  };
  state: {
    stress: number;
    trustInUser: number;
    hostilityToUser: number;
    currentIntention: string;
  };
  traits: string[];
  constraints: string[];
  missingFields: string[];
};

export type AgentProfileDraft = {
  id: string;
  seedContextId: string;
  sourceKeyPersonId: string | null;
  agentType: AgentType;
  label: string;
  role: string;
  relationshipToUser: string;
  confidence: number;
  evidenceRefs: string[];
  version: "local-deterministic-v0";
  traceId: string;
  profileJson: AgentProfileJson;
  promptVersion: string;
  modelVersion: string;
  createdAt: string;
  updatedAt: string;
};

export type AgentEcologyDraft = {
  seedContextId: string;
  includeParallelSelves: boolean;
  agents: AgentProfileDraft[];
  updatedAt: string;
};
