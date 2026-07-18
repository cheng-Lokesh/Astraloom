import { describe, expect, it } from "vitest";

import { applyFeedbackToNextRun } from "./apply-feedback-to-next-run";
import type { CalibrationProfile } from "./calibration-types";
import { buildV1CoreChain } from "@/test/v1-fixtures";

function deepSnapshot<T>(value: T): T {
  return structuredClone(value);
}

function clampScore(value: number) {
  return Math.max(1, Math.min(99, Math.round(value)));
}

function omitKeys<T extends object, K extends keyof T>(
  value: T,
  keys: readonly K[],
): Omit<T, K> {
  const omitted = new Set<PropertyKey>(keys);
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !omitted.has(key)),
  ) as Omit<T, K>;
}

function agentFieldsOutsideCalibration(
  agent: ReturnType<typeof buildV1CoreChain>["agents"][number],
) {
  const agentRest = omitKeys(agent, ["confidence", "profileJson"]);
  const profileRest = omitKeys(agent.profileJson, ["source", "fieldSources"]);
  const sourceRest = omitKeys(agent.profileJson.source, ["confidence"]);

  return {
    ...agentRest,
    profileJson: {
      ...profileRest,
      source: sourceRest,
    },
  };
}

function relationFieldsOutsideCalibration(
  edge: ReturnType<typeof buildV1CoreChain>["relationEdges"][number],
) {
  const edgeRest = omitKeys(edge, ["confidence", "trend"]);
  const trendRest = omitKeys(edge.trend, ["volatility"]);

  return {
    ...edgeRest,
    trend: trendRest,
  };
}

describe("Feedback calibration V1 history invariant", () => {
  it("adjusts next-run inputs without modifying historical Event, Claim, or Report", () => {
    const chain = buildV1CoreChain();
    const agentEcologyBefore = deepSnapshot(chain.agentEcology);
    const relationEdgesBefore = deepSnapshot(chain.relationEdges);
    const eventsBefore = deepSnapshot(chain.simulationRun.events);
    const claimsBefore = deepSnapshot(chain.claimLedger.claims);
    const reportBefore = deepSnapshot(chain.report);
    const correctedAgent = chain.agentEcology.agents[0]!;
    const profile: CalibrationProfile = {
      id: "calibration_v1_test",
      seedContextId: chain.seedContext.id,
      simulationRunId: chain.simulationRun.id,
      version: "local-calibration-profile-v1",
      sourceReliability: {
        user_confirmed: 1,
        chat_inferred: 0.8,
        default: 0.7,
        model_inferred: 0.75,
      },
      agentConfidenceAdjustment: -3,
      edgeUncertaintyAdjustment: 5,
      strategyPreference: {},
      signals: [],
      agentCorrections: [
        {
          feedbackId: "feedback_agent_correction",
          targetId: correctedAgent.id,
          field: "motivation.primaryGoal",
          suggestedValue: "Clarify the written offer before committing.",
          confidence: "high",
          weight: 0.135,
        },
      ],
      relationCorrections: [],
      calibrationSnapshot: {
        feedbackCount: 1,
        offCount: 1,
        usefulCount: 0,
        notHappenedYetCount: 0,
        agentCorrectionCount: 1,
        relationCorrectionCount: 0,
      },
      historyInvariant: {
        doesNotModifyEventLogs: true,
        doesNotModifyClaims: true,
        doesNotModifyEdgeWeights: true,
        feedbackIsNotAbsoluteFact: true,
      },
      updatedAt: "2026-01-15T09:00:00.000Z",
    };

    const calibrated = applyFeedbackToNextRun({
      agentEcology: chain.agentEcology,
      relationEdges: chain.relationEdges,
      calibrationProfile: profile,
    });

    expect(chain.agentEcology).toEqual(agentEcologyBefore);
    expect(chain.relationEdges).toEqual(relationEdgesBefore);
    expect(chain.simulationRun.events).toEqual(eventsBefore);
    expect(chain.claimLedger.claims).toEqual(claimsBefore);
    expect(chain.report).toEqual(reportBefore);

    expect(calibrated.agentEcology).not.toBe(chain.agentEcology);
    expect(calibrated.agentEcology.agents).not.toBe(chain.agentEcology.agents);
    expect(calibrated.relationEdges).not.toBe(chain.relationEdges);
    calibrated.agentEcology.agents.forEach((agent, index) => {
      expect(agent).not.toBe(chain.agentEcology.agents[index]);
      expect(agentFieldsOutsideCalibration(agent)).toEqual(
        agentFieldsOutsideCalibration(chain.agentEcology.agents[index]!),
      );
    });
    calibrated.relationEdges.forEach((edge, index) => {
      expect(edge).not.toBe(chain.relationEdges[index]);
      expect(edge.weights).toEqual(chain.relationEdges[index]!.weights);
      expect(relationFieldsOutsideCalibration(edge)).toEqual(
        relationFieldsOutsideCalibration(chain.relationEdges[index]!),
      );
    });

    const calibratedAgent = calibrated.agentEcology.agents.find(
      (agent) => agent.id === correctedAgent.id,
    )!;
    const sourceReliability =
      profile.sourceReliability[correctedAgent.profileJson.source.sourceType];
    expect(calibratedAgent.confidence).toBe(
      clampScore(
        correctedAgent.confidence * sourceReliability +
          profile.agentConfidenceAdjustment,
      ),
    );
    expect(calibratedAgent.profileJson.source.confidence).toBe(
      clampScore(
        correctedAgent.profileJson.source.confidence * sourceReliability +
          profile.agentConfidenceAdjustment,
      ),
    );
    expect(
      calibratedAgent.profileJson.fieldSources["motivation.primaryGoal"],
    ).toBe("user_confirmed");

    const originalEdge = chain.relationEdges[0]!;
    const calibratedEdge = calibrated.relationEdges[0]!;
    expect(calibratedEdge.confidence).toBe(
      clampScore(originalEdge.confidence - profile.edgeUncertaintyAdjustment),
    );
    expect(calibratedEdge.trend.volatility).toBe(
      clampScore(
        originalEdge.trend.volatility + profile.edgeUncertaintyAdjustment,
      ),
    );
  });

  it("preserves exact input references when calibrationProfile is null", () => {
    const chain = buildV1CoreChain();
    const agentEcologyBefore = deepSnapshot(chain.agentEcology);
    const relationEdgesBefore = deepSnapshot(chain.relationEdges);

    const result = applyFeedbackToNextRun({
      agentEcology: chain.agentEcology,
      relationEdges: chain.relationEdges,
      calibrationProfile: null,
    });

    expect(result.calibrationProfile).toBeNull();
    expect(result.agentEcology).toBe(chain.agentEcology);
    expect(result.relationEdges).toBe(chain.relationEdges);
    expect(result.agentEcology.agents).toBe(chain.agentEcology.agents);
    expect(chain.agentEcology).toEqual(agentEcologyBefore);
    expect(chain.relationEdges).toEqual(relationEdgesBefore);
  });
});
