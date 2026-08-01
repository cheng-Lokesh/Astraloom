begin;

create extension if not exists pgtap with schema extensions;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase3-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase3-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

select plan(28);

select has_function('public', 'extract_key_people_phase3', array['uuid', 'uuid', 'jsonb'], 'extract RPC exists');
select has_function('public', 'mutate_key_people_phase3', array['uuid', 'uuid', 'jsonb'], 'mutation RPC exists');
select ok(not (select prosecdef from pg_proc where oid = 'public.extract_key_people_phase3(uuid,uuid,jsonb)'::regprocedure), 'extract RPC is SECURITY INVOKER');
select ok(not (select prosecdef from pg_proc where oid = 'public.mutate_key_people_phase3(uuid,uuid,jsonb)'::regprocedure), 'mutation RPC is SECURITY INVOKER');
select is((select proconfig::text from pg_proc where oid = 'public.extract_key_people_phase3(uuid,uuid,jsonb)'::regprocedure), '{search_path=public, extensions}', 'extract RPC has fixed search path');
select is((select proconfig::text from pg_proc where oid = 'public.mutate_key_people_phase3(uuid,uuid,jsonb)'::regprocedure), '{search_path=public, extensions}', 'mutation RPC has fixed search path');
select ok(not has_table_privilege('anon', 'public.key_people', 'select'), 'anon cannot read people');
select ok(not has_table_privilege('authenticated', 'public.key_people', 'insert'), 'browser role has no direct people insert');
select ok(not has_table_privilege('authenticated', 'public.key_people', 'update'), 'browser role has no direct people update');
select ok(not has_table_privilege('authenticated', 'public.key_people', 'delete'), 'browser role has no direct people delete');
select ok(not has_table_privilege('authenticated', 'public.agent_profiles', 'insert'), 'Agent DML remains denied');
select ok(not has_table_privilege('authenticated', 'public.relation_edges', 'update'), 'Edge DML remains denied');
select has_index('public', 'key_people', 'key_people_owner_seed_idempotency_idx', 'owner-seed idempotency index exists');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000c001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select * from public.submit_seed_context_phase2(
  '33333333-3333-4333-8333-333333333333',
  '{"trackType":"crossroad","timeWindow":"90_days","questionText":"Should I accept the role?","situationSummary":"A concrete workplace decision with a deadline.","recentEvents":"An answer is needed this week.","keyPeopleText":"Manager and recruiter.","decisionOptions":"Accept or negotiate.","worries":"Timing is uncertain.","forbiddenActions":"Do not burn bridges.","safetyBoundaries":"Keep communication professional.","desiredOutput":"Compare pressure points.","privacyAck":true,"privacySafetyAck":true}'::jsonb
);

select lives_ok($$
  select * from public.extract_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'),
    '44444444-4444-4444-8444-444444444444',
    '[{"display_name":"Manager","relationship_to_user":"boss","role_type":"authority","confidence":78,"known_evidence":["Named in seed"],"missing_fields":["Recent commitment"],"source":"seed_context_text"}]'::jsonb
  )
$$, 'submitted owner can persist deterministic candidate extraction');

select is((select count(*) from public.key_people), 1::bigint, 'first extraction writes one candidate');
select is((select status::text from public.key_people limit 1), 'candidate', 'candidate remains provisional');
select ok((select version = 'phase3-key-person-v1' and trace_id is not null and field_sources ? 'display_name' from public.key_people limit 1), 'formal provenance is persisted');

select lives_ok($$
  select * from public.extract_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'),
    '44444444-4444-4444-8444-444444444444',
    '[{"display_name":"Manager","relationship_to_user":"boss","role_type":"authority","confidence":78,"known_evidence":["Named in seed"],"missing_fields":["Recent commitment"],"source":"seed_context_text"}]'::jsonb
  )
$$, 'same key and canonical content replays');
select is((select count(*) from public.key_people), 1::bigint, 'replay creates no duplicate');
select throws_ok($$
  select * from public.extract_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'),
    '44444444-4444-4444-8444-444444444444',
    '[{"display_name":"Different","relationship_to_user":"boss","role_type":"authority","confidence":78,"known_evidence":["Named in seed"],"missing_fields":[],"source":"seed_context_text"}]'::jsonb
  )
$$, 'P0001', 'idempotency_key_content_conflict', 'same key with different canonical content conflicts');

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
    '66666666-6666-4666-8666-666666666666',
    '[{"type":"supplement","display_name":"Sponsor","relationship_to_user":"advisor","role_type":"support","note":"User-supplied fact"}]'::jsonb
  )
$$, 'supplement creates a confirmed user-provided person');
select lives_ok($$
  select * from public.mutate_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'),
    '77777777-7777-4777-8777-777777777777',
    jsonb_build_array(jsonb_build_object('type', 'merge', 'source_person_id', (select id::text from public.key_people where display_name = 'Sponsor'), 'target_person_id', (select id::text from public.key_people where display_name = 'Manager')))
  )
$$, 'same-seed merge succeeds');
select ok((select status = 'merged' and merged_into_id is not null from public.key_people where display_name = 'Sponsor'), 'merge preserves canonical reference');
select ok((select evidence_refs @> '["user_supplement"]'::jsonb from public.key_people where display_name = 'Manager'), 'merge unions evidence references');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000d001', true);
select is((select count(*) from public.key_people), 0::bigint, 'second user cannot read first user people through RLS');
select throws_ok($$
  select * from public.mutate_key_people_phase3(
    (select id from public.seed_contexts where submission_key = '33333333-3333-4333-8333-333333333333'),
    '88888888-8888-4888-8888-888888888888',
    '[{"type":"delete","person_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}]'::jsonb
  )
$$, 'P0001', 'seed_not_found', 'foreign seed is indistinguishable from missing');

reset role;
select * from finish();
rollback;
