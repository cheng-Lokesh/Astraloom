import type { WriterPersistenceDiffContractMode } from "@/types/writer-persistence-diff-contract";

export type WriterPersistencePatchReviewMode =
  "persistence_adapter_implementation_patch_review_packet_only";

export type WriterPersistencePatchReviewCategory =
  | "source_diff_invariant"
  | "scope_review"
  | "type_surface_review"
  | "orchestrator_review"
  | "audit_review"
  | "idempotency_review"
  | "compensation_review"
  | "security_review"
  | "qa_review"
  | "final_no_go";

export type WriterPersistencePatchReviewStatus =
  | "packet_ready"
  | "blocked_by_diff_contract"
  | "manual_required";

export type WriterPersistencePatchReviewOwner =
  | "backend"
  | "security"
  | "qa"
  | "operator"
  | "founder";

export type WriterPersistencePatchReviewItem = {
  id: string;
  category: WriterPersistencePatchReviewCategory;
  title: string;
  status: WriterPersistencePatchReviewStatus;
  owner: WriterPersistencePatchReviewOwner;
  intent: string;
  sourceDiffEntryIds: string[];
  sourceRefs: string[];
  requiredEvidence: string[];
  requiredAssertions: string[];
  forbiddenChanges: string[];
  reviewQuestions: string[];
  blockingConditions: string[];
  nonExecutionClauses: string[];
  futureReviewArtifacts: string[];
};

export type WriterPersistencePatchReviewRuntimeFlags = {
  allRuntimeEffectsBlocked: true;
  wouldReviewRealPatch: false;
  wouldAcceptPatch: false;
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

export type WriterPersistencePatchReviewPayload =
  WriterPersistencePatchReviewRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    patchReviewMode: WriterPersistencePatchReviewMode;
    sourceDiffContractMode: WriterPersistenceDiffContractMode;
    checkedAt: string;
    reviewItemCount: number;
    packetReadyCount: number;
    blockedReviewCount: number;
    manualReviewCount: number;
    requiredEvidenceCount: number;
    requiredAssertionCount: number;
    forbiddenChangeCount: number;
    sourceDiffEntryCount: number;
    sourceDiffBlockedEntryCount: number;
    sourceDiffManualRequiredEntryCount: number;
    patchReviewPacketReady: true;
    patchReviewPacketOnly: true;
    sourceDiffContractReady: true;
    sourceDiffContractOnly: true;
    sourceDiffContractAccepted: false;
    implementationPatchSubmitted: false;
    implementationPatchApproved: false;
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
    readyToApplyPatch: false;
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
    patchReviewRules: string[];
    futureOwnerSignoffGates: string[];
    reviewItems: WriterPersistencePatchReviewItem[];
  };

export type WriterPersistencePatchReviewProbeResult =
  WriterPersistencePatchReviewRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    blocked: true;
    patchReviewMode: WriterPersistencePatchReviewMode;
    reviewId?: string;
    reviewTitle?: string;
    reviewStatus?: WriterPersistencePatchReviewStatus;
    summary: string;
    patchReviewPacketOnly: true;
    sourceDiffContractAccepted: false;
    implementationPatchSubmitted: false;
    implementationPatchApproved: false;
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
    readyToApplyPatch: false;
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
    reviewItems: WriterPersistencePatchReviewItem[];
  };
