import "server-only";

import { buildWriterPersistenceImplementationProposal } from "@/lib/server-writers/persistence-implementation-proposal";
import type {
  WriterPersistenceAcceptanceTestCase,
  WriterPersistenceAcceptanceTestMatrixPayload,
  WriterPersistenceAcceptanceTestMatrixProbeResult,
  WriterPersistenceAcceptanceTestType,
} from "@/types/writer-persistence-acceptance-test-matrix";

const blockedCodes = [
  "acceptance_test_matrix_only",
  "proposal_scaffold_not_accepted",
  "implementation_acceptance_not_approved",
  "test_file_creation_forbidden",
  "test_execution_forbidden",
  "implementation_approval_packet_forbidden",
  "implementation_branch_forbidden",
  "adapter_code_forbidden",
  "service_role_client_forbidden",
  "transaction_forbidden",
  "database_writes_forbidden",
  "ai_stripe_report_side_effects_forbidden",
];

const runtimeBlockedFlags = {
  allRuntimeEffectsBlocked: true,
  wouldCreateTestFiles: false,
  wouldRunAutomatedTests: false,
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

function testCase(
  input: WriterPersistenceAcceptanceTestCase,
): WriterPersistenceAcceptanceTestCase {
  return input;
}

function buildTests(): WriterPersistenceAcceptanceTestCase[] {
  return [
    testCase({
      id: "proposal_route_invariant_acceptance",
      category: "proposal_invariant",
      title: "Proposal route invariant acceptance",
      status: "matrix_ready",
      testType: "route_invariant",
      owner: "qa",
      intent:
        "Prove the proposal scaffold route remains read-only and cannot approve implementation.",
      sourceProposalSectionIds: [
        "scope_boundary_scaffold",
        "implementation_handoff_scaffold",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-proposal-scaffold.md",
        "/api/system-writers/persistence-proposal",
      ],
      futureTestFiles: [
        "src/lib/server-writers/persistence-acceptance.route.test.ts",
      ],
      futureCommand: "npm run test -- persistence-acceptance.route.test.ts",
      acceptanceCriteria: [
        "GET returns scaffoldMode=persistence_adapter_implementation_proposal_scaffold_only.",
        "implementationProposalAllowed=false and readyForAdapterImplementation=false.",
        "All write, service-role, branch, adapter-code, AI, Stripe, and report flags stay false.",
      ],
      requiredEvidence: [
        "Route response snapshot without secrets.",
        "Negative assertion for privileged key names, auth token markers, and provider-key strings.",
      ],
      expectedBlockedFlags: [
        "wouldCreateImplementationPlan=false",
        "wouldCreateImplementationBranch=false",
        "wouldCreateAdapterCode=false",
        "wouldWriteRows=false",
      ],
      forbiddenDuringMatrix: [
        "Creating test files",
        "Running automated tests",
        "Changing proposal route behavior",
      ],
    }),
    testCase({
      id: "scope_boundary_acceptance",
      category: "scope_boundary",
      title: "Scope boundary acceptance",
      status: "matrix_ready",
      testType: "manual_review",
      owner: "founder",
      intent:
        "Confirm the future adapter proposal remains limited to audit/idempotency infrastructure.",
      sourceProposalSectionIds: ["scope_boundary_scaffold"],
      sourceRefs: [
        "docs/writer-persistence-implementation-proposal-scaffold.md",
        "docs/controlled-backend-writers.md",
      ],
      futureTestFiles: ["docs/writer-persistence-implementation-approval.md"],
      futureCommand: "Manual founder/backend approval only",
      acceptanceCriteria: [
        "No target writer body for agents, reports, payments, consent, or simulations is included.",
        "No AI generation, Stripe checkout, report unlock, or entitlement grant is introduced.",
        "Adapter scope stays limited to orchestration, audit evidence, idempotency, and compensation handoff.",
      ],
      requiredEvidence: [
        "Founder acceptance of scope.",
        "Backend owner acceptance of future files and non-goals.",
      ],
      expectedBlockedFlags: [
        "wouldCallAi=false",
        "wouldCallStripe=false",
        "wouldUnlockReports=false",
      ],
      forbiddenDuringMatrix: [
        "Adding product generation scope",
        "Adding payment scope",
        "Adding report unlock scope",
      ],
    }),
    testCase({
      id: "server_only_boundary_acceptance",
      category: "server_only_boundary",
      title: "Server-only boundary acceptance",
      status: "blocked_by_proposal",
      testType: "integration_test",
      owner: "security",
      intent:
        "Define future proof that privileged adapter modules cannot enter browser bundles.",
      sourceProposalSectionIds: ["server_module_boundary_scaffold"],
      sourceRefs: [
        "docs/service-role-isolation-test-harness.md",
        "docs/writer-persistence-adapter-review-checklist.md",
      ],
      futureTestFiles: [
        "src/lib/server-writers/persistence-server-boundary.test.ts",
      ],
      futureCommand: "npm run test -- persistence-server-boundary.test.ts",
      acceptanceCriteria: [
        "Future server-only adapter module imports server-only.",
        "Client components cannot import privileged adapter or service-role modules.",
        "No service-role secret is serialized into API responses, HTML, logs, or browser bundles.",
      ],
      requiredEvidence: [
        "Bundle exclusion proof.",
        "Secret redaction proof.",
        "Security owner approval.",
      ],
      expectedBlockedFlags: [
        "wouldCreateServiceRoleClient=false",
        "wouldReadServiceRoleSecret=false",
        "wouldStoreSecrets=false",
      ],
      forbiddenDuringMatrix: [
        "Creating a service-role client factory",
        "Reading privileged config",
        "Creating integration test files",
      ],
    }),
    testCase({
      id: "phase_order_acceptance",
      category: "phase_order",
      title: "Phase order acceptance",
      status: "matrix_ready",
      testType: "unit_test",
      owner: "backend",
      intent:
        "Define future assertions for preflight, idempotency, audit, writer body, finalize, and compensation ordering.",
      sourceProposalSectionIds: ["phase_sequence_scaffold"],
      sourceRefs: [
        "docs/writer-persistence-adapter-design.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      futureTestFiles: ["src/lib/server-writers/persistence-phase-order.test.ts"],
      futureCommand: "npm run test -- persistence-phase-order.test.ts",
      acceptanceCriteria: [
        "Preflight completes before any reservation or audit attempt.",
        "Idempotency reservation happens before future writer body.",
        "Audit attempt happens before high-impact future writer body.",
        "Result audit and idempotency finalize happen after outcome refs exist.",
      ],
      requiredEvidence: [
        "Ordered phase fixture coverage.",
        "Failure path proves early blockers prevent later side effects.",
      ],
      expectedBlockedFlags: [
        "wouldRunTransaction=false",
        "wouldWriteAuditRows=false",
        "wouldWriteIdempotencyRows=false",
      ],
      forbiddenDuringMatrix: [
        "Opening a transaction",
        "Creating phase implementation code",
        "Executing future writer body",
      ],
    }),
    testCase({
      id: "idempotency_behavior_acceptance",
      category: "idempotency_behavior",
      title: "Idempotency replay and conflict acceptance",
      status: "manual_required",
      testType: "unit_test",
      owner: "backend",
      intent:
        "Define future replay, conflict, finalize, failed, and expired key behavior before reserving keys exists.",
      sourceProposalSectionIds: ["transaction_idempotency_scaffold"],
      sourceRefs: [
        "docs/writer-idempotency-registry-model.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      futureTestFiles: [
        "src/lib/server-writers/persistence-idempotency.test.ts",
      ],
      futureCommand: "npm run test -- persistence-idempotency.test.ts",
      acceptanceCriteria: [
        "Same key plus same request hash returns an existing result or pending status without duplicate writes.",
        "Same key plus different request hash blocks target writer execution.",
        "Finalize completed status points to replayable refs.",
        "Failed or expired statuses do not create duplicate target rows.",
      ],
      requiredEvidence: [
        "Database uniqueness plan.",
        "Request hash conflict fixture.",
        "Replay fixture.",
        "Finalize fixture.",
      ],
      expectedBlockedFlags: [
        "wouldReserveIdempotencyKeys=false",
        "wouldWriteIdempotencyRows=false",
        "wouldWriteRows=false",
      ],
      forbiddenDuringMatrix: [
        "Reserving idempotency keys",
        "Writing idempotency rows",
        "Creating idempotency migrations",
      ],
    }),
    testCase({
      id: "audit_redaction_acceptance",
      category: "audit_redaction",
      title: "Audit redaction acceptance",
      status: "manual_required",
      testType: "unit_test",
      owner: "security",
      intent:
        "Define future proof that audit records store lifecycle metadata, hashes, refs, and blocked codes only.",
      sourceProposalSectionIds: ["audit_redaction_scaffold"],
      sourceRefs: [
        "docs/request-hashing-redaction-fixtures.md",
        "docs/writer-audit-event-model.md",
      ],
      futureTestFiles: ["src/lib/server-writers/persistence-audit.test.ts"],
      futureCommand: "npm run test -- persistence-audit.test.ts",
      acceptanceCriteria: [
        "Raw prompt-like text, user private narrative, provider payloads, access tokens, API keys, Stripe payloads, and service-role values are absent.",
        "Audit attempt/result uses requestHash, evidenceRef, lifecycle, target refs, and blockedCodes only.",
        "Audit append failure blocks high-impact writer execution.",
      ],
      requiredEvidence: [
        "Redaction fixture coverage.",
        "Forbidden-key negative assertions.",
        "Security approval for audit field mapping.",
      ],
      expectedBlockedFlags: [
        "wouldPersistEvidence=false",
        "wouldStoreRawPayload=false",
        "wouldWriteAuditRows=false",
      ],
      forbiddenDuringMatrix: [
        "Writing audit rows",
        "Persisting request hashes",
        "Storing raw payloads",
      ],
    }),
    testCase({
      id: "rollback_compensation_acceptance",
      category: "rollback_compensation",
      title: "Rollback compensation acceptance",
      status: "manual_required",
      testType: "manual_review",
      owner: "operator",
      intent:
        "Define future approval evidence for data-preserving compensation after failed or unsafe writer outcomes.",
      sourceProposalSectionIds: ["rollback_compensation_scaffold"],
      sourceRefs: [
        "docs/writer-rollback-compensation-model.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      futureTestFiles: [
        "src/lib/server-writers/persistence-compensation.test.ts",
        "docs/writer-persistence-compensation-approval.md",
      ],
      futureCommand: "Manual operator approval plus future automated tests",
      acceptanceCriteria: [
        "Generated records are superseded or invalidated, not destructively deleted.",
        "Payment, consent, audit, and idempotency history is preserved.",
        "Compensation handoff includes operator review refs and customer-safe support copy.",
      ],
      requiredEvidence: [
        "Operator-approved compensation matrix.",
        "Support escalation examples.",
        "Data-preservation proof.",
      ],
      expectedBlockedFlags: [
        "wouldWriteCompensationRows=false",
        "wouldWriteRows=false",
        "wouldEnableWriters=false",
      ],
      forbiddenDuringMatrix: [
        "Writing compensation rows",
        "Deleting history",
        "Changing rollback behavior",
      ],
    }),
    testCase({
      id: "rollout_observability_acceptance",
      category: "rollout_observability",
      title: "Rollout and observability acceptance",
      status: "manual_required",
      testType: "manual_review",
      owner: "operator",
      intent:
        "Define future release approval evidence for canary scope, abort conditions, monitoring, and customer-safe support diagnostics.",
      sourceProposalSectionIds: ["rollout_observability_scaffold"],
      sourceRefs: [
        "docs/writer-rollout-checklist.md",
        "docs/controlled-backend-writers.md",
      ],
      futureTestFiles: ["docs/writer-persistence-rollout-approval.md"],
      futureCommand: "Manual rollout approval only",
      acceptanceCriteria: [
        "Exact writer contracts, environment, audience, feature flags, abort conditions, monitoring, and rollback owner are named.",
        "Blocked-code and support copy avoids raw payloads and secrets.",
        "Adapter success alone does not grant payment entitlement or unlock reports.",
      ],
      requiredEvidence: [
        "Operator rollout approval.",
        "Support playbook approval.",
        "Monitoring and abort condition checklist.",
      ],
      expectedBlockedFlags: [
        "wouldEnableWriters=false",
        "wouldCallStripe=false",
        "wouldUnlockReports=false",
      ],
      forbiddenDuringMatrix: [
        "Enabling writers",
        "Granting entitlements",
        "Unlocking reports",
      ],
    }),
    testCase({
      id: "final_no_go_acceptance",
      category: "final_no_go",
      title: "Final no-go acceptance",
      status: "blocked_by_proposal",
      testType: "manual_review",
      owner: "security",
      intent:
        "Define the final gate that must pass before a later implementation approval packet may exist.",
      sourceProposalSectionIds: [
        "implementation_handoff_scaffold",
        "explicit_non_goals_scaffold",
      ],
      sourceRefs: [
        "docs/writer-persistence-no-go-evidence-packet.md",
        "docs/writer-persistence-implementation-proposal-scaffold.md",
      ],
      futureTestFiles: ["docs/writer-persistence-implementation-approval.md"],
      futureCommand: "Manual security/backend/QA/operator/founder approval only",
      acceptanceCriteria: [
        "No-go evidence is complete.",
        "Acceptance matrix evidence is approved.",
        "Exact implementation branch scope is approved.",
        "Service-role, migration, AI, Stripe, and report unlock changes are separately reviewed.",
      ],
      requiredEvidence: [
        "Security approval.",
        "Backend approval.",
        "QA approval.",
        "Operator approval.",
        "Founder approval.",
      ],
      expectedBlockedFlags: [
        "implementationAcceptanceApproved=false",
        "implementationApprovalPacketAllowed=false",
        "readyForImplementationApprovalPacket=false",
      ],
      forbiddenDuringMatrix: [
        "Creating an implementation approval packet",
        "Creating an implementation branch",
        "Starting adapter implementation",
      ],
    }),
  ];
}

function countByType(
  tests: WriterPersistenceAcceptanceTestCase[],
  testType: WriterPersistenceAcceptanceTestType,
) {
  return tests.filter((test) => test.testType === testType).length;
}

function countByStatus(
  tests: WriterPersistenceAcceptanceTestCase[],
  status: WriterPersistenceAcceptanceTestCase["status"],
) {
  return tests.filter((test) => test.status === status).length;
}

function baseProbeFields(payload: WriterPersistenceAcceptanceTestMatrixPayload) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    matrixMode: payload.matrixMode,
    acceptanceMatrixOnly: true as const,
    sourceProposalAccepted: false as const,
    implementationProposalAllowed: false as const,
    implementationAcceptanceApproved: false as const,
    implementationApprovalPacketAllowed: false as const,
    readyForImplementationApprovalPacket: false as const,
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

export async function buildWriterPersistenceAcceptanceTestMatrix(): Promise<WriterPersistenceAcceptanceTestMatrixPayload> {
  const proposal = await buildWriterPersistenceImplementationProposal();
  const tests = buildTests();

  return {
    safeMode: true,
    readOnly: true,
    matrixMode: "persistence_adapter_acceptance_test_matrix_only",
    sourceProposalMode: proposal.scaffoldMode,
    checkedAt: new Date().toISOString(),
    testCount: tests.length,
    routeInvariantTestCount: countByType(tests, "route_invariant"),
    unitTestCount: countByType(tests, "unit_test"),
    integrationTestCount: countByType(tests, "integration_test"),
    manualReviewCount: countByType(tests, "manual_review"),
    matrixReadyCount: countByStatus(tests, "matrix_ready"),
    blockedTestCount: countByStatus(tests, "blocked_by_proposal"),
    manualRequiredTestCount: countByStatus(tests, "manual_required"),
    sourceProposalSectionCount: proposal.sectionCount,
    sourceProposalBlockedSectionCount: proposal.blockedSectionCount,
    sourceProposalManualRequiredSectionCount:
      proposal.manualRequiredSectionCount,
    acceptanceMatrixReady: true,
    acceptanceMatrixOnly: true,
    sourceProposalScaffoldReady: proposal.proposalScaffoldReady,
    sourceProposalScaffoldOnly: proposal.proposalScaffoldOnly,
    sourceProposalAccepted: false,
    implementationProposalAllowed: false,
    implementationAcceptanceApproved: false,
    implementationApprovalPacketAllowed: false,
    readyForImplementationApprovalPacket: false,
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
    matrixRules: [
      "This matrix is a read-only acceptance map, not executable tests and not implementation approval.",
      "It may name future test files and commands, but it must not create files or run tests.",
      "Every acceptance item must trace back to proposal scaffold sections and existing no-go evidence.",
      "Passing this matrix in the future must still require separate approval before implementation branches, service-role access, migrations, transactions, writes, AI, Stripe, or report unlocks are allowed.",
    ],
    approvalGates: [
      "Proposal scaffold accepted by named owners.",
      "All matrix items have evidence and owner approval.",
      "No-go evidence complete and security-approved.",
      "Schema, service-role isolation, idempotency, audit redaction, compensation, rollout, and observability checks are mapped to future tests or manual review.",
      "Implementation approval packet explicitly names exact branch scope, files, tests, rollback, and rollout conditions.",
    ],
    tests,
  };
}

export async function probeWriterPersistenceAcceptanceTestMatrix(
  requestBody: unknown,
): Promise<WriterPersistenceAcceptanceTestMatrixProbeResult> {
  const payload = await buildWriterPersistenceAcceptanceTestMatrix();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence acceptance test matrix probe blocked: request body must be a JSON object and no test files or implementation approval packet were created.",
      tests: payload.tests,
    };
  }

  const testId = (requestBody as { testId?: unknown }).testId;

  if (typeof testId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence acceptance test matrix probe blocked: testId must be a string and no test files or implementation approval packet were created.",
      tests: payload.tests,
    };
  }

  const selectedTest = payload.tests.find((test) => test.id === testId);

  if (!selectedTest) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence acceptance test matrix probe blocked: unknown test id and no test files or implementation approval packet were created.",
      tests: payload.tests,
    };
  }

  return {
    ...baseProbeFields(payload),
    testId: selectedTest.id,
    testTitle: selectedTest.title,
    testStatus: selectedTest.status,
    summary:
      "Persistence acceptance test matrix probe blocked as designed: the selected future test row was returned, but no test file, automated test run, implementation approval packet, branch, adapter code, service-role client, transaction, migration, row write, AI call, Stripe call, or report unlock was created.",
    tests: [selectedTest],
  };
}
