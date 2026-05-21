import type { WriterPersistenceAuthorizationReadinessMode } from "@/types/writer-persistence-authorization-readiness";

export type WriterPersistenceAuthorizationNoGoMode =
  "persistence_adapter_implementation_authorization_no_go_decision_packet_only";

export type WriterPersistenceAuthorizationNoGoCategory =
  | "source_readiness_invariant"
  | "archive_acceptance_no_go"
  | "authority_no_go"
  | "owner_lane_no_go"
  | "security_no_go"
  | "backend_schema_no_go"
  | "qa_acceptance_no_go"
  | "rollback_observability_no_go"
  | "implementation_scope_no_go"
  | "final_authorization_no_go";

export type WriterPersistenceAuthorizationNoGoStatus =
  | "no_go"
  | "manual_review_required";

export type WriterPersistenceAuthorizationNoGoOwner =
  | "founder"
  | "security"
  | "backend"
  | "qa"
  | "operator"
  | "data_protection";

export type WriterPersistenceAuthorizationNoGoItem = {
  id: string;
  category: WriterPersistenceAuthorizationNoGoCategory;
  title: string;
  status: WriterPersistenceAuthorizationNoGoStatus;
  owner: WriterPersistenceAuthorizationNoGoOwner;
  intent: string;
  sourceReadinessItemIds: string[];
  sourceRefs: string[];
  decisionQuestion: string;
  noGoReason: string;
  requiredEvidence: string[];
  unresolvedBlockers: string[];
  decisionCriteria: string[];
  manualReviewSteps: string[];
  redactionRules: string[];
  forbiddenActions: string[];
  nonExecutionClauses: string[];
  remediationActions: string[];
};

export type WriterPersistenceAuthorizationNoGoRuntimeFlags = {
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
  wouldRecordAuthorizationNoGoDecision: false;
  wouldAcceptAuthorizationNoGoDecision: false;
  wouldDenyImplementationAuthorization: false;
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

export type WriterPersistenceAuthorizationNoGoPayload =
  WriterPersistenceAuthorizationNoGoRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    authorizationNoGoMode: WriterPersistenceAuthorizationNoGoMode;
    sourceAuthorizationReadinessMode: WriterPersistenceAuthorizationReadinessMode;
    checkedAt: string;
    decisionItemCount: number;
    noGoCount: number;
    manualReviewRequiredCount: number;
    requiredEvidenceCount: number;
    unresolvedBlockerCount: number;
    decisionCriteriaCount: number;
    manualReviewStepCount: number;
    redactionRuleCount: number;
    forbiddenActionCount: number;
    remediationActionCount: number;
    sourceReadinessItemCount: number;
    sourceManualRequiredCount: number;
    authorizationNoGoPacketReady: true;
    authorizationNoGoPacketOnly: true;
    sourceAuthorizationReadinessReady: true;
    sourceAuthorizationReadinessOnly: true;
    sourceReleaseStillBlocked: true;
    sourceImplementationAuthorizationReady: false;
    sourceExternalApprovalArchiveAccepted: false;
    externalApprovalArchiveAccepted: false;
    archiveCompletenessAccepted: false;
    implementationAuthorizationDecisionReady: false;
    implementationAuthorizationDecisionRecorded: false;
    implementationAuthorizationNoGoAccepted: false;
    implementationAuthorizationDenied: false;
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
    authorizationNoGoRules: string[];
    remediationRules: string[];
    sourceBlockedCodes: string[];
    decisionItems: WriterPersistenceAuthorizationNoGoItem[];
  };

export type WriterPersistenceAuthorizationNoGoProbeResult =
  WriterPersistenceAuthorizationNoGoRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    blocked: true;
    authorizationNoGoMode: WriterPersistenceAuthorizationNoGoMode;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceAuthorizationNoGoStatus;
    summary: string;
    authorizationNoGoPacketOnly: true;
    sourceReleaseStillBlocked: true;
    externalApprovalArchiveAccepted: false;
    archiveCompletenessAccepted: false;
    implementationAuthorizationDecisionReady: false;
    implementationAuthorizationDecisionRecorded: false;
    implementationAuthorizationNoGoAccepted: false;
    implementationAuthorizationDenied: false;
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
    decisionItems: WriterPersistenceAuthorizationNoGoItem[];
  };
