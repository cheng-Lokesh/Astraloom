import type {
  AgentEcologyDraft,
  AgentFieldSourceType,
  AgentProfileDraft,
} from "@/types/agent-profile";
import type { RelationEdgeDraft } from "@/types/relation-edge";

import type { CalibrationProfile } from "./calibration-types";

function clampScore(value: number) {
  return Math.max(1, Math.min(99, Math.round(value)));
}

function calibrateAgent(
  agent: AgentProfileDraft,
  profile: CalibrationProfile,
): AgentProfileDraft {
  const sourceType = agent.profileJson.source.sourceType;
  const reliability = profile.sourceReliability[sourceType] ?? 1;
  const agentCorrections = profile.agentCorrections.filter(
    (correction) => correction.targetId === agent.id,
  );
  const correctedFields = agentCorrections.reduce<
    Record<string, AgentFieldSourceType>
  >((fields, correction) => {
    fields[correction.field] = "user_confirmed";
    return fields;
  }, {});

  return {
    ...agent,
    confidence: clampScore(
      agent.confidence * reliability + profile.agentConfidenceAdjustment,
    ),
    profileJson: {
      ...agent.profileJson,
      source: {
        ...agent.profileJson.source,
        confidence: clampScore(
          agent.profileJson.source.confidence * reliability +
            profile.agentConfidenceAdjustment,
        ),
      },
      fieldSources: {
        ...agent.profileJson.fieldSources,
        ...correctedFields,
      },
    },
  };
}

function calibrateEdgeUncertainty(
  edge: RelationEdgeDraft,
  profile: CalibrationProfile,
): RelationEdgeDraft {
  const relationCorrectionUncertainty = profile.relationCorrections
    .filter((correction) => correction.targetId === edge.id)
    .reduce((total, correction) => total + correction.weight, 0);
  const uncertainty =
    profile.edgeUncertaintyAdjustment +
    Math.round(relationCorrectionUncertainty * 100);

  return {
    ...edge,
    confidence: clampScore(edge.confidence - Math.max(0, uncertainty)),
    trend: {
      ...edge.trend,
      volatility: clampScore(edge.trend.volatility + Math.max(0, uncertainty)),
    },
  };
}

export function applyFeedbackToNextRun(input: {
  agentEcology: AgentEcologyDraft;
  relationEdges: RelationEdgeDraft[];
  calibrationProfile: CalibrationProfile | null;
}) {
  if (!input.calibrationProfile) {
    return {
      agentEcology: input.agentEcology,
      relationEdges: input.relationEdges,
      calibrationProfile: null,
    };
  }
  const profile = input.calibrationProfile;

  return {
    agentEcology: {
      ...input.agentEcology,
      agents: input.agentEcology.agents.map((agent) =>
        calibrateAgent(agent, profile),
      ),
      updatedAt: new Date().toISOString(),
    },
    relationEdges: input.relationEdges.map((edge) =>
      calibrateEdgeUncertainty(edge, profile),
    ),
    calibrationProfile: profile,
  };
}
