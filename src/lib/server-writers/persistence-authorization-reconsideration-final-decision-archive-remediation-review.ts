import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediation } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation";
import type { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationItem } from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review";

const archiveRemediationReviewBlockedCodes = [
  "implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_checklist_only",
  "source_external_final_decision_archive_remediation_plan_still_blocks_authorization",
  "final_decision_archive_remediation_review_acceptance_forbidden",
  "final_decision_archive_remediation_review_record_forbidden",
  "final_decision_archive_remediation_review_evidence_storage_forbidden",
  "final_decision_archive_external_remediation_review_mark_forbidden",
  "final_decision_archive_remediation_review_no_go_promotion_forbidden",
  "external_final_decision_archive_remediation_acceptance_forbidden",
  "external_final_decision_archive_remediation_evidence_record_forbidden",
  "external_final_decision_archive_remediation_state_acceptance_forbidden",
  "external_final_decision_archive_blocker_resolution_forbidden",
  "external_final_decision_archive_no_go_acceptance_forbidden",
  "external_final_decision_archive_no_go_record_forbidden",
  "external_final_decision_archive_acceptance_forbidden",
  "final_decision_archive_completeness_acceptance_forbidden",
  "final_decision_acceptance_forbidden",
  "final_decision_record_forbidden",
  "final_no_go_acceptance_forbidden",
  "final_no_go_record_forbidden",
  "final_go_record_forbidden",
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

const archiveRemediationReviewRuntimeBlockedFlags = {
  wouldAcceptFinalDecisionArchiveRemediationReview: false,
  wouldRecordFinalDecisionArchiveRemediationReview: false,
  wouldStoreFinalDecisionArchiveRemediationReviewEvidence: false,
  wouldMarkFinalDecisionArchiveExternalRemediationReviewed: false,
  wouldPromoteToFinalDecisionArchiveRemediationReviewNoGo: false,
} as const satisfies Pick<
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewRuntimeFlags,
  | "wouldAcceptFinalDecisionArchiveRemediationReview"
  | "wouldRecordFinalDecisionArchiveRemediationReview"
  | "wouldStoreFinalDecisionArchiveRemediationReviewEvidence"
  | "wouldMarkFinalDecisionArchiveExternalRemediationReviewed"
  | "wouldPromoteToFinalDecisionArchiveRemediationReviewNoGo"
>;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function reviewStatus(
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewStatus {
  return item.status === "archive_external_remediation_required"
    ? "archive_review_external_evidence_missing"
    : "archive_review_manual_reviewer_required";
}

function reviewTitle(
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationItem,
) {
  if (item.title.endsWith(" remediation")) {
    return item.title.replace(/ remediation$/, " review");
  }

  return `${item.title} review`;
}

function buildArchiveRemediationReviewItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewItem {
  const externalEvidenceMissing =
    sourceItem.status === "archive_external_remediation_required";

  return {
    id: `${sourceItem.id}_review`,
    category: sourceItem.category,
    title: reviewTitle(sourceItem),
    status: reviewStatus(sourceItem),
    owner: sourceItem.owner,
    sourceRemediationStatus: sourceItem.status,
    sourceRemediationItemIds: [sourceItem.id],
    sourceArchiveNoGoItemIds: sourceItem.sourceArchiveNoGoItemIds,
    sourceArchiveItemIds: sourceItem.sourceArchiveItemIds,
    sourceDecisionItemIds: sourceItem.sourceDecisionItemIds,
    sourceNoGoItemIds: sourceItem.sourceNoGoItemIds,
    sourceReviewItemIds: sourceItem.sourceReviewItemIds,
    sourceReconsiderationRemediationItemIds:
      sourceItem.sourceReconsiderationRemediationItemIds,
    sourcePreflightItemIds: sourceItem.sourcePreflightItemIds,
    sourceOriginalRemediationItemIds: sourceItem.sourceOriginalRemediationItemIds,
    sourceRefs: sourceItem.sourceRefs,
    reviewQuestion: externalEvidenceMissing
      ? `Can the external archive evidence state for ${sourceItem.title} be reviewed from safe metadata without accepting the artifact in the app?`
      : `Can the manual archive reviewer state for ${sourceItem.title} be reviewed from safe metadata without accepting the reviewer conclusion in the app?`,
    currentFinding: externalEvidenceMissing
      ? "External archive evidence remains unaccepted, unrecorded, and unresolved in app state."
      : "Manual archive reviewer state remains unaccepted, unrecorded, and unresolved in app state.",
    requiredExternalState: externalEvidenceMissing
      ? "A safe external archive evidence entry must exist with source item id, owner role, state, redaction state, tamper-evidence state, caveats, and review question id."
      : "A safe manual archive reviewer entry must exist with reviewer role, source item id, blocker state, caveat state, redaction state, tamper-evidence state, and review question id.",
    safeEvidenceRefs: unique([
      "source archive remediation item id",
      "source archive no-go item id",
      "source archive checklist item id",
      "source final decision item id",
      "owner role",
      "external archive state",
      "redaction state",
      "tamper-evidence state",
      "future archive remediation review question id",
      ...sourceItem.safeEvidenceRequirements,
    ]),
    completenessChecks: unique([
      `The review packet includes source archive remediation item id ${sourceItem.id}.`,
      "Every source archive no-go id remains mapped and visible.",
      "Every source archive checklist item id remains mapped and visible.",
      "Every source final decision item id remains mapped and visible.",
      "The external state is one of missing, present, stale, rejected, or reviewer_required.",
      "The redaction state and tamper-evidence state are present as labels only.",
      "The review packet does not claim archive remediation acceptance, archive acceptance, final decision acceptance, or implementation authorization.",
      ...sourceItem.verificationSteps,
    ]),
    redactionChecks: unique([
      ...sourceItem.redactionRules,
      "Only safe ids, owner roles, state labels, redaction states, tamper-evidence states, caveats, and short reviewer questions are referenced.",
      "Raw archive artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, and full external document bodies are absent.",
    ]),
    rejectionTriggers: unique([
      "Any source archive remediation item id is missing, renamed, or detached from its source archive no-go id.",
      "Any external state is treated as accepted inside the app.",
      "Any raw artifact body, private narrative, prompt, provider payload, webhook body, signature, token, secret, credential, or service-role config appears.",
      "The review packet marks archive remediation reviewed, records review evidence, accepts archive no-go, accepts external archive, accepts final decision, records final go/no-go, grants authorization, starts implementation, creates files, creates tests, creates migrations, creates service-role clients, opens transactions, or writes rows.",
      ...sourceItem.forbiddenActions,
    ]),
    nonAcceptanceClauses: unique([
      ...sourceItem.nonExecutionClauses,
      "This archive remediation review item does not accept archive remediation.",
      "This archive remediation review item does not record review evidence.",
      "This archive remediation review item does not mark external archive remediation reviewed.",
      "This archive remediation review item does not promote the project to implementation authorization.",
    ]),
    passCriteriaForFutureReview: unique([
      ...sourceItem.acceptanceCriteria,
      "A later no-go/go packet can inspect every external archive remediation state without private data.",
      "Every remaining archive blocker has an owner role, state, caveat, redaction label, tamper-evidence label, and next review question.",
    ]),
    failCriteriaForCurrentReview: unique([
      "externalFinalDecisionArchiveRemediationAccepted remains false.",
      "externalFinalDecisionArchiveRemediationRecorded remains false.",
      "externalFinalDecisionArchiveRemediationStatesAccepted remains false.",
      "finalDecisionArchiveRemediationReviewAccepted remains false.",
      "finalDecisionArchiveRemediationReviewRecorded remains false.",
      "finalDecisionArchiveRemediationReviewComplete remains false.",
      "finalDecisionArchiveNoGoAccepted remains false.",
      "externalFinalDecisionArchiveAccepted remains false.",
      "authorizationReconsiderationFinalDecisionAccepted remains false.",
      "implementationAuthorizationGranted remains false.",
      "readyForAdapterImplementation remains false.",
    ]),
    stillBlockedBecause: unique([
      ...sourceItem.residualRisks,
      "External archive remediation states are not accepted by this app route.",
      "No final decision archive no-go outcome is accepted by this app route.",
      "No final decision or implementation authorization can be inferred from review checklist readiness.",
      "A later read-only archive remediation review no-go packet is required before any reconsideration can proceed.",
    ]),
    nextSafeAction:
      "Define a read-only external final decision archive remediation review no-go packet while keeping all write, acceptance, authorization, branch, migration, deployment, AI, Stripe, and report effects blocked.",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewItem[],
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewItem[],
  key: "completenessChecks" | "redactionChecks" | "rejectionTriggers",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewPayload,
) {
  return {
    ...payload,
    blocked: true as const,
    externalFinalDecisionArchiveRemediationReviewChecklistOnly: true as const,
    sourceExternalFinalDecisionArchiveRemediationPlanOnly: true as const,
    externalFinalDecisionArchiveRemediationPlanOnly: true as const,
    sourceExternalFinalDecisionArchiveNoGoPacketOnly: true as const,
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

export async function buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReview(): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewPayload> {
  const sourceRemediation =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediation();
  const archiveRemediationReviewItems =
    sourceRemediation.archiveRemediationItems.map(
      buildArchiveRemediationReviewItem,
    );
  const blockedCodes = unique([
    ...sourceRemediation.blockedCodes,
    ...archiveRemediationReviewBlockedCodes,
  ]);

  return {
    ...sourceRemediation,
    safeMode: true,
    readOnly: true,
    externalFinalDecisionArchiveRemediationReviewChecklistMode:
      "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_checklist_only",
    sourceExternalFinalDecisionArchiveRemediationMode:
      sourceRemediation.externalFinalDecisionArchiveRemediationMode,
    checkedAt: new Date().toISOString(),
    reviewItemCount: archiveRemediationReviewItems.length,
    externalEvidenceMissingCount: countByStatus(
      archiveRemediationReviewItems,
      "archive_review_external_evidence_missing",
    ),
    manualReviewerRequiredCount: countByStatus(
      archiveRemediationReviewItems,
      "archive_review_manual_reviewer_required",
    ),
    archiveRemediationStillBlockedCount:
      archiveRemediationReviewItems.length,
    completenessCheckCount: uniqueCount(
      archiveRemediationReviewItems,
      "completenessChecks",
    ),
    redactionCheckCount: uniqueCount(
      archiveRemediationReviewItems,
      "redactionChecks",
    ),
    rejectionTriggerCount: uniqueCount(
      archiveRemediationReviewItems,
      "rejectionTriggers",
    ),
    sourceRemediationItemCount: sourceRemediation.remediationItemCount,
    sourceExternalArchiveRemediationRequiredCount:
      sourceRemediation.externalArchiveRemediationRequiredCount,
    sourceManualArchiveReviewRequiredCount:
      sourceRemediation.manualArchiveReviewRequiredCount,
    externalFinalDecisionArchiveRemediationReviewChecklistReady: true,
    externalFinalDecisionArchiveRemediationReviewChecklistOnly: true,
    sourceExternalFinalDecisionArchiveRemediationPlanReady:
      sourceRemediation.externalFinalDecisionArchiveRemediationPlanReady,
    sourceExternalFinalDecisionArchiveRemediationPlanOnly:
      sourceRemediation.externalFinalDecisionArchiveRemediationPlanOnly,
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
    ...archiveRemediationReviewRuntimeBlockedFlags,
    blockedCodes,
    archiveRemediationReviewChecklistRules: [
      "This endpoint is a read-only external final decision archive remediation review checklist, not a remediation acceptance system.",
      "It may inspect the source archive remediation plan shape, safe evidence refs, completeness checks, redaction checks, rejection triggers, non-acceptance clauses, current fail criteria, and next safe action.",
      "It must not accept archive remediation, record review outcomes, store review evidence, mark external archive remediation reviewed, accept archive no-go items, accept external archives, accept final decisions, record final go/no-go, deny or grant authorization, store approvals, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
      "Because external archive remediation states are not accepted in this stage, implementation authorization remains blocked by default.",
    ],
    archiveRemediationReviewRejectionRules: [
      "Reject any review input that includes raw archive artifacts, private narratives, prompts, provider payloads, tokens, secrets, webhook bodies, signatures, service-role config, credentials, or full external document bodies.",
      "Reject any review input that treats this route as a go decision, approval artifact, blocker-resolution record, final decision acceptance, archive acceptance, or implementation authorization.",
      "Reject any review input that removes source archive no-go ids, source archive checklist ids, source final decision ids, or remediation item ids without traceability.",
      "Reject any review input that starts branch, patch, file, test, migration, privileged-client, transaction, database-write, AI, Stripe, deployment, feature-flag, production-writer, or report-unlock work.",
      "The next safe stage is a read-only external final decision archive remediation review no-go packet; it must still remain non-executable.",
    ],
    sourceArchiveRemediationItems: sourceRemediation.archiveRemediationItems,
    archiveRemediationReviewItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReview(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReview();
  const blockedSummary =
    "Persistence authorization reconsideration final decision archive remediation review probe blocked: no archive remediation review acceptance, review record, evidence storage, external remediation review mark, review no-go promotion, archive remediation acceptance, archive remediation evidence record, archive blocker resolution, archive no-go acceptance, archive no-go record, archive upload, archive read, archive hash, archive index write, archive completeness acceptance, external archive acceptance, final decision acceptance, final go/no-go record, authorization denial, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      archiveRemediationReviewItems: payload.archiveRemediationReviewItems,
    };
  }

  const itemId =
    (requestBody as { itemId?: unknown; reviewItemId?: unknown }).itemId ??
    (requestBody as { reviewItemId?: unknown }).reviewItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      archiveRemediationReviewItems: payload.archiveRemediationReviewItems,
    };
  }

  const selectedItem = payload.archiveRemediationReviewItems.find(
    (candidate) => candidate.id === itemId,
  );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      archiveRemediationReviewItems: payload.archiveRemediationReviewItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration final decision archive remediation review probe blocked as designed: the selected archive remediation review item was returned, but no archive remediation review acceptance, review record, evidence storage, external remediation review mark, review no-go promotion, archive remediation acceptance, archive remediation evidence record, archive blocker resolution, archive no-go acceptance, archive no-go record, archive upload, archive read, archive hash, archive index write, archive completeness acceptance, external archive acceptance, final decision acceptance, final go/no-go record, authorization denial, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    archiveRemediationReviewItems: [selectedItem],
  };
}
