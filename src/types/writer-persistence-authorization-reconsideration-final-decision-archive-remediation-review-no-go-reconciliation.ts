import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoMode,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go";
import type {
  WriterPersistenceAuthorizationRemediationCategory,
  WriterPersistenceAuthorizationRemediationOwner,
} from "@/types/writer-persistence-authorization-remediation";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationMode =
  "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_checklist_only";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationStatus =
  | "archive_remediation_review_no_go_reconciliation_external_evidence_unresolved"
  | "archive_remediation_review_no_go_reconciliation_manual_reviewer_unresolved";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationItem =
  {
    id: string;
    category: WriterPersistenceAuthorizationRemediationCategory;
    title: string;
    status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationStatus;
    owner: WriterPersistenceAuthorizationRemediationOwner;
    sourceNoGoStatus: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoStatus;
    sourceNoGoItemIds: string[];
    sourceReviewItemIds: string[];
    sourceRemediationItemIds: string[];
    sourceArchiveNoGoItemIds: string[];
    sourceArchiveItemIds: string[];
    sourceDecisionItemIds: string[];
    sourceNoGoItemIdsFromReconsideration: string[];
    sourceReviewItemIdsFromReconsideration: string[];
    sourceReconsiderationRemediationItemIds: string[];
    sourcePreflightItemIds: string[];
    sourceOriginalRemediationItemIds: string[];
    sourceRefs: string[];
    reconciliationQuestion: string;
    reconciliationFinding: string;
    traceabilityChecks: string[];
    blockerConsistencyChecks: string[];
    redactionChecks: string[];
    rejectionTriggers: string[];
    unresolvedEvidence: string[];
    forbiddenConclusions: string[];
    futureResolutionInputs: string[];
    nonAcceptanceClauses: string[];
    nextSafeAction: string;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRuntimeFlags =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoRuntimeFlags & {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliation: false;
    wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliation: false;
    wouldMarkArchiveRemediationReviewNoGoReconciled: false;
    wouldPromoteArchiveRemediationReviewNoGoReconciliationToAuthorizationDecision: false;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationPayload =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoPayload &
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRuntimeFlags & {
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationMode;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoMode;
      reconciliationItemCount: number;
      externalEvidenceUnresolvedCount: number;
      manualReviewerUnresolvedCount: number;
      archiveReviewNoGoStillBlockedCount: number;
      traceabilityCheckCount: number;
      blockerConsistencyCheckCount: number;
      redactionCheckCount: number;
      rejectionTriggerCount: number;
      unresolvedEvidenceCount: number;
      forbiddenConclusionCount: number;
      futureResolutionInputCount: number;
      sourceNoGoItemCount: number;
      sourceArchiveReviewNoGoCount: number;
      sourceExternalEvidenceNoGoCount: number;
      sourceManualReviewerNoGoCount: number;
      sourceArchiveReviewStillBlockedCount: number;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistReady: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistOnly: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoPacketReady: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoPacketOnly: true;
      sourceExternalFinalDecisionArchiveRemediationReviewChecklistReady: true;
      sourceExternalFinalDecisionArchiveRemediationReviewChecklistOnly: true;
      sourceExternalFinalDecisionArchiveRemediationPlanReady: true;
      sourceExternalFinalDecisionArchiveRemediationPlanOnly: true;
      sourceExternalFinalDecisionArchiveNoGoPacketReady: true;
      sourceExternalFinalDecisionArchiveNoGoPacketOnly: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRecorded: false;
      externalFinalDecisionArchiveRemediationReviewNoGoAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoRecorded: false;
      finalDecisionArchiveRemediationReviewAccepted: false;
      finalDecisionArchiveRemediationReviewRecorded: false;
      finalDecisionArchiveRemediationReviewComplete: false;
      externalFinalDecisionArchiveRemediationAccepted: false;
      externalFinalDecisionArchiveRemediationRecorded: false;
      externalFinalDecisionArchiveRemediationStatesAccepted: false;
      finalDecisionArchiveNoGoAccepted: false;
      finalDecisionArchiveNoGoRecorded: false;
      externalFinalDecisionArchiveAccepted: false;
      authorizationReconsiderationFinalDecisionAccepted: false;
      authorizationReconsiderationFinalDecisionRecorded: false;
      implementationAuthorizationGranted: false;
      implementationAuthorized: false;
      readyForAdapterImplementation: false;
      allRuntimeEffectsBlocked: true;
      archiveRemediationReviewNoGoReconciliationRules: string[];
      archiveRemediationReviewNoGoReconciliationRejectionRules: string[];
      sourceArchiveRemediationReviewNoGoItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoItem[];
      archiveRemediationReviewNoGoReconciliationItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationItem[];
    };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationProbeResult =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationPayload & {
    blocked: true;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationStatus;
    summary: string;
    archiveRemediationReviewNoGoReconciliationItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationItem[];
  };
