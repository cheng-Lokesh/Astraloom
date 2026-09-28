begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

select has_function(
  'public',
  'persist_life_climate_run_b2',
  array['uuid','uuid','integer','uuid','jsonb','jsonb','text'],
  'multi-horizon Track B runs have one server-side writer'
);
select ok(
  coalesce((select prosecdef = false from pg_proc where oid = to_regprocedure('public.persist_life_climate_run_b2(uuid,uuid,integer,uuid,jsonb,jsonb,text)')), false),
  'the writer runs with invoker privileges'
);
select ok(
  not coalesce(has_function_privilege('authenticated', to_regprocedure('public.persist_life_climate_run_b2(uuid,uuid,integer,uuid,jsonb,jsonb,text)'), 'EXECUTE'), false),
  'browser users cannot invoke the Track B writer'
);
select ok(
  coalesce(has_function_privilege('service_role', to_regprocedure('public.persist_life_climate_run_b2(uuid,uuid,integer,uuid,jsonb,jsonb,text)'), 'EXECUTE'), false),
  'only the server role can invoke the Track B writer'
);
select ok(
  coalesce(has_table_privilege('service_role', to_regclass('public.life_climate_runs'), 'SELECT') and has_table_privilege('service_role', to_regclass('public.life_climate_runs'), 'INSERT'), false),
  'the server writer can read and append Track B history'
);
select ok(
  not coalesce(has_table_privilege('service_role', to_regclass('public.life_climate_runs'), 'UPDATE') or has_table_privilege('service_role', to_regclass('public.life_climate_runs'), 'DELETE'), false),
  'the server role cannot rewrite or delete saved Track B history'
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

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-4000-8000-00000000c701', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'life-climate-b2-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-4000-8000-00000000c702', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'life-climate-b2-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000c701', true);
select * from public.submit_seed_context_phase2(
  '00000000-0000-4000-8000-00000000c711',
  '{"trackType":"crossroad","timeWindow":"90_days","questionText":"A non-sensitive test situation","situationSummary":"A bounded test context for a local product flow.","recentEvents":"One routine update.","keyPeopleText":"No private details.","decisionOptions":"Compare two reasonable options.","worries":"Timing is uncertain.","forbiddenActions":"No unsafe action.","safetyBoundaries":"Keep the comparison conditional.","desiredOutput":"Show a bounded comparison.","privacyAck":true,"privacySafetyAck":true}'::jsonb
);
insert into public.reality_profiles (
  user_id, seed_context_id,
  life_climate_classification, life_climate_evidence_summary,
  resources_classification, resources_evidence_summary,
  constraints_classification, constraints_evidence_summary
) values (
  auth.uid(),
  (select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-00000000c711'),
  'unknown', '明确未知', 'unknown', '明确未知', 'unknown', '明确未知'
);
reset role;

create temporary table life_climate_b2_fixture on commit drop as
with source as (
  select seed.user_id, seed.id as seed_id, profile.revision, profile.life_model_domains as domains,
    jsonb_build_object('value', '尝试弹性工作', 'classification', 'assumption', 'evidenceSummary', '本人设定的第一阶段假设') as first_state,
    jsonb_build_object('value', '转为顾问型工作', 'classification', 'assumption', 'evidenceSummary', '本人设定的第三阶段假设') as second_state,
    '00000000-0000-4000-8000-00000000c741'::text as first_event_id,
    '00000000-0000-4000-8000-00000000c742'::text as second_event_id,
    '00000000-0000-4000-8000-00000000c743'::text as first_claim_id,
    '00000000-0000-4000-8000-00000000c744'::text as second_claim_id
  from public.seed_contexts seed
  join public.reality_profiles profile on profile.seed_context_id = seed.id and profile.user_id = seed.user_id
  where seed.submission_key = '00000000-0000-4000-8000-00000000c711'
), prepared as (
  select source.*,
    jsonb_build_array(
      jsonb_build_object('domain', 'career', 'entryIndex', 0, 'startPeriod', 1, 'newState', first_state->>'value', 'evidenceSummary', first_state->>'evidenceSummary'),
      jsonb_build_object('domain', 'career', 'entryIndex', 0, 'startPeriod', 3, 'newState', second_state->>'value', 'evidenceSummary', second_state->>'evidenceSummary')
    ) as changes
  from source
)
select prepared.*,
  jsonb_build_object(
    'version', 'life-climate-b2-v1',
    'horizon', '3_years',
    'profileRevision', revision,
    'lifeModelDomains', domains,
    'changes', changes,
    'safetyLevel', 'safe',
    'safetyFlags', '[]'::jsonb
  ) as input_snapshot,
  jsonb_build_object(
    'version', 'life-climate-b2-v1',
    'horizon', '3_years',
    'profileRevision', revision,
    'profileSnapshot', jsonb_build_object('lifeModelDomains', domains),
    'selectedChanges', changes,
    'paths', jsonb_build_array(
      jsonb_build_object(
        'id', 'baseline',
        'periods', (select jsonb_agg(jsonb_build_object('periodIndex', period_index, 'label', '第 ' || period_index || ' 年', 'lifeModelDomains', domains, 'changedDomains', '[]'::jsonb) order by period_index) from generate_series(1, 3) as periods(period_index))
      ),
      jsonb_build_object(
        'id', 'alternative',
        'periods', (select jsonb_agg(jsonb_build_object(
          'periodIndex', period_index,
          'label', '第 ' || period_index || ' 年',
          'lifeModelDomains', case when period_index < 3 then jsonb_set(domains, '{career,0}', first_state, false) else jsonb_set(domains, '{career,0}', second_state, false) end,
          'changedDomains', '["career"]'::jsonb
        ) order by period_index) from generate_series(1, 3) as periods(period_index))
      )
    ),
    'events', jsonb_build_array(
      jsonb_build_object('id', first_event_id, 'kind', 'assumption_transition', 'pathId', 'alternative', 'periodIndex', 1, 'source', 'user_assumption', 'domain', 'career', 'entryIndex', 0, 'summary', 'First stated change.', 'beforeState', domains#>'{career,0}', 'afterState', first_state),
      jsonb_build_object('id', second_event_id, 'kind', 'assumption_transition', 'pathId', 'alternative', 'periodIndex', 3, 'source', 'user_assumption', 'domain', 'career', 'entryIndex', 0, 'summary', 'Later stated change.', 'beforeState', first_state, 'afterState', second_state)
    ),
    'claims', jsonb_build_array(
      jsonb_build_object('id', first_claim_id, 'type', 'conditional_structure_change', 'pathId', 'alternative', 'summary', 'First conditional change.', 'uncertainty', 'User-authored assumption only.', 'evidenceEventIds', jsonb_build_array(first_event_id)),
      jsonb_build_object('id', second_claim_id, 'type', 'conditional_structure_change', 'pathId', 'alternative', 'summary', 'Later conditional change.', 'uncertainty', 'User-authored assumption only.', 'evidenceEventIds', jsonb_build_array(second_event_id))
    ),
    'report', jsonb_build_object('claimIds', jsonb_build_array(first_claim_id, second_claim_id), 'mode', 'user_authored_structural_path', 'headline', 'Three-year structure comparison', 'summary', 'Conditional path only.', 'limitations', jsonb_build_array('No cross-domain causality.'), 'includesExactDates', false, 'claimsUseEventEvidence', true)
  ) as result_bundle
from prepared;

create temporary table life_climate_b2_calls (
  call_name text not null,
  id uuid not null,
  idempotent boolean not null,
  result_bundle jsonb not null
) on commit drop;
grant select on life_climate_b2_fixture to service_role;
grant insert, select on life_climate_b2_calls to service_role;

set local role service_role;
insert into life_climate_b2_calls (call_name, id, idempotent, result_bundle)
select 'first', run.id, run.idempotent, run.result_bundle
from life_climate_b2_fixture fixture
cross join lateral public.persist_life_climate_run_b2(
  fixture.user_id,
  fixture.seed_id,
  fixture.revision,
  '00000000-0000-4000-8000-00000000c731',
  fixture.input_snapshot,
  fixture.result_bundle,
  'life-climate-b2-first'
) as run;
select is((select count(*) from public.life_climate_runs where user_id = '00000000-0000-4000-8000-00000000c701' and version = 'life-climate-b2-v1' and horizon = '3_years'), 1::bigint, 'a valid three-year path is saved to the owner''s history');
select is((select jsonb_array_length(result_bundle#>'{paths,0,periods}') from life_climate_b2_calls where call_name = 'first'), 3, 'the baseline contains one coarse stage per year');
select is((select count(*) from jsonb_array_elements((select result_bundle->'claims' from life_climate_b2_calls where call_name = 'first')) claim where claim->'evidenceEventIds'->>0 in (select event->>'id' from jsonb_array_elements((select result_bundle->'events' from life_climate_b2_calls where call_name = 'first')) event)), 2::bigint, 'each saved Claim links to its matching assumption Event');
select is((select result_bundle#>>'{report,claimIds,1}' from life_climate_b2_calls where call_name = 'first'), (select result_bundle#>>'{claims,1,id}' from life_climate_b2_calls where call_name = 'first'), 'the Report references the saved Claims');

insert into life_climate_b2_calls (call_name, id, idempotent, result_bundle)
select 'retry', run.id, run.idempotent, run.result_bundle
from life_climate_b2_fixture fixture
cross join lateral public.persist_life_climate_run_b2(
  fixture.user_id,
  fixture.seed_id,
  fixture.revision,
  '00000000-0000-4000-8000-00000000c731',
  fixture.input_snapshot,
  fixture.result_bundle,
  'life-climate-b2-retry'
) as run;
select is((select id from life_climate_b2_calls where call_name = 'retry'), (select id from life_climate_b2_calls where call_name = 'first'), 'an identical retry returns the original immutable path');
select ok((select idempotent from life_climate_b2_calls where call_name = 'retry'), 'an identical retry is marked as idempotent');
select is((select count(*) from public.life_climate_runs where user_id = '00000000-0000-4000-8000-00000000c701' and version = 'life-climate-b2-v1'), 1::bigint, 'an identical retry does not create a duplicate history entry');

select throws_ok($$
  select * from public.persist_life_climate_run_b2(
    (select user_id from life_climate_b2_fixture),
    (select seed_id from life_climate_b2_fixture),
    (select revision from life_climate_b2_fixture),
    '00000000-0000-4000-8000-00000000c731',
    (select jsonb_set(input_snapshot, '{changes,0,newState}', to_jsonb('A different state'::text), false) from life_climate_b2_fixture),
    (select jsonb_set(jsonb_set(result_bundle, '{selectedChanges,0,newState}', to_jsonb('A different state'::text), false), '{events,0,afterState,value}', to_jsonb('A different state'::text), false) from life_climate_b2_fixture),
    'life-climate-b2-conflict'
  )
$$, 'P0001', 'idempotency_conflict', 'reusing the same key with different content is rejected');

select throws_ok($$
  select * from public.persist_life_climate_run_b2(
    (select user_id from life_climate_b2_fixture),
    (select seed_id from life_climate_b2_fixture),
    (select revision from life_climate_b2_fixture),
    '00000000-0000-4000-8000-00000000c732',
    (select jsonb_set(input_snapshot, '{changes,1,domain}', to_jsonb('wealth'::text), false) from life_climate_b2_fixture),
    (select jsonb_set(result_bundle, '{selectedChanges,1,domain}', to_jsonb('wealth'::text), false) from life_climate_b2_fixture),
    'life-climate-b2-mixed-theme'
  )
$$, 'P0001', 'invalid_run_input', 'the database writer rejects unrelated themes in one path');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000c701', true);
select is((select count(*) from public.life_climate_runs where version = 'life-climate-b2-v1'), 1::bigint, 'the owner can reopen the saved path from account history');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000c702', true);
select is((select count(*) from public.life_climate_runs where version = 'life-climate-b2-v1'), 0::bigint, 'a second account cannot read the first account path');
reset role;

select * from finish();
rollback;
