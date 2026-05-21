import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReview } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review";
import type { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewItem } from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go";

const archiveRemediationReviewNoGoBlockedCodes = [
  "implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_packet_only",
  "source_external_final_decision_archive_remediation_review_still_blocks_authorization",
  "archive_remediation_review_no_go_acceptance_forbidden",
  "archive_remediation_review_no_go_record_forbidden",
  "archive_remediation_review_authorization_denial_forbidden",
  "archive_remediation_review_no_go_final_decision_promotion_forbidden",
  "archive_remediation_review_acceptance_forbidden",
  "archive_remediation_review_record_forbidden",
  "archive_remediation_review_evidence_storage_forbidden",
  "archive_remediation_external_review_mark_forbidden",
  "archive_remediation_acceptance_forbidden",
  "archive_remediation_evidence_record_forbidden",
  "archive_remediation_state_acceptance_forbidden",
  "archive_blocker_resolution_forbidden",
  "archive_no_go_acceptance_forbidden",
  "archive_no_go_record_forbidden",
  "external_archive_acceptance_forbidden",
  "final_decision_acceptance_forbidden",
  "final_decision_record_forbidden",
  "final_go_no_go_record_forbidden",
  "implementation_authorization_grant_forbidden",
  "authorization_record_creation_forbidden",
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
  "audit_idempotency_writes_forbidden",
  "migration_creation_forbidden",
  "ai_stripe_report_side_effects_forbidden",
];

const archiveRemediationReviewNoGoRuntimeBlockedFlags = {
  wouldAcceptFinalDecisionArchiveRemediationReviewNoGo: false,
  wouldRecordFinalDecisionArchiveRemediationReviewNoGo: false,
  wouldDenyImplementationAuthorizationFromArchiveRemediationReview: false,
  wouldPromoteArchiveRemediationReviewNoGoToFinalDecision: false,
} as const satisfies Pick<
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoRuntimeFlags,
  | "wouldAcceptFinalDecisionArchiveRemediationReviewNoGo"
  | "wouldRecordFinalDecisionArchiveRemediationReviewNoGo"
  | "wouldDenyImplementationAuthorizationFromArchiveRemediationReview"
  | "wouldPromoteArchiveRemediationReviewNoGoToFinalDecision"
>;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function mapStatus(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoStatus {
  return sourceItem.status === "archive_review_external_evidence_missing"
    ? "archive_remediation_review_no_go_external_evidence_missing"
    : "archive_remediation_review_no_go_manual_reviewer_required";
}

function noGoTitle(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewItem,
) {
  if (sourceItem.title.endsWith(" review")) {
    return sourceItem.title.replace(/ review$/, " no-go");
  }

  return `${sourceItem.title} no-go`;
}

function buildArchiveRemediationReviewNoGoItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoItem {
  const externalEvidenceMissing =
    sourceItem.status === "archive_review_external_evidence_missing";

  return {
    id: `${sourceItem.id}_no_go`,
    category: sourceItem.category,
    title: noGoTitle(sourceItem),
    status: mapStatus(sourceItem),
    owner: sourceItem.owner,
    sourceReviewStatus: sourceItem.status,
    sourceReviewItemIds: [sourceItem.id],
    sourceRemediationItemIds: sourceItem.sourceRemediationItemIds,
    sourceArchiveNoGoItemIds: sourceItem.sourceArchiveNoGoItemIds,
    sourceArchiveItemIds: sourceItem.sourceArchiveItemIds,
    sourceDecisionItemIds: sourceItem.sourceDecisionItemIds,
    sourceNoGoItemIds: sourceItem.sourceNoGoItemIds,
    sourceReviewItemIdsFromReconsideration: sourceItem.sourceReviewItemIds,
    sourceReconsiderationRemediationItemIds:
      sourceItem.sourceReconsiderationRemediationItemIds,
    sourcePreflightItemIds: sourceItem.sourcePreflightItemIds,
    sourceOriginalRemediationItemIds: sourceItem.sourceOriginalRemediationItemIds,
    sourceRefs: sourceItem.sourceRefs,
    noGoQuestion:
      "Can this external final decision archive remediation review item unlock implementation authorization now?",
    noGoConclusion: externalEvidenceMissing
      ? "No. Required external archive evidence is still missing or unaccepted in app state, so the review cannot unlock implementation authorization."
      : "No. A manual archive reviewer is still required, and this read-only route cannot replace or record that reviewer conclusion.",
    blockerEvidence: unique([
      sourceItem.currentFinding,
      sourceItem.requiredExternalState,
      ...sourceItem.failCriteriaForCurrentReview,
      ...sourceItem.stillBlockedBecause,
      "externalFinalDecisionArchiveRemediationReviewNoGoAccepted=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoRecorded=false",
      "implementationAuthorizationGranted=false",
      "readyForAdapterImplementation=false",
    ]),
    unresolvedReviewGaps: unique([
      ...sourceItem.rejectionTriggers,
      ...sourceItem.stillBlockedBecause,
      "The application has not accepted archive remediation review outcomes.",
      "The application has not recorded archive remediation evidence or reviewer state.",
      "The application has not accepted archive no-go, external archive, final decision, or final go/no-go state.",
    ]),
    forbiddenShortcuts: unique([
      ...sourceItem.nonAcceptanceClauses,
      "Do not treat this no-go packet as an accepted denial, accepted review, accepted archive, accepted final decision, authorization grant, or implementation approval.",
      "Do not create implementation files, tests, migrations, service-role clients, branches, transactions, row writes, feature flags, deployments, production writers, AI calls, Stripe calls, or report unlocks from this packet.",
    ]),
    futureResolutionPrerequisites: unique([
      ...sourceItem.completenessChecks,
      ...sourceItem.passCriteriaForFutureReview,
      "A later external process must supply safe archive evidence or manual reviewer state before any go/no-go acceptance can be considered.",
      "Any later final decision must remain read-only until a separate human authorization mechanism is deliberately introduced.",
    ]),
    safeNoGoRefs: unique([
      ...sourceItem.safeEvidenceRefs,
      ...sourceItem.sourceRemediationItemIds,
      ...sourceItem.sourceArchiveNoGoItemIds,
      ...sourceItem.sourceArchiveItemIds,
      ...sourceItem.sourceDecisionItemIds,
    ]),
    redactionRules: unique([
      ...sourceItem.redactionChecks,
      "Only safe item ids, owner roles, state labels, redaction labels, tamper-evidence labels, caveats, and short review questions may be shown.",
      "Raw archive artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, and full external document bodies remain forbidden.",
    ]),
    nonAcceptanceClauses: unique([
      ...sourceItem.nonAcceptanceClauses,
      "This archive remediation review no-go item is not stored, accepted, signed, recorded, or promoted by the app.",
      "This archive remediation review no-go item does not deny authorization or grant authorization.",
    ]),
    nextSafeAction:
      "Keep implementation authorization blocked and define only a read-only archive remediation review no-go reconciliation checklist before any acceptance, recording, authorization, branch, migration, privileged client, deployment, AI, Stripe, report, or database-write work.",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoItem[],
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoItem[],
  key:
    | "blockerEvidence"
    | "unresolvedReviewGaps"
    | "forbiddenShortcuts"
    | "futureResolutionPrerequisites"
    | "redactionRules",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoPayload,
) {
  return {
    ...payload,
    blocked: true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoPacketOnly: true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewChecklistOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewChecklistOnly: true as const,
    sourceExternalFinalDecisionArchiveRemediationPlanOnly: true as const,
    externalFinalDecisionArchiveRemediationPlanOnly: true as const,
    sourceExternalFinalDecisionArchiveNoGoPacketOnly: true as const,
    externalFinalDecisionArchiveNoGoPacketOnly: true as const,
    sourceExternalFinalDecisionArchiveChecklistOnly: true as const,
    externalFinalDecisionArchiveChecklistOnly: true as const,
    sourceFinalDecisionPacketOnly: true as const,
    sourceFinalNoGoPacketOnly: true as const,
    sourceReviewNoGoPacketOnly: true as const,
    sourceReleaseStillBlocked: true as const,
  };
}

export async function buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGo(): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoPayload> {
  const sourceReview =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReview();
  const archiveRemediationReviewNoGoItems =
    sourceReview.archiveRemediationReviewItems.map(
      buildArchiveRemediationReviewNoGoItem,
    );
  const blockedCodes = unique([
    ...sourceReview.blockedCodes,
    ...archiveRemediationReviewNoGoBlockedCodes,
  ]);

  return {
    ...sourceReview,
    safeMode: true,
    readOnly: true,
    externalFinalDecisionArchiveRemediationReviewNoGoMode:
      "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_packet_only",
    sourceExternalFinalDecisionArchiveRemediationReviewChecklistMode:
      sourceReview.externalFinalDecisionArchiveRemediationReviewChecklistMode,
    checkedAt: new Date().toISOString(),
    noGoItemCount: archiveRemediationReviewNoGoItems.length,
    archiveReviewNoGoCount: archiveRemediationReviewNoGoItems.length,
    externalEvidenceNoGoCount: countByStatus(
      archiveRemediationReviewNoGoItems,
      "archive_remediation_review_no_go_external_evidence_missing",
    ),
    manualReviewerNoGoCount: countByStatus(
      archiveRemediationReviewNoGoItems,
      "archive_remediation_review_no_go_manual_reviewer_required",
    ),
    archiveRemediationReviewStillBlockedCount:
      archiveRemediationReviewNoGoItems.length,
    blockerEvidenceCount: uniqueCount(
      archiveRemediationReviewNoGoItems,
      "blockerEvidence",
    ),
    unresolvedReviewGapCount: uniqueCount(
      archiveRemediationReviewNoGoItems,
      "unresolvedReviewGaps",
    ),
    forbiddenShortcutCount: uniqueCount(
      archiveRemediationReviewNoGoItems,
      "forbiddenShortcuts",
    ),
    futureResolutionPrerequisiteCount: uniqueCount(
      archiveRemediationReviewNoGoItems,
      "futureResolutionPrerequisites",
    ),
    redactionRuleCount: uniqueCount(
      archiveRemediationReviewNoGoItems,
      "redactionRules",
    ),
    sourceReviewItemCount: sourceReview.reviewItemCount,
    sourceExternalEvidenceMissingCount: sourceReview.externalEvidenceMissingCount,
    sourceManualReviewerRequiredCount: sourceReview.manualReviewerRequiredCount,
    sourceArchiveRemediationStillBlockedCount:
      sourceReview.archiveRemediationStillBlockedCount,
    externalFinalDecisionArchiveRemediationReviewNoGoPacketReady: true,
    externalFinalDecisionArchiveRemediationReviewNoGoPacketOnly: true,
    sourceExternalFinalDecisionArchiveRemediationReviewChecklistReady:
      sourceReview.externalFinalDecisionArchiveRemediationReviewChecklistReady,
    sourceExternalFinalDecisionArchiveRemediationReviewChecklistOnly:
      sourceReview.externalFinalDecisionArchiveRemediationReviewChecklistOnly,
    sourceExternalFinalDecisionArchiveRemediationPlanReady:
      sourceReview.sourceExternalFinalDecisionArchiveRemediationPlanReady,
    sourceExternalFinalDecisionArchiveRemediationPlanOnly:
      sourceReview.sourceExternalFinalDecisionArchiveRemediationPlanOnly,
    sourceExternalFinalDecisionArchiveNoGoPacketReady:
      sourceReview.sourceExternalFinalDecisionArchiveNoGoPacketReady,
    sourceExternalFinalDecisionArchiveNoGoPacketOnly:
      sourceReview.sourceExternalFinalDecisionArchiveNoGoPacketOnly,
    externalFinalDecisionArchiveRemediationReviewNoGoAccepted: false,
    externalFinalDecisionArchiveRemediationReviewNoGoRecorded: false,
    finalDecisionArchiveRemediationReviewAccepted: false,
    finalDecisionArchiveRemediationReviewRecorded: false,
    finalDecisionArchiveRemediationReviewComplete: false,
    externalFinalDecisionArchiveRemediationAccepted: false,
    externalFinalDecisionArchiveRemediationRecorded: false,
    externalFinalDecisionArchiveRemediationStatesAccepted: false,
    finalDecisionArchiveNoGoAccepted: false,
    finalDecisionArchiveNoGoRecorded: false,
    externalFinalDecisionArchiveAccepted: false,
    finalDecisionArchiveCompletenessAccepted: false,
    authorizationReconsiderationFinalDecisionAccepted: false,
    authorizationReconsiderationFinalDecisionRecorded: false,
    implementationAuthorizationGranted: false,
    implementationAuthorized: false,
    readyForAdapterImplementation: false,
    allRuntimeEffectsBlocked: true,
    ...archiveRemediationReviewNoGoRuntimeBlockedFlags,
    blockedCodes,
    archiveRemediationReviewNoGoRules: [
      "This endpoint is a read-only external final decision archive remediation review no-go packet, not a review acceptance system and not an authorization decision system.",
      "It may summarize why each archive remediation review item still cannot unlock implementation authorization.",
      "It must not accept review no-go items, record no-go outcomes, accept archive remediation review outcomes, accept archive remediation, record archive remediation evidence, resolve archive blockers, accept archive no-go items, accept external archives, accept final decisions, record final go/no-go, deny authorization, grant authorization, store approvals, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
      "No-go packet readiness does not mean any no-go decision was accepted, any blocker was resolved, or any implementation authorization decision was recorded.",
    ],
    archiveRemediationReviewNoGoRejectionRules: [
      "Reject any payload that includes raw archive artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, or full external document bodies.",
      "Reject any payload that treats this packet as an accepted denial, accepted review, accepted archive, final decision acceptance, authorization grant, or implementation approval.",
      "Reject any payload that removes source review item ids, remediation item ids, archive no-go item ids, archive checklist ids, or final decision ids without traceability.",
      "Reject any payload that starts branch, patch, file, test, migration, privileged-client, transaction, database-write, AI, Stripe, deployment, feature-flag, production-writer, or report-unlock work.",
      "The next safe stage is a read-only archive remediation review no-go reconciliation checklist; it must still remain non-executable.",
    ],
    sourceArchiveRemediationReviewItems:
      sourceReview.archiveRemediationReviewItems,
    archiveRemediationReviewNoGoItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGo(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGo();
  const blockedSummary =
    "Persistence authorization reconsideration final decision archive remediation review no-go probe blocked: no review no-go acceptance, no-go record, authorization denial, final decision promotion, review acceptance, review record, evidence storage, external remediation review mark, archive remediation acceptance, archive remediation evidence record, archive blocker resolution, archive no-go acceptance, archive no-go record, archive upload, archive read, archive hash, archive index write, archive completeness acceptance, external archive acceptance, final decision acceptance, final go/no-go record, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      archiveRemediationReviewNoGoItems:
        payload.archiveRemediationReviewNoGoItems,
    };
  }

  const itemId =
    (requestBody as { itemId?: unknown; noGoItemId?: unknown }).itemId ??
    (requestBody as { noGoItemId?: unknown }).noGoItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      archiveRemediationReviewNoGoItems:
        payload.archiveRemediationReviewNoGoItems,
    };
  }

  const selectedItem = payload.archiveRemediationReviewNoGoItems.find(
    (candidate) => candidate.id === itemId,
  );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      archiveRemediationReviewNoGoItems:
        payload.archiveRemediationReviewNoGoItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration final decision archive remediation review no-go probe blocked as designed: the selected no-go item was returned, but no review no-go acceptance, no-go record, authorization denial, final decision promotion, review acceptance, review record, evidence storage, external remediation review mark, archive remediation acceptance, archive remediation evidence record, archive blocker resolution, archive no-go acceptance, archive no-go record, archive upload, archive read, archive hash, archive index write, archive completeness acceptance, external archive acceptance, final decision acceptance, final go/no-go record, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    archiveRemediationReviewNoGoItems: [selectedItem],
  };
}
