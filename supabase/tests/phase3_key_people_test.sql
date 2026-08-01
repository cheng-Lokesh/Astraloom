begin;

create extension if not exists pgtap with schema extensions;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase3-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase3-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

select plan(44);

select has_function('public', 'extract_key_people_phase3', array['uuid', 'uuid'], 'controlled extract RPC exists');
select hasnt_function('public', 'extract_key_people_phase3', array['uuid', 'uuid', 'jsonb'], 'caller-controlled extract RPC is removed');
select has_function('public', 'mutate_key_people_phase3', array['uuid', 'uuid', 'jsonb'], 'mutation RPC exists');
select ok(not (select prosecdef from pg_proc where oid = to_regprocedure('public.extract_key_people_phase3(uuid,uuid)')), 'extract RPC is SECURITY INVOKER');
select ok(not (select prosecdef from pg_proc where oid = 'public.mutate_key_people_phase3(uuid,uuid,jsonb)'::regprocedure), 'mutation RPC is SECURITY INVOKER');
select is((select proconfig::text from pg_proc where oid = to_regprocedure('public.extract_key_people_phase3(uuid,uuid)')), '{"search_path=public, extensions"}', 'extract RPC has fixed search path');
select is((select proconfig::text from pg_proc where oid = 'public.mutate_key_people_phase3(uuid,uuid,jsonb)'::regprocedure), '{"search_path=public, extensions"}', 'mutation RPC has fixed search path');
select function_privs_are('public', 'extract_key_people_phase3', array['uuid', 'uuid'], 'authenticated', array['EXECUTE'], 'only authenticated can execute controlled extraction');
select ok(not has_table_privilege('anon', 'public.key_people', 'select'), 'anon cannot read people');
select ok(not has_table_privilege('authenticated', 'public.agent_profiles', 'insert'), 'Agent DML remains denied');
select ok(not has_table_privilege('authenticated', 'public.relation_edges', 'update'), 'Edge DML remains denied');
select has_index('public', 'key_people', 'key_people_owner_seed_idempotency_idx', 'owner-seed idempotency index exists');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000c001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select * from public.submit_seed_context_phase2(
  '33333333-3333-4333-8333-333333333333',
  '{"trackType":"crossroad","timeWindow":"90_days","questionText":"Should I accept the role?","situationSummary":"My manager, the same manager, and a recruiter need an answer this week.","recentEvents":"An answer is needed this week.","keyPeopleText":"Manager and recruiter.","decisionOptions":"Accept or negotiate.","worries":"Timing is uncertain.","forbiddenActions":"Do not burn bridges.","safetyBoundaries":"Keep communication professional.","desiredOutput":"Compare pressure points.","privacyAck":true,"privacySafetyAck":true}'::jsonb
);

select throws_ok(
  $$
    insert into public.key_people (user_id, seed_context_id, display_name)
    values (auth.uid(), (select id from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'), 'Direct REST attempt')
  $$,
  '42501',
  'new row violates row-level security policy for table "key_people"',
  'direct key_people REST writes are denied outside the RPC guard'
);

select throws_ok($$
  select * from public.extract_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'),
    '43434343-4343-4343-8343-434343434343',
    '[{"display_name":"Attacker supplied individual","relationship_to_user":"fabricated relation","role_type":"fabricated role","confidence":99,"known_evidence":[],"missing_fields":[],"source":"seed_context_text"}]'::jsonb
  )
$$, 'caller-controlled candidate injection signature is unavailable');
select is((select count(*) from public.key_people), 0::bigint, 'failed candidate injection writes zero people');

select lives_ok($$
  select * from public.extract_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'),
    '44444444-4444-4444-8444-444444444444'
  )
$$, 'submitted owner can persist deterministic candidate extraction');

select is((select count(*) from public.key_people), 2::bigint, 'repeated role mentions produce one manager and one recruiter');
select is((select count(distinct extraction_fingerprint) from public.key_people), 2::bigint, 'canonical extraction fingerprints are unique');
select is((select cardinality(person_ids) from public.key_people_idempotency_receipts where operation_kind = 'extract'), 2, 'receipt contains one UUID per unique person');
select ok((select bool_and(status in ('candidate', 'needs_confirmation')) from public.key_people), 'candidates remain provisional');
select ok((select version = 'phase3-key-person-v1' and trace_id is not null and field_sources ? 'display_name' from public.key_people limit 1), 'formal provenance is persisted');

select lives_ok($$
  select * from public.extract_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'),
    '44444444-4444-4444-8444-444444444444'
  )
$$, 'same key and canonical content replays');
select is((select count(*) from public.key_people), 2::bigint, 'replay creates no duplicate');
select is((select count(*) from public.key_people_idempotency_receipts where operation_kind = 'extract'), 1::bigint, 'replay creates no duplicate receipt');

select lives_ok($$
  select * from public.mutate_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'),
    '55555555-5555-4555-8555-555555555555',
    jsonb_build_array(jsonb_build_object('type', 'confirm', 'person_id', (select id::text from public.key_people limit 1)))
  )
$$, 'candidate can be confirmed');
select is((select status::text from public.key_people limit 1), 'confirmed', 'low confidence is not silently confirmed but explicit confirmation succeeds');

select lives_ok($$
  select * from public.mutate_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'),
    '56565656-5656-4565-8565-565656565656',
    jsonb_build_array(jsonb_build_object('type', 'rename', 'person_id', (select id::text from public.key_people limit 1), 'display_name', 'Primary Manager'))
  )
$$, 'confirmed person can be renamed');
select is((select display_name from public.key_people limit 1), 'Primary Manager', 'rename persists inside the owner Seed');
select throws_ok($$
  select * from public.mutate_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'),
    '57575757-5757-4575-8575-575757575757',
    jsonb_build_array(jsonb_build_object('type', 'confirm', 'person_id', (select id::text from public.key_people limit 1)))
  )
$$, 'P0001', 'invalid_people_transition', 'illegal confirmed-to-confirmed transition is rejected');
select throws_ok($$
  select * from public.mutate_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'),
    '58585858-5858-4585-8585-585858585858',
    '[{"type":"supplement","display_name":"Orphan","relationship_to_user":"advisor","role_type":"support"},{"type":"delete","person_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}]'::jsonb
  )
$$, 'P0001', 'key_people_invalid', 'a failing batch rolls back every prior operation');
select is((select count(*) from public.key_people where display_name = 'Orphan'), 0::bigint, 'failed batch leaves zero orphan rows');

select lives_ok($$
  select * from public.mutate_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'),
    '66666666-6666-4666-8666-666666666666',
    '[{"type":"supplement","display_name":"Sponsor","relationship_to_user":"advisor","role_type":"support","note":"User-supplied fact"}]'::jsonb
  )
$$, 'supplement creates a confirmed user-provided person');
select lives_ok($$
  select * from public.mutate_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'),
    '67676767-6767-4676-8676-676767676767',
    '[{"type":"supplement","display_name":"Temporary","relationship_to_user":"advisor","role_type":"support"}]'::jsonb
  )
$$, 'a second supplement supports delete coverage');
select lives_ok($$
  select * from public.mutate_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'),
    '68686868-6868-4686-8686-686868686868',
    jsonb_build_array(jsonb_build_object('type', 'delete', 'person_id', (select id::text from public.key_people where display_name = 'Temporary')))
  )
$$, 'candidate management can delete a supplemental person');
select is((select status::text from public.key_people where display_name = 'Temporary'), 'deleted', 'delete is a persisted legal transition');
select lives_ok($$
  select * from public.mutate_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'),
    '77777777-7777-4777-8777-777777777777',
    jsonb_build_array(jsonb_build_object('type', 'merge', 'source_person_id', (select id::text from public.key_people where display_name = 'Sponsor'), 'target_person_id', (select id::text from public.key_people where display_name = 'Primary Manager')))
  )
$$, 'same-seed merge succeeds');
select ok((select status = 'merged' and merged_into_id is not null from public.key_people where display_name = 'Sponsor'), 'merge preserves canonical reference');
select ok((select evidence_refs @> '["user_supplement"]'::jsonb from public.key_people where display_name = 'Primary Manager'), 'merge unions evidence references');

select * from public.submit_seed_context_phase2(
  '89898989-8989-4898-8898-898989898989',
  '{"trackType":"crossroad","timeWindow":"30_days","questionText":"Should I stay?","situationSummary":"Another concrete workplace decision with a deadline.","recentEvents":"An answer is needed this week.","keyPeopleText":"A manager.","decisionOptions":"Stay or leave.","worries":"Timing is uncertain.","forbiddenActions":"Do not burn bridges.","safetyBoundaries":"Keep communication professional.","desiredOutput":"Compare pressure points.","privacyAck":true,"privacySafetyAck":true}'::jsonb
);
select throws_ok($$
  select * from public.extract_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '89898989-8989-4898-8898-898989898989'),
    '44444444-4444-4444-8444-444444444444'
  )
$$, 'P0001', 'idempotency_key_content_conflict', 'same extraction key cannot be reused for another Seed');
select throws_ok($$
  select * from public.mutate_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '89898989-8989-4898-8898-898989898989'),
    '78787878-7878-4787-8787-787878787878',
    jsonb_build_array(jsonb_build_object('type', 'delete', 'person_id', (select id::text from public.key_people where display_name = 'Primary Manager')))
  )
$$, 'P0001', 'key_people_invalid', 'same-owner cross-Seed person references are rejected');

reset role;
insert into public.seed_contexts (user_id, user_question, raw_context, status)
values ('00000000-0000-0000-0000-00000000c001', 'Draft only', 'Not submitted', 'draft');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000c001', true);
select throws_ok($$
  select * from public.extract_key_people_phase3(
    (select id from public.seed_contexts where user_question = 'Draft only'),
    '79797979-7979-4797-8797-797979797979'
  )
$$, 'P0001', 'seed_not_found', 'unsubmitted Seeds cannot enter Key People persistence');

select set_config('test.phase3_foreign_seed', (select id::text from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'), true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000d001', true);
select is((select count(*) from public.key_people), 0::bigint, 'second user cannot read first user people through RLS');
select throws_ok($$
  select * from public.mutate_key_people_phase3(
    current_setting('test.phase3_foreign_seed')::uuid,
    '88888888-8888-4888-8888-888888888888',
    '[{"type":"delete","person_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}]'::jsonb
  )
$$, 'P0001', 'seed_not_found', 'foreign seed is indistinguishable from missing');

reset role;
select * from finish();
rollback;
