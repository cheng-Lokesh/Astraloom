-- Optional symbolic lens: separate from Reality/Evidence and not a Run prior.
create table public.symbolic_birth_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_version integer not null check (source_version > 0),
  birth_date date not null check (birth_date >= date '1900-01-01' and birth_date < date '2100-01-01'),
  birth_time text check (birth_time ~ '^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$'),
  storage_consent_id uuid not null references public.consent_events(id),
  created_at timestamptz not null default now(),
  unique (user_id,source_version), unique (id,user_id,source_version)
);
create table public.symbolic_lens_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null,
  source_version integer not null,
  calculation_consent_id uuid not null references public.consent_events(id),
  frame jsonb not null,
  created_at timestamptz not null default now(),
  unique (id,user_id),
  foreign key (source_id,user_id,source_version) references public.symbolic_birth_sources(id,user_id,source_version)
);
create table public.symbolic_lens_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision integer not null check (revision > 0),
  source_id uuid not null,
  source_version integer not null,
  current_snapshot_id uuid,
  storage_consent boolean not null,
  calculation_consent boolean not null,
  future_attachment_consent boolean not null default false check (not future_attachment_consent),
  updated_at timestamptz not null default now(),
  constraint symbolic_lens_preferences_source_owner_fkey foreign key (source_id,user_id,source_version) references public.symbolic_birth_sources(id,user_id,source_version),
  constraint symbolic_lens_preferences_snapshot_owner_fkey foreign key (current_snapshot_id,user_id) references public.symbolic_lens_snapshots(id,user_id),
  check ((storage_consent and calculation_consent and current_snapshot_id is not null) or
    (not storage_consent and not calculation_consent and current_snapshot_id is null))
);
create index symbolic_birth_sources_consent_idx on public.symbolic_birth_sources(storage_consent_id);
create index symbolic_lens_snapshots_owner_created_idx on public.symbolic_lens_snapshots(user_id,created_at desc);
create index symbolic_lens_snapshots_source_idx on public.symbolic_lens_snapshots(source_id,user_id,source_version);
create index symbolic_lens_snapshots_consent_idx on public.symbolic_lens_snapshots(calculation_consent_id);
create index symbolic_lens_preferences_source_idx on public.symbolic_lens_preferences(source_id,user_id,source_version);
create index symbolic_lens_preferences_snapshot_idx on public.symbolic_lens_preferences(current_snapshot_id,user_id);
create unique index symbolic_lens_receipt_idx on public.consent_events(user_id,(metadata->>'request_key'))
  where consent_type='symbolic_calculation' and source='formal_symbolic_lens_v1';

alter table public.symbolic_birth_sources enable row level security;
alter table public.symbolic_lens_snapshots enable row level security;
alter table public.symbolic_lens_preferences enable row level security;
create policy symbolic_birth_sources_select_own on public.symbolic_birth_sources for select to authenticated using (user_id=(select auth.uid()));
create policy symbolic_lens_snapshots_select_own on public.symbolic_lens_snapshots for select to authenticated using (user_id=(select auth.uid()));
create policy symbolic_lens_preferences_select_own on public.symbolic_lens_preferences for select to authenticated using (user_id=(select auth.uid()));
revoke all on public.symbolic_birth_sources,public.symbolic_lens_snapshots,public.symbolic_lens_preferences from public,anon,authenticated,service_role;
grant select on public.symbolic_birth_sources,public.symbolic_lens_snapshots,public.symbolic_lens_preferences to authenticated;
grant select,insert on public.symbolic_birth_sources,public.symbolic_lens_snapshots to service_role;
grant select,insert,update on public.symbolic_lens_preferences to service_role;
-- The existing service role has no implicit privileges on these existing ledgers.
grant select(id,deleted_at,banned_until,is_anonymous) on auth.users to service_role;
grant select(id,user_id,consent_type,status,source,metadata,created_at) on public.consent_events to service_role;
grant insert(user_id,consent_type,status,source,metadata) on public.consent_events to service_role;

create function public.guard_symbolic_consent_v1() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  if new.consent_type in ('symbolic_storage','symbolic_calculation','symbolic_future_attachment') or new.source='formal_symbolic_lens_v1' then
    if current_user <> 'service_role' then raise exception 'symbolic_consent_writer_required'; end if;
  end if;
  return new;
end $$;
create trigger symbolic_consent_controlled_insert before insert on public.consent_events for each row execute function public.guard_symbolic_consent_v1();
create function public.guard_symbolic_history_v1() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  -- A future audited privacy workflow may delete under a privileged local setting;
  -- no browser/service endpoint can enable it or claim that deletion is implemented.
  if tg_op='DELETE' and current_user in ('postgres','supabase_admin') and current_setting('app.symbolic_privacy_delete',true)='on' then return old; end if;
  raise exception 'symbolic_history_immutable';
end $$;
create trigger symbolic_birth_sources_immutable before update or delete on public.symbolic_birth_sources for each row execute function public.guard_symbolic_history_v1();
create trigger symbolic_lens_snapshots_immutable before update or delete on public.symbolic_lens_snapshots for each row execute function public.guard_symbolic_history_v1();

create function public.symbolic_keys_v1(v jsonb,keys text[]) returns boolean language sql immutable security invoker set search_path=public,pg_temp as $$
  select coalesce(jsonb_typeof(v)='object' and (v-keys)='{}'::jsonb and v ?& keys,false)
$$;
create function public.valid_symbolic_frame_v1(f jsonb) returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare c jsonb; d jsonb; s jsonb; i integer; k text; expected text[]:=array['initial_tendency','relationship_sensitivity','rhythm','symbolic_support_tension','observation_window']; rules text[]:=array['natal-group-max-v1','natal-relation-presence-v1','period-channel-match-v1','period-element-relation-v1','coarse-period-review-v1'];
begin
  if not public.symbolic_keys_v1(f,array['version','ruleVersion','sourceVersion','referencePeriod','classification','methodKind','causalUse','calculation','dimensions','limitations']) or
    f->>'version' is distinct from 'formal-symbolic-frame-v1' or f->>'ruleVersion' is distinct from 'symbolic-product-rules-v1' or
    f->>'classification' is distinct from 'symbolic_lens' or f->>'methodKind' is distinct from 'explicit_product_symbolic_rules' or f->'causalUse' is distinct from 'false'::jsonb or
    jsonb_typeof(f->'sourceVersion') is distinct from 'number' or (f->>'sourceVersion') !~ '^[1-9][0-9]{0,8}$' then return false; end if;
  s:=f->'referencePeriod';
  if not public.symbolic_keys_v1(s,array['key','referenceDate','structureKey','timezone','granularity']) or s->>'key' !~ '^20[0-9]{2}-[0-9]{2}$' or
    s->>'referenceDate' !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' or s->>'structureKey' !~ '^[a-z_]{5,100}$' or
    s->>'timezone' is distinct from 'Asia/Shanghai' or s->>'granularity' is distinct from 'month' then return false; end if;
  c:=f->'calculation';
  if not public.symbolic_keys_v1(c,array['calculationVersion','precision','inputUsed','usesSolarTermApproximation','usesTrueSolarTime','birthTimezoneCorrection','pillarsAvailable','natalDayElement','natalStrongestElement','periodYearElement','periodMonthElement','groupCounts']) or
    c->>'calculationVersion' is distinct from 'local-pillar-approximation-v1' or c->'usesSolarTermApproximation' is distinct from 'true'::jsonb or c->'usesTrueSolarTime' is distinct from 'false'::jsonb or c->'birthTimezoneCorrection' is distinct from 'false'::jsonb then return false; end if;
  if ((c->>'precision'='date_only' and c->'pillarsAvailable'='3'::jsonb and c->'inputUsed'='["birthDate"]'::jsonb) or
    (c->>'precision'='date_time_local' and c->'pillarsAvailable'='4'::jsonb and c->'inputUsed'='["birthDate","birthTime"]'::jsonb)) is not true then return false; end if;
  foreach k in array array['natalDayElement','natalStrongestElement','periodYearElement','periodMonthElement'] loop
    if c->>k not in ('wood','fire','earth','metal','water') or jsonb_typeof(c->k) is distinct from 'string' then return false; end if;
  end loop;
  if not public.symbolic_keys_v1(c->'groupCounts',array['peer','expression','resource','responsibility','support']) then return false; end if;
  foreach k in array array['peer','expression','resource','responsibility','support'] loop
    if jsonb_typeof(c->'groupCounts'->k) is distinct from 'number' then return false; end if;
    if (c->'groupCounts'->>k)::numeric < 0 or (c->'groupCounts'->>k)::numeric > 20 then return false; end if;
  end loop;
  if jsonb_typeof(f->'dimensions') is distinct from 'array' or jsonb_array_length(f->'dimensions')<>5 or jsonb_typeof(f->'limitations') is distinct from 'array' or jsonb_array_length(f->'limitations') not between 3 and 8 then return false; end if;
  for i in 0..4 loop
    d:=f->'dimensions'->i;
    if not public.symbolic_keys_v1(d,array['key','label','value','summary','ruleId','sourceRefs','limitations']) or d->>'key' is distinct from expected[i+1] or d->>'ruleId' is distinct from rules[i+1] or
      jsonb_typeof(d->'sourceRefs') is distinct from 'array' or jsonb_array_length(d->'sourceRefs') not between 1 and 3 or jsonb_typeof(d->'limitations') is distinct from 'array' or jsonb_array_length(d->'limitations') not between 1 and 5 then return false; end if;
    foreach k in array array['label','value','summary'] loop if jsonb_typeof(d->k) is distinct from 'string' then return false; end if; end loop;
    for s in select value from jsonb_array_elements(d->'sourceRefs') loop
      if jsonb_typeof(s) is distinct from 'string' or s#>>'{}' not in ('natal_stem_counts','natal_day_element','current_year_month','element_relation_table','calendar_period') then return false; end if;
    end loop;
    for s in select value from jsonb_array_elements(d->'limitations') loop if jsonb_typeof(s) is distinct from 'string' then return false; end if; end loop;
  end loop;
  for s in select value from jsonb_array_elements(f->'limitations') loop if jsonb_typeof(s) is distinct from 'string' then return false; end if; end loop;
  foreach k in array array['key','referenceDate','structureKey','timezone','granularity'] loop if jsonb_typeof(f->'referencePeriod'->k) is distinct from 'string' then return false; end if; end loop;
  -- Generated text cannot carry raw source dates, identifiers, addresses or controls.
  for s in select value from jsonb_path_query(f #- '{referencePeriod,referenceDate}', 'strict $.** ? (@.type() == "string")') loop
    k:=s#>>'{}';
    if length(k) not between 1 and 600 or k ~ '[[:cntrl:]@]' or k ~ '[0-9]{4}-[0-9]{2}-[0-9]{2}' or k ~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' then return false; end if;
  end loop;
  return true;
exception when others then return false;
end $$;

create function public.persist_symbolic_lens_v1(p_user_id uuid,p_expected_revision integer,p_idempotency_key uuid,p_operation text,p_source jsonb,p_frame jsonb,p_trace_id text)
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
  meta:=jsonb_build_object('operation',p_operation,'request_key',p_idempotency_key,'request_hash',h,'revision',new_rev,'source_version',src.source_version,'frame_version','formal-symbolic-frame-v1');
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

create function public.withdraw_symbolic_lens_v1(p_user_id uuid,p_expected_revision integer,p_idempotency_key uuid,p_trace_id text)
returns table(revision integer,storage_consent boolean,calculation_consent boolean,future_attachment_consent boolean,source_version integer,current_snapshot jsonb,updated_at timestamptz,idempotent boolean)
language plpgsql security invoker set search_path=public,extensions,pg_temp as $$
declare pref public.symbolic_lens_preferences%rowtype; receipt record; h text; meta jsonb;
begin
  if current_user<>'service_role' then raise exception 'symbolic_writer_required'; end if;
  if p_user_id is null or not exists(select 1 from auth.users u where u.id=p_user_id and u.deleted_at is null and (u.banned_until is null or u.banned_until<clock_timestamp()) and not coalesce(u.is_anonymous,false)) then raise exception 'symbolic_owner_invalid'; end if;
  if p_expected_revision is null or p_expected_revision<0 or p_idempotency_key is null or p_trace_id is null or p_trace_id !~ '^symbolic_lens_[0-9a-f-]{36}$' then raise exception 'invalid_symbolic_input'; end if;
  h:=encode(digest(convert_to(jsonb_build_object('operation','withdraw','revision',p_expected_revision)::text,'UTF8'),'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended('symbolic_lens_v1:'||p_user_id::text,0));
  select * into pref from public.symbolic_lens_preferences p where p.user_id=p_user_id for update;
  select e.metadata into receipt from public.consent_events e where e.user_id=p_user_id and e.consent_type='symbolic_calculation' and e.source='formal_symbolic_lens_v1' and e.metadata->>'request_key'=p_idempotency_key::text;
  if found then
    if receipt.metadata->>'request_hash' is distinct from h then raise exception 'symbolic_idempotency_conflict'; end if;
    return query select p.revision,p.storage_consent,p.calculation_consent,p.future_attachment_consent,p.source_version,s.frame,p.updated_at,true from public.symbolic_lens_preferences p left join public.symbolic_lens_snapshots s on s.id=p.current_snapshot_id and s.user_id=p.user_id where p.user_id=p_user_id; return;
  end if;
  if pref.user_id is null or pref.revision<>p_expected_revision then raise exception 'symbolic_revision_conflict'; end if;
  meta:=jsonb_build_object('operation','withdraw','request_key',p_idempotency_key,'revision',p_expected_revision+1,'source_version',pref.source_version);
  insert into public.consent_events(user_id,consent_type,status,source,metadata) values
    (p_user_id,'symbolic_storage','withdrawn','formal_symbolic_lens_v1',meta),
    (p_user_id,'symbolic_calculation','withdrawn','formal_symbolic_lens_v1',meta||jsonb_build_object('request_hash',h)),
    (p_user_id,'symbolic_future_attachment','withdrawn','formal_symbolic_lens_v1',meta);
  update public.symbolic_lens_preferences p set revision=p_expected_revision+1,current_snapshot_id=null,storage_consent=false,calculation_consent=false,future_attachment_consent=false,updated_at=clock_timestamp() where p.user_id=p_user_id;
  return query select p.revision,p.storage_consent,p.calculation_consent,p.future_attachment_consent,p.source_version,null::jsonb,p.updated_at,false from public.symbolic_lens_preferences p where p.user_id=p_user_id;
end $$;
revoke all on function public.symbolic_keys_v1(jsonb,text[]),public.valid_symbolic_frame_v1(jsonb),public.guard_symbolic_consent_v1(),public.guard_symbolic_history_v1(),public.persist_symbolic_lens_v1(uuid,integer,uuid,text,jsonb,jsonb,text),public.withdraw_symbolic_lens_v1(uuid,integer,uuid,text) from public,anon,authenticated;
grant execute on function public.symbolic_keys_v1(jsonb,text[]),public.valid_symbolic_frame_v1(jsonb),public.persist_symbolic_lens_v1(uuid,integer,uuid,text,jsonb,jsonb,text),public.withdraw_symbolic_lens_v1(uuid,integer,uuid,text) to service_role;
