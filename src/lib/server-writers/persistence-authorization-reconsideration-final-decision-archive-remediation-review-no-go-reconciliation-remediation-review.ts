import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation";
import type { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationItem } from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review";

const archiveRemediationReviewNoGoReconciliationRemediationReviewBlockedCodes =
  [
    "implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_checklist_only",
    "source_archive_remediation_review_no_go_reconciliation_remediation_plan_still_blocks_authorization",
    "archive_remediation_review_no_go_reconciliation_remediation_review_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_evidence_storage_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_mark_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_promotion_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_evidence_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_state_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_blocker_resolution_forbidden",
    "archive_remediation_review_no_go_reconciliation_no_go_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_no_go_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_record_forbidden",
    "archive_remediation_review_no_go_acceptance_forbidden",
    "archive_remediation_review_no_go_record_forbidden",
    "archive_remediation_review_acceptance_forbidden",
    "archive_remediation_review_record_forbidden",
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

const archiveRemediationReviewNoGoReconciliationRemediationReviewRuntimeBlockedFlags =
  {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview:
      false,
    wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview:
      false,
    wouldStoreFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewEvidence:
      false,
    wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewed:
      false,
    wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo:
      false,
  } as const satisfies Pick<
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewRuntimeFlags,
    | "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview"
    | "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview"
    | "wouldStoreFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewEvidence"
    | "wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewed"
    | "wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo"
  >;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function reviewStatus(
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewStatus {
  return item.status ===
    "archive_remediation_review_no_go_reconciliation_external_remediation_required"
    ? "archive_remediation_review_no_go_reconciliation_remediation_review_external_evidence_missing"
    : "archive_remediation_review_no_go_reconciliation_remediation_review_manual_reviewer_required";
}

function reviewTitle(
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationItem,
) {
  if (item.title.endsWith(" remediation")) {
    return item.title.replace(/ remediation$/, " review");
  }

  return `${item.title} review`;
}

function buildReconciliationRemediationReviewItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewItem {
  const externalEvidenceMissing =
    sourceItem.status ===
    "archive_remediation_review_no_go_reconciliation_external_remediation_required";

  return {
    id: `${sourceItem.id}_review`,
    category: sourceItem.category,
    title: reviewTitle(sourceItem),
    status: reviewStatus(sourceItem),
    owner: sourceItem.owner,
    sourceRemediationStatus: sourceItem.status,
    sourceRemediationItemIds: [sourceItem.id],
    sourceReconciliationNoGoItemIds:
      sourceItem.sourceReconciliationNoGoItemIds,
    sourceReconciliationItemIds: sourceItem.sourceReconciliationItemIds,
    sourceNoGoItemIds: sourceItem.sourceNoGoItemIds,
    sourceReviewItemIds: sourceItem.sourceReviewItemIds,
    sourceArchiveRemediationItemIds: sourceItem.sourceRemediationItemIds,
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
    reviewQuestion: externalEvidenceMissing
      ? `Can the external reconciliation remediation state for ${sourceItem.title} be reviewed from safe metadata without accepting the evidence in the app?`
      : `Can the manual reconciliation remediation reviewer state for ${sourceItem.title} be reviewed from safe metadata without accepting the reviewer conclusion in the app?`,
    currentFinding: externalEvidenceMissing
      ? "External reconciliation remediation evidence remains unaccepted, unrecorded, and unresolved in app state."
      : "Manual reconciliation remediation reviewer state remains unaccepted, unrecorded, and unresolved in app state.",
    requiredExternalState: externalEvidenceMissing
      ? "A safe external reconciliation remediation entry must exist with source remediation item id, source no-go id, owner role, evidence state, redaction state, tamper-evidence state, caveats, and review question id."
      : "A safe manual reconciliation remediation reviewer entry must exist with reviewer role, source remediation item id, blocker state, caveat state, redaction state, tamper-evidence state, and review question id.",
    safeEvidenceRefs: unique([
      "source reconciliation remediation item id",
      "source reconciliation no-go item id",
      "source reconciliation checklist item id",
      "source archive remediation review no-go item id",
      "source archive remediation review item id",
      "source archive remediation item id",
      "source archive no-go item id",
      "source archive checklist item id",
      "source final decision item id",
      "owner role",
      "external remediation evidence state",
      "manual reviewer state",
      "redaction state",
      "tamper-evidence state",
      "future reconciliation remediation review no-go question id",
      ...sourceItem.safeEvidenceRequirements,
    ]),
    completenessChecks: unique([
      `The review packet includes source reconciliation remediation item id ${sourceItem.id}.`,
      "Every source reconciliation no-go id remains mapped and visible.",
      "Every source reconciliation checklist id remains mapped and visible.",
      "Every source archive remediation review no-go id remains mapped and visible.",
      "Every source archive remediation review id remains mapped and visible.",
      "The external evidence state is one of missing, present, stale, rejected, or reviewer_required.",
      "The manual reviewer state is one of unassigned, assigned, blocked, rejected, or ready_for_later_review.",
      "The redaction state and tamper-evidence state are present as labels only.",
      "The review packet does not claim reconciliation remediation acceptance, review acceptance, no-go acceptance, archive acceptance, final decision acceptance, authorization denial, or implementation authorization.",
      ...sourceItem.verificationSteps,
    ]),
    redactionChecks: unique([
      ...sourceItem.redactionRules,
      "Only safe ids, owner roles, state labels, redaction states, tamper-evidence states, caveats, and short reviewer questions are referenced.",
      "Raw archive artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, and full external document bodies are absent.",
    ]),
    rejectionTriggers: unique([
      "Any source reconciliation remediation item id is missing, renamed, or detached from its source reconciliation no-go id.",
      "Any external evidence or manual reviewer state is treated as accepted inside the app.",
      "Any raw artifact body, private narrative, prompt, provider payload, webhook body, signature, token, secret, credential, or service-role config appears.",
      "The review packet marks reconciliation remediation reviewed, records review evidence, accepts reconciliation remediation, accepts reconciliation no-go, accepts reconciliation, accepts archive remediation review no-go, accepts archive remediation review, accepts archive remediation, accepts archive no-go, accepts external archive, accepts final decision, denies authorization, grants authorization, starts implementation, creates files, creates tests, creates migrations, creates service-role clients, opens transactions, or writes rows.",
      ...sourceItem.forbiddenActions,
    ]),
    nonAcceptanceClauses: unique([
      ...sourceItem.nonExecutionClauses,
      "This reconciliation remediation review item does not accept reconciliation remediation.",
      "This reconciliation remediation review item does not record review evidence.",
      "This reconciliation remediation review item does not mark external reconciliation remediation reviewed.",
      "This reconciliation remediation review item does not accept no-go outcomes, deny authorization, grant authorization, or start implementation work.",
    ]),
    passCriteriaForFutureReview: unique([
      ...sourceItem.acceptanceCriteria,
      "A later no-go/go packet can inspect every external reconciliation remediation state without private data.",
      "Every remaining reconciliation blocker has an owner role, state, caveat, redaction label, tamper-evidence label, and next review question.",
    ]),
    failCriteriaForCurrentReview: unique([
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted remains false.",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewRecorded remains false.",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewComplete remains false.",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationAccepted remains false.",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationRecorded remains false.",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatesAccepted remains false.",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoAccepted remains false.",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationAccepted remains false.",
      "externalFinalDecisionArchiveRemediationReviewNoGoAccepted remains false.",
      "finalDecisionArchiveRemediationReviewAccepted remains false.",
      "externalFinalDecisionArchiveRemediationAccepted remains false.",
      "finalDecisionArchiveNoGoAccepted remains false.",
      "externalFinalDecisionArchiveAccepted remains false.",
      "authorizationReconsiderationFinalDecisionAccepted remains false.",
      "implementationAuthorizationGranted remains false.",
      "readyForAdapterImplementation remains false.",
    ]),
    stillBlockedBecause: unique([
      ...sourceItem.residualRisks,
      "External reconciliation remediation states are not accepted by this app route.",
      "No reconciliation remediation review outcome is recorded by this app route.",
      "No reconciliation no-go, reconciliation outcome, archive remediation review outcome, archive outcome, final decision, authorization denial, or implementation authorization can be inferred from review checklist readiness.",
      "A later read-only reconciliation remediation review no-go packet or decision gate is required before any implementation work can be reconsidered.",
    ]),
    nextSafeAction:
      "Define a read-only archive remediation review no-go reconciliation remediation review no-go packet or decision checkpoint while keeping all write, acceptance, authorization, branch, migration, deployment, AI, Stripe, and report effects blocked.",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewItem[],
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewItem[],
  key: "completenessChecks" | "redactionChecks" | "rejectionTriggers",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewPayload,
) {
  return {
    ...payload,
    blocked: true as const,
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

export async function buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview(): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewPayload> {
  const sourceRemediation =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation();
  const archiveRemediationReviewNoGoReconciliationRemediationReviewItems =
    sourceRemediation.archiveRemediationReviewNoGoReconciliationRemediationItems.map(
      buildReconciliationRemediationReviewItem,
    );
  const blockedCodes = unique([
    ...sourceRemediation.blockedCodes,
    ...archiveRemediationReviewNoGoReconciliationRemediationReviewBlockedCodes,
  ]);

  return {
    ...sourceRemediation,
    safeMode: true,
    readOnly: true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistMode:
      "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_checklist_only",
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationMode:
      sourceRemediation.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationMode,
    checkedAt: new Date().toISOString(),
    reviewItemCount:
      archiveRemediationReviewNoGoReconciliationRemediationReviewItems.length,
    externalEvidenceMissingCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationRemediationReviewItems,
      "archive_remediation_review_no_go_reconciliation_remediation_review_external_evidence_missing",
    ),
    manualReviewerRequiredCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationRemediationReviewItems,
      "archive_remediation_review_no_go_reconciliation_remediation_review_manual_reviewer_required",
    ),
    reconciliationRemediationStillBlockedCount:
      archiveRemediationReviewNoGoReconciliationRemediationReviewItems.length,
    completenessCheckCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewItems,
      "completenessChecks",
    ),
    redactionCheckCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewItems,
      "redactionChecks",
    ),
    rejectionTriggerCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewItems,
      "rejectionTriggers",
    ),
    sourceRemediationItemCount: sourceRemediation.remediationItemCount,
    sourceExternalReconciliationRemediationRequiredCount:
      sourceRemediation.externalReconciliationRemediationRequiredCount,
    sourceManualReconciliationReviewRequiredCount:
      sourceRemediation.manualReconciliationReviewRequiredCount,
    sourceReconciliationStillBlockedCount:
      sourceRemediation.sourceReconciliationStillBlockedCount,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistReady:
      true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistOnly:
      true,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanReady:
      sourceRemediation.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanReady,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanOnly:
      sourceRemediation.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanOnly,
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
    ...archiveRemediationReviewNoGoReconciliationRemediationReviewRuntimeBlockedFlags,
    blockedCodes,
    archiveRemediationReviewNoGoReconciliationRemediationReviewChecklistRules: [
      "This endpoint is a read-only archive remediation review no-go reconciliation remediation review checklist, not a remediation acceptance system.",
      "It may inspect the source reconciliation remediation plan shape, safe evidence refs, completeness checks, redaction checks, rejection triggers, non-acceptance clauses, current fail criteria, and next safe action.",
      "It must not accept reconciliation remediation review, record review outcomes, store review evidence, mark reconciliation remediation reviewed, accept reconciliation remediation, accept reconciliation no-go items, accept reconciliation outcomes, accept review no-go items, accept archive remediation review outcomes, accept archive remediation, resolve archive blockers, accept archive no-go items, accept external archives, accept final decisions, deny authorization, grant authorization, store approvals, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
      "Because external reconciliation remediation states are not accepted in this stage, implementation authorization remains blocked by default.",
    ],
    archiveRemediationReviewNoGoReconciliationRemediationReviewRejectionRules:
      [
        "Reject any review input that includes raw archive artifacts, private narratives, prompts, provider payloads, tokens, secrets, webhook bodies, signatures, service-role config, credentials, or full external document bodies.",
        "Reject any review input that treats this route as a go decision, approval artifact, blocker-resolution record, final decision acceptance, archive acceptance, authorization denial, or implementation authorization.",
        "Reject any review input that removes source reconciliation no-go ids, source reconciliation checklist ids, source archive remediation review no-go ids, source archive remediation ids, source archive ids, source final decision ids, or remediation item ids without traceability.",
        "Reject any review input that starts branch, patch, file, test, migration, privileged-client, transaction, database-write, AI, Stripe, deployment, feature-flag, production-writer, or report-unlock work.",
        "The next safe stage is a read-only archive remediation review no-go reconciliation remediation review no-go packet; it must still remain non-executable.",
      ],
    sourceArchiveRemediationReviewNoGoReconciliationRemediationPlanRules:
      sourceRemediation.archiveRemediationReviewNoGoReconciliationRemediationPlanRules,
    sourceArchiveRemediationReviewNoGoReconciliationRemediationItems:
      sourceRemediation.archiveRemediationReviewNoGoReconciliationRemediationItems,
    archiveRemediationReviewNoGoReconciliationRemediationReviewItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview();
  const blockedSummary =
    "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation remediation review probe blocked: no reconciliation remediation review acceptance, review record, evidence storage, remediation review mark, review no-go promotion, reconciliation remediation acceptance, remediation evidence record, blocker resolution, remediation state acceptance, reconciliation no-go acceptance, reconciliation no-go record, reconciliation acceptance, review no-go acceptance, review acceptance, archive remediation acceptance, archive blocker resolution, archive no-go acceptance, external archive acceptance, final decision acceptance, authorization denial, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewItems,
    };
  }

  const itemId =
    (requestBody as { itemId?: unknown; reviewItemId?: unknown }).itemId ??
    (requestBody as { reviewItemId?: unknown }).reviewItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewItems,
    };
  }

  const selectedItem =
    payload.archiveRemediationReviewNoGoReconciliationRemediationReviewItems.find(
      (candidate) => candidate.id === itemId,
    );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation remediation review probe blocked as designed: the selected reconciliation remediation review item was returned, but no reconciliation remediation review acceptance, review record, evidence storage, remediation review mark, review no-go promotion, reconciliation remediation acceptance, remediation evidence record, blocker resolution, remediation state acceptance, reconciliation no-go acceptance, reconciliation no-go record, reconciliation acceptance, review no-go acceptance, review acceptance, archive remediation acceptance, archive blocker resolution, archive no-go acceptance, external archive acceptance, final decision acceptance, authorization denial, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    archiveRemediationReviewNoGoReconciliationRemediationReviewItems: [
      selectedItem,
    ],
  };
}
