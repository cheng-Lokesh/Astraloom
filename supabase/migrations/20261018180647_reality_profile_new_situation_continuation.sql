-- Candidate only: this forward migration has not been executed against PostgreSQL.
-- User-authored Reality input may continue into a NEW situation after fresh review.
-- No graph, person, rule, Run permission or historical artifact is copied.

create or replace function public.is_valid_reality_continuation_profile(p_profile jsonb)
returns boolean
language plpgsql
immutable
parallel safe
security invoker
set search_path = public, extensions
as $profile$
declare
  v_columns text[] := array[
    'life_climate_value','life_climate_classification','life_climate_evidence_summary',
    'resources_value','resources_classification','resources_evidence_summary',
    'constraints_value','constraints_classification','constraints_evidence_summary',
    'life_goals','core_values','life_themes','pressures','external_variables',
    'life_model_domains','world_model_inputs','revision'
  ];
  v_prefix text;
  v_field jsonb;
begin
  if p_profile is null or jsonb_typeof(p_profile) is distinct from 'object' then return false; end if;
  if (p_profile - v_columns) <> '{}'::jsonb or not (p_profile ?& v_columns)
     or p_profile -> 'revision' is distinct from '0'::jsonb then return false; end if;

  foreach v_prefix in array array['life_climate','resources','constraints'] loop
    if p_profile ->> (v_prefix || '_classification') = 'unknown'
       and p_profile -> (v_prefix || '_value') is distinct from 'null'::jsonb then return false; end if;
    v_field := jsonb_build_object(
      'value', case when p_profile ->> (v_prefix || '_classification') = 'unknown' then '""'::jsonb else p_profile -> (v_prefix || '_value') end,
      'classification', p_profile -> (v_prefix || '_classification'),
      'evidenceSummary', p_profile -> (v_prefix || '_evidence_summary')
    );
    if public.is_valid_reality_profile_items(jsonb_build_array(v_field)) is distinct from true then return false; end if;
  end loop;

  return public.is_valid_reality_profile_items(p_profile -> 'life_goals')
    and public.is_valid_reality_profile_items(p_profile -> 'core_values')
    and public.is_valid_reality_profile_items(p_profile -> 'life_themes')
    and public.is_valid_reality_profile_items(p_profile -> 'pressures')
    and public.is_valid_reality_profile_items(p_profile -> 'external_variables')
    and public.is_valid_reality_profile_life_model_domains(p_profile -> 'life_model_domains')
    and public.is_valid_reality_profile_world_inputs(p_profile -> 'world_model_inputs');
end;
$profile$;

revoke all on function public.is_valid_reality_continuation_profile(jsonb) from public, anon, authenticated;
grant execute on function public.is_valid_reality_continuation_profile(jsonb) to authenticated;

-- Three REQUIRED arguments keep PostgREST dispatch separate from legacy callers.
create or replace function public.submit_seed_context_phase2(
  p_submission_key uuid,
  p_payload jsonb,
  p_reality_continuation jsonb
)
returns table (
  seed_context_id uuid,
  version text,
  submitted_at timestamptz,
  frozen_at timestamptz,
  idempotent boolean,
  continuation_version text,
  profile_revision integer
)
language plpgsql
security invoker
set search_path = public, extensions
as $continuation$
declare
  v_user_id uuid := auth.uid();
  v_payload_hash text;
  v_profile_hash text;
  v_profile jsonb;
  v_source_seed_id uuid;
  v_source_revision integer;
  v_current_seed_id uuid;
  v_current_revision integer;
  v_existing record;
  v_receipt jsonb;
  v_consent_id uuid;
  v_seed_context_id uuid;
  v_now timestamptz;
  v_seed_keys text[] := array['questionText','trackType','timeWindow','situationSummary','recentEvents','keyPeopleText','decisionOptions','worries','forbiddenActions','safetyBoundaries','desiredOutput','privacyAck','privacySafetyAck'];
  v_continuation_keys text[] := array['version','sourceSeedContextId','sourceRevision','reviewedProfile','reviewedKeys','confirmedRateKeys','confirmedForNewSituation'];
  v_review_keys text[] := array['lifeClimate','resources','constraints'];
  v_rate_keys text[] := array[]::text[];
  v_provided_keys text[];
  v_key text;
  v_list jsonb;
  v_item record;
  v_deadline timestamptz;
begin
  if v_user_id is null or coalesce(auth.jwt() ->> 'is_anonymous', 'false') <> 'false' then
    raise exception using errcode = 'P0001', message = 'authentication_required';
  end if;
  if p_submission_key is null or p_payload is null or jsonb_typeof(p_payload) is distinct from 'object' then
    raise exception using errcode = 'P0001', message = 'invalid_submitted_seed_context';
  end if;
  if (p_payload - v_seed_keys) <> '{}'::jsonb or not (p_payload ?& v_seed_keys)
     or p_payload -> 'privacyAck' is distinct from 'true'::jsonb
     or p_payload -> 'privacySafetyAck' is distinct from 'true'::jsonb
     or p_payload ->> 'trackType' is distinct from 'crossroad'
     or p_payload ->> 'timeWindow' not in ('30_days','90_days') then
    raise exception using errcode = 'P0001', message = 'invalid_submitted_seed_context';
  end if;
  foreach v_key in array v_seed_keys[1:11] loop
    if jsonb_typeof(p_payload -> v_key) is distinct from 'string' or char_length(p_payload ->> v_key) > 10000 then
      raise exception using errcode = 'P0001', message = 'invalid_submitted_seed_context';
    end if;
  end loop;
  if nullif(btrim(p_payload ->> 'questionText'), '') is null or nullif(btrim(p_payload ->> 'situationSummary'), '') is null then
    raise exception using errcode = 'P0001', message = 'invalid_submitted_seed_context';
  end if;

  if p_reality_continuation is null or jsonb_typeof(p_reality_continuation) is distinct from 'object' then
    raise exception using errcode = 'P0001', message = 'invalid_reality_continuation';
  end if;
  if (p_reality_continuation - v_continuation_keys) <> '{}'::jsonb or not (p_reality_continuation ?& v_continuation_keys)
     or p_reality_continuation ->> 'version' is distinct from 'reality-profile-continuation-v1'
     or jsonb_typeof(p_reality_continuation -> 'sourceSeedContextId') is distinct from 'string'
     or (p_reality_continuation ->> 'sourceSeedContextId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     or jsonb_typeof(p_reality_continuation -> 'sourceRevision') is distinct from 'number'
     or (p_reality_continuation ->> 'sourceRevision') !~ '^[1-9][0-9]{0,9}$'
     or p_reality_continuation -> 'confirmedForNewSituation' is distinct from 'true'::jsonb
     or jsonb_typeof(p_reality_continuation -> 'reviewedKeys') is distinct from 'array'
     or jsonb_typeof(p_reality_continuation -> 'confirmedRateKeys') is distinct from 'array' then
    raise exception using errcode = 'P0001', message = 'invalid_reality_continuation';
  end if;
  if jsonb_array_length(p_reality_continuation -> 'reviewedKeys') > 128
     or jsonb_array_length(p_reality_continuation -> 'confirmedRateKeys') > 8
     or exists (select 1 from jsonb_array_elements((p_reality_continuation -> 'reviewedKeys') || (p_reality_continuation -> 'confirmedRateKeys')) as item(value) where jsonb_typeof(item.value) is distinct from 'string' or char_length(item.value #>> '{}') not between 1 and 100) then
    raise exception using errcode = 'P0001', message = 'invalid_reality_continuation';
  end if;
  v_profile := p_reality_continuation -> 'reviewedProfile';
  if public.is_valid_reality_continuation_profile(v_profile) is distinct from true then
    raise exception using errcode = 'P0001', message = 'invalid_reality_continuation';
  end if;
  begin
    v_source_seed_id := (p_reality_continuation ->> 'sourceSeedContextId')::uuid;
    v_source_revision := (p_reality_continuation ->> 'sourceRevision')::integer;
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception using errcode = 'P0001', message = 'invalid_reality_continuation';
  end;
  v_profile_hash := encode(digest(convert_to(v_profile::text, 'UTF8'), 'sha256'), 'hex');
  v_payload_hash := encode(digest(convert_to(jsonb_build_object('seed', p_payload, 'realityContinuation', p_reality_continuation)::text, 'UTF8'), 'sha256'), 'hex');

  -- Every controlled Seed submission uses this same owner -> owner/key order.
  perform pg_advisory_xact_lock(hashtextextended('seed-context-submission:' || v_user_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':' || p_submission_key::text, 0));

  -- Historical recovery MUST precede mutable current-source and deadline reads.
  select seed.id, seed.version, seed.submitted_at, seed.frozen_at, seed.payload_hash, seed.consent_event_id
    into v_existing from public.seed_contexts as seed
    where seed.user_id = v_user_id and seed.submission_key = p_submission_key;
  if found then
    if v_existing.payload_hash is distinct from v_payload_hash then
      raise exception using errcode = 'P0001', message = 'idempotency_key_content_conflict';
    end if;
    select consent.metadata -> 'reality_continuation' into v_receipt
      from public.consent_events as consent where consent.user_id = v_user_id and consent.id = v_existing.consent_event_id;
    if v_receipt is distinct from jsonb_build_object('version','reality-profile-continuation-v1','source_seed_context_id',v_source_seed_id,'source_revision',v_source_revision,'profile_hash',v_profile_hash,'new_revision',1) then
      raise exception using errcode = 'P0001', message = 'invalid_reality_continuation';
    end if;
    return query select v_existing.id, v_existing.version, v_existing.submitted_at, v_existing.frozen_at, true, 'reality-profile-continuation-v1'::text, 1;
    return;
  end if;

  select seed.id into v_current_seed_id from public.seed_contexts as seed
    where seed.user_id = v_user_id and seed.status = 'submitted' and seed.submitted_at is not null and seed.frozen_at is not null
    order by seed.submitted_at desc, seed.id desc limit 1;
  if v_current_seed_id is distinct from v_source_seed_id then
    raise exception using errcode = 'P0001', message = 'reality_continuation_source_stale';
  end if;
  -- Read/lock while the source is still current under existing Profile RLS.
  -- Deliberately select only granted columns, without a private row identity.
  select profile.revision into v_current_revision from public.reality_profiles as profile
    where profile.user_id = v_user_id and profile.seed_context_id = v_source_seed_id for update;
  if not found then raise exception using errcode = 'P0001', message = 'reality_profile_required'; end if;
  if v_current_revision is distinct from v_source_revision then
    raise exception using errcode = 'P0001', message = 'reality_continuation_revision_conflict';
  end if;

  -- Recompute all fourteen dimension items and both structured input lists.
  for v_item in select * from (values
    ('goals','life_goals'),('values','core_values'),('lifeThemes','life_themes'),
    ('pressures','pressures'),('externalVariables','external_variables')
  ) as dimensions(path, column_name) loop
    v_list := v_profile -> v_item.column_name;
    for v_key in select v_item.path || '.' || ordinal::text from jsonb_array_elements(v_list) with ordinality as entries(value, ordinal) loop
      v_review_keys := array_append(v_review_keys, v_key);
    end loop;
  end loop;
  foreach v_key in array array['identity','career','wealth','relationships','environment','lifeStage'] loop
    for v_item in select ordinal from jsonb_array_elements(v_profile -> 'life_model_domains' -> v_key) with ordinality as entries(value, ordinal) loop
      v_review_keys := array_append(v_review_keys, 'lifeModelDomains.' || v_key || '.' || v_item.ordinal::text);
    end loop;
  end loop;
  for v_item in select value, ordinal from jsonb_array_elements(v_profile -> 'world_model_inputs' -> 'resources') with ordinality as entries(value, ordinal) loop
    v_key := 'worldInputs.resources.' || v_item.ordinal::text;
    v_review_keys := array_append(v_review_keys, v_key);
    if v_item.value -> 'usePerTick' is distinct from 'null'::jsonb then v_rate_keys := array_append(v_rate_keys, v_key); end if;
  end loop;
  for v_item in select ordinal from jsonb_array_elements(v_profile -> 'world_model_inputs' -> 'constraints') with ordinality as entries(value, ordinal) loop
    v_review_keys := array_append(v_review_keys, 'worldInputs.constraints.' || v_item.ordinal::text);
  end loop;
  select coalesce(array_agg(value), array[]::text[]) into v_provided_keys from jsonb_array_elements_text(p_reality_continuation -> 'reviewedKeys') as entries(value);
  if cardinality(v_provided_keys) <> cardinality(v_review_keys)
     or (select count(distinct value) from unnest(v_provided_keys) as entries(value)) <> cardinality(v_provided_keys)
     or not (v_provided_keys @> v_review_keys and v_provided_keys <@ v_review_keys) then
    raise exception using errcode = 'P0001', message = 'invalid_reality_continuation';
  end if;
  select coalesce(array_agg(value), array[]::text[]) into v_provided_keys from jsonb_array_elements_text(p_reality_continuation -> 'confirmedRateKeys') as entries(value);
  if cardinality(v_provided_keys) <> cardinality(v_rate_keys)
     or (select count(distinct value) from unnest(v_provided_keys) as entries(value)) <> cardinality(v_provided_keys)
     or not (v_provided_keys @> v_rate_keys and v_provided_keys <@ v_rate_keys) then
    raise exception using errcode = 'P0001', message = 'invalid_reality_continuation';
  end if;

  v_now := clock_timestamp();
  for v_item in select value from jsonb_array_elements(v_profile -> 'world_model_inputs' -> 'constraints') as entries(value) loop
    v_deadline := (v_item.value -> 'rule' ->> 'value')::timestamptz;
    if not isfinite(v_deadline) or v_deadline <= v_now then
      raise exception using errcode = 'P0001', message = 'reality_continuation_deadline_expired';
    end if;
  end loop;

  insert into public.consent_events(user_id, consent_type, status, source, metadata)
    values(v_user_id, 'seed_context_submission', 'active', 'track_a_confirm',
      jsonb_build_object('submission_key',p_submission_key::text,'payload_hash',v_payload_hash,
        'reality_continuation',jsonb_build_object('version','reality-profile-continuation-v1','source_seed_context_id',v_source_seed_id,'source_revision',v_source_revision,'profile_hash',v_profile_hash,'new_revision',1))) returning id into v_consent_id;
  insert into public.seed_contexts (
    user_id, version, simulation_track, scenario_type, user_question, time_horizon,
    tick_granularity, raw_context, decision_options, forbidden_actions, desired_output,
    safety_flags, status, trace_id, submission_key, payload_hash, submitted_at, frozen_at, consent_event_id
  ) values (
    v_user_id,'phase2-submitted-v1','crossroad','career_decision',btrim(p_payload ->> 'questionText'),(p_payload ->> 'timeWindow')::public.time_horizon,
    'weekly',btrim(p_payload ->> 'situationSummary'),jsonb_build_array(coalesce(p_payload ->> 'decisionOptions','')),jsonb_build_array(coalesce(p_payload ->> 'forbiddenActions','')),jsonb_build_object('text',coalesce(p_payload ->> 'desiredOutput','')),
    jsonb_build_array(coalesce(p_payload ->> 'safetyBoundaries',''),coalesce(p_payload ->> 'worries','')),'submitted',gen_random_uuid()::text,p_submission_key,v_payload_hash,v_now,v_now,v_consent_id
  ) returning id into v_seed_context_id;
  -- The new Seed is now current for INSERT RLS; any failure rolls back all 3 rows.
  insert into public.reality_profiles (
    user_id, seed_context_id, life_climate_value, life_climate_classification, life_climate_evidence_summary,
    resources_value, resources_classification, resources_evidence_summary,
    constraints_value, constraints_classification, constraints_evidence_summary,
    life_goals, core_values, life_themes, pressures, external_variables, life_model_domains, world_model_inputs, revision
  ) values (
    v_user_id,v_seed_context_id,v_profile ->> 'life_climate_value',v_profile ->> 'life_climate_classification',v_profile ->> 'life_climate_evidence_summary',
    v_profile ->> 'resources_value',v_profile ->> 'resources_classification',v_profile ->> 'resources_evidence_summary',
    v_profile ->> 'constraints_value',v_profile ->> 'constraints_classification',v_profile ->> 'constraints_evidence_summary',
    v_profile -> 'life_goals',v_profile -> 'core_values',v_profile -> 'life_themes',v_profile -> 'pressures',v_profile -> 'external_variables',v_profile -> 'life_model_domains',v_profile -> 'world_model_inputs',1
  );
  return query select v_seed_context_id,'phase2-submitted-v1'::text,v_now,v_now,false,'reality-profile-continuation-v1'::text,1;
end;
$continuation$;

revoke all on function public.submit_seed_context_phase2(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.submit_seed_context_phase2(uuid, jsonb, jsonb) to authenticated;

-- Preserve the legacy payload hash, response and two-argument receipt contract.
create or replace function public.submit_seed_context_phase2(
  p_submission_key uuid,
  p_payload jsonb
)
returns table (
  seed_context_id uuid,
  version text,
  submitted_at timestamptz,
  frozen_at timestamptz,
  idempotent boolean
)
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_payload_hash text;
  v_existing public.seed_contexts%rowtype;
  v_consent_id uuid;
  v_seed_context_id uuid;
  v_now timestamptz;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'authentication_required';
  end if;

  if p_submission_key is null
    or p_payload is null
    or p_payload->>'trackType' <> 'crossroad'
    or p_payload->>'timeWindow' not in ('30_days', '90_days')
    or coalesce((p_payload->>'privacyAck')::boolean, false) is not true
    or coalesce((p_payload->>'privacySafetyAck')::boolean, false) is not true
    or nullif(btrim(coalesce(p_payload->>'questionText', '')), '') is null
    or nullif(btrim(coalesce(p_payload->>'situationSummary', '')), '') is null
  then
    raise exception using errcode = 'P0001', message = 'invalid_submitted_seed_context';
  end if;

  v_payload_hash := encode(
    digest(convert_to(p_payload::text, 'UTF8'), 'sha256'),
    'hex'
  );

  -- Shared with the required three-argument continuation overload.
  perform pg_advisory_xact_lock(hashtextextended('seed-context-submission:' || v_user_id::text, 0));

  -- The transaction-scoped lock prevents a second concurrent request from
  -- creating an orphan consent event before it observes the first submission.
  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':' || p_submission_key::text, 0)
  );

  select * into v_existing
  from public.seed_contexts
  where user_id = v_user_id
    and submission_key = p_submission_key;

  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = 'P0001', message = 'idempotency_key_content_conflict';
    end if;

    return query
    select v_existing.id, v_existing.version, v_existing.submitted_at, v_existing.frozen_at, true;
    return;
  end if;

  -- Acceptance clock is assigned after the owner/key locks, never transaction now().
  v_now := clock_timestamp();

  insert into public.consent_events (
    user_id,
    consent_type,
    status,
    source,
    metadata
  ) values (
    v_user_id,
    'seed_context_submission',
    'active',
    'track_a_confirm',
    jsonb_build_object('submission_key', p_submission_key::text, 'payload_hash', v_payload_hash)
  ) returning id into v_consent_id;

  insert into public.seed_contexts (
    user_id,
    version,
    simulation_track,
    scenario_type,
    user_question,
    time_horizon,
    tick_granularity,
    raw_context,
    decision_options,
    forbidden_actions,
    desired_output,
    safety_flags,
    status,
    trace_id,
    submission_key,
    payload_hash,
    submitted_at,
    frozen_at,
    consent_event_id
  ) values (
    v_user_id,
    'phase2-submitted-v1',
    'crossroad',
    'career_decision',
    btrim(p_payload->>'questionText'),
    (p_payload->>'timeWindow')::public.time_horizon,
    'weekly',
    btrim(p_payload->>'situationSummary'),
    jsonb_build_array(coalesce(p_payload->>'decisionOptions', '')),
    jsonb_build_array(coalesce(p_payload->>'forbiddenActions', '')),
    jsonb_build_object('text', coalesce(p_payload->>'desiredOutput', '')),
    jsonb_build_array(coalesce(p_payload->>'safetyBoundaries', ''), coalesce(p_payload->>'worries', '')),
    'submitted',
    gen_random_uuid()::text,
    p_submission_key,
    v_payload_hash,
    v_now,
    v_now,
    v_consent_id
  ) returning id into v_seed_context_id;

  return query
  select v_seed_context_id, 'phase2-submitted-v1'::text, v_now, v_now, false;
end;
$$;

revoke all on function public.submit_seed_context_phase2(uuid, jsonb) from public;
grant execute on function public.submit_seed_context_phase2(uuid, jsonb) to authenticated;
