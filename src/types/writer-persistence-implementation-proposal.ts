import type { WriterPersistenceNoGoMode } from "@/types/writer-persistence-no-go";

export type WriterPersistenceImplementationProposalMode =
  "persistence_adapter_implementation_proposal_scaffold_only";

export type WriterPersistenceImplementationProposalCategory =
  | "scope_boundary"
  | "module_boundary"
  | "phase_sequence"
  | "transaction_idempotency"
  | "audit_redaction"
  | "rollback_compensation"
  | "service_role_security"
  | "test_evidence"
  | "rollout_observability"
  | "implementation_handoff"
  | "non_goal";

export type WriterPersistenceImplementationProposalStatus =
  | "scaffolded"
  | "blocked_by_no_go"
  | "manual_required";

export type WriterPersistenceImplementationProposalOwner =
  | "backend"
  | "security"
  | "qa"
  | "operator"
  | "founder";

export type WriterPersistenceImplementationProposalSection = {
  id: string;
  category: WriterPersistenceImplementationProposalCategory;
  title: string;
  status: WriterPersistenceImplementationProposalStatus;
  owner: WriterPersistenceImplementationProposalOwner;
  intent: string;
  proposedShape: string[];
  requiredBeforeImplementation: string[];
  sourceRefs: string[];
  sourceNoGoItemIds: string[];
  futureFiles: string[];
  forbiddenNow: string[];
};

export type WriterPersistenceImplementationProposalPayload = {
  safeMode: true;
  readOnly: true;
  scaffoldMode: WriterPersistenceImplementationProposalMode;
  sourceNoGoMode: WriterPersistenceNoGoMode;
  checkedAt: string;
  sectionCount: number;
  scaffoldedSectionCount: number;
  blockedSectionCount: number;
  manualRequiredSectionCount: number;
  sourceNoGoItemCount: number;
  sourceNoGoBlockedItemCount: number;
  sourceNoGoManualRequiredItemCount: number;
  sourceNoGoRouteInvariantCount: number;
  proposalScaffoldReady: true;
  proposalScaffoldOnly: true;
  sourceNoGoPacketReady: true;
  sourceNoGoEvidenceComplete: false;
  implementationProposalAccepted: false;
  implementationProposalAllowed: false;
  implementationPlanApproved: false;
  readyToCreateImplementationBranch: false;
  readyForAdapterImplementation: false;
  schemaVerified: false;
  adapterImplemented: false;
  adapterImplementationApproved: false;
  adapterImplementationAllowed: false;
  implementationReviewComplete: false;
  allBlockingEvidenceReady: false;
  allRuntimeEffectsBlocked: true;
  wouldCreateImplementationPlan: false;
  wouldCreateImplementationBranch: false;
  wouldCreateAdapterCode: false;
  wouldImportRealWriterImplementation: false;
  wouldRunTransaction: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldPersistEvidence: false;
  wouldStoreRawPayload: false;
  wouldStoreSecrets: false;
  wouldWriteRows: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKeys: false;
  wouldWriteIdempotencyRows: false;
  wouldWriteCompensationRows: false;
  wouldCreateMigrationFile: false;
  wouldApplyMigration: false;
  wouldCreateTables: false;
  wouldEnableWriters: false;
  wouldCallAi: false;
  wouldCallStripe: false;
  wouldUnlockReports: false;
  blockedCodes: string[];
  scaffoldRules: string[];
  acceptanceGates: string[];
  sections: WriterPersistenceImplementationProposalSection[];
};

export type WriterPersistenceImplementationProposalProbeResult = {
  safeMode: true;
  readOnly: true;
  blocked: true;
  scaffoldMode: WriterPersistenceImplementationProposalMode;
  sectionId?: string;
  sectionTitle?: string;
  sectionStatus?: WriterPersistenceImplementationProposalStatus;
  summary: string;
  proposalScaffoldOnly: true;
  sourceNoGoEvidenceComplete: false;
  implementationProposalAccepted: false;
  implementationProposalAllowed: false;
  implementationPlanApproved: false;
  readyToCreateImplementationBranch: false;
  readyForAdapterImplementation: false;
  schemaVerified: false;
  adapterImplemented: false;
  adapterImplementationApproved: false;
  adapterImplementationAllowed: false;
  implementationReviewComplete: false;
  allBlockingEvidenceReady: false;
  allRuntimeEffectsBlocked: true;
  wouldCreateImplementationPlan: false;
  wouldCreateImplementationBranch: false;
  wouldCreateAdapterCode: false;
  wouldImportRealWriterImplementation: false;
  wouldRunTransaction: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldPersistEvidence: false;
  wouldStoreRawPayload: false;
  wouldStoreSecrets: false;
  wouldWriteRows: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKeys: false;
  wouldWriteIdempotencyRows: false;
  wouldWriteCompensationRows: false;
  wouldCreateMigrationFile: false;
  wouldApplyMigration: false;
  wouldCreateTables: false;
  wouldEnableWriters: false;
  wouldCallAi: false;
  wouldCallStripe: false;
  wouldUnlockReports: false;
  blockedCodes: string[];
  sections: WriterPersistenceImplementationProposalSection[];
};
