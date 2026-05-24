import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go";
import type {
  WriterPersistenceAuthorizationRemediationCategory,
  WriterPersistenceAuthorizationRemediationOwner,
} from "@/types/writer-persistence-authorization-remediation";

export type Stage72RemediationMode =
  "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_remediation_plan_only";

export type Stage72RemediationStatus =
  | "stage72_remediation_external_evidence_required"
  | "stage72_remediation_manual_reviewer_required";

export type Stage72RemediationItem = {
  id: string;
  category: WriterPersistenceAuthorizationRemediationCategory;
  title: string;
  status: Stage72RemediationStatus;
  owner: WriterPersistenceAuthorizationRemediationOwner;
  sourceNoGoStatus: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoStatus;
  sourceNoGoItemIds: string[];
  sourceRemediationReviewItemIds: string[];
  sourceNoGoRemediationItemIds: string[];
  sourceReconciliationNoGoItemIds: string[];
  sourceReconciliationItemIds: string[];
  sourceReviewItemIds: string[];
  sourceArchiveItemIds: string[];
  sourceDecisionItemIds: string[];
  sourceRefs: string[];
  blockerSummary: string;
  remediationQuestion: string;
  remediationPlan: string;
  requiredExternalState: string;
  safeEvidenceRequirements: string[];
  manualReviewRequirements: string[];
  verificationSteps: string[];
  acceptanceCriteria: string[];
  residualRisks: string[];
  redactionRules: string[];
  rejectionTriggers: string[];
  forbiddenActions: string[];
  nonExecutionClauses: string[];
  futureReviewGates: string[];
  nextSafeAction: string;
};

export type Stage72RemediationRuntimeFlags =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRuntimeFlags & {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediation: false;
    wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationEvidence: false;
    wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoBlockerResolved: false;
    wouldCreateArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationTicket: false;
    wouldAcceptArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationState: false;
    wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReview: false;
  };

export type Stage72RemediationPayload =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPayload &
    Stage72RemediationRuntimeFlags & {
      stage72RemediationMode: Stage72RemediationMode;
      publicPagePath: string;
      publicApiPath: string;
      internalPagePath: string;
      internalApiPath: string;
      remediationItemCount: number;
      externalEvidenceRemediationRequiredCount: number;
      manualReviewerRemediationRequiredCount: number;
      remediationStillBlockedCount: number;
      safeEvidenceRequirementCount: number;
      manualReviewRequirementCount: number;
      verificationStepCount: number;
      acceptanceCriteriaCount: number;
      residualRiskCount: number;
      redactionRuleCount: number;
      rejectionTriggerCount: number;
      forbiddenActionCount: number;
      futureReviewGateCount: number;
      sourceNoGoItemCount: number;
      sourceExternalEvidenceReviewNoGoCount: number;
      sourceManualReviewerReviewNoGoCount: number;
      sourceRemediationReviewStillBlockedCount: number;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanReady: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanOnly: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketReady: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketOnly: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationRecorded: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationStatesAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRecorded: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationAccepted: false;
      authorizationReconsiderationFinalDecisionAccepted: false;
      implementationAuthorizationGranted: false;
      implementationAuthorized: false;
      readyForAdapterImplementation: false;
      allRuntimeEffectsBlocked: true;
      stage72RemediationRules: string[];
      stage72ReviewRules: string[];
      sourceStage71Items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItem[];
      stage72RemediationItems: Stage72RemediationItem[];
    };

export type Stage72RemediationProbeResult = Stage72RemediationPayload & {
  blocked: true;
  itemId?: string;
  itemTitle?: string;
  itemStatus?: Stage72RemediationStatus;
  summary: string;
  stage72RemediationItems: Stage72RemediationItem[];
};
