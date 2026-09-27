begin;

create extension if not exists pgtap with schema extensions;
select plan(45);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-00000000a771', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reality-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000b771', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reality-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.consent_events (id, user_id, consent_type, status, source)
values
  ('00000000-0000-0000-0000-00000000a772', '00000000-0000-0000-0000-00000000a771', 'seed_context_submission', 'active', 'track_a_confirm'),
  ('00000000-0000-0000-0000-00000000b772', '00000000-0000-0000-0000-00000000b771', 'seed_context_submission', 'active', 'track_a_confirm');

insert into public.seed_contexts (
  id, user_id, version, simulation_track, scenario_type, user_question,
  time_horizon, tick_granularity, status, trace_id, submission_key,
  submitted_at, frozen_at, consent_event_id, payload_hash
) values
  ('00000000-0000-0000-0000-00000000a773', '00000000-0000-0000-0000-00000000a771', 'pgtap-v1', 'crossroad', 'career_decision', 'Should I review the current work situation?', '90_days', 'weekly', 'submitted', 'fixture-a', '00000000-0000-4000-8000-00000000a774', now(), now(), '00000000-0000-0000-0000-00000000a772', repeat('a', 64)),
  ('00000000-0000-0000-0000-00000000b773', '00000000-0000-0000-0000-00000000b771', 'pgtap-v1', 'crossroad', 'career_decision', 'Should I review another work situation?', '90_days', 'weekly', 'submitted', 'fixture-b', '00000000-0000-4000-8000-00000000b774', now(), now(), '00000000-0000-0000-0000-00000000b772', repeat('b', 64)),
  ('00000000-0000-0000-0000-00000000a775', '00000000-0000-0000-0000-00000000a771', 'pgtap-old-v1', 'crossroad', 'career_decision', 'Older Seed for current-chain test', '90_days', 'weekly', 'submitted', 'fixture-a-old', '00000000-0000-4000-8000-00000000a776', now() - interval '1 day', now() - interval '1 day', '00000000-0000-0000-0000-00000000a772', repeat('c', 64));

select has_table('public', 'reality_profiles', 'Reality Profile table exists');
select has_index('public', 'reality_profiles', 'reality_profiles_owner_seed_idx', 'owner and current-seed index exists');
select has_column('public', 'reality_profiles', 'life_goals', 'new Reality Profile dimensions are persisted');
select ok(not has_table_privilege('anon', 'public.reality_profiles', 'select'), 'anon cannot read profiles');
select ok(not has_table_privilege('anon', 'public.reality_profiles', 'insert'), 'anon cannot insert profiles');
select ok(not has_table_privilege('anon', 'public.reality_profiles', 'update,delete'), 'anon cannot update or delete profiles');
select ok(has_column_privilege('authenticated', 'public.reality_profiles', 'life_climate_value', 'select'), 'authenticated can read the profile fields');
select ok(has_column_privilege('authenticated', 'public.reality_profiles', 'revision', 'update'), 'authenticated can update the revision through RLS');
select ok(has_column_privilege('authenticated', 'public.reality_profiles', 'life_goals', 'select'), 'authenticated can read new profile dimensions');
select ok(has_column_privilege('authenticated', 'public.reality_profiles', 'life_goals', 'insert'), 'authenticated can insert new profile dimensions');
select ok(has_column_privilege('authenticated', 'public.reality_profiles', 'life_goals', 'update'), 'authenticated can update new profile dimensions');
select ok(not has_column_privilege('authenticated', 'public.reality_profiles', 'user_id', 'update'), 'authenticated cannot reassign profile ownership');
select ok(not has_table_privilege('authenticated', 'public.reality_profiles', 'delete'), 'authenticated cannot delete the formal profile row');
select ok(has_function_privilege('authenticated', 'public.is_valid_reality_profile_items(jsonb)', 'execute'), 'authenticated can write only through validated profile-item checks');
select ok(not has_function_privilege('anon', 'public.is_valid_reality_profile_items(jsonb)', 'execute'), 'anon cannot execute the profile-item validation function');
select policies_are('public', 'reality_profiles', array['reality_profiles_insert_own_current_seed', 'reality_profiles_select_own_current_seed', 'reality_profiles_update_own_current_seed'], 'only owner and current-Seed Reality Profile policies exist');
select ok((select relrowsecurity from pg_class where oid = 'public.reality_profiles'::regclass), 'RLS is enabled');
select ok((
  select roles @> array['authenticated']::name[] and qual like '%auth.uid%' and qual like '%user_id%' and qual like '%seed_contexts%' and qual like '%submitted_at%' and lower(qual) like '%seed.id desc%' and with_check like '%auth.uid%' and with_check like '%seed_contexts%' and with_check like '%submitted_at%' and lower(with_check) like '%seed.id desc%'
  from pg_policies where schemaname = 'public' and tablename = 'reality_profiles' and policyname = 'reality_profiles_update_own_current_seed'
), 'UPDATE policy checks owner and current submitted Seed in USING and WITH CHECK');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a771', true);
select lives_ok($$
  insert into public.reality_profiles (
    user_id, seed_context_id,
    life_climate_value, life_climate_classification, life_climate_evidence_summary,
    resources_value, resources_classification, resources_evidence_summary,
    constraints_value, constraints_classification, constraints_evidence_summary,
    life_goals
  ) values (
    auth.uid(), '00000000-0000-0000-0000-00000000a773',
    'Current collaboration has changed', 'fact', 'User-confirmed current observation',
    'Support is limited', 'assumption', 'Needs later review',
    null, 'unknown', '明确未知',
    '[{"value":"Complete a career transition","classification":"fact","evidenceSummary":"User-confirmed goal"}]'::jsonb
  )
$$, 'an authenticated owner can create a profile for their own Seed');
select is((select count(life_climate_value) from public.reality_profiles), 1::bigint, 'owner can read the saved profile');
select lives_ok($$ update public.reality_profiles set life_climate_value = 'Updated observation', life_goals = '[{"value":"Updated goal","classification":"assumption","evidenceSummary":"Needs review"}]'::jsonb, revision = revision + 1 where seed_context_id = '00000000-0000-0000-0000-00000000a773' $$, 'owner can update their profile');
select is((select life_climate_value from public.reality_profiles where seed_context_id = '00000000-0000-0000-0000-00000000a773'), 'Updated observation', 'owner update is persisted');
select is((select life_goals -> 0 ->> 'value' from public.reality_profiles where seed_context_id = '00000000-0000-0000-0000-00000000a773'), 'Updated goal', 'owner can persist an individually classified goal');
select throws_ok($$ update public.reality_profiles set life_climate_value = 'Stale direct Data API write', revision = 1 where seed_context_id = '00000000-0000-0000-0000-00000000a773' $$, '23514', 'Reality Profile content changes require exactly one revision increment', 'a stale direct Data API update cannot overwrite a newer revision');
select is((select jsonb_build_object('value', life_climate_value, 'revision', revision) from public.reality_profiles where seed_context_id = '00000000-0000-0000-0000-00000000a773'), '{"value":"Updated observation","revision":1}'::jsonb, 'a rejected stale update leaves content and revision unchanged');
select throws_ok($$ update public.reality_profiles set life_climate_value = 'Skipped revision', revision = revision + 2 where seed_context_id = '00000000-0000-0000-0000-00000000a773' $$, '23514', 'Reality Profile content changes require exactly one revision increment', 'content changes cannot skip a revision');
select throws_ok($$ update public.reality_profiles set revision = revision + 1 where seed_context_id = '00000000-0000-0000-0000-00000000a773' $$, '23514', 'Reality Profile content changes require exactly one revision increment', 'revision cannot advance without content changes');
select throws_ok($$ update public.reality_profiles set life_climate_value = '00000000-0000-7000-8000-000000000000', revision = revision + 1 where seed_context_id = '00000000-0000-0000-0000-00000000a773' $$, '23514', 'new row for relation "reality_profiles" violates check constraint "reality_profiles_life_climate_valid"', 'scalar values reject UUIDs across versions');
select throws_ok($$ update public.reality_profiles set life_climate_evidence_summary = 'Contact owner@example.test for confirmation', revision = revision + 1 where seed_context_id = '00000000-0000-0000-0000-00000000a773' $$, '23514', 'new row for relation "reality_profiles" violates check constraint "reality_profiles_life_climate_valid"', 'scalar evidence summaries reject email addresses');
select throws_ok($$ update public.reality_profiles set resources_value = 'API token must remain private', revision = revision + 1 where seed_context_id = '00000000-0000-0000-0000-00000000a773' $$, '23514', 'new row for relation "reality_profiles" violates check constraint "reality_profiles_resources_valid"', 'resource values reject sensitive-key language');
select throws_ok($$ update public.reality_profiles set resources_evidence_summary = 'api_key value omitted', revision = revision + 1 where seed_context_id = '00000000-0000-0000-0000-00000000a773' $$, '23514', 'new row for relation "reality_profiles" violates check constraint "reality_profiles_resources_valid"', 'resource summaries reject sensitive-key language');
select throws_ok($$ update public.reality_profiles set constraints_value = 'raw scenario must stay server side', revision = revision + 1 where seed_context_id = '00000000-0000-0000-0000-00000000a773' $$, '23514', 'new row for relation "reality_profiles" violates check constraint "reality_profiles_constraints_valid"', 'constraint values reject raw scenario text');
select throws_ok($$ update public.reality_profiles set constraints_evidence_summary = '00000000-0000-0000-0000-000000000000', revision = revision + 1 where seed_context_id = '00000000-0000-0000-0000-00000000a773' $$, '23514', 'new row for relation "reality_profiles" violates check constraint "reality_profiles_constraints_valid"', 'constraint summaries reject version and variant agnostic UUIDs');
select throws_ok($$ update public.reality_profiles set constraints_evidence_summary = repeat('x', 161), revision = revision + 1 where seed_context_id = '00000000-0000-0000-0000-00000000a773' $$, '23514', null, 'scalar evidence summaries enforce the trimmed 160-character limit');
select throws_ok($$ update public.reality_profiles set life_climate_value = repeat('x', 241), revision = revision + 1 where seed_context_id = '00000000-0000-0000-0000-00000000a773' $$, '23514', null, 'scalar values enforce the trimmed 240-character limit');
select lives_ok($$ update public.reality_profiles set life_climate_value = repeat('😀', 121), revision = revision + 1 where seed_context_id = '00000000-0000-0000-0000-00000000a773' $$, 'scalar length counts Unicode characters consistently with the application');
select throws_ok($$ update public.reality_profiles set life_goals = '[{"value":"","classification":"unknown","evidenceSummary":"明确未知","private_payload":"unvalidated"}]'::jsonb, revision = revision + 1 where seed_context_id = '00000000-0000-0000-0000-00000000a773' $$, '23514', 'new row for relation "reality_profiles" violates check constraint "reality_profiles_life_goals_valid"', 'authenticated direct writes cannot attach an unvalidated extra key');
select throws_ok($$ update public.reality_profiles set life_goals = '[{"value":"not empty","classification":"unknown","evidenceSummary":"明确未知"}]'::jsonb, revision = revision + 1 where seed_context_id = '00000000-0000-0000-0000-00000000a773' $$, '23514', 'new row for relation "reality_profiles" violates check constraint "reality_profiles_life_goals_valid"', 'unknown items require an empty value');
select throws_ok($$ update public.reality_profiles set life_goals = '[{"value":"","classification":"unknown","evidenceSummary":"Not explicitly unknown"}]'::jsonb, revision = revision + 1 where seed_context_id = '00000000-0000-0000-0000-00000000a773' $$, '23514', 'new row for relation "reality_profiles" violates check constraint "reality_profiles_life_goals_valid"', 'unknown items require the exact unknown evidence summary');
select throws_ok($$ update public.reality_profiles set life_goals = '[{"value":"00000000-0000-7000-8000-000000000000","classification":"fact","evidenceSummary":"confirmed"}]'::jsonb, revision = revision + 1 where seed_context_id = '00000000-0000-0000-0000-00000000a773' $$, '23514', 'new row for relation "reality_profiles" violates check constraint "reality_profiles_life_goals_valid"', 'profile item checks reject UUIDs across versions');
select throws_ok($$
  insert into public.reality_profiles (user_id, seed_context_id, life_climate_classification, life_climate_evidence_summary, resources_classification, resources_evidence_summary, constraints_classification, constraints_evidence_summary)
  values (auth.uid(), '00000000-0000-0000-0000-00000000a775', 'unknown', '明确未知', 'unknown', '明确未知', 'unknown', '明确未知')
$$, '42501', 'new row violates row-level security policy for table "reality_profiles"', 'owner cannot bind a profile to an older submitted Seed');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000b771', true);
select is((select count(life_climate_value) from public.reality_profiles), 0::bigint, 'another owner cannot read the profile');
select is((with changed as (update public.reality_profiles set life_climate_value = 'Unauthorized change' where seed_context_id = '00000000-0000-0000-0000-00000000a773' returning 1) select count(*) from changed), 0::bigint, 'another owner update affects no rows');
select throws_ok($$
  insert into public.reality_profiles (user_id, seed_context_id, life_climate_value, life_climate_classification, life_climate_evidence_summary, resources_value, resources_classification, resources_evidence_summary, constraints_value, constraints_classification, constraints_evidence_summary)
  values ('00000000-0000-0000-0000-00000000a771', '00000000-0000-0000-0000-00000000a773', 'Spoofed owner', 'fact', 'Summary', null, 'unknown', '明确未知', null, 'unknown', '明确未知')
$$, '42501', 'new row violates row-level security policy for table "reality_profiles"', 'another owner cannot insert a profile under the first owner');
select throws_ok($$
  insert into public.reality_profiles (user_id, seed_context_id, life_climate_value, life_climate_classification, life_climate_evidence_summary, resources_value, resources_classification, resources_evidence_summary, constraints_value, constraints_classification, constraints_evidence_summary)
  values (auth.uid(), '00000000-0000-0000-0000-00000000a773', 'Foreign Seed', 'fact', 'Summary', null, 'unknown', '明确未知', null, 'unknown', '明确未知')
$$, '23503', 'insert or update on table "reality_profiles" violates foreign key constraint "reality_profiles_owner_seed_context_fkey"', 'an owner cannot attach a profile to another account Seed');
reset role;

select * from finish();
rollback;
