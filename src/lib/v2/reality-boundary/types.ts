export const REALITY_BOUNDARY_SCHEMA_VERSION_V2 = "2.0" as const;

export type RealEvidenceIdV2 = `real_evidence_v2_${string}`;
export type AssumptionIdV2 = `assumption_v2_${string}`;

export type EvidenceSourceKindV2 =
  | "user_statement"
  | "user_material"
  | "external_source"
  | "search_summary"
  | "official_record";

export type EvidenceSourceTierV2 =
  | "unrated"
  | "tier_1_user_confirmed"
  | "tier_1_primary_official"
  | "tier_2_reputable_secondary"
  | "tier_3_contextual_public";

export type EvidenceVerificationStatusV2 =
  | "unverified"
  | "user_confirmed"
  | "source_verified"
  | "disputed";

export type EvidenceProvenanceV2 = {
  sourceRef: string;
  capturedAt: string;
  occurredAt?: string;
  locator?: string;
  url?: string;
  title?: string;
  excerpt?: string;
};

export type LegacyHeuristicAuditV2 = {
  legacyHeuristicConfidence: number;
  interpretation: "non-probabilistic";
};

export type EvidenceItemInputV2 = {
  id?: RealEvidenceIdV2;
  statement: string;
  claimKey?: string;
  sourceKind: EvidenceSourceKindV2;
  sourceTier: EvidenceSourceTierV2;
  verificationStatus: EvidenceVerificationStatusV2;
  provenance: EvidenceProvenanceV2[];
  limitations: string[];
  legacyHeuristic?: LegacyHeuristicAuditV2;
};

export type EvidenceItemV2 = Omit<EvidenceItemInputV2, "id"> & {
  id: RealEvidenceIdV2;
  seedContextId: string;
  capturedAt: string;
  occurredAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceConflictStatusV2 = "unresolved" | "resolved";

export type EvidenceConflictV2 = {
  id: string;
  claimKey: string;
  evidenceIds: RealEvidenceIdV2[];
  status: EvidenceConflictStatusV2;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceLedgerV2 = {
  id: string;
  seedContextId: string;
  schemaVersion: typeof REALITY_BOUNDARY_SCHEMA_VERSION_V2;
  revision: number;
  createdAt: string;
  updatedAt: string;
  items: EvidenceItemV2[];
  conflicts: EvidenceConflictV2[];
};

export type AssumptionSubjectTypeV2 =
  | "self"
  | "third_party"
  | "organization"
  | "external_variable"
  | "unknown";

export type AssumptionEpistemicStatusV2 =
  | "unknown"
  | "inferred"
  | "disputed"
  | "confirmed_for_simulation"
  | "rejected";

export type AssumptionImpactLevelV2 = "low" | "medium" | "high";
export type AssumptionConfirmationRequirementV2 = "required" | "not_required";
export type AssumptionConfirmationStatusV2 =
  | "pending"
  | "confirmed"
  | "rejected"
  | "not_required";

export type AssumptionParameterRangeV2 = {
  min: number;
  max: number;
  defaultValue: number;
  unit: string;
};

export type AssumptionInputV2 = {
  id?: AssumptionIdV2;
  statement: string;
  subjectType: AssumptionSubjectTypeV2;
  category: string;
  epistemicStatus: AssumptionEpistemicStatusV2;
  impactLevel: AssumptionImpactLevelV2;
  supportingRealEvidenceIds: RealEvidenceIdV2[];
  contradictingRealEvidenceIds: RealEvidenceIdV2[];
  limitations: string[];
  confirmationRequirement: AssumptionConfirmationRequirementV2;
  confirmationStatus: AssumptionConfirmationStatusV2;
  parameterRange?: AssumptionParameterRangeV2;
  legacyHeuristic?: LegacyHeuristicAuditV2;
  legacyHeuristicHistory?: LegacyHeuristicAuditV2[];
};

export type AssumptionV2 = Omit<AssumptionInputV2, "id"> & {
  id: AssumptionIdV2;
  seedContextId: string;
  factStatus: "not_real_world_fact";
  createdAt: string;
  updatedAt: string;
};

export type AssumptionLedgerV2 = {
  id: string;
  seedContextId: string;
  schemaVersion: typeof REALITY_BOUNDARY_SCHEMA_VERSION_V2;
  revision: number;
  createdAt: string;
  updatedAt: string;
  assumptions: AssumptionV2[];
};

export type AssumptionReadinessStatusV2 =
  | "requires_confirmation"
  | "ready_with_visible_assumption"
  | "downstream_ready"
  | "not_ready";

export type AssumptionReadinessV2 = {
  status: AssumptionReadinessStatusV2;
  downstreamReady: boolean;
  visible: true;
  reasons: string[];
};

export type AdaptationWarningV2 = {
  code: string;
  field?: string;
  message: string;
};

export type RealityBoundaryDraftV2 = {
  seedContextId: string;
  schemaVersion: typeof REALITY_BOUNDARY_SCHEMA_VERSION_V2;
  revision: number;
  evidenceLedger: EvidenceLedgerV2;
  assumptionLedger: AssumptionLedgerV2;
  warnings: AdaptationWarningV2[];
  createdAt: string;
  updatedAt: string;
};

export type RealityBoundaryIdKindV2 =
  | "evidence_ledger"
  | "evidence"
  | "evidence_conflict"
  | "assumption_ledger"
  | "assumption";

export type RealityBoundaryIdFactoryV2 = (
  kind: RealityBoundaryIdKindV2,
  fingerprint: string,
) => string;

export type RealityBoundaryRuntimeV2 = {
  clock: () => string;
  idFactory: RealityBoundaryIdFactoryV2;
};
