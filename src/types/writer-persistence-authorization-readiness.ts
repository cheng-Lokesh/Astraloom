import type { WriterPersistenceExternalApprovalArchiveMode } from "@/types/writer-persistence-external-approval-archive";

export type WriterPersistenceAuthorizationReadinessMode =
  "persistence_adapter_implementation_authorization_readiness_checklist_only";

export type WriterPersistenceAuthorizationReadinessCategory =
  | "source_archive_invariant"
  | "authority_boundary"
  | "archive_coverage"
  | "owner_lane_readiness"
  | "security_readiness"
  | "backend_readiness"
  | "qa_readiness"
  | "rollback_observability"
  | "implementation_scope"
  | "final_authorization_hard_stop";

export type WriterPersistenceAuthorizationReadinessStatus =
  | "blocked_by_external_archive"
  | "manual_required";

export type WriterPersistenceAuthorizationReadinessOwner =
  | "founder"
  | "security"
  | "backend"
  | "qa"
  | "operator"
  | "data_protection";

export type WriterPersistenceAuthorizationReadinessItem = {
  id: string;
  category: WriterPersistenceAuthorizationReadinessCategory;
  title: string;
  status: WriterPersistenceAuthorizationReadinessStatus;
  owner: WriterPersistenceAuthorizationReadinessOwner;
  intent: string;
  sourceArchiveItemIds: string[];
  sourceRefs: string[];
  readinessQuestion: string;
  requiredEvidence: string[];
  archiveAcceptanceCriteria: string[];
  authorizationBlockers: string[];
  manualChecks: string[];
  redactionRules: string[];
  forbiddenActions: string[];
  nonExecutionClauses: string[];
  nextIfBlocked: string[];
};

export type WriterPersistenceAuthorizationReadinessRuntimeFlags = {
  allRuntimeEffectsBlocked: true;
  wouldAcceptExternalApprovalArchive: false;
  wouldStoreApprovalArtifact: false;
  wouldUploadApprovalArtifact: false;
  wouldReadExternalArtifact: false;
  wouldHashExternalArtifact: false;
  wouldPersistArchiveIndex: false;
  wouldMarkArchiveComplete: false;
  wouldCreateAuthorizationRecord: false;
  wouldRecordAuthorizationDecision: false;
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

export type WriterPersistenceAuthorizationReadinessPayload =
  WriterPersistenceAuthorizationReadinessRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    authorizationReadinessMode: WriterPersistenceAuthorizationReadinessMode;
    sourceArchiveChecklistMode: WriterPersistenceExternalApprovalArchiveMode;
    checkedAt: string;
    readinessItemCount: number;
    blockedByExternalArchiveCount: number;
    manualRequiredCount: number;
    requiredEvidenceCount: number;
    archiveAcceptanceCriteriaCount: number;
    authorizationBlockerCount: number;
    manualCheckCount: number;
    redactionRuleCount: number;
    forbiddenActionCount: number;
    sourceArchiveItemCount: number;
    sourceArchiveManualRequiredCount: number;
    authorizationReadinessChecklistReady: true;
    authorizationReadinessChecklistOnly: true;
    sourceArchiveChecklistReady: true;
    sourceArchiveChecklistOnly: true;
    sourceReleaseStillBlocked: true;
    externalApprovalArchiveRequired: true;
    externalApprovalStorageExternal: true;
    externalApprovalArchiveAccepted: false;
    archiveCompletenessAccepted: false;
    implementationAuthorizationReady: false;
    implementationAuthorizationGranted: false;
    implementationAuthorized: false;
    authorizationDecisionRecorded: false;
    authorizationArtifactStored: false;
    implementationApprovalGranted: false;
    implementationBranchApproved: false;
    implementationPlanApproved: false;
    readyToApplyPatch: false;
    readyToCreateImplementationBranch: false;
    readyForAdapterImplementation: false;
    readyForReleaseExecution: false;
    adapterImplemented: false;
    adapterImplementationApproved: false;
    adapterImplementationAllowed: false;
    implementationReviewComplete: false;
    allOwnerApprovalsComplete: false;
    allBlockingEvidenceReady: false;
    blockedCodes: string[];
    authorizationReadinessRules: string[];
    externalAuthorizationRules: string[];
    sourceBlockedCodes: string[];
    readinessItems: WriterPersistenceAuthorizationReadinessItem[];
  };

export type WriterPersistenceAuthorizationReadinessProbeResult =
  WriterPersistenceAuthorizationReadinessRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    blocked: true;
    authorizationReadinessMode: WriterPersistenceAuthorizationReadinessMode;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceAuthorizationReadinessStatus;
    summary: string;
    authorizationReadinessChecklistOnly: true;
    sourceReleaseStillBlocked: true;
    externalApprovalArchiveRequired: true;
    externalApprovalStorageExternal: true;
    externalApprovalArchiveAccepted: false;
    archiveCompletenessAccepted: false;
    implementationAuthorizationReady: false;
    implementationAuthorizationGranted: false;
    implementationAuthorized: false;
    authorizationDecisionRecorded: false;
    authorizationArtifactStored: false;
    implementationApprovalGranted: false;
    implementationBranchApproved: false;
    implementationPlanApproved: false;
    readyToApplyPatch: false;
    readyToCreateImplementationBranch: false;
    readyForAdapterImplementation: false;
    readyForReleaseExecution: false;
    adapterImplemented: false;
    adapterImplementationApproved: false;
    adapterImplementationAllowed: false;
    implementationReviewComplete: false;
    allOwnerApprovalsComplete: false;
    allBlockingEvidenceReady: false;
    blockedCodes: string[];
    readinessItems: WriterPersistenceAuthorizationReadinessItem[];
  };
