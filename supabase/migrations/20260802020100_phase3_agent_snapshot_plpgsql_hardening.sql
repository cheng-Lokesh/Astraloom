-- Phase 3 additive hardening: remove the explicit FOR-loop variable declaration so
-- plpgsql_check reports no shadowed or unused variable diagnostics.
-- The preceding applied migration remains immutable.

create or replace function public.generate_agent_snapshot_phase3(
  p_seed_context_id uuid,
  p_idempotency_key uuid,
  p_include_parallel_selves boolean default true
)
returns table (idempotent boolean, snapshot jsonb, agents jsonb)
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_seed record;
  v_receipt record;
  v_snapshot_id uuid;
  v_agent_ids uuid[] := '{}'::uuid[];
  v_agent_id uuid;
  v_hash text;
  v_safety text := 'safe';
  v_text text;
  v_person record;
begin
  -- Never inherit a caller-supplied writer guard; every function exit is off.
  perform set_config('app.phase3_agent_snapshot_rpc', 'off', true);

  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'unauthenticated';
  end if;
  if p_seed_context_id is null or p_idempotency_key is null or p_include_parallel_selves is null then
    raise exception using errcode = 'P0001', message = 'agent_snapshot_invalid';
  end if;

  select id, user_id, user_question, raw_context, safety_flags, payload_hash,
    status, simulation_track, submitted_at, frozen_at
  into v_seed
  from public.seed_contexts
  where id = p_seed_context_id
    and user_id = v_user_id
    and status = 'submitted'
    and simulation_track = 'crossroad'
    and submitted_at is not null
    and frozen_at is not null
    and payload_hash is not null
    and length(payload_hash) = 64;
  if not found then
    raise exception using errcode = 'P0001', message = 'seed_not_found';
  end if;

  -- Same first lock as Step A, followed by the operation/key lock.
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':phase3-key-people:' || p_seed_context_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':agent:' || p_idempotency_key::text, 0));

  v_text := lower(coalesce(v_seed.user_question, '') || ' ' || coalesce(v_seed.raw_context, '') || ' ' || coalesce(v_seed.safety_flags::text, ''));
  -- SAFETY_RULES blocked flags: self_harm, violence, minor_safety.
  if v_text ~ '(suicide|self[[:space:]-]?harm|self[[:space:]-]?injur|kill myself|violence|violent|threat|assault|attack|murder|kill (him|her|them|someone)|minor safety|underage|child abuse|child safety)'
    or v_text ~ U&'(\81ea\6740|\81ea\6b8b|\8f7b\751f|\4f24\5bb3\81ea\5df1|\66b4\529b|\5a01\80c1|\88ad\51fb|\6740\4eba|\6253\4eba|\672a\6210\5e74|\5c11\5e74\5b89\5168|\513f\7ae5\5b89\5168|\513f\7ae5\8650\5f85)'
  then
    raise exception using errcode = 'P0001', message = 'safety_blocked';
  -- SAFETY_RULES downgraded flags: stalking, surveillance, partner_monitoring,
  -- medical, legal, investment, therapy, revenge, coercion, and
  -- third_party_mind_reading. These are conservative snapshot-only paths.
  elsif v_text ~ '(stalk|surveil|surveillance|partner monitoring|spy)'
    or v_text ~ '(monitor|monitoring|track|tracking)[[:space:]]+(a |my |their |your )?(partner|spouse|boyfriend|girlfriend)'
    or v_text ~ '(partner|spouse|boyfriend|girlfriend)[[:punct:]]?s?[[:space:]]*(phone|message|messages|location)'
    or v_text ~ '(medical|diagnos|treat|legal|lawyer|attorney|court|lawsuit)'
    or v_text ~ '(investment|invest|stock|stocks|crypto|loan|buy shares|sell shares|debt|financial advice)'
    or v_text ~ '(therapy|therapist|mental health|counsel|revenge|blackmail|harass|manipulat|coerc|force them|make them obey|pressure them|force .*partner)'
    or v_text ~ '(mind[ -]?read|hidden thoughts|read .* mind|what .* really thinks)'
    or v_text ~ U&'(\8ddf\8e2a|\76d1\89c6|\76d1\63a7|\76d1\542c|\5b9a\4f4d|\67e5\5c97|\4f34\4fa3\76d1\63a7|\533b\7597|\8bca\65ad|\6cbb\7597|\75be\75c5|\836f\7269|\6cd5\5f8b|\5f8b\5e08|\8bc9\8bbc|\6cd5\9662|\6295\8d44|\7406\8d22|\503a\52a1|\5fc3\7406\6cbb\7597|\5fc3\7406\54a8\8be2|\62a5\590d|\52d2\8be1|\656c\8bc8|\6552\8bc8|\5a01\80c1|\80c1\8feb|\64cd\63a7\5bf9\65b9|\8bfb\5fc3|\5185\5fc3\60f3\6cd5|\771f\5b9e\60f3\6cd5)'
  then
    v_safety := 'downgraded';
  -- SAFETY_RULES caution flags: deterministic_fate and
  -- guaranteed_reconciliation. The output remains explicitly non-deterministic.
  elsif v_text ~ '(deterministic fate|will definitely|definitely happen|guaranteed|destined|fate is certain|guarantee.*(reconcile|reconciliation|get back together|reunite))'
    or v_text ~ U&'(\547d\4e2d\6ce8\5b9a|\4e00\5b9a\53d1\751f|\5fc5\7136\53d1\751f|\4e00\5b9a\4f1a|\5fc5\7136|\6ce8\5b9a|\4fdd\8bc1\590d\5408|\4e00\5b9a\590d\5408|\5fc5\5b9a\590d\5408)'
  then
    v_safety := 'caution';
  end if;

  perform set_config('app.phase3_agent_snapshot_rpc', 'on', true);
  begin
  v_hash := encode(digest(convert_to(jsonb_build_object(
    'owner_id', v_user_id, 'seed_context_id', p_seed_context_id,
    'seed_payload_hash', coalesce(v_seed.payload_hash, ''),
    'include_parallel_selves', p_include_parallel_selves,
    'writer_version', 'phase3-agent-writer-v1'
  )::text, 'UTF8'), 'sha256'), 'hex');

  select seed_context_id, request_hash, snapshot_id, agent_ids
  into v_receipt
  from public.agent_snapshot_idempotency_receipts
  where user_id = v_user_id and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.seed_context_id <> p_seed_context_id or v_receipt.request_hash <> v_hash then
      raise exception using errcode = 'P0001', message = 'idempotency_key_content_conflict';
    end if;
    select id into v_snapshot_id from public.agent_profile_snapshots
    where id = v_receipt.snapshot_id and user_id = v_user_id and seed_context_id = p_seed_context_id;
    if not found or (select count(*) from public.agent_profiles where snapshot_id = v_snapshot_id and id = any(v_receipt.agent_ids)) <> cardinality(v_receipt.agent_ids) then
      raise exception using errcode = 'P0001', message = 'persistence_failed';
    end if;
    select jsonb_build_object('id', id, 'version', version, 'safety_level', safety_level, 'error_code', error_code)
      into snapshot from public.agent_profile_snapshots where id = v_snapshot_id;
    select coalesce(jsonb_agg(jsonb_build_object('id', id, 'snapshot_id', snapshot_id, 'key_person_id', key_person_id,
      'version', version, 'agent_type', agent_type, 'display_name', display_name,
      'relationship_to_user', relationship_to_user, 'source', source, 'confidence', confidence,
      'evidence_refs', evidence_refs, 'safety_level', safety_level) order by created_at, id), '[]'::jsonb)
      into agents from public.agent_profiles where snapshot_id = v_snapshot_id and user_id = v_user_id and seed_context_id = p_seed_context_id;
    idempotent := true;
    perform set_config('app.phase3_agent_snapshot_rpc', 'off', true);
    return next;
    return;
  end if;

  insert into public.agent_profile_snapshots (user_id, seed_context_id, safety_level, error_code, request_hash, idempotency_key)
  values (v_user_id, p_seed_context_id, v_safety, case when v_safety = 'downgraded' then 'safety_downgraded' else null end, v_hash, p_idempotency_key)
  returning id into v_snapshot_id;

  insert into public.agent_profiles (user_id, seed_context_id, snapshot_id, version, agent_type, display_name,
    relationship_to_user, source, psychology, motivation, resources, behavior_policy, state, memory, triggers,
    confidence, evidence_refs, model_version, prompt_version, trace_id, cost_estimate, error_code, field_sources,
    writer_version, idempotency_key, request_hash, safety_level)
  values (v_user_id, p_seed_context_id, v_snapshot_id, 'phase3-agent-snapshot-v1', 'user_core', 'You', 'self',
    'conservative_snapshot', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '[]'::jsonb,
    '[]'::jsonb, 58, jsonb_build_array('seed:submitted'), 'not_called', 'phase3-agent-writer-v1', gen_random_uuid()::text,
    0, case when v_safety = 'downgraded' then 'safety_downgraded' else null end,
    jsonb_build_object(
      'display_name', 'default', 'relationship_to_user', 'default',
      'psychology', 'default', 'motivation', 'default', 'resources', 'default',
      'behavior_policy', 'default', 'state', 'default', 'memory', 'default',
      'triggers', 'default', 'variant_axis', 'default', 'confidence', 'default',
      'evidence_refs', 'default'
    ),
    'phase3-agent-writer-v1', p_idempotency_key, v_hash, v_safety)
  returning id into v_agent_id;
  v_agent_ids := array_append(v_agent_ids, v_agent_id);

  if v_safety <> 'downgraded' and p_include_parallel_selves then
    for v_variant in 1..2 loop
      insert into public.agent_profiles (user_id, seed_context_id, snapshot_id, version, agent_type, display_name,
        relationship_to_user, source, psychology, motivation, resources, behavior_policy, state, memory, triggers,
        variant_axis, confidence, evidence_refs, model_version, prompt_version, trace_id, cost_estimate, field_sources,
        writer_version, idempotency_key, request_hash, safety_level)
      values (v_user_id, p_seed_context_id, v_snapshot_id, 'phase3-agent-snapshot-v1', 'user_variant',
        case when v_variant = 1 then 'Cautious self' else 'Decisive self' end, 'self', 'conservative_snapshot',
        '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '[]'::jsonb, '[]'::jsonb,
        case when v_variant = 1 then 'cautious' else 'decisive' end, 50, jsonb_build_array('seed:submitted'),
        'not_called', 'phase3-agent-writer-v1', gen_random_uuid()::text, 0,
        jsonb_build_object(
          'display_name', 'default', 'relationship_to_user', 'default',
          'psychology', 'default', 'motivation', 'default', 'resources', 'default',
          'behavior_policy', 'default', 'state', 'default', 'memory', 'default',
          'triggers', 'default', 'variant_axis', 'default', 'confidence', 'default',
          'evidence_refs', 'default'
        ),
        'phase3-agent-writer-v1', p_idempotency_key, v_hash, v_safety)
      returning id into v_agent_id;
      v_agent_ids := array_append(v_agent_ids, v_agent_id);
    end loop;
  end if;

  if v_safety <> 'downgraded' then
    for v_person in select id, display_name, relationship_to_user, evidence_refs from public.key_people
      where user_id = v_user_id and seed_context_id = p_seed_context_id and status = 'confirmed' order by created_at, id
    loop
      insert into public.agent_profiles (user_id, seed_context_id, key_person_id, snapshot_id, version, agent_type,
        display_name, relationship_to_user, source, psychology, motivation, resources, behavior_policy, state, memory,
        triggers, confidence, evidence_refs, model_version, prompt_version, trace_id, cost_estimate, field_sources,
        writer_version, idempotency_key, request_hash, safety_level)
      values (v_user_id, p_seed_context_id, v_person.id, v_snapshot_id, 'phase3-agent-snapshot-v1', 'npc',
        v_person.display_name, v_person.relationship_to_user, 'confirmed_person_snapshot', '{}'::jsonb, '{}'::jsonb,
        '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '[]'::jsonb, '[]'::jsonb, 55,
        case when jsonb_array_length(v_person.evidence_refs) > 0 then v_person.evidence_refs else jsonb_build_array('key_person:confirmed') end,
        'not_called', 'phase3-agent-writer-v1', gen_random_uuid()::text, 0,
        jsonb_build_object(
          'display_name', 'user_confirmed', 'relationship_to_user', 'user_confirmed',
          'psychology', 'default', 'motivation', 'default', 'resources', 'default',
          'behavior_policy', 'default', 'state', 'default', 'memory', 'default',
          'triggers', 'default', 'variant_axis', 'default', 'confidence', 'default',
          'evidence_refs', 'default'
        ),
        'phase3-agent-writer-v1', p_idempotency_key, v_hash, v_safety)
      returning id into v_agent_id;
      v_agent_ids := array_append(v_agent_ids, v_agent_id);
    end loop;
  end if;

  insert into public.agent_snapshot_idempotency_receipts (user_id, seed_context_id, idempotency_key, request_hash, snapshot_id, agent_ids)
  values (v_user_id, p_seed_context_id, p_idempotency_key, v_hash, v_snapshot_id, v_agent_ids);
  select jsonb_build_object('id', id, 'version', version, 'safety_level', safety_level, 'error_code', error_code)
    into snapshot from public.agent_profile_snapshots where id = v_snapshot_id;
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'snapshot_id', snapshot_id, 'key_person_id', key_person_id,
    'version', version, 'agent_type', agent_type, 'display_name', display_name, 'relationship_to_user', relationship_to_user,
    'source', source, 'confidence', confidence, 'evidence_refs', evidence_refs, 'safety_level', safety_level) order by created_at, id), '[]'::jsonb)
    into agents from public.agent_profiles where snapshot_id = v_snapshot_id and user_id = v_user_id and seed_context_id = p_seed_context_id;
  idempotent := false;
  perform set_config('app.phase3_agent_snapshot_rpc', 'off', true);
  return next;
  exception when others then
    perform set_config('app.phase3_agent_snapshot_rpc', 'off', true);
    raise;
  end;
end;
$$;

revoke all on function public.generate_agent_snapshot_phase3(uuid, uuid, boolean) from public, anon;
grant execute on function public.generate_agent_snapshot_phase3(uuid, uuid, boolean) to authenticated;

