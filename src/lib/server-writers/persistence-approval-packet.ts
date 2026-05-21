import "server-only";

import { buildWriterPersistenceAcceptanceTestMatrix } from "@/lib/server-writers/persistence-acceptance-tests";
import type {
  WriterPersistenceApprovalPacketItem,
  WriterPersistenceApprovalPacketOwner,
  WriterPersistenceApprovalPacketPayload,
  WriterPersistenceApprovalPacketProbeResult,
  WriterPersistenceApprovalPacketStatus,
} from "@/types/writer-persistence-approval-packet";

const blockedCodes = [
  "approval_packet_only",
  "acceptance_matrix_not_approved",
  "owner_approval_recording_forbidden",
  "implementation_approval_forbidden",
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
  wouldRecordOwnerApproval: false,
  wouldGrantImplementationApproval: false,
  wouldCreateApprovalRecord: false,
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

function item(
  input: WriterPersistenceApprovalPacketItem,
): WriterPersistenceApprovalPacketItem {
  return input;
}

function buildItems(): WriterPersistenceApprovalPacketItem[] {
  return [
    item({
      id: "founder_scope_lock_approval",
      category: "scope_lock",
      title: "Founder scope lock approval",
      status: "packet_ready",
      owner: "founder",
      decision:
        "Confirm the future implementation is limited to audit/idempotency persistence infrastructure and does not expand product generation scope.",
      sourceAcceptanceTestIds: ["scope_boundary_acceptance"],
      sourceRefs: [
        "docs/controlled-backend-writers.md",
        "docs/writer-persistence-acceptance-test-matrix.md",
      ],
      requiredEvidence: [
        "Founder accepts the narrow adapter scope.",
        "No target writer body for agents, reports, payments, consent, or simulations is included.",
        "No hidden relationship-weight editor or CRM-style graph mutation enters this implementation scope.",
      ],
      approvalQuestions: [
        "Is the implementation limited to audit/idempotency orchestration only?",
        "Are AI generation, Stripe, report unlock, and product simulation writes still out of scope?",
      ],
      blockingConditions: [
        "Any product-generation writer is added to the approval packet.",
        "Any payment entitlement or report unlock path is bundled into the adapter work.",
      ],
      nonApprovalClauses: [
        "This item does not authorize implementation.",
        "This item does not authorize branch creation.",
        "This item does not authorize real database writes.",
      ],
      futureArtifacts: ["docs/writer-persistence-implementation-scope-lock.md"],
    }),
    item({
      id: "backend_branch_scope_approval",
      category: "branch_scope",
      title: "Backend branch scope approval",
      status: "blocked_by_acceptance",
      owner: "backend",
      decision:
        "Approve a future branch scope only after the acceptance matrix and no-go evidence are complete.",
      sourceAcceptanceTestIds: [
        "proposal_route_invariant_acceptance",
        "phase_order_acceptance",
        "final_no_go_acceptance",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-proposal-scaffold.md",
        "docs/writer-persistence-acceptance-test-matrix.md",
      ],
      requiredEvidence: [
        "Exact future file list is named.",
        "Automated and manual verification commands are named.",
        "Branch scope excludes migrations, service-role secrets, AI, Stripe, and report unlock unless separately approved.",
      ],
      approvalQuestions: [
        "Which future files are allowed to change?",
        "Which files are explicitly forbidden in the first implementation branch?",
        "Which command proves the branch is still inert before any write path is enabled?",
      ],
      blockingConditions: [
        "No-go evidence remains incomplete.",
        "Acceptance matrix items remain unapproved.",
        "The file list includes privileged client creation or SQL changes.",
      ],
      nonApprovalClauses: [
        "This packet names future branch scope but does not create a branch.",
        "This packet does not create implementation code.",
      ],
      futureArtifacts: [
        "docs/writer-persistence-implementation-branch-scope.md",
        "src/lib/server-writers/persistence-adapter.server.ts",
      ],
    }),
    item({
      id: "security_service_role_boundary_approval",
      category: "service_role_security",
      title: "Security service-role boundary approval",
      status: "blocked_by_acceptance",
      owner: "security",
      decision:
        "Approve the future privileged boundary only after bundle exclusion, secret redaction, and server-only import checks exist.",
      sourceAcceptanceTestIds: ["server_only_boundary_acceptance"],
      sourceRefs: [
        "docs/service-role-isolation-test-harness.md",
        "docs/disabled-service-role-adapter.md",
      ],
      requiredEvidence: [
        "Client components cannot import privileged adapter modules.",
        "No privileged key, provider credential, auth token, raw payload, or private narrative is serialized.",
        "Server-only modules remain inert until writer flags and manual approvals are complete.",
      ],
      approvalQuestions: [
        "Can privileged code reach a browser bundle?",
        "Can any response expose secret-like values or auth token markers?",
        "Does the future adapter fail closed when privileged config is missing?",
      ],
      blockingConditions: [
        "A service-role client factory exists before explicit approval.",
        "Any route reads privileged secrets in this stage.",
        "Any response includes secret-like value material.",
      ],
      nonApprovalClauses: [
        "This packet does not create a service-role client.",
        "This packet does not read or validate privileged secrets.",
      ],
      futureArtifacts: [
        "src/lib/server-writers/service-role-client.server.ts",
        "src/lib/server-writers/persistence-server-boundary.test.ts",
      ],
    }),
    item({
      id: "qa_acceptance_evidence_approval",
      category: "test_evidence",
      title: "QA acceptance evidence approval",
      status: "manual_required",
      owner: "qa",
      decision:
        "Confirm future route invariant, unit, integration, and manual review evidence before implementation approval can be granted.",
      sourceAcceptanceTestIds: [
        "proposal_route_invariant_acceptance",
        "phase_order_acceptance",
        "idempotency_behavior_acceptance",
        "audit_redaction_acceptance",
      ],
      sourceRefs: [
        "docs/mvp-qa-environment.md",
        "docs/writer-persistence-acceptance-test-matrix.md",
      ],
      requiredEvidence: [
        "Route invariant checks for all read-only gates.",
        "Future unit tests for phase order, idempotency behavior, audit redaction, and compensation handoff.",
        "Future integration evidence for server-only boundaries and schema readiness.",
      ],
      approvalQuestions: [
        "Do all future tests trace back to an acceptance matrix item?",
        "Can the tests run without production credentials?",
        "Do negative assertions cover database writes, branch creation, AI, Stripe, and report unlocks?",
      ],
      blockingConditions: [
        "A test requires privileged production credentials.",
        "A test creates rows before the persistence adapter is approved.",
        "A test passes while dangerous flags are true.",
      ],
      nonApprovalClauses: [
        "This packet does not create test files.",
        "This packet does not run automated tests.",
      ],
      futureArtifacts: [
        "src/lib/server-writers/persistence-adapter.test.ts",
        "src/lib/server-writers/persistence-adapter.integration.test.ts",
      ],
    }),
    item({
      id: "security_audit_redaction_approval",
      category: "audit_redaction",
      title: "Security audit redaction approval",
      status: "manual_required",
      owner: "security",
      decision:
        "Approve the future audit field map only after redaction fixtures prove sensitive source material is absent.",
      sourceAcceptanceTestIds: ["audit_redaction_acceptance"],
      sourceRefs: [
        "docs/request-hashing-redaction-fixtures.md",
        "docs/writer-audit-event-model.md",
      ],
      requiredEvidence: [
        "Audit records use request hashes, lifecycle labels, blocked codes, evidence refs, and target refs only.",
        "Raw prompts, private user narrative, provider payloads, payment payloads, auth material, and privileged values are absent.",
        "Audit append failure blocks high-impact writer execution.",
      ],
      approvalQuestions: [
        "Which audit fields are allowed?",
        "Which fields are explicitly forbidden?",
        "What happens if audit persistence fails before a target writer runs?",
      ],
      blockingConditions: [
        "Raw payload storage is introduced.",
        "Sensitive source text is persisted for debugging.",
        "Audit failure allows high-impact writes to continue.",
      ],
      nonApprovalClauses: [
        "This packet does not persist audit evidence.",
        "This packet does not write audit rows.",
      ],
      futureArtifacts: [
        "src/lib/server-writers/persistence-audit.server.ts",
        "src/lib/server-writers/persistence-audit.test.ts",
      ],
    }),
    item({
      id: "backend_idempotency_transaction_approval",
      category: "idempotency_transaction",
      title: "Backend idempotency and transaction approval",
      status: "manual_required",
      owner: "backend",
      decision:
        "Approve future replay, conflict, finalize, and failure behavior before idempotency reservation can exist.",
      sourceAcceptanceTestIds: [
        "phase_order_acceptance",
        "idempotency_behavior_acceptance",
      ],
      sourceRefs: [
        "docs/writer-idempotency-registry-model.md",
        "docs/writer-persistence-adapter-design.md",
      ],
      requiredEvidence: [
        "Same key plus same hash is replay-safe.",
        "Same key plus different hash blocks before target writes.",
        "Phase order is preflight, reservation, audit attempt, future writer body, audit result, finalize, compensation handoff.",
        "Failure and expiration states cannot duplicate target writes.",
      ],
      approvalQuestions: [
        "Is reservation before any high-impact target writer?",
        "How are conflict, failed, expired, and replay states finalized?",
        "What transaction boundary is allowed in the first implementation branch?",
      ],
      blockingConditions: [
        "Idempotency reservation is attempted after target writes.",
        "Different request hashes can share a completed key.",
        "Failure states can duplicate target rows.",
      ],
      nonApprovalClauses: [
        "This packet does not reserve idempotency keys.",
        "This packet does not open transactions.",
      ],
      futureArtifacts: [
        "src/lib/server-writers/persistence-idempotency.server.ts",
        "src/lib/server-writers/persistence-idempotency.test.ts",
      ],
    }),
    item({
      id: "operator_rollback_compensation_approval",
      category: "rollback_compensation",
      title: "Operator rollback and compensation approval",
      status: "manual_required",
      owner: "operator",
      decision:
        "Approve future data-preserving compensation rules before failed or unsafe writer outcomes can be handled by code.",
      sourceAcceptanceTestIds: ["rollback_compensation_acceptance"],
      sourceRefs: [
        "docs/writer-rollback-compensation-model.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      requiredEvidence: [
        "Generated records are superseded or invalidated instead of destructively deleted.",
        "Payment, consent, audit, and idempotency history is preserved.",
        "Operator review refs and customer-safe support copy are defined.",
      ],
      approvalQuestions: [
        "Which records can be superseded?",
        "Which records must never be deleted?",
        "Who owns customer support escalation after a compensation event?",
      ],
      blockingConditions: [
        "Rollback deletes audit, payment, consent, or idempotency history.",
        "Compensation is automatic without operator review for ambiguous outcomes.",
      ],
      nonApprovalClauses: [
        "This packet does not write compensation rows.",
        "This packet does not change rollback behavior.",
      ],
      futureArtifacts: [
        "src/lib/server-writers/persistence-compensation.server.ts",
        "docs/writer-persistence-compensation-approval.md",
      ],
    }),
    item({
      id: "operator_rollout_observability_approval",
      category: "rollout_observability",
      title: "Operator rollout and observability approval",
      status: "manual_required",
      owner: "operator",
      decision:
        "Approve future rollout conditions, monitoring signals, abort rules, and support diagnostics before writers can be enabled.",
      sourceAcceptanceTestIds: ["rollout_observability_acceptance"],
      sourceRefs: [
        "docs/writer-rollout-checklist.md",
        "docs/controlled-backend-writers.md",
      ],
      requiredEvidence: [
        "Exact writer contract allowlist, environment, canary audience, and feature flags are named.",
        "Abort conditions and rollback owner are named.",
        "Support diagnostics avoid raw payloads and secrets.",
        "Adapter success alone does not grant payment entitlement or unlock reports.",
      ],
      approvalQuestions: [
        "Which users are included in the first canary?",
        "Which metric or blocked-code pattern aborts rollout?",
        "Who is accountable for rollback decisions?",
      ],
      blockingConditions: [
        "Writers can be enabled without a named canary.",
        "Report unlock or payment entitlement is tied directly to adapter success.",
        "Support diagnostics expose sensitive input material.",
      ],
      nonApprovalClauses: [
        "This packet does not enable writers.",
        "This packet does not grant entitlements.",
        "This packet does not unlock reports.",
      ],
      futureArtifacts: [
        "docs/writer-persistence-rollout-approval.md",
        "src/lib/server-writers/persistence-observability.server.ts",
      ],
    }),
    item({
      id: "backend_migration_boundary_approval",
      category: "migration_boundary",
      title: "Backend migration boundary approval",
      status: "blocked_by_acceptance",
      owner: "backend",
      decision:
        "Confirm the first adapter implementation branch does not create or apply SQL unless a separate migration review is approved.",
      sourceAcceptanceTestIds: [
        "proposal_route_invariant_acceptance",
        "final_no_go_acceptance",
      ],
      sourceRefs: [
        "docs/writer-migration-review-checklist.md",
        "docs/writer-migration-application-runbook.md",
      ],
      requiredEvidence: [
        "Existing migration handoff remains manual.",
        "No new migration file is created by the adapter approval packet.",
        "Schema verification remains read-only.",
      ],
      approvalQuestions: [
        "Does the branch need schema changes?",
        "If schema changes are needed, are they split into a separate reviewed migration path?",
        "Can local safe mode prove no SQL is applied?",
      ],
      blockingConditions: [
        "The implementation branch includes SQL file creation.",
        "The implementation branch applies migrations automatically.",
        "Schema verification mutates database state.",
      ],
      nonApprovalClauses: [
        "This packet does not create migration files.",
        "This packet does not apply SQL.",
      ],
      futureArtifacts: ["docs/writer-persistence-migration-boundary.md"],
    }),
    item({
      id: "final_implementation_no_go_approval",
      category: "final_no_go",
      title: "Final implementation no-go approval",
      status: "blocked_by_acceptance",
      owner: "founder",
      decision:
        "Keep the final implementation gate blocked until all named owners approve evidence, scope, rollout, rollback, and security boundaries.",
      sourceAcceptanceTestIds: ["final_no_go_acceptance"],
      sourceRefs: [
        "docs/writer-persistence-no-go-evidence-packet.md",
        "docs/writer-persistence-acceptance-test-matrix.md",
      ],
      requiredEvidence: [
        "Founder, backend, security, QA, and operator approvals are complete.",
        "No-go evidence is complete.",
        "Acceptance matrix evidence is complete.",
        "Branch preflight checklist is complete.",
      ],
      approvalQuestions: [
        "Are all owner approvals present?",
        "Is the branch scope exact and narrow?",
        "Are service-role, migration, AI, Stripe, and report unlock changes separated?",
      ],
      blockingConditions: [
        "Any owner approval is missing.",
        "Any acceptance item is unresolved.",
        "Any dangerous side effect is bundled into this packet.",
      ],
      nonApprovalClauses: [
        "This packet is not final implementation approval.",
        "This packet does not create an approval record.",
        "This packet does not start implementation.",
      ],
      futureArtifacts: [
        "docs/writer-persistence-implementation-branch-preflight.md",
      ],
    }),
  ];
}

function countByStatus(
  items: WriterPersistenceApprovalPacketItem[],
  status: WriterPersistenceApprovalPacketStatus,
) {
  return items.filter((currentItem) => currentItem.status === status).length;
}

function countByOwner(
  items: WriterPersistenceApprovalPacketItem[],
  owner: WriterPersistenceApprovalPacketOwner,
) {
  return items.filter((currentItem) => currentItem.owner === owner).length;
}

function baseProbeFields(payload: WriterPersistenceApprovalPacketPayload) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    approvalPacketMode: payload.approvalPacketMode,
    approvalPacketOnly: true as const,
    sourceAcceptanceMatrixApproved: false as const,
    implementationApprovalPacketAccepted: false as const,
    implementationApprovalGranted: false as const,
    implementationBranchApproved: false as const,
    implementationPlanApproved: false as const,
    readyToCreateImplementationBranch: false as const,
    readyForAdapterImplementation: false as const,
    schemaVerified: false as const,
    adapterImplemented: false as const,
    adapterImplementationApproved: false as const,
    adapterImplementationAllowed: false as const,
    implementationReviewComplete: false as const,
    allOwnerApprovalsComplete: false as const,
    allBlockingEvidenceReady: false as const,
    ...runtimeBlockedFlags,
    blockedCodes: payload.blockedCodes,
  };
}

export async function buildWriterPersistenceApprovalPacket(): Promise<WriterPersistenceApprovalPacketPayload> {
  const matrix = await buildWriterPersistenceAcceptanceTestMatrix();
  const items = buildItems();

  return {
    safeMode: true,
    readOnly: true,
    approvalPacketMode: "persistence_adapter_implementation_approval_packet_only",
    sourceAcceptanceMatrixMode: matrix.matrixMode,
    checkedAt: new Date().toISOString(),
    approvalItemCount: items.length,
    packetReadyItemCount: countByStatus(items, "packet_ready"),
    blockedItemCount: countByStatus(items, "blocked_by_acceptance"),
    manualRequiredItemCount: countByStatus(items, "manual_required"),
    founderItemCount: countByOwner(items, "founder"),
    backendItemCount: countByOwner(items, "backend"),
    securityItemCount: countByOwner(items, "security"),
    qaItemCount: countByOwner(items, "qa"),
    operatorItemCount: countByOwner(items, "operator"),
    sourceAcceptanceTestCount: matrix.testCount,
    sourceAcceptanceBlockedTestCount: matrix.blockedTestCount,
    sourceAcceptanceManualRequiredTestCount: matrix.manualRequiredTestCount,
    approvalPacketReady: true,
    approvalPacketOnly: true,
    sourceAcceptanceMatrixReady: matrix.acceptanceMatrixReady,
    sourceAcceptanceMatrixOnly: matrix.acceptanceMatrixOnly,
    sourceAcceptanceMatrixApproved: false,
    implementationApprovalPacketAccepted: false,
    implementationApprovalGranted: false,
    implementationBranchApproved: false,
    implementationPlanApproved: false,
    readyToCreateImplementationBranch: false,
    readyForAdapterImplementation: false,
    schemaVerified: false,
    adapterImplemented: false,
    adapterImplementationApproved: false,
    adapterImplementationAllowed: false,
    implementationReviewComplete: false,
    allOwnerApprovalsComplete: false,
    allBlockingEvidenceReady: false,
    ...runtimeBlockedFlags,
    blockedCodes,
    packetRules: [
      "This packet is a read-only approval checklist, not an approval record.",
      "It may name future owners, decisions, evidence, branch scope, and artifacts, but it must not record approvals or create implementation work.",
      "Source acceptance matrix evidence remains unapproved, so implementation approval, branch creation, service-role access, migrations, transactions, writes, AI, Stripe, and report unlocks stay blocked.",
      "Every future approval must remain owner-specific and auditable before a later implementation branch preflight can exist.",
    ],
    finalApprovalGates: [
      "Founder accepts the narrow infrastructure-only scope.",
      "Backend approves exact future branch scope and phase order.",
      "Security approves server-only boundaries and audit redaction.",
      "QA approves acceptance evidence and negative assertions.",
      "Operator approves rollback, compensation, rollout, monitoring, and support diagnostics.",
      "Migration, service-role, AI, Stripe, and report unlock changes are separated into their own reviewed paths.",
    ],
    items,
  };
}

export async function probeWriterPersistenceApprovalPacket(
  requestBody: unknown,
): Promise<WriterPersistenceApprovalPacketProbeResult> {
  const payload = await buildWriterPersistenceApprovalPacket();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence approval packet probe blocked: request body must be a JSON object and no owner approval was recorded.",
      items: payload.items,
    };
  }

  const approvalId = (requestBody as { approvalId?: unknown }).approvalId;

  if (typeof approvalId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence approval packet probe blocked: approvalId must be a string and no owner approval was recorded.",
      items: payload.items,
    };
  }

  const selectedItem = payload.items.find((candidate) => candidate.id === approvalId);

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence approval packet probe blocked: unknown approval id and no owner approval was recorded.",
      items: payload.items,
    };
  }

  return {
    ...baseProbeFields(payload),
    approvalId: selectedItem.id,
    approvalTitle: selectedItem.title,
    approvalStatus: selectedItem.status,
    summary:
      "Persistence approval packet probe blocked as designed: the selected approval requirement was returned, but no approval record, implementation approval, branch, adapter code, service-role client, transaction, migration, row write, AI call, Stripe call, or report unlock was created.",
    items: [selectedItem],
  };
}
