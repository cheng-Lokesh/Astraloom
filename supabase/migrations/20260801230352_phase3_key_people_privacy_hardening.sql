-- Phase 3 Step A privacy hardening.
--
-- RLS limits rows, not columns, so authenticated Data API callers receive only
-- the product-safe Key People projection. Opaque provenance stays writable by
-- the two SECURITY INVOKER RPCs but is not directly readable. Receipt rows are
-- visible only inside a transaction carrying the narrow RPC guard.

revoke all privileges on table public.key_people from authenticated, anon;
revoke all privileges on table public.key_people_idempotency_receipts from authenticated, anon;

grant select (
  id,
  user_id,
  seed_context_id,
  created_at,
  display_name,
  relationship_to_user,
  role_type,
  confidence,
  known_evidence,
  missing_fields,
  status,
  merged_into_id,
  evidence_refs,
  version
) on public.key_people to authenticated;

grant insert (
  user_id,
  seed_context_id,
  display_name,
  relationship_to_user,
  role_type,
  confidence,
  known_evidence,
  missing_fields,
  status,
  merged_into_id,
  evidence_refs,
  version,
  writer_version,
  trace_id,
  source,
  field_sources,
  idempotency_key,
  extraction_fingerprint
) on public.key_people to authenticated;

grant update (
  display_name,
  status,
  merged_into_id,
  evidence_refs
) on public.key_people to authenticated;

grant select, insert on public.key_people_idempotency_receipts to authenticated;

drop policy if exists "key_people_select_submitted_owner" on public.key_people;
drop policy if exists "key_people_insert_phase3_rpc" on public.key_people;
drop policy if exists "key_people_update_phase3_rpc" on public.key_people;
drop policy if exists "key_people_delete_phase3_rpc" on public.key_people;

create policy "key_people_select_submitted_owner" on public.key_people
  for select to authenticated
  using (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and exists (
      select 1
      from public.seed_contexts s
      where s.id = key_people.seed_context_id
        and s.user_id = (select auth.uid())
        and s.status = 'submitted'
    )
  );

create policy "key_people_insert_phase3_rpc" on public.key_people
  for insert to authenticated
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and current_setting('app.phase3_key_people_rpc', true) = 'on'
    and exists (
      select 1
      from public.seed_contexts s
      where s.id = key_people.seed_context_id
        and s.user_id = (select auth.uid())
        and s.status = 'submitted'
    )
  );

create policy "key_people_update_phase3_rpc" on public.key_people
  for update to authenticated
  using (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and current_setting('app.phase3_key_people_rpc', true) = 'on'
  )
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and current_setting('app.phase3_key_people_rpc', true) = 'on'
    and exists (
      select 1
      from public.seed_contexts s
      where s.id = key_people.seed_context_id
        and s.user_id = (select auth.uid())
        and s.status = 'submitted'
    )
  );

drop policy if exists "key_people_receipts_select_owner" on public.key_people_idempotency_receipts;
drop policy if exists "key_people_receipts_select_phase3_rpc" on public.key_people_idempotency_receipts;
create policy "key_people_receipts_select_phase3_rpc" on public.key_people_idempotency_receipts
  for select to authenticated
  using (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and current_setting('app.phase3_key_people_rpc', true) = 'on'
  );

drop policy if exists "key_people_receipts_insert_phase3_rpc" on public.key_people_idempotency_receipts;
create policy "key_people_receipts_insert_phase3_rpc" on public.key_people_idempotency_receipts
  for insert to authenticated
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and current_setting('app.phase3_key_people_rpc', true) = 'on'
  );

-- The browser role does not need UPDATE or SELECT on the internal provenance
-- columns. A guarded trigger carries forward the existing field ledger and
-- stamps only the product-field changes made by the mutation RPC.
create or replace function public.stamp_key_people_phase3_provenance()
returns trigger
language plpgsql
security invoker
set search_path = public, extensions
as $$
begin
  if current_setting('app.phase3_key_people_rpc', true) <> 'on' then
    raise exception using errcode = 'P0001', message = 'key_people_invalid';
  end if;

  new.trace_id := gen_random_uuid()::text;
  new.writer_version := 'phase3-key-people-rpc-v3';
  new.field_sources := old.field_sources;

  if new.display_name is distinct from old.display_name then
    new.field_sources := new.field_sources || jsonb_build_object('display_name', 'user_confirmed');
  end if;
  if new.evidence_refs is distinct from old.evidence_refs then
    new.field_sources := new.field_sources || jsonb_build_object('evidence_refs', 'merged_user_confirmed');
  end if;
  if new.status is distinct from old.status then
    new.field_sources := new.field_sources || jsonb_build_object(
      'status',
      case when new.status = 'merged' then 'merged_user_confirmed' else 'user_confirmed' end
    );
  end if;
  if new.merged_into_id is distinct from old.merged_into_id then
    new.field_sources := new.field_sources || jsonb_build_object('merged_into_id', 'merged_user_confirmed');
  end if;

  return new;
end;
$$;

drop trigger if exists key_people_phase3_provenance on public.key_people;
create trigger key_people_phase3_provenance
  before update on public.key_people
  for each row execute function public.stamp_key_people_phase3_provenance();

revoke all on function public.stamp_key_people_phase3_provenance() from public, anon, authenticated;

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
  v_receipt record;
  v_context text;
  v_candidate jsonb;
  v_candidate_id uuid;
  v_candidate_ids uuid[] := '{}'::uuid[];
  v_hash text;
  v_fingerprint text;
  v_evidence_ref text;
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
          'extractor_version', 'phase3-db-deterministic-v2',
          'seed_context_id', v_seed.id,
          'seed_payload_hash', v_seed.payload_hash
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  -- Every Key People mutation for one Seed shares the same first lock. The
  -- second lock preserves content-bound idempotency without lock-order cycles.
  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':phase3-key-people:' || p_seed_context_id::text, 0)
  );
  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':extract:' || p_idempotency_key::text, 0)
  );

  select content_hash, seed_context_id, person_ids
  into v_receipt
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

  -- Only persisted, frozen Seed fields participate. The ordered role catalog
  -- emits fixed labels, never raw Seed prose or unverified private attributes.
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
        '(current manager|my manager|manager|boss|team lead|supervisor|' ||
          U&'\4E0A\7EA7|\8001\677F|\9886\5BFC|\7ECF\7406|\4E3B\7BA1' || ')'),
      (2, 'Recruiter', 'opportunity_source', 'opportunity', 76::numeric,
        jsonb_build_array('Offer conditions', 'Decision deadline', 'Uncertain factors'),
        '(recruiter|hiring manager|human resources|new role|new company|offer|' ||
          U&'\62DB\8058|\730E\5934|\4EBA\529B|\9762\8BD5\5B98|\65B0\516C\53F8' || ')'),
      (3, 'Trusted colleague', 'colleague', 'support', 72::numeric,
        jsonb_build_array('Stance', 'Information gap', 'Influence scope'),
        '(trusted colleague|colleague|teammate|team member|coworker|' ||
          U&'\540C\4E8B|\961F\53CB|\56E2\961F\6210\5458' || ')'),
      (4, 'Partner or family', 'family_or_partner', 'emotional', 72::numeric,
        jsonb_build_array('Acceptable boundary', 'Practical pressure', 'Support condition'),
        '(spouse|life partner|romantic partner|family|wife|husband|parent|' ||
          U&'\4F34\4FA3|\5BB6\4EBA|\59BB\5B50|\4E08\592B|\914D\5076|\7236\6BCD' || ')'),
      (5, 'Collaborator', 'partner', 'resource', 70::numeric,
        jsonb_build_array('Benefit boundary', 'Resource input', 'Exit condition'),
        '(cofounder|co-founder|collaborator|business partner|client|investor|' ||
          U&'\5408\4F19\4EBA|\5408\4F5C\65B9|\8054\5408\521B\59CB\4EBA|\5BA2\6237|\6295\8D44\4EBA' || ')'),
      (6, 'Competitor', 'competitor', 'conflict', 68::numeric,
        jsonb_build_array('Competing resource', 'Recent action', 'Information source'),
        '(competitor|rival|' ||
          U&'\7ADE\4E89\8005|\7ADE\4E89\5BF9\624B|\5BF9\624B' || ')'),
      (7, 'Advisor', 'advisor', 'support', 72::numeric,
        jsonb_build_array('Advice stance', 'Trustworthy basis', 'Available resource'),
        '(mentor|advisor|coach|' ||
          U&'\5BFC\5E08|\987E\95EE|\6559\7EC3|\524D\8F88' || ')')
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
    v_evidence_ref := 'seed_context:' || p_seed_context_id::text || ':' || substring(v_fingerprint from 1 for 16);
    v_candidate_id := null;

    begin
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
        jsonb_build_array(v_evidence_ref),
        'phase3-key-person-v1',
        'phase3-key-people-rpc-v3',
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
      returning id into v_candidate_id;
    exception when unique_violation then
      -- The browser cannot SELECT the private fingerprint. The deterministic
      -- evidence reference is product-safe and maps the conflict to one row.
      select id into v_candidate_id
      from public.key_people
      where user_id = v_user_id
        and seed_context_id = p_seed_context_id
        and evidence_refs @> jsonb_build_array(v_evidence_ref)
      for update;
    end;

    if v_candidate_id is null then
      raise exception using errcode = 'P0001', message = 'persistence_failed';
    end if;
    v_candidate_ids := array_append(v_candidate_ids, v_candidate_id);
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

create or replace function public.mutate_key_people_phase3(
  p_seed_context_id uuid,
  p_idempotency_key uuid,
  p_operations jsonb
)
returns table (idempotent boolean, people jsonb)
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_receipt record;
  v_operation jsonb;
  v_person_status public.key_person_status;
  v_target_status public.key_person_status;
  v_person_evidence jsonb;
  v_target_evidence jsonb;
  v_person_id uuid;
  v_target_id uuid;
  v_ids uuid[] := '{}'::uuid[];
  v_hash text;
  v_actual_count integer;
  v_evidence jsonb;
  v_new_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'unauthenticated';
  end if;
  if p_seed_context_id is null or p_idempotency_key is null
    or jsonb_typeof(p_operations) <> 'array'
    or jsonb_array_length(p_operations) not between 1 and 25
  then
    raise exception using errcode = 'P0001', message = 'key_people_invalid';
  end if;

  perform 1
  from public.seed_contexts
  where id = p_seed_context_id
    and user_id = v_user_id
    and status = 'submitted';
  if not found then
    raise exception using errcode = 'P0001', message = 'seed_not_found';
  end if;

  perform set_config('app.phase3_key_people_rpc', 'on', true);
  v_hash := encode(
    digest(
      convert_to(
        jsonb_build_object('seed_context_id', p_seed_context_id, 'operations', p_operations)::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':phase3-key-people:' || p_seed_context_id::text, 0)
  );
  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':mutate:' || p_idempotency_key::text, 0)
  );

  select content_hash, seed_context_id, person_ids
  into v_receipt
  from public.key_people_idempotency_receipts
  where user_id = v_user_id
    and operation_kind = 'mutate'
    and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.content_hash <> v_hash or v_receipt.seed_context_id <> p_seed_context_id then
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

  for v_operation in select value from jsonb_array_elements(p_operations)
  loop
    if jsonb_typeof(v_operation) <> 'object' or jsonb_typeof(v_operation->'type') <> 'string' then
      raise exception using errcode = 'P0001', message = 'key_people_invalid';
    end if;

    if v_operation->>'type' = 'confirm' then
      if exists (select 1 from jsonb_object_keys(v_operation) k where k not in ('type', 'person_id'))
        or (v_operation->>'person_id') !~ '^[0-9a-fA-F-]{36}$'
      then
        raise exception using errcode = 'P0001', message = 'key_people_invalid';
      end if;
      v_person_id := (v_operation->>'person_id')::uuid;
      select status into v_person_status
      from public.key_people
      where id = v_person_id and user_id = v_user_id and seed_context_id = p_seed_context_id
      for update;
      if not found then
        raise exception using errcode = 'P0001', message = 'key_people_invalid';
      end if;
      if v_person_status not in ('candidate', 'needs_confirmation') then
        raise exception using errcode = 'P0001', message = 'invalid_people_transition';
      end if;
      update public.key_people set status = 'confirmed' where id = v_person_id;
      v_ids := array_append(v_ids, v_person_id);

    elsif v_operation->>'type' = 'rename' then
      if exists (select 1 from jsonb_object_keys(v_operation) k where k not in ('type', 'person_id', 'display_name'))
        or (v_operation->>'person_id') !~ '^[0-9a-fA-F-]{36}$'
        or nullif(btrim(v_operation->>'display_name'), '') is null
        or length(btrim(v_operation->>'display_name')) > 120
      then
        raise exception using errcode = 'P0001', message = 'key_people_invalid';
      end if;
      v_person_id := (v_operation->>'person_id')::uuid;
      select status into v_person_status
      from public.key_people
      where id = v_person_id and user_id = v_user_id and seed_context_id = p_seed_context_id
      for update;
      if not found then
        raise exception using errcode = 'P0001', message = 'key_people_invalid';
      end if;
      if v_person_status not in ('candidate', 'needs_confirmation', 'confirmed') then
        raise exception using errcode = 'P0001', message = 'invalid_people_transition';
      end if;
      update public.key_people
      set display_name = btrim(v_operation->>'display_name')
      where id = v_person_id;
      v_ids := array_append(v_ids, v_person_id);

    elsif v_operation->>'type' = 'delete' then
      if exists (select 1 from jsonb_object_keys(v_operation) k where k not in ('type', 'person_id'))
        or (v_operation->>'person_id') !~ '^[0-9a-fA-F-]{36}$'
      then
        raise exception using errcode = 'P0001', message = 'key_people_invalid';
      end if;
      v_person_id := (v_operation->>'person_id')::uuid;
      select status into v_person_status
      from public.key_people
      where id = v_person_id and user_id = v_user_id and seed_context_id = p_seed_context_id
      for update;
      if not found then
        raise exception using errcode = 'P0001', message = 'key_people_invalid';
      end if;
      if v_person_status not in ('candidate', 'needs_confirmation', 'confirmed') then
        raise exception using errcode = 'P0001', message = 'invalid_people_transition';
      end if;
      update public.key_people set status = 'deleted' where id = v_person_id;
      v_ids := array_append(v_ids, v_person_id);

    elsif v_operation->>'type' = 'merge' then
      if exists (select 1 from jsonb_object_keys(v_operation) k where k not in ('type', 'source_person_id', 'target_person_id'))
        or (v_operation->>'source_person_id') !~ '^[0-9a-fA-F-]{36}$'
        or (v_operation->>'target_person_id') !~ '^[0-9a-fA-F-]{36}$'
      then
        raise exception using errcode = 'P0001', message = 'key_people_invalid';
      end if;
      v_person_id := (v_operation->>'source_person_id')::uuid;
      v_target_id := (v_operation->>'target_person_id')::uuid;
      if v_person_id = v_target_id then
        raise exception using errcode = 'P0001', message = 'invalid_people_transition';
      end if;

      perform 1
      from public.key_people
      where id = any(array[v_person_id, v_target_id])
        and user_id = v_user_id
        and seed_context_id = p_seed_context_id
      order by id
      for update;
      get diagnostics v_actual_count = row_count;
      if v_actual_count <> 2 then
        raise exception using errcode = 'P0001', message = 'key_people_invalid';
      end if;

      select status, evidence_refs into v_person_status, v_person_evidence
      from public.key_people where id = v_person_id;
      select status, evidence_refs into v_target_status, v_target_evidence
      from public.key_people where id = v_target_id;
      if v_person_status not in ('candidate', 'needs_confirmation', 'confirmed')
        or v_target_status not in ('candidate', 'needs_confirmation', 'confirmed')
      then
        raise exception using errcode = 'P0001', message = 'invalid_people_transition';
      end if;

      select coalesce(jsonb_agg(value order by value), '[]'::jsonb) into v_evidence
      from (
        select distinct value from jsonb_array_elements_text(v_person_evidence)
        union
        select distinct value from jsonb_array_elements_text(v_target_evidence)
      ) union_evidence;
      update public.key_people set evidence_refs = v_evidence where id = v_target_id;
      update public.key_people
      set status = 'merged', merged_into_id = v_target_id
      where id = v_person_id;
      v_ids := array_append(array_append(v_ids, v_person_id), v_target_id);

    elsif v_operation->>'type' = 'supplement' then
      if exists (select 1 from jsonb_object_keys(v_operation) k where k not in ('type', 'display_name', 'relationship_to_user', 'role_type', 'note'))
        or nullif(btrim(v_operation->>'display_name'), '') is null
        or length(btrim(v_operation->>'display_name')) > 120
        or nullif(btrim(v_operation->>'relationship_to_user'), '') is null
        or length(btrim(v_operation->>'relationship_to_user')) > 80
        or nullif(btrim(v_operation->>'role_type'), '') is null
        or length(btrim(v_operation->>'role_type')) > 80
        or (v_operation ? 'note' and (
          jsonb_typeof(v_operation->'note') <> 'string'
          or length(v_operation->>'note') > 1000
        ))
      then
        raise exception using errcode = 'P0001', message = 'key_people_invalid';
      end if;
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
        idempotency_key
      ) values (
        v_user_id,
        p_seed_context_id,
        btrim(v_operation->>'display_name'),
        btrim(v_operation->>'relationship_to_user'),
        btrim(v_operation->>'role_type'),
        100,
        jsonb_build_array('User-confirmed supplemental person.'),
        '[]'::jsonb,
        'confirmed',
        jsonb_build_array('user_supplement'),
        'phase3-key-person-v1',
        'phase3-key-people-rpc-v3',
        gen_random_uuid()::text,
        'user_supplement',
        jsonb_build_object(
          'display_name', 'user_confirmed',
          'relationship_to_user', 'user_confirmed',
          'role_type', 'user_confirmed'
        ),
        p_idempotency_key
      ) returning id into v_new_id;
      v_ids := array_append(v_ids, v_new_id);

    else
      raise exception using errcode = 'P0001', message = 'key_people_invalid';
    end if;
  end loop;

  select coalesce(array_agg(distinct person_id order by person_id), '{}'::uuid[])
  into v_ids
  from unnest(v_ids) as ids(person_id);
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
    'mutate',
    p_idempotency_key,
    v_hash,
    v_ids
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

revoke all on function public.extract_key_people_phase3(uuid, uuid) from public, anon;
revoke all on function public.mutate_key_people_phase3(uuid, uuid, jsonb) from public, anon;
grant execute on function public.extract_key_people_phase3(uuid, uuid) to authenticated;
grant execute on function public.mutate_key_people_phase3(uuid, uuid, jsonb) to authenticated;
