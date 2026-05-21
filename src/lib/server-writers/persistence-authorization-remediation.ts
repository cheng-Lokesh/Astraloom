import "server-only";

import { buildWriterPersistenceAuthorizationNoGo } from "@/lib/server-writers/persistence-authorization-no-go";
import type {
  WriterPersistenceAuthorizationRemediationItem,
  WriterPersistenceAuthorizationRemediationPayload,
  WriterPersistenceAuthorizationRemediationProbeResult,
  WriterPersistenceAuthorizationRemediationRuntimeFlags,
  WriterPersistenceAuthorizationRemediationStatus,
} from "@/types/writer-persistence-authorization-remediation";

const blockedCodes = [
  "implementation_authorization_remediation_plan_only",
  "source_no_go_packet_still_blocks_release",
  "remediation_plan_acceptance_forbidden",
  "remediation_evidence_record_forbidden",
  "blocker_resolution_record_forbidden",
  "remediation_ticket_creation_forbidden",
  "external_archive_acceptance_forbidden",
  "archive_completeness_acceptance_forbidden",
  "authorization_record_creation_forbidden",
  "authorization_no_go_acceptance_forbidden",
  "authorization_denial_forbidden",
  "authorization_grant_forbidden",
  "human_decision_record_forbidden",
  "approval_storage_forbidden",
  "feature_flag_enablement_forbidden",
  "deployment_forbidden",
  "production_writer_execution_forbidden",
  "owner_approval_record_forbidden",
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
  "audit_idempotency_writes_forbidden",
  "migration_creation_forbidden",
  "ai_stripe_report_side_effects_forbidden",
];

const runtimeBlockedFlags = {
  allRuntimeEffectsBlocked: true,
  wouldAcceptExternalApprovalArchive: false,
  wouldStoreApprovalArtifact: false,
  wouldUploadApprovalArtifact: false,
  wouldReadExternalArtifact: false,
  wouldHashExternalArtifact: false,
  wouldPersistArchiveIndex: false,
  wouldMarkArchiveComplete: false,
  wouldCreateAuthorizationRecord: false,
  wouldRecordAuthorizationDecision: false,
  wouldRecordAuthorizationNoGoDecision: false,
  wouldAcceptAuthorizationNoGoDecision: false,
  wouldAcceptRemediationPlan: false,
  wouldRecordRemediationEvidence: false,
  wouldMarkBlockerResolved: false,
  wouldCreateRemediationTicket: false,
  wouldDenyImplementationAuthorization: false,
  wouldGrantImplementationAuthorization: false,
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
} as const satisfies WriterPersistenceAuthorizationRemediationRuntimeFlags;

function remediationItem(
  input: WriterPersistenceAuthorizationRemediationItem,
): WriterPersistenceAuthorizationRemediationItem {
  return input;
}

function buildRemediationItems(): WriterPersistenceAuthorizationRemediationItem[] {
  return [
    remediationItem({
      id: "source_invariant_remediation",
      category: "source_invariant_remediation",
      title: "Source invariant remediation",
      status: "external_remediation_required",
      owner: "founder",
      intent:
        "Keep the no-go packet as the source of truth and define what must be remediated before authorization can be reconsidered.",
      sourceNoGoItemIds: [
        "source_readiness_invariant_no_go",
        "final_authorization_no_go",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-authorization-no-go-decision-packet.md",
        "docs/writer-persistence-implementation-authorization-readiness-checklist.md",
      ],
      blockerSummary:
        "The source readiness and no-go packet both keep implementation authorization false.",
      remediationObjective:
        "Create an external evidence trail that shows every source blocker is either resolved externally or explicitly remains blocking.",
      externalActions: [
        "Build an external blocker register keyed by source no-go item id.",
        "Assign an owner and current state to every source readiness blocker.",
        "Record unresolved caveats outside the app in a redacted review artifact.",
      ],
      safeEvidenceRequirements: [
        "source no-go item ids",
        "owner lane ids",
        "safe external artifact refs",
        "yes/no/missing states only",
      ],
      verificationSteps: [
        "Confirm the app did not accept the remediation plan.",
        "Confirm no authorization record was created.",
        "Confirm release remains blocked.",
      ],
      acceptanceCriteria: [
        "Every no-go item maps to at least one owner and external action.",
        "No source blocker is silently dropped.",
      ],
      residualRisks: [
        "External artifacts may still be stale or incomplete.",
        "A future review may still reject implementation authorization.",
      ],
      redactionRules: [
        "Do not paste prompts, private narratives, provider payloads, or credentials.",
        "Use safe ids and short reviewer summaries only.",
      ],
      forbiddenActions: [
        "accepting readiness as complete",
        "recording authorization decisions",
        "granting implementation authorization",
      ],
      nonExecutionClauses: [
        "This plan does not resolve blockers in the app.",
        "This plan does not create or store external artifacts.",
      ],
      exitCriteria: [
        "All source no-go ids are mapped to external owner actions.",
        "All unresolved blockers remain visible until a later review checklist.",
      ],
      nextReviewGate: "authorization_remediation_review_checklist",
    }),
    remediationItem({
      id: "archive_remediation",
      category: "archive_remediation",
      title: "External archive remediation",
      status: "external_remediation_required",
      owner: "founder",
      intent:
        "Define how missing external archive coverage should be fixed without accepting, reading, hashing, uploading, or indexing archive artifacts in the app.",
      sourceNoGoItemIds: [
        "archive_acceptance_no_go",
        "source_readiness_invariant_no_go",
      ],
      sourceRefs: [
        "docs/writer-persistence-external-approval-archive-checklist.md",
        "docs/writer-persistence-implementation-authorization-readiness-checklist.md",
      ],
      blockerSummary:
        "External archive acceptance and archive completeness both remain false.",
      remediationObjective:
        "Close archive coverage gaps externally and return only safe coverage status to a future review.",
      externalActions: [
        "Create a redacted archive coverage matrix outside the app.",
        "Mark each required artifact as present, missing, stale, or rejected.",
        "Assign a retention owner and access rule to every artifact class.",
      ],
      safeEvidenceRequirements: [
        "artifact class id",
        "coverage status",
        "retention owner role",
        "redaction status",
      ],
      verificationSteps: [
        "Confirm no external artifact was uploaded to the app.",
        "Confirm archive completeness is still false in API output.",
        "Confirm archive acceptance is still false in API output.",
      ],
      acceptanceCriteria: [
        "Every required archive class has a coverage state.",
        "Missing or stale items have explicit external remediation owners.",
      ],
      residualRisks: [
        "Archive artifacts could contain private data that cannot be pasted into the app.",
        "Completeness cannot be trusted until an external reviewer accepts it.",
      ],
      redactionRules: [
        "Use coverage statuses, not artifact bodies.",
        "Do not include private identities, signatures, tokens, or file contents.",
      ],
      forbiddenActions: [
        "accepting external archives",
        "marking archive completeness",
        "persisting archive indexes",
      ],
      nonExecutionClauses: [
        "This plan does not read external storage.",
        "This plan does not create archive metadata.",
      ],
      exitCriteria: [
        "Archive gaps have external owners.",
        "Future review can verify safe coverage without artifact bodies.",
      ],
      nextReviewGate: "archive_coverage_review",
    }),
    remediationItem({
      id: "authority_remediation",
      category: "authority_remediation",
      title: "Authority boundary remediation",
      status: "manual_review_required",
      owner: "founder",
      intent:
        "Define the external authority evidence needed before any implementation authorization can be reconsidered.",
      sourceNoGoItemIds: [
        "authority_boundary_no_go",
        "owner_lane_no_go",
      ],
      sourceRefs: [
        "docs/writer-persistence-human-go-no-go-runbook.md",
        "docs/writer-persistence-implementation-owner-signoff.md",
      ],
      blockerSummary:
        "Authority cannot be inferred from route output, chat history, or owner labels.",
      remediationObjective:
        "Make the future authorizing authority explicit outside the app while keeping this app non-authoritative.",
      externalActions: [
        "Name the external authority role for implementation authorization.",
        "Define which artifact would prove authority in a later review.",
        "List authority caveats that still block authorization.",
      ],
      safeEvidenceRequirements: [
        "authority role name",
        "artifact ref type",
        "decision lane id",
        "caveat ids",
      ],
      verificationSteps: [
        "Confirm no signature was collected.",
        "Confirm no owner approval was recorded.",
        "Confirm implementation authorization granted=false.",
      ],
      acceptanceCriteria: [
        "Authority source is explicit and external.",
        "The app route is not treated as the approval artifact.",
      ],
      residualRisks: [
        "Authority scope may be contested in later review.",
        "A named authority does not imply approval.",
      ],
      redactionRules: [
        "Use role labels instead of private identity details.",
        "Do not store signatures, email bodies, or private contact data.",
      ],
      forbiddenActions: [
        "collecting signatures",
        "recording owner approval",
        "creating approval records",
      ],
      nonExecutionClauses: [
        "This plan does not collect authority decisions.",
        "This plan does not persist owner status.",
      ],
      exitCriteria: [
        "External authority role is named.",
        "Authority caveats are mapped to future review questions.",
      ],
      nextReviewGate: "authority_boundary_review",
    }),
    remediationItem({
      id: "owner_lane_remediation",
      category: "owner_lane_remediation",
      title: "Owner lane remediation",
      status: "manual_review_required",
      owner: "operator",
      intent:
        "Map each owner lane to the evidence needed before authorization can be reconsidered.",
      sourceNoGoItemIds: [
        "owner_lane_no_go",
        "authority_boundary_no_go",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-owner-signoff.md",
        "docs/writer-persistence-implementation-release-no-go.md",
      ],
      blockerSummary:
        "Owner approvals are not recorded and allOwnerApprovalsComplete remains false.",
      remediationObjective:
        "Create an external lane-by-lane plan for missing evidence, caveats, and re-review order.",
      externalActions: [
        "List founder, backend, security, QA, operator, and data-protection lanes.",
        "Mark each lane as present, missing, stale, or blocked externally.",
        "Attach unresolved caveats to a lane owner.",
      ],
      safeEvidenceRequirements: [
        "lane id",
        "lane owner role",
        "evidence state",
        "caveat id",
      ],
      verificationSteps: [
        "Confirm allOwnerApprovalsComplete=false.",
        "Confirm owner approval records were not created.",
        "Confirm implementationApprovalGranted=false.",
      ],
      acceptanceCriteria: [
        "Every lane has a remediation owner.",
        "Every caveat is mapped or remains explicitly blocking.",
      ],
      residualRisks: [
        "A lane owner may require additional evidence later.",
        "External evidence may expire before implementation starts.",
      ],
      redactionRules: [
        "Use lane ids and role labels.",
        "Do not include private contact details or signature files.",
      ],
      forbiddenActions: [
        "recording owner approvals",
        "granting implementation approval",
        "accepting patch review",
      ],
      nonExecutionClauses: [
        "This plan does not mark owner lanes complete.",
        "This plan does not create approval records.",
      ],
      exitCriteria: [
        "All owner lanes have external remediation states.",
        "Future review can identify which lane still blocks authorization.",
      ],
      nextReviewGate: "owner_lane_review",
    }),
    remediationItem({
      id: "security_data_remediation",
      category: "security_data_remediation",
      title: "Security and data-protection remediation",
      status: "external_remediation_required",
      owner: "security",
      intent:
        "Define the security and data-protection work needed before privileged implementation can even be reviewed.",
      sourceNoGoItemIds: [
        "security_data_no_go",
        "rollback_observability_no_go",
      ],
      sourceRefs: [
        "docs/service-role-isolation-test-harness.md",
        "docs/request-hashing-redaction-fixtures.md",
        "docs/writer-rollback-compensation-model.md",
      ],
      blockerSummary:
        "Service-role client creation, secret reads, raw payload storage, and protected-history mutation remain forbidden.",
      remediationObjective:
        "Prepare external security signoff criteria for secret isolation, redaction, retention, and protected-history handling.",
      externalActions: [
        "Review service-role secret handling outside this app route.",
        "Confirm redaction requirements for prompts, narratives, debug bodies, and provider payloads.",
        "Define protected-history retention and non-destructive compensation rules.",
      ],
      safeEvidenceRequirements: [
        "security review ref",
        "redaction policy state",
        "retention owner role",
        "protected-history rule id",
      ],
      verificationSteps: [
        "Confirm wouldCreateServiceRoleClient=false.",
        "Confirm wouldReadServiceRoleSecret=false.",
        "Confirm wouldStoreRawPayload=false.",
      ],
      acceptanceCriteria: [
        "Secret handling has external review coverage.",
        "Raw private data remains excluded from app responses.",
        "Rollback never deletes protected audit, payment, consent, or generated history.",
      ],
      residualRisks: [
        "A future service-role factory could accidentally cross client boundaries.",
        "Insufficient redaction could expose private narratives.",
      ],
      redactionRules: [
        "Exclude prompts, private narratives, provider payloads, debug bodies, tokens, secrets, and webhook bodies.",
        "Use hashes, safe refs, and blocker ids only.",
      ],
      forbiddenActions: [
        "creating service-role clients",
        "reading service-role secrets",
        "storing raw payloads",
      ],
      nonExecutionClauses: [
        "This plan does not inspect secrets.",
        "This plan does not modify RLS or permissions.",
      ],
      exitCriteria: [
        "Security review questions are fully mapped.",
        "Data-protection blockers have external owners and safe evidence refs.",
      ],
      nextReviewGate: "security_data_review",
    }),
    remediationItem({
      id: "backend_schema_remediation",
      category: "backend_schema_remediation",
      title: "Backend and schema remediation",
      status: "manual_review_required",
      owner: "backend",
      intent:
        "Translate backend/schema no-go findings into external work without creating code, migrations, transactions, or database writes.",
      sourceNoGoItemIds: [
        "backend_schema_no_go",
        "implementation_scope_no_go",
      ],
      sourceRefs: [
        "docs/writer-applied-schema-verification-harness.md",
        "docs/writer-persistence-adapter-design.md",
        "docs/writer-persistence-dry-run-gate.md",
      ],
      blockerSummary:
        "Schema verification and transaction design are evidence only; adapter implementation remains disallowed.",
      remediationObjective:
        "Prepare external review material for schema state, transaction order, audit persistence, and idempotency behavior.",
      externalActions: [
        "Review schema verification status outside this app route.",
        "Confirm transaction phase order and failure behavior.",
        "Map audit and idempotency records to future server-only operations.",
      ],
      safeEvidenceRequirements: [
        "table name",
        "method name",
        "transaction phase id",
        "failure mode id",
      ],
      verificationSteps: [
        "Confirm migration directory remains unchanged.",
        "Confirm adapterImplemented=false.",
        "Confirm wouldRunTransaction=false.",
      ],
      acceptanceCriteria: [
        "Schema and transaction questions are externally answerable.",
        "No implementation file is needed to understand the future adapter boundary.",
      ],
      residualRisks: [
        "Manual schema state could differ from local assumptions.",
        "Future transaction implementation could violate idempotency order.",
      ],
      redactionRules: [
        "Use table names, method names, and safe refs only.",
        "Do not include database credentials, raw query bodies, or service-role config.",
      ],
      forbiddenActions: [
        "creating migration files",
        "creating adapter code",
        "running transactions",
      ],
      nonExecutionClauses: [
        "This plan does not inspect privileged database state.",
        "This plan does not create code.",
      ],
      exitCriteria: [
        "Schema, transaction, audit, and idempotency blockers have external remediation states.",
        "Future review can decide whether implementation scope can be reconsidered.",
      ],
      nextReviewGate: "backend_schema_review",
    }),
    remediationItem({
      id: "qa_acceptance_remediation",
      category: "qa_acceptance_remediation",
      title: "QA and acceptance remediation",
      status: "manual_review_required",
      owner: "qa",
      intent:
        "Map QA no-go evidence into a future acceptance checklist without creating tests or running implementation automation.",
      sourceNoGoItemIds: [
        "qa_acceptance_no_go",
        "backend_schema_no_go",
      ],
      sourceRefs: [
        "docs/writer-persistence-fixture-harness.md",
        "docs/writer-persistence-acceptance-test-matrix.md",
        "docs/mvp-qa-environment.md",
      ],
      blockerSummary:
        "Acceptance tests are not created, automated implementation tests are not run, and browser writes remain constrained.",
      remediationObjective:
        "Prepare future QA acceptance coverage for route invariants, fixture behavior, runtime flags, and browser write boundaries.",
      externalActions: [
        "Map every implementation risk to an assertion name.",
        "Identify fixture cases that cover idempotency, audit, rollback, and redaction.",
        "Keep browser-write boundaries visible in QA evidence.",
      ],
      safeEvidenceRequirements: [
        "assertion id",
        "fixture id",
        "route name",
        "expected boolean state",
      ],
      verificationSteps: [
        "Confirm wouldCreateTestFiles=false.",
        "Confirm wouldRunAutomatedTests=false.",
        "Confirm generated/payment tables remain browser read-only.",
      ],
      acceptanceCriteria: [
        "Every future write path has a planned assertion.",
        "Every browser boundary remains testable without enabling writes.",
      ],
      residualRisks: [
        "Future tests may miss a service-role/client boundary regression.",
        "Acceptance criteria may need updates after external review.",
      ],
      redactionRules: [
        "Use fixture ids and route names.",
        "Do not paste user narratives, prompts, or private payload examples.",
      ],
      forbiddenActions: [
        "creating test files",
        "running automated implementation tests",
        "changing browser write policies",
      ],
      nonExecutionClauses: [
        "This plan does not create tests.",
        "This plan does not run test automation.",
      ],
      exitCriteria: [
        "QA blockers have assertion refs and owners.",
        "Future review can inspect planned coverage without executing implementation.",
      ],
      nextReviewGate: "qa_acceptance_review",
    }),
    remediationItem({
      id: "rollback_observability_remediation",
      category: "rollback_observability_remediation",
      title: "Rollback and observability remediation",
      status: "manual_review_required",
      owner: "operator",
      intent:
        "Prepare operator-facing remediation for abort, compensation, observability, and support handoff without writing records or enabling release.",
      sourceNoGoItemIds: [
        "rollback_observability_no_go",
        "security_data_no_go",
      ],
      sourceRefs: [
        "docs/writer-rollback-compensation-model.md",
        "docs/writer-rollout-checklist.md",
        "docs/writer-persistence-implementation-release-no-go.md",
      ],
      blockerSummary:
        "Compensation rows are not written, rollout gates are not enabled, and release execution remains false.",
      remediationObjective:
        "Make future operator checks explicit before any release execution or production writer path can be reconsidered.",
      externalActions: [
        "Define abort triggers and support handoff refs.",
        "Map compensation behavior to non-destructive recovery steps.",
        "List observability signals required before rollout.",
      ],
      safeEvidenceRequirements: [
        "abort trigger id",
        "support handoff ref",
        "observability signal id",
        "compensation behavior id",
      ],
      verificationSteps: [
        "Confirm wouldWriteCompensationRows=false.",
        "Confirm wouldEnableFeatureFlag=false.",
        "Confirm readyForReleaseExecution=false.",
      ],
      acceptanceCriteria: [
        "Every release failure class has an abort or support handoff path.",
        "Compensation never destructively mutates protected history.",
      ],
      residualRisks: [
        "Future implementation could produce failure modes not covered here.",
        "Operator signals may need production-specific thresholds later.",
      ],
      redactionRules: [
        "Use event ids, safe refs, and summarized outcomes.",
        "Do not include raw payloads, private narratives, or secrets.",
      ],
      forbiddenActions: [
        "writing compensation rows",
        "enabling rollout gates",
        "deploying code",
      ],
      nonExecutionClauses: [
        "This plan does not write compensation records.",
        "This plan does not enable rollout or observability systems.",
      ],
      exitCriteria: [
        "Rollback and observability blockers have external remediation actions.",
        "Future review can judge whether operator readiness is sufficient.",
      ],
      nextReviewGate: "rollback_observability_review",
    }),
    remediationItem({
      id: "implementation_scope_remediation",
      category: "implementation_scope_remediation",
      title: "Implementation scope remediation",
      status: "external_remediation_required",
      owner: "backend",
      intent:
        "Define what scope evidence must exist before branch, patch, file, test, or adapter implementation work can be reconsidered.",
      sourceNoGoItemIds: [
        "implementation_scope_no_go",
        "final_authorization_no_go",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-branch-preflight.md",
        "docs/writer-persistence-implementation-diff-contract.md",
        "docs/writer-persistence-implementation-patch-review.md",
      ],
      blockerSummary:
        "Branch creation, patch generation, file creation, test creation, and adapter code remain forbidden.",
      remediationObjective:
        "Prepare external scope boundaries for allowed files, forbidden files, phase order, rollback checkpoints, and review questions.",
      externalActions: [
        "Draft allowed implementation file paths outside this app route.",
        "List forbidden paths and forbidden symbols.",
        "Map each future patch phase to a rollback checkpoint.",
      ],
      safeEvidenceRequirements: [
        "path pattern",
        "symbol name",
        "phase id",
        "rollback checkpoint id",
      ],
      verificationSteps: [
        "Confirm no git command was run.",
        "Confirm wouldCreateFiles=false.",
        "Confirm readyToCreateImplementationBranch=false.",
      ],
      acceptanceCriteria: [
        "Future implementation scope is bounded enough for review.",
        "No code needs to be created to evaluate the plan.",
      ],
      residualRisks: [
        "Allowed files may need adjustment after backend review.",
        "Future patch generation could exceed approved scope.",
      ],
      redactionRules: [
        "Use file paths, symbol names, and blocker ids.",
        "Do not include private payload examples.",
      ],
      forbiddenActions: [
        "creating branches",
        "generating patches",
        "creating files",
      ],
      nonExecutionClauses: [
        "This plan does not create implementation plans.",
        "This plan does not modify files.",
      ],
      exitCriteria: [
        "Implementation scope blockers have safe external remediation actions.",
        "Future review can decide whether a branch preflight checklist may proceed.",
      ],
      nextReviewGate: "implementation_scope_review",
    }),
    remediationItem({
      id: "final_reconsideration_remediation",
      category: "final_reconsideration_remediation",
      title: "Final authorization reconsideration remediation",
      status: "external_remediation_required",
      owner: "founder",
      intent:
        "Define the final evidence shape needed before any future stage may even review implementation authorization again.",
      sourceNoGoItemIds: [
        "final_authorization_no_go",
        "source_readiness_invariant_no_go",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-authorization-no-go-decision-packet.md",
        "docs/codex-next-task.md",
      ],
      blockerSummary:
        "No authorization decision is recorded, no archive is accepted, and no implementation readiness is accepted.",
      remediationObjective:
        "Make the path to future reconsideration explicit while keeping current authorization, implementation, deployment, AI, Stripe, and report unlocks blocked.",
      externalActions: [
        "Aggregate all external remediation states into a founder-facing review packet outside the app.",
        "List blockers that remain no-go after remediation.",
        "Prepare a future read-only review checklist before any authorization decision can exist.",
      ],
      safeEvidenceRequirements: [
        "remediation item id",
        "owner role",
        "external state",
        "future review question",
      ],
      verificationSteps: [
        "Confirm implementationAuthorizationGranted=false.",
        "Confirm implementationAuthorized=false.",
        "Confirm allRuntimeEffectsBlocked=true.",
      ],
      acceptanceCriteria: [
        "Every remediation item has an external state and owner.",
        "Future reconsideration cannot skip the remediation review checklist.",
      ],
      residualRisks: [
        "The project may still remain no-go after remediation.",
        "Future implementation may require a narrower patch proposal.",
      ],
      redactionRules: [
        "Use safe summaries and blocker ids.",
        "Do not include private examples, provider payloads, or credential-like values.",
      ],
      forbiddenActions: [
        "accepting the remediation plan in the app",
        "denying or granting authorization in the app",
        "starting implementation",
      ],
      nonExecutionClauses: [
        "This plan is a read-only remediation map.",
        "This plan does not record or accept any decision.",
      ],
      exitCriteria: [
        "A later read-only remediation review checklist can verify external remediation states.",
        "Every implementation execution path remains disabled.",
      ],
      nextReviewGate: "authorization_remediation_review_checklist",
    }),
  ];
}

function countByStatus(
  items: WriterPersistenceAuthorizationRemediationItem[],
  status: WriterPersistenceAuthorizationRemediationStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationRemediationItem[],
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
  payload: WriterPersistenceAuthorizationRemediationPayload,
) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    remediationPlanMode: payload.remediationPlanMode,
    remediationPlanOnly: true as const,
    sourceReleaseStillBlocked: true as const,
    externalApprovalArchiveAccepted: false as const,
    archiveCompletenessAccepted: false as const,
    implementationAuthorizationRemediationAccepted: false as const,
    implementationAuthorizationDecisionReady: false as const,
    implementationAuthorizationDecisionRecorded: false as const,
    implementationAuthorizationNoGoAccepted: false as const,
    implementationAuthorizationDenied: false as const,
    implementationAuthorizationGranted: false as const,
    implementationAuthorized: false as const,
    authorizationDecisionRecorded: false as const,
    authorizationArtifactStored: false as const,
    implementationApprovalGranted: false as const,
    implementationBranchApproved: false as const,
    implementationPlanApproved: false as const,
    readyToApplyPatch: false as const,
    readyToCreateImplementationBranch: false as const,
    readyForAdapterImplementation: false as const,
    readyForReleaseExecution: false as const,
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

export async function buildWriterPersistenceAuthorizationRemediation(): Promise<WriterPersistenceAuthorizationRemediationPayload> {
  const sourceNoGo = await buildWriterPersistenceAuthorizationNoGo();
  const remediationItems = buildRemediationItems();

  return {
    safeMode: true,
    readOnly: true,
    remediationPlanMode:
      "persistence_adapter_implementation_authorization_remediation_plan_only",
    sourceAuthorizationNoGoMode: sourceNoGo.authorizationNoGoMode,
    checkedAt: new Date().toISOString(),
    remediationItemCount: remediationItems.length,
    externalRemediationRequiredCount: countByStatus(
      remediationItems,
      "external_remediation_required",
    ),
    manualReviewRequiredCount: countByStatus(
      remediationItems,
      "manual_review_required",
    ),
    externalActionCount: uniqueCount(remediationItems, "externalActions"),
    safeEvidenceRequirementCount: uniqueCount(
      remediationItems,
      "safeEvidenceRequirements",
    ),
    verificationStepCount: uniqueCount(remediationItems, "verificationSteps"),
    acceptanceCriteriaCount: uniqueCount(
      remediationItems,
      "acceptanceCriteria",
    ),
    residualRiskCount: uniqueCount(remediationItems, "residualRisks"),
    redactionRuleCount: uniqueCount(remediationItems, "redactionRules"),
    forbiddenActionCount: uniqueCount(remediationItems, "forbiddenActions"),
    exitCriteriaCount: uniqueCount(remediationItems, "exitCriteria"),
    sourceDecisionItemCount: sourceNoGo.decisionItemCount,
    sourceNoGoCount: sourceNoGo.noGoCount,
    sourceManualReviewRequiredCount: sourceNoGo.manualReviewRequiredCount,
    remediationPlanReady: true,
    remediationPlanOnly: true,
    sourceAuthorizationNoGoPacketReady: sourceNoGo.authorizationNoGoPacketReady,
    sourceAuthorizationNoGoPacketOnly: sourceNoGo.authorizationNoGoPacketOnly,
    sourceReleaseStillBlocked: sourceNoGo.sourceReleaseStillBlocked,
    sourceImplementationAuthorizationGranted:
      sourceNoGo.implementationAuthorizationGranted,
    sourceImplementationAuthorizationNoGoAccepted:
      sourceNoGo.implementationAuthorizationNoGoAccepted,
    externalApprovalArchiveAccepted: false,
    archiveCompletenessAccepted: false,
    implementationAuthorizationRemediationAccepted: false,
    implementationAuthorizationDecisionReady: false,
    implementationAuthorizationDecisionRecorded: false,
    implementationAuthorizationNoGoAccepted: false,
    implementationAuthorizationDenied: false,
    implementationAuthorizationGranted: false,
    implementationAuthorized: false,
    authorizationDecisionRecorded: false,
    authorizationArtifactStored: false,
    implementationApprovalGranted: false,
    implementationBranchApproved: false,
    implementationPlanApproved: false,
    readyToApplyPatch: false,
    readyToCreateImplementationBranch: false,
    readyForAdapterImplementation: false,
    readyForReleaseExecution: false,
    adapterImplemented: false,
    adapterImplementationApproved: false,
    adapterImplementationAllowed: false,
    implementationReviewComplete: false,
    allOwnerApprovalsComplete: false,
    allBlockingEvidenceReady: false,
    ...runtimeBlockedFlags,
    blockedCodes,
    remediationPlanRules: [
      "This endpoint is a read-only implementation authorization remediation plan, not a remediation acceptance system.",
      "It may map current no-go blockers to external owner actions, safe evidence requirements, verification steps, acceptance criteria, residual risks, redaction rules, forbidden actions, exit criteria, and future review gates.",
      "It must not accept external archives, mark archive completeness, accept remediation, record remediation evidence, mark blockers resolved, create tickets, create authorization records, record or accept no-go decisions, deny or grant implementation authorization, store approvals, enable feature flags, deploy code, run production writers, accept patches, create files, create tests, create branches, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.",
      "Remediation plan readiness does not mean any blocker is resolved; a later remediation review checklist is required.",
    ],
    reconsiderationRules: [
      "Every future reconsideration must start from the no-go item ids and remediation item ids.",
      "External evidence may be referenced only by safe id, owner role, redaction state, and status.",
      "A later review must reject any evidence that includes raw prompts, private narratives, provider payloads, tokens, secrets, webhook bodies, or credential-like values.",
      "No implementation branch, patch, test, migration, writer, deployment, AI, Stripe, or report unlock work can start from this route.",
      "The remediation review checklist now exists; the next safe stage is a read-only remediation review no-go packet.",
    ],
    sourceBlockedCodes: sourceNoGo.blockedCodes,
    remediationItems,
  };
}

export async function probeWriterPersistenceAuthorizationRemediation(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationRemediationProbeResult> {
  const payload = await buildWriterPersistenceAuthorizationRemediation();
  const blockedSummary =
    "Persistence authorization remediation probe blocked: no remediation acceptance, remediation evidence record, blocker resolution, ticket creation, archive acceptance, archive completeness acceptance, authorization record, no-go decision acceptance, implementation authorization denial, implementation authorization grant, human decision record, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      remediationItems: payload.remediationItems,
    };
  }

  const itemId = (requestBody as { itemId?: unknown }).itemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      remediationItems: payload.remediationItems,
    };
  }

  const selectedItem = payload.remediationItems.find(
    (candidate) => candidate.id === itemId,
  );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      remediationItems: payload.remediationItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization remediation probe blocked as designed: the selected remediation item was returned, but no remediation acceptance, remediation evidence record, blocker resolution, ticket creation, archive acceptance, archive completeness acceptance, authorization record, no-go decision acceptance, implementation authorization denial, implementation authorization grant, human decision record, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
    remediationItems: [selectedItem],
  };
}
