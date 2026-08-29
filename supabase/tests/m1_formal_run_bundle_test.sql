begin;

create extension if not exists pgtap with schema extensions;
select plan(64);

select has_column('public', 'simulations', 'graph_snapshot_id', 'canonical Run binds a locked Graph');
select has_column('public', 'simulations', 'agent_snapshot_id', 'canonical Run binds the immutable Agent snapshot');
select has_column('public', 'simulations', 'input_snapshot', 'canonical Run freezes its input');
select has_column('public', 'simulations', 'deterministic_seed', 'canonical Run records its deterministic seed');
select has_column('public', 'simulations', 'execution_version', 'canonical Run records execution version');
select has_column('public', 'simulations', 'engine_version', 'canonical Run records engine version');
select has_column('public', 'simulations', 'result_bundle', 'canonical Run stores its immutable result bundle');
select has_column('public', 'simulations', 'completed_at', 'canonical Run records completion time');
select has_column('public', 'simulation_ticks', 'branch_id', 'ticks retain trajectory branch identity');
select has_column('public', 'event_logs', 'event_payload', 'Events retain the canonical V2 event payload');
select has_column('public', 'claims', 'claim_payload', 'Claims retain the canonical V2 claim payload');
select has_column('public', 'reports', 'report_payload', 'Reports retain the canonical V2 report payload');
select has_table('public', 'simulation_run_idempotency_receipts', 'owner-scoped Run receipts exist');
select has_function('public', 'persist_account_sandbox_run_m1', array['uuid','uuid','uuid','integer','jsonb'], 'one atomic formal Run persistence RPC exists');
select ok(not (select prosecdef from pg_proc where oid = to_regprocedure('public.persist_account_sandbox_run_m1(uuid,uuid,uuid,integer,jsonb)')), 'formal Run persistence RPC is SECURITY INVOKER');
select function_privs_are('public', 'persist_account_sandbox_run_m1', array['uuid','uuid','uuid','integer','jsonb'], 'anon', array[]::text[], 'anonymous cannot execute the formal writer');
select function_privs_are('public', 'persist_account_sandbox_run_m1', array['uuid','uuid','uuid','integer','jsonb'], 'authenticated', array[]::text[], 'browser users cannot execute the generated-output writer directly');
select function_privs_are('public', 'persist_account_sandbox_run_m1', array['uuid','uuid','uuid','integer','jsonb'], 'service_role', array['EXECUTE'], 'only the controlled server writer role executes persistence');
select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.simulations')), false), 'Run RLS remains enabled');
select ok(not has_table_privilege('authenticated', 'public.simulations', 'insert'), 'browser cannot insert formal Runs directly');
select ok(not has_table_privilege('authenticated', 'public.event_logs', 'insert'), 'browser cannot insert Events directly');
select ok(not has_table_privilege('authenticated', 'public.claims', 'insert'), 'browser cannot insert Claims directly');
select ok(exists (select 1 from pg_trigger where tgrelid = to_regclass('public.simulations') and tgname = 'simulations_m1_immutable_guard'), 'completed Runs have a database immutability guard');
select ok(exists (select 1 from supabase_migrations.schema_migrations where version = '20260830140000'), 'formal Run Bundle migration is recorded');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-00000000e401', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm1-run-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000f401', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm1-run-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000e401', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select throws_ok(
  $$ select * from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000e401', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000410', 30, '{}'::jsonb) $$,
  '42501',
  null,
  'the authenticated browser role cannot invoke formal persistence'
);

select * from public.submit_seed_context_phase2(
  '00000000-0000-4000-8000-000000000401',
  '{"trackType":"crossroad","timeWindow":"30_days","questionText":"Should I accept the role?","situationSummary":"A manager and recruiter need an answer this week.","recentEvents":"An answer is needed this week.","keyPeopleText":"Manager and recruiter.","decisionOptions":"Accept or negotiate.","worries":"Timing is uncertain.","forbiddenActions":"Do not burn bridges.","safetyBoundaries":"Keep communication professional.","desiredOutput":"Compare stated options.","privacyAck":true,"privacySafetyAck":true}'::jsonb
);
select * from public.extract_key_people_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000401'), '00000000-0000-4000-8000-000000000402');
select * from public.mutate_key_people_phase3(
  (select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000401'),
  '00000000-0000-4000-8000-000000000403',
  jsonb_build_array(jsonb_build_object('type', 'confirm', 'person_id', (select id::text from public.key_people where seed_context_id = (select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000401') order by id limit 1)))
);
select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000401'), '00000000-0000-4000-8000-000000000404', false);
select * from public.generate_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000401'), '00000000-0000-4000-8000-000000000405');
reset role;

create temporary table m1_run_fixture as
select
  g.id as graph_id,
  g.seed_context_id as seed_id,
  g.agent_snapshot_id as agent_snapshot_id,
  jsonb_build_object(
    'causalFingerprint', '0123456789abcdef01234567',
    'versions', jsonb_build_object('runtime', 'formal-account-sandbox-m1-v1', 'schema', 'formal-run-bundle-m1-v1', 'trajectory', 'trajectory-engine-v2-stage-4'),
    'inputSnapshot', jsonb_build_object(
      'ownerId', g.user_id,
      'seedContextId', g.seed_context_id,
      'graphSnapshotId', g.id,
      'agentSnapshotId', g.agent_snapshot_id,
      'horizonDays', 30,
      'deterministicSeed', 1701,
      'calibrationSnapshot', '{}'::jsonb
    ),
    'events', jsonb_build_array(jsonb_build_object(
      'id', 'world_event_v2_m1_fixture',
      'eventType', 'controlled_transition',
      'evidenceClass', 'world_transition_simulation_evidence',
      'causalRealEvidenceIds', jsonb_build_array('evidence_fixture'),
      'branchId', 'branch_fixture',
      'beforeRevision', 1,
      'afterRevision', 2,
      'deltas', '[]'::jsonb,
      'operation', '{}'::jsonb,
      'createdAt', '2026-08-30T04:00:00.000Z'
    )),
    'claims', jsonb_build_array(jsonb_build_object(
      'id', 'claim_v2_m1_fixture',
      'claimType', 'scenario_frequency',
      'statement', 'A bounded branch occurred in the simulation.',
      'uncertaintyStatement', 'This is conditional simulation evidence, not a prediction.',
      'simulationEventIds', jsonb_build_array('world_event_v2_m1_fixture')
    )),
    'report', jsonb_build_object('claimIds', jsonb_build_array('claim_v2_m1_fixture'), 'title', 'Formal sandbox result'),
    'symbolicLensSnapshot', jsonb_build_object('mode', 'bounded_fusion', 'summary', 'Optional framing only')
  ) as bundle
from public.relation_graph_snapshots g
where g.user_id = '00000000-0000-0000-0000-00000000e401' and not g.graph_locked;
grant select on m1_run_fixture to service_role, authenticated;

set local role service_role;
select throws_ok(
  $$ select * from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000e401', (select graph_id from m1_run_fixture), '00000000-0000-4000-8000-000000000409', 30, (select bundle from m1_run_fixture)) $$,
  'P0001', 'graph_not_found', 'an unlocked Graph cannot start a formal Run'
);
reset role;
set local role authenticated;
select * from public.lock_relation_graph_phase3((select seed_id from m1_run_fixture), '00000000-0000-4000-8000-000000000406');
reset role;
set local role service_role;
select lives_ok(
  $$ select * from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000e401', (select graph_id from m1_run_fixture), '00000000-0000-4000-8000-000000000410', 30, (select bundle from m1_run_fixture)) $$,
  'a valid locked owner Graph persists one formal Run atomically'
);
reset role;
create temporary view m1_owned_runs as
select * from public.simulations
where user_id = '00000000-0000-0000-0000-00000000e401'
  and execution_version = 'formal-account-sandbox-m1-v1';
grant select on m1_owned_runs to service_role, authenticated;
select is((select count(*) from m1_owned_runs), 1::bigint, 'first request creates exactly one formal Run for the fixture account');
select is((select status from m1_owned_runs), 'completed'::public.simulation_status, 'the formal Run is completed only after its Bundle persists');
select is((select count(*) from public.simulation_ticks where simulation_id = (select id from m1_owned_runs)), 1::bigint, 'the Run has the expected canonical Tick count');
select is((select count(*) from public.event_logs where simulation_id = (select id from m1_owned_runs)), 1::bigint, 'the Run has the expected canonical Event count');
select is((select count(*) from public.claims where simulation_id = (select id from m1_owned_runs)), 1::bigint, 'the Run has the expected canonical Claim count');
select is((select count(*) from public.reports where simulation_id = (select id from m1_owned_runs)), 1::bigint, 'the Run has exactly one canonical Report');
select ok(not exists (
  select 1 from public.claims c
  left join public.event_logs e on e.id = any(c.evidence_event_ids) and e.simulation_id = c.simulation_id and e.user_id = c.user_id
  where c.simulation_id = (select id from m1_owned_runs) and e.id is null
), 'every Claim evidence id resolves to an Event from the same owner Run');
select ok(not exists (
  select 1 from public.reports r
  left join public.claims c on c.id = any(r.claim_ids) and c.simulation_id = r.simulation_id and c.user_id = r.user_id
  where r.simulation_id = (select id from m1_owned_runs) and c.id is null
), 'the Report references only Claims from the same owner Run');
select ok((select e.created_at <= c.created_at and c.created_at <= r.created_at from public.event_logs e join public.claims c on c.simulation_id=e.simulation_id join public.reports r on r.simulation_id=e.simulation_id where e.simulation_id=(select id from m1_owned_runs) limit 1), 'Event then Claim then Report persistence order is observable');
select ok((select symbolic_lens_snapshot = '{"mode":"bounded_fusion","summary":"Optional framing only"}'::jsonb from m1_owned_runs), 'Symbolic Lens is stored as a separate non-causal snapshot');
select ok((select result_bundle = (select bundle from m1_run_fixture) from m1_owned_runs), 'the immutable Run retains the complete canonical result Bundle');

select set_config('app.m1_run_count', (select count(*)::text from m1_owned_runs), true);
select set_config('app.m1_event_count', (select count(*)::text from public.event_logs where simulation_id=(select id from m1_owned_runs)), true);
set local role service_role;
select is((select idempotent from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000e401', (select graph_id from m1_run_fixture), '00000000-0000-4000-8000-000000000410', 30, (select bundle from m1_run_fixture))), true, 'same owner key and content returns an explicit idempotent replay');
reset role;
select is((select count(*) from m1_owned_runs), current_setting('app.m1_run_count')::bigint, 'idempotent replay creates no duplicate Run');
select is((select count(*) from public.event_logs where simulation_id=(select id from m1_owned_runs)), current_setting('app.m1_event_count')::bigint, 'idempotent replay creates no duplicate Event');
set local role service_role;
select throws_ok(
  $$ select * from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000e401', (select graph_id from m1_run_fixture), '00000000-0000-4000-8000-000000000410', 30, jsonb_set((select bundle from m1_run_fixture), '{symbolicLensSnapshot,summary}', '"changed"')) $$,
  'P0001', 'idempotency_key_content_conflict', 'same owner key with changed content is rejected'
);
select throws_ok(
  $$ select * from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000f401', (select graph_id from m1_run_fixture), '00000000-0000-4000-8000-000000000411', 30, jsonb_set((select bundle from m1_run_fixture), '{inputSnapshot,ownerId}', '"00000000-0000-0000-0000-00000000f401"')) $$,
  'P0001', 'graph_not_found', 'a foreign owner cannot bind another account Graph'
);
select throws_ok(
  $$ select * from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000e401', (select graph_id from m1_run_fixture), '00000000-0000-4000-8000-000000000412', 30, jsonb_set((select bundle from m1_run_fixture), '{claims,0,simulationEventIds,0}', '"world_event_v2_missing"')) $$,
  'P0001', 'claim_evidence_invalid', 'a Claim with foreign or missing Event evidence aborts the Bundle'
);
reset role;
select is((select count(*) from m1_owned_runs), current_setting('app.m1_run_count')::bigint, 'a failed Bundle leaves no partial Run');
select is((select count(*) from public.event_logs where simulation_id=(select id from m1_owned_runs)), current_setting('app.m1_event_count')::bigint, 'a failed Bundle leaves no partial Event');
select throws_ok($$ update public.simulations set result_bundle=result_bundle where user_id='00000000-0000-0000-0000-00000000e401' and execution_version='formal-account-sandbox-m1-v1' $$, '42501', 'completed_run_immutable', 'a completed formal Run cannot be updated');
select throws_ok($$ delete from public.simulations where user_id='00000000-0000-0000-0000-00000000e401' and execution_version='formal-account-sandbox-m1-v1' $$, '42501', 'completed_run_immutable', 'a completed formal Run cannot be deleted');
select throws_ok($$ update public.event_logs set event_payload=event_payload where simulation_id=(select id from m1_owned_runs) $$, '42501', 'completed_run_immutable', 'a completed formal Event cannot be updated');
select throws_ok($$ delete from public.claims where simulation_id=(select id from m1_owned_runs) $$, '42501', 'completed_run_immutable', 'a completed formal Claim cannot be deleted');
select is(coalesce(nullif(current_setting('app.m1_run_rpc', true), ''), 'off'), 'off', 'the formal writer guard is closed after success and failure paths');

select set_config('app.m1_bundle_hash',(select md5(result_bundle::text) from m1_owned_runs),true);
select set_config('app.m1_run_id',(select id::text from m1_owned_runs),true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000e401',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select lives_ok($$ select * from public.append_account_sandbox_feedback_m1((select id from m1_owned_runs),'useful','Clear evidence chain','00000000-0000-4000-8000-000000000430') $$,'owned completed Run accepts append-only feedback');
select is((select idempotent from public.append_account_sandbox_feedback_m1((select id from m1_owned_runs),'useful','Clear evidence chain','00000000-0000-4000-8000-000000000430')),true,'same feedback key and content replays idempotently');
select throws_ok($$ select * from public.append_account_sandbox_feedback_m1((select id from m1_owned_runs),'off','Changed content','00000000-0000-4000-8000-000000000430') $$,'P0001','idempotency_key_content_conflict','same feedback key with changed content conflicts');
reset role;
select is((select count(*) from public.feedback_logs where user_id='00000000-0000-0000-0000-00000000e401' and version='formal-run-feedback-m1-v1'),1::bigint,'feedback replay creates no duplicate row');
select throws_ok($$ update public.feedback_logs set comment=comment where user_id='00000000-0000-0000-0000-00000000e401' and version='formal-run-feedback-m1-v1' $$,'42501','formal_feedback_immutable','formal feedback cannot be updated');
select throws_ok($$ delete from public.feedback_logs where user_id='00000000-0000-0000-0000-00000000e401' and version='formal-run-feedback-m1-v1' $$,'42501','formal_feedback_immutable','formal feedback cannot be deleted');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000f401',true);
set local role authenticated;
select throws_ok($$ select * from public.append_account_sandbox_feedback_m1(current_setting('app.m1_run_id')::uuid,'mixed','','00000000-0000-4000-8000-000000000431') $$,'P0001','run_not_found','another account cannot append feedback to the Run');
reset role;
select is((select md5(result_bundle::text) from m1_owned_runs),current_setting('app.m1_bundle_hash'),'feedback does not rewrite the historical Run Bundle');
select ok((select calibration_snapshot='{}'::jsonb from m1_owned_runs),'historical calibration snapshot stays frozen after later feedback');
set local role service_role;
select lives_ok($$ select * from public.persist_account_sandbox_run_m1(
  '00000000-0000-0000-0000-00000000e401',(select graph_id from m1_run_fixture),'00000000-0000-4000-8000-000000000440',30,
  jsonb_set(jsonb_set((select bundle from m1_run_fixture),'{causalFingerprint}','"abcdef0123456789abcdef01"'),'{inputSnapshot,calibrationSnapshot}','{"source":"account_feedback","signals":[{"rating":"useful"}]}'::jsonb)
) $$,'a later owner Run persists beside the historical Run');
reset role;
select is((select count(*) from m1_owned_runs),2::bigint,'two immutable Runs coexist for the same account');
select ok((select calibration_snapshot='{}'::jsonb from public.simulations where idempotency_key='00000000-0000-4000-8000-000000000410') and (select calibration_snapshot#>>'{source}'='account_feedback' from public.simulations where idempotency_key='00000000-0000-4000-8000-000000000440'),'feedback calibration appears only on the later Run');
select is((select idempotency_key from m1_owned_runs order by created_at desc,id desc limit 1),'00000000-0000-4000-8000-000000000440','History ordering returns the newer Run first');

select * from finish();
rollback;
