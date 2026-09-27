create or replace function public.is_safe_reality_profile_text(profile_text text, max_chars integer)
returns boolean
language plpgsql
immutable
parallel safe
set search_path = ''
as $function$
declare
  normalized text;
begin
  if profile_text is null or max_chars is null or max_chars not in (160, 240) then
    return false;
  end if;

  normalized := pg_catalog.btrim(profile_text, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF');
  return pg_catalog.char_length(normalized) between 1 and max_chars
    and normalized !~ '[[:cntrl:]]'
    and normalized !~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
    and normalized !~* '\m[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\M'
    and normalized !~* '\m(raw[[:space:]]+(scenario|evidence)|trace([_ -]?id)?|internal([_ -]?key)?|token|secret|password|api[_ -]?key)\M';
end;
$function$;

revoke all on function public.is_safe_reality_profile_text(text, integer) from public, anon, authenticated;
grant execute on function public.is_safe_reality_profile_text(text, integer) to authenticated;

alter table public.reality_profiles
  add constraint reality_profiles_life_climate_valid check (
    (life_climate_classification = 'unknown' and life_climate_value is null and life_climate_evidence_summary = '明确未知')
    or (life_climate_classification in ('fact', 'assumption')
      and public.is_safe_reality_profile_text(life_climate_value, 240)
      and public.is_safe_reality_profile_text(life_climate_evidence_summary, 160))
  ),
  add constraint reality_profiles_resources_valid check (
    (resources_classification = 'unknown' and resources_value is null and resources_evidence_summary = '明确未知')
    or (resources_classification in ('fact', 'assumption')
      and public.is_safe_reality_profile_text(resources_value, 240)
      and public.is_safe_reality_profile_text(resources_evidence_summary, 160))
  ),
  add constraint reality_profiles_constraints_valid check (
    (constraints_classification = 'unknown' and constraints_value is null and constraints_evidence_summary = '明确未知')
    or (constraints_classification in ('fact', 'assumption')
      and public.is_safe_reality_profile_text(constraints_value, 240)
      and public.is_safe_reality_profile_text(constraints_evidence_summary, 160))
  );

create or replace function public.is_valid_reality_profile_items(profile_items jsonb)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $function$
  select case
    when pg_catalog.jsonb_typeof(profile_items) is distinct from 'array' then false
    when pg_catalog.jsonb_array_length(profile_items) not between 1 and 8 then false
    else not exists (
      select 1
      from pg_catalog.jsonb_array_elements(profile_items) as entry(value)
      where case
        when pg_catalog.jsonb_typeof(entry.value) is distinct from 'object' then true
        else
          (entry.value - array['value', 'classification', 'evidenceSummary']::text[]) <> '{}'::jsonb
          or pg_catalog.jsonb_typeof(entry.value -> 'value') is distinct from 'string'
          or pg_catalog.jsonb_typeof(entry.value -> 'classification') is distinct from 'string'
          or pg_catalog.jsonb_typeof(entry.value -> 'evidenceSummary') is distinct from 'string'
          or entry.value ->> 'classification' not in ('fact', 'assumption', 'unknown')
          or (
            entry.value ->> 'classification' = 'unknown'
            and (entry.value ->> 'value' is distinct from '' or entry.value ->> 'evidenceSummary' is distinct from '明确未知')
          )
          or (
            entry.value ->> 'classification' in ('fact', 'assumption')
            and (
              not public.is_safe_reality_profile_text(entry.value ->> 'value', 240)
              or not public.is_safe_reality_profile_text(entry.value ->> 'evidenceSummary', 160)
              or entry.value ->> 'value' <> pg_catalog.btrim(entry.value ->> 'value', U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
              or entry.value ->> 'evidenceSummary' <> pg_catalog.btrim(entry.value ->> 'evidenceSummary', U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
            )
          )
      end
    )
  end;
$function$;

revoke all on function public.is_valid_reality_profile_items(jsonb) from public, anon, authenticated;
grant execute on function public.is_valid_reality_profile_items(jsonb) to authenticated;

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
    new.external_variables
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
    old.external_variables
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

create trigger reality_profiles_revision_increment_guard
  before update on public.reality_profiles
  for each row execute function public.enforce_reality_profile_revision_increment();
