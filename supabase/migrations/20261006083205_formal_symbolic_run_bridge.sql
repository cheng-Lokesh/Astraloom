begin;
-- Calendar-only parity with currentSymbolicPeriod/calculateFourPillars. No
-- personal source is consumed here; dates are server-assigned at admission.
create function public.symbolic_calendar_period_v1(p_at timestamptz) returns jsonb
language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare d date; y integer; mmdd integer; mi integer; yi integer;
  stems text[]:=array['jia','yi','bing','ding','wu','ji','geng','xin','ren','gui'];
  branches text[]:=array['zi','chou','yin','mao','chen','si','wu','wei','shen','you','xu','hai'];
  months text[]:=array['yin','mao','chen','si','wu','wei','shen','you','xu','hai','zi','chou'];
begin
  if p_at is null then return null; end if;
  d:=(p_at at time zone 'Asia/Shanghai')::date;
  if d<date '2000-01-01' or d>=date '2100-01-01' then return null; end if;
  y:=extract(year from d)::integer; mmdd:=extract(month from d)::integer*100+extract(day from d)::integer;
  if mmdd<204 then y:=y-1; end if;
  yi:=(y-4)%10;
  mi:=case when mmdd>=1207 or mmdd<106 then 10 when mmdd>=1107 then 9 when mmdd>=1008 then 8
    when mmdd>=907 then 7 when mmdd>=807 then 6 when mmdd>=707 then 5 when mmdd>=606 then 4
    when mmdd>=506 then 3 when mmdd>=405 then 2 when mmdd>=306 then 1 when mmdd>=204 then 0 else 11 end;
  return jsonb_build_object('key',to_char(d,'YYYY-MM'),'referenceDate',d::text,
    'structureKey',stems[yi+1]||'_'||branches[(y-4)%12+1]||'_'||stems[(yi*2+mi+2)%10+1]||'_'||months[mi+1],
    'timezone','Asia/Shanghai','granularity','month');
end $$;
revoke all on function public.symbolic_calendar_period_v1(timestamptz) from public,anon;
grant execute on function public.symbolic_calendar_period_v1(timestamptz) to authenticated,service_role;
-- Pure validators expose no account data and do not confer writer privileges.
grant execute on function public.symbolic_keys_v1(jsonb,text[]),public.valid_symbolic_frame_v1(jsonb) to authenticated;

alter table public.symbolic_lens_preferences drop constraint symbolic_lens_preferences_future_attachment_consent_check;
alter table public.symbolic_lens_preferences add column future_attachment_consent_id uuid,
  add constraint symbolic_future_consent_owner_fkey foreign key (future_attachment_consent_id,user_id) references public.consent_events(id,user_id),
  add constraint symbolic_future_consent_pointer_check check ((future_attachment_consent and future_attachment_consent_id is not null) or (not future_attachment_consent and future_attachment_consent_id is null));
create index symbolic_future_consent_owner_idx on public.symbolic_lens_preferences(future_attachment_consent_id,user_id);
create unique index symbolic_future_consent_receipt_idx on public.consent_events(user_id,(metadata->>'request_key'))
  where consent_type='symbolic_future_attachment' and source='formal_symbolic_future_attachment_v1';

-- Old source/refresh/withdraw writers already set the boolean false. Clearing
-- this pointer preserves their signature and requires a fresh explicit grant.
create function public.guard_symbolic_future_preference_v1() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  if not new.future_attachment_consent then new.future_attachment_consent_id:=null; return new; end if;
  if current_user<>'service_role' or current_setting('app.symbolic_future_attachment_rpc',true) is distinct from 'on'
    or not exists(select 1 from public.consent_events e where e.id=new.future_attachment_consent_id and e.user_id=new.user_id
      and e.consent_type='symbolic_future_attachment' and e.status='active' and e.source='formal_symbolic_future_attachment_v1'
      and e.metadata->>'version'='symbolic-future-attachment-v1' and e.metadata->>'revision'=new.revision::text
      and e.metadata->>'source_id'=new.source_id::text and e.metadata->>'source_version'=new.source_version::text
      and e.metadata->>'snapshot_id'=new.current_snapshot_id::text)
    or not new.storage_consent or not new.calculation_consent then raise exception 'symbolic_consent_required'; end if;
  return new;
end $$;
create trigger symbolic_future_preference_guard before insert or update on public.symbolic_lens_preferences
  for each row execute function public.guard_symbolic_future_preference_v1();
revoke all on function public.guard_symbolic_future_preference_v1() from public,anon,authenticated;

create function public.freeze_symbolic_run_lens_v1(p_owner_id uuid,p_at timestamptz) returns jsonb
language plpgsql stable security invoker set search_path=public,pg_temp as $$
declare pref record; period jsonb:=public.symbolic_calendar_period_v1(p_at); result jsonb; state text;
begin
  if p_owner_id is null or (current_user<>'service_role' and auth.uid() is distinct from p_owner_id)
    then raise exception using errcode='42501',message='unauthenticated'; end if;
  if period is null then raise exception 'invalid_symbolic_input'; end if;
  select p.revision,p.storage_consent,p.calculation_consent,p.future_attachment_consent,p.source_id,p.source_version,p.current_snapshot_id,
    s.frame,s.version,s.writer_version,s.calculation_consent_id,b.storage_consent_id,
    cs.status as storage_status,cs.consent_type as storage_type,cs.source as storage_source,
    cc.status as calculation_status,cc.consent_type as calculation_type,cc.source as calculation_source,
    cf.id as future_id,cf.status as future_status,cf.source as future_source,cf.consent_type as future_type,cf.metadata as future_metadata
    into pref from public.symbolic_lens_preferences p
    left join public.symbolic_birth_sources b on b.id=p.source_id and b.user_id=p.user_id and b.source_version=p.source_version
    left join public.symbolic_lens_snapshots s on s.id=p.current_snapshot_id and s.user_id=p.user_id and s.source_id=p.source_id and s.source_version=p.source_version
    left join public.consent_events cs on cs.id=b.storage_consent_id and cs.user_id=p.user_id
    left join public.consent_events cc on cc.id=s.calculation_consent_id and cc.user_id=p.user_id
    left join public.consent_events cf on cf.id=p.future_attachment_consent_id and cf.user_id=p.user_id
    where p.user_id=p_owner_id;
  if not found then state:='not_configured';
  elsif not pref.storage_consent or not pref.calculation_consent then state:='withdrawn';
  else
    if pref.frame is null or not public.valid_symbolic_frame_v1(pref.frame) or pref.frame->>'sourceVersion' is distinct from pref.source_version::text
      or pref.storage_status is distinct from 'active' or pref.storage_type is distinct from 'symbolic_storage' or pref.storage_source is distinct from 'formal_symbolic_lens_v1'
      or pref.calculation_status is distinct from 'active' or pref.calculation_type is distinct from 'symbolic_calculation' or pref.calculation_source is distinct from 'formal_symbolic_lens_v1'
      then raise exception 'symbolic_source_invalid'; end if;
    if pref.frame#>>'{referencePeriod,key}' is distinct from period->>'key' or pref.frame#>>'{referencePeriod,structureKey}' is distinct from period->>'structureKey'
      then state:='stale';
    elsif not pref.future_attachment_consent then state:='not_authorized';
    else
      if pref.future_id is null or pref.future_status is distinct from 'active' or pref.future_type is distinct from 'symbolic_future_attachment'
        or pref.future_source is distinct from 'formal_symbolic_future_attachment_v1' or pref.future_metadata->>'version' is distinct from 'symbolic-future-attachment-v1'
        or pref.future_metadata->>'revision' is distinct from pref.revision::text or pref.future_metadata->>'source_id' is distinct from pref.source_id::text
        or pref.future_metadata->>'source_version' is distinct from pref.source_version::text or pref.future_metadata->>'snapshot_id' is distinct from pref.current_snapshot_id::text
        then raise exception 'symbolic_consent_required'; end if;
      state:='attached';
    end if;
  end if;
  result:=jsonb_build_object('version','formal-symbolic-run-v1','classification','symbolic_lens','causalUse',false,
    'status',state,'frozenAt',to_char(p_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'assessedPeriod',period,
    'preferenceRevision',coalesce(pref.revision,0),'frame',null,'provenance',null);
  if state='attached' then result:=result||jsonb_build_object('frame',pref.frame,'provenance',jsonb_build_object(
    'ownerId',p_owner_id,'sourceId',pref.source_id,'sourceVersion',pref.source_version,'snapshotId',pref.current_snapshot_id,
    'snapshotVersion',pref.version,'writerVersion',pref.writer_version,'storageConsentId',pref.storage_consent_id,
    'calculationConsentId',pref.calculation_consent_id,'futureAttachmentConsentId',pref.future_id,
    'consentVersion','symbolic-future-attachment-v1','consentRevision',pref.revision)); end if;
  return result;
end $$;
revoke all on function public.freeze_symbolic_run_lens_v1(uuid,timestamptz) from public,anon;
grant execute on function public.freeze_symbolic_run_lens_v1(uuid,timestamptz) to authenticated,service_role;

create function public.set_symbolic_future_attachment_v1(p_user_id uuid,p_expected_revision integer,p_idempotency_key uuid,p_enabled boolean,p_trace_id text)
returns table(revision integer,storage_consent boolean,calculation_consent boolean,future_attachment_consent boolean,current_snapshot jsonb,idempotent boolean)
language plpgsql security invoker set search_path=public,extensions,pg_temp as $$
declare pref public.symbolic_lens_preferences%rowtype; receipt record; hash_value text; consent_id uuid; lens jsonb;
begin
  perform set_config('app.symbolic_future_attachment_rpc','off',true);
  if current_user<>'service_role' then raise exception 'symbolic_writer_required'; end if;
  if p_user_id is null or not exists(select 1 from auth.users u where u.id=p_user_id and u.deleted_at is null and not coalesce(u.is_anonymous,false)
    and (u.banned_until is null or u.banned_until<clock_timestamp())) then raise exception 'symbolic_owner_invalid'; end if;
  if p_expected_revision is null or p_expected_revision<0 or p_idempotency_key is null or p_enabled is null
    or p_trace_id is null or p_trace_id !~ '^symbolic_attachment_[0-9a-f-]{36}$' then raise exception 'invalid_symbolic_input'; end if;
  hash_value:=encode(digest(convert_to(jsonb_build_object('version','symbolic-future-attachment-v1','revision',p_expected_revision,'enabled',p_enabled)::text,'UTF8'),'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended('symbolic_lens_v1:'||p_user_id::text,0));
  select * into pref from public.symbolic_lens_preferences p where p.user_id=p_user_id for update;
  select e.metadata into receipt from public.consent_events e where e.user_id=p_user_id and e.consent_type='symbolic_future_attachment'
    and e.source='formal_symbolic_future_attachment_v1' and e.metadata->>'request_key'=p_idempotency_key::text;
  if found then
    if receipt.metadata->>'request_hash' is distinct from hash_value then raise exception 'symbolic_idempotency_conflict'; end if;
    return query select p.revision,p.storage_consent,p.calculation_consent,p.future_attachment_consent,
      case when s.id is null then null else jsonb_build_object('frame',s.frame) end,true
      from public.symbolic_lens_preferences p left join public.symbolic_lens_snapshots s on s.id=p.current_snapshot_id and s.user_id=p.user_id where p.user_id=p_user_id;
    return;
  end if;
  if pref.user_id is null or pref.revision<>p_expected_revision then raise exception 'symbolic_revision_conflict'; end if;
  if p_enabled then
    lens:=public.freeze_symbolic_run_lens_v1(p_user_id,date_trunc('milliseconds',clock_timestamp()));
    if lens->>'status'='stale' then raise exception 'symbolic_period_stale'; end if;
    if lens->>'status' not in ('attached','not_authorized') then raise exception 'symbolic_consent_required'; end if;
  end if;
  insert into public.consent_events(user_id,consent_type,status,source,metadata) values(p_user_id,'symbolic_future_attachment',
    case when p_enabled then 'active' else 'withdrawn' end,'formal_symbolic_future_attachment_v1',jsonb_build_object(
      'version','symbolic-future-attachment-v1','revision',pref.revision+1,'request_key',p_idempotency_key,'request_hash',hash_value,
      'source_id',pref.source_id,'source_version',pref.source_version,'snapshot_id',pref.current_snapshot_id)) returning id into consent_id;
  perform set_config('app.symbolic_future_attachment_rpc','on',true);
  update public.symbolic_lens_preferences p set revision=pref.revision+1,future_attachment_consent=p_enabled,
    future_attachment_consent_id=case when p_enabled then consent_id else null end,updated_at=clock_timestamp() where p.user_id=p_user_id;
  perform set_config('app.symbolic_future_attachment_rpc','off',true);
  return query select p.revision,p.storage_consent,p.calculation_consent,p.future_attachment_consent,
    case when s.id is null then null else jsonb_build_object('frame',s.frame) end,false
    from public.symbolic_lens_preferences p left join public.symbolic_lens_snapshots s on s.id=p.current_snapshot_id and s.user_id=p.user_id where p.user_id=p_user_id;
exception when others then perform set_config('app.symbolic_future_attachment_rpc','off',true); raise;
end $$;
revoke all on function public.set_symbolic_future_attachment_v1(uuid,integer,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.set_symbolic_future_attachment_v1(uuid,integer,uuid,boolean,text) to service_role;
create or replace function public.reserve_account_sandbox_run(p_graph_snapshot_id uuid,p_idempotency_key uuid,p_horizon_days integer,p_digital_life_rules jsonb default null)
returns table(accepted_at timestamptz,simulation_start_at timestamptz,frozen_source_input jsonb,run jsonb)
language plpgsql security invoker set search_path=public,extensions as $$
declare owner_id uuid:=auth.uid(); graph_row record; job_row record; source jsonb; content_hash text; profile_row jsonb; seed_row jsonb; agent_rows jsonb; edge_rows jsonb; feedback_rows jsonb; lens_row jsonb; now_at timestamptz;
begin
  perform set_config('app.formal_reservation_rpc','off',true);
  if owner_id is null then raise exception using errcode='42501',message='unauthenticated'; end if;
  if p_graph_snapshot_id is null or p_idempotency_key is null or p_horizon_days is null or p_horizon_days not in (30,90)
    or not public.formal_run_rules_valid(p_digital_life_rules) then raise exception using errcode='P0001',message='invalid_request'; end if;
  content_hash:=encode(digest(convert_to(jsonb_build_object('graph',p_graph_snapshot_id,'horizon',p_horizon_days,'rules',p_digital_life_rules,'version','formal-run-reservation-v1')::text,'UTF8'),'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text||':m1-run:'||p_idempotency_key::text,0));
  perform set_config('app.formal_reservation_rpc','on',true);
  select id,formal_content_hash,formal_accepted_at,formal_simulation_start_at,generation_jobs.frozen_source_input,simulation_id,status into job_row
    from public.generation_jobs where user_id=owner_id and job_type='formal_run_reservation' and idempotency_key=p_idempotency_key::text;
  if found then
    if job_row.formal_content_hash is distinct from content_hash then raise exception using errcode='P0001',message='idempotency_key_content_conflict'; end if;
    accepted_at:=job_row.formal_accepted_at; simulation_start_at:=job_row.formal_simulation_start_at;
    if job_row.status='completed' then
      select jsonb_build_object('id',id,'status',status,'seed_context_id',seed_context_id,'graph_snapshot_id',graph_snapshot_id,'time_horizon',time_horizon,'completed_at',completed_at) into run
        from public.simulations where id=job_row.simulation_id and user_id=owner_id and status='completed';
      if run is null then raise exception using errcode='P0001',message='persistence_failed'; end if;
      frozen_source_input:=null;
    else
      if clock_timestamp()>=simulation_start_at then raise exception using errcode='P0001',message='reservation_expired'; end if;
      frozen_source_input:=job_row.frozen_source_input; run:=null;
    end if;
    perform set_config('app.formal_reservation_rpc','off',true); return next; return;
  end if;
  -- Pre-reservation completed history can be recovered, never re-timed.
  select id,graph_snapshot_id,time_horizon,input_snapshot,created_at,completed_at,seed_context_id,status into job_row
    from public.simulations where user_id=owner_id and idempotency_key=p_idempotency_key::text and execution_version='formal-account-sandbox-m1-v1' and status='completed';
  if found then
    if job_row.graph_snapshot_id is distinct from p_graph_snapshot_id or job_row.time_horizon::text is distinct from p_horizon_days::text||'_days'
      or (p_digital_life_rules is not null and job_row.input_snapshot#>'{digitalLifeModel,rules}' is distinct from p_digital_life_rules)
      or (p_digital_life_rules is null and (coalesce(jsonb_array_length(job_row.input_snapshot#>'{digitalLifeModel,rules,actions}'),0)>0 or coalesce(jsonb_array_length(job_row.input_snapshot#>'{digitalLifeModel,rules,strategies}'),0)>0))
    then raise exception using errcode='P0001',message='idempotency_key_content_conflict'; end if;
    accepted_at:=job_row.created_at; simulation_start_at:=coalesce((job_row.input_snapshot->>'startedAt')::timestamptz,job_row.created_at);
    run:=jsonb_build_object('id',job_row.id,'status',job_row.status,'seed_context_id',job_row.seed_context_id,'graph_snapshot_id',job_row.graph_snapshot_id,'time_horizon',job_row.time_horizon,'completed_at',job_row.completed_at);
    frozen_source_input:=null; perform set_config('app.formal_reservation_rpc','off',true); return next; return;
  end if;
  select g.id,g.user_id,g.seed_context_id,g.agent_snapshot_id,g.graph_locked,g.locked_at,g.safety_level,g.version,a.safety_level as agent_safety,a.version as agent_snapshot_version into graph_row
    from public.relation_graph_snapshots g join public.agent_profile_snapshots a on a.id=g.agent_snapshot_id and a.user_id=g.user_id and a.seed_context_id=g.seed_context_id
    where g.id=p_graph_snapshot_id and g.user_id=owner_id and g.graph_locked and g.locked_at is not null;
  if not found then raise exception using errcode='P0001',message='graph_not_found'; end if;
  if graph_row.safety_level not in ('safe','caution') or graph_row.agent_safety not in ('safe','caution') then raise exception using errcode='P0001',message='safety_blocked'; end if;
  -- Symbolic writers share this owner lock. Replays above never read today's lens.
  perform pg_advisory_xact_lock(hashtextextended('symbolic_lens_v1:'||owner_id::text,0));
  now_at:=date_trunc('milliseconds',clock_timestamp()); accepted_at:=now_at; simulation_start_at:=now_at+interval '5 minutes';
  -- One SQL statement freezes every mutable source under one MVCC snapshot.
  select
    (select jsonb_build_object('id',s.id,'version',s.version,'submitted_at',s.submitted_at,'frozen_at',s.frozen_at,'user_question',s.user_question,'raw_context',s.raw_context,'safety_flags',s.safety_flags)
      from public.seed_contexts s where s.id=graph_row.seed_context_id and s.user_id=owner_id and s.status='submitted' and s.frozen_at is not null and s.submitted_at is not null and s.simulation_track='crossroad'),
    (select jsonb_agg(jsonb_build_object('id',a.id,'version',a.version,'display_name',a.display_name,'agent_type',a.agent_type,'evidence_refs',a.evidence_refs) order by a.id) from public.agent_profiles a where a.user_id=owner_id and a.seed_context_id=graph_row.seed_context_id and a.snapshot_id=graph_row.agent_snapshot_id),
    (select jsonb_agg(jsonb_build_object('id',e.id,'version',e.version,'from_agent_id',e.from_agent_id,'to_agent_id',e.to_agent_id,'relationship_type',e.relationship_type,'evidence_refs',e.evidence_refs) order by e.id) from public.relation_edges e where e.user_id=owner_id and e.graph_snapshot_id=graph_row.id and e.agent_snapshot_id=graph_row.agent_snapshot_id),
    (select to_jsonb(p) from (select id,user_id,seed_context_id,life_climate_value,life_climate_classification,life_climate_evidence_summary,resources_value,resources_classification,resources_evidence_summary,constraints_value,constraints_classification,constraints_evidence_summary,life_goals,core_values,life_themes,pressures,external_variables,life_model_domains,world_model_inputs,revision from public.reality_profiles where user_id=owner_id and seed_context_id=graph_row.seed_context_id) p),
    (select coalesce(jsonb_agg(to_jsonb(f) order by f.created_at desc,f.id desc),'[]'::jsonb) from (select id,version,rating,target_type,created_at from public.feedback_logs where user_id=owner_id and version in ('formal-run-feedback-m1-v1','formal-run-feedback-m2-v1') order by created_at desc,id desc limit 20) f)
     ,public.freeze_symbolic_run_lens_v1(owner_id,now_at)
    into seed_row,agent_rows,edge_rows,profile_row,feedback_rows,lens_row;
  if seed_row is null then raise exception using errcode='P0001',message='seed_not_found'; end if;
  if agent_rows is null or edge_rows is null or jsonb_array_length(agent_rows)>50 or jsonb_array_length(edge_rows)>200 then raise exception using errcode='P0001',message='incomplete_object_chain'; end if;
  if p_digital_life_rules is not null and (p_digital_life_rules->>'graphSnapshotId' is distinct from graph_row.id::text
    or p_digital_life_rules->>'agentSnapshotId' is distinct from graph_row.agent_snapshot_id::text
    or p_digital_life_rules->'profileRevision' is distinct from coalesce(profile_row->'revision','0'::jsonb)) then raise exception using errcode='P0001',message='invalid_request'; end if;
  source:=jsonb_build_object('relation_graph_snapshots',to_jsonb(graph_row)-'agent_safety','seed_contexts',seed_row,'agent_profiles',agent_rows,'relation_edges',edge_rows,'reality_profiles',profile_row,'feedback_logs',feedback_rows,
    'digital_life_rules',p_digital_life_rules,'symbolic_lens',lens_row,'symbolic_lens_version','formal-symbolic-run-v1','source_version','formal-run-reservation-v1');
  insert into public.generation_jobs(user_id,seed_context_id,trace_id,version,writer_version,idempotency_key,job_type,status,input_refs,formal_graph_snapshot_id,formal_content_hash,formal_accepted_at,formal_simulation_start_at,frozen_source_input)
    values(owner_id,graph_row.seed_context_id,gen_random_uuid()::text,'formal-run-reservation-v1','formal-run-reservation-v1',p_idempotency_key::text,'formal_run_reservation','queued',jsonb_build_object('graph_snapshot_id',graph_row.id),graph_row.id,content_hash,accepted_at,simulation_start_at,source);
  frozen_source_input:=source; run:=null; perform set_config('app.formal_reservation_rpc','off',true); return next;
exception when others then perform set_config('app.formal_reservation_rpc','off',true); raise;
end; $$;
revoke all on function public.reserve_account_sandbox_run(uuid,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.reserve_account_sandbox_run(uuid,uuid,integer,jsonb) to authenticated;

create function public.valid_frozen_symbolic_run_v1(lens jsonb,owner_id uuid,accepted_at timestamptz) returns boolean
language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare provenance jsonb; period jsonb; field text;
begin
  if owner_id is null or accepted_at is null or not public.symbolic_keys_v1(lens,array['version','classification','causalUse','status','frozenAt','assessedPeriod','preferenceRevision','frame','provenance'])
    or lens->>'version' is distinct from 'formal-symbolic-run-v1' or lens->>'classification' is distinct from 'symbolic_lens' or lens->'causalUse' is distinct from 'false'::jsonb
    or lens->>'status' is null or lens->>'status' not in ('attached','not_configured','not_authorized','stale','withdrawn')
    or jsonb_typeof(lens->'frozenAt') is distinct from 'string' or (lens->>'frozenAt')::timestamptz is distinct from accepted_at
    or jsonb_typeof(lens->'preferenceRevision') is distinct from 'number' or lens->>'preferenceRevision' !~ '^[0-9]+$'
    then return false; end if;
  period:=public.symbolic_calendar_period_v1(accepted_at);
  if period is null or lens->'assessedPeriod' is distinct from period then return false; end if;
  if lens->>'status'<>'attached' then return lens->'frame'='null'::jsonb and lens->'provenance'='null'::jsonb; end if;
  provenance:=lens->'provenance';
  if not public.valid_symbolic_frame_v1(lens->'frame') or not public.symbolic_keys_v1(provenance,array['ownerId','sourceId','sourceVersion','snapshotId','snapshotVersion','writerVersion','storageConsentId','calculationConsentId','futureAttachmentConsentId','consentVersion','consentRevision'])
    or provenance->>'ownerId' is distinct from owner_id::text or provenance->>'snapshotVersion' is distinct from 'formal-symbolic-frame-v1'
    or provenance->>'writerVersion' is distinct from 'formal-symbolic-writer-v1' or provenance->>'consentVersion' is distinct from 'symbolic-future-attachment-v1'
    or jsonb_typeof(provenance->'sourceVersion') is distinct from 'number' or provenance->'sourceVersion' is distinct from lens#>'{frame,sourceVersion}'
    or provenance->'consentRevision' is distinct from lens->'preferenceRevision' or (provenance->>'consentRevision')::numeric<=0
    or lens#>>'{frame,referencePeriod,key}' is distinct from period->>'key' or lens#>>'{frame,referencePeriod,structureKey}' is distinct from period->>'structureKey'
    or (lens#>>'{frame,referencePeriod,referenceDate}')::date>(period->>'referenceDate')::date then return false; end if;
  foreach field in array array['sourceId','snapshotId','storageConsentId','calculationConsentId','futureAttachmentConsentId'] loop
    if jsonb_typeof(provenance->field) is distinct from 'string' or provenance->>field !~* '^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$' then return false; end if;
  end loop;
  return true;
exception when others then return false;
end $$;
revoke all on function public.valid_frozen_symbolic_run_v1(jsonb,uuid,timestamptz) from public,anon;
grant execute on function public.valid_frozen_symbolic_run_v1(jsonb,uuid,timestamptz) to authenticated,service_role;

-- Keep the existing complete source/time matcher and old queued/complete
-- receipts; add strict new envelope checks without reading mutable preferences.
alter function public.formal_run_bundle_matches_reservation(jsonb,jsonb,timestamptz,timestamptz,integer)
  rename to formal_run_bundle_matches_reservation_before_symbolic;
create function public.formal_run_bundle_matches_reservation(p_bundle jsonb,p_source jsonb,p_accepted timestamptz,p_start timestamptz,p_horizon integer)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare lens jsonb:=p_source->'symbolic_lens'; provenance jsonb; item jsonb; causal jsonb;
begin
  if not public.formal_run_bundle_matches_reservation_before_symbolic(p_bundle,p_source,p_accepted,p_start,p_horizon) then return false; end if;
  if p_source->>'symbolic_lens_version'='bounded-fusion-static-v1' then return true; end if;
  if p_source->>'symbolic_lens_version' is distinct from 'formal-symbolic-run-v1'
    or not public.valid_frozen_symbolic_run_v1(lens,(p_source#>>'{relation_graph_snapshots,user_id}')::uuid,p_accepted)
    then return false; end if;
  -- Symbolic identifiers and classification cannot become evidence/assumptions,
  -- causality, candidate policy, frequency or strong report Claim inputs.
  causal:=p_bundle-array['symbolicLensSnapshot','strategyPaths'];
  provenance:=lens->'provenance';
  for item in select value from jsonb_path_query(causal,'strict $.** ? (@.type() == "string")') loop
    if item='"symbolic_lens"'::jsonb or item in (provenance->'sourceId',provenance->'snapshotId',provenance->'storageConsentId',provenance->'calculationConsentId',provenance->'futureAttachmentConsentId') then return false; end if;
  end loop;
  if p_bundle#>'{inputSnapshot}' ?| array['symbolicLens','symbolicLensSnapshot','birthDate','birthTime'] then return false; end if;
  return true;
exception when others then return false;
end $$;
revoke all on function public.formal_run_bundle_matches_reservation(jsonb,jsonb,timestamptz,timestamptz,integer) from public,anon;
grant execute on function public.formal_run_bundle_matches_reservation(jsonb,jsonb,timestamptz,timestamptz,integer) to authenticated;
commit;
