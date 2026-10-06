begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- Reuse the established real owner/Seed/People/Agent/Graph setup. All fixtures
-- and attempted writes are rolled back; no existing account data is selected.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-00000000e501', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reservation-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000f501', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reservation-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000e501', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok(
  $$ select * from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000e501', '00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000410', 30, '{}'::jsonb) $$,
  '42501',
  'unauthenticated',
  'an authenticated database role without an auth.uid() claim cannot persist a Run'
);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000e501', true);
select throws_ok(
  $$ select * from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000f501', '00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000411', 30, '{}'::jsonb) $$,
  '42501',
  'unauthenticated',
  'a caller cannot substitute a foreign owner id'
);

select * from public.submit_seed_context_phase2(
  '00000000-0000-4000-8000-000000000501',
  '{"trackType":"crossroad","timeWindow":"30_days","questionText":"Should I accept the role?","situationSummary":"A manager and recruiter need an answer this week.","recentEvents":"An answer is needed this week.","keyPeopleText":"Manager and recruiter.","decisionOptions":"Accept or negotiate.","worries":"Timing is uncertain.","forbiddenActions":"Do not burn bridges.","safetyBoundaries":"Keep communication professional.","desiredOutput":"Compare stated options.","privacyAck":true,"privacySafetyAck":true}'::jsonb
);
select * from public.extract_key_people_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000501'), '00000000-0000-4000-8000-000000000502');
select * from public.mutate_key_people_phase3(
  (select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000501'),
  '00000000-0000-4000-8000-000000000503',
  jsonb_build_array(jsonb_build_object('type', 'confirm', 'person_id', (select id::text from public.key_people where seed_context_id = (select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000501') order by id limit 1)))
);
select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000501'), '00000000-0000-4000-8000-000000000504', false);
select * from public.generate_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000501'), '00000000-0000-4000-8000-000000000505');
reset role;

create temporary table reservation_fixture as select id as graph_id,seed_context_id,agent_snapshot_id from public.relation_graph_snapshots where user_id='00000000-0000-0000-0000-00000000e501';
grant select on reservation_fixture to authenticated;
set local role authenticated;
do $$ begin perform public.lock_relation_graph_phase3((select seed_context_id from reservation_fixture),'00000000-0000-4000-8000-000000000506'); end $$;
reset role;
create temporary table reservation_record(accepted_at timestamptz,simulation_start_at timestamptz,frozen_source_input jsonb,run jsonb);
create temporary table reservation_record_retry(like reservation_record);
create temporary table reservation_run(idempotent boolean,run jsonb);
grant all on reservation_record,reservation_record_retry,reservation_run to authenticated;
set local role authenticated;
insert into reservation_record select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000510',30,null);
insert into public.reality_profiles(user_id,seed_context_id,life_climate_value,life_climate_classification,life_climate_evidence_summary,resources_value,resources_classification,resources_evidence_summary,constraints_value,constraints_classification,constraints_evidence_summary,revision)
values('00000000-0000-0000-0000-00000000e501',(select seed_context_id from reservation_fixture),'A later profile entry','fact','本人记录',null,'unknown','明确未知',null,'unknown','明确未知',0);
select ok((select accepted_at>=now() and simulation_start_at=accepted_at+interval '5 minutes' from reservation_record),'database admission freezes an actual server clock and five-minute future start');
select is((select count(*) from public.generation_jobs where job_type='formal_run_reservation'),0::bigint,'ordinary owner reads hide reservation payloads when the RPC gate is closed');
select is(coalesce(nullif(current_setting('app.formal_reservation_rpc',true),''),'off'),'off','successful reservation closes its transaction-local gate');
insert into reservation_record_retry select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000510',30,null);
select is((select to_jsonb(r) from reservation_record_retry r),(select to_jsonb(r) from reservation_record r),'same key freezes source and clock exactly across pending retries');
select ok((select frozen_source_input->'reality_profiles'='null'::jsonb from reservation_record_retry),'a Profile added after admission cannot change the pending frozen Profile');
select is((select jsonb_agg(a->>'id' order by ord) from reservation_record r cross join lateral jsonb_array_elements(r.frozen_source_input->'agent_profiles') with ordinality t(a,ord)),(select jsonb_agg(id::text order by id) from public.agent_profiles where snapshot_id=(select agent_snapshot_id from reservation_fixture)),'frozen person ordinals retain authoritative model-context id ordering');
select throws_ok($$select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000510',90,null)$$,'P0001','idempotency_key_content_conflict','same key cannot change the requested horizon');
select throws_ok($$select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),gen_random_uuid(),null,null)$$,'P0001','invalid_request','SQL NULL horizon cannot create a reservation');
select throws_ok($$select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),gen_random_uuid(),30,'null')$$,'P0001','invalid_request','JSON null rules cannot pass missing-key checks');
select throws_ok($$select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),gen_random_uuid(),30,'{"version":"digital-life-rules-v1","actions":[null],"strategies":[]}')$$,'P0001','invalid_request','nested malformed rules are rejected before admission');
select throws_ok($$insert into public.generation_jobs(user_id,seed_context_id,trace_id,version,writer_version,idempotency_key,job_type,status) values('00000000-0000-0000-0000-00000000e501',(select seed_context_id from reservation_fixture),'test','formal-run-reservation-v1','formal-run-reservation-v1',gen_random_uuid()::text,'formal_run_reservation','queued')$$,'42501','reservation_write_denied','ordinary direct writes cannot forge a reservation');
do $$ begin perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000f501',true); end $$;
select throws_ok($$select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),gen_random_uuid(),30,null)$$,'P0001','graph_not_found','owner B cannot reserve owner A Graph');
select is((select count(*) from public.generation_jobs where user_id='00000000-0000-0000-0000-00000000e501'),0::bigint,'owner B cannot read owner A frozen sources');
do $$ begin perform set_config('request.jwt.claim.sub','',true); end $$;
select throws_ok($$select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),gen_random_uuid(),30,null)$$,'42501','unauthenticated','a database role without an identity cannot reserve');
reset role;
set local role anon;
select throws_ok($$select * from public.reserve_account_sandbox_run(gen_random_uuid(),gen_random_uuid(),30,null)$$,'42501',null,'anonymous role has no reservation RPC execute grant');
reset role;
do $$ begin perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000e501',true); end $$;

create function pg_temp.reservation_bundle(source jsonb,accepted timestamptz,start_at timestamptz,key_id uuid) returns jsonb language plpgsql security invoker as $$
declare graph jsonb:=source->'relation_graph_snapshots'; profile_row jsonb:=nullif(source->'reality_profiles','null'::jsonb); agents jsonb; edges jsonb; feedback jsonb; rules jsonb; real_now text:=to_char(date_trunc('milliseconds',clock_timestamp()) at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
  select jsonb_agg(jsonb_build_object('id',a->'id','displayName',a->'display_name','sourceRole',a->'agent_type','actorType',case when a->>'agent_type' in ('user_core','user_variant') then 'self' when a->>'agent_type'='group' then 'organization' else 'third_party' end,'evidenceRefs',a->'evidence_refs') order by ord) into agents from jsonb_array_elements(source->'agent_profiles') with ordinality t(a,ord);
  select jsonb_agg(jsonb_build_object('id',e->'id','fromAgentId',e->'from_agent_id','toAgentId',e->'to_agent_id','relationshipType',e->'relationship_type','evidenceRefs',e->'evidence_refs') order by ord) into edges from jsonb_array_elements(source->'relation_edges') with ordinality t(e,ord);
  select jsonb_build_object('source','account_feedback','signals',coalesce(jsonb_agg(jsonb_build_object('rating',f->>'rating','targetType',f->>'target_type','createdAt',f->>'created_at') order by ord),'[]'::jsonb)) into feedback from jsonb_array_elements(source->'feedback_logs') with ordinality t(f,ord);
  rules:=coalesce(nullif(source->'digital_life_rules','null'::jsonb),jsonb_build_object('version','digital-life-rules-v1','graphSnapshotId',graph->'id','agentSnapshotId',graph->'agent_snapshot_id','profileRevision',coalesce(profile_row->'revision','0'::jsonb),'strategies','[]'::jsonb,'actions','[]'::jsonb));
  return jsonb_build_object('causalFingerprint','0123456789abcdef01234567','versions',jsonb_build_object('runtime','formal-account-sandbox-m1-v1','schema','formal-run-bundle-m1-v1','trajectory','trajectory-engine-v2-stage-4'),
    'forecastTiming',jsonb_build_object('acceptedAt',accepted,'simulationStartAt',start_at,'boundaryAt',real_now,'lockedAt',real_now,'generatedPersistedAt',real_now),
    'sourceBoundary',jsonb_build_object('updatedAt',real_now),
    'inputSnapshot',jsonb_build_object('ownerId',graph->'user_id','seedContextId',graph->'seed_context_id','graphSnapshotId',graph->'id','agentSnapshotId',graph->'agent_snapshot_id','horizonDays',30,
      'acceptedAt',accepted,'startedAt',start_at,'graphLockedAt',graph->'locked_at','deterministicSeed',(('x'||left(encode(digest(convert_to((graph->>'id')||':'||key_id::text,'UTF8'),'sha256'),'hex'),7))::bit(28)::integer %1999999999)+1,
      'seedSummary',btrim(left(concat_ws(' ',source#>>'{seed_contexts,user_question}',source#>>'{seed_contexts,raw_context}'),4000)),
      'safetyLevel',graph->'safety_level','agents',agents,'edges',edges,'calibrationSnapshot',feedback,'digitalLifeModel',jsonb_build_object('rules',rules),
      'realityProfileSnapshot',jsonb_build_object('ownerId',graph->'user_id','seedContextId',graph->'seed_context_id','profileId',profile_row->'id','revision',coalesce(profile_row->'revision','0'::jsonb),'profile',public.formal_run_frozen_profile(profile_row))),
    'events',jsonb_build_array(jsonb_build_object('id','world_event_v2_clock_fixture','eventType','controlled_transition','evidenceClass','world_transition_simulation_evidence','causalRealEvidenceIds',jsonb_build_array('evidence_fixture'),'branchId','branch_fixture','beforeRevision',1,'afterRevision',2,'deltas','[]'::jsonb,'operation','{}'::jsonb,'createdAt',start_at)),
    'claims',jsonb_build_array(jsonb_build_object('id','claim_v2_clock_fixture','claimType','scenario_frequency','statement','A bounded branch occurred in the simulation.','uncertaintyStatement','Conditional simulation only.','simulationEventIds',jsonb_build_array('world_event_v2_clock_fixture'))),
    'report',jsonb_build_object('claimIds',jsonb_build_array('claim_v2_clock_fixture'),'title','Formal sandbox result'),'symbolicLensSnapshot',source->'symbolic_lens');
end; $$;
create temporary table reserved_bundles as select pg_temp.reservation_bundle(frozen_source_input,accepted_at,simulation_start_at,'00000000-0000-4000-8000-000000000510') as bundle from reservation_record;
grant select,update on reserved_bundles to authenticated;
set local role authenticated;
select throws_ok($$select * from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000f501',(select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000510',30,(select bundle from reserved_bundles))$$,'42501','unauthenticated','completion cannot substitute a different owner');
select throws_ok($$select * from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000e501',(select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000510',30,jsonb_set((select bundle from reserved_bundles),'{inputSnapshot,realityProfileSnapshot,profile,lifeClimate,value}','"forged input"'))$$,'P0001','invalid_run_bundle','completion cannot replace the frozen Profile');
select throws_ok($$select * from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000e501',(select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000510',30,jsonb_set((select bundle from reserved_bundles),'{claims,0,simulationEventIds}','["world_event_v2_missing"]'))$$,'P0001','claim_evidence_invalid','a late failure rolls back generated artifacts and completion');
reset role;
select is((select count(*) from public.simulations where user_id='00000000-0000-0000-0000-00000000e501'),0::bigint,'failed completion is atomic with no Run');
select is((select status::text from public.generation_jobs where user_id='00000000-0000-0000-0000-00000000e501'),'queued','failed completion preserves the original pending reservation');
set local role authenticated;
insert into reservation_run select * from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000e501',(select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000510',30,(select bundle from reserved_bundles));
select ok((select not idempotent and run->>'status'='completed' from reservation_run),'valid reserved input completes one canonical Run');
do $$ begin perform public.append_account_sandbox_feedback_m1((select (run->>'id')::uuid from reservation_run),'off','A later feedback signal','00000000-0000-4000-8000-000000000540'); end $$;
-- A second generator had the same pending source but finished at another real clock.
update reserved_bundles set bundle=pg_temp.reservation_bundle((select frozen_source_input from reservation_record),(select accepted_at from reservation_record),(select simulation_start_at from reservation_record),'00000000-0000-4000-8000-000000000510');
select ok((select idempotent and run=(select run from reservation_run) from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000e501',(select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000510',30,(select bundle from reserved_bundles))),'a second pending generator with different real lock time restores the original Run');
truncate reservation_record_retry;
insert into reservation_record_retry select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000510',30,null);
select is((select run from reservation_record_retry),(select run from reservation_run),'completed key restores the original result directly');
select ok((select frozen_source_input is null from reservation_record_retry),'completed replay never rereads or returns current source inputs');
reset role;
select is((select count(*) from public.simulations where user_id='00000000-0000-0000-0000-00000000e501'),1::bigint,'pending race and completed retries create exactly one Run');
select is((select count(*) from public.simulation_run_idempotency_receipts where user_id='00000000-0000-0000-0000-00000000e501'),1::bigint,'completion has exactly one matching immutable receipt');
select ok((select (result_bundle#>>'{forecastTiming,lockedAt}')::timestamptz<=completed_at and completed_at<(input_snapshot->>'startedAt')::timestamptz and (result_bundle#>>'{forecastTiming,persistedAt}')::timestamptz=completed_at from public.simulations where user_id='00000000-0000-0000-0000-00000000e501'),'durable persistence uses an actual database time before the forecast window');

-- A fixture-only failed request ages naturally by setting its reservation to
-- a five-minute window in the past. Trigger bypass is transaction-local and
-- limited to these disposable rows, never historical account Runs.
set local role authenticated;
insert into reservation_record select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000511',30,null);
reset role;
alter table public.generation_jobs disable trigger generation_jobs_formal_guard;
update public.generation_jobs set formal_accepted_at=formal_accepted_at-interval '10 minutes',formal_simulation_start_at=formal_simulation_start_at-interval '10 minutes'
  where user_id='00000000-0000-0000-0000-00000000e501' and idempotency_key='00000000-0000-4000-8000-000000000511';
alter table public.generation_jobs enable trigger generation_jobs_formal_guard;
create temporary table expired_reservation as select formal_accepted_at,formal_simulation_start_at,frozen_source_input from public.generation_jobs where user_id='00000000-0000-0000-0000-00000000e501' and idempotency_key='00000000-0000-4000-8000-000000000511';
grant select on expired_reservation to authenticated;
set local role authenticated;
select throws_ok($$select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000511',30,null)$$,'P0001','reservation_expired','expired pending reservation does not move its original window');
select throws_ok($$select * from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000e501',(select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000511',30,(select pg_temp.reservation_bundle(frozen_source_input,formal_accepted_at,formal_simulation_start_at,'00000000-0000-4000-8000-000000000511') from expired_reservation))$$,'P0001','reservation_expired','database actual time rejects late completion even when caller supplies timing');
select is(coalesce(nullif(current_setting('app.formal_reservation_rpc',true),''),'off'),'off','expired admission leaves its RPC gate closed');
reset role;
create function pg_temp.reservation_shape_attempt(column_name text) returns text language plpgsql security invoker as $$
declare payload jsonb; new_row public.generation_jobs;
begin
  select to_jsonb(j) into payload from public.generation_jobs j where user_id='00000000-0000-0000-0000-00000000e501' and idempotency_key='00000000-0000-4000-8000-000000000510';
  payload:=payload||jsonb_build_object('id',gen_random_uuid(),'idempotency_key',gen_random_uuid()::text,'simulation_id',null,'status','queued',column_name,null);
  new_row:=jsonb_populate_record(null::public.generation_jobs,payload);
  perform set_config('app.formal_reservation_rpc','on',true);
  insert into public.generation_jobs select new_row.*;
  raise exception using errcode='PT001',message='accepted';
exception when others then return sqlstate;
end; $$;
select is(pg_temp.reservation_shape_attempt(column_name),'23514','reservation shape rejects SQL NULL '||column_name)
  from (values('formal_content_hash'),('formal_accepted_at'),('formal_simulation_start_at'),('frozen_source_input'),('formal_graph_snapshot_id')) as fields(column_name);
select throws_ok($$update public.generation_jobs set formal_accepted_at=now() where user_id='00000000-0000-0000-0000-00000000e501' and idempotency_key='00000000-0000-4000-8000-000000000510'$$,'42501','reservation_immutable','completed reservation rejects even privileged in-place clock changes');
select throws_ok($$delete from public.generation_jobs where user_id='00000000-0000-0000-0000-00000000e501' and idempotency_key='00000000-0000-4000-8000-000000000510'$$,'42501','reservation_immutable','completed reservation is append-only');
set local role authenticated;
truncate reservation_record_retry;
insert into reservation_record_retry select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000530',90,null);
select ok((select frozen_source_input->'reality_profiles'<>'null'::jsonb and jsonb_array_length(frozen_source_input->'feedback_logs')=1 from reservation_record_retry),'a new key uses the later saved Profile and Feedback, preserving the older reservation');
select ok((select not idempotent from public.persist_account_sandbox_run_m1('00000000-0000-0000-0000-00000000e501',(select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000530',90,(select jsonb_set(pg_temp.reservation_bundle(frozen_source_input,accepted_at,simulation_start_at,'00000000-0000-4000-8000-000000000530'),'{inputSnapshot,horizonDays}','90') from reservation_record_retry))),'valid reserved 90-day input completes with its latest frozen sources');
reset role;
-- Exercise the old completed-receipt recovery path with disposable fixtures.
alter table public.generation_jobs disable trigger generation_jobs_formal_guard;
delete from public.generation_jobs where user_id='00000000-0000-0000-0000-00000000e501' and idempotency_key='00000000-0000-4000-8000-000000000510';
alter table public.generation_jobs enable trigger generation_jobs_formal_guard;
set local role authenticated;
truncate reservation_record_retry;
insert into reservation_record_retry select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000510',30,null);
select is((select run from reservation_record_retry),(select run from reservation_run),'legacy completed receipt remains recoverable without creating a new reservation');
select throws_ok($$select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000510',90,null)$$,'P0001','idempotency_key_content_conflict','legacy completed recovery still rejects changed user content');
reset role;
select * from finish();
rollback;

