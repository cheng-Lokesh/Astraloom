import type { AgentProfileDraft } from "@/types/agent-profile";

export type RelationType =
  | "self_variant"
  | "authority"
  | "opportunity"
  | "alliance"
  | "dependency"
  | "rivalry"
  | "family"
  | "unknown";

export type RelationWeights = {
  trust: number;
  hostility: number;
  dependency: number;
  attraction: number;
  competition: number;
  informationGap: number;
  resourceControl: number;
  emotionalDebt: number;
};

export type RelationTrend = {
  trustDelta3Ticks: number;
  hostilityDelta3Ticks: number;
  volatility: number;
};

export type RelationEdgeDraft = {
  id: string;
  seedContextId: string;
  version: "local-deterministic-v0";
  fromAgentId: string;
  toAgentId: string;
  relationshipType: RelationType;
  weights: RelationWeights;
  trend: RelationTrend;
  confidence: number;
  evidenceRefs: string[];
  lastInteraction: {
    eventId: null;
    summary: string;
    tick: 0;
  };
  createdAt: string;
  updatedAt: string;
};

export type RelationGraphDraft = {
  seedContextId: string;
  version: "local-deterministic-v0";
  agents: AgentProfileDraft[];
  edges: RelationEdgeDraft[];
  updatedAt: string;
};
