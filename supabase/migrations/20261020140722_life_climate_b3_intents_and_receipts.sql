-- Authored forward candidate only. No database execution is claimed.
-- B1/B2 ledgers, hashes, functions, grants and historical records are untouched.
create function public.life_climate_b3_keys(v jsonb, keys text[]) returns boolean
language sql immutable security invoker set search_path = '' as $$
  select coalesce(jsonb_typeof(v) = 'object' and v ?& keys and (v - keys) = '{}'::jsonb, false)
$$;

-- Unicode codepoint key order matches the browser's explicit codepoint sort.
-- All source numbers pass the six-decimal precision gate before hashing.
create function public.life_climate_b3_canonical_json(v jsonb) returns text
language plpgsql immutable security invoker set search_path = '' as $$
declare result text; amount numeric;
begin
  if v is null then raise exception 'invalid_b3_request'; end if;
  if jsonb_typeof(v) = 'object' then
    select '{' || coalesce(string_agg(to_jsonb(k)::text || ':' || public.life_climate_b3_canonical_json(value), ',' order by k collate "C"), '') || '}'
      into result from jsonb_each(v) as item(k, value); return result;
  elsif jsonb_typeof(v) = 'array' then
    select '[' || coalesce(string_agg(public.life_climate_b3_canonical_json(value), ',' order by ord), '') || ']'
      into result from jsonb_array_elements(v) with ordinality as item(value, ord); return result;
  elsif jsonb_typeof(v) = 'number' then
    amount := v::text::numeric;
    if amount = 0 then return '0'; end if;
    if abs(amount) >= 0.000001 and abs(amount) < 1e21 then return trim_scale(amount)::text; end if;
    raise exception 'b3_unsupported_precision';
  end if;
  return v::text;
end $$;

create function public.life_climate_b3_hash(v jsonb) returns text
language sql immutable security invoker set search_path = '' as $$
  select encode(extensions.digest(convert_to(public.life_climate_b3_canonical_json(v), 'UTF8'), 'sha256'), 'hex')
$$;

create function public.life_climate_b3_exact_ids(actual jsonb, expected jsonb) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare a jsonb; b jsonb;
begin
  if jsonb_typeof(actual) is distinct from 'array' or jsonb_typeof(expected) is distinct from 'array' then return false; end if;
  if jsonb_array_length(actual) <> jsonb_array_length(expected)
    or exists(select 1 from jsonb_array_elements(actual) as item(value) where jsonb_typeof(value) is distinct from 'string')
    or (select count(distinct value) from jsonb_array_elements(actual) as item(value)) <> jsonb_array_length(actual) then return false; end if;
  select coalesce(jsonb_agg(value order by value::text collate "C"), '[]'::jsonb) into a from jsonb_array_elements(actual) as item(value);
  select coalesce(jsonb_agg(value order by value::text collate "C"), '[]'::jsonb) into b from jsonb_array_elements(expected) as item(value);
  return a = b;
end $$;

create table public.life_climate_b3_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_context_id uuid not null,
  idempotency_key uuid not null,
  created_at timestamptz not null,
  trace_id text not null check(length(trace_id) between 1 and 96),
  request_hash text not null check(request_hash ~ '^[a-f0-9]{64}$'),
  normalized_request jsonb not null,
  source_snapshot jsonb not null,
  -- Private inputs are never granted to authenticated readers or public DTOs.
  seed_safety jsonb not null,
  symbolic_input jsonb,
  unique(user_id, idempotency_key), unique(id, user_id),
  foreign key(seed_context_id, user_id) references public.seed_contexts(id, user_id),
  check ((jsonb_typeof(normalized_request) = 'object' and normalized_request->>'version' = 'life-climate-b3-v1') is true),
  check ((jsonb_typeof(source_snapshot) = 'object' and source_snapshot->>'version' = 'life-climate-b3-source-v1'
    and source_snapshot#>>'{binding,seedContextId}' = seed_context_id::text
    and source_snapshot->'symbolic' = 'null'::jsonb) is true),
  check (jsonb_typeof(seed_safety) = 'object')
);
create index life_climate_b3_intents_owner_created_idx on public.life_climate_b3_intents(user_id, created_at desc, id desc);
create index life_climate_b3_intents_seed_owner_idx on public.life_climate_b3_intents(seed_context_id, user_id);

create table public.life_climate_b3_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  intent_id uuid not null unique,
  created_at timestamptz not null default clock_timestamp(),
  status text not null check(status in ('completed','rejected')),
  error_code text,
  result_bundle jsonb,
  foreign key(intent_id, user_id) references public.life_climate_b3_intents(id, user_id),
  check (((status = 'completed' and error_code is null and jsonb_typeof(result_bundle) = 'object')
      or (status = 'rejected' and error_code in ('safety_downgrade','invalid_b3_request','invalid_b3_source','b3_confirmation_mismatch','b3_arithmetic_limit','b3_unsupported_precision','b3_symbolic_source_unavailable') and result_bundle is null)) is true)
);
create index life_climate_b3_receipts_owner_created_idx on public.life_climate_b3_receipts(user_id, created_at desc, id desc);
create index life_climate_b3_receipts_intent_owner_idx on public.life_climate_b3_receipts(intent_id, user_id);

alter table public.life_climate_b3_intents enable row level security;
alter table public.life_climate_b3_receipts enable row level security;
revoke all on public.life_climate_b3_intents, public.life_climate_b3_receipts from public, anon, authenticated, service_role;
grant select(id,user_id,idempotency_key,created_at,normalized_request,source_snapshot) on public.life_climate_b3_intents to authenticated;
grant select(id,user_id,intent_id,created_at,status,error_code,result_bundle) on public.life_climate_b3_receipts to authenticated;
grant select,insert on public.life_climate_b3_intents,public.life_climate_b3_receipts to service_role;
create policy life_climate_b3_intents_owner_read on public.life_climate_b3_intents for select to authenticated using ((select auth.uid()) = user_id);
create policy life_climate_b3_receipts_owner_read on public.life_climate_b3_receipts for select to authenticated using ((select auth.uid()) = user_id);

create function public.life_climate_b3_immutable() returns trigger language plpgsql security invoker set search_path = '' as $$
begin raise exception 'life_climate_b3_history_immutable'; end $$;
create trigger life_climate_b3_intents_immutable before update or delete on public.life_climate_b3_intents for each row execute function public.life_climate_b3_immutable();
create trigger life_climate_b3_receipts_immutable before update or delete on public.life_climate_b3_receipts for each row execute function public.life_climate_b3_immutable();

create function public.life_climate_b3_require_owner(p_user_id uuid) returns void
language plpgsql volatile security invoker set search_path = '' as $$
begin
  if current_user <> 'service_role' or p_user_id is null or not exists (
    select 1 from auth.users u where u.id=p_user_id and u.deleted_at is null and not coalesce(u.is_anonymous,false)
      and (u.banned_until is null or u.banned_until < clock_timestamp())
  ) then raise exception using errcode='42501', message='unauthenticated'; end if;
end $$;

-- Internal raw source is service-only. No birthday is returned by a browser API.
create function public.life_climate_b3_source_internal(p_user_id uuid,p_include_symbolic boolean) returns jsonb
language plpgsql volatile security invoker set search_path = '' as $$
declare seed record; profile public.reality_profiles%rowtype; frozen_profile jsonb; view_json jsonb;
  source_json jsonb; safety_json jsonb; at_time timestamptz; lens jsonb; symbolic_json jsonb := null;
  resource jsonb; field_name text; quantity numeric;
begin
  perform public.life_climate_b3_require_owner(p_user_id);
  perform pg_advisory_xact_lock(hashtextextended('seed-context-submission:' || p_user_id::text,0));
  perform pg_advisory_xact_lock(hashtextextended('symbolic_lens_v1:' || p_user_id::text,0));
  select s.id,s.user_question,s.raw_context,s.decision_options,s.forbidden_actions,s.desired_output,s.safety_flags into seed
    from public.seed_contexts s where s.user_id=p_user_id and s.status='submitted' and s.submitted_at is not null and s.frozen_at is not null
    order by s.submitted_at desc,s.id desc limit 1;
  if not found then raise exception 'current_seed_required'; end if;
  -- Uses existing service-role privileges. No extra source-table writer grant.
  select p.* into profile from public.reality_profiles p where p.user_id=p_user_id and p.seed_context_id=seed.id for update;
  if not found then raise exception 'reality_profile_required'; end if;
  at_time := clock_timestamp();
  frozen_profile := jsonb_build_object(
    'lifeClimate',jsonb_build_object('value',coalesce(profile.life_climate_value,''),'classification',profile.life_climate_classification,'evidenceSummary',coalesce(profile.life_climate_evidence_summary,'明确未知')),
    'resources',jsonb_build_object('value',coalesce(profile.resources_value,''),'classification',profile.resources_classification,'evidenceSummary',coalesce(profile.resources_evidence_summary,'明确未知')),
    'constraints',jsonb_build_object('value',coalesce(profile.constraints_value,''),'classification',profile.constraints_classification,'evidenceSummary',coalesce(profile.constraints_evidence_summary,'明确未知')),
    'goals',profile.life_goals,'values',profile.core_values,'lifeThemes',profile.life_themes,'pressures',profile.pressures,'externalVariables',profile.external_variables,
    'lifeModelDomains',profile.life_model_domains,'worldInputs',profile.world_model_inputs,'revision',profile.revision
  );
  for resource in select value from jsonb_array_elements(profile.world_model_inputs->'resources') as item(value) loop
    foreach field_name in array array['available','minimum','maximum','usePerTick'] loop
      if resource->field_name = 'null'::jsonb and field_name='usePerTick' then continue; end if;
      if jsonb_typeof(resource->field_name) is distinct from 'number' then raise exception 'invalid_b3_source'; end if;
      quantity := (resource->>field_name)::numeric;
      if quantity < 0 or quantity > 1000000 or quantity * 1000000 <> trunc(quantity * 1000000) then raise exception 'b3_unsupported_precision'; end if;
    end loop;
  end loop;
  view_json := jsonb_build_object('version','life-climate-b3-source-view-v1',
    'scopeKey',encode(extensions.digest(convert_to(seed.id::text,'UTF8'),'sha256'),'hex'),'profile',frozen_profile);
  source_json := jsonb_build_object('version','life-climate-b3-source-v1','view',view_json,'sourceContext',public.life_climate_b3_hash(view_json),
    'binding',jsonb_build_object('seedContextId',seed.id,'profileRevision',profile.revision,'assessedAt',to_char(at_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),'symbolic',null);
  safety_json := jsonb_build_object('user_question',seed.user_question,'raw_context',seed.raw_context,'decision_options',seed.decision_options,
    'forbidden_actions',seed.forbidden_actions,'desired_output',seed.desired_output,'safety_flags',seed.safety_flags);
  if p_include_symbolic then
    begin
      lens := public.freeze_symbolic_run_lens_v1(p_user_id,at_time);
    exception when others then
      if sqlerrm not in ('symbolic_source_invalid','symbolic_consent_required','invalid_symbolic_input') then raise; end if;
      lens := jsonb_build_object('status','unavailable');
    end;
  end if;
  if p_include_symbolic and lens->>'status' = 'attached' then
    select jsonb_build_object('birthDate',b.birth_date::text,'birthTime',b.birth_time,'sourceVersion',b.source_version,
      'consentRevision',(lens->>'preferenceRevision')::integer,'referenceDate',(at_time at time zone 'Asia/Shanghai')::date::text)
      into symbolic_json from public.symbolic_birth_sources b where b.user_id=p_user_id and b.id=(lens#>>'{provenance,sourceId}')::uuid
        and b.source_version=(lens#>>'{provenance,sourceVersion}')::integer;
    if symbolic_json is null then raise exception 'invalid_b3_source'; end if;
  end if;
  return jsonb_build_object('source_snapshot',source_json,'seed_safety',safety_json,'symbolic_input',symbolic_json);
end $$;

create function public.read_life_climate_b3_source(p_user_id uuid) returns jsonb
language plpgsql volatile security invoker set search_path = '' as $$
begin return public.life_climate_b3_source_internal(p_user_id,true) - 'seed_safety'; end $$;

create function public.life_climate_b3_request_valid(r jsonb) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare model jsonb; confirmation jsonb; path jsonb; rule jsonb; paths jsonb; rules jsonb; assumptions jsonb;
begin
  if not public.life_climate_b3_keys(r,array['version','horizon','periodUnit','profileRevision','sourceContext','model','confirmation','symbolic'])
    or r->>'version' is distinct from 'life-climate-b3-v1'
    or coalesce(r->>'horizon','') not in ('1_year','3_years','5_years')
    or jsonb_typeof(r->'profileRevision') is distinct from 'number' or coalesce(r->>'profileRevision','') !~ '^[0-9]{1,9}$'
    or jsonb_typeof(r->'sourceContext') is distinct from 'string' or coalesce(r->>'sourceContext','') !~ '^[a-f0-9]{64}$'
    or r->>'periodUnit' is distinct from case when r->>'horizon'='1_year' then 'quarter' else 'year' end then return false; end if;
  model:=r->'model'; confirmation:=r->'confirmation';
  if not public.life_climate_b3_keys(model,array['resources','assumptions','constraintBindings','commonRules','alternatives'])
    or not public.life_climate_b3_keys(confirmation,array['context','assumptionIds','ruleIds','pathIds','reviewedSource'])
    or confirmation->'reviewedSource' is distinct from 'true'::jsonb or confirmation->>'context' is distinct from public.life_climate_b3_hash(r-'confirmation')
    or jsonb_typeof(model->'resources') is distinct from 'array' or jsonb_typeof(model->'assumptions') is distinct from 'array'
    or jsonb_typeof(model->'constraintBindings') is distinct from 'array' or jsonb_typeof(model->'commonRules') is distinct from 'array'
    or jsonb_typeof(model->'alternatives') is distinct from 'array' then return false; end if;
  if jsonb_array_length(model->'resources')>8 or jsonb_array_length(model->'assumptions')>96 or jsonb_array_length(model->'constraintBindings')>8
    or jsonb_array_length(model->'commonRules')>16 or jsonb_array_length(model->'alternatives') not between 2 and 3 then return false; end if;
  paths := '["baseline"]'::jsonb; rules := '[]'::jsonb; assumptions:='[]'::jsonb;
  for path in select value from jsonb_array_elements(model->'alternatives') as item(value) loop
    if not public.life_climate_b3_keys(path,array['id','label','rules']) or coalesce(path->>'id','') !~ '^[a-z][a-z0-9-]{0,39}$'
      or path->>'id'='baseline' or jsonb_typeof(path->'rules') is distinct from 'array' then return false; end if;
    if jsonb_array_length(path->'rules')>24 then return false; end if;
    paths:=paths||jsonb_build_array(path->'id');
    for rule in select value from jsonb_array_elements(path->'rules') as item(value) loop rules:=rules||jsonb_build_array(rule->'id'); end loop;
  end loop;
  for rule in select value from jsonb_array_elements(model->'commonRules') as item(value) loop rules:=rules||jsonb_build_array(rule->'id'); end loop;
  for rule in select value from jsonb_array_elements(model->'assumptions') as item(value) loop assumptions:=assumptions||jsonb_build_array(rule->'id'); end loop;
  if not public.life_climate_b3_exact_ids(confirmation->'pathIds',paths)
    or not public.life_climate_b3_exact_ids(confirmation->'ruleIds',rules)
    or not public.life_climate_b3_exact_ids(confirmation->'assumptionIds',assumptions) then return false; end if;
  if r#>'{symbolic,enabled}'='false'::jsonb then return public.life_climate_b3_keys(r->'symbolic',array['enabled']); end if;
  return public.life_climate_b3_keys(r->'symbolic',array['enabled','sourceContext']) and r#>'{symbolic,enabled}'='true'::jsonb
    and jsonb_typeof(r#>'{symbolic,sourceContext}')='string' and r#>>'{symbolic,sourceContext}'~'^[a-f0-9]{64}$';
exception when others then return false;
end $$;

create function public.life_climate_b3_intent_json(i public.life_climate_b3_intents) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('id',i.id,'idempotency_key',i.idempotency_key,'created_at',i.created_at,'normalized_request',i.normalized_request,
    'source_snapshot',i.source_snapshot,'seed_safety',i.seed_safety,'symbolic_input',i.symbolic_input)
$$;
create function public.life_climate_b3_receipt_json(r public.life_climate_b3_receipts) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('id',r.id,'intent_id',r.intent_id,'created_at',r.created_at,'status',r.status,'error_code',r.error_code,'result_bundle',r.result_bundle)
$$;

create function public.reserve_life_climate_b3_intent(p_user_id uuid,p_idempotency_key uuid,p_request jsonb,p_trace_id text) returns jsonb
language plpgsql volatile security invoker set search_path = '' as $$
declare saved public.life_climate_b3_intents%rowtype; receipt public.life_climate_b3_receipts%rowtype; raw jsonb; source jsonb; constraints_expected jsonb; constraints_given jsonb;
begin
  perform public.life_climate_b3_require_owner(p_user_id);
  if p_idempotency_key is null or p_trace_id is null or length(p_trace_id) not between 1 and 96 or p_request is null then raise exception 'invalid_b3_request'; end if;
  perform pg_advisory_xact_lock(hashtextextended('seed-context-submission:'||p_user_id::text,0));
  perform pg_advisory_xact_lock(hashtextextended('life-climate-b3:'||p_user_id::text||':'||p_idempotency_key::text,0));
  -- Exact original body wins before current Seed, Profile, consent, precision or clock reads.
  select i.* into saved from public.life_climate_b3_intents i where i.user_id=p_user_id and i.idempotency_key=p_idempotency_key;
  if found then
    if saved.normalized_request is distinct from p_request or saved.request_hash is distinct from public.life_climate_b3_hash(p_request) then raise exception 'idempotency_conflict'; end if;
    select r.* into receipt from public.life_climate_b3_receipts r where r.user_id=p_user_id and r.intent_id=saved.id;
    return jsonb_build_object('intent',public.life_climate_b3_intent_json(saved),'receipt',case when receipt.id is null then null else public.life_climate_b3_receipt_json(receipt) end,'idempotent',true);
  end if;
  if public.life_climate_b3_request_valid(p_request) is distinct from true then raise exception 'invalid_b3_request'; end if;
  raw:=public.life_climate_b3_source_internal(p_user_id,p_request#>'{symbolic,enabled}'='true'::jsonb); source:=raw->'source_snapshot';
  if source->>'sourceContext' is distinct from p_request->>'sourceContext' or source#>'{binding,profileRevision}' is distinct from p_request->'profileRevision' then raise exception 'b3_source_stale'; end if;
  select coalesce(jsonb_agg(value->'key'),'[]'::jsonb) into constraints_expected from jsonb_array_elements(source#>'{view,profile,worldInputs,constraints}') as item(value);
  select coalesce(jsonb_agg(value->'constraintKey'),'[]'::jsonb) into constraints_given from jsonb_array_elements(p_request#>'{model,constraintBindings}') as item(value);
  if public.life_climate_b3_exact_ids(constraints_given,constraints_expected) is distinct from true then raise exception 'invalid_b3_request'; end if;
  if p_request#>'{symbolic,enabled}'='true'::jsonb and raw->'symbolic_input'='null'::jsonb then raise exception 'b3_symbolic_source_unavailable'; end if;
  insert into public.life_climate_b3_intents(user_id,seed_context_id,idempotency_key,created_at,trace_id,request_hash,normalized_request,source_snapshot,seed_safety,symbolic_input)
    values(p_user_id,(source#>>'{binding,seedContextId}')::uuid,p_idempotency_key,(source#>>'{binding,assessedAt}')::timestamptz,p_trace_id,
      public.life_climate_b3_hash(p_request),p_request,source,raw->'seed_safety',nullif(raw->'symbolic_input','null'::jsonb)) returning * into saved;
  return jsonb_build_object('intent',public.life_climate_b3_intent_json(saved),'receipt',null,'idempotent',false);
end $$;

-- SQL enforces immutable source/request and Event->Claim->Report binding. The
-- trusted server additionally recomputes the complete deterministic B3 engine.
create function public.life_climate_b3_source_ref_valid(source jsonb,ref text) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare parts text[]:=string_to_array(ref,'.'); profile jsonb:=source#>'{view,profile}';
begin
  if ref in ('lifeClimate','resources','constraints') then return jsonb_typeof(profile->ref)='object'; end if;
  if ref ~ '^(goals|values|lifeThemes|pressures|externalVariables)\.[1-8]$' then
    return jsonb_typeof(profile#>array[parts[1],((parts[2])::integer-1)::text])='object'; end if;
  if ref ~ '^lifeModelDomains\.(identity|career|wealth|relationships|environment|lifeStage)\.[1-8]$' then
    return jsonb_typeof(profile#>array['lifeModelDomains',parts[2],((parts[3])::integer-1)::text])='object'; end if;
  if ref ~ '^worldInputs\.(resources|constraints)\.[a-z][a-z0-9-]{0,39}$' then
    return exists(select 1 from jsonb_array_elements(profile#>array['worldInputs',parts[2]]) as item(value) where value->>'key'=parts[3]); end if;
  return false;
exception when others then return false;
end $$;

create function public.life_climate_b3_bundle_valid(source jsonb,request jsonb,bundle jsonb) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare event jsonb; claim jsonb; ref jsonb; path_ids jsonb; event_ids jsonb; claim_ids jsonb; path jsonb; n integer; declared_rule jsonb; stage_item jsonb; stage_number integer;
begin
  if not public.life_climate_b3_keys(bundle,array['version','horizon','periodUnit','profileRevision','sourceContext','sourceSnapshot','requestSnapshot','paths','events','claims','comparisons','report','symbolicAttachment']) then return false; end if;
  if bundle->'requestSnapshot' is distinct from request or bundle->>'version' is distinct from 'life-climate-b3-v1'
    or bundle->'horizon' is distinct from request->'horizon' or bundle->'periodUnit' is distinct from request->'periodUnit'
    or bundle->'profileRevision' is distinct from request->'profileRevision' or bundle->'sourceContext' is distinct from request->'sourceContext'
    or not public.life_climate_b3_keys(bundle->'sourceSnapshot',array['version','view','sourceContext','binding','symbolic'])
    or (bundle->'sourceSnapshot'-'symbolic') is distinct from (source-'symbolic') then return false; end if;
  if request#>'{symbolic,enabled}'='false'::jsonb then
    if bundle#>'{sourceSnapshot,symbolic}' is distinct from 'null'::jsonb or bundle->'symbolicAttachment' is distinct from 'null'::jsonb then return false; end if;
  else
    if bundle#>'{sourceSnapshot,symbolic}' is distinct from bundle->'symbolicAttachment'
      or bundle#>>'{symbolicAttachment,sourceContext}' is distinct from request#>>'{symbolic,sourceContext}'
      or bundle#>>'{symbolicAttachment,sourceContext}' is distinct from public.life_climate_b3_hash(bundle->'symbolicAttachment'-'sourceContext') then return false; end if;
  end if;
  if jsonb_typeof(bundle->'paths') is distinct from 'array' or jsonb_typeof(bundle->'events') is distinct from 'array'
    or jsonb_typeof(bundle->'claims') is distinct from 'array' or jsonb_typeof(bundle->'comparisons') is distinct from 'array' then return false; end if;
  if jsonb_array_length(bundle->'paths') not between 3 and 4 or jsonb_array_length(bundle->'events')>768 or jsonb_array_length(bundle->'claims')>768 then return false; end if;
  n:=case request->>'horizon' when '1_year' then 4 when '3_years' then 3 when '5_years' then 5 end;
  path_ids:='[]'::jsonb; event_ids:='[]'::jsonb; claim_ids:='[]'::jsonb;
  for path in select value from jsonb_array_elements(bundle->'paths') as item(value) loop
    if not public.life_climate_b3_keys(path,array['id','label','basis','stages']) or jsonb_typeof(path->'stages') is distinct from 'array' then return false; end if;
    if jsonb_array_length(path->'stages')<>n then return false; end if;
    stage_number:=0;
    for stage_item in select value from jsonb_array_elements(path->'stages') as item(value) loop
      stage_number:=stage_number+1;
      if not public.life_climate_b3_keys(stage_item,array['stageIndex','label','lifeModelDomains','contextStates','constraints','obligations','resources','investments','transitions'])
        or stage_item->'stageIndex' is distinct from to_jsonb(stage_number) then return false; end if;
    end loop;
    path_ids:=path_ids||jsonb_build_array(path->'id');
  end loop;
  if path_ids->>0 is distinct from 'baseline' or public.life_climate_b3_exact_ids(path_ids,request#>'{confirmation,pathIds}') is distinct from true then return false; end if;
  for event in select value from jsonb_array_elements(bundle->'events') as item(value) loop
    if not public.life_climate_b3_keys(event,array['id','kind','pathId','stageIndex','sequence','ruleId','summary','sourceRefs','assumptionRefs','before','after','causalEventIds'])
      or coalesce(event->>'id','') !~ '^[a-f0-9]{64}$' or not (path_ids @> jsonb_build_array(event->'pathId'))
      or jsonb_typeof(event->'causalEventIds') is distinct from 'array' or jsonb_typeof(event->'sourceRefs') is distinct from 'array'
      or jsonb_typeof(event->'assumptionRefs') is distinct from 'array'
      or jsonb_typeof(event->'stageIndex') is distinct from 'number' or coalesce(event->>'stageIndex','') !~ '^[1-5]$'
      or jsonb_typeof(event->'sequence') is distinct from 'number' or coalesce(event->>'sequence','') !~ '^[1-9][0-9]{0,2}$' then return false; end if;
    if (event->>'stageIndex')::integer>n or (event->>'sequence')::integer>768 then return false; end if;
    select value into declared_rule from (
      select value from jsonb_array_elements(request#>'{model,commonRules}') as rule(value)
      union all select rule.value from jsonb_array_elements(request#>'{model,alternatives}') as candidate(value)
        cross join lateral jsonb_array_elements(candidate.value->'rules') as rule(value) where candidate.value->'id'=event->'pathId'
    ) as candidates where value->'id'=event->'ruleId';
    if declared_rule is null or not (declared_rule->'stages' @> jsonb_build_array(event->'stageIndex'))
      or not (event->'assumptionRefs' @> declared_rule->'assumptionRefs')
      or not (event->'sourceRefs' @> declared_rule->'sourceRefs') then return false; end if;
    for ref in select value from jsonb_array_elements(event->'sourceRefs') as item(value) loop
      if public.life_climate_b3_source_ref_valid(source,ref#>>'{}') is distinct from true then return false; end if;
    end loop;
    for ref in select value from jsonb_array_elements(event->'assumptionRefs') as item(value) loop
      if not exists(select 1 from jsonb_array_elements(request#>'{model,assumptions}') as declared(value) where value->'id'=ref) then return false; end if;
    end loop;
    for ref in select value from jsonb_array_elements(event->'causalEventIds') as item(value) loop
      if not (event_ids @> jsonb_build_array(ref)) or not exists (
        select 1 from jsonb_array_elements(bundle->'events') as prior(value)
        where value->'id'=ref and value->'pathId'=event->'pathId'
          and (value->>'stageIndex')::integer <= (event->>'stageIndex')::integer
          and (value->>'sequence')::integer < (event->>'sequence')::integer
      ) then return false; end if;
    end loop;
    event_ids:=event_ids||jsonb_build_array(event->'id');
  end loop;
  if (select count(distinct value) from jsonb_array_elements(event_ids) as item(value))<>jsonb_array_length(event_ids) then return false; end if;
  for claim in select value from jsonb_array_elements(bundle->'claims') as item(value) loop
    if not public.life_climate_b3_keys(claim,array['id','type','pathId','summary','uncertainty','evidenceEventIds','sourceRefs','assumptionRefs'])
      or coalesce(claim->>'id','') !~ '^[a-f0-9]{64}$' or not (path_ids @> jsonb_build_array(claim->'pathId'))
      or jsonb_typeof(claim->'evidenceEventIds') is distinct from 'array' then return false; end if;
    if jsonb_array_length(claim->'evidenceEventIds')=0 then return false; end if;
    for ref in select value from jsonb_array_elements(claim->'evidenceEventIds') as item(value) loop
      if not exists(select 1 from jsonb_array_elements(bundle->'events') as item(value) where value->'id'=ref and value->'pathId'=claim->'pathId'
        and value->'sourceRefs'=claim->'sourceRefs' and value->'assumptionRefs'=claim->'assumptionRefs') then return false; end if;
    end loop;
    claim_ids:=claim_ids||jsonb_build_array(claim->'id');
  end loop;
  if not public.life_climate_b3_keys(bundle->'report',array['mode','headline','summary','limitations','claimIds','includesExactDates','claimsUseEventEvidence'])
    or bundle#>>'{report,mode}' is distinct from 'conditional_long_horizon_structure'
    or bundle#>'{report,includesExactDates}' is distinct from 'false'::jsonb
    or bundle#>'{report,claimsUseEventEvidence}' is distinct from 'true'::jsonb then return false; end if;
  return public.life_climate_b3_exact_ids(bundle#>'{report,claimIds}',claim_ids);
exception when others then return false;
end $$;

create function public.finalize_life_climate_b3_receipt(p_user_id uuid,p_idempotency_key uuid,p_request jsonb,p_result_bundle jsonb,p_error_code text) returns jsonb
language plpgsql volatile security invoker set search_path = '' as $$
declare saved public.life_climate_b3_intents%rowtype; receipt public.life_climate_b3_receipts%rowtype;
begin
  perform public.life_climate_b3_require_owner(p_user_id);
  if p_idempotency_key is null or p_request is null then raise exception 'invalid_b3_request'; end if;
  perform pg_advisory_xact_lock(hashtextextended('life-climate-b3:'||p_user_id::text||':'||p_idempotency_key::text,0));
  select i.* into saved from public.life_climate_b3_intents i where i.user_id=p_user_id and i.idempotency_key=p_idempotency_key;
  if not found then raise exception 'invalid_b3_request'; end if;
  if saved.normalized_request is distinct from p_request or saved.request_hash is distinct from public.life_climate_b3_hash(p_request) then raise exception 'idempotency_conflict'; end if;
  select r.* into receipt from public.life_climate_b3_receipts r where r.user_id=p_user_id and r.intent_id=saved.id;
  if found then return jsonb_build_object('receipt',public.life_climate_b3_receipt_json(receipt),'idempotent',true); end if;
  if p_error_code is not null then
    if p_error_code not in ('safety_downgrade','invalid_b3_request','invalid_b3_source','b3_confirmation_mismatch','b3_arithmetic_limit','b3_unsupported_precision','b3_symbolic_source_unavailable') or p_result_bundle is not null then raise exception 'invalid_b3_request'; end if;
  elsif public.life_climate_b3_bundle_valid(saved.source_snapshot,saved.normalized_request,p_result_bundle) is distinct from true then raise exception 'invalid_run_bundle'; end if;
  insert into public.life_climate_b3_receipts(user_id,intent_id,status,error_code,result_bundle)
    values(p_user_id,saved.id,case when p_error_code is null then 'completed' else 'rejected' end,p_error_code,p_result_bundle) returning * into receipt;
  return jsonb_build_object('receipt',public.life_climate_b3_receipt_json(receipt),'idempotent',false);
end $$;

-- Narrow grants on B3 objects only; no privilege changes to existing ledgers.
revoke all on function public.life_climate_b3_keys(jsonb,text[]),public.life_climate_b3_canonical_json(jsonb),public.life_climate_b3_hash(jsonb),public.life_climate_b3_exact_ids(jsonb,jsonb),
  public.life_climate_b3_immutable(),public.life_climate_b3_require_owner(uuid),public.life_climate_b3_source_internal(uuid,boolean),public.read_life_climate_b3_source(uuid),
  public.life_climate_b3_request_valid(jsonb),public.life_climate_b3_intent_json(public.life_climate_b3_intents),public.life_climate_b3_receipt_json(public.life_climate_b3_receipts),
  public.reserve_life_climate_b3_intent(uuid,uuid,jsonb,text),public.life_climate_b3_source_ref_valid(jsonb,text),public.life_climate_b3_bundle_valid(jsonb,jsonb,jsonb),public.finalize_life_climate_b3_receipt(uuid,uuid,jsonb,jsonb,text)
  from public,anon,authenticated,service_role;
grant execute on function public.life_climate_b3_keys(jsonb,text[]),public.life_climate_b3_canonical_json(jsonb),public.life_climate_b3_hash(jsonb),public.life_climate_b3_exact_ids(jsonb,jsonb),
  public.life_climate_b3_immutable(),public.life_climate_b3_require_owner(uuid),public.life_climate_b3_source_internal(uuid,boolean),public.read_life_climate_b3_source(uuid),
  public.life_climate_b3_request_valid(jsonb),public.life_climate_b3_intent_json(public.life_climate_b3_intents),public.life_climate_b3_receipt_json(public.life_climate_b3_receipts),
  public.reserve_life_climate_b3_intent(uuid,uuid,jsonb,text),public.life_climate_b3_source_ref_valid(jsonb,text),public.life_climate_b3_bundle_valid(jsonb,jsonb,jsonb),public.finalize_life_climate_b3_receipt(uuid,uuid,jsonb,jsonb,text)
  to service_role;
