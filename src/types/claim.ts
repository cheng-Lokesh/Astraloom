export type ClaimType =
  | "risk_window"
  | "opportunity_window"
  | "friction_signal"
  | "coordination_signal";

export type ClaimRiskLevel = "low" | "medium" | "high";

export type ClaimDraft = {
  id: string;
  seedContextId: string;
  simulationRunId: string;
  version: "local-deterministic-v0";
  claimType: ClaimType;
  summary: string;
  confidence: number;
  riskLevel: ClaimRiskLevel;
  evidenceEventIds: string[];
  relatedAgentIds: string[];
  relatedRelationEdgeIds: string[];
  isPaidLocked: false;
  safetyNotes: string[];
  traceId: string;
  createdAt: string;
  updatedAt: string;
};

export type ClaimLedgerDraft = {
  seedContextId: string;
  simulationRunId: string;
  version: "local-deterministic-v0";
  claims: ClaimDraft[];
  updatedAt: string;
};
