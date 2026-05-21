import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoMode,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-no-go";
import type {
  WriterPersistenceAuthorizationRemediationCategory,
  WriterPersistenceAuthorizationRemediationOwner,
} from "@/types/writer-persistence-authorization-remediation";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationMode =
  "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_plan_only";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatus =
  | "archive_remediation_review_no_go_reconciliation_external_remediation_required"
  | "archive_remediation_review_no_go_reconciliation_manual_review_required";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationItem =
  {
    id: string;
    category: WriterPersistenceAuthorizationRemediationCategory;
    title: string;
    status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatus;
    owner: WriterPersistenceAuthorizationRemediationOwner;
    sourceReconciliationNoGoStatus: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoStatus;
    sourceReconciliationNoGoItemIds: string[];
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

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationRuntimeFlags =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoRuntimeFlags & {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation: false;
    wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationEvidence: false;
    wouldMarkArchiveRemediationReviewNoGoReconciliationBlockerResolved: false;
    wouldCreateArchiveRemediationReviewNoGoReconciliationRemediationTicket: false;
    wouldAcceptArchiveRemediationReviewNoGoReconciliationRemediationState: false;
    wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReview: false;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPayload =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPayload &
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationRuntimeFlags & {
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationMode;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoMode;
      remediationItemCount: number;
      externalReconciliationRemediationRequiredCount: number;
      manualReconciliationReviewRequiredCount: number;
      externalActionCount: number;
      safeEvidenceRequirementCount: number;
      verificationStepCount: number;
      acceptanceCriteriaCount: number;
      residualRiskCount: number;
      redactionRuleCount: number;
      forbiddenActionCount: number;
      exitCriteriaCount: number;
      sourceReconciliationNoGoItemCount: number;
      sourceReconciliationNoGoCount: number;
      sourceExternalEvidenceReconciliationNoGoCount: number;
      sourceManualReviewerReconciliationNoGoCount: number;
      sourceReconciliationStillBlockedCount: number;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanReady: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanOnly: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPacketReady: true;
      sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPacketOnly: true;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationRecorded: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatesAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted: false;
      externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewComplete: false;
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
      archiveRemediationReviewNoGoReconciliationRemediationPlanRules: string[];
      archiveRemediationReviewNoGoReconciliationRemediationReviewRules: string[];
      sourceArchiveRemediationReviewNoGoReconciliationNoGoRules: string[];
      sourceArchiveRemediationReviewNoGoReconciliationNoGoItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoItem[];
      archiveRemediationReviewNoGoReconciliationRemediationItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationItem[];
    };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationProbeResult =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPayload & {
    blocked: true;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatus;
    summary: string;
    archiveRemediationReviewNoGoReconciliationRemediationItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationItem[];
  };
