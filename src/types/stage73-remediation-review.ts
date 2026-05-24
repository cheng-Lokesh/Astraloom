import type {
  Stage72RemediationItem,
  Stage72RemediationPayload,
  Stage72RemediationRuntimeFlags,
  Stage72RemediationStatus,
} from "@/types/stage72-remediation";
import type {
  WriterPersistenceAuthorizationRemediationCategory,
  WriterPersistenceAuthorizationRemediationOwner,
} from "@/types/writer-persistence-authorization-remediation";

export type Stage73RemediationReviewMode =
  "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_remediation_review_checklist_only";

export type Stage73RemediationReviewStatus =
  | "stage73_review_external_evidence_still_missing"
  | "stage73_review_manual_reviewer_still_required";

export type Stage73RemediationReviewItem = {
  id: string;
  category: WriterPersistenceAuthorizationRemediationCategory;
  title: string;
  status: Stage73RemediationReviewStatus;
  owner: WriterPersistenceAuthorizationRemediationOwner;
  sourceRemediationStatus: Stage72RemediationStatus;
  sourceRemediationItemIds: string[];
  sourceNoGoItemIds: string[];
  sourceRemediationReviewItemIds: string[];
  sourceNoGoRemediationItemIds: string[];
  sourceReconciliationNoGoItemIds: string[];
  sourceReconciliationItemIds: string[];
  sourceReviewItemIds: string[];
  sourceArchiveItemIds: string[];
  sourceDecisionItemIds: string[];
  sourceRefs: string[];
  reviewQuestion: string;
  currentFinding: string;
  evidenceReadinessChecks: string[];
  manualReviewerChecks: string[];
  redactionChecks: string[];
  rejectionChecks: string[];
  completenessChecks: string[];
  nonAcceptanceClauses: string[];
  stillBlockedReasons: string[];
  futureNoGoCriteria: string[];
  nextSafeAction: string;
};

export type Stage73RemediationReviewRuntimeFlags =
  Stage72RemediationRuntimeFlags & {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReview: false;
    wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReview: false;
    wouldStoreFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewEvidence: false;
    wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewed: false;
    wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewNoGo: false;
  };

export type Stage73RemediationReviewPayload =
  Stage72RemediationPayload &
    Stage73RemediationReviewRuntimeFlags & {
      stage73RemediationReviewMode: Stage73RemediationReviewMode;
      publicPagePath: string;
      publicApiPath: string;
      internalPagePath: string;
      internalApiPath: string;
      reviewItemCount: number;
      externalEvidenceStillMissingCount: number;
      manualReviewerStillRequiredCount: number;
      stage72RemediationStillBlockedCount: number;
      evidenceReadinessCheckCount: number;
      manualReviewerCheckCount: number;
      redactionCheckCount: number;
      rejectionCheckCount: number;
      completenessCheckCount: number;
      stillBlockedReasonCount: number;
      futureNoGoCriteriaCount: number;
      sourceRemediationItemCount: number;
      sourceExternalEvidenceRemediationRequiredCount: number;
      sourceManualReviewerRemediationRequiredCount: number;
      sourceRemediationStillBlockedCount: number;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewChecklistReady: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewChecklistOnly: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanReady: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanOnly: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewRecorded: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewComplete: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationRecorded: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationStatesAccepted: false;
      authorizationReconsiderationFinalDecisionAccepted: false;
      implementationAuthorizationGranted: false;
      implementationAuthorized: false;
      readyForAdapterImplementation: false;
      allRuntimeEffectsBlocked: true;
      stage73ReviewRules: string[];
      sourceStage72Items: Stage72RemediationItem[];
      stage73RemediationReviewItems: Stage73RemediationReviewItem[];
    };

export type Stage73RemediationReviewProbeResult =
  Stage73RemediationReviewPayload & {
    blocked: true;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: Stage73RemediationReviewStatus;
    summary: string;
    stage73RemediationReviewItems: Stage73RemediationReviewItem[];
  };
