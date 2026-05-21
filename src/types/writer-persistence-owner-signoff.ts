import type { WriterPersistencePatchReviewMode } from "@/types/writer-persistence-patch-review";

export type WriterPersistenceOwnerSignoffMode =
  "persistence_adapter_implementation_owner_signoff_packet_only";

export type WriterPersistenceOwnerSignoffCategory =
  | "source_patch_review_invariant"
  | "founder_signoff"
  | "security_signoff"
  | "backend_signoff"
  | "qa_signoff"
  | "operator_signoff"
  | "data_protection_signoff"
  | "product_scope_signoff"
  | "signoff_record_no_write"
  | "final_no_go";

export type WriterPersistenceOwnerSignoffStatus =
  | "packet_ready"
  | "blocked_by_patch_review"
  | "manual_required";

export type WriterPersistenceOwnerSignoffOwner =
  | "backend"
  | "security"
  | "qa"
  | "operator"
  | "founder";

export type WriterPersistenceOwnerSignoffItem = {
  id: string;
  category: WriterPersistenceOwnerSignoffCategory;
  title: string;
  status: WriterPersistenceOwnerSignoffStatus;
  owner: WriterPersistenceOwnerSignoffOwner;
  intent: string;
  sourceReviewItemIds: string[];
  sourceRefs: string[];
  requiredEvidence: string[];
  signoffQuestions: string[];
  approvalBoundaries: string[];
  forbiddenDelegations: string[];
  blockingConditions: string[];
  nonExecutionClauses: string[];
  futureSignoffArtifacts: string[];
};

export type WriterPersistenceOwnerSignoffRuntimeFlags = {
  allRuntimeEffectsBlocked: true;
  wouldCollectSignature: false;
  wouldRecordOwnerApproval: false;
  wouldGrantImplementationApproval: false;
  wouldCreateApprovalRecord: false;
  wouldAcceptPatchReview: false;
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

export type WriterPersistenceOwnerSignoffPayload =
  WriterPersistenceOwnerSignoffRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    ownerSignoffMode: WriterPersistenceOwnerSignoffMode;
    sourcePatchReviewMode: WriterPersistencePatchReviewMode;
    checkedAt: string;
    signoffItemCount: number;
    packetReadyCount: number;
    blockedSignoffCount: number;
    manualSignoffCount: number;
    requiredEvidenceCount: number;
    signoffQuestionCount: number;
    approvalBoundaryCount: number;
    forbiddenDelegationCount: number;
    sourcePatchReviewItemCount: number;
    sourcePatchReviewBlockedCount: number;
    sourcePatchReviewManualCount: number;
    ownerSignoffPacketReady: true;
    ownerSignoffPacketOnly: true;
    sourcePatchReviewPacketReady: true;
    sourcePatchReviewPacketOnly: true;
    sourcePatchReviewAccepted: false;
    ownerSignoffSubmitted: false;
    ownerSignoffRecorded: false;
    ownerSignoffComplete: false;
    implementationPatchReviewAccepted: false;
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
    readyForReleaseNoGoPacket: false;
    schemaVerified: false;
    adapterImplemented: false;
    adapterImplementationApproved: false;
    adapterImplementationAllowed: false;
    implementationReviewComplete: false;
    allOwnerApprovalsComplete: false;
    allBlockingEvidenceReady: false;
    blockedCodes: string[];
    signoffPacketRules: string[];
    futureReleaseNoGoGates: string[];
    signoffItems: WriterPersistenceOwnerSignoffItem[];
  };

export type WriterPersistenceOwnerSignoffProbeResult =
  WriterPersistenceOwnerSignoffRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    blocked: true;
    ownerSignoffMode: WriterPersistenceOwnerSignoffMode;
    signoffId?: string;
    signoffTitle?: string;
    signoffStatus?: WriterPersistenceOwnerSignoffStatus;
    summary: string;
    ownerSignoffPacketOnly: true;
    sourcePatchReviewAccepted: false;
    ownerSignoffSubmitted: false;
    ownerSignoffRecorded: false;
    ownerSignoffComplete: false;
    implementationPatchReviewAccepted: false;
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
    readyForReleaseNoGoPacket: false;
    schemaVerified: false;
    adapterImplemented: false;
    adapterImplementationApproved: false;
    adapterImplementationAllowed: false;
    implementationReviewComplete: false;
    allOwnerApprovalsComplete: false;
    allBlockingEvidenceReady: false;
    blockedCodes: string[];
    signoffItems: WriterPersistenceOwnerSignoffItem[];
  };
