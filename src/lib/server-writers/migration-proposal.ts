import "server-only";

import { buildWriterAuditModel } from "@/lib/server-writers/audit";
import { buildWriterEvidenceHandoff } from "@/lib/server-writers/evidence-handoff";
import { buildWriterIdempotencyModel } from "@/lib/server-writers/idempotency";
import type {
  WriterMigrationProposalCheck,
  WriterMigrationProposalPayload,
  WriterMigrationProposalProbeResult,
  WriterMigrationTableProposal,
} from "@/types/writer-migration-proposal";

const migrationName = "0002_writer_audit_idempotency_proposal" as const;

function check(
  input: WriterMigrationProposalCheck,
): WriterMigrationProposalCheck {
  return input;
}

function compactSql(lines: string[]) {
  return lines.join("\n");
}

const auditCreateSql = compactSql([
  "create table if not exists public.writer_audit_events (",
  "  id uuid primary key default gen_random_uuid(),",
  "  audit_event_id text not null unique,",
  "  contract_id text not null,",
  "  lifecycle text not null,",
  "  actor_context text not null,",
  "  user_id_hash text,",
  "  idempotency_key text not null,",
  "  request_hash text not null,",
  "  redacted_evidence_ref text not null,",
  "  source_redaction_fixture_ref text not null,",
  "  target_tables text[] not null default '{}',",
  "  gate_decision text not null,",
  "  blocked_codes text[] not null default '{}',",
  "  writer_version text not null,",
  "  metadata jsonb not null default '{}'::jsonb,",
  "  created_at timestamptz not null default now()",
  ");",
]);

const idempotencyCreateSql = compactSql([
  "create table if not exists public.writer_idempotency_keys (",
  "  id uuid primary key default gen_random_uuid(),",
  "  idempotency_key text not null,",
  "  contract_id text not null,",
  "  scope text not null,",
  "  operation text not null,",
  "  request_hash text not null,",
  "  status text not null,",
  "  result_ref text,",
  "  audit_event_id text not null,",
  "  locked_until timestamptz,",
  "  expires_at timestamptz,",
  "  created_at timestamptz not null default now(),",
  "  updated_at timestamptz not null default now(),",
  "  unique (contract_id, idempotency_key)",
  ");",
]);

const auditIndexSql = [
  "create index if not exists writer_audit_events_contract_created_idx on public.writer_audit_events (contract_id, created_at desc);",
  "create index if not exists writer_audit_events_request_hash_idx on public.writer_audit_events (request_hash);",
  "create index if not exists writer_audit_events_user_hash_idx on public.writer_audit_events (user_id_hash) where user_id_hash is not null;",
];

const idempotencyIndexSql = [
  "create index if not exists writer_idempotency_keys_status_idx on public.writer_idempotency_keys (status, updated_at desc);",
  "create index if not exists writer_idempotency_keys_request_hash_idx on public.writer_idempotency_keys (request_hash);",
  "create index if not exists writer_idempotency_keys_audit_event_idx on public.writer_idempotency_keys (audit_event_id);",
];

const auditRlsSql = [
  "alter table public.writer_audit_events enable row level security;",
  "-- No browser policies in MVP. Future service-role writers own inserts and operational reads.",
];

const idempotencyRlsSql = [
  "alter table public.writer_idempotency_keys enable row level security;",
  "-- No browser policies in MVP. Future service-role writers own reservations, updates, and reads.",
];

function buildTableChecks(input: {
  table: WriterMigrationTableProposal;
  expectedSourceRefs: string[];
}) {
  return [
    check({
      id: "create_sql_present",
      category: "schema",
      title: "Create SQL present",
      passed:
        input.table.createSql.includes(`public.${input.table.tableName}`) &&
        input.table.createSql.includes("request_hash"),
      blocking: true,
      detail:
        "Proposal includes CREATE TABLE SQL with request_hash for future evidence correlation.",
    }),
    check({
      id: "rls_enabled_without_browser_policy",
      category: "rls",
      title: "RLS enabled without browser policy",
      passed:
        input.table.rlsSql.some((line) =>
          line.includes("enable row level security"),
        ) && input.table.rlsSql.every((line) => !line.includes("create policy")),
      blocking: true,
      detail:
        "Proposal enables RLS and intentionally defines no browser access policy for these server-owned tables.",
    }),
    check({
      id: "indexes_present",
      category: "index",
      title: "Indexes present",
      passed: input.table.proposedIndexes.length >= 2,
      blocking: true,
      detail:
        "Proposal includes indexes for request hash, audit lookup, replay, and operational support.",
    }),
    check({
      id: "retention_rule_present",
      category: "retention",
      title: "Retention rule present",
      passed: input.table.retentionRule.length > 20,
      blocking: true,
      detail:
        "Proposal documents retention expectations before any durable audit or idempotency table exists.",
    }),
    check({
      id: "source_models_aligned",
      category: "evidence_alignment",
      title: "Source models aligned",
      passed: input.expectedSourceRefs.every((ref) =>
        input.table.sourceModelRefs.includes(ref),
      ),
      blocking: true,
      detail:
        "Proposal references the read-only audit/idempotency/evidence handoff models that define its fields.",
    }),
    check({
      id: "table_creation_blocked",
      category: "write_block",
      title: "Table creation blocked",
      passed:
        !input.table.wouldCreateTable &&
        !input.table.wouldApplySql &&
        !input.table.wouldWriteRows,
      blocking: true,
      detail:
        "Proposal does not create tables, apply SQL, write rows, or mutate Supabase state.",
    }),
  ];
}

function buildTables(): WriterMigrationTableProposal[] {
  const audit = buildWriterAuditModel();
  const idempotency = buildWriterIdempotencyModel();

  const auditTable: WriterMigrationTableProposal = {
    tableName: "writer_audit_events",
    purpose:
      "Append-only operational audit trail for future system writer attempts, gate blocks, successes, failures, and rollback references.",
    owner: "server_writer",
    proposedColumns: audit.baseFields.map((field) => field.name),
    proposedIndexes: auditIndexSql,
    rlsRule:
      "Enable RLS and define no browser policy; future service-role writers own append-only writes.",
    retentionRule:
      "Keep enough history for support, rollback, dispute, and consent review. Exact production retention must be approved before applying the migration.",
    sourceModelRefs: [
      "/server-writers/audit",
      "/server-writers/evidence",
      "/api/system-writers/audit",
      "/api/system-writers/evidence-handoff",
    ],
    createSql: auditCreateSql,
    indexSql: auditIndexSql,
    rlsSql: auditRlsSql,
    wouldCreateTable: false,
    wouldApplySql: false,
    wouldWriteRows: false,
    checks: [],
  };

  const idempotencyTable: WriterMigrationTableProposal = {
    tableName: "writer_idempotency_keys",
    purpose:
      "Server-owned registry for future writer key reservation, replay, conflict detection, and result references.",
    owner: "server_writer",
    proposedColumns: idempotency.baseFields.map((field) => field.name),
    proposedIndexes: idempotencyIndexSql,
    rlsRule:
      "Enable RLS and define no browser policy; future service-role writers own reservations and updates.",
    retentionRule:
      "Keep keys long enough for report generation, rollback, support, payment dispute, and consent review. Exact TTL must be approved before applying the migration.",
    sourceModelRefs: [
      "/server-writers/idempotency",
      "/server-writers/evidence",
      "/api/system-writers/idempotency",
      "/api/system-writers/evidence-handoff",
    ],
    createSql: idempotencyCreateSql,
    indexSql: idempotencyIndexSql,
    rlsSql: idempotencyRlsSql,
    wouldCreateTable: false,
    wouldApplySql: false,
    wouldWriteRows: false,
    checks: [],
  };

  return [
    {
      ...auditTable,
      checks: buildTableChecks({
        table: auditTable,
        expectedSourceRefs: ["/server-writers/audit", "/server-writers/evidence"],
      }),
    },
    {
      ...idempotencyTable,
      checks: buildTableChecks({
        table: idempotencyTable,
        expectedSourceRefs: [
          "/server-writers/idempotency",
          "/server-writers/evidence",
        ],
      }),
    },
  ];
}

function buildProposedSql(tables: WriterMigrationTableProposal[]) {
  return compactSql([
    "-- Project MiroFish writer audit/idempotency proposal",
    "-- Proposal only. Do not run until reviewed and explicitly promoted to a real migration.",
    "-- This SQL is not applied by the app.",
    "",
    "create extension if not exists pgcrypto;",
    "",
    ...tables.flatMap((table) => [
      `-- ${table.tableName}`,
      table.createSql,
      ...table.indexSql,
      ...table.rlsSql,
      "",
    ]),
  ]);
}

function buildSharedChecks(input: {
  tables: WriterMigrationTableProposal[];
  proposedSql: string;
}) {
  const evidence = buildWriterEvidenceHandoff();

  return [
    check({
      id: "two_tables_proposed",
      category: "schema",
      title: "Two tables proposed",
      passed:
        input.tables.length === 2 &&
        input.tables.some((table) => table.tableName === "writer_audit_events") &&
        input.tables.some(
          (table) => table.tableName === "writer_idempotency_keys",
        ),
      blocking: true,
      detail:
        "Proposal covers only the future audit events table and idempotency registry table.",
    }),
    check({
      id: "evidence_handoff_ready",
      category: "evidence_alignment",
      title: "Evidence handoff ready",
      passed: evidence.allFixturesReady,
      blocking: true,
      detail:
        "Migration proposal is based on evidence handoff fixtures that already pass redaction, audit, and idempotency checks.",
    }),
    check({
      id: "no_browser_policies",
      category: "rls",
      title: "No browser policies",
      passed: !/create\s+policy/i.test(input.proposedSql),
      blocking: true,
      detail:
        "Server-owned audit and idempotency tables should not expose browser insert/update/delete policies in the MVP.",
    }),
    check({
      id: "proposal_not_applied",
      category: "write_block",
      title: "Proposal not applied",
      passed: input.tables.every(
        (table) =>
          !table.wouldCreateTable && !table.wouldApplySql && !table.wouldWriteRows,
      ),
      blocking: true,
      detail:
        "The app exposes SQL text for review only; it does not create a migration file, apply SQL, or write rows.",
    }),
  ];
}

export function buildWriterMigrationProposal(): WriterMigrationProposalPayload {
  const tables = buildTables();
  const proposedSql = buildProposedSql(tables);
  const sharedChecks = buildSharedChecks({ tables, proposedSql });
  const allChecksPassed =
    tables.every((table) =>
      table.checks.every((tableCheck) => tableCheck.passed),
    ) && sharedChecks.every((sharedCheck) => sharedCheck.passed);

  return {
    safeMode: true,
    readOnly: true,
    proposalMode: "proposal_only",
    migrationName,
    proposedTableCount: 2,
    proposedIndexCount: tables.reduce(
      (count, table) => count + table.proposedIndexes.length,
      0,
    ),
    proposedPolicyCount: 0,
    proposedSql,
    sqlLineCount: proposedSql.split(/\r?\n/).length,
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
    allChecksPassed,
    globalRules: [
      "This stage proposes SQL only; it does not create or apply a migration.",
      "The proposed tables are server-owned and have RLS enabled with no browser access policies.",
      "The proposal stores requestHash and redacted evidence refs, not raw payloads, prompts, provider responses, tokens, or secrets.",
      "The idempotency registry uses contractId + idempotencyKey uniqueness and requestHash comparison for conflict detection.",
      "A future human review must approve retention, RLS, indexes, and rollout before this proposal becomes a real migration.",
      "No service-role client, secret read, database write, AI call, Stripe call, audit write, idempotency mutation, or writer execution can happen in this stage.",
    ],
    sharedChecks,
    tables,
  };
}

export function probeWriterMigrationProposal(
  requestBody: unknown,
): WriterMigrationProposalProbeResult {
  const payload = buildWriterMigrationProposal();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      proposalMode: "proposal_only",
      wouldCreateMigrationFile: false,
      wouldApplyMigration: false,
      wouldCreateTables: false,
      wouldWriteRows: false,
      wouldWriteAuditRows: false,
      wouldReserveIdempotencyKeys: false,
      wouldCreateServiceRoleClient: false,
      checks: payload.sharedChecks,
      summary:
        "Migration proposal probe blocked: request body must be a JSON object and no migration was applied.",
    };
  }

  const tableName = (requestBody as { tableName?: unknown }).tableName;

  if (
    tableName !== "writer_audit_events" &&
    tableName !== "writer_idempotency_keys"
  ) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      proposalMode: "proposal_only",
      wouldCreateMigrationFile: false,
      wouldApplyMigration: false,
      wouldCreateTables: false,
      wouldWriteRows: false,
      wouldWriteAuditRows: false,
      wouldReserveIdempotencyKeys: false,
      wouldCreateServiceRoleClient: false,
      checks: payload.sharedChecks,
      summary:
        "Migration proposal probe blocked: unknown table name and no migration was applied.",
    };
  }

  const table = payload.tables.find((item) => item.tableName === tableName);

  return {
    safeMode: true,
    readOnly: true,
    blocked: true,
    proposalMode: "proposal_only",
    tableName,
    wouldCreateMigrationFile: false,
    wouldApplyMigration: false,
    wouldCreateTables: false,
    wouldWriteRows: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKeys: false,
    wouldCreateServiceRoleClient: false,
    checks: table?.checks ?? payload.sharedChecks,
    summary:
      "Migration proposal probe blocked as designed: SQL proposal and checks were prepared for review, but no migration file was created, no SQL was applied, no table was created, and no rows were written.",
  };
}
