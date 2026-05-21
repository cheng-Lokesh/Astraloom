import "server-only";

import { buildWriterPersistenceReleaseNoGo } from "@/lib/server-writers/persistence-release-no-go";
import type {
  WriterPersistenceHumanGoNoGoPayload,
  WriterPersistenceHumanGoNoGoProbeResult,
  WriterPersistenceHumanGoNoGoStatus,
  WriterPersistenceHumanGoNoGoStep,
} from "@/types/writer-persistence-human-go-no-go";

const blockedCodes = [
  "human_go_no_go_runbook_only",
  "source_release_no_go_still_blocked",
  "human_decision_record_forbidden",
  "human_decision_acceptance_forbidden",
  "decision_artifact_storage_forbidden",
  "release_no_go_acceptance_forbidden",
  "release_go_decision_forbidden",
  "release_approval_forbidden",
  "feature_flag_enablement_forbidden",
  "deployment_approval_forbidden",
  "production_writer_approval_forbidden",
  "production_writer_execution_forbidden",
  "owner_approval_record_forbidden",
  "patch_review_acceptance_forbidden",
  "real_patch_review_forbidden",
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
  wouldRecordHumanDecision: false,
  wouldAcceptHumanDecision: false,
  wouldStoreDecisionArtifact: false,
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

function runbookStep(
  input: WriterPersistenceHumanGoNoGoStep,
): WriterPersistenceHumanGoNoGoStep {
  return input;
}

function buildRunbookSteps(): WriterPersistenceHumanGoNoGoStep[] {
  return [
    runbookStep({
      id: "source_release_no_go_invariant_runbook",
      category: "source_release_no_go_invariant",
      title: "Source release no-go invariant runbook",
      status: "blocked_by_release_no_go",
      owner: "founder",
      intent:
        "Carry the release no-go packet forward as a hard stop, so this runbook cannot be mistaken for release approval.",
      sourceReleaseItemIds: [
        "source_owner_signoff_invariant_release_no_go",
        "final_implementation_release_no_go",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-release-no-go.md",
        "docs/writer-persistence-implementation-owner-signoff.md",
      ],
      decisionQuestion:
        "Does the human go/no-go process preserve the current release no-go state until every owner lane is externally resolved?",
      requiredEvidence: [
        "The source release packet still reports releaseBlocked=true.",
        "The source release packet still reports releaseNoGoPacketOnly=true.",
        "No owner signoff, release go decision, feature flag, deployment, or production writer approval has been recorded in the app.",
      ],
      externalArtifactRules: [
        "Any future go/no-go decision must be stored outside this app until a separate persistence design is approved.",
        "The external artifact must reference release blocker ids instead of private prompts, raw provider payloads, or credential-like values.",
      ],
      goCriteria: [
        "Every release blocker has an external owner decision.",
        "Every owner decision references non-sensitive evidence.",
      ],
      noGoCriteria: [
        "Any unresolved owner lane keeps release blocked.",
        "Any attempt to treat this page or API response as approval keeps release blocked.",
      ],
      forbiddenActions: [
        "recording a go decision",
        "accepting the release no-go packet",
        "granting release approval",
      ],
      nonExecutionClauses: [
        "This step is descriptive only.",
        "This step does not collect signatures or approval records.",
      ],
      futureArtifacts: [
        "external decision register",
        "release blocker cross-reference",
        "human review evidence checksum",
      ],
    }),
    runbookStep({
      id: "founder_scope_decision_runbook",
      category: "founder_scope_decision",
      title: "Founder scope decision runbook",
      status: "manual_required",
      owner: "founder",
      intent:
        "Force a founder-level scope decision before implementation can leave design-only mode.",
      sourceReleaseItemIds: [
        "unresolved_owner_lane_release_blocker",
        "product_scope_release_blocker",
        "final_implementation_release_no_go",
      ],
      sourceRefs: [
        "docs/controlled-backend-writers.md",
        "docs/mvp-qa-environment.md",
      ],
      decisionQuestion:
        "Is the first persistence release limited to infrastructure evidence, with no AI generation, paid entitlement changes, report unlocks, or editable graph behavior?",
      requiredEvidence: [
        "The release scope excludes AI generation.",
        "The release scope excludes Stripe writes and entitlement grants.",
        "The release scope excludes report unlocks and graph edge editing.",
      ],
      externalArtifactRules: [
        "Founder scope evidence must be a separate written artifact.",
        "The artifact must list non-goals explicitly, not just approved goals.",
      ],
      goCriteria: [
        "Founder confirms the release is infrastructure-only.",
        "Founder confirms product behavior remains unchanged for end users.",
      ],
      noGoCriteria: [
        "Any user-facing generated content behavior changes.",
        "Any payment, entitlement, or report visibility behavior changes.",
      ],
      forbiddenActions: [
        "unlocking reports",
        "calling AI",
        "calling Stripe",
        "making graph edges editable",
      ],
      nonExecutionClauses: [
        "This runbook does not approve product scope.",
        "This runbook does not alter entitlement or report state.",
      ],
      futureArtifacts: [
        "founder release scope decision",
        "product non-goal confirmation",
        "paid behavior exclusion note",
      ],
    }),
    runbookStep({
      id: "security_decision_runbook",
      category: "security_decision",
      title: "Security decision runbook",
      status: "manual_required",
      owner: "security",
      intent:
        "Require explicit security review of server-only isolation, secret containment, and response redaction before implementation work can proceed.",
      sourceReleaseItemIds: [
        "security_boundary_release_blocker",
        "browser_boundary_release_packet",
      ],
      sourceRefs: [
        "docs/service-role-isolation-test-harness.md",
        "docs/request-hashing-redaction-fixtures.md",
        "docs/database-schema.md",
      ],
      decisionQuestion:
        "Can the future implementation prove that privileged credentials, private prompts, provider payloads, and private debug bodies never reach the browser or support copy?",
      requiredEvidence: [
        "Client bundles exclude privileged writer implementation modules.",
        "Route responses return booleans and safe refs only.",
        "Negative tests cover credential-like strings, raw prompts, provider payloads, and private debug bodies.",
      ],
      externalArtifactRules: [
        "Security evidence must include the test command, environment class, and redaction result summary.",
        "Security evidence must not include real secrets, tokens, private prompts, or raw provider payloads.",
      ],
      goCriteria: [
        "Security signs off on server-only isolation.",
        "Security signs off on response redaction.",
      ],
      noGoCriteria: [
        "Any privileged material reaches a browser route or client bundle.",
        "Any support or evidence copy requires raw private payload storage.",
      ],
      forbiddenActions: [
        "creating a privileged client",
        "reading privileged secrets",
        "serializing private payloads",
      ],
      nonExecutionClauses: [
        "This step does not scan real secrets.",
        "This step does not create a privileged client.",
      ],
      futureArtifacts: [
        "security release review",
        "server-only bundle report",
        "redaction negative test report",
      ],
    }),
    runbookStep({
      id: "backend_decision_runbook",
      category: "backend_decision",
      title: "Backend decision runbook",
      status: "manual_required",
      owner: "backend",
      intent:
        "Require backend review of phase order, idempotency reservation, audit append, target write, finalize, and compensation behavior.",
      sourceReleaseItemIds: [
        "backend_phase_order_release_blocker",
        "runtime_write_release_blocker",
      ],
      sourceRefs: [
        "docs/writer-persistence-adapter-design.md",
        "docs/writer-idempotency-registry-model.md",
        "docs/writer-audit-event-model.md",
      ],
      decisionQuestion:
        "Does the future implementation preserve the documented write order and fail closed for ambiguous persistence outcomes?",
      requiredEvidence: [
        "Idempotency reservation happens before target side effects.",
        "Audit append and finalize behavior is explicit.",
        "Ambiguous outcomes route to operator review without destructive rollback.",
      ],
      externalArtifactRules: [
        "Backend evidence must include a failure-mode walkthrough.",
        "Backend evidence must list all allowed write targets and their ordering.",
      ],
      goCriteria: [
        "Backend confirms phase order matches the adapter design.",
        "Backend confirms idempotency conflicts block target side effects.",
      ],
      noGoCriteria: [
        "Write order differs from the design.",
        "Target writes can run without idempotency reservation.",
        "Ambiguous outcomes can be auto-deleted or silently ignored.",
      ],
      forbiddenActions: [
        "opening transactions from this runbook",
        "running target writes",
        "creating adapter code",
      ],
      nonExecutionClauses: [
        "This step does not implement orchestration.",
        "This step does not run transactions.",
      ],
      futureArtifacts: [
        "backend phase-order review",
        "failure-mode walkthrough",
        "write target enablement matrix",
      ],
    }),
    runbookStep({
      id: "qa_decision_runbook",
      category: "qa_decision",
      title: "QA decision runbook",
      status: "manual_required",
      owner: "qa",
      intent:
        "Require QA to verify negative tests and local-only reproducibility before any real persistence implementation can be considered.",
      sourceReleaseItemIds: ["qa_negative_test_release_blocker"],
      sourceRefs: [
        "docs/writer-persistence-acceptance-test-matrix.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      decisionQuestion:
        "Can QA prove that dangerous effects remain blocked and that tests fail if any forbidden runtime flag becomes true?",
      requiredEvidence: [
        "Negative assertions exist for writes, migrations, privileged clients, AI, Stripe, report unlocks, branches, files, and tests.",
        "The test suite runs without production credentials.",
        "Failure output is reproducible on a clean local machine.",
      ],
      externalArtifactRules: [
        "QA evidence must include command output summaries and the exact environment class.",
        "QA evidence must not include tokens, private prompts, raw provider payloads, or service-role material.",
      ],
      goCriteria: [
        "QA confirms all negative assertions pass.",
        "QA confirms no remote mutation is required for review.",
      ],
      noGoCriteria: [
        "Any dangerous runtime flag lacks a negative assertion.",
        "Any test requires production credentials or remote state mutation.",
      ],
      forbiddenActions: [
        "creating tests from this runbook",
        "running tests as release approval",
        "mutating remote state for QA evidence",
      ],
      nonExecutionClauses: [
        "This step does not create test files.",
        "This step does not run automated tests.",
      ],
      futureArtifacts: [
        "QA negative assertion report",
        "local reproducibility note",
        "dangerous flag coverage table",
      ],
    }),
    runbookStep({
      id: "migration_decision_runbook",
      category: "migration_decision",
      title: "Migration decision runbook",
      status: "manual_required",
      owner: "backend",
      intent:
        "Require explicit migration approval, manual SQL execution planning, rollback planning, and applied-schema verification before writer persistence exists.",
      sourceReleaseItemIds: ["schema_migration_release_blocker"],
      sourceRefs: [
        "docs/writer-migration-review-checklist.md",
        "docs/writer-migration-application-runbook.md",
        "docs/writer-applied-schema-verification-harness.md",
      ],
      decisionQuestion:
        "Is there a human-approved migration path that can be applied and verified outside this app before any writer code depends on it?",
      requiredEvidence: [
        "A real migration is approved before SQL execution.",
        "Manual SQL execution has an abort and rollback plan.",
        "Applied schema verification proves table, index, and RLS state.",
      ],
      externalArtifactRules: [
        "Migration evidence must include the approved SQL artifact location and execution owner.",
        "Migration evidence must include post-application verification without embedding database secrets.",
      ],
      goCriteria: [
        "Migration approval is complete.",
        "Manual execution and verification ownership is named.",
      ],
      noGoCriteria: [
        "Migration approval is missing.",
        "Applied schema cannot be verified before writer code runs.",
      ],
      forbiddenActions: [
        "creating migration files",
        "applying SQL",
        "creating tables",
      ],
      nonExecutionClauses: [
        "This step does not create migration files.",
        "This step does not apply SQL.",
      ],
      futureArtifacts: [
        "migration approval record",
        "manual SQL execution log",
        "post-application schema verification",
      ],
    }),
    runbookStep({
      id: "operator_decision_runbook",
      category: "operator_decision",
      title: "Operator decision runbook",
      status: "manual_required",
      owner: "operator",
      intent:
        "Require operator readiness for ambiguous write outcomes, support escalation, and non-destructive compensation.",
      sourceReleaseItemIds: ["operator_compensation_release_blocker"],
      sourceRefs: [
        "docs/writer-rollback-compensation-model.md",
        "docs/writer-persistence-no-go-evidence-packet.md",
      ],
      decisionQuestion:
        "Can operators handle ambiguous writes without destructive rollback or unsafe support disclosure?",
      requiredEvidence: [
        "Ambiguous outcomes route to a named operator review process.",
        "Protected audit, payment, consent, and generated history is never destructively deleted.",
        "Support-safe customer copy exists for failed or ambiguous writes.",
      ],
      externalArtifactRules: [
        "Operator evidence must include escalation ownership and service-level expectations.",
        "Operator evidence must describe non-destructive compensation for protected records.",
      ],
      goCriteria: [
        "Operator confirms escalation coverage.",
        "Operator confirms compensation policy is non-destructive.",
      ],
      noGoCriteria: [
        "Ambiguous outcomes can auto-compensate without review.",
        "Protected records can be deleted as rollback.",
      ],
      forbiddenActions: [
        "automatic compensation for ambiguous outcomes",
        "destructive deletion of protected history",
        "writing compensation rows",
      ],
      nonExecutionClauses: [
        "This step does not mutate generated history.",
        "This step does not write compensation rows.",
      ],
      futureArtifacts: [
        "operator escalation runbook",
        "compensation review worksheet",
        "support-safe incident copy",
      ],
    }),
    runbookStep({
      id: "data_protection_decision_runbook",
      category: "data_protection_decision",
      title: "Data protection decision runbook",
      status: "manual_required",
      owner: "data_protection",
      intent:
        "Require a data-protection review of every future persisted field before audit, idempotency, evidence, or support records are written.",
      sourceReleaseItemIds: ["data_protection_release_blocker"],
      sourceRefs: [
        "docs/request-hashing-redaction-fixtures.md",
        "docs/writer-evidence-handoff-fixtures.md",
        "docs/writer-audit-event-model.md",
      ],
      decisionQuestion:
        "Are all future persisted fields necessary, redacted, and safe for audit/support workflows without storing raw private payloads?",
      requiredEvidence: [
        "Allowed persisted fields exclude raw prompts, narratives, provider payloads, and private debug bodies.",
        "Request hashes and safe refs are sufficient for audit and support workflows.",
        "Retention and deletion posture is documented for audit and idempotency records.",
      ],
      externalArtifactRules: [
        "Data-protection evidence must include an allowed-field inventory.",
        "Data-protection evidence must not include the private payload examples it rejects.",
      ],
      goCriteria: [
        "Data-protection owner approves the allowed-field inventory.",
        "Support workflow can operate without raw private payloads.",
      ],
      noGoCriteria: [
        "Any raw private payload could be persisted.",
        "Support requires unredacted prompts, provider payloads, or secrets.",
      ],
      forbiddenActions: [
        "persisting raw payloads",
        "storing secrets",
        "returning private provider payloads",
      ],
      nonExecutionClauses: [
        "This step does not persist evidence.",
        "This step does not store raw payloads.",
      ],
      futureArtifacts: [
        "allowed field inventory",
        "data-protection review note",
        "support-safe evidence sample",
      ],
    }),
    runbookStep({
      id: "product_scope_decision_runbook",
      category: "product_scope_decision",
      title: "Product scope decision runbook",
      status: "manual_required",
      owner: "founder",
      intent:
        "Separate writer infrastructure readiness from user-facing simulation, billing, and report behavior.",
      sourceReleaseItemIds: [
        "product_scope_release_blocker",
        "browser_boundary_release_packet",
      ],
      sourceRefs: [
        "docs/mvp-qa-environment.md",
        "docs/database-schema.md",
      ],
      decisionQuestion:
        "Does the release avoid expanding browser write scope, generated content behavior, report access, and payment entitlement behavior?",
      requiredEvidence: [
        "Browser writes remain limited to user-authored draft tables.",
        "Generated, payment, and consent history remains system-owned.",
        "Simulation report unlock remains blocked by existing gates.",
      ],
      externalArtifactRules: [
        "Product evidence must list browser-writable tables and blocked system-owned tables.",
        "Product evidence must state that user-facing generation remains out of scope.",
      ],
      goCriteria: [
        "Product scope remains infrastructure-only.",
        "Browser write boundaries remain unchanged.",
      ],
      noGoCriteria: [
        "Generated records become browser-writable.",
        "Graph editing, report unlock, or entitlement behavior expands.",
      ],
      forbiddenActions: [
        "granting browser writes to generated tables",
        "unlocking reports",
        "changing payment entitlements",
      ],
      nonExecutionClauses: [
        "This step does not change RLS.",
        "This step does not unlock system-owned artifacts.",
      ],
      futureArtifacts: [
        "browser write boundary checklist",
        "generated artifact non-goal note",
        "product scope exclusion register",
      ],
    }),
    runbookStep({
      id: "final_human_go_no_go_hard_stop",
      category: "final_hard_stop",
      title: "Final human go/no-go hard stop",
      status: "blocked_by_release_no_go",
      owner: "founder",
      intent:
        "Keep the project blocked until a separate external archive contains every required human decision and a future implementation process is explicitly authorized.",
      sourceReleaseItemIds: [
        "final_implementation_release_no_go",
        "unresolved_owner_lane_release_blocker",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-release-no-go.md",
        "docs/writer-persistence-human-go-no-go-runbook.md",
      ],
      decisionQuestion:
        "Has every human lane produced external evidence, and is there still no app-side decision record, release approval, feature flag, deployment, writer execution, branch, file, test, migration, privileged client, transaction, or write?",
      requiredEvidence: [
        "Every required owner lane has an external artifact location.",
        "Every external artifact references blocker ids and safe evidence only.",
        "No runtime effect has been performed by this runbook.",
      ],
      externalArtifactRules: [
        "The final external archive must contain blocker ids, owner names, timestamps, and safe evidence refs.",
        "The final external archive must exclude secrets, tokens, private prompts, raw provider payloads, and private debug bodies.",
      ],
      goCriteria: [
        "Every lane is externally resolved.",
        "A separate future implementation task is explicitly authorized.",
      ],
      noGoCriteria: [
        "Any lane is missing, ambiguous, or stored only as app route output.",
        "Any dangerous runtime effect occurs before external approval is complete.",
      ],
      forbiddenActions: [
        "granting release approval",
        "enabling feature flags",
        "deploying code",
        "running production writers",
      ],
      nonExecutionClauses: [
        "This runbook is the current hard stop.",
        "This runbook does not grant implementation or release approval.",
      ],
      futureArtifacts: [
        "external approval archive",
        "final blocker resolution register",
        "future implementation authorization note",
      ],
    }),
  ];
}

function countByStatus(
  steps: WriterPersistenceHumanGoNoGoStep[],
  status: WriterPersistenceHumanGoNoGoStatus,
) {
  return steps.filter((step) => step.status === status).length;
}

function uniqueCount(
  steps: WriterPersistenceHumanGoNoGoStep[],
  key:
    | "requiredEvidence"
    | "externalArtifactRules"
    | "goCriteria"
    | "noGoCriteria"
    | "forbiddenActions",
) {
  return new Set(steps.flatMap((step) => step[key])).size;
}

function baseProbeFields(payload: WriterPersistenceHumanGoNoGoPayload) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    humanGoNoGoMode: payload.humanGoNoGoMode,
    sourceReleaseBlocked: true as const,
    releaseStillBlocked: true as const,
    humanGoNoGoRunbookOnly: true as const,
    humanDecisionCollectionExternal: true as const,
    humanDecisionRecorded: false as const,
    humanDecisionAccepted: false as const,
    releaseNoGoAccepted: false as const,
    releaseGoDecisionRecorded: false as const,
    releaseApproved: false as const,
    releaseApprovalGranted: false as const,
    featureFlagEnabled: false as const,
    deploymentApproved: false as const,
    productionWriterApproved: false as const,
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
    ...runtimeBlockedFlags,
    blockedCodes: payload.blockedCodes,
  };
}

export async function buildWriterPersistenceHumanGoNoGo(): Promise<WriterPersistenceHumanGoNoGoPayload> {
  const sourceReleaseNoGo = await buildWriterPersistenceReleaseNoGo();
  const runbookSteps = buildRunbookSteps();

  return {
    safeMode: true,
    readOnly: true,
    humanGoNoGoMode: "persistence_adapter_human_go_no_go_runbook_only",
    sourceReleaseNoGoMode: sourceReleaseNoGo.releaseNoGoMode,
    checkedAt: new Date().toISOString(),
    runbookStepCount: runbookSteps.length,
    blockedByReleaseNoGoCount: countByStatus(
      runbookSteps,
      "blocked_by_release_no_go",
    ),
    manualRequiredCount: countByStatus(runbookSteps, "manual_required"),
    requiredEvidenceCount: uniqueCount(runbookSteps, "requiredEvidence"),
    externalArtifactRuleCount: uniqueCount(
      runbookSteps,
      "externalArtifactRules",
    ),
    goCriteriaCount: uniqueCount(runbookSteps, "goCriteria"),
    noGoCriteriaCount: uniqueCount(runbookSteps, "noGoCriteria"),
    forbiddenActionCount: uniqueCount(runbookSteps, "forbiddenActions"),
    sourceReleaseItemCount: sourceReleaseNoGo.releaseItemCount,
    sourceReleaseBlockerCount:
      sourceReleaseNoGo.blockedByOwnerSignoffCount +
      sourceReleaseNoGo.releaseBlockerCount +
      sourceReleaseNoGo.manualRequiredCount,
    safeModeConfirmed: true,
    humanGoNoGoRunbookReady: true,
    humanGoNoGoRunbookOnly: true,
    sourceReleaseNoGoPacketReady: sourceReleaseNoGo.releaseNoGoPacketReady,
    sourceReleaseNoGoPacketOnly: sourceReleaseNoGo.releaseNoGoPacketOnly,
    sourceReleaseBlocked: true,
    releaseStillBlocked: true,
    humanDecisionCollectionExternal: true,
    externalArtifactArchiveRequired: true,
    humanDecisionRecorded: false,
    humanDecisionAccepted: false,
    releaseNoGoAccepted: false,
    releaseGoDecisionRecorded: false,
    releaseApproved: false,
    releaseApprovalGranted: false,
    featureFlagEnabled: false,
    deploymentApproved: false,
    productionWriterApproved: false,
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
    ...runtimeBlockedFlags,
    blockedCodes,
    runbookRules: [
      "This endpoint is a read-only human go/no-go runbook, not an approval collector.",
      "It may list the owner lanes, evidence requirements, external artifact rules, go criteria, no-go criteria, forbidden actions, and non-execution clauses required for a future human decision.",
      "It must not record human decisions, accept human decisions, store decision artifacts, accept release no-go, record a go decision, grant release approval, enable feature flags, approve deployment, approve production writers, run production writers, collect signatures, record owner approval, accept patch review, review a real patch, generate patches, apply patches, create files, modify files, create tests, run tests, run git, create branches, create pull requests, create adapter code, create privileged clients, read privileged secrets, open transactions, write rows, create migrations, call AI, call Stripe, or unlock reports.",
      "The source release no-go packet remains blocked, so this runbook is still a hard stop.",
    ],
    externalDecisionArtifactRules: [
      "Human decisions must be captured outside this app until a separate approved persistence model exists.",
      "External artifacts must identify owner, lane, decision, timestamp, blocker ids, and safe evidence refs.",
      "External artifacts must exclude secrets, tokens, raw private prompts, private narratives, provider payloads, private debug bodies, and credential-like values.",
      "External artifacts must not be replaced by route responses, screenshots of route responses, or browser state.",
      "Every future go decision still requires a separate implementation, test, migration, deployment, and writer enablement process.",
    ],
    blockedReleaseCodes: sourceReleaseNoGo.blockedCodes,
    runbookSteps,
  };
}

export async function probeWriterPersistenceHumanGoNoGo(
  requestBody: unknown,
): Promise<WriterPersistenceHumanGoNoGoProbeResult> {
  const payload = await buildWriterPersistenceHumanGoNoGo();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence human go/no-go probe blocked: request body must be a JSON object and no human decision, release approval, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      runbookSteps: payload.runbookSteps,
    };
  }

  const stepId = (requestBody as { stepId?: unknown }).stepId;

  if (typeof stepId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence human go/no-go probe blocked: stepId must be a string and no human decision, release approval, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      runbookSteps: payload.runbookSteps,
    };
  }

  const selectedStep = payload.runbookSteps.find(
    (candidate) => candidate.id === stepId,
  );

  if (!selectedStep) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence human go/no-go probe blocked: unknown step id and no human decision, release approval, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      runbookSteps: payload.runbookSteps,
    };
  }

  return {
    ...baseProbeFields(payload),
    stepId: selectedStep.id,
    stepTitle: selectedStep.title,
    stepStatus: selectedStep.status,
    summary:
      "Persistence human go/no-go probe blocked as designed: the selected runbook step was returned, but no human decision, release approval, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
    runbookSteps: [selectedStep],
  };
}
