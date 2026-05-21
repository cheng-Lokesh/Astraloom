import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewMode,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review";
import type {
  WriterPersistenceAuthorizationRemediationCategory,
  WriterPersistenceAuthorizationRemediationOwner,
} from "@/types/writer-persistence-authorization-remediation";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoMode =
  "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_packet_only";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoStatus =
  | "archive_remediation_review_no_go_external_evidence_missing"
  | "archive_remediation_review_no_go_manual_reviewer_required";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoItem =
  {
    id: string;
    category: WriterPersistenceAuthorizationRemediationCategory;
    title: string;
    status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoStatus;
    owner: WriterPersistenceAuthorizationRemediationOwner;
    sourceReviewStatus: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewStatus;
    sourceReviewItemIds: string[];
    sourceRemediationItemIds: string[];
    sourceArchiveNoGoItemIds: string[];
    sourceArchiveItemIds: string[];
    sourceDecisionItemIds: string[];
    sourceNoGoItemIds: string[];
    sourceReviewItemIdsFromReconsideration: string[];
    sourceReconsiderationRemediationItemIds: string[];
    sourcePreflightItemIds: string[];
    sourceOriginalRemediationItemIds: string[];
    sourceRefs: string[];
    noGoQuestion: string;
    noGoConclusion: string;
    blockerEvidence: string[];
    unresolvedReviewGaps: string[];
    forbiddenShortcuts: string[];
    futureResolutionPrerequisites: string[];
    safeNoGoRefs: string[];
    redactionRules: string[];
    nonAcceptanceClauses: string[];
    nextSafeAction: string;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoRuntimeFlags =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewRuntimeFlags & {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGo: false;
    wouldRecordFinalDecisionArchiveRemediationReviewNoGo: false;
    wouldDenyImplementationAuthorizationFromArchiveRemediationReview: false;
    wouldPromoteArchiveRemediationReviewNoGoToFinalDecision: false;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoPayload =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewPayload &
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoRuntimeFlags & {
      externalFinalDecisionArchiveRemediationReviewNoGoMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoMode;
      sourceExternalFinalDecisionArchiveRemediationReviewChecklistMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewMode;
      noGoItemCount: number;
      archiveReviewNoGoCount: number;
      externalEvidenceNoGoCount: number;
      manualReviewerNoGoCount: number;
      archiveRemediationReviewStillBlockedCount: number;
      blockerEvidenceCount: number;
      unresolvedReviewGapCount: number;
      forbiddenShortcutCount: number;
      futureResolutionPrerequisiteCount: number;
      redactionRuleCount: number;
      sourceReviewItemCount: number;
      sourceExternalEvidenceMissingCount: number;
      sourceManualReviewerRequiredCount: number;
      sourceArchiveRemediationStillBlockedCount: number;
      externalFinalDecisionArchiveRemediationReviewNoGoPacketReady: true;
      externalFinalDecisionArchiveRemediationReviewNoGoPacketOnly: true;
      sourceExternalFinalDecisionArchiveRemediationReviewChecklistReady: true;
      sourceExternalFinalDecisionArchiveRemediationReviewChecklistOnly: true;
      sourceExternalFinalDecisionArchiveRemediationPlanReady: true;
      sourceExternalFinalDecisionArchiveRemediationPlanOnly: true;
      sourceExternalFinalDecisionArchiveNoGoPacketReady: true;
      sourceExternalFinalDecisionArchiveNoGoPacketOnly: true;
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
      finalDecisionArchiveCompletenessAccepted: false;
      authorizationReconsiderationFinalDecisionAccepted: false;
      authorizationReconsiderationFinalDecisionRecorded: false;
      implementationAuthorizationGranted: false;
      implementationAuthorized: false;
      readyForAdapterImplementation: false;
      allRuntimeEffectsBlocked: true;
      archiveRemediationReviewNoGoRules: string[];
      archiveRemediationReviewNoGoRejectionRules: string[];
      sourceArchiveRemediationReviewItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewItem[];
      archiveRemediationReviewNoGoItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoItem[];
    };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoProbeResult =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoPayload & {
    blocked: true;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoStatus;
    summary: string;
    archiveRemediationReviewNoGoItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoItem[];
  };
