begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- Reuse the established real owner/Seed/People/Agent/Graph setup. All fixtures
-- and attempted writes are rolled back; no existing account data is selected.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-00000000e401', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm1-run-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000f401', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm1-run-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000e401', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok(
  $$ select * from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000e401', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000410', 30, '{}'::jsonb) $$,
  '42501',
  'unauthenticated',
  'an authenticated database role without an auth.uid() claim cannot persist a Run'
);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000e401', true);
select throws_ok(
  $$ select * from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000f401', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000411', 30, '{}'::jsonb) $$,
  '42501',
  'unauthenticated',
  'a caller cannot substitute a foreign owner id'
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
      'calibrationSnapshot', '{}'::jsonb,
      'agents', coalesce((
        select jsonb_agg(jsonb_build_object('id', a.id::text) order by a.id)
        from public.agent_profiles a
        where a.snapshot_id = g.agent_snapshot_id and a.user_id = g.user_id
      ), '[]'::jsonb),
      'edges', coalesce((
        select jsonb_agg(jsonb_build_object('id', e.id::text) order by e.id)
        from public.relation_edges e
        where e.graph_snapshot_id = g.id and e.user_id = g.user_id
      ), '[]'::jsonb)
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

set local role authenticated;
select * from public.lock_relation_graph_phase3((select seed_id from m1_run_fixture), '00000000-0000-4000-8000-000000000406');
reset role;

-- The inner subtransaction also rolls back a buggy successful call, so the RED
-- matrix cannot leave completed artifacts or receipts even before the fix.
create function pg_temp.attempt_run(p_horizon integer, p_payload jsonb)
returns text language plpgsql security invoker as $$
begin
  perform public.persist_account_sandbox_run_m1(
    '00000000-0000-0000-0000-00000000e401',
    (select graph_id from m1_run_fixture), gen_random_uuid(), p_horizon, p_payload);
  raise exception using errcode='PT001', message='accepted';
exception when others then
  if sqlstate='PT001' then return 'accepted'; end if;
  return sqlstate || ':' || sqlerrm;
end;
$$;

create temporary table m1_required_paths(path text[]);
insert into m1_required_paths values
  ('{inputSnapshot}'),('{events}'),('{claims}'),('{report}'),('{versions}'),
  ('{causalFingerprint}'),('{versions,runtime}'),('{versions,schema}'),('{versions,trajectory}'),
  ('{inputSnapshot,ownerId}'),('{inputSnapshot,seedContextId}'),
  ('{inputSnapshot,graphSnapshotId}'),('{inputSnapshot,agentSnapshotId}'),
  ('{inputSnapshot,horizonDays}'),('{inputSnapshot,deterministicSeed}'),
  ('{inputSnapshot,agents}'),('{inputSnapshot,edges}'),
  ('{events,0}'),('{events,0,id}'),('{events,0,evidenceClass}'),
  ('{events,0,causalRealEvidenceIds}'),('{events,0,causalRealEvidenceIds,0}'),
  ('{events,0,eventType}'),('{events,0,branchId}'),('{events,0,createdAt}'),
  ('{events,0,beforeRevision}'),('{events,0,afterRevision}'),
  ('{events,0,operation}'),('{events,0,deltas}'),
  ('{claims,0}'),('{claims,0,id}'),('{claims,0,claimType}'),
  ('{claims,0,statement}'),('{claims,0,uncertaintyStatement}'),
  ('{claims,0,simulationEventIds}'),('{claims,0,simulationEventIds,0}'),
  ('{report,claimIds}'),('{report,claimIds,0}'),('{report,title}');
grant select on m1_required_paths to authenticated;
set local role authenticated;
select set_config('app.m1_run_rpc','off',true);
select is(pg_temp.attempt_run(null,(select bundle from m1_run_fixture)),
  'P0001:invalid_run_input','SQL NULL horizon cannot silently create a 90-day Run');
select is(pg_temp.attempt_run(30,null),
  'P0001:invalid_run_input','SQL NULL bundle is rejected before any persistence');
select is(pg_temp.attempt_run(30,'null'::jsonb),
  'P0001:invalid_run_input','JSON null bundle is rejected');

select is(pg_temp.attempt_run(30,case mutation
    when 'missing' then bundle #- path
    when 'json_null' then jsonb_set(bundle,path,'null'::jsonb)
    else jsonb_set(bundle,path,'false'::jsonb) end),
  'P0001:invalid_run_bundle',
  array_to_string(path,'.') || ' rejects ' || mutation)
from m1_run_fixture cross join m1_required_paths
cross join (values('missing'),('json_null'),('wrong_type')) as mutations(mutation)
-- Removing the only reference means an empty array; this is also invalid.
order by path, mutation;

select is(pg_temp.attempt_run(30,jsonb_set(bundle,'{inputSnapshot,horizonDays}','"30"')),
  'P0001:invalid_run_bundle','string horizon is not coerced into a numeric horizon')
from m1_run_fixture;
select is(pg_temp.attempt_run(30,jsonb_set(bundle,'{inputSnapshot,deterministicSeed}','2147483648')),
  'P0001:invalid_run_bundle','out-of-range deterministic seed is rejected without a cast error')
from m1_run_fixture;
select is(pg_temp.attempt_run(30,jsonb_set(bundle,'{inputSnapshot,deterministicSeed}','1.5')),
  'P0001:invalid_run_bundle','fractional deterministic seed is rejected without a cast error')
from m1_run_fixture;
select is(pg_temp.attempt_run(30,jsonb_set(bundle,'{inputSnapshot,deterministicSeed}',seed)),
  'P0001:invalid_run_bundle','deterministic seed stays inside the formal runtime positive range')
from m1_run_fixture cross join (values ('0'::jsonb),('-1'::jsonb),('2000000001'::jsonb)) as seeds(seed);
select is(pg_temp.attempt_run(30,jsonb_set(bundle,'{report,claimIds}','[]')),
  'P0001:invalid_run_bundle','Report must have a nonempty Claim reference array')
from m1_run_fixture;
select is(pg_temp.attempt_run(30,jsonb_set(bundle,'{events,0,causalRealEvidenceIds}','[]')),
  'P0001:invalid_run_bundle','Event must have nonempty real-evidence reference array')
from m1_run_fixture;
select is(pg_temp.attempt_run(30,jsonb_set(bundle,'{claims,0,simulationEventIds}','[]')),
  'P0001:invalid_run_bundle','Claim must have nonempty simulation-evidence reference array')
from m1_run_fixture;
select is(pg_temp.attempt_run(30,jsonb_set(bundle,path,replacement)),
  'P0001:invalid_run_bundle',array_to_string(path,'.') || ' rejects invalid optional snapshot type')
from m1_run_fixture cross join (values
  ('{inputSnapshot,calibrationSnapshot}'::text[]),('{symbolicLensSnapshot}'::text[])) as paths(path)
cross join (values('null'::jsonb),('false'::jsonb)) as mutations(replacement);
select is(pg_temp.attempt_run(30,(select bundle from m1_run_fixture)), 'P0001:reservation_required',
  'even a well-shaped new 30-day bundle requires admission before generation');
select is(pg_temp.attempt_run(90,jsonb_set((select bundle from m1_run_fixture),'{inputSnapshot,horizonDays}','90')), 'P0001:reservation_required',
  'even a well-shaped new 90-day bundle requires admission before generation');
select is(coalesce(nullif(current_setting('app.m1_run_rpc',true),''),'off'),'off',
  'writer guard stays closed across rejected calls and rolled-back valid controls');
reset role;
select is((select count(*) from public.simulations where user_id='00000000-0000-0000-0000-00000000e401'),0::bigint,
  'invalid-input matrix leaves no partial or completed Runs');
select is((select count(*) from public.simulation_run_idempotency_receipts where user_id='00000000-0000-0000-0000-00000000e401'),0::bigint,
  'invalid-input matrix consumes no idempotency receipts');
select * from finish();
rollback;

