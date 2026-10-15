import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createStableAgentWorldIdFactoryV2 } from "@/lib/v2/agent-world/ids";

// Source parity checks only. These assertions do not execute PostgreSQL or replace pgTAP.
const sql = readdirSync("supabase/migrations").sort().map(name => readFileSync(`supabase/migrations/${name}`, "utf8")).join("\n");
const environmentSql = readFileSync("supabase/migrations/20261015152158_environment_conditions_v2.sql", "utf8");

// Evaluate only the source-visible ASCII ID protocol, not PL/pgSQL. This deliberately
// resolves the helper actually called by each validator, including its accepted kind.
function sourceVariableId(namespace: string, rawKey: string, callIndex: number): string | null {
  const calls = [...environmentSql.matchAll(/variable_id:=public\.(\w+)\(([^;]+)\);/g)];
  const helper = calls[callIndex]?.[1];
  const definitions = [...sql.matchAll(/create(?: or replace)? function public\.(\w+)\([^]*?as \$\$([\s\S]*?)\$\$;/gi)];
  const body = definitions.filter(match => match[1] === helper).at(-1)?.[2] ?? "";
  const prefix = body.match(/when 'world_variable' then '([^']+)'/)?.[1]
    ?? body.match(/return '(world_variable_v2_)'\|\|/)?.[1];
  if (!prefix) return null;
  const namespacePattern = body.match(/p_namespace!~'([^']+)'/)?.[1];
  const keyPattern = body.match(/p_source_key!~'([^']+)'/)?.[1];
  if (!namespacePattern || !keyPattern) throw new Error("ID helper must declare both input boundaries");
  if (!new RegExp(namespacePattern).test(namespace) || !new RegExp(keyPattern).test(rawKey)) return null;
  const initial = [...body.matchAll(/(?:first|second) bigint:=(\d+)/g)].map(match => BigInt(match[1]));
  const multipliers = [...body.matchAll(/numeric\*(\d+)\),4294967296/g)].map(match => BigInt(match[1]));
  if (initial.length !== 2 || multipliers.length !== 2) throw new Error("Unrecognized SQL hash protocol");
  let [first, second] = initial;
  for (const character of `${namespace}:world_variable:${rawKey}`) {
    const code = BigInt(character.charCodeAt(0));
    first = ((first ^ code) * multipliers[0]) % BigInt("4294967296");
    second = ((second ^ code) * multipliers[1]) % BigInt("4294967296");
  }
  return `${prefix}${first.toString(36)}${second.toString(36)}`;
}
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
  it("keeps public v1 draft helpers strict while the ledger dispatches both protocols", () => {
    expect(sql.includes("create function public.digital_life_draft_confirmed_shape_v2")).toBe(true);
    expect(sql.includes("digital_life_model_drafts_rules_protocol_check")).toBe(true);
  });
  it("derives both SQL variable lookups from the actual TS world-variable ID protocol", () => {
    const namespace = "formal-0123456789abcdef01234567";
    const factory = createStableAgentWorldIdFactoryV2(namespace);
    for (const field of ["pressures", "externalVariables"]) {
      for (let ordinal = 1; ordinal <= 8; ordinal += 1) {
        const rawKey = `${field}.${ordinal}`;
        for (const callIndex of [0, 1]) expect(sourceVariableId(namespace, rawKey, callIndex), `${rawKey} call ${callIndex}`).toBe(factory("world_variable", rawKey));
      }
    }
  });
  it("limits the SQL variable hash protocol to known namespaces and original profile ordinals", () => {
    for (const rawKey of ["pressures.0", "pressures.9", "pressures.01", "externalvariables.1", "goals.1", "pressures.1:extra"]) expect(sourceVariableId("formal-0123456789abcdef01234567", rawKey, 0)).toBeNull();
    for (const namespace of ["formal-a", "FORMAL-0123456789abcdef01234567", "formal-0123456789abcdef01234567:extra"]) expect(sourceVariableId(namespace, "pressures.2", 0)).toBeNull();
  });
});
