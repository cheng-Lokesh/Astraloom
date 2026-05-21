import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationMode,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation";
import type {
  WriterPersistenceAuthorizationRemediationCategory,
  WriterPersistenceAuthorizationRemediationOwner,
} from "@/types/writer-persistence-authorization-remediation";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoMode =
  "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_no_go_packet_only";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoStatus =
  | "archive_remediation_review_no_go_reconciliation_no_go_external_evidence_unresolved"
  | "archive_remediation_review_no_go_reconciliation_no_go_manual_reviewer_unresolved";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoItem =
  {
    id: string;
    category: WriterPersistenceAuthorizationRemediationCategory;
    title: string;
    status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoStatus;
    owner: WriterPersistenceAuthorizationRemediationOwner;
    sourceReconciliationStatus: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationStatus;
    sourceReconciliationItemIds: string[];
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
    noGoQuestion: string;
    noGoConclusion: string;
    blockerEvidence: string[];
    unresolvedReconciliationGaps: string[];
    forbiddenShortcuts: string[];
    futureResolutionPrerequisites: string[];
    safeNoGoRefs: string[];
    redactionRules: string[];
    nonAcceptanceClauses: string[];
    nextSafeAction: string;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoRuntimeFlags =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRuntimeFlags & {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo: false;
    wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo: false;
    wouldDenyImplementationAuthorizationFromArchiveRemediationReviewNoGoReconciliation: false;
    wouldPromoteArchiveRemediationReviewNoGoReconciliationNoGoToAuthorizationDecision: false;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPayload =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationPayload &
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoRuntimeFlags & {
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoMode;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationMode;
      noGoItemCount: number;
      reconciliationNoGoCount: number;
      externalEvidenceReconciliationNoGoCount: number;
      manualReviewerReconciliationNoGoCount: number;
      archiveReviewNoGoReconciliationStillBlockedCount: number;
      blockerEvidenceCount: number;
      unresolvedReconciliationGapCount: number;
      forbiddenShortcutCount: number;
      futureResolutionPrerequisiteCount: number;
      redactionRuleCount: number;
      sourceReconciliationItemCount: number;
      sourceExternalEvidenceUnresolvedCount: number;
      sourceManualReviewerUnresolvedCount: number;
      sourceArchiveReviewNoGoStillBlockedCount: number;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPacketReady: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPacketOnly: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistReady: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistOnly: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoRecorded: false;
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
      archiveRemediationReviewNoGoReconciliationNoGoRules: string[];
      archiveRemediationReviewNoGoReconciliationNoGoRejectionRules: string[];
      sourceArchiveRemediationReviewNoGoReconciliationItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationItem[];
      archiveRemediationReviewNoGoReconciliationNoGoItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoItem[];
    };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoProbeResult =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPayload & {
    blocked: true;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoStatus;
    summary: string;
    archiveRemediationReviewNoGoReconciliationNoGoItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoItem[];
  };
