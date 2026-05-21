import type { WriterPersistenceBranchPreflightMode } from "@/types/writer-persistence-branch-preflight";

export type WriterPersistenceDiffContractMode =
  "persistence_adapter_implementation_dry_run_diff_contract_only";

export type WriterPersistenceDiffContractCategory =
  | "source_preflight_invariant"
  | "type_surface"
  | "adapter_orchestrator"
  | "audit_persistence"
  | "idempotency_persistence"
  | "compensation_handoff"
  | "server_boundary_test"
  | "adapter_unit_test"
  | "documentation"
  | "final_no_go";

export type WriterPersistenceDiffContractStatus =
  | "contract_ready"
  | "blocked_by_preflight"
  | "manual_required";

export type WriterPersistenceDiffContractOwner =
  | "backend"
  | "security"
  | "qa"
  | "operator"
  | "founder";

export type WriterPersistenceDiffContractChangeKind =
  | "future_add"
  | "future_update"
  | "future_test"
  | "future_doc";

export type WriterPersistenceDiffContractEntry = {
  id: string;
  category: WriterPersistenceDiffContractCategory;
  title: string;
  status: WriterPersistenceDiffContractStatus;
  owner: WriterPersistenceDiffContractOwner;
  futureFile: string;
  futureChangeKind: WriterPersistenceDiffContractChangeKind;
  intent: string;
  sourcePreflightCheckIds: string[];
  sourceRefs: string[];
  allowedFutureSymbols: string[];
  forbiddenChanges: string[];
  requiredAssertions: string[];
  reviewQuestions: string[];
  blockingConditions: string[];
  nonExecutionClauses: string[];
  rollbackNotes: string[];
};

export type WriterPersistenceDiffContractRuntimeFlags = {
  allRuntimeEffectsBlocked: true;
  wouldGeneratePatch: false;
  wouldApplyPatch: false;
  wouldModifyFiles: false;
  wouldCreateFiles: false;
  wouldDeleteFiles: false;
  wouldRunGitCommand: false;
  wouldCreateBranch: false;
  wouldCheckoutBranch: false;
  wouldCreatePullRequest: false;
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

export type WriterPersistenceDiffContractPayload =
  WriterPersistenceDiffContractRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    diffContractMode: WriterPersistenceDiffContractMode;
    sourceBranchPreflightMode: WriterPersistenceBranchPreflightMode;
    checkedAt: string;
    diffEntryCount: number;
    contractReadyCount: number;
    blockedEntryCount: number;
    manualRequiredEntryCount: number;
    futureFileCount: number;
    forbiddenChangeCount: number;
    requiredAssertionCount: number;
    sourcePreflightCheckCount: number;
    sourcePreflightBlockedCheckCount: number;
    sourcePreflightManualRequiredCheckCount: number;
    diffContractReady: true;
    diffContractOnly: true;
    sourceBranchPreflightReady: true;
    sourceBranchPreflightOnly: true;
    sourceBranchPreflightAccepted: false;
    implementationDiffApproved: false;
    implementationPatchCreated: false;
    implementationPatchApplied: false;
    implementationFilesCreated: false;
    implementationFilesModified: false;
    implementationTestsCreated: false;
    implementationApprovalGranted: false;
    implementationBranchApproved: false;
    branchCreationApproved: false;
    branchCreated: false;
    pullRequestCreated: false;
    implementationPlanApproved: false;
    readyToApplyDiff: false;
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
    diffContractRules: string[];
    futureDiffGates: string[];
    entries: WriterPersistenceDiffContractEntry[];
  };

export type WriterPersistenceDiffContractProbeResult =
  WriterPersistenceDiffContractRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    blocked: true;
    diffContractMode: WriterPersistenceDiffContractMode;
    entryId?: string;
    entryTitle?: string;
    entryStatus?: WriterPersistenceDiffContractStatus;
    summary: string;
    diffContractOnly: true;
    sourceBranchPreflightAccepted: false;
    implementationDiffApproved: false;
    implementationPatchCreated: false;
    implementationPatchApplied: false;
    implementationFilesCreated: false;
    implementationFilesModified: false;
    implementationTestsCreated: false;
    implementationApprovalGranted: false;
    implementationBranchApproved: false;
    branchCreationApproved: false;
    branchCreated: false;
    pullRequestCreated: false;
    implementationPlanApproved: false;
    readyToApplyDiff: false;
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
    entries: WriterPersistenceDiffContractEntry[];
  };
