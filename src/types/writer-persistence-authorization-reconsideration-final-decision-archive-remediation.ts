import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoMode,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-no-go";
import type {
  WriterPersistenceAuthorizationRemediationCategory,
  WriterPersistenceAuthorizationRemediationOwner,
} from "@/types/writer-persistence-authorization-remediation";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationMode =
  "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_plan_only";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationStatus =
  | "archive_external_remediation_required"
  | "archive_manual_review_required";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationItem =
  {
    id: string;
    category: WriterPersistenceAuthorizationRemediationCategory;
    title: string;
    status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationStatus;
    owner: WriterPersistenceAuthorizationRemediationOwner;
    sourceArchiveNoGoStatus: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoStatus;
    sourceArchiveNoGoItemIds: string[];
    sourceArchiveItemIds: string[];
    sourceDecisionItemIds: string[];
    sourceNoGoItemIds: string[];
    sourceReviewItemIds: string[];
    sourceReconsiderationRemediationItemIds: string[];
    sourcePreflightItemIds: string[];
    sourceOriginalRemediationItemIds: string[];
    sourceRefs: string[];
    blockerSummary: string;
    remediationObjective: string;
    externalActions: string[];
    safeEvidenceRequirements: string[];
    verificationSteps: string[];
    acceptanceCriteria: string[];
    residualRisks: string[];
    redactionRules: string[];
    forbiddenActions: string[];
    nonExecutionClauses: string[];
    exitCriteria: string[];
    nextReviewGate: string;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationRuntimeFlags =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoRuntimeFlags & {
    wouldAcceptExternalFinalDecisionArchiveRemediation: false;
    wouldRecordExternalFinalDecisionArchiveRemediationEvidence: false;
    wouldMarkFinalDecisionArchiveBlockerResolved: false;
    wouldCreateFinalDecisionArchiveRemediationTicket: false;
    wouldAcceptExternalFinalDecisionArchiveRemediationState: false;
    wouldPromoteToFinalDecisionArchiveRemediationReview: false;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationPayload =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoPayload &
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationRuntimeFlags & {
      externalFinalDecisionArchiveRemediationMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationMode;
      sourceExternalFinalDecisionArchiveNoGoMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoMode;
      remediationItemCount: number;
      externalArchiveRemediationRequiredCount: number;
      manualArchiveReviewRequiredCount: number;
      externalActionCount: number;
      safeEvidenceRequirementCount: number;
      verificationStepCount: number;
      acceptanceCriteriaCount: number;
      residualRiskCount: number;
      redactionRuleCount: number;
      forbiddenActionCount: number;
      exitCriteriaCount: number;
      sourceArchiveNoGoItemCount: number;
      sourceArchiveNoGoCount: number;
      sourceExternalEvidenceArchiveNoGoCount: number;
      sourceManualReviewerArchiveNoGoCount: number;
      sourceArchiveStillBlockedCount: number;
      externalFinalDecisionArchiveRemediationPlanReady: true;
      externalFinalDecisionArchiveRemediationPlanOnly: true;
      sourceExternalFinalDecisionArchiveNoGoPacketReady: true;
      sourceExternalFinalDecisionArchiveNoGoPacketOnly: true;
      externalFinalDecisionArchiveRemediationAccepted: false;
      externalFinalDecisionArchiveRemediationRecorded: false;
      externalFinalDecisionArchiveRemediationStatesAccepted: false;
      finalDecisionArchiveRemediationReviewAccepted: false;
      finalDecisionArchiveRemediationReviewComplete: false;
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
      archiveRemediationPlanRules: string[];
      archiveRemediationReviewRules: string[];
      sourceArchiveNoGoRules: string[];
      sourceArchiveNoGoItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoItem[];
      archiveRemediationItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationItem[];
    };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationProbeResult =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationPayload & {
    blocked: true;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationStatus;
    summary: string;
    archiveRemediationItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationItem[];
  };
