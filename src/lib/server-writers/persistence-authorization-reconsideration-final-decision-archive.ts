import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationFinalDecision } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchivePayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision";

const archiveBlockedCodes = [
  "implementation_authorization_reconsideration_external_final_decision_archive_checklist_only",
  "source_final_decision_packet_still_no_go",
  "final_decision_archive_storage_forbidden",
  "final_decision_archive_upload_forbidden",
  "final_decision_archive_read_forbidden",
  "final_decision_archive_hash_forbidden",
  "final_decision_archive_index_persistence_forbidden",
  "final_decision_archive_completeness_acceptance_forbidden",
  "external_final_decision_archive_acceptance_forbidden",
  "final_decision_acceptance_forbidden",
  "final_decision_record_forbidden",
  "final_no_go_acceptance_forbidden",
  "final_no_go_record_forbidden",
  "final_go_record_forbidden",
  "implementation_authorization_grant_forbidden",
  "implementation_authorization_denial_forbidden",
  "authorization_artifact_storage_forbidden",
  "approval_storage_forbidden",
  "feature_flag_enablement_forbidden",
  "deployment_forbidden",
  "production_writer_execution_forbidden",
  "branch_creation_forbidden",
  "file_creation_forbidden",
  "file_modification_forbidden",
  "test_creation_forbidden",
  "service_role_client_forbidden",
  "transaction_forbidden",
  "database_writes_forbidden",
  "migration_creation_forbidden",
  "ai_stripe_report_side_effects_forbidden",
];

const archiveRuntimeBlockedFlags = {
  wouldStoreFinalDecisionArchiveArtifact: false,
  wouldUploadFinalDecisionArchiveArtifact: false,
  wouldReadFinalDecisionArchiveArtifact: false,
  wouldHashFinalDecisionArchiveArtifact: false,
  wouldPersistFinalDecisionArchiveIndex: false,
  wouldMarkFinalDecisionArchiveComplete: false,
  wouldAcceptExternalFinalDecisionArchive: false,
} as const;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function mapArchiveStatus(
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionStatus,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveStatus {
  return status === "final_no_go_external_evidence_missing"
    ? "archive_gap_external_evidence_missing"
    : "archive_gap_manual_reviewer_missing";
}

function buildArchiveItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveItem {
  const externalEvidenceMissing =
    sourceItem.status === "final_no_go_external_evidence_missing";

  return {
    id: `${sourceItem.id}_archive_check`,
    category: sourceItem.category,
    title: `${sourceItem.title} archive checklist`,
    status: mapArchiveStatus(sourceItem.status),
    owner: sourceItem.owner,
    sourceDecisionStatus: sourceItem.status,
    sourceDecisionItemIds: [sourceItem.id],
    sourceNoGoItemIds: sourceItem.sourceNoGoItemIds,
    sourceReviewItemIds: sourceItem.sourceReviewItemIds,
    sourceReconsiderationRemediationItemIds:
      sourceItem.sourceReconsiderationRemediationItemIds,
    sourcePreflightItemIds: sourceItem.sourcePreflightItemIds,
    sourceOriginalRemediationItemIds: sourceItem.sourceOriginalRemediationItemIds,
    sourceRefs: sourceItem.sourceRefs,
    archiveQuestion:
      "What external archive evidence would be required before this final decision could be reviewed again?",
    archiveConclusion: externalEvidenceMissing
      ? "Archive incomplete. The external evidence bundle is still missing or unaccepted, so the app cannot accept any final decision or grant implementation authorization."
      : "Archive incomplete. A named manual reviewer decision is still missing, so the app cannot accept any final decision or grant implementation authorization.",
    requiredArchiveMetadata: unique([
      "external archive id",
      "source final decision item id",
      "owner lane",
      "named accountable reviewer",
      "created timestamp",
      "current, superseded, or rejected status",
      "redacted evidence reference list",
      "source blocker id list",
    ]),
    requiredExternalArtifacts: externalEvidenceMissing
      ? unique([
          "redacted external evidence bundle",
          "evidence owner attestation",
          "evidence completeness note",
          "evidence redaction note",
          "source final no-go cross-reference",
        ])
      : unique([
          "manual reviewer decision note",
          "reviewer authority attestation",
          "review scope statement",
          "reviewer redaction note",
          "source final no-go cross-reference",
        ]),
    completenessChecks: unique([
      ...sourceItem.goPrerequisitesForFuture,
      "Every archive item must map to exactly one source final decision item.",
      "The external archive must name the owner, reviewer, artifact status, and supersession chain.",
      "The archive must prove whether the item remains no-go or is eligible for a future separate human go process.",
      "The application must not mark archive completeness from this generated checklist.",
    ]),
    redactionRules: unique([
      ...sourceItem.redactionRules,
      "Archive metadata may contain safe ids, owner roles, timestamps, and redacted evidence refs only.",
      "Do not include private user narratives, raw prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, or full external document bodies.",
    ]),
    retentionRules: [
      "Retention owner must be named outside the application.",
      "Superseded artifacts must remain traceable without destructive deletion.",
      "Access control must be defined outside the application before any future human review.",
    ],
    tamperEvidenceRules: [
      "A future external archive should include an external checksum or immutable version marker.",
      "The app must not create or validate that checksum in this stage.",
      "Any supersession must reference the prior external archive id.",
    ],
    forbiddenArchiveShortcuts: unique([
      ...sourceItem.forbiddenGoShortcuts,
      "Do not upload, read, hash, index, store, or accept external final decision artifacts from this checklist.",
      "Do not treat archive checklist readiness as final decision acceptance, final no-go recording, final go recording, authorization denial, authorization grant, or implementation approval.",
    ]),
    safeDecisionRefs: sourceItem.safeDecisionRefs,
    nonAcceptanceClauses: unique([
      ...sourceItem.nonAcceptanceClauses,
      "This archive checklist item is not an external artifact, not a stored archive, not a reviewed decision, and not an accepted decision.",
      "External archive requirements remain outside the app until a separate human-controlled process is deliberately introduced.",
    ]),
    nextSafeAction:
      "Keep implementation authorization blocked; the read-only external final decision archive remediation review checklist now exists, and the next safe packet is a read-only external final decision archive remediation review no-go packet.",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveItem[],
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveItem[],
  key:
    | "requiredArchiveMetadata"
    | "requiredExternalArtifacts"
    | "completenessChecks"
    | "redactionRules"
    | "tamperEvidenceRules",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchivePayload,
) {
  return {
    ...payload,
    blocked: true as const,
    externalFinalDecisionArchiveChecklistOnly: true as const,
    externalFinalDecisionArchiveRequired: true as const,
    externalFinalDecisionStorageExternal: true as const,
    sourceFinalDecisionPacketOnly: true as const,
    sourceFinalNoGoPacketOnly: true as const,
    sourceReviewNoGoPacketOnly: true as const,
    sourceReleaseStillBlocked: true as const,
  };
}

export async function buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchive(): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchivePayload> {
  const sourceFinalDecision =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecision();
  const archiveItems =
    sourceFinalDecision.decisionItems.map(buildArchiveItem);
  const blockedCodes = unique([
    ...sourceFinalDecision.blockedCodes,
    ...archiveBlockedCodes,
  ]);

  return {
    ...sourceFinalDecision,
    safeMode: true,
    readOnly: true,
    externalFinalDecisionArchiveMode:
      "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_checklist_only",
    sourceFinalDecisionMode:
      sourceFinalDecision.authorizationReconsiderationFinalDecisionMode,
    checkedAt: new Date().toISOString(),
    archiveItemCount: archiveItems.length,
    archiveIncompleteCount: archiveItems.length,
    archiveCompleteCount: 0,
    externalEvidenceArchiveGapCount: countByStatus(
      archiveItems,
      "archive_gap_external_evidence_missing",
    ),
    manualReviewerArchiveGapCount: countByStatus(
      archiveItems,
      "archive_gap_manual_reviewer_missing",
    ),
    finalDecisionStillBlockedCount: archiveItems.length,
    sourceDecisionItemCount: sourceFinalDecision.decisionItemCount,
    sourceFinalNoGoCount: sourceFinalDecision.finalNoGoCount,
    sourceFinalGoCount: sourceFinalDecision.finalGoCount,
    sourceAuthorizationStillBlockedCount:
      sourceFinalDecision.authorizationStillBlockedCount,
    requiredArchiveMetadataCount: uniqueCount(
      archiveItems,
      "requiredArchiveMetadata",
    ),
    requiredExternalArtifactCount: uniqueCount(
      archiveItems,
      "requiredExternalArtifacts",
    ),
    archiveCompletenessCheckCount: uniqueCount(
      archiveItems,
      "completenessChecks",
    ),
    archiveRedactionRuleCount: uniqueCount(archiveItems, "redactionRules"),
    tamperEvidenceRuleCount: uniqueCount(archiveItems, "tamperEvidenceRules"),
    externalFinalDecisionArchiveChecklistReady: true,
    externalFinalDecisionArchiveChecklistOnly: true,
    externalFinalDecisionArchiveRequired: true,
    externalFinalDecisionStorageExternal: true,
    sourceFinalDecisionPacketReady:
      sourceFinalDecision.finalDecisionPacketReady,
    sourceFinalDecisionPacketOnly:
      sourceFinalDecision.finalDecisionPacketOnly,
    sourceFinalNoGoPacketReady: sourceFinalDecision.finalNoGoPacketReady,
    sourceFinalNoGoPacketOnly: sourceFinalDecision.finalNoGoPacketOnly,
    sourceReviewNoGoPacketReady: sourceFinalDecision.sourceReviewNoGoPacketReady,
    sourceReviewNoGoPacketOnly: sourceFinalDecision.sourceReviewNoGoPacketOnly,
    sourceReconsiderationRemediationReviewChecklistReady:
      sourceFinalDecision.sourceReconsiderationRemediationReviewChecklistReady,
    sourceReconsiderationRemediationReviewChecklistOnly:
      sourceFinalDecision.sourceReconsiderationRemediationReviewChecklistOnly,
    sourceReconsiderationRemediationPlanReady:
      sourceFinalDecision.sourceReconsiderationRemediationPlanReady,
    sourceReconsiderationRemediationPlanOnly:
      sourceFinalDecision.sourceReconsiderationRemediationPlanOnly,
    sourceReconsiderationNoGoPacketReady:
      sourceFinalDecision.sourceReconsiderationNoGoPacketReady,
    sourceReconsiderationNoGoPacketOnly:
      sourceFinalDecision.sourceReconsiderationNoGoPacketOnly,
    sourcePreflightChecklistReady:
      sourceFinalDecision.sourcePreflightChecklistReady,
    sourcePreflightChecklistOnly:
      sourceFinalDecision.sourcePreflightChecklistOnly,
    sourceReleaseStillBlocked: sourceFinalDecision.sourceReleaseStillBlocked,
    finalDecisionArchiveArtifactStored: false,
    finalDecisionArchiveArtifactUploaded: false,
    finalDecisionArchiveArtifactRead: false,
    finalDecisionArchiveArtifactHashCreated: false,
    finalDecisionArchiveIndexPersisted: false,
    finalDecisionArchiveCompletenessAccepted: false,
    externalFinalDecisionArchiveAccepted: false,
    finalGoDecisionReady: false,
    finalGoDecisionRecorded: false,
    finalNoGoDecisionAccepted: false,
    finalNoGoDecisionRecorded: false,
    authorizationReconsiderationFinalDecisionAccepted: false,
    authorizationReconsiderationFinalDecisionRecorded: false,
    implementationAuthorizationReconsiderationReady: false,
    implementationAuthorizationGranted: false,
    implementationAuthorized: false,
    authorizationDecisionRecorded: false,
    authorizationArtifactStored: false,
    readyForAdapterImplementation: false,
    allRuntimeEffectsBlocked: true,
    ...archiveRuntimeBlockedFlags,
    blockedCodes,
    archiveChecklistRules: [
      "This endpoint is a read-only external final decision archive checklist, not an archive storage system.",
      "It may define the metadata, external artifacts, completeness checks, redaction rules, retention rules, and tamper-evidence rules a future external archive would need.",
      "It must not upload, read, hash, index, store, or accept any external archive artifact.",
      "It must not accept final decisions, record final go/no-go, deny authorization, grant authorization, store approval artifacts, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
      "Checklist readiness does not mean the external archive exists, is complete, has been reviewed, or can unlock implementation.",
    ],
    externalArchiveBoundaryRules: [
      "The archive checklist must start from the final decision packet and source decision item ids.",
      "Only safe ids, owner roles, status labels, redacted evidence refs, timestamps, and short archive requirements may be displayed.",
      "Raw artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, and full external document bodies are forbidden.",
      "Any future archive artifact must remain outside the app until a separate human-controlled authorization process is introduced.",
      "The read-only external final decision archive remediation review checklist now exists; the next safe stage is a read-only external final decision archive remediation review no-go packet, and it must still remain non-executable.",
    ],
    sourceFinalDecisionRules: sourceFinalDecision.finalDecisionRules,
    sourceDecisionItems: sourceFinalDecision.decisionItems,
    sourceBlockedCodes: sourceFinalDecision.blockedCodes,
    archiveItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationFinalDecisionArchive(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchive();
  const blockedSummary =
    "Persistence authorization reconsideration final decision archive probe blocked: no archive upload, archive read, archive hash, archive index write, archive completeness acceptance, external archive acceptance, final decision acceptance, final go/no-go record, authorization denial, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      archiveItems: payload.archiveItems,
    };
  }

  const itemId =
    (requestBody as { itemId?: unknown; archiveItemId?: unknown }).itemId ??
    (requestBody as { archiveItemId?: unknown }).archiveItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      archiveItems: payload.archiveItems,
    };
  }

  const selectedItem = payload.archiveItems.find(
    (candidate) => candidate.id === itemId,
  );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      archiveItems: payload.archiveItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration final decision archive probe blocked as designed: the selected archive checklist item was returned, but no archive upload, archive read, archive hash, archive index write, archive completeness acceptance, external archive acceptance, final decision acceptance, final go/no-go record, authorization denial, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    archiveItems: [selectedItem],
  };
}
