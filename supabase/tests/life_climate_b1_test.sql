begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

select has_table('public', 'life_climate_runs', 'Track B runs have a dedicated immutable ledger');
select has_function('public', 'persist_life_climate_run_b1', array['uuid','uuid','integer','uuid','jsonb','jsonb','text'], 'Track B runs use one versioned server-side writer');
select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.life_climate_runs')), false), 'Track B run storage enforces row-level security');
select ok(exists (select 1 from pg_policy where polrelid = to_regclass('public.life_climate_runs') and polname = 'life_climate_runs_select_own'), 'Track B history has an owner-only read policy');
select ok(coalesce(has_table_privilege('authenticated', to_regclass('public.life_climate_runs'), 'SELECT'), false), 'authenticated users can read only rows allowed by RLS');
select ok(not coalesce(has_table_privilege('authenticated', to_regclass('public.life_climate_runs'), 'INSERT'), false), 'browser users cannot write generated history directly');
select ok(not coalesce(has_table_privilege('authenticated', to_regclass('public.life_climate_runs'), 'UPDATE'), false), 'browser users cannot rewrite generated history');
select ok(not coalesce(has_table_privilege('authenticated', to_regclass('public.life_climate_runs'), 'DELETE'), false), 'browser users cannot delete generated history');
select ok(not coalesce(has_function_privilege('authenticated', to_regprocedure('public.persist_life_climate_run_b1(uuid,uuid,integer,uuid,jsonb,jsonb,text)'), 'EXECUTE'), false), 'authenticated users cannot call the privileged writer');
select ok(coalesce(has_function_privilege('service_role', to_regprocedure('public.persist_life_climate_run_b1(uuid,uuid,integer,uuid,jsonb,jsonb,text)'), 'EXECUTE'), false), 'the server-only service role can call the writer');
select ok(coalesce(has_table_privilege('service_role', to_regclass('public.life_climate_runs'), 'SELECT') and has_table_privilege('service_role', to_regclass('public.life_climate_runs'), 'INSERT'), false), 'the server writer can read and append Track B records');
select ok(not coalesce(has_table_privilege('service_role', to_regclass('public.life_climate_runs'), 'UPDATE') or has_table_privilege('service_role', to_regclass('public.life_climate_runs'), 'DELETE'), false), 'the server role has no update or delete privilege for Track B history');

set local role service_role;
select throws_ok(
  $$ select * from public.persist_life_climate_run_b1(
    '00000000-0000-4000-8000-00000000b501',
    '00000000-0000-4000-8000-00000000b502',
    0,
    '00000000-0000-4000-8000-00000000b503',
    '{}'::jsonb,
    '{}'::jsonb,
    'test-trace'
  ) $$,
  'P0001',
  'invalid_run_input',
  'the RPC rejects malformed input with a stable validation error'
);
reset role;

select * from finish();
rollback;
