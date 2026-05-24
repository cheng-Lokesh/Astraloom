import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go";
import type {
  Stage72RemediationItem,
  Stage72RemediationPayload,
  Stage72RemediationProbeResult,
  Stage72RemediationRuntimeFlags,
  Stage72RemediationStatus,
} from "@/types/stage72-remediation";
import type { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItem } from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go";

export const stage72PublicPagePath =
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go-remediation";
export const stage72PublicApiPath =
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go-remediation";
export const stage72InternalPagePath = "/server-writers/p72-remediation";
export const stage72InternalApiPath = "/api/system-writers/p72-remediation";

const stage72BlockedCodes = [
  "stage72_remediation_plan_only",
  "source_stage71_no_go_packet_still_blocks_authorization",
  "stage72_remediation_acceptance_forbidden",
  "stage72_remediation_evidence_record_forbidden",
  "stage72_blocker_resolution_forbidden",
  "stage72_ticket_creation_forbidden",
  "stage72_remediation_state_acceptance_forbidden",
  "stage72_remediation_review_promotion_forbidden",
  "stage71_no_go_acceptance_forbidden",
  "stage71_no_go_record_forbidden",
  "stage70_review_acceptance_forbidden",
  "archive_remediation_acceptance_forbidden",
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

const stage72RuntimeBlockedFlags = {
  wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediation:
    false,
  wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationEvidence:
    false,
  wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoBlockerResolved:
    false,
  wouldCreateArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationTicket:
    false,
  wouldAcceptArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationState:
    false,
  wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReview:
    false,
} as const satisfies Pick<
  Stage72RemediationRuntimeFlags,
  | "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediation"
  | "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationEvidence"
  | "wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoBlockerResolved"
  | "wouldCreateArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationTicket"
  | "wouldAcceptArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationState"
  | "wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReview"
>;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function mapStatus(
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItem,
): Stage72RemediationStatus {
  return item.status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_external_evidence_missing"
    ? "stage72_remediation_external_evidence_required"
    : "stage72_remediation_manual_reviewer_required";
}

function remediationTitle(
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItem,
) {
  if (item.title.endsWith(" no-go")) {
    return item.title.replace(/ no-go$/, " remediation");
  }

  return `${item.title} remediation`;
}

function buildStage72Item(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItem,
): Stage72RemediationItem {
  const externalEvidenceRequired =
    sourceItem.status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_external_evidence_missing";

  return {
    id: `${sourceItem.id}_remediation`,
    category: sourceItem.category,
    title: remediationTitle(sourceItem),
    status: mapStatus(sourceItem),
    owner: sourceItem.owner,
    sourceNoGoStatus: sourceItem.status,
    sourceNoGoItemIds: unique([sourceItem.id]),
    sourceRemediationReviewItemIds: sourceItem.sourceRemediationReviewItemIds,
    sourceNoGoRemediationItemIds: sourceItem.sourceNoGoRemediationItemIds,
    sourceReconciliationNoGoItemIds: sourceItem.sourceReconciliationNoGoItemIds,
    sourceReconciliationItemIds: sourceItem.sourceReconciliationItemIds,
    sourceReviewItemIds: sourceItem.sourceReviewItemIds,
    sourceArchiveItemIds: sourceItem.sourceArchiveItemIds,
    sourceDecisionItemIds: sourceItem.sourceDecisionItemIds,
    sourceRefs: sourceItem.sourceRefs,
    blockerSummary: sourceItem.noGoConclusion,
    remediationQuestion:
      "What safe remediation evidence would be required before this Stage71 no-go item can be reviewed again?",
    remediationPlan: externalEvidenceRequired
      ? "Prepare a safe external evidence state for a later reviewer: owner role, artifact id, redaction state, tamper-evidence state, freshness state, and short review question only."
      : "Prepare a safe manual reviewer lane for a later reviewer: reviewer role, assignment state, independence check, conflict check, conclusion placeholder, and escalation state only.",
    requiredExternalState: externalEvidenceRequired
      ? "external_evidence_present_redacted_tamper_evident_and_ready_for_later_review"
      : "manual_reviewer_assigned_independent_and_ready_for_later_review",
    safeEvidenceRequirements: unique([
      "stage71 no-go item id",
      "source remediation review item id",
      "source no-go remediation item id",
      "source reconciliation no-go item id",
      "source reconciliation item id",
      "source archive item id",
      "source final decision item id",
      "owner role",
      "redaction state",
      "tamper-evidence state",
      "freshness state",
      "future review question",
      ...sourceItem.safeNoGoRefs,
    ]),
    manualReviewRequirements: unique([
      "manual reviewer role",
      "manual reviewer assignment state",
      "manual reviewer independence check",
      "manual reviewer conflict check",
      "manual reviewer safe conclusion placeholder",
      "manual reviewer escalation owner",
      ...sourceItem.futureResolutionPrerequisites,
    ]),
    verificationSteps: [
      "Confirm the source Stage71 no-go packet remains packet-only.",
      "Confirm this Stage72 remediation path remains plan-only.",
      "Confirm remediation is not accepted or recorded.",
      "Confirm no blocker is marked resolved.",
      "Confirm no remediation ticket is created.",
      "Confirm implementation authorization remains false.",
      "Confirm readyForAdapterImplementation remains false.",
      "Confirm wouldCreateServiceRoleClient, wouldRunTransaction, and wouldWriteRows remain false.",
    ],
    acceptanceCriteria: [
      "Every Stage71 no-go item maps to exactly one Stage72 remediation item.",
      "External evidence is represented only through safe state labels and ids.",
      "Manual reviewer requirements are represented only through safe role and state labels.",
      "The route can support a later read-only remediation review checklist without accepting remediation now.",
      "No runtime side effect occurs.",
    ],
    residualRisks: unique([
      "External evidence may still be missing, stale, tampered, inaccessible, or rejected.",
      "Manual reviewers may reject the remediation lane or require additional evidence.",
      "A later remediation review may still produce another no-go packet.",
      "Plan readiness does not equal authorization readiness.",
      ...sourceItem.unresolvedReviewGaps,
    ]),
    redactionRules: unique([
      ...sourceItem.redactionRules,
      "Expose only safe ids, owner roles, state labels, redaction labels, tamper-evidence labels, and short review questions.",
      "Do not expose raw archive artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, or full external document bodies.",
    ]),
    rejectionTriggers: unique([
      ...sourceItem.sourceChecklistFailures,
      "Reject remediation evidence that removes source no-go, reconciliation, review, remediation, archive, or final decision ids.",
      "Reject remediation evidence that contains raw private narrative, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, or full artifact bodies.",
      "Reject remediation evidence that claims remediation acceptance, no-go acceptance, authorization denial, authorization grant, or implementation readiness.",
    ]),
    forbiddenActions: unique([
      ...sourceItem.forbiddenShortcuts,
      "Do not accept this remediation plan in app state.",
      "Do not record remediation evidence or mark blockers resolved.",
      "Do not create branches, files, tests, migrations, service-role clients, transactions, database writes, feature flags, deployments, production writers, AI calls, Stripe calls, or report unlocks.",
    ]),
    nonExecutionClauses: unique([
      ...sourceItem.nonAcceptanceClauses,
      "This remediation item is a read-only plan, not an accepted remediation state.",
      "This remediation item does not deny or grant implementation authorization.",
    ]),
    futureReviewGates: [
      "A later Stage73 remediation review checklist must inspect this plan without accepting it.",
      "A later human authorization mechanism must separately accept external evidence before implementation can be reconsidered.",
      "A later implementation path must still pass service-role, transaction, audit, idempotency, rollback, rollout, RLS, QA, and owner gates.",
    ],
    nextSafeAction:
      "Keep implementation authorization blocked and define only a later read-only remediation review checklist before any acceptance, recording, authorization, branch, migration, privileged client, deployment, AI, Stripe, report, or database-write work.",
  };
}

function countByStatus(
  items: Stage72RemediationItem[],
  status: Stage72RemediationStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: Stage72RemediationItem[],
  key:
    | "safeEvidenceRequirements"
    | "manualReviewRequirements"
    | "verificationSteps"
    | "acceptanceCriteria"
    | "residualRisks"
    | "redactionRules"
    | "rejectionTriggers"
    | "forbiddenActions"
    | "futureReviewGates",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(payload: Stage72RemediationPayload) {
  return {
    ...payload,
    blocked: true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoAccepted:
      false as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRecorded:
      false as const,
    sourceReleaseStillBlocked: true as const,
  };
}

export async function buildStage72Remediation(): Promise<Stage72RemediationPayload> {
  const sourceNoGo =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo();
  const stage72RemediationItems =
    sourceNoGo.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems.map(
      buildStage72Item,
    );
  const blockedCodes = unique([...sourceNoGo.blockedCodes, ...stage72BlockedCodes]);

  return {
    ...sourceNoGo,
    safeMode: true,
    readOnly: true,
    stage72RemediationMode:
      "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_remediation_plan_only",
    publicPagePath: stage72PublicPagePath,
    publicApiPath: stage72PublicApiPath,
    internalPagePath: stage72InternalPagePath,
    internalApiPath: stage72InternalApiPath,
    checkedAt: new Date().toISOString(),
    remediationItemCount: stage72RemediationItems.length,
    externalEvidenceRemediationRequiredCount: countByStatus(
      stage72RemediationItems,
      "stage72_remediation_external_evidence_required",
    ),
    manualReviewerRemediationRequiredCount: countByStatus(
      stage72RemediationItems,
      "stage72_remediation_manual_reviewer_required",
    ),
    remediationStillBlockedCount: stage72RemediationItems.length,
    safeEvidenceRequirementCount: uniqueCount(
      stage72RemediationItems,
      "safeEvidenceRequirements",
    ),
    manualReviewRequirementCount: uniqueCount(
      stage72RemediationItems,
      "manualReviewRequirements",
    ),
    verificationStepCount: uniqueCount(stage72RemediationItems, "verificationSteps"),
    acceptanceCriteriaCount: uniqueCount(
      stage72RemediationItems,
      "acceptanceCriteria",
    ),
    residualRiskCount: uniqueCount(stage72RemediationItems, "residualRisks"),
    redactionRuleCount: uniqueCount(stage72RemediationItems, "redactionRules"),
    rejectionTriggerCount: uniqueCount(stage72RemediationItems, "rejectionTriggers"),
    forbiddenActionCount: uniqueCount(stage72RemediationItems, "forbiddenActions"),
    futureReviewGateCount: uniqueCount(stage72RemediationItems, "futureReviewGates"),
    sourceNoGoItemCount: sourceNoGo.noGoItemCount,
    sourceExternalEvidenceReviewNoGoCount:
      sourceNoGo.externalEvidenceReviewNoGoCount,
    sourceManualReviewerReviewNoGoCount: sourceNoGo.manualReviewerReviewNoGoCount,
    sourceRemediationReviewStillBlockedCount:
      sourceNoGo.remediationReviewStillBlockedCount,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanReady:
      true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanOnly:
      true,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketReady:
      sourceNoGo.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketReady,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketOnly:
      sourceNoGo.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketOnly,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationStatesAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationAccepted:
      false,
    authorizationReconsiderationFinalDecisionAccepted: false,
    implementationAuthorizationGranted: false,
    implementationAuthorized: false,
    readyForAdapterImplementation: false,
    allRuntimeEffectsBlocked: true,
    ...stage72RuntimeBlockedFlags,
    blockedCodes,
    stage72RemediationRules: [
      "Stage72 is a read-only remediation path after the Stage71 remediation review no-go packet.",
      "It may map no-go items to safe evidence requirements, manual reviewer requirements, verification steps, acceptance criteria, residual risks, redaction rules, rejection triggers, forbidden actions, non-execution clauses, and future review gates.",
      "It must not accept remediation, record remediation evidence, resolve blockers, create remediation tickets, accept no-go outcomes, deny authorization, grant authorization, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable feature flags, run production writers, or unlock reports.",
      "Plan readiness does not mean any blocker was resolved, any no-go result was accepted, any authorization denial was recorded, or implementation authorization was granted.",
    ],
    stage72ReviewRules: [
      "A later Stage73 remediation review checklist must start from this plan and its source Stage71 no-go ids.",
      "External evidence may be referenced only by safe item id, owner role, status label, redaction state, tamper-evidence state, and short review question.",
      "Manual reviewer output may be referenced only by role, assignment state, independence check, safe conclusion placeholder, redaction state, and escalation state.",
      "Reject raw prompts, private narratives, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, and full external document bodies.",
    ],
    sourceStage71Items:
      sourceNoGo.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems,
    stage72RemediationItems,
  };
}

export async function probeStage72Remediation(
  requestBody: unknown,
): Promise<Stage72RemediationProbeResult> {
  const payload = await buildStage72Remediation();
  const blockedSummary =
    "Stage72 remediation probe blocked: no remediation acceptance, remediation evidence record, blocker resolution, ticket creation, remediation state acceptance, remediation review promotion, no-go acceptance, authorization denial, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      stage72RemediationItems: payload.stage72RemediationItems,
    };
  }

  const itemId =
    (requestBody as { itemId?: unknown; remediationItemId?: unknown }).itemId ??
    (requestBody as { remediationItemId?: unknown }).remediationItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      stage72RemediationItems: payload.stage72RemediationItems,
    };
  }

  const selectedItem = payload.stage72RemediationItems.find(
    (candidate) => candidate.id === itemId,
  );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      stage72RemediationItems: payload.stage72RemediationItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Stage72 remediation probe blocked as designed: the selected remediation item was returned, but no remediation acceptance, remediation evidence record, blocker resolution, ticket creation, remediation state acceptance, remediation review promotion, no-go acceptance, authorization denial, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    stage72RemediationItems: [selectedItem],
  };
}
