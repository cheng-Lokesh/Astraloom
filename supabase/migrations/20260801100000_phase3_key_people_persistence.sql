-- Phase 3 Step A: submitted Seed-backed Key People only.
-- All mutation functions are SECURITY INVOKER so RLS remains active for auth.uid().

alter table public.seed_contexts
  add constraint seed_contexts_id_user_id_key unique (id, user_id);

alter table public.key_people
  add column if not exists version text not null default 'phase3-key-person-v1',
  add column if not exists writer_version text not null default 'phase3-key-people-rpc-v1',
  add column if not exists trace_id text not null default gen_random_uuid()::text,
  add column if not exists source text not null default 'legacy',
  add column if not exists field_sources jsonb not null default '{}'::jsonb,
  add column if not exists idempotency_key uuid,
  add column if not exists extraction_fingerprint text;

alter table public.key_people
  add constraint key_people_id_user_seed_key unique (id, user_id, seed_context_id);

alter table public.key_people
  add constraint key_people_owner_seed_context_fkey
    foreign key (seed_context_id, user_id)
    references public.seed_contexts(id, user_id)
    on delete cascade
    not valid;
alter table public.key_people validate constraint key_people_owner_seed_context_fkey;

alter table public.key_people
  drop constraint if exists key_people_merged_into_id_fkey,
  add constraint key_people_merged_owner_seed_fkey
    foreign key (merged_into_id, user_id, seed_context_id)
    references public.key_people(id, user_id, seed_context_id)
    on delete set null (merged_into_id);

create index if not exists key_people_owner_seed_idempotency_idx
  on public.key_people(user_id, seed_context_id, idempotency_key)
  where idempotency_key is not null;
create unique index if not exists key_people_owner_seed_extraction_fingerprint_idx
  on public.key_people(user_id, seed_context_id, extraction_fingerprint)
  where extraction_fingerprint is not null;

create table if not exists public.key_people_idempotency_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_context_id uuid not null,
  operation_kind text not null check (operation_kind in ('extract', 'mutate')),
  idempotency_key uuid not null,
  content_hash text not null check (length(content_hash) = 64),
  person_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  primary key (user_id, operation_kind, idempotency_key),
  foreign key (seed_context_id, user_id)
    references public.seed_contexts(id, user_id)
    on delete cascade
);

create index if not exists key_people_receipts_owner_seed_idx
  on public.key_people_idempotency_receipts(user_id, seed_context_id, created_at desc);

alter table public.key_people_idempotency_receipts enable row level security;

-- SECURITY INVOKER needs role privileges; the transaction-local guard below
-- prevents REST table writes while allowing only the two narrow RPCs to mutate.
grant select, insert, update, delete on public.key_people to authenticated;
grant select, insert on public.key_people_idempotency_receipts to authenticated;
revoke all on public.key_people, public.key_people_idempotency_receipts from anon;

drop policy if exists "key_people_select_own" on public.key_people;
drop policy if exists "key_people_insert_own" on public.key_people;
drop policy if exists "key_people_update_own" on public.key_people;
drop policy if exists "key_people_delete_own" on public.key_people;

create policy "key_people_select_submitted_owner" on public.key_people
  for select to authenticated
  using (
    auth.uid() is not null and auth.uid() = user_id and exists (
      select 1 from public.seed_contexts s
      where s.id = key_people.seed_context_id
        and s.user_id = auth.uid()
        and s.status = 'submitted'
    )
  );

create policy "key_people_insert_phase3_rpc" on public.key_people
  for insert to authenticated
  with check (
    auth.uid() is not null and auth.uid() = user_id and
    current_setting('app.phase3_key_people_rpc', true) = 'on' and exists (
      select 1 from public.seed_contexts s
      where s.id = key_people.seed_context_id
        and s.user_id = auth.uid()
        and s.status = 'submitted'
    )
  );

create policy "key_people_update_phase3_rpc" on public.key_people
  for update to authenticated
  using (
    auth.uid() is not null and auth.uid() = user_id and
    current_setting('app.phase3_key_people_rpc', true) = 'on'
  )
  with check (
    auth.uid() is not null and auth.uid() = user_id and
    current_setting('app.phase3_key_people_rpc', true) = 'on' and exists (
      select 1 from public.seed_contexts s
      where s.id = key_people.seed_context_id
        and s.user_id = auth.uid()
        and s.status = 'submitted'
    )
  );

create policy "key_people_delete_phase3_rpc" on public.key_people
  for delete to authenticated
  using (
    auth.uid() is not null and auth.uid() = user_id and
    current_setting('app.phase3_key_people_rpc', true) = 'on'
  );

create policy "key_people_receipts_select_owner" on public.key_people_idempotency_receipts
  for select to authenticated
  using (auth.uid() is not null and auth.uid() = user_id);
create policy "key_people_receipts_insert_phase3_rpc" on public.key_people_idempotency_receipts
  for insert to authenticated
  with check (
    auth.uid() is not null and auth.uid() = user_id and
    current_setting('app.phase3_key_people_rpc', true) = 'on'
  );

create or replace function public.extract_key_people_phase3(
  p_seed_context_id uuid,
  p_idempotency_key uuid,
  p_candidates jsonb
)
returns table (idempotent boolean, people jsonb)
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_receipt public.key_people_idempotency_receipts%rowtype;
  v_candidate jsonb;
  v_candidate_id uuid;
  v_candidate_ids uuid[] := '{}'::uuid[];
  v_hash text;
  v_fingerprint text;
  v_confidence numeric;
  v_status public.key_person_status;
  v_actual_count integer;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'unauthenticated';
  end if;
  if p_seed_context_id is null or p_idempotency_key is null
    or jsonb_typeof(p_candidates) <> 'array' or jsonb_array_length(p_candidates) > 8 then
    raise exception using errcode = 'P0001', message = 'key_people_invalid';
  end if;

  perform 1 from public.seed_contexts
  where id = p_seed_context_id and user_id = v_user_id and status = 'submitted';
  if not found then
    raise exception using errcode = 'P0001', message = 'seed_not_found';
  end if;

  perform set_config('app.phase3_key_people_rpc', 'on', true);
  v_hash := encode(digest(convert_to(jsonb_build_object('seed_context_id', p_seed_context_id, 'candidates', p_candidates)::text, 'UTF8'), 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':extract:' || p_idempotency_key::text, 0));

  select * into v_receipt from public.key_people_idempotency_receipts
  where user_id = v_user_id and operation_kind = 'extract' and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.content_hash <> v_hash or v_receipt.seed_context_id <> p_seed_context_id then
      raise exception using errcode = 'P0001', message = 'idempotency_key_content_conflict';
    end if;
    select count(*) into v_actual_count from public.key_people
    where user_id = v_user_id and seed_context_id = p_seed_context_id and id = any(v_receipt.person_ids);
    if v_actual_count <> cardinality(v_receipt.person_ids) then
      raise exception using errcode = 'P0001', message = 'persistence_failed';
    end if;
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'display_name', display_name, 'relationship_to_user', relationship_to_user,
      'role_type', role_type, 'confidence', confidence, 'known_evidence', known_evidence,
      'missing_fields', missing_fields, 'status', status, 'merged_into_id', merged_into_id,
      'evidence_refs', evidence_refs, 'version', version
    ) order by created_at), '[]'::jsonb) into people
    from public.key_people where user_id = v_user_id and seed_context_id = p_seed_context_id;
    idempotent := true;
    return next;
    return;
  end if;

  for v_candidate in select value from jsonb_array_elements(p_candidates)
  loop
    if jsonb_typeof(v_candidate) <> 'object'
      or exists (select 1 from jsonb_object_keys(v_candidate) as k where k not in ('display_name', 'relationship_to_user', 'role_type', 'confidence', 'known_evidence', 'missing_fields', 'source'))
      or jsonb_typeof(v_candidate->'display_name') <> 'string'
      or jsonb_typeof(v_candidate->'relationship_to_user') <> 'string'
      or jsonb_typeof(v_candidate->'role_type') <> 'string'
      or jsonb_typeof(v_candidate->'confidence') <> 'number'
      or jsonb_typeof(v_candidate->'known_evidence') <> 'array'
      or jsonb_typeof(v_candidate->'missing_fields') <> 'array'
      or jsonb_typeof(v_candidate->'source') <> 'string'
      or jsonb_array_length(v_candidate->'known_evidence') > 12
      or jsonb_array_length(v_candidate->'missing_fields') > 20
      or nullif(btrim(v_candidate->>'display_name'), '') is null
      or length(btrim(v_candidate->>'display_name')) > 120
      or length(btrim(v_candidate->>'relationship_to_user')) > 80
      or length(btrim(v_candidate->>'role_type')) > 80
      or v_candidate->>'source' not in ('key_people_text', 'seed_context_text')
      or exists (select 1 from jsonb_array_elements(v_candidate->'known_evidence') e where jsonb_typeof(e) <> 'string' or length(e #>> '{}') > 400)
      or exists (select 1 from jsonb_array_elements(v_candidate->'missing_fields') e where jsonb_typeof(e) <> 'string' or length(e #>> '{}') > 200)
    then
      raise exception using errcode = 'P0001', message = 'key_people_invalid';
    end if;
    v_confidence := (v_candidate->>'confidence')::numeric;
    if v_confidence < 0 or v_confidence > 100 then
      raise exception using errcode = 'P0001', message = 'key_people_invalid';
    end if;
    v_status := case when v_confidence < 70 then 'needs_confirmation'::public.key_person_status else 'candidate'::public.key_person_status end;
    v_fingerprint := encode(digest(convert_to(v_candidate::text, 'UTF8'), 'sha256'), 'hex');

    select id into v_candidate_id from public.key_people
    where user_id = v_user_id and seed_context_id = p_seed_context_id and extraction_fingerprint = v_fingerprint
    for update;
    if not found then
      insert into public.key_people (
        user_id, seed_context_id, display_name, relationship_to_user, role_type, confidence,
        known_evidence, missing_fields, status, evidence_refs, version, writer_version,
        trace_id, source, field_sources, idempotency_key, extraction_fingerprint
      ) values (
        v_user_id, p_seed_context_id, btrim(v_candidate->>'display_name'),
        btrim(v_candidate->>'relationship_to_user'), btrim(v_candidate->>'role_type'), v_confidence,
        jsonb_build_array('Derived from the submitted Seed context.'), v_candidate->'missing_fields',
        v_status, jsonb_build_array('seed_context:' || p_seed_context_id::text || ':' || substring(v_fingerprint from 1 for 16)),
        'phase3-key-person-v1', 'phase3-key-people-rpc-v1', gen_random_uuid()::text,
        v_candidate->>'source', jsonb_build_object(
          'display_name', 'deterministic_extractor', 'relationship_to_user', 'deterministic_extractor',
          'role_type', 'deterministic_extractor', 'confidence', 'deterministic_extractor'
        ), p_idempotency_key, v_fingerprint
      ) returning id into v_candidate_id;
    end if;
    v_candidate_ids := array_append(v_candidate_ids, v_candidate_id);
  end loop;

  insert into public.key_people_idempotency_receipts (
    user_id, seed_context_id, operation_kind, idempotency_key, content_hash, person_ids
  ) values (v_user_id, p_seed_context_id, 'extract', p_idempotency_key, v_hash, v_candidate_ids);

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'display_name', display_name, 'relationship_to_user', relationship_to_user,
    'role_type', role_type, 'confidence', confidence, 'known_evidence', known_evidence,
    'missing_fields', missing_fields, 'status', status, 'merged_into_id', merged_into_id,
    'evidence_refs', evidence_refs, 'version', version
  ) order by created_at), '[]'::jsonb) into people
  from public.key_people where user_id = v_user_id and seed_context_id = p_seed_context_id;
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
  v_receipt public.key_people_idempotency_receipts%rowtype;
  v_operation jsonb;
  v_person public.key_people%rowtype;
  v_target public.key_people%rowtype;
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
    or jsonb_typeof(p_operations) <> 'array' or jsonb_array_length(p_operations) not between 1 and 25 then
    raise exception using errcode = 'P0001', message = 'key_people_invalid';
  end if;
  perform 1 from public.seed_contexts
  where id = p_seed_context_id and user_id = v_user_id and status = 'submitted';
  if not found then
    raise exception using errcode = 'P0001', message = 'seed_not_found';
  end if;

  perform set_config('app.phase3_key_people_rpc', 'on', true);
  v_hash := encode(digest(convert_to(jsonb_build_object('seed_context_id', p_seed_context_id, 'operations', p_operations)::text, 'UTF8'), 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':mutate:' || p_idempotency_key::text, 0));
  select * into v_receipt from public.key_people_idempotency_receipts
  where user_id = v_user_id and operation_kind = 'mutate' and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.content_hash <> v_hash or v_receipt.seed_context_id <> p_seed_context_id then
      raise exception using errcode = 'P0001', message = 'idempotency_key_content_conflict';
    end if;
    select count(*) into v_actual_count from public.key_people
    where user_id = v_user_id and seed_context_id = p_seed_context_id and id = any(v_receipt.person_ids);
    if v_actual_count <> cardinality(v_receipt.person_ids) then
      raise exception using errcode = 'P0001', message = 'persistence_failed';
    end if;
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'display_name', display_name, 'relationship_to_user', relationship_to_user,
      'role_type', role_type, 'confidence', confidence, 'known_evidence', known_evidence,
      'missing_fields', missing_fields, 'status', status, 'merged_into_id', merged_into_id,
      'evidence_refs', evidence_refs, 'version', version
    ) order by created_at), '[]'::jsonb) into people
    from public.key_people where user_id = v_user_id and seed_context_id = p_seed_context_id;
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
        or (v_operation->>'person_id') !~ '^[0-9a-fA-F-]{36}$' then
        raise exception using errcode = 'P0001', message = 'key_people_invalid';
      end if;
      v_person_id := (v_operation->>'person_id')::uuid;
      select * into v_person from public.key_people where id = v_person_id and user_id = v_user_id and seed_context_id = p_seed_context_id for update;
      if not found then raise exception using errcode = 'P0001', message = 'key_people_invalid'; end if;
      if v_person.status not in ('candidate', 'needs_confirmation') then raise exception using errcode = 'P0001', message = 'invalid_people_transition'; end if;
      update public.key_people set status = 'confirmed', trace_id = gen_random_uuid()::text,
        field_sources = field_sources || jsonb_build_object('status', 'user_confirmed') where id = v_person_id;
      v_ids := array_append(v_ids, v_person_id);
    elsif v_operation->>'type' = 'rename' then
      if exists (select 1 from jsonb_object_keys(v_operation) k where k not in ('type', 'person_id', 'display_name'))
        or (v_operation->>'person_id') !~ '^[0-9a-fA-F-]{36}$'
        or nullif(btrim(v_operation->>'display_name'), '') is null or length(btrim(v_operation->>'display_name')) > 120 then
        raise exception using errcode = 'P0001', message = 'key_people_invalid';
      end if;
      v_person_id := (v_operation->>'person_id')::uuid;
      select * into v_person from public.key_people where id = v_person_id and user_id = v_user_id and seed_context_id = p_seed_context_id for update;
      if not found then raise exception using errcode = 'P0001', message = 'key_people_invalid'; end if;
      if v_person.status not in ('candidate', 'needs_confirmation', 'confirmed') then raise exception using errcode = 'P0001', message = 'invalid_people_transition'; end if;
      update public.key_people set display_name = btrim(v_operation->>'display_name'), trace_id = gen_random_uuid()::text,
        field_sources = field_sources || jsonb_build_object('display_name', 'user_confirmed') where id = v_person_id;
      v_ids := array_append(v_ids, v_person_id);
    elsif v_operation->>'type' = 'delete' then
      if exists (select 1 from jsonb_object_keys(v_operation) k where k not in ('type', 'person_id'))
        or (v_operation->>'person_id') !~ '^[0-9a-fA-F-]{36}$' then
        raise exception using errcode = 'P0001', message = 'key_people_invalid';
      end if;
      v_person_id := (v_operation->>'person_id')::uuid;
      select * into v_person from public.key_people where id = v_person_id and user_id = v_user_id and seed_context_id = p_seed_context_id for update;
      if not found then raise exception using errcode = 'P0001', message = 'key_people_invalid'; end if;
      if v_person.status not in ('candidate', 'needs_confirmation', 'confirmed') then raise exception using errcode = 'P0001', message = 'invalid_people_transition'; end if;
      update public.key_people set status = 'deleted', trace_id = gen_random_uuid()::text,
        field_sources = field_sources || jsonb_build_object('status', 'user_confirmed') where id = v_person_id;
      v_ids := array_append(v_ids, v_person_id);
    elsif v_operation->>'type' = 'merge' then
      if exists (select 1 from jsonb_object_keys(v_operation) k where k not in ('type', 'source_person_id', 'target_person_id'))
        or (v_operation->>'source_person_id') !~ '^[0-9a-fA-F-]{36}$'
        or (v_operation->>'target_person_id') !~ '^[0-9a-fA-F-]{36}$' then
        raise exception using errcode = 'P0001', message = 'key_people_invalid';
      end if;
      v_person_id := (v_operation->>'source_person_id')::uuid;
      v_target_id := (v_operation->>'target_person_id')::uuid;
      if v_person_id = v_target_id then raise exception using errcode = 'P0001', message = 'invalid_people_transition'; end if;
      select * into v_person from public.key_people where id = v_person_id and user_id = v_user_id and seed_context_id = p_seed_context_id for update;
      if not found then raise exception using errcode = 'P0001', message = 'key_people_invalid'; end if;
      select * into v_target from public.key_people where id = v_target_id and user_id = v_user_id and seed_context_id = p_seed_context_id for update;
      if not found then raise exception using errcode = 'P0001', message = 'key_people_invalid'; end if;
      if v_person.status not in ('candidate', 'needs_confirmation', 'confirmed') or v_target.status not in ('candidate', 'needs_confirmation', 'confirmed') then
        raise exception using errcode = 'P0001', message = 'invalid_people_transition';
      end if;
      select coalesce(jsonb_agg(value order by value), '[]'::jsonb) into v_evidence from (
        select distinct value from jsonb_array_elements_text(v_person.evidence_refs)
        union
        select distinct value from jsonb_array_elements_text(v_target.evidence_refs)
      ) union_evidence;
      update public.key_people set evidence_refs = v_evidence, trace_id = gen_random_uuid()::text,
        field_sources = field_sources || jsonb_build_object('evidence_refs', 'merged_user_confirmed') where id = v_target_id;
      update public.key_people set status = 'merged', merged_into_id = v_target_id, trace_id = gen_random_uuid()::text,
        field_sources = field_sources || jsonb_build_object('status', 'merged_user_confirmed') where id = v_person_id;
      v_ids := array_append(array_append(v_ids, v_person_id), v_target_id);
    elsif v_operation->>'type' = 'supplement' then
      if exists (select 1 from jsonb_object_keys(v_operation) k where k not in ('type', 'display_name', 'relationship_to_user', 'role_type', 'note'))
        or nullif(btrim(v_operation->>'display_name'), '') is null or length(btrim(v_operation->>'display_name')) > 120
        or nullif(btrim(v_operation->>'relationship_to_user'), '') is null or length(btrim(v_operation->>'relationship_to_user')) > 80
        or nullif(btrim(v_operation->>'role_type'), '') is null or length(btrim(v_operation->>'role_type')) > 80
        or (v_operation ? 'note' and (jsonb_typeof(v_operation->'note') <> 'string' or length(v_operation->>'note') > 1000)) then
        raise exception using errcode = 'P0001', message = 'key_people_invalid';
      end if;
      insert into public.key_people (
        user_id, seed_context_id, display_name, relationship_to_user, role_type, confidence,
        known_evidence, missing_fields, status, evidence_refs, version, writer_version, trace_id,
        source, field_sources, idempotency_key
      ) values (
        v_user_id, p_seed_context_id, btrim(v_operation->>'display_name'), btrim(v_operation->>'relationship_to_user'),
        btrim(v_operation->>'role_type'), 100, jsonb_build_array('User-confirmed supplemental person.'), '[]'::jsonb,
        'confirmed', jsonb_build_array('user_supplement'), 'phase3-key-person-v1', 'phase3-key-people-rpc-v1',
        gen_random_uuid()::text, 'user_supplement', jsonb_build_object(
          'display_name', 'user_confirmed', 'relationship_to_user', 'user_confirmed', 'role_type', 'user_confirmed'
        ), p_idempotency_key
      ) returning id into v_new_id;
      v_ids := array_append(v_ids, v_new_id);
    else
      raise exception using errcode = 'P0001', message = 'key_people_invalid';
    end if;
  end loop;

  select coalesce(array_agg(distinct person_id), '{}'::uuid[]) into v_ids from unnest(v_ids) as ids(person_id);
  insert into public.key_people_idempotency_receipts (
    user_id, seed_context_id, operation_kind, idempotency_key, content_hash, person_ids
  ) values (v_user_id, p_seed_context_id, 'mutate', p_idempotency_key, v_hash, v_ids);
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'display_name', display_name, 'relationship_to_user', relationship_to_user,
    'role_type', role_type, 'confidence', confidence, 'known_evidence', known_evidence,
    'missing_fields', missing_fields, 'status', status, 'merged_into_id', merged_into_id,
    'evidence_refs', evidence_refs, 'version', version
  ) order by created_at), '[]'::jsonb) into people
  from public.key_people where user_id = v_user_id and seed_context_id = p_seed_context_id;
  idempotent := false;
  return next;
end;
$$;

revoke all on function public.extract_key_people_phase3(uuid, uuid, jsonb) from public;
revoke all on function public.mutate_key_people_phase3(uuid, uuid, jsonb) from public;
grant execute on function public.extract_key_people_phase3(uuid, uuid, jsonb) to authenticated;
grant execute on function public.mutate_key_people_phase3(uuid, uuid, jsonb) to authenticated;
