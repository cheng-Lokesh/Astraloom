import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-no-go";
import type { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoItem } from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-no-go";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation";

const archiveRemediationReviewNoGoReconciliationRemediationBlockedCodes = [
  "implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_plan_only",
  "source_archive_remediation_review_no_go_reconciliation_no_go_packet_still_blocks_authorization",
  "archive_remediation_review_no_go_reconciliation_remediation_acceptance_forbidden",
  "archive_remediation_review_no_go_reconciliation_remediation_evidence_record_forbidden",
  "archive_remediation_review_no_go_reconciliation_blocker_resolution_forbidden",
  "archive_remediation_review_no_go_reconciliation_remediation_ticket_creation_forbidden",
  "archive_remediation_review_no_go_reconciliation_remediation_state_acceptance_forbidden",
  "archive_remediation_review_no_go_reconciliation_remediation_review_promotion_forbidden",
  "archive_remediation_review_no_go_reconciliation_no_go_acceptance_forbidden",
  "archive_remediation_review_no_go_reconciliation_no_go_record_forbidden",
  "archive_remediation_review_no_go_reconciliation_acceptance_forbidden",
  "archive_remediation_review_no_go_reconciliation_record_forbidden",
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

const archiveRemediationReviewNoGoReconciliationRemediationRuntimeBlockedFlags =
  {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation:
      false,
    wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationEvidence:
      false,
    wouldMarkArchiveRemediationReviewNoGoReconciliationBlockerResolved: false,
    wouldCreateArchiveRemediationReviewNoGoReconciliationRemediationTicket:
      false,
    wouldAcceptArchiveRemediationReviewNoGoReconciliationRemediationState:
      false,
    wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReview:
      false,
  } as const satisfies Pick<
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationRuntimeFlags,
    | "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation"
    | "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationEvidence"
    | "wouldMarkArchiveRemediationReviewNoGoReconciliationBlockerResolved"
    | "wouldCreateArchiveRemediationReviewNoGoReconciliationRemediationTicket"
    | "wouldAcceptArchiveRemediationReviewNoGoReconciliationRemediationState"
    | "wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReview"
  >;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function mapRemediationStatus(
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatus {
  return item.status ===
    "archive_remediation_review_no_go_reconciliation_no_go_external_evidence_unresolved"
    ? "archive_remediation_review_no_go_reconciliation_external_remediation_required"
    : "archive_remediation_review_no_go_reconciliation_manual_review_required";
}

function remediationTitle(
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoItem,
) {
  if (item.title.endsWith(" no-go")) {
    return item.title.replace(/ no-go$/, " remediation");
  }

  return `${item.title} remediation`;
}

function buildReconciliationRemediationItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationItem {
  const externalEvidenceRequired =
    sourceItem.status ===
    "archive_remediation_review_no_go_reconciliation_no_go_external_evidence_unresolved";

  return {
    id: `${sourceItem.id}_remediation`,
    category: sourceItem.category,
    title: remediationTitle(sourceItem),
    status: mapRemediationStatus(sourceItem),
    owner: sourceItem.owner,
    sourceReconciliationNoGoStatus: sourceItem.status,
    sourceReconciliationNoGoItemIds: [sourceItem.id],
    sourceReconciliationItemIds: sourceItem.sourceReconciliationItemIds,
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
    blockerSummary: sourceItem.noGoConclusion,
    remediationObjective: externalEvidenceRequired
      ? "Define the safe external archive evidence state, redaction state, owner, completeness checks, and tamper-evidence references needed before this reconciliation no-go can be reviewed again."
      : "Define the manual reviewer lane, reviewer question set, redaction state, completeness checks, and tamper-evidence references needed before this reconciliation no-go can be reviewed again.",
    externalActions: unique([
      `Create an external reconciliation remediation entry keyed by source reconciliation no-go item id ${sourceItem.id}.`,
      externalEvidenceRequired
        ? "Collect safe external archive evidence status without uploading artifact bodies into the app."
        : "Assign a named external reviewer role and keep reviewer conclusions outside the app.",
      "Map every unresolved reconciliation gap to an owner, evidence state, redaction state, tamper-evidence state, and future remediation review question.",
      "Keep reconciliation no-go acceptance, reconciliation acceptance, review no-go acceptance, review acceptance, archive remediation acceptance, archive acceptance, final decision acceptance, authorization denial, authorization grants, branches, files, tests, migrations, deployments, and writes disabled.",
    ]),
    safeEvidenceRequirements: unique([
      "source reconciliation no-go item id",
      "source reconciliation item id",
      "source archive remediation review no-go item id",
      "source archive remediation review item id",
      "source archive remediation item id",
      "source archive no-go item id",
      "source archive checklist item id",
      "source final decision item id",
      "owner role",
      "external evidence state: missing, present, stale, rejected, or reviewer_required",
      "manual reviewer state: unassigned, assigned, blocked, rejected, or ready_for_later_review",
      "redaction state",
      "tamper-evidence state",
      "future reconciliation remediation review question id",
      ...sourceItem.safeNoGoRefs,
    ]),
    verificationSteps: unique([
      "Confirm externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationAccepted=false.",
      "Confirm externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationRecorded=false.",
      "Confirm externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatesAccepted=false.",
      "Confirm externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoAccepted=false.",
      "Confirm externalFinalDecisionArchiveRemediationReviewNoGoReconciliationAccepted=false.",
      "Confirm finalDecisionArchiveRemediationReviewAccepted=false.",
      "Confirm externalFinalDecisionArchiveRemediationAccepted=false.",
      "Confirm finalDecisionArchiveNoGoAccepted=false.",
      "Confirm externalFinalDecisionArchiveAccepted=false.",
      "Confirm authorizationReconsiderationFinalDecisionAccepted=false.",
      "Confirm implementationAuthorizationGranted=false.",
      "Confirm readyForAdapterImplementation=false.",
      "Confirm wouldWriteRows=false and wouldCreateServiceRoleClient=false.",
    ]),
    acceptanceCriteria: unique([
      "Every source reconciliation no-go item remains visible and mapped to this remediation plan.",
      "Every unresolved reconciliation gap has a safe external owner or remains explicitly blocking.",
      "Every external evidence or reviewer state is referenced only by safe id, state, redaction status, and tamper-evidence status.",
      "No raw private narrative, prompt, provider payload, credential, webhook body, signature, token, secret, or artifact body is included.",
      "A later read-only reconciliation remediation review checklist can inspect the evidence shape without accepting it.",
    ]),
    residualRisks: unique([
      "External archive evidence may still be incomplete, stale, tampered, rejected, or inaccessible.",
      "Manual reviewers may still reject the remediation or require narrower implementation scope.",
      "This plan may still result in another no-go after remediation review.",
      "No implementation authorization can be inferred from remediation plan readiness.",
    ]),
    redactionRules: unique([
      ...sourceItem.redactionRules,
      "Reference only safe ids, owner roles, coverage states, redaction states, tamper-evidence states, and short reviewer questions.",
      "Do not include raw prompts, private narratives, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, or full external document bodies.",
    ]),
    forbiddenActions: unique([
      ...sourceItem.forbiddenShortcuts,
      "Do not accept this reconciliation remediation plan in the app.",
      "Do not record reconciliation remediation evidence or mark any reconciliation blocker resolved.",
      "Do not create tickets, authorization records, approval records, branches, files, tests, service-role clients, transactions, migrations, deployments, feature flags, production writers, AI calls, Stripe calls, or report unlocks.",
    ]),
    nonExecutionClauses: unique([
      ...sourceItem.nonAcceptanceClauses,
      "This reconciliation remediation item is a read-only map, not an accepted remediation state.",
      "This reconciliation remediation item does not accept no-go outcomes, accept final decisions, deny authorization, grant authorization, or start implementation work.",
    ]),
    exitCriteria: unique([
      "The source reconciliation no-go item has an external owner and safe evidence state.",
      "All unresolved reconciliation gaps are mapped to future remediation review questions.",
      "A later read-only reconciliation remediation review checklist can decide whether the item remains blocked.",
      "All runtime side effects remain blocked.",
    ]),
    nextReviewGate:
      "archive_remediation_review_no_go_reconciliation_remediation_review_checklist",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationItem[],
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationItem[],
  key:
    | "externalActions"
    | "safeEvidenceRequirements"
    | "verificationSteps"
    | "acceptanceCriteria"
    | "residualRisks"
    | "redactionRules"
    | "forbiddenActions"
    | "exitCriteria",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPayload,
) {
  return {
    ...payload,
    blocked: true as const,
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

export async function buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation(): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPayload> {
  const sourceNoGo =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo();
  const archiveRemediationReviewNoGoReconciliationRemediationItems =
    sourceNoGo.archiveRemediationReviewNoGoReconciliationNoGoItems.map(
      buildReconciliationRemediationItem,
    );
  const blockedCodes = unique([
    ...sourceNoGo.blockedCodes,
    ...archiveRemediationReviewNoGoReconciliationRemediationBlockedCodes,
  ]);

  return {
    ...sourceNoGo,
    safeMode: true,
    readOnly: true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationMode:
      "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_plan_only",
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoMode:
      sourceNoGo.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoMode,
    checkedAt: new Date().toISOString(),
    remediationItemCount:
      archiveRemediationReviewNoGoReconciliationRemediationItems.length,
    externalReconciliationRemediationRequiredCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationRemediationItems,
      "archive_remediation_review_no_go_reconciliation_external_remediation_required",
    ),
    manualReconciliationReviewRequiredCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationRemediationItems,
      "archive_remediation_review_no_go_reconciliation_manual_review_required",
    ),
    externalActionCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationItems,
      "externalActions",
    ),
    safeEvidenceRequirementCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationItems,
      "safeEvidenceRequirements",
    ),
    verificationStepCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationItems,
      "verificationSteps",
    ),
    acceptanceCriteriaCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationItems,
      "acceptanceCriteria",
    ),
    residualRiskCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationItems,
      "residualRisks",
    ),
    redactionRuleCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationItems,
      "redactionRules",
    ),
    forbiddenActionCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationItems,
      "forbiddenActions",
    ),
    exitCriteriaCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationItems,
      "exitCriteria",
    ),
    sourceReconciliationNoGoItemCount: sourceNoGo.noGoItemCount,
    sourceReconciliationNoGoCount: sourceNoGo.reconciliationNoGoCount,
    sourceExternalEvidenceReconciliationNoGoCount:
      sourceNoGo.externalEvidenceReconciliationNoGoCount,
    sourceManualReviewerReconciliationNoGoCount:
      sourceNoGo.manualReviewerReconciliationNoGoCount,
    sourceReconciliationStillBlockedCount:
      sourceNoGo.archiveReviewNoGoReconciliationStillBlockedCount,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanReady:
      true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationPlanOnly:
      true,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPacketReady:
      sourceNoGo.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPacketReady,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPacketOnly:
      sourceNoGo.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPacketOnly,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationStatesAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewComplete:
      false,
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
    ...archiveRemediationReviewNoGoReconciliationRemediationRuntimeBlockedFlags,
    blockedCodes,
    archiveRemediationReviewNoGoReconciliationRemediationPlanRules: [
      "This endpoint is a read-only archive remediation review no-go reconciliation remediation plan, not a remediation acceptance system.",
      "It may map source reconciliation no-go items to external owner actions, safe evidence requirements, verification steps, acceptance criteria, residual risks, redaction rules, forbidden actions, exit criteria, and future remediation review gates.",
      "It must not accept reconciliation remediation, record remediation evidence, mark reconciliation blockers resolved, create tickets, accept reconciliation no-go items, accept reconciliation outcomes, accept review no-go items, accept archive remediation review outcomes, accept archive remediation, resolve archive blockers, accept archive no-go items, accept external archives, accept final decisions, deny authorization, grant authorization, store approvals, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
      "Remediation plan readiness does not mean any reconciliation blocker is resolved; a later read-only remediation review checklist is required.",
    ],
    archiveRemediationReviewNoGoReconciliationRemediationReviewRules: [
      "A later archive remediation review no-go reconciliation remediation review checklist must start from this plan and the source reconciliation no-go item ids.",
      "External archive evidence may be referenced only by safe item id, owner role, status, redaction state, tamper-evidence state, and review question.",
      "Reject raw prompts, private narratives, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, and full external document bodies.",
      "No implementation branch, patch, test, migration, service-role client, database write, deployment, feature flag, production writer, AI, Stripe, or report unlock may start from this plan.",
      "The next safe stage is a read-only archive remediation review no-go reconciliation remediation review checklist; it must still remain non-executable.",
    ],
    sourceArchiveRemediationReviewNoGoReconciliationNoGoRules:
      sourceNoGo.archiveRemediationReviewNoGoReconciliationNoGoRules,
    sourceArchiveRemediationReviewNoGoReconciliationNoGoItems:
      sourceNoGo.archiveRemediationReviewNoGoReconciliationNoGoItems,
    archiveRemediationReviewNoGoReconciliationRemediationItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation();
  const blockedSummary =
    "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation remediation probe blocked: no reconciliation remediation acceptance, remediation evidence record, blocker resolution, ticket creation, remediation state acceptance, remediation review promotion, reconciliation no-go acceptance, reconciliation no-go record, reconciliation acceptance, review no-go acceptance, review acceptance, archive remediation acceptance, archive blocker resolution, archive no-go acceptance, external archive acceptance, final decision acceptance, authorization denial, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      archiveRemediationReviewNoGoReconciliationRemediationItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationItems,
    };
  }

  const itemId =
    (requestBody as { itemId?: unknown; remediationItemId?: unknown }).itemId ??
    (requestBody as { remediationItemId?: unknown }).remediationItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      archiveRemediationReviewNoGoReconciliationRemediationItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationItems,
    };
  }

  const selectedItem =
    payload.archiveRemediationReviewNoGoReconciliationRemediationItems.find(
      (candidate) => candidate.id === itemId,
    );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      archiveRemediationReviewNoGoReconciliationRemediationItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation remediation probe blocked as designed: the selected remediation item was returned, but no reconciliation remediation acceptance, remediation evidence record, blocker resolution, ticket creation, remediation state acceptance, remediation review promotion, reconciliation no-go acceptance, reconciliation no-go record, reconciliation acceptance, review no-go acceptance, review acceptance, archive remediation acceptance, archive blocker resolution, archive no-go acceptance, external archive acceptance, final decision acceptance, authorization denial, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    archiveRemediationReviewNoGoReconciliationRemediationItems: [
      selectedItem,
    ],
  };
}
