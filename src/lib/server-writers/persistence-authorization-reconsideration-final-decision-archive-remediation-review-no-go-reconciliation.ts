import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGo } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go";
import type { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoItem } from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation";

const archiveRemediationReviewNoGoReconciliationBlockedCodes = [
  "implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_checklist_only",
  "source_archive_remediation_review_no_go_packet_still_blocks_authorization",
  "archive_remediation_review_no_go_reconciliation_acceptance_forbidden",
  "archive_remediation_review_no_go_reconciliation_record_forbidden",
  "archive_remediation_review_no_go_reconciled_mark_forbidden",
  "archive_remediation_review_no_go_reconciliation_authorization_decision_promotion_forbidden",
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

const archiveRemediationReviewNoGoReconciliationRuntimeBlockedFlags = {
  wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliation: false,
  wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliation: false,
  wouldMarkArchiveRemediationReviewNoGoReconciled: false,
  wouldPromoteArchiveRemediationReviewNoGoReconciliationToAuthorizationDecision:
    false,
} as const satisfies Pick<
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRuntimeFlags,
  | "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliation"
  | "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliation"
  | "wouldMarkArchiveRemediationReviewNoGoReconciled"
  | "wouldPromoteArchiveRemediationReviewNoGoReconciliationToAuthorizationDecision"
>;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function mapStatus(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationStatus {
  return sourceItem.status ===
    "archive_remediation_review_no_go_external_evidence_missing"
    ? "archive_remediation_review_no_go_reconciliation_external_evidence_unresolved"
    : "archive_remediation_review_no_go_reconciliation_manual_reviewer_unresolved";
}

function reconciliationTitle(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoItem,
) {
  if (sourceItem.title.endsWith(" no-go")) {
    return sourceItem.title.replace(/ no-go$/, " reconciliation");
  }

  return `${sourceItem.title} reconciliation`;
}

function buildReconciliationItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationItem {
  const externalEvidenceUnresolved =
    sourceItem.status ===
    "archive_remediation_review_no_go_external_evidence_missing";

  return {
    id: `${sourceItem.id}_reconciliation`,
    category: sourceItem.category,
    title: reconciliationTitle(sourceItem),
    status: mapStatus(sourceItem),
    owner: sourceItem.owner,
    sourceNoGoStatus: sourceItem.status,
    sourceNoGoItemIds: [sourceItem.id],
    sourceReviewItemIds: sourceItem.sourceReviewItemIds,
    sourceRemediationItemIds: sourceItem.sourceRemediationItemIds,
    sourceArchiveNoGoItemIds: sourceItem.sourceArchiveNoGoItemIds,
    sourceArchiveItemIds: sourceItem.sourceArchiveItemIds,
    sourceDecisionItemIds: sourceItem.sourceDecisionItemIds,
    sourceNoGoItemIdsFromReconsideration: sourceItem.sourceNoGoItemIds,
    sourceReviewItemIdsFromReconsideration:
      sourceItem.sourceReviewItemIdsFromReconsideration,
    sourceReconsiderationRemediationItemIds:
      sourceItem.sourceReconsiderationRemediationItemIds,
    sourcePreflightItemIds: sourceItem.sourcePreflightItemIds,
    sourceOriginalRemediationItemIds: sourceItem.sourceOriginalRemediationItemIds,
    sourceRefs: sourceItem.sourceRefs,
    reconciliationQuestion:
      "Is this archive remediation review no-go item internally complete enough to remain a safe blocker without accepting or recording it?",
    reconciliationFinding: externalEvidenceUnresolved
      ? "The no-go item is traceable and safely redacted, but external archive evidence remains unresolved and cannot unlock implementation authorization."
      : "The no-go item is traceable and safely redacted, but manual reviewer state remains unresolved and cannot be replaced by this checklist.",
    traceabilityChecks: unique([
      `Source no-go item id ${sourceItem.id} is preserved.`,
      "Every source review item id remains mapped.",
      "Every source remediation item id remains mapped.",
      "Every source archive no-go item id remains mapped.",
      "Every source archive checklist item id remains mapped.",
      "Every source final decision item id remains mapped.",
      ...sourceItem.safeNoGoRefs,
    ]),
    blockerConsistencyChecks: unique([
      sourceItem.noGoQuestion,
      sourceItem.noGoConclusion,
      ...sourceItem.blockerEvidence,
      "The item still says implementationAuthorizationGranted=false.",
      "The item still says readyForAdapterImplementation=false.",
      "The item does not convert no-go readiness into no-go acceptance.",
    ]),
    redactionChecks: unique([
      ...sourceItem.redactionRules,
      "No raw archive artifact, private narrative, prompt, provider payload, webhook body, token, secret, credential, service-role config, or full external document body is needed to reconcile this item.",
    ]),
    rejectionTriggers: unique([
      ...sourceItem.unresolvedReviewGaps,
      ...sourceItem.forbiddenShortcuts,
      "Reject reconciliation if any source id is removed, renamed, or detached from its parent no-go item.",
      "Reject reconciliation if it claims no-go acceptance, review acceptance, archive acceptance, final decision acceptance, authorization denial, authorization grant, or implementation readiness.",
    ]),
    unresolvedEvidence: unique([
      ...sourceItem.unresolvedReviewGaps,
      ...(externalEvidenceUnresolved
        ? [
            "External archive evidence is not accepted in app state.",
            "External archive evidence is not recorded in app state.",
          ]
        : [
            "Manual archive reviewer state is not accepted in app state.",
            "Manual archive reviewer state is not recorded in app state.",
          ]),
    ]),
    forbiddenConclusions: unique([
      "Do not conclude that this no-go item is accepted.",
      "Do not conclude that archive remediation review is accepted.",
      "Do not conclude that archive remediation is accepted.",
      "Do not conclude that archive no-go, external archive, or final decision is accepted.",
      "Do not conclude that authorization is denied, granted, or ready to implement.",
      "Do not start branches, files, tests, migrations, service-role clients, transactions, row writes, deployments, AI calls, Stripe calls, or report unlocks.",
    ]),
    futureResolutionInputs: unique([
      ...sourceItem.futureResolutionPrerequisites,
      "A later external review process may provide safe state labels for this item.",
      "A later read-only no-go reconciliation no-go packet can summarize remaining reconciliation blockers.",
    ]),
    nonAcceptanceClauses: unique([
      ...sourceItem.nonAcceptanceClauses,
      "This reconciliation item is not an accepted reconciliation result.",
      "This reconciliation item does not record no-go acceptance, authorization denial, authorization grant, approval storage, or implementation readiness.",
    ]),
    nextSafeAction:
      "Keep implementation authorization blocked and define only a read-only archive remediation review no-go reconciliation no-go packet before any acceptance, recording, authorization, branch, migration, privileged client, deployment, AI, Stripe, report, or database-write work.",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationItem[],
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationItem[],
  key:
    | "traceabilityChecks"
    | "blockerConsistencyChecks"
    | "redactionChecks"
    | "rejectionTriggers"
    | "unresolvedEvidence"
    | "forbiddenConclusions"
    | "futureResolutionInputs",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationPayload,
) {
  return {
    ...payload,
    blocked: true as const,
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

export async function buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliation(): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationPayload> {
  const sourceNoGo =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGo();
  const archiveRemediationReviewNoGoReconciliationItems =
    sourceNoGo.archiveRemediationReviewNoGoItems.map(buildReconciliationItem);
  const blockedCodes = unique([
    ...sourceNoGo.blockedCodes,
    ...archiveRemediationReviewNoGoReconciliationBlockedCodes,
  ]);

  return {
    ...sourceNoGo,
    safeMode: true,
    readOnly: true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistMode:
      "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_checklist_only",
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoMode:
      sourceNoGo.externalFinalDecisionArchiveRemediationReviewNoGoMode,
    checkedAt: new Date().toISOString(),
    reconciliationItemCount:
      archiveRemediationReviewNoGoReconciliationItems.length,
    externalEvidenceUnresolvedCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationItems,
      "archive_remediation_review_no_go_reconciliation_external_evidence_unresolved",
    ),
    manualReviewerUnresolvedCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationItems,
      "archive_remediation_review_no_go_reconciliation_manual_reviewer_unresolved",
    ),
    archiveReviewNoGoStillBlockedCount:
      archiveRemediationReviewNoGoReconciliationItems.length,
    traceabilityCheckCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationItems,
      "traceabilityChecks",
    ),
    blockerConsistencyCheckCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationItems,
      "blockerConsistencyChecks",
    ),
    redactionCheckCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationItems,
      "redactionChecks",
    ),
    rejectionTriggerCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationItems,
      "rejectionTriggers",
    ),
    unresolvedEvidenceCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationItems,
      "unresolvedEvidence",
    ),
    forbiddenConclusionCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationItems,
      "forbiddenConclusions",
    ),
    futureResolutionInputCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationItems,
      "futureResolutionInputs",
    ),
    sourceNoGoItemCount: sourceNoGo.noGoItemCount,
    sourceArchiveReviewNoGoCount: sourceNoGo.archiveReviewNoGoCount,
    sourceExternalEvidenceNoGoCount: sourceNoGo.externalEvidenceNoGoCount,
    sourceManualReviewerNoGoCount: sourceNoGo.manualReviewerNoGoCount,
    sourceArchiveReviewStillBlockedCount:
      sourceNoGo.archiveRemediationReviewStillBlockedCount,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistReady:
      true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationChecklistOnly:
      true,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoPacketReady:
      sourceNoGo.externalFinalDecisionArchiveRemediationReviewNoGoPacketReady,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoPacketOnly:
      sourceNoGo.externalFinalDecisionArchiveRemediationReviewNoGoPacketOnly,
    sourceExternalFinalDecisionArchiveRemediationReviewChecklistReady:
      sourceNoGo.sourceExternalFinalDecisionArchiveRemediationReviewChecklistReady,
    sourceExternalFinalDecisionArchiveRemediationReviewChecklistOnly:
      sourceNoGo.sourceExternalFinalDecisionArchiveRemediationReviewChecklistOnly,
    sourceExternalFinalDecisionArchiveRemediationPlanReady:
      sourceNoGo.sourceExternalFinalDecisionArchiveRemediationPlanReady,
    sourceExternalFinalDecisionArchiveRemediationPlanOnly:
      sourceNoGo.sourceExternalFinalDecisionArchiveRemediationPlanOnly,
    sourceExternalFinalDecisionArchiveNoGoPacketReady:
      sourceNoGo.sourceExternalFinalDecisionArchiveNoGoPacketReady,
    sourceExternalFinalDecisionArchiveNoGoPacketOnly:
      sourceNoGo.sourceExternalFinalDecisionArchiveNoGoPacketOnly,
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
    ...archiveRemediationReviewNoGoReconciliationRuntimeBlockedFlags,
    blockedCodes,
    archiveRemediationReviewNoGoReconciliationRules: [
      "This endpoint is a read-only archive remediation review no-go reconciliation checklist, not a no-go acceptance system and not an authorization decision system.",
      "It may check source no-go item ids, source review ids, source archive ids, blocker consistency, unresolved evidence labels, redaction rules, rejection triggers, forbidden conclusions, and future safe inputs.",
      "It must not accept reconciliation, record reconciliation, mark no-go items reconciled, accept no-go outcomes, accept archive remediation review outcomes, accept archive remediation, resolve archive blockers, accept archive no-go items, accept external archives, accept final decisions, deny authorization, grant authorization, store approvals, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
      "Reconciliation checklist readiness does not mean any no-go decision was accepted, any blocker was resolved, or any implementation authorization decision was recorded.",
    ],
    archiveRemediationReviewNoGoReconciliationRejectionRules: [
      "Reject any input that removes source no-go, review, remediation, archive no-go, archive checklist, or final decision ids.",
      "Reject any input that includes raw archive artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, or full external document bodies.",
      "Reject any input that treats reconciliation as accepted no-go, accepted review, accepted archive remediation, accepted archive, accepted final decision, authorization denial, authorization grant, or implementation readiness.",
      "Reject any input that starts branch, patch, file, test, migration, privileged-client, transaction, database-write, AI, Stripe, deployment, feature-flag, production-writer, or report-unlock work.",
      "The next safe stage is a read-only archive remediation review no-go reconciliation no-go packet; it must still remain non-executable.",
    ],
    sourceArchiveRemediationReviewNoGoItems:
      sourceNoGo.archiveRemediationReviewNoGoItems,
    archiveRemediationReviewNoGoReconciliationItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliation(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliation();
  const blockedSummary =
    "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation probe blocked: no reconciliation acceptance, reconciliation record, reconciled mark, authorization decision promotion, review no-go acceptance, no-go record, authorization denial, review acceptance, review record, archive remediation acceptance, archive remediation evidence record, archive blocker resolution, archive no-go acceptance, archive no-go record, external archive acceptance, final decision acceptance, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      archiveRemediationReviewNoGoReconciliationItems:
        payload.archiveRemediationReviewNoGoReconciliationItems,
    };
  }

  const itemId =
    (requestBody as { itemId?: unknown; reconciliationItemId?: unknown })
      .itemId ??
    (requestBody as { reconciliationItemId?: unknown }).reconciliationItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      archiveRemediationReviewNoGoReconciliationItems:
        payload.archiveRemediationReviewNoGoReconciliationItems,
    };
  }

  const selectedItem =
    payload.archiveRemediationReviewNoGoReconciliationItems.find(
      (candidate) => candidate.id === itemId,
    );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      archiveRemediationReviewNoGoReconciliationItems:
        payload.archiveRemediationReviewNoGoReconciliationItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation probe blocked as designed: the selected reconciliation item was returned, but no reconciliation acceptance, reconciliation record, reconciled mark, authorization decision promotion, review no-go acceptance, no-go record, authorization denial, review acceptance, review record, archive remediation acceptance, archive remediation evidence record, archive blocker resolution, archive no-go acceptance, archive no-go record, external archive acceptance, final decision acceptance, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    archiveRemediationReviewNoGoReconciliationItems: [selectedItem],
  };
}
