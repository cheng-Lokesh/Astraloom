export type FeedbackTargetType =
  | "claim"
  | "agent"
  | "relation_edge"
  | "strategy"
  | "overall";

export type FeedbackRating =
  | "accurate"
  | "partly_right"
  | "off"
  | "useful"
  | "not_useful"
  | "unclear"
  | "not_happened_yet";

export type FeedbackCorrectionConfidence = "low" | "medium" | "high";

export type FeedbackFieldCorrection = {
  field: string;
  suggestedValue: string;
  confidence: FeedbackCorrectionConfidence;
};

export type FeedbackDraft = {
  id: string;
  seedContextId: string;
  simulationRunId: string;
  targetType: FeedbackTargetType;
  targetId: string;
  rating: FeedbackRating;
  note: string;
  agentCorrection?: FeedbackFieldCorrection;
  relationCorrection?: FeedbackFieldCorrection;
  createdAt: string;
  updatedAt: string;
};

export type FeedbackLedgerDraft = {
  seedContextId: string;
  simulationRunId: string;
  version: "local-calibration-v0";
  feedback: FeedbackDraft[];
  updatedAt: string;
};
