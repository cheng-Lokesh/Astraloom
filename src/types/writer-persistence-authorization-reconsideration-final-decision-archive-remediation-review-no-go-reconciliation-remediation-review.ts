import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationMode,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation";
import type {
  WriterPersistenceAuthorizationRemediationCategory,
  WriterPersistenceAuthorizationRemediationOwner,
} from "@/types/writer-persistence-authorization-remediation";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewMode =
  "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_checklist_only";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewStatus =
  | "archive_remediation_review_no_go_reconciliation_remediation_review_external_evidence_missing"
  | "archive_remediation_review_no_go_reconciliation_remediation_review_manual_reviewer_required";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewItem =
  {
    id: string;
    category: WriterPersistenceAuthorizationRemediationCategory;
    title: string;
    status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewStatus;
    owner: WriterPersistenceAuthorizationRemediationOwner;
    sourceRemediationStatus: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatus;
    sourceRemediationItemIds: string[];
    sourceReconciliationNoGoItemIds: string[];
    sourceReconciliationItemIds: string[];
    sourceNoGoItemIds: string[];
    sourceReviewItemIds: string[];
    sourceArchiveRemediationItemIds: string[];
    sourceArchiveNoGoItemIds: string[];
    sourceArchiveItemIds: string[];
    sourceDecisionItemIds: string[];
    sourceNoGoItemIdsFromReconsideration: string[];
    sourceReviewItemIdsFromReconsideration: string[];
    sourceReconsiderationRemediationItemIds: string[];
    sourcePreflightItemIds: string[];
    sourceOriginalRemediationItemIds: string[];
    sourceRefs: string[];
    reviewQuestion: string;
    currentFinding: string;
    requiredExternalState: string;
    safeEvidenceRefs: string[];
    completenessChecks: string[];
    redactionChecks: string[];
    rejectionTriggers: string[];
    nonAcceptanceClauses: string[];
    passCriteriaForFutureReview: string[];
    failCriteriaForCurrentReview: string[];
    stillBlockedBecause: string[];
    nextSafeAction: string;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewRuntimeFlags =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationRuntimeFlags & {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview: false;
    wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview: false;
    wouldStoreFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewEvidence: false;
    wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewed: false;
    wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo: false;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewPayload =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPayload &
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewRuntimeFlags & {
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewMode;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationMode;
      reviewItemCount: number;
      externalEvidenceMissingCount: number;
      manualReviewerRequiredCount: number;
      reconciliationRemediationStillBlockedCount: number;
      completenessCheckCount: number;
      redactionCheckCount: number;
      rejectionTriggerCount: number;
      sourceRemediationItemCount: number;
      sourceExternalReconciliationRemediationRequiredCount: number;
      sourceManualReconciliationReviewRequiredCount: number;
      sourceReconciliationStillBlockedCount: number;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistReady: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistOnly: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanReady: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanOnly: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewRecorded: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewComplete: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationRecorded: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatesAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoRecorded: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoAccepted: false;
      finalDecisionArchiveRemediationReviewAccepted: false;
      externalFinalDecisionArchiveRemediationAccepted: false;
      finalDecisionArchiveNoGoAccepted: false;
      externalFinalDecisionArchiveAccepted: false;
      authorizationReconsiderationFinalDecisionAccepted: false;
      implementationAuthorizationGranted: false;
      readyForAdapterImplementation: false;
      allRuntimeEffectsBlocked: true;
      archiveRemediationReviewNoGoReconciliationRemediationReviewChecklistRules: string[];
      archiveRemediationReviewNoGoReconciliationRemediationReviewRejectionRules: string[];
      sourceArchiveRemediationReviewNoGoReconciliationRemediationPlanRules: string[];
      sourceArchiveRemediationReviewNoGoReconciliationRemediationItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationItem[];
      archiveRemediationReviewNoGoReconciliationRemediationReviewItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewItem[];
    };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewProbeResult =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewPayload & {
    blocked: true;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewStatus;
    summary: string;
    archiveRemediationReviewNoGoReconciliationRemediationReviewItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewItem[];
  };
