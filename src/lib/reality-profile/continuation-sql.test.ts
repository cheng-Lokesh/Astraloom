import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.join(process.cwd(), "supabase/migrations/20261018180647_reality_profile_new_situation_continuation.sql");
const migration = readFileSync(migrationPath, "utf8").replaceAll("\r\n", "\n");
const legacySource = readFileSync(path.join(process.cwd(), "supabase/migrations/20260727151219_phase2_atomic_seed_submission.sql"), "utf8").replaceAll("\r\n", "\n");
const legacyStart = "create or replace function public.submit_seed_context_phase2(";
const legacy = migration.slice(migration.lastIndexOf(legacyStart)).trim();
const fresh = migration.slice(migration.indexOf(legacyStart), migration.lastIndexOf(legacyStart));

describe("continuation migration SOURCE checks only (not PostgreSQL execution)", () => {
  it("preserves the legacy two-argument implementation except for owner serialization and its post-lock clock", () => {
    const expected = legacySource.slice(legacySource.indexOf(legacyStart)).trim()
      .replace("v_now timestamptz := now();", () => "v_now timestamptz;")
      .replace("  -- The transaction-scoped lock prevents", () => "  -- Shared with the required three-argument continuation overload.\n  perform pg_advisory_xact_lock(hashtextextended('seed-context-submission:' || v_user_id::text, 0));\n\n  -- The transaction-scoped lock prevents")
      .replace("  insert into public.consent_events (", () => "  -- Acceptance clock is assigned after the owner/key locks, never transaction now().\n  v_now := clock_timestamp();\n\n  insert into public.consent_events (");
    expect(legacy).toBe(expected);
    expect(legacy.indexOf("'seed-context-submission:'")).toBeLessThan(legacy.indexOf("v_user_id::text || ':' || p_submission_key::text"));
    expect(legacy.indexOf("v_now := clock_timestamp()")).toBeGreaterThan(legacy.indexOf("if found then"));
  });

  it("keeps required overload dispatch, invoker/RLS grants, strict validators, and a single snake-case profile source", () => {
    expect(fresh).toMatch(/p_reality_continuation jsonb\s*\)/);
    expect(fresh).not.toMatch(/\bdefault\b/i);
    expect(migration).not.toMatch(/security definer|create table|alter table|create policy|grant select|service_role/i);
    expect(migration).toContain("security invoker");
    expect(fresh).toContain("revoke all on function public.submit_seed_context_phase2(uuid, jsonb, jsonb) from public, anon, authenticated");
    expect(fresh).toContain("coalesce(auth.jwt() ->> 'is_anonymous', 'false') <> 'false'");
    expect(fresh).toContain("(p_reality_continuation - v_continuation_keys) <> '{}'::jsonb");
    expect(migration).toContain("public.is_valid_reality_profile_items");
    expect(migration).toContain("public.is_valid_reality_profile_life_model_domains");
    expect(migration).toContain("public.is_valid_reality_profile_world_inputs");
    expect(fresh).not.toMatch(/profile\.id|select profile\.\*/);
    expect(fresh).not.toMatch(/v_profile\s*->\s*'lifeClimate'/);
  });

  it("hashes every confirmation and checks the same-key receipt before current source, row lock, version, or deadline gates", () => {
    const ownerLock = fresh.indexOf("'seed-context-submission:'");
    const keyLock = fresh.indexOf("v_user_id::text || ':' || p_submission_key::text");
    const receipt = fresh.indexOf("if found then");
    const source = fresh.indexOf("select seed.id into v_current_seed_id");
    const rowLock = fresh.indexOf("select profile.revision");
    const acceptedClock = fresh.indexOf("v_now := clock_timestamp()");
    expect(fresh).toContain("jsonb_build_object('seed', p_payload, 'realityContinuation', p_reality_continuation)");
    expect(ownerLock).toBeLessThan(keyLock);
    expect(keyLock).toBeLessThan(receipt);
    expect(receipt).toBeLessThan(source);
    expect(fresh.slice(receipt, source)).toContain("return;");
    expect(source).toBeLessThan(rowLock);
    expect(fresh.slice(rowLock, acceptedClock)).toContain("for update");
    expect(fresh.slice(rowLock, acceptedClock)).toContain("v_current_revision is distinct from v_source_revision");
    expect(fresh.indexOf("v_deadline <= v_now")).toBeGreaterThan(acceptedClock);
  });

  it("recomputes exact review/rate sets and inserts Consent then Seed then revision-one Profile with no delegated second transaction", () => {
    expect(fresh).toContain("'goals','life_goals'");
    expect(fresh).toContain("'identity','career','wealth','relationships','environment','lifeStage'");
    expect(fresh).toContain("'worldInputs.resources.'");
    expect(fresh).toContain("'worldInputs.constraints.'");
    expect(fresh.match(/count\(distinct value\)/g)).toHaveLength(2);
    expect(fresh).toContain("v_provided_keys @> v_review_keys and v_provided_keys <@ v_review_keys");
    expect(fresh).toContain("v_provided_keys @> v_rate_keys and v_provided_keys <@ v_rate_keys");
    const consent = fresh.indexOf("insert into public.consent_events");
    const seed = fresh.indexOf("insert into public.seed_contexts");
    const profile = fresh.indexOf("insert into public.reality_profiles");
    expect(consent).toBeLessThan(seed);
    expect(seed).toBeLessThan(profile);
    expect(fresh.slice(consent, seed)).not.toContain("v_profile,");
    expect(fresh.slice(profile)).toContain("'world_model_inputs',1");
    expect(fresh).not.toMatch(/(?:perform|from) public\.submit_seed_context_phase2\(/);
  });
});
