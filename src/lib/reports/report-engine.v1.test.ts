import { describe, expect, it } from "vitest";

import { buildReportEngineV1 } from "./report-engine";
import { buildV1CoreChain } from "@/test/v1-fixtures";

describe("Report Engine V1 baseline", () => {
  it("consumes only claims whose internal Event references exist", () => {
    const { seedContext, simulationRun, claimLedger, agents, relationEdges } =
      buildV1CoreChain();
    const invalidClaim = {
      ...claimLedger.claims[0]!,
      id: "claim_invalid_event_reference",
      evidenceEventIds: ["event_missing"],
    };
    const report = buildReportEngineV1({
      seedContext,
      simulationRun,
      claims: [...claimLedger.claims, invalidClaim],
      agents,
      relationEdges,
    });

    expect(report.invariant.claimIds).toEqual(
      claimLedger.claims.map((claim) => claim.id),
    );
    expect(report.invariant.claimIds).not.toContain(invalidClaim.id);
    expect(report.freePreview.claimIds).toEqual(report.paidReport.claimIds);
    expect(report.invariant.paidDoesNotCreateClaims).toBe(true);
    expect(report.invariant.paidDoesNotRaiseConfidence).toBe(true);
    expect(report.invariant.paidDoesNotChangeRiskLevel).toBe(true);
  });
});
