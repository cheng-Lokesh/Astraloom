import "server-only";

import { buildWriterPersistenceOwnerSignoff } from "@/lib/server-writers/persistence-owner-signoff";
import type {
  WriterPersistenceReleaseNoGoItem,
  WriterPersistenceReleaseNoGoPayload,
  WriterPersistenceReleaseNoGoProbeResult,
  WriterPersistenceReleaseNoGoStatus,
} from "@/types/writer-persistence-release-no-go";

const blockedCodes = [
  "release_no_go_packet_only",
  "owner_signoff_not_complete",
  "owner_approval_record_forbidden",
  "release_go_decision_forbidden",
  "release_approval_forbidden",
  "feature_flag_enablement_forbidden",
  "production_deployment_forbidden",
  "production_writer_execution_forbidden",
  "patch_review_acceptance_forbidden",
  "real_patch_review_forbidden",
  "patch_acceptance_forbidden",
  "patch_generation_forbidden",
  "patch_application_forbidden",
  "file_creation_forbidden",
  "file_modification_forbidden",
  "test_creation_forbidden",
  "git_command_forbidden",
  "branch_creation_forbidden",
  "pull_request_forbidden",
  "adapter_code_forbidden",
  "service_role_client_forbidden",
  "transaction_forbidden",
  "database_writes_forbidden",
  "migration_creation_forbidden",
  "ai_stripe_report_side_effects_forbidden",
];

const runtimeBlockedFlags = {
  allRuntimeEffectsBlocked: true,
  wouldAcceptReleaseNoGo: false,
  wouldRecordGoDecision: false,
  wouldGrantReleaseApproval: false,
  wouldEnableFeatureFlag: false,
  wouldDeployCode: false,
  wouldRunProductionWriter: false,
  wouldCollectSignature: false,
  wouldRecordOwnerApproval: false,
  wouldGrantImplementationApproval: false,
  wouldCreateApprovalRecord: false,
  wouldAcceptPatchReview: false,
  wouldReviewRealPatch: false,
  wouldAcceptPatch: false,
  wouldGeneratePatch: false,
  wouldApplyPatch: false,
  wouldModifyFiles: false,
  wouldCreateFiles: false,
  wouldDeleteFiles: false,
  wouldRunGitCommand: false,
  wouldCreateBranch: false,
  wouldCheckoutBranch: false,
  wouldCreatePullRequest: false,
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

function releaseItem(
  input: WriterPersistenceReleaseNoGoItem,
): WriterPersistenceReleaseNoGoItem {
  return input;
}

function buildReleaseItems(): WriterPersistenceReleaseNoGoItem[] {
  return [
    releaseItem({
      id: "source_owner_signoff_invariant_release_no_go",
      category: "source_owner_signoff_invariant",
      title: "Source owner signoff invariant release no-go",
      status: "blocked_by_owner_signoff",
      owner: "founder",
      intent:
        "Carry forward the owner signoff packet as an unaccepted source, so release review cannot treat it as permission to implement.",
      sourceSignoffItemIds: [
        "source_patch_review_invariant_signoff",
        "final_owner_signoff_no_go",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-owner-signoff.md",
        "docs/writer-persistence-implementation-patch-review.md",
      ],
      blockerSummary:
        "The owner signoff packet is descriptive only; no owner signoff has been recorded and no patch review has been accepted.",
      requiredEvidence: [
        "Source owner signoff still reports ownerSignoffPacketOnly=true.",
        "Source owner signoff still reports ownerSignoffComplete=false.",
        "Source owner signoff still reports ownerSignoffRecorded=false.",
      ],
      releaseQuestions: [
        "Does the release packet avoid converting an owner signoff packet into approval?",
        "Are all owner signoff outputs still evidence-only?",
      ],
      noGoDecisionRules: [
        "If owner signoff is not complete, release remains no-go.",
        "If patch review is not accepted, release remains no-go.",
      ],
      forbiddenActions: [
        "recording owner approval from this packet",
        "accepting the source owner signoff as approval",
        "granting implementation approval",
      ],
      nonExecutionClauses: [
        "This item does not accept owner signoff.",
        "This item does not record a release decision.",
      ],
      futureHumanArtifacts: [
        "owner signoff evidence checksum",
        "human signoff record location",
        "unresolved owner lane register",
      ],
    }),
    releaseItem({
      id: "unresolved_owner_lane_release_blocker",
      category: "owner_lane_blocker",
      title: "Unresolved owner lane release blocker",
      status: "release_blocker",
      owner: "founder",
      intent:
        "Make every unresolved owner lane visible before any future implementation work can move toward a release decision.",
      sourceSignoffItemIds: [
        "founder_scope_signoff_packet",
        "security_boundary_signoff_packet",
        "backend_phase_order_signoff_packet",
        "qa_negative_test_signoff_packet",
        "operator_compensation_signoff_packet",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-owner-signoff.md",
        "docs/writer-persistence-implementation-approval-packet.md",
      ],
      blockerSummary:
        "Founder, security, backend, QA, and operator lanes still require manual human decisions outside the app.",
      requiredEvidence: [
        "Each owner lane has a named accountable owner.",
        "No lane has been replaced by an automated route response.",
        "No lane can independently approve release execution.",
      ],
      releaseQuestions: [
        "Which owner lanes remain unresolved?",
        "Can any owner lane override another lane without written human evidence?",
      ],
      noGoDecisionRules: [
        "If any required owner lane is unresolved, release remains no-go.",
        "If any lane delegates approval to code, release remains no-go.",
      ],
      forbiddenActions: [
        "allowing one owner lane to bypass another",
        "recording owner approval in this endpoint",
        "using route 200 as a signoff artifact",
      ],
      nonExecutionClauses: [
        "This item does not collect signatures.",
        "This item does not store approval records.",
      ],
      futureHumanArtifacts: [
        "owner lane decision table",
        "named approver roster",
        "cross-lane veto register",
      ],
    }),
    releaseItem({
      id: "security_boundary_release_blocker",
      category: "security_release_blocker",
      title: "Security boundary release blocker",
      status: "release_blocker",
      owner: "security",
      intent:
        "Block release until server-only isolation, credential containment, and response redaction are reviewed with real implementation evidence.",
      sourceSignoffItemIds: [
        "security_boundary_signoff_packet",
        "data_protection_signoff_packet",
      ],
      sourceRefs: [
        "docs/service-role-isolation-test-harness.md",
        "docs/request-hashing-redaction-fixtures.md",
        "docs/writer-persistence-implementation-owner-signoff.md",
      ],
      blockerSummary:
        "No real implementation exists, so security cannot confirm privileged boundary behavior under production-like execution.",
      requiredEvidence: [
        "Client bundles exclude server-only implementation modules.",
        "No privileged credential is read or serialized by review endpoints.",
        "Raw prompts, provider payloads, and private debug bodies remain excluded.",
      ],
      releaseQuestions: [
        "Can the future implementation run without exposing service-role material?",
        "Do negative tests prove private payloads cannot escape?",
      ],
      noGoDecisionRules: [
        "If privileged credentials are required for local review, release remains no-go.",
        "If any response can expose private payloads, release remains no-go.",
      ],
      forbiddenActions: [
        "creating a service-role client",
        "reading privileged secrets",
        "serializing credential-like values",
      ],
      nonExecutionClauses: [
        "This item does not create a privileged client.",
        "This item does not read privileged secrets.",
      ],
      futureHumanArtifacts: [
        "security release review",
        "server-only bundle report",
        "redaction negative test report",
      ],
    }),
    releaseItem({
      id: "backend_phase_order_release_blocker",
      category: "backend_release_blocker",
      title: "Backend phase order release blocker",
      status: "release_blocker",
      owner: "backend",
      intent:
        "Block release until real implementation evidence proves preflight, idempotency, target write, audit, finalize, and compensation order.",
      sourceSignoffItemIds: [
        "backend_phase_order_signoff_packet",
        "signoff_record_no_write_packet",
      ],
      sourceRefs: [
        "docs/writer-persistence-adapter-design.md",
        "docs/writer-idempotency-registry-model.md",
        "docs/writer-audit-event-model.md",
      ],
      blockerSummary:
        "The current system defines phase order but has no executable adapter that can be reviewed under failure scenarios.",
      requiredEvidence: [
        "Idempotency reservation precedes target writer side effects.",
        "Audit append behavior fails closed for high-impact writes.",
        "Ambiguous outcomes are handed to operator compensation.",
      ],
      releaseQuestions: [
        "Does the future implementation preserve the documented phase sequence?",
        "What happens when target write succeeds but audit finalize fails?",
      ],
      noGoDecisionRules: [
        "If phase order differs from the adapter design, release remains no-go.",
        "If ambiguous outcomes lack an operator handoff, release remains no-go.",
      ],
      forbiddenActions: [
        "opening transactions from this packet",
        "importing real writer implementations",
        "running target writes before idempotency reservation",
      ],
      nonExecutionClauses: [
        "This item does not implement orchestration.",
        "This item does not run transactions.",
      ],
      futureHumanArtifacts: [
        "backend phase-order release review",
        "failure mode walkthrough",
        "operator handoff trace",
      ],
    }),
    releaseItem({
      id: "qa_negative_test_release_blocker",
      category: "qa_release_blocker",
      title: "QA negative test release blocker",
      status: "manual_required",
      owner: "qa",
      intent:
        "Define the QA proof needed before implementation work can be considered for release, while keeping this stage from creating tests.",
      sourceSignoffItemIds: ["qa_negative_test_signoff_packet"],
      sourceRefs: [
        "docs/writer-persistence-acceptance-test-matrix.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      blockerSummary:
        "Acceptance criteria exist, but no real implementation tests or mutation-safe negative test run exists.",
      requiredEvidence: [
        "Every dangerous runtime flag has a negative assertion.",
        "Tests can run locally without remote mutation or production credentials.",
        "Failure cases cover writes, SQL, AI, Stripe, reports, secrets, and raw payloads.",
      ],
      releaseQuestions: [
        "Do tests fail if any dangerous runtime flag becomes true?",
        "Can QA reproduce results without remote state mutation?",
      ],
      noGoDecisionRules: [
        "If negative tests are missing, release remains no-go.",
        "If tests require production credentials, release remains no-go.",
      ],
      forbiddenActions: [
        "creating test files in this packet",
        "running automated tests as release approval",
        "mutating remote state for QA convenience",
      ],
      nonExecutionClauses: [
        "This item does not create test files.",
        "This item does not run automated tests.",
      ],
      futureHumanArtifacts: [
        "QA release checklist",
        "negative assertion report",
        "local-only test evidence",
      ],
    }),
    releaseItem({
      id: "schema_migration_release_blocker",
      category: "migration_release_blocker",
      title: "Schema and migration release blocker",
      status: "release_blocker",
      owner: "backend",
      intent:
        "Block release until audit/idempotency schema changes are explicitly approved, applied manually, and verified outside this endpoint.",
      sourceSignoffItemIds: [
        "backend_phase_order_signoff_packet",
        "data_protection_signoff_packet",
      ],
      sourceRefs: [
        "docs/writer-migration-review-checklist.md",
        "docs/writer-migration-application-runbook.md",
        "docs/writer-applied-schema-verification-harness.md",
      ],
      blockerSummary:
        "No writer audit or idempotency migration has been approved, applied, or verified for production writer use.",
      requiredEvidence: [
        "A real migration file is approved by humans before application.",
        "Manual SQL execution has a rollback and abort plan.",
        "Applied schema verification proves expected tables and RLS state.",
      ],
      releaseQuestions: [
        "Who approves the migration before it reaches SQL Editor?",
        "How is applied schema verified without app-side mutation?",
      ],
      noGoDecisionRules: [
        "If schema is not verified, release remains no-go.",
        "If migration approval is missing, release remains no-go.",
      ],
      forbiddenActions: [
        "creating migration files from this packet",
        "applying SQL from this packet",
        "creating tables from this packet",
      ],
      nonExecutionClauses: [
        "This item does not create migration files.",
        "This item does not apply SQL.",
      ],
      futureHumanArtifacts: [
        "migration approval record",
        "manual SQL execution log",
        "post-application schema verification",
      ],
    }),
    releaseItem({
      id: "runtime_write_release_blocker",
      category: "runtime_write_blocker",
      title: "Runtime write release blocker",
      status: "release_blocker",
      owner: "backend",
      intent:
        "Keep every runtime write path blocked until implementation, schema, idempotency, audit, and owner approval evidence are all complete.",
      sourceSignoffItemIds: [
        "backend_phase_order_signoff_packet",
        "signoff_record_no_write_packet",
      ],
      sourceRefs: [
        "docs/writer-persistence-dry-run-gate.md",
        "docs/writer-persistence-adapter-design.md",
        "docs/writer-persistence-implementation-owner-signoff.md",
      ],
      blockerSummary:
        "No audit row write, idempotency reservation, compensation write, target write, or evidence persistence is allowed.",
      requiredEvidence: [
        "Audit append, idempotency reservation, target write, finalize, and compensation behavior are separately approved.",
        "Idempotency conflicts block target writer side effects.",
        "No runtime path can write with missing schema verification.",
      ],
      releaseQuestions: [
        "Which writes are allowed in the first controlled release?",
        "What exact flag or owner decision enables each write path?",
      ],
      noGoDecisionRules: [
        "If any write path is not explicitly approved, release remains no-go.",
        "If idempotency is advisory instead of blocking, release remains no-go.",
      ],
      forbiddenActions: [
        "writing rows",
        "writing audit rows",
        "reserving idempotency keys",
        "writing compensation rows",
      ],
      nonExecutionClauses: [
        "This item does not write rows.",
        "This item does not reserve idempotency keys.",
      ],
      futureHumanArtifacts: [
        "writer enablement matrix",
        "idempotency conflict review",
        "audit append failure review",
      ],
    }),
    releaseItem({
      id: "data_protection_release_blocker",
      category: "data_protection_blocker",
      title: "Data protection release blocker",
      status: "manual_required",
      owner: "data_protection",
      intent:
        "Require a human review of all future persisted fields before any audit, idempotency, evidence, or support record can store data.",
      sourceSignoffItemIds: ["data_protection_signoff_packet"],
      sourceRefs: [
        "docs/request-hashing-redaction-fixtures.md",
        "docs/writer-evidence-handoff-fixtures.md",
        "docs/writer-audit-event-model.md",
      ],
      blockerSummary:
        "Allowed field inventories are still design artifacts; no human has approved a production persistence field list.",
      requiredEvidence: [
        "Persisted fields exclude raw prompts, narratives, provider payloads, and private debug bodies.",
        "Request hashes and safe refs are sufficient for audit and support workflows.",
        "Support copy excludes private payloads and credential-like values.",
      ],
      releaseQuestions: [
        "Are all future persisted fields explicitly allowed?",
        "Can support investigate failures without raw private payloads?",
      ],
      noGoDecisionRules: [
        "If raw private payload storage is possible, release remains no-go.",
        "If support evidence needs unredacted payloads, release remains no-go.",
      ],
      forbiddenActions: [
        "persisting raw payloads",
        "storing secrets",
        "returning provider payloads in support copy",
      ],
      nonExecutionClauses: [
        "This item does not persist evidence.",
        "This item does not store raw payloads.",
      ],
      futureHumanArtifacts: [
        "allowed field inventory",
        "data protection review note",
        "support-safe evidence sample",
      ],
    }),
    releaseItem({
      id: "operator_compensation_release_blocker",
      category: "operator_compensation_blocker",
      title: "Operator compensation release blocker",
      status: "manual_required",
      owner: "operator",
      intent:
        "Require operator readiness for ambiguous outcomes, support escalation, and non-destructive compensation before release.",
      sourceSignoffItemIds: ["operator_compensation_signoff_packet"],
      sourceRefs: [
        "docs/writer-rollback-compensation-model.md",
        "docs/writer-persistence-no-go-evidence-packet.md",
      ],
      blockerSummary:
        "Compensation and escalation policy is described but has not been accepted as an operational release process.",
      requiredEvidence: [
        "Ambiguous outcomes route to operator review.",
        "Protected audit, payment, and consent history is never deleted.",
        "Support-safe customer copy exists for failed or ambiguous writes.",
      ],
      releaseQuestions: [
        "Who is paged when a write outcome is ambiguous?",
        "Which records are superseded instead of deleted?",
      ],
      noGoDecisionRules: [
        "If ambiguous outcomes can auto-compensate, release remains no-go.",
        "If protected records can be destructively deleted, release remains no-go.",
      ],
      forbiddenActions: [
        "automatic compensation for ambiguous outcomes",
        "destructive deletion of protected history",
        "writing compensation rows from this packet",
      ],
      nonExecutionClauses: [
        "This item does not write compensation rows.",
        "This item does not mutate generated history.",
      ],
      futureHumanArtifacts: [
        "operator escalation runbook",
        "compensation review worksheet",
        "support-safe incident copy",
      ],
    }),
    releaseItem({
      id: "product_scope_release_blocker",
      category: "product_scope_blocker",
      title: "Product scope release blocker",
      status: "manual_required",
      owner: "founder",
      intent:
        "Keep infrastructure release separate from AI generation, Stripe entitlement, report unlock, and graph editing product behavior.",
      sourceSignoffItemIds: [
        "founder_scope_signoff_packet",
        "product_scope_signoff_packet",
      ],
      sourceRefs: [
        "docs/mvp-qa-environment.md",
        "docs/controlled-backend-writers.md",
      ],
      blockerSummary:
        "Persistence infrastructure must not accidentally ship paid or generated product behavior.",
      requiredEvidence: [
        "AI calls remain disabled.",
        "Stripe writes remain disabled.",
        "Report unlock and graph edge editing remain disabled.",
      ],
      releaseQuestions: [
        "Does this release change any end-user generated content behavior?",
        "Does it alter paid entitlements or report visibility?",
      ],
      noGoDecisionRules: [
        "If AI, Stripe, or report unlock behavior changes, release remains no-go.",
        "If graph editing scope expands, release remains no-go.",
      ],
      forbiddenActions: [
        "calling AI",
        "calling Stripe",
        "unlocking reports",
        "making graph edges editable",
      ],
      nonExecutionClauses: [
        "This item does not call AI.",
        "This item does not call Stripe.",
        "This item does not unlock reports.",
      ],
      futureHumanArtifacts: [
        "product non-goal confirmation",
        "paid behavior exclusion note",
        "generated content release boundary",
      ],
    }),
    releaseItem({
      id: "browser_boundary_release_packet",
      category: "browser_boundary_packet",
      title: "Browser boundary release packet",
      status: "packet_ready",
      owner: "security",
      intent:
        "Preserve the current browser boundary: only user-authored draft tables are browser-writable while generated and payment-owned artifacts stay blocked.",
      sourceSignoffItemIds: [
        "security_boundary_signoff_packet",
        "product_scope_signoff_packet",
      ],
      sourceRefs: [
        "docs/database-schema.md",
        "docs/supabase-auth-sync-setup.md",
        "docs/mvp-qa-environment.md",
      ],
      blockerSummary:
        "The browser boundary remains correctly documented and must be rechecked before any release expands write scope.",
      requiredEvidence: [
        "Browser writes remain limited to seed_contexts, key_people, and support_tickets.",
        "Generated, payment, and consent history tables stay browser read-only.",
        "No service-role material is serialized to the browser.",
      ],
      releaseQuestions: [
        "Does any release path add browser write access to generated records?",
        "Can the browser observe service-role config beyond booleans?",
      ],
      noGoDecisionRules: [
        "If browser write scope expands without review, release remains no-go.",
        "If generated records become browser-writable, release remains no-go.",
      ],
      forbiddenActions: [
        "granting browser writes to generated tables",
        "serializing service-role config",
        "unlocking system-owned artifacts from the client",
      ],
      nonExecutionClauses: [
        "This item does not change RLS.",
        "This item does not write browser policy SQL.",
      ],
      futureHumanArtifacts: [
        "browser write boundary checklist",
        "RLS policy review note",
        "client bundle secret scan",
      ],
    }),
    releaseItem({
      id: "final_implementation_release_no_go",
      category: "final_release_no_go",
      title: "Final implementation release no-go",
      status: "blocked_by_owner_signoff",
      owner: "founder",
      intent:
        "Declare the current implementation release blocked until a separate human go/no-go process accepts every unresolved blocker outside this endpoint.",
      sourceSignoffItemIds: ["final_owner_signoff_no_go"],
      sourceRefs: [
        "docs/writer-persistence-implementation-owner-signoff.md",
        "docs/writer-persistence-implementation-release-no-go.md",
      ],
      blockerSummary:
        "The project is not ready for implementation release: no owner approval, patch acceptance, branch, file, test, migration, writer, AI, Stripe, or report unlock is allowed.",
      requiredEvidence: [
        "No release approval is recorded.",
        "No implementation branch, files, tests, migration, service-role client, transaction, write, AI call, Stripe call, or report unlock exists.",
        "A separate human go/no-go runbook is still required.",
      ],
      releaseQuestions: [
        "Is this endpoint still only a no-go packet?",
        "Are all implementation and release effects still blocked?",
      ],
      noGoDecisionRules: [
        "If any runtime effect becomes true, release remains no-go.",
        "If this packet is treated as release approval, release remains no-go.",
      ],
      forbiddenActions: [
        "recording a go decision",
        "granting release approval",
        "enabling writer feature flags",
        "deploying production writer code",
      ],
      nonExecutionClauses: [
        "This endpoint is the current hard stop.",
        "This endpoint does not grant release approval.",
      ],
      futureHumanArtifacts: [
        "human go/no-go runbook",
        "release approval record",
        "final blocker resolution log",
      ],
    }),
  ];
}

function countByStatus(
  items: WriterPersistenceReleaseNoGoItem[],
  status: WriterPersistenceReleaseNoGoStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceReleaseNoGoItem[],
  key:
    | "requiredEvidence"
    | "releaseQuestions"
    | "noGoDecisionRules"
    | "forbiddenActions",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(payload: WriterPersistenceReleaseNoGoPayload) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    releaseNoGoMode: payload.releaseNoGoMode,
    releaseBlocked: true as const,
    releaseNoGoPacketOnly: true as const,
    sourceOwnerSignoffComplete: false as const,
    ownerSignoffRecorded: false as const,
    ownerSignoffComplete: false as const,
    releaseNoGoAccepted: false as const,
    releaseGoDecisionRecorded: false as const,
    releaseApproved: false as const,
    releaseApprovalGranted: false as const,
    implementationPatchReviewAccepted: false as const,
    implementationPatchSubmitted: false as const,
    implementationPatchApproved: false as const,
    implementationPatchCreated: false as const,
    implementationPatchApplied: false as const,
    implementationFilesCreated: false as const,
    implementationFilesModified: false as const,
    implementationTestsCreated: false as const,
    implementationApprovalGranted: false as const,
    implementationBranchApproved: false as const,
    branchCreationApproved: false as const,
    branchCreated: false as const,
    pullRequestCreated: false as const,
    implementationPlanApproved: false as const,
    readyToApplyPatch: false as const,
    readyToCreateImplementationBranch: false as const,
    readyForAdapterImplementation: false as const,
    readyForReleaseExecution: false as const,
    schemaVerified: false as const,
    adapterImplemented: false as const,
    adapterImplementationApproved: false as const,
    adapterImplementationAllowed: false as const,
    implementationReviewComplete: false as const,
    allOwnerApprovalsComplete: false as const,
    allBlockingEvidenceReady: false as const,
    humanGoNoGoRunbookNeeded: true as const,
    ...runtimeBlockedFlags,
    blockedCodes: payload.blockedCodes,
  };
}

export async function buildWriterPersistenceReleaseNoGo(): Promise<WriterPersistenceReleaseNoGoPayload> {
  const sourceOwnerSignoff = await buildWriterPersistenceOwnerSignoff();
  const releaseItems = buildReleaseItems();

  return {
    safeMode: true,
    readOnly: true,
    releaseNoGoMode:
      "persistence_adapter_implementation_release_no_go_packet_only",
    sourceOwnerSignoffMode: sourceOwnerSignoff.ownerSignoffMode,
    checkedAt: new Date().toISOString(),
    releaseItemCount: releaseItems.length,
    packetReadyCount: countByStatus(releaseItems, "packet_ready"),
    blockedByOwnerSignoffCount: countByStatus(
      releaseItems,
      "blocked_by_owner_signoff",
    ),
    releaseBlockerCount: countByStatus(releaseItems, "release_blocker"),
    manualRequiredCount: countByStatus(releaseItems, "manual_required"),
    requiredEvidenceCount: uniqueCount(releaseItems, "requiredEvidence"),
    releaseQuestionCount: uniqueCount(releaseItems, "releaseQuestions"),
    noGoDecisionRuleCount: uniqueCount(releaseItems, "noGoDecisionRules"),
    forbiddenActionCount: uniqueCount(releaseItems, "forbiddenActions"),
    sourceOwnerSignoffItemCount: sourceOwnerSignoff.signoffItemCount,
    sourceOwnerSignoffManualCount: sourceOwnerSignoff.manualSignoffCount,
    sourceOwnerSignoffBlockedCount: sourceOwnerSignoff.blockedSignoffCount,
    releaseBlocked: true,
    releaseNoGoPacketReady: true,
    releaseNoGoPacketOnly: true,
    sourceOwnerSignoffPacketReady: sourceOwnerSignoff.ownerSignoffPacketReady,
    sourceOwnerSignoffPacketOnly: sourceOwnerSignoff.ownerSignoffPacketOnly,
    sourceOwnerSignoffComplete: false,
    sourcePatchReviewAccepted: false,
    ownerSignoffSubmitted: false,
    ownerSignoffRecorded: false,
    ownerSignoffComplete: false,
    releaseNoGoAccepted: false,
    releaseGoDecisionRecorded: false,
    releaseApproved: false,
    releaseApprovalGranted: false,
    implementationPatchReviewAccepted: false,
    implementationPatchSubmitted: false,
    implementationPatchApproved: false,
    implementationPatchCreated: false,
    implementationPatchApplied: false,
    implementationFilesCreated: false,
    implementationFilesModified: false,
    implementationTestsCreated: false,
    implementationApprovalGranted: false,
    implementationBranchApproved: false,
    branchCreationApproved: false,
    branchCreated: false,
    pullRequestCreated: false,
    implementationPlanApproved: false,
    readyToApplyPatch: false,
    readyToCreateImplementationBranch: false,
    readyForAdapterImplementation: false,
    readyForReleaseExecution: false,
    schemaVerified: false,
    adapterImplemented: false,
    adapterImplementationApproved: false,
    adapterImplementationAllowed: false,
    implementationReviewComplete: false,
    allOwnerApprovalsComplete: false,
    allBlockingEvidenceReady: false,
    humanGoNoGoRunbookNeeded: true,
    ...runtimeBlockedFlags,
    blockedCodes,
    releaseNoGoRules: [
      "This endpoint is a read-only release no-go packet, not a release approval system.",
      "It may aggregate unresolved owner lanes, security blockers, backend phase-order blockers, QA blockers, migration blockers, runtime write blockers, data-protection blockers, operator blockers, product-scope blockers, and browser-boundary evidence.",
      "It must not record owner approval, record a go decision, grant release approval, enable feature flags, deploy code, run production writers, accept patch review, review a real patch, accept a patch, generate patches, apply patches, create files, modify files, create tests, run tests, run git, create branches, create pull requests, create adapter code, create privileged clients, read privileged secrets, open transactions, write rows, create migrations, call AI, call Stripe, or unlock reports.",
      "The source owner signoff packet is not complete, so release execution remains blocked.",
    ],
    nextHumanDecisionGates: [
      "A separate human go/no-go runbook must collect owner decisions outside this endpoint.",
      "Release approval must name founder, security, backend, QA, operator, data-protection, and product-scope outcomes.",
      "Every blocker must reference human evidence and must not include raw private payloads or credential-like values.",
      "No single lane can approve release execution without all required lanes resolved.",
      "Even after human approval exists, implementation still requires a separate code patch, review, test, migration, and deployment process.",
    ],
    releaseItems,
  };
}

export async function probeWriterPersistenceReleaseNoGo(
  requestBody: unknown,
): Promise<WriterPersistenceReleaseNoGoProbeResult> {
  const payload = await buildWriterPersistenceReleaseNoGo();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence release no-go probe blocked: request body must be a JSON object and no go decision, release approval, feature flag enablement, deployment, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      releaseItems: payload.releaseItems,
    };
  }

  const itemId = (requestBody as { itemId?: unknown }).itemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence release no-go probe blocked: itemId must be a string and no go decision, release approval, feature flag enablement, deployment, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      releaseItems: payload.releaseItems,
    };
  }

  const selectedItem = payload.releaseItems.find(
    (candidate) => candidate.id === itemId,
  );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence release no-go probe blocked: unknown item id and no go decision, release approval, feature flag enablement, deployment, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      releaseItems: payload.releaseItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence release no-go probe blocked as designed: the selected release blocker was returned, but no go decision, release approval, feature flag enablement, deployment, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
    releaseItems: [selectedItem],
  };
}
