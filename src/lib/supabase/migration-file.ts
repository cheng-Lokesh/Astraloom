import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

import type { SupabaseMigrationPayload } from "@/types/supabase-migration";

const migrationRelativePath =
  "supabase/migrations/0001_mvp_core_schema.sql";

export function readSupabaseMigration(): SupabaseMigrationPayload {
  const filePath = path.join(process.cwd(), migrationRelativePath);
  const sql = readFileSync(filePath, "utf8");

  return {
    filePath: migrationRelativePath,
    sql,
    lineCount: sql.split(/\r?\n/).length,
    tableCount: (sql.match(/create table if not exists/gi) ?? []).length,
    policyCount: (sql.match(/create policy/gi) ?? []).length,
    rlsEnabledCount: (sql.match(/enable row level security/gi) ?? []).length,
  };
}
