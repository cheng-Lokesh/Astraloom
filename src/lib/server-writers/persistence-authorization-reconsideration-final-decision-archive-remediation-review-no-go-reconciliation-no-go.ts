import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliation } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation";
import type { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationItem } from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-no-go";

const archiveRemediationReviewNoGoReconciliationNoGoBlockedCodes = [
  "implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_no_go_packet_only",
  "source_archive_remediation_review_no_go_reconciliation_still_blocks_authorization",
  "archive_remediation_review_no_go_reconciliation_no_go_acceptance_forbidden",
  "archive_remediation_review_no_go_reconciliation_no_go_record_forbidden",
  "archive_remediation_review_no_go_reconciliation_authorization_denial_forbidden",
  "archive_remediation_review_no_go_reconciliation_no_go_authorization_decision_promotion_forbidden",
  "archive_remediation_review_no_go_reconciliation_acceptance_forbidden",
  "archive_remediation_review_no_go_reconciliation_record_forbidden",
  "archive_remediation_review_no_go_reconciled_mark_forbidden",
  "archive_remediation_review_no_go_acceptance_forbidden",
  "archive_remediation_review_no_go_record_forbidden",
  "archive_remediation_review_acceptance_forbidden",
  "archive_remediation_review_record_forbidden",
  "archive_remediation_acceptance_forbidden",
  "archive_remediation_evidence_record_forbidden",
  "archive_blocker_resolution_forbidden",
  "archive_no_go_acceptance_forbidden",
  "archive_no_go_record_forbidden",
  "external_archive_acceptance_forbidden",
  "final_decision_acceptance_forbidden",
  "final_decision_record_forbidden",
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

const archiveRemediationReviewNoGoReconciliationNoGoRuntimeBlockedFlags = {
  wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo:
    false,
  wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo:
    false,
  wouldDenyImplementationAuthorizationFromArchiveRemediationReviewNoGoReconciliation:
    false,
  wouldPromoteArchiveRemediationReviewNoGoReconciliationNoGoToAuthorizationDecision:
    false,
} as const satisfies Pick<
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoRuntimeFlags,
  | "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo"
  | "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo"
  | "wouldDenyImplementationAuthorizationFromArchiveRemediationReviewNoGoReconciliation"
  | "wouldPromoteArchiveRemediationReviewNoGoReconciliationNoGoToAuthorizationDecision"
>;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function mapStatus(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoStatus {
  return sourceItem.status ===
    "archive_remediation_review_no_go_reconciliation_external_evidence_unresolved"
    ? "archive_remediation_review_no_go_reconciliation_no_go_external_evidence_unresolved"
    : "archive_remediation_review_no_go_reconciliation_no_go_manual_reviewer_unresolved";
}

function noGoTitle(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationItem,
) {
  if (sourceItem.title.endsWith(" reconciliation")) {
    return sourceItem.title.replace(/ reconciliation$/, " reconciliation no-go");
  }

  return `${sourceItem.title} no-go`;
}

function buildReconciliationNoGoItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoItem {
  const externalEvidenceUnresolved =
    sourceItem.status ===
    "archive_remediation_review_no_go_reconciliation_external_evidence_unresolved";

  return {
    id: `${sourceItem.id}_no_go`,
    category: sourceItem.category,
    title: noGoTitle(sourceItem),
    status: mapStatus(sourceItem),
    owner: sourceItem.owner,
    sourceReconciliationStatus: sourceItem.status,
    sourceReconciliationItemIds: [sourceItem.id],
    sourceNoGoItemIds: sourceItem.sourceNoGoItemIds,
    sourceReviewItemIds: sourceItem.sourceReviewItemIds,
    sourceRemediationItemIds: sourceItem.sourceRemediationItemIds,
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
      "Can this archive remediation review no-go reconciliation item unlock implementation authorization now?",
    noGoConclusion: externalEvidenceUnresolved
      ? "No. The reconciliation is traceable, but external archive evidence remains unresolved and cannot support implementation authorization."
      : "No. The reconciliation is traceable, but manual reviewer state remains unresolved and cannot be substituted by this read-only packet.",
    blockerEvidence: unique([
      sourceItem.reconciliationQuestion,
      sourceItem.reconciliationFinding,
      ...sourceItem.blockerConsistencyChecks,
      ...sourceItem.unresolvedEvidence,
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoAccepted=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoRecorded=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationAccepted=false",
      "implementationAuthorizationGranted=false",
      "readyForAdapterImplementation=false",
    ]),
    unresolvedReconciliationGaps: unique([
      ...sourceItem.rejectionTriggers,
      ...sourceItem.unresolvedEvidence,
      "The application has not accepted reconciliation no-go outcomes.",
      "The application has not recorded reconciliation no-go outcomes.",
      "The application has not accepted reconciliation, review no-go, review, archive remediation, archive no-go, external archive, final decision, or final authorization state.",
    ]),
    forbiddenShortcuts: unique([
      ...sourceItem.forbiddenConclusions,
      ...sourceItem.nonAcceptanceClauses,
      "Do not treat this no-go packet as accepted reconciliation, accepted no-go, accepted review, accepted archive, accepted final decision, authorization denial, authorization grant, or implementation approval.",
      "Do not create implementation files, tests, migrations, service-role clients, branches, transactions, row writes, feature flags, deployments, production writers, AI calls, Stripe calls, or report unlocks from this packet.",
    ]),
    futureResolutionPrerequisites: unique([
      ...sourceItem.futureResolutionInputs,
      "A later external process must provide accepted safe evidence or accepted manual reviewer state before reconciliation can be reconsidered.",
      "Any later remediation of this reconciliation no-go must remain read-only until a separate human authorization mechanism is deliberately introduced.",
    ]),
    safeNoGoRefs: unique([
      ...sourceItem.traceabilityChecks,
      ...sourceItem.sourceNoGoItemIds,
      ...sourceItem.sourceReviewItemIds,
      ...sourceItem.sourceRemediationItemIds,
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
      "This archive remediation review no-go reconciliation no-go item is not stored, accepted, signed, recorded, or promoted by the app.",
      "This archive remediation review no-go reconciliation no-go item does not deny authorization or grant authorization.",
    ]),
    nextSafeAction:
      "Keep implementation authorization blocked and define only a read-only archive remediation review no-go reconciliation remediation plan before any acceptance, recording, authorization, branch, migration, privileged client, deployment, AI, Stripe, report, or database-write work.",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoItem[],
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoItem[],
  key:
    | "blockerEvidence"
    | "unresolvedReconciliationGaps"
    | "forbiddenShortcuts"
    | "futureResolutionPrerequisites"
    | "redactionRules",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPayload,
) {
  return {
    ...payload,
    blocked: true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPacketOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoPacketOnly:
      true as const,
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

export async function buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo(): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPayload> {
  const sourceReconciliation =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliation();
  const archiveRemediationReviewNoGoReconciliationNoGoItems =
    sourceReconciliation.archiveRemediationReviewNoGoReconciliationItems.map(
      buildReconciliationNoGoItem,
    );
  const blockedCodes = unique([
    ...sourceReconciliation.blockedCodes,
    ...archiveRemediationReviewNoGoReconciliationNoGoBlockedCodes,
  ]);

  return {
    ...sourceReconciliation,
    safeMode: true,
    readOnly: true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoMode:
      "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_no_go_packet_only",
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistMode:
      sourceReconciliation.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistMode,
    checkedAt: new Date().toISOString(),
    noGoItemCount: archiveRemediationReviewNoGoReconciliationNoGoItems.length,
    reconciliationNoGoCount:
      archiveRemediationReviewNoGoReconciliationNoGoItems.length,
    externalEvidenceReconciliationNoGoCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationNoGoItems,
      "archive_remediation_review_no_go_reconciliation_no_go_external_evidence_unresolved",
    ),
    manualReviewerReconciliationNoGoCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationNoGoItems,
      "archive_remediation_review_no_go_reconciliation_no_go_manual_reviewer_unresolved",
    ),
    archiveReviewNoGoReconciliationStillBlockedCount:
      archiveRemediationReviewNoGoReconciliationNoGoItems.length,
    blockerEvidenceCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationNoGoItems,
      "blockerEvidence",
    ),
    unresolvedReconciliationGapCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationNoGoItems,
      "unresolvedReconciliationGaps",
    ),
    forbiddenShortcutCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationNoGoItems,
      "forbiddenShortcuts",
    ),
    futureResolutionPrerequisiteCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationNoGoItems,
      "futureResolutionPrerequisites",
    ),
    redactionRuleCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationNoGoItems,
      "redactionRules",
    ),
    sourceReconciliationItemCount: sourceReconciliation.reconciliationItemCount,
    sourceExternalEvidenceUnresolvedCount:
      sourceReconciliation.externalEvidenceUnresolvedCount,
    sourceManualReviewerUnresolvedCount:
      sourceReconciliation.manualReviewerUnresolvedCount,
    sourceArchiveReviewNoGoStillBlockedCount:
      sourceReconciliation.archiveReviewNoGoStillBlockedCount,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPacketReady:
      true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPacketOnly:
      true,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistReady:
      sourceReconciliation.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistReady,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistOnly:
      sourceReconciliation.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistOnly,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRecorded:
      false,
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
    authorizationReconsiderationFinalDecisionAccepted: false,
    authorizationReconsiderationFinalDecisionRecorded: false,
    implementationAuthorizationGranted: false,
    implementationAuthorized: false,
    readyForAdapterImplementation: false,
    allRuntimeEffectsBlocked: true,
    ...archiveRemediationReviewNoGoReconciliationNoGoRuntimeBlockedFlags,
    blockedCodes,
    archiveRemediationReviewNoGoReconciliationNoGoRules: [
      "This endpoint is a read-only archive remediation review no-go reconciliation no-go packet, not a reconciliation acceptance system and not an authorization decision system.",
      "It may summarize why each reconciliation item still cannot unlock implementation authorization.",
      "It must not accept reconciliation no-go items, record reconciliation no-go outcomes, accept reconciliation outcomes, mark no-go items reconciled, accept review no-go items, accept archive remediation review outcomes, accept archive remediation, resolve archive blockers, accept archive no-go items, accept external archives, accept final decisions, deny authorization, grant authorization, store approvals, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
      "No-go packet readiness does not mean any no-go decision was accepted, any blocker was resolved, or any implementation authorization decision was recorded.",
    ],
    archiveRemediationReviewNoGoReconciliationNoGoRejectionRules: [
      "Reject any payload that includes raw archive artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, or full external document bodies.",
      "Reject any payload that treats this packet as accepted reconciliation, accepted no-go, accepted review, accepted archive, final decision acceptance, authorization denial, authorization grant, or implementation approval.",
      "Reject any payload that removes source reconciliation item ids, source no-go item ids, review item ids, remediation item ids, archive no-go item ids, archive checklist ids, or final decision ids without traceability.",
      "Reject any payload that starts branch, patch, file, test, migration, privileged-client, transaction, database-write, AI, Stripe, deployment, feature-flag, production-writer, or report-unlock work.",
      "The next safe stage is a read-only archive remediation review no-go reconciliation remediation plan; it must still remain non-executable.",
    ],
    sourceArchiveRemediationReviewNoGoReconciliationItems:
      sourceReconciliation.archiveRemediationReviewNoGoReconciliationItems,
    archiveRemediationReviewNoGoReconciliationNoGoItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo();
  const blockedSummary =
    "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation no-go probe blocked: no reconciliation no-go acceptance, reconciliation no-go record, authorization denial, authorization decision promotion, reconciliation acceptance, reconciliation record, reconciled mark, review no-go acceptance, no-go record, review acceptance, review record, archive remediation acceptance, archive remediation evidence record, archive blocker resolution, archive no-go acceptance, archive no-go record, external archive acceptance, final decision acceptance, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      archiveRemediationReviewNoGoReconciliationNoGoItems:
        payload.archiveRemediationReviewNoGoReconciliationNoGoItems,
    };
  }

  const itemId =
    (requestBody as { itemId?: unknown; noGoItemId?: unknown }).itemId ??
    (requestBody as { noGoItemId?: unknown }).noGoItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      archiveRemediationReviewNoGoReconciliationNoGoItems:
        payload.archiveRemediationReviewNoGoReconciliationNoGoItems,
    };
  }

  const selectedItem =
    payload.archiveRemediationReviewNoGoReconciliationNoGoItems.find(
      (candidate) => candidate.id === itemId,
    );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      archiveRemediationReviewNoGoReconciliationNoGoItems:
        payload.archiveRemediationReviewNoGoReconciliationNoGoItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation no-go probe blocked as designed: the selected no-go item was returned, but no reconciliation no-go acceptance, reconciliation no-go record, authorization denial, authorization decision promotion, reconciliation acceptance, reconciliation record, reconciled mark, review no-go acceptance, no-go record, review acceptance, review record, archive remediation acceptance, archive remediation evidence record, archive blocker resolution, archive no-go acceptance, archive no-go record, external archive acceptance, final decision acceptance, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    archiveRemediationReviewNoGoReconciliationNoGoItems: [selectedItem],
  };
}
