import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Source parity checks only. These assertions do not execute PostgreSQL or replace pgTAP.
const sql = readdirSync("supabase/migrations").sort().map(name => readFileSync(`supabase/migrations/${name}`, "utf8")).join("\n");
describe("environment conditions SQL forward integration source parity", () => {
  it("adds a v2 source signature without changing the v1 source implementation", () => {
    expect(sql).toContain("create function public.digital_life_model_draft_source_v2()");
    expect(sql).toContain("base:=old-'signature'");
    expect(sql).toContain("'signature_v2'");
  });
  it("connects v2 rules to reservation and completion validation", () => {
    expect(sql).toContain("create function public.formal_environment_rules_valid_v2");
    expect(sql).toContain("create function public.formal_environment_bundle_valid_v2");
    expect(sql).toContain("public.formal_environment_rules_valid_v2(source,p_digital_life_rules,p_horizon_days)");
    expect(sql).toContain("public.formal_environment_bundle_valid_v2(p_bundle,p_source,p_start,p_horizon)");
  });
  it("keeps owner locking and supports draft source/rule dispatch", () => {
    expect(sql).toContain("create function public.digital_life_model_draft_request_valid_v2");
    expect(sql).toContain("create function public.digital_life_model_draft_safe_context_v2");
    expect(sql).toContain("':digital-life-model-draft-v1'");
  });
});
