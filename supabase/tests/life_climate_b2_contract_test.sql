begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select has_function(
  'public',
  'persist_life_climate_run_b2',
  array['uuid','uuid','integer','uuid','jsonb','jsonb','text'],
  'multi-horizon Track B runs have one server-side writer'
);
select ok(
  not coalesce(has_function_privilege('authenticated', to_regprocedure('public.persist_life_climate_run_b2(uuid,uuid,integer,uuid,jsonb,jsonb,text)'), 'EXECUTE'), false),
  'browser users cannot invoke the Track B writer'
);
select ok(
  coalesce(has_function_privilege('service_role', to_regprocedure('public.persist_life_climate_run_b2(uuid,uuid,integer,uuid,jsonb,jsonb,text)'), 'EXECUTE'), false),
  'only the server role can invoke the Track B writer'
);

set local role service_role;
select throws_ok(
  $$ select * from public.persist_life_climate_run_b2(
    '00000000-0000-4000-8000-00000000c701',
    '00000000-0000-4000-8000-00000000c702',
    0,
    '00000000-0000-4000-8000-00000000c703',
    '{}'::jsonb,
    '{}'::jsonb,
    'test-trace'
  ) $$,
  'P0001',
  'invalid_run_input',
  'the multi-horizon writer rejects malformed input with a stable error'
);
reset role;

select * from finish();
rollback;
