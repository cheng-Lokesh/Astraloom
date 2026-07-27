-- Phase 2 hardening: one authenticated, atomic Track A submission boundary.
-- SECURITY INVOKER is intentional: RLS remains active for the calling user.

alter table public.seed_contexts
  add column if not exists payload_hash text;

alter table public.consent_events
  add constraint consent_events_id_user_id_key unique (id, user_id);

alter table public.seed_contexts
  drop constraint if exists seed_contexts_consent_event_id_fkey,
  add constraint seed_contexts_consent_event_owner_fkey
    foreign key (consent_event_id, user_id)
    references public.consent_events(id, user_id)
    on delete restrict;

alter table public.seed_contexts
  drop constraint if exists seed_contexts_phase2_submitted_contract,
  add constraint seed_contexts_phase2_submitted_contract check (
    status <> 'submitted' or (
      simulation_track = 'crossroad' and
      time_horizon in ('30_days', '90_days') and
      scenario_type = 'career_decision' and
      trace_id is not null and length(trace_id) > 0 and
      submission_key is not null and
      payload_hash is not null and length(payload_hash) = 64 and
      consent_event_id is not null and
      submitted_at is not null and
      frozen_at is not null
    )
  ) not valid;

alter table public.seed_contexts
  validate constraint seed_contexts_phase2_submitted_contract;

drop policy if exists "seed_contexts_insert_own" on public.seed_contexts;
create policy "seed_contexts_insert_own" on public.seed_contexts
  for insert to authenticated
  with check (
    auth.uid() is not null and
    auth.uid() = user_id and
    status = 'submitted' and
    simulation_track = 'crossroad' and
    time_horizon in ('30_days', '90_days') and
    scenario_type = 'career_decision'
  );

drop policy if exists "consent_events_insert_own" on public.consent_events;
create policy "consent_events_insert_own" on public.consent_events
  for insert to authenticated
  with check (
    auth.uid() is not null and
    auth.uid() = user_id and
    consent_type = 'seed_context_submission' and
    status = 'active' and
    source = 'track_a_confirm'
  );

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
  v_now timestamptz := now();
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
