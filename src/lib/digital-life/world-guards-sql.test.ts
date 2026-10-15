import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Source constraints only: these checks do not execute SQL or establish DB/RLS acceptance.
const migrations = readdirSync("supabase/migrations").filter(name => name.endsWith(".sql")).sort();
const sql = migrations.map(name => readFileSync(`supabase/migrations/${name}`, "utf8")).join("\n");

function latestBody(name: string): string {
  const definitions = [...sql.matchAll(/create(?: or replace)? function public\.(\w+)\([^]*?as \$\$([\s\S]*?)\$\$;/gi)];
  const body = definitions.filter(match => match[1] === name).at(-1)?.[2];
  // Existing dispatchers must be readable in RED. A missing file/import is never the reproducer.
  if (body === undefined) throw new Error(`Existing SQL entry point ${name} was not found`);
  return body;
}

describe("observable world guards SQL forward source constraints", () => {
  it("dispatches v3 rules explicitly instead of rejecting them through the v2-only legacy validator", () => {
    const body = latestBody("formal_run_rules_valid");
    expect(body).toContain("digital-life-rules-v3");
    expect(body).toContain("formal_world_guard_shape_valid_v3");
  });

  it("saves draft v3 against the unchanged source-v2 signature and validates all guard semantics", () => {
    for (const name of ["digital_life_model_draft_guard_v1", "save_digital_life_model_draft_v1"]) {
      const body = latestBody(name);
      expect(body, name).toContain("digital-life-model-draft-v3");
      expect(body, name).toContain("digital_life_model_draft_source_v2()");
    }
    expect(sql).toContain("create function public.formal_world_guard_rules_valid_v3");
    expect(sql).not.toMatch(/create(?: or replace)? function public\.digital_life_model_draft_source_v3\(/i);
  });

  it("checks the actual v3 trajectory steps and guard-event fold before admitting a completed bundle", () => {
    const body = latestBody("formal_run_bundle_matches_reservation");
    expect(body).toContain("digital-life-rules-v3");
    expect(body).toContain("formal_world_guard_bundle_valid_v3");
    expect(sql).toContain("create function public.formal_world_guard_trajectory_valid_v3");
  });

  it("routes reservation v3 through semantic guard validation while preserving the original request hash inputs", () => {
    const body = latestBody("reserve_account_sandbox_run");
    expect(body).toContain("formal_world_guard_rules_valid_v3(source,p_digital_life_rules,p_horizon_days)");
    expect(body).toContain("formal-run-reservation-v1");
    expect(body).toContain("idempotency_key_content_conflict");
    expect(body).toContain("pg_advisory_xact_lock");
  });

  it("keeps existing owner/RLS and receipt-first draft safeguards present", () => {
    const body = latestBody("save_digital_life_model_draft_v1");
    expect(body).toContain("auth.uid()");
    expect(body).toContain("pg_advisory_xact_lock");
    expect(body.indexOf("idempotencyKey")).toBeLessThan(body.indexOf("digital_life_model_draft_source_v2()"));
    expect(sql).toContain("digital-life-model-draft-source-v2");
    expect(sql).toContain("signature_v2");
  });
});
