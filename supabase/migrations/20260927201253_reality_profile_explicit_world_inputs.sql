create or replace function public.is_valid_reality_profile_world_inputs(profile_inputs jsonb)
returns boolean
language plpgsql
immutable
parallel safe
set search_path = ''
as $function$
declare
  resource_input jsonb;
  constraint_input jsonb;
  rule_input jsonb;
  resource_key text;
  constraint_key text;
  seen_resource_keys text[] := array[]::text[];
  seen_constraint_keys text[] := array[]::text[];
  available_value numeric;
  minimum_value numeric;
  maximum_value numeric;
  use_per_tick_value numeric;
begin
  if profile_inputs is null
     or pg_catalog.jsonb_typeof(profile_inputs) is distinct from 'object'
     or (profile_inputs - array['version', 'resources', 'constraints']::text[]) <> '{}'::jsonb
     or profile_inputs -> 'version' is distinct from '1'::jsonb
     or pg_catalog.jsonb_typeof(profile_inputs -> 'resources') is distinct from 'array'
     or pg_catalog.jsonb_typeof(profile_inputs -> 'constraints') is distinct from 'array' then
    return false;
  end if;
  if pg_catalog.jsonb_array_length(profile_inputs -> 'resources') > 8
     or pg_catalog.jsonb_array_length(profile_inputs -> 'constraints') > 8 then
    return false;
  end if;

  for resource_input in select value from pg_catalog.jsonb_array_elements(profile_inputs -> 'resources') as item(value) loop
    if pg_catalog.jsonb_typeof(resource_input) is distinct from 'object'
       or (resource_input - array['key', 'label', 'resourceType', 'available', 'unit', 'minimum', 'maximum', 'usePerTick', 'classification', 'evidenceSummary']::text[]) <> '{}'::jsonb
       or pg_catalog.jsonb_typeof(resource_input -> 'key') is distinct from 'string'
       or pg_catalog.jsonb_typeof(resource_input -> 'label') is distinct from 'string'
       or pg_catalog.jsonb_typeof(resource_input -> 'resourceType') is distinct from 'string'
       or pg_catalog.jsonb_typeof(resource_input -> 'available') is distinct from 'number'
       or pg_catalog.jsonb_typeof(resource_input -> 'unit') is distinct from 'string'
       or pg_catalog.jsonb_typeof(resource_input -> 'minimum') is distinct from 'number'
       or pg_catalog.jsonb_typeof(resource_input -> 'maximum') is distinct from 'number'
       or pg_catalog.jsonb_typeof(resource_input -> 'classification') is distinct from 'string'
       or pg_catalog.jsonb_typeof(resource_input -> 'evidenceSummary') is distinct from 'string' then
      return false;
    end if;

    resource_key := resource_input ->> 'key';
    if resource_key !~ '^[a-z][a-z0-9-]{0,39}$' or resource_key = any(seen_resource_keys) then
      return false;
    end if;
    seen_resource_keys := pg_catalog.array_append(seen_resource_keys, resource_key);

    if resource_input ->> 'resourceType' not in ('time', 'budget', 'position_availability', 'information')
       or resource_input ->> 'classification' not in ('fact', 'assumption')
       or pg_catalog.char_length(resource_input ->> 'label') > 80
       or not public.is_safe_reality_profile_text(resource_input ->> 'label', 160)
       or (resource_input ->> 'label') <> pg_catalog.btrim(resource_input ->> 'label', U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
       or pg_catalog.char_length(resource_input ->> 'unit') > 32
       or not public.is_safe_reality_profile_text(resource_input ->> 'unit', 160)
       or (resource_input ->> 'unit') <> pg_catalog.btrim(resource_input ->> 'unit', U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
       or not public.is_safe_reality_profile_text(resource_input ->> 'evidenceSummary', 160)
       or (resource_input ->> 'evidenceSummary') <> pg_catalog.btrim(resource_input ->> 'evidenceSummary', U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF') then
      return false;
    end if;

    begin
      available_value := (resource_input ->> 'available')::numeric;
      minimum_value := (resource_input ->> 'minimum')::numeric;
      maximum_value := (resource_input ->> 'maximum')::numeric;
    exception when others then
      return false;
    end;
    if available_value not between 0 and 1000000
       or minimum_value not between 0 and 1000000
       or maximum_value not between 0 and 1000000
       or minimum_value > available_value
       or available_value > maximum_value then
      return false;
    end if;

    if pg_catalog.jsonb_typeof(resource_input -> 'usePerTick') = 'null' then
      null;
    elsif pg_catalog.jsonb_typeof(resource_input -> 'usePerTick') = 'number' then
      begin
        use_per_tick_value := (resource_input ->> 'usePerTick')::numeric;
      exception when others then
        return false;
      end;
      if use_per_tick_value <= 0
         or use_per_tick_value > 1000000
         or use_per_tick_value > available_value - minimum_value then
        return false;
      end if;
    else
      return false;
    end if;
  end loop;

  for constraint_input in select value from pg_catalog.jsonb_array_elements(profile_inputs -> 'constraints') as item(value) loop
    if pg_catalog.jsonb_typeof(constraint_input) is distinct from 'object'
       or (constraint_input - array['key', 'label', 'resourceKey', 'rule', 'classification', 'evidenceSummary']::text[]) <> '{}'::jsonb
       or pg_catalog.jsonb_typeof(constraint_input -> 'key') is distinct from 'string'
       or pg_catalog.jsonb_typeof(constraint_input -> 'label') is distinct from 'string'
       or pg_catalog.jsonb_typeof(constraint_input -> 'resourceKey') is distinct from 'string'
       or pg_catalog.jsonb_typeof(constraint_input -> 'rule') is distinct from 'object'
       or pg_catalog.jsonb_typeof(constraint_input -> 'classification') is distinct from 'string'
       or pg_catalog.jsonb_typeof(constraint_input -> 'evidenceSummary') is distinct from 'string' then
      return false;
    end if;

    constraint_key := constraint_input ->> 'key';
    if constraint_key !~ '^[a-z][a-z0-9-]{0,39}$' or constraint_key = any(seen_constraint_keys) then
      return false;
    end if;
    seen_constraint_keys := pg_catalog.array_append(seen_constraint_keys, constraint_key);

    if not (constraint_input ->> 'resourceKey' = any(seen_resource_keys))
       or constraint_input ->> 'classification' not in ('fact', 'assumption')
       or pg_catalog.char_length(constraint_input ->> 'label') > 80
       or not public.is_safe_reality_profile_text(constraint_input ->> 'label', 160)
       or (constraint_input ->> 'label') <> pg_catalog.btrim(constraint_input ->> 'label', U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
       or not public.is_safe_reality_profile_text(constraint_input ->> 'evidenceSummary', 160)
       or (constraint_input ->> 'evidenceSummary') <> pg_catalog.btrim(constraint_input ->> 'evidenceSummary', U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF') then
      return false;
    end if;

    rule_input := constraint_input -> 'rule';
    if (rule_input - array['kind', 'value']::text[]) <> '{}'::jsonb
       or pg_catalog.jsonb_typeof(rule_input -> 'kind') is distinct from 'string'
       or rule_input ->> 'kind' <> 'before_time'
       or pg_catalog.jsonb_typeof(rule_input -> 'value') is distinct from 'string'
       or (rule_input ->> 'value') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})$' then
      return false;
    end if;
    begin
      perform (rule_input ->> 'value')::timestamptz;
    exception when others then
      return false;
    end;
  end loop;

  return true;
end;
$function$;

revoke all on function public.is_valid_reality_profile_world_inputs(jsonb) from public, anon, authenticated;
grant execute on function public.is_valid_reality_profile_world_inputs(jsonb) to authenticated;

alter table public.reality_profiles
  add column world_model_inputs jsonb not null default '{"version":1,"resources":[],"constraints":[]}'::jsonb,
  add constraint reality_profiles_world_model_inputs_valid check (
    public.is_valid_reality_profile_world_inputs(world_model_inputs)
  );

grant select (world_model_inputs) on public.reality_profiles to authenticated;
grant insert (world_model_inputs) on public.reality_profiles to authenticated;
grant update (world_model_inputs) on public.reality_profiles to authenticated;

create or replace function public.enforce_reality_profile_revision_increment()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  content_changed boolean;
begin
  content_changed := row(
    new.life_climate_value,
    new.life_climate_classification,
    new.life_climate_evidence_summary,
    new.resources_value,
    new.resources_classification,
    new.resources_evidence_summary,
    new.constraints_value,
    new.constraints_classification,
    new.constraints_evidence_summary,
    new.life_goals,
    new.core_values,
    new.life_themes,
    new.pressures,
    new.external_variables,
    new.world_model_inputs
  ) is distinct from row(
    old.life_climate_value,
    old.life_climate_classification,
    old.life_climate_evidence_summary,
    old.resources_value,
    old.resources_classification,
    old.resources_evidence_summary,
    old.constraints_value,
    old.constraints_classification,
    old.constraints_evidence_summary,
    old.life_goals,
    old.core_values,
    old.life_themes,
    old.pressures,
    old.external_variables,
    old.world_model_inputs
  );

  if (content_changed and new.revision is distinct from old.revision + 1)
     or (not content_changed and new.revision is distinct from old.revision) then
    raise exception using
      errcode = '23514',
      message = 'Reality Profile content changes require exactly one revision increment',
      constraint = 'reality_profiles_revision_increment_check';
  end if;

  return new;
end;
$function$;

revoke all on function public.enforce_reality_profile_revision_increment() from public, anon, authenticated;
