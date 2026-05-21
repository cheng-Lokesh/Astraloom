import type { WriterPersistenceAcceptanceTestMatrixMode } from "@/types/writer-persistence-acceptance-test-matrix";

export type WriterPersistenceApprovalPacketMode =
  "persistence_adapter_implementation_approval_packet_only";

export type WriterPersistenceApprovalPacketCategory =
  | "scope_lock"
  | "branch_scope"
  | "service_role_security"
  | "test_evidence"
  | "audit_redaction"
  | "idempotency_transaction"
  | "rollback_compensation"
  | "rollout_observability"
  | "migration_boundary"
  | "final_no_go";

export type WriterPersistenceApprovalPacketStatus =
  | "packet_ready"
  | "blocked_by_acceptance"
  | "manual_required";

export type WriterPersistenceApprovalPacketOwner =
  | "backend"
  | "security"
  | "qa"
  | "operator"
  | "founder";

export type WriterPersistenceApprovalPacketItem = {
  id: string;
  category: WriterPersistenceApprovalPacketCategory;
  title: string;
  status: WriterPersistenceApprovalPacketStatus;
  owner: WriterPersistenceApprovalPacketOwner;
  decision: string;
  sourceAcceptanceTestIds: string[];
  sourceRefs: string[];
  requiredEvidence: string[];
  approvalQuestions: string[];
  blockingConditions: string[];
  nonApprovalClauses: string[];
  futureArtifacts: string[];
};

export type WriterPersistenceApprovalPacketPayload = {
  safeMode: true;
  readOnly: true;
  approvalPacketMode: WriterPersistenceApprovalPacketMode;
  sourceAcceptanceMatrixMode: WriterPersistenceAcceptanceTestMatrixMode;
  checkedAt: string;
  approvalItemCount: number;
  packetReadyItemCount: number;
  blockedItemCount: number;
  manualRequiredItemCount: number;
  founderItemCount: number;
  backendItemCount: number;
  securityItemCount: number;
  qaItemCount: number;
  operatorItemCount: number;
  sourceAcceptanceTestCount: number;
  sourceAcceptanceBlockedTestCount: number;
  sourceAcceptanceManualRequiredTestCount: number;
  approvalPacketReady: true;
  approvalPacketOnly: true;
  sourceAcceptanceMatrixReady: true;
  sourceAcceptanceMatrixOnly: true;
  sourceAcceptanceMatrixApproved: false;
  implementationApprovalPacketAccepted: false;
  implementationApprovalGranted: false;
  implementationBranchApproved: false;
  implementationPlanApproved: false;
  readyToCreateImplementationBranch: false;
  readyForAdapterImplementation: false;
  schemaVerified: false;
  adapterImplemented: false;
  adapterImplementationApproved: false;
  adapterImplementationAllowed: false;
  implementationReviewComplete: false;
  allOwnerApprovalsComplete: false;
  allBlockingEvidenceReady: false;
  allRuntimeEffectsBlocked: true;
  wouldRecordOwnerApproval: false;
  wouldGrantImplementationApproval: false;
  wouldCreateApprovalRecord: false;
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
  packetRules: string[];
  finalApprovalGates: string[];
  items: WriterPersistenceApprovalPacketItem[];
};

export type WriterPersistenceApprovalPacketProbeResult = {
  safeMode: true;
  readOnly: true;
  blocked: true;
  approvalPacketMode: WriterPersistenceApprovalPacketMode;
  approvalId?: string;
  approvalTitle?: string;
  approvalStatus?: WriterPersistenceApprovalPacketStatus;
  summary: string;
  approvalPacketOnly: true;
  sourceAcceptanceMatrixApproved: false;
  implementationApprovalPacketAccepted: false;
  implementationApprovalGranted: false;
  implementationBranchApproved: false;
  implementationPlanApproved: false;
  readyToCreateImplementationBranch: false;
  readyForAdapterImplementation: false;
  schemaVerified: false;
  adapterImplemented: false;
  adapterImplementationApproved: false;
  adapterImplementationAllowed: false;
  implementationReviewComplete: false;
  allOwnerApprovalsComplete: false;
  allBlockingEvidenceReady: false;
  allRuntimeEffectsBlocked: true;
  wouldRecordOwnerApproval: false;
  wouldGrantImplementationApproval: false;
  wouldCreateApprovalRecord: false;
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
  items: WriterPersistenceApprovalPacketItem[];
};
