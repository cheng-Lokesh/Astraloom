import type {
  FeedbackFieldCorrection,
  FeedbackDraft,
  FeedbackLedgerDraft,
  FeedbackRating,
  FeedbackTargetType,
} from "@/types/feedback";

function idPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 28);
}

export function buildEmptyFeedbackLedgerDraft(
  seedContextId: string,
  simulationRunId: string,
): FeedbackLedgerDraft {
  return {
    seedContextId,
    simulationRunId,
    version: "local-calibration-v0",
    feedback: [],
    updatedAt: new Date().toISOString(),
  };
}

export function buildFeedbackDraft(input: {
  seedContextId: string;
  simulationRunId: string;
  targetType: FeedbackTargetType;
  targetId: string;
  rating: FeedbackRating;
  note: string;
  agentCorrection?: FeedbackFieldCorrection;
  relationCorrection?: FeedbackFieldCorrection;
}): FeedbackDraft {
  const now = new Date().toISOString();
  const id = [
    "feedback",
    idPart(input.targetType),
    idPart(input.targetId || "overall"),
    Date.now().toString(36),
  ].join("-");

  return {
    id,
    seedContextId: input.seedContextId,
    simulationRunId: input.simulationRunId,
    targetType: input.targetType,
    targetId: input.targetId,
    rating: input.rating,
    note: input.note.trim(),
    ...(input.agentCorrection ? { agentCorrection: input.agentCorrection } : {}),
    ...(input.relationCorrection
      ? { relationCorrection: input.relationCorrection }
      : {}),
    createdAt: now,
    updatedAt: now,
  };
}
