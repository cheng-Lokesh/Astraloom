import type { WriterPersistenceHumanGoNoGoMode } from "@/types/writer-persistence-human-go-no-go";

export type WriterPersistenceExternalApprovalArchiveMode =
  "persistence_adapter_external_approval_archive_checklist_only";

export type WriterPersistenceExternalApprovalArchiveCategory =
  | "source_human_runbook_invariant"
  | "archive_identity"
  | "artifact_naming"
  | "owner_metadata"
  | "blocker_cross_reference"
  | "evidence_redaction"
  | "completeness_check"
  | "retention_access"
  | "tamper_evidence"
  | "final_archive_hard_stop";

export type WriterPersistenceExternalApprovalArchiveStatus =
  | "blocked_by_human_runbook"
  | "manual_required";

export type WriterPersistenceExternalApprovalArchiveOwner =
  | "founder"
  | "security"
  | "backend"
  | "qa"
  | "operator"
  | "data_protection";

export type WriterPersistenceExternalApprovalArchiveItem = {
  id: string;
  category: WriterPersistenceExternalApprovalArchiveCategory;
  title: string;
  status: WriterPersistenceExternalApprovalArchiveStatus;
  owner: WriterPersistenceExternalApprovalArchiveOwner;
  intent: string;
  sourceRunbookStepIds: string[];
  sourceRefs: string[];
  archiveQuestion: string;
  requiredMetadata: string[];
  namingRules: string[];
  completenessChecks: string[];
  redactionRules: string[];
  retentionRules: string[];
  forbiddenActions: string[];
  nonExecutionClauses: string[];
  futureArtifacts: string[];
};

export type WriterPersistenceExternalApprovalArchiveRuntimeFlags = {
  allRuntimeEffectsBlocked: true;
  wouldStoreApprovalArtifact: false;
  wouldUploadApprovalArtifact: false;
  wouldReadExternalArtifact: false;
  wouldHashExternalArtifact: false;
  wouldPersistArchiveIndex: false;
  wouldMarkArchiveComplete: false;
  wouldAcceptExternalApprovalArchive: false;
  wouldGrantImplementationAuthorization: false;
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

export type WriterPersistenceExternalApprovalArchivePayload =
  WriterPersistenceExternalApprovalArchiveRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    archiveChecklistMode: WriterPersistenceExternalApprovalArchiveMode;
    sourceHumanGoNoGoMode: WriterPersistenceHumanGoNoGoMode;
    checkedAt: string;
    archiveItemCount: number;
    blockedByHumanRunbookCount: number;
    manualRequiredCount: number;
    requiredMetadataCount: number;
    namingRuleCount: number;
    completenessCheckCount: number;
    redactionRuleCount: number;
    retentionRuleCount: number;
    forbiddenActionCount: number;
    sourceRunbookStepCount: number;
    sourceManualRequiredCount: number;
    archiveChecklistReady: true;
    archiveChecklistOnly: true;
    sourceHumanGoNoGoRunbookReady: true;
    sourceHumanGoNoGoRunbookOnly: true;
    sourceReleaseStillBlocked: true;
    sourceHumanDecisionCollectionExternal: true;
    externalApprovalArchiveRequired: true;
    externalApprovalStorageExternal: true;
    archiveArtifactStored: false;
    archiveArtifactUploaded: false;
    archiveArtifactRead: false;
    archiveArtifactHashCreated: false;
    archiveIndexPersisted: false;
    archiveCompletenessAccepted: false;
    externalApprovalArchiveAccepted: false;
    implementationAuthorizationGranted: false;
    implementationAuthorized: false;
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
    archiveChecklistRules: string[];
    externalStorageRules: string[];
    sourceBlockedCodes: string[];
    archiveItems: WriterPersistenceExternalApprovalArchiveItem[];
  };

export type WriterPersistenceExternalApprovalArchiveProbeResult =
  WriterPersistenceExternalApprovalArchiveRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    blocked: true;
    archiveChecklistMode: WriterPersistenceExternalApprovalArchiveMode;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceExternalApprovalArchiveStatus;
    summary: string;
    archiveChecklistOnly: true;
    sourceReleaseStillBlocked: true;
    externalApprovalArchiveRequired: true;
    externalApprovalStorageExternal: true;
    archiveArtifactStored: false;
    archiveArtifactUploaded: false;
    archiveArtifactRead: false;
    archiveArtifactHashCreated: false;
    archiveIndexPersisted: false;
    archiveCompletenessAccepted: false;
    externalApprovalArchiveAccepted: false;
    implementationAuthorizationGranted: false;
    implementationAuthorized: false;
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
    archiveItems: WriterPersistenceExternalApprovalArchiveItem[];
  };
