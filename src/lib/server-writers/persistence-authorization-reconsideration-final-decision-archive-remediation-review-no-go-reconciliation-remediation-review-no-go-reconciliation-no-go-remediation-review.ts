import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediation } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation";
import type { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItem } from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review";

const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewBlockedCodes =
  [
    "implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_checklist_only",
    "source_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_plan_still_blocks_authorization",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_evidence_storage_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_mark_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_promotion_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_evidence_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_state_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_acceptance_forbidden",
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

const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewRuntimeBlockedFlags =
  {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview:
      false,
    wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview:
      false,
    wouldStoreFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewEvidence:
      false,
    wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewed:
      false,
    wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo:
      false,
  } as const satisfies Pick<
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewRuntimeFlags,
    | "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview"
    | "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview"
    | "wouldStoreFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewEvidence"
    | "wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewed"
    | "wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo"
  >;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function reviewStatus(
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewStatus {
  return item.status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_external_evidence_required"
    ? "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_external_evidence_missing"
    : "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_manual_reviewer_required";
}

function reviewTitle(
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItem,
) {
  if (item.title.endsWith(" remediation")) {
    return item.title.replace(/ remediation$/, " review");
  }

  return `${item.title} review`;
}

function buildNoGoRemediationReviewItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItem {
  const externalEvidenceMissing =
    sourceItem.status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_external_evidence_required";

  return {
    id: `${sourceItem.id}_review`,
    category: sourceItem.category,
    title: reviewTitle(sourceItem),
    status: reviewStatus(sourceItem),
    owner: sourceItem.owner,
    sourceNoGoRemediationStatus: sourceItem.status,
    sourceNoGoRemediationItemIds: [sourceItem.id],
    sourceReconciliationNoGoItemIds:
      sourceItem.sourceReconciliationNoGoItemIds,
    sourceReconciliationItemIds: sourceItem.sourceReconciliationItemIds,
    sourceNoGoItemIds: sourceItem.sourceNoGoItemIds,
    sourceReviewItemIds: sourceItem.sourceReviewItemIds,
    sourceRemediationItemIds: sourceItem.sourceRemediationItemIds,
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
    reviewQuestion: externalEvidenceMissing
      ? `Can the external evidence remediation shape for ${sourceItem.title} be reviewed from safe metadata without accepting the evidence in the app?`
      : `Can the manual reviewer remediation shape for ${sourceItem.title} be reviewed from safe metadata without accepting the reviewer conclusion in the app?`,
    currentFinding: externalEvidenceMissing
      ? "External evidence remains required, unaccepted, unrecorded, and unresolved in app state."
      : "Manual reviewer state remains required, unaccepted, unrecorded, and unresolved in app state.",
    requiredExternalState: sourceItem.requiredExternalState,
    safeEvidenceRefs: unique([
      "source no-go remediation item id",
      "source reconciliation no-go item id",
      "source reconciliation checklist item id",
      "source review no-go item id",
      "source review item id",
      "source archive remediation review no-go item id",
      "source archive remediation review item id",
      "source archive remediation item id",
      "source archive no-go item id",
      "source final decision item id",
      "owner role",
      "external evidence state",
      "manual reviewer state",
      "redaction state",
      "tamper-evidence state",
      "future remediation review no-go question id",
      ...sourceItem.safeEvidenceRequirements,
    ]),
    completenessChecks: unique([
      `The review checklist includes source no-go remediation item id ${sourceItem.id}.`,
      "Every source reconciliation no-go id remains mapped and visible.",
      "Every source reconciliation checklist id remains mapped and visible.",
      "Every source review no-go and review id remains mapped and visible.",
      "Every source archive remediation, archive no-go, archive checklist, and final decision id remains mapped and visible.",
      "The required external state is present as a label only.",
      "The external evidence state is one of missing, present, stale, rejected, or reviewer_required.",
      "The manual reviewer state is one of unassigned, assigned, blocked, rejected, or ready_for_later_review.",
      "The redaction state and tamper-evidence state are present as labels only.",
      "The checklist does not claim remediation acceptance, no-go acceptance, reconciliation acceptance, review acceptance, archive acceptance, final decision acceptance, authorization denial, or implementation authorization.",
      ...sourceItem.verificationSteps,
    ]),
    manualReviewerChecks: unique([
      "Manual reviewer role is represented as a role label only.",
      "Manual reviewer assignment state is represented as a state label only.",
      "Manual reviewer independence check remains a safe checklist label.",
      "Manual reviewer conflict check remains a safe checklist label.",
      "Manual reviewer safe conclusion remains a placeholder and is not accepted by this route.",
      "Manual reviewer rejection reason remains a placeholder and is not recorded by this route.",
      ...sourceItem.manualReviewRequirements,
    ]),
    redactionChecks: unique([
      ...sourceItem.redactionRules,
      "Only safe ids, owner roles, state labels, redaction states, tamper-evidence states, caveats, and short reviewer questions are referenced.",
      "Raw archive artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, and full external document bodies are absent.",
    ]),
    rejectionTriggers: unique([
      ...sourceItem.rejectionTriggers,
      "Reject any review input that drops source remediation, no-go, reconciliation, review, archive, or final decision ids.",
      "Reject any review input that treats external evidence or manual reviewer state as accepted inside the app.",
      "Reject any review input that contains raw private narrative, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, or full artifact bodies.",
      "Reject any review input that starts implementation, branch, patch, file, test, migration, service-role client, transaction, database write, deployment, AI, Stripe, feature flag, production writer, or report unlock work.",
    ]),
    nonAcceptanceClauses: unique([
      ...sourceItem.nonExecutionClauses,
      "This remediation review item does not accept the remediation plan.",
      "This remediation review item does not record review evidence.",
      "This remediation review item does not mark external evidence or manual reviewer state reviewed.",
      "This remediation review item does not accept no-go outcomes, deny authorization, grant authorization, or start implementation work.",
    ]),
    passCriteriaForFutureReview: unique([
      ...sourceItem.acceptanceCriteria,
      "A later no-go packet can inspect every external evidence and manual reviewer state without private data.",
      "Every remaining blocker has an owner role, state, caveat, redaction label, tamper-evidence label, and next review question.",
      "Every future acceptance gate remains external to this route and requires a separate explicit authorization mechanism.",
    ]),
    failCriteriaForCurrentReview: unique([
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewAccepted=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewRecorded=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewComplete=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationAccepted=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationRecorded=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationStatesAccepted=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoAccepted=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationAccepted=false",
      "authorizationReconsiderationFinalDecisionAccepted=false",
      "implementationAuthorizationGranted=false",
      "readyForAdapterImplementation=false",
      "wouldWriteRows=false",
      "wouldRunTransaction=false",
      "wouldCreateServiceRoleClient=false",
    ]),
    stillBlockedBecause: unique([
      ...sourceItem.residualRisks,
      "External evidence and manual reviewer states are not accepted by this app route.",
      "No remediation review outcome is recorded by this app route.",
      "No no-go outcome, reconciliation outcome, archive remediation review outcome, archive outcome, final decision, authorization denial, or implementation authorization can be inferred from checklist readiness.",
      "A later read-only remediation review no-go packet or decision gate is required before any implementation work can be reconsidered.",
    ]),
    nextSafeAction:
      "Define a read-only archive remediation review no-go reconciliation remediation review no-go reconciliation no-go remediation review no-go packet while keeping all write, acceptance, authorization, branch, migration, deployment, AI, Stripe, and report effects blocked.",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItem[],
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItem[],
  key:
    | "completenessChecks"
    | "manualReviewerChecks"
    | "redactionChecks"
    | "rejectionTriggers"
    | "passCriteriaForFutureReview"
    | "failCriteriaForCurrentReview"
    | "stillBlockedBecause",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewPayload,
) {
  return {
    ...payload,
    blocked: true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketOnly:
      true as const,
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
    sourceReleaseStillBlocked: true as const,
  };
}

export async function buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview(): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewPayload> {
  const sourceRemediation =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediation();
  const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems =
    sourceRemediation.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems.map(
      buildNoGoRemediationReviewItem,
    );
  const blockedCodes = unique([
    ...sourceRemediation.blockedCodes,
    ...archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewBlockedCodes,
  ]);

  return {
    ...sourceRemediation,
    safeMode: true,
    readOnly: true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistMode:
      "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_checklist_only",
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationMode:
      sourceRemediation.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationMode,
    checkedAt: new Date().toISOString(),
    reviewItemCount:
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems.length,
    externalEvidenceMissingCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems,
      "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_external_evidence_missing",
    ),
    manualReviewerRequiredCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems,
      "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_manual_reviewer_required",
    ),
    reconciliationNoGoRemediationStillBlockedCount:
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems.length,
    completenessCheckCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems,
      "completenessChecks",
    ),
    manualReviewerCheckCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems,
      "manualReviewerChecks",
    ),
    redactionCheckCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems,
      "redactionChecks",
    ),
    rejectionTriggerCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems,
      "rejectionTriggers",
    ),
    passCriteriaCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems,
      "passCriteriaForFutureReview",
    ),
    failCriteriaCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems,
      "failCriteriaForCurrentReview",
    ),
    stillBlockedReasonCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems,
      "stillBlockedBecause",
    ),
    sourceNoGoRemediationItemCount: sourceRemediation.remediationItemCount,
    sourceExternalReconciliationNoGoRemediationRequiredCount:
      sourceRemediation.externalReconciliationNoGoRemediationRequiredCount,
    sourceManualReconciliationNoGoReviewRequiredCount:
      sourceRemediation.manualReconciliationNoGoReviewRequiredCount,
    sourceReconciliationNoGoStillBlockedCount:
      sourceRemediation.sourceReconciliationStillBlockedCount,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistReady:
      true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistOnly:
      true,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanReady:
      sourceRemediation.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanReady,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanOnly:
      sourceRemediation.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanOnly,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewComplete:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationStatesAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted:
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
    ...archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewRuntimeBlockedFlags,
    blockedCodes,
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistRules:
      [
        "This endpoint is a read-only archive remediation review no-go reconciliation remediation review no-go reconciliation no-go remediation review checklist, not a remediation acceptance system.",
        "It may inspect the source no-go remediation plan shape, safe evidence refs, completeness checks, manual reviewer checks, redaction checks, rejection triggers, non-acceptance clauses, current fail criteria, and next safe action.",
        "It must not accept remediation review, record review outcomes, store review evidence, mark remediation reviewed, accept remediation, accept no-go outcomes, deny authorization, promote no-go items to authorization decisions, accept reconciliation, accept review outcomes, accept archives, accept final decisions, grant authorization, store approvals, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
        "Because external evidence and manual reviewer states are not accepted in this stage, implementation authorization remains blocked by default.",
      ],
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewRejectionRules:
      [
        "Reject any review input that includes raw archive artifacts, private narratives, prompts, provider payloads, tokens, secrets, webhook bodies, signatures, service-role config, credentials, or full external document bodies.",
        "Reject any review input that treats this route as a go decision, approval artifact, blocker-resolution record, final decision acceptance, archive acceptance, authorization denial, or implementation authorization.",
        "Reject any review input that removes source remediation, no-go, reconciliation, review, archive, or final decision ids without traceability.",
        "Reject any review input that starts branch, patch, file, test, migration, privileged-client, transaction, database-write, AI, Stripe, deployment, feature-flag, production-writer, or report-unlock work.",
        "The next safe stage is a read-only archive remediation review no-go reconciliation remediation review no-go reconciliation no-go remediation review no-go packet; it must still remain non-executable.",
      ],
    sourceArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanRules:
      sourceRemediation.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanRules,
    sourceArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems:
      sourceRemediation.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems,
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview();
  const blockedSummary =
    "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation remediation review no-go reconciliation no-go remediation review probe blocked: no remediation review acceptance, review record, evidence storage, reviewed mark, review no-go promotion, remediation acceptance, remediation evidence record, blocker resolution, remediation state acceptance, no-go acceptance, no-go record, authorization denial, authorization decision promotion, reconciliation acceptance, review acceptance, archive acceptance, final decision acceptance, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems,
    };
  }

  const itemId =
    (requestBody as { itemId?: unknown; reviewItemId?: unknown }).itemId ??
    (requestBody as { reviewItemId?: unknown }).reviewItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems,
    };
  }

  const selectedItem =
    payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems.find(
      (candidate) => candidate.id === itemId,
    );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation remediation review no-go reconciliation no-go remediation review probe blocked as designed: the selected remediation review item was returned, but no remediation review acceptance, review record, evidence storage, reviewed mark, review no-go promotion, remediation acceptance, remediation evidence record, blocker resolution, remediation state acceptance, no-go acceptance, no-go record, authorization denial, authorization decision promotion, reconciliation acceptance, review acceptance, archive acceptance, final decision acceptance, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems:
      [selectedItem],
  };
}
