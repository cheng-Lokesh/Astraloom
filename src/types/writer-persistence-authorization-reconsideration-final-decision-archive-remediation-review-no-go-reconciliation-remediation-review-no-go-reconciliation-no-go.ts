import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationMode,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation";
import type {
  WriterPersistenceAuthorizationRemediationCategory,
  WriterPersistenceAuthorizationRemediationOwner,
} from "@/types/writer-persistence-authorization-remediation";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoMode =
  "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_packet_only";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoStatus =
  | "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_external_evidence_unresolved"
  | "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_manual_reviewer_unresolved";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItem =
  {
    id: string;
    category: WriterPersistenceAuthorizationRemediationCategory;
    title: string;
    status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoStatus;
    owner: WriterPersistenceAuthorizationRemediationOwner;
    sourceReconciliationStatus: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationStatus;
    sourceReconciliationItemIds: string[];
    sourceNoGoItemIds: string[];
    sourceReviewItemIds: string[];
    sourceRemediationItemIds: string[];
    sourceReconciliationNoGoItemIds: string[];
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
    noGoQuestion: string;
    noGoConclusion: string;
    blockerEvidence: string[];
    unresolvedReconciliationGaps: string[];
    sourceChecklistFailures: string[];
    forbiddenShortcuts: string[];
    futureResolutionPrerequisites: string[];
    safeNoGoRefs: string[];
    redactionRules: string[];
    nonAcceptanceClauses: string[];
    nextSafeAction: string;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRuntimeFlags =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationRuntimeFlags & {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo: false;
    wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo: false;
    wouldDenyImplementationAuthorizationFromArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation: false;
    wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoToAuthorizationDecision: false;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPayload =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationPayload &
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRuntimeFlags & {
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoMode;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationMode;
      noGoItemCount: number;
      reconciliationNoGoItemCount: number;
      externalEvidenceReconciliationNoGoCount: number;
      manualReviewerReconciliationNoGoCount: number;
      reconciliationStillBlockedCount: number;
      blockerEvidenceCount: number;
      unresolvedReconciliationGapCount: number;
      sourceChecklistFailureCount: number;
      forbiddenShortcutCount: number;
      futureResolutionPrerequisiteCount: number;
      redactionRuleCount: number;
      sourceReconciliationItemCount: number;
      sourceExternalEvidenceUnresolvedCount: number;
      sourceManualReviewerUnresolvedCount: number;
      sourceReviewNoGoStillBlockedCount: number;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketReady: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketOnly: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistReady: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistOnly: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRecorded: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationRecorded: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRecorded: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted: false;
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
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRules: string[];
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRejectionRules: string[];
      sourceArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItem[];
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItem[];
    };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoProbeResult =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPayload & {
    blocked: true;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoStatus;
    summary: string;
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItem[];
  };
