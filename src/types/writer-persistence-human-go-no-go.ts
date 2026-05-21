import type { WriterPersistenceReleaseNoGoMode } from "@/types/writer-persistence-release-no-go";

export type WriterPersistenceHumanGoNoGoMode =
  "persistence_adapter_human_go_no_go_runbook_only";

export type WriterPersistenceHumanGoNoGoCategory =
  | "source_release_no_go_invariant"
  | "founder_scope_decision"
  | "security_decision"
  | "backend_decision"
  | "qa_decision"
  | "migration_decision"
  | "operator_decision"
  | "data_protection_decision"
  | "product_scope_decision"
  | "final_hard_stop";

export type WriterPersistenceHumanGoNoGoStatus =
  | "blocked_by_release_no_go"
  | "manual_required";

export type WriterPersistenceHumanGoNoGoOwner =
  | "founder"
  | "security"
  | "backend"
  | "qa"
  | "operator"
  | "data_protection";

export type WriterPersistenceHumanGoNoGoStep = {
  id: string;
  category: WriterPersistenceHumanGoNoGoCategory;
  title: string;
  status: WriterPersistenceHumanGoNoGoStatus;
  owner: WriterPersistenceHumanGoNoGoOwner;
  intent: string;
  sourceReleaseItemIds: string[];
  sourceRefs: string[];
  decisionQuestion: string;
  requiredEvidence: string[];
  externalArtifactRules: string[];
  goCriteria: string[];
  noGoCriteria: string[];
  forbiddenActions: string[];
  nonExecutionClauses: string[];
  futureArtifacts: string[];
};

export type WriterPersistenceHumanGoNoGoRuntimeFlags = {
  allRuntimeEffectsBlocked: true;
  wouldRecordHumanDecision: false;
  wouldAcceptHumanDecision: false;
  wouldStoreDecisionArtifact: false;
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

export type WriterPersistenceHumanGoNoGoPayload =
  WriterPersistenceHumanGoNoGoRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    humanGoNoGoMode: WriterPersistenceHumanGoNoGoMode;
    sourceReleaseNoGoMode: WriterPersistenceReleaseNoGoMode;
    checkedAt: string;
    runbookStepCount: number;
    blockedByReleaseNoGoCount: number;
    manualRequiredCount: number;
    requiredEvidenceCount: number;
    externalArtifactRuleCount: number;
    goCriteriaCount: number;
    noGoCriteriaCount: number;
    forbiddenActionCount: number;
    sourceReleaseItemCount: number;
    sourceReleaseBlockerCount: number;
    safeModeConfirmed: true;
    humanGoNoGoRunbookReady: true;
    humanGoNoGoRunbookOnly: true;
    sourceReleaseNoGoPacketReady: true;
    sourceReleaseNoGoPacketOnly: true;
    sourceReleaseBlocked: true;
    releaseStillBlocked: true;
    humanDecisionCollectionExternal: true;
    externalArtifactArchiveRequired: true;
    humanDecisionRecorded: false;
    humanDecisionAccepted: false;
    releaseNoGoAccepted: false;
    releaseGoDecisionRecorded: false;
    releaseApproved: false;
    releaseApprovalGranted: false;
    featureFlagEnabled: false;
    deploymentApproved: false;
    productionWriterApproved: false;
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
    blockedCodes: string[];
    runbookRules: string[];
    externalDecisionArtifactRules: string[];
    blockedReleaseCodes: string[];
    runbookSteps: WriterPersistenceHumanGoNoGoStep[];
  };

export type WriterPersistenceHumanGoNoGoProbeResult =
  WriterPersistenceHumanGoNoGoRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    blocked: true;
    humanGoNoGoMode: WriterPersistenceHumanGoNoGoMode;
    stepId?: string;
    stepTitle?: string;
    stepStatus?: WriterPersistenceHumanGoNoGoStatus;
    summary: string;
    sourceReleaseBlocked: true;
    releaseStillBlocked: true;
    humanGoNoGoRunbookOnly: true;
    humanDecisionCollectionExternal: true;
    humanDecisionRecorded: false;
    humanDecisionAccepted: false;
    releaseNoGoAccepted: false;
    releaseGoDecisionRecorded: false;
    releaseApproved: false;
    releaseApprovalGranted: false;
    featureFlagEnabled: false;
    deploymentApproved: false;
    productionWriterApproved: false;
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
    blockedCodes: string[];
    runbookSteps: WriterPersistenceHumanGoNoGoStep[];
  };
