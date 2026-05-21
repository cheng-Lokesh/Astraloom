import "server-only";

import { buildWriterPersistenceNoGoPacket } from "@/lib/server-writers/persistence-no-go";
import type {
  WriterPersistenceImplementationProposalPayload,
  WriterPersistenceImplementationProposalProbeResult,
  WriterPersistenceImplementationProposalSection,
} from "@/types/writer-persistence-implementation-proposal";

const blockedCodes = [
  "proposal_scaffold_only",
  "no_go_evidence_incomplete",
  "implementation_proposal_not_accepted",
  "implementation_plan_forbidden",
  "implementation_branch_forbidden",
  "adapter_code_forbidden",
  "service_role_client_forbidden",
  "transaction_forbidden",
  "database_writes_forbidden",
  "migration_creation_forbidden",
  "ai_stripe_report_side_effects_forbidden",
];

const runtimeBlockedFlags = {
  allRuntimeEffectsBlocked: true,
  wouldCreateImplementationPlan: false,
  wouldCreateImplementationBranch: false,
  wouldCreateAdapterCode: false,
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
  wouldCreateMigrationFile: false,
  wouldApplyMigration: false,
  wouldCreateTables: false,
  wouldEnableWriters: false,
  wouldCallAi: false,
  wouldCallStripe: false,
  wouldUnlockReports: false,
} as const;

function section(
  input: WriterPersistenceImplementationProposalSection,
): WriterPersistenceImplementationProposalSection {
  return input;
}

function buildSections(): WriterPersistenceImplementationProposalSection[] {
  return [
    section({
      id: "scope_boundary_scaffold",
      category: "scope_boundary",
      title: "Scope boundary scaffold",
      status: "scaffolded",
      owner: "backend",
      intent:
        "Define what a later executable persistence adapter may cover without allowing implementation in this stage.",
      proposedShape: [
        "Only audit/idempotency persistence adapter boundaries are in scope.",
        "Target writer bodies for agents, runs, reports, payments, consent, and support remain outside this adapter scaffold.",
        "The adapter may later coordinate preflight, idempotency, audit, result handoff, finalize, and compensation phases.",
      ],
      requiredBeforeImplementation: [
        "No-go evidence must be complete.",
        "Schema evidence must be manually verified.",
        "Implementation review must be approved by backend, security, QA, and operator owners.",
      ],
      sourceRefs: [
        "docs/writer-persistence-no-go-evidence-packet.md",
        "docs/writer-persistence-adapter-design.md",
      ],
      sourceNoGoItemIds: [
        "schema_evidence_no_go",
        "implementation_handoff_no_go",
      ],
      futureFiles: [
        "src/lib/server-writers/persistence-adapter.server.ts",
        "src/lib/server-writers/persistence-adapter.types.ts",
      ],
      forbiddenNow: [
        "Creating the future files",
        "Exporting executable adapter methods",
        "Changing writer stubs into real writers",
      ],
    }),
    section({
      id: "server_module_boundary_scaffold",
      category: "module_boundary",
      title: "Server-only module boundary scaffold",
      status: "blocked_by_no_go",
      owner: "security",
      intent:
        "Describe the future module split required to keep privileged persistence out of browser bundles.",
      proposedShape: [
        "A future server-only adapter module may own privileged persistence orchestration.",
        "A separate type-only module may expose request/result shapes safe for compile-time use.",
        "Client components must never import the server-only adapter or privileged config.",
      ],
      requiredBeforeImplementation: [
        "Service-role isolation proof must be approved.",
        "Bundle exclusion tests must prove privileged modules are server-only.",
        "Secret logging prevention must be reviewed.",
      ],
      sourceRefs: [
        "docs/service-role-isolation-test-harness.md",
        "docs/writer-persistence-adapter-review-checklist.md",
      ],
      sourceNoGoItemIds: ["service_role_isolation_no_go"],
      futureFiles: [
        "src/lib/server-writers/persistence-adapter.server.ts",
        "src/lib/server-writers/service-role-client.server.ts",
      ],
      forbiddenNow: [
        "Creating a service-role client factory",
        "Reading service-role secrets",
        "Importing server-only writers from client components",
      ],
    }),
    section({
      id: "phase_sequence_scaffold",
      category: "phase_sequence",
      title: "Adapter phase sequence scaffold",
      status: "scaffolded",
      owner: "backend",
      intent:
        "Keep the future execution order explicit before any transaction or row mutation exists.",
      proposedShape: [
        "preflight",
        "idempotency_reservation",
        "audit_attempt",
        "future_writer_body",
        "audit_result",
        "idempotency_finalize",
        "compensation_handoff",
      ],
      requiredBeforeImplementation: [
        "Automated tests must assert exact phase order.",
        "Failure tests must prove early phases block later side effects.",
        "Rollback behavior must be mapped for failures after target writes.",
      ],
      sourceRefs: [
        "docs/writer-persistence-adapter-design.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      sourceNoGoItemIds: ["transaction_idempotency_no_go"],
      futureFiles: [
        "src/lib/server-writers/persistence-adapter.server.ts",
        "src/lib/server-writers/persistence-adapter.test.ts",
      ],
      forbiddenNow: [
        "Opening a transaction",
        "Running phase code",
        "Writing audit, idempotency, compensation, or target rows",
      ],
    }),
    section({
      id: "transaction_idempotency_scaffold",
      category: "transaction_idempotency",
      title: "Transaction and idempotency scaffold",
      status: "manual_required",
      owner: "backend",
      intent:
        "Define future reservation, replay, conflict, expiration, and finalize behavior without reserving keys now.",
      proposedShape: [
        "Reserve idempotency before target writer execution.",
        "Return existing result for same key plus same request hash.",
        "Reject same key plus different request hash before target writes.",
        "Finalize completed, failed, expired, or conflict states with replay-safe refs.",
      ],
      requiredBeforeImplementation: [
        "Database uniqueness and lock behavior must be reviewed.",
        "Replay/conflict/finalize tests must be executable.",
        "No raw payload may be stored with idempotency rows.",
      ],
      sourceRefs: [
        "docs/writer-idempotency-registry-model.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      sourceNoGoItemIds: ["transaction_idempotency_no_go"],
      futureFiles: [
        "src/lib/server-writers/persistence-idempotency.server.ts",
        "src/lib/server-writers/persistence-idempotency.test.ts",
      ],
      forbiddenNow: [
        "Reserving idempotency keys",
        "Writing registry rows",
        "Creating idempotency SQL migrations",
      ],
    }),
    section({
      id: "audit_redaction_scaffold",
      category: "audit_redaction",
      title: "Audit redaction scaffold",
      status: "manual_required",
      owner: "security",
      intent:
        "Describe future append-only audit records that store hashes and refs only.",
      proposedShape: [
        "Attempt, blocked, success, failure, conflict, replay, and compensation events are append-only.",
        "Audit fields use requestHash, evidenceRef, contractId, lifecycle, blockedCodes, and target table refs.",
        "Raw prompts, private narrative text, provider payloads, tokens, Stripe payloads, and service-role values are forbidden.",
      ],
      requiredBeforeImplementation: [
        "Redaction tests must prove forbidden values are absent.",
        "Audit append failure behavior must block high-impact writers.",
        "Support-safe correlation refs must be reviewed.",
      ],
      sourceRefs: [
        "docs/request-hashing-redaction-fixtures.md",
        "docs/writer-audit-event-model.md",
      ],
      sourceNoGoItemIds: ["audit_redaction_no_go"],
      futureFiles: [
        "src/lib/server-writers/persistence-audit.server.ts",
        "src/lib/server-writers/persistence-audit.test.ts",
      ],
      forbiddenNow: [
        "Writing audit rows",
        "Persisting request hashes",
        "Storing raw payloads or secrets",
      ],
    }),
    section({
      id: "rollback_compensation_scaffold",
      category: "rollback_compensation",
      title: "Rollback and compensation scaffold",
      status: "manual_required",
      owner: "operator",
      intent:
        "Define how later failed or unsafe writer outcomes route into data-preserving compensation.",
      proposedShape: [
        "Generated artifacts are superseded or invalidated by version.",
        "Payments, consent, audit, and idempotency history are preserved.",
        "Compensation creates append-only evidence and operator review refs.",
      ],
      requiredBeforeImplementation: [
        "Operator-approved compensation matrix must exist.",
        "Data-preserving rollback rules must be accepted.",
        "Support escalation copy must be reviewed.",
      ],
      sourceRefs: [
        "docs/writer-rollback-compensation-model.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      sourceNoGoItemIds: ["rollback_compensation_no_go"],
      futureFiles: [
        "src/lib/server-writers/persistence-compensation.server.ts",
        "src/lib/server-writers/persistence-compensation.test.ts",
      ],
      forbiddenNow: [
        "Writing compensation rows",
        "Deleting generated, payment, consent, audit, or idempotency history",
        "Changing rollback behavior in production",
      ],
    }),
    section({
      id: "test_evidence_scaffold",
      category: "test_evidence",
      title: "Implementation test evidence scaffold",
      status: "blocked_by_no_go",
      owner: "qa",
      intent:
        "Name the future tests required before this scaffold can become an implementation proposal.",
      proposedShape: [
        "Unit tests for phase order, same-hash replay, different-hash conflict, audit redaction, and compensation handoff.",
        "Integration tests for schema readiness, service-role isolation, and browser bundle exclusion.",
        "Route invariant tests confirming dry-run, design, review, fixtures, no-go, and proposal routes remain inert until approval.",
      ],
      requiredBeforeImplementation: [
        "Every no-go evidence item must have a passing or approved test path.",
        "Tests must run without service-role secrets in local safe mode.",
        "Dangerous flags must remain false in read-only routes.",
      ],
      sourceRefs: [
        "docs/writer-persistence-adapter-review-checklist.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      sourceNoGoItemIds: [
        "transaction_idempotency_no_go",
        "audit_redaction_no_go",
        "security_no_go_packet",
      ],
      futureFiles: [
        "src/lib/server-writers/persistence-adapter.test.ts",
        "src/lib/server-writers/persistence-adapter.integration.test.ts",
      ],
      forbiddenNow: [
        "Adding executable adapter tests that require real writes",
        "Using production credentials in tests",
        "Changing route gates to pass implementation",
      ],
    }),
    section({
      id: "rollout_observability_scaffold",
      category: "rollout_observability",
      title: "Rollout and observability scaffold",
      status: "manual_required",
      owner: "operator",
      intent:
        "Describe the future operator controls and support evidence required before production enablement.",
      proposedShape: [
        "Exact contract allowlist, environment, canary audience, abort conditions, rollback owner, and monitoring checks.",
        "Customer-safe blocked-code copy and correlation refs for support.",
        "No automatic entitlement grant or report unlock from adapter success alone.",
      ],
      requiredBeforeImplementation: [
        "Rollout approval must name exact writer scope.",
        "Abort conditions and rollback owner must be accepted.",
        "Support playbook must be reviewed without exposing sensitive data.",
      ],
      sourceRefs: [
        "docs/writer-rollout-checklist.md",
        "docs/controlled-backend-writers.md",
      ],
      sourceNoGoItemIds: [
        "rollout_approval_no_go",
        "observability_support_no_go",
      ],
      futureFiles: [
        "src/lib/server-writers/persistence-rollout.server.ts",
        "src/lib/server-writers/persistence-observability.server.ts",
      ],
      forbiddenNow: [
        "Enabling writer feature flags",
        "Granting entitlements",
        "Unlocking reports",
        "Calling AI or Stripe",
      ],
    }),
    section({
      id: "implementation_handoff_scaffold",
      category: "implementation_handoff",
      title: "Implementation handoff scaffold",
      status: "blocked_by_no_go",
      owner: "backend",
      intent:
        "Define the later handoff record required before executable adapter work can start.",
      proposedShape: [
        "A future accepted proposal must cite cleared no-go evidence, exact files, exact tests, rollout scope, rollback plan, and owner approvals.",
        "It must include a branch plan only after explicit approval.",
        "It must keep migration, service-role, AI, Stripe, and report unlock changes separately reviewed.",
      ],
      requiredBeforeImplementation: [
        "No-go evidence complete.",
        "Implementation proposal accepted by named owners.",
        "Acceptance test matrix complete.",
        "Manual approval to create implementation branch.",
      ],
      sourceRefs: [
        "docs/writer-persistence-no-go-evidence-packet.md",
        "docs/codex-next-task.md",
      ],
      sourceNoGoItemIds: ["implementation_handoff_no_go"],
      futureFiles: ["docs/writer-persistence-implementation-approval.md"],
      forbiddenNow: [
        "Creating an implementation branch",
        "Creating an executable implementation plan",
        "Starting adapter implementation",
      ],
    }),
    section({
      id: "explicit_non_goals_scaffold",
      category: "non_goal",
      title: "Explicit non-goals scaffold",
      status: "scaffolded",
      owner: "founder",
      intent:
        "Keep the proposal narrow enough for VibeCoding implementation without accidental scope creep.",
      proposedShape: [
        "No real AI generation.",
        "No Stripe checkout or webhook handling.",
        "No report unlock logic.",
        "No community, mobile app, or multi-language launch work.",
        "No direct user editing of hidden relationship weights.",
      ],
      requiredBeforeImplementation: [
        "Founder accepts that this proposal only covers persistence adapter infrastructure.",
        "Product-facing generated simulation behavior remains in later stages.",
      ],
      sourceRefs: ["docs/codex-next-task.md", "docs/mvp-qa-environment.md"],
      sourceNoGoItemIds: ["security_no_go_packet"],
      futureFiles: [],
      forbiddenNow: [
        "Expanding into product generation",
        "Adding paid flow side effects",
        "Changing report readiness behavior",
      ],
    }),
  ];
}

function countByStatus(
  sections: WriterPersistenceImplementationProposalSection[],
  status: WriterPersistenceImplementationProposalSection["status"],
) {
  return sections.filter((currentSection) => currentSection.status === status)
    .length;
}

function baseProbeFields(
  payload: WriterPersistenceImplementationProposalPayload,
) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    scaffoldMode: payload.scaffoldMode,
    proposalScaffoldOnly: true as const,
    sourceNoGoEvidenceComplete: false as const,
    implementationProposalAccepted: false as const,
    implementationProposalAllowed: false as const,
    implementationPlanApproved: false as const,
    readyToCreateImplementationBranch: false as const,
    readyForAdapterImplementation: false as const,
    schemaVerified: false as const,
    adapterImplemented: false as const,
    adapterImplementationApproved: false as const,
    adapterImplementationAllowed: false as const,
    implementationReviewComplete: false as const,
    allBlockingEvidenceReady: false as const,
    ...runtimeBlockedFlags,
    blockedCodes: payload.blockedCodes,
  };
}

export async function buildWriterPersistenceImplementationProposal(): Promise<WriterPersistenceImplementationProposalPayload> {
  const noGo = await buildWriterPersistenceNoGoPacket();
  const sections = buildSections();

  return {
    safeMode: true,
    readOnly: true,
    scaffoldMode: "persistence_adapter_implementation_proposal_scaffold_only",
    sourceNoGoMode: noGo.noGoMode,
    checkedAt: new Date().toISOString(),
    sectionCount: sections.length,
    scaffoldedSectionCount: countByStatus(sections, "scaffolded"),
    blockedSectionCount: countByStatus(sections, "blocked_by_no_go"),
    manualRequiredSectionCount: countByStatus(sections, "manual_required"),
    sourceNoGoItemCount: noGo.itemCount,
    sourceNoGoBlockedItemCount: noGo.blockedItemCount,
    sourceNoGoManualRequiredItemCount: noGo.manualRequiredItemCount,
    sourceNoGoRouteInvariantCount: noGo.routeInvariantCount,
    proposalScaffoldReady: true,
    proposalScaffoldOnly: true,
    sourceNoGoPacketReady: noGo.noGoPacketReady,
    sourceNoGoEvidenceComplete: false,
    implementationProposalAccepted: false,
    implementationProposalAllowed: false,
    implementationPlanApproved: false,
    readyToCreateImplementationBranch: false,
    readyForAdapterImplementation: false,
    schemaVerified: false,
    adapterImplemented: false,
    adapterImplementationApproved: false,
    adapterImplementationAllowed: false,
    implementationReviewComplete: false,
    allBlockingEvidenceReady: false,
    ...runtimeBlockedFlags,
    blockedCodes,
    scaffoldRules: [
      "This scaffold is a read-only proposal outline, not an accepted implementation proposal.",
      "It may name future files, modules, phases, tests, and acceptance gates, but it must not create those files or execute them.",
      "The source no-go packet remains incomplete, so implementation planning, branch creation, service-role access, transactions, migrations, writes, AI, Stripe, and report unlocks stay blocked.",
      "Future implementation must be separated into explicitly approved work after no-go evidence and acceptance tests are complete.",
    ],
    acceptanceGates: [
      "No-go evidence complete and manually accepted.",
      "Schema verification evidence proves audit and idempotency tables are present with the expected RLS posture.",
      "Service-role isolation proof confirms privileged modules never reach browser bundles.",
      "Automated tests cover phase order, idempotency replay/conflict/finalize, audit redaction, compensation, and route invariants.",
      "Rollout approval names exact contracts, environment, canary audience, abort conditions, monitoring, and rollback owner.",
      "Founder/operator/security/backend/QA owners approve the exact implementation branch scope.",
    ],
    sections,
  };
}

export async function probeWriterPersistenceImplementationProposal(
  requestBody: unknown,
): Promise<WriterPersistenceImplementationProposalProbeResult> {
  const payload = await buildWriterPersistenceImplementationProposal();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence implementation proposal scaffold probe blocked: request body must be a JSON object and no implementation plan was created.",
      sections: payload.sections,
    };
  }

  const sectionId = (requestBody as { sectionId?: unknown }).sectionId;

  if (typeof sectionId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence implementation proposal scaffold probe blocked: sectionId must be a string and no implementation plan was created.",
      sections: payload.sections,
    };
  }

  const selectedSection = payload.sections.find(
    (candidate) => candidate.id === sectionId,
  );

  if (!selectedSection) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence implementation proposal scaffold probe blocked: unknown section id and no implementation plan was created.",
      sections: payload.sections,
    };
  }

  return {
    ...baseProbeFields(payload),
    sectionId: selectedSection.id,
    sectionTitle: selectedSection.title,
    sectionStatus: selectedSection.status,
    summary:
      "Persistence implementation proposal scaffold probe blocked as designed: the selected scaffold section was returned, but no implementation plan, branch, adapter code, service-role client, transaction, migration, row write, AI call, Stripe call, or report unlock was created.",
    sections: [selectedSection],
  };
}
