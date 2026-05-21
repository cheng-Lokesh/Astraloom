import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveMode,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchivePayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive";
import type {
  WriterPersistenceAuthorizationRemediationCategory,
  WriterPersistenceAuthorizationRemediationOwner,
} from "@/types/writer-persistence-authorization-remediation";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoMode =
  "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_no_go_packet_only";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoStatus =
  | "archive_no_go_external_evidence_missing"
  | "archive_no_go_manual_reviewer_missing";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoItem =
  {
    id: string;
    category: WriterPersistenceAuthorizationRemediationCategory;
    title: string;
    status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoStatus;
    owner: WriterPersistenceAuthorizationRemediationOwner;
    sourceArchiveStatus: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveStatus;
    sourceArchiveItemIds: string[];
    sourceDecisionItemIds: string[];
    sourceNoGoItemIds: string[];
    sourceReviewItemIds: string[];
    sourceReconsiderationRemediationItemIds: string[];
    sourcePreflightItemIds: string[];
    sourceOriginalRemediationItemIds: string[];
    sourceRefs: string[];
    noGoQuestion: string;
    noGoConclusion: string;
    blockingArchiveEvidence: string[];
    unresolvedArchiveGaps: string[];
    forbiddenShortcuts: string[];
    futureResolutionPrerequisites: string[];
    safeArchiveRefs: string[];
    redactionRules: string[];
    nonAcceptanceClauses: string[];
    nextSafeAction: string;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoRuntimeFlags =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRuntimeFlags & {
    wouldAcceptExternalFinalDecisionArchiveNoGo: false;
    wouldRecordExternalFinalDecisionArchiveNoGo: false;
    wouldDenyImplementationAuthorizationFromArchiveNoGo: false;
    wouldPromoteArchiveNoGoToFinalDecision: false;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoPayload =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchivePayload &
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoRuntimeFlags & {
      externalFinalDecisionArchiveNoGoMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoMode;
      sourceExternalFinalDecisionArchiveMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveMode;
      noGoItemCount: number;
      archiveNoGoCount: number;
      externalEvidenceArchiveNoGoCount: number;
      manualReviewerArchiveNoGoCount: number;
      archiveStillBlockedCount: number;
      sourceArchiveItemCount: number;
      sourceArchiveIncompleteCount: number;
      sourceArchiveCompleteCount: number;
      sourceExternalEvidenceArchiveGapCount: number;
      sourceManualReviewerArchiveGapCount: number;
      blockingArchiveEvidenceCount: number;
      unresolvedArchiveGapCount: number;
      forbiddenShortcutCount: number;
      futureResolutionPrerequisiteCount: number;
      externalFinalDecisionArchiveNoGoPacketReady: true;
      externalFinalDecisionArchiveNoGoPacketOnly: true;
      sourceExternalFinalDecisionArchiveChecklistReady: true;
      sourceExternalFinalDecisionArchiveChecklistOnly: true;
      finalDecisionArchiveNoGoAccepted: false;
      finalDecisionArchiveNoGoRecorded: false;
      externalFinalDecisionArchiveAccepted: false;
      finalDecisionArchiveCompletenessAccepted: false;
      authorizationReconsiderationFinalDecisionAccepted: false;
      authorizationReconsiderationFinalDecisionRecorded: false;
      finalGoDecisionReady: false;
      finalGoDecisionRecorded: false;
      finalNoGoDecisionAccepted: false;
      finalNoGoDecisionRecorded: false;
      implementationAuthorizationReconsiderationReady: false;
      implementationAuthorizationGranted: false;
      implementationAuthorized: false;
      authorizationDecisionRecorded: false;
      authorizationArtifactStored: false;
      readyForAdapterImplementation: false;
      allRuntimeEffectsBlocked: true;
      archiveNoGoRules: string[];
      implementationBoundaryRules: string[];
      sourceArchiveChecklistRules: string[];
      sourceArchiveItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveItem[];
      archiveNoGoItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoItem[];
    };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoProbeResult =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoPayload & {
    blocked: true;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoStatus;
    summary: string;
    archiveNoGoItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoItem[];
  };
