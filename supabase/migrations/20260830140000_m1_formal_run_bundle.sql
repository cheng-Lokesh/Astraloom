-- M1.2: extend the canonical production tables for one immutable formal Run
-- bundle. No parallel simulation/event/claim/report/history tables are added.

alter table public.simulations
  add column graph_snapshot_id uuid references public.relation_graph_snapshots(id) on delete restrict,
  add column agent_snapshot_id uuid references public.agent_profile_snapshots(id) on delete restrict,
  add column input_snapshot jsonb,
  add column deterministic_seed integer,
  add column execution_version text,
  add column schema_version text,
  add column engine_version text,
  add column run_phase text,
  add column failure_category text,
  add column result_bundle jsonb,
  add column completed_at timestamptz,
  add column request_hash text,
  add column calibration_snapshot jsonb not null default '{}'::jsonb,
  add column destiny_mode text not null default 'bounded_fusion',
  add column symbolic_lens_snapshot jsonb not null default '{}'::jsonb;

alter table public.simulation_ticks
  add column branch_id text,
  add column tick_payload jsonb;

alter table public.event_logs
  add column event_payload jsonb;

alter table public.claims
  add column claim_payload jsonb;

alter table public.reports
  add column report_payload jsonb;

alter table public.simulations
  add constraint simulations_m1_formal_shape_check check (
    (execution_version is null and graph_snapshot_id is null)
    or (
      graph_snapshot_id is not null
      and agent_snapshot_id is not null
      and input_snapshot is not null
      and deterministic_seed is not null
      and deterministic_seed > 0
      and execution_version = 'formal-account-sandbox-m1-v1'
      and schema_version = 'formal-run-bundle-m1-v1'
      and engine_version = 'trajectory-engine-v2-stage-4'
      and request_hash ~ '^[a-f0-9]{64}$'
      and destiny_mode = 'bounded_fusion'
    )
  ),
  add constraint simulations_m1_completed_bundle_check check (
    status <> 'completed'
    or (result_bundle is not null and completed_at is not null and failure_category is null)
  ),
  add constraint simulations_m1_horizon_check check (
    execution_version is null or time_horizon in ('30_days', '90_days')
  );

create unique index simulations_m1_owner_idempotency_unique
  on public.simulations(user_id, idempotency_key)
  where execution_version = 'formal-account-sandbox-m1-v1';

-- Composite owner keys are required before the receipt table can bind both
-- identities without weakening ownership to a single-column reference.
alter table public.simulations
  add constraint simulations_id_owner_unique unique (id, user_id);

alter table public.relation_graph_snapshots
  add constraint relation_graph_snapshots_id_owner_unique unique (id, user_id);

create table public.simulation_run_idempotency_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  graph_snapshot_id uuid not null,
  idempotency_key uuid not null,
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  simulation_id uuid not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (user_id, idempotency_key),
  foreign key (simulation_id, user_id) references public.simulations(id, user_id) on delete restrict,
  foreign key (graph_snapshot_id, user_id) references public.relation_graph_snapshots(id, user_id) on delete restrict
);

alter table public.simulation_run_idempotency_receipts enable row level security;
revoke all on public.simulation_run_idempotency_receipts from public, anon, authenticated;

create or replace function public.simulations_m1_immutable_guard()
returns trigger
language plpgsql
security invoker
set search_path = public, extensions
as $$
begin
  if old.execution_version = 'formal-account-sandbox-m1-v1' then
    if tg_op = 'DELETE' then
      raise exception using errcode = '42501', message = 'completed_run_immutable';
    end if;
    if current_setting('app.m1_run_rpc', true) is distinct from 'on'
      or old.status = 'completed'
      or new.id <> old.id
      or new.user_id <> old.user_id
      or new.seed_context_id <> old.seed_context_id
      or new.graph_snapshot_id <> old.graph_snapshot_id
      or new.agent_snapshot_id <> old.agent_snapshot_id
      or new.input_snapshot <> old.input_snapshot
      or new.deterministic_seed <> old.deterministic_seed
      or new.request_hash <> old.request_hash
    then
      raise exception using errcode = '42501', message = 'completed_run_immutable';
    end if;
  end if;
  return new;
end;
$$;

create trigger simulations_m1_immutable_guard
before update or delete on public.simulations
for each row execute function public.simulations_m1_immutable_guard();

create or replace function public.formal_run_artifact_m1_immutable_guard()
returns trigger
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare v_simulation_id uuid := coalesce(old.simulation_id, new.simulation_id);
begin
  if exists (
    select 1 from public.simulations
    where id = v_simulation_id
      and execution_version = 'formal-account-sandbox-m1-v1'
      and status = 'completed'
  ) then
    raise exception using errcode = '42501', message = 'completed_run_immutable';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger simulation_ticks_m1_immutable_guard before update or delete on public.simulation_ticks for each row execute function public.formal_run_artifact_m1_immutable_guard();
create trigger event_logs_m1_immutable_guard before update or delete on public.event_logs for each row execute function public.formal_run_artifact_m1_immutable_guard();
create trigger claims_m1_immutable_guard before update or delete on public.claims for each row execute function public.formal_run_artifact_m1_immutable_guard();
create trigger reports_m1_immutable_guard before update or delete on public.reports for each row execute function public.formal_run_artifact_m1_immutable_guard();

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
  if current_user <> 'service_role' or p_user_id is null or p_graph_snapshot_id is null or p_idempotency_key is null then
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

  select g.*, a.safety_level as agent_safety
    into v_graph
  from public.relation_graph_snapshots g
  join public.agent_profile_snapshots a
    on a.id = g.agent_snapshot_id
   and a.user_id = g.user_id
   and a.seed_context_id = g.seed_context_id
  where g.id = p_graph_snapshot_id
    and g.user_id = p_user_id
    and g.graph_locked
    and g.locked_at is not null;
  if not found then raise exception using errcode = 'P0001', message = 'graph_not_found'; end if;
  if v_graph.safety_level not in ('safe','caution') or v_graph.agent_safety not in ('safe','caution') then
    raise exception using errcode = 'P0001', message = 'safety_blocked';
  end if;
  select * into v_seed from public.seed_contexts
  where id = v_graph.seed_context_id and user_id = p_user_id
    and status = 'submitted' and frozen_at is not null and submitted_at is not null
    and simulation_track = 'crossroad';
  if not found then raise exception using errcode = 'P0001', message = 'seed_not_found'; end if;
  if p_bundle#>>'{inputSnapshot,ownerId}' <> p_user_id::text
    or p_bundle#>>'{inputSnapshot,seedContextId}' <> v_seed.id::text
    or p_bundle#>>'{inputSnapshot,graphSnapshotId}' <> v_graph.id::text
    or p_bundle#>>'{inputSnapshot,agentSnapshotId}' <> v_graph.agent_snapshot_id::text
    or (p_bundle#>>'{inputSnapshot,horizonDays}')::integer <> p_horizon_days
  then
    raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
  end if;

  v_request_hash := encode(digest(convert_to(jsonb_build_object(
    'user_id', p_user_id,
    'graph_snapshot_id', p_graph_snapshot_id,
    'horizon_days', p_horizon_days,
    'bundle', p_bundle
  )::text, 'UTF8'), 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':m1-run:' || p_idempotency_key::text, 0));
  select * into v_receipt from public.simulation_run_idempotency_receipts
  where user_id = p_user_id and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.request_hash <> v_request_hash or v_receipt.graph_snapshot_id <> p_graph_snapshot_id then
      raise exception using errcode = 'P0001', message = 'idempotency_key_content_conflict';
    end if;
    select jsonb_build_object('id', id, 'status', status, 'seed_context_id', seed_context_id, 'graph_snapshot_id', graph_snapshot_id, 'time_horizon', time_horizon, 'completed_at', completed_at)
      into run from public.simulations where id = v_receipt.simulation_id and user_id = p_user_id and status = 'completed';
    if run is null then raise exception using errcode = 'P0001', message = 'persistence_failed'; end if;
    idempotent := true;
    return next;
    return;
  end if;

  perform set_config('app.m1_run_rpc', 'on', true);
  insert into public.simulations(
    user_id, seed_context_id, version, status, track, time_horizon, tick_count,
    frozen_agent_profile_ids, frozen_relation_edge_ids, safety_level, trace_id,
    writer_version, idempotency_key, graph_snapshot_id, agent_snapshot_id,
    input_snapshot, deterministic_seed, execution_version, schema_version,
    engine_version, run_phase, result_bundle, request_hash,
    calibration_snapshot, destiny_mode, symbolic_lens_snapshot
  ) values (
    p_user_id, v_seed.id, 'formal-run-bundle-m1-v1', 'running', 'crossroad',
    case p_horizon_days when 30 then '30_days'::public.time_horizon else '90_days'::public.time_horizon end,
    jsonb_array_length(p_bundle->'events'),
    array(select id from public.agent_profiles where snapshot_id = v_graph.agent_snapshot_id and user_id = p_user_id order by id),
    array(select id from public.relation_edges where graph_snapshot_id = v_graph.id and user_id = p_user_id order by id),
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
    values(p_user_id,v_run_id,'formal-tick-m1-v1',v_index,coalesce(v_event->>'createdAt',''),coalesce(v_event->'operation','{}'::jsonb),coalesce(v_event->'deltas','[]'::jsonb),'{}'::jsonb,coalesce(v_event->>'eventType','Simulation event'),gen_random_uuid()::text,null,'formal-account-sandbox-m1-v1',p_idempotency_key::text||':tick:'||v_index,coalesce(v_event->>'branchId','unknown'),v_event)
    returning id into v_tick_id;
    insert into public.event_logs(user_id,simulation_id,simulation_tick_id,version,event_type,agent_ids,relation_edge_ids,summary,before_state,after_state,edge_weight_deltas,confidence,source,trace_id,writer_version,idempotency_key,event_payload)
    values(p_user_id,v_run_id,v_tick_id,'formal-event-m1-v1',coalesce(v_event->>'eventType','controlled_transition'),'{}','{}',coalesce(v_event->>'eventType','Controlled simulation event'),jsonb_build_object('revision',v_event->'beforeRevision'),jsonb_build_object('revision',v_event->'afterRevision'),coalesce(v_event->'deltas','[]'::jsonb),50,'v2_controlled_transition',gen_random_uuid()::text,'formal-account-sandbox-m1-v1',p_idempotency_key::text||':event:'||v_index,v_event)
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
    values(p_user_id,v_run_id,'formal-claim-m1-v1',coalesce(v_claim->>'claimType','scenario_frequency'),v_claim->>'statement',50,'low',v_evidence_ids,'{}','{}',false,jsonb_build_array(v_claim->>'uncertaintyStatement'),gen_random_uuid()::text,'formal-account-sandbox-m1-v1',p_idempotency_key::text||':claim:'||v_index,v_claim)
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
  values(p_user_id,v_run_id,'formal-report-m1-v1','preview_ready',v_claim_ids,jsonb_build_object('claim_ids',v_claim_ids,'source_labels',jsonb_build_array('Reality','Hypothesis','Simulation','Symbolic Lens')),'{}','Conditional simulation, not a prediction. Review evidence, assumptions, and uncertainty.',null,null,gen_random_uuid()::text,0,null,'formal-account-sandbox-m1-v1',p_idempotency_key::text||':report',v_report);

  update public.simulations set status='completed', run_phase='completed', result_bundle=p_bundle, completed_at=clock_timestamp()
  where id=v_run_id and user_id=p_user_id and status='running';
  if not found then raise exception using errcode='P0001',message='persistence_failed'; end if;
  insert into public.simulation_run_idempotency_receipts(user_id,graph_snapshot_id,idempotency_key,request_hash,simulation_id)
  values(p_user_id,p_graph_snapshot_id,p_idempotency_key,v_request_hash,v_run_id);
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

revoke all on function public.persist_account_sandbox_run_m1(uuid,uuid,uuid,integer,jsonb), public.simulations_m1_immutable_guard(), public.formal_run_artifact_m1_immutable_guard() from public, anon, authenticated;
grant execute on function public.persist_account_sandbox_run_m1(uuid,uuid,uuid,integer,jsonb) to service_role;
grant select on public.relation_graph_snapshots, public.agent_profile_snapshots, public.seed_contexts, public.agent_profiles, public.relation_edges to service_role;
grant select, insert, update on public.simulations to service_role;
grant select, insert on public.simulation_ticks, public.event_logs, public.claims, public.reports, public.simulation_run_idempotency_receipts to service_role;
