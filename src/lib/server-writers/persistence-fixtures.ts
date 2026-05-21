import "server-only";

import { buildWriterPersistenceReview } from "@/lib/server-writers/persistence-review";
import type {
  WriterPersistenceFixtureAssertion,
  WriterPersistenceFixtureCase,
  WriterPersistenceFixtureHarnessPayload,
  WriterPersistenceFixtureHarnessProbeResult,
} from "@/types/writer-persistence-fixture-harness";

const blockedCodes = [
  "fixture_harness_only",
  "implementation_review_still_blocking",
  "schema_evidence_missing",
  "service_role_isolation_not_approved",
  "transaction_tests_not_executable",
  "idempotency_tests_not_executable",
  "audit_redaction_tests_not_executable",
  "rollout_approval_missing",
];

const runtimeBlockedFlags = {
  allRuntimeEffectsBlocked: true,
  wouldRunTransaction: false,
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

function assertion(
  input: WriterPersistenceFixtureAssertion,
): WriterPersistenceFixtureAssertion {
  return input;
}

function fixture(
  input: Omit<
    WriterPersistenceFixtureCase,
    | "wouldRunTransaction"
    | "wouldCreateServiceRoleClient"
    | "wouldReadServiceRoleSecret"
    | "wouldPersistEvidence"
    | "wouldStoreRawPayload"
    | "wouldStoreSecrets"
    | "wouldWriteRows"
    | "wouldWriteAuditRows"
    | "wouldReserveIdempotencyKeys"
    | "wouldWriteIdempotencyRows"
    | "wouldWriteCompensationRows"
    | "wouldApplyMigration"
    | "wouldCreateTables"
    | "wouldEnableWriters"
    | "wouldCallAi"
    | "wouldCallStripe"
    | "wouldUnlockReports"
  >,
): WriterPersistenceFixtureCase {
  return {
    ...input,
    wouldRunTransaction: false,
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
  };
}

function reviewItemExists(input: {
  reviewItemIds: Set<string>;
  itemId: string;
}) {
  return input.reviewItemIds.has(input.itemId);
}

function baseAssertions(input: {
  reviewItemIds: Set<string>;
  sourceReviewItemIds: string[];
  expectedRuntimeRule: string;
}) {
  return [
    assertion({
      id: "source_review_items_present",
      title: "Source review items are present",
      passed: input.sourceReviewItemIds.every((itemId) =>
        reviewItemExists({ reviewItemIds: input.reviewItemIds, itemId }),
      ),
      blocking: true,
      detail:
        "The fixture is tied to explicit implementation-review blockers instead of inventing a new approval path.",
      expectedEvidence:
        "Every fixture reviewItemId must exist in the implementation review checklist.",
      sourceReviewItemIds: input.sourceReviewItemIds,
    }),
    assertion({
      id: "runtime_effects_forbidden",
      title: "Runtime effects are forbidden",
      passed: true,
      blocking: true,
      detail: input.expectedRuntimeRule,
      expectedEvidence:
        "The fixture response must keep transaction, service-role, write, migration, AI, Stripe, and report unlock flags false.",
      sourceReviewItemIds: input.sourceReviewItemIds,
    }),
    assertion({
      id: "fixture_is_not_approval",
      title: "Fixture is not approval",
      passed: true,
      blocking: true,
      detail:
        "Passing fixture assertions only proves that the evidence path is described; it does not approve implementation.",
      expectedEvidence:
        "The payload must keep adapterImplementationApproved=false and adapterImplementationAllowed=false.",
      sourceReviewItemIds: input.sourceReviewItemIds,
    }),
  ];
}

function buildFixtures(reviewItemIds: Set<string>): WriterPersistenceFixtureCase[] {
  return [
    fixture({
      id: "transaction_order_success_path_fixture",
      category: "transaction_order",
      title: "Transaction order success-path fixture",
      status: "fixture_ready",
      blocking: true,
      detail:
        "Defines the expected phase order for a future successful adapter attempt without running a transaction.",
      reviewItemIds: ["transaction_order_tests_missing"],
      relatedMethods: [
        "start_persistence_attempt",
        "reserve_idempotency_key",
        "append_audit_attempt",
        "commit_future_writer_result",
        "finalize_idempotency_result",
      ],
      relatedPhases: [
        "preflight",
        "idempotency_reservation",
        "audit_attempt",
        "future_writer_body",
        "audit_result",
        "idempotency_finalize",
      ],
      relatedFailureModes: [
        "idempotency_reservation_failed",
        "audit_append_failed",
        "future_writer_failed",
      ],
      fixtureInputRefs: [
        "trustedActorContextRef",
        "contractId",
        "requestHash",
        "idempotencyKeyTemplate",
        "redactedEvidenceRef",
      ],
      expectedOutcomeRefs: [
        "preflight_passed",
        "idempotency_reserved",
        "attempt_audit_appended",
        "writer_result_committed",
        "result_audit_appended",
        "idempotency_completed",
      ],
      forbiddenRuntimeEffects: [
        "transaction",
        "row_insert",
        "audit_insert",
        "idempotency_reservation",
        "writer_execution",
      ],
      assertions: [
        ...baseAssertions({
          reviewItemIds,
          sourceReviewItemIds: ["transaction_order_tests_missing"],
          expectedRuntimeRule:
            "The fixture lists phase order only; it never opens a database transaction or calls adapter code.",
        }),
        assertion({
          id: "phase_order_matches_design",
          title: "Phase order matches adapter design",
          passed: true,
          blocking: true,
          detail:
            "The success path preserves preflight before idempotency, audit before writer body, and finalization after result evidence.",
          expectedEvidence:
            "Future tests must assert the exact ordered phase refs shown by this fixture.",
          sourceReviewItemIds: ["transaction_order_tests_missing"],
        }),
      ],
    }),
    fixture({
      id: "idempotency_replay_fixture",
      category: "idempotency_replay",
      title: "Idempotency replay fixture",
      status: "fixture_ready",
      blocking: true,
      detail:
        "Defines expected replay behavior for the same logical operation key and same request hash.",
      reviewItemIds: ["idempotency_replay_conflict_tests_missing"],
      relatedMethods: [
        "reserve_idempotency_key",
        "finalize_idempotency_result",
      ],
      relatedPhases: ["idempotency_reservation", "idempotency_finalize"],
      relatedFailureModes: ["duplicate_request"],
      fixtureInputRefs: [
        "contractId",
        "idempotencyKeyTemplate",
        "sameRequestHash",
        "completedResultRef",
      ],
      expectedOutcomeRefs: [
        "existing_result_returned",
        "target_writer_not_reexecuted",
        "replay_audit_required_later",
      ],
      forbiddenRuntimeEffects: [
        "duplicate_target_row",
        "second_writer_execution",
        "new_idempotency_row",
      ],
      assertions: [
        ...baseAssertions({
          reviewItemIds,
          sourceReviewItemIds: ["idempotency_replay_conflict_tests_missing"],
          expectedRuntimeRule:
            "The fixture describes replay behavior only; it does not reserve or finalize any key.",
        }),
        assertion({
          id: "same_hash_replays_existing_result",
          title: "Same hash replays existing result",
          passed: true,
          blocking: true,
          detail:
            "A future adapter must return the existing result for the same key and same request hash instead of writing twice.",
          expectedEvidence:
            "Automated tests must prove duplicate calls do not create duplicate target rows.",
          sourceReviewItemIds: ["idempotency_replay_conflict_tests_missing"],
        }),
      ],
    }),
    fixture({
      id: "idempotency_conflict_fixture",
      category: "idempotency_conflict",
      title: "Idempotency conflict fixture",
      status: "fixture_ready",
      blocking: true,
      detail:
        "Defines expected conflict behavior for the same logical operation key and a different request hash.",
      reviewItemIds: ["idempotency_replay_conflict_tests_missing"],
      relatedMethods: ["reserve_idempotency_key"],
      relatedPhases: ["idempotency_reservation"],
      relatedFailureModes: ["conflicting_request"],
      fixtureInputRefs: [
        "contractId",
        "idempotencyKeyTemplate",
        "originalRequestHash",
        "differentRequestHash",
      ],
      expectedOutcomeRefs: [
        "conflict_detected",
        "target_writer_blocked",
        "conflict_evidence_required_later",
      ],
      forbiddenRuntimeEffects: [
        "target_writer_execution",
        "original_key_overwrite",
        "raw_request_storage",
      ],
      assertions: [
        ...baseAssertions({
          reviewItemIds,
          sourceReviewItemIds: ["idempotency_replay_conflict_tests_missing"],
          expectedRuntimeRule:
            "The fixture describes conflict behavior only; it does not compare rows or write conflict state.",
        }),
        assertion({
          id: "different_hash_blocks_target_write",
          title: "Different hash blocks target write",
          passed: true,
          blocking: true,
          detail:
            "A future adapter must reject same key plus different hash before target writer execution.",
          expectedEvidence:
            "Automated tests must prove conflict paths cannot create generated, payment, consent, or report rows.",
          sourceReviewItemIds: ["idempotency_replay_conflict_tests_missing"],
        }),
      ],
    }),
    fixture({
      id: "audit_redaction_fixture",
      category: "audit_redaction",
      title: "Audit redaction fixture",
      status: "fixture_ready",
      blocking: true,
      detail:
        "Defines the audit-safe evidence shape for future attempt/result rows using hashes and references only.",
      reviewItemIds: ["audit_redaction_tests_missing"],
      relatedMethods: [
        "append_audit_attempt",
        "finalize_idempotency_result",
        "record_compensation_required",
      ],
      relatedPhases: ["audit_attempt", "audit_result", "compensation_handoff"],
      relatedFailureModes: ["audit_append_failed", "compensation_required"],
      fixtureInputRefs: [
        "requestHash",
        "redactedEvidenceRef",
        "blockedCodes",
        "targetTableRefs",
      ],
      expectedOutcomeRefs: [
        "hash_only_audit_fields",
        "reference_only_provider_fields",
        "raw_payload_forbidden",
      ],
      forbiddenRuntimeEffects: [
        "raw_payload_storage",
        "secret_storage",
        "audit_row_insert",
        "provider_response_storage",
      ],
      assertions: [
        ...baseAssertions({
          reviewItemIds,
          sourceReviewItemIds: ["audit_redaction_tests_missing"],
          expectedRuntimeRule:
            "The fixture describes redaction expectations only; it does not append audit rows or store payloads.",
        }),
        assertion({
          id: "audit_fields_are_hashes_and_refs",
          title: "Audit fields are hashes and refs",
          passed: true,
          blocking: true,
          detail:
            "The fixture requires future audit rows to use request hashes, evidence refs, lifecycle names, and blocked codes only.",
          expectedEvidence:
            "Future tests must prove raw prompt-like text, provider payloads, user private narrative, and secret-like values are absent.",
          sourceReviewItemIds: ["audit_redaction_tests_missing"],
        }),
      ],
    }),
    fixture({
      id: "rollback_compensation_fixture",
      category: "rollback_compensation",
      title: "Rollback compensation fixture",
      status: "manual_required",
      blocking: true,
      detail:
        "Defines how a future failed writer result must route into data-preserving compensation review.",
      reviewItemIds: ["rollback_compensation_review_missing"],
      relatedMethods: ["record_compensation_required"],
      relatedPhases: ["compensation_handoff"],
      relatedFailureModes: ["future_writer_failed", "compensation_required"],
      fixtureInputRefs: [
        "originalResultRef",
        "failureTrigger",
        "operatorReviewRef",
        "compensationReason",
      ],
      expectedOutcomeRefs: [
        "original_history_preserved",
        "compensation_review_required",
        "destructive_delete_forbidden",
      ],
      forbiddenRuntimeEffects: [
        "history_delete",
        "payment_delete",
        "consent_delete",
        "compensation_row_insert",
      ],
      assertions: [
        ...baseAssertions({
          reviewItemIds,
          sourceReviewItemIds: ["rollback_compensation_review_missing"],
          expectedRuntimeRule:
            "The fixture describes compensation behavior only; it does not write compensation records.",
        }),
        assertion({
          id: "compensation_preserves_history",
          title: "Compensation preserves history",
          passed: true,
          blocking: true,
          detail:
            "Future rollback must append corrective history rather than delete generated, payment, consent, audit, or idempotency history.",
          expectedEvidence:
            "Operator review must approve each compensation strategy before any production writer can run.",
          sourceReviewItemIds: ["rollback_compensation_review_missing"],
        }),
      ],
    }),
    fixture({
      id: "rollout_gate_fixture",
      category: "rollout_gate",
      title: "Rollout gate fixture",
      status: "blocked_by_review",
      blocking: true,
      detail:
        "Defines the release-gate assertions that must remain false until an operator approves exact writer scope.",
      reviewItemIds: ["rollout_operator_approval_missing"],
      relatedMethods: [
        "start_persistence_attempt",
        "commit_future_writer_result",
      ],
      relatedPhases: ["preflight", "future_writer_body"],
      relatedFailureModes: ["rollout_not_approved"],
      fixtureInputRefs: [
        "environmentName",
        "contractAllowlist",
        "canaryAudience",
        "abortConditions",
      ],
      expectedOutcomeRefs: [
        "writer_execution_blocked",
        "feature_flags_remain_disabled",
        "operator_approval_required",
      ],
      forbiddenRuntimeEffects: [
        "writer_enablement",
        "entitlement_grant",
        "report_unlock",
      ],
      assertions: [
        ...baseAssertions({
          reviewItemIds,
          sourceReviewItemIds: ["rollout_operator_approval_missing"],
          expectedRuntimeRule:
            "The fixture describes rollout gates only; it cannot enable feature flags or writers.",
        }),
        assertion({
          id: "operator_scope_required",
          title: "Operator scope required",
          passed: true,
          blocking: true,
          detail:
            "A future release must name exact contracts, environment, canary audience, abort conditions, and rollback owner.",
          expectedEvidence:
            "Release evidence must be recorded outside this fixture before executable code can be proposed.",
          sourceReviewItemIds: ["rollout_operator_approval_missing"],
        }),
      ],
    }),
    fixture({
      id: "service_role_isolation_fixture",
      category: "service_role_isolation",
      title: "Service-role isolation fixture",
      status: "manual_required",
      blocking: true,
      detail:
        "Defines the credential isolation checks required before a future privileged client factory can even be proposed.",
      reviewItemIds: ["service_role_isolation_approval_missing"],
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
      fixtureInputRefs: [
        "serverOnlyModuleRef",
        "credentialAccessPolicyRef",
        "browserBundleExclusionProof",
      ],
      expectedOutcomeRefs: [
        "credential_not_serialized",
        "client_factory_absent_now",
        "browser_bundle_excludes_privileged_modules",
      ],
      forbiddenRuntimeEffects: [
        "privileged_client_creation",
        "secret_read",
        "secret_serialization",
      ],
      assertions: [
        ...baseAssertions({
          reviewItemIds,
          sourceReviewItemIds: ["service_role_isolation_approval_missing"],
          expectedRuntimeRule:
            "The fixture describes credential isolation only; it does not read privileged config or create a client.",
        }),
        assertion({
          id: "server_only_boundary_required",
          title: "Server-only boundary required",
          passed: true,
          blocking: true,
          detail:
            "Future implementation must prove privileged modules cannot be imported from browser components.",
          expectedEvidence:
            "Isolation tests must prove server-only import boundaries before any adapter implementation exists.",
          sourceReviewItemIds: ["service_role_isolation_approval_missing"],
        }),
      ],
    }),
    fixture({
      id: "observability_support_fixture",
      category: "observability_support",
      title: "Observability support fixture",
      status: "manual_required",
      blocking: true,
      detail:
        "Defines customer-safe diagnostics for blocked codes, correlation refs, audit refs, idempotency refs, and support escalation.",
      reviewItemIds: ["observability_support_plan_missing"],
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
      fixtureInputRefs: [
        "blockedCodes",
        "correlationRef",
        "customerSafeMessageRef",
        "operatorEscalationRef",
      ],
      expectedOutcomeRefs: [
        "support_can_identify_blocker",
        "customer_copy_has_no_secret",
        "operator_escalation_available",
      ],
      forbiddenRuntimeEffects: [
        "support_ticket_write",
        "raw_error_payload_storage",
        "secret_logging",
      ],
      assertions: [
        ...baseAssertions({
          reviewItemIds,
          sourceReviewItemIds: ["observability_support_plan_missing"],
          expectedRuntimeRule:
            "The fixture describes support diagnostics only; it does not log or persist runtime evidence.",
        }),
        assertion({
          id: "diagnostics_are_customer_safe",
          title: "Diagnostics are customer-safe",
          passed: true,
          blocking: true,
          detail:
            "Future support views must explain blocked writer attempts without exposing raw payloads, privileged config, or provider responses.",
          expectedEvidence:
            "Support copy and operator escalation examples must be reviewed before production writers run.",
          sourceReviewItemIds: ["observability_support_plan_missing"],
        }),
      ],
    }),
    fixture({
      id: "security_no_go_fixture",
      category: "security_no_go",
      title: "Security no-go fixture",
      status: "blocked_by_review",
      blocking: true,
      detail:
        "Defines the final no-go assertions that must stay blocking until all prior evidence is approved.",
      reviewItemIds: ["security_no_go_review_missing"],
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
      fixtureInputRefs: [
        "schemaEvidenceRef",
        "isolationEvidenceRef",
        "testEvidenceRefs",
        "rolloutApprovalRef",
      ],
      expectedOutcomeRefs: [
        "implementation_still_blocked",
        "all_dangerous_flags_false",
        "manual_no_go_review_required",
      ],
      forbiddenRuntimeEffects: [
        "implementation_approval",
        "writer_enablement",
        "table_creation",
        "row_write",
        "ai_or_payment_side_effect",
      ],
      assertions: [
        ...baseAssertions({
          reviewItemIds,
          sourceReviewItemIds: ["security_no_go_review_missing"],
          expectedRuntimeRule:
            "The fixture describes no-go checks only; it cannot approve, merge, or toggle on implementation.",
        }),
        assertion({
          id: "no_go_keeps_implementation_blocked",
          title: "No-go keeps implementation blocked",
          passed: true,
          blocking: true,
          detail:
            "The final security fixture requires every evidence ref before implementation can be proposed.",
          expectedEvidence:
            "Manual no-go review must approve schema, isolation, test, rollout, observability, and compensation evidence together.",
          sourceReviewItemIds: ["security_no_go_review_missing"],
        }),
      ],
    }),
  ];
}

function countAssertions(fixtures: WriterPersistenceFixtureCase[]) {
  return fixtures.reduce(
    (total, currentFixture) => total + currentFixture.assertions.length,
    0,
  );
}

function countPassedAssertions(fixtures: WriterPersistenceFixtureCase[]) {
  return fixtures.reduce(
    (total, currentFixture) =>
      total +
      currentFixture.assertions.filter((fixtureAssertion) => fixtureAssertion.passed)
        .length,
    0,
  );
}

export async function buildWriterPersistenceFixtureHarness(): Promise<WriterPersistenceFixtureHarnessPayload> {
  const sourceReview = await buildWriterPersistenceReview();
  const reviewItemIds = new Set(sourceReview.items.map((item) => item.id));
  const fixtures = buildFixtures(reviewItemIds);

  return {
    safeMode: true,
    readOnly: true,
    fixtureMode: "persistence_adapter_fixture_harness_only",
    sourceReviewMode: sourceReview.reviewMode,
    checkedAt: new Date().toISOString(),
    fixtureCount: fixtures.length,
    assertionCount: countAssertions(fixtures),
    passedAssertionCount: countPassedAssertions(fixtures),
    blockedFixtureCount: fixtures.filter(
      (currentFixture) => currentFixture.status === "blocked_by_review",
    ).length,
    manualRequiredFixtureCount: fixtures.filter(
      (currentFixture) => currentFixture.status === "manual_required",
    ).length,
    sourceReviewItemCount: sourceReview.itemCount,
    sourceReviewBlockingItemCount: sourceReview.blockingItemCount,
    sourceReviewManualRequiredCount: sourceReview.manualRequiredCount,
    fixtureHarnessReady: true,
    fixtureEvidenceOnly: true,
    schemaVerified: false,
    adapterImplemented: false,
    adapterImplementationApproved: false,
    adapterImplementationAllowed: false,
    implementationReviewComplete: false,
    allBlockingEvidenceReady: false,
    ...runtimeBlockedFlags,
    blockedCodes,
    fixtureRules: [
      "This fixture harness is evidence-only and cannot approve or implement the persistence adapter.",
      "Fixtures may describe transaction order, idempotency behavior, audit redaction, rollback, rollout, isolation, observability, and no-go checks.",
      "Fixtures must point back to implementation-review blockers so there is no separate approval path.",
      "A fixture assertion passing means the static fixture is coherent; it does not mean the future executable adapter is safe to run.",
      "No transaction, privileged client, secret read, database write, migration, AI call, Stripe call, entitlement grant, or report unlock is allowed in this stage.",
    ],
    fixtures,
  };
}

export async function probeWriterPersistenceFixtureHarness(
  requestBody: unknown,
): Promise<WriterPersistenceFixtureHarnessProbeResult> {
  const payload = await buildWriterPersistenceFixtureHarness();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      fixtureMode: payload.fixtureMode,
      summary:
        "Persistence fixture harness probe blocked: request body must be a JSON object and no fixture was executed as adapter code.",
      schemaVerified: false,
      adapterImplemented: false,
      adapterImplementationApproved: false,
      adapterImplementationAllowed: false,
      implementationReviewComplete: false,
      allBlockingEvidenceReady: false,
      ...runtimeBlockedFlags,
      blockedCodes: payload.blockedCodes,
      fixtures: payload.fixtures,
    };
  }

  const fixtureId = (requestBody as { fixtureId?: unknown }).fixtureId;

  if (typeof fixtureId !== "string") {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      fixtureMode: payload.fixtureMode,
      summary:
        "Persistence fixture harness probe blocked: fixtureId must be a string and no fixture was executed as adapter code.",
      schemaVerified: false,
      adapterImplemented: false,
      adapterImplementationApproved: false,
      adapterImplementationAllowed: false,
      implementationReviewComplete: false,
      allBlockingEvidenceReady: false,
      ...runtimeBlockedFlags,
      blockedCodes: payload.blockedCodes,
      fixtures: payload.fixtures,
    };
  }

  const selectedFixture = payload.fixtures.find(
    (candidate) => candidate.id === fixtureId,
  );

  if (!selectedFixture) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      fixtureMode: payload.fixtureMode,
      summary:
        "Persistence fixture harness probe blocked: unknown fixture id and no fixture was executed as adapter code.",
      schemaVerified: false,
      adapterImplemented: false,
      adapterImplementationApproved: false,
      adapterImplementationAllowed: false,
      implementationReviewComplete: false,
      allBlockingEvidenceReady: false,
      ...runtimeBlockedFlags,
      blockedCodes: payload.blockedCodes,
      fixtures: payload.fixtures,
    };
  }

  return {
    safeMode: true,
    readOnly: true,
    blocked: true,
    fixtureMode: payload.fixtureMode,
    fixtureId: selectedFixture.id,
    fixtureTitle: selectedFixture.title,
    fixtureStatus: selectedFixture.status,
    summary:
      "Persistence fixture harness probe blocked as designed: the selected fixture and assertions were returned, but no adapter implementation, transaction, service-role client, audit row, idempotency key, compensation row, migration, AI call, Stripe call, or report unlock was executed.",
    schemaVerified: false,
    adapterImplemented: false,
    adapterImplementationApproved: false,
    adapterImplementationAllowed: false,
    implementationReviewComplete: false,
    allBlockingEvidenceReady: false,
    ...runtimeBlockedFlags,
    blockedCodes: payload.blockedCodes,
    fixtures: [selectedFixture],
  };
}
