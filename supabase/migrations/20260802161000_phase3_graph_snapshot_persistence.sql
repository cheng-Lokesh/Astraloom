-- Phase 3 Step C. This migration remains intentionally unapplied by this
-- change. Graphs are generated through one invoker RPC and may only transition
-- once, in place, from unlocked to locked.

select set_config('app.phase3_graph_rpc', 'off', true);

create function public.phase3_graph_weights_valid(p_weights jsonb)
returns boolean language sql immutable security invoker set search_path = pg_catalog as $$
  select jsonb_typeof(p_weights) = 'object'
    and p_weights = jsonb_build_object('trust', p_weights->'trust','hostility', p_weights->'hostility','dependency', p_weights->'dependency','attraction', p_weights->'attraction','competition', p_weights->'competition','information_gap', p_weights->'information_gap','resource_control', p_weights->'resource_control','emotional_debt', p_weights->'emotional_debt')
    and not exists (select 1 from jsonb_each(p_weights) w where jsonb_typeof(w.value) <> 'number' or (w.value #>> '{}') !~ '^(0|[1-9][0-9]?)$|^100$');
$$;

-- Step B is applied and immutable. This additive default only affects future
-- snapshots, so a newest Agent selected in the same transaction is time-ordered.
alter table public.agent_profile_snapshots alter column created_at set default clock_timestamp();

create table public.relation_graph_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_context_id uuid not null,
  agent_snapshot_id uuid not null,
  created_at timestamptz not null default clock_timestamp(),
  version text not null default 'phase3-graph-snapshot-v1',
  writer_version text not null default 'phase3-graph-writer-v1',
  graph_locked boolean not null default false,
  locked_at timestamptz,
  safety_level text not null check (safety_level in ('safe','caution')),
  error_code text,
  trace_id text not null default gen_random_uuid()::text,
  request_hash text not null,
  idempotency_key uuid not null,
  constraint relation_graph_snapshots_owner_seed_agent_fkey foreign key (agent_snapshot_id, user_id, seed_context_id) references public.agent_profile_snapshots(id, user_id, seed_context_id) on delete restrict,
  constraint relation_graph_snapshots_lock_consistency_check check (graph_locked = (locked_at is not null)),
  constraint relation_graph_snapshots_request_hash_length_check check (length(request_hash) = 64),
  constraint relation_graph_snapshots_version_check check (version = 'phase3-graph-snapshot-v1'),
  constraint relation_graph_snapshots_safety_error_code_check check (error_code is null),
  constraint relation_graph_snapshots_immutable_check check (writer_version = 'phase3-graph-writer-v1'),
  unique (id, user_id, seed_context_id),
  unique (id, user_id, seed_context_id, agent_snapshot_id),
  unique (id, user_id, seed_context_id, agent_snapshot_id, request_hash, safety_level)
);

create table public.relation_graph_idempotency_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_context_id uuid not null,
  idempotency_key uuid not null,
  request_hash text not null,
  graph_snapshot_id uuid not null,
  operation text not null check (operation in ('generate','lock')),
  created_at timestamptz not null default clock_timestamp(),
  constraint relation_graph_receipts_key_unique unique (user_id, idempotency_key),
  constraint relation_graph_receipts_request_hash_length_check check (length(request_hash) = 64),
  constraint relation_graph_receipts_owner_seed_fkey foreign key (graph_snapshot_id, user_id, seed_context_id) references public.relation_graph_snapshots(id, user_id, seed_context_id) on delete cascade,
  foreign key (seed_context_id, user_id) references public.seed_contexts(id, user_id) on delete cascade
);

-- The Step B ledger is empty at the authorized starting point. Add exact
-- endpoint identity keys rather than relying on an application-level join.
alter table public.agent_profiles add constraint agent_profiles_id_owner_seed_snapshot_key unique (id, user_id, seed_context_id, snapshot_id);
alter table public.relation_edges
  add column graph_snapshot_id uuid,
  add column agent_snapshot_id uuid,
  add column seed_context_id uuid,
  add column request_hash text,
  add column safety_level text,
  add column error_code text,
  add column field_sources jsonb not null default '{}'::jsonb,
  add column endpoint_low text generated always as (least(from_agent_id::text, to_agent_id::text)) stored,
  add column endpoint_high text generated always as (greatest(from_agent_id::text, to_agent_id::text)) stored;
alter table public.relation_edges
  alter column graph_snapshot_id set not null,
  alter column agent_snapshot_id set not null,
  alter column seed_context_id set not null,
  alter column request_hash set not null,
  alter column safety_level set not null;
alter table public.relation_edges drop constraint relation_edges_confidence_check;
alter table public.relation_edges
  add constraint relation_edges_graph_owner_seed_agent_fkey foreign key (graph_snapshot_id, user_id, seed_context_id, agent_snapshot_id) references public.relation_graph_snapshots(id, user_id, seed_context_id, agent_snapshot_id) on delete restrict,
  add constraint relation_edges_graph_full_binding_fkey foreign key (graph_snapshot_id, user_id, seed_context_id, agent_snapshot_id, request_hash, safety_level) references public.relation_graph_snapshots(id, user_id, seed_context_id, agent_snapshot_id, request_hash, safety_level) on delete restrict,
  add constraint relation_edges_from_endpoint_agent_snapshot_fkey foreign key (from_agent_id, user_id, seed_context_id, agent_snapshot_id) references public.agent_profiles(id, user_id, seed_context_id, snapshot_id) on delete restrict,
  add constraint relation_edges_endpoint_agent_snapshot_fkey foreign key (to_agent_id, user_id, seed_context_id, agent_snapshot_id) references public.agent_profiles(id, user_id, seed_context_id, snapshot_id) on delete restrict,
  add constraint relation_edges_no_self_edge_check check (from_agent_id <> to_agent_id),
  add constraint relation_edges_unordered_pair_unique unique (graph_snapshot_id, endpoint_low, endpoint_high),
  add constraint relation_edges_request_hash_length_check check (length(request_hash) = 64),
  add constraint relation_edges_evidence_nonempty_check check (jsonb_typeof(evidence_refs) = 'array' and jsonb_array_length(evidence_refs) > 0),
  add constraint relation_edges_weights_shape_check check (public.phase3_graph_weights_valid(weights)),
  add constraint relation_edges_confidence_check check (confidence = trunc(confidence) and confidence between 0 and 100),
  add constraint relation_edges_safety_error_code_check check (safety_level in ('safe','caution') and error_code is null),
  add constraint relation_edges_phase3_no_simulation_check check (simulation_id is null),
  add constraint relation_edges_no_last_event_or_simulation_check check (last_interaction_event_id is null and simulation_id is null),
  add constraint relation_edges_version_check check (version = 'phase3-graph-snapshot-v1'),
  add constraint relation_edges_agent_snapshot_endpoint_check check (agent_snapshot_id is not null);

create index relation_graph_snapshots_owner_seed_created_idx on public.relation_graph_snapshots(user_id, seed_context_id, created_at desc, id desc);
create index relation_edges_graph_created_idx on public.relation_edges(graph_snapshot_id, created_at, id);

alter table public.relation_graph_snapshots enable row level security;
alter table public.relation_graph_idempotency_receipts enable row level security;
alter table public.relation_edges enable row level security;
revoke all on public.relation_graph_snapshots, public.relation_graph_idempotency_receipts, public.relation_edges from anon, authenticated;
grant select (id,user_id,seed_context_id,agent_snapshot_id,created_at,version,graph_locked,locked_at,safety_level,error_code) on public.relation_graph_snapshots to authenticated;
grant select (id,user_id,seed_context_id,graph_snapshot_id,agent_snapshot_id,from_agent_id,to_agent_id,created_at,version,relationship_type,weights,confidence,evidence_refs,safety_level) on public.relation_edges to authenticated;
grant select (user_id,seed_context_id,idempotency_key,request_hash,graph_snapshot_id,operation) on public.relation_graph_idempotency_receipts to authenticated;
grant insert (user_id,seed_context_id,agent_snapshot_id,graph_locked,locked_at,safety_level,error_code,request_hash,idempotency_key) on public.relation_graph_snapshots to authenticated;
grant update (graph_locked,locked_at) on public.relation_graph_snapshots to authenticated;
grant insert (user_id,seed_context_id,graph_snapshot_id,agent_snapshot_id,from_agent_id,to_agent_id,version,relationship_type,weights,trend,last_interaction_event_id,confidence,evidence_refs,trace_id,request_hash,safety_level,writer_version,idempotency_key,field_sources) on public.relation_edges to authenticated;
grant insert (user_id,seed_context_id,idempotency_key,request_hash,graph_snapshot_id,operation) on public.relation_graph_idempotency_receipts to authenticated;

create policy "relation_graph_snapshots_select_phase3_owner" on public.relation_graph_snapshots for select to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.seed_contexts s where s.id = seed_context_id and s.user_id = (select auth.uid()) and s.status = 'submitted' and s.frozen_at is not null));
create policy "relation_graph_snapshots_insert_phase3_rpc" on public.relation_graph_snapshots for insert to authenticated with check ((select auth.uid()) = user_id and current_setting('app.phase3_graph_rpc',true) = 'on');
create policy "relation_graph_snapshots_update_phase3_lock_rpc" on public.relation_graph_snapshots for update to authenticated using ((select auth.uid()) = user_id and not graph_locked and current_setting('app.phase3_graph_rpc',true) = 'on') with check ((select auth.uid()) = user_id and graph_locked and locked_at is not null and current_setting('app.phase3_graph_rpc',true) = 'on');
create policy "relation_edges_select_phase3_owner" on public.relation_edges for select to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.seed_contexts s where s.id = seed_context_id and s.user_id = (select auth.uid()) and s.status = 'submitted' and s.frozen_at is not null));
create policy "relation_edges_insert_phase3_rpc" on public.relation_edges for insert to authenticated with check ((select auth.uid()) = user_id and current_setting('app.phase3_graph_rpc',true) = 'on');
create policy "relation_graph_receipts_select_phase3_rpc" on public.relation_graph_idempotency_receipts for select to authenticated using ((select auth.uid()) = user_id and current_setting('app.phase3_graph_rpc',true) = 'on');
create policy "relation_graph_receipts_insert_phase3_rpc" on public.relation_graph_idempotency_receipts for insert to authenticated with check ((select auth.uid()) = user_id and current_setting('app.phase3_graph_rpc',true) = 'on');

create function public.phase3_relation_graph_lock_guard()
returns trigger language plpgsql security invoker set search_path = public, extensions as $$
begin
  if current_setting('app.phase3_graph_rpc', true) <> 'on' then raise exception using errcode = '42501', message = 'graph_locked'; end if;
  if old.graph_locked or not new.graph_locked or new.locked_at is null
    or (to_jsonb(new) - array['graph_locked','locked_at']) is distinct from (to_jsonb(old) - array['graph_locked','locked_at']) then
    raise exception using errcode = '42501', message = 'graph_locked';
  end if;
  return new;
end;
$$;
create trigger relation_graph_snapshots_lock_guard_phase3 before update on public.relation_graph_snapshots for each row execute function public.phase3_relation_graph_lock_guard();

create function public.phase3_relation_edges_endpoint_guard()
returns trigger language plpgsql security invoker set search_path = public, extensions as $$
declare v_from record; v_to record;
begin
  if current_setting('app.phase3_graph_rpc', true) <> 'on' then raise exception using errcode = '42501', message = 'graph_snapshot_invalid'; end if;
  select agent_type, evidence_refs into v_from from public.agent_profiles where id = new.from_agent_id and snapshot_id = new.agent_snapshot_id and user_id = new.user_id and seed_context_id = new.seed_context_id;
  if not found then raise exception using errcode = 'P0001', message = 'agent_snapshot_invalid'; end if;
  select agent_type, evidence_refs into v_to from public.agent_profiles where id = new.to_agent_id and snapshot_id = new.agent_snapshot_id and user_id = new.user_id and seed_context_id = new.seed_context_id;
  if not found then raise exception using errcode = 'P0001', message = 'agent_snapshot_invalid'; end if;
  if (v_from.agent_type <> 'user_core' and v_to.agent_type <> 'user_core')
    or not (new.evidence_refs <@ (v_from.evidence_refs || v_to.evidence_refs))
  then raise exception using errcode = 'P0001', message = 'evidence_required'; end if;
  return new;
end;
$$;
create trigger relation_edges_phase3_endpoint_guard before insert or update on public.relation_edges for each row execute function public.phase3_relation_edges_endpoint_guard();

create or replace function public.generate_relation_graph_phase3(p_seed_context_id uuid, p_idempotency_key uuid)
returns table (idempotent boolean, graph jsonb, edges jsonb) language plpgsql security invoker set search_path = public, extensions as $$
declare v_user uuid := auth.uid(); v_seed record; v_agent record; v_receipt record; v_graph uuid; v_hash text; v_edge record; v_core record; v_weights jsonb; v_evidence jsonb; v_relationship text; v_confidence integer;
begin
  perform set_config('app.phase3_graph_rpc', 'off', true);
  if v_user is null then raise exception using errcode='P0001',message='unauthenticated'; end if;
  if p_seed_context_id is null or p_idempotency_key is null then raise exception using errcode='P0001',message='graph_snapshot_invalid'; end if;
  select * into v_seed from public.seed_contexts where id=p_seed_context_id and user_id=v_user and status='submitted' and simulation_track='crossroad' and submitted_at is not null and frozen_at is not null;
  if not found then raise exception using errcode='P0001',message='seed_not_found'; end if;
  if lower(coalesce(v_seed.user_question,'') || ' ' || coalesce(v_seed.raw_context,'') || ' ' || coalesce(v_seed.safety_flags::text,'')) ~ '(suicide|self[[:space:]-]?harm|violence|violent|threat|assault|attack|murder|kill (him|her|them|someone)|minor safety|underage|child abuse|child safety)' then raise exception using errcode='P0001',message='safety_blocked'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':phase3-key-people:' || p_seed_context_id::text,0));
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':graph:' || p_idempotency_key::text,0));
  select id, user_id, seed_context_id, safety_level into v_agent from public.agent_profile_snapshots where user_id=v_user and seed_context_id=p_seed_context_id order by created_at desc,id desc limit 1;
  if not found then raise exception using errcode='P0001',message='agent_snapshot_invalid'; end if;
  if v_agent.safety_level='downgraded' then raise exception using errcode='P0001',message='safety_downgraded'; end if;
  select id, agent_type, evidence_refs, confidence into v_core from public.agent_profiles where snapshot_id=v_agent.id and user_id=v_user and seed_context_id=p_seed_context_id and agent_type='user_core';
  if not found or (select count(*) from public.agent_profiles where snapshot_id=v_agent.id and user_id=v_user and seed_context_id=p_seed_context_id and agent_type='user_core') <> 1 then raise exception using errcode='P0001',message='agent_snapshot_invalid'; end if;
  if (select count(*) from public.agent_profiles where snapshot_id=v_agent.id and user_id=v_user and seed_context_id=p_seed_context_id) < 2 then raise exception using errcode='P0001',message='agent_snapshot_invalid'; end if;
  v_hash:=encode(digest(convert_to(jsonb_build_object('owner_id',v_user,'seed_context_id',p_seed_context_id,'agent_snapshot_id',v_agent.id,'writer_version','phase3-graph-writer-v1')::text,'UTF8'),'sha256'),'hex');
  perform set_config('app.phase3_graph_rpc','on',true);
  select seed_context_id, request_hash, graph_snapshot_id, operation into v_receipt from public.relation_graph_idempotency_receipts where user_id=v_user and idempotency_key=p_idempotency_key;
  if found then
    if v_receipt.operation <> 'generate' or v_receipt.seed_context_id <> p_seed_context_id or v_receipt.request_hash <> v_hash then raise exception using errcode='P0001',message='idempotency_key_content_conflict'; end if;
    select id into v_graph from public.relation_graph_snapshots where id=v_receipt.graph_snapshot_id and user_id=v_user;
    if not found then raise exception using errcode='P0001',message='persistence_failed'; end if;
    select jsonb_build_object('id',id,'agent_snapshot_id',agent_snapshot_id,'version',version,'graph_locked',graph_locked,'locked_at',locked_at,'safety_level',safety_level,'error_code',error_code) into graph from public.relation_graph_snapshots where id=v_graph;
    select coalesce(jsonb_agg(jsonb_build_object('id',id,'graph_snapshot_id',graph_snapshot_id,'agent_snapshot_id',agent_snapshot_id,'from_agent_id',from_agent_id,'to_agent_id',to_agent_id,'version',version,'relationship_type',relationship_type,'weights',weights,'confidence',confidence,'evidence_refs',evidence_refs,'safety_level',safety_level) order by created_at,id),'[]'::jsonb) into edges from public.relation_edges where graph_snapshot_id=v_graph;
    idempotent:=true; perform set_config('app.phase3_graph_rpc', 'off', true); return next; return;
  end if;
  if exists(select 1 from public.relation_graph_snapshots where user_id=v_user and seed_context_id=p_seed_context_id and graph_locked) then raise exception using errcode='P0001',message='graph_locked'; end if;
  insert into public.relation_graph_snapshots(user_id,seed_context_id,agent_snapshot_id,safety_level,request_hash,idempotency_key) values(v_user,p_seed_context_id,v_agent.id,v_agent.safety_level,v_hash,p_idempotency_key) returning id into v_graph;
  for v_edge in select id,agent_type,evidence_refs,confidence,relationship_to_user from public.agent_profiles where snapshot_id=v_agent.id and user_id=v_user and seed_context_id=p_seed_context_id and id <> v_core.id order by agent_type,created_at,id loop
    v_relationship := case when v_edge.agent_type = 'user_variant' then 'support' when lower(coalesce(v_edge.relationship_to_user,'')) like '%compet%' then 'competitive' when lower(coalesce(v_edge.relationship_to_user,'')) like '%family%' then 'family' when lower(coalesce(v_edge.relationship_to_user,'')) like '%friend%' then 'personal' else 'professional' end;
    v_confidence := least(100, greatest(0, 45 + trunc(v_edge.confidence / 3)::integer + case when v_edge.agent_type = 'npc' then 8 else 3 end));
    v_weights := jsonb_build_object('trust', least(100, 35 + trunc(v_edge.confidence / 2)::integer), 'hostility', case when v_relationship='competitive' then 35 else 5 end, 'dependency', case when v_edge.agent_type='npc' then 25 else 15 end, 'attraction', 0, 'competition', case when v_relationship='competitive' then 60 else case when v_edge.agent_type='user_variant' then 20 else 10 end end, 'information_gap', greatest(0, 100 - trunc(v_edge.confidence)::integer), 'resource_control', case when v_edge.agent_type='npc' then 30 else 10 end, 'emotional_debt', case when v_relationship='personal' then 20 else 5 end);
    select jsonb_agg(distinct ref order by ref) into v_evidence from jsonb_array_elements_text(v_core.evidence_refs || v_edge.evidence_refs) ref;
    if v_evidence is null or jsonb_array_length(v_evidence)=0 then raise exception using errcode='P0001',message='evidence_required'; end if;
    insert into public.relation_edges(user_id,seed_context_id,graph_snapshot_id,agent_snapshot_id,from_agent_id,to_agent_id,version,relationship_type,weights,trend,confidence,evidence_refs,trace_id,request_hash,safety_level,writer_version,idempotency_key,field_sources) values(v_user,p_seed_context_id,v_graph,v_agent.id,v_core.id,v_edge.id,'phase3-graph-snapshot-v1',v_relationship,v_weights,'{}'::jsonb,v_confidence,v_evidence,gen_random_uuid()::text,v_hash,v_agent.safety_level,'phase3-graph-writer-v1',p_idempotency_key,'{}'::jsonb);
  end loop;
  if not exists(select 1 from public.relation_edges where graph_snapshot_id=v_graph) then raise exception using errcode='P0001',message='evidence_required'; end if;
  insert into public.relation_graph_idempotency_receipts(user_id,seed_context_id,idempotency_key,request_hash,graph_snapshot_id,operation) values(v_user,p_seed_context_id,p_idempotency_key,v_hash,v_graph,'generate');
  select jsonb_build_object('id',id,'agent_snapshot_id',agent_snapshot_id,'version',version,'graph_locked',graph_locked,'locked_at',locked_at,'safety_level',safety_level,'error_code',error_code) into graph from public.relation_graph_snapshots where id=v_graph;
  select jsonb_agg(jsonb_build_object('id',id,'graph_snapshot_id',graph_snapshot_id,'agent_snapshot_id',agent_snapshot_id,'from_agent_id',from_agent_id,'to_agent_id',to_agent_id,'version',version,'relationship_type',relationship_type,'weights',weights,'confidence',confidence,'evidence_refs',evidence_refs,'safety_level',safety_level) order by created_at,id) into edges from public.relation_edges where graph_snapshot_id=v_graph;
  idempotent:=false; perform set_config('app.phase3_graph_rpc', 'off', true); return next;
exception when others then perform set_config('app.phase3_graph_rpc', 'off', true); raise; end;
$$;

create or replace function public.lock_relation_graph_phase3(p_seed_context_id uuid,p_idempotency_key uuid)
returns table(idempotent boolean,graph jsonb) language plpgsql security invoker set search_path = public, extensions as $$
declare v_user uuid:=auth.uid();v_seed record;v_graph record;v_agent record;v_receipt record;v_hash text;
begin
 perform set_config('app.phase3_graph_rpc', 'off', true); if v_user is null then raise exception using errcode='P0001',message='unauthenticated'; end if; if p_seed_context_id is null or p_idempotency_key is null then raise exception using errcode='P0001',message='graph_snapshot_invalid'; end if;
 select id, user_id into v_seed from public.seed_contexts where id=p_seed_context_id and user_id=v_user and status='submitted' and simulation_track='crossroad' and submitted_at is not null and frozen_at is not null; if not found then raise exception using errcode='P0001',message='seed_not_found'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':phase3-key-people:' || p_seed_context_id::text,0)); perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':graph-lock:' || p_idempotency_key::text,0)); perform set_config('app.phase3_graph_rpc', 'on', true);
 select id, user_id, seed_context_id, agent_snapshot_id, graph_locked, locked_at, safety_level, error_code into v_graph from public.relation_graph_snapshots where user_id=v_user and seed_context_id=p_seed_context_id order by created_at desc,id desc limit 1; if not found then raise exception using errcode='P0001',message='graph_snapshot_invalid'; end if;
 select id, safety_level into v_agent from public.agent_profile_snapshots where user_id=v_user and seed_context_id=p_seed_context_id order by created_at desc,id desc limit 1; if not found or v_agent.id<>v_graph.agent_snapshot_id then raise exception using errcode='P0001',message='agent_snapshot_invalid'; end if; if v_agent.safety_level='downgraded' then raise exception using errcode='P0001',message='safety_downgraded'; end if; if not exists(select 1 from public.relation_edges e where e.graph_snapshot_id=v_graph.id and e.safety_level=v_graph.safety_level and jsonb_array_length(e.evidence_refs)>0) then raise exception using errcode='P0001',message='evidence_required'; end if;
 v_hash:=encode(digest(convert_to(jsonb_build_object('owner_id',v_user,'seed_context_id',p_seed_context_id,'graph_snapshot_id',v_graph.id,'writer_version','phase3-graph-lock-v1')::text,'UTF8'),'sha256'),'hex'); select seed_context_id, request_hash, graph_snapshot_id, operation into v_receipt from public.relation_graph_idempotency_receipts where user_id=v_user and idempotency_key=p_idempotency_key;
 if found then if v_receipt.operation<>'lock' or v_receipt.seed_context_id<>p_seed_context_id or v_receipt.request_hash<>v_hash or v_receipt.graph_snapshot_id<>v_graph.id then raise exception using errcode='P0001',message='idempotency_key_content_conflict'; end if; select jsonb_build_object('id',id,'agent_snapshot_id',agent_snapshot_id,'version',version,'graph_locked',graph_locked,'locked_at',locked_at,'safety_level',safety_level,'error_code',error_code) into graph from public.relation_graph_snapshots where id=v_receipt.graph_snapshot_id; idempotent:=true; perform set_config('app.phase3_graph_rpc', 'off', true); return next; return; end if;
 if v_graph.graph_locked then raise exception using errcode='P0001',message='graph_locked'; end if;
 update public.relation_graph_snapshots set graph_locked=true, locked_at=clock_timestamp() where id=v_graph.id and user_id=v_user and not graph_locked returning id, user_id, seed_context_id, agent_snapshot_id, graph_locked, locked_at, safety_level, error_code into v_graph;
 if not found then raise exception using errcode='P0001',message='graph_locked'; end if;
 insert into public.relation_graph_idempotency_receipts(user_id,seed_context_id,idempotency_key,request_hash,graph_snapshot_id,operation) values(v_user,p_seed_context_id,p_idempotency_key,v_hash,v_graph.id,'lock'); graph:=jsonb_build_object('id',v_graph.id,'agent_snapshot_id',v_graph.agent_snapshot_id,'version','phase3-graph-snapshot-v1','graph_locked',v_graph.graph_locked,'locked_at',v_graph.locked_at,'safety_level',v_graph.safety_level,'error_code',v_graph.error_code); idempotent:=false; perform set_config('app.phase3_graph_rpc', 'off', true); return next;
 exception when others then perform set_config('app.phase3_graph_rpc', 'off', true); raise; end;
$$;
revoke all on function public.generate_relation_graph_phase3(uuid,uuid), public.lock_relation_graph_phase3(uuid,uuid), public.phase3_relation_graph_lock_guard(), public.phase3_relation_edges_endpoint_guard() from public,anon;
grant execute on function public.generate_relation_graph_phase3(uuid,uuid), public.lock_relation_graph_phase3(uuid,uuid) to authenticated;
