import "server-only";

import { buildWriterPersistenceAdapterDesign } from "@/lib/server-writers/persistence-adapter-design";
import { buildWriterPersistenceDryRunGate } from "@/lib/server-writers/persistence-dry-run";
import { buildWriterPersistenceFixtureHarness } from "@/lib/server-writers/persistence-fixtures";
import { buildWriterPersistenceReview } from "@/lib/server-writers/persistence-review";
import type {
  WriterPersistenceNoGoItem,
  WriterPersistenceNoGoPayload,
  WriterPersistenceNoGoProbeResult,
  WriterPersistenceNoGoRouteInvariant,
} from "@/types/writer-persistence-no-go";

const blockedCodes = [
  "no_go_evidence_packet_only",
  "schema_evidence_missing",
  "implementation_review_still_blocking",
  "fixture_harness_still_blocking",
  "service_role_isolation_not_approved",
  "rollout_approval_missing",
  "security_no_go_review_missing",
  "implementation_proposal_forbidden",
];

const runtimeBlockedFlags = {
  allRuntimeEffectsBlocked: true,
  wouldCreateImplementationPlan: false,
  wouldCreateImplementationBranch: false,
  wouldImportRealWriterImplementation: false,
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
} as const;

function noGoItem(input: WriterPersistenceNoGoItem): WriterPersistenceNoGoItem {
  return input;
}

function invariant(
  input: WriterPersistenceNoGoRouteInvariant,
): WriterPersistenceNoGoRouteInvariant {
  return input;
}

function buildRouteInvariants(input: {
  dryRunAllBlocked: boolean;
  dryRunWouldWriteRows: boolean;
  designAllRuntimeBlocked: boolean;
  designAdapterImplemented: boolean;
  reviewAllRuntimeBlocked: boolean;
  reviewImplementationAllowed: boolean;
  fixtureAllRuntimeBlocked: boolean;
  fixtureWouldRunTransaction: boolean;
}) {
  return [
    invariant({
      id: "persistence_dry_run_still_blocks_writes",
      route: "/api/system-writers/persistence-dry-run",
      title: "Persistence dry-run gate still blocks writes",
      passed: input.dryRunAllBlocked && !input.dryRunWouldWriteRows,
      blocking: true,
      expectedFlags: [
        "allPersistenceAttemptsBlocked=true",
        "wouldWriteRows=false",
        "wouldWriteAuditRows=false",
        "wouldReserveIdempotencyKeys=false",
      ],
      actualSummary:
        "The source dry-run gate remains blocked and does not write rows.",
      sourceRefs: [
        "src/lib/server-writers/persistence-dry-run.ts",
        "/api/system-writers/persistence-dry-run",
      ],
    }),
    invariant({
      id: "persistence_adapter_design_still_inert",
      route: "/api/system-writers/persistence-adapter",
      title: "Persistence adapter design still inert",
      passed:
        input.designAllRuntimeBlocked && !input.designAdapterImplemented,
      blocking: true,
      expectedFlags: [
        "designMode=persistence_adapter_design_only",
        "adapterImplemented=false",
        "allRuntimeEffectsBlocked=true",
      ],
      actualSummary:
        "The source adapter remains a design-only boundary and cannot execute.",
      sourceRefs: [
        "src/lib/server-writers/persistence-adapter-design.ts",
        "/api/system-writers/persistence-adapter",
      ],
    }),
    invariant({
      id: "persistence_review_still_forbids_implementation",
      route: "/api/system-writers/persistence-review",
      title: "Implementation review still forbids implementation",
      passed:
        input.reviewAllRuntimeBlocked && !input.reviewImplementationAllowed,
      blocking: true,
      expectedFlags: [
        "reviewMode=persistence_adapter_implementation_review_only",
        "adapterImplementationAllowed=false",
        "allRuntimeEffectsBlocked=true",
      ],
      actualSummary:
        "The source review checklist remains a blocker, not an approval record.",
      sourceRefs: [
        "src/lib/server-writers/persistence-review.ts",
        "/api/system-writers/persistence-review",
      ],
    }),
    invariant({
      id: "persistence_fixtures_still_evidence_only",
      route: "/api/system-writers/persistence-fixtures",
      title: "Fixture harness still evidence-only",
      passed:
        input.fixtureAllRuntimeBlocked && !input.fixtureWouldRunTransaction,
      blocking: true,
      expectedFlags: [
        "fixtureMode=persistence_adapter_fixture_harness_only",
        "wouldRunTransaction=false",
        "allRuntimeEffectsBlocked=true",
      ],
      actualSummary:
        "The source fixture harness describes evidence only and does not run adapter behavior.",
      sourceRefs: [
        "src/lib/server-writers/persistence-fixtures.ts",
        "/api/system-writers/persistence-fixtures",
      ],
    }),
  ];
}

function buildItems(input: {
  allRouteInvariantsPassed: boolean;
  sourceReviewBlockedCount: number;
  sourceFixtureBlockedCount: number;
  sourceFixtureManualCount: number;
}) {
  return [
    noGoItem({
      id: "schema_evidence_no_go",
      category: "schema_evidence",
      title: "Schema evidence no-go",
      status: "blocked",
      blocking: true,
      owner: "founder",
      detail:
        "The future writer_audit_events and writer_idempotency_keys tables still lack privileged manual verification.",
      requiredEvidence:
        "Manual Supabase evidence must prove tables, columns, RLS, policy absence, indexes, and zero pre-launch rows.",
      sourceRefs: [
        "docs/writer-applied-schema-verification-harness.md",
        "docs/writer-migration-application-runbook.md",
      ],
      sourceReviewItemIds: ["schema_manual_evidence_package_missing"],
      sourceFixtureIds: [],
      routeInvariantIds: ["persistence_dry_run_still_blocks_writes"],
    }),
    noGoItem({
      id: "service_role_isolation_no_go",
      category: "service_role_isolation",
      title: "Service-role isolation no-go",
      status: "manual_required",
      blocking: true,
      owner: "security",
      detail:
        "Privileged credential handling has not been approved and no service-role client factory may be introduced.",
      requiredEvidence:
        "Security review must prove server-only credential access, browser bundle exclusion, secret logging prevention, and operator controls.",
      sourceRefs: [
        "docs/service-role-isolation-test-harness.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      sourceReviewItemIds: ["service_role_isolation_approval_missing"],
      sourceFixtureIds: ["service_role_isolation_fixture"],
      routeInvariantIds: ["persistence_fixtures_still_evidence_only"],
    }),
    noGoItem({
      id: "transaction_idempotency_no_go",
      category: "transaction_idempotency",
      title: "Transaction and idempotency no-go",
      status: "blocked",
      blocking: true,
      owner: "backend",
      detail:
        "Transaction order, replay, conflict, expiration, and finalize behavior are only fixtures; executable tests do not exist.",
      requiredEvidence:
        "Automated tests must prove ordered phases, same-hash replay, different-hash conflict, failed finalize, and duplicate write prevention.",
      sourceRefs: [
        "docs/writer-persistence-adapter-design.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      sourceReviewItemIds: [
        "transaction_order_tests_missing",
        "idempotency_replay_conflict_tests_missing",
      ],
      sourceFixtureIds: [
        "transaction_order_success_path_fixture",
        "idempotency_replay_fixture",
        "idempotency_conflict_fixture",
      ],
      routeInvariantIds: [
        "persistence_adapter_design_still_inert",
        "persistence_fixtures_still_evidence_only",
      ],
    }),
    noGoItem({
      id: "audit_redaction_no_go",
      category: "audit_redaction",
      title: "Audit redaction no-go",
      status: "blocked",
      blocking: true,
      owner: "security",
      detail:
        "Audit field redaction has a fixture, but no executable proof exists that raw prompts, provider payloads, tokens, or secrets are excluded.",
      requiredEvidence:
        "Redaction tests must prove audit rows contain hashes, refs, lifecycle names, and blocked codes only.",
      sourceRefs: [
        "docs/request-hashing-redaction-fixtures.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      sourceReviewItemIds: ["audit_redaction_tests_missing"],
      sourceFixtureIds: ["audit_redaction_fixture"],
      routeInvariantIds: ["persistence_review_still_forbids_implementation"],
    }),
    noGoItem({
      id: "rollback_compensation_no_go",
      category: "rollback_compensation",
      title: "Rollback compensation no-go",
      status: "manual_required",
      blocking: true,
      owner: "operator",
      detail:
        "Compensation is defined as a fixture only; operator procedures for preserving generated, payment, consent, audit, and idempotency history are not approved.",
      requiredEvidence:
        "Operator-approved compensation matrix, escalation path, and data-preserving rollback rules are required.",
      sourceRefs: [
        "docs/writer-rollback-compensation-model.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      sourceReviewItemIds: ["rollback_compensation_review_missing"],
      sourceFixtureIds: ["rollback_compensation_fixture"],
      routeInvariantIds: ["persistence_fixtures_still_evidence_only"],
    }),
    noGoItem({
      id: "rollout_approval_no_go",
      category: "rollout_approval",
      title: "Rollout approval no-go",
      status: "blocked",
      blocking: true,
      owner: "operator",
      detail:
        "No exact writer scope, canary audience, abort condition, or rollback owner is approved for production.",
      requiredEvidence:
        "Operator approval must name exact contracts, environment, audience, feature flags, abort conditions, monitoring, and rollback plan.",
      sourceRefs: [
        "docs/writer-rollout-checklist.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      sourceReviewItemIds: ["rollout_operator_approval_missing"],
      sourceFixtureIds: ["rollout_gate_fixture"],
      routeInvariantIds: ["persistence_review_still_forbids_implementation"],
    }),
    noGoItem({
      id: "observability_support_no_go",
      category: "observability_support",
      title: "Observability and support no-go",
      status: "manual_required",
      blocking: true,
      owner: "operator",
      detail:
        "Support diagnostics are not approved for explaining blocked or failed writer attempts without exposing sensitive data.",
      requiredEvidence:
        "Customer-safe blocked-code copy, correlation refs, operator escalation, and support troubleshooting examples must be reviewed.",
      sourceRefs: [
        "docs/controlled-backend-writers.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      sourceReviewItemIds: ["observability_support_plan_missing"],
      sourceFixtureIds: ["observability_support_fixture"],
      routeInvariantIds: ["persistence_fixtures_still_evidence_only"],
    }),
    noGoItem({
      id: "route_invariants_no_go",
      category: "route_invariants",
      title: "Route invariants no-go",
      status: input.allRouteInvariantsPassed ? "passed" : "blocked",
      blocking: true,
      owner: "qa",
      detail:
        "The no-go packet requires source dry-run, design, review, and fixture routes to keep their blocking flags before any implementation proposal.",
      requiredEvidence:
        "All source route invariants must pass and continue to return false for writes, transactions, service-role access, AI, Stripe, and report unlocks.",
      sourceRefs: ["docs/mvp-qa-environment.md", "docs/codex-next-task.md"],
      sourceReviewItemIds: ["dangerous_runtime_flags_remain_false"],
      sourceFixtureIds: ["security_no_go_fixture"],
      routeInvariantIds: [
        "persistence_dry_run_still_blocks_writes",
        "persistence_adapter_design_still_inert",
        "persistence_review_still_forbids_implementation",
        "persistence_fixtures_still_evidence_only",
      ],
    }),
    noGoItem({
      id: "security_no_go_packet",
      category: "security_no_go",
      title: "Security no-go packet",
      status: "blocked",
      blocking: true,
      owner: "security",
      detail:
        "The packet intentionally keeps implementation blocked because review blockers and fixture blockers remain.",
      requiredEvidence:
        `All review blockers must be cleared, all manual items approved, and fixture blockers resolved. Current source counts: review blockers=${input.sourceReviewBlockedCount}, fixture blocked=${input.sourceFixtureBlockedCount}, fixture manual=${input.sourceFixtureManualCount}.`,
      sourceRefs: [
        "docs/writer-persistence-adapter-review-checklist.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      sourceReviewItemIds: ["security_no_go_review_missing"],
      sourceFixtureIds: ["security_no_go_fixture"],
      routeInvariantIds: [
        "persistence_review_still_forbids_implementation",
        "persistence_fixtures_still_evidence_only",
      ],
    }),
    noGoItem({
      id: "implementation_handoff_no_go",
      category: "implementation_handoff",
      title: "Implementation handoff no-go",
      status: "blocked",
      blocking: true,
      owner: "backend",
      detail:
        "This packet is the handoff gate, not an implementation plan. No code scaffold, branch, service-role client, transaction, or writer body may be created from it.",
      requiredEvidence:
        "A later approved implementation proposal must cite this packet after every blocker is cleared. Until then, implementation planning remains forbidden.",
      sourceRefs: ["docs/codex-next-task.md"],
      sourceReviewItemIds: ["security_no_go_review_missing"],
      sourceFixtureIds: ["security_no_go_fixture"],
      routeInvariantIds: [
        "persistence_adapter_design_still_inert",
        "persistence_review_still_forbids_implementation",
      ],
    }),
  ];
}

function countByStatus(
  items: WriterPersistenceNoGoItem[],
  status: WriterPersistenceNoGoItem["status"],
) {
  return items.filter((item) => item.status === status).length;
}

export async function buildWriterPersistenceNoGoPacket(): Promise<WriterPersistenceNoGoPayload> {
  const dryRun = await buildWriterPersistenceDryRunGate();
  const design = await buildWriterPersistenceAdapterDesign();
  const review = await buildWriterPersistenceReview();
  const fixtures = await buildWriterPersistenceFixtureHarness();
  const routeInvariants = buildRouteInvariants({
    dryRunAllBlocked: dryRun.allPersistenceAttemptsBlocked,
    dryRunWouldWriteRows: dryRun.wouldWriteRows,
    designAllRuntimeBlocked: design.allRuntimeEffectsBlocked,
    designAdapterImplemented: design.adapterImplemented,
    reviewAllRuntimeBlocked: review.allRuntimeEffectsBlocked,
    reviewImplementationAllowed: review.adapterImplementationAllowed,
    fixtureAllRuntimeBlocked: fixtures.allRuntimeEffectsBlocked,
    fixtureWouldRunTransaction: fixtures.wouldRunTransaction,
  });
  const items = buildItems({
    allRouteInvariantsPassed: routeInvariants.every(
      (currentInvariant) => currentInvariant.passed,
    ),
    sourceReviewBlockedCount: review.blockingItemCount,
    sourceFixtureBlockedCount: fixtures.blockedFixtureCount,
    sourceFixtureManualCount: fixtures.manualRequiredFixtureCount,
  });

  return {
    safeMode: true,
    readOnly: true,
    noGoMode: "persistence_adapter_no_go_evidence_packet_only",
    sourceDesignMode: design.designMode,
    sourceReviewMode: review.reviewMode,
    sourceFixtureMode: fixtures.fixtureMode,
    checkedAt: new Date().toISOString(),
    itemCount: items.length,
    blockedItemCount: countByStatus(items, "blocked"),
    manualRequiredItemCount: countByStatus(items, "manual_required"),
    passedItemCount: countByStatus(items, "passed"),
    routeInvariantCount: routeInvariants.length,
    routeInvariantPassedCount: routeInvariants.filter(
      (currentInvariant) => currentInvariant.passed,
    ).length,
    sourceReviewItemCount: review.itemCount,
    sourceFixtureCount: fixtures.fixtureCount,
    sourceFixtureAssertionCount: fixtures.assertionCount,
    noGoPacketReady: true,
    noGoEvidenceComplete: false,
    readyForImplementationProposal: false,
    implementationProposalAllowed: false,
    schemaVerified: false,
    adapterImplemented: false,
    adapterImplementationApproved: false,
    adapterImplementationAllowed: false,
    implementationReviewComplete: false,
    allBlockingEvidenceReady: false,
    ...runtimeBlockedFlags,
    blockedCodes,
    packetRules: [
      "This no-go packet is a handoff gate, not an approval record or implementation plan.",
      "The packet aggregates review blockers, fixture assertions, and source route invariants into one implementation blocker.",
      "A passed route invariant only proves existing blocking surfaces are still inert; it does not clear evidence blockers.",
      "No implementation proposal, branch, privileged client, transaction, database write, migration, AI call, Stripe call, entitlement grant, or report unlock is allowed in this stage.",
      "The read-only implementation proposal scaffold may cite this packet, but it must still avoid executable persistence.",
    ],
    routeInvariants,
    items,
  };
}

export async function probeWriterPersistenceNoGoPacket(
  requestBody: unknown,
): Promise<WriterPersistenceNoGoProbeResult> {
  const payload = await buildWriterPersistenceNoGoPacket();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      noGoMode: payload.noGoMode,
      summary:
        "Persistence no-go packet probe blocked: request body must be a JSON object and no implementation proposal was created.",
      noGoEvidenceComplete: false,
      readyForImplementationProposal: false,
      implementationProposalAllowed: false,
      schemaVerified: false,
      adapterImplemented: false,
      adapterImplementationApproved: false,
      adapterImplementationAllowed: false,
      implementationReviewComplete: false,
      allBlockingEvidenceReady: false,
      ...runtimeBlockedFlags,
      blockedCodes: payload.blockedCodes,
      routeInvariants: payload.routeInvariants,
      items: payload.items,
    };
  }

  const itemId = (requestBody as { itemId?: unknown }).itemId;

  if (typeof itemId !== "string") {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      noGoMode: payload.noGoMode,
      summary:
        "Persistence no-go packet probe blocked: itemId must be a string and no implementation proposal was created.",
      noGoEvidenceComplete: false,
      readyForImplementationProposal: false,
      implementationProposalAllowed: false,
      schemaVerified: false,
      adapterImplemented: false,
      adapterImplementationApproved: false,
      adapterImplementationAllowed: false,
      implementationReviewComplete: false,
      allBlockingEvidenceReady: false,
      ...runtimeBlockedFlags,
      blockedCodes: payload.blockedCodes,
      routeInvariants: payload.routeInvariants,
      items: payload.items,
    };
  }

  const selectedItem = payload.items.find((item) => item.id === itemId);

  if (!selectedItem) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      noGoMode: payload.noGoMode,
      summary:
        "Persistence no-go packet probe blocked: unknown item id and no implementation proposal was created.",
      noGoEvidenceComplete: false,
      readyForImplementationProposal: false,
      implementationProposalAllowed: false,
      schemaVerified: false,
      adapterImplemented: false,
      adapterImplementationApproved: false,
      adapterImplementationAllowed: false,
      implementationReviewComplete: false,
      allBlockingEvidenceReady: false,
      ...runtimeBlockedFlags,
      blockedCodes: payload.blockedCodes,
      routeInvariants: payload.routeInvariants,
      items: payload.items,
    };
  }

  return {
    safeMode: true,
    readOnly: true,
    blocked: true,
    noGoMode: payload.noGoMode,
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence no-go packet probe blocked as designed: the selected evidence item was returned, but no implementation proposal, branch, adapter code, service-role client, transaction, audit row, idempotency key, compensation row, migration, AI call, Stripe call, or report unlock was created.",
    noGoEvidenceComplete: false,
    readyForImplementationProposal: false,
    implementationProposalAllowed: false,
    schemaVerified: false,
    adapterImplemented: false,
    adapterImplementationApproved: false,
    adapterImplementationAllowed: false,
    implementationReviewComplete: false,
    allBlockingEvidenceReady: false,
    ...runtimeBlockedFlags,
    blockedCodes: payload.blockedCodes,
    routeInvariants: payload.routeInvariants.filter((invariantItem) =>
      selectedItem.routeInvariantIds.includes(invariantItem.id),
    ),
    items: [selectedItem],
  };
}
