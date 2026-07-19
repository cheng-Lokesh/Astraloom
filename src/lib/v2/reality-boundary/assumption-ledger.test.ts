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

  it("deterministically merges duplicate assumptions without losing audit context", () => {
    const evidence = buildEvidenceLedgerV2({
      seedContextId: "seed_assumption",
      items: [
        evidenceInputV2(),
        evidenceInputV2({
          statement: "A second source mentions the same constraint.",
          claimKey: undefined,
          provenance: [
            {
              sourceRef: "manual:second",
              locator: "content:0",
              capturedAt: fixedNowV2,
            },
          ],
        }),
        evidenceInputV2({
          statement: "A third source contradicts the constraint.",
          claimKey: undefined,
          provenance: [
            {
              sourceRef: "manual:third",
              locator: "content:0",
              capturedAt: fixedNowV2,
            },
          ],
        }),
      ],
      runtime: createFixedRuntimeV2(),
    });
    const [firstEvidenceId, secondEvidenceId, thirdEvidenceId] = evidence.items.map(
      (item) => item.id,
    );
    const input = [
      assumptionInputV2({
        statement: "  The manager MAY delay the promotion decision. ",
        impactLevel: "medium",
        supportingRealEvidenceIds: [firstEvidenceId!],
        contradictingRealEvidenceIds: [thirdEvidenceId!],
        limitations: ["First limitation."],
        legacyHeuristic: {
          legacyHeuristicConfidence: 42,
          interpretation: "non-probabilistic",
        },
      }),
      assumptionInputV2({
        statement: "the manager may delay the promotion decision.",
        impactLevel: "high",
        supportingRealEvidenceIds: [secondEvidenceId!],
        limitations: ["Second limitation."],
        confirmationRequirement: "not_required",
        confirmationStatus: "not_required",
        legacyHeuristic: {
          legacyHeuristicConfidence: 77,
          interpretation: "non-probabilistic",
        },
      }),
    ];

    const first = buildAssumptionLedgerV2({
      seedContextId: "seed_assumption",
      evidenceLedger: evidence,
      assumptions: input,
      runtime: createFixedRuntimeV2(),
    });
    const second = buildAssumptionLedgerV2({
      seedContextId: "seed_assumption",
      evidenceLedger: evidence,
      assumptions: input,
      runtime: createFixedRuntimeV2(),
    });

    expect(first).toEqual(second);
    expect(first.assumptions).toHaveLength(1);
    expect(first.assumptions[0]).toMatchObject({
      seedContextId: "seed_assumption",
      impactLevel: "high",
      confirmationRequirement: "required",
      confirmationStatus: "pending",
      supportingRealEvidenceIds: [firstEvidenceId, secondEvidenceId],
      contradictingRealEvidenceIds: [thirdEvidenceId],
      limitations: ["First limitation.", "Second limitation."],
    });
    expect(
      first.assumptions[0]?.legacyHeuristicHistory?.map(
        (audit) => audit.legacyHeuristicConfidence,
      ),
    ).toEqual([42, 77]);
  });

  it("merges duplicate status conflicts to the conservative rejected state", () => {
    const ledger = buildAssumptionLedgerV2({
      seedContextId: "seed_assumption",
      evidenceLedger: evidenceLedger(),
      assumptions: [
        assumptionInputV2({
          epistemicStatus: "confirmed_for_simulation",
          confirmationStatus: "confirmed",
        }),
        assumptionInputV2({
          epistemicStatus: "rejected",
          confirmationStatus: "rejected",
        }),
      ],
      runtime: createFixedRuntimeV2(),
    });

    expect(ledger.assumptions).toHaveLength(1);
    expect(ledger.assumptions[0]).toMatchObject({
      epistemicStatus: "rejected",
      confirmationRequirement: "required",
      confirmationStatus: "rejected",
    });
    expect(evaluateAssumptionReadinessV2(ledger.assumptions[0]!).status).toBe(
      "not_ready",
    );
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

  it("treats rejected confirmation as not ready even when epistemic status is inferred", () => {
    const readiness = evaluateAssumptionReadinessV2(
      assumptionInputV2({
        subjectType: "external_variable",
        impactLevel: "medium",
        confirmationRequirement: "not_required",
        confirmationStatus: "rejected",
      }),
    );

    expect(readiness).toMatchObject({ status: "not_ready", downstreamReady: false });
  });

  it.each(["disputed", "rejected"] as const)(
    "refuses to reactivate a %s assumption",
    (epistemicStatus) => {
      const ledger = buildAssumptionLedgerV2({
        seedContextId: "seed_assumption",
        evidenceLedger: evidenceLedger(),
        assumptions: [
          assumptionInputV2({
            epistemicStatus,
            confirmationStatus:
              epistemicStatus === "rejected" ? "rejected" : "pending",
          }),
        ],
        runtime: createFixedRuntimeV2(),
      });

      expect(() =>
        confirmAssumptionForSimulationV2(ledger.assumptions[0]!, fixedNowV2),
      ).toThrowError(
        expect.objectContaining({
          code: "invalid_assumption_confirmation_transition",
        }),
      );
    },
  );

  it.each([
    {
      name: "high-impact third party pending",
      input: assumptionInputV2(),
      readiness: "requires_confirmation",
    },
    {
      name: "high-impact third party confirmed",
      input: assumptionInputV2({
        epistemicStatus: "confirmed_for_simulation",
        confirmationStatus: "confirmed",
      }),
      readiness: "downstream_ready",
    },
    {
      name: "high-impact third party rejected",
      input: assumptionInputV2({
        epistemicStatus: "rejected",
        confirmationStatus: "rejected",
      }),
      readiness: "not_ready",
    },
    {
      name: "disputed external assumption",
      input: assumptionInputV2({
        subjectType: "external_variable",
        impactLevel: "medium",
        epistemicStatus: "disputed",
        confirmationRequirement: "not_required",
        confirmationStatus: "not_required",
      }),
      readiness: "not_ready",
    },
  ])("keeps status-machine combination $name coherent", ({ input, readiness }) => {
    const ledger = buildAssumptionLedgerV2({
      seedContextId: "seed_assumption",
      evidenceLedger: evidenceLedger(),
      assumptions: [input],
      runtime: createFixedRuntimeV2(),
    });

    expect(evaluateAssumptionReadinessV2(ledger.assumptions[0]!).status).toBe(
      readiness,
    );
  });

  it.each([
    {
      epistemicStatus: "rejected" as const,
      confirmationRequirement: "required" as const,
      confirmationStatus: "confirmed" as const,
    },
    {
      epistemicStatus: "confirmed_for_simulation" as const,
      confirmationRequirement: "required" as const,
      confirmationStatus: "pending" as const,
    },
  ])("rejects inconsistent state combination %#", (state) => {
    expect(() =>
      buildAssumptionLedgerV2({
        seedContextId: "seed_assumption",
        evidenceLedger: evidenceLedger(),
        assumptions: [assumptionInputV2(state)],
        runtime: createFixedRuntimeV2(),
      }),
    ).toThrow(/confirmation|status/i);
  });

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
