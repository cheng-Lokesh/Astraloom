import { describe, expect, it } from "vitest";

import {
  buildAssumptionLedgerV2,
  confirmAssumptionForSimulationV2,
  evaluateAssumptionReadinessV2,
} from "./assumption-ledger";
import { buildEvidenceLedgerV2 } from "./evidence-ledger";
import {
  assumptionInputV2,
  createFixedRuntimeV2,
  evidenceInputV2,
  fixedNowV2,
} from "./test-fixtures";

function evidenceLedger() {
  return buildEvidenceLedgerV2({
    seedContextId: "seed_assumption",
    items: [evidenceInputV2()],
    runtime: createFixedRuntimeV2(),
  });
}

describe("Assumption Ledger V2", () => {
  it("rejects supporting or contradicting references outside the Evidence Ledger", () => {
    expect(() =>
      buildAssumptionLedgerV2({
        seedContextId: "seed_assumption",
        evidenceLedger: evidenceLedger(),
        assumptions: [
          assumptionInputV2({
            supportingRealEvidenceIds: ["real_evidence_v2_missing"],
          }),
        ],
        runtime: createFixedRuntimeV2(),
      }),
    ).toThrow(/evidence/i);
  });

  it("rejects the same evidence id as both support and contradiction", () => {
    const evidence = evidenceLedger();
    const evidenceId = evidence.items[0]!.id;

    expect(() =>
      buildAssumptionLedgerV2({
        seedContextId: "seed_assumption",
        evidenceLedger: evidence,
        assumptions: [
          assumptionInputV2({
            supportingRealEvidenceIds: [evidenceId],
            contradictingRealEvidenceIds: [evidenceId],
          }),
        ],
        runtime: createFixedRuntimeV2(),
      }),
    ).toThrow(/both/i);
  });

  it("requires confirmation for an unconfirmed high-impact third-party assumption", () => {
    const readiness = evaluateAssumptionReadinessV2(assumptionInputV2());

    expect(readiness).toEqual({
      status: "requires_confirmation",
      downstreamReady: false,
      visible: true,
      reasons: ["high_impact_third_party_confirmation_required"],
    });
  });

  it("user confirmation marks simulation use only and never creates a fact", () => {
    const ledger = buildAssumptionLedgerV2({
      seedContextId: "seed_assumption",
      evidenceLedger: evidenceLedger(),
      assumptions: [assumptionInputV2()],
      runtime: createFixedRuntimeV2(),
    });
    const confirmed = confirmAssumptionForSimulationV2(
      ledger.assumptions[0]!,
      fixedNowV2,
    );

    expect(confirmed.epistemicStatus).toBe("confirmed_for_simulation");
    expect(confirmed.confirmationStatus).toBe("confirmed");
    expect(confirmed.factStatus).toBe("not_real_world_fact");
    expect(evaluateAssumptionReadinessV2(confirmed).status).toBe(
      "downstream_ready",
    );
  });

  it.each(["low", "medium"] as const)(
    "keeps a %s-impact inference ready but visibly assumed",
    (impactLevel) => {
      const readiness = evaluateAssumptionReadinessV2(
        assumptionInputV2({
          subjectType: "external_variable",
          category: "timing",
          impactLevel,
          confirmationRequirement: "not_required",
          confirmationStatus: "not_required",
        }),
      );

      expect(readiness.status).toBe("ready_with_visible_assumption");
      expect(readiness.downstreamReady).toBe(true);
      expect(readiness.visible).toBe(true);
    },
  );

  it.each(["disputed", "rejected"] as const)(
    "does not mark a %s assumption downstream-ready",
    (epistemicStatus) => {
      const readiness = evaluateAssumptionReadinessV2(
        assumptionInputV2({ epistemicStatus }),
      );

      expect(readiness.status).toBe("not_ready");
      expect(readiness.downstreamReady).toBe(false);
    },
  );

  it.each([
    { min: 10, max: 5, defaultValue: 7, unit: "days" },
    { min: 1, max: 5, defaultValue: 8, unit: "days" },
    { min: 1, max: 5, defaultValue: 3, unit: "" },
  ])("rejects an invalid parameter range %#", (parameterRange) => {
    expect(() =>
      buildAssumptionLedgerV2({
        seedContextId: "seed_assumption",
        evidenceLedger: evidenceLedger(),
        assumptions: [assumptionInputV2({ parameterRange })],
        runtime: createFixedRuntimeV2(),
      }),
    ).toThrow(/parameter/i);
  });
});
