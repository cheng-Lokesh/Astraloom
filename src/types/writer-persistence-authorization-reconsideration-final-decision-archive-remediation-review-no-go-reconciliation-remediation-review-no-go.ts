import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewMode,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review";
import type {
  WriterPersistenceAuthorizationRemediationCategory,
  WriterPersistenceAuthorizationRemediationOwner,
} from "@/types/writer-persistence-authorization-remediation";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoMode =
  "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_packet_only";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoStatus =
  | "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_external_evidence_unresolved"
  | "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_manual_reviewer_unresolved";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItem =
  {
    id: string;
    category: WriterPersistenceAuthorizationRemediationCategory;
    title: string;
    status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoStatus;
    owner: WriterPersistenceAuthorizationRemediationOwner;
    sourceReviewStatus: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewStatus;
    sourceReviewItemIds: string[];
    sourceRemediationItemIds: string[];
    sourceReconciliationNoGoItemIds: string[];
    sourceReconciliationItemIds: string[];
    sourceNoGoItemIds: string[];
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
    noGoQuestion: string;
    noGoConclusion: string;
    blockerEvidence: string[];
    unresolvedReviewGaps: string[];
    sourceChecklistFailures: string[];
    forbiddenShortcuts: string[];
    futureResolutionPrerequisites: string[];
    safeNoGoRefs: string[];
    redactionRules: string[];
    nonAcceptanceClauses: string[];
    nextSafeAction: string;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRuntimeFlags =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewRuntimeFlags & {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo: false;
    wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo: false;
    wouldDenyImplementationAuthorizationFromArchiveRemediationReviewNoGoReconciliationRemediationReview: false;
    wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoToAuthorizationDecision: false;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPayload =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewPayload &
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRuntimeFlags & {
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoMode;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewMode;
      noGoItemCount: number;
      reviewNoGoCount: number;
      externalEvidenceReviewNoGoCount: number;
      manualReviewerReviewNoGoCount: number;
      reconciliationRemediationReviewStillBlockedCount: number;
      blockerEvidenceCount: number;
      unresolvedReviewGapCount: number;
      sourceChecklistFailureCount: number;
      forbiddenShortcutCount: number;
      futureResolutionPrerequisiteCount: number;
      redactionRuleCount: number;
      sourceReviewItemCount: number;
      sourceExternalEvidenceMissingCount: number;
      sourceManualReviewerRequiredCount: number;
      sourceReconciliationRemediationStillBlockedCount: number;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPacketReady: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPacketOnly: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistReady: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistOnly: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRecorded: false;
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
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRules: string[];
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRejectionRules: string[];
      sourceArchiveRemediationReviewNoGoReconciliationRemediationReviewRules: string[];
      sourceArchiveRemediationReviewNoGoReconciliationRemediationReviewItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewItem[];
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItem[];
    };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoProbeResult =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPayload & {
    blocked: true;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoStatus;
    summary: string;
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItem[];
  };
