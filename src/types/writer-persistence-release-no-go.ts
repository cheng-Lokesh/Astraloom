import type { WriterPersistenceOwnerSignoffMode } from "@/types/writer-persistence-owner-signoff";

export type WriterPersistenceReleaseNoGoMode =
  "persistence_adapter_implementation_release_no_go_packet_only";

export type WriterPersistenceReleaseNoGoCategory =
  | "source_owner_signoff_invariant"
  | "owner_lane_blocker"
  | "security_release_blocker"
  | "backend_release_blocker"
  | "qa_release_blocker"
  | "migration_release_blocker"
  | "runtime_write_blocker"
  | "data_protection_blocker"
  | "operator_compensation_blocker"
  | "product_scope_blocker"
  | "browser_boundary_packet"
  | "final_release_no_go";

export type WriterPersistenceReleaseNoGoStatus =
  | "packet_ready"
  | "blocked_by_owner_signoff"
  | "release_blocker"
  | "manual_required";

export type WriterPersistenceReleaseNoGoOwner =
  | "founder"
  | "security"
  | "backend"
  | "qa"
  | "operator"
  | "data_protection";

export type WriterPersistenceReleaseNoGoItem = {
  id: string;
  category: WriterPersistenceReleaseNoGoCategory;
  title: string;
  status: WriterPersistenceReleaseNoGoStatus;
  owner: WriterPersistenceReleaseNoGoOwner;
  intent: string;
  sourceSignoffItemIds: string[];
  sourceRefs: string[];
  blockerSummary: string;
  requiredEvidence: string[];
  releaseQuestions: string[];
  noGoDecisionRules: string[];
  forbiddenActions: string[];
  nonExecutionClauses: string[];
  futureHumanArtifacts: string[];
};

export type WriterPersistenceReleaseNoGoRuntimeFlags = {
  allRuntimeEffectsBlocked: true;
  wouldAcceptReleaseNoGo: false;
  wouldRecordGoDecision: false;
  wouldGrantReleaseApproval: false;
  wouldEnableFeatureFlag: false;
  wouldDeployCode: false;
  wouldRunProductionWriter: false;
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

export type WriterPersistenceReleaseNoGoPayload =
  WriterPersistenceReleaseNoGoRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    releaseNoGoMode: WriterPersistenceReleaseNoGoMode;
    sourceOwnerSignoffMode: WriterPersistenceOwnerSignoffMode;
    checkedAt: string;
    releaseItemCount: number;
    packetReadyCount: number;
    blockedByOwnerSignoffCount: number;
    releaseBlockerCount: number;
    manualRequiredCount: number;
    requiredEvidenceCount: number;
    releaseQuestionCount: number;
    noGoDecisionRuleCount: number;
    forbiddenActionCount: number;
    sourceOwnerSignoffItemCount: number;
    sourceOwnerSignoffManualCount: number;
    sourceOwnerSignoffBlockedCount: number;
    releaseBlocked: true;
    releaseNoGoPacketReady: true;
    releaseNoGoPacketOnly: true;
    sourceOwnerSignoffPacketReady: true;
    sourceOwnerSignoffPacketOnly: true;
    sourceOwnerSignoffComplete: false;
    sourcePatchReviewAccepted: false;
    ownerSignoffSubmitted: false;
    ownerSignoffRecorded: false;
    ownerSignoffComplete: false;
    releaseNoGoAccepted: false;
    releaseGoDecisionRecorded: false;
    releaseApproved: false;
    releaseApprovalGranted: false;
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
    readyForReleaseExecution: false;
    schemaVerified: false;
    adapterImplemented: false;
    adapterImplementationApproved: false;
    adapterImplementationAllowed: false;
    implementationReviewComplete: false;
    allOwnerApprovalsComplete: false;
    allBlockingEvidenceReady: false;
    humanGoNoGoRunbookNeeded: true;
    blockedCodes: string[];
    releaseNoGoRules: string[];
    nextHumanDecisionGates: string[];
    releaseItems: WriterPersistenceReleaseNoGoItem[];
  };

export type WriterPersistenceReleaseNoGoProbeResult =
  WriterPersistenceReleaseNoGoRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    blocked: true;
    releaseNoGoMode: WriterPersistenceReleaseNoGoMode;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceReleaseNoGoStatus;
    summary: string;
    releaseBlocked: true;
    releaseNoGoPacketOnly: true;
    sourceOwnerSignoffComplete: false;
    ownerSignoffRecorded: false;
    ownerSignoffComplete: false;
    releaseNoGoAccepted: false;
    releaseGoDecisionRecorded: false;
    releaseApproved: false;
    releaseApprovalGranted: false;
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
    readyForReleaseExecution: false;
    schemaVerified: false;
    adapterImplemented: false;
    adapterImplementationApproved: false;
    adapterImplementationAllowed: false;
    implementationReviewComplete: false;
    allOwnerApprovalsComplete: false;
    allBlockingEvidenceReady: false;
    humanGoNoGoRunbookNeeded: true;
    blockedCodes: string[];
    releaseItems: WriterPersistenceReleaseNoGoItem[];
  };
