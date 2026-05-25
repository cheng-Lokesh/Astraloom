import type { AgentFieldSourceType } from "@/types/agent-profile";
import type { FeedbackRating, FeedbackTargetType } from "@/types/feedback";
import type { StrategyType } from "@/types/report";

export type SourceReliabilityProfile = Record<AgentFieldSourceType, number>;

export type StrategyPreferenceProfile = Partial<Record<StrategyType, number>>;

export type CalibrationSignal = {
  id: string;
  feedbackId: string;
  targetType: FeedbackTargetType;
  targetId: string;
  rating: FeedbackRating;
  effect:
    | "raise_source_reliability"
    | "lower_source_reliability"
    | "raise_strategy_preference"
    | "lower_strategy_preference"
    | "increase_uncertainty"
    | "hold_for_observation";
  weight: number;
  note: string;
};

export type CalibrationProfile = {
  id: string;
  seedContextId: string;
  simulationRunId: string;
  version: "local-calibration-profile-v1";
  sourceReliability: SourceReliabilityProfile;
  agentConfidenceAdjustment: number;
  edgeUncertaintyAdjustment: number;
  strategyPreference: StrategyPreferenceProfile;
  signals: CalibrationSignal[];
  calibrationSnapshot: {
    feedbackCount: number;
    offCount: number;
    usefulCount: number;
    notHappenedYetCount: number;
  };
  historyInvariant: {
    doesNotModifyEventLogs: true;
    doesNotModifyClaims: true;
    doesNotModifyEdgeWeights: true;
    feedbackIsNotAbsoluteFact: true;
  };
  updatedAt: string;
};
