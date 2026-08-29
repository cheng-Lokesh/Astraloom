-- M1.3: append-only feedback for the canonical formal Run. Read APIs use the
-- existing owner RLS on simulations; no second History or Result store exists.

alter table public.feedback_logs
  add column version text not null default 'legacy-feedback-v0',
  add column writer_version text not null default 'legacy-feedback-writer-v0',
  add column idempotency_key uuid,
  add column request_hash text;

alter table public.feedback_logs add constraint feedback_logs_m1_shape_check check (
  version <> 'formal-run-feedback-m1-v1'
  or (
    simulation_id is not null
    and seed_context_id is not null
    and target_type = 'overall'
    and target_id = simulation_id::text
    and rating in ('useful','mixed','off')
    and idempotency_key is not null
    and request_hash ~ '^[a-f0-9]{64}$'
    and writer_version = 'formal-run-feedback-m1-v1'
  )
);

create unique index feedback_logs_m1_owner_idempotency_unique
  on public.feedback_logs(user_id,idempotency_key)
  where version='formal-run-feedback-m1-v1';

create or replace function public.feedback_logs_m1_immutable_guard()
returns trigger language plpgsql security invoker set search_path=public,extensions as $$
begin
  if old.version='formal-run-feedback-m1-v1' then
    raise exception using errcode='42501',message='formal_feedback_immutable';
  end if;
  return coalesce(new,old);
end;
$$;

create trigger feedback_logs_m1_immutable_guard
before update or delete on public.feedback_logs
for each row execute function public.feedback_logs_m1_immutable_guard();

create or replace function public.append_account_sandbox_feedback_m1(
  p_run_id uuid,
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
  v_id uuid;
begin
  if v_user_id is null then raise exception using errcode='42501',message='unauthenticated'; end if;
  if p_run_id is null or p_idempotency_key is null or p_rating not in ('useful','mixed','off')
    or length(coalesce(p_comment,'')) > 2000 then
    raise exception using errcode='P0001',message='invalid_feedback';
  end if;
  select id,seed_context_id into v_run from public.simulations
  where id=p_run_id and user_id=v_user_id and execution_version='formal-account-sandbox-m1-v1' and status='completed';
  if not found then raise exception using errcode='P0001',message='run_not_found'; end if;
  v_hash := encode(digest(convert_to(jsonb_build_object('run_id',p_run_id,'rating',p_rating,'comment',trim(coalesce(p_comment,'')))::text,'UTF8'),'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text||':m1-feedback:'||p_idempotency_key::text,0));
  select * into v_existing from public.feedback_logs
  where user_id=v_user_id and idempotency_key=p_idempotency_key and version='formal-run-feedback-m1-v1';
  if found then
    if v_existing.request_hash <> v_hash then raise exception using errcode='P0001',message='idempotency_key_content_conflict'; end if;
    idempotent := true;
    feedback := jsonb_build_object('id',v_existing.id,'run_id',v_existing.simulation_id,'rating',v_existing.rating,'comment',v_existing.comment,'created_at',v_existing.created_at);
    return next; return;
  end if;
  insert into public.feedback_logs(user_id,seed_context_id,simulation_id,target_type,target_id,rating,comment,agent_correction,edge_correction_note,version,writer_version,idempotency_key,request_hash)
  values(v_user_id,v_run.seed_context_id,v_run.id,'overall',v_run.id::text,p_rating,trim(coalesce(p_comment,'')),'{}','', 'formal-run-feedback-m1-v1','formal-run-feedback-m1-v1',p_idempotency_key,v_hash)
  returning id into v_id;
  select jsonb_build_object('id',id,'run_id',simulation_id,'rating',rating,'comment',comment,'created_at',created_at) into feedback
  from public.feedback_logs where id=v_id and user_id=v_user_id;
  idempotent := false; return next;
end;
$$;

revoke all on function public.append_account_sandbox_feedback_m1(uuid,text,text,uuid), public.feedback_logs_m1_immutable_guard() from public,anon;
grant execute on function public.append_account_sandbox_feedback_m1(uuid,text,text,uuid) to authenticated;
