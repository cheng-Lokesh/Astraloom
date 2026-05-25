import type { AgentEcologyDraft, AgentProfileDraft } from "@/types/agent-profile";
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
    },
  };
}

function calibrateEdgeUncertainty(
  edge: RelationEdgeDraft,
  profile: CalibrationProfile,
): RelationEdgeDraft {
  const uncertainty = profile.edgeUncertaintyAdjustment;

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
