import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation";
import type { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItem } from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go";

const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoBlockedCodes =
  [
    "implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_packet_only",
    "source_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_checklist_still_blocks_authorization",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_authorization_denial_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_authorization_decision_promotion_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciled_mark_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_no_go_acceptance_forbidden",
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

const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRuntimeBlockedFlags =
  {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo:
      false,
    wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo:
      false,
    wouldDenyImplementationAuthorizationFromArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation:
      false,
    wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoToAuthorizationDecision:
      false,
  } as const satisfies Pick<
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRuntimeFlags,
    | "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo"
    | "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo"
    | "wouldDenyImplementationAuthorizationFromArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation"
    | "wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoToAuthorizationDecision"
  >;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function noGoStatus(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoStatus {
  return sourceItem.status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_external_evidence_unresolved"
    ? "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_external_evidence_unresolved"
    : "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_manual_reviewer_unresolved";
}

function noGoTitle(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItem,
) {
  if (sourceItem.title.endsWith(" reconciliation")) {
    return sourceItem.title.replace(/ reconciliation$/, " reconciliation no-go");
  }

  return `${sourceItem.title} no-go`;
}

function buildReconciliationNoGoItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItem {
  const externalEvidenceUnresolved =
    sourceItem.status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_external_evidence_unresolved";

  return {
    id: `${sourceItem.id}_no_go`,
    category: sourceItem.category,
    title: noGoTitle(sourceItem),
    status: noGoStatus(sourceItem),
    owner: sourceItem.owner,
    sourceReconciliationStatus: sourceItem.status,
    sourceReconciliationItemIds: unique([
      sourceItem.id,
      ...sourceItem.sourceReconciliationItemIds,
    ]),
    sourceNoGoItemIds: sourceItem.sourceNoGoItemIds,
    sourceReviewItemIds: sourceItem.sourceReviewItemIds,
    sourceRemediationItemIds: sourceItem.sourceRemediationItemIds,
    sourceReconciliationNoGoItemIds:
      sourceItem.sourceReconciliationNoGoItemIds,
    sourceArchiveNoGoItemIds: sourceItem.sourceArchiveNoGoItemIds,
    sourceArchiveRemediationItemIds: sourceItem.sourceArchiveRemediationItemIds,
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
      "Can this archive remediation review no-go reconciliation remediation review no-go reconciliation item unlock implementation authorization now?",
    noGoConclusion: externalEvidenceUnresolved
      ? "No. The reconciliation checklist is traceable, but external evidence remains unresolved and cannot support implementation authorization."
      : "No. The reconciliation checklist is traceable, but manual reviewer state remains unresolved and cannot be replaced by this read-only no-go packet.",
    blockerEvidence: unique([
      sourceItem.reconciliationQuestion,
      sourceItem.reconciliationFinding,
      ...sourceItem.blockerConsistencyChecks,
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoAccepted=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRecorded=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationAccepted=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationRecorded=false",
      "implementationAuthorizationGranted=false",
      "readyForAdapterImplementation=false",
    ]),
    unresolvedReconciliationGaps: unique([
      ...sourceItem.unresolvedEvidence,
      ...sourceItem.rejectionTriggers,
      "No accepted external reconciliation evidence is present in app state.",
      "No accepted manual reconciliation reviewer conclusion is present in app state.",
      "No reconciliation no-go packet is accepted, recorded, stored, or promoted by this route.",
      "No authorization denial or implementation authorization can be inferred from this no-go packet.",
    ]),
    sourceChecklistFailures: unique([
      ...sourceItem.traceabilityChecks,
      ...sourceItem.redactionChecks,
      "The source reconciliation checklist remains a checklist only and does not produce an accepted reconciliation outcome.",
      "The source reconciliation checklist explicitly keeps review no-go acceptance, reconciliation acceptance, authorization denial, and implementation authorization false.",
    ]),
    forbiddenShortcuts: unique([
      ...sourceItem.forbiddenConclusions,
      ...sourceItem.nonAcceptanceClauses,
      "Do not treat this no-go packet as accepted no-go, accepted reconciliation, accepted review, accepted remediation, accepted archive, accepted final decision, authorization denial, authorization grant, or implementation approval.",
      "Do not create implementation files, tests, migrations, service-role clients, branches, transactions, row writes, feature flags, deployments, production writers, AI calls, Stripe calls, or report unlocks from this packet.",
    ]),
    futureResolutionPrerequisites: unique([
      ...sourceItem.futureResolutionInputs,
      "A later external process must provide accepted safe evidence or accepted manual reviewer state before the reconciliation can be reconsidered.",
      "A later review can organize the unresolved reconciliation no-go gaps, but it must remain read-only until a separate human authorization mechanism is deliberately introduced.",
    ]),
    safeNoGoRefs: unique([
      ...sourceItem.sourceRefs,
      ...sourceItem.sourceNoGoItemIds,
      ...sourceItem.sourceReviewItemIds,
      ...sourceItem.sourceRemediationItemIds,
      ...sourceItem.sourceReconciliationNoGoItemIds,
      ...sourceItem.sourceReconciliationItemIds,
      ...sourceItem.sourceArchiveNoGoItemIds,
      ...sourceItem.sourceArchiveRemediationItemIds,
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
      "This reconciliation no-go item is not stored, accepted, signed, recorded, or promoted by the app.",
      "This reconciliation no-go item does not deny authorization or grant authorization.",
      "This no-go packet is documentation of unresolved conditions only; it is not a runtime decision artifact.",
    ]),
    nextSafeAction:
      "Keep implementation authorization blocked and define only a later read-only review or remediation path before any acceptance, recording, authorization, branch, migration, privileged client, deployment, AI, Stripe, report, or database-write work.",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItem[],
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItem[],
  key:
    | "blockerEvidence"
    | "unresolvedReconciliationGaps"
    | "sourceChecklistFailures"
    | "forbiddenShortcuts"
    | "futureResolutionPrerequisites"
    | "redactionRules",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPayload,
) {
  return {
    ...payload,
    blocked: true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPacketOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPacketOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted:
      false as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted:
      false as const,
    sourceReleaseStillBlocked: true as const,
  };
}

export async function buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo(): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPayload> {
  const sourceReconciliation =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation();
  const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems =
    sourceReconciliation.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems.map(
      buildReconciliationNoGoItem,
    );
  const blockedCodes = unique([
    ...sourceReconciliation.blockedCodes,
    ...archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoBlockedCodes,
  ]);

  return {
    ...sourceReconciliation,
    safeMode: true,
    readOnly: true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoMode:
      "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_packet_only",
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistMode:
      sourceReconciliation.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistMode,
    checkedAt: new Date().toISOString(),
    noGoItemCount:
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems.length,
    reconciliationNoGoItemCount:
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems.length,
    externalEvidenceReconciliationNoGoCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems,
      "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_external_evidence_unresolved",
    ),
    manualReviewerReconciliationNoGoCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems,
      "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_manual_reviewer_unresolved",
    ),
    reconciliationStillBlockedCount:
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems.length,
    blockerEvidenceCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems,
      "blockerEvidence",
    ),
    unresolvedReconciliationGapCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems,
      "unresolvedReconciliationGaps",
    ),
    sourceChecklistFailureCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems,
      "sourceChecklistFailures",
    ),
    forbiddenShortcutCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems,
      "forbiddenShortcuts",
    ),
    futureResolutionPrerequisiteCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems,
      "futureResolutionPrerequisites",
    ),
    redactionRuleCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems,
      "redactionRules",
    ),
    sourceReconciliationItemCount: sourceReconciliation.reconciliationItemCount,
    sourceExternalEvidenceUnresolvedCount:
      sourceReconciliation.externalEvidenceUnresolvedCount,
    sourceManualReviewerUnresolvedCount:
      sourceReconciliation.manualReviewerUnresolvedCount,
    sourceReviewNoGoStillBlockedCount:
      sourceReconciliation.reviewNoGoStillBlockedCount,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketReady:
      true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketOnly:
      true,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistReady:
      sourceReconciliation.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistReady,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistOnly:
      sourceReconciliation.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistOnly,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoAccepted:
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
    ...archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRuntimeBlockedFlags,
    blockedCodes,
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRules:
      [
        "This endpoint is a read-only archive remediation review no-go reconciliation remediation review no-go reconciliation no-go packet, not an authorization decision and not an executable writer.",
        "It may summarize unresolved reconciliation checklist gaps, source ids, blocker evidence, redaction rules, forbidden shortcuts, future prerequisites, and safe no-go refs.",
        "It must not accept no-go outcomes, record no-go outcomes, deny authorization, promote no-go items to authorization decisions, accept reconciliation, mark items reconciled, accept review no-go outcomes, accept remediation review outcomes, accept remediation, accept reconciliation outcomes, accept archives, accept final decisions, grant authorization, store approvals, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
        "No-go packet readiness does not mean any blocker was resolved, any no-go result was accepted, any authorization denial was recorded, or implementation authorization was granted.",
      ],
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRejectionRules:
      [
        "Reject any input that removes source reconciliation, source no-go, source review, source remediation, source archive, or source final decision ids.",
        "Reject any input that includes raw archive artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, or full external document bodies.",
        "Reject any input that treats no-go packet readiness as accepted no-go, accepted reconciliation, accepted review, accepted remediation, accepted archive, accepted final decision, authorization denial, authorization grant, or implementation readiness.",
        "Reject any input that starts branch, patch, file, test, migration, privileged-client, transaction, database-write, AI, Stripe, deployment, feature-flag, production-writer, or report-unlock work.",
      ],
    sourceArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems:
      sourceReconciliation.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems,
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo();
  const blockedSummary =
    "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation remediation review no-go reconciliation no-go probe blocked: no no-go acceptance, no-go record, authorization denial, authorization decision promotion, reconciliation acceptance, reconciliation record, reconciled mark, review no-go acceptance, review no-go record, review acceptance, remediation acceptance, archive acceptance, final decision acceptance, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems,
    };
  }

  const itemId =
    (requestBody as { itemId?: unknown; noGoItemId?: unknown }).itemId ??
    (requestBody as { noGoItemId?: unknown }).noGoItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems,
    };
  }

  const selectedItem =
    payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems.find(
      (candidate) => candidate.id === itemId,
    );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation remediation review no-go reconciliation no-go probe blocked as designed: the selected no-go item was returned, but no no-go acceptance, no-go record, authorization denial, authorization decision promotion, reconciliation acceptance, reconciliation record, reconciled mark, review no-go acceptance, review no-go record, review acceptance, remediation acceptance, archive acceptance, final decision acceptance, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems:
      [selectedItem],
  };
}
