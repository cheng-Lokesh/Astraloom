import "server-only";

import { buildStage72Remediation } from "@/lib/server-writers/stage72-remediation";
import type {
  Stage73RemediationReviewItem,
  Stage73RemediationReviewPayload,
  Stage73RemediationReviewProbeResult,
  Stage73RemediationReviewRuntimeFlags,
  Stage73RemediationReviewStatus,
} from "@/types/stage73-remediation-review";
import type { Stage72RemediationItem } from "@/types/stage72-remediation";

export const stage73PublicPagePath =
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go-remediation-review";
export const stage73PublicApiPath =
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go-remediation-review";
export const stage73InternalPagePath = "/server-writers/p73-remediation-review";
export const stage73InternalApiPath =
  "/api/system-writers/p73-remediation-review";

const stage73BlockedCodes = [
  "stage73_remediation_review_checklist_only",
  "source_stage72_remediation_plan_still_blocks_authorization",
  "stage73_review_acceptance_forbidden",
  "stage73_review_record_forbidden",
  "stage73_review_evidence_storage_forbidden",
  "stage73_review_completion_forbidden",
  "stage73_remediation_reviewed_mark_forbidden",
  "stage73_review_no_go_promotion_forbidden",
  "stage72_remediation_acceptance_forbidden",
  "stage72_remediation_record_forbidden",
  "stage72_remediation_state_acceptance_forbidden",
  "stage72_blocker_resolution_forbidden",
  "stage71_no_go_acceptance_forbidden",
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

const stage73RuntimeBlockedFlags = {
  wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReview:
    false,
  wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReview:
    false,
  wouldStoreFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewEvidence:
    false,
  wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewed:
    false,
  wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewNoGo:
    false,
} as const satisfies Pick<
  Stage73RemediationReviewRuntimeFlags,
  | "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReview"
  | "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReview"
  | "wouldStoreFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewEvidence"
  | "wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewed"
  | "wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewNoGo"
>;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function mapStatus(
  item: Stage72RemediationItem,
): Stage73RemediationReviewStatus {
  return item.status === "stage72_remediation_external_evidence_required"
    ? "stage73_review_external_evidence_still_missing"
    : "stage73_review_manual_reviewer_still_required";
}

function buildStage73Item(
  sourceItem: Stage72RemediationItem,
): Stage73RemediationReviewItem {
  const externalEvidence =
    sourceItem.status === "stage72_remediation_external_evidence_required";

  return {
    id: `${sourceItem.id}_review`,
    category: sourceItem.category,
    title: `${sourceItem.title} review`,
    status: mapStatus(sourceItem),
    owner: sourceItem.owner,
    sourceRemediationStatus: sourceItem.status,
    sourceRemediationItemIds: unique([sourceItem.id]),
    sourceNoGoItemIds: sourceItem.sourceNoGoItemIds,
    sourceRemediationReviewItemIds: sourceItem.sourceRemediationReviewItemIds,
    sourceNoGoRemediationItemIds: sourceItem.sourceNoGoRemediationItemIds,
    sourceReconciliationNoGoItemIds: sourceItem.sourceReconciliationNoGoItemIds,
    sourceReconciliationItemIds: sourceItem.sourceReconciliationItemIds,
    sourceReviewItemIds: sourceItem.sourceReviewItemIds,
    sourceArchiveItemIds: sourceItem.sourceArchiveItemIds,
    sourceDecisionItemIds: sourceItem.sourceDecisionItemIds,
    sourceRefs: sourceItem.sourceRefs,
    reviewQuestion:
      "Does the Stage72 remediation plan contain enough safe state labels for a later external review without accepting remediation now?",
    currentFinding: externalEvidence
      ? "External evidence remains a safe placeholder state only; review cannot accept it without separate external artifact verification."
      : "Manual reviewer readiness remains a safe placeholder state only; review cannot accept it without separate reviewer assignment and independence evidence.",
    evidenceReadinessChecks: unique([
      "source Stage72 remediation item id is present",
      "source Stage71 no-go item id is present",
      "safe owner role is present",
      "redaction state is present",
      "tamper-evidence state is present",
      "freshness state is present",
      "future review question is present",
      ...sourceItem.safeEvidenceRequirements,
    ]),
    manualReviewerChecks: unique([
      "manual reviewer role is present",
      "manual reviewer assignment state is present",
      "manual reviewer independence check is present",
      "manual reviewer conflict check is present",
      "safe conclusion placeholder is present",
      "manual escalation owner is present",
      ...sourceItem.manualReviewRequirements,
    ]),
    redactionChecks: unique([
      ...sourceItem.redactionRules,
      "Review may inspect only safe ids, role labels, status labels, redaction labels, tamper-evidence labels, freshness labels, and short review questions.",
    ]),
    rejectionChecks: unique([
      ...sourceItem.rejectionTriggers,
      "Reject the plan if it claims remediation acceptance, review acceptance, no-go acceptance, authorization denial, authorization grant, or implementation readiness.",
      "Reject the plan if it contains raw private narrative, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, or full artifact bodies.",
    ]),
    completenessChecks: unique([
      ...sourceItem.acceptanceCriteria,
      "The review checklist can map every Stage72 plan item to one review item.",
      "The review checklist keeps remediation acceptance and review completion false.",
      "The review checklist keeps implementation authorization blocked.",
    ]),
    nonAcceptanceClauses: unique([
      ...sourceItem.nonExecutionClauses,
      "This review checklist is not a completed remediation review.",
      "This review checklist does not accept or reject external evidence.",
      "This review checklist does not deny or grant authorization.",
    ]),
    stillBlockedReasons: unique([
      ...sourceItem.residualRisks,
      "Stage72 remediation remains plan-only.",
      "No external artifact has been accepted.",
      "No manual reviewer conclusion has been recorded.",
      "No blocker has been resolved.",
    ]),
    futureNoGoCriteria: unique([
      ...sourceItem.futureReviewGates,
      "A later Stage74 no-go packet is required if external evidence remains missing or manual reviewer independence remains unresolved.",
      "A later stage must keep all write, transaction, service-role, branch, migration, AI, Stripe, deployment, and report-unlock effects blocked unless explicitly authorized.",
    ]),
    nextSafeAction:
      "Keep this remediation review checklist read-only and prepare only a later no-go packet if evidence or reviewer readiness is still insufficient.",
  };
}

function countByStatus(
  items: Stage73RemediationReviewItem[],
  status: Stage73RemediationReviewStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: Stage73RemediationReviewItem[],
  key:
    | "evidenceReadinessChecks"
    | "manualReviewerChecks"
    | "redactionChecks"
    | "rejectionChecks"
    | "completenessChecks"
    | "stillBlockedReasons"
    | "futureNoGoCriteria",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(payload: Stage73RemediationReviewPayload) {
  return {
    ...payload,
    blocked: true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewChecklistOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewAccepted:
      false as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewRecorded:
      false as const,
  };
}

export async function buildStage73RemediationReview(): Promise<Stage73RemediationReviewPayload> {
  const sourceRemediation = await buildStage72Remediation();
  const stage73RemediationReviewItems =
    sourceRemediation.stage72RemediationItems.map(buildStage73Item);
  const blockedCodes = unique([
    ...sourceRemediation.blockedCodes,
    ...stage73BlockedCodes,
  ]);

  return {
    ...sourceRemediation,
    safeMode: true,
    readOnly: true,
    stage73RemediationReviewMode:
      "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_remediation_review_checklist_only",
    publicPagePath: stage73PublicPagePath,
    publicApiPath: stage73PublicApiPath,
    internalPagePath: stage73InternalPagePath,
    internalApiPath: stage73InternalApiPath,
    checkedAt: new Date().toISOString(),
    reviewItemCount: stage73RemediationReviewItems.length,
    externalEvidenceStillMissingCount: countByStatus(
      stage73RemediationReviewItems,
      "stage73_review_external_evidence_still_missing",
    ),
    manualReviewerStillRequiredCount: countByStatus(
      stage73RemediationReviewItems,
      "stage73_review_manual_reviewer_still_required",
    ),
    stage72RemediationStillBlockedCount:
      stage73RemediationReviewItems.length,
    evidenceReadinessCheckCount: uniqueCount(
      stage73RemediationReviewItems,
      "evidenceReadinessChecks",
    ),
    manualReviewerCheckCount: uniqueCount(
      stage73RemediationReviewItems,
      "manualReviewerChecks",
    ),
    redactionCheckCount: uniqueCount(
      stage73RemediationReviewItems,
      "redactionChecks",
    ),
    rejectionCheckCount: uniqueCount(
      stage73RemediationReviewItems,
      "rejectionChecks",
    ),
    completenessCheckCount: uniqueCount(
      stage73RemediationReviewItems,
      "completenessChecks",
    ),
    stillBlockedReasonCount: uniqueCount(
      stage73RemediationReviewItems,
      "stillBlockedReasons",
    ),
    futureNoGoCriteriaCount: uniqueCount(
      stage73RemediationReviewItems,
      "futureNoGoCriteria",
    ),
    sourceRemediationItemCount: sourceRemediation.remediationItemCount,
    sourceExternalEvidenceRemediationRequiredCount:
      sourceRemediation.externalEvidenceRemediationRequiredCount,
    sourceManualReviewerRemediationRequiredCount:
      sourceRemediation.manualReviewerRemediationRequiredCount,
    sourceRemediationStillBlockedCount:
      sourceRemediation.remediationStillBlockedCount,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewChecklistReady:
      true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewChecklistOnly:
      true,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanReady:
      sourceRemediation.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanReady,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanOnly:
      sourceRemediation.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanOnly,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewComplete:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationStatesAccepted:
      false,
    authorizationReconsiderationFinalDecisionAccepted: false,
    implementationAuthorizationGranted: false,
    implementationAuthorized: false,
    readyForAdapterImplementation: false,
    allRuntimeEffectsBlocked: true,
    ...stage73RuntimeBlockedFlags,
    blockedCodes,
    stage73ReviewRules: [
      "Stage73 is a read-only remediation review checklist over the Stage72 remediation plan.",
      "It may inspect safe evidence labels, manual reviewer readiness labels, redaction checks, rejection checks, completeness checks, still-blocked reasons, and future no-go criteria.",
      "It must not accept remediation, complete review, store review evidence, mark remediation reviewed, promote to no-go, deny authorization, grant authorization, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable feature flags, run production writers, or unlock reports.",
      "Review checklist readiness does not mean evidence is accepted, remediation is accepted, blockers are resolved, or implementation authorization is granted.",
    ],
    sourceStage72Items: sourceRemediation.stage72RemediationItems,
    stage73RemediationReviewItems,
  };
}

export async function probeStage73RemediationReview(
  requestBody: unknown,
): Promise<Stage73RemediationReviewProbeResult> {
  const payload = await buildStage73RemediationReview();
  const blockedSummary =
    "Stage73 remediation review probe blocked: no remediation review acceptance, review record, review evidence storage, reviewed mark, no-go promotion, remediation acceptance, blocker resolution, authorization denial, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      stage73RemediationReviewItems: payload.stage73RemediationReviewItems,
    };
  }

  const itemId =
    (requestBody as { itemId?: unknown; reviewItemId?: unknown }).itemId ??
    (requestBody as { reviewItemId?: unknown }).reviewItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      stage73RemediationReviewItems: payload.stage73RemediationReviewItems,
    };
  }

  const selectedItem = payload.stage73RemediationReviewItems.find(
    (candidate) => candidate.id === itemId,
  );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      stage73RemediationReviewItems: payload.stage73RemediationReviewItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Stage73 remediation review probe blocked as designed: the selected review item was returned, but no remediation review acceptance, review record, review evidence storage, reviewed mark, no-go promotion, remediation acceptance, blocker resolution, authorization denial, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    stage73RemediationReviewItems: [selectedItem],
  };
}
