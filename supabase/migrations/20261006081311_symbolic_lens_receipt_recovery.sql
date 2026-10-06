create or replace function public.persist_symbolic_lens_v1(p_user_id uuid,p_expected_revision integer,p_idempotency_key uuid,p_operation text,p_source jsonb,p_frame jsonb,p_trace_id text)
returns table(revision integer,storage_consent boolean,calculation_consent boolean,future_attachment_consent boolean,source_version integer,current_snapshot jsonb,updated_at timestamptz,idempotent boolean)
language plpgsql security invoker set search_path=public,extensions,pg_temp as $$
declare pref public.symbolic_lens_preferences%rowtype; src public.symbolic_birth_sources%rowtype; receipt record; h text; storage_id uuid; calc_id uuid; snap_id uuid; new_rev integer; today date:=(clock_timestamp() at time zone 'Asia/Shanghai')::date; meta jsonb;
begin
  if current_user<>'service_role' then raise exception 'symbolic_writer_required'; end if;
  if p_user_id is null or not exists(select 1 from auth.users u where u.id=p_user_id and u.deleted_at is null and (u.banned_until is null or u.banned_until<clock_timestamp()) and not coalesce(u.is_anonymous,false)) then raise exception 'symbolic_owner_invalid'; end if;
  if p_expected_revision is null or p_expected_revision<0 or p_idempotency_key is null or p_operation is null or p_operation not in ('replace_source','refresh_period') or p_trace_id is null or p_trace_id !~ '^symbolic_lens_[0-9a-f-]{36}$' or not public.valid_symbolic_frame_v1(p_frame) then raise exception 'invalid_symbolic_input'; end if;
  h:=encode(digest(convert_to(jsonb_build_object('operation',p_operation,'revision',p_expected_revision,'source',p_source,'frame',p_frame)::text,'UTF8'),'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended('symbolic_lens_v1:'||p_user_id::text,0));
  select * into pref from public.symbolic_lens_preferences p where p.user_id=p_user_id for update;
  select e.metadata into receipt from public.consent_events e where e.user_id=p_user_id and e.consent_type='symbolic_calculation' and e.source='formal_symbolic_lens_v1' and e.metadata->>'request_key'=p_idempotency_key::text;
  if found then
    if receipt.metadata->>'request_hash' is distinct from h then raise exception 'symbolic_idempotency_conflict'; end if;
    return query select p.revision,p.storage_consent,p.calculation_consent,p.future_attachment_consent,p.source_version,s.frame,p.updated_at,true from public.symbolic_lens_preferences p left join public.symbolic_lens_snapshots s on s.id=p.current_snapshot_id and s.user_id=p.user_id where p.user_id=p_user_id; return;
  end if;
  if coalesce(pref.revision,0)<>p_expected_revision then raise exception 'symbolic_revision_conflict'; end if;
  if p_frame->'referencePeriod'->>'referenceDate' is distinct from today::text or p_frame->'referencePeriod'->>'key' is distinct from to_char(today,'YYYY-MM') then raise exception 'invalid_symbolic_input'; end if;
  new_rev:=p_expected_revision+1;
  if p_operation='replace_source' then
    if not public.symbolic_keys_v1(p_source,array['birthDate','birthTime']) or jsonb_typeof(p_source->'birthDate') is distinct from 'string' or p_source->>'birthDate' !~ '^(19|20)[0-9]{2}-[0-9]{2}-[0-9]{2}$' or
      (p_source->'birthTime' is distinct from 'null'::jsonb and (jsonb_typeof(p_source->'birthTime') is distinct from 'string' or p_source->>'birthTime' !~ '^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$')) then raise exception 'invalid_symbolic_input'; end if;
    begin src.birth_date:=(p_source->>'birthDate')::date; exception when others then raise exception 'invalid_symbolic_input'; end;
    if src.birth_date>today or src.birth_date<date '1900-01-01' then raise exception 'invalid_symbolic_input'; end if;
    src.birth_time:=p_source->>'birthTime'; src.source_version:=new_rev; src.user_id:=p_user_id;
  else
    if p_source is not null then raise exception 'invalid_symbolic_input'; end if;
    if not coalesce(pref.storage_consent,false) or not coalesce(pref.calculation_consent,false) then raise exception 'symbolic_consent_required'; end if;
    select * into src from public.symbolic_birth_sources b where b.id=pref.source_id and b.user_id=p_user_id and b.source_version=pref.source_version;
    if not found or not exists(select 1 from public.consent_events e where e.id=src.storage_consent_id and e.user_id=p_user_id and e.consent_type='symbolic_storage' and e.status='active' and e.source='formal_symbolic_lens_v1') or
      not exists(select 1 from public.symbolic_lens_snapshots s join public.consent_events e on e.id=s.calculation_consent_id and e.user_id=s.user_id where s.id=pref.current_snapshot_id and s.user_id=p_user_id and s.source_id=src.id and e.consent_type='symbolic_calculation' and e.status='active' and e.source='formal_symbolic_lens_v1') then raise exception 'symbolic_consent_required'; end if;
  end if;
  if (p_frame->>'sourceVersion')::integer<>src.source_version or (p_frame->'calculation'->>'precision') is distinct from (case when src.birth_time is null then 'date_only' else 'date_time_local' end) then raise exception 'invalid_symbolic_input'; end if;
  meta:=jsonb_build_object('operation',p_operation,'request_key',p_idempotency_key,'request_hash',h,'input_hash',encode(digest(convert_to(jsonb_build_object('operation',p_operation,'revision',p_expected_revision,'source',p_source)::text,'UTF8'),'sha256'),'hex'),'revision',new_rev,'source_version',src.source_version,'frame_version','formal-symbolic-frame-v1');
  if p_operation='replace_source' then
    insert into public.consent_events(user_id,consent_type,status,source,metadata) values(p_user_id,'symbolic_storage','active','formal_symbolic_lens_v1',meta-'request_hash') returning id into storage_id;
    insert into public.symbolic_birth_sources(user_id,source_version,birth_date,birth_time,storage_consent_id) values(p_user_id,src.source_version,src.birth_date,src.birth_time,storage_id) returning * into src;
  end if;
  insert into public.consent_events(user_id,consent_type,status,source,metadata) values(p_user_id,'symbolic_calculation','active','formal_symbolic_lens_v1',meta) returning id into calc_id;
  insert into public.symbolic_lens_snapshots(user_id,source_id,source_version,calculation_consent_id,frame) values(p_user_id,src.id,src.source_version,calc_id,p_frame) returning id into snap_id;
  insert into public.symbolic_lens_preferences(user_id,revision,source_id,source_version,current_snapshot_id,storage_consent,calculation_consent,future_attachment_consent) values(p_user_id,new_rev,src.id,src.source_version,snap_id,true,true,false)
  on conflict(user_id) do update set revision=excluded.revision,source_id=excluded.source_id,source_version=excluded.source_version,current_snapshot_id=excluded.current_snapshot_id,storage_consent=true,calculation_consent=true,future_attachment_consent=false,updated_at=clock_timestamp();
  return query select p.revision,p.storage_consent,p.calculation_consent,p.future_attachment_consent,p.source_version,s.frame,p.updated_at,false from public.symbolic_lens_preferences p join public.symbolic_lens_snapshots s on s.id=p.current_snapshot_id and s.user_id=p.user_id where p.user_id=p_user_id;
end $$;

-- Receipt-first recovery does not consume a birth source for calculation.
create function public.recover_symbolic_lens_v1(p_user_id uuid,p_expected_revision integer,p_idempotency_key uuid,p_operation text,p_source jsonb)
returns table(revision integer,storage_consent boolean,calculation_consent boolean,future_attachment_consent boolean,source_version integer,current_snapshot jsonb,updated_at timestamptz,idempotent boolean)
language plpgsql security invoker set search_path=public,extensions,pg_temp as $$
declare receipt record; h text;
begin
  if current_user<>'service_role' then raise exception 'symbolic_writer_required'; end if;
  if p_user_id is null or not exists(select 1 from auth.users u where u.id=p_user_id and u.deleted_at is null and (u.banned_until is null or u.banned_until<clock_timestamp()) and not coalesce(u.is_anonymous,false)) then raise exception 'symbolic_owner_invalid'; end if;
  if p_expected_revision is null or p_expected_revision<0 or p_idempotency_key is null or p_operation is null or p_operation not in ('replace_source','refresh_period') then raise exception 'invalid_symbolic_input'; end if;
  if (p_operation='refresh_period' and p_source is not null) or
    (p_operation='replace_source' and not public.symbolic_keys_v1(p_source,array['birthDate','birthTime'])) then raise exception 'invalid_symbolic_input'; end if;
  h:=encode(digest(convert_to(jsonb_build_object('operation',p_operation,'revision',p_expected_revision,'source',p_source)::text,'UTF8'),'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended('symbolic_lens_v1:'||p_user_id::text,0));
  select e.metadata into receipt from public.consent_events e where e.user_id=p_user_id and e.consent_type='symbolic_calculation' and e.source='formal_symbolic_lens_v1' and e.metadata->>'request_key'=p_idempotency_key::text;
  if not found then return; end if;
  if receipt.metadata->>'input_hash' is distinct from h then raise exception 'symbolic_idempotency_conflict'; end if;
  return query select p.revision,p.storage_consent,p.calculation_consent,p.future_attachment_consent,p.source_version,s.frame,p.updated_at,true from public.symbolic_lens_preferences p left join public.symbolic_lens_snapshots s on s.id=p.current_snapshot_id and s.user_id=p.user_id where p.user_id=p_user_id;
end $$;
revoke all on function public.recover_symbolic_lens_v1(uuid,integer,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.recover_symbolic_lens_v1(uuid,integer,uuid,text,jsonb) to service_role;

