begin;

create extension if not exists pgtap with schema extensions;
select plan(174);

-- Shape and least-privilege contract. Column checks deliberately prove there
-- is no broad table SELECT grant before proving the safe projection.
select has_table('public', 'agent_profile_snapshots', 'immutable Agent snapshot parent exists');
select has_table('public', 'agent_snapshot_idempotency_receipts', 'Agent receipt ledger exists');
select has_column('public', 'agent_profiles', 'snapshot_id', 'Agent rows bind to a snapshot');
select has_column('public', 'agent_profiles', 'field_sources', 'Agent rows retain field provenance');
select has_column('public', 'agent_profiles', 'request_hash', 'Agent rows bind canonical content');
select has_column('public', 'agent_profiles', 'safety_level', 'Agent rows retain derived safety');
select is((select attnotnull from pg_attribute where attrelid = 'public.agent_profiles'::regclass and attname = 'snapshot_id'), true, 'Agent snapshot binding is required');
select is((select attnotnull from pg_attribute where attrelid = 'public.agent_profiles'::regclass and attname = 'request_hash'), true, 'Agent request hash is required');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.agent_profiles'::regclass and conname = 'agent_profiles_request_hash_length_check' and contype = 'c'), 'Agent request hash length constraint exists');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.agent_profiles'::regclass and conname = 'agent_profiles_safety_level_check' and contype = 'c'), 'Agent safety level constraint exists');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.agent_profiles'::regclass and conname = 'agent_profiles_safety_error_code_check' and contype = 'c'), 'Agent safety error-code constraint exists');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.agent_profile_snapshots'::regclass and conname = 'agent_profile_snapshots_safety_error_code_check' and contype = 'c'), 'snapshot safety/error consistency constraint exists');
select has_type('public', 'agent_profile_type', 'formal Agent enum exists');
select enum_has_labels('public', 'agent_profile_type', array['user_core', 'user_variant', 'npc'], 'formal Agent enum contains only formal Step B roles');
select is((select count(*) from pg_enum where enumtypid = 'public.agent_profile_type'::regtype), 3::bigint, 'formal Agent enum has exactly three writable Step B roles');
select ok(not exists (select 1 from pg_enum where enumtypid = 'public.agent_profile_type'::regtype and enumlabel = 'group'), 'legacy group Agent type is not writable in Step B');
select has_function('public', 'generate_agent_snapshot_phase3', array['uuid', 'uuid', 'boolean'], 'single controlled Agent writer exists');
select is((select count(*) from plpgsql_check_function_tb('public.generate_agent_snapshot_phase3(uuid,uuid,boolean)'::regprocedure)), 0::bigint, 'Agent writer has no plpgsql_check diagnostics');
select ok(not (select prosecdef from pg_proc where oid = to_regprocedure('public.generate_agent_snapshot_phase3(uuid,uuid,boolean)')), 'Agent writer is SECURITY INVOKER');
select is((select proconfig::text from pg_proc where oid = to_regprocedure('public.generate_agent_snapshot_phase3(uuid,uuid,boolean)')), '{"search_path=public, extensions"}', 'Agent writer has fixed search path');
select function_privs_are('public', 'generate_agent_snapshot_phase3', array['uuid', 'uuid', 'boolean'], 'authenticated', array['EXECUTE'], 'only authenticated can execute Agent writer');
select function_privs_are('public', 'generate_agent_snapshot_phase3', array['uuid', 'uuid', 'boolean'], 'anon', array[]::text[], 'anon cannot execute Agent writer');
select ok(not has_table_privilege('authenticated', 'public.agent_profiles', 'select'), 'authenticated has no broad Agent SELECT');
select ok(has_column_privilege('authenticated', 'public.agent_profiles', 'id', 'select'), 'safe Agent id is readable');
select ok(has_column_privilege('authenticated', 'public.agent_profiles', 'user_id', 'select'), 'safe Agent owner is readable for owner-bound reads');
select ok(has_column_privilege('authenticated', 'public.agent_profiles', 'seed_context_id', 'select'), 'safe Agent Seed is readable for Seed-bound reads');
select ok(has_column_privilege('authenticated', 'public.agent_profiles', 'created_at', 'select'), 'safe Agent ordering timestamp is readable');
select ok(has_column_privilege('authenticated', 'public.agent_profiles', 'snapshot_id', 'select'), 'safe Agent snapshot id is readable');
select ok(has_column_privilege('authenticated', 'public.agent_profiles', 'key_person_id', 'select'), 'safe Agent person id is readable');
select ok(has_column_privilege('authenticated', 'public.agent_profiles', 'version', 'select'), 'safe Agent version is readable');
select ok(has_column_privilege('authenticated', 'public.agent_profiles', 'agent_type', 'select'), 'safe Agent type is readable');
select ok(has_column_privilege('authenticated', 'public.agent_profiles', 'display_name', 'select'), 'safe Agent label is readable');
select ok(has_column_privilege('authenticated', 'public.agent_profiles', 'relationship_to_user', 'select'), 'safe Agent relationship is readable');
select ok(has_column_privilege('authenticated', 'public.agent_profiles', 'source', 'select'), 'safe Agent source label is readable');
select ok(has_column_privilege('authenticated', 'public.agent_profiles', 'confidence', 'select'), 'safe Agent confidence is readable');
select ok(has_column_privilege('authenticated', 'public.agent_profiles', 'evidence_refs', 'select'), 'safe Agent evidence references are readable');
select ok(has_column_privilege('authenticated', 'public.agent_profiles', 'safety_level', 'select'), 'safe Agent safety level is readable');
select ok(not has_column_privilege('authenticated', 'public.agent_profiles', 'trace_id', 'select'), 'trace is private');
select ok(not has_column_privilege('authenticated', 'public.agent_profiles', 'writer_version', 'select'), 'writer metadata is private');
select ok(not has_column_privilege('authenticated', 'public.agent_profiles', 'idempotency_key', 'select'), 'idempotency metadata is private');
select ok(not has_column_privilege('authenticated', 'public.agent_profiles', 'request_hash', 'select'), 'content hash is private');
select ok(not has_column_privilege('authenticated', 'public.agent_profiles', 'field_sources', 'select'), 'field provenance is private');
select ok(not has_table_privilege('anon', 'public.agent_profiles', 'select'), 'anon has no Agent table privilege');
select ok(not has_table_privilege('authenticated', 'public.agent_profile_snapshots', 'select'), 'authenticated has no broad snapshot-parent SELECT');
select ok(not has_table_privilege('authenticated', 'public.agent_snapshot_idempotency_receipts', 'select'), 'authenticated has no broad Agent receipt SELECT');
select ok(not has_table_privilege('authenticated', 'public.agent_profiles', 'select'), 'authenticated has no broad Agent profile SELECT');
select ok(has_column_privilege('authenticated', 'public.agent_profile_snapshots', 'id', 'select'), 'safe snapshot id is readable');
select ok(has_column_privilege('authenticated', 'public.agent_profile_snapshots', 'user_id', 'select'), 'safe snapshot owner is readable');
select ok(has_column_privilege('authenticated', 'public.agent_profile_snapshots', 'seed_context_id', 'select'), 'safe snapshot Seed is readable');
select ok(has_column_privilege('authenticated', 'public.agent_profile_snapshots', 'created_at', 'select'), 'safe snapshot creation time is readable');
select ok(has_column_privilege('authenticated', 'public.agent_profile_snapshots', 'version', 'select'), 'safe snapshot version is readable');
select ok(has_column_privilege('authenticated', 'public.agent_profile_snapshots', 'safety_level', 'select'), 'safe snapshot safety level is readable');
select ok(has_column_privilege('authenticated', 'public.agent_profile_snapshots', 'error_code', 'select'), 'safe snapshot error code is readable');
select ok(not has_column_privilege('authenticated', 'public.agent_profile_snapshots', 'writer_version', 'select'), 'snapshot writer metadata is private');
select ok(not has_column_privilege('authenticated', 'public.agent_profile_snapshots', 'trace_id', 'select'), 'snapshot trace is private');
select ok(not has_column_privilege('authenticated', 'public.agent_profile_snapshots', 'request_hash', 'select'), 'snapshot request hash is private');
select ok(not has_column_privilege('authenticated', 'public.agent_profile_snapshots', 'idempotency_key', 'select'), 'snapshot idempotency metadata is private');
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
reset role;
select is((select count(*) from public.agent_profile_snapshots), 1::bigint, 'safe generation writes one snapshot parent');
select is((select count(*) from public.agent_profiles where agent_type = 'user_core'), 1::bigint, 'safe generation writes exactly one user core');
select ok((select count(*) from public.agent_profiles where agent_type = 'user_variant') between 0 and 2, 'safe generation writes at most two variants');
select is((select count(*) from public.agent_profiles where agent_type = 'npc'), (select count(*) from public.key_people where status = 'confirmed'), 'every confirmed person becomes exactly one NPC');
select is((select count(*) from public.relation_edges), 0::bigint, 'Step B never writes Edges');
select ok((select bool_and(snapshot_id is not null and field_sources <> '{}'::jsonb and jsonb_array_length(evidence_refs) > 0) from public.agent_profiles), 'every Agent retains snapshot, provenance, and evidence');
select is((select count(*) from public.agent_profiles a join public.agent_profile_snapshots s on (a.snapshot_id, a.user_id, a.seed_context_id) = (s.id, s.user_id, s.seed_context_id)), (select count(*) from public.agent_profiles where snapshot_id is not null), 'composite ownership FK holds for every Agent');
create temporary table phase3_first_replay_identity as
  select snapshot_id, agent_ids from public.agent_snapshot_idempotency_receipts
  where idempotency_key = '00000000-0000-4000-8000-000000000104';
create temporary table phase3_two_user_baseline as select
  (select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000101') as owner_seed_id,
  (select count(*) from public.agent_profile_snapshots)::bigint as snapshots,
  (select count(*) from public.agent_snapshot_idempotency_receipts)::bigint as receipts,
  (select count(*) from public.agent_profiles where snapshot_id is not null)::bigint as agents;

set local role authenticated;
select lives_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000101'), '00000000-0000-4000-8000-000000000104', true) $$, 'same key and content replays');
reset role;
select is((select count(*) from public.agent_profile_snapshots), 1::bigint, 'same-key replay writes no duplicate snapshot');
select is((select count(*) from public.agent_snapshot_idempotency_receipts), 1::bigint, 'same-key replay writes no duplicate receipt');
select is((select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000104'), (select snapshot_id from phase3_first_replay_identity), 'same key and content returns the original snapshot id');
select is((select agent_ids from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000104'), (select agent_ids from phase3_first_replay_identity), 'same key and content returns the original Agent ids');
set local role authenticated;
select is((select idempotent from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000101'), '00000000-0000-4000-8000-000000000104', true)), true, 'same key and canonical content returns idempotent true');
select throws_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000101'), '00000000-0000-4000-8000-000000000104', false) $$, 'P0001', 'idempotency_key_content_conflict', 'same key with a different include option conflicts');

reset role;
insert into public.seed_contexts (user_id, user_question, raw_context, status) values ('00000000-0000-0000-0000-00000000a301', 'draft only', 'draft only', 'draft');
set local role authenticated;
select throws_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where user_question = 'draft only'), '00000000-0000-4000-8000-000000000105', false) $$, 'P0001', 'seed_not_found', 'draft and unsubmitted Seed is rejected');
reset role;
select is((select count(*) from public.agent_profile_snapshots), 1::bigint, 'draft failure is zero-write');

reset role;
insert into public.consent_events (id, user_id, consent_type, status, source, metadata) values
  ('00000000-0000-4000-8000-000000000210', '00000000-0000-0000-0000-00000000a301', 'seed_context_submission', 'active', 'track_a_confirm', jsonb_build_object('payload_hash', repeat('a',64), 'submission_key', '00000000-0000-4000-8000-000000000106'));
insert into public.seed_contexts (user_id, consent_event_id, user_question, raw_context, safety_flags, status, simulation_track, scenario_type, time_horizon, tick_granularity, submission_key, payload_hash, trace_id, submitted_at, frozen_at) values ('00000000-0000-0000-0000-00000000a301', '00000000-0000-4000-8000-000000000210', 'blocked', U&'\81ea\6740\5ff5', '[]'::jsonb, 'submitted', 'crossroad', 'career_decision', '30_days', 'weekly', '00000000-0000-4000-8000-000000000106', repeat('a',64), 'trace', now(), now());
set local role authenticated;
select throws_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000106'), '00000000-0000-4000-8000-000000000107', false) $$, 'P0001', 'safety_blocked', 'English and Unicode high-risk safety derives blocked state');
reset role;
select is((select count(*) from public.agent_profile_snapshots where safety_level = 'blocked'), 0::bigint, 'blocked state writes zero Agent snapshots');
select is((select count(*) from public.relation_edges), 0::bigint, 'blocked state writes zero Edges');

-- Fourth RED: two-user isolation, all safety paths, actual privilege denials,
-- and transaction atomicity. Every fixture remains inside this BEGIN/ROLLBACK.
reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select throws_ok($$ select * from public.generate_agent_snapshot_phase3('00000000-0000-4000-8000-000000000099', '00000000-0000-4000-8000-000000000108', false) $$, 'P0001', 'unauthenticated', 'empty auth.uid is rejected before any write');

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a301', true);
select set_config('request.jwt.claim.role', 'anon', true);
set local role anon;
select throws_ok($$ select * from public.generate_agent_snapshot_phase3('00000000-0000-4000-8000-000000000099', '00000000-0000-4000-8000-000000000109', false) $$, '42501', NULL, 'anon cannot execute the Agent writer');

reset role;
select set_config('app.phase3_test_owner_seed_id', (select owner_seed_id::text from phase3_two_user_baseline), true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000b301', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select throws_ok($$ select * from public.generate_agent_snapshot_phase3(current_setting('app.phase3_test_owner_seed_id', true)::uuid, '00000000-0000-4000-8000-000000000110', false) $$, 'P0001', 'seed_not_found', 'user B sees user A submitted Seed as not found');
select throws_ok($$ select * from public.generate_agent_snapshot_phase3('00000000-0000-4000-8000-000000000099', '00000000-0000-4000-8000-000000000130', false) $$, 'P0001', 'seed_not_found', 'user B sees missing Seed with the same error');
reset role;
select is((select count(*) from public.agent_profile_snapshots), (select snapshots from phase3_two_user_baseline), 'foreign Seed request leaves snapshot count unchanged');
select is((select count(*) from public.agent_snapshot_idempotency_receipts), (select receipts from phase3_two_user_baseline), 'foreign Seed request leaves receipt count unchanged');
select is((select count(*) from public.agent_profiles where snapshot_id is not null), (select agents from phase3_two_user_baseline), 'foreign Seed request leaves Agent count unchanged');

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a301', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select * from public.submit_seed_context_phase2(
  '00000000-0000-4000-8000-000000000124',
  '{"trackType":"crossroad","timeWindow":"30_days","questionText":"Compare stated options.","situationSummary":"A decision is pending.","recentEvents":"No new event.","keyPeopleText":"","decisionOptions":"Wait or proceed.","worries":"","forbiddenActions":"Do not burn bridges.","safetyBoundaries":"Keep communication professional.","desiredOutput":"Compare stated options.","privacyAck":true,"privacySafetyAck":true}'::jsonb
);
select lives_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000124'), '00000000-0000-4000-8000-000000000125', false) $$, 'zero-confirmed safe Seed generates only a permitted core snapshot');
reset role;
select is((select safety_level from public.agent_profile_snapshots where id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000125')), 'safe', 'zero-confirmed safe Seed remains safe');
select is((select count(*) from public.agent_profiles where snapshot_id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000125')), 1::bigint, 'zero-confirmed safe snapshot has one core when variants are disabled');
select * from public.submit_seed_context_phase2(
  '00000000-0000-4000-8000-000000000111',
  '{"trackType":"crossroad","timeWindow":"30_days","questionText":"This will definitely happen.","situationSummary":"A decision is pending.","recentEvents":"No new event.","keyPeopleText":"","decisionOptions":"Wait or proceed.","worries":"","forbiddenActions":"Do not burn bridges.","safetyBoundaries":"Keep communication professional.","desiredOutput":"Compare stated options.","privacyAck":true,"privacySafetyAck":true}'::jsonb
);
set local role authenticated;
select lives_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000111'), '00000000-0000-4000-8000-000000000112', false) $$, 'English caution Seed generates a normal snapshot');
reset role;
select is((select safety_level from public.agent_profile_snapshots where id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000112')), 'caution', 'English deterministic-future content derives caution');
select is((select error_code from public.agent_profile_snapshots where id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000112')), null::text, 'English caution has no safety error code');
select is((select count(*) from public.agent_profiles where snapshot_id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000112')), 1::bigint, 'English caution snapshot has normal core cardinality');
select is((select count(*) from public.agent_profiles where key_person_id is not null and snapshot_id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000112')), 0::bigint, 'English caution snapshot has no unconfirmed NPC');

set local role authenticated;
select lives_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000101'), '00000000-0000-4000-8000-000000000113', true) $$, 'safe snapshot can include bounded variants');
reset role;
select is((select count(*) from public.agent_profiles where snapshot_id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000113') and agent_type = 'user_core'), 1::bigint, 'safe snapshot has exactly one core');
select ok((select count(*) from public.agent_profiles where snapshot_id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000113') and agent_type = 'user_variant') between 0 and 2, 'safe snapshot has zero to two variants');
select is((select count(*) from public.agent_profiles where snapshot_id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000113') and agent_type = 'npc'), (select count(*) from public.key_people where seed_context_id = (select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000101') and status = 'confirmed'), 'each confirmed person is exactly one NPC');
select is((select count(*) from public.agent_profiles a join public.key_people p on p.id = a.key_person_id where a.snapshot_id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000113') and p.status <> 'confirmed'), 0::bigint, 'unconfirmed people never become NPCs');
select is((select count(*) from public.agent_profiles a join public.key_people p on p.id = a.key_person_id where a.snapshot_id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000113') and p.seed_context_id <> a.seed_context_id), 0::bigint, 'cross-Seed people never become NPCs');
select is((select count(*) from (select key_person_id from public.agent_profiles where snapshot_id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000113') and agent_type = 'npc' group by key_person_id having count(*) <> 1) duplicate_or_missing_npcs), 0::bigint, 'each NPC Key Person id occurs exactly once');
select is((select count(*) from ((select key_person_id from public.agent_profiles where snapshot_id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000113') and agent_type = 'npc') except (select id from public.key_people where seed_context_id = (select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000101') and status = 'confirmed')) unexpected_npcs), 0::bigint, 'NPC key-person ids are all confirmed ids');
select is((select count(*) from ((select id from public.key_people where seed_context_id = (select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000101') and status = 'confirmed') except (select key_person_id from public.agent_profiles where snapshot_id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000113') and agent_type = 'npc')) missing_npcs), 0::bigint, 'every confirmed Key Person id becomes an NPC');

reset role;
insert into public.consent_events (id, user_id, consent_type, status, source, metadata) values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-0000-0000-00000000a301', 'seed_context_submission', 'active', 'track_a_confirm', jsonb_build_object('payload_hash', repeat('b',64), 'submission_key', '00000000-0000-4000-8000-000000000114')),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-0000-0000-00000000a301', 'seed_context_submission', 'active', 'track_a_confirm', jsonb_build_object('payload_hash', repeat('c',64), 'submission_key', '00000000-0000-4000-8000-000000000115')),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-0000-0000-00000000a301', 'seed_context_submission', 'active', 'track_a_confirm', jsonb_build_object('payload_hash', repeat('d',64), 'submission_key', '00000000-0000-4000-8000-000000000116')),
  ('00000000-0000-4000-8000-000000000204', '00000000-0000-0000-0000-00000000a301', 'seed_context_submission', 'active', 'track_a_confirm', jsonb_build_object('payload_hash', repeat('e',64), 'submission_key', '00000000-0000-4000-8000-000000000117')),
  ('00000000-0000-4000-8000-000000000205', '00000000-0000-0000-0000-00000000a301', 'seed_context_submission', 'active', 'track_a_confirm', jsonb_build_object('payload_hash', repeat('g',64), 'submission_key', '00000000-0000-4000-8000-000000000131')),
  ('00000000-0000-4000-8000-000000000206', '00000000-0000-0000-0000-00000000a301', 'seed_context_submission', 'active', 'track_a_confirm', jsonb_build_object('payload_hash', repeat('h',64), 'submission_key', '00000000-0000-4000-8000-000000000132')),
  ('00000000-0000-4000-8000-000000000207', '00000000-0000-0000-0000-00000000a301', 'seed_context_submission', 'active', 'track_a_confirm', jsonb_build_object('payload_hash', repeat('i',64), 'submission_key', '00000000-0000-4000-8000-000000000133')),
  ('00000000-0000-4000-8000-000000000208', '00000000-0000-0000-0000-00000000a301', 'seed_context_submission', 'active', 'track_a_confirm', jsonb_build_object('payload_hash', repeat('j',64), 'submission_key', '00000000-0000-4000-8000-000000000134')),
  ('00000000-0000-4000-8000-000000000209', '00000000-0000-0000-0000-00000000a301', 'seed_context_submission', 'active', 'track_a_confirm', jsonb_build_object('payload_hash', repeat('k',64), 'submission_key', '00000000-0000-4000-8000-000000000135'));

insert into public.seed_contexts (user_id, consent_event_id, user_question, raw_context, safety_flags, status, simulation_track, scenario_type, time_horizon, tick_granularity, submission_key, payload_hash, trace_id, submitted_at, frozen_at) values
  ('00000000-0000-0000-0000-00000000a301', '00000000-0000-4000-8000-000000000201', 'Medical decision', 'medical treatment question', '[]'::jsonb, 'submitted', 'crossroad', 'career_decision', '30_days', 'weekly', '00000000-0000-4000-8000-000000000114', repeat('b',64), 'trace', now(), now()),
  ('00000000-0000-0000-0000-00000000a301', '00000000-0000-4000-8000-000000000202', U&'\533b\7597\51b3\7b56', U&'\533b\7597\7597\6cbb\95ee\9898', '[]'::jsonb, 'submitted', 'crossroad', 'career_decision', '30_days', 'weekly', '00000000-0000-4000-8000-000000000115', repeat('c',64), 'trace', now(), now()),
  ('00000000-0000-0000-0000-00000000a301', '00000000-0000-4000-8000-000000000203', 'I may commit suicide', 'self-harm', '[]'::jsonb, 'submitted', 'crossroad', 'career_decision', '30_days', 'weekly', '00000000-0000-4000-8000-000000000116', repeat('d',64), 'trace', now(), now()),
  ('00000000-0000-0000-0000-00000000a301', '00000000-0000-4000-8000-000000000204', U&'\6211\60f3\81ea\6740', U&'\9700\8981\5e2e\52a9', '[]'::jsonb, 'submitted', 'crossroad', 'career_decision', '30_days', 'weekly', '00000000-0000-4000-8000-000000000117', repeat('e',64), 'trace', now(), now()),
  ('00000000-0000-0000-0000-00000000a301', '00000000-0000-4000-8000-000000000205', 'Minor safety concern', 'minor safety', '[]'::jsonb, 'submitted', 'crossroad', 'career_decision', '30_days', 'weekly', '00000000-0000-4000-8000-000000000131', repeat('g',64), 'trace', now(), now()),
  ('00000000-0000-0000-0000-00000000a301', '00000000-0000-4000-8000-000000000206', U&'\672a\6210\5e74\4eba\5b89\5168', U&'\672a\6210\5e74\4eba\5b89\5168', '[]'::jsonb, 'submitted', 'crossroad', 'career_decision', '30_days', 'weekly', '00000000-0000-4000-8000-000000000132', repeat('h',64), 'trace', now(), now()),
  ('00000000-0000-0000-0000-00000000a301', '00000000-0000-4000-8000-000000000207', 'Stalking and surveillance', 'stalking surveillance', '[]'::jsonb, 'submitted', 'crossroad', 'career_decision', '30_days', 'weekly', '00000000-0000-4000-8000-000000000133', repeat('i',64), 'trace', now(), now()),
  ('00000000-0000-0000-0000-00000000a301', '00000000-0000-4000-8000-000000000208', U&'\76d1\63a7\4f34\4fa3', U&'\76d1\63a7\4f34\4fa3', '[]'::jsonb, 'submitted', 'crossroad', 'career_decision', '30_days', 'weekly', '00000000-0000-4000-8000-000000000134', repeat('j',64), 'trace', now(), now()),
  ('00000000-0000-0000-0000-00000000a301', '00000000-0000-4000-8000-000000000209', 'Tell me what they really think', 'third party mind reading', '[]'::jsonb, 'submitted', 'crossroad', 'career_decision', '30_days', 'weekly', '00000000-0000-4000-8000-000000000135', repeat('k',64), 'trace', now(), now());
set local role authenticated;
select lives_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000114'), '00000000-0000-4000-8000-000000000118', true) $$, 'English downgraded Seed returns a conservative snapshot');
select lives_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000115'), '00000000-0000-4000-8000-000000000119', true) $$, 'Chinese downgraded Seed returns a conservative snapshot');
reset role;
select is((select count(*) from public.agent_profiles where snapshot_id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000118')), 1::bigint, 'English downgraded snapshot has exactly one core');
select is((select count(*) from public.agent_profiles where snapshot_id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000119')), 1::bigint, 'Chinese downgraded snapshot has exactly one core');
select is((select count(*) from public.agent_profiles where snapshot_id in (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key in ('00000000-0000-4000-8000-000000000118','00000000-0000-4000-8000-000000000119')) and agent_type in ('user_variant','npc')), 0::bigint, 'downgraded snapshots have no variants or NPCs');
select is((select count(*) from public.relation_edges), 0::bigint, 'downgraded snapshots write no Edges');
select is((select count(*) from public.agent_profile_snapshots where id in (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key in ('00000000-0000-4000-8000-000000000118','00000000-0000-4000-8000-000000000119')) and safety_level = 'downgraded' and error_code = 'safety_downgraded'), 2::bigint, 'downgraded safety result and error code are stable');
set local role authenticated;
select throws_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000116'), '00000000-0000-4000-8000-000000000120', false) $$, 'P0001', 'safety_blocked', 'English blocked Seed writes nothing');
select throws_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000117'), '00000000-0000-4000-8000-000000000121', false) $$, 'P0001', 'safety_blocked', 'Chinese blocked Seed writes nothing');
select throws_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000131'), '00000000-0000-4000-8000-000000000136', false) $$, 'P0001', 'safety_blocked', 'English minor-safety Seed writes nothing');
select throws_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000132'), '00000000-0000-4000-8000-000000000137', false) $$, 'P0001', 'safety_blocked', 'Chinese minor-safety Seed writes nothing');
select lives_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000133'), '00000000-0000-4000-8000-000000000138', false) $$, 'English stalking Seed is downgraded, not blocked');
select lives_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000134'), '00000000-0000-4000-8000-000000000139', false) $$, 'Chinese partner-monitoring Seed is downgraded, not blocked');
select lives_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000135'), '00000000-0000-4000-8000-000000000140', false) $$, 'third-party mind-reading Seed is downgraded, not blocked');
reset role;
select is((select count(*) from public.agent_profile_snapshots where id in (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key in ('00000000-0000-4000-8000-000000000138','00000000-0000-4000-8000-000000000139','00000000-0000-4000-8000-000000000140')) and safety_level = 'downgraded' and error_code = 'safety_downgraded'), 3::bigint, 'required downgraded safety families persist the stable conservative result');
select is((select count(*) from public.agent_profile_snapshots where safety_level = 'blocked'), 0::bigint, 'blocked Seeds have no snapshot parent');
select is((select count(*) from public.agent_snapshot_idempotency_receipts where idempotency_key in ('00000000-0000-4000-8000-000000000120','00000000-0000-4000-8000-000000000121')), 0::bigint, 'blocked Seeds have no receipt');
set local role authenticated;
select lives_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000111'), '00000000-0000-4000-8000-000000000122', false) $$, 'English caution text is not blocked');
reset role;
insert into public.consent_events (id, user_id, consent_type, status, source, metadata) values
  ('00000000-0000-4000-8000-000000000211', '00000000-0000-0000-0000-00000000a301', 'seed_context_submission', 'active', 'track_a_confirm', jsonb_build_object('payload_hash', repeat('f',64), 'submission_key', '00000000-0000-4000-8000-000000000126'));
insert into public.seed_contexts (user_id, consent_event_id, user_question, raw_context, safety_flags, status, simulation_track, scenario_type, time_horizon, tick_granularity, submission_key, payload_hash, trace_id, submitted_at, frozen_at)
values ('00000000-0000-0000-0000-00000000a301', '00000000-0000-4000-8000-000000000211', U&'\4e00\5b9a\4f1a\53d1\751f', U&'\8fd9\4e00\5b9a\4f1a\53d1\751f', '[]'::jsonb, 'submitted', 'crossroad', 'career_decision', '30_days', 'weekly', '00000000-0000-4000-8000-000000000126', repeat('f',64), 'trace', now(), now());
set local role authenticated;
select lives_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000126'), '00000000-0000-4000-8000-000000000127', false) $$, 'Chinese caution Seed generates a normal snapshot');
reset role;
select is((select safety_level from public.agent_profile_snapshots where id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000127')), 'caution', 'Chinese deterministic-future content derives caution');
select is((select error_code from public.agent_profile_snapshots where id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000127')), null::text, 'Chinese caution has no safety error code');
select is((select count(*) from public.agent_profiles where snapshot_id = (select snapshot_id from public.agent_snapshot_idempotency_receipts where idempotency_key = '00000000-0000-4000-8000-000000000127')), 1::bigint, 'Chinese caution snapshot has normal core cardinality');

set local role authenticated;
select throws_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000111'), '00000000-0000-4000-8000-000000000104', false) $$, 'P0001', 'idempotency_key_content_conflict', 'same key on a different Seed conflicts');
select lives_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000124'), '00000000-0000-4000-8000-000000000128', false); select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000124'), '00000000-0000-4000-8000-000000000129', false) $$, 'same Seed different keys repeat the controlled lock order without deadlock');
reset role;
select is(position(':phase3-key-people:' in coalesce(pg_get_functiondef(to_regprocedure('public.generate_agent_snapshot_phase3(uuid,uuid,boolean)')), '')) > 0, true, 'Agent writer uses the shared owner/Seed advisory-lock key');
select ok(position(':phase3-key-people:' in coalesce(pg_get_functiondef(to_regprocedure('public.generate_agent_snapshot_phase3(uuid,uuid,boolean)')), '')) < position(':agent:' in coalesce(pg_get_functiondef(to_regprocedure('public.generate_agent_snapshot_phase3(uuid,uuid,boolean)')), '')), 'Agent writer acquires the shared Seed lock before its idempotency lock');
select is(position(':phase3-key-people:' in coalesce(pg_get_functiondef(to_regprocedure('public.extract_key_people_phase3(uuid,uuid)')), '')) > 0, true, 'Step A uses the same shared owner/Seed advisory-lock literal');

reset role;
create table public.phase3_edge_references_probe (id uuid);
grant create on schema public to authenticated;
alter table public.phase3_edge_references_probe owner to authenticated;
revoke create on schema public from authenticated;
select ok(not has_schema_privilege('authenticated', 'public', 'create') and not has_table_privilege('authenticated', 'public.relation_edges', 'references'), 'schema CREATE and Edge REFERENCES privileges are absent before the Edge privilege check');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a301', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select throws_ok($$ insert into public.agent_profiles (user_id, seed_context_id, agent_type, display_name) values (auth.uid(), (select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000101'), 'npc', 'forbidden') $$, '42501', NULL, 'direct Agent INSERT fails');
select throws_ok($$ update public.agent_profiles set display_name = 'forbidden' where false $$, '42501', NULL, 'direct Agent UPDATE fails');
select throws_ok($$ delete from public.agent_profiles where false $$, '42501', NULL, 'direct Agent DELETE fails');
select throws_ok($$ truncate public.agent_profiles $$, '42501', NULL, 'direct Agent TRUNCATE fails');
select throws_ok($$ select * from public.agent_snapshot_idempotency_receipts $$, '42501', NULL, 'direct receipt SELECT fails');
select throws_ok($$ insert into public.agent_snapshot_idempotency_receipts (user_id, seed_context_id, idempotency_key, request_hash, snapshot_id, agent_ids) values (auth.uid(), gen_random_uuid(), gen_random_uuid(), repeat('a',64), gen_random_uuid(), '{}'::uuid[]) $$, '42501', NULL, 'direct receipt INSERT fails');
select throws_ok($$ select trace_id, field_sources, writer_version, idempotency_key, request_hash from public.agent_profiles $$, '42501', NULL, 'Agent private columns are not Data API readable');
select throws_ok($$ insert into public.relation_edges (user_id, from_agent_id, to_agent_id, relationship_type) values (auth.uid(), gen_random_uuid(), gen_random_uuid(), 'forbidden') $$, '42501', NULL, 'Step B Edge INSERT fails');
select throws_ok($$ update public.relation_edges set relationship_type = 'forbidden' where false $$, '42501', NULL, 'Step B Edge UPDATE fails');
select throws_ok($$ delete from public.relation_edges where false $$, '42501', NULL, 'Step B Edge DELETE fails');
select throws_ok($$ truncate public.relation_edges $$, '42501', NULL, 'Step B Edge TRUNCATE fails');
select throws_ok($$ create trigger phase3_illegal_edge_trigger before insert on public.relation_edges for each row execute function public.set_updated_at() $$, '42501', NULL, 'Step B Edge TRIGGER creation fails');
select throws_ok($$ alter table public.phase3_edge_references_probe add constraint phase3_edge_references_probe_agent_fkey foreign key (id) references public.relation_edges(id) $$, '42501', NULL, 'Step B Edge REFERENCES use fails');
select ok(not has_table_privilege('authenticated', 'public.relation_edges', 'trigger'), 'Edge TRIGGER privilege is absent');

reset role;
select ok(exists (select 1 from pg_constraint where conname = 'agent_profiles_snapshot_owner_seed_fkey'), 'Agent composite owner/Seed FK exists');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.agent_snapshot_idempotency_receipts'::regclass and contype = 'f'), 'receipt composite FKs exist');
select is((select count(*) from public.agent_profiles a join public.agent_profile_snapshots s on (a.snapshot_id,a.user_id,a.seed_context_id) = (s.id,s.user_id,s.seed_context_id)), (select count(*) from public.agent_profiles where snapshot_id is not null), 'every snapshot Agent matches its composite parent');
select is((select count(*) from public.agent_snapshot_idempotency_receipts r join public.agent_profile_snapshots s on (r.snapshot_id,r.user_id,r.seed_context_id) = (s.id,s.user_id,s.seed_context_id)), (select count(*) from public.agent_snapshot_idempotency_receipts), 'every receipt matches its composite parent');

create temporary table phase3_agent_counts_before as select
  (select count(*) from public.agent_profile_snapshots)::bigint as snapshots,
  (select count(*) from public.agent_snapshot_idempotency_receipts)::bigint as receipts,
  (select count(*) from public.agent_profiles where snapshot_id is not null)::bigint as agents;
reset role;
alter table public.agent_profiles add constraint phase3_agent_forced_failure check (false) not valid;
set local role authenticated;
select throws_ok($$ select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000111'), '00000000-0000-4000-8000-000000000123', false) $$, NULL, NULL, 'forced Agent constraint failure rolls back writer');
reset role;
select is((select count(*) from public.agent_profile_snapshots), (select snapshots from phase3_agent_counts_before), 'constraint failure leaves snapshot count unchanged');
select is((select count(*) from public.agent_snapshot_idempotency_receipts), (select receipts from phase3_agent_counts_before), 'constraint failure leaves receipt count unchanged');
select is((select count(*) from public.agent_profiles where snapshot_id is not null), (select agents from phase3_agent_counts_before), 'constraint failure leaves Agent count unchanged');
select is((select count(*) from public.relation_edges), 0::bigint, 'atomic failure still leaves Edges at zero');

-- Guard-off receipt reads may name only safe columns but must still be hidden
-- by RLS outside the controlled writer transaction.
set local role authenticated;
select is((select count(*) from (select user_id, seed_context_id, idempotency_key, request_hash, snapshot_id, agent_ids from public.agent_snapshot_idempotency_receipts) guarded_receipts), 0::bigint, 'receipt safe columns return zero rows outside the RPC guard');
reset role;
select is((select count(*) from public.agent_profiles where snapshot_id is not null and not (field_sources ?& array['display_name','relationship_to_user','psychology','motivation','resources','behavior_policy','state','memory','triggers','variant_axis','confidence','evidence_refs'])), 0::bigint, 'every Agent field-source ledger covers every generated field');
select is((select count(*) from public.agent_profiles a cross join lateral jsonb_each_text(a.field_sources) f where snapshot_id is not null and f.value not in ('user_confirmed','chat_inferred','default','model_inferred')), 0::bigint, 'field-source values use only the allowed source types');
select is((select count(*) from public.agent_profiles a cross join lateral jsonb_each_text(a.field_sources) f where snapshot_id is not null and a.agent_type in ('user_core','user_variant') and f.value <> 'default'), 0::bigint, 'core and variant fields remain default rather than fabricated confirmation');
select is((select count(*) from public.agent_profiles a cross join lateral jsonb_each_text(a.field_sources) f where snapshot_id is not null and a.agent_type = 'npc' and ((f.key in ('display_name','relationship_to_user') and f.value <> 'user_confirmed') or (f.key not in ('display_name','relationship_to_user') and f.value <> 'default'))), 0::bigint, 'NPC field sources use confirmation only for confirmed identity fields');
select is((select count(*) from public.agent_profiles a where snapshot_id is not null and a.agent_type = 'npc' and (jsonb_array_length(evidence_refs) = 0 or confidence > 60)), 0::bigint, 'NPC evidence is nonempty and confidence remains conservative');

reset role;
insert into public.consent_events (id, user_id, consent_type, status, source, metadata) values
  ('00000000-0000-4000-8000-000000000212', '00000000-0000-0000-0000-00000000a301', 'seed_context_submission', 'active', 'track_a_confirm', jsonb_build_object('payload_hash', repeat('l',64), 'submission_key', '00000000-0000-4000-8000-000000000141'));
create temporary table phase3_unfrozen_before as select
  (select count(*) from public.agent_profile_snapshots)::bigint as snapshots,
  (select count(*) from public.agent_snapshot_idempotency_receipts)::bigint as receipts,
  (select count(*) from public.agent_profiles where snapshot_id is not null)::bigint as agents;
select throws_ok($$ insert into public.seed_contexts (user_id, consent_event_id, user_question, raw_context, status, simulation_track, scenario_type, time_horizon, tick_granularity, submission_key, payload_hash, trace_id, submitted_at, frozen_at) values ('00000000-0000-0000-0000-00000000a301', '00000000-0000-4000-8000-000000000212', 'submitted but unfrozen', 'submitted but unfrozen', 'submitted', 'crossroad', 'career_decision', '30_days', 'weekly', '00000000-0000-4000-8000-000000000141', repeat('l',64), 'trace', now(), null) $$, '23514', NULL, 'Phase 2 rejects a submitted but unfrozen Seed');
select is((select count(*) from public.agent_profile_snapshots), (select snapshots from phase3_unfrozen_before), 'unfrozen Seed failure leaves snapshot count unchanged');
select is((select count(*) from public.agent_snapshot_idempotency_receipts), (select receipts from phase3_unfrozen_before), 'unfrozen Seed failure leaves receipt count unchanged');
select is((select count(*) from public.agent_profiles where snapshot_id is not null), (select agents from phase3_unfrozen_before), 'unfrozen Seed failure leaves Agent count unchanged');

select * from finish();
rollback;
