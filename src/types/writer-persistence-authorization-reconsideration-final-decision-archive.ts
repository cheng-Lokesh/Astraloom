import type {
  WriterPersistenceAuthorizationRemediationCategory,
  WriterPersistenceAuthorizationRemediationOwner,
} from "@/types/writer-persistence-authorization-remediation";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionMode,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveMode =
  "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_checklist_only";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveStatus =
  | "archive_gap_external_evidence_missing"
  | "archive_gap_manual_reviewer_missing";

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveItem =
  {
    id: string;
    category: WriterPersistenceAuthorizationRemediationCategory;
    title: string;
    status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveStatus;
    owner: WriterPersistenceAuthorizationRemediationOwner;
    sourceDecisionStatus: WriterPersistenceAuthorizationReconsiderationFinalDecisionStatus;
    sourceDecisionItemIds: string[];
    sourceNoGoItemIds: string[];
    sourceReviewItemIds: string[];
    sourceReconsiderationRemediationItemIds: string[];
    sourcePreflightItemIds: string[];
    sourceOriginalRemediationItemIds: string[];
    sourceRefs: string[];
    archiveQuestion: string;
    archiveConclusion: string;
    requiredArchiveMetadata: string[];
    requiredExternalArtifacts: string[];
    completenessChecks: string[];
    redactionRules: string[];
    retentionRules: string[];
    tamperEvidenceRules: string[];
    forbiddenArchiveShortcuts: string[];
    safeDecisionRefs: string[];
    nonAcceptanceClauses: string[];
    nextSafeAction: string;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRuntimeFlags =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionRuntimeFlags & {
    wouldStoreFinalDecisionArchiveArtifact: false;
    wouldUploadFinalDecisionArchiveArtifact: false;
    wouldReadFinalDecisionArchiveArtifact: false;
    wouldHashFinalDecisionArchiveArtifact: false;
    wouldPersistFinalDecisionArchiveIndex: false;
    wouldMarkFinalDecisionArchiveComplete: false;
    wouldAcceptExternalFinalDecisionArchive: false;
  };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchivePayload =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionPayload &
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRuntimeFlags & {
      externalFinalDecisionArchiveMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveMode;
      sourceFinalDecisionMode: WriterPersistenceAuthorizationReconsiderationFinalDecisionMode;
      archiveItemCount: number;
      archiveIncompleteCount: number;
      archiveCompleteCount: number;
      externalEvidenceArchiveGapCount: number;
      manualReviewerArchiveGapCount: number;
      finalDecisionStillBlockedCount: number;
      sourceDecisionItemCount: number;
      sourceFinalNoGoCount: number;
      sourceFinalGoCount: number;
      sourceAuthorizationStillBlockedCount: number;
      requiredArchiveMetadataCount: number;
      requiredExternalArtifactCount: number;
      archiveCompletenessCheckCount: number;
      archiveRedactionRuleCount: number;
      tamperEvidenceRuleCount: number;
      externalFinalDecisionArchiveChecklistReady: true;
      externalFinalDecisionArchiveChecklistOnly: true;
      externalFinalDecisionArchiveRequired: true;
      externalFinalDecisionStorageExternal: true;
      sourceFinalDecisionPacketReady: true;
      sourceFinalDecisionPacketOnly: true;
      sourceFinalNoGoPacketReady: true;
      sourceFinalNoGoPacketOnly: true;
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
      finalDecisionArchiveArtifactStored: false;
      finalDecisionArchiveArtifactUploaded: false;
      finalDecisionArchiveArtifactRead: false;
      finalDecisionArchiveArtifactHashCreated: false;
      finalDecisionArchiveIndexPersisted: false;
      finalDecisionArchiveCompletenessAccepted: false;
      externalFinalDecisionArchiveAccepted: false;
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
      archiveChecklistRules: string[];
      externalArchiveBoundaryRules: string[];
      sourceFinalDecisionRules: string[];
      sourceDecisionItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionItem[];
      archiveItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveItem[];
    };

export type WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveProbeResult =
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchivePayload & {
    blocked: true;
    itemId?: string;
    itemTitle?: string;
    itemStatus?: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveStatus;
    summary: string;
    archiveItems: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveItem[];
  };
