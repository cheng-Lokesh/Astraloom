create table public.life_climate_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_context_id uuid not null,
  profile_revision integer not null check (profile_revision >= 0),
  version text not null default 'life-climate-b1-v1' check (version = 'life-climate-b1-v1'),
  horizon text not null default '1_year' check (horizon = '1_year'),
  created_at timestamptz not null default transaction_timestamp(),
  trace_id text not null check (length(trace_id) between 1 and 96),
  idempotency_key uuid not null,
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  input_snapshot jsonb not null check (jsonb_typeof(input_snapshot) = 'object'),
  result_bundle jsonb not null check (jsonb_typeof(result_bundle) = 'object'),
  constraint life_climate_runs_owner_seed_fkey
    foreign key (seed_context_id, user_id)
    references public.seed_contexts(id, user_id)
    on delete cascade,
  constraint life_climate_runs_owner_idempotency_key
    unique (user_id, idempotency_key),
  constraint life_climate_runs_id_owner_key
    unique (id, user_id),
  constraint life_climate_runs_input_contract
    check (
      input_snapshot->>'version' = 'life-climate-b1-v1'
      and input_snapshot->>'horizon' = '1_year'
      and (input_snapshot->>'profileRevision')::integer = profile_revision
      and input_snapshot->>'safetyLevel' in ('safe', 'caution')
      and jsonb_typeof(input_snapshot->'lifeModelDomains') = 'object'
      and jsonb_typeof(input_snapshot->'change') = 'object'
    ),
  constraint life_climate_runs_result_contract
    check (
      result_bundle->>'version' = 'life-climate-b1-v1'
      and result_bundle->>'horizon' = '1_year'
      and (result_bundle->>'profileRevision')::integer = profile_revision
      and jsonb_typeof(result_bundle->'paths') = 'array'
      and jsonb_array_length(result_bundle->'paths') = 2
      and jsonb_typeof(result_bundle->'events') = 'array'
      and jsonb_array_length(result_bundle->'events') = 1
      and jsonb_typeof(result_bundle->'claims') = 'array'
      and jsonb_array_length(result_bundle->'claims') = 1
      and result_bundle#>>'{paths,0,id}' = 'baseline'
      and result_bundle#>>'{paths,1,id}' = 'alternative'
      and jsonb_array_length(result_bundle#>'{paths,0,periods}') = 4
      and jsonb_array_length(result_bundle#>'{paths,1,periods}') = 4
      and result_bundle#>>'{events,0,pathId}' = 'alternative'
      and result_bundle#>>'{events,0,source}' = 'user_assumption'
      and result_bundle#>>'{claims,0,evidenceEventIds,0}' = result_bundle#>>'{events,0,id}'
      and jsonb_array_length(result_bundle#>'{claims,0,evidenceEventIds}') = 1
      and result_bundle#>>'{report,claimIds,0}' = result_bundle#>>'{claims,0,id}'
      and jsonb_array_length(result_bundle#>'{report,claimIds}') = 1
      and result_bundle#>>'{report,includesExactDates}' = 'false'
      and result_bundle#>>'{report,claimsUseEventEvidence}' = 'true'
    )
);

create index life_climate_runs_owner_created_idx
  on public.life_climate_runs(user_id, created_at desc, id desc);

alter table public.life_climate_runs enable row level security;
revoke all on public.life_climate_runs from public, anon, authenticated, service_role;
grant select on public.life_climate_runs to authenticated;
grant select, insert on public.life_climate_runs to service_role;

create policy life_climate_runs_select_own
  on public.life_climate_runs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.persist_life_climate_run_b1(
  p_user_id uuid,
  p_seed_context_id uuid,
  p_profile_revision integer,
  p_idempotency_key uuid,
  p_input_snapshot jsonb,
  p_result_bundle jsonb,
  p_trace_id text
)
returns table (
  id uuid,
  idempotent boolean,
  created_at timestamptz,
  result_bundle jsonb
)
language plpgsql
security invoker
set search_path = public, extensions
as $function$
declare
  v_request_hash text;
  v_existing public.life_climate_runs%rowtype;
  v_run public.life_climate_runs%rowtype;
begin
  if current_user <> 'service_role' then
    raise exception using errcode = '42501', message = 'unauthenticated';
  end if;
  if p_user_id is null or p_seed_context_id is null or p_idempotency_key is null
    or p_profile_revision is null or p_profile_revision < 0
    or p_trace_id is null or length(p_trace_id) not between 1 and 96
  then
    raise exception using errcode = 'P0001', message = 'invalid_run_input';
  end if;

  if p_input_snapshot is null
    or jsonb_typeof(p_input_snapshot) is distinct from 'object'
    or jsonb_object_length(p_input_snapshot) <> 7
    or (p_input_snapshot - array['version','horizon','profileRevision','lifeModelDomains','change','safetyLevel','safetyFlags']::text[]) <> '{}'::jsonb
    or p_input_snapshot->>'version' <> 'life-climate-b1-v1'
    or p_input_snapshot->>'horizon' <> '1_year'
    or (p_input_snapshot->>'profileRevision')::integer <> p_profile_revision
    or p_input_snapshot->>'safetyLevel' not in ('safe','caution')
    or jsonb_typeof(p_input_snapshot->'lifeModelDomains') is distinct from 'object'
    or jsonb_typeof(p_input_snapshot->'change') is distinct from 'object'
    or jsonb_typeof(p_input_snapshot->'safetyFlags') is distinct from 'array'
    or jsonb_object_length(p_input_snapshot->'change') <> 5
    or (p_input_snapshot->'change' - array['domain','entryIndex','startPeriod','newState','evidenceSummary']::text[]) <> '{}'::jsonb
  then
    raise exception using errcode = 'P0001', message = 'invalid_run_input';
  end if;

  if p_result_bundle is null
    or jsonb_typeof(p_result_bundle) is distinct from 'object'
    or jsonb_object_length(p_result_bundle) <> 9
    or (p_result_bundle - array['version','horizon','profileRevision','profileSnapshot','selectedChange','paths','events','claims','report']::text[]) <> '{}'::jsonb
    or p_result_bundle->>'version' <> 'life-climate-b1-v1'
    or p_result_bundle->>'horizon' <> '1_year'
    or (p_result_bundle->>'profileRevision')::integer <> p_profile_revision
    or p_result_bundle->'selectedChange' <> p_input_snapshot->'change'
    or p_result_bundle#>'{profileSnapshot,lifeModelDomains}' <> p_input_snapshot->'lifeModelDomains'
    or jsonb_typeof(p_result_bundle->'paths') is distinct from 'array'
    or jsonb_array_length(p_result_bundle->'paths') <> 2
    or jsonb_typeof(p_result_bundle->'events') is distinct from 'array'
    or jsonb_array_length(p_result_bundle->'events') <> 1
    or jsonb_typeof(p_result_bundle->'claims') is distinct from 'array'
    or jsonb_array_length(p_result_bundle->'claims') <> 1
    or jsonb_typeof(p_result_bundle->'report') is distinct from 'object'
  then
    raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
  end if;

  if p_result_bundle#>>'{paths,0,id}' <> 'baseline'
    or p_result_bundle#>>'{paths,1,id}' <> 'alternative'
    or jsonb_typeof(p_result_bundle#>'{paths,0,periods}') is distinct from 'array'
    or jsonb_array_length(p_result_bundle#>'{paths,0,periods}') <> 4
    or jsonb_typeof(p_result_bundle#>'{paths,1,periods}') is distinct from 'array'
    or jsonb_array_length(p_result_bundle#>'{paths,1,periods}') <> 4
    or p_result_bundle#>>'{events,0,pathId}' <> 'alternative'
    or p_result_bundle#>>'{events,0,source}' <> 'user_assumption'
    or p_result_bundle#>>'{claims,0,evidenceEventIds,0}' <> p_result_bundle#>>'{events,0,id}'
    or jsonb_typeof(p_result_bundle#>'{claims,0,evidenceEventIds}') is distinct from 'array'
    or jsonb_array_length(p_result_bundle#>'{claims,0,evidenceEventIds}') <> 1
    or p_result_bundle#>>'{report,claimIds,0}' <> p_result_bundle#>>'{claims,0,id}'
    or jsonb_typeof(p_result_bundle#>'{report,claimIds}') is distinct from 'array'
    or jsonb_array_length(p_result_bundle#>'{report,claimIds}') <> 1
    or p_result_bundle#>>'{report,includesExactDates}' <> 'false'
    or p_result_bundle#>>'{report,claimsUseEventEvidence}' <> 'true'
  then
    raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
  end if;

  if not exists (
    select 1
    from public.seed_contexts seed
    where seed.id = p_seed_context_id
      and seed.user_id = p_user_id
      and seed.status = 'submitted'
      and seed.submitted_at is not null
      and seed.frozen_at is not null
      and seed.simulation_track = 'crossroad'
      and not exists (
        select 1
        from public.seed_contexts newer
        where newer.user_id = seed.user_id
          and newer.status = 'submitted'
          and newer.submitted_at is not null
          and newer.frozen_at is not null
          and (newer.submitted_at, newer.id) > (seed.submitted_at, seed.id)
      )
  ) then
    raise exception using errcode = 'P0001', message = 'life_climate_seed_not_found';
  end if;

  if not exists (
    select 1 from public.reality_profiles profile
    where profile.seed_context_id = p_seed_context_id
      and profile.user_id = p_user_id
      and profile.revision = p_profile_revision
      and profile.life_model_domains = p_input_snapshot->'lifeModelDomains'
  ) then
    raise exception using errcode = 'P0001', message = 'profile_revision_conflict';
  end if;

  v_request_hash := encode(digest(convert_to(jsonb_build_object(
    'user_id', p_user_id,
    'seed_context_id', p_seed_context_id,
    'profile_revision', p_profile_revision,
    'input_snapshot', p_input_snapshot
  )::text, 'UTF8'), 'sha256'), 'hex');

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':life-climate-b1:' || p_idempotency_key::text, 0));
  select * into v_existing
  from public.life_climate_runs existing
  where existing.user_id = p_user_id
    and existing.idempotency_key = p_idempotency_key;
  if found then
    if v_existing.request_hash <> v_request_hash then
      raise exception using errcode = 'P0001', message = 'idempotency_conflict';
    end if;
    return query select v_existing.id, true, v_existing.created_at, v_existing.result_bundle;
    return;
  end if;

  insert into public.life_climate_runs (
    user_id, seed_context_id, profile_revision, trace_id, idempotency_key,
    request_hash, input_snapshot, result_bundle
  ) values (
    p_user_id, p_seed_context_id, p_profile_revision, p_trace_id, p_idempotency_key,
    v_request_hash, p_input_snapshot, p_result_bundle
  ) returning * into v_run;

  return query select v_run.id, false, v_run.created_at, v_run.result_bundle;
end;
$function$;

revoke all on function public.persist_life_climate_run_b1(uuid,uuid,integer,uuid,jsonb,jsonb,text) from public, anon, authenticated;
grant execute on function public.persist_life_climate_run_b1(uuid,uuid,integer,uuid,jsonb,jsonb,text) to service_role;
grant select on public.seed_contexts, public.reality_profiles to service_role;
