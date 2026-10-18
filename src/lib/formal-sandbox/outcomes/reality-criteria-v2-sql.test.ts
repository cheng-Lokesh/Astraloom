import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dir="supabase/migrations";
const filename=readdirSync(dir).find(name=>name.endsWith("_formal_reality_criteria_review_v2.sql"));
const sql=filename?readFileSync(`${dir}/${filename}`,"utf8"):"";
describe("forward reality criteria v2 completion SQL source candidate",()=>{
  it("keeps one complete function body, an intact target regex and one original lock-persistence tail",()=>{
    expect(sql.match(/\$\$/g)).toHaveLength(2);
    expect(sql.match(/end;\$\$;/g)).toHaveLength(1);
    expect(sql).toContain("coalesce(target->>'targetKey','')!~'^target-[1-9][0-9]*$'");
    expect(sql.match(/insert into public\.formal_forecast_locks/g)).toHaveLength(1);
    expect(sql.match(/exception when others then raise exception/g)).toHaveLength(1);
    expect(sql.match(/if envelope->>'version' is distinct from '1'/g)).toHaveLength(1);
    expect(sql.slice(sql.indexOf("end;$$;")+8).trim()).toBe("commit;");
  });
  it("replaces only the existing invoker completion function without changing tables, roles, RLS or append RPC",()=>{
    expect(filename).toMatch(/^\d{14}_formal_reality_criteria_review_v2\.sql$/);
    expect(sql.match(/create or replace function/gi)).toHaveLength(1);
    expect(sql).toContain("public.persist_formal_locks_on_completion()");
    expect(sql).toContain("security invoker set search_path=public,pg_temp");
    expect(sql).not.toMatch(/\b(?:alter table|create table|create policy|grant execute|revoke all|security definer|create function public.append_formal_outcome)/i);
  });
  it("explicitly accepts only v1/v2 and retains owner, path, frozen clock, forecast and window binding",()=>{
    expect(sql).toContain("not in ('formal-reality-criteria-v1','formal-reality-criteria-v2')");
    for(const clause of ["criteria->>'ownerId' is distinct from new.user_id::text","criteria->>'seedContextId' is distinct from new.seed_context_id::text","criteria->>'pathKey' is distinct from path.key","criteria->'forecastLockReference' is distinct from path.bundle->'forecastLockReference'","(criteria->>'frozenAt')::timestamptz is distinct from (frozen->>'lockedAt')::timestamptz","make_interval(days=>(path.bundle#>>'{inputSnapshot,horizonDays}')::integer)","then 100 else 32 end","jsonb_array_length(t->'conditions') not between 1 and 32"])expect(sql).toContain(clause);
    expect(sql).toContain("if criteria->>'version'='formal-reality-criteria-v2' then");
    expect(sql).toContain("history,actual,criteria");
  });
  it("binds v2 representative sample and actual selected flat steps and checks complete grouped condition keys",()=>{
    for(const clause of ["expected_trajectory is distinct from target#>>'{binding,trajectoryId}'","trajectory->'trajectorySeed' is distinct from target#>'{binding,trajectorySeed}'","jsonb_array_elements(trajectory#>'{finalWorld,worldEvents}')","e->>'branchId'=trajectory->>'trajectoryId'","target#>'{review,stepKeys}'","grouped_keys is distinct from condition_keys","'relationship_scope','response_source'","(select count(*) from jsonb_object_keys(c))<>11"])expect(sql).toContain(clause);
  });
});
