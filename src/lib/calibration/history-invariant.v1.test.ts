import { describe, expect, it } from "vitest";

import { applyFeedbackToNextRun } from "./apply-feedback-to-next-run";
import type { CalibrationProfile } from "./calibration-types";
import { buildV1CoreChain } from "@/test/v1-fixtures";

describe("Feedback calibration V1 history invariant", () => {
  it("adjusts next-run inputs without modifying historical Event, Claim, or Report", () => {
    const chain = buildV1CoreChain();
    const historical = JSON.stringify({
      events: chain.simulationRun.events,
      claims: chain.claimLedger.claims,
      report: chain.report,
    });
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
      agentCorrections: [],
      relationCorrections: [],
      calibrationSnapshot: {
        feedbackCount: 1,
        offCount: 1,
        usefulCount: 0,
        notHappenedYetCount: 0,
        agentCorrectionCount: 0,
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

    expect(calibrated.agentEcology).not.toBe(chain.agentEcology);
    expect(calibrated.relationEdges).not.toBe(chain.relationEdges);
    expect(
      JSON.stringify({
        events: chain.simulationRun.events,
        claims: chain.claimLedger.claims,
        report: chain.report,
      }),
    ).toBe(historical);
  });
});
