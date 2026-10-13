begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('00000000-0000-0000-0000-00000000d701','00000000-0000-0000-0000-000000000000','authenticated','authenticated','draft-a@example.test','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
 ('00000000-0000-0000-0000-00000000d702','00000000-0000-0000-0000-000000000000','authenticated','authenticated','draft-b@example.test','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now());
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000d701',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select * from public.submit_seed_context_phase2('00000000-0000-4000-8000-00000000d711',
 '{"trackType":"crossroad","timeWindow":"30_days","questionText":"Should I accept the role?","situationSummary":"A manager and recruiter need an answer this week.","recentEvents":"An answer is needed this week.","keyPeopleText":"Manager and recruiter.","decisionOptions":"Accept or negotiate.","worries":"Timing is uncertain.","forbiddenActions":"Do not burn bridges.","safetyBoundaries":"Keep communication professional.","desiredOutput":"Compare stated options.","privacyAck":true,"privacySafetyAck":true}'::jsonb);
select * from public.extract_key_people_phase3((select id from public.seed_contexts where submission_key='00000000-0000-4000-8000-00000000d711'),'00000000-0000-4000-8000-00000000d712');
select * from public.mutate_key_people_phase3((select id from public.seed_contexts where submission_key='00000000-0000-4000-8000-00000000d711'),'00000000-0000-4000-8000-00000000d713',
 jsonb_build_array(jsonb_build_object('type','confirm','person_id',(select id::text from public.key_people where seed_context_id=(select id from public.seed_contexts where submission_key='00000000-0000-4000-8000-00000000d711') order by id limit 1))));
select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key='00000000-0000-4000-8000-00000000d711'),'00000000-0000-4000-8000-00000000d714',false);
select * from public.generate_relation_graph_phase3((select id from public.seed_contexts where submission_key='00000000-0000-4000-8000-00000000d711'),'00000000-0000-4000-8000-00000000d715');
do $$begin perform public.lock_relation_graph_phase3((select id from public.seed_contexts where submission_key='00000000-0000-4000-8000-00000000d711'),'00000000-0000-4000-8000-00000000d716'); end$$;
reset role;

create temporary table model_draft_test_request(body jsonb);
grant all on model_draft_test_request to authenticated;
create function pg_temp.model_draft_test_body(expected integer,key_value uuid) returns jsonb language sql security invoker as $$
 select jsonb_build_object('version','digital-life-model-draft-v1','expectedRevision',expected,'idempotencyKey',key_value,'horizonDays',30,
  'sourceContext',public.digital_life_model_draft_safe_context_v1(public.digital_life_model_draft_source_v1()),
  'draftRules',jsonb_build_object('version','digital-life-rules-v1','graphSnapshotId',source#>'{relation_graph_snapshots,id}',
   'agentSnapshotId',source#>'{relation_graph_snapshots,agent_snapshot_id}','profileRevision',coalesce(source#>'{reality_profiles,revision}','0'::jsonb),'actions','[]'::jsonb,'strategies','[]'::jsonb))
 from (select public.digital_life_model_draft_source_v1() source) t;
$$;
set local role authenticated;
insert into model_draft_test_request select pg_temp.model_draft_test_body(0,'00000000-0000-4000-8000-00000000d721');
select ok(not public.digital_life_model_draft_text_valid_v1('https://example.test/source',160),'draft source summaries cannot insert a URL rejected by the API');
select ok(not public.digital_life_model_draft_text_valid_v1('监控',160),'draft text cannot insert an existing safety-rule prohibited term');
select ok(not public.digital_life_model_draft_text_valid_v1(repeat('😀',121),240),'database rule text has the same UTF-16 limit as Zod');
select ok(public.digital_life_model_draft_text_valid_v1('本人明确设定的假设',160),'ordinary hypothesis text is accepted');
select ok(not public.digital_life_model_draft_text_valid_v1('前token后',160),'ASCII word boundary rejects secret words surrounded by Chinese');
select ok(not public.digital_life_model_draft_text_valid_v1('前example@example.test后',160),'ASCII word boundary rejects email surrounded by Chinese');
select ok(not public.digital_life_model_draft_text_valid_v1('前investment后',160),'rule safety uses the same ASCII word boundary');
select ok(not public.digital_life_model_draft_text_valid_v1(U&'self\00A0harm',160),'rule whitespace includes JavaScript NBSP');
select ok(not public.digital_life_model_draft_visible_text_valid_v1(U&'private\FEFFkey',240),'visible whitespace includes JavaScript BOM');
select ok(public.digital_life_model_draft_visible_text_valid_v1('投资资料',240),'neutral context labels do not inherit action safety rules');
select ok(public.digital_life_model_draft_context_valid_v1((select body->'sourceContext' from model_draft_test_request)),'current source projection passes the strict shape gate');
select ok(not public.digital_life_model_draft_context_valid_v1(jsonb_set((select body->'sourceContext' from model_draft_test_request),'{modelContext,resources}',
 '[{"key":"resource-1","label":"可用时间","available":10,"minimum":0,"maximum":10,"unit":"小时","usePerTick":null,"classification":"fact","evidenceSummary":"https://example.test/source"}]')),'legacy Profile URL cannot poison a saved safe context');
select ok(not public.digital_life_model_draft_context_valid_v1(jsonb_set((select body->'sourceContext' from model_draft_test_request),'{modelContext,profileRevision}','null')),'null source revision fails closed');
select ok(not public.digital_life_model_draft_context_valid_v1(jsonb_set((select body->'sourceContext' from model_draft_test_request),'{modelContext,resources}',
 '[{"key":"resource-1","label":"可用时间","available":10,"minimum":0,"maximum":10,"unit":"小时","usePerTick":0,"classification":"fact","evidenceSummary":"本人记录"}]')),'nonpositive declared rate fails closed');
select ok(public.digital_life_model_draft_uuid_valid_v1('"00000000-0000-0000-0000-000000000000"'),'installed API nil UUID is accepted');
select ok(public.digital_life_model_draft_uuid_valid_v1('"ffffffff-ffff-ffff-ffff-ffffffffffff"'),'installed API max UUID is accepted');
select ok(public.digital_life_model_draft_uuid_valid_v1('"00000000-0000-7000-a000-00000000d721"'),'other RFC UUID versions are accepted');
select throws_ok($$select public.save_digital_life_model_draft_v1(jsonb_set((select body from model_draft_test_request),'{idempotencyKey}','"00000000-0000-0000-0000-00000000d721"'))$$,'P0001','invalid_request','non-RFC request UUID cannot poison the draft ledger');
select is(public.read_digital_life_model_draft_v1()->'current','null'::jsonb,'new account has no saved model');
select is(public.save_digital_life_model_draft_v1((select body from model_draft_test_request))#>>'{row,revision}','1','first save appends owner revision one');
select is(public.save_digital_life_model_draft_v1((select body from model_draft_test_request))->'idempotent','true'::jsonb,'same-key JSON request restores original receipt');
select is(public.save_digital_life_model_draft_v1((select body from model_draft_test_request)||'{"expectedRevision":0.0,"horizonDays":30.0}')#>>'{row,revision}','1','canonical numeric equality preserves original replay');
select throws_ok($$select public.save_digital_life_model_draft_v1(jsonb_set((select body from model_draft_test_request),'{horizonDays}','90'))$$,'P0001','idempotency_key_content_conflict','same key cannot change content');
select throws_ok($$select public.save_digital_life_model_draft_v1(pg_temp.model_draft_test_body(0,'00000000-0000-4000-8000-00000000d722'))$$,'P0001','revision_conflict','old device cannot append against revision zero');
select throws_ok($$select public.save_digital_life_model_draft_v1(null)$$,'P0001','invalid_request','SQL NULL request fails closed');
select throws_ok($$select public.save_digital_life_model_draft_v1('null'::jsonb)$$,'P0001','invalid_request','JSON null request fails closed');
select throws_ok($$select public.save_digital_life_model_draft_v1(jsonb_set(pg_temp.model_draft_test_body(1,gen_random_uuid()),'{expectedRevision}','null'))$$,'P0001','invalid_request','JSON null revision cannot become an absent-CAS append');
select throws_ok($$select public.save_digital_life_model_draft_v1(pg_temp.model_draft_test_body(1,gen_random_uuid())||'{"defaultPlanning":{}}')$$,'P0001','invalid_request','unknown permission fields are not draft configuration');
select is((select count(*) from public.digital_life_model_drafts),1::bigint,'replays and failed writes append no rows');
select throws_ok($$update public.digital_life_model_drafts set request=request$$,'42501',null,'saved revisions have no update grant');
select throws_ok($$delete from public.digital_life_model_drafts$$,'42501',null,'saved revisions have no delete grant');

insert into public.reality_profiles(user_id,seed_context_id,life_climate_value,life_climate_classification,life_climate_evidence_summary,
 resources_value,resources_classification,resources_evidence_summary,constraints_value,constraints_classification,constraints_evidence_summary,revision)
values(auth.uid(),(select id from public.seed_contexts where submission_key='00000000-0000-4000-8000-00000000d711'),
 'Later declared background','fact','本人记录',null,'unknown','明确未知',null,'unknown','明确未知',0);
select isnt(public.read_digital_life_model_draft_v1()#>>'{source,signature}',(select body#>>'{sourceContext,signature}' from model_draft_test_request),'whole hidden Profile content changes source signature even with unchanged safe resource selectors');
select is(public.save_digital_life_model_draft_v1((select body from model_draft_test_request))#>>'{row,revision}','1','changed Profile cannot destroy original-key recovery');
select throws_ok($$select public.save_digital_life_model_draft_v1((select body from model_draft_test_request)||jsonb_build_object('expectedRevision',1,'idempotencyKey',gen_random_uuid()))$$,'P0001','model_source_stale','new key cannot silently rebind old rules to changed source');
select is(public.save_digital_life_model_draft_v1(pg_temp.model_draft_test_body(1,'00000000-0000-4000-8000-00000000d723'))#>>'{row,revision}','2','explicit new configuration appends revision two');
select is((select request from public.digital_life_model_drafts where revision=1),(select body from model_draft_test_request),'old configuration remains byte-equivalent JSON after later save');
select is(coalesce(nullif(current_setting('app.digital_life_model_draft_rpc',true),''),'off'),'off','successful save closes its local insert gate');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000d702',true);
select is((select count(*) from public.digital_life_model_drafts),0::bigint,'owner B cannot read owner A model revisions');
select is(public.read_digital_life_model_draft_v1()->'current','null'::jsonb,'owner B current state does not reuse account A history');
select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select public.read_digital_life_model_draft_v1()$$,'42501','unauthenticated','a database role alone is not an account owner');
reset role;
set local role anon;
select throws_ok($$select public.read_digital_life_model_draft_v1()$$,'42501',null,'anonymous caller cannot execute read RPC');
select throws_ok($$select * from public.digital_life_model_drafts$$,'42501',null,'anonymous caller cannot select saved drafts');
reset role;
select ok(not has_table_privilege('authenticated','public.digital_life_model_drafts','UPDATE,DELETE'),'authenticated DML remains append-only');
select ok(not has_table_privilege('service_role','public.digital_life_model_drafts','SELECT,INSERT,UPDATE,DELETE'),'new draft ledger does not grant a service-role path');
select ok(not exists(select 1 from pg_proc where oid in ('public.read_digital_life_model_draft_v1()'::regprocedure,'public.save_digital_life_model_draft_v1(jsonb)'::regprocedure) and prosecdef),'both public draft boundaries use invoker privileges');
select * from finish();
rollback;
