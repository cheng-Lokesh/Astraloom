import "server-only";

import { buildWriterMigrationProposal } from "@/lib/server-writers/migration-proposal";
import type {
  WriterMigrationReviewCategory,
  WriterMigrationReviewItem,
  WriterMigrationReviewPayload,
  WriterMigrationReviewProbeResult,
  WriterMigrationReviewSection,
} from "@/types/writer-migration-review";

function item(
  input: Omit<
    WriterMigrationReviewItem,
    "defined" | "status" | "mustPassBeforeMigration"
  >,
): WriterMigrationReviewItem {
  return {
    ...input,
    defined: true,
    status: "pending_manual_review",
    mustPassBeforeMigration: true,
  };
}

function section(input: {
  id: string;
  category: WriterMigrationReviewCategory;
  title: string;
  purpose: string;
  requiredApprover: string;
  exitCriteria: string;
  items: WriterMigrationReviewItem[];
}): WriterMigrationReviewSection {
  return {
    ...input,
    status: "pending_manual_review",
  };
}

function buildSections(): WriterMigrationReviewSection[] {
  return [
    section({
      id: "proposal_integrity_review",
      category: "proposal_integrity",
      title: "Proposal integrity review",
      purpose:
        "Confirm the migration proposal is still only a review artifact and still matches the approved writer evidence chain.",
      requiredApprover: "Founder/operator plus technical reviewer",
      exitCriteria:
        "The proposal remains proposal-only, covers exactly the audit and idempotency tables, exposes no secrets, and is traceable to evidence handoff fixtures.",
      items: [
        item({
          id: "proposal_only_mode_confirmed",
          category: "proposal_integrity",
          title: "Proposal-only mode confirmed",
          requirement:
            "Verify `/api/system-writers/migration-proposal` returns `proposalMode=proposal_only` and every dangerous action flag remains false.",
          evidenceRequired:
            "Captured API response showing no migration file creation, no SQL application, no table creation, no writes, no service-role client, no AI call, and no Stripe call.",
          owner: "Technical reviewer",
          blocking: true,
          sourceRefs: [
            "/api/system-writers/migration-proposal",
            "/server-writers/migration",
          ],
        }),
        item({
          id: "proposal_scope_limited_to_two_tables",
          category: "proposal_integrity",
          title: "Scope limited to two writer tables",
          requirement:
            "Confirm the SQL proposal contains only `writer_audit_events` and `writer_idempotency_keys` as new server-owned tables.",
          evidenceRequired:
            "Review note confirming there are no generated artifact, payment, report, support, or consent table alterations in the proposal.",
          owner: "Technical reviewer",
          blocking: true,
          sourceRefs: [
            "/server-writers/migration",
            "docs/writer-migration-proposal.md",
          ],
        }),
        item({
          id: "source_models_traceable",
          category: "proposal_integrity",
          title: "Source models traceable",
          requirement:
            "Confirm every proposed field is traceable to the audit model, idempotency model, redaction fixtures, and evidence handoff fixtures.",
          evidenceRequired:
            "Checklist notes linking proposed columns to source model refs and explaining any intentional naming differences.",
          owner: "Technical reviewer",
          blocking: true,
          sourceRefs: [
            "/server-writers/audit",
            "/server-writers/idempotency",
            "/server-writers/redaction",
            "/server-writers/evidence",
          ],
        }),
      ],
    }),
    section({
      id: "schema_review",
      category: "schema",
      title: "Schema review",
      purpose:
        "Review whether the future tables are durable enough for writer execution, support review, replay, and rollback analysis.",
      requiredApprover: "Database reviewer",
      exitCriteria:
        "Column names, constraints, data types, uniqueness rules, timestamp fields, and JSON metadata boundaries are approved.",
      items: [
        item({
          id: "audit_schema_append_only",
          category: "schema",
          title: "Audit schema supports append-only history",
          requirement:
            "`writer_audit_events` must support attempt, gate block, success, failure, adapter probe, and rollback reference events without updating previous rows in place.",
          evidenceRequired:
            "Reviewer note confirming lifecycle coverage, immutable event identity, writer version storage, request hash, target tables, and blocked codes.",
          owner: "Database reviewer",
          blocking: true,
          sourceRefs: [
            "/server-writers/audit",
            "/api/system-writers/audit",
            "/server-writers/migration",
          ],
        }),
        item({
          id: "idempotency_schema_conflict_ready",
          category: "schema",
          title: "Idempotency schema supports replay and conflict detection",
          requirement:
            "`writer_idempotency_keys` must support same-key replay, same-key different-hash conflict rejection, pending locks, result refs, audit refs, and expiry.",
          evidenceRequired:
            "Reviewer note confirming uniqueness, request hash storage, status field behavior, lock expiry behavior, result refs, and audit event references.",
          owner: "Database reviewer",
          blocking: true,
          sourceRefs: [
            "/server-writers/idempotency",
            "/api/system-writers/idempotency",
            "/server-writers/migration",
          ],
        }),
        item({
          id: "no_existing_table_alteration",
          category: "schema",
          title: "No existing table alteration",
          requirement:
            "The migration must not alter existing MVP tables unless a separate reviewed migration task explicitly approves that change.",
          evidenceRequired:
            "SQL diff review showing no `alter table` against generated, payment, support, consent, seed, or people tables.",
          owner: "Database reviewer",
          blocking: true,
          sourceRefs: ["supabase/migrations/0001_mvp_core_schema.sql"],
        }),
      ],
    }),
    section({
      id: "rls_review",
      category: "rls",
      title: "RLS and access review",
      purpose:
        "Keep audit and idempotency tables server-owned, with no browser policy that could leak operational evidence or allow user mutation.",
      requiredApprover: "Security reviewer",
      exitCriteria:
        "RLS is enabled, browser policies are absent, and future access is explicitly limited to service-role writer modules and operator diagnostics.",
      items: [
        item({
          id: "rls_enabled_no_browser_policy",
          category: "rls",
          title: "RLS enabled with no browser policy",
          requirement:
            "Both proposed tables must enable RLS and must not define `create policy` for browser insert, update, delete, or select access in MVP.",
          evidenceRequired:
            "SQL review showing `enable row level security` and zero browser policies for both tables.",
          owner: "Security reviewer",
          blocking: true,
          sourceRefs: ["/server-writers/migration"],
        }),
        item({
          id: "service_role_access_not_browser_access",
          category: "rls",
          title: "Service-role access stays server-only",
          requirement:
            "Any future access path must live in server-only modules and must not be imported by client components.",
          evidenceRequired:
            "Review note linking future writer access to `.server` modules and confirming no client imports.",
          owner: "Security reviewer",
          blocking: true,
          sourceRefs: [
            "/server-writers/isolation",
            "/server-writers/stubs",
            "docs/service-role-isolation-test-harness.md",
          ],
        }),
        item({
          id: "secret_exposure_check",
          category: "rls",
          title: "Secret exposure check",
          requirement:
            "Migration review artifacts, APIs, and pages must not serialize service-role keys, provider keys, access tokens, refresh tokens, or webhook secrets.",
          evidenceRequired:
            "Route/API scan showing no secret literals or secret values in responses.",
          owner: "Security reviewer",
          blocking: true,
          sourceRefs: [
            "/api/system-writers/migration-proposal",
            "/api/system-writers/migration-review",
          ],
        }),
      ],
    }),
    section({
      id: "index_review",
      category: "index",
      title: "Index review",
      purpose:
        "Make sure the first real migration supports operational lookup without over-indexing immature tables.",
      requiredApprover: "Database reviewer",
      exitCriteria:
        "Indexes have a clear lookup purpose and do not introduce avoidable write amplification for early MVP usage.",
      items: [
        item({
          id: "audit_indexes_justified",
          category: "index",
          title: "Audit indexes justified",
          requirement:
            "Audit indexes must support contract/date lookup, request-hash lookup, and optional user-hash support review.",
          evidenceRequired:
            "Reviewer note mapping each audit index to a real support, rollback, duplicate, or investigation query.",
          owner: "Database reviewer",
          blocking: true,
          sourceRefs: ["/server-writers/migration"],
        }),
        item({
          id: "idempotency_indexes_justified",
          category: "index",
          title: "Idempotency indexes justified",
          requirement:
            "Idempotency indexes must support status sweeps, request-hash lookup, and audit-event traceability.",
          evidenceRequired:
            "Reviewer note mapping each idempotency index to replay, conflict, lock cleanup, or support lookup behavior.",
          owner: "Database reviewer",
          blocking: true,
          sourceRefs: ["/server-writers/migration"],
        }),
      ],
    }),
    section({
      id: "privacy_retention_review",
      category: "privacy_retention",
      title: "Privacy and retention review",
      purpose:
        "Prevent audit/idempotency persistence from becoming a hidden store of private narratives, prompts, raw model responses, tokens, or Stripe payloads.",
      requiredApprover: "Privacy reviewer",
      exitCriteria:
        "Retention windows, redaction guarantees, support access, deletion behavior, and forbidden content rules are approved.",
      items: [
        item({
          id: "raw_payload_storage_forbidden",
          category: "privacy_retention",
          title: "Raw payload storage forbidden",
          requirement:
            "Audit and idempotency rows must store request hashes, ids, metadata, and redacted evidence refs only, not raw private text or raw payloads.",
          evidenceRequired:
            "Review note confirming no raw seed narrative, prompt, model output, Stripe webhook body, token, or secret can enter these tables.",
          owner: "Privacy reviewer",
          blocking: true,
          sourceRefs: [
            "/server-writers/redaction",
            "/server-writers/evidence",
            "docs/request-hashing-redaction-fixtures.md",
          ],
        }),
        item({
          id: "retention_window_approved",
          category: "privacy_retention",
          title: "Retention window approved",
          requirement:
            "Before applying SQL, approve separate retention expectations for generated artifacts, payment evidence, consent events, support investigations, and expired idempotency locks.",
          evidenceRequired:
            "Written retention decision with owner, rationale, and future deletion/export behavior.",
          owner: "Founder/operator plus privacy reviewer",
          blocking: true,
          sourceRefs: [
            "/server-writers/audit",
            "/server-writers/idempotency",
            "/server-writers/rollback",
          ],
        }),
        item({
          id: "support_access_boundary",
          category: "privacy_retention",
          title: "Support access boundary",
          requirement:
            "Define which operational roles can inspect audit/idempotency rows and what they can see before production support use.",
          evidenceRequired:
            "Support access rule stating default deny, minimum necessary metadata, and manual escalation behavior.",
          owner: "Founder/operator",
          blocking: true,
          sourceRefs: [
            "/billing",
            "docs/writer-rollout-checklist.md",
          ],
        }),
      ],
    }),
    section({
      id: "audit_idempotency_behavior_review",
      category: "audit",
      title: "Audit and idempotency behavior review",
      purpose:
        "Approve behavior before the database can store audit rows or reserve idempotency keys.",
      requiredApprover: "Technical reviewer",
      exitCriteria:
        "Audit lifecycles, idempotency statuses, duplicate behavior, conflict behavior, and failure behavior are approved.",
      items: [
        item({
          id: "audit_lifecycle_approved",
          category: "audit",
          title: "Audit lifecycle approved",
          requirement:
            "Every future writer must record attempt, block, success, failure, and rollback reference events in a consistent append-only lifecycle.",
          evidenceRequired:
            "Lifecycle matrix by writer contract with required audit events and failure cases.",
          owner: "Technical reviewer",
          blocking: true,
          sourceRefs: [
            "/server-writers/audit",
            "/server-writers/contracts",
          ],
        }),
        item({
          id: "idempotency_status_approved",
          category: "idempotency",
          title: "Idempotency status behavior approved",
          requirement:
            "Pending, succeeded, failed, conflict, expired, and replay behavior must be defined before reserving keys.",
          evidenceRequired:
            "Status transition note covering retry, duplicate request, same-key different-hash conflict, stale lock, and result replay.",
          owner: "Technical reviewer",
          blocking: true,
          sourceRefs: [
            "/server-writers/idempotency",
            "/server-writers/dry-run",
          ],
        }),
        item({
          id: "write_order_approved",
          category: "idempotency",
          title: "Write order approved",
          requirement:
            "The future writer order must be idempotency reservation, audit attempt, service-role write, audit success/failure, then compensation reference if needed.",
          evidenceRequired:
            "Execution sequence note linked to guardrail phases and rollback model.",
          owner: "Technical reviewer",
          blocking: true,
          sourceRefs: [
            "/server-writers/guardrail",
            "/server-writers/rollback",
          ],
        }),
      ],
    }),
    section({
      id: "rollback_operations_approval",
      category: "rollback",
      title: "Rollback, operations, and approval review",
      purpose:
        "Prevent the first real migration from implying production readiness for writers, AI, Stripe, or report unlocks.",
      requiredApprover: "Founder/operator",
      exitCriteria:
        "Rollback path, observability, manual approval record, and post-migration verification steps are written before SQL is applied.",
      items: [
        item({
          id: "post_migration_verification_written",
          category: "operations",
          title: "Post-migration verification written",
          requirement:
            "Define the exact checks to run after applying SQL: table presence, RLS enabled, zero policies, no rows, and all writer flags still disabled.",
          evidenceRequired:
            "Post-migration checklist with expected SQL/API results and rollback stop conditions.",
          owner: "Founder/operator plus technical reviewer",
          blocking: true,
          sourceRefs: [
            "/setup",
            "/qa",
            "docs/mvp-qa-environment.md",
          ],
        }),
        item({
          id: "rollback_plan_written",
          category: "rollback",
          title: "Migration rollback plan written",
          requirement:
            "Define how to respond if the migration is applied incorrectly, while preserving audit and idempotency history once production writes exist.",
          evidenceRequired:
            "Rollback note distinguishing pre-production empty-table rollback from post-production data-preserving migration repair.",
          owner: "Database reviewer",
          blocking: true,
          sourceRefs: [
            "/server-writers/rollback",
            "docs/writer-rollback-compensation-model.md",
          ],
        }),
        item({
          id: "operator_approval_record_required",
          category: "approval",
          title: "Operator approval record required",
          requirement:
            "Before SQL is applied, record who approved it, what SQL was approved, when it was approved, which environment it targets, and which actions remain forbidden.",
          evidenceRequired:
            "Manual approval record or issue comment containing SQL hash, migration name, approver, environment, date, and no-write gate confirmation.",
          owner: "Founder/operator",
          blocking: true,
          sourceRefs: [
            "/server-writers/rollout",
            "docs/writer-rollout-checklist.md",
          ],
        }),
      ],
    }),
  ];
}

export function buildWriterMigrationReviewChecklist(): WriterMigrationReviewPayload {
  const proposal = buildWriterMigrationProposal();
  const sections = buildSections();
  const items = sections.flatMap((reviewSection) => reviewSection.items);

  return {
    safeMode: true,
    readOnly: true,
    checklistMode: "review_checklist_only",
    sourceProposalMode: proposal.proposalMode,
    sourceMigrationName: proposal.migrationName,
    sourceProposalAllChecksPassed: proposal.allChecksPassed,
    sourceProposedTableCount: proposal.proposedTableCount,
    sourceProposedPolicyCount: proposal.proposedPolicyCount,
    sectionCount: sections.length,
    itemCount: items.length,
    blockingItemCount: items.filter((reviewItem) => reviewItem.blocking).length,
    allItemsDefined: items.every((reviewItem) => reviewItem.defined),
    manualApprovalRequired: true,
    approvedForMigration: false,
    readyToApplyMigration: false,
    wouldCreateMigrationFile: false,
    wouldApplyMigration: false,
    wouldCreateTables: false,
    wouldAlterExistingTables: false,
    wouldWriteRows: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKeys: false,
    wouldCreateServiceRoleClient: false,
    wouldReadServiceRoleSecret: false,
    wouldCallAi: false,
    wouldCallStripe: false,
    globalRules: [
      "This stage defines manual review requirements only; it does not create a migration file or apply SQL.",
      "The source proposal must stay proposal_only until the review checklist is completed by a human/operator workflow.",
      "The audit and idempotency tables must stay server-owned and must not gain browser policies in MVP.",
      "Applying SQL does not approve any real writer, AI call, Stripe call, report unlock, audit write, or idempotency reservation.",
      "No private narrative, raw prompt, raw model response, raw Stripe payload, token, provider key, webhook secret, or service-role value may be stored in audit/idempotency tables.",
      "Future production rollout still requires service-role isolation, append-only audit persistence, idempotency reservation, rollback behavior, observability, and operator approval.",
    ],
    promotionRules: [
      "A real migration file may be created only after every blocking review item has a recorded approval.",
      "The SQL hash and migration name must be captured in the approval record before execution.",
      "Post-migration checks must confirm table presence, RLS enabled, zero browser policies, zero rows, and dangerous feature flags still off.",
      "If any check fails, stop before enabling writers and document whether rollback is empty-table rollback or data-preserving repair.",
      "Writer execution remains forbidden after migration until separate audit writer, idempotency writer, and service-role adapter implementation tasks are reviewed.",
    ],
    sourceRefs: [
      "/server-writers/migration",
      "/api/system-writers/migration-proposal",
      "/server-writers/audit",
      "/server-writers/idempotency",
      "/server-writers/redaction",
      "/server-writers/evidence",
      "/server-writers/guardrail",
      "/server-writers/rollback",
      "/server-writers/rollout",
    ],
    sections,
  };
}

export function probeWriterMigrationReviewChecklist(
  requestBody: unknown,
): WriterMigrationReviewProbeResult {
  const payload = buildWriterMigrationReviewChecklist();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      checklistMode: "review_checklist_only",
      itemCount: payload.itemCount,
      blockingItemCount: payload.blockingItemCount,
      approvedForMigration: false,
      readyToApplyMigration: false,
      wouldCreateMigrationFile: false,
      wouldApplyMigration: false,
      wouldCreateTables: false,
      wouldWriteRows: false,
      wouldWriteAuditRows: false,
      wouldReserveIdempotencyKeys: false,
      wouldCreateServiceRoleClient: false,
      items: payload.sections[0]?.items ?? [],
      summary:
        "Migration review probe blocked: request body must be a JSON object and no migration review approval was recorded.",
    };
  }

  const sectionId = (requestBody as { sectionId?: unknown }).sectionId;

  if (typeof sectionId !== "string") {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      checklistMode: "review_checklist_only",
      itemCount: payload.itemCount,
      blockingItemCount: payload.blockingItemCount,
      approvedForMigration: false,
      readyToApplyMigration: false,
      wouldCreateMigrationFile: false,
      wouldApplyMigration: false,
      wouldCreateTables: false,
      wouldWriteRows: false,
      wouldWriteAuditRows: false,
      wouldReserveIdempotencyKeys: false,
      wouldCreateServiceRoleClient: false,
      items: payload.sections[0]?.items ?? [],
      summary:
        "Migration review probe blocked: sectionId is required and no migration was approved.",
    };
  }

  const reviewSection = payload.sections.find((entry) => entry.id === sectionId);

  if (!reviewSection) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      checklistMode: "review_checklist_only",
      sectionId,
      itemCount: payload.itemCount,
      blockingItemCount: payload.blockingItemCount,
      approvedForMigration: false,
      readyToApplyMigration: false,
      wouldCreateMigrationFile: false,
      wouldApplyMigration: false,
      wouldCreateTables: false,
      wouldWriteRows: false,
      wouldWriteAuditRows: false,
      wouldReserveIdempotencyKeys: false,
      wouldCreateServiceRoleClient: false,
      items: [],
      summary:
        "Migration review probe blocked: unknown review section and no migration was approved.",
    };
  }

  return {
    safeMode: true,
    readOnly: true,
    blocked: true,
    checklistMode: "review_checklist_only",
    sectionId,
    itemCount: reviewSection.items.length,
    blockingItemCount: reviewSection.items.filter((reviewItem) => reviewItem.blocking)
      .length,
    approvedForMigration: false,
    readyToApplyMigration: false,
    wouldCreateMigrationFile: false,
    wouldApplyMigration: false,
    wouldCreateTables: false,
    wouldWriteRows: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKeys: false,
    wouldCreateServiceRoleClient: false,
    items: reviewSection.items,
    summary:
      "Migration review probe blocked as designed: review requirements were returned, but no approval was recorded, no migration file was created, no SQL was applied, and no table was created.",
  };
}
