import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import type {
  SupabaseMigrationFilePayload,
  SupabaseMigrationPayload,
} from "@/types/supabase-migration";

const migrationsRelativePath = "supabase/migrations";

function countSql(sql: string) {
  return {
    lineCount: sql.split(/\r?\n/).length,
    tableCount: (sql.match(/create table if not exists/gi) ?? []).length,
    policyCount: (sql.match(/create policy/gi) ?? []).length,
    rlsEnabledCount: (sql.match(/enable row level security/gi) ?? []).length,
  };
}

function readMigrationFile(fileName: string): SupabaseMigrationFilePayload {
  const filePath = path.join(process.cwd(), migrationsRelativePath, fileName);
  const sql = readFileSync(filePath, "utf8");

  return {
    filePath: `${migrationsRelativePath}/${fileName}`,
    sql,
    ...countSql(sql),
  };
}

export function readSupabaseMigration(): SupabaseMigrationPayload {
  const directoryPath = path.join(process.cwd(), migrationsRelativePath);
  const migrations = readdirSync(directoryPath)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort()
    .map(readMigrationFile);
  const sql = migrations
    .map((migration) => `-- ${migration.filePath}\n${migration.sql}`)
    .join("\n\n");
  const counts = countSql(sql);

  return {
    filePath: migrationsRelativePath,
    sql,
    ...counts,
    migrationCount: migrations.length,
    migrations,
  };
}
