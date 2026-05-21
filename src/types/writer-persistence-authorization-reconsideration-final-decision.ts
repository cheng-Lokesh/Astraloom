import type {
  WriterPersistenceAuthorizationRemediationCategory,
  WriterPersistenceAuthorizationRemediationOwner,
} from "@/types/writer-persistence-authorization-remediation";
import type {
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoItem,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoMode,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-remediation-review-no-go";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionMode =
  "persistence_adapter_implementation_authorization_reconsideration_final_decision_packet_only";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionStatus =
  | "final_no_go_external_evidence_missing"
  | "final_no_go_manual_review_blocked";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionItem = {
  id: string;
  category: WriterPersistenceAuthorizationRemediationCategory;
  title: string;
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionStatus;
  owner: WriterPersistenceAuthorizationRemediationOwner;
  sourceNoGoStatus: WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoStatus;
  sourceNoGoItemIds: string[];
  sourceReviewItemIds: string[];
  sourceReconsiderationRemediationItemIds: string[];
  sourcePreflightItemIds: string[];
  sourceOriginalRemediationItemIds: string[];
  sourceRefs: string[];
  finalQuestion: string;
  finalConclusion: string;
  blockingEvidence: string[];
  unresolvedDecisionGaps: string[];
  forbiddenGoShortcuts: string[];
  goPrerequisitesForFuture: string[];
  safeDecisionRefs: string[];
  redactionRules: string[];
  nonAcceptanceClauses: string[];
  nextSafeAction: string;
};

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionRuntimeFlags =
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoRuntimeFlags & {
    wouldAcceptFinalDecision: false;
    wouldRecordFinalDecision: false;
    wouldAcceptFinalNoGo: false;
    wouldRecordFinalNoGo: false;
    wouldRecordFinalGo: false;
    wouldGrantImplementationAuthorizationFromFinalDecision: false;
    wouldDenyImplementationAuthorizationFromFinalDecision: false;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionPayload =
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoPayload &
    WriterPersistenceAuthorizationReconsiderationFinalDecisionRuntimeFlags & {
      authorizationReconsiderationFinalDecisionMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionMode;
      sourceReconsiderationRemediationReviewNoGoMode: WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoMode;
      decisionItemCount: number;
      finalNoGoCount: number;
      finalGoCount: number;
      externalEvidenceNoGoCount: number;
      manualReviewNoGoCount: number;
      authorizationStillBlockedCount: number;
      sourceNoGoItemCount: number;
      sourceNoGoCount: number;
      sourceManualReviewBlockedCount: number;
      sourceReconsiderationStillBlockedCount: number;
      unresolvedDecisionGapCount: number;
      forbiddenGoShortcutCount: number;
      goPrerequisiteCount: number;
      finalDecisionPacketReady: true;
      finalDecisionPacketOnly: true;
      finalNoGoPacketReady: true;
      finalNoGoPacketOnly: true;
      sourceReviewNoGoPacketReady: true;
      sourceReviewNoGoPacketOnly: true;
      sourceReconsiderationRemediationReviewChecklistReady: true;
      sourceReconsiderationRemediationReviewChecklistOnly: true;
      sourceReconsiderationRemediationPlanReady: true;
      sourceReconsiderationRemediationPlanOnly: true;
      sourceReconsiderationNoGoPacketReady: true;
      sourceReconsiderationNoGoPacketOnly: true;
      sourcePreflightChecklistReady: true;
      sourcePreflightChecklistOnly: true;
      sourceReleaseStillBlocked: true;
      finalGoDecisionReady: false;
      finalGoDecisionRecorded: false;
      finalNoGoDecisionAccepted: false;
      finalNoGoDecisionRecorded: false;
      authorizationReconsiderationFinalDecisionAccepted: false;
      authorizationReconsiderationFinalDecisionRecorded: false;
      implementationAuthorizationReconsiderationReady: false;
      implementationAuthorizationGranted: false;
      implementationAuthorized: false;
      authorizationDecisionRecorded: false;
      authorizationArtifactStored: false;
      readyForAdapterImplementation: false;
      allRuntimeEffectsBlocked: true;
      finalDecisionRules: string[];
      finalDecisionBoundaryRules: string[];
      sourceReviewNoGoRules: string[];
      sourceNoGoItems: WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoItem[];
      decisionItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionItem[];
    };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionProbeResult =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionPayload & {
    blocked: true;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceAuthorizationReconsiderationFinalDecisionStatus;
    summary: string;
    decisionItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionItem[];
  };
