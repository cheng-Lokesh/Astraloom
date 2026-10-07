begin;
-- Forward-only: do not rewrite the possibly applied outcome migration or old rows.
alter table public.formal_forecast_locks add column reality_criteria jsonb;
alter table public.formal_outcome_observations add column criteria_comparison jsonb;
create or replace function public.reserve_account_sandbox_run(p_graph_snapshot_id uuid,p_idempotency_key uuid,p_horizon_days integer,p_digital_life_rules jsonb,p_outcome_calibration jsonb)
returns table(accepted_at timestamptz,simulation_start_at timestamptz,frozen_source_input jsonb,run jsonb)
language plpgsql security invoker set search_path=public,extensions as $$
declare owner_id uuid:=auth.uid(); graph_row record; job_row record; source jsonb; content_hash text; legacy_content_hash text; bridge_content_hash text; profile_row jsonb; seed_row jsonb; agent_rows jsonb; edge_rows jsonb; feedback_rows jsonb; lens_row jsonb; now_at timestamptz; selected_corrections jsonb; selected_row record; original_rules jsonb:=p_digital_life_rules; current_seed uuid; current_graph uuid; source_run uuid;
begin
  perform set_config('app.formal_reservation_rpc','off',true);
  if owner_id is null then raise exception using errcode='42501',message='unauthenticated'; end if;
  if p_graph_snapshot_id is null or p_idempotency_key is null or p_horizon_days is null or p_horizon_days not in (30,90)
    or not public.formal_run_rules_valid(p_digital_life_rules) then raise exception using errcode='P0001',message='invalid_request'; end if;
  legacy_content_hash:=encode(digest(convert_to(jsonb_build_object('graph',p_graph_snapshot_id,'horizon',p_horizon_days,'rules',p_digital_life_rules,'version','formal-run-reservation-v1')::text,'UTF8'),'sha256'),'hex');
  bridge_content_hash:=encode(digest(convert_to(jsonb_build_object('graph',p_graph_snapshot_id,'horizon',p_horizon_days,'rules',p_digital_life_rules,'version','formal-run-reservation-outcome-v1','outcome_calibration',p_outcome_calibration)::text,'UTF8'),'sha256'),'hex');
  content_hash:=case when p_outcome_calibration is null then legacy_content_hash else bridge_content_hash end;
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text||':m1-run:'||p_idempotency_key::text,0));
  perform set_config('app.formal_reservation_rpc','on',true);
  select id,formal_content_hash,formal_accepted_at,formal_simulation_start_at,generation_jobs.frozen_source_input,simulation_id,status into job_row
    from public.generation_jobs where user_id=owner_id and job_type='formal_run_reservation' and idempotency_key=p_idempotency_key::text;
  if found then
    if job_row.formal_content_hash is distinct from content_hash and not (p_outcome_calibration is null and job_row.formal_content_hash=bridge_content_hash) then raise exception using errcode='P0001',message='idempotency_key_content_conflict'; end if;
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
    if job_row.graph_snapshot_id is distinct from p_graph_snapshot_id or p_outcome_calibration is not null or job_row.time_horizon::text is distinct from p_horizon_days::text||'_days'
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
  if p_outcome_calibration is not null then
    if jsonb_typeof(p_outcome_calibration) is distinct from 'object' or p_outcome_calibration->>'version' is distinct from '1'
      or p_outcome_calibration->'confirmed' is distinct from 'true'::jsonb or jsonb_typeof(p_outcome_calibration->'correction_keys') is distinct from 'array'
      or jsonb_array_length(p_outcome_calibration->'correction_keys') not between 1 and 6
      or (select count(*) from jsonb_object_keys(p_outcome_calibration))<>3 then raise exception using errcode='P0001',message='invalid_correction'; end if;
    select id into current_seed from public.seed_contexts where user_id=owner_id and status='submitted' and submitted_at is not null and frozen_at is not null order by submitted_at desc,id desc limit 1;
    select id into current_graph from public.relation_graph_snapshots where user_id=owner_id and seed_context_id=current_seed order by created_at desc,id desc limit 1;
    if graph_row.id is distinct from current_graph then raise exception using errcode='P0001',message='current_graph_required'; end if;
    select jsonb_agg(o.correction order by o.correction->>'key') into selected_corrections from public.formal_outcome_observations o
      where o.user_id=owner_id and o.correction->>'key' in (select jsonb_array_elements_text(p_outcome_calibration->'correction_keys'));
    if selected_corrections is null or jsonb_array_length(selected_corrections)<>jsonb_array_length(p_outcome_calibration->'correction_keys')
      or (select count(distinct c->>'ruleKey') from jsonb_array_elements(selected_corrections)c)<>jsonb_array_length(selected_corrections)
      or (select count(distinct c->>'sourceRunId') from jsonb_array_elements(selected_corrections)c)<>1 then raise exception using errcode='P0001',message='invalid_correction'; end if;
    source_run:=(selected_corrections->0->>'sourceRunId')::uuid;
    if p_digital_life_rules is null or (p_digital_life_rules->'actions'='[]'::jsonb and p_digital_life_rules->'strategies'='[]'::jsonb) then
      select input_snapshot#>'{digitalLifeModel,rules}' into p_digital_life_rules from public.simulations where id=source_run and user_id=owner_id and status='completed';
    end if;
  end if;
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
  if selected_corrections is not null and exists(select 1 from jsonb_array_elements(selected_corrections)c where
    c->>'ownerId' is distinct from owner_id::text or c->>'seedContextId' is distinct from graph_row.seed_context_id::text
    or c->>'graphSnapshotId' is distinct from graph_row.id::text or c->>'agentSnapshotId' is distinct from graph_row.agent_snapshot_id::text
    or c->'profileRevision' is distinct from coalesce(profile_row->'revision','0'::jsonb)
    or (c->>'recordedAt')::timestamptz>now_at) then raise exception using errcode='P0001',message='invalid_correction'; end if;
  if seed_row is null then raise exception using errcode='P0001',message='seed_not_found'; end if;
  if agent_rows is null or edge_rows is null or jsonb_array_length(agent_rows)>50 or jsonb_array_length(edge_rows)>200 then raise exception using errcode='P0001',message='incomplete_object_chain'; end if;
  if p_digital_life_rules is not null and (p_digital_life_rules->>'graphSnapshotId' is distinct from graph_row.id::text
    or p_digital_life_rules->>'agentSnapshotId' is distinct from graph_row.agent_snapshot_id::text
    or p_digital_life_rules->'profileRevision' is distinct from coalesce(profile_row->'revision','0'::jsonb)) then raise exception using errcode='P0001',message='invalid_request'; end if;
  source:=jsonb_build_object('relation_graph_snapshots',to_jsonb(graph_row)-'agent_safety','seed_contexts',seed_row,'agent_profiles',agent_rows,'relation_edges',edge_rows,'reality_profiles',profile_row,'feedback_logs',feedback_rows,
    'digital_life_rules',p_digital_life_rules,'symbolic_lens',lens_row,'symbolic_lens_version','formal-symbolic-run-v1','source_version','formal-run-reservation-outcome-v1','outcome_lock_required',true,'reality_criteria_required',true,'outcome_calibration',case when selected_corrections is null then null else jsonb_build_object('version','formal-outcome-run-v1','corrections',selected_corrections) end,'outcome_selection',p_outcome_calibration,'original_requested_rules',original_rules);
  insert into public.generation_jobs(user_id,seed_context_id,trace_id,version,writer_version,idempotency_key,job_type,status,input_refs,formal_graph_snapshot_id,formal_content_hash,formal_accepted_at,formal_simulation_start_at,frozen_source_input)
    values(owner_id,graph_row.seed_context_id,gen_random_uuid()::text,'formal-run-reservation-v1','formal-run-reservation-v1',p_idempotency_key::text,'formal_run_reservation','queued',jsonb_build_object('graph_snapshot_id',graph_row.id),graph_row.id,content_hash,accepted_at,simulation_start_at,source);
  frozen_source_input:=source; run:=null; perform set_config('app.formal_reservation_rpc','off',true); return next;
exception when others then perform set_config('app.formal_reservation_rpc','off',true); raise;
end; $$;


create or replace function public.reserve_account_sandbox_run(p_graph_snapshot_id uuid,p_idempotency_key uuid,p_horizon_days integer,p_digital_life_rules jsonb default null)
returns table(accepted_at timestamptz,simulation_start_at timestamptz,frozen_source_input jsonb,run jsonb)
language sql security invoker set search_path=public,extensions as $$
 select * from public.reserve_account_sandbox_run(p_graph_snapshot_id,p_idempotency_key,p_horizon_days,p_digital_life_rules,null::jsonb);
$$;
revoke all on function public.reserve_account_sandbox_run(uuid,uuid,integer,jsonb) from public,anon;
grant execute on function public.reserve_account_sandbox_run(uuid,uuid,integer,jsonb) to authenticated;

create or replace function public.persist_formal_locks_on_completion() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare reservation record; path record; history jsonb; envelope jsonb; frozen jsonb; actual timestamptz:=clock_timestamp(); required boolean; criteria jsonb;
begin
 if new.execution_version<>'formal-account-sandbox-m1-v1' or new.status<>'completed' or (tg_op='UPDATE' and old.status='completed') then return new;end if;
 select frozen_source_input into reservation from public.generation_jobs where user_id=new.user_id and job_type='formal_run_reservation' and idempotency_key=new.idempotency_key;
 required:=coalesce((reservation.frozen_source_input->>'outcome_lock_required')::boolean,false);
 for path in select 'main' as key,new.result_bundle as bundle union all
  select value->>'key',value->'bundle' from jsonb_array_elements(coalesce(new.result_bundle#>'{strategyPaths,paths}','[]'::jsonb))
 loop
  history:=path.bundle->'forecastPersistenceHistory';
  if history is null then if required then raise exception using errcode='P0001',message='invalid_forecast_lock';else continue;end if;end if;
  if jsonb_typeof(history) is distinct from 'array' or jsonb_array_length(history)<>1 then raise exception using errcode='P0001',message='invalid_forecast_lock';end if;
  envelope:=history->0;frozen:=envelope#>'{artifact,value}';
  if jsonb_typeof(envelope->'persistedAt') is distinct from 'string'
   or jsonb_typeof(frozen->'lockedAt') is distinct from 'string'
   or jsonb_typeof(frozen#>'{sourceSnapshots,claimSet,realityBoundary,updatedAt}') is distinct from 'string'
   or not isfinite((envelope->>'persistedAt')::timestamptz) or not isfinite((frozen->>'lockedAt')::timestamptz)
   or not isfinite((frozen#>>'{sourceSnapshots,claimSet,realityBoundary,updatedAt}')::timestamptz)
   or jsonb_typeof(frozen->'forecastUnits') is distinct from 'array' or jsonb_array_length(frozen->'forecastUnits')=0
   or exists(select 1 from jsonb_array_elements(frozen->'forecastUnits')u where
      jsonb_typeof(u#>'{semantics,evaluationWindow,startAt}') is distinct from 'string'
      or jsonb_typeof(u#>'{semantics,evaluationWindow,horizonEnd}') is distinct from 'string'
      or not isfinite((u#>>'{semantics,evaluationWindow,startAt}')::timestamptz)
      or not isfinite((u#>>'{semantics,evaluationWindow,horizonEnd}')::timestamptz)
      or (u#>>'{semantics,evaluationWindow,startAt}')::timestamptz is distinct from (path.bundle#>>'{inputSnapshot,startedAt}')::timestamptz)
   or (envelope->>'persistedAt')::timestamptz is distinct from (path.bundle#>>'{forecastTiming,generatedPersistedAt}')::timestamptz
   or (frozen->>'lockedAt')::timestamptz is distinct from (path.bundle#>>'{forecastTiming,lockedAt}')::timestamptz
   then raise exception using errcode='P0001',message='invalid_forecast_lock';end if;
  criteria:=nullif(path.bundle->'frozenRealityCriteria','null'::jsonb);
  if criteria is null and reservation.frozen_source_input->>'reality_criteria_required'='true'
    then raise exception using errcode='P0001',message='invalid_reality_criteria';end if;
  if criteria is not null and (
    jsonb_typeof(criteria) is distinct from 'object' or criteria->>'version' is distinct from 'formal-reality-criteria-v1'
    or criteria->>'ownerId' is distinct from new.user_id::text or criteria->>'seedContextId' is distinct from new.seed_context_id::text
    or criteria->>'pathKey' is distinct from path.key
    or criteria->'forecastLockReference' is distinct from path.bundle->'forecastLockReference'
    or jsonb_typeof(criteria->'frozenAt') is distinct from 'string'
    or (criteria->>'frozenAt')::timestamptz is distinct from (frozen->>'lockedAt')::timestamptz
    or coalesce(criteria->>'criteriaFingerprint','')!~'^[a-f0-9]{64}$'
    or coalesce(criteria->>'sourceFingerprint','')!~'^[a-f0-9]{64}$'
    or jsonb_typeof(criteria->'targets') is distinct from 'array' or jsonb_array_length(criteria->'targets')>100
    or exists(select 1 from jsonb_array_elements(criteria->'targets')t where
      jsonb_typeof(t->'conditions') is distinct from 'array' or jsonb_array_length(t->'conditions') not between 1 and 32
      or jsonb_typeof(t#>'{observationWindow,startAt}') is distinct from 'string'
      or jsonb_typeof(t#>'{observationWindow,horizonEnd}') is distinct from 'string'
      or (t#>>'{observationWindow,startAt}')::timestamptz is distinct from (path.bundle#>>'{inputSnapshot,startedAt}')::timestamptz
      or (t#>>'{observationWindow,horizonEnd}')::timestamptz is distinct from (path.bundle#>>'{inputSnapshot,startedAt}')::timestamptz+make_interval(days=>(path.bundle#>>'{inputSnapshot,horizonDays}')::integer)))
    then raise exception using errcode='P0001',message='invalid_reality_criteria';end if;
  if envelope->>'version' is distinct from '1' or envelope->'parentVersionId' is distinct from 'null'::jsonb or envelope#>>'{artifact,kind}' is distinct from 'forecast_lock'
   or envelope->>'seedContextId' is distinct from new.seed_context_id::text
   or frozen#>'{sourceSnapshots,run,payload}' is distinct from path.bundle->'trajectoryAnalysis'
   or frozen#>'{sourceSnapshots,claimSet,realityBoundary}' is distinct from path.bundle->'sourceBoundary'
   or frozen#>'{sourceSnapshots,report}' is distinct from path.bundle->'report'
   or (select jsonb_agg(c order by c->>'id') from jsonb_array_elements(frozen#>'{sourceSnapshots,claims}')c) is distinct from path.bundle->'claims'
   or (envelope->>'persistedAt')::timestamptz>actual or (frozen->>'lockedAt')::timestamptz>(envelope->>'persistedAt')::timestamptz
   or (frozen#>>'{sourceSnapshots,claimSet,realityBoundary,updatedAt}')::timestamptz>(frozen->>'lockedAt')::timestamptz
   or exists(select 1 from jsonb_array_elements(frozen->'forecastUnits')u where actual>=(u#>>'{semantics,evaluationWindow,startAt}')::timestamptz)
   or path.bundle#>>'{forecastLockReference,streamId}' is distinct from envelope->>'streamId'
   or path.bundle#>'{forecastLockReference,version}' is distinct from envelope->'version'
   then raise exception using errcode='P0001',message='invalid_forecast_lock';end if;
  insert into public.formal_forecast_locks(user_id,simulation_id,path_key,history,stored_at,reality_criteria)values(new.user_id,new.id,path.key,history,actual,criteria);
 end loop;
 return new;
exception when others then raise exception using errcode='P0001',message='invalid_forecast_lock';
end;$$;

create function public.append_formal_outcome_v1(p_owner uuid,p_run uuid,p_request jsonb,p_request_hash text,p_recorded_at timestamptz,p_observation_signature text,p_artifacts jsonb,p_calibration jsonb,p_correction jsonb,p_status text,p_criteria_comparison jsonb)
returns table(idempotent boolean)language plpgsql security invoker set search_path=public,extensions as $$
declare prior record; run_row record; locked record; now_at timestamptz:=clock_timestamp(); criteria_target jsonb;
begin
 if p_owner is null or not exists(select 1 from auth.users where id=p_owner and not is_anonymous)then raise exception using errcode='42501',message='unauthenticated';end if;
 perform pg_advisory_xact_lock(hashtextextended('symbolic_lens_v1:'||p_owner::text,0));
 perform pg_advisory_xact_lock(hashtextextended('formal_outcome:'||p_owner::text||':'||p_run::text,0));
 select * into prior from public.formal_outcome_observations where user_id=p_owner and idempotency_key=(p_request->>'idempotency_key')::uuid;
 if found then if prior.request_hash is distinct from p_request_hash then raise exception using errcode='P0001',message='idempotency_key_content_conflict';end if;idempotent:=true;return next;return;end if;
 select * into run_row from public.simulations where id=p_run and user_id=p_owner and status='completed' and execution_version='formal-account-sandbox-m1-v1';
 if not found then raise exception using errcode='P0001',message='run_not_found';end if;
 if p_recorded_at is null or not isfinite(p_recorded_at) or p_recorded_at>now_at or coalesce(p_status,'') not in ('not_observable','historical_lock_not_recorded')
   or p_request->'confirmed_user_observation' is distinct from 'true'::jsonb or coalesce(p_request->>'target_key','')!~'^target-[1-9][0-9]*$'
   or p_request->>'observed' is distinct from 'uncertain' or coalesce(p_request_hash,'')!~'^[a-f0-9]{64}$'
   or coalesce(p_observation_signature,'')!~'^[a-f0-9]{64}$' or jsonb_typeof(p_artifacts) is distinct from 'array' then raise exception using errcode='P0001',message='invalid_observation';end if;
 if p_status='scored' or p_calibration is not null or p_artifacts<>'[]'::jsonb
   or jsonb_typeof(p_criteria_comparison) is distinct from 'object'
   or coalesce(p_criteria_comparison->>'status','') not in ('matched','different','unknown','not_recorded')
   or jsonb_typeof(p_criteria_comparison->'differences') is distinct from 'array'
   or jsonb_array_length(p_criteria_comparison->'differences')>32
   or (select count(*) from jsonb_object_keys(p_criteria_comparison))<>2
   then raise exception using errcode='P0001',message='invalid_observation';end if;
 select * into locked from public.formal_forecast_locks where user_id=p_owner and simulation_id=p_run and path_key='main';
 if p_criteria_comparison->>'status'<>'not_recorded' then
   select t into criteria_target from jsonb_array_elements(locked.reality_criteria->'targets')t where t->>'targetKey'=p_request->>'target_key';
   if criteria_target is null or locked.reality_criteria is distinct from run_row.result_bundle->'frozenRealityCriteria'
     or exists(select 1 from jsonb_array_elements_text(p_criteria_comparison->'differences')d where not exists(select 1 from jsonb_array_elements(criteria_target->'conditions')c where c->>'key'=d))
     or (p_criteria_comparison->>'status' in ('matched','different') and p_recorded_at<(criteria_target#>>'{observationWindow,horizonEnd}')::timestamptz)
     then raise exception using errcode='P0001',message='invalid_observation';end if;
 end if;
 if (locked.simulation_id is null and p_status<>'historical_lock_not_recorded') or (locked.simulation_id is not null and p_status<>'not_observable')
   then raise exception using errcode='P0001',message='invalid_observation';end if;
 if p_correction is not null and (p_correction->>'ownerId' is distinct from p_owner::text or p_correction->>'sourceRunId' is distinct from p_run::text
   or p_correction->>'seedContextId' is distinct from run_row.seed_context_id::text or p_correction->>'graphSnapshotId' is distinct from run_row.graph_snapshot_id::text
   or p_correction->>'observationSignature' is distinct from p_observation_signature or p_request#>'{correction,confirmed_for_next_run}' is distinct from 'true'::jsonb
   or p_correction->>'agentSnapshotId' is distinct from run_row.input_snapshot->>'agentSnapshotId'
   or p_correction->'profileRevision' is distinct from run_row.input_snapshot#>'{realityProfileSnapshot,revision}'
   or p_correction->>'version' is distinct from 'formal-outcome-rule-correction-v1'
   or p_correction->'rowVersion' is distinct from '1'::jsonb
   or coalesce(p_correction->>'key','')!~'^correction-v1-[a-f0-9]{64}$')then raise exception using errcode='P0001',message='invalid_correction';end if;
 insert into public.formal_outcome_observations(user_id,simulation_id,idempotency_key,request_hash,observation_signature,request_payload,recorded_at,backtest_status,artifacts,calibration,correction,criteria_comparison)
 values(p_owner,p_run,(p_request->>'idempotency_key')::uuid,p_request_hash,p_observation_signature,p_request,p_recorded_at,p_status,p_artifacts,p_calibration,p_correction,p_criteria_comparison);
 idempotent:=false;return next;
end;$$;

-- The old service-only writer cannot admit new unvalidated classifications.
revoke all on function public.append_formal_outcome_v1(uuid,uuid,jsonb,text,timestamptz,text,jsonb,jsonb,jsonb,text) from public,anon,authenticated,service_role;
revoke all on function public.append_formal_outcome_v1(uuid,uuid,jsonb,text,timestamptz,text,jsonb,jsonb,jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function public.append_formal_outcome_v1(uuid,uuid,jsonb,text,timestamptz,text,jsonb,jsonb,jsonb,text,jsonb) to service_role;
commit;
