import "server-only";

import { buildWriterPersistenceAdapterDesign } from "@/lib/server-writers/persistence-adapter-design";
import type {
  WriterPersistenceReviewItem,
  WriterPersistenceReviewPayload,
  WriterPersistenceReviewProbeResult,
} from "@/types/writer-persistence-review";

const blockedCodes = [
  "implementation_review_only",
  "schema_evidence_missing",
  "service_role_isolation_not_approved",
  "transaction_tests_missing",
  "idempotency_tests_missing",
  "audit_redaction_tests_missing",
  "rollout_approval_missing",
  "security_no_go_review_missing",
];

const runtimeBlockedFlags = {
  allRuntimeEffectsBlocked: true,
  wouldImportRealWriterImplementation: false,
  wouldCreateServiceRoleClient: false,
  wouldReadServiceRoleSecret: false,
  wouldPersistEvidence: false,
  wouldStoreRawPayload: false,
  wouldStoreSecrets: false,
  wouldWriteRows: false,
  wouldWriteAuditRows: false,
  wouldReserveIdempotencyKeys: false,
  wouldWriteIdempotencyRows: false,
  wouldWriteCompensationRows: false,
  wouldApplyMigration: false,
  wouldCreateTables: false,
  wouldEnableWriters: false,
  wouldCallAi: false,
  wouldCallStripe: false,
  wouldUnlockReports: false,
} as const;

function reviewItem(
  input: WriterPersistenceReviewItem,
): WriterPersistenceReviewItem {
  return input;
}

function buildReviewItems(input: {
  sourceAllRuntimeEffectsBlocked: boolean;
  sourceAdapterImplemented: boolean;
  sourceSchemaVerified: boolean;
}): WriterPersistenceReviewItem[] {
  return [
    reviewItem({
      id: "source_adapter_design_still_inert",
      category: "source_invariants",
      title: "Source adapter design remains inert",
      status:
        input.sourceAllRuntimeEffectsBlocked &&
        !input.sourceAdapterImplemented &&
        !input.sourceSchemaVerified
          ? "passed"
          : "blocked",
      blocking: true,
      owner: "qa",
      requiredEvidence:
        "The source persistence adapter design payload must keep adapterImplemented=false, schemaVerified=false, and allRuntimeEffectsBlocked=true.",
      detail:
        "This review consumes the design-only adapter output as a source invariant and does not loosen any runtime blocker.",
      sourceRefs: [
        "src/lib/server-writers/persistence-adapter-design.ts",
        "/api/system-writers/persistence-adapter",
      ],
      relatedMethods: [],
      relatedPhases: [],
      relatedFailureModes: [],
    }),
    reviewItem({
      id: "schema_manual_evidence_package_missing",
      category: "schema_evidence",
      title: "Manual schema evidence package is missing",
      status: "blocked",
      blocking: true,
      owner: "founder",
      requiredEvidence:
        "Screenshots or SQL output from Supabase proving writer_audit_events and writer_idempotency_keys exist, have expected columns, have RLS enabled, have no unsafe browser policies, and contain zero rows before launch.",
      detail:
        "The adapter cannot become executable until the manually applied audit/idempotency schema is independently verified.",
      sourceRefs: [
        "docs/writer-schema-verification-harness.md",
        "docs/writer-migration-application-runbook.md",
      ],
      relatedMethods: [
        "reserve_idempotency_key",
        "append_audit_attempt",
        "finalize_idempotency_result",
      ],
      relatedPhases: [
        "preflight",
        "idempotency_reservation",
        "audit_attempt",
        "idempotency_finalize",
      ],
      relatedFailureModes: ["schema_not_verified"],
    }),
    reviewItem({
      id: "service_role_isolation_approval_missing",
      category: "service_role_isolation",
      title: "Service-role isolation approval is missing",
      status: "manual_required",
      blocking: true,
      owner: "security",
      requiredEvidence:
        "A reviewed server-only credential plan proving the service-role key is never serialized, never bundled, never logged, and only used inside approved writer modules.",
      detail:
        "The current app intentionally has no privileged client factory. Before implementation, the exact module boundary and secret handling rules must be approved.",
      sourceRefs: [
        "src/lib/server-writers/service-role-isolation.ts",
        "/api/system-writers/service-role-isolation",
      ],
      relatedMethods: [
        "start_persistence_attempt",
        "reserve_idempotency_key",
        "append_audit_attempt",
        "commit_future_writer_result",
        "finalize_idempotency_result",
        "record_compensation_required",
      ],
      relatedPhases: ["preflight"],
      relatedFailureModes: ["rollout_not_approved"],
    }),
    reviewItem({
      id: "transaction_order_tests_missing",
      category: "transaction_tests",
      title: "Transaction order tests are missing",
      status: "blocked",
      blocking: true,
      owner: "backend",
      requiredEvidence:
        "Automated tests proving preflight, idempotency reservation, audit attempt, writer body, audit result, idempotency finalize, and compensation handoff run in the approved order.",
      detail:
        "The design defines order, but executable adapter code would need tests for success, partial failure, retry, and conflict paths before any write is allowed.",
      sourceRefs: [
        "src/lib/server-writers/persistence-adapter-design.ts",
        "docs/writer-persistence-adapter-design.md",
      ],
      relatedMethods: [
        "start_persistence_attempt",
        "reserve_idempotency_key",
        "append_audit_attempt",
        "commit_future_writer_result",
        "finalize_idempotency_result",
        "record_compensation_required",
      ],
      relatedPhases: [
        "preflight",
        "idempotency_reservation",
        "audit_attempt",
        "future_writer_body",
        "audit_result",
        "idempotency_finalize",
        "compensation_handoff",
      ],
      relatedFailureModes: [
        "idempotency_reservation_failed",
        "audit_append_failed",
        "future_writer_failed",
        "compensation_required",
      ],
    }),
    reviewItem({
      id: "idempotency_replay_conflict_tests_missing",
      category: "idempotency_tests",
      title: "Idempotency replay and conflict tests are missing",
      status: "blocked",
      blocking: true,
      owner: "backend",
      requiredEvidence:
        "Tests proving same key plus same requestHash replays safely, same key plus different requestHash is rejected, expired keys do not duplicate target writes, and failed attempts are finalized consistently.",
      detail:
        "Idempotency is the main protection against duplicate paid/generated artifacts; it cannot rely on manual judgment at runtime.",
      sourceRefs: [
        "src/lib/server-writers/idempotency.ts",
        "src/lib/server-writers/persistence-adapter-design.ts",
      ],
      relatedMethods: [
        "reserve_idempotency_key",
        "finalize_idempotency_result",
      ],
      relatedPhases: [
        "idempotency_reservation",
        "idempotency_finalize",
      ],
      relatedFailureModes: [
        "duplicate_request",
        "conflicting_request",
        "idempotency_reservation_failed",
      ],
    }),
    reviewItem({
      id: "audit_redaction_tests_missing",
      category: "audit_redaction_tests",
      title: "Audit redaction tests are missing",
      status: "blocked",
      blocking: true,
      owner: "security",
      requiredEvidence:
        "Tests proving audit events store hashes and references only, never raw prompts, model responses, access tokens, API keys, service-role values, Stripe payloads, or user secrets.",
      detail:
        "The adapter will become a high-value evidence path. Redaction must be proven before audit rows can be written.",
      sourceRefs: [
        "src/lib/server-writers/request-redaction.ts",
        "src/lib/server-writers/evidence-handoff.ts",
      ],
      relatedMethods: [
        "append_audit_attempt",
        "finalize_idempotency_result",
        "record_compensation_required",
      ],
      relatedPhases: ["audit_attempt", "audit_result", "compensation_handoff"],
      relatedFailureModes: ["audit_append_failed", "compensation_required"],
    }),
    reviewItem({
      id: "rollback_compensation_review_missing",
      category: "rollback_compensation_tests",
      title: "Rollback and compensation review is missing",
      status: "manual_required",
      blocking: true,
      owner: "operator",
      requiredEvidence:
        "A reviewed compensation matrix for generated artifacts, payments, consent records, report unlocks, audit history, and idempotency history, including manual operator handoff steps.",
      detail:
        "After production writes exist, destructive rollback is forbidden. Compensation must preserve history and append corrective events.",
      sourceRefs: [
        "src/lib/server-writers/rollback.ts",
        "/api/system-writers/rollback",
      ],
      relatedMethods: ["record_compensation_required"],
      relatedPhases: ["compensation_handoff"],
      relatedFailureModes: [
        "future_writer_failed",
        "compensation_required",
      ],
    }),
    reviewItem({
      id: "rollout_operator_approval_missing",
      category: "rollout_approval",
      title: "Operator rollout approval is missing",
      status: "blocked",
      blocking: true,
      owner: "operator",
      requiredEvidence:
        "Explicit approval for exact writer contracts, environment, feature flags, canary audience, abort conditions, rollback plan, and post-launch monitoring.",
      detail:
        "No executable adapter path can exist until rollout approval names the exact scope that may write rows.",
      sourceRefs: [
        "src/lib/server-writers/rollout.ts",
        "/api/system-writers/rollout",
      ],
      relatedMethods: [
        "start_persistence_attempt",
        "commit_future_writer_result",
      ],
      relatedPhases: ["preflight", "future_writer_body"],
      relatedFailureModes: ["rollout_not_approved"],
    }),
    reviewItem({
      id: "observability_support_plan_missing",
      category: "observability_support",
      title: "Observability and support plan is missing",
      status: "manual_required",
      blocking: true,
      owner: "operator",
      requiredEvidence:
        "A support-facing plan for blocked codes, correlation ids, audit refs, idempotency refs, customer-safe error copy, and escalation steps.",
      detail:
        "Founders need a non-technical way to diagnose failed writer attempts without exposing secrets or raw payloads.",
      sourceRefs: [
        "docs/controlled-backend-writers.md",
        "docs/mvp-qa-environment.md",
      ],
      relatedMethods: [
        "append_audit_attempt",
        "finalize_idempotency_result",
        "record_compensation_required",
      ],
      relatedPhases: ["audit_result", "compensation_handoff"],
      relatedFailureModes: [
        "audit_append_failed",
        "future_writer_failed",
        "compensation_required",
      ],
    }),
    reviewItem({
      id: "security_no_go_review_missing",
      category: "no_go_security",
      title: "Security no-go review is missing",
      status: "blocked",
      blocking: true,
      owner: "security",
      requiredEvidence:
        "A final no-go checklist proving no raw payload storage, no secret persistence, no browser service-role exposure, no unapproved table creation, no AI/Stripe calls, and no report unlock side effects.",
      detail:
        "This is the final release blocker before any implementation can be merged or toggled on.",
      sourceRefs: [
        "docs/writer-persistence-adapter-review-checklist.md",
        "docs/codex-next-task.md",
      ],
      relatedMethods: [
        "start_persistence_attempt",
        "reserve_idempotency_key",
        "append_audit_attempt",
        "commit_future_writer_result",
        "finalize_idempotency_result",
        "record_compensation_required",
      ],
      relatedPhases: [
        "preflight",
        "idempotency_reservation",
        "audit_attempt",
        "future_writer_body",
        "audit_result",
        "idempotency_finalize",
        "compensation_handoff",
      ],
      relatedFailureModes: [
        "schema_not_verified",
        "rollout_not_approved",
        "audit_append_failed",
        "future_writer_failed",
        "compensation_required",
      ],
    }),
    reviewItem({
      id: "dangerous_runtime_flags_remain_false",
      category: "source_invariants",
      title: "Dangerous runtime flags remain false",
      status: "passed",
      blocking: true,
      owner: "qa",
      requiredEvidence:
        "The review payload must return false for service-role client creation, secret reads, row writes, migrations, AI calls, Stripe calls, and report unlocks.",
      detail:
        "The review checklist itself is a blocking artifact, not an approval record and not a writer implementation.",
      sourceRefs: [
        "src/lib/server-writers/persistence-review.ts",
        "/api/system-writers/persistence-review",
      ],
      relatedMethods: [],
      relatedPhases: [],
      relatedFailureModes: [],
    }),
  ];
}

function countByStatus(
  items: WriterPersistenceReviewItem[],
  status: WriterPersistenceReviewItem["status"],
) {
  return items.filter((item) => item.status === status).length;
}

export async function buildWriterPersistenceReview(): Promise<WriterPersistenceReviewPayload> {
  const sourceDesign = await buildWriterPersistenceAdapterDesign();
  const items = buildReviewItems({
    sourceAllRuntimeEffectsBlocked: sourceDesign.allRuntimeEffectsBlocked,
    sourceAdapterImplemented: sourceDesign.adapterImplemented,
    sourceSchemaVerified: sourceDesign.schemaVerified,
  });

  return {
    safeMode: true,
    readOnly: true,
    reviewMode: "persistence_adapter_implementation_review_only",
    sourceDesignMode: sourceDesign.designMode,
    checkedAt: new Date().toISOString(),
    itemCount: items.length,
    blockingItemCount: items.filter((item) => item.blocking).length,
    manualRequiredCount: countByStatus(items, "manual_required"),
    passedItemCount: countByStatus(items, "passed"),
    sourceMethodCount: sourceDesign.methodCount,
    sourcePhaseCount: sourceDesign.phaseCount,
    sourceFailureModeCount: sourceDesign.failureModeCount,
    schemaVerified: false,
    adapterImplemented: false,
    adapterImplementationApproved: false,
    adapterImplementationAllowed: false,
    implementationReviewComplete: false,
    allBlockingEvidenceReady: false,
    ...runtimeBlockedFlags,
    blockedCodes,
    reviewRules: [
      "This review is not an approval record and cannot enable any persistence adapter code.",
      "Every blocking item must have named evidence before an executable adapter can be proposed.",
      "The adapter implementation must remain server-only, use reviewed credentials, and never expose service-role secrets to the browser.",
      "Audit and idempotency writes require schema evidence, transaction tests, replay/conflict tests, and redaction tests first.",
      "No migration, table creation, service-role client, row write, AI call, Stripe call, entitlement grant, or report unlock is allowed by this review.",
    ],
    items,
  };
}

export async function probeWriterPersistenceReview(
  requestBody: unknown,
): Promise<WriterPersistenceReviewProbeResult> {
  const payload = await buildWriterPersistenceReview();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      reviewMode: payload.reviewMode,
      summary:
        "Persistence implementation review probe blocked: request body must be a JSON object and no approval or writer implementation was created.",
      schemaVerified: false,
      adapterImplemented: false,
      adapterImplementationApproved: false,
      adapterImplementationAllowed: false,
      implementationReviewComplete: false,
      allBlockingEvidenceReady: false,
      ...runtimeBlockedFlags,
      blockedCodes: payload.blockedCodes,
      items: payload.items,
    };
  }

  const itemId = (requestBody as { itemId?: unknown }).itemId;

  if (typeof itemId !== "string") {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      reviewMode: payload.reviewMode,
      summary:
        "Persistence implementation review probe blocked: itemId must be a string and no approval or writer implementation was created.",
      schemaVerified: false,
      adapterImplemented: false,
      adapterImplementationApproved: false,
      adapterImplementationAllowed: false,
      implementationReviewComplete: false,
      allBlockingEvidenceReady: false,
      ...runtimeBlockedFlags,
      blockedCodes: payload.blockedCodes,
      items: payload.items,
    };
  }

  const selectedItem = payload.items.find((item) => item.id === itemId);

  if (!selectedItem) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      reviewMode: payload.reviewMode,
      summary:
        "Persistence implementation review probe blocked: unknown review item and no approval or writer implementation was created.",
      schemaVerified: false,
      adapterImplemented: false,
      adapterImplementationApproved: false,
      adapterImplementationAllowed: false,
      implementationReviewComplete: false,
      allBlockingEvidenceReady: false,
      ...runtimeBlockedFlags,
      blockedCodes: payload.blockedCodes,
      items: payload.items,
    };
  }

  return {
    safeMode: true,
    readOnly: true,
    blocked: true,
    reviewMode: payload.reviewMode,
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence implementation review probe blocked as designed: the selected checklist item was returned as evidence guidance, but no approval record, service-role client, transaction, audit row, idempotency key, compensation row, migration, AI call, Stripe call, or report unlock was created.",
    schemaVerified: false,
    adapterImplemented: false,
    adapterImplementationApproved: false,
    adapterImplementationAllowed: false,
    implementationReviewComplete: false,
    allBlockingEvidenceReady: false,
    ...runtimeBlockedFlags,
    blockedCodes: payload.blockedCodes,
    items: [selectedItem],
  };
}
