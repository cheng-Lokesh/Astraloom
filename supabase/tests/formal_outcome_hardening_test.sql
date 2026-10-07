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
-- Candidate rollout: reserve compatibility and execute grants only.
-- Real Core lock tamper/atomic completion remains a separate integration check.
insert into reservation_record select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000510',30,null);
select ok((select frozen_source_input->'outcome_lock_required'='true'::jsonb and frozen_source_input->'reality_criteria_required'='true'::jsonb from reservation_record),'four-argument admission cannot bypass both new durable locks');
insert into reservation_record_retry select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000510',30,null,null);
select is((select to_jsonb(r) from reservation_record_retry r),(select to_jsonb(r) from reservation_record r),'four to five argument null selection preserves exact pending receipt');
select throws_ok($$select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000510',30,null,'{"version":1,"confirmed":true,"correction_keys":["correction-v1-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]}'::jsonb)$$,'P0001','idempotency_key_content_conflict','changing correction selection on an existing key conflicts before reading current state');
reset role;
-- Reproduce a genuinely pre-outcome queued receipt with the original hash/source.
select set_config('app.formal_reservation_rpc','on',true);
insert into public.generation_jobs(user_id,seed_context_id,trace_id,version,writer_version,idempotency_key,job_type,status,input_refs,formal_graph_snapshot_id,formal_content_hash,formal_accepted_at,formal_simulation_start_at,frozen_source_input)
select '00000000-0000-0000-0000-00000000e501',f.seed_context_id,'fixture','formal-run-reservation-v1','formal-run-reservation-v1','00000000-0000-4000-8000-000000000511','formal_run_reservation','queued',jsonb_build_object('graph_snapshot_id',f.graph_id),f.graph_id,
 encode(digest(convert_to(jsonb_build_object('graph',f.graph_id,'horizon',30,'rules',null,'version','formal-run-reservation-v1')::text,'UTF8'),'sha256'),'hex'),r.accepted_at,r.simulation_start_at,
 (r.frozen_source_input-array['outcome_lock_required','reality_criteria_required','outcome_calibration','outcome_selection','original_requested_rules'])||jsonb_build_object('source_version','formal-run-reservation-v1')
 from reservation_fixture f cross join reservation_record r;
select set_config('app.formal_reservation_rpc','off',true);
truncate reservation_record_retry;
set local role authenticated;
insert into reservation_record_retry select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-000000000511',30,null,null);
select is((select accepted_at from reservation_record_retry),(select accepted_at from reservation_record),'old four-argument receipt retains original clock');
select ok((select not (frozen_source_input?'outcome_lock_required') and frozen_source_input->>'source_version'='formal-run-reservation-v1' from reservation_record_retry),'old receipt recovery never constructs a new lock or current source');
reset role;
select ok(not has_function_privilege('anon','public.reserve_account_sandbox_run(uuid,uuid,integer,jsonb)','EXECUTE'),'anonymous cannot use compatibility overload');
select ok(not has_function_privilege('authenticated','public.append_formal_outcome_v1(uuid,uuid,jsonb,text,timestamptz,text,jsonb,jsonb,jsonb,text,jsonb)','EXECUTE'),'ordinary owner cannot call trusted outcome writer');
select ok(not has_function_privilege('service_role','public.append_formal_outcome_v1(uuid,uuid,jsonb,text,timestamptz,text,jsonb,jsonb,jsonb,text)','EXECUTE'),'old outcome writer cannot bypass new classification validation');
select * from finish();
rollback;
