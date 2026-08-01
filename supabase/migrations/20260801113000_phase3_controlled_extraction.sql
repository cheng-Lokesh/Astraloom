-- Phase 3 Step A hardening: candidate extraction is derived inside the
-- authenticated database boundary. Browser callers can select a Seed and an
-- idempotency key, but cannot provide candidate people or provenance fields.

drop function if exists public.extract_key_people_phase3(uuid, uuid, jsonb);

create or replace function public.extract_key_people_phase3(
  p_seed_context_id uuid,
  p_idempotency_key uuid
)
returns table (idempotent boolean, people jsonb)
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_seed public.seed_contexts%rowtype;
  v_receipt public.key_people_idempotency_receipts%rowtype;
  v_context text;
  v_candidate jsonb;
  v_candidate_id uuid;
  v_candidate_ids uuid[] := '{}'::uuid[];
  v_hash text;
  v_fingerprint text;
  v_status public.key_person_status;
  v_actual_count integer;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'unauthenticated';
  end if;
  if p_seed_context_id is null or p_idempotency_key is null then
    raise exception using errcode = 'P0001', message = 'key_people_invalid';
  end if;

  select * into v_seed
  from public.seed_contexts
  where id = p_seed_context_id
    and user_id = v_user_id
    and status = 'submitted'
    and simulation_track = 'crossroad'
    and version = 'phase2-submitted-v1'
    and submitted_at is not null
    and frozen_at is not null
    and payload_hash is not null;
  if not found then
    raise exception using errcode = 'P0001', message = 'seed_not_found';
  end if;

  perform set_config('app.phase3_key_people_rpc', 'on', true);
  v_hash := encode(
    digest(
      convert_to(
        jsonb_build_object(
          'extractor_version', 'phase3-db-deterministic-v1',
          'seed_context_id', v_seed.id,
          'seed_payload_hash', v_seed.payload_hash
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':extract:' || p_idempotency_key::text, 0)
  );

  select * into v_receipt
  from public.key_people_idempotency_receipts
  where user_id = v_user_id
    and operation_kind = 'extract'
    and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.content_hash <> v_hash
      or v_receipt.seed_context_id <> p_seed_context_id
    then
      raise exception using errcode = 'P0001', message = 'idempotency_key_content_conflict';
    end if;

    select count(*) into v_actual_count
    from public.key_people
    where user_id = v_user_id
      and seed_context_id = p_seed_context_id
      and id = any(v_receipt.person_ids);
    if v_actual_count <> cardinality(v_receipt.person_ids) then
      raise exception using errcode = 'P0001', message = 'persistence_failed';
    end if;

    select coalesce(jsonb_agg(jsonb_build_object(
      'id', id,
      'display_name', display_name,
      'relationship_to_user', relationship_to_user,
      'role_type', role_type,
      'confidence', confidence,
      'known_evidence', known_evidence,
      'missing_fields', missing_fields,
      'status', status,
      'merged_into_id', merged_into_id,
      'evidence_refs', evidence_refs,
      'version', version
    ) order by created_at, id), '[]'::jsonb) into people
    from public.key_people
    where user_id = v_user_id and seed_context_id = p_seed_context_id;
    idempotent := true;
    return next;
    return;
  end if;

  -- Only persisted, frozen Seed fields participate. The ordered role catalog is
  -- deliberately conservative: it identifies common decision stakeholders and
  -- emits no raw Seed prose or unverified private attributes.
  v_context := lower(concat_ws(
    E'\n',
    v_seed.user_question,
    v_seed.raw_context,
    v_seed.decision_options::text,
    v_seed.forbidden_actions::text,
    v_seed.desired_output::text,
    v_seed.safety_flags::text
  ));

  for v_candidate in
    select jsonb_build_object(
      'display_name', role_catalog.display_name,
      'relationship_to_user', role_catalog.relationship_to_user,
      'role_type', role_catalog.role_type,
      'confidence', role_catalog.confidence,
      'known_evidence', jsonb_build_array('Derived from the submitted Seed context.'),
      'missing_fields', role_catalog.missing_fields,
      'source', 'seed_context_text'
    )
    from (values
      (1, 'Current manager', 'boss', 'authority', 78::numeric,
        jsonb_build_array('Recent commitment', 'Verifiable timing', 'Resource control scope'),
        '(current manager|my manager|manager|boss|team lead|supervisor|上级|老板|领导|经理|主管)'),
      (2, 'Recruiter', 'opportunity_source', 'opportunity', 76::numeric,
        jsonb_build_array('Offer conditions', 'Decision deadline', 'Uncertain factors'),
        '(recruiter|hiring manager|human resources|new role|new company|offer|招聘|猎头|人力|面试官|新公司)'),
      (3, 'Trusted colleague', 'colleague', 'support', 72::numeric,
        jsonb_build_array('Stance', 'Information gap', 'Influence scope'),
        '(trusted colleague|colleague|teammate|team member|coworker|同事|队友|团队成员)'),
      (4, 'Partner or family', 'family_or_partner', 'emotional', 72::numeric,
        jsonb_build_array('Acceptable boundary', 'Practical pressure', 'Support condition'),
        '(spouse|life partner|romantic partner|family|wife|husband|parent|伴侣|家人|妻子|丈夫|配偶|父母)'),
      (5, 'Collaborator', 'partner', 'resource', 70::numeric,
        jsonb_build_array('Benefit boundary', 'Resource input', 'Exit condition'),
        '(cofounder|co-founder|collaborator|business partner|client|investor|合伙人|合作方|联合创始人|客户|投资人)'),
      (6, 'Competitor', 'competitor', 'conflict', 68::numeric,
        jsonb_build_array('Competing resource', 'Recent action', 'Information source'),
        '(competitor|rival|竞争者|竞争对手|对手)'),
      (7, 'Advisor', 'advisor', 'support', 72::numeric,
        jsonb_build_array('Advice stance', 'Trustworthy basis', 'Available resource'),
        '(mentor|advisor|coach|导师|顾问|教练|前辈)')
    ) as role_catalog(
      ordinal,
      display_name,
      relationship_to_user,
      role_type,
      confidence,
      missing_fields,
      match_pattern
    )
    where v_context ~ role_catalog.match_pattern
    order by role_catalog.ordinal
    limit 8
  loop
    v_status := case
      when (v_candidate->>'confidence')::numeric < 70
        then 'needs_confirmation'::public.key_person_status
      else 'candidate'::public.key_person_status
    end;
    v_fingerprint := encode(
      digest(convert_to(v_candidate::text, 'UTF8'), 'sha256'),
      'hex'
    );

    insert into public.key_people (
      user_id,
      seed_context_id,
      display_name,
      relationship_to_user,
      role_type,
      confidence,
      known_evidence,
      missing_fields,
      status,
      evidence_refs,
      version,
      writer_version,
      trace_id,
      source,
      field_sources,
      idempotency_key,
      extraction_fingerprint
    ) values (
      v_user_id,
      p_seed_context_id,
      v_candidate->>'display_name',
      v_candidate->>'relationship_to_user',
      v_candidate->>'role_type',
      (v_candidate->>'confidence')::numeric,
      v_candidate->'known_evidence',
      v_candidate->'missing_fields',
      v_status,
      jsonb_build_array(
        'seed_context:' || p_seed_context_id::text || ':' || substring(v_fingerprint from 1 for 16)
      ),
      'phase3-key-person-v1',
      'phase3-key-people-rpc-v2',
      gen_random_uuid()::text,
      v_candidate->>'source',
      jsonb_build_object(
        'display_name', 'deterministic_extractor',
        'relationship_to_user', 'deterministic_extractor',
        'role_type', 'deterministic_extractor',
        'confidence', 'deterministic_extractor'
      ),
      p_idempotency_key,
      v_fingerprint
    )
    on conflict (user_id, seed_context_id, extraction_fingerprint)
      where extraction_fingerprint is not null
      do nothing
    returning id into v_candidate_id;

    if v_candidate_id is null then
      select id into v_candidate_id
      from public.key_people
      where user_id = v_user_id
        and seed_context_id = p_seed_context_id
        and extraction_fingerprint = v_fingerprint
      for update;
    end if;
    if v_candidate_id is null then
      raise exception using errcode = 'P0001', message = 'persistence_failed';
    end if;
    v_candidate_ids := array_append(v_candidate_ids, v_candidate_id);
    v_candidate_id := null;
  end loop;

  select coalesce(array_agg(distinct person_id order by person_id), '{}'::uuid[])
  into v_candidate_ids
  from unnest(v_candidate_ids) as candidate_ids(person_id);

  insert into public.key_people_idempotency_receipts (
    user_id,
    seed_context_id,
    operation_kind,
    idempotency_key,
    content_hash,
    person_ids
  ) values (
    v_user_id,
    p_seed_context_id,
    'extract',
    p_idempotency_key,
    v_hash,
    v_candidate_ids
  );

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'display_name', display_name,
    'relationship_to_user', relationship_to_user,
    'role_type', role_type,
    'confidence', confidence,
    'known_evidence', known_evidence,
    'missing_fields', missing_fields,
    'status', status,
    'merged_into_id', merged_into_id,
    'evidence_refs', evidence_refs,
    'version', version
  ) order by created_at, id), '[]'::jsonb) into people
  from public.key_people
  where user_id = v_user_id and seed_context_id = p_seed_context_id;
  idempotent := false;
  return next;
end;
$$;

revoke all on function public.extract_key_people_phase3(uuid, uuid) from public;
grant execute on function public.extract_key_people_phase3(uuid, uuid) to authenticated;
