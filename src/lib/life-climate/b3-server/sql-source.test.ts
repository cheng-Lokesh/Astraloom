import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { buildLifeClimateB3Run, canonicalLifeClimateB3Json, createLifeClimateB3SourceContext, validateLifeClimateB3Run } from "@/lib/life-climate/b3";
import { realityProfileDraftFromDatabaseRow } from "@/lib/reality-profile/profile";
import specimen from "./fixtures/runtime-specimen.json";

const migrationPath = "supabase/migrations/20261020140722_life_climate_b3_intents_and_receipts.sql";
const read = (file: string) => readFileSync(path.resolve(process.cwd(), file), "utf8");
const migration = read(migrationPath);
const pgTap = read("supabase/tests/life_climate_b3_intents_test.sql");
const functionBody = (name: string) => migration.slice(migration.indexOf(`create function public.${name}(`)).split("end $$;")[0];

describe("B3 authored SQL boundary (source checks, not PostgreSQL execution)", () => {
  it("keeps the SQL fixture equal to the actual TypeScript frozen source/request/result specimen", async () => {
    const literal = pgTap.match(/^insert into b3_specimen values \('((?:[^']|'')*)'::jsonb\);$/m)?.[1];
    expect(literal).toBeDefined();
    expect(JSON.parse(literal!.replaceAll("''", "'"))).toEqual(specimen);
    await expect(buildLifeClimateB3Run(specimen.source, specimen.request)).resolves.toEqual(specimen.run);
    await expect(validateLifeClimateB3Run(specimen.source, specimen.request, specimen.run)).resolves.toEqual(specimen.run);
  });

  it("pins JS/SQL Unicode, numeric, null and array-order canonical vectors", () => {
    expect(canonicalLifeClimateB3Json({ z: null, a: [0.000001, 1.23, 0, true, "中文😀"] })).toBe('{"a":[0.000001,1.23,0,true,"中文😀"],"z":null}');
    expect(canonicalLifeClimateB3Json({ "😀": 1, "\uE000": 2 })).toBe('{"":2,"😀":1}');
    expect(pgTap).toContain('{"a":[0.000001,1.23,0,true,"中文😀"],"z":null}');
    expect(migration).toContain('order by k collate "C"');
    expect(migration).toContain('quantity * 1000000 <> trunc(quantity * 1000000)');
    expect(migration).toContain("raise exception 'b3_unsupported_precision'");
  });

  it("matches the existing legacy-null scalar normalization and proves other source columns are NOT NULL", async () => {
    const field = { value: "", classification: "unknown", evidenceSummary: "明确未知" };
    const row = {
      life_climate_value: null, life_climate_classification: "unknown", life_climate_evidence_summary: null,
      resources_value: null, resources_classification: "unknown", resources_evidence_summary: null,
      constraints_value: null, constraints_classification: "unknown", constraints_evidence_summary: null,
      life_goals: [field], core_values: [field], life_themes: [field], pressures: [field], external_variables: [field], revision: 7,
    };
    const normalized = realityProfileDraftFromDatabaseRow(row);
    expect(normalized.lifeClimate).toEqual(field);
    expect(normalized.resources).toEqual(field);
    expect(normalized.constraints).toEqual(field);
    for (const prefix of ["life_climate", "resources", "constraints"]) expect(migration).toContain(`coalesce(profile.${prefix}_evidence_summary,'明确未知')`);
    expect(read("supabase/migrations/20260927222723_reality_profile_life_model_domains.sql")).toContain("add column life_model_domains jsonb not null default");
    expect(read("supabase/migrations/20260927201253_reality_profile_explicit_world_inputs.sql")).toContain("add column world_model_inputs jsonb not null default");
    expect(await createLifeClimateB3SourceContext({ ...specimen.source.view, profile: normalized })).toBe(specimen.source.sourceContext);
  });

  it("recovers the owner/key request before any mutable source/consent/precision read", () => {
    const reserve = functionBody("reserve_life_climate_b3_intent");
    expect(reserve.indexOf("'seed-context-submission:'")).toBeLessThan(reserve.indexOf("'life-climate-b3:'"));
    expect(reserve.indexOf("select i.* into saved")).toBeLessThan(reserve.indexOf("raw:=public.life_climate_b3_source_internal"));
    expect(reserve.indexOf("saved.normalized_request is distinct from p_request")).toBeLessThan(reserve.indexOf("raw:=public.life_climate_b3_source_internal"));
    expect(functionBody("finalize_life_climate_b3_receipt")).not.toMatch(/from public\.(reality_profiles|seed_contexts|symbolic_birth_sources)/);
    expect(functionBody("life_climate_b3_source_internal")).toContain("for update");
  });

  it("uses invoker-only narrow B3 grants, owner RLS and zero old-writer alteration", () => {
    expect(migration).not.toMatch(/security definer/i);
    expect(migration).not.toMatch(/alter table public\.(life_climate_runs|reality_profiles|seed_contexts)|create or replace function public\.persist_life_climate_run_b[12]/i);
    expect(migration).toContain("from public,anon,authenticated,service_role");
    expect(migration).toContain("to service_role;");
    expect(migration).toContain("grant select(id,user_id,idempotency_key,created_at,normalized_request,source_snapshot)");
    expect(migration).not.toMatch(/grant[^;]*seed_safety[^;]*to authenticated|grant[^;]*symbolic_input[^;]*to authenticated/);
    expect(migration.match(/using \(\(select auth.uid\(\)\) = user_id\)/g)).toHaveLength(2);
    expect(migration).toContain("before update or delete");
  });

  it("authors actual pgTAP cases for owner isolation, immutable recovery, evidence and rollback", () => {
    expect(pgTap).toContain("cross-path predecessor fails");
    expect(pgTap).toContain("historical recovery precedes changed current Profile");
    expect(pgTap).toContain("another owner cannot read original requests");
    expect(pgTap).toContain("raw birth column is not an owner browser permission");
    expect(pgTap.trimEnd()).toMatch(/rollback;$/);
    expect(pgTap).toContain("NOT EXECUTED");
  });
});
