-- Additive repair for the already-applied Graph snapshot migration.
-- An absent custom GUC yields NULL, for which "<> 'on'" is NULL rather than
-- true. IS DISTINCT FROM keeps both NULL and an empty/reset value closed.

create or replace function public.phase3_relation_graph_lock_guard()
returns trigger language plpgsql security invoker set search_path = public, extensions as $$
begin
  if current_setting('app.phase3_graph_rpc', true) is distinct from 'on' then raise exception using errcode = '42501', message = 'graph_locked'; end if;
  if old.graph_locked or not new.graph_locked or new.locked_at is null
    or (to_jsonb(new) - array['graph_locked','locked_at']) is distinct from (to_jsonb(old) - array['graph_locked','locked_at']) then
    raise exception using errcode = '42501', message = 'graph_locked';
  end if;
  return new;
end;
$$;

create or replace function public.phase3_relation_edges_endpoint_guard()
returns trigger language plpgsql security invoker set search_path = public, extensions as $$
declare v_from record; v_to record;
begin
  if current_setting('app.phase3_graph_rpc', true) is distinct from 'on' then raise exception using errcode = '42501', message = 'graph_snapshot_invalid'; end if;
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

revoke all on function public.phase3_relation_graph_lock_guard(), public.phase3_relation_edges_endpoint_guard() from public, anon;
