begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- Cross-language fixtures from the unchanged TypeScript stable World ID factory.
select is(public.formal_environment_core_variable_id_v2('formal-0123456789abcdef01234567','pressures.1'),'world_variable_v2_sh5fpr1e3i1xh','first pressure ID equals the actual TS factory');
select is(public.formal_environment_core_variable_id_v2('formal-0123456789abcdef01234567','pressures.2'),'world_variable_v2_sr51eqx367pe','second pressure preserves its original ordinal in the ID');
select is(public.formal_environment_core_variable_id_v2('formal-0123456789abcdef01234567','pressures.8'),'world_variable_v2_uf2nkk1p48i00','last supported pressure ID equals TS');
select is(public.formal_environment_core_variable_id_v2('formal-0123456789abcdef01234567','externalVariables.1'),'world_variable_v2_gt0ocj1q337gf','first external variable ID preserves the raw-key casing');
select is(public.formal_environment_core_variable_id_v2('formal-0123456789abcdef01234567','externalVariables.8'),'world_variable_v2_iqxw7c22plju','last external variable ID equals TS');
select is(public.formal_environment_core_variable_id_v2('formal-0123456789abcdef01234567','pressures.0'),null::text,'zero ordinal is rejected');
select is(public.formal_environment_core_variable_id_v2('formal-0123456789abcdef01234567','pressures.9'),null::text,'out-of-range ordinal is rejected');
select is(public.formal_environment_core_variable_id_v2('formal-0123456789abcdef01234567','pressures.01'),null::text,'padded ordinal is rejected');
select is(public.formal_environment_core_variable_id_v2('formal-0123456789abcdef01234567','externalvariables.1'),null::text,'raw-key casing cannot alias a different source');
select is(public.formal_environment_core_variable_id_v2('formal-0123456789abcdef01234567','goals.1'),null::text,'unrelated background fields are rejected');
select is(public.formal_environment_core_variable_id_v2('formal-0123456789abcdef01234567','pressures.1:extra'),null::text,'raw-key suffix injection is rejected');
select is(public.formal_environment_core_variable_id_v2('formal-short','pressures.2'),null::text,'namespace must contain the exact formal fingerprint');
select is(public.formal_environment_core_variable_id_v2('formal-0123456789abcdef01234567:extra','pressures.2'),null::text,'namespace suffix injection is rejected');
select is(public.formal_environment_core_variable_id_v2(null,'pressures.2'),null::text,'NULL namespace fails closed');
select is(public.formal_environment_core_variable_id_v2('formal-0123456789abcdef01234567',null),null::text,'NULL source key fails closed');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('00000000-0000-0000-0000-00000000e801','00000000-0000-0000-0000-000000000000','authenticated','authenticated','environment-a@example.test','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
 ('00000000-0000-0000-0000-00000000e802','00000000-0000-0000-0000-000000000000','authenticated','authenticated','environment-b@example.test','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now());
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000e801',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select * from public.submit_seed_context_phase2('00000000-0000-4000-8000-00000000e811',
 '{"trackType":"crossroad","timeWindow":"30_days","questionText":"Should I accept the role?","situationSummary":"A manager and recruiter need an answer this week.","recentEvents":"An answer is needed this week.","keyPeopleText":"Manager and recruiter.","decisionOptions":"Accept or negotiate.","worries":"Timing is uncertain.","forbiddenActions":"Do not burn bridges.","safetyBoundaries":"Keep communication professional.","desiredOutput":"Compare stated options.","privacyAck":true,"privacySafetyAck":true}'::jsonb);
select * from public.extract_key_people_phase3((select id from public.seed_contexts where submission_key='00000000-0000-4000-8000-00000000e811'),'00000000-0000-4000-8000-00000000e812');
select * from public.mutate_key_people_phase3((select id from public.seed_contexts where submission_key='00000000-0000-4000-8000-00000000e811'),'00000000-0000-4000-8000-00000000e813',
 jsonb_build_array(jsonb_build_object('type','confirm','person_id',(select id::text from public.key_people where seed_context_id=(select id from public.seed_contexts where submission_key='00000000-0000-4000-8000-00000000e811') order by id limit 1))));
select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key='00000000-0000-4000-8000-00000000e811'),'00000000-0000-4000-8000-00000000e814',false);
select * from public.generate_relation_graph_phase3((select id from public.seed_contexts where submission_key='00000000-0000-4000-8000-00000000e811'),'00000000-0000-4000-8000-00000000e815');
do $$begin perform public.lock_relation_graph_phase3((select id from public.seed_contexts where submission_key='00000000-0000-4000-8000-00000000e811'),'00000000-0000-4000-8000-00000000e816'); end$$;
reset role;


-- These tests must execute against PostgreSQL; source parity Vitest is not DB acceptance.
set local role authenticated;
insert into public.reality_profiles(user_id,seed_context_id,life_climate_classification,life_climate_evidence_summary,resources_classification,resources_evidence_summary,constraints_classification,constraints_evidence_summary,pressures,external_variables)
values(auth.uid(),(select id from public.seed_contexts where submission_key='00000000-0000-4000-8000-00000000e811'),'unknown','明确未知','unknown','明确未知','unknown','明确未知',
 '[{"value":"","classification":"unknown","evidenceSummary":"明确未知"},{"value":"当前进度紧张","classification":"fact","evidenceSummary":"本人记录"}]',
 '[{"value":"当前安排稳定","classification":"assumption","evidenceSummary":"本人设定"}]');
reset role;
create temporary table environment_test_context(source jsonb,rules jsonb,request jsonb);
grant all on environment_test_context to authenticated;
set local role authenticated;
insert into environment_test_context(source) select public.digital_life_model_draft_source_v2();
update environment_test_context set rules=jsonb_build_object('version','digital-life-rules-v2','graphSnapshotId',source#>'{relation_graph_snapshots,id}','agentSnapshotId',source#>'{relation_graph_snapshots,agent_snapshot_id}','profileRevision',source#>'{reality_profiles,revision}','strategies','[]'::jsonb,'actions',jsonb_build_array(jsonb_build_object(
 'key','rule-1','pathKey','main','actorKey',(select 'person-'||ord::text from jsonb_array_elements(source->'agent_profiles') with ordinality t(a,ord) where a->>'agent_type'='user_core'),
 'when',jsonb_build_object('kind','at_tick','tickIndex',0),'operation',jsonb_build_object('actionType','update_external_variable','variableKey','pressure-2','value','调整后进度宽松'),
 'classification','assumption','confirmedForSimulation',true,'evidenceSummary','本人明确设定的条件假设')));
update environment_test_context set request=jsonb_build_object('version','digital-life-model-draft-v2','expectedRevision',0,'idempotencyKey','00000000-0000-4000-8000-00000000e821','horizonDays',30,'sourceContext',public.digital_life_model_draft_safe_context_v2(source),'draftRules',jsonb_set(rules,'{actions,0,confirmedForSimulation}','false'));
select is((select source->'signature' from environment_test_context),public.digital_life_model_draft_source_v1()->'signature','v1 source hash remains exact');
select is((select source->>'signature_v2' from environment_test_context),encode(extensions.digest(convert_to(jsonb_build_object('version','digital-life-model-draft-source-v2','source',(select source-'signature'-'signature_v2' from environment_test_context))::text,'UTF8'),'sha256'),'hex'),'v2 signature excludes both signature fields');
select ok(public.digital_life_model_draft_context_valid_v2((select request->'sourceContext' from environment_test_context)),'v2 safe projection is valid');
select is((select request#>>'{sourceContext,modelContext,variables,0,key}' from environment_test_context),'pressure-2','unknown first pressure does not renumber the second pressure');
select is((select request#>>'{sourceContext,modelContext,variables,0,label}' from environment_test_context),'压力（第2项）','safe context labels match the product projection');
select ok(not public.digital_life_model_draft_context_valid_v1((select request->'sourceContext' from environment_test_context)),'v1 source context cannot silently accept v2 fields');
select ok(public.formal_run_rules_valid((select rules from environment_test_context)),'confirmed v2 environment action shape accepted');
select ok(public.formal_environment_rules_valid_v2((select source from environment_test_context),(select rules from environment_test_context),30),'source-bound v2 rule is legal');
select ok(public.digital_life_model_draft_request_valid_v2((select request from environment_test_context)),'unconfirmed v2 draft envelope accepted');
select ok(not public.digital_life_model_draft_request_valid_v1(jsonb_set((select request from environment_test_context),'{version}','"digital-life-model-draft-v1"')),'public v1 request helper rejects v2 rules');
select ok(public.digital_life_draft_confirmed_shape_v1((select request->'draftRules' from environment_test_context)) is null,'public v1 confirmation helper stays strict');
select ok(public.digital_life_draft_confirmed_shape_v2((select request->'draftRules' from environment_test_context)) is not null,'v2 confirmation helper preserves the version');
select ok(not public.digital_life_model_draft_rules_valid_v1((select source from environment_test_context),(select request->'draftRules' from environment_test_context),30),'public v1 semantic helper rejects v2 rules');
select ok(not public.formal_run_rules_valid(jsonb_set((select rules from environment_test_context),'{actions,0,operation,variableKey}','"pressure-9"')),'only profile ordinals one through eight are legal');
select ok(not public.formal_environment_rules_valid_v2((select source from environment_test_context),jsonb_set((select rules from environment_test_context),'{actions,0,operation,variableKey}','"pressure-1"'),30),'unknown source item cannot be targeted');
select ok(not public.formal_environment_rules_valid_v2((select source from environment_test_context),jsonb_set((select rules from environment_test_context),'{actions,0,operation,value}','"当前进度紧张"'),30),'replacement must differ from frozen baseline');
select ok(not public.formal_run_rules_valid(jsonb_set((select rules from environment_test_context),'{actions,0,operation,value}','"对方内心真实想法"')),'private intent text is rejected');
select ok(not public.formal_run_rules_valid(jsonb_set((select rules from environment_test_context),'{actions,0,operation,value}','"https://example.test"')),'unsafe replacement text is rejected');
select ok(not public.formal_run_rules_valid(jsonb_set((select rules from environment_test_context),'{actions,0,classification}','"fact"')),'environment rule is always an assumption');
select ok(not public.formal_run_rules_valid(jsonb_set((select rules from environment_test_context),'{actions,0,confirmedForSimulation}','false')),'formal reservation cannot consume unconfirmed draft rules');
select ok(not public.formal_run_rules_valid(jsonb_set((select rules from environment_test_context),'{actions}',(select rules->'actions'||jsonb_build_array(jsonb_set(rules#>'{actions,0}','{key}','"rule-2"')) from environment_test_context))),'one path cannot authorize two environment conditions');
select ok(not public.formal_environment_rules_valid_v2((select source from environment_test_context),jsonb_set((select rules from environment_test_context),'{actions,0,when,tickIndex}','5'),30),'30-day source semantic validation enforces three ticks');
select ok(public.formal_environment_rules_valid_v2((select source from environment_test_context),jsonb_set((select rules from environment_test_context),'{actions,0,when,tickIndex}','5'),90),'90-day source semantic validation allows six ticks');
select throws_ok($$select public.save_digital_life_model_draft_v1(jsonb_set((select request from environment_test_context),'{version}','"digital-life-model-draft-v1"'))$$,'P0001','invalid_request','v1 envelope cannot save v2 rules');
select is(public.save_digital_life_model_draft_v1((select request from environment_test_context))#>>'{row,revision}','1','v2 draft reaches the existing append-only ledger');
select is(public.save_digital_life_model_draft_v1((select request from environment_test_context))->'idempotent','true'::jsonb,'v2 saved request replays its original receipt');
select is(public.read_digital_life_model_draft_v1()#>'{source,signature}',(select source->'signature' from environment_test_context),'read RPC retains v1 signature');
select is(public.read_digital_life_model_draft_v1()#>'{source,signature_v2}',(select source->'signature_v2' from environment_test_context),'read RPC exposes v2 signature');
select is(public.read_digital_life_model_draft_v1()#>>'{current,request,version}','digital-life-model-draft-v2','read RPC restores the saved v2 request');
select lives_ok($$select * from public.reserve_account_sandbox_run(((select source from environment_test_context)#>>'{relation_graph_snapshots,id}')::uuid,'00000000-0000-4000-8000-00000000e831',30,(select rules from environment_test_context),null,null)$$,'v2 rule reaches real maximum-arity reservation RPC');
select is((select frozen_source_input->'digital_life_rules' from public.reserve_account_sandbox_run(((select source from environment_test_context)#>>'{relation_graph_snapshots,id}')::uuid,'00000000-0000-4000-8000-00000000e831',30,(select rules from environment_test_context),null,null)),(select rules from environment_test_context),'reservation replay freezes the exact original v2 rules');
select throws_ok($$select * from public.reserve_account_sandbox_run(((select source from environment_test_context)#>>'{relation_graph_snapshots,id}')::uuid,'00000000-0000-4000-8000-00000000e832',30,jsonb_set((select rules from environment_test_context),'{actions,0,operation,variableKey}','"pressure-1"'),null,null)$$,'P0001','invalid_request','reservation rejects unknown source variable before insert');
select throws_ok($$select * from public.reserve_account_sandbox_run(((select source from environment_test_context)#>>'{relation_graph_snapshots,id}')::uuid,'00000000-0000-4000-8000-00000000e833',30,jsonb_set((select rules from environment_test_context),'{actions,0,when,tickIndex}','5'),null,null)$$,'P0001','invalid_request','reservation enforces the requested three-tick horizon');
select ok(not public.formal_environment_bundle_valid_v2('{}',(select source from environment_test_context),now(),30),'missing controlled World chain fails closed');
select throws_ok($$update public.digital_life_model_drafts set request=request$$,'42501',null,'v2 does not add mutable history grants');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000e802',true);
select is(public.digital_life_model_draft_source_v2(),null::jsonb,'other account cannot read the first account source');
select is(public.read_digital_life_model_draft_v1()->'current','null'::jsonb,'other account cannot read the first account draft');
reset role;
select ok(not has_function_privilege('anon','public.digital_life_model_draft_source_v2()','EXECUTE'),'anonymous source access remains revoked');
select ok(not has_function_privilege('anon','public.formal_environment_rules_valid_v2(jsonb,jsonb,integer)','EXECUTE'),'anonymous helper access remains revoked');
select ok(not has_function_privilege('anon','public.formal_environment_core_variable_id_v2(text,text)','EXECUTE'),'anonymous environment ID helper access remains revoked');
select ok(not exists(select 1 from pg_proc where oid in ('public.digital_life_model_draft_source_v2()'::regprocedure,'public.formal_environment_bundle_valid_v2(jsonb,jsonb,timestamptz,integer)'::regprocedure) and prosecdef),'new source and completion helpers use invoker permissions');
select * from finish();
rollback;
