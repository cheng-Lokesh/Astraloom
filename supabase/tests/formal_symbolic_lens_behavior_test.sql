begin;
select no_plan();
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,is_anonymous) values
 ('00000000-0000-4000-8000-00000000d901','00000000-0000-0000-0000-000000000000','authenticated','authenticated','symbolic-a@example.test','',now(),'{"provider":"email"}','{}',now(),now(),false),
 ('00000000-0000-4000-8000-00000000d902','00000000-0000-0000-0000-000000000000','authenticated','authenticated','symbolic-b@example.test','',now(),'{"provider":"email"}','{}',now(),now(),false),
 ('00000000-0000-4000-8000-00000000d903','00000000-0000-0000-0000-000000000000','authenticated','authenticated',null,'',now(),'{}','{}',now(),now(),true);
create temporary table symbolic_fixture on commit drop as select
 '00000000-0000-4000-8000-00000000d901'::uuid owner_id,
 '00000000-0000-4000-8000-00000000d911'::uuid save_key,
 'symbolic_lens_00000000-0000-4000-8000-00000000d999'::text trace,
 jsonb_build_object('birthDate','1990-03-12','birthTime',null) source,
 jsonb_build_object('version','formal-symbolic-frame-v1','ruleVersion','symbolic-product-rules-v1','sourceVersion',1,
 'referencePeriod',jsonb_build_object('key',to_char(clock_timestamp() at time zone 'Asia/Shanghai','YYYY-MM'),'referenceDate',to_char(clock_timestamp() at time zone 'Asia/Shanghai','YYYY-MM-DD'),'structureKey','bing_wu_ding_you','timezone','Asia/Shanghai','granularity','month'),
 'classification','symbolic_lens','methodKind','explicit_product_symbolic_rules','causalUse',false,
 'calculation',jsonb_build_object('calculationVersion','local-pillar-approximation-v1','precision','date_only','inputUsed',jsonb_build_array('birthDate'),'usesSolarTermApproximation',true,'usesTrueSolarTime',false,'birthTimezoneCorrection',false,'pillarsAvailable',3,'natalDayElement','wood','natalStrongestElement','wood','periodYearElement','fire','periodMonthElement','fire','groupCounts',jsonb_build_object('peer',1,'expression',0,'resource',0,'responsibility',0,'support',0)),
 'dimensions',(select jsonb_agg(jsonb_build_object('key',k,'label','Bounded topic','value','Structural comparison','summary','Symbolic product rule only','ruleId',r,'sourceRefs',jsonb_build_array('natal_stem_counts'),'limitations',jsonb_build_array('Not reality evidence')) order by n) from unnest(array['initial_tendency','relationship_sensitivity','rhythm','symbolic_support_tension','observation_window'],array['natal-group-max-v1','natal-relation-presence-v1','period-channel-match-v1','period-element-relation-v1','coarse-period-review-v1']) with ordinality t(k,r,n)),
 'limitations',jsonb_build_array('Approximate solar boundaries','No civil time correction','Not a prediction')) frame;
create temporary table symbolic_results (like public.symbolic_lens_preferences including defaults) on commit drop;
grant select on symbolic_fixture to service_role,authenticated;

set local role service_role;
select lives_ok($$select * from symbolic_fixture f cross join lateral public.persist_symbolic_lens_v1(f.owner_id,0,f.save_key,'replace_source',f.source,f.frame,f.trace)$$,'consented owner source and snapshot persist atomically');
reset role;
select is((select revision from public.symbolic_lens_preferences where user_id=(select owner_id from symbolic_fixture)),1,'first save creates revision one');
select is((select count(*) from public.symbolic_birth_sources where user_id=(select owner_id from symbolic_fixture)),1::bigint,'one immutable source version is stored');
select is((select count(*) from public.symbolic_lens_snapshots where user_id=(select owner_id from symbolic_fixture)),1::bigint,'one generated snapshot is stored');
select is((select count(*) from public.consent_events where user_id=(select owner_id from symbolic_fixture) and source='formal_symbolic_lens_v1'),2::bigint,'storage and calculation have separate consent events');
select ok((select not future_attachment_consent from public.symbolic_lens_preferences where user_id=(select owner_id from symbolic_fixture)),'unconnected future attachment remains false');
select ok(not exists(select 1 from public.consent_events where user_id=(select owner_id from symbolic_fixture) and metadata::text like '%birthDate%'),'consent metadata does not contain birth input');
set local role service_role;
select ok((select r.idempotent from symbolic_fixture f cross join lateral public.persist_symbolic_lens_v1(f.owner_id,0,f.save_key,'replace_source',f.source,f.frame,f.trace) r),'exact save retry is idempotent');
select throws_ok($$select * from symbolic_fixture f cross join lateral public.persist_symbolic_lens_v1(f.owner_id,0,f.save_key,'replace_source',f.source,jsonb_set(f.frame,'{dimensions,0,value}','"Different"'),f.trace)$$,'P0001','symbolic_idempotency_conflict','same key cannot rewrite the frame');
select lives_ok($$select * from symbolic_fixture f cross join lateral public.persist_symbolic_lens_v1(f.owner_id,1,'00000000-0000-4000-8000-00000000d912','refresh_period',null,f.frame,f.trace)$$,'explicit refresh reuses the consented source');
select throws_ok($$select * from symbolic_fixture f cross join lateral public.persist_symbolic_lens_v1(f.owner_id,1,'00000000-0000-4000-8000-00000000d913','refresh_period',null,f.frame,f.trace)$$,'P0001','symbolic_revision_conflict','stale revision cannot overwrite a newer snapshot');
select ok((select r.idempotent and r.revision=2 from symbolic_fixture f cross join lateral public.recover_symbolic_lens_v1(f.owner_id,1,'00000000-0000-4000-8000-00000000d912','refresh_period',null) r),'HTTP recovery bypasses obsolete refresh revision without recalculating');
select throws_ok($$select * from symbolic_fixture f cross join lateral public.recover_symbolic_lens_v1(f.owner_id,0,f.save_key,'refresh_period',null)$$,'P0001','symbolic_idempotency_conflict','same key with different operation is rejected');
select throws_ok($$select * from symbolic_fixture f cross join lateral public.recover_symbolic_lens_v1(f.owner_id,1,f.save_key,'replace_source',f.source)$$,'P0001','symbolic_idempotency_conflict','same key with different revision is rejected');
select throws_ok($$select * from symbolic_fixture f cross join lateral public.recover_symbolic_lens_v1(f.owner_id,0,f.save_key,'replace_source',f.source||jsonb_build_object('birthTime','12:00'))$$,'P0001','symbolic_idempotency_conflict','same key with changed source is rejected');
select throws_ok($$select * from symbolic_fixture f cross join lateral public.persist_symbolic_lens_v1('00000000-0000-4000-8000-00000000d903',0,'00000000-0000-4000-8000-00000000d914','replace_source',f.source,f.frame,f.trace)$$,'P0001','symbolic_owner_invalid','Auth anonymous owner cannot generate a lens');
select throws_ok($$select * from symbolic_fixture f cross join lateral public.persist_symbolic_lens_v1(null,0,'00000000-0000-4000-8000-00000000d914','replace_source',f.source,f.frame,f.trace)$$,'P0001','symbolic_owner_invalid','null owner cannot generate a lens');
select throws_ok($$select * from symbolic_fixture f cross join lateral public.persist_symbolic_lens_v1('00000000-0000-4000-8000-00000000d902',0,'00000000-0000-4000-8000-00000000d915','refresh_period',null,f.frame,f.trace)$$,'P0001','symbolic_consent_required','other owner cannot reuse this source via refresh');
select throws_ok($$select * from symbolic_fixture f cross join lateral public.persist_symbolic_lens_v1(f.owner_id,2,'00000000-0000-4000-8000-00000000d916','refresh_period',null,jsonb_set(f.frame,'{dimensions,0,value}',f.source->'birthDate'),f.trace)$$,'P0001','invalid_symbolic_input','generated output rejects raw birth values');
select throws_ok($$select * from symbolic_fixture f cross join lateral public.persist_symbolic_lens_v1(f.owner_id,2,'00000000-0000-4000-8000-00000000d916','refresh_period',null,jsonb_set(f.frame,'{calculation,precision}','null'),f.trace)$$,'P0001','invalid_symbolic_input','null precision cannot bypass validation');
select throws_ok($$select * from symbolic_fixture f cross join lateral public.persist_symbolic_lens_v1(f.owner_id,2,'00000000-0000-4000-8000-00000000d916','replace_source',f.source||'{"gender":"unused"}',jsonb_set(f.frame,'{sourceVersion}','3'),f.trace)$$,'P0001','invalid_symbolic_input','unused source fields are rejected');
reset role;
select is((select count(*) from public.symbolic_birth_sources where user_id=(select owner_id from symbolic_fixture)),1::bigint,'refresh and rejected writes do not duplicate sources');
select is((select count(*) from public.symbolic_lens_snapshots where user_id=(select owner_id from symbolic_fixture)),2::bigint,'refresh appends a snapshot without modifying history');

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000d901',true);
select is((select count(*) from public.symbolic_birth_sources),1::bigint,'owner reads only own source');
select is((select count(*) from public.symbolic_lens_snapshots),2::bigint,'owner reads only own generated history');
select is((select count(*) from public.symbolic_lens_preferences),1::bigint,'owner reads own active preferences');
select throws_ok($$update public.symbolic_lens_preferences set calculation_consent=false$$,'42501',null,'browser cannot directly alter consent pointers');
select throws_ok($$delete from public.symbolic_birth_sources$$,'42501',null,'browser cannot directly delete sources');
select throws_ok($$insert into public.symbolic_lens_snapshots(user_id,source_id,source_version,calculation_consent_id,frame) select owner_id,owner_id,1,owner_id,frame from symbolic_fixture$$,'42501',null,'browser cannot directly insert generated output');
select throws_ok($$select * from public.withdraw_symbolic_lens_v1('00000000-0000-4000-8000-00000000d901',2,'00000000-0000-4000-8000-00000000d917','symbolic_lens_00000000-0000-4000-8000-00000000d999')$$,'42501',null,'browser cannot invoke service withdrawal');
select throws_ok($$select * from public.recover_symbolic_lens_v1('00000000-0000-4000-8000-00000000d901',0,'00000000-0000-4000-8000-00000000d911','refresh_period',null)$$,'42501',null,'browser cannot invoke receipt recovery');
select throws_ok($$insert into public.consent_events(user_id,consent_type,status,source) values(auth.uid(),'symbolic_calculation','active','app')$$,'P0001','symbolic_consent_writer_required','browser cannot forge symbolic consent in the existing ledger');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000d902',true);
select is((select count(*) from public.symbolic_birth_sources),0::bigint,'foreign owner cannot read private birth input');
select is((select count(*) from public.symbolic_lens_snapshots),0::bigint,'foreign owner cannot read snapshots');
select is((select count(*) from public.symbolic_lens_preferences),0::bigint,'foreign owner cannot read active pointers');
reset role;
set local role anon;
select throws_ok($$select * from public.symbolic_birth_sources$$,'42501',null,'anon cannot read birth sources');
select throws_ok($$select * from public.symbolic_lens_preferences$$,'42501',null,'anon cannot read preferences');
reset role;
select throws_ok($$update public.symbolic_lens_snapshots set frame='{}'$$,'P0001','symbolic_history_immutable','generated history cannot be rewritten even with DML privilege');
set local role service_role;
select throws_ok($$update public.symbolic_lens_snapshots set frame='{}'$$,'42501',null,'service has no snapshot UPDATE grant');
select ok((select not r.storage_consent and not r.calculation_consent and not r.future_attachment_consent and r.current_snapshot is null from symbolic_fixture f cross join lateral public.withdraw_symbolic_lens_v1(f.owner_id,2,'00000000-0000-4000-8000-00000000d917',f.trace) r),'withdrawal closes all future use and clears active pointer');
select ok((select r.idempotent from symbolic_fixture f cross join lateral public.withdraw_symbolic_lens_v1(f.owner_id,2,'00000000-0000-4000-8000-00000000d917',f.trace) r),'withdrawal retry is idempotent');
select throws_ok($$select * from symbolic_fixture f cross join lateral public.persist_symbolic_lens_v1(f.owner_id,3,'00000000-0000-4000-8000-00000000d918','refresh_period',null,f.frame,f.trace)$$,'P0001','symbolic_consent_required','withdrawn lens cannot refresh or calculate');
select ok((select not r.calculation_consent and r.current_snapshot is null from symbolic_fixture f cross join lateral public.persist_symbolic_lens_v1(f.owner_id,0,f.save_key,'replace_source',f.source,f.frame,f.trace) r),'old save replay after withdrawal never reactivates consent');
select ok((select not r.calculation_consent and r.current_snapshot is null and r.idempotent from symbolic_fixture f cross join lateral public.recover_symbolic_lens_v1(f.owner_id,0,f.save_key,'replace_source',f.source) r),'receipt-first old save recovery remains withdrawn');
select ok((select not r.calculation_consent and r.current_snapshot is null and r.idempotent from symbolic_fixture f cross join lateral public.recover_symbolic_lens_v1(f.owner_id,1,'00000000-0000-4000-8000-00000000d912','refresh_period',null) r),'receipt-first old refresh recovery remains withdrawn');
reset role;
select is((select count(*) from public.symbolic_lens_snapshots where user_id=(select owner_id from symbolic_fixture)),2::bigint,'withdrawal preserves immutable history without claiming deletion');
select is((select count(*) from public.consent_events where user_id=(select owner_id from symbolic_fixture) and source='formal_symbolic_lens_v1' and status='withdrawn'),3::bigint,'all three scopes have auditable withdrawal events');
select * from finish();
rollback;
