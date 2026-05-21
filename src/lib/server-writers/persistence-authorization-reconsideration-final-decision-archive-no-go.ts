import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchive } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-no-go";

const archiveNoGoBlockedCodes = [
  "implementation_authorization_reconsideration_external_final_decision_archive_no_go_packet_only",
  "source_external_final_decision_archive_checklist_still_incomplete",
  "external_final_decision_archive_no_go_acceptance_forbidden",
  "external_final_decision_archive_no_go_record_forbidden",
  "external_final_decision_archive_acceptance_forbidden",
  "final_decision_archive_completeness_acceptance_forbidden",
  "final_decision_archive_storage_forbidden",
  "final_decision_archive_upload_forbidden",
  "final_decision_archive_read_forbidden",
  "final_decision_archive_hash_forbidden",
  "final_decision_archive_index_persistence_forbidden",
  "archive_no_go_to_final_decision_promotion_forbidden",
  "final_decision_acceptance_forbidden",
  "final_decision_record_forbidden",
  "final_no_go_acceptance_forbidden",
  "final_no_go_record_forbidden",
  "final_go_record_forbidden",
  "implementation_authorization_denial_forbidden",
  "implementation_authorization_grant_forbidden",
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

const archiveNoGoRuntimeBlockedFlags = {
  wouldAcceptExternalFinalDecisionArchiveNoGo: false,
  wouldRecordExternalFinalDecisionArchiveNoGo: false,
  wouldDenyImplementationAuthorizationFromArchiveNoGo: false,
  wouldPromoteArchiveNoGoToFinalDecision: false,
} as const satisfies Pick<
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoRuntimeFlags,
  | "wouldAcceptExternalFinalDecisionArchiveNoGo"
  | "wouldRecordExternalFinalDecisionArchiveNoGo"
  | "wouldDenyImplementationAuthorizationFromArchiveNoGo"
  | "wouldPromoteArchiveNoGoToFinalDecision"
>;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function mapNoGoStatus(
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveStatus,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoStatus {
  return status === "archive_gap_external_evidence_missing"
    ? "archive_no_go_external_evidence_missing"
    : "archive_no_go_manual_reviewer_missing";
}

function buildArchiveNoGoItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoItem {
  const externalEvidenceMissing =
    sourceItem.status === "archive_gap_external_evidence_missing";

  return {
    id: `${sourceItem.id}_no_go`,
    category: sourceItem.category,
    title: `${sourceItem.title} no-go`,
    status: mapNoGoStatus(sourceItem.status),
    owner: sourceItem.owner,
    sourceArchiveStatus: sourceItem.status,
    sourceArchiveItemIds: [sourceItem.id],
    sourceDecisionItemIds: sourceItem.sourceDecisionItemIds,
    sourceNoGoItemIds: sourceItem.sourceNoGoItemIds,
    sourceReviewItemIds: sourceItem.sourceReviewItemIds,
    sourceReconsiderationRemediationItemIds:
      sourceItem.sourceReconsiderationRemediationItemIds,
    sourcePreflightItemIds: sourceItem.sourcePreflightItemIds,
    sourceOriginalRemediationItemIds: sourceItem.sourceOriginalRemediationItemIds,
    sourceRefs: sourceItem.sourceRefs,
    noGoQuestion:
      "Can this external final decision archive checklist item unlock implementation authorization now?",
    noGoConclusion: externalEvidenceMissing
      ? "No. Required external evidence archive material is still missing or unaccepted, so the app cannot accept the archive, accept the final decision, or grant implementation authorization."
      : "No. A named manual reviewer archive decision is still missing, so the app cannot accept the archive, accept the final decision, or grant implementation authorization.",
    blockingArchiveEvidence: unique([
      sourceItem.archiveConclusion,
      ...sourceItem.requiredExternalArtifacts,
      ...sourceItem.completenessChecks,
      "externalFinalDecisionArchiveAccepted=false",
      "finalDecisionArchiveCompletenessAccepted=false",
      "finalDecisionArchiveNoGoAccepted=false",
      "authorizationReconsiderationFinalDecisionAccepted=false",
      "implementationAuthorizationGranted=false",
      "readyForAdapterImplementation=false",
    ]),
    unresolvedArchiveGaps: unique([
      ...sourceItem.requiredArchiveMetadata,
      ...sourceItem.requiredExternalArtifacts,
      ...sourceItem.tamperEvidenceRules,
      "The app has not uploaded, read, hashed, indexed, stored, or accepted any external archive artifact.",
      "The app has not recorded any archive no-go, final decision, final no-go, final go, authorization denial, or authorization grant.",
    ]),
    forbiddenShortcuts: unique([
      ...sourceItem.forbiddenArchiveShortcuts,
      "Do not treat this archive no-go packet as an accepted archive, accepted denial, accepted final decision, authorization grant, or implementation approval.",
      "Do not create implementation files, tests, migrations, service-role clients, branches, transactions, row writes, feature flags, deployments, AI calls, Stripe calls, or report unlocks from this no-go packet.",
    ]),
    futureResolutionPrerequisites: unique([
      ...sourceItem.requiredArchiveMetadata,
      ...sourceItem.requiredExternalArtifacts,
      ...sourceItem.completenessChecks,
      ...sourceItem.retentionRules,
      ...sourceItem.tamperEvidenceRules,
      "A separate human-controlled process must decide whether any future external archive can be accepted.",
      "A future implementation authorization stage must remain separate from this generated no-go packet.",
    ]),
    safeArchiveRefs: unique([
      ...sourceItem.safeDecisionRefs,
      ...sourceItem.sourceRefs,
      ...sourceItem.sourceDecisionItemIds,
    ]),
    redactionRules: sourceItem.redactionRules,
    nonAcceptanceClauses: unique([
      ...sourceItem.nonAcceptanceClauses,
      "This archive no-go item is not a stored artifact, not an accepted external archive, not an accepted final no-go, and not an implementation authorization decision.",
      "Archive no-go readiness only documents why implementation remains blocked.",
    ]),
    nextSafeAction:
      "Keep implementation authorization blocked and define only a read-only external final decision archive remediation plan next.",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoItem[],
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoItem[],
  key:
    | "blockingArchiveEvidence"
    | "unresolvedArchiveGaps"
    | "forbiddenShortcuts"
    | "futureResolutionPrerequisites",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoPayload,
) {
  return {
    ...payload,
    blocked: true as const,
    externalFinalDecisionArchiveNoGoPacketOnly: true as const,
    sourceExternalFinalDecisionArchiveChecklistOnly: true as const,
    externalFinalDecisionArchiveChecklistOnly: true as const,
    externalFinalDecisionArchiveRequired: true as const,
    externalFinalDecisionStorageExternal: true as const,
    sourceFinalDecisionPacketOnly: true as const,
    sourceFinalNoGoPacketOnly: true as const,
    sourceReviewNoGoPacketOnly: true as const,
    sourceReleaseStillBlocked: true as const,
  };
}

export async function buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGo(): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoPayload> {
  const sourceArchive =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchive();
  const archiveNoGoItems =
    sourceArchive.archiveItems.map(buildArchiveNoGoItem);
  const blockedCodes = unique([
    ...sourceArchive.blockedCodes,
    ...archiveNoGoBlockedCodes,
  ]);

  return {
    ...sourceArchive,
    safeMode: true,
    readOnly: true,
    externalFinalDecisionArchiveNoGoMode:
      "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_no_go_packet_only",
    sourceExternalFinalDecisionArchiveMode:
      sourceArchive.externalFinalDecisionArchiveMode,
    checkedAt: new Date().toISOString(),
    noGoItemCount: archiveNoGoItems.length,
    archiveNoGoCount: archiveNoGoItems.length,
    externalEvidenceArchiveNoGoCount: countByStatus(
      archiveNoGoItems,
      "archive_no_go_external_evidence_missing",
    ),
    manualReviewerArchiveNoGoCount: countByStatus(
      archiveNoGoItems,
      "archive_no_go_manual_reviewer_missing",
    ),
    archiveStillBlockedCount: archiveNoGoItems.length,
    sourceArchiveItemCount: sourceArchive.archiveItemCount,
    sourceArchiveIncompleteCount: sourceArchive.archiveIncompleteCount,
    sourceArchiveCompleteCount: sourceArchive.archiveCompleteCount,
    sourceExternalEvidenceArchiveGapCount:
      sourceArchive.externalEvidenceArchiveGapCount,
    sourceManualReviewerArchiveGapCount:
      sourceArchive.manualReviewerArchiveGapCount,
    blockingArchiveEvidenceCount: uniqueCount(
      archiveNoGoItems,
      "blockingArchiveEvidence",
    ),
    unresolvedArchiveGapCount: uniqueCount(
      archiveNoGoItems,
      "unresolvedArchiveGaps",
    ),
    forbiddenShortcutCount: uniqueCount(archiveNoGoItems, "forbiddenShortcuts"),
    futureResolutionPrerequisiteCount: uniqueCount(
      archiveNoGoItems,
      "futureResolutionPrerequisites",
    ),
    externalFinalDecisionArchiveNoGoPacketReady: true,
    externalFinalDecisionArchiveNoGoPacketOnly: true,
    sourceExternalFinalDecisionArchiveChecklistReady:
      sourceArchive.externalFinalDecisionArchiveChecklistReady,
    sourceExternalFinalDecisionArchiveChecklistOnly:
      sourceArchive.externalFinalDecisionArchiveChecklistOnly,
    finalDecisionArchiveNoGoAccepted: false,
    finalDecisionArchiveNoGoRecorded: false,
    externalFinalDecisionArchiveAccepted: false,
    finalDecisionArchiveCompletenessAccepted: false,
    authorizationReconsiderationFinalDecisionAccepted: false,
    authorizationReconsiderationFinalDecisionRecorded: false,
    finalGoDecisionReady: false,
    finalGoDecisionRecorded: false,
    finalNoGoDecisionAccepted: false,
    finalNoGoDecisionRecorded: false,
    implementationAuthorizationReconsiderationReady: false,
    implementationAuthorizationGranted: false,
    implementationAuthorized: false,
    authorizationDecisionRecorded: false,
    authorizationArtifactStored: false,
    readyForAdapterImplementation: false,
    allRuntimeEffectsBlocked: true,
    ...archiveNoGoRuntimeBlockedFlags,
    blockedCodes,
    archiveNoGoRules: [
      "This endpoint is a read-only external final decision archive no-go packet, not an archive acceptance system.",
      "It may summarize why the external final decision archive checklist still cannot unlock implementation authorization.",
      "It must not accept archive no-go items, record no-go outcomes, accept external archives, mark archive completeness, accept final decisions, record final go/no-go, deny authorization, grant authorization, store approval artifacts, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
      "No-go packet readiness does not mean any external artifact exists, any archive was accepted, any final decision was accepted, or any authorization decision was recorded.",
    ],
    implementationBoundaryRules: [
      "The archive no-go packet must start from the archive checklist and source archive item ids.",
      "Only safe item ids, owner roles, redacted evidence refs, timestamps, status labels, and plain-language conclusions may be referenced.",
      "Raw artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, and full external document bodies are forbidden.",
      "No implementation branch, patch, test, migration, service-role client, database write, deployment, feature flag, production writer, AI, Stripe, or report unlock may start from this no-go packet.",
      "The read-only external final decision archive remediation review checklist now exists; the next safe stage is a read-only external final decision archive remediation review no-go packet, and it must still remain non-executable.",
    ],
    sourceArchiveChecklistRules: sourceArchive.archiveChecklistRules,
    sourceArchiveItems: sourceArchive.archiveItems,
    archiveNoGoItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGo(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGo();
  const blockedSummary =
    "Persistence authorization reconsideration final decision archive no-go probe blocked: no archive no-go acceptance, archive no-go record, archive upload, archive read, archive hash, archive index write, archive completeness acceptance, external archive acceptance, final decision acceptance, final go/no-go record, authorization denial, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      archiveNoGoItems: payload.archiveNoGoItems,
    };
  }

  const itemId =
    (requestBody as { itemId?: unknown; noGoItemId?: unknown }).itemId ??
    (requestBody as { noGoItemId?: unknown }).noGoItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      archiveNoGoItems: payload.archiveNoGoItems,
    };
  }

  const selectedItem = payload.archiveNoGoItems.find(
    (candidate) => candidate.id === itemId,
  );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      archiveNoGoItems: payload.archiveNoGoItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration final decision archive no-go probe blocked as designed: the selected archive no-go item was returned, but no archive no-go acceptance, archive no-go record, archive upload, archive read, archive hash, archive index write, archive completeness acceptance, external archive acceptance, final decision acceptance, final go/no-go record, authorization denial, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    archiveNoGoItems: [selectedItem],
  };
}
