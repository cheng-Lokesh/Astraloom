import type { WriterPersistenceApprovalPacketMode } from "@/types/writer-persistence-approval-packet";

export type WriterPersistenceBranchPreflightMode =
  "persistence_adapter_implementation_branch_preflight_checklist_only";

export type WriterPersistenceBranchPreflightCategory =
  | "source_packet_invariant"
  | "allowed_files"
  | "forbidden_files"
  | "local_commands"
  | "owner_handoff"
  | "rollback_checkpoint"
  | "security_boundary"
  | "test_preflight"
  | "migration_boundary"
  | "final_no_go";

export type WriterPersistenceBranchPreflightStatus =
  | "preflight_ready"
  | "blocked_by_approval"
  | "manual_required";

export type WriterPersistenceBranchPreflightOwner =
  | "backend"
  | "security"
  | "qa"
  | "operator"
  | "founder";

export type WriterPersistenceBranchPreflightCheck = {
  id: string;
  category: WriterPersistenceBranchPreflightCategory;
  title: string;
  status: WriterPersistenceBranchPreflightStatus;
  owner: WriterPersistenceBranchPreflightOwner;
  intent: string;
  sourceApprovalItemIds: string[];
  sourceRefs: string[];
  allowedFutureFiles: string[];
  forbiddenFutureFiles: string[];
  localCommands: string[];
  rollbackCheckpoints: string[];
  handoffRules: string[];
  preflightQuestions: string[];
  blockingConditions: string[];
  nonExecutionClauses: string[];
};

export type WriterPersistenceBranchPreflightRuntimeFlags = {
  allRuntimeEffectsBlocked: true;
  wouldRunGitCommand: false;
  wouldCreateBranch: false;
  wouldCheckoutBranch: false;
  wouldCreatePullRequest: false;
  wouldModifyFiles: false;
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
};

export type WriterPersistenceBranchPreflightPayload =
  WriterPersistenceBranchPreflightRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    branchPreflightMode: WriterPersistenceBranchPreflightMode;
    sourceApprovalPacketMode: WriterPersistenceApprovalPacketMode;
    checkedAt: string;
    checkCount: number;
    preflightReadyCount: number;
    blockedCheckCount: number;
    manualRequiredCheckCount: number;
    allowedFileRefCount: number;
    forbiddenFileRefCount: number;
    commandCount: number;
    rollbackCheckpointCount: number;
    handoffRuleCount: number;
    sourceApprovalItemCount: number;
    sourceApprovalBlockedItemCount: number;
    sourceApprovalManualRequiredItemCount: number;
    branchPreflightReady: true;
    branchPreflightOnly: true;
    sourceApprovalPacketReady: true;
    sourceApprovalPacketOnly: true;
    sourceApprovalPacketAccepted: false;
    implementationApprovalGranted: false;
    implementationBranchApproved: false;
    branchCreationApproved: false;
    branchCreated: false;
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
    blockedCodes: string[];
    checklistRules: string[];
    branchCreationGates: string[];
    checks: WriterPersistenceBranchPreflightCheck[];
  };

export type WriterPersistenceBranchPreflightProbeResult =
  WriterPersistenceBranchPreflightRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    blocked: true;
    branchPreflightMode: WriterPersistenceBranchPreflightMode;
    checkId?: string;
    checkTitle?: string;
    checkStatus?: WriterPersistenceBranchPreflightStatus;
    summary: string;
    branchPreflightOnly: true;
    sourceApprovalPacketAccepted: false;
    implementationApprovalGranted: false;
    implementationBranchApproved: false;
    branchCreationApproved: false;
    branchCreated: false;
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
    blockedCodes: string[];
    checks: WriterPersistenceBranchPreflightCheck[];
  };
