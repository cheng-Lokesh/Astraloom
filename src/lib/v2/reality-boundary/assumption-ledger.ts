import { normalizeRealityBoundaryTextV2 } from "./evidence-ledger";
import { parseAssumptionIdV2 } from "./ids";
import type {
  AssumptionEpistemicStatusV2,
  AssumptionImpactLevelV2,
  AssumptionInputV2,
  AssumptionLedgerV2,
  AssumptionReadinessV2,
  AssumptionV2,
  EvidenceLedgerV2,
  RealityBoundaryRuntimeV2,
} from "./types";
import { REALITY_BOUNDARY_SCHEMA_VERSION_V2 } from "./types";
import {
  assertAssumptionLedgerV2,
  RealityBoundaryDomainErrorV2,
} from "./validation";

function uniqueStrings<T extends string>(values: T[]): T[] {
  return Array.from(
    new Set(values.map(normalizeRealityBoundaryTextV2).filter(Boolean)),
  ) as T[];
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
    legacyHeuristicHistory: assumption.legacyHeuristicHistory?.map((audit) => ({
      ...audit,
    })),
  };
}

function assumptionDedupKey(assumption: AssumptionInputV2) {
  return JSON.stringify([
    assumption.statement.toLowerCase(),
    assumption.subjectType,
    assumption.category.toLowerCase(),
  ]);
}

const impactRank: Record<AssumptionImpactLevelV2, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

const epistemicRank: Record<AssumptionEpistemicStatusV2, number> = {
  confirmed_for_simulation: 0,
  inferred: 1,
  unknown: 2,
  disputed: 3,
  rejected: 4,
};

function conservativeImpact(
  first: AssumptionImpactLevelV2,
  second: AssumptionImpactLevelV2,
) {
  return impactRank[first] >= impactRank[second] ? first : second;
}

function conservativeEpistemicStatus(
  first: AssumptionEpistemicStatusV2,
  second: AssumptionEpistemicStatusV2,
) {
  return epistemicRank[first] >= epistemicRank[second] ? first : second;
}

function uniqueLegacyHeuristics(
  assumptions: AssumptionInputV2[],
) {
  const audits = assumptions.flatMap((assumption) => [
    ...(assumption.legacyHeuristic ? [assumption.legacyHeuristic] : []),
    ...(assumption.legacyHeuristicHistory ?? []),
  ]);
  return Array.from(
    new Map(
      audits.map((audit) => [
        `${audit.legacyHeuristicConfidence}:${audit.interpretation}`,
        { ...audit },
      ]),
    ).values(),
  );
}

function mergeDuplicateAssumption(
  existing: AssumptionV2,
  duplicate: AssumptionInputV2,
): AssumptionV2 {
  const impactLevel = conservativeImpact(
    existing.impactLevel,
    duplicate.impactLevel,
  );
  const epistemicStatus = conservativeEpistemicStatus(
    existing.epistemicStatus,
    duplicate.epistemicStatus,
  );
  const confirmationRequirement =
    (existing.subjectType === "third_party" && impactLevel === "high") ||
    existing.confirmationRequirement === "required" ||
    duplicate.confirmationRequirement === "required"
      ? "required"
      : "not_required";
  const confirmationStatus =
    epistemicStatus === "rejected"
      ? "rejected"
      : epistemicStatus === "confirmed_for_simulation"
        ? "confirmed"
        : confirmationRequirement === "required"
          ? "pending"
          : "not_required";
  const legacyHeuristicHistory = uniqueLegacyHeuristics([
    existing,
    duplicate,
  ]);

  return {
    ...existing,
    epistemicStatus,
    impactLevel,
    supportingRealEvidenceIds: uniqueStrings([
      ...existing.supportingRealEvidenceIds,
      ...duplicate.supportingRealEvidenceIds,
    ]),
    contradictingRealEvidenceIds: uniqueStrings([
      ...existing.contradictingRealEvidenceIds,
      ...duplicate.contradictingRealEvidenceIds,
    ]),
    limitations: uniqueStrings([
      ...existing.limitations,
      ...duplicate.limitations,
    ]),
    confirmationRequirement,
    confirmationStatus,
    legacyHeuristicHistory:
      legacyHeuristicHistory.length > 0 ? legacyHeuristicHistory : undefined,
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
  const assumptionsByKey = new Map<string, AssumptionV2>();
  for (const rawAssumption of rawAssumptions) {
    const assumption = normalizeAssumptionInput(rawAssumption);
    const key = assumptionDedupKey(assumption);
    const existing = assumptionsByKey.get(key);
    if (existing) {
      assumptionsByKey.set(
        key,
        mergeDuplicateAssumption(existing, assumption),
      );
      continue;
    }
    const generatedId = runtime.idFactory(
      "assumption",
      assumptionFingerprint(seedContextId, assumption),
    );
    const item: AssumptionV2 = {
      ...assumption,
      id:
        assumption.id ??
        parseAssumptionIdV2(generatedId) ??
        (generatedId as AssumptionV2["id"]),
      seedContextId: normalizeRealityBoundaryTextV2(seedContextId),
      factStatus: "not_real_world_fact",
      createdAt: now,
      updatedAt: now,
    };
    assumptionsByKey.set(key, item);
  }
  const assumptions = Array.from(assumptionsByKey.values());

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
  if (assumption.confirmationStatus === "rejected") {
    return {
      status: "not_ready",
      downstreamReady: false,
      visible: true,
      reasons: ["confirmation_status_rejected"],
    };
  }
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
  if (
    assumption.epistemicStatus === "disputed" ||
    assumption.epistemicStatus === "rejected" ||
    assumption.confirmationStatus === "rejected"
  ) {
    throw new RealityBoundaryDomainErrorV2(
      "invalid_assumption_confirmation_transition",
      "Rejected or disputed assumptions cannot be reactivated for simulation.",
    );
  }
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
