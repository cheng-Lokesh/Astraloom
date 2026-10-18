-- AUTHORED CANDIDATE ONLY. Not executed while the local database is unavailable.
-- Runtime rollback/RLS/locking assertions below are not proved by TS source checks.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
('00000000-0000-4000-8000-00000000c901','00000000-0000-0000-0000-000000000000','authenticated','authenticated','continuation-a@example.test','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-4000-8000-00000000c902','00000000-0000-0000-0000-000000000000','authenticated','authenticated','continuation-b@example.test','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now());

create temporary table continuation_fixture(key text primary key, value jsonb);
grant select, insert, update on continuation_fixture to authenticated;

create function pg_temp.continuation_seed_payload() returns jsonb language sql as $fixture$
  select '{"questionText":"How should I arrange the next situation?","trackType":"crossroad","timeWindow":"90_days","situationSummary":"I am reviewing a new situation with changed time and responsibilities.","recentEvents":"","keyPeopleText":"People will be confirmed for this situation","decisionOptions":"","worries":"","forbiddenActions":"","safetyBoundaries":"","desiredOutput":"","privacyAck":true,"privacySafetyAck":true}'::jsonb;
$fixture$;

create function pg_temp.continuation_profile_payload() returns jsonb language sql as $fixture$
  with unknown_item as (select '[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}]'::jsonb as items)
  select jsonb_build_object(
    'life_climate_value','Current arrangements need review','life_climate_classification','fact','life_climate_evidence_summary','Confirmed personally',
    'resources_value',null,'resources_classification','unknown','resources_evidence_summary','明确未知',
    'constraints_value',null,'constraints_classification','unknown','constraints_evidence_summary','明确未知',
    'life_goals',items,'core_values',items,'life_themes',items,'pressures',items,'external_variables',items,
    'life_model_domains',jsonb_build_object('version',1,'identity',items,'career',items,'wealth',items,'relationships',items,'environment',items,'lifeStage',items),
    'world_model_inputs','{"version":1,"resources":[{"key":"time","label":"Available time","resourceType":"time","available":8,"unit":"hours","minimum":2,"maximum":12,"usePerTick":null,"classification":"fact","evidenceSummary":"Confirmed personally"}],"constraints":[]}'::jsonb,
    'revision',0) from unknown_item;
$fixture$;

create function pg_temp.continuation_request(p_seed uuid, p_revision integer) returns jsonb language sql as $fixture$
  select jsonb_build_object('version','reality-profile-continuation-v1','sourceSeedContextId',p_seed,'sourceRevision',p_revision,
    'reviewedProfile',pg_temp.continuation_profile_payload(),
    'reviewedKeys','["lifeClimate","resources","constraints","goals.1","values.1","lifeThemes.1","pressures.1","externalVariables.1","lifeModelDomains.identity.1","lifeModelDomains.career.1","lifeModelDomains.wealth.1","lifeModelDomains.relationships.1","lifeModelDomains.environment.1","lifeModelDomains.lifeStage.1","worldInputs.resources.1"]'::jsonb,
    'confirmedRateKeys','[]'::jsonb,'confirmedForNewSituation',true);
$fixture$;

select ok(not has_function_privilege('anon','public.submit_seed_context_phase2(uuid,jsonb,jsonb)','execute'),'anon cannot call continuation RPC');
select ok(has_function_privilege('authenticated','public.submit_seed_context_phase2(uuid,jsonb,jsonb)','execute'),'authenticated has the narrowly granted RPC');
select ok(not (select prosecdef from pg_proc where oid='public.submit_seed_context_phase2(uuid,jsonb,jsonb)'::regprocedure),'continuation remains SECURITY INVOKER');
select ok(not has_column_privilege('authenticated','public.reality_profiles','id','select'),'private Profile identity was not granted');

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000c901',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-00000000c901","role":"authenticated","is_anonymous":false}',true);

insert into continuation_fixture select 'source',to_jsonb(receipt) from public.submit_seed_context_phase2('00000000-0000-4000-8000-00000000c910',pg_temp.continuation_seed_payload()) as receipt;
insert into public.reality_profiles(user_id,seed_context_id,life_climate_value,life_climate_classification,life_climate_evidence_summary,resources_value,resources_classification,resources_evidence_summary,constraints_value,constraints_classification,constraints_evidence_summary,revision)
  select auth.uid(),(value->>'seed_context_id')::uuid,'Original current context','fact','Confirmed personally',null,'unknown','明确未知',null,'unknown','明确未知',1 from continuation_fixture where key='source';
insert into continuation_fixture select 'request',pg_temp.continuation_request((value->>'seed_context_id')::uuid,1) from continuation_fixture where key='source';

select ok(exists(select 1 from pg_locks where pid=pg_backend_pid() and locktype='advisory' and granted),'legacy blank submission acquires transaction-scoped advisory locks');
select throws_ok($$select * from public.submit_seed_context_phase2('00000000-0000-4000-8000-00000000c911',pg_temp.continuation_seed_payload(),(select value || '{"planning":true}' from continuation_fixture where key='request'))$$,'P0001','invalid_reality_continuation','direct RPC refuses inherited authorization');
select throws_ok($$select * from public.submit_seed_context_phase2('00000000-0000-4000-8000-00000000c911',pg_temp.continuation_seed_payload(),(select jsonb_set(value,'{reviewedProfile,owner_id}','"foreign"') from continuation_fixture where key='request'))$$,'P0001','invalid_reality_continuation','direct RPC refuses injected Profile owner');
select throws_ok($$select * from public.submit_seed_context_phase2('00000000-0000-4000-8000-00000000c911',pg_temp.continuation_seed_payload(),(select jsonb_set(value,'{reviewedKeys}','[]') from continuation_fixture where key='request'))$$,'P0001','invalid_reality_continuation','direct RPC recomputes every review key');
select throws_ok($$select * from public.submit_seed_context_phase2('00000000-0000-4000-8000-00000000c911',pg_temp.continuation_seed_payload(),(select jsonb_set(value,'{reviewedProfile,world_model_inputs,resources,0,usePerTick}','1') from continuation_fixture where key='request'))$$,'P0001','invalid_reality_continuation','a direct RPC rate requires its independent confirmation');
select throws_ok($$select * from public.submit_seed_context_phase2('00000000-0000-4000-8000-00000000c911',pg_temp.continuation_seed_payload(),(select jsonb_set(value,'{reviewedProfile,life_goals,0,value}','"Unknown cannot hold a guess"') from continuation_fixture where key='request'))$$,'P0001','invalid_reality_continuation','unknown cannot become an inferred value');

update public.reality_profiles set life_climate_value='Source changed during review',revision=2 where user_id=auth.uid();
select throws_ok($$select * from public.submit_seed_context_phase2('00000000-0000-4000-8000-00000000c912',pg_temp.continuation_seed_payload(),(select value from continuation_fixture where key='request'))$$,'P0001','reality_continuation_revision_conflict','source CAS rejects an actual concurrent-style profile revision change');
update continuation_fixture set value=jsonb_set(value,'{sourceRevision}','2') where key='request';

reset role;
create function pg_temp.fail_continuation_profile() returns trigger language plpgsql as $failure$
begin
  if current_setting('test.continuation_force_failure',true)='yes' then
    raise exception using errcode='P0001',message='test_profile_insert_failure';
  end if;
  return new;
end;
$failure$;
create trigger test_continuation_failure before insert on public.reality_profiles for each row execute function pg_temp.fail_continuation_profile();
set local role authenticated;
select set_config('test.continuation_force_failure','yes',true);
select throws_ok($$select * from public.submit_seed_context_phase2('00000000-0000-4000-8000-00000000c913',pg_temp.continuation_seed_payload(),(select value from continuation_fixture where key='request'))$$,'P0001','test_profile_insert_failure','Profile insertion failure rolls back the whole atomic call');
select set_config('test.continuation_force_failure','no',true);
select is((select count(*) from public.seed_contexts where user_id=auth.uid()),1::bigint,'no orphan Seed after Profile failure');
select is((select count(*) from public.consent_events where user_id=auth.uid()),1::bigint,'no orphan Consent after Profile failure');
select is((select count(revision) from public.reality_profiles where user_id=auth.uid()),1::bigint,'no partial Profile after failure');

-- Create an actual deadline that is valid now; replay later must precede expiry.
update continuation_fixture set value=jsonb_set(jsonb_set(value,'{reviewedKeys}',(value->'reviewedKeys')||'"worldInputs.constraints.1"'::jsonb),'{reviewedProfile,world_model_inputs,constraints}',jsonb_build_array(jsonb_build_object('key','deadline','label','Reviewed deadline','resourceKey','time','rule',jsonb_build_object('kind','before_time','value',to_char((clock_timestamp()+interval '5 seconds') at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')),'classification','fact','evidenceSummary','Confirmed personally'))) where key='request';
insert into continuation_fixture select 'new',to_jsonb(receipt) from public.submit_seed_context_phase2('00000000-0000-4000-8000-00000000c914',pg_temp.continuation_seed_payload(),(select value from continuation_fixture where key='request')) as receipt;
select is((select value->>'profile_revision' from continuation_fixture where key='new'),'1','new continuation receipt names revision one');
select is((select value->>'idempotent' from continuation_fixture where key='new'),'false','new request is not a replay');
select is((select revision from public.reality_profiles where user_id=auth.uid()),1,'new current Profile begins at revision one');
select is((select resources_value from public.reality_profiles where user_id=auth.uid()),null::text,'explicit unknown scalar remains SQL NULL');
select is((select life_goals->0->>'classification' from public.reality_profiles where user_id=auth.uid()),'unknown','unknown list classification survives continuation');
select is((select count(*) from public.seed_contexts where user_id=auth.uid()),2::bigint,'new Seed appended without overwriting old Seed');
select is((select count(*) from public.consent_events where user_id=auth.uid()),2::bigint,'fresh consent recorded once');
select ok(not exists(select 1 from public.consent_events where metadata->'reality_continuation' ? 'reviewedProfile'),'consent stores provenance and hashes without another full Profile');
select throws_ok($$select * from public.submit_seed_context_phase2('00000000-0000-4000-8000-00000000c915',pg_temp.continuation_seed_payload(),(select value from continuation_fixture where key='request'))$$,'P0001','reality_continuation_source_stale','a second different key loses after the first new Seed becomes current');

select pg_sleep(5.1);
select is((select idempotent from public.submit_seed_context_phase2('00000000-0000-4000-8000-00000000c914',pg_temp.continuation_seed_payload(),(select value from continuation_fixture where key='request'))),true,'exact replay restores receipt after source became old and deadline expired');
select throws_ok($$select * from public.submit_seed_context_phase2('00000000-0000-4000-8000-00000000c914',pg_temp.continuation_seed_payload(),(select jsonb_set(value,'{reviewedKeys}',(value->'reviewedKeys')||'"extra"'::jsonb) from continuation_fixture where key='request'))$$,'P0001','idempotency_key_content_conflict','same-key changed confirmation is a content conflict');
select is((select count(*) from public.seed_contexts where user_id=auth.uid()),2::bigint,'replay did not duplicate Seed');
select is((select count(*) from public.consent_events where user_id=auth.uid()),2::bigint,'replay did not duplicate Consent');

-- Independently validate a fresh expired deadline against the current source.
update continuation_fixture set value=pg_temp.continuation_request((select (value->>'seed_context_id')::uuid from continuation_fixture where key='new'),1) where key='request';
update continuation_fixture set value=jsonb_set(jsonb_set(value,'{reviewedKeys}',(value->'reviewedKeys')||'"worldInputs.constraints.1"'::jsonb),'{reviewedProfile,world_model_inputs,constraints}',jsonb_build_array(jsonb_build_object('key','deadline','label','Expired deadline','resourceKey','time','rule',jsonb_build_object('kind','before_time','value','2000-01-01T00:00:00.000Z'),'classification','fact','evidenceSummary','Confirmed personally'))) where key='request';
select throws_ok($$select * from public.submit_seed_context_phase2('00000000-0000-4000-8000-00000000c916',pg_temp.continuation_seed_payload(),(select value from continuation_fixture where key='request'))$$,'P0001','reality_continuation_deadline_expired','a fresh request cannot silently extend an expired deadline');

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000c902',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-00000000c902","role":"authenticated","is_anonymous":false}',true);
select throws_ok($$select * from public.submit_seed_context_phase2('00000000-0000-4000-8000-00000000c917',pg_temp.continuation_seed_payload(),(select value from continuation_fixture where key='request'))$$,'P0001','reality_continuation_source_stale','another owner cannot continue a foreign source');
select is((select count(revision) from public.reality_profiles),0::bigint,'another owner cannot read the saved Profile');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-00000000c902","role":"authenticated","is_anonymous":true}',true);
select throws_ok($$select * from public.submit_seed_context_phase2('00000000-0000-4000-8000-00000000c918',pg_temp.continuation_seed_payload(),(select value from continuation_fixture where key='request'))$$,'P0001','authentication_required','anonymous Auth users cannot continue another situation');

reset role;
select is((select count(*) from public.reality_profiles where user_id='00000000-0000-4000-8000-00000000c901'),2::bigint,'administrative inspection confirms old and new Profile rows both remain');
select is((select revision from public.reality_profiles where seed_context_id=(select (value->>'seed_context_id')::uuid from continuation_fixture where key='source')),2,'old Profile revision and content were not overwritten by continuation');
select is((select count(*) from public.key_people where user_id='00000000-0000-4000-8000-00000000c901'),0::bigint,'no third-party identity was copied');
select is((select count(*) from public.simulations where user_id='00000000-0000-4000-8000-00000000c901'),0::bigint,'continuation created no Run or inherited runtime authorization');
select * from finish();
rollback;
