begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_temp;
select no_plan();
select has_function('public','symbolic_calendar_period_v1',array['timestamp with time zone'],'Run admission has a database-authoritative calendar period');
select has_function('public','freeze_symbolic_run_lens_v1',array['uuid','timestamp with time zone'],'Run admission freezes a real owned symbolic source');
select has_function('public','set_symbolic_future_attachment_v1',array['uuid','integer','uuid','boolean','text'],'future Run use requires its own controlled consent operation');
select has_column('public','symbolic_lens_preferences','future_attachment_consent_id','active attachment binds an explicit consent event');
select ok(coalesce((select not prosecdef from pg_proc where oid=to_regprocedure('public.freeze_symbolic_run_lens_v1(uuid,timestamptz)')),false),'freeze keeps caller ownership and SECURITY INVOKER');
select ok(coalesce((select not prosecdef from pg_proc where oid=to_regprocedure('public.set_symbolic_future_attachment_v1(uuid,integer,uuid,boolean,text)')),false),'future consent keeps SECURITY INVOKER');
select ok(not coalesce(has_function_privilege('anon',to_regprocedure('public.freeze_symbolic_run_lens_v1(uuid,timestamptz)'),'EXECUTE'),true),'anonymous users cannot freeze symbolic account data');
select ok(not coalesce(has_function_privilege('authenticated',to_regprocedure('public.set_symbolic_future_attachment_v1(uuid,integer,uuid,boolean,text)'),'EXECUTE'),true),'browser users cannot forge grant records');
select ok(coalesce(has_function_privilege('service_role',to_regprocedure('public.set_symbolic_future_attachment_v1(uuid,integer,uuid,boolean,text)'),'EXECUTE'),false),'verified server route can call the future consent writer');
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

create temporary table symbolic_bridge_fixture on commit drop as select
 '00000000-0000-0000-0000-00000000e501'::uuid owner_id,
 '00000000-0000-4000-8000-00000000d911'::uuid save_key,
 'symbolic_lens_00000000-0000-4000-8000-00000000d999'::text trace,
 jsonb_build_object('birthDate','1990-03-12','birthTime',null) source,
 jsonb_build_object('version','formal-symbolic-frame-v1','ruleVersion','symbolic-product-rules-v1','sourceVersion',1,
 'referencePeriod',jsonb_build_object('key',to_char(clock_timestamp() at time zone 'Asia/Shanghai','YYYY-MM'),'referenceDate',to_char(clock_timestamp() at time zone 'Asia/Shanghai','YYYY-MM-DD'),'structureKey',public.symbolic_calendar_period_v1(clock_timestamp())->>'structureKey','timezone','Asia/Shanghai','granularity','month'),
 'classification','symbolic_lens','methodKind','explicit_product_symbolic_rules','causalUse',false,
 'calculation',jsonb_build_object('calculationVersion','local-pillar-approximation-v1','precision','date_only','inputUsed',jsonb_build_array('birthDate'),'usesSolarTermApproximation',true,'usesTrueSolarTime',false,'birthTimezoneCorrection',false,'pillarsAvailable',3,'natalDayElement','wood','natalStrongestElement','wood','periodYearElement','fire','periodMonthElement','fire','groupCounts',jsonb_build_object('peer',1,'expression',0,'resource',0,'responsibility',0,'support',0)),
 'dimensions',(select jsonb_agg(jsonb_build_object('key',k,'label','Bounded topic','value','Structural comparison','summary','Symbolic product rule only','ruleId',r,'sourceRefs',jsonb_build_array('natal_stem_counts'),'limitations',jsonb_build_array('Not reality evidence')) order by n) from unnest(array['initial_tendency','relationship_sensitivity','rhythm','symbolic_support_tension','observation_window'],array['natal-group-max-v1','natal-relation-presence-v1','period-channel-match-v1','period-element-relation-v1','coarse-period-review-v1']) with ordinality t(k,r,n)),
 'limitations',jsonb_build_array('Approximate solar boundaries','No civil time correction','Not a prediction')) frame;

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
grant select on symbolic_bridge_fixture to service_role,authenticated;
create temporary table symbolic_bridge_reservations(label text,accepted_at timestamptz,simulation_start_at timestamptz,frozen_source_input jsonb,run jsonb);
grant select,insert on symbolic_bridge_reservations to authenticated;
set local role service_role;
do $$ begin perform public.persist_symbolic_lens_v1(f.owner_id,0,f.save_key,'replace_source',f.source,f.frame,f.trace) from symbolic_bridge_fixture f; end $$;
reset role;
select ok((select not future_attachment_consent and future_attachment_consent_id is null from public.symbolic_lens_preferences where user_id=(select owner_id from symbolic_bridge_fixture)),'new source defaults to no future Run authorization');
set local role authenticated;
insert into symbolic_bridge_reservations select 'unauthorized',r.* from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-00000000d921',30,null) r;
select is((select frozen_source_input#>>'{symbolic_lens,status}' from symbolic_bridge_reservations where label='unauthorized'),'not_authorized','without a third consent no personal frame is attached');
select ok((select frozen_source_input#>'{symbolic_lens,frame}'='null'::jsonb and not (frozen_source_input::text like '%birthDate%' or frozen_source_input::text like '%1990-03-12%') from symbolic_bridge_reservations where label='unauthorized'),'reservation omits both raw birth values and unapproved personal frame');
select throws_ok($$select * from public.set_symbolic_future_attachment_v1((select owner_id from symbolic_bridge_fixture),1,gen_random_uuid(),true,'symbolic_attachment_00000000-0000-4000-8000-00000000d999')$$,'42501',null,'caller-authenticated browser role cannot use the consent writer');
reset role;
set local role service_role;
select throws_ok($$select * from public.set_symbolic_future_attachment_v1((select owner_id from symbolic_bridge_fixture),1,gen_random_uuid(),null,'symbolic_attachment_00000000-0000-4000-8000-00000000d999')$$,'P0001','invalid_symbolic_input','SQL NULL cannot masquerade as explicit enablement');
select throws_ok($$select * from public.set_symbolic_future_attachment_v1((select owner_id from symbolic_bridge_fixture),null,gen_random_uuid(),true,'symbolic_attachment_00000000-0000-4000-8000-00000000d999')$$,'P0001','invalid_symbolic_input','NULL revision is rejected before grant');
select throws_ok($$select * from public.set_symbolic_future_attachment_v1(null,1,gen_random_uuid(),true,'symbolic_attachment_00000000-0000-4000-8000-00000000d999')$$,'P0001','symbolic_owner_invalid','grant rejects a NULL owner');
select ok((select not r.idempotent and r.future_attachment_consent from public.set_symbolic_future_attachment_v1((select owner_id from symbolic_bridge_fixture),1,'00000000-0000-4000-8000-00000000d922',true,'symbolic_attachment_00000000-0000-4000-8000-00000000d999') r),'explicit third scope appends a real grant');
select ok((select r.idempotent and r.revision=2 from public.set_symbolic_future_attachment_v1((select owner_id from symbolic_bridge_fixture),1,'00000000-0000-4000-8000-00000000d922',true,'symbolic_attachment_00000000-0000-4000-8000-00000000d999') r),'grant retry restores current state without an extra event');
select throws_ok($$select * from public.set_symbolic_future_attachment_v1((select owner_id from symbolic_bridge_fixture),1,'00000000-0000-4000-8000-00000000d922',false,'symbolic_attachment_00000000-0000-4000-8000-00000000d999')$$,'P0001','symbolic_idempotency_conflict','same grant key cannot change the explicit choice');
select ok((select not r.future_attachment_consent and r.storage_consent and r.calculation_consent from public.set_symbolic_future_attachment_v1((select owner_id from symbolic_bridge_fixture),2,'00000000-0000-4000-8000-00000000d923',false,'symbolic_attachment_00000000-0000-4000-8000-00000000d999') r),'switch off affects only future attachment and preserves storage/calculation');
do $$ begin perform public.set_symbolic_future_attachment_v1((select owner_id from symbolic_bridge_fixture),3,'00000000-0000-4000-8000-00000000d924',true,'symbolic_attachment_00000000-0000-4000-8000-00000000d999'); end $$;
reset role;
set local role authenticated;
insert into symbolic_bridge_reservations select 'attached',r.* from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-00000000d925',30,null) r;
select is((select frozen_source_input#>>'{symbolic_lens,status}' from symbolic_bridge_reservations where label='attached'),'attached','a new accepted Run freezes the granted current personal frame');
select ok((select public.valid_frozen_symbolic_run_v1(frozen_source_input->'symbolic_lens',(select owner_id from symbolic_bridge_fixture),accepted_at) from symbolic_bridge_reservations where label='attached'),'the new frozen envelope validates exact acceptance clock and lineage');
select ok((select frozen_source_input#>>'{symbolic_lens,frame,calculation,precision}'='date_only' and frozen_source_input#>'{symbolic_lens,frame,calculation,inputUsed}'='["birthDate"]'::jsonb from symbolic_bridge_reservations where label='attached'),'date-only input retains three-pillar precision without fabricated time');
select ok((select frozen_source_input#>>'{symbolic_lens,provenance,consentRevision}'='4' and frozen_source_input#>>'{symbolic_lens,provenance,consentVersion}'='symbolic-future-attachment-v1' from symbolic_bridge_reservations where label='attached'),'frozen attachment records the exact consent contract/revision');
select ok((select frozen_source_input#>'{symbolic_lens,frame}'=(select frame from symbolic_bridge_fixture) and frozen_source_input#>>'{symbolic_lens,provenance,sourceVersion}'='1' from symbolic_bridge_reservations where label='attached'),'original rule/calculation/referencePeriod and source version freeze together');
reset role;
set local role service_role;
do $$ begin perform public.withdraw_symbolic_lens_v1(f.owner_id,4,'00000000-0000-4000-8000-00000000d926',f.trace) from symbolic_bridge_fixture f; end $$;
select ok((select r.idempotent and not r.future_attachment_consent from public.set_symbolic_future_attachment_v1((select owner_id from symbolic_bridge_fixture),3,'00000000-0000-4000-8000-00000000d924',true,'symbolic_attachment_00000000-0000-4000-8000-00000000d999') r),'old grant retry after full withdrawal does not reactivate it');
select throws_ok($$select * from public.set_symbolic_future_attachment_v1((select owner_id from symbolic_bridge_fixture),5,gen_random_uuid(),true,'symbolic_attachment_00000000-0000-4000-8000-00000000d999')$$,'P0001','symbolic_consent_required','withdrawn calculation/storage cannot be bypassed by future consent');
reset role;
set local role authenticated;
insert into symbolic_bridge_reservations select 'retry_after_withdraw',r.* from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-00000000d925',30,null) r;
select ok((select a.frozen_source_input=b.frozen_source_input and a.accepted_at=b.accepted_at from symbolic_bridge_reservations a join symbolic_bridge_reservations b on b.label='retry_after_withdraw' where a.label='attached'),'queued accepted same-key retry restores the entire original frozen source after withdrawal');
insert into symbolic_bridge_reservations select 'withdrawn_new',r.* from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-00000000d927',90,null) r;
select is((select frozen_source_input#>>'{symbolic_lens,status}' from symbolic_bridge_reservations where label='withdrawn_new'),'withdrawn','a new 90-day admission after withdrawal has no attached frame');
reset role;
set local role service_role;
do $$ begin perform public.persist_symbolic_lens_v1(f.owner_id,5,'00000000-0000-4000-8000-00000000d928','replace_source',f.source||'{"birthDate":"1991-04-14"}'::jsonb,jsonb_set(f.frame,'{sourceVersion}','6'),f.trace) from symbolic_bridge_fixture f; end $$;
reset role;
select ok((select not future_attachment_consent and future_attachment_consent_id is null and source_version=6 from public.symbolic_lens_preferences where user_id=(select owner_id from symbolic_bridge_fixture)),'replacing the birth source requires a new explicit attachment grant');
set local role service_role;
do $$ begin perform public.set_symbolic_future_attachment_v1((select owner_id from symbolic_bridge_fixture),6,'00000000-0000-4000-8000-00000000d929',true,'symbolic_attachment_00000000-0000-4000-8000-00000000d999'); end $$;
do $$ begin perform public.persist_symbolic_lens_v1(f.owner_id,7,'00000000-0000-4000-8000-00000000d930','refresh_period',null,jsonb_set(f.frame,'{sourceVersion}','6'),f.trace) from symbolic_bridge_fixture f; end $$;
reset role;
select ok((select not future_attachment_consent and future_attachment_consent_id is null and revision=8 from public.symbolic_lens_preferences where user_id=(select owner_id from symbolic_bridge_fixture)),'refreshing a period resets the old attachment grant');
set local role authenticated;
insert into symbolic_bridge_reservations select 'retry_after_replace_refresh',r.* from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-00000000d925',30,null) r;
select ok((select a.frozen_source_input=b.frozen_source_input from symbolic_bridge_reservations a join symbolic_bridge_reservations b on b.label='retry_after_replace_refresh' where a.label='attached'),'queued retry also preserves sourceVersion one after a new birth source and period refresh');
reset role;
create temporary table symbolic_bridge_bundle as select pg_temp.reservation_bundle(frozen_source_input,accepted_at,simulation_start_at,'00000000-0000-4000-8000-00000000d925') bundle from symbolic_bridge_reservations where label='attached';
grant select on symbolic_bridge_bundle to authenticated;
select ok((select public.formal_run_bundle_matches_reservation_before_symbolic(b.bundle,r.frozen_source_input,r.accepted_at,r.simulation_start_at,30) from symbolic_bridge_bundle b cross join symbolic_bridge_reservations r where r.label='attached'),'existing source/time matcher accepts the unchanged original bundle');
select ok((select public.formal_run_bundle_matches_reservation(b.bundle,r.frozen_source_input,r.accepted_at,r.simulation_start_at,30) from symbolic_bridge_bundle b cross join symbolic_bridge_reservations r where r.label='attached'),'new symbolic matcher accepts original frozen provenance after account changes');
set local role authenticated;
select throws_ok($$select * from public.persist_account_sandbox_run_m1((select owner_id from symbolic_bridge_fixture),(select graph_id from reservation_fixture),'00000000-0000-4000-8000-00000000d925',30,jsonb_set((select bundle from symbolic_bridge_bundle),'{symbolicLensSnapshot,provenance,sourceVersion}','6'))$$,'P0001','invalid_run_bundle','completion cannot silently replace the original frozen source version');
select throws_ok($$select * from public.persist_account_sandbox_run_m1((select owner_id from symbolic_bridge_fixture),(select graph_id from reservation_fixture),'00000000-0000-4000-8000-00000000d925',30,jsonb_set((select bundle from symbolic_bridge_bundle),'{symbolicLensSnapshot,frame,ruleVersion}','"forged-rule-v9"'))$$,'P0001','invalid_run_bundle','completion cannot alter symbolic rules');
select throws_ok($$select * from public.persist_account_sandbox_run_m1((select owner_id from symbolic_bridge_fixture),(select graph_id from reservation_fixture),'00000000-0000-4000-8000-00000000d925',30,(select bundle||jsonb_build_object('strategyPaths',jsonb_build_object('paths',jsonb_build_array(jsonb_build_object('bundle',bundle),jsonb_build_object('bundle',jsonb_set(bundle,'{symbolicLensSnapshot,status}','"withdrawn"'))))) from symbolic_bridge_bundle))$$,'P0001','invalid_run_bundle','both strategy paths must preserve the same frozen symbolic envelope');
select throws_ok($$select * from public.persist_account_sandbox_run_m1((select owner_id from symbolic_bridge_fixture),(select graph_id from reservation_fixture),'00000000-0000-4000-8000-00000000d925',30,(select jsonb_set(bundle,'{sourceBoundary}',(bundle->'sourceBoundary')||jsonb_build_object('evidenceSource',bundle#>'{symbolicLensSnapshot,provenance,snapshotId}')) from symbolic_bridge_bundle))$$,'P0001','invalid_run_bundle','a symbolic provenance reference cannot masquerade as Reality evidence');
reset role;
select is((select count(*) from public.simulations where user_id=(select owner_id from symbolic_bridge_fixture)),0::bigint,'invalid attachment completion rolls back every Run artifact');
select is((select status::text from public.generation_jobs where user_id=(select owner_id from symbolic_bridge_fixture) and idempotency_key='00000000-0000-4000-8000-00000000d925'),'queued','failed completion retains the original reservation');
set local role authenticated;
create temporary table symbolic_bridge_completed as select * from public.persist_account_sandbox_run_m1((select owner_id from symbolic_bridge_fixture),(select graph_id from reservation_fixture),'00000000-0000-4000-8000-00000000d925',30,(select bundle from symbolic_bridge_bundle));
select ok((select not idempotent and run->>'status'='completed' from symbolic_bridge_completed),'the accepted pre-withdrawal frame completes using its original consent without rereading current preferences');
insert into symbolic_bridge_reservations select 'completed_retry',r.* from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-00000000d925',30,null) r;
select ok((select frozen_source_input is null and run=(select run from symbolic_bridge_completed) from symbolic_bridge_reservations where label='completed_retry'),'completed retry restores the original Run without source disclosure or regeneration');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000f501',true);
select throws_ok($$select public.freeze_symbolic_run_lens_v1((select owner_id from symbolic_bridge_fixture),clock_timestamp())$$,'42501','unauthenticated','one owner cannot read another owner through the freeze helper');
select throws_ok($$select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),gen_random_uuid(),30,null)$$,'P0001','graph_not_found','foreign owner cannot admit an attached Run');
reset role;
set local role anon;
select throws_ok($$select public.freeze_symbolic_run_lens_v1(null,clock_timestamp())$$,'42501',null,'anonymous role has no private freeze capability');
reset role;
select is((select symbolic_lens_snapshot from public.simulations where user_id=(select owner_id from symbolic_bridge_fixture)),(select frozen_source_input->'symbolic_lens' from symbolic_bridge_reservations where label='attached'),'canonical history retains the original immutable real symbolic snapshot');
select is((select count(*) from public.symbolic_birth_sources where user_id=(select owner_id from symbolic_bridge_fixture)),2::bigint,'replacement appends source history while queued/completed recovery never creates a new source');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000e501',true);
select set_config('request.jwt.claims','{"is_anonymous":true}',true);
set local role authenticated;
select throws_ok($$select public.freeze_symbolic_run_lens_v1((select owner_id from symbolic_bridge_fixture),clock_timestamp())$$,'42501','unauthenticated','an authenticated-role anonymous claim cannot freeze personal account data');
select throws_ok($$select * from public.reserve_account_sandbox_run((select graph_id from reservation_fixture),'00000000-0000-4000-8000-00000000d935',30,null)$$,'42501','unauthenticated','anonymous auth cannot admit a new symbolic Run');
reset role;
select set_config('request.jwt.claims','{}',true);
set local role authenticated;
select ok(public.freeze_symbolic_run_lens_v1((select owner_id from symbolic_bridge_fixture),clock_timestamp()) is not null,'old legal tokens without an anonymous flag retain owner-scoped compatibility');
reset role;
select * from finish();
rollback;
