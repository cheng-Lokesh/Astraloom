import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationMode,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation";
import type {
  WriterPersistenceAuthorizationRemediationCategory,
  WriterPersistenceAuthorizationRemediationOwner,
} from "@/types/writer-persistence-authorization-remediation";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewMode =
  "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_checklist_only";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewStatus =
  | "archive_review_external_evidence_missing"
  | "archive_review_manual_reviewer_required";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewItem =
  {
    id: string;
    category: WriterPersistenceAuthorizationRemediationCategory;
    title: string;
    status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewStatus;
    owner: WriterPersistenceAuthorizationRemediationOwner;
    sourceRemediationStatus: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationStatus;
    sourceRemediationItemIds: string[];
    sourceArchiveNoGoItemIds: string[];
    sourceArchiveItemIds: string[];
    sourceDecisionItemIds: string[];
    sourceNoGoItemIds: string[];
    sourceReviewItemIds: string[];
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

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewRuntimeFlags =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationRuntimeFlags & {
    wouldAcceptFinalDecisionArchiveRemediationReview: false;
    wouldRecordFinalDecisionArchiveRemediationReview: false;
    wouldStoreFinalDecisionArchiveRemediationReviewEvidence: false;
    wouldMarkFinalDecisionArchiveExternalRemediationReviewed: false;
    wouldPromoteToFinalDecisionArchiveRemediationReviewNoGo: false;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewPayload =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationPayload &
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewRuntimeFlags & {
      externalFinalDecisionArchiveRemediationReviewChecklistMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewMode;
      sourceExternalFinalDecisionArchiveRemediationMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationMode;
      reviewItemCount: number;
      externalEvidenceMissingCount: number;
      manualReviewerRequiredCount: number;
      archiveRemediationStillBlockedCount: number;
      completenessCheckCount: number;
      redactionCheckCount: number;
      rejectionTriggerCount: number;
      sourceRemediationItemCount: number;
      sourceExternalArchiveRemediationRequiredCount: number;
      sourceManualArchiveReviewRequiredCount: number;
      externalFinalDecisionArchiveRemediationReviewChecklistReady: true;
      externalFinalDecisionArchiveRemediationReviewChecklistOnly: true;
      sourceExternalFinalDecisionArchiveRemediationPlanReady: true;
      sourceExternalFinalDecisionArchiveRemediationPlanOnly: true;
      finalDecisionArchiveRemediationReviewRecorded: false;
      archiveRemediationReviewChecklistRules: string[];
      archiveRemediationReviewRejectionRules: string[];
      sourceArchiveRemediationItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationItem[];
      archiveRemediationReviewItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewItem[];
    };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewProbeResult =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewPayload & {
    blocked: true;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewStatus;
    summary: string;
    archiveRemediationReviewItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewItem[];
  };
