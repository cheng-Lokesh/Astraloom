import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGo } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-no-go";
import type { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoItem } from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-no-go";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation";

const archiveRemediationBlockedCodes = [
  "implementation_authorization_reconsideration_external_final_decision_archive_remediation_plan_only",
  "source_external_final_decision_archive_no_go_packet_still_blocks_authorization",
  "external_final_decision_archive_remediation_acceptance_forbidden",
  "external_final_decision_archive_remediation_evidence_record_forbidden",
  "external_final_decision_archive_blocker_resolution_forbidden",
  "external_final_decision_archive_remediation_ticket_creation_forbidden",
  "external_final_decision_archive_remediation_state_acceptance_forbidden",
  "external_final_decision_archive_remediation_review_promotion_forbidden",
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

const archiveRemediationRuntimeBlockedFlags = {
  wouldAcceptExternalFinalDecisionArchiveRemediation: false,
  wouldRecordExternalFinalDecisionArchiveRemediationEvidence: false,
  wouldMarkFinalDecisionArchiveBlockerResolved: false,
  wouldCreateFinalDecisionArchiveRemediationTicket: false,
  wouldAcceptExternalFinalDecisionArchiveRemediationState: false,
  wouldPromoteToFinalDecisionArchiveRemediationReview: false,
} as const satisfies Pick<
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationRuntimeFlags,
  | "wouldAcceptExternalFinalDecisionArchiveRemediation"
  | "wouldRecordExternalFinalDecisionArchiveRemediationEvidence"
  | "wouldMarkFinalDecisionArchiveBlockerResolved"
  | "wouldCreateFinalDecisionArchiveRemediationTicket"
  | "wouldAcceptExternalFinalDecisionArchiveRemediationState"
  | "wouldPromoteToFinalDecisionArchiveRemediationReview"
>;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function mapRemediationStatus(
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationStatus {
  return item.status === "archive_no_go_external_evidence_missing"
    ? "archive_external_remediation_required"
    : "archive_manual_review_required";
}

function buildArchiveRemediationItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationItem {
  const externalEvidenceMissing =
    sourceItem.status === "archive_no_go_external_evidence_missing";
  const title = sourceItem.title.endsWith(" no-go")
    ? sourceItem.title.replace(/ no-go$/, " remediation")
    : `${sourceItem.title} remediation`;

  return {
    id: `${sourceItem.id}_remediation`,
    category: sourceItem.category,
    title,
    status: mapRemediationStatus(sourceItem),
    owner: sourceItem.owner,
    sourceArchiveNoGoStatus: sourceItem.status,
    sourceArchiveNoGoItemIds: [sourceItem.id],
    sourceArchiveItemIds: sourceItem.sourceArchiveItemIds,
    sourceDecisionItemIds: sourceItem.sourceDecisionItemIds,
    sourceNoGoItemIds: sourceItem.sourceNoGoItemIds,
    sourceReviewItemIds: sourceItem.sourceReviewItemIds,
    sourceReconsiderationRemediationItemIds:
      sourceItem.sourceReconsiderationRemediationItemIds,
    sourcePreflightItemIds: sourceItem.sourcePreflightItemIds,
    sourceOriginalRemediationItemIds: sourceItem.sourceOriginalRemediationItemIds,
    sourceRefs: sourceItem.sourceRefs,
    blockerSummary: sourceItem.noGoConclusion,
    remediationObjective: externalEvidenceMissing
      ? "Define the external archive evidence state, redaction state, owner, completeness checks, retention proof, and tamper-evidence references needed before the archive can be reviewed again."
      : "Define the named manual archive reviewer lane, reviewer question set, redaction state, completeness checks, and tamper-evidence references needed before the archive can be reviewed again.",
    externalActions: unique([
      `Create an external archive remediation entry keyed by source archive no-go item id ${sourceItem.id}.`,
      externalEvidenceMissing
        ? "Collect safe external archive evidence status without uploading artifact bodies into the app."
        : "Assign a named external reviewer role and keep reviewer conclusions outside the app.",
      "Map every unresolved archive gap to an owner, evidence state, redaction state, tamper-evidence state, and future review question.",
      "Keep archive no-go acceptance, external archive acceptance, final decision acceptance, final go/no-go recording, authorization grants, branches, files, tests, migrations, deployments, and writes disabled.",
    ]),
    safeEvidenceRequirements: unique([
      "source archive no-go item id",
      "source archive checklist item id",
      "source final decision item id",
      "owner role",
      "external archive state: missing, present, stale, rejected, or reviewer_required",
      "redaction state",
      "tamper-evidence state",
      "future archive review question id",
      ...sourceItem.safeArchiveRefs,
    ]),
    verificationSteps: unique([
      "Confirm externalFinalDecisionArchiveRemediationAccepted=false.",
      "Confirm externalFinalDecisionArchiveRemediationRecorded=false.",
      "Confirm finalDecisionArchiveNoGoAccepted=false.",
      "Confirm externalFinalDecisionArchiveAccepted=false.",
      "Confirm finalDecisionArchiveCompletenessAccepted=false.",
      "Confirm authorizationReconsiderationFinalDecisionAccepted=false.",
      "Confirm implementationAuthorizationGranted=false.",
      "Confirm readyForAdapterImplementation=false.",
      "Confirm wouldWriteRows=false and wouldCreateServiceRoleClient=false.",
    ]),
    acceptanceCriteria: unique([
      "Every source archive no-go item remains visible and mapped to this remediation plan.",
      "Every unresolved archive gap has a safe external owner or remains explicitly blocking.",
      "Every external archive artifact is referenced only by safe id, state, redaction status, and tamper-evidence status.",
      "No raw private narrative, prompt, provider payload, credential, webhook body, signature, token, secret, or artifact body is included.",
      "A later read-only archive remediation review checklist can inspect the evidence shape without accepting it.",
    ]),
    residualRisks: unique([
      "External archive evidence may still be incomplete, stale, tampered, rejected, or inaccessible.",
      "Manual reviewers may still reject the archive or require narrower implementation scope.",
      "This plan may still result in another no-go after archive remediation review.",
      "No implementation authorization can be inferred from remediation plan readiness.",
    ]),
    redactionRules: unique([
      ...sourceItem.redactionRules,
      "Reference only safe ids, owner roles, coverage states, redaction states, tamper-evidence states, and short reviewer questions.",
      "Do not include raw prompts, private narratives, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, or full external document bodies.",
    ]),
    forbiddenActions: unique([
      ...sourceItem.forbiddenShortcuts,
      "Do not accept this archive remediation plan in the app.",
      "Do not record archive remediation evidence or mark any archive blocker resolved.",
      "Do not create tickets, authorization records, approval records, branches, files, tests, service-role clients, transactions, migrations, deployments, feature flags, production writers, AI calls, Stripe calls, or report unlocks.",
    ]),
    nonExecutionClauses: unique([
      ...sourceItem.nonAcceptanceClauses,
      "This archive remediation item is a read-only map, not an accepted external archive state.",
      "This archive remediation item does not accept archive no-go, accept final decisions, deny authorization, grant authorization, or start implementation work.",
    ]),
    exitCriteria: unique([
      "The source archive no-go item has an external owner and safe evidence state.",
      "All unresolved archive gaps are mapped to future archive review questions.",
      "A later read-only archive remediation review checklist can decide whether the item remains blocked.",
      "All runtime side effects remain blocked.",
    ]),
    nextReviewGate:
      "external_final_decision_archive_remediation_review_checklist",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationItem[],
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationItem[],
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
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationPayload,
) {
  return {
    ...payload,
    blocked: true as const,
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

export async function buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediation(): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationPayload> {
  const sourceNoGo =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGo();
  const archiveRemediationItems = sourceNoGo.archiveNoGoItems.map(
    buildArchiveRemediationItem,
  );
  const blockedCodes = unique([
    ...sourceNoGo.blockedCodes,
    ...archiveRemediationBlockedCodes,
  ]);

  return {
    ...sourceNoGo,
    safeMode: true,
    readOnly: true,
    externalFinalDecisionArchiveRemediationMode:
      "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_plan_only",
    sourceExternalFinalDecisionArchiveNoGoMode:
      sourceNoGo.externalFinalDecisionArchiveNoGoMode,
    checkedAt: new Date().toISOString(),
    remediationItemCount: archiveRemediationItems.length,
    externalArchiveRemediationRequiredCount: countByStatus(
      archiveRemediationItems,
      "archive_external_remediation_required",
    ),
    manualArchiveReviewRequiredCount: countByStatus(
      archiveRemediationItems,
      "archive_manual_review_required",
    ),
    externalActionCount: uniqueCount(archiveRemediationItems, "externalActions"),
    safeEvidenceRequirementCount: uniqueCount(
      archiveRemediationItems,
      "safeEvidenceRequirements",
    ),
    verificationStepCount: uniqueCount(
      archiveRemediationItems,
      "verificationSteps",
    ),
    acceptanceCriteriaCount: uniqueCount(
      archiveRemediationItems,
      "acceptanceCriteria",
    ),
    residualRiskCount: uniqueCount(archiveRemediationItems, "residualRisks"),
    redactionRuleCount: uniqueCount(archiveRemediationItems, "redactionRules"),
    forbiddenActionCount: uniqueCount(
      archiveRemediationItems,
      "forbiddenActions",
    ),
    exitCriteriaCount: uniqueCount(archiveRemediationItems, "exitCriteria"),
    sourceArchiveNoGoItemCount: sourceNoGo.noGoItemCount,
    sourceArchiveNoGoCount: sourceNoGo.archiveNoGoCount,
    sourceExternalEvidenceArchiveNoGoCount:
      sourceNoGo.externalEvidenceArchiveNoGoCount,
    sourceManualReviewerArchiveNoGoCount:
      sourceNoGo.manualReviewerArchiveNoGoCount,
    sourceArchiveStillBlockedCount: sourceNoGo.archiveStillBlockedCount,
    externalFinalDecisionArchiveRemediationPlanReady: true,
    externalFinalDecisionArchiveRemediationPlanOnly: true,
    sourceExternalFinalDecisionArchiveNoGoPacketReady:
      sourceNoGo.externalFinalDecisionArchiveNoGoPacketReady,
    sourceExternalFinalDecisionArchiveNoGoPacketOnly:
      sourceNoGo.externalFinalDecisionArchiveNoGoPacketOnly,
    externalFinalDecisionArchiveRemediationAccepted: false,
    externalFinalDecisionArchiveRemediationRecorded: false,
    externalFinalDecisionArchiveRemediationStatesAccepted: false,
    finalDecisionArchiveRemediationReviewAccepted: false,
    finalDecisionArchiveRemediationReviewComplete: false,
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
    ...archiveRemediationRuntimeBlockedFlags,
    blockedCodes,
    archiveRemediationPlanRules: [
      "This endpoint is a read-only external final decision archive remediation plan, not a remediation acceptance system.",
      "It may map source archive no-go items to external owner actions, safe evidence requirements, verification steps, acceptance criteria, residual risks, redaction rules, forbidden actions, exit criteria, and future archive remediation review gates.",
      "It must not accept archive remediation, record remediation evidence, mark archive blockers resolved, create tickets, accept archive no-go items, accept external archives, mark archive completeness, accept final decisions, record final go/no-go, deny authorization, grant authorization, store approval artifacts, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
      "Remediation plan readiness does not mean any archive blocker is resolved; a later read-only archive remediation review checklist is required.",
    ],
    archiveRemediationReviewRules: [
      "A later external final decision archive remediation review checklist must start from this plan and the source archive no-go item ids.",
      "External archive evidence may be referenced only by safe item id, owner role, status, redaction state, tamper-evidence state, and review question.",
      "Reject raw prompts, private narratives, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, and full external document bodies.",
      "No implementation branch, patch, test, migration, service-role client, database write, deployment, feature flag, production writer, AI, Stripe, or report unlock may start from this plan.",
      "The next safe stage is a read-only external final decision archive remediation review no-go packet; it must still remain non-executable.",
    ],
    sourceArchiveNoGoRules: sourceNoGo.archiveNoGoRules,
    sourceArchiveNoGoItems: sourceNoGo.archiveNoGoItems,
    archiveRemediationItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediation(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediation();
  const blockedSummary =
    "Persistence authorization reconsideration final decision archive remediation probe blocked: no archive remediation acceptance, archive remediation evidence record, blocker resolution, ticket creation, archive no-go acceptance, archive no-go record, archive upload, archive read, archive hash, archive index write, archive completeness acceptance, external archive acceptance, final decision acceptance, final go/no-go record, authorization denial, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      archiveRemediationItems: payload.archiveRemediationItems,
    };
  }

  const itemId =
    (requestBody as { itemId?: unknown; remediationItemId?: unknown }).itemId ??
    (requestBody as { remediationItemId?: unknown }).remediationItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      archiveRemediationItems: payload.archiveRemediationItems,
    };
  }

  const selectedItem = payload.archiveRemediationItems.find(
    (candidate) => candidate.id === itemId,
  );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      archiveRemediationItems: payload.archiveRemediationItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration final decision archive remediation probe blocked as designed: the selected archive remediation item was returned, but no archive remediation acceptance, archive remediation evidence record, blocker resolution, ticket creation, archive no-go acceptance, archive no-go record, archive upload, archive read, archive hash, archive index write, archive completeness acceptance, external archive acceptance, final decision acceptance, final go/no-go record, authorization denial, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    archiveRemediationItems: [selectedItem],
  };
}
