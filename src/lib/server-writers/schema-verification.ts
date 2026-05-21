import "server-only";

import { buildWriterMigrationProposal } from "@/lib/server-writers/migration-proposal";
import { buildWriterMigrationReviewChecklist } from "@/lib/server-writers/migration-review";
import { buildWriterMigrationRunbook } from "@/lib/server-writers/migration-runbook";
import type {
  WriterSchemaTableVerification,
  WriterSchemaVerificationCheck,
  WriterSchemaVerificationPayload,
  WriterSchemaVerificationProbeResult,
  WriterSchemaVerificationSignal,
} from "@/types/writer-schema-verification";

const targetTables: Array<WriterSchemaTableVerification["tableName"]> = [
  "writer_audit_events",
  "writer_idempotency_keys",
];

function check(
  input: WriterSchemaVerificationCheck,
): WriterSchemaVerificationCheck {
  return input;
}

function getPublicSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
}

async function fetchWithTimeout(url: string, headers: HeadersInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    return await fetch(url, {
      headers,
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

function manualSqlFor(tableName: WriterSchemaTableVerification["tableName"]) {
  return [
    `select to_regclass('public.${tableName}') as table_ref;`,
    `select relrowsecurity from pg_class where oid = 'public.${tableName}'::regclass;`,
    `select count(*) from pg_policies where schemaname = 'public' and tablename = '${tableName}';`,
    `select count(*) from public.${tableName};`,
  ];
}

function signalFromStatus(statusCode: number): {
  signal: WriterSchemaVerificationSignal;
  detail: string;
} {
  if (statusCode === 200) {
    return {
      signal: "detected_publicly_reachable",
      detail:
        "The table endpoint responded through the publishable-key REST path. This is not proof of correct RLS; it requires manual policy review because these tables should not expose browser access.",
    };
  }

  if (statusCode === 401 || statusCode === 403) {
    return {
      signal: "blocked_or_unknown",
      detail:
        "The publishable-key REST probe was blocked. This may be correct browser isolation or an auth/grant issue; manual database verification is still required.",
    };
  }

  if (statusCode === 404) {
    return {
      signal: "not_detected",
      detail:
        "The table was not detected through the publishable-key REST path. The future migration may not have been applied, the schema cache may not have reloaded, or browser access may be blocked.",
    };
  }

  return {
    signal: "blocked_or_unknown",
    detail:
      "The publishable-key REST probe returned an unexpected status. Manual database verification is required.",
  };
}

async function probePublicTable(
  tableName: WriterSchemaTableVerification["tableName"],
): Promise<{
  statusCode: number | null;
  signal: WriterSchemaVerificationSignal;
  detail: string;
}> {
  const { url, publishableKey } = getPublicSupabaseConfig();

  if (!url || !publishableKey) {
    return {
      statusCode: null,
      signal: "not_checked",
      detail:
        "Public Supabase URL or publishable key is not configured, so the public REST probe did not run.",
    };
  }

  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/${tableName}?select=id&limit=1`;

  try {
    const response = await fetchWithTimeout(endpoint, {
      apikey: publishableKey,
      authorization: `Bearer ${publishableKey}`,
    });
    const status = signalFromStatus(response.status);

    return {
      statusCode: response.status,
      signal: status.signal,
      detail: status.detail,
    };
  } catch (error) {
    return {
      statusCode: null,
      signal: "network_error",
      detail:
        error instanceof Error
          ? error.message
          : "Network error while checking the publishable-key REST endpoint.",
    };
  }
}

function buildChecks(input: {
  tableName: WriterSchemaTableVerification["tableName"];
  publicProbeSignal: WriterSchemaVerificationSignal;
  publicRestStatusCode: number | null;
  projectUrlConfigured: boolean;
  publishableKeyConfigured: boolean;
}) {
  return [
    check({
      id: "public_config_available",
      category: "public_config",
      title: "Public Supabase config available",
      status:
        input.projectUrlConfigured && input.publishableKeyConfigured
          ? "passed"
          : "blocked",
      blocking: true,
      detail:
        "The harness can only run the non-privileged REST probe when public Supabase URL and publishable key are configured.",
      evidenceRequired:
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured without any service-role secret.",
    }),
    check({
      id: "public_probe_recorded",
      category: "table_presence",
      title: "Public REST probe recorded",
      status: input.publicProbeSignal === "network_error" ? "blocked" : "passed",
      blocking: false,
      detail: `Observed signal ${input.publicProbeSignal} with status ${input.publicRestStatusCode ?? "none"} for ${input.tableName}.`,
      evidenceRequired:
        "Captured response from this read-only harness. This is a signal only, not proof of correct schema state.",
    }),
    check({
      id: "table_presence_manual_check_required",
      category: "table_presence",
      title: "Table presence manual check required",
      status: "manual_required",
      blocking: true,
      detail:
        "A publishable-key probe cannot authoritatively prove the table exists with the intended privileges and schema cache state.",
      evidenceRequired: `Manual database result for to_regclass('public.${input.tableName}').`,
    }),
    check({
      id: "rls_manual_check_required",
      category: "rls",
      title: "RLS manual check required",
      status: "manual_required",
      blocking: true,
      detail:
        "The harness does not use service-role credentials and cannot inspect pg_class RLS flags authoritatively.",
      evidenceRequired:
        "Manual database result showing relrowsecurity=true for the target table.",
    }),
    check({
      id: "policy_absence_manual_check_required",
      category: "policy",
      title: "Browser policy absence manual check required",
      status: "manual_required",
      blocking: true,
      detail:
        "The future audit/idempotency tables should have no browser policies in MVP, and that must be checked in the database.",
      evidenceRequired:
        "Manual database result showing zero pg_policies rows for the target table.",
    }),
    check({
      id: "zero_rows_manual_check_required",
      category: "row_count",
      title: "Zero rows manual check required",
      status: "manual_required",
      blocking: true,
      detail:
        "The publishable-key path cannot prove zero rows because correct RLS may intentionally hide rows from the browser.",
      evidenceRequired:
        "Manual database result showing row count is zero before real writer implementation starts.",
    }),
  ];
}

async function buildTableVerification(
  tableName: WriterSchemaTableVerification["tableName"],
): Promise<WriterSchemaTableVerification> {
  const { url, publishableKey } = getPublicSupabaseConfig();
  const publicProbe = await probePublicTable(tableName);

  return {
    tableName,
    expectedOwner: "server_writer",
    expectedNoBrowserPolicies: true,
    expectedRlsEnabled: true,
    expectedZeroRowsBeforeWriters: true,
    publicRestStatusCode: publicProbe.statusCode,
    publicProbeSignal: publicProbe.signal,
    publicProbeDetail: publicProbe.detail,
    tablePresenceVerified: false,
    rlsVerified: false,
    browserPolicyAbsenceVerified: false,
    zeroRowsVerified: false,
    manualDatabaseCheckRequired: true,
    manualSqlChecks: manualSqlFor(tableName),
    checks: buildChecks({
      tableName,
      publicProbeSignal: publicProbe.signal,
      publicRestStatusCode: publicProbe.statusCode,
      projectUrlConfigured: Boolean(url),
      publishableKeyConfigured: Boolean(publishableKey),
    }),
  };
}

export async function buildWriterSchemaVerification(): Promise<WriterSchemaVerificationPayload> {
  const proposal = buildWriterMigrationProposal();
  const review = buildWriterMigrationReviewChecklist();
  const runbook = buildWriterMigrationRunbook();
  const { url, publishableKey } = getPublicSupabaseConfig();
  const tables = await Promise.all(targetTables.map(buildTableVerification));

  return {
    safeMode: true,
    readOnly: true,
    verificationMode: "public_readonly_probe_only",
    sourceProposalMode: proposal.proposalMode,
    sourceChecklistMode: review.checklistMode,
    sourceRunbookMode: runbook.runbookMode,
    sourceMigrationName: proposal.migrationName,
    sourceSqlSha256: runbook.sourceSqlSha256,
    projectUrlConfigured: Boolean(url),
    publishableKeyConfigured: Boolean(publishableKey),
    checkedAt: new Date().toISOString(),
    checkedTableCount: tables.length,
    detectedPubliclyReachableCount: tables.filter(
      (table) => table.publicProbeSignal === "detected_publicly_reachable",
    ).length,
    notDetectedCount: tables.filter(
      (table) => table.publicProbeSignal === "not_detected",
    ).length,
    blockedOrUnknownCount: tables.filter(
      (table) => table.publicProbeSignal === "blocked_or_unknown",
    ).length,
    networkErrorCount: tables.filter(
      (table) => table.publicProbeSignal === "network_error",
    ).length,
    manualDatabaseCheckRequired: true,
    publicProbeCanProveTablePresence: false,
    publicProbeCanProveRls: false,
    publicProbeCanProvePolicyAbsence: false,
    publicProbeCanProveZeroRows: false,
    schemaVerified: false,
    readyForWriterImplementation: false,
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
      "This harness is read-only and uses only public Supabase configuration.",
      "The harness does not use service-role credentials and cannot inspect pg_class, pg_policies, or protected row counts authoritatively.",
      "A public REST response is a signal only; table presence, RLS, policy absence, and zero rows still require manual database evidence.",
      "If the table is publicly reachable, treat it as a reason for manual RLS/policy review, not as success.",
      "If the table is not detected or blocked, do not assume success; use the manual SQL checks from the runbook.",
      "The app remains unable to create migration files, apply SQL, create tables, write rows, write audit rows, reserve idempotency keys, or create a service-role client.",
    ],
    manualVerificationSql: [
      "select to_regclass('public.writer_audit_events') as writer_audit_events;",
      "select to_regclass('public.writer_idempotency_keys') as writer_idempotency_keys;",
      "select relname, relrowsecurity from pg_class where oid in ('public.writer_audit_events'::regclass, 'public.writer_idempotency_keys'::regclass);",
      "select tablename, count(*) from pg_policies where schemaname = 'public' and tablename in ('writer_audit_events', 'writer_idempotency_keys') group by tablename;",
      "select 'writer_audit_events' as table_name, count(*) from public.writer_audit_events union all select 'writer_idempotency_keys', count(*) from public.writer_idempotency_keys;",
    ],
    tables,
  };
}

export async function probeWriterSchemaVerification(
  requestBody: unknown,
): Promise<WriterSchemaVerificationProbeResult> {
  const payload = await buildWriterSchemaVerification();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      verificationMode: "public_readonly_probe_only",
      manualDatabaseCheckRequired: true,
      schemaVerified: false,
      readyForWriterImplementation: false,
      wouldCreateMigrationFile: false,
      wouldApplyMigration: false,
      wouldCreateTables: false,
      wouldWriteRows: false,
      wouldWriteAuditRows: false,
      wouldReserveIdempotencyKeys: false,
      wouldCreateServiceRoleClient: false,
      checks: payload.tables[0]?.checks ?? [],
      summary:
        "Applied-schema verification probe blocked: request body must be a JSON object and no schema was verified as ready.",
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
      verificationMode: "public_readonly_probe_only",
      manualDatabaseCheckRequired: true,
      schemaVerified: false,
      readyForWriterImplementation: false,
      wouldCreateMigrationFile: false,
      wouldApplyMigration: false,
      wouldCreateTables: false,
      wouldWriteRows: false,
      wouldWriteAuditRows: false,
      wouldReserveIdempotencyKeys: false,
      wouldCreateServiceRoleClient: false,
      checks: payload.tables[0]?.checks ?? [],
      summary:
        "Applied-schema verification probe blocked: unknown table name and no schema was verified as ready.",
    };
  }

  const table = payload.tables.find((entry) => entry.tableName === tableName);

  return {
    safeMode: true,
    readOnly: true,
    blocked: true,
    verificationMode: "public_readonly_probe_only",
    tableName,
    publicProbeSignal: table?.publicProbeSignal,
    publicRestStatusCode: table?.publicRestStatusCode,
    manualDatabaseCheckRequired: true,
    schemaVerified: false,
    readyForWriterImplementation: false,
    wouldCreateMigrationFile: false,
    wouldApplyMigration: false,
    wouldCreateTables: false,
    wouldWriteRows: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKeys: false,
    wouldCreateServiceRoleClient: false,
    checks: table?.checks ?? [],
    summary:
      "Applied-schema verification probe blocked as designed: public probe signals were returned, but table presence, RLS, policy absence, and zero rows still require manual database evidence.",
  };
}
