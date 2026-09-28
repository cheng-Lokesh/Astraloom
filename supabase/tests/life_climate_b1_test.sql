begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

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

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-00000000c601', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'life-climate-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000c602', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'life-climate-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000c601', true);
select * from public.submit_seed_context_phase2(
  '00000000-0000-4000-8000-00000000c611',
  '{"trackType":"crossroad","timeWindow":"90_days","questionText":"A non-sensitive test situation","situationSummary":"A bounded test context for a local product flow.","recentEvents":"One routine update.","keyPeopleText":"No private details.","decisionOptions":"Compare two reasonable options.","worries":"Timing is uncertain.","forbiddenActions":"No unsafe action.","safetyBoundaries":"Keep the comparison conditional.","desiredOutput":"Show a bounded comparison.","privacyAck":true,"privacySafetyAck":true}'::jsonb
);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000c601', true);
insert into public.reality_profiles (
  user_id, seed_context_id,
  life_climate_classification, life_climate_evidence_summary,
  resources_classification, resources_evidence_summary,
  constraints_classification, constraints_evidence_summary
) values (
  auth.uid(),
  (select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-00000000c611'),
  'unknown', '明确未知', 'unknown', '明确未知', 'unknown', '明确未知'
);
reset role;

create temporary table life_climate_b1_fixture on commit drop as
select
  seed.user_id,
  seed.id as seed_id,
  profile.revision,
  profile.life_model_domains as domains,
  jsonb_build_object(
    'domain', 'career',
    'entryIndex', 0,
    'startPeriod', 2,
    'newState', '尝试四天工作制',
    'evidenceSummary', '本人设定的备选路径假设'
  ) as change,
  jsonb_build_object(
    'version', 'life-climate-b1-v1',
    'horizon', '1_year',
    'profileRevision', profile.revision,
    'lifeModelDomains', profile.life_model_domains,
    'change', jsonb_build_object(
      'domain', 'career',
      'entryIndex', 0,
      'startPeriod', 2,
      'newState', '尝试四天工作制',
      'evidenceSummary', '本人设定的备选路径假设'
    ),
    'safetyLevel', 'safe',
    'safetyFlags', '[]'::jsonb
  ) as input_snapshot,
  jsonb_build_object(
    'version', 'life-climate-b1-v1',
    'horizon', '1_year',
    'profileRevision', profile.revision,
    'profileSnapshot', jsonb_build_object('lifeModelDomains', profile.life_model_domains),
    'selectedChange', jsonb_build_object(
      'domain', 'career',
      'entryIndex', 0,
      'startPeriod', 2,
      'newState', '尝试四天工作制',
      'evidenceSummary', '本人设定的备选路径假设'
    ),
    'paths', jsonb_build_array(
      jsonb_build_object(
        'id', 'baseline',
        'label', '沿用当前资料结构',
        'basis', 'frozen_profile',
        'periods', (
          select jsonb_agg(jsonb_build_object(
            'periodIndex', period_index,
            'label', '相对阶段 ' || period_index,
            'lifeModelDomains', profile.life_model_domains,
            'changedDomain', null
          ) order by period_index)
          from generate_series(1, 4) as periods(period_index)
        )
      ),
      jsonb_build_object(
        'id', 'alternative',
        'label', '应用一项用户假设',
        'basis', 'user_assumption',
        'periods', (
          select jsonb_agg(jsonb_build_object(
            'periodIndex', period_index,
            'label', '相对阶段 ' || period_index,
            'lifeModelDomains', case
              when period_index >= 2 then jsonb_set(
                profile.life_model_domains,
                '{career,0}',
                '{"value":"尝试四天工作制","classification":"assumption","evidenceSummary":"本人设定的备选路径假设"}'::jsonb,
                false
              )
              else profile.life_model_domains
            end,
            'changedDomain', case when period_index >= 2 then 'career' else null end
          ) order by period_index)
          from generate_series(1, 4) as periods(period_index)
        )
      )
    ),
    'events', jsonb_build_array(jsonb_build_object(
      'id', '00000000-0000-4000-8000-00000000c621',
      'kind', 'assumption_transition',
      'pathId', 'alternative',
      'periodIndex', 2,
      'source', 'user_assumption',
      'domain', 'career',
      'summary', '在第二阶段应用一项用户假设。',
      'beforeState', profile.life_model_domains#>'{career,0}',
      'afterState', '{"value":"尝试四天工作制","classification":"assumption","evidenceSummary":"本人设定的备选路径假设"}'::jsonb
    )),
    'claims', jsonb_build_array(jsonb_build_object(
      'id', '00000000-0000-4000-8000-00000000c622',
      'type', 'conditional_structure_change',
      'pathId', 'alternative',
      'summary', '如果该假设生效，路径将从第二阶段起反映此结构变化。',
      'uncertainty', '这是条件式对照，不是现实事件或确定预测。',
      'evidenceEventIds', jsonb_build_array('00000000-0000-4000-8000-00000000c621')
    )),
    'report', jsonb_build_object(
      'claimIds', jsonb_build_array('00000000-0000-4000-8000-00000000c622'),
      'mode', 'conditional_structure_comparison',
      'headline', '一年人生结构路径对照',
      'summary', '并列查看冻结结构与一项明确假设。',
      'limitations', jsonb_build_array('不推断跨领域因果。'),
      'includesExactDates', false,
      'claimsUseEventEvidence', true
    )
  ) as result_bundle
from public.seed_contexts seed
join public.reality_profiles profile on profile.seed_context_id = seed.id and profile.user_id = seed.user_id
where seed.submission_key = '00000000-0000-4000-8000-00000000c611';

create temporary table life_climate_b1_calls (
  call_name text not null,
  id uuid not null,
  idempotent boolean not null,
  result_bundle jsonb not null
) on commit drop;
grant select on life_climate_b1_fixture to service_role;
grant insert, select on life_climate_b1_calls to service_role;

set local role service_role;
insert into life_climate_b1_calls (call_name, id, idempotent, result_bundle)
select 'first', run.id, run.idempotent, run.result_bundle
from life_climate_b1_fixture fixture
cross join lateral public.persist_life_climate_run_b1(
  fixture.user_id,
  fixture.seed_id,
  fixture.revision,
  '00000000-0000-4000-8000-00000000c631',
  fixture.input_snapshot,
  fixture.result_bundle,
  'life-climate-first'
) as run;
select is((select count(*) from public.life_climate_runs where user_id = '00000000-0000-0000-0000-00000000c601'), 1::bigint, 'the valid owner path persists one formal comparison');
select is((select result_bundle->>'version' from life_climate_b1_calls where call_name = 'first'), 'life-climate-b1-v1', 'the stored comparison retains its versioned result bundle');
select is((select result_bundle#>>'{claims,0,evidenceEventIds,0}' from life_climate_b1_calls where call_name = 'first'), (select result_bundle#>>'{events,0,id}' from life_climate_b1_calls where call_name = 'first'), 'the stored Claim remains linked to its Event evidence');
select is((select result_bundle#>>'{report,claimIds,0}' from life_climate_b1_calls where call_name = 'first'), (select result_bundle#>>'{claims,0,id}' from life_climate_b1_calls where call_name = 'first'), 'the stored Report remains linked to its Claim');

insert into life_climate_b1_calls (call_name, id, idempotent, result_bundle)
select 'retry', run.id, run.idempotent, run.result_bundle
from life_climate_b1_fixture fixture
cross join lateral public.persist_life_climate_run_b1(
  fixture.user_id,
  fixture.seed_id,
  fixture.revision,
  '00000000-0000-4000-8000-00000000c631',
  fixture.input_snapshot,
  fixture.result_bundle,
  'life-climate-retry'
) as run;
select is((select id from life_climate_b1_calls where call_name = 'retry'), (select id from life_climate_b1_calls where call_name = 'first'), 'an identical retry returns the original immutable Run');
select ok((select idempotent from life_climate_b1_calls where call_name = 'retry'), 'an identical retry is reported as idempotent');
select is((select count(*) from public.life_climate_runs where user_id = '00000000-0000-0000-0000-00000000c601'), 1::bigint, 'an identical retry does not create a duplicate history item');

select throws_ok($$
  select * from public.persist_life_climate_run_b1(
    (select user_id from life_climate_b1_fixture),
    (select seed_id from life_climate_b1_fixture),
    (select revision from life_climate_b1_fixture),
    '00000000-0000-4000-8000-00000000c631',
    (select jsonb_set(input_snapshot, '{change,newState}', to_jsonb('A different alternative'::text), false) from life_climate_b1_fixture),
    (select jsonb_set(result_bundle, '{selectedChange,newState}', to_jsonb('A different alternative'::text), false) from life_climate_b1_fixture),
    'life-climate-conflict'
  )
$$, 'P0001', 'idempotency_conflict', 'reusing a key with different user assumptions is rejected');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000c601', true);
select is((select count(*) from public.life_climate_runs), 1::bigint, 'the owner can read the saved comparison from account history');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000c602', true);
select is((select count(*) from public.life_climate_runs), 0::bigint, 'a second account cannot read the first account history');
reset role;

set local role service_role;
select throws_ok($$
  select * from public.persist_life_climate_run_b1(
    '00000000-0000-0000-0000-00000000c602',
    (select seed_id from life_climate_b1_fixture),
    (select revision from life_climate_b1_fixture),
    '00000000-0000-4000-8000-00000000c632',
    (select input_snapshot from life_climate_b1_fixture),
    (select result_bundle from life_climate_b1_fixture),
    'life-climate-cross-owner'
  )
$$, 'P0001', 'life_climate_seed_not_found', 'the writer rejects an attempt to bind another owner to the Seed');
select is((select count(*) from public.life_climate_runs where user_id = '00000000-0000-0000-0000-00000000c602'), 0::bigint, 'a rejected cross-owner request leaves no second-account Run');
reset role;

select * from finish();
rollback;
