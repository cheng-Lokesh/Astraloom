import "server-only";

import { buildWriterPersistenceHumanGoNoGo } from "@/lib/server-writers/persistence-human-go-no-go";
import type {
  WriterPersistenceExternalApprovalArchiveItem,
  WriterPersistenceExternalApprovalArchivePayload,
  WriterPersistenceExternalApprovalArchiveProbeResult,
  WriterPersistenceExternalApprovalArchiveStatus,
} from "@/types/writer-persistence-external-approval-archive";

const blockedCodes = [
  "external_approval_archive_checklist_only",
  "source_human_go_no_go_still_external",
  "approval_artifact_storage_forbidden",
  "approval_artifact_upload_forbidden",
  "external_artifact_read_forbidden",
  "external_artifact_hash_forbidden",
  "archive_index_persistence_forbidden",
  "archive_completeness_acceptance_forbidden",
  "external_approval_archive_acceptance_forbidden",
  "implementation_authorization_forbidden",
  "human_decision_record_forbidden",
  "human_decision_acceptance_forbidden",
  "decision_artifact_storage_forbidden",
  "release_go_decision_forbidden",
  "release_approval_forbidden",
  "feature_flag_enablement_forbidden",
  "deployment_approval_forbidden",
  "production_writer_approval_forbidden",
  "production_writer_execution_forbidden",
  "owner_approval_record_forbidden",
  "patch_review_acceptance_forbidden",
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
  wouldStoreApprovalArtifact: false,
  wouldUploadApprovalArtifact: false,
  wouldReadExternalArtifact: false,
  wouldHashExternalArtifact: false,
  wouldPersistArchiveIndex: false,
  wouldMarkArchiveComplete: false,
  wouldAcceptExternalApprovalArchive: false,
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
} as const;

function archiveItem(
  input: WriterPersistenceExternalApprovalArchiveItem,
): WriterPersistenceExternalApprovalArchiveItem {
  return input;
}

function buildArchiveItems(): WriterPersistenceExternalApprovalArchiveItem[] {
  return [
    archiveItem({
      id: "source_human_runbook_invariant_archive",
      category: "source_human_runbook_invariant",
      title: "Source human runbook invariant archive check",
      status: "blocked_by_human_runbook",
      owner: "founder",
      intent:
        "Carry forward the human go/no-go runbook as an external-only source so this checklist cannot become approval storage.",
      sourceRunbookStepIds: [
        "source_release_no_go_invariant_runbook",
        "final_human_go_no_go_hard_stop",
      ],
      sourceRefs: [
        "docs/writer-persistence-human-go-no-go-runbook.md",
        "docs/writer-persistence-implementation-release-no-go.md",
      ],
      archiveQuestion:
        "Does the external archive checklist preserve the rule that all human decisions live outside this app?",
      requiredMetadata: [
        "sourceHumanGoNoGoMode=persistence_adapter_human_go_no_go_runbook_only",
        "source release remains blocked",
        "humanDecisionCollectionExternal=true",
      ],
      namingRules: [
        "Use a stable external archive id that is not an app database id.",
        "Include the release lane and blocker ids in the external artifact title.",
      ],
      completenessChecks: [
        "Every future archive item must map back to at least one runbook step.",
        "No route response may be treated as a signed approval artifact.",
      ],
      redactionRules: [
        "Do not copy raw prompts, provider payloads, private debug bodies, or credential-like values into archive references.",
        "Use safe evidence refs and blocker ids instead of private payload excerpts.",
      ],
      retentionRules: [
        "Retention ownership must be named outside the app.",
        "The archive must define who can read, modify, and supersede artifacts.",
      ],
      forbiddenActions: [
        "storing approval artifacts",
        "uploading external artifacts",
        "accepting the archive as complete",
      ],
      nonExecutionClauses: [
        "This item does not read external files.",
        "This item does not persist archive metadata.",
      ],
      futureArtifacts: [
        "external archive invariant note",
        "runbook-to-archive mapping",
        "external storage owner record",
      ],
    }),
    archiveItem({
      id: "archive_identity_manifest_checklist",
      category: "archive_identity",
      title: "Archive identity manifest checklist",
      status: "manual_required",
      owner: "founder",
      intent:
        "Define the minimum identity fields every future external approval archive must expose before it can be reviewed.",
      sourceRunbookStepIds: [
        "founder_scope_decision_runbook",
        "final_human_go_no_go_hard_stop",
      ],
      sourceRefs: [
        "docs/writer-persistence-human-go-no-go-runbook.md",
        "docs/codex-next-task.md",
      ],
      archiveQuestion:
        "Can a reviewer identify which release, owner lane, blocker set, and evidence bundle an external approval artifact belongs to?",
      requiredMetadata: [
        "external archive id",
        "release candidate label",
        "owner lane",
        "named accountable owner",
        "created timestamp",
        "supersedes or superseded-by reference when applicable",
      ],
      namingRules: [
        "Use `persistence-adapter/<lane>/<yyyy-mm-dd>/<artifact-kind>` as the external path pattern.",
        "Include blocker ids in the artifact title or first metadata block.",
      ],
      completenessChecks: [
        "The manifest names every required owner lane.",
        "The manifest states whether each artifact is current, superseded, or rejected.",
      ],
      redactionRules: [
        "Archive identity fields must be safe metadata only.",
        "Do not include user prompt text, private relationship narratives, or provider payloads in identity fields.",
      ],
      retentionRules: [
        "The manifest must name a retention owner.",
        "Superseded artifacts must remain traceable without destructive deletion.",
      ],
      forbiddenActions: [
        "creating an in-app archive record",
        "storing the manifest in the app database",
        "marking the manifest complete",
      ],
      nonExecutionClauses: [
        "This checklist does not create external folders.",
        "This checklist does not write an archive manifest.",
      ],
      futureArtifacts: [
        "archive identity manifest",
        "release candidate label register",
        "artifact status glossary",
      ],
    }),
    archiveItem({
      id: "artifact_naming_convention_checklist",
      category: "artifact_naming",
      title: "Artifact naming convention checklist",
      status: "manual_required",
      owner: "operator",
      intent:
        "Prevent future approval artifacts from becoming ambiguous, duplicated, or detached from the blocker ids they resolve.",
      sourceRunbookStepIds: [
        "founder_scope_decision_runbook",
        "security_decision_runbook",
        "backend_decision_runbook",
        "qa_decision_runbook",
        "migration_decision_runbook",
      ],
      sourceRefs: [
        "docs/writer-persistence-human-go-no-go-runbook.md",
        "docs/mvp-qa-environment.md",
      ],
      archiveQuestion:
        "Can the future archive naming scheme support repeated reviews without losing which artifact is authoritative?",
      requiredMetadata: [
        "lane id",
        "artifact kind",
        "human-readable title",
        "version or supersession marker",
        "blocker id list",
      ],
      namingRules: [
        "Use lowercase kebab-case for lane and artifact kind.",
        "Use ISO dates in external paths.",
        "Never use raw user names, email addresses, or private case descriptions as filenames.",
      ],
      completenessChecks: [
        "Each file name maps to exactly one owner lane.",
        "Each artifact references at least one blocker id.",
        "Superseded artifacts point to their replacement.",
      ],
      redactionRules: [
        "File names must not contain private user data.",
        "File names must not contain provider ids, tokens, secrets, or account identifiers.",
      ],
      retentionRules: [
        "Renames must preserve a redirect or supersession record.",
        "Duplicate names must be rejected by the external archive owner.",
      ],
      forbiddenActions: [
        "renaming files from this app",
        "creating archive paths from this endpoint",
        "reading external folder contents",
      ],
      nonExecutionClauses: [
        "This item defines naming only.",
        "This item does not inspect or mutate external storage.",
      ],
      futureArtifacts: [
        "external naming convention",
        "artifact kind dictionary",
        "supersession naming examples",
      ],
    }),
    archiveItem({
      id: "owner_metadata_completeness_checklist",
      category: "owner_metadata",
      title: "Owner metadata completeness checklist",
      status: "manual_required",
      owner: "founder",
      intent:
        "Define the owner metadata required for each external decision artifact before implementation authorization can even be discussed.",
      sourceRunbookStepIds: [
        "founder_scope_decision_runbook",
        "security_decision_runbook",
        "backend_decision_runbook",
        "qa_decision_runbook",
        "operator_decision_runbook",
        "data_protection_decision_runbook",
      ],
      sourceRefs: [
        "docs/writer-persistence-human-go-no-go-runbook.md",
        "docs/writer-persistence-implementation-owner-signoff.md",
      ],
      archiveQuestion:
        "Does every external artifact name who is accountable, which lane they own, and what decision they made?",
      requiredMetadata: [
        "owner name or role",
        "owner lane",
        "decision state",
        "review date",
        "review scope",
        "unresolved caveats",
      ],
      namingRules: [
        "Owner lane names must match the runbook lane ids.",
        "Decision state must use `go`, `no-go`, or `needs-review`.",
      ],
      completenessChecks: [
        "Every required lane has one current artifact.",
        "No current artifact has an empty owner, lane, date, or decision state.",
      ],
      redactionRules: [
        "Use role or business identity only; do not include private contact data.",
        "Caveats must reference safe evidence ids instead of raw private examples.",
      ],
      retentionRules: [
        "Owner metadata changes must create a supersession note.",
        "The previous owner artifact must remain available for audit traceability.",
      ],
      forbiddenActions: [
        "collecting signatures in the app",
        "recording owner approval",
        "creating approval records",
      ],
      nonExecutionClauses: [
        "This item does not collect owner identity.",
        "This item does not accept any owner decision.",
      ],
      futureArtifacts: [
        "owner metadata schema",
        "lane decision table",
        "unresolved caveat register",
      ],
    }),
    archiveItem({
      id: "blocker_cross_reference_checklist",
      category: "blocker_cross_reference",
      title: "Blocker cross-reference checklist",
      status: "manual_required",
      owner: "backend",
      intent:
        "Ensure external approvals cannot drift away from the release blockers and runbook steps they claim to resolve.",
      sourceRunbookStepIds: [
        "source_release_no_go_invariant_runbook",
        "backend_decision_runbook",
        "migration_decision_runbook",
        "final_human_go_no_go_hard_stop",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-release-no-go.md",
        "docs/writer-persistence-human-go-no-go-runbook.md",
      ],
      archiveQuestion:
        "Can every external decision artifact be traced back to explicit release blocker ids and runbook step ids?",
      requiredMetadata: [
        "source runbook step ids",
        "source release blocker ids",
        "evidence ref ids",
        "decision scope",
      ],
      namingRules: [
        "Cross-reference sections must use exact blocker ids.",
        "Do not replace blocker ids with prose summaries only.",
      ],
      completenessChecks: [
        "Every hard release blocker has at least one mapped artifact.",
        "Every mapped artifact states whether it resolves, defers, or rejects the blocker.",
      ],
      redactionRules: [
        "Cross references should point to safe docs or checks, not raw payloads.",
        "Do not include provider response snippets as evidence refs.",
      ],
      retentionRules: [
        "A blocker mapping cannot be deleted when superseded.",
        "Rejected blockers must remain visible in the archive index.",
      ],
      forbiddenActions: [
        "persisting blocker mappings in the app",
        "marking blockers resolved",
        "granting implementation authorization",
      ],
      nonExecutionClauses: [
        "This item does not resolve blockers.",
        "This item does not create or update archive indexes.",
      ],
      futureArtifacts: [
        "blocker cross-reference table",
        "runbook step mapping",
        "resolved/deferred/rejected state glossary",
      ],
    }),
    archiveItem({
      id: "evidence_redaction_archive_checklist",
      category: "evidence_redaction",
      title: "Evidence redaction archive checklist",
      status: "manual_required",
      owner: "data_protection",
      intent:
        "Define what external archive evidence may contain so future approval records do not leak private prompts, narratives, provider payloads, or credentials.",
      sourceRunbookStepIds: [
        "security_decision_runbook",
        "data_protection_decision_runbook",
        "qa_decision_runbook",
      ],
      sourceRefs: [
        "docs/request-hashing-redaction-fixtures.md",
        "docs/writer-evidence-handoff-fixtures.md",
        "docs/writer-persistence-human-go-no-go-runbook.md",
      ],
      archiveQuestion:
        "Are future archive artifacts useful for review while still excluding private and credential-like material?",
      requiredMetadata: [
        "redaction reviewer",
        "redaction date",
        "allowed evidence fields",
        "excluded field classes",
      ],
      namingRules: [
        "Redaction artifacts must include the lane and redaction-review date.",
        "Use safe evidence ref names instead of sensitive subject descriptions.",
      ],
      completenessChecks: [
        "Every artifact has a redaction statement.",
        "Every evidence sample lists allowed and excluded field classes.",
      ],
      redactionRules: [
        "Exclude raw prompts, private narratives, provider payloads, private debug bodies, secrets, tokens, webhook payloads, and credential-like values.",
        "Use request hashes, safe refs, table names, blocker ids, and summarized command outcomes.",
      ],
      retentionRules: [
        "Redacted evidence samples may be retained only with an explicit owner.",
        "Rejected unredacted evidence must not be archived as an attachment.",
      ],
      forbiddenActions: [
        "reading raw external evidence",
        "storing raw payloads",
        "persisting evidence in the app",
      ],
      nonExecutionClauses: [
        "This item does not inspect real artifacts.",
        "This item does not hash or store evidence.",
      ],
      futureArtifacts: [
        "archive redaction checklist",
        "allowed evidence field inventory",
        "rejected evidence class register",
      ],
    }),
    archiveItem({
      id: "archive_completeness_gate_checklist",
      category: "completeness_check",
      title: "Archive completeness gate checklist",
      status: "manual_required",
      owner: "qa",
      intent:
        "Define the completeness checks that must pass before any future process can treat the external archive as reviewable.",
      sourceRunbookStepIds: [
        "qa_decision_runbook",
        "final_human_go_no_go_hard_stop",
      ],
      sourceRefs: [
        "docs/writer-persistence-acceptance-test-matrix.md",
        "docs/writer-persistence-human-go-no-go-runbook.md",
      ],
      archiveQuestion:
        "Can QA tell whether the external archive is complete without treating it as implementation approval?",
      requiredMetadata: [
        "lane coverage status",
        "artifact current/superseded status",
        "redaction review status",
        "blocker mapping status",
        "missing evidence notes",
      ],
      namingRules: [
        "Completeness summaries must be dated and scoped to one release candidate.",
        "Missing items must use blocker ids and lane ids.",
      ],
      completenessChecks: [
        "All required lanes have current artifacts.",
        "All current artifacts have owner, date, decision state, blocker ids, and redaction statement.",
        "No artifact depends on route output as the approval record.",
      ],
      redactionRules: [
        "Completeness summaries must not paste raw artifact bodies.",
        "Use yes/no/missing summaries and safe references.",
      ],
      retentionRules: [
        "Failed completeness checks must be retained until superseded.",
        "Superseded completeness summaries must retain their release candidate label.",
      ],
      forbiddenActions: [
        "marking archive complete in this endpoint",
        "accepting the archive",
        "granting release approval",
      ],
      nonExecutionClauses: [
        "This item does not validate real external artifacts.",
        "This item does not persist a completeness result.",
      ],
      futureArtifacts: [
        "archive completeness checklist",
        "lane coverage matrix",
        "missing evidence register",
      ],
    }),
    archiveItem({
      id: "retention_access_control_checklist",
      category: "retention_access",
      title: "Retention and access control checklist",
      status: "manual_required",
      owner: "security",
      intent:
        "Define who may retain, read, supersede, and export external approval artifacts before any implementation authorization process exists.",
      sourceRunbookStepIds: [
        "security_decision_runbook",
        "data_protection_decision_runbook",
        "operator_decision_runbook",
      ],
      sourceRefs: [
        "docs/service-role-isolation-test-harness.md",
        "docs/writer-rollback-compensation-model.md",
      ],
      archiveQuestion:
        "Can the external archive be retained and reviewed without expanding app permissions or exposing private evidence?",
      requiredMetadata: [
        "archive owner",
        "read access owner",
        "supersession authority",
        "retention period",
        "export restriction",
      ],
      namingRules: [
        "Access-control notes must be scoped to the external archive, not app roles.",
        "Retention records must include the release candidate label.",
      ],
      completenessChecks: [
        "Archive access owner is named.",
        "Supersession authority is named.",
        "Export restrictions are documented.",
      ],
      redactionRules: [
        "Access-control docs must not list secrets or tokens.",
        "Private user case data must not be used to justify access decisions.",
      ],
      retentionRules: [
        "Protected audit, payment, consent, and generated history must never be destructively deleted as rollback.",
        "External artifacts may be superseded but must remain traceable.",
      ],
      forbiddenActions: [
        "changing app permissions",
        "granting browser access to generated records",
        "deleting protected history",
      ],
      nonExecutionClauses: [
        "This item does not change RLS.",
        "This item does not modify external access controls.",
      ],
      futureArtifacts: [
        "external archive access policy",
        "retention owner note",
        "supersession authority register",
      ],
    }),
    archiveItem({
      id: "tamper_evidence_checksum_checklist",
      category: "tamper_evidence",
      title: "Tamper-evidence checksum checklist",
      status: "manual_required",
      owner: "backend",
      intent:
        "Define how future external artifacts should be made tamper-evident without this app reading, hashing, or storing the artifacts.",
      sourceRunbookStepIds: [
        "backend_decision_runbook",
        "migration_decision_runbook",
        "final_human_go_no_go_hard_stop",
      ],
      sourceRefs: [
        "docs/writer-persistence-adapter-design.md",
        "docs/writer-migration-application-runbook.md",
      ],
      archiveQuestion:
        "Can future reviewers detect whether an external artifact has changed without storing artifact bodies inside the app?",
      requiredMetadata: [
        "checksum algorithm",
        "checksum owner",
        "artifact version",
        "checksum created timestamp",
        "supersession link",
      ],
      namingRules: [
        "Checksum records must use the same lane and artifact kind as the source artifact.",
        "Checksum names must not include private data.",
      ],
      completenessChecks: [
        "Every current artifact has a checksum record or a documented reason why not.",
        "Checksum records reference artifact versions and blocker ids.",
      ],
      redactionRules: [
        "Checksums may be recorded externally, but artifact bodies must not be pasted into this app.",
        "Checksum metadata must not include secrets, tokens, or raw payload snippets.",
      ],
      retentionRules: [
        "Checksum history must be retained with superseded artifacts.",
        "A changed checksum must create a review note rather than silent overwrite.",
      ],
      forbiddenActions: [
        "hashing external artifacts from this endpoint",
        "reading artifact bytes",
        "persisting checksum records in the app",
      ],
      nonExecutionClauses: [
        "This item does not calculate checksums.",
        "This item does not read external artifact bodies.",
      ],
      futureArtifacts: [
        "external checksum policy",
        "artifact checksum register",
        "changed-checksum review note",
      ],
    }),
    archiveItem({
      id: "final_external_archive_hard_stop",
      category: "final_archive_hard_stop",
      title: "Final external archive hard stop",
      status: "blocked_by_human_runbook",
      owner: "founder",
      intent:
        "Keep implementation authorization blocked until a later process can externally review the archive without storing approvals in this app.",
      sourceRunbookStepIds: [
        "final_human_go_no_go_hard_stop",
        "source_release_no_go_invariant_runbook",
      ],
      sourceRefs: [
        "docs/writer-persistence-human-go-no-go-runbook.md",
        "docs/writer-persistence-implementation-release-no-go.md",
      ],
      archiveQuestion:
        "Is there still no app-side archive acceptance, implementation authorization, feature flag, deployment, writer execution, branch, file, test, migration, privileged client, transaction, or write?",
      requiredMetadata: [
        "archive checklist remains design-only",
        "implementation authorization remains false",
        "archive acceptance remains false",
      ],
      namingRules: [
        "The final archive hard stop must reference the source human runbook and release no-go packet.",
        "The final hard-stop artifact must not be named as approval.",
      ],
      completenessChecks: [
        "No runtime effect has occurred.",
        "The archive checklist cannot be used as release approval.",
        "A later authorization readiness checklist is still required.",
      ],
      redactionRules: [
        "Final hard-stop notes must use safe blocker ids only.",
        "Do not include private examples, provider payloads, or credential-like values.",
      ],
      retentionRules: [
        "The hard-stop state must remain visible until superseded by a later read-only stage.",
        "Any future supersession must still keep this no-approval checkpoint traceable.",
      ],
      forbiddenActions: [
        "accepting the external archive",
        "granting implementation authorization",
        "enabling feature flags",
        "running production writers",
      ],
      nonExecutionClauses: [
        "This checklist is the current hard stop.",
        "This checklist does not authorize implementation.",
      ],
      futureArtifacts: [
        "authorization readiness checklist",
        "external archive review summary",
        "implementation authorization no-write packet",
      ],
    }),
  ];
}

function countByStatus(
  items: WriterPersistenceExternalApprovalArchiveItem[],
  status: WriterPersistenceExternalApprovalArchiveStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceExternalApprovalArchiveItem[],
  key:
    | "requiredMetadata"
    | "namingRules"
    | "completenessChecks"
    | "redactionRules"
    | "retentionRules"
    | "forbiddenActions",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceExternalApprovalArchivePayload,
) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    archiveChecklistMode: payload.archiveChecklistMode,
    archiveChecklistOnly: true as const,
    sourceReleaseStillBlocked: true as const,
    externalApprovalArchiveRequired: true as const,
    externalApprovalStorageExternal: true as const,
    archiveArtifactStored: false as const,
    archiveArtifactUploaded: false as const,
    archiveArtifactRead: false as const,
    archiveArtifactHashCreated: false as const,
    archiveIndexPersisted: false as const,
    archiveCompletenessAccepted: false as const,
    externalApprovalArchiveAccepted: false as const,
    implementationAuthorizationGranted: false as const,
    implementationAuthorized: false as const,
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

export async function buildWriterPersistenceExternalApprovalArchive(): Promise<WriterPersistenceExternalApprovalArchivePayload> {
  const sourceHumanGoNoGo = await buildWriterPersistenceHumanGoNoGo();
  const archiveItems = buildArchiveItems();

  return {
    safeMode: true,
    readOnly: true,
    archiveChecklistMode:
      "persistence_adapter_external_approval_archive_checklist_only",
    sourceHumanGoNoGoMode: sourceHumanGoNoGo.humanGoNoGoMode,
    checkedAt: new Date().toISOString(),
    archiveItemCount: archiveItems.length,
    blockedByHumanRunbookCount: countByStatus(
      archiveItems,
      "blocked_by_human_runbook",
    ),
    manualRequiredCount: countByStatus(archiveItems, "manual_required"),
    requiredMetadataCount: uniqueCount(archiveItems, "requiredMetadata"),
    namingRuleCount: uniqueCount(archiveItems, "namingRules"),
    completenessCheckCount: uniqueCount(archiveItems, "completenessChecks"),
    redactionRuleCount: uniqueCount(archiveItems, "redactionRules"),
    retentionRuleCount: uniqueCount(archiveItems, "retentionRules"),
    forbiddenActionCount: uniqueCount(archiveItems, "forbiddenActions"),
    sourceRunbookStepCount: sourceHumanGoNoGo.runbookStepCount,
    sourceManualRequiredCount: sourceHumanGoNoGo.manualRequiredCount,
    archiveChecklistReady: true,
    archiveChecklistOnly: true,
    sourceHumanGoNoGoRunbookReady:
      sourceHumanGoNoGo.humanGoNoGoRunbookReady,
    sourceHumanGoNoGoRunbookOnly:
      sourceHumanGoNoGo.humanGoNoGoRunbookOnly,
    sourceReleaseStillBlocked: sourceHumanGoNoGo.releaseStillBlocked,
    sourceHumanDecisionCollectionExternal:
      sourceHumanGoNoGo.humanDecisionCollectionExternal,
    externalApprovalArchiveRequired: true,
    externalApprovalStorageExternal: true,
    archiveArtifactStored: false,
    archiveArtifactUploaded: false,
    archiveArtifactRead: false,
    archiveArtifactHashCreated: false,
    archiveIndexPersisted: false,
    archiveCompletenessAccepted: false,
    externalApprovalArchiveAccepted: false,
    implementationAuthorizationGranted: false,
    implementationAuthorized: false,
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
    archiveChecklistRules: [
      "This endpoint is a read-only external approval archive checklist, not an approval store.",
      "It may define external archive identity, naming, owner metadata, blocker cross-references, redaction, completeness, retention, access, tamper-evidence, and final hard-stop rules.",
      "It must not store approval artifacts, upload artifacts, read external artifacts, hash external artifacts, persist archive indexes, mark archives complete, accept external approval archives, grant implementation authorization, record human decisions, enable feature flags, deploy code, run production writers, accept patches, create files, create tests, create branches, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.",
      "The source human go/no-go runbook remains external-only and release remains blocked.",
    ],
    externalStorageRules: [
      "Future approval artifacts must remain outside this app until a separate approved persistence model exists.",
      "External artifacts must identify owner, lane, decision state, timestamp, blocker ids, safe evidence refs, redaction statement, supersession status, and retention owner.",
      "External artifacts must exclude raw private prompts, private narratives, provider payloads, private debug bodies, tokens, secrets, webhook bodies, and credential-like values.",
      "This app route response must not be archived as approval and must not be used to infer implementation authorization.",
      "A later authorization readiness checklist is still required before any implementation branch, patch, test, migration, writer, deployment, AI, Stripe, or report unlock work proceeds.",
    ],
    sourceBlockedCodes: sourceHumanGoNoGo.blockedCodes,
    archiveItems,
  };
}

export async function probeWriterPersistenceExternalApprovalArchive(
  requestBody: unknown,
): Promise<WriterPersistenceExternalApprovalArchiveProbeResult> {
  const payload = await buildWriterPersistenceExternalApprovalArchive();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence external approval archive probe blocked: request body must be a JSON object and no approval artifact storage, upload, read, hash, archive index persistence, archive acceptance, implementation authorization, human decision record, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      archiveItems: payload.archiveItems,
    };
  }

  const itemId = (requestBody as { itemId?: unknown }).itemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence external approval archive probe blocked: itemId must be a string and no approval artifact storage, upload, read, hash, archive index persistence, archive acceptance, implementation authorization, human decision record, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      archiveItems: payload.archiveItems,
    };
  }

  const selectedItem = payload.archiveItems.find(
    (candidate) => candidate.id === itemId,
  );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence external approval archive probe blocked: unknown item id and no approval artifact storage, upload, read, hash, archive index persistence, archive acceptance, implementation authorization, human decision record, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      archiveItems: payload.archiveItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence external approval archive probe blocked as designed: the selected archive checklist item was returned, but no approval artifact storage, upload, read, hash, archive index persistence, archive acceptance, implementation authorization, human decision record, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
    archiveItems: [selectedItem],
  };
}
