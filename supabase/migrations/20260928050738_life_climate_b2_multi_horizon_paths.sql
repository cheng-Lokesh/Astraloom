alter table public.life_climate_runs
  drop constraint if exists life_climate_runs_version_check,
  drop constraint if exists life_climate_runs_horizon_check,
  drop constraint if exists life_climate_runs_input_contract,
  drop constraint if exists life_climate_runs_result_contract;

alter table public.life_climate_runs
  add constraint life_climate_runs_version_check
    check (version in ('life-climate-b1-v1', 'life-climate-b2-v1')),
  add constraint life_climate_runs_horizon_check
    check (
      (version = 'life-climate-b1-v1' and horizon = '1_year')
      or (version = 'life-climate-b2-v1' and horizon in ('1_year', '3_years', '5_years'))
    ),
  add constraint life_climate_runs_input_contract
    check (
      case
        when version = 'life-climate-b1-v1' then
          input_snapshot->>'version' = 'life-climate-b1-v1'
          and input_snapshot->>'horizon' = '1_year'
          and jsonb_typeof(input_snapshot->'change') = 'object'
        when version = 'life-climate-b2-v1' then
          input_snapshot->>'version' = 'life-climate-b2-v1'
          and input_snapshot->>'horizon' in ('1_year', '3_years', '5_years')
          and case
            when jsonb_typeof(input_snapshot->'changes') = 'array'
              then jsonb_array_length(input_snapshot->'changes') between 1 and 12
                and not jsonb_path_exists(input_snapshot, '$.changes[*] ? (@.domain != $.changes[0].domain)')
            else false
          end
        else false
      end
      and case
        when input_snapshot->>'profileRevision' ~ '^[0-9]+$'
          then (input_snapshot->>'profileRevision')::integer = profile_revision
        else false
      end
      and input_snapshot->>'safetyLevel' in ('safe', 'caution')
      and jsonb_typeof(input_snapshot->'lifeModelDomains') = 'object'
      and jsonb_typeof(input_snapshot->'safetyFlags') = 'array'
    ),
  add constraint life_climate_runs_result_contract
    check (
      case
        when version = 'life-climate-b1-v1' then
          result_bundle->>'version' = 'life-climate-b1-v1'
          and result_bundle->>'horizon' = '1_year'
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
        when version = 'life-climate-b2-v1' then
          result_bundle->>'version' = 'life-climate-b2-v1'
          and result_bundle->>'horizon' = horizon
          and case
            when result_bundle->>'profileRevision' ~ '^[0-9]+$'
              then (result_bundle->>'profileRevision')::integer = profile_revision
            else false
          end
          and result_bundle->'selectedChanges' = input_snapshot->'changes'
          and jsonb_typeof(result_bundle->'profileSnapshot') = 'object'
          and result_bundle#>'{profileSnapshot,lifeModelDomains}' = input_snapshot->'lifeModelDomains'
          and case
            when jsonb_typeof(result_bundle->'paths') = 'array'
              then jsonb_array_length(result_bundle->'paths') = 2
            else false
          end
          and result_bundle#>>'{paths,0,id}' = 'baseline'
          and result_bundle#>>'{paths,1,id}' = 'alternative'
          and case
            when jsonb_typeof(result_bundle->'events') = 'array'
              and jsonb_typeof(input_snapshot->'changes') = 'array'
              then jsonb_array_length(result_bundle->'events') = jsonb_array_length(input_snapshot->'changes')
            else false
          end
          and case
            when jsonb_typeof(result_bundle->'claims') = 'array'
              and jsonb_typeof(input_snapshot->'changes') = 'array'
              then jsonb_array_length(result_bundle->'claims') = jsonb_array_length(input_snapshot->'changes')
            else false
          end
          and case
            when jsonb_typeof(result_bundle#>'{report,claimIds}') = 'array'
              and jsonb_typeof(input_snapshot->'changes') = 'array'
              then jsonb_array_length(result_bundle#>'{report,claimIds}') = jsonb_array_length(input_snapshot->'changes')
            else false
          end
          and result_bundle#>>'{report,includesExactDates}' = 'false'
          and result_bundle#>>'{report,claimsUseEventEvidence}' = 'true'
          and case horizon
            when '1_year' then
              case when jsonb_typeof(result_bundle#>'{paths,0,periods}') = 'array'
                then jsonb_array_length(result_bundle#>'{paths,0,periods}') = 4 else false end
              and case when jsonb_typeof(result_bundle#>'{paths,1,periods}') = 'array'
                then jsonb_array_length(result_bundle#>'{paths,1,periods}') = 4 else false end
            when '3_years' then
              case when jsonb_typeof(result_bundle#>'{paths,0,periods}') = 'array'
                then jsonb_array_length(result_bundle#>'{paths,0,periods}') = 3 else false end
              and case when jsonb_typeof(result_bundle#>'{paths,1,periods}') = 'array'
                then jsonb_array_length(result_bundle#>'{paths,1,periods}') = 3 else false end
            when '5_years' then
              case when jsonb_typeof(result_bundle#>'{paths,0,periods}') = 'array'
                then jsonb_array_length(result_bundle#>'{paths,0,periods}') = 5 else false end
              and case when jsonb_typeof(result_bundle#>'{paths,1,periods}') = 'array'
                then jsonb_array_length(result_bundle#>'{paths,1,periods}') = 5 else false end
            else false
          end
        else false
      end
    );

create or replace function public.persist_life_climate_run_b2(
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
  v_change jsonb;
  v_event jsonb;
  v_claim jsonb;
  v_domain text;
  v_entry_index integer;
  v_period_index integer;
  v_period_count integer;
  v_change_count integer;
  v_index integer;
  v_expected_path_periods integer;
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
    or not (p_input_snapshot ?& array['version','horizon','profileRevision','lifeModelDomains','changes','safetyLevel','safetyFlags']::text[])
    or (p_input_snapshot - array['version','horizon','profileRevision','lifeModelDomains','changes','safetyLevel','safetyFlags']::text[]) <> '{}'::jsonb
    or p_input_snapshot->>'version' <> 'life-climate-b2-v1'
    or p_input_snapshot->>'horizon' not in ('1_year','3_years','5_years')
    or jsonb_typeof(p_input_snapshot->'profileRevision') is distinct from 'number'
    or jsonb_typeof(p_input_snapshot->'lifeModelDomains') is distinct from 'object'
    or jsonb_typeof(p_input_snapshot->'changes') is distinct from 'array'
    or jsonb_typeof(p_input_snapshot->'safetyFlags') is distinct from 'array'
    or p_input_snapshot->>'safetyLevel' not in ('safe','caution')
  then
    raise exception using errcode = 'P0001', message = 'invalid_run_input';
  end if;
  if (p_input_snapshot->>'profileRevision')::integer <> p_profile_revision then
    raise exception using errcode = 'P0001', message = 'invalid_run_input';
  end if;

  v_change_count := jsonb_array_length(p_input_snapshot->'changes');
  v_period_count := case p_input_snapshot->>'horizon'
    when '1_year' then 4
    when '3_years' then 3
    when '5_years' then 5
  end;
  if v_change_count not between 1 and 12 then
    raise exception using errcode = 'P0001', message = 'invalid_run_input';
  end if;
  if jsonb_path_exists(p_input_snapshot, '$.changes[*] ? (@.domain != $.changes[0].domain)') then
    raise exception using errcode = 'P0001', message = 'invalid_run_input';
  end if;

  for v_change in select value from jsonb_array_elements(p_input_snapshot->'changes') as changes(value)
  loop
    if jsonb_typeof(v_change) is distinct from 'object'
      or not (v_change ?& array['domain','entryIndex','startPeriod','newState','evidenceSummary']::text[])
      or (v_change - array['domain','entryIndex','startPeriod','newState','evidenceSummary']::text[]) <> '{}'::jsonb
      or v_change->>'domain' not in ('identity','career','wealth','relationships','environment','lifeStage')
      or jsonb_typeof(v_change->'entryIndex') is distinct from 'number'
      or jsonb_typeof(v_change->'startPeriod') is distinct from 'number'
      or v_change->>'entryIndex' !~ '^[0-7]$'
      or v_change->>'startPeriod' !~ '^[1-5]$'
    then
      raise exception using errcode = 'P0001', message = 'invalid_run_input';
    end if;
    v_domain := v_change->>'domain';
    v_entry_index := (v_change->>'entryIndex')::integer;
    v_period_index := (v_change->>'startPeriod')::integer;
    if v_period_index > v_period_count then
      raise exception using errcode = 'P0001', message = 'invalid_run_input';
    end if;
    if jsonb_typeof(p_input_snapshot->'lifeModelDomains'->v_domain) is distinct from 'array' then
      raise exception using errcode = 'P0001', message = 'invalid_run_input';
    end if;
    if v_entry_index >= jsonb_array_length(p_input_snapshot->'lifeModelDomains'->v_domain) then
      raise exception using errcode = 'P0001', message = 'invalid_run_input';
    end if;
    if jsonb_typeof(v_change->'newState') is distinct from 'string'
      or length(trim(v_change->>'newState')) not between 1 and 240
      or (v_change->>'newState') ~ '[[:cntrl:]]'
      or (v_change->>'newState') ~ '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
      or (v_change->>'newState') ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
      or (v_change->>'newState') ~* '\m(raw[[:space:]]+(scenario|evidence)|trace([_ -]?id)?|internal([_ -]?key)?|token|secret|password|api[_ -]?key)\M'
      or jsonb_typeof(v_change->'evidenceSummary') is distinct from 'string'
      or length(trim(v_change->>'evidenceSummary')) not between 1 and 160
      or (v_change->>'evidenceSummary') ~ '[[:cntrl:]]'
      or (v_change->>'evidenceSummary') ~ '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
      or (v_change->>'evidenceSummary') ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
      or (v_change->>'evidenceSummary') ~* '\m(raw[[:space:]]+(scenario|evidence)|trace([_ -]?id)?|internal([_ -]?key)?|token|secret|password|api[_ -]?key)\M'
    then
      raise exception using errcode = 'P0001', message = 'invalid_run_input';
    end if;
  end loop;

  if exists (
    select 1
    from jsonb_array_elements(p_input_snapshot->'changes') as changes(value)
    group by value->>'domain', value->>'entryIndex', value->>'startPeriod'
    having count(*) > 1
  ) then
    raise exception using errcode = 'P0001', message = 'invalid_run_input';
  end if;

  v_expected_path_periods := v_period_count;
  if p_result_bundle is null
    or jsonb_typeof(p_result_bundle) is distinct from 'object'
    or not (p_result_bundle ?& array['version','horizon','profileRevision','profileSnapshot','selectedChanges','paths','events','claims','report']::text[])
    or (p_result_bundle - array['version','horizon','profileRevision','profileSnapshot','selectedChanges','paths','events','claims','report']::text[]) <> '{}'::jsonb
    or p_result_bundle->>'version' <> 'life-climate-b2-v1'
    or p_result_bundle->>'horizon' <> p_input_snapshot->>'horizon'
    or jsonb_typeof(p_result_bundle->'profileRevision') is distinct from 'number'
    or (p_result_bundle->>'profileRevision')::integer <> p_profile_revision
    or p_result_bundle->'selectedChanges' <> p_input_snapshot->'changes'
    or jsonb_typeof(p_result_bundle->'profileSnapshot') is distinct from 'object'
    or p_result_bundle#>'{profileSnapshot,lifeModelDomains}' <> p_input_snapshot->'lifeModelDomains'
    or jsonb_typeof(p_result_bundle->'paths') is distinct from 'array'
    or jsonb_typeof(p_result_bundle->'events') is distinct from 'array'
    or jsonb_typeof(p_result_bundle->'claims') is distinct from 'array'
    or jsonb_typeof(p_result_bundle->'report') is distinct from 'object'
  then
    raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
  end if;

  if jsonb_array_length(p_result_bundle->'paths') <> 2
    or jsonb_array_length(p_result_bundle->'events') <> v_change_count
    or jsonb_array_length(p_result_bundle->'claims') <> v_change_count
  then
    raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
  end if;

  if p_result_bundle#>>'{paths,0,id}' <> 'baseline'
    or p_result_bundle#>>'{paths,1,id}' <> 'alternative'
    or jsonb_typeof(p_result_bundle#>'{paths,0,periods}') is distinct from 'array'
    or jsonb_typeof(p_result_bundle#>'{paths,1,periods}') is distinct from 'array'
    or p_result_bundle#>>'{report,includesExactDates}' <> 'false'
    or p_result_bundle#>>'{report,claimsUseEventEvidence}' <> 'true'
    or jsonb_typeof(p_result_bundle#>'{report,claimIds}') is distinct from 'array'
  then
    raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
  end if;

  if jsonb_array_length(p_result_bundle#>'{paths,0,periods}') <> v_expected_path_periods
    or jsonb_array_length(p_result_bundle#>'{paths,1,periods}') <> v_expected_path_periods
    or jsonb_array_length(p_result_bundle#>'{report,claimIds}') <> v_change_count
  then
    raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
  end if;

  for v_index in 0..v_change_count - 1
  loop
    v_change := p_input_snapshot#>array['changes',v_index::text];
    v_event := p_result_bundle#>array['events',v_index::text];
    v_claim := p_result_bundle#>array['claims',v_index::text];
    if jsonb_typeof(v_event) is distinct from 'object'
      or v_event->>'kind' <> 'assumption_transition'
      or v_event->>'pathId' <> 'alternative'
      or v_event->>'source' <> 'user_assumption'
      or v_event->>'domain' <> v_change->>'domain'
      or v_event->>'entryIndex' <> v_change->>'entryIndex'
      or v_event->>'periodIndex' <> v_change->>'startPeriod'
      or v_event#>>'{afterState,value}' <> v_change->>'newState'
      or v_event#>>'{afterState,evidenceSummary}' <> v_change->>'evidenceSummary'
      or v_event#>>'{afterState,classification}' <> 'assumption'
      or jsonb_typeof(v_claim) is distinct from 'object'
      or v_claim#>>'{evidenceEventIds,0}' <> v_event->>'id'
      or p_result_bundle#>>array['report','claimIds',v_index::text] <> v_claim->>'id'
    then
      raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
    end if;
    if jsonb_typeof(v_claim->'evidenceEventIds') is distinct from 'array' then
      raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
    end if;
    if jsonb_array_length(v_claim->'evidenceEventIds') <> 1 then
      raise exception using errcode = 'P0001', message = 'invalid_run_bundle';
    end if;
  end loop;

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

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':life-climate-b2:' || p_idempotency_key::text, 0));
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
    user_id, seed_context_id, profile_revision, version, horizon, trace_id,
    idempotency_key, request_hash, input_snapshot, result_bundle
  ) values (
    p_user_id, p_seed_context_id, p_profile_revision, 'life-climate-b2-v1',
    p_input_snapshot->>'horizon', p_trace_id, p_idempotency_key, v_request_hash,
    p_input_snapshot, p_result_bundle
  ) returning * into v_run;

  return query select v_run.id, false, v_run.created_at, v_run.result_bundle;
end;
$function$;

revoke all on function public.persist_life_climate_run_b2(uuid,uuid,integer,uuid,jsonb,jsonb,text) from public, anon, authenticated, service_role;
grant execute on function public.persist_life_climate_run_b2(uuid,uuid,integer,uuid,jsonb,jsonb,text) to service_role;
