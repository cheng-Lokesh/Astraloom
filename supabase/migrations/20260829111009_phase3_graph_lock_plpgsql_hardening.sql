-- Phase 3 additive hardening: remove the unused lock-writer Seed record while
-- preserving the applied writer's authentication, ownership, lock, guard, and
-- idempotency behavior. The preceding migration remains immutable.

create or replace function public.lock_relation_graph_phase3(
  p_seed_context_id uuid,
  p_idempotency_key uuid
)
returns table(idempotent boolean, graph jsonb)
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_user uuid := auth.uid();
  v_graph record;
  v_agent record;
  v_receipt record;
  v_hash text;
begin
  perform set_config('app.phase3_graph_rpc', 'off', true);
  if v_user is null then
    raise exception using errcode = 'P0001', message = 'unauthenticated';
  end if;
  if p_seed_context_id is null or p_idempotency_key is null then
    raise exception using errcode = 'P0001', message = 'graph_snapshot_invalid';
  end if;

  perform 1
  from public.seed_contexts
  where id = p_seed_context_id
    and user_id = v_user
    and status = 'submitted'
    and simulation_track = 'crossroad'
    and submitted_at is not null
    and frozen_at is not null;
  if not found then
    raise exception using errcode = 'P0001', message = 'seed_not_found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':phase3-key-people:' || p_seed_context_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':graph-lock:' || p_idempotency_key::text, 0));
  perform set_config('app.phase3_graph_rpc', 'on', true);

  select id, user_id, seed_context_id, agent_snapshot_id, graph_locked, locked_at, safety_level, error_code
    into v_graph
  from public.relation_graph_snapshots
  where user_id = v_user and seed_context_id = p_seed_context_id
  order by created_at desc, id desc
  limit 1;
  if not found then
    raise exception using errcode = 'P0001', message = 'graph_snapshot_invalid';
  end if;

  select id, safety_level
    into v_agent
  from public.agent_profile_snapshots
  where user_id = v_user and seed_context_id = p_seed_context_id
  order by created_at desc, id desc
  limit 1;
  if not found or v_agent.id <> v_graph.agent_snapshot_id then
    raise exception using errcode = 'P0001', message = 'agent_snapshot_invalid';
  end if;
  if v_agent.safety_level = 'downgraded' then
    raise exception using errcode = 'P0001', message = 'safety_downgraded';
  end if;
  if not exists (
    select 1 from public.relation_edges e
    where e.graph_snapshot_id = v_graph.id
      and e.safety_level = v_graph.safety_level
      and jsonb_array_length(e.evidence_refs) > 0
  ) then
    raise exception using errcode = 'P0001', message = 'evidence_required';
  end if;

  v_hash := encode(digest(convert_to(jsonb_build_object(
    'owner_id', v_user,
    'seed_context_id', p_seed_context_id,
    'graph_snapshot_id', v_graph.id,
    'writer_version', 'phase3-graph-lock-v1'
  )::text, 'UTF8'), 'sha256'), 'hex');
  select seed_context_id, request_hash, graph_snapshot_id, operation
    into v_receipt
  from public.relation_graph_idempotency_receipts
  where user_id = v_user and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.operation <> 'lock'
      or v_receipt.seed_context_id <> p_seed_context_id
      or v_receipt.request_hash <> v_hash
      or v_receipt.graph_snapshot_id <> v_graph.id then
      raise exception using errcode = 'P0001', message = 'idempotency_key_content_conflict';
    end if;
    select jsonb_build_object(
      'id', id, 'agent_snapshot_id', agent_snapshot_id, 'version', version,
      'graph_locked', graph_locked, 'locked_at', locked_at,
      'safety_level', safety_level, 'error_code', error_code
    ) into graph
    from public.relation_graph_snapshots
    where id = v_receipt.graph_snapshot_id;
    idempotent := true;
    perform set_config('app.phase3_graph_rpc', 'off', true);
    return next;
    return;
  end if;

  if v_graph.graph_locked then
    raise exception using errcode = 'P0001', message = 'graph_locked';
  end if;
  update public.relation_graph_snapshots
  set graph_locked = true, locked_at = clock_timestamp()
  where id = v_graph.id and user_id = v_user and not graph_locked
  returning id, user_id, seed_context_id, agent_snapshot_id, graph_locked, locked_at, safety_level, error_code
    into v_graph;
  if not found then
    raise exception using errcode = 'P0001', message = 'graph_locked';
  end if;

  insert into public.relation_graph_idempotency_receipts(
    user_id, seed_context_id, idempotency_key, request_hash, graph_snapshot_id, operation
  ) values (
    v_user, p_seed_context_id, p_idempotency_key, v_hash, v_graph.id, 'lock'
  );
  graph := jsonb_build_object(
    'id', v_graph.id, 'agent_snapshot_id', v_graph.agent_snapshot_id,
    'version', 'phase3-graph-snapshot-v1', 'graph_locked', v_graph.graph_locked,
    'locked_at', v_graph.locked_at, 'safety_level', v_graph.safety_level,
    'error_code', v_graph.error_code
  );
  idempotent := false;
  perform set_config('app.phase3_graph_rpc', 'off', true);
  return next;
exception when others then
  perform set_config('app.phase3_graph_rpc', 'off', true);
  raise;
end;
$$;
