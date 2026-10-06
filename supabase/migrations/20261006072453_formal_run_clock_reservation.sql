-- Formal Run admission uses the existing job ledger, not a second Run history.
begin;
alter table public.generation_jobs
  add column formal_graph_snapshot_id uuid,
  add column formal_content_hash text,
  add column formal_accepted_at timestamptz,
  add column formal_simulation_start_at timestamptz,
  add column frozen_source_input jsonb;
alter table public.generation_jobs
  add constraint generation_jobs_formal_graph_owner_fkey foreign key (formal_graph_snapshot_id,user_id)
    references public.relation_graph_snapshots(id,user_id),
  add constraint generation_jobs_formal_seed_owner_fkey foreign key (seed_context_id,user_id)
    references public.seed_contexts(id,user_id),
  add constraint generation_jobs_formal_simulation_owner_fkey foreign key (simulation_id,user_id)
    references public.simulations(id,user_id),
  add constraint generation_jobs_formal_reservation_shape check (
    job_type <> 'formal_run_reservation' or (
      version = 'formal-run-reservation-v1' and writer_version = 'formal-run-reservation-v1'
      and formal_graph_snapshot_id is not null and seed_context_id is not null
      and formal_content_hash is not null and formal_content_hash ~ '^[a-f0-9]{64}$' and formal_accepted_at is not null
      and formal_simulation_start_at is not null and frozen_source_input is not null
      and formal_simulation_start_at = formal_accepted_at + interval '5 minutes'
      and jsonb_typeof(frozen_source_input) = 'object'
      and status in ('queued','completed')
      and ((status='queued' and simulation_id is null) or (status='completed' and simulation_id is not null))
    ) is true
  );
create unique index generation_jobs_formal_owner_key on public.generation_jobs(user_id,idempotency_key)
  where job_type='formal_run_reservation';

-- Reservation payloads contain frozen account sources. Hide these rows from
-- ordinary observability reads and require the controlled RPC's local gate.
drop policy generation_jobs_select_own on public.generation_jobs;
create policy generation_jobs_select_own on public.generation_jobs for select to authenticated
  using ((select auth.uid())=user_id and (job_type<>'formal_run_reservation' or current_setting('app.formal_reservation_rpc',true)='on'));
grant insert (user_id,seed_context_id,trace_id,version,writer_version,idempotency_key,job_type,status,
  input_refs,formal_graph_snapshot_id,formal_content_hash,formal_accepted_at,formal_simulation_start_at,frozen_source_input)
  on public.generation_jobs to authenticated;
grant update (status,simulation_id) on public.generation_jobs to authenticated;
create policy generation_jobs_formal_insert on public.generation_jobs for insert to authenticated
  with check ((select auth.uid())=user_id and job_type='formal_run_reservation' and current_setting('app.formal_reservation_rpc',true)='on');
create policy generation_jobs_formal_update on public.generation_jobs for update to authenticated
  using ((select auth.uid())=user_id and job_type='formal_run_reservation' and current_setting('app.formal_reservation_rpc',true)='on')
  with check ((select auth.uid())=user_id and job_type='formal_run_reservation' and current_setting('app.formal_reservation_rpc',true)='on');

create function public.formal_run_reservation_guard() returns trigger language plpgsql security invoker
set search_path=public,extensions as $$
begin
  if tg_op='INSERT' and new.job_type='formal_run_reservation' then
    if auth.uid() is distinct from new.user_id or current_setting('app.formal_reservation_rpc',true) is distinct from 'on' then
      raise exception using errcode='42501',message='reservation_write_denied';
    end if;
  elsif tg_op<>'INSERT' and old.job_type='formal_run_reservation' then
    if tg_op='DELETE' then raise exception using errcode='42501',message='reservation_immutable'; end if;
    if auth.uid() is distinct from old.user_id or current_setting('app.formal_reservation_rpc',true) is distinct from 'on'
      or old.status<>'queued' or new.status<>'completed' or new.simulation_id is null
      or (to_jsonb(new)-array['status','simulation_id','updated_at']) is distinct from (to_jsonb(old)-array['status','simulation_id','updated_at'])
    then raise exception using errcode='42501',message='reservation_immutable'; end if;
    if not exists (select 1 from public.simulations s join public.simulation_run_idempotency_receipts r
      on r.simulation_id=s.id and r.user_id=s.user_id and r.graph_snapshot_id=s.graph_snapshot_id
      and r.idempotency_key::text=s.idempotency_key and r.request_hash=s.request_hash
      where s.id=new.simulation_id and s.user_id=old.user_id
      and s.graph_snapshot_id=old.formal_graph_snapshot_id and s.idempotency_key=old.idempotency_key and s.status='completed'
      and public.formal_run_bundle_matches_reservation(s.result_bundle,old.frozen_source_input,old.formal_accepted_at,old.formal_simulation_start_at,case s.time_horizon when '30_days' then 30 when '90_days' then 90 end)) then
      raise exception using errcode='42501',message='reservation_completion_invalid';
    end if;
  elsif tg_op='UPDATE' and new.job_type='formal_run_reservation' then
    raise exception using errcode='42501',message='reservation_immutable';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end; $$;
create trigger generation_jobs_formal_guard before insert or update or delete on public.generation_jobs
for each row execute function public.formal_run_reservation_guard();
revoke all on function public.formal_run_reservation_guard() from public,anon,authenticated;

-- Shape validation runs before admission. Semantic action validation continues
-- through the existing canonical digital-life adapter, using frozen sources.
create function public.formal_run_rules_valid(p_rules jsonb) returns boolean language plpgsql immutable security invoker
set search_path=public,extensions as $$
declare item jsonb; operation jsonb; trigger_value jsonb; key text; action_type text;
begin
  if p_rules is null then return true; end if;
  if jsonb_typeof(p_rules) is distinct from 'object' then return false; end if;
  if p_rules->>'version' is distinct from 'digital-life-rules-v1'
    or jsonb_typeof(p_rules->'graphSnapshotId') is distinct from 'string'
    or jsonb_typeof(p_rules->'agentSnapshotId') is distinct from 'string'
    or p_rules->>'graphSnapshotId' !~* '^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$'
    or p_rules->>'agentSnapshotId' !~* '^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$'
    or jsonb_typeof(p_rules->'profileRevision') is distinct from 'number'
    or p_rules->>'profileRevision' !~ '^[0-9]+$'
    or jsonb_typeof(p_rules->'strategies') is distinct from 'array'
    or jsonb_typeof(p_rules->'actions') is distinct from 'array'
    or exists(select 1 from jsonb_object_keys(p_rules) k where k not in ('version','graphSnapshotId','agentSnapshotId','profileRevision','strategies','actions')) then return false; end if;
  if jsonb_array_length(p_rules->'strategies')>2 or jsonb_array_length(p_rules->'actions')>18 then return false; end if;
  for item in select value from jsonb_array_elements(p_rules->'strategies') loop
    if jsonb_typeof(item) is distinct from 'object' then return false; end if;
    if jsonb_typeof(item->'participantKey') is distinct from 'string' or item->>'participantKey' !~ '^person-[1-9][0-9]*$'
      or item->'confirmedForSimulation' is distinct from 'true'::jsonb
      or jsonb_typeof(item->'label') is distinct from 'string' or not public.is_safe_reality_profile_text(item->>'label',240)
      or jsonb_typeof(item->'evidenceSummary') is distinct from 'string' or not public.is_safe_reality_profile_text(item->>'evidenceSummary',160)
      or exists(select 1 from jsonb_object_keys(item) k where k not in ('participantKey','label','confirmedForSimulation','evidenceSummary')) then return false; end if;
  end loop;
  for item in select value from jsonb_array_elements(p_rules->'actions') loop
    if jsonb_typeof(item) is distinct from 'object' then return false; end if;
    if item->>'classification' is distinct from 'assumption' or item->'confirmedForSimulation' is distinct from 'true'::jsonb
      or jsonb_typeof(item->'key') is distinct from 'string' or item->>'key' !~ '^rule-[1-9][0-9]*$'
      or jsonb_typeof(item->'pathKey') is distinct from 'string' or item->>'pathKey' !~ '^(main|person-[1-9][0-9]*)$'
      or jsonb_typeof(item->'actorKey') is distinct from 'string' or item->>'actorKey' !~ '^person-[1-9][0-9]*$'
      or jsonb_typeof(item->'evidenceSummary') is distinct from 'string' or not public.is_safe_reality_profile_text(item->>'evidenceSummary',160)
      or jsonb_typeof(item->'when') is distinct from 'object' or jsonb_typeof(item->'operation') is distinct from 'object'
      or exists(select 1 from jsonb_object_keys(item) k where k not in ('key','pathKey','actorKey','when','operation','classification','confirmedForSimulation','evidenceSummary')) then return false; end if;
    trigger_value:=item->'when'; operation:=item->'operation';
    if trigger_value->>'kind'='at_tick' then
      if jsonb_typeof(trigger_value->'tickIndex') is distinct from 'number' or trigger_value->>'tickIndex' !~ '^[0-5]$'
        or exists(select 1 from jsonb_object_keys(trigger_value) k where k not in ('kind','tickIndex')) then return false; end if;
    elsif trigger_value->>'kind'='after_rule' then
      if jsonb_typeof(trigger_value->'ruleKey') is distinct from 'string' or trigger_value->>'ruleKey' !~ '^rule-[1-9][0-9]*$'
        or exists(select 1 from jsonb_object_keys(trigger_value) k where k not in ('kind','ruleKey')) then return false; end if;
    else return false; end if;
    action_type:=operation->>'actionType';
    if action_type='request_information' then
      if jsonb_typeof(operation->'targetPersonKey') is distinct from 'string' or operation->>'targetPersonKey' !~ '^person-[1-9][0-9]*$'
        or jsonb_typeof(operation->'question') is distinct from 'string' or not public.is_safe_reality_profile_text(operation->>'question',240)
        or exists(select 1 from jsonb_object_keys(operation) k where k not in ('actionType','targetPersonKey','question')) then return false; end if;
    elsif action_type='update_commitment' then
      if jsonb_typeof(operation->'commitmentKey') is distinct from 'string' or operation->>'commitmentKey' !~ '^commitment-[1-9][0-9]*$'
        or jsonb_typeof(operation->'label') is distinct from 'string' or not public.is_safe_reality_profile_text(operation->>'label',240)
        or operation->>'status' is null or operation->>'status' not in ('planned','active','fulfilled','cancelled')
        or (operation ? 'profileEntryKey' and (jsonb_typeof(operation->'profileEntryKey') is distinct from 'string' or length(btrim(operation->>'profileEntryKey')) not between 1 and 100))
        or exists(select 1 from jsonb_object_keys(operation) k where k not in ('actionType','commitmentKey','label','status','profileEntryKey')) then return false; end if;
    elsif action_type='update_relation_signal' then
      if jsonb_typeof(operation->'relationKey') is distinct from 'string' or operation->>'relationKey' !~ '^relation-[1-9][0-9]*$'
        or operation->>'signal' is null or operation->>'signal' not in ('negative','neutral','positive')
        or exists(select 1 from jsonb_object_keys(operation) k where k not in ('actionType','relationKey','signal')) then return false; end if;
    elsif action_type='allocate_resource' then
      if jsonb_typeof(operation->'resourceKey') is distinct from 'string' or operation->>'resourceKey' !~ '^resource-[1-9][0-9]*$'
        or jsonb_typeof(operation->'amount') is distinct from 'number' then return false; end if;
      if (operation->>'amount')::numeric<=0 or (operation->>'amount')::numeric>1000000
        or exists(select 1 from jsonb_object_keys(operation) k where k not in ('actionType','resourceKey','amount')) then return false; end if;
    else return false; end if;
    for key in select jsonb_object_keys(operation) loop
      if key in ('label','question') and operation->>key ~* 'https?://' then return false; end if;
    end loop;
  end loop;
  return true;
exception when others then return false;
end; $$;
revoke all on function public.formal_run_rules_valid(jsonb) from public,anon,authenticated;
grant execute on function public.formal_run_rules_valid(jsonb) to authenticated;

create function public.reserve_account_sandbox_run(p_graph_snapshot_id uuid,p_idempotency_key uuid,p_horizon_days integer,p_digital_life_rules jsonb default null)
returns table(accepted_at timestamptz,simulation_start_at timestamptz,frozen_source_input jsonb,run jsonb)
language plpgsql security invoker set search_path=public,extensions as $$
declare owner_id uuid:=auth.uid(); graph_row record; job_row record; source jsonb; content_hash text; profile_row jsonb; seed_row jsonb; agent_rows jsonb; edge_rows jsonb; feedback_rows jsonb; now_at timestamptz;
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
  -- One SQL statement freezes every mutable source under one MVCC snapshot.
  select
    (select jsonb_build_object('id',s.id,'version',s.version,'submitted_at',s.submitted_at,'frozen_at',s.frozen_at,'user_question',s.user_question,'raw_context',s.raw_context,'safety_flags',s.safety_flags)
      from public.seed_contexts s where s.id=graph_row.seed_context_id and s.user_id=owner_id and s.status='submitted' and s.frozen_at is not null and s.submitted_at is not null and s.simulation_track='crossroad'),
    (select jsonb_agg(jsonb_build_object('id',a.id,'version',a.version,'display_name',a.display_name,'agent_type',a.agent_type,'evidence_refs',a.evidence_refs) order by a.id) from public.agent_profiles a where a.user_id=owner_id and a.seed_context_id=graph_row.seed_context_id and a.snapshot_id=graph_row.agent_snapshot_id),
    (select jsonb_agg(jsonb_build_object('id',e.id,'version',e.version,'from_agent_id',e.from_agent_id,'to_agent_id',e.to_agent_id,'relationship_type',e.relationship_type,'evidence_refs',e.evidence_refs) order by e.id) from public.relation_edges e where e.user_id=owner_id and e.graph_snapshot_id=graph_row.id and e.agent_snapshot_id=graph_row.agent_snapshot_id),
    (select to_jsonb(p) from (select id,user_id,seed_context_id,life_climate_value,life_climate_classification,life_climate_evidence_summary,resources_value,resources_classification,resources_evidence_summary,constraints_value,constraints_classification,constraints_evidence_summary,life_goals,core_values,life_themes,pressures,external_variables,life_model_domains,world_model_inputs,revision from public.reality_profiles where user_id=owner_id and seed_context_id=graph_row.seed_context_id) p),
    (select coalesce(jsonb_agg(to_jsonb(f) order by f.created_at desc,f.id desc),'[]'::jsonb) from (select id,version,rating,target_type,created_at from public.feedback_logs where user_id=owner_id and version in ('formal-run-feedback-m1-v1','formal-run-feedback-m2-v1') order by created_at desc,id desc limit 20) f)
    into seed_row,agent_rows,edge_rows,profile_row,feedback_rows;
  if seed_row is null then raise exception using errcode='P0001',message='seed_not_found'; end if;
  if agent_rows is null or edge_rows is null or jsonb_array_length(agent_rows)>50 or jsonb_array_length(edge_rows)>200 then raise exception using errcode='P0001',message='incomplete_object_chain'; end if;
  if p_digital_life_rules is not null and (p_digital_life_rules->>'graphSnapshotId' is distinct from graph_row.id::text
    or p_digital_life_rules->>'agentSnapshotId' is distinct from graph_row.agent_snapshot_id::text
    or p_digital_life_rules->'profileRevision' is distinct from coalesce(profile_row->'revision','0'::jsonb)) then raise exception using errcode='P0001',message='invalid_request'; end if;
  now_at:=date_trunc('milliseconds',clock_timestamp()); accepted_at:=now_at; simulation_start_at:=now_at+interval '5 minutes';
  source:=jsonb_build_object('relation_graph_snapshots',to_jsonb(graph_row)-'agent_safety','seed_contexts',seed_row,'agent_profiles',agent_rows,'relation_edges',edge_rows,'reality_profiles',profile_row,'feedback_logs',feedback_rows,
    'digital_life_rules',p_digital_life_rules,'symbolic_lens',jsonb_build_object('mode','bounded_fusion','summary','Symbolic context is optional framing and does not alter causal claims.'),'symbolic_lens_version','bounded-fusion-static-v1','source_version','formal-run-reservation-v1');
  insert into public.generation_jobs(user_id,seed_context_id,trace_id,version,writer_version,idempotency_key,job_type,status,input_refs,formal_graph_snapshot_id,formal_content_hash,formal_accepted_at,formal_simulation_start_at,frozen_source_input)
    values(owner_id,graph_row.seed_context_id,gen_random_uuid()::text,'formal-run-reservation-v1','formal-run-reservation-v1',p_idempotency_key::text,'formal_run_reservation','queued',jsonb_build_object('graph_snapshot_id',graph_row.id),graph_row.id,content_hash,accepted_at,simulation_start_at,source);
  frozen_source_input:=source; run:=null; perform set_config('app.formal_reservation_rpc','off',true); return next;
exception when others then perform set_config('app.formal_reservation_rpc','off',true); raise;
end; $$;
revoke all on function public.reserve_account_sandbox_run(uuid,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.reserve_account_sandbox_run(uuid,uuid,integer,jsonb) to authenticated;

-- Normalize whitespace in source fields just as the existing Zod contracts do.
create function public.formal_run_normalize_json(value jsonb) returns jsonb language plpgsql immutable security invoker set search_path=public,extensions as $$
declare result jsonb;
begin
  if jsonb_typeof(value)='string' then return to_jsonb(btrim(value#>>'{}')); end if;
  if jsonb_typeof(value)='array' then select coalesce(jsonb_agg(public.formal_run_normalize_json(v) order by ord),'[]'::jsonb) into result from jsonb_array_elements(value) with ordinality a(v,ord); return result; end if;
  if jsonb_typeof(value)='object' then select coalesce(jsonb_object_agg(k,public.formal_run_normalize_json(v)),'{}'::jsonb) into result from jsonb_each(value) a(k,v); return result; end if;
  return value;
end; $$;
revoke all on function public.formal_run_normalize_json(jsonb) from public,anon,authenticated;
grant execute on function public.formal_run_normalize_json(jsonb) to authenticated;

create function public.formal_run_frozen_profile(p jsonb) returns jsonb language plpgsql immutable security invoker set search_path=public,extensions as $$
declare unknown_field jsonb:=jsonb_build_object('value','','classification','unknown','evidenceSummary','明确未知'); unknown_list jsonb; domains jsonb;
begin
  unknown_list:=jsonb_build_array(unknown_field);
  domains:=jsonb_build_object('version',1,'identity',unknown_list,'career',unknown_list,'wealth',unknown_list,'relationships',unknown_list,'environment',unknown_list,'lifeStage',unknown_list);
  return public.formal_run_normalize_json(jsonb_build_object(
    'lifeClimate',case when p is null then unknown_field else jsonb_build_object('value',coalesce(p->>'life_climate_value',''),'classification',p->>'life_climate_classification','evidenceSummary',coalesce(p->>'life_climate_evidence_summary','明确未知')) end,
    'resources',case when p is null then unknown_field else jsonb_build_object('value',coalesce(p->>'resources_value',''),'classification',p->>'resources_classification','evidenceSummary',coalesce(p->>'resources_evidence_summary','明确未知')) end,
    'constraints',case when p is null then unknown_field else jsonb_build_object('value',coalesce(p->>'constraints_value',''),'classification',p->>'constraints_classification','evidenceSummary',coalesce(p->>'constraints_evidence_summary','明确未知')) end,
    'goals',coalesce(p->'life_goals',unknown_list),'values',coalesce(p->'core_values',unknown_list),'lifeThemes',coalesce(p->'life_themes',unknown_list),'pressures',coalesce(p->'pressures',unknown_list),'externalVariables',coalesce(p->'external_variables',unknown_list),
    'lifeModelDomains',coalesce(p->'life_model_domains',domains),'worldInputs',coalesce(p->'world_model_inputs','{"version":1,"resources":[],"constraints":[]}'::jsonb),'revision',coalesce(p->'revision','0'::jsonb)));
end; $$;
revoke all on function public.formal_run_frozen_profile(jsonb) from public,anon,authenticated;
grant execute on function public.formal_run_frozen_profile(jsonb) to authenticated;

create function public.formal_run_bundle_matches_reservation(p_bundle jsonb,p_source jsonb,p_accepted timestamptz,p_start timestamptz,p_horizon integer)
returns boolean language plpgsql security invoker set search_path=public,extensions as $$
declare input jsonb:=p_bundle->'inputSnapshot'; graph jsonb:=p_source->'relation_graph_snapshots'; profile_row jsonb:=nullif(p_source->'reality_profiles','null'::jsonb); expected_profile jsonb; expected_agents jsonb; expected_edges jsonb; expected_feedback jsonb; rules jsonb; field text; timing jsonb:=p_bundle->'forecastTiming'; boundary_at timestamptz; lock_at timestamptz; generated_at timestamptz;
begin
  if jsonb_typeof(input) is distinct from 'object' or jsonb_typeof(timing) is distinct from 'object' then return false; end if;
  for field in select unnest(array['acceptedAt','boundaryAt','lockedAt','generatedPersistedAt','simulationStartAt']) loop
    if jsonb_typeof(timing->field) is distinct from 'string' or timing->>field !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$' then return false; end if;
  end loop;
  boundary_at:=(timing->>'boundaryAt')::timestamptz; lock_at:=(timing->>'lockedAt')::timestamptz; generated_at:=(timing->>'generatedPersistedAt')::timestamptz;
  if (timing->>'acceptedAt')::timestamptz is distinct from p_accepted or (timing->>'simulationStartAt')::timestamptz is distinct from p_start
    or boundary_at<p_accepted or lock_at<boundary_at or generated_at<lock_at or generated_at>clock_timestamp() or generated_at>=p_start
    or (input->>'acceptedAt')::timestamptz is distinct from p_accepted or (input->>'startedAt')::timestamptz is distinct from p_start
    or (input->>'graphLockedAt')::timestamptz is distinct from (graph->>'locked_at')::timestamptz
    or (p_bundle#>>'{sourceBoundary,updatedAt}')::timestamptz is distinct from boundary_at then return false; end if;
  if jsonb_typeof(input->'acceptedAt') is distinct from 'string' or jsonb_typeof(input->'startedAt') is distinct from 'string'
    or jsonb_typeof(input->'graphLockedAt') is distinct from 'string' then return false; end if;
  expected_profile:=jsonb_build_object('ownerId',graph->'user_id','seedContextId',graph->'seed_context_id','profileId',profile_row->'id','revision',coalesce(profile_row->'revision','0'::jsonb),'profile',public.formal_run_frozen_profile(profile_row));
  select jsonb_agg(jsonb_build_object('id',a->'id','displayName',a->'display_name','sourceRole',a->'agent_type','actorType',case when a->>'agent_type' in ('user_core','user_variant') then 'self' when a->>'agent_type'='group' then 'organization' else 'third_party' end,'evidenceRefs',a->'evidence_refs') order by ord) into expected_agents from jsonb_array_elements(p_source->'agent_profiles') with ordinality t(a,ord);
  select jsonb_agg(jsonb_build_object('id',e->'id','fromAgentId',e->'from_agent_id','toAgentId',e->'to_agent_id','relationshipType',e->'relationship_type','evidenceRefs',e->'evidence_refs') order by ord) into expected_edges from jsonb_array_elements(p_source->'relation_edges') with ordinality t(e,ord);
  select jsonb_build_object('source','account_feedback','signals',coalesce(jsonb_agg(jsonb_build_object('rating',f->>'rating','targetType',f->>'target_type','createdAt',f->>'created_at') order by ord),'[]'::jsonb)) into expected_feedback from jsonb_array_elements(p_source->'feedback_logs') with ordinality t(f,ord);
  rules:=nullif(p_source->'digital_life_rules','null'::jsonb);
  if rules is null then rules:=jsonb_build_object('version','digital-life-rules-v1','graphSnapshotId',graph->'id','agentSnapshotId',graph->'agent_snapshot_id','profileRevision',coalesce(profile_row->'revision','0'::jsonb),'strategies','[]'::jsonb,'actions','[]'::jsonb); end if;
  return input->'ownerId' is not distinct from graph->'user_id' and input->'seedContextId' is not distinct from graph->'seed_context_id'
    and input->'graphSnapshotId' is not distinct from graph->'id' and input->'agentSnapshotId' is not distinct from graph->'agent_snapshot_id'
    and input->'horizonDays' is not distinct from to_jsonb(p_horizon) and input->'safetyLevel' is not distinct from graph->'safety_level'
    and btrim(input->>'seedSummary') is not distinct from btrim(left(concat_ws(' ',nullif(p_source#>>'{seed_contexts,user_question}',''),nullif(p_source#>>'{seed_contexts,raw_context}','')),4000))
    and public.formal_run_normalize_json(input->'realityProfileSnapshot') is not distinct from expected_profile
    and public.formal_run_normalize_json(input->'agents') is not distinct from public.formal_run_normalize_json(expected_agents)
    and public.formal_run_normalize_json(input->'edges') is not distinct from public.formal_run_normalize_json(expected_edges)
    and input->'calibrationSnapshot' is not distinct from expected_feedback
    and public.formal_run_normalize_json(input#>'{digitalLifeModel,rules}') is not distinct from public.formal_run_normalize_json(rules)
    and p_bundle->'symbolicLensSnapshot' is not distinct from p_source->'symbolic_lens';
exception when others then return false;
end; $$;
revoke all on function public.formal_run_bundle_matches_reservation(jsonb,jsonb,timestamptz,timestamptz,integer) from public,anon,authenticated;
grant execute on function public.formal_run_bundle_matches_reservation(jsonb,jsonb,timestamptz,timestamptz,integer) to authenticated;
create or replace function public.persist_account_sandbox_run_m1(
  p_user_id uuid,
  p_graph_snapshot_id uuid,
  p_idempotency_key uuid,
  p_horizon_days integer,
  p_bundle jsonb
)
returns table (idempotent boolean, run jsonb)
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_graph record;
  v_seed record;
  v_receipt record;
  v_run_id uuid;
  v_request_hash text;
  v_event jsonb;
  v_event_id uuid;
  v_event_map jsonb := '{}'::jsonb;
  v_claim jsonb;
  v_claim_id uuid;
  v_claim_map jsonb := '{}'::jsonb;
  v_evidence_ids uuid[];
  v_claim_ids uuid[];
  v_tick_id uuid;
  v_index integer := 0;
  v_report jsonb;
  v_field record;
  v_ref jsonb;
  v_reservation record;
  v_path jsonb;
  v_db_persisted_at timestamptz;
begin
  perform set_config('app.m1_run_rpc', 'off', true);
  perform set_config('app.formal_reservation_rpc', 'off', true);
  if auth.uid() is null or p_user_id is distinct from auth.uid() or p_graph_snapshot_id is null or p_idempotency_key is null then
    raise exception using errcode = '42501', message = 'unauthenticated';
  end if;
  if p_horizon_days is null or p_horizon_days not in (30, 90)
    or jsonb_typeof(p_bundle) is distinct from 'object' then
    raise exception using errcode = 'P0001', message = 'invalid_run_input';
  end if;
  -- jsonb_typeof returns SQL NULL for missing keys. Use IS DISTINCT FROM
  -- so both absent keys and JSON null fail before casts or array operations.
  for v_field in select * from (values
    ('{inputSnapshot}'::text[], 'object'), ('{events}'::text[], 'array'),
    ('{claims}'::text[], 'array'), ('{report}'::text[], 'object'),
    ('{versions}'::text[], 'object'), ('{causalFingerprint}'::text[], 'string'),
    ('{versions,runtime}'::text[], 'string'), ('{versions,schema}'::text[], 'string'),
    ('{versions,trajectory}'::text[], 'string'),
    ('{inputSnapshot,ownerId}'::text[], 'string'),
    ('{inputSnapshot,seedContextId}'::text[], 'string'),
    ('{inputSnapshot,graphSnapshotId}'::text[], 'string'),
    ('{inputSnapshot,agentSnapshotId}'::text[], 'string'),
    ('{inputSnapshot,horizonDays}'::text[], 'number'),
    ('{inputSnapshot,deterministicSeed}'::text[], 'number'),
    ('{inputSnapshot,agents}'::text[], 'array'),
    ('{inputSnapshot,edges}'::text[], 'array'),
    ('{report,claimIds}'::text[], 'array'), ('{report,title}'::text[], 'string')
  ) as required(path, kind) loop
    if jsonb_typeof(p_bundle #> v_field.path) is distinct from v_field.kind then
      raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
    end if;
    if v_field.kind = 'string' and btrim(p_bundle #>> v_field.path) = '' then
      raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
    end if;
  end loop;
  if jsonb_array_length(p_bundle->'events') = 0
    or jsonb_array_length(p_bundle->'claims') = 0
    or jsonb_array_length(p_bundle#>'{inputSnapshot,agents}') = 0
    or jsonb_array_length(p_bundle#>'{report,claimIds}') = 0
    or p_bundle->>'causalFingerprint' !~ '^[a-f0-9]{24}$'
    or p_bundle#>>'{versions,runtime}' is distinct from 'formal-account-sandbox-m1-v1'
    or p_bundle#>>'{versions,schema}' is distinct from 'formal-run-bundle-m1-v1'
    or p_bundle#>>'{versions,trajectory}' is distinct from 'trajectory-engine-v2-stage-4'
    or p_bundle#>'{inputSnapshot,horizonDays}' is distinct from to_jsonb(p_horizon_days)
    or (p_bundle#>>'{inputSnapshot,deterministicSeed}') !~ '^[0-9]+$'
  then
    raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
  end if;
  -- Match the formal runtime's positive seed contract before the storage cast.
  if (p_bundle#>>'{inputSnapshot,deterministicSeed}')::numeric not between 1 and 2000000000 then
    raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
  end if;
  if (p_bundle#>'{inputSnapshot}' ? 'calibrationSnapshot'
      and jsonb_typeof(p_bundle#>'{inputSnapshot,calibrationSnapshot}') is distinct from 'object')
    or (p_bundle ? 'symbolicLensSnapshot'
      and jsonb_typeof(p_bundle->'symbolicLensSnapshot') is distinct from 'object')
  then
    raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
  end if;

  -- Validate every consumed Event and Claim before opening the writer gate.
  for v_event in select value from jsonb_array_elements(p_bundle->'events') loop
    if jsonb_typeof(v_event) is distinct from 'object' then
      raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
    end if;
    for v_field in select * from (values
      ('id', 'string'), ('evidenceClass', 'string'), ('eventType', 'string'),
      ('branchId', 'string'), ('createdAt', 'string'),
      ('beforeRevision', 'number'), ('afterRevision', 'number'),
      ('causalRealEvidenceIds', 'array'), ('operation', 'object'), ('deltas', 'array')
    ) as required(key, kind) loop
      if jsonb_typeof(v_event->v_field.key) is distinct from v_field.kind then
        raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
      end if;
      if v_field.kind = 'string' and btrim(v_event->>v_field.key) = '' then
        raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
      end if;
    end loop;
    if v_event->>'id' !~ '^world_event_v2_[a-z0-9][a-z0-9_-]*$'
      or v_event->>'evidenceClass' is distinct from 'world_transition_simulation_evidence'
      or jsonb_array_length(v_event->'causalRealEvidenceIds') = 0
      or v_event->>'beforeRevision' !~ '^[0-9]+$'
      or v_event->>'afterRevision' !~ '^[0-9]+$'
    then raise exception using errcode = 'P0001', message = 'invalid_run_bundle'; end if;
    for v_ref in select value from jsonb_array_elements(v_event->'causalRealEvidenceIds') loop
      if jsonb_typeof(v_ref) is distinct from 'string' or btrim(v_ref #>> '{}') = '' then
        raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
      end if;
    end loop;
  end loop;
  for v_claim in select value from jsonb_array_elements(p_bundle->'claims') loop
    if jsonb_typeof(v_claim) is distinct from 'object' then
      raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
    end if;
    for v_field in select * from (values
      ('id', 'string'), ('claimType', 'string'), ('statement', 'string'),
      ('uncertaintyStatement', 'string'), ('simulationEventIds', 'array')
    ) as required(key, kind) loop
      if jsonb_typeof(v_claim->v_field.key) is distinct from v_field.kind then
        raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
      end if;
      if v_field.kind = 'string' and btrim(v_claim->>v_field.key) = '' then
        raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
      end if;
    end loop;
    if v_claim->>'id' !~ '^claim_v2_[a-z0-9][a-z0-9_-]*$'
      or jsonb_array_length(v_claim->'simulationEventIds') = 0 then
      raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
    end if;
    for v_ref in select value from jsonb_array_elements(v_claim->'simulationEventIds') loop
      if jsonb_typeof(v_ref) is distinct from 'string' or btrim(v_ref #>> '{}') = '' then
        raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
      end if;
    end loop;
  end loop;
  for v_ref in select value from jsonb_array_elements(p_bundle#>'{report,claimIds}') loop
    if jsonb_typeof(v_ref) is distinct from 'string' or btrim(v_ref #>> '{}') = '' then
      raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
    end if;
  end loop;

  select g.id, g.user_id, g.seed_context_id, g.agent_snapshot_id,
    g.graph_locked, g.locked_at, g.safety_level,
    a.safety_level as agent_safety
    into v_graph
  from public.relation_graph_snapshots g
  join public.agent_profile_snapshots a
    on a.id = g.agent_snapshot_id
   and a.user_id = g.user_id
   and a.seed_context_id = g.seed_context_id
  where g.id = p_graph_snapshot_id
    and g.user_id = auth.uid()
    and g.graph_locked
    and g.locked_at is not null;
  if not found then raise exception using errcode = 'P0001', message = 'graph_not_found'; end if;
  if v_graph.safety_level not in ('safe','caution') or v_graph.agent_safety not in ('safe','caution') then
    raise exception using errcode = 'P0001', message = 'safety_blocked';
  end if;
  select id, user_id, status, frozen_at, submitted_at, simulation_track
    into v_seed from public.seed_contexts
  where id = v_graph.seed_context_id and user_id = auth.uid()
    and status = 'submitted' and frozen_at is not null and submitted_at is not null
    and simulation_track = 'crossroad';
  if not found then raise exception using errcode = 'P0001', message = 'seed_not_found'; end if;
  if p_bundle#>>'{inputSnapshot,ownerId}' is distinct from auth.uid()::text
    or p_bundle#>>'{inputSnapshot,seedContextId}' is distinct from v_seed.id::text
    or p_bundle#>>'{inputSnapshot,graphSnapshotId}' is distinct from v_graph.id::text
    or p_bundle#>>'{inputSnapshot,agentSnapshotId}' is distinct from v_graph.agent_snapshot_id::text
    or p_bundle#>'{inputSnapshot,horizonDays}' is distinct from to_jsonb(p_horizon_days)
  then
    raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
  end if;


  -- The owner/key lock also serializes simultaneous pending generators.
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':m1-run:' || p_idempotency_key::text, 0));
  perform set_config('app.formal_reservation_rpc','on',true);
  select id,formal_graph_snapshot_id,formal_accepted_at,formal_simulation_start_at,frozen_source_input,simulation_id,status
    into v_reservation from public.generation_jobs
    where user_id=auth.uid() and job_type='formal_run_reservation' and idempotency_key=p_idempotency_key::text;
  if found then
    if v_reservation.status='queued' and clock_timestamp()>=v_reservation.formal_simulation_start_at then raise exception using errcode='P0001',message='reservation_expired'; end if;
    if v_reservation.formal_graph_snapshot_id is distinct from p_graph_snapshot_id
      or not public.formal_run_bundle_matches_reservation(p_bundle,v_reservation.frozen_source_input,v_reservation.formal_accepted_at,v_reservation.formal_simulation_start_at,p_horizon_days)
      or (p_bundle#>>'{inputSnapshot,deterministicSeed}')::integer is distinct from
        (('x'||left(encode(digest(convert_to(p_graph_snapshot_id::text||':'||p_idempotency_key::text,'UTF8'),'sha256'),'hex'),7))::bit(28)::integer % 1999999999)+1
    then raise exception using errcode='P0001',message='invalid_run_bundle'; end if;
    if p_bundle ? 'strategyPaths' then
      if jsonb_typeof(p_bundle#>'{strategyPaths,paths}') is distinct from 'array' then raise exception using errcode='P0001',message='invalid_run_bundle'; end if;
      for v_path in select value from jsonb_array_elements(p_bundle#>'{strategyPaths,paths}') loop
        if not public.formal_run_bundle_matches_reservation(v_path->'bundle',v_reservation.frozen_source_input,v_reservation.formal_accepted_at,v_reservation.formal_simulation_start_at,p_horizon_days)
        then raise exception using errcode='P0001',message='invalid_run_bundle'; end if;
      end loop;
    end if;
    if v_reservation.status='completed' then
      -- Generated lock times may differ during a race. Immutable user content
      -- and frozen input identify the original completed Run, never a new one.
    
  select jsonb_build_object('id',id,'status',status,'seed_context_id',seed_context_id,'graph_snapshot_id',graph_snapshot_id,'time_horizon',time_horizon,'completed_at',completed_at)
        into run from public.simulations where id=v_reservation.simulation_id and user_id=auth.uid() and status='completed';
      if run is null then raise exception using errcode='P0001',message='persistence_failed'; end if;
      idempotent:=true;
      perform set_config('app.formal_reservation_rpc','off',true);
      return next; return;
    end if;
    if clock_timestamp()>=v_reservation.formal_simulation_start_at then raise exception using errcode='P0001',message='reservation_expired'; end if;
  else
    -- Existing legacy receipts retain their original exact bundle replay.
    perform set_config('app.m1_run_rpc','on',true);
    perform 1 from public.simulation_run_idempotency_receipts where user_id=auth.uid() and idempotency_key=p_idempotency_key;
    if not found then raise exception using errcode='P0001',message='reservation_required'; end if;
  end if;

  v_request_hash := encode(digest(convert_to(jsonb_build_object(
    'user_id', auth.uid(),
    'graph_snapshot_id', p_graph_snapshot_id,
    'horizon_days', p_horizon_days,
    'bundle', p_bundle
  )::text, 'UTF8'), 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':m1-run:' || p_idempotency_key::text, 0));
  perform set_config('app.m1_run_rpc', 'on', true);
  select user_id, graph_snapshot_id, idempotency_key, request_hash, simulation_id into v_receipt from public.simulation_run_idempotency_receipts
  where user_id = auth.uid() and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.request_hash <> v_request_hash or v_receipt.graph_snapshot_id <> p_graph_snapshot_id then
      raise exception using errcode = 'P0001', message = 'idempotency_key_content_conflict';
    end if;
    select jsonb_build_object('id', id, 'status', status, 'seed_context_id', seed_context_id, 'graph_snapshot_id', graph_snapshot_id, 'time_horizon', time_horizon, 'completed_at', completed_at)
      into run from public.simulations where id = v_receipt.simulation_id and user_id = auth.uid() and status = 'completed';
    if run is null then raise exception using errcode = 'P0001', message = 'persistence_failed'; end if;
    idempotent := true;
    perform set_config('app.m1_run_rpc', 'off', true);
    perform set_config('app.formal_reservation_rpc','off',true);
    return next;
    return;
  end if;

  insert into public.simulations(
    user_id, seed_context_id, version, status, track, time_horizon, tick_count,
    frozen_agent_profile_ids, frozen_relation_edge_ids, safety_level, trace_id,
    writer_version, idempotency_key, graph_snapshot_id, agent_snapshot_id,
    input_snapshot, deterministic_seed, execution_version, schema_version,
    engine_version, run_phase, result_bundle, request_hash,
    calibration_snapshot, destiny_mode, symbolic_lens_snapshot
  ) values (
    auth.uid(), v_seed.id, 'formal-run-bundle-m1-v1', 'running', 'crossroad',
    case p_horizon_days when 30 then '30_days'::public.time_horizon else '90_days'::public.time_horizon end,
    jsonb_array_length(p_bundle->'events'),
    array(select id from public.agent_profiles where snapshot_id = v_graph.agent_snapshot_id and user_id = auth.uid() order by id),
    array(select id from public.relation_edges where graph_snapshot_id = v_graph.id and user_id = auth.uid() order by id),
    v_graph.safety_level, gen_random_uuid()::text, 'formal-account-sandbox-m1-v1', p_idempotency_key::text,
    v_graph.id, v_graph.agent_snapshot_id, p_bundle->'inputSnapshot',
    (p_bundle#>>'{inputSnapshot,deterministicSeed}')::integer,
    'formal-account-sandbox-m1-v1', 'formal-run-bundle-m1-v1', 'trajectory-engine-v2-stage-4',
    'persisting', null, v_request_hash, coalesce(p_bundle#>'{inputSnapshot,calibrationSnapshot}','{}'::jsonb),
    'bounded_fusion', coalesce(p_bundle->'symbolicLensSnapshot','{}'::jsonb)
  ) returning id into v_run_id;

  for v_event in select value from jsonb_array_elements(p_bundle->'events') loop
    insert into public.simulation_ticks(user_id,simulation_id,version,tick_index,time_label,environment_state,agent_state_snapshot,relation_graph_snapshot,summary,trace_id,error_code,writer_version,idempotency_key,branch_id,tick_payload)
    values(auth.uid(),v_run_id,'formal-tick-m1-v1',v_index,coalesce(v_event->>'createdAt',''),coalesce(v_event->'operation','{}'::jsonb),coalesce(v_event->'deltas','[]'::jsonb),'{}'::jsonb,coalesce(v_event->>'eventType','Simulation event'),gen_random_uuid()::text,null,'formal-account-sandbox-m1-v1',p_idempotency_key::text||':tick:'||v_index,coalesce(v_event->>'branchId','unknown'),v_event)
    returning id into v_tick_id;
    insert into public.event_logs(user_id,simulation_id,simulation_tick_id,version,event_type,agent_ids,relation_edge_ids,summary,before_state,after_state,edge_weight_deltas,confidence,source,trace_id,writer_version,idempotency_key,event_payload)
    values(auth.uid(),v_run_id,v_tick_id,'formal-event-m1-v1',coalesce(v_event->>'eventType','controlled_transition'),'{}','{}',coalesce(v_event->>'eventType','Controlled simulation event'),jsonb_build_object('revision',v_event->'beforeRevision'),jsonb_build_object('revision',v_event->'afterRevision'),coalesce(v_event->'deltas','[]'::jsonb),50,'v2_controlled_transition',gen_random_uuid()::text,'formal-account-sandbox-m1-v1',p_idempotency_key::text||':event:'||v_index,v_event)
    returning id into v_event_id;
    v_event_map := v_event_map || jsonb_build_object(v_event->>'id', v_event_id::text);
    v_index := v_index + 1;
  end loop;

  v_index := 0;
  for v_claim in select value from jsonb_array_elements(p_bundle->'claims') loop
    select array_agg((v_event_map->>value)::uuid order by value) into v_evidence_ids
      from jsonb_array_elements_text(v_claim->'simulationEventIds')
      where v_event_map ? value;
    if coalesce(array_length(v_evidence_ids,1),0) <> jsonb_array_length(v_claim->'simulationEventIds') then
      raise exception using errcode = 'P0001', message = 'claim_evidence_invalid';
    end if;
    insert into public.claims(user_id,simulation_id,version,claim_type,summary,confidence,risk_level,evidence_event_ids,related_agent_ids,related_relation_edge_ids,is_paid_locked,safety_notes,trace_id,writer_version,idempotency_key,claim_payload)
    values(auth.uid(),v_run_id,'formal-claim-m1-v1',coalesce(v_claim->>'claimType','scenario_frequency'),v_claim->>'statement',50,'low',v_evidence_ids,'{}','{}',false,jsonb_build_array(v_claim->>'uncertaintyStatement'),gen_random_uuid()::text,'formal-account-sandbox-m1-v1',p_idempotency_key::text||':claim:'||v_index,v_claim)
    returning id into v_claim_id;
    v_claim_map := v_claim_map || jsonb_build_object(v_claim->>'id',v_claim_id::text);
    v_index := v_index + 1;
  end loop;

  v_report := p_bundle->'report';
  select array_agg((v_claim_map->>value)::uuid order by value) into v_claim_ids
    from jsonb_array_elements_text(v_report->'claimIds') where v_claim_map ? value;
  if coalesce(array_length(v_claim_ids,1),0) <> jsonb_array_length(v_report->'claimIds') then
    raise exception using errcode = 'P0001', message = 'report_claim_invalid';
  end if;
  insert into public.reports(user_id,simulation_id,version,status,claim_ids,free_preview,paid_sections,disclaimer,model_version,prompt_version,trace_id,cost_estimate,error_code,writer_version,idempotency_key,report_payload)
  values(auth.uid(),v_run_id,'formal-report-m1-v1','preview_ready',v_claim_ids,jsonb_build_object('claim_ids',v_claim_ids,'source_labels',jsonb_build_array('Reality','Hypothesis','Simulation','Symbolic Lens')),'{}','Conditional simulation, not a prediction. Review evidence, assumptions, and uncertainty.',null,null,gen_random_uuid()::text,0,null,'formal-account-sandbox-m1-v1',p_idempotency_key::text||':report',v_report);


  v_db_persisted_at:=clock_timestamp();
  if v_reservation.id is not null then
    if v_db_persisted_at>=v_reservation.formal_simulation_start_at then raise exception using errcode='P0001',message='reservation_expired'; end if;
    p_bundle:=jsonb_set(p_bundle,'{forecastTiming,persistedAt}',to_jsonb(v_db_persisted_at),true);
    if p_bundle ? 'strategyPaths' then
      select jsonb_agg(jsonb_set(value,'{bundle,forecastTiming,persistedAt}',to_jsonb(v_db_persisted_at),true) order by ord)
        into v_path from jsonb_array_elements(p_bundle#>'{strategyPaths,paths}') with ordinality a(value,ord);
      p_bundle:=jsonb_set(p_bundle,'{strategyPaths,paths}',coalesce(v_path,'[]'::jsonb));
    end if;
  end if;
  update public.simulations set status='completed', run_phase='completed', result_bundle=p_bundle, completed_at=v_db_persisted_at
  where id=v_run_id and user_id=auth.uid() and status='running';
  if not found then raise exception using errcode='P0001',message='persistence_failed'; end if;
  insert into public.simulation_run_idempotency_receipts(user_id,graph_snapshot_id,idempotency_key,request_hash,simulation_id)
  values(auth.uid(),p_graph_snapshot_id,p_idempotency_key,v_request_hash,v_run_id);
  if v_reservation.id is not null then
    update public.generation_jobs set status='completed',simulation_id=v_run_id
      where id=v_reservation.id and user_id=auth.uid() and status='queued';
    if not found then raise exception using errcode='P0001',message='persistence_failed'; end if;
    if clock_timestamp()>=v_reservation.formal_simulation_start_at then raise exception using errcode='P0001',message='reservation_expired'; end if;
  end if;
  select jsonb_build_object('id',id,'status',status,'seed_context_id',seed_context_id,'graph_snapshot_id',graph_snapshot_id,'time_horizon',time_horizon,'completed_at',completed_at) into run
  from public.simulations where id=v_run_id;
  idempotent := false;
  perform set_config('app.m1_run_rpc','off',true);
  perform set_config('app.formal_reservation_rpc','off',true);
  return next;
exception when others then
  perform set_config('app.m1_run_rpc','off',true);
  perform set_config('app.formal_reservation_rpc','off',true);
  raise;
end;
$$;
commit;


