import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createSeededRngV2, selectSeededIndexV2 } from "@/lib/v2/trajectory/seeded-rng";
import { createHash } from "node:crypto";
import { buildFormalSandboxInitialWorld, initialWorldSourceSchema } from "@/lib/formal-sandbox/initial-world";
import { digitalLifeModelSchema } from "./model";
import { createStableRealityBoundaryIdFactoryV2 } from "@/lib/v2/reality-boundary/ids";

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
  it("retains a genuine public-runtime initial World specimen for the independently rebound pgTAP source fixture", () => {
    const fixture = readFileSync("supabase/tests/world_guards_test.sql", "utf8");
    const input = JSON.parse(fixture.match(/\$input\$([^]*?)\$input\$/)![1]);
    const world = JSON.parse(fixture.match(/\$world\$([^]*?)\$world\$/)![1]);
    const canonical = (value: unknown): string => value === null || typeof value !== "object" ? JSON.stringify(value) : Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
    const fingerprint = createHash("sha256").update(canonical(input)).digest("hex").slice(0, 24);
    const { worldResult: rebuilt } = buildFormalSandboxInitialWorld(initialWorldSourceSchema.parse(input), digitalLifeModelSchema.parse(input.digitalLifeModel), "main", fingerprint, world.realityBoundarySnapshot.updatedAt);
    expect(rebuilt.ok).toBe(true);
    if (!rebuilt.ok) throw new Error("Public runtime rejected the pgTAP specimen");
    expect(JSON.parse(JSON.stringify(rebuilt.world))).toEqual(world);
    expect(fixture).not.toContain("content:=replace(content");
    expect(fixture).toContain("for actor,source_ordinal");
    expect(fixture).toContain("'agentDefinitions',definitions,'agentStates',states,'entities',entities,'relations',relations");
  });

  it("implements the actual Core UTF-16 stable boundary identity protocol in the SQL helper", () => {
    const body = latestBody("formal_world_guard_core_id_v3");
    const compact = body.replace(/\s/g, "");
    const initial = compact.match(/firstbigint:=(\d+);secondbigint:=(\d+);/)!;
    const products = compact.match(/first:=mod\(\(first#unit::bigint\)::numeric\*(\d+),(\d+)\)::bigint;second:=mod\(\(second#unit::bigint\)::numeric\*(\d+),(\d+)\)::bigint;/)!;
    expect(initial).not.toBeNull(); expect(products).not.toBeNull();
    expect(compact).toContain("units:=casewhencode>65535thenarray[55296+(code-65536)/1024,56320+mod(code-65536,1024)]elsearray[code]end");
    const namespace = "formal-580844c6d53ad5d2313fa0df";
    const factory = createStableRealityBoundaryIdFactoryV2(namespace);
    for (const fingerprint of ["plain-source", "来源包含中文", "来源包含𠮷和🌟"]) {
      let first = BigInt(initial[1]), second = BigInt(initial[2]);
      const value = `${namespace}:evidence:${fingerprint}`;
      for (let index = 0; index < value.length; index++) {
        const unit = BigInt(value.charCodeAt(index));
        first = ((first ^ unit) * BigInt(products[1])) % BigInt(products[2]);
        second = ((second ^ unit) * BigInt(products[3])) % BigInt(products[4]);
      }
      expect(`real_evidence_v2_${first.toString(36)}${second.toString(36)}`).toBe(factory("evidence", fingerprint));
    }
  });

  it("tests gate-off UPDATE as zero rows and unchanged state without weakening RLS", () => {
    const fixture = readFileSync("supabase/tests/world_guards_test.sql", "utf8");
    expect(fixture).toContain("gate-off authenticated UPDATE sees zero reservation rows under RLS");
    expect(fixture).toContain("gate-off UPDATE leaves the stored receipt unchanged");
    expect(fixture).toContain("with changed as (update public.generation_jobs");
  });

  it("rebuilds the complete initial boundary and model from frozen sources before trajectory admission", () => {
    const authority = latestBody("formal_world_guard_initial_authority_v3");
    expect(authority).toContain("formal_world_guard_boundary_valid_v3");
    for (const field of ["agentDefinitions", "agentStates", "entities", "relations", "constraints", "externalVariables"]) {
      expect(authority).toContain(`p_world->'${field}'=`);
    }
    expect(latestBody("formal_world_guard_environment_bundle_valid_v3")).toContain("model is distinct from public.formal_world_guard_model_v3(p_source,rules)");
    expect(latestBody("formal_world_guard_trajectory_valid_v3")).toContain("formal_world_guard_initial_authority_v3");
  });

  it("requires the exact planner-v1 selected Event envelope and ordered preceding event references", () => {
    const body = latestBody("formal_world_guard_attempt_planning_valid_v1");
    expect(body).toContain("event->'targetEntityIds' is distinct from jsonb_build_array(entity_id)");
    expect(body).toContain("event->'targetResourceIds' is distinct from jsonb_build_array(resource_id)");
    expect(body).toContain("event->'targetRelationIds' is distinct from '[]'::jsonb");
    expect(body).toContain("event->'targetVariableIds' is distinct from '[]'::jsonb");
    expect(body).toContain("event->'causalRealEvidenceIds' is distinct from public.formal_world_guard_unique_ids_v3");
    expect(body).toContain("event->'causalAssumptionIds' is distinct from public.formal_world_guard_unique_ids_v3");
    expect(body).toContain("event->'priorWorldEventIds' is distinct from expected_prior");
    expect(body).not.toContain("not (event->'causalAssumptionIds') @> causal_ids");
  });

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

  it("checks actual guard source provenance and the latest preceding change without adding mutation targets", () => {
    const body = latestBody("formal_world_guard_trajectory_valid_v3");
    expect(body).toContain("event->'causalRealEvidenceIds' is distinct from expected_real");
    expect(body).toContain("event->'causalAssumptionIds' is distinct from expected_assumptions");
    expect(body).toContain("event->'priorWorldEventIds' is distinct from expected_prior");
    expect(body).toContain("order by ord desc limit 1");
    expect(body).toContain("observed#>'{provenance,realEvidenceIds}'");
    expect(body).toContain("observed#>'{provenance,assumptionIds}'");
    expect(body).toContain("current_world=final_world");
    expect(body).toContain("step->'worldEventId' is distinct from event->'id'");
  });

  it("recomputes no_actions from frozen policy eligibility instead of trusting a supplied termination marker", () => {
    expect(latestBody("formal_world_guard_trajectory_valid_v3")).toContain("formal_world_guard_has_candidates_v3");
    const body = latestBody("formal_world_guard_has_candidates_v3");
    expect(body).toContain("formal_world_guard_rule_eligible_v3");
    expect(body).toContain("declared->'usePerTick'");
    // The real producer deliberately uses neutral quantities for eligibility;
    // actual relationship/symbolic quantities still require full trace validation.
    expect(body).toContain("formal_planning_neutral_amount_v1");
    expect(body).toContain("(prior_count+1)*neutral");
    expect(latestBody("formal_world_guard_attempt_planning_valid_v2")).toContain("relationshipResponse");
  });

  it("keeps the SQL-visible mulberry32 integer protocol aligned with Core without executing PostgreSQL", () => {
    const body = latestBody("formal_world_guard_rng_raw_v3");
    const compact = body.replace(/\s/g, "");
    // Parse the actual SQL expression shapes, operators, shifts, masks and
    // constants. An altered SQL operator cannot silently use a correct JS copy.
    const stateExpression = compact.match(/state:=mod\(p_seed::numeric\+\(p_draw\+1\)::numeric\*(\d+),(\d+)\)::bigint;/)!;
    const firstExpression = compact.match(/value:=mod\(\(state#\(state>>(\d+)\)\)::numeric\*\(state\|(\d+)\)::numeric,(\d+)\)::bigint;/)!;
    const secondExpression = compact.match(/value:=value#mod\(value::numeric\+mod\(\(value#\(value>>(\d+)\)\)::numeric\*\(value\|(\d+)\)::numeric,(\d+)\),(\d+)\)::bigint;/)!;
    const finalExpression = compact.match(/returnvalue#\(value>>(\d+)\);/)!;
    expect(stateExpression).not.toBeNull(); expect(firstExpression).not.toBeNull(); expect(secondExpression).not.toBeNull(); expect(finalExpression).not.toBeNull();
    const increment = BigInt(stateExpression[1]), modulus = BigInt(stateExpression[2]);
    expect(firstExpression[3]).toBe(String(modulus)); expect(secondExpression[3]).toBe(String(modulus)); expect(secondExpression[4]).toBe(String(modulus));
    for (const seed of [0, 1, 1701, 1_999_999_999]) {
      const rng = createSeededRngV2(seed);
      const selectionRng = createSeededRngV2(seed);
      for (let draw = 0; draw < 6; draw++) {
        const state = (BigInt(seed) + BigInt(draw + 1) * increment) % modulus;
        let value = ((state ^ (state >> BigInt(firstExpression[1]))) * (state | BigInt(firstExpression[2]))) % modulus;
        value ^= (value + ((value ^ (value >> BigInt(secondExpression[1]))) * (value | BigInt(secondExpression[2])))) % modulus;
        const raw = Number(value ^ (value >> BigInt(finalExpression[1])));
        expect(raw).toBe(rng.nextUint32());
        const audit = selectSeededIndexV2(selectionRng, draw + 1);
        expect(audit.rawValue).toBe(raw); expect(audit.selectedIndex).toBe(raw % (draw + 1));
      }
    }
    const fold = latestBody("formal_world_guard_trajectory_valid_v3");
    expect(fold).toContain("step->'proposalId' is distinct from candidate_ids->");
    expect(fold).toContain("step#>'{rngAudit,rawValue}' is distinct from to_jsonb(rng_raw)");
    expect(fold).toContain("step->'selectedCandidateIndex' is distinct from to_jsonb(mod(rng_raw,jsonb_array_length(candidate_ids)))");
    expect(fold).toContain("event->'operation' is distinct from jsonb_build_object('actionType','allocate_resource','resourceId',target_id,'amount',declared->'usePerTick')");
  });

  it("keeps terminal attempts separate from completed Report/Claim and Forecast Lock persistence", () => {
    const body = latestBody("finalize_account_sandbox_no_eligible_actions_v3");
    expect(body).toContain("formal_world_guard_attempt_diagnostics_v3");
    expect(body).toContain("set status='failed',formal_terminal_receipt=receipt");
    expect(body).not.toMatch(/insert into public\.(?:simulations|event_logs|claims|reports|formal_forecast_locks)/);
    const attempt = latestBody("formal_world_guard_attempt_source_valid_v3");
    expect(attempt).toContain("array['acceptedAt','boundaryAt','simulationStartAt']");
    expect(attempt).not.toContain("timing->>'lockedAt'");
    expect(attempt).not.toContain("timing->>'generatedPersistedAt'");
  });

  it("replays a durable terminal receipt before mutable sources, raw attempt validation or expiry", () => {
    const body = latestBody("finalize_account_sandbox_no_eligible_actions_v3");
    expect(body.indexOf("job.formal_content_hash is distinct from request_hash")).toBeLessThan(body.indexOf("if job.status='failed'"));
    expect(body.indexOf("if job.status='failed'")).toBeLessThan(body.indexOf("clock_timestamp()>=job.formal_simulation_start_at"));
    expect(body.indexOf("if job.status='failed'")).toBeLessThan(body.indexOf("diagnostics:=public.formal_world_guard_attempt_diagnostics_v3"));
    expect(latestBody("reserve_account_sandbox_run")).toContain("'status','no_eligible_actions','pathDiagnostics'");
  });

  it("revalidates terminal evidence in the trigger and grants only the dedicated new receipt column", () => {
    const body = latestBody("formal_run_reservation_guard");
    expect(body).toContain("formal_world_guard_attempt_diagnostics_v3(attempt,old.frozen_source_input");
    expect(body).toContain("formal_world_guard_request_hash_v3(request,old.idempotency_key::uuid)");
    expect(body).toContain("old.status<>'queued'");
    expect(body).toContain("to_jsonb(new)-array['status','formal_terminal_receipt','updated_at']");
    expect(sql).toContain("grant update(formal_terminal_receipt) on public.generation_jobs to authenticated");
    const migration = readFileSync("supabase/migrations/20261015164144_observable_world_guards_v3.sql", "utf8");
    expect(migration).not.toMatch(/security definer|create policy|grant update\s*\(\s*(?:output_refs|error_code)/i);
    expect(migration.trimEnd()).toMatch(/commit;$/);
  });
});
