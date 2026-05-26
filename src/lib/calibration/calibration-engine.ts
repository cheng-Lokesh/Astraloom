import type { AgentFieldSourceType } from "@/types/agent-profile";
import type { FeedbackDraft, FeedbackLedgerDraft } from "@/types/feedback";
import type { StrategyType } from "@/types/report";

import type {
  CalibrationCorrectionSummary,
  CalibrationProfile,
  CalibrationSignal,
  SourceReliabilityProfile,
  StrategyPreferenceProfile,
} from "./calibration-types";

const storagePrefix = "mirofish.calibration-profile.";

const defaultSourceReliability: SourceReliabilityProfile = {
  user_confirmed: 1,
  chat_inferred: 0.86,
  default: 0.72,
  model_inferred: 0.78,
};

const strategyTypes: StrategyType[] = [
  "observe",
  "communicate",
  "delay",
  "proceed",
  "boundary",
  "information_fill",
  "resource_exchange",
  "exit_prepare",
];

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function clamp(value: number, min = 0.35, max = 1.15) {
  return Math.max(min, Math.min(max, Number(value.toFixed(2))));
}

function correctionWeight(confidence: "low" | "medium" | "high") {
  if (confidence === "high") return 0.135;
  if (confidence === "medium") return 0.09;
  return 0.045;
}

function sourceTypeFromFeedback(feedback: FeedbackDraft): AgentFieldSourceType {
  const text = `${feedback.targetId} ${feedback.note}`.toLowerCase();
  if (text.includes("model")) return "model_inferred";
  if (text.includes("chat")) return "chat_inferred";
  if (text.includes("default")) return "default";
  if (feedback.targetType === "agent") return "model_inferred";
  return "chat_inferred";
}

export function strategyTypeFromFeedback(
  feedback: Pick<FeedbackDraft, "targetId" | "note">,
): StrategyType {
  const text = `${feedback.targetId} ${feedback.note}`.toLowerCase();
  return strategyTypes.find((strategyType) =>
    text.includes(strategyType.replace("_", " ")),
  ) ?? strategyTypes.find((strategyType) => text.includes(strategyType)) ?? "observe";
}

function primarySignalFromFeedback(feedback: FeedbackDraft): CalibrationSignal {
  const sourceType = sourceTypeFromFeedback(feedback);
  const strategyType = strategyTypeFromFeedback(feedback);

  if (feedback.rating === "off") {
    return {
      id: `signal_${hashText(feedback.id)}`,
      feedbackId: feedback.id,
      targetType: feedback.targetType,
      targetId: feedback.targetId,
      rating: feedback.rating,
      effect:
        feedback.targetType === "strategy"
          ? "lower_strategy_preference"
          : "lower_source_reliability",
      weight: feedback.targetType === "strategy" ? -0.12 : -0.1,
      note:
        feedback.targetType === "strategy"
          ? strategyType
          : `source_type:${sourceType}`,
    };
  }

  if (feedback.rating === "useful") {
    return {
      id: `signal_${hashText(feedback.id)}`,
      feedbackId: feedback.id,
      targetType: feedback.targetType,
      targetId: feedback.targetId,
      rating: feedback.rating,
      effect:
        feedback.targetType === "strategy"
          ? "raise_strategy_preference"
          : "raise_source_reliability",
      weight: feedback.targetType === "strategy" ? 0.14 : 0.04,
      note:
        feedback.targetType === "strategy"
          ? strategyType
          : `source_type:${sourceType}`,
    };
  }

  if (feedback.rating === "accurate" || feedback.rating === "partly_right") {
    return {
      id: `signal_${hashText(feedback.id)}`,
      feedbackId: feedback.id,
      targetType: feedback.targetType,
      targetId: feedback.targetId,
      rating: feedback.rating,
      effect: "raise_source_reliability",
      weight: feedback.rating === "accurate" ? 0.06 : 0.03,
      note: `source_type:${sourceType}`,
    };
  }

  if (feedback.rating === "not_useful") {
    return {
      id: `signal_${hashText(feedback.id)}`,
      feedbackId: feedback.id,
      targetType: feedback.targetType,
      targetId: feedback.targetId,
      rating: feedback.rating,
      effect: "lower_strategy_preference",
      weight: -0.08,
      note: strategyType,
    };
  }

  return {
    id: `signal_${hashText(feedback.id)}`,
    feedbackId: feedback.id,
    targetType: feedback.targetType,
    targetId: feedback.targetId,
    rating: feedback.rating,
    effect:
      feedback.rating === "not_happened_yet"
        ? "hold_for_observation"
        : "increase_uncertainty",
    weight: feedback.rating === "not_happened_yet" ? 0.04 : 0.05,
    note: "Feedback records uncertainty; it is not treated as absolute fact.",
  };
}

function correctionSignalsFromFeedback(
  feedback: FeedbackDraft,
): CalibrationSignal[] {
  const signals: CalibrationSignal[] = [];

  if (feedback.agentCorrection) {
    signals.push({
      id: `signal_agent_correction_${hashText(feedback.id)}`,
      feedbackId: feedback.id,
      targetType: feedback.targetType,
      targetId: feedback.targetId,
      rating: feedback.rating,
      effect: "agent_field_correction",
      weight: correctionWeight(feedback.agentCorrection.confidence),
      note: `${feedback.agentCorrection.field}:${feedback.agentCorrection.suggestedValue}`,
    });
  }

  if (feedback.relationCorrection) {
    signals.push({
      id: `signal_relation_correction_${hashText(feedback.id)}`,
      feedbackId: feedback.id,
      targetType: feedback.targetType,
      targetId: feedback.targetId,
      rating: feedback.rating,
      effect: "relation_field_correction",
      weight: correctionWeight(feedback.relationCorrection.confidence),
      note: `${feedback.relationCorrection.field}:${feedback.relationCorrection.suggestedValue}`,
    });
  }

  return signals;
}

function signalsFromFeedback(feedback: FeedbackDraft): CalibrationSignal[] {
  return [
    primarySignalFromFeedback(feedback),
    ...correctionSignalsFromFeedback(feedback),
  ];
}

function correctionSummaryFromFeedback(
  feedback: FeedbackDraft,
  type: "agent" | "relation",
): CalibrationCorrectionSummary | null {
  const correction =
    type === "agent" ? feedback.agentCorrection : feedback.relationCorrection;
  if (!correction) return null;

  return {
    feedbackId: feedback.id,
    targetId: feedback.targetId,
    field: correction.field,
    suggestedValue: correction.suggestedValue,
    confidence: correction.confidence,
    weight: correctionWeight(correction.confidence),
  };
}

export function buildCalibrationProfile(
  ledger: FeedbackLedgerDraft,
): CalibrationProfile {
  const signals = ledger.feedback.flatMap(signalsFromFeedback);
  const sourceReliability = { ...defaultSourceReliability };
  const strategyPreference: StrategyPreferenceProfile = {};
  let edgeUncertaintyAdjustment = 0;
  let agentCorrectionAdjustment = 0;

  signals.forEach((signal) => {
    if (
      signal.effect === "lower_source_reliability" ||
      signal.effect === "raise_source_reliability"
    ) {
      const sourceType = signal.note.replace(
        "source_type:",
        "",
      ) as AgentFieldSourceType;
      sourceReliability[sourceType] = clamp(
        (sourceReliability[sourceType] ?? 0.75) + signal.weight,
      );
    }

    if (
      signal.effect === "raise_strategy_preference" ||
      signal.effect === "lower_strategy_preference"
    ) {
      const strategyType = signal.note as StrategyType;
      strategyPreference[strategyType] = clamp(
        (strategyPreference[strategyType] ?? 1) + signal.weight,
        0.4,
        1.4,
      );
    }

    if (
      signal.effect === "increase_uncertainty" ||
      signal.effect === "hold_for_observation" ||
      signal.effect === "relation_field_correction"
    ) {
      edgeUncertaintyAdjustment += signal.weight;
    }

    if (signal.effect === "agent_field_correction") {
      agentCorrectionAdjustment += signal.weight;
    }
  });

  const agentCorrections = ledger.feedback.flatMap((feedback) => {
    const summary = correctionSummaryFromFeedback(feedback, "agent");
    return summary ? [summary] : [];
  });
  const relationCorrections = ledger.feedback.flatMap((feedback) => {
    const summary = correctionSummaryFromFeedback(feedback, "relation");
    return summary ? [summary] : [];
  });
  const offCount = ledger.feedback.filter((item) => item.rating === "off").length;
  const usefulCount = ledger.feedback.filter(
    (item) => item.rating === "useful",
  ).length;
  const notHappenedYetCount = ledger.feedback.filter(
    (item) => item.rating === "not_happened_yet",
  ).length;

  return {
    id: `calibration_${hashText(`${ledger.seedContextId}:${ledger.simulationRunId}`)}`,
    seedContextId: ledger.seedContextId,
    simulationRunId: ledger.simulationRunId,
    version: "local-calibration-profile-v1",
    sourceReliability,
    agentConfidenceAdjustment: Math.max(
      -18,
      Math.round(-offCount * 3 + usefulCount + agentCorrectionAdjustment * 10),
    ),
    edgeUncertaintyAdjustment: Math.min(
      24,
      Math.round(edgeUncertaintyAdjustment * 100 + offCount * 2),
    ),
    strategyPreference,
    signals,
    agentCorrections,
    relationCorrections,
    calibrationSnapshot: {
      feedbackCount: ledger.feedback.length,
      offCount,
      usefulCount,
      notHappenedYetCount,
      agentCorrectionCount: agentCorrections.length,
      relationCorrectionCount: relationCorrections.length,
    },
    historyInvariant: {
      doesNotModifyEventLogs: true,
      doesNotModifyClaims: true,
      doesNotModifyEdgeWeights: true,
      feedbackIsNotAbsoluteFact: true,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function saveCalibrationProfile(profile: CalibrationProfile) {
  if (typeof window === "undefined") return profile;
  window.localStorage.setItem(
    `${storagePrefix}${profile.seedContextId}`,
    JSON.stringify(profile),
  );
  return profile;
}

export function loadCalibrationProfile(seedContextId: string) {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`${storagePrefix}${seedContextId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CalibrationProfile;
  } catch {
    window.localStorage.removeItem(`${storagePrefix}${seedContextId}`);
    return null;
  }
}
