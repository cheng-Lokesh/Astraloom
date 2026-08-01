begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- Shape and least-privilege contract. Column checks deliberately prove there
-- is no broad table SELECT grant before proving the safe projection.
select has_table('public', 'agent_profile_snapshots', 'immutable Agent snapshot parent exists');
select has_table('public', 'agent_snapshot_idempotency_receipts', 'Agent receipt ledger exists');
select has_column('public', 'agent_profiles', 'snapshot_id', 'Agent rows bind to a snapshot');
select has_column('public', 'agent_profiles', 'field_sources', 'Agent rows retain field provenance');
select has_column('public', 'agent_profiles', 'request_hash', 'Agent rows bind canonical content');
select has_column('public', 'agent_profiles', 'safety_level', 'Agent rows retain derived safety');
select has_type('public', 'agent_profile_type', 'formal Agent enum exists');
select enum_has_labels('public', 'agent_profile_type', array['user_core', 'user_variant', 'npc'], 'formal Agent enum contains only formal Step B roles');
select has_function('public', 'generate_agent_snapshot_phase3', array['uuid', 'uuid', 'boolean'], 'single controlled Agent writer exists');
select ok(not (select prosecdef from pg_proc where oid = to_regprocedure('public.generate_agent_snapshot_phase3(uuid,uuid,boolean)')), 'Agent writer is SECURITY INVOKER');
select is((select proconfig::text from pg_proc where oid = to_regprocedure('public.generate_agent_snapshot_phase3(uuid,uuid,boolean)')), '{"search_path=public, extensions"}', 'Agent writer has fixed search path');
select function_privs_are('public', 'generate_agent_snapshot_phase3', array['uuid', 'uuid', 'boolean'], 'authenticated', array['EXECUTE'], 'only authenticated can execute Agent writer');
select function_privs_are('public', 'generate_agent_snapshot_phase3', array['uuid', 'uuid', 'boolean'], 'anon', array[]::text[], 'anon cannot execute Agent writer');
select ok(not has_table_privilege('authenticated', 'public.agent_profiles', 'select'), 'authenticated has no broad Agent SELECT');
select ok(has_column_privilege('authenticated', 'public.agent_profiles', 'id', 'select'), 'safe Agent id is readable');
select ok(has_column_privilege('authenticated', 'public.agent_profiles', 'display_name', 'select'), 'safe Agent label is readable');
select ok(not has_column_privilege('authenticated', 'public.agent_profiles', 'trace_id', 'select'), 'trace is private');
select ok(not has_column_privilege('authenticated', 'public.agent_profiles', 'writer_version', 'select'), 'writer metadata is private');
select ok(not has_column_privilege('authenticated', 'public.agent_profiles', 'idempotency_key', 'select'), 'idempotency metadata is private');
select ok(not has_column_privilege('authenticated', 'public.agent_profiles', 'request_hash', 'select'), 'content hash is private');
select ok(not has_column_privilege('authenticated', 'public.agent_profiles', 'field_sources', 'select'), 'field provenance is private');
select ok(not has_table_privilege('anon', 'public.agent_profiles', 'select'), 'anon has no Agent table privilege');
select ok(not has_table_privilege('anon', 'public.relation_edges', 'select'), 'anon has no Edge table privilege');
select ok(not has_table_privilege('authenticated', 'public.agent_profiles', 'update'), 'Agent update is denied');
select ok(not has_table_privilege('authenticated', 'public.agent_profiles', 'delete'), 'Agent delete is denied');
select ok(not has_table_privilege('authenticated', 'public.agent_profiles', 'truncate'), 'Agent truncate is denied');
select ok(not has_table_privilege('authenticated', 'public.agent_profiles', 'trigger'), 'Agent trigger is denied');
select ok(not has_table_privilege('authenticated', 'public.agent_profiles', 'references'), 'Agent references is denied');
select ok(not has_table_privilege('authenticated', 'public.relation_edges', 'insert'), 'Step B Edge insert is denied');
select ok(not has_table_privilege('authenticated', 'public.relation_edges', 'update'), 'Step B Edge update is denied');
select ok(not has_table_privilege('authenticated', 'public.relation_edges', 'delete'), 'Step B Edge delete is denied');
select ok(not has_table_privilege('authenticated', 'public.relation_edges', 'truncate'), 'Step B Edge truncate is denied');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-00000000a301', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase3-agent-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000b301', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase3-agent-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a301', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select throws_ok($$ select * from public.generate_agent_snapshot_phase3(null, '00000000-0000-4000-8000-000000000001', false) $$, 'P0001', 'agent_snapshot_invalid', 'writer rejects an empty Seed selector');
select throws_ok($$ select * from public.generate_agent_snapshot_phase3('00000000-0000-4000-8000-000000000099', '00000000-0000-4000-8000-000000000002', false) $$, 'P0001', 'seed_not_found', 'foreign or missing Seed is not disclosed');

select * from public.submit_seed_context_phase2(
  '00000000-0000-4000-8000-000000000101',
  '{"trackType":"crossroad","timeWindow":"90_days","questionText":"Should I accept the role?","situationSummary":"A manager and recruiter need an answer this week.","recentEvents":"An answer is needed this week.","keyPeopleText":"Manager and recruiter.","decisionOptions":"Accept or negotiate.","worries":"Timing is uncertain.","forbiddenActions":"Do not burn bridges.","safetyBoundaries":"Keep communication professional.","desiredOutput":"Compare stated options.","privacyAck":true,"privacySafetyAck":true}'::jsonb
);
select * from public.extract_key_people_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000101'), '00000000-0000-4000-8000-000000000102');
select * from public.mutate_key_people_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000101'), '00000000-0000-4000-8000-000000000103', jsonb_build_array(jsonb_build_object('type', 'confirm', 'person_id', (select id::text from public.key_people where seed_context_id = (select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000101') order by id limit 1))));

select lives_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000101'), '00000000-0000-4000-8000-000000000104', true) $$, 'safe submitted Seed generates an Agent snapshot');
select is((select count(*) from public.agent_profile_snapshots), 1::bigint, 'safe generation writes one snapshot parent');
select is((select count(*) from public.agent_profiles where agent_type = 'user_core'), 1::bigint, 'safe generation writes exactly one user core');
select ok((select count(*) from public.agent_profiles where agent_type = 'user_variant') between 0 and 2, 'safe generation writes at most two variants');
select is((select count(*) from public.agent_profiles where agent_type = 'npc'), (select count(*) from public.key_people where status = 'confirmed'), 'every confirmed person becomes exactly one NPC');
select is((select count(*) from public.relation_edges), 0::bigint, 'Step B never writes Edges');
select ok((select bool_and(snapshot_id is not null and field_sources <> '{}'::jsonb and jsonb_array_length(evidence_refs) > 0) from public.agent_profiles), 'every Agent retains snapshot, provenance, and evidence');
select ok((select count(*) from public.agent_profiles a join public.agent_profile_snapshots s on (a.snapshot_id, a.user_id, a.seed_context_id) = (s.id, s.user_id, s.seed_context_id)), 'composite ownership FK holds for every Agent');

select lives_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000101'), '00000000-0000-4000-8000-000000000104', true) $$, 'same key and content replays');
select is((select count(*) from public.agent_profile_snapshots), 1::bigint, 'same-key replay writes no duplicate snapshot');
select is((select count(*) from public.agent_snapshot_idempotency_receipts), 1::bigint, 'same-key replay writes no duplicate receipt');
select throws_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000101'), '00000000-0000-4000-8000-000000000104', false) $$, 'P0001', 'idempotency_key_content_conflict', 'same key with a different include option conflicts');

reset role;
insert into public.seed_contexts (user_id, user_question, raw_context, status) values ('00000000-0000-0000-0000-00000000a301', 'draft only', 'draft only', 'draft');
set local role authenticated;
select throws_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where user_question = 'draft only'), '00000000-0000-4000-8000-000000000105', false) $$, 'P0001', 'seed_not_found', 'draft and unsubmitted Seed is rejected');
select is((select count(*) from public.agent_profile_snapshots), 1::bigint, 'draft failure is zero-write');

reset role;
insert into public.seed_contexts (user_id, user_question, raw_context, safety_flags, status, simulation_track, scenario_type, time_horizon, tick_granularity, submission_key, payload_hash, trace_id, submitted_at, frozen_at) values ('00000000-0000-0000-0000-00000000a301', 'blocked', U&'\81ea\6740\5ff5', '[]'::jsonb, 'submitted', 'crossroad', 'career_decision', '30_days', 'weekly', '00000000-0000-4000-8000-000000000106', repeat('a',64), 'trace', now(), now());
set local role authenticated;
select throws_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000106'), '00000000-0000-4000-8000-000000000107', false) $$, 'P0001', 'safety_blocked', 'English and Unicode high-risk safety derives blocked state');
select is((select count(*) from public.agent_profile_snapshots where safety_level = 'blocked'), 0::bigint, 'blocked state writes zero Agent snapshots');
select is((select count(*) from public.relation_edges), 0::bigint, 'blocked state writes zero Edges');

select * from finish();
rollback;
