begin;

create extension if not exists pgtap with schema extensions;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase2-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase2-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

select plan(10);

select has_function(
  'public',
  'submit_seed_context_phase2',
  array['uuid', 'jsonb'],
  'Phase 2 submission uses one database entrypoint'
);

select ok(
  not (select prosecdef from pg_proc where oid = 'public.submit_seed_context_phase2(uuid,jsonb)'::regprocedure),
  'Phase 2 submission entrypoint is not SECURITY DEFINER'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select lives_ok(
  $$
    select * from public.submit_seed_context_phase2(
      '11111111-1111-1111-1111-111111111111',
      '{"trackType":"crossroad","timeWindow":"90_days","questionText":"Should I accept the role?","situationSummary":"A concrete workplace decision with a deadline.","recentEvents":"Recruiter asked for an answer this week.","keyPeopleText":"Manager and recruiter.","decisionOptions":"Accept or negotiate.","worries":"The promotion timing is uncertain.","forbiddenActions":"Do not burn bridges.","safetyBoundaries":"Keep communication professional.","desiredOutput":"Compare pressure points.","privacyAck":true,"privacySafetyAck":true}'::jsonb
    )
  $$,
  'an authenticated owner can submit a compliant Track A seed context'
);

select is(
  (select count(*) from public.seed_contexts where submission_key = '11111111-1111-1111-1111-111111111111'),
  1::bigint,
  'first submission creates exactly one seed context'
);

select is(
  (select count(*) from public.consent_events where consent_type = 'seed_context_submission'),
  1::bigint,
  'first submission creates exactly one consent record'
);

select ok(
  (select idempotent from public.submit_seed_context_phase2(
    '11111111-1111-1111-1111-111111111111',
    '{"trackType":"crossroad","timeWindow":"90_days","questionText":"Should I accept the role?","situationSummary":"A concrete workplace decision with a deadline.","recentEvents":"Recruiter asked for an answer this week.","keyPeopleText":"Manager and recruiter.","decisionOptions":"Accept or negotiate.","worries":"The promotion timing is uncertain.","forbiddenActions":"Do not burn bridges.","safetyBoundaries":"Keep communication professional.","desiredOutput":"Compare pressure points.","privacyAck":true,"privacySafetyAck":true}'::jsonb
  )),
  'same key with identical normalized content returns the original submission'
);

select throws_ok(
  $$
    select * from public.submit_seed_context_phase2(
      '11111111-1111-1111-1111-111111111111',
      '{"trackType":"crossroad","timeWindow":"90_days","questionText":"Should I accept a different role?","situationSummary":"A concrete workplace decision with a deadline.","recentEvents":"Recruiter asked for an answer this week.","keyPeopleText":"Manager and recruiter.","decisionOptions":"Accept or negotiate.","worries":"The promotion timing is uncertain.","forbiddenActions":"Do not burn bridges.","safetyBoundaries":"Keep communication professional.","desiredOutput":"Compare pressure points.","privacyAck":true,"privacySafetyAck":true}'::jsonb
    )
  $$,
  'P0001',
  'idempotency_key_content_conflict',
  'same key with different normalized content is rejected'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000b001', true);

select is(
  (select count(*) from public.seed_contexts where submission_key = '11111111-1111-1111-1111-111111111111'),
  0::bigint,
  'a second account cannot read the first account submission'
);

select lives_ok(
  $$
    select * from public.submit_seed_context_phase2(
      '11111111-1111-1111-1111-111111111111',
      '{"trackType":"crossroad","timeWindow":"30_days","questionText":"Should I wait?","situationSummary":"Another concrete workplace decision with a deadline.","recentEvents":"An answer is needed this week.","keyPeopleText":"A manager.","decisionOptions":"Wait or act.","worries":"The timing is uncertain.","forbiddenActions":"Do not burn bridges.","safetyBoundaries":"Keep communication professional.","desiredOutput":"Compare pressure points.","privacyAck":true,"privacySafetyAck":true}'::jsonb
    )
  $$,
  'the same key is independently usable by another owner'
);

reset role;

select is(
  (select count(*) from public.seed_contexts s join public.consent_events c on c.id = s.consent_event_id and c.user_id = s.user_id where s.submission_key = '11111111-1111-1111-1111-111111111111'),
  2::bigint,
  'every persisted submission is backed by one consent record owned by the same user'
);

select * from finish();
rollback;
