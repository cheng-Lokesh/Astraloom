-- M2: versioned, target-specific feedback for immutable formal Run artifacts.
-- Browser keys are safe ordinals. The RPC resolves them against this Run's
-- frozen result bundle and stores only the canonical internal target reference.

alter table public.feedback_logs
  add constraint feedback_logs_m2_shape_check check (
    version <> 'formal-run-feedback-m2-v1'
    or (
      simulation_id is not null
      and seed_context_id is not null
      and idempotency_key is not null
      and request_hash ~ '^[a-f0-9]{64}$'
      and writer_version = 'formal-run-feedback-m2-v1'
      and (
        (target_type = 'claim' and rating in ('accurate','partly_right','off','unclear','not_happened_yet'))
        or (target_type in ('agent','relation_edge') and rating in ('accurate','partly_right','off','unclear'))
        or (target_type = 'strategy' and rating in ('useful','not_useful','unclear'))
      )
    )
  );

create unique index feedback_logs_m2_owner_idempotency_unique
  on public.feedback_logs(user_id,idempotency_key)
  where version='formal-run-feedback-m2-v1';

create or replace function public.feedback_logs_m2_immutable_guard()
returns trigger language plpgsql security invoker set search_path=public,extensions as $$
begin
  if old.version='formal-run-feedback-m2-v1' then
    raise exception using errcode='42501',message='formal_feedback_immutable';
  end if;
  return coalesce(new,old);
end;
$$;

create trigger feedback_logs_m2_immutable_guard
before update or delete on public.feedback_logs
for each row execute function public.feedback_logs_m2_immutable_guard();

create or replace function public.feedback_logs_m2_writer_guard()
returns trigger language plpgsql security invoker set search_path=public,extensions as $$
begin
  if new.version='formal-run-feedback-m2-v1'
    and current_setting('app.m2_feedback_rpc',true) is distinct from 'on' then
    raise exception using errcode='42501',message='formal_feedback_writer_required';
  end if;
  return new;
end;
$$;

create trigger feedback_logs_m2_writer_guard
before insert on public.feedback_logs
for each row execute function public.feedback_logs_m2_writer_guard();

create or replace function public.append_account_sandbox_feedback_m2(
  p_run_id uuid,
  p_target_type text,
  p_target_key text,
  p_rating text,
  p_comment text,
  p_idempotency_key uuid
)
returns table(idempotent boolean, feedback jsonb)
language plpgsql security invoker set search_path=public,extensions as $$
declare
  v_user_id uuid := auth.uid();
  v_run record;
  v_existing record;
  v_hash text;
  v_target_prefix text;
  v_target_ordinal bigint;
  v_target_list jsonb;
  v_target_id text;
  v_comment text := trim(coalesce(p_comment,''));
  v_id uuid;
begin
  if v_user_id is null then raise exception using errcode='42501',message='unauthenticated'; end if;
  if p_run_id is null or p_idempotency_key is null or length(v_comment) > 2000 then
    raise exception using errcode='P0001',message='invalid_feedback';
  end if;

  v_target_prefix := case p_target_type
    when 'claim' then 'claim'
    when 'agent' then 'person'
    when 'relation_edge' then 'relation'
    when 'strategy' then 'strategy'
    else null
  end;
  if v_target_prefix is null or p_target_key is null or p_target_key !~ ('^' || v_target_prefix || '-[1-9][0-9]*$') then
    raise exception using errcode='P0001',message='invalid_feedback';
  end if;
  v_target_ordinal := substring(p_target_key from '[1-9][0-9]*$')::bigint;
  if v_target_ordinal > 2147483647 then raise exception using errcode='P0001',message='invalid_feedback'; end if;

  if not (
    (p_target_type = 'claim' and p_rating in ('accurate','partly_right','off','unclear','not_happened_yet'))
    or (p_target_type in ('agent','relation_edge') and p_rating in ('accurate','partly_right','off','unclear'))
    or (p_target_type = 'strategy' and p_rating in ('useful','not_useful','unclear'))
  ) then
    raise exception using errcode='P0001',message='invalid_feedback';
  end if;

  select id,seed_context_id,result_bundle into v_run from public.simulations
  where id=p_run_id and user_id=v_user_id and execution_version='formal-account-sandbox-m1-v1' and status='completed';
  if not found then raise exception using errcode='P0001',message='run_not_found'; end if;

  v_target_list := case p_target_type
    when 'claim' then v_run.result_bundle->'claims'
    when 'agent' then v_run.result_bundle#>'{inputSnapshot,agents}'
    when 'relation_edge' then v_run.result_bundle#>'{inputSnapshot,edges}'
    when 'strategy' then coalesce(v_run.result_bundle->'strategies',v_run.result_bundle#>'{report,strategies}')
    else null
  end;
  if jsonb_typeof(v_target_list) <> 'array' then raise exception using errcode='P0001',message='invalid_feedback'; end if;
  select item->>'id' into v_target_id
  from jsonb_array_elements(v_target_list) with ordinality as target_items(item,ordinal)
  where ordinal=v_target_ordinal and jsonb_typeof(item)='object' and nullif(item->>'id','') is not null;
  if v_target_id is null then raise exception using errcode='P0001',message='invalid_feedback'; end if;

  v_hash := encode(digest(convert_to(jsonb_build_object(
    'version','formal-run-feedback-m2-v1',
    'run_id',p_run_id,
    'target_type',p_target_type,
    'target_key',p_target_key,
    'rating',p_rating,
    'comment',v_comment
  )::text,'UTF8'),'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text||':m2-feedback:'||p_idempotency_key::text,0));
  select * into v_existing from public.feedback_logs
  where user_id=v_user_id and idempotency_key=p_idempotency_key and version='formal-run-feedback-m2-v1';
  if found then
    if v_existing.request_hash <> v_hash then raise exception using errcode='P0001',message='idempotency_key_content_conflict'; end if;
    idempotent := true;
    feedback := jsonb_build_object('target_type',v_existing.target_type,'target_key',p_target_key,'rating',v_existing.rating,'created_at',v_existing.created_at);
    return next; return;
  end if;

  perform set_config('app.m2_feedback_rpc','on',true);
  insert into public.feedback_logs(user_id,seed_context_id,simulation_id,target_type,target_id,rating,comment,agent_correction,edge_correction_note,version,writer_version,idempotency_key,request_hash)
  values(v_user_id,v_run.seed_context_id,v_run.id,p_target_type::public.feedback_target_type,v_target_id,p_rating,v_comment,'{}','', 'formal-run-feedback-m2-v1','formal-run-feedback-m2-v1',p_idempotency_key,v_hash)
  returning id into v_id;
  perform set_config('app.m2_feedback_rpc','off',true);
  select jsonb_build_object('target_type',target_type,'target_key',p_target_key,'rating',rating,'created_at',created_at) into feedback
  from public.feedback_logs where id=v_id and user_id=v_user_id;
  idempotent := false; return next;
end;
$$;

revoke all on function public.append_account_sandbox_feedback_m2(uuid,text,text,text,text,uuid), public.feedback_logs_m2_immutable_guard(), public.feedback_logs_m2_writer_guard() from public,anon;
grant execute on function public.append_account_sandbox_feedback_m2(uuid,text,text,text,text,uuid) to authenticated;
