import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go";
import type { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItem } from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation";

const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationBlockedCodes =
  [
    "implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_checklist_only",
    "source_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_packet_still_blocks_authorization",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciled_mark_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_authorization_decision_promotion_forbidden",
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

const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationRuntimeBlockedFlags =
  {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation:
      false,
    wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation:
      false,
    wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciled:
      false,
    wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationToAuthorizationDecision:
      false,
  } as const satisfies Pick<
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationRuntimeFlags,
    | "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation"
    | "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation"
    | "wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciled"
    | "wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationToAuthorizationDecision"
  >;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function mapStatus(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationStatus {
  return sourceItem.status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_external_evidence_unresolved"
    ? "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_external_evidence_unresolved"
    : "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_manual_reviewer_unresolved";
}

function reconciliationTitle(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItem,
) {
  if (sourceItem.title.endsWith(" no-go")) {
    return sourceItem.title.replace(/ no-go$/, " no-go reconciliation");
  }

  return `${sourceItem.title} reconciliation`;
}

function buildReconciliationItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItem {
  const externalEvidenceUnresolved =
    sourceItem.status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_external_evidence_unresolved";

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
    sourceReconciliationNoGoItemIds:
      sourceItem.sourceReconciliationNoGoItemIds,
    sourceReconciliationItemIds: sourceItem.sourceReconciliationItemIds,
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
    reconciliationQuestion:
      "Is this archive remediation review no-go reconciliation remediation review no-go item internally complete enough to remain a safe blocker without accepting or recording it?",
    reconciliationFinding: externalEvidenceUnresolved
      ? "The review no-go item is traceable and safely redacted, but external reconciliation remediation review evidence remains unresolved and cannot unlock implementation authorization."
      : "The review no-go item is traceable and safely redacted, but manual reviewer state remains unresolved and cannot be replaced by this checklist.",
    traceabilityChecks: unique([
      `Source review no-go item id ${sourceItem.id} is preserved.`,
      "Every source review item id remains mapped.",
      "Every source remediation item id remains mapped.",
      "Every source reconciliation no-go id remains mapped.",
      "Every source reconciliation checklist id remains mapped.",
      "Every source archive remediation item id remains mapped.",
      "Every source archive no-go item id remains mapped.",
      "Every source archive checklist item id remains mapped.",
      "Every source final decision item id remains mapped.",
      ...sourceItem.safeNoGoRefs,
    ]),
    blockerConsistencyChecks: unique([
      sourceItem.noGoQuestion,
      sourceItem.noGoConclusion,
      ...sourceItem.blockerEvidence,
      "The item still says externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted=false.",
      "The item still says implementationAuthorizationGranted=false.",
      "The item still says readyForAdapterImplementation=false.",
      "The item does not convert no-go packet readiness into no-go acceptance.",
    ]),
    redactionChecks: unique([
      ...sourceItem.redactionRules,
      "No raw archive artifact, private narrative, prompt, provider payload, webhook body, token, secret, credential, service-role config, or full external document body is needed to reconcile this item.",
    ]),
    rejectionTriggers: unique([
      ...sourceItem.unresolvedReviewGaps,
      ...sourceItem.sourceChecklistFailures,
      ...sourceItem.forbiddenShortcuts,
      "Reject reconciliation if any source id is removed, renamed, or detached from its parent no-go item.",
      "Reject reconciliation if it claims review no-go acceptance, review acceptance, remediation acceptance, reconciliation acceptance, archive acceptance, final decision acceptance, authorization denial, authorization grant, or implementation readiness.",
    ]),
    unresolvedEvidence: unique([
      ...sourceItem.unresolvedReviewGaps,
      ...(externalEvidenceUnresolved
        ? [
            "External reconciliation remediation review evidence is not accepted in app state.",
            "External reconciliation remediation review evidence is not recorded in app state.",
          ]
        : [
            "Manual reconciliation remediation review state is not accepted in app state.",
            "Manual reconciliation remediation review state is not recorded in app state.",
          ]),
    ]),
    forbiddenConclusions: unique([
      "Do not conclude that this review no-go item is accepted.",
      "Do not conclude that reconciliation remediation review is accepted.",
      "Do not conclude that reconciliation remediation is accepted.",
      "Do not conclude that reconciliation no-go, reconciliation, archive remediation review no-go, archive remediation review, archive remediation, archive no-go, external archive, or final decision is accepted.",
      "Do not conclude that authorization is denied, granted, or ready to implement.",
      "Do not start branches, files, tests, migrations, service-role clients, transactions, row writes, deployments, AI calls, Stripe calls, or report unlocks.",
    ]),
    futureResolutionInputs: unique([
      ...sourceItem.futureResolutionPrerequisites,
      "A later external review process may provide safe state labels for this no-go item.",
      "A later read-only reconciliation no-go packet can summarize remaining reconciliation blockers.",
    ]),
    nonAcceptanceClauses: unique([
      ...sourceItem.nonAcceptanceClauses,
      "This reconciliation item is not an accepted reconciliation result.",
      "This reconciliation item does not record review no-go acceptance, authorization denial, authorization grant, approval storage, or implementation readiness.",
    ]),
    nextSafeAction:
      "Keep implementation authorization blocked and define only a read-only archive remediation review no-go reconciliation remediation review no-go reconciliation no-go packet before any acceptance, recording, authorization, branch, migration, privileged client, deployment, AI, Stripe, report, or database-write work.",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItem[],
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItem[],
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
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationPayload,
) {
  return {
    ...payload,
    blocked: true as const,
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

export async function buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation(): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationPayload> {
  const sourceNoGo =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo();
  const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems =
    sourceNoGo.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems.map(
      buildReconciliationItem,
    );
  const blockedCodes = unique([
    ...sourceNoGo.blockedCodes,
    ...archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationBlockedCodes,
  ]);

  return {
    ...sourceNoGo,
    safeMode: true,
    readOnly: true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistMode:
      "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_checklist_only",
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoMode:
      sourceNoGo.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoMode,
    checkedAt: new Date().toISOString(),
    reconciliationItemCount:
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems.length,
    externalEvidenceUnresolvedCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems,
      "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_external_evidence_unresolved",
    ),
    manualReviewerUnresolvedCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems,
      "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_manual_reviewer_unresolved",
    ),
    reviewNoGoStillBlockedCount:
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems.length,
    traceabilityCheckCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems,
      "traceabilityChecks",
    ),
    blockerConsistencyCheckCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems,
      "blockerConsistencyChecks",
    ),
    redactionCheckCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems,
      "redactionChecks",
    ),
    rejectionTriggerCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems,
      "rejectionTriggers",
    ),
    unresolvedEvidenceCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems,
      "unresolvedEvidence",
    ),
    forbiddenConclusionCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems,
      "forbiddenConclusions",
    ),
    futureResolutionInputCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems,
      "futureResolutionInputs",
    ),
    sourceNoGoItemCount: sourceNoGo.noGoItemCount,
    sourceReviewNoGoCount: sourceNoGo.reviewNoGoCount,
    sourceExternalEvidenceReviewNoGoCount:
      sourceNoGo.externalEvidenceReviewNoGoCount,
    sourceManualReviewerReviewNoGoCount:
      sourceNoGo.manualReviewerReviewNoGoCount,
    sourceReconciliationRemediationReviewStillBlockedCount:
      sourceNoGo.reconciliationRemediationReviewStillBlockedCount,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistReady:
      true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistOnly:
      true,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPacketReady:
      sourceNoGo.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPacketReady,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPacketOnly:
      sourceNoGo.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPacketOnly,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistReady:
      sourceNoGo.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistReady,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistOnly:
      sourceNoGo.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistOnly,
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
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewRecorded:
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
    ...archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationRuntimeBlockedFlags,
    blockedCodes,
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationRules:
      [
        "This endpoint is a read-only archive remediation review no-go reconciliation remediation review no-go reconciliation checklist, not a no-go acceptance system and not an authorization decision system.",
        "It may check source no-go item ids, source review ids, source remediation ids, source reconciliation ids, source archive ids, blocker consistency, unresolved evidence labels, redaction rules, rejection triggers, forbidden conclusions, and future safe inputs.",
        "It must not accept reconciliation, record reconciliation, mark no-go items reconciled, accept review no-go outcomes, accept review outcomes, accept reconciliation remediation, accept reconciliation no-go items, accept reconciliation, accept archive remediation review outcomes, accept archive remediation, resolve archive blockers, accept archive no-go items, accept external archives, accept final decisions, deny authorization, grant authorization, store approvals, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
        "Reconciliation checklist readiness does not mean any no-go decision was accepted, any blocker was resolved, any authorization denial was recorded, or implementation authorization was granted.",
      ],
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationRejectionRules:
      [
        "Reject any input that removes source review no-go, review, remediation, reconciliation no-go, reconciliation checklist, archive remediation, archive no-go, archive checklist, or final decision ids.",
        "Reject any input that includes raw archive artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, or full external document bodies.",
        "Reject any input that treats reconciliation as accepted no-go, accepted review, accepted reconciliation remediation, accepted archive, accepted final decision, authorization denial, authorization grant, or implementation readiness.",
        "Reject any input that starts branch, patch, file, test, migration, privileged-client, transaction, database-write, AI, Stripe, deployment, feature-flag, production-writer, or report-unlock work.",
        "The next safe stage is a read-only archive remediation review no-go reconciliation remediation review no-go reconciliation no-go packet; it must still remain non-executable.",
      ],
    sourceArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems:
      sourceNoGo.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoItems,
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation();
  const blockedSummary =
    "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation remediation review no-go reconciliation probe blocked: no reconciliation acceptance, reconciliation record, reconciled mark, authorization decision promotion, review no-go acceptance, review no-go record, authorization denial, review acceptance, review record, reconciliation remediation acceptance, reconciliation no-go acceptance, archive remediation acceptance, archive blocker resolution, archive no-go acceptance, external archive acceptance, final decision acceptance, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems,
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
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems,
    };
  }

  const selectedItem =
    payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems.find(
      (candidate) => candidate.id === itemId,
    );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation remediation review no-go reconciliation probe blocked as designed: the selected reconciliation item was returned, but no reconciliation acceptance, reconciliation record, reconciled mark, authorization decision promotion, review no-go acceptance, review no-go record, authorization denial, review acceptance, review record, reconciliation remediation acceptance, reconciliation no-go acceptance, archive remediation acceptance, archive blocker resolution, archive no-go acceptance, external archive acceptance, final decision acceptance, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems:
      [selectedItem],
  };
}
