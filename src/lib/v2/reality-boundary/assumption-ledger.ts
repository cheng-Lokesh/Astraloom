import { normalizeRealityBoundaryTextV2 } from "./evidence-ledger";
import type {
  AssumptionInputV2,
  AssumptionLedgerV2,
  AssumptionReadinessV2,
  AssumptionV2,
  EvidenceLedgerV2,
  RealityBoundaryRuntimeV2,
} from "./types";
import { REALITY_BOUNDARY_SCHEMA_VERSION_V2 } from "./types";
import { assertAssumptionLedgerV2 } from "./validation";

function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(values.map(normalizeRealityBoundaryTextV2).filter(Boolean)),
  );
}

function normalizeAssumptionInput(
  assumption: AssumptionInputV2,
): AssumptionInputV2 {
  const requiresConfirmation =
    assumption.subjectType === "third_party" &&
    assumption.impactLevel === "high";
  return {
    ...assumption,
    statement: normalizeRealityBoundaryTextV2(assumption.statement),
    category: normalizeRealityBoundaryTextV2(assumption.category),
    supportingRealEvidenceIds: uniqueStrings(
      assumption.supportingRealEvidenceIds,
    ),
    contradictingRealEvidenceIds: uniqueStrings(
      assumption.contradictingRealEvidenceIds,
    ),
    limitations: uniqueStrings(assumption.limitations),
    confirmationRequirement: requiresConfirmation
      ? "required"
      : assumption.confirmationRequirement,
    confirmationStatus:
      requiresConfirmation && assumption.confirmationStatus === "not_required"
        ? "pending"
        : assumption.confirmationStatus,
    parameterRange: assumption.parameterRange
      ? { ...assumption.parameterRange, unit: assumption.parameterRange.unit.trim() }
      : undefined,
    legacyHeuristic: assumption.legacyHeuristic
      ? { ...assumption.legacyHeuristic }
      : undefined,
  };
}

function assumptionFingerprint(
  seedContextId: string,
  assumption: AssumptionInputV2,
) {
  return JSON.stringify({
    seedContextId,
    statement: assumption.statement.toLowerCase(),
    subjectType: assumption.subjectType,
    category: assumption.category.toLowerCase(),
  });
}

export function buildAssumptionLedgerV2({
  seedContextId,
  evidenceLedger,
  assumptions: rawAssumptions,
  runtime,
}: {
  seedContextId: string;
  evidenceLedger: EvidenceLedgerV2;
  assumptions: AssumptionInputV2[];
  runtime: RealityBoundaryRuntimeV2;
}): AssumptionLedgerV2 {
  const now = runtime.clock();
  const assumptions = rawAssumptions.map((rawAssumption): AssumptionV2 => {
    const assumption = normalizeAssumptionInput(rawAssumption);
    return {
      ...assumption,
      id:
        assumption.id ??
        runtime.idFactory(
          "assumption",
          assumptionFingerprint(seedContextId, assumption),
        ),
      factStatus: "not_real_world_fact",
      createdAt: now,
      updatedAt: now,
    };
  });

  const ledger: AssumptionLedgerV2 = {
    id: runtime.idFactory("assumption_ledger", seedContextId),
    seedContextId: normalizeRealityBoundaryTextV2(seedContextId),
    schemaVersion: REALITY_BOUNDARY_SCHEMA_VERSION_V2,
    revision: 0,
    createdAt: now,
    updatedAt: now,
    assumptions,
  };

  return assertAssumptionLedgerV2(ledger, evidenceLedger);
}

export function evaluateAssumptionReadinessV2(
  assumption: AssumptionInputV2 | AssumptionV2,
): AssumptionReadinessV2 {
  if (
    assumption.epistemicStatus === "disputed" ||
    assumption.epistemicStatus === "rejected"
  ) {
    return {
      status: "not_ready",
      downstreamReady: false,
      visible: true,
      reasons: [`epistemic_status_${assumption.epistemicStatus}`],
    };
  }

  const highImpactThirdParty =
    assumption.subjectType === "third_party" &&
    assumption.impactLevel === "high";
  if (
    highImpactThirdParty &&
    (assumption.epistemicStatus !== "confirmed_for_simulation" ||
      assumption.confirmationStatus !== "confirmed")
  ) {
    return {
      status: "requires_confirmation",
      downstreamReady: false,
      visible: true,
      reasons: ["high_impact_third_party_confirmation_required"],
    };
  }

  if (assumption.epistemicStatus === "confirmed_for_simulation") {
    return {
      status: "downstream_ready",
      downstreamReady: true,
      visible: true,
      reasons: [],
    };
  }

  return {
    status: "ready_with_visible_assumption",
    downstreamReady: true,
    visible: true,
    reasons: ["assumption_must_remain_visible"],
  };
}

export function confirmAssumptionForSimulationV2(
  assumption: AssumptionV2,
  now: string,
): AssumptionV2 {
  return {
    ...assumption,
    epistemicStatus: "confirmed_for_simulation",
    confirmationRequirement:
      assumption.subjectType === "third_party" &&
      assumption.impactLevel === "high"
        ? "required"
        : assumption.confirmationRequirement,
    confirmationStatus: "confirmed",
    factStatus: "not_real_world_fact",
    updatedAt: now,
  };
}
