import "server-only";

import { createHash } from "node:crypto";

import { buildWriterMigrationProposal } from "@/lib/server-writers/migration-proposal";
import { buildWriterMigrationReviewChecklist } from "@/lib/server-writers/migration-review";
import type {
  WriterMigrationRunbookPayload,
  WriterMigrationRunbookPhase,
  WriterMigrationRunbookPhaseId,
  WriterMigrationRunbookProbeResult,
  WriterMigrationRunbookStep,
} from "@/types/writer-migration-runbook";

const runbookPhaseIds: WriterMigrationRunbookPhaseId[] = [
  "preflight",
  "approval_record",
  "manual_execution",
  "post_migration_checks",
  "abort_and_rollback",
  "handoff",
];

function isRunbookPhaseId(value: unknown): value is WriterMigrationRunbookPhaseId {
  return (
    typeof value === "string" &&
    runbookPhaseIds.includes(value as WriterMigrationRunbookPhaseId)
  );
}

function sha256(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function step(
  input: Omit<WriterMigrationRunbookStep, "manualOnly" | "status">,
): WriterMigrationRunbookStep {
  return {
    ...input,
    manualOnly: true,
    status: "not_started",
  };
}

function phase(input: WriterMigrationRunbookPhase): WriterMigrationRunbookPhase {
  return input;
}

function buildPhases(): WriterMigrationRunbookPhase[] {
  return [
    phase({
      id: "preflight",
      title: "Preflight freeze",
      purpose:
        "Freeze the exact proposal and environment state before any human considers applying SQL.",
      requiredOperator: "Founder/operator plus technical reviewer",
      exitCriteria:
        "The SQL hash, proposal mode, review status, target environment, and no-write flags are captured before opening Supabase SQL Editor.",
      steps: [
        step({
          id: "capture_source_sql_hash",
          phaseId: "preflight",
          title: "Capture source SQL hash",
          instruction:
            "Record the `sourceSqlSha256` value from this runbook and compare it with the SQL visible on `/server-writers/migration` before any manual execution.",
          requiredEvidence:
            "Approval note containing migration name, SQL hash, reviewer, target environment, and timestamp.",
          stopCondition:
            "Stop if the SQL text, hash, migration name, or target environment differs from the approved record.",
          owner: "Technical reviewer",
          blocking: true,
          sourceRefs: [
            "/server-writers/migration",
            "/api/system-writers/migration-proposal",
          ],
        }),
        step({
          id: "confirm_review_not_auto_approval",
          phaseId: "preflight",
          title: "Confirm review is not auto-approval",
          instruction:
            "Confirm `/api/system-writers/migration-review` still returns `approvedForMigration=false` and `readyToApplyMigration=false`; approvals must be recorded outside the app.",
          requiredEvidence:
            "Captured API response or review note proving the app did not approve the migration automatically.",
          stopCondition:
            "Stop if the app reports approval or readiness without an explicit human approval record.",
          owner: "Founder/operator",
          blocking: true,
          sourceRefs: [
            "/server-writers/migration-review",
            "/api/system-writers/migration-review",
          ],
        }),
        step({
          id: "confirm_dangerous_flags_off",
          phaseId: "preflight",
          title: "Confirm dangerous flags are still off",
          instruction:
            "Check setup/status pages and confirm system writers, AI generation, Stripe writes, and service-role execution remain disabled before migration work.",
          requiredEvidence:
            "Screenshot or copied status summary showing dangerous gates disabled.",
          stopCondition:
            "Stop if any writer, AI, Stripe, report unlock, service-role client, audit write, or idempotency reservation path is enabled.",
          owner: "Founder/operator",
          blocking: true,
          sourceRefs: [
            "/setup",
            "/server-writers",
            "/api/system-writers/status",
          ],
        }),
      ],
    }),
    phase({
      id: "approval_record",
      title: "Approval record",
      purpose:
        "Create a durable human approval record before opening the database console.",
      requiredOperator: "Founder/operator",
      exitCriteria:
        "The approval record names the exact SQL hash, target environment, approver, execution window, and actions that remain forbidden after migration.",
      steps: [
        step({
          id: "record_approver_and_scope",
          phaseId: "approval_record",
          title: "Record approver and scope",
          instruction:
            "Record approver identity, approval date, target environment, migration name, SQL hash, and exact table scope.",
          requiredEvidence:
            "Approval record confirming only `writer_audit_events` and `writer_idempotency_keys` are in scope.",
          stopCondition:
            "Stop if the approval record includes any generated artifact, payment, report, support, consent, or browser policy change.",
          owner: "Founder/operator",
          blocking: true,
          sourceRefs: [
            "docs/writer-migration-review-checklist.md",
            "/server-writers/migration-review",
          ],
        }),
        step({
          id: "record_forbidden_actions",
          phaseId: "approval_record",
          title: "Record forbidden actions",
          instruction:
            "Record that applying the migration does not approve writers, AI generation, Stripe writes, report unlocks, audit writes, idempotency reservations, or service-role client creation.",
          requiredEvidence:
            "Approval record section listing forbidden post-migration actions.",
          stopCondition:
            "Stop if the migration approval is treated as approval to enable any runtime writer.",
          owner: "Founder/operator",
          blocking: true,
          sourceRefs: [
            "/server-writers/rollout",
            "docs/writer-rollout-checklist.md",
          ],
        }),
        step({
          id: "record_rollback_decision",
          phaseId: "approval_record",
          title: "Record rollback decision",
          instruction:
            "Choose the rollback posture before execution: empty-table rollback is allowed only before any production writer exists; after writes exist, use data-preserving repair.",
          requiredEvidence:
            "Approval record section explaining empty-table rollback versus data-preserving repair.",
          stopCondition:
            "Stop if there is no rollback posture or if destructive rollback is allowed after production writes.",
          owner: "Database reviewer",
          blocking: true,
          sourceRefs: [
            "/server-writers/rollback",
            "docs/writer-rollback-compensation-model.md",
          ],
        }),
      ],
    }),
    phase({
      id: "manual_execution",
      title: "Manual execution",
      purpose:
        "Define exactly how a human would apply approved SQL outside this app, while the app itself remains unable to execute it.",
      requiredOperator: "Database operator",
      exitCriteria:
        "The operator copies only the approved SQL, applies it once in the intended Supabase project, and records the execution result.",
      steps: [
        step({
          id: "open_database_console_manually",
          phaseId: "manual_execution",
          title: "Open database console manually",
          instruction:
            "A human operator opens the intended Supabase SQL Editor manually. The app must not open an authenticated database console or transmit secrets.",
          requiredEvidence:
            "Operator note naming the target environment without exposing tokens, keys, or service-role values.",
          stopCondition:
            "Stop if an automation, browser script, app route, or service-role client attempts to apply SQL.",
          owner: "Database operator",
          blocking: true,
          sourceRefs: [
            "docs/supabase-auth-sync-setup.md",
            "/setup/migration",
          ],
        }),
        step({
          id: "paste_approved_sql_only",
          phaseId: "manual_execution",
          title: "Paste approved SQL only",
          instruction:
            "Copy the approved SQL text from the reviewed proposal only after the approval record exists and the SQL hash matches.",
          requiredEvidence:
            "Execution note confirming SQL hash match immediately before running SQL.",
          stopCondition:
            "Stop if the SQL editor contains additional statements, altered table changes, browser policies, seed data, inserts, updates, deletes, AI calls, or Stripe-related logic.",
          owner: "Database operator",
          blocking: true,
          sourceRefs: [
            "/server-writers/migration",
            "docs/writer-migration-proposal.md",
          ],
        }),
        step({
          id: "execute_once_and_capture_result",
          phaseId: "manual_execution",
          title: "Execute once and capture result",
          instruction:
            "Run the approved SQL once, then capture the database result and timestamp for the approval record.",
          requiredEvidence:
            "Execution result note with timestamp, success/failure state, and any database warnings.",
          stopCondition:
            "Stop immediately after any error; do not retry with edited SQL until the proposal and approval record are updated.",
          owner: "Database operator",
          blocking: true,
          sourceRefs: [
            "docs/writer-migration-review-checklist.md",
            "docs/writer-migration-proposal.md",
          ],
        }),
      ],
    }),
    phase({
      id: "post_migration_checks",
      title: "Post-migration checks",
      purpose:
        "Verify the database result after manual execution while keeping all runtime writer capabilities disabled.",
      requiredOperator: "Database reviewer",
      exitCriteria:
        "Both tables exist, RLS is enabled, browser policies are absent, rows are zero, and dangerous runtime flags are still off.",
      steps: [
        step({
          id: "verify_tables_exist",
          phaseId: "post_migration_checks",
          title: "Verify tables exist",
          instruction:
            "Manually verify `public.writer_audit_events` and `public.writer_idempotency_keys` exist in the target database.",
          requiredEvidence:
            "Schema check result showing both tables present.",
          stopCondition:
            "Stop before enabling any writer if either table is missing or has a different name.",
          owner: "Database reviewer",
          blocking: true,
          sourceRefs: ["/server-writers/migration"],
        }),
        step({
          id: "verify_rls_enabled_no_policies",
          phaseId: "post_migration_checks",
          title: "Verify RLS and zero browser policies",
          instruction:
            "Manually verify RLS is enabled for both tables and there are no browser access policies.",
          requiredEvidence:
            "Database policy check showing RLS enabled and zero `create policy` entries for both tables.",
          stopCondition:
            "Stop if any browser insert, update, delete, or select policy exists for writer-owned audit/idempotency tables.",
          owner: "Security reviewer",
          blocking: true,
          sourceRefs: [
            "/server-writers/migration",
            "/server-writers/migration-review",
          ],
        }),
        step({
          id: "verify_zero_rows",
          phaseId: "post_migration_checks",
          title: "Verify zero rows",
          instruction:
            "Manually verify both new tables contain zero rows immediately after migration.",
          requiredEvidence:
            "Row count check showing `writer_audit_events=0` and `writer_idempotency_keys=0`.",
          stopCondition:
            "Stop if any row exists before real writer implementation and audit/idempotency persistence are reviewed.",
          owner: "Database reviewer",
          blocking: true,
          sourceRefs: [
            "/api/system-writers/audit",
            "/api/system-writers/idempotency",
          ],
        }),
        step({
          id: "verify_runtime_still_disabled",
          phaseId: "post_migration_checks",
          title: "Verify runtime still disabled",
          instruction:
            "Re-check app status after migration and confirm system writers, AI, Stripe, report unlock, audit write, and idempotency reservation remain disabled.",
          requiredEvidence:
            "Route/API check showing no dangerous runtime flag changed after migration.",
          stopCondition:
            "Stop if migration execution changed runtime behavior or enabled any writer path.",
          owner: "Founder/operator",
          blocking: true,
          sourceRefs: [
            "/server-writers",
            "/qa",
            "/api/system-writers/status",
          ],
        }),
      ],
    }),
    phase({
      id: "abort_and_rollback",
      title: "Abort and rollback",
      purpose:
        "Define how to stop safely when preflight, execution, or post-checks fail.",
      requiredOperator: "Founder/operator plus database reviewer",
      exitCriteria:
        "The team can distinguish a harmless empty-table correction from a data-preserving repair once production writes exist.",
      steps: [
        step({
          id: "abort_on_preflight_mismatch",
          phaseId: "abort_and_rollback",
          title: "Abort on preflight mismatch",
          instruction:
            "If SQL hash, environment, approval, or proposal scope mismatches, do not execute SQL and return to review.",
          requiredEvidence:
            "Abort note explaining which mismatch blocked execution.",
          stopCondition:
            "Stop all migration work until proposal and approval records are realigned.",
          owner: "Founder/operator",
          blocking: true,
          sourceRefs: [
            "/server-writers/migration",
            "/server-writers/migration-review",
          ],
        }),
        step({
          id: "empty_table_rollback_only_before_writes",
          phaseId: "abort_and_rollback",
          title: "Empty-table rollback only before writes",
          instruction:
            "If the migration was applied incorrectly before any writer exists and both tables are empty, a manual empty-table rollback may be reviewed.",
          requiredEvidence:
            "Row count proof showing zero rows plus approval for empty-table rollback.",
          stopCondition:
            "Stop if either table contains rows or if any production writer has ever written audit/idempotency data.",
          owner: "Database reviewer",
          blocking: true,
          sourceRefs: ["docs/writer-rollback-compensation-model.md"],
        }),
        step({
          id: "data_preserving_repair_after_writes",
          phaseId: "abort_and_rollback",
          title: "Data-preserving repair after writes",
          instruction:
            "After production writes exist, never drop audit or idempotency history as rollback; create a reviewed repair migration instead.",
          requiredEvidence:
            "Repair plan preserving audit/idempotency history and explaining operator impact.",
          stopCondition:
            "Stop if the proposed rollback would delete audit history, idempotency history, payment history, or consent history.",
          owner: "Database reviewer",
          blocking: true,
          sourceRefs: [
            "/server-writers/rollback",
            "/server-writers/rollout",
          ],
        }),
      ],
    }),
    phase({
      id: "handoff",
      title: "Post-run handoff",
      purpose:
        "Record what remains forbidden after migration and what future implementation can safely do next.",
      requiredOperator: "Founder/operator",
      exitCriteria:
        "A post-run note states the migration outcome and confirms the next code task remains separate from production writer enablement.",
      steps: [
        step({
          id: "record_post_run_summary",
          phaseId: "handoff",
          title: "Record post-run summary",
          instruction:
            "Record whether SQL was applied, which environment was targeted, which checks passed, and which runtime capabilities remain disabled.",
          requiredEvidence:
            "Post-run summary linked to the approval record and post-migration checks.",
          stopCondition:
            "Stop if the team cannot identify which environment was changed or which SQL hash was applied.",
          owner: "Founder/operator",
          blocking: true,
          sourceRefs: [
            "docs/writer-migration-review-checklist.md",
            "docs/writer-migration-proposal.md",
          ],
        }),
        step({
          id: "confirm_next_task_separate",
          phaseId: "handoff",
          title: "Confirm next task remains separate",
          instruction:
            "Confirm the next implementation task is still a separate reviewed step, such as a persistence adapter implementation checklist, not real writer enablement.",
          requiredEvidence:
            "Next-task note stating service-role writers, AI, Stripe, report unlock, audit writes, and idempotency reservations remain disabled.",
          stopCondition:
            "Stop if migration success is used as approval to execute writers.",
          owner: "Founder/operator",
          blocking: true,
          sourceRefs: [
            "docs/codex-next-task.md",
            "/server-writers/rollout",
          ],
        }),
      ],
    }),
  ];
}

export function buildWriterMigrationRunbook(): WriterMigrationRunbookPayload {
  const proposal = buildWriterMigrationProposal();
  const review = buildWriterMigrationReviewChecklist();
  const phases = buildPhases();
  const steps = phases.flatMap((runbookPhase) => runbookPhase.steps);

  return {
    safeMode: true,
    readOnly: true,
    runbookMode: "manual_application_runbook_only",
    sourceProposalMode: proposal.proposalMode,
    sourceChecklistMode: review.checklistMode,
    sourceMigrationName: proposal.migrationName,
    sourceSqlSha256: sha256(proposal.proposedSql),
    sourceReviewItemCount: review.itemCount,
    sourceReviewBlockingItemCount: review.blockingItemCount,
    sourceApprovedForMigration: false,
    sourceReadyToApplyMigration: false,
    phaseCount: phases.length,
    stepCount: steps.length,
    blockingStepCount: steps.filter((runbookStep) => runbookStep.blocking)
      .length,
    humanOperatorRequired: true,
    appCanApplyMigration: false,
    approvedToApplyMigration: false,
    shouldApplyMigrationNow: false,
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
      "This runbook is documentation only; the app cannot create a migration file, apply SQL, or create tables.",
      "A human operator must complete review, approval, execution, and post-checks outside this app before any SQL is applied.",
      "The source SQL hash must be captured and matched before execution.",
      "Applying audit/idempotency tables does not approve real writers, AI generation, Stripe writes, report unlocks, audit writes, or idempotency reservations.",
      "Runtime dangerous flags must remain disabled before and after migration.",
      "Rollback must preserve audit and idempotency history once any production writer has ever used those tables.",
    ],
    manualExecutionBoundaries: [
      "The app may display SQL and runbook text only.",
      "The app must not open an authenticated database console for the user.",
      "The app must not read or serialize service-role secret values.",
      "The app must not execute SQL through Supabase RPC, REST, service-role clients, browser clients, or automation.",
      "The app must not record approval as a database write in this stage.",
      "The app must not write audit rows or reserve idempotency keys to prove the migration.",
    ],
    phases,
  };
}

export function probeWriterMigrationRunbook(
  requestBody: unknown,
): WriterMigrationRunbookProbeResult {
  const payload = buildWriterMigrationRunbook();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      runbookMode: "manual_application_runbook_only",
      stepCount: payload.stepCount,
      blockingStepCount: payload.blockingStepCount,
      appCanApplyMigration: false,
      approvedToApplyMigration: false,
      shouldApplyMigrationNow: false,
      wouldCreateMigrationFile: false,
      wouldApplyMigration: false,
      wouldCreateTables: false,
      wouldWriteRows: false,
      wouldWriteAuditRows: false,
      wouldReserveIdempotencyKeys: false,
      wouldCreateServiceRoleClient: false,
      steps: payload.phases[0]?.steps ?? [],
      summary:
        "Migration runbook probe blocked: request body must be a JSON object and the app did not apply SQL.",
    };
  }

  const phaseId = (requestBody as { phaseId?: unknown }).phaseId;

  if (!isRunbookPhaseId(phaseId)) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      runbookMode: "manual_application_runbook_only",
      stepCount: payload.stepCount,
      blockingStepCount: payload.blockingStepCount,
      appCanApplyMigration: false,
      approvedToApplyMigration: false,
      shouldApplyMigrationNow: false,
      wouldCreateMigrationFile: false,
      wouldApplyMigration: false,
      wouldCreateTables: false,
      wouldWriteRows: false,
      wouldWriteAuditRows: false,
      wouldReserveIdempotencyKeys: false,
      wouldCreateServiceRoleClient: false,
      steps: payload.phases[0]?.steps ?? [],
      summary:
        "Migration runbook probe blocked: known phaseId is required and the app did not apply SQL.",
    };
  }

  const selectedPhase = payload.phases.find((phaseItem) => phaseItem.id === phaseId);
  const selectedSteps = selectedPhase?.steps ?? [];

  return {
    safeMode: true,
    readOnly: true,
    blocked: true,
    runbookMode: "manual_application_runbook_only",
    phaseId,
    stepCount: selectedSteps.length,
    blockingStepCount: selectedSteps.filter((runbookStep) => runbookStep.blocking)
      .length,
    appCanApplyMigration: false,
    approvedToApplyMigration: false,
    shouldApplyMigrationNow: false,
    wouldCreateMigrationFile: false,
    wouldApplyMigration: false,
    wouldCreateTables: false,
    wouldWriteRows: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKeys: false,
    wouldCreateServiceRoleClient: false,
    steps: selectedSteps,
    summary:
      "Migration runbook probe blocked as designed: manual steps were returned, but no migration file was created, no SQL was applied, no table was created, and no rows were written.",
  };
}
