-- M1 authenticated owner writer boundary.
-- The SECURITY INVOKER RPC is the only browser-accessible generated-output writer;
-- caller ownership and a transaction-local capability are enforced together.

alter table public.simulations enable row level security;
alter table public.simulation_ticks enable row level security;
alter table public.event_logs enable row level security;
alter table public.claims enable row level security;
alter table public.reports enable row level security;
alter table public.simulation_run_idempotency_receipts enable row level security;

revoke insert, update, delete on public.simulations, public.simulation_ticks,
  public.event_logs, public.claims, public.reports,
  public.simulation_run_idempotency_receipts from anon, authenticated;

grant insert (
  user_id, seed_context_id, version, status, track, time_horizon, tick_count,
  frozen_agent_profile_ids, frozen_relation_edge_ids, safety_level, trace_id,
  writer_version, idempotency_key, graph_snapshot_id, agent_snapshot_id,
  input_snapshot, deterministic_seed, execution_version, schema_version,
  engine_version, run_phase, request_hash, calibration_snapshot, destiny_mode,
  symbolic_lens_snapshot, result_bundle
) on public.simulations to authenticated;
grant update (status, run_phase, result_bundle, completed_at)
  on public.simulations to authenticated;

grant insert (
  user_id, simulation_id, version, tick_index, time_label, environment_state,
  agent_state_snapshot, relation_graph_snapshot, summary, trace_id, error_code,
  writer_version, idempotency_key, branch_id, tick_payload
) on public.simulation_ticks to authenticated;
grant insert (
  user_id, simulation_id, simulation_tick_id, version, event_type, agent_ids,
  relation_edge_ids, summary, before_state, after_state, edge_weight_deltas,
  confidence, source, trace_id, writer_version, idempotency_key, event_payload
) on public.event_logs to authenticated;
grant insert (
  user_id, simulation_id, version, claim_type, summary, confidence, risk_level,
  evidence_event_ids, related_agent_ids, related_relation_edge_ids,
  is_paid_locked, safety_notes, trace_id, writer_version, idempotency_key,
  claim_payload
) on public.claims to authenticated;
grant insert (
  user_id, simulation_id, version, status, claim_ids, free_preview,
  paid_sections, disclaimer, model_version, prompt_version, trace_id,
  cost_estimate, error_code, writer_version, idempotency_key, report_payload
) on public.reports to authenticated;

grant select (user_id, graph_snapshot_id, idempotency_key, request_hash, simulation_id)
  on public.simulation_run_idempotency_receipts to authenticated;
grant insert (user_id, graph_snapshot_id, idempotency_key, request_hash, simulation_id)
  on public.simulation_run_idempotency_receipts to authenticated;
grant select (id, user_id, seed_context_id, agent_snapshot_id, graph_locked, locked_at, safety_level)
  on public.relation_graph_snapshots to authenticated;
grant select (id, user_id, seed_context_id, safety_level)
  on public.agent_profile_snapshots to authenticated;
grant select (id, user_id, status, frozen_at, submitted_at, simulation_track)
  on public.seed_contexts to authenticated;
grant select (id) on public.reality_profiles to authenticated;

drop policy if exists simulations_m1_writer_insert on public.simulations;
drop policy if exists simulations_m1_writer_update on public.simulations;
drop policy if exists simulation_ticks_m1_writer_insert on public.simulation_ticks;
drop policy if exists event_logs_m1_writer_insert on public.event_logs;
drop policy if exists claims_m1_writer_insert on public.claims;
drop policy if exists reports_m1_writer_insert on public.reports;
drop policy if exists simulation_run_receipts_m1_writer_select
  on public.simulation_run_idempotency_receipts;
drop policy if exists simulation_run_receipts_m1_writer_insert
  on public.simulation_run_idempotency_receipts;

create policy simulations_m1_writer_insert
  on public.simulations for insert to authenticated
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and current_setting('app.m1_run_rpc', true) = 'on'
  );
create policy simulations_m1_writer_update
  on public.simulations for update to authenticated
  using (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and current_setting('app.m1_run_rpc', true) = 'on'
  )
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and current_setting('app.m1_run_rpc', true) = 'on'
  );
create policy simulation_ticks_m1_writer_insert
  on public.simulation_ticks for insert to authenticated
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and current_setting('app.m1_run_rpc', true) = 'on'
  );
create policy event_logs_m1_writer_insert
  on public.event_logs for insert to authenticated
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and current_setting('app.m1_run_rpc', true) = 'on'
  );
create policy claims_m1_writer_insert
  on public.claims for insert to authenticated
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and current_setting('app.m1_run_rpc', true) = 'on'
  );
create policy reports_m1_writer_insert
  on public.reports for insert to authenticated
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and current_setting('app.m1_run_rpc', true) = 'on'
  );
create policy simulation_run_receipts_m1_writer_select
  on public.simulation_run_idempotency_receipts for select to authenticated
  using (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and current_setting('app.m1_run_rpc', true) = 'on'
  );
create policy simulation_run_receipts_m1_writer_insert
  on public.simulation_run_idempotency_receipts for insert to authenticated
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and current_setting('app.m1_run_rpc', true) = 'on'
  );
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
begin
  perform set_config('app.m1_run_rpc', 'off', true);
  if auth.uid() is null or p_user_id is distinct from auth.uid() or p_graph_snapshot_id is null or p_idempotency_key is null then
    raise exception using errcode = '42501', message = 'unauthenticated';
  end if;
  if p_horizon_days not in (30, 90) or jsonb_typeof(p_bundle) <> 'object' then
    raise exception using errcode = 'P0001', message = 'invalid_run_input';
  end if;
  if jsonb_typeof(p_bundle->'inputSnapshot') <> 'object'
    or jsonb_typeof(p_bundle->'events') <> 'array'
    or jsonb_array_length(p_bundle->'events') = 0
    or jsonb_typeof(p_bundle->'claims') <> 'array'
    or jsonb_array_length(p_bundle->'claims') = 0
    or jsonb_typeof(p_bundle->'report') <> 'object'
    or p_bundle->>'causalFingerprint' !~ '^[a-f0-9]{24}$'
    or p_bundle#>>'{versions,runtime}' <> 'formal-account-sandbox-m1-v1'
    or p_bundle#>>'{versions,schema}' <> 'formal-run-bundle-m1-v1'
    or p_bundle#>>'{versions,trajectory}' <> 'trajectory-engine-v2-stage-4'
  then
    raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
  end if;

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
  if p_bundle#>>'{inputSnapshot,ownerId}' <> auth.uid()::text
    or p_bundle#>>'{inputSnapshot,seedContextId}' <> v_seed.id::text
    or p_bundle#>>'{inputSnapshot,graphSnapshotId}' <> v_graph.id::text
    or p_bundle#>>'{inputSnapshot,agentSnapshotId}' <> v_graph.agent_snapshot_id::text
    or (p_bundle#>>'{inputSnapshot,horizonDays}')::integer <> p_horizon_days
  then
    raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
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
    if v_event->>'id' !~ '^world_event_v2_[a-z0-9][a-z0-9_-]*$'
      or v_event->>'evidenceClass' <> 'world_transition_simulation_evidence'
      or jsonb_typeof(v_event->'causalRealEvidenceIds') <> 'array'
      or jsonb_array_length(v_event->'causalRealEvidenceIds') = 0
    then raise exception using errcode = 'P0001', message = 'invalid_run_bundle'; end if;
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
    if v_claim->>'id' !~ '^claim_v2_[a-z0-9][a-z0-9_-]*$' or jsonb_array_length(v_claim->'simulationEventIds') = 0 then
      raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
    end if;
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

  update public.simulations set status='completed', run_phase='completed', result_bundle=p_bundle, completed_at=clock_timestamp()
  where id=v_run_id and user_id=auth.uid() and status='running';
  if not found then raise exception using errcode='P0001',message='persistence_failed'; end if;
  insert into public.simulation_run_idempotency_receipts(user_id,graph_snapshot_id,idempotency_key,request_hash,simulation_id)
  values(auth.uid(),p_graph_snapshot_id,p_idempotency_key,v_request_hash,v_run_id);
  select jsonb_build_object('id',id,'status',status,'seed_context_id',seed_context_id,'graph_snapshot_id',graph_snapshot_id,'time_horizon',time_horizon,'completed_at',completed_at) into run
  from public.simulations where id=v_run_id;
  idempotent := false;
  perform set_config('app.m1_run_rpc','off',true);
  return next;
exception when others then
  perform set_config('app.m1_run_rpc','off',true);
  raise;
end;
$$;
revoke all on function public.persist_account_sandbox_run_m1(uuid,uuid,uuid,integer,jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.persist_account_sandbox_run_m1(uuid,uuid,uuid,integer,jsonb)
  to authenticated;
