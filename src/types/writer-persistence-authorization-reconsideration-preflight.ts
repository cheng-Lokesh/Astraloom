import type {
  WriterPersistenceAuthorizationRemediationCategory,
  WriterPersistenceAuthorizationRemediationOwner,
} from "@/types/writer-persistence-authorization-remediation";
import type {
  WriterPersistenceAuthorizationRemediationReviewNoGoMode,
  WriterPersistenceAuthorizationRemediationReviewNoGoStatus,
} from "@/types/writer-persistence-authorization-remediation-review-no-go";

export type WriterPersistenceAuthorizationReconsiderationPreflightMode =
  "persistence_adapter_implementation_authorization_reconsideration_preflight_checklist_only";

export type WriterPersistenceAuthorizationReconsiderationPreflightStatus =
  | "blocked_external_evidence_missing"
  | "blocked_manual_review_required";

export type WriterPersistenceAuthorizationReconsiderationPreflightItem = {
  id: string;
  category: WriterPersistenceAuthorizationRemediationCategory;
  title: string;
  status: WriterPersistenceAuthorizationReconsiderationPreflightStatus;
  owner: WriterPersistenceAuthorizationRemediationOwner;
  sourceNoGoItemIds: string[];
  sourceReviewItemIds: string[];
  sourceRemediationItemIds: string[];
  sourceNoGoStatus: WriterPersistenceAuthorizationRemediationReviewNoGoStatus;
  sourceRefs: string[];
  preflightQuestion: string;
  currentFinding: string;
  missingPrerequisites: string[];
  requiredExternalInputs: string[];
  reviewerQuestions: string[];
  redactionRules: string[];
  forbiddenShortcuts: string[];
  nonAcceptanceClauses: string[];
  reconsiderationExitCriteria: string[];
  nextSafeAction: string;
};

export type WriterPersistenceAuthorizationReconsiderationPreflightRuntimeFlags =
  {
    allRuntimeEffectsBlocked: true;
    wouldAcceptReconsiderationPreflight: false;
    wouldRecordReconsiderationPreflight: false;
    wouldMarkReconsiderationReady: false;
    wouldStartAuthorizationReconsideration: false;
    wouldAcceptRemediationReviewNoGo: false;
    wouldRecordRemediationReviewNoGo: false;
    wouldDenyImplementationAuthorizationFromReview: false;
    wouldPromoteToAuthorizationReconsideration: false;
    wouldAcceptRemediationReview: false;
    wouldRecordRemediationReview: false;
    wouldStoreRemediationReviewEvidence: false;
    wouldMarkExternalRemediationReviewed: false;
    wouldAcceptExternalRemediationState: false;
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

export type WriterPersistenceAuthorizationReconsiderationPreflightPayload =
  WriterPersistenceAuthorizationReconsiderationPreflightRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    reconsiderationPreflightMode: WriterPersistenceAuthorizationReconsiderationPreflightMode;
    sourceReviewNoGoMode: WriterPersistenceAuthorizationRemediationReviewNoGoMode;
    checkedAt: string;
    preflightItemCount: number;
    blockedPreflightItemCount: number;
    externalEvidenceMissingCount: number;
    manualReviewerRequiredCount: number;
    missingPrerequisiteCount: number;
    requiredExternalInputCount: number;
    reviewerQuestionCount: number;
    redactionRuleCount: number;
    forbiddenShortcutCount: number;
    exitCriteriaCount: number;
    sourceNoGoItemCount: number;
    sourceNoGoCount: number;
    sourceManualReviewBlockedCount: number;
    sourceReconsiderationStillBlockedCount: number;
    reconsiderationPreflightChecklistReady: true;
    reconsiderationPreflightChecklistOnly: true;
    sourceReviewNoGoPacketReady: true;
    sourceReviewNoGoPacketOnly: true;
    sourceReleaseStillBlocked: true;
    preflightPassed: false;
    preflightAccepted: false;
    preflightRecorded: false;
    reconsiderationEligible: false;
    implementationAuthorizationReconsiderationReady: false;
    implementationAuthorizationRemediationAccepted: false;
    implementationAuthorizationDecisionReady: false;
    implementationAuthorizationDecisionRecorded: false;
    implementationAuthorizationNoGoAccepted: false;
    implementationAuthorizationDenied: false;
    implementationAuthorizationGranted: false;
    implementationAuthorized: false;
    authorizationDecisionRecorded: false;
    authorizationArtifactStored: false;
    externalRemediationStatesAccepted: false;
    remediationReviewAccepted: false;
    remediationReviewComplete: false;
    remediationReviewNoGoAccepted: false;
    remediationReviewNoGoRecorded: false;
    externalApprovalArchiveAccepted: false;
    archiveCompletenessAccepted: false;
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
    preflightRules: string[];
    reconsiderationBoundaryRules: string[];
    sourceBlockedCodes: string[];
    preflightItems: WriterPersistenceAuthorizationReconsiderationPreflightItem[];
  };

export type WriterPersistenceAuthorizationReconsiderationPreflightProbeResult =
  WriterPersistenceAuthorizationReconsiderationPreflightRuntimeFlags & {
    safeMode: true;
    readOnly: true;
    blocked: true;
    reconsiderationPreflightMode: WriterPersistenceAuthorizationReconsiderationPreflightMode;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceAuthorizationReconsiderationPreflightStatus;
    summary: string;
    reconsiderationPreflightChecklistOnly: true;
    sourceReviewNoGoPacketOnly: true;
    sourceReleaseStillBlocked: true;
    preflightAccepted: false;
    preflightRecorded: false;
    reconsiderationEligible: false;
    implementationAuthorizationReconsiderationReady: false;
    implementationAuthorizationGranted: false;
    implementationAuthorized: false;
    authorizationDecisionRecorded: false;
    authorizationArtifactStored: false;
    externalRemediationStatesAccepted: false;
    remediationReviewNoGoAccepted: false;
    remediationReviewNoGoRecorded: false;
    externalApprovalArchiveAccepted: false;
    archiveCompletenessAccepted: false;
    readyToCreateImplementationBranch: false;
    readyForAdapterImplementation: false;
    readyForReleaseExecution: false;
    adapterImplemented: false;
    adapterImplementationApproved: false;
    adapterImplementationAllowed: false;
    allOwnerApprovalsComplete: false;
    allBlockingEvidenceReady: false;
    blockedCodes: string[];
    preflightItems: WriterPersistenceAuthorizationReconsiderationPreflightItem[];
  };
