import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review";
import type { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewItem } from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go";

const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoBlockedCodes =
  [
    "implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_packet_only",
    "source_archive_remediation_review_no_go_reconciliation_remediation_review_still_blocks_authorization",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_authorization_denial_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_authorization_decision_promotion_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_evidence_storage_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_mark_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_evidence_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_state_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_blocker_resolution_forbidden",
    "archive_remediation_review_no_go_reconciliation_no_go_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_no_go_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_acceptance_forbidden",
    "archive_remediation_review_no_go_acceptance_forbidden",
    "archive_remediation_review_acceptance_forbidden",
    "archive_remediation_acceptance_forbidden",
    "archive_blocker_resolution_forbidden",
    "archive_no_go_acceptance_forbidden",
    "external_archive_acceptance_forbidden",
    "final_decision_acceptance_forbidden",
    "authorization_denial_forbidden",
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

const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRuntimeBlockedFlags =
  {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo:
      false,
    wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo:
      false,
    wouldDenyImplementationAuthorizationFromArchiveRemediationReviewNoGoReconciliationRemediationReview:
      false,
    wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoToAuthorizationDecision:
      false,
  } as const satisfies Pick<
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRuntimeFlags,
    | "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo"
    | "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo"
    | "wouldDenyImplementationAuthorizationFromArchiveRemediationReviewNoGoReconciliationRemediationReview"
    | "wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoToAuthorizationDecision"
  >;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function noGoStatus(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoStatus {
  return sourceItem.status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_external_evidence_missing"
    ? "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_external_evidence_unresolved"
    : "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_manual_reviewer_unresolved";
}

function noGoTitle(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewItem,
) {
  if (sourceItem.title.endsWith(" review")) {
    return sourceItem.title.replace(/ review$/, " review no-go");
  }

  return `${sourceItem.title} no-go`;
}

function buildReviewNoGoItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItem {
  const externalEvidenceUnresolved =
    sourceItem.status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_external_evidence_missing";

  return {
    id: `${sourceItem.id}_no_go`,
    category: sourceItem.category,
    title: noGoTitle(sourceItem),
    status: noGoStatus(sourceItem),
    owner: sourceItem.owner,
    sourceReviewStatus: sourceItem.status,
    sourceReviewItemIds: unique([sourceItem.id, ...sourceItem.sourceReviewItemIds]),
    sourceRemediationItemIds: sourceItem.sourceRemediationItemIds,
    sourceReconciliationNoGoItemIds:
      sourceItem.sourceReconciliationNoGoItemIds,
    sourceReconciliationItemIds: sourceItem.sourceReconciliationItemIds,
    sourceNoGoItemIds: sourceItem.sourceNoGoItemIds,
    sourceArchiveRemediationItemIds: sourceItem.sourceArchiveRemediationItemIds,
    sourceArchiveNoGoItemIds: sourceItem.sourceArchiveNoGoItemIds,
    sourceArchiveItemIds: sourceItem.sourceArchiveItemIds,
    sourceDecisionItemIds: sourceItem.sourceDecisionItemIds,
    sourceNoGoItemIdsFromReconsideration:
      sourceItem.sourceNoGoItemIdsFromReconsideration,
    sourceReviewItemIdsFromReconsideration:
      sourceItem.sourceReviewItemIdsFromReconsideration,
    sourceReconsiderationRemediationItemIds:
      sourceItem.sourceReconsiderationRemediationItemIds,
    sourcePreflightItemIds: sourceItem.sourcePreflightItemIds,
    sourceOriginalRemediationItemIds: sourceItem.sourceOriginalRemediationItemIds,
    sourceRefs: sourceItem.sourceRefs,
    noGoQuestion:
      "Can this archive remediation review no-go reconciliation remediation review item unlock implementation authorization now?",
    noGoConclusion: externalEvidenceUnresolved
      ? "No. The review checklist is traceable, but external reconciliation remediation evidence remains unresolved and cannot support implementation authorization."
      : "No. The review checklist is traceable, but the manual reviewer state remains unresolved and cannot be replaced by this read-only packet.",
    blockerEvidence: unique([
      sourceItem.reviewQuestion,
      sourceItem.currentFinding,
      sourceItem.requiredExternalState,
      ...sourceItem.stillBlockedBecause,
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRecorded=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewRecorded=false",
      "implementationAuthorizationGranted=false",
      "readyForAdapterImplementation=false",
    ]),
    unresolvedReviewGaps: unique([
      ...sourceItem.failCriteriaForCurrentReview,
      ...sourceItem.rejectionTriggers,
      "No accepted external reconciliation remediation evidence is present in app state.",
      "No accepted manual reconciliation remediation reviewer conclusion is present in app state.",
      "No reconciliation remediation review result is accepted, recorded, stored, or promoted by this route.",
      "No authorization denial or implementation authorization can be inferred from this no-go packet.",
    ]),
    sourceChecklistFailures: unique([
      ...sourceItem.completenessChecks,
      ...sourceItem.redactionChecks,
      "The source review checklist remains a checklist only and does not produce an accepted review outcome.",
      "The source review checklist explicitly keeps reconciliation remediation acceptance, review acceptance, no-go acceptance, final decision acceptance, authorization denial, and implementation authorization false.",
    ]),
    forbiddenShortcuts: unique([
      ...sourceItem.nonAcceptanceClauses,
      "Do not treat this no-go packet as accepted no-go, accepted review, accepted remediation, accepted reconciliation, accepted archive, accepted final decision, authorization denial, authorization grant, or implementation approval.",
      "Do not create implementation files, tests, migrations, service-role clients, branches, transactions, row writes, feature flags, deployments, production writers, AI calls, Stripe calls, or report unlocks from this packet.",
    ]),
    futureResolutionPrerequisites: unique([
      ...sourceItem.passCriteriaForFutureReview,
      "A later external process must provide accepted safe evidence or accepted manual reviewer state before the review can be reconsidered.",
      "A later no-go reconciliation checklist may organize the unresolved review gaps, but it must remain read-only until a separate human authorization mechanism is deliberately introduced.",
    ]),
    safeNoGoRefs: unique([
      ...sourceItem.safeEvidenceRefs,
      ...sourceItem.sourceReviewItemIds,
      ...sourceItem.sourceRemediationItemIds,
      ...sourceItem.sourceReconciliationNoGoItemIds,
      ...sourceItem.sourceReconciliationItemIds,
      ...sourceItem.sourceNoGoItemIds,
      ...sourceItem.sourceArchiveRemediationItemIds,
      ...sourceItem.sourceArchiveNoGoItemIds,
      ...sourceItem.sourceArchiveItemIds,
      ...sourceItem.sourceDecisionItemIds,
    ]),
    redactionRules: unique([
      ...sourceItem.redactionChecks,
      "Only safe item ids, owner roles, state labels, redaction labels, blocker labels, caveats, and short no-go questions may be shown.",
      "Raw archive artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, and full external document bodies remain forbidden.",
    ]),
    nonAcceptanceClauses: unique([
      ...sourceItem.nonAcceptanceClauses,
      "This archive remediation review no-go reconciliation remediation review no-go item is not stored, accepted, signed, recorded, or promoted by the app.",
      "This archive remediation review no-go reconciliation remediation review no-go item does not deny authorization or grant authorization.",
      "This no-go packet is documentation of unresolved conditions only; it is not a runtime decision artifact.",
    ]),
    nextSafeAction:
      "Keep implementation authorization blocked and define only a read-only archive remediation review no-go reconciliation remediation review no-go reconciliation checklist before any acceptance, recording, authorization, branch, migration, privileged client, deployment, AI, Stripe, report, or database-write work.",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItem[],
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItem[],
  key:
    | "blockerEvidence"
    | "unresolvedReviewGaps"
    | "sourceChecklistFailures"
    | "forbiddenShortcuts"
    | "futureResolutionPrerequisites"
    | "redactionRules",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPayload,
) {
  return {
    ...payload,
    blocked: true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPacketOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPacketOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPacketOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoPacketOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoPacketOnly:
      true as const,
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

export async function buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo(): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPayload> {
  const sourceReview =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview();
  const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems =
    sourceReview.archiveRemediationReviewNoGoReconciliationRemediationReviewItems.map(
      buildReviewNoGoItem,
    );
  const blockedCodes = unique([
    ...sourceReview.blockedCodes,
    ...archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoBlockedCodes,
  ]);

  return {
    ...sourceReview,
    safeMode: true,
    readOnly: true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoMode:
      "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_packet_only",
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistMode:
      sourceReview.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistMode,
    checkedAt: new Date().toISOString(),
    noGoItemCount:
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems.length,
    reviewNoGoCount:
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems.length,
    externalEvidenceReviewNoGoCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems,
      "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_external_evidence_unresolved",
    ),
    manualReviewerReviewNoGoCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems,
      "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_manual_reviewer_unresolved",
    ),
    reconciliationRemediationReviewStillBlockedCount:
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems.length,
    blockerEvidenceCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems,
      "blockerEvidence",
    ),
    unresolvedReviewGapCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems,
      "unresolvedReviewGaps",
    ),
    sourceChecklistFailureCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems,
      "sourceChecklistFailures",
    ),
    forbiddenShortcutCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems,
      "forbiddenShortcuts",
    ),
    futureResolutionPrerequisiteCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems,
      "futureResolutionPrerequisites",
    ),
    redactionRuleCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems,
      "redactionRules",
    ),
    sourceReviewItemCount: sourceReview.reviewItemCount,
    sourceExternalEvidenceMissingCount: sourceReview.externalEvidenceMissingCount,
    sourceManualReviewerRequiredCount: sourceReview.manualReviewerRequiredCount,
    sourceReconciliationRemediationStillBlockedCount:
      sourceReview.reconciliationRemediationStillBlockedCount,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPacketReady:
      true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPacketOnly:
      true,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistReady:
      sourceReview.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistReady,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistOnly:
      sourceReview.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistOnly,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewComplete:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatesAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoAccepted: false,
    finalDecisionArchiveRemediationReviewAccepted: false,
    externalFinalDecisionArchiveRemediationAccepted: false,
    finalDecisionArchiveNoGoAccepted: false,
    externalFinalDecisionArchiveAccepted: false,
    authorizationReconsiderationFinalDecisionAccepted: false,
    implementationAuthorizationGranted: false,
    implementationAuthorized: false,
    readyForAdapterImplementation: false,
    allRuntimeEffectsBlocked: true,
    ...archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRuntimeBlockedFlags,
    blockedCodes,
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRules: [
      "This endpoint is a read-only archive remediation review no-go reconciliation remediation review no-go packet, not a review acceptance system, no-go acceptance system, authorization denial system, or implementation authorization system.",
      "It may summarize why each source review checklist item still cannot unlock implementation authorization.",
      "It must not accept review no-go items, record review no-go outcomes, deny implementation authorization, promote no-go items to authorization decisions, accept review outcomes, record review outcomes, store review evidence, mark remediation reviewed, accept reconciliation remediation, accept reconciliation no-go items, accept reconciliation, accept review no-go items, accept archive remediation review outcomes, accept archive remediation, resolve archive blockers, accept archive no-go items, accept external archives, accept final decisions, grant authorization, store approvals, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
      "No-go packet readiness does not mean a no-go was accepted, an authorization denial was recorded, a blocker was resolved, or implementation authorization was granted.",
      "Because source review outcomes remain unaccepted and unrecorded, implementation authorization remains blocked by default.",
    ],
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRejectionRules:
      [
        "Reject any payload that includes raw archive artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, or full external document bodies.",
        "Reject any payload that treats this packet as accepted no-go, accepted review, accepted remediation, accepted reconciliation, accepted archive, final decision acceptance, authorization denial, authorization grant, or implementation approval.",
        "Reject any payload that removes source review item ids, source remediation item ids, source reconciliation no-go ids, source reconciliation checklist ids, source no-go ids, source archive remediation ids, source archive no-go ids, source archive ids, or source final decision ids without traceability.",
        "Reject any payload that starts branch, patch, file, test, migration, privileged-client, transaction, database-write, AI, Stripe, deployment, feature-flag, production-writer, or report-unlock work.",
        "The next safe stage is a read-only archive remediation review no-go reconciliation remediation review no-go reconciliation checklist; it must still remain non-executable.",
      ],
    sourceArchiveRemediationReviewNoGoReconciliationRemediationReviewRules:
      sourceReview.archiveRemediationReviewNoGoReconciliationRemediationReviewChecklistRules,
    sourceArchiveRemediationReviewNoGoReconciliationRemediationReviewItems:
      sourceReview.archiveRemediationReviewNoGoReconciliationRemediationReviewItems,
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo();
  const blockedSummary =
    "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation remediation review no-go probe blocked: no review no-go acceptance, review no-go record, authorization denial, authorization decision promotion, review acceptance, review record, review evidence storage, remediation reviewed mark, reconciliation remediation acceptance, remediation evidence record, blocker resolution, remediation state acceptance, reconciliation no-go acceptance, reconciliation no-go record, reconciliation acceptance, review no-go acceptance, review acceptance, archive remediation acceptance, archive blocker resolution, archive no-go acceptance, external archive acceptance, final decision acceptance, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems,
    };
  }

  const itemId =
    (
      requestBody as {
        itemId?: unknown;
        reviewNoGoItemId?: unknown;
        noGoItemId?: unknown;
      }
    ).itemId ??
    (requestBody as { reviewNoGoItemId?: unknown }).reviewNoGoItemId ??
    (requestBody as { noGoItemId?: unknown }).noGoItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems,
    };
  }

  const selectedItem =
    payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems.find(
      (candidate) => candidate.id === itemId,
    );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation remediation review no-go probe blocked as designed: the selected no-go item was returned, but no review no-go acceptance, review no-go record, authorization denial, authorization decision promotion, review acceptance, review record, review evidence storage, remediation reviewed mark, reconciliation remediation acceptance, remediation evidence record, blocker resolution, remediation state acceptance, reconciliation no-go acceptance, reconciliation no-go record, reconciliation acceptance, review no-go acceptance, review acceptance, archive remediation acceptance, archive blocker resolution, archive no-go acceptance, external archive acceptance, final decision acceptance, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems: [
      selectedItem,
    ],
  };
}
