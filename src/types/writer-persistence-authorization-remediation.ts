import type { WriterPersistenceAuthorizationNoGoMode } from "@/types/writer-persistence-authorization-no-go";

export type WriterPersistenceAuthorizationRemediationMode =
  "persistence_adapter_implementation_authorization_remediation_plan_only";

export type WriterPersistenceAuthorizationRemediationCategory =
  | "source_invariant_remediation"
  | "archive_remediation"
  | "authority_remediation"
  | "owner_lane_remediation"
  | "security_data_remediation"
  | "backend_schema_remediation"
  | "qa_acceptance_remediation"
  | "rollback_observability_remediation"
  | "implementation_scope_remediation"
  | "final_reconsideration_remediation";

export type WriterPersistenceAuthorizationRemediationStatus =
  | "external_remediation_required"
  | "manual_review_required";

export type WriterPersistenceAuthorizationRemediationOwner =
  | "founder"
  | "security"
  | "backend"
  | "qa"
  | "operator"
  | "data_protection";

export type WriterPersistenceAuthorizationRemediationItem = {
  id: string;
  category: WriterPersistenceAuthorizationRemediationCategory;
  title: string;
  status: WriterPersistenceAuthorizationRemediationStatus;
  owner: WriterPersistenceAuthorizationRemediationOwner;
  intent: string;
  sourceNoGoItemIds: string[];
  sourceRefs: string[];
  blockerSummary: string;
  remediationObjective: string;
  externalActions: string[];
  safeEvidenceRequirements: string[];
  verificationSteps: string[];
  acceptanceCriteria: string[];
  residualRisks: string[];
  redactionRules: string[];
  forbiddenActions: string[];
  nonExecutionClauses: string[];
  exitCriteria: string[];
  nextReviewGate: string;
};

export type WriterPersistenceAuthorizationRemediationRuntimeFlags = {
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
  wouldAcceptRemediationPlan: false;
  wouldRecordRemediationEvidence: false;
  wouldMarkBlockerResolved: false;
  wouldCreateRemediationTicket: false;
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

export type WriterPersistenceAuthorizationRemediationPayload =
  WriterPersistenceAuthorizationRemediationRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    remediationPlanMode: WriterPersistenceAuthorizationRemediationMode;
    sourceAuthorizationNoGoMode: WriterPersistenceAuthorizationNoGoMode;
    checkedAt: string;
    remediationItemCount: number;
    externalRemediationRequiredCount: number;
    manualReviewRequiredCount: number;
    externalActionCount: number;
    safeEvidenceRequirementCount: number;
    verificationStepCount: number;
    acceptanceCriteriaCount: number;
    residualRiskCount: number;
    redactionRuleCount: number;
    forbiddenActionCount: number;
    exitCriteriaCount: number;
    sourceDecisionItemCount: number;
    sourceNoGoCount: number;
    sourceManualReviewRequiredCount: number;
    remediationPlanReady: true;
    remediationPlanOnly: true;
    sourceAuthorizationNoGoPacketReady: true;
    sourceAuthorizationNoGoPacketOnly: true;
    sourceReleaseStillBlocked: true;
    sourceImplementationAuthorizationGranted: false;
    sourceImplementationAuthorizationNoGoAccepted: false;
    externalApprovalArchiveAccepted: false;
    archiveCompletenessAccepted: false;
    implementationAuthorizationRemediationAccepted: false;
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
    remediationPlanRules: string[];
    reconsiderationRules: string[];
    sourceBlockedCodes: string[];
    remediationItems: WriterPersistenceAuthorizationRemediationItem[];
  };

export type WriterPersistenceAuthorizationRemediationProbeResult =
  WriterPersistenceAuthorizationRemediationRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    blocked: true;
    remediationPlanMode: WriterPersistenceAuthorizationRemediationMode;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceAuthorizationRemediationStatus;
    summary: string;
    remediationPlanOnly: true;
    sourceReleaseStillBlocked: true;
    externalApprovalArchiveAccepted: false;
    archiveCompletenessAccepted: false;
    implementationAuthorizationRemediationAccepted: false;
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
    remediationItems: WriterPersistenceAuthorizationRemediationItem[];
  };
