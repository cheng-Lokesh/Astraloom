import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoMode,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go";
import type {
  WriterPersistenceAuthorizationRemediationCategory,
  WriterPersistenceAuthorizationRemediationOwner,
} from "@/types/writer-persistence-authorization-remediation";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationMode =
  "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_checklist_only";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationStatus =
  | "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_external_evidence_unresolved"
  | "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_manual_reviewer_unresolved";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItem =
  {
    id: string;
    category: WriterPersistenceAuthorizationRemediationCategory;
    title: string;
    status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationStatus;
    owner: WriterPersistenceAuthorizationRemediationOwner;
    sourceNoGoStatus: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoStatus;
    sourceNoGoItemIds: string[];
    sourceReviewItemIds: string[];
    sourceRemediationItemIds: string[];
    sourceReconciliationNoGoItemIds: string[];
    sourceReconciliationItemIds: string[];
    sourceArchiveNoGoItemIds: string[];
    sourceArchiveRemediationItemIds: string[];
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

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationRuntimeFlags =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRuntimeFlags & {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation: false;
    wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation: false;
    wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciled: false;
    wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationToAuthorizationDecision: false;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationPayload =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPayload &
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationRuntimeFlags & {
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationMode;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoMode;
      reconciliationItemCount: number;
      externalEvidenceUnresolvedCount: number;
      manualReviewerUnresolvedCount: number;
      reviewNoGoStillBlockedCount: number;
      traceabilityCheckCount: number;
      blockerConsistencyCheckCount: number;
      redactionCheckCount: number;
      rejectionTriggerCount: number;
      unresolvedEvidenceCount: number;
      forbiddenConclusionCount: number;
      futureResolutionInputCount: number;
      sourceNoGoItemCount: number;
      sourceReviewNoGoCount: number;
      sourceExternalEvidenceReviewNoGoCount: number;
      sourceManualReviewerReviewNoGoCount: number;
      sourceReconciliationRemediationReviewStillBlockedCount: number;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistReady: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistOnly: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPacketReady: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPacketOnly: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistReady: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistOnly: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationRecorded: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRecorded: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewRecorded: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoAccepted: false;
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
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationRules: string[];
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationRejectionRules: string[];
      sourceArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItem[];
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItem[];
    };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationProbeResult =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationPayload & {
    blocked: true;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationStatus;
    summary: string;
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItem[];
  };
