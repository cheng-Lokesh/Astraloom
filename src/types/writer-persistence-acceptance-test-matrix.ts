import type { WriterPersistenceImplementationProposalMode } from "@/types/writer-persistence-implementation-proposal";

export type WriterPersistenceAcceptanceTestMatrixMode =
  "persistence_adapter_acceptance_test_matrix_only";

export type WriterPersistenceAcceptanceTestCategory =
  | "proposal_invariant"
  | "scope_boundary"
  | "server_only_boundary"
  | "phase_order"
  | "idempotency_behavior"
  | "audit_redaction"
  | "rollback_compensation"
  | "service_role_security"
  | "rollout_observability"
  | "final_no_go";

export type WriterPersistenceAcceptanceTestStatus =
  | "matrix_ready"
  | "blocked_by_proposal"
  | "manual_required";

export type WriterPersistenceAcceptanceTestType =
  | "route_invariant"
  | "unit_test"
  | "integration_test"
  | "manual_review";

export type WriterPersistenceAcceptanceTestOwner =
  | "backend"
  | "security"
  | "qa"
  | "operator"
  | "founder";

export type WriterPersistenceAcceptanceTestCase = {
  id: string;
  category: WriterPersistenceAcceptanceTestCategory;
  title: string;
  status: WriterPersistenceAcceptanceTestStatus;
  testType: WriterPersistenceAcceptanceTestType;
  owner: WriterPersistenceAcceptanceTestOwner;
  intent: string;
  sourceProposalSectionIds: string[];
  sourceRefs: string[];
  futureTestFiles: string[];
  futureCommand: string;
  acceptanceCriteria: string[];
  requiredEvidence: string[];
  expectedBlockedFlags: string[];
  forbiddenDuringMatrix: string[];
};

export type WriterPersistenceAcceptanceTestMatrixPayload = {
  safeMode: true;
  readOnly: true;
  matrixMode: WriterPersistenceAcceptanceTestMatrixMode;
  sourceProposalMode: WriterPersistenceImplementationProposalMode;
  checkedAt: string;
  testCount: number;
  routeInvariantTestCount: number;
  unitTestCount: number;
  integrationTestCount: number;
  manualReviewCount: number;
  matrixReadyCount: number;
  blockedTestCount: number;
  manualRequiredTestCount: number;
  sourceProposalSectionCount: number;
  sourceProposalBlockedSectionCount: number;
  sourceProposalManualRequiredSectionCount: number;
  acceptanceMatrixReady: true;
  acceptanceMatrixOnly: true;
  sourceProposalScaffoldReady: true;
  sourceProposalScaffoldOnly: true;
  sourceProposalAccepted: false;
  implementationProposalAllowed: false;
  implementationAcceptanceApproved: false;
  implementationApprovalPacketAllowed: false;
  readyForImplementationApprovalPacket: false;
  readyToCreateImplementationBranch: false;
  readyForAdapterImplementation: false;
  schemaVerified: false;
  adapterImplemented: false;
  adapterImplementationApproved: false;
  adapterImplementationAllowed: false;
  implementationReviewComplete: false;
  allBlockingEvidenceReady: false;
  allRuntimeEffectsBlocked: true;
  wouldCreateTestFiles: false;
  wouldRunAutomatedTests: false;
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
  matrixRules: string[];
  approvalGates: string[];
  tests: WriterPersistenceAcceptanceTestCase[];
};

export type WriterPersistenceAcceptanceTestMatrixProbeResult = {
  safeMode: true;
  readOnly: true;
  blocked: true;
  matrixMode: WriterPersistenceAcceptanceTestMatrixMode;
  testId?: string;
  testTitle?: string;
  testStatus?: WriterPersistenceAcceptanceTestStatus;
  summary: string;
  acceptanceMatrixOnly: true;
  sourceProposalAccepted: false;
  implementationProposalAllowed: false;
  implementationAcceptanceApproved: false;
  implementationApprovalPacketAllowed: false;
  readyForImplementationApprovalPacket: false;
  readyToCreateImplementationBranch: false;
  readyForAdapterImplementation: false;
  schemaVerified: false;
  adapterImplemented: false;
  adapterImplementationApproved: false;
  adapterImplementationAllowed: false;
  implementationReviewComplete: false;
  allBlockingEvidenceReady: false;
  allRuntimeEffectsBlocked: true;
  wouldCreateTestFiles: false;
  wouldRunAutomatedTests: false;
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
  tests: WriterPersistenceAcceptanceTestCase[];
};
