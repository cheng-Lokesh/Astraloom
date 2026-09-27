create or replace function public.is_valid_reality_profile_life_model_domains(profile_domains jsonb)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $function$
  select case
    when pg_catalog.jsonb_typeof(profile_domains) is distinct from 'object' then false
    when (profile_domains - array['version', 'identity', 'career', 'wealth', 'relationships', 'environment', 'lifeStage']::text[]) <> '{}'::jsonb then false
    when profile_domains -> 'version' is distinct from '1'::jsonb then false
    else
      public.is_valid_reality_profile_items(profile_domains -> 'identity')
      and public.is_valid_reality_profile_items(profile_domains -> 'career')
      and public.is_valid_reality_profile_items(profile_domains -> 'wealth')
      and public.is_valid_reality_profile_items(profile_domains -> 'relationships')
      and public.is_valid_reality_profile_items(profile_domains -> 'environment')
      and public.is_valid_reality_profile_items(profile_domains -> 'lifeStage')
  end;
$function$;

revoke all on function public.is_valid_reality_profile_life_model_domains(jsonb) from public, anon, authenticated;
grant execute on function public.is_valid_reality_profile_life_model_domains(jsonb) to authenticated;

alter table public.reality_profiles
  add column life_model_domains jsonb not null default '{"version":1,"identity":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"career":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"wealth":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"relationships":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"environment":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"lifeStage":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}]}'::jsonb,
  add constraint reality_profiles_life_model_domains_valid check (
    public.is_valid_reality_profile_life_model_domains(life_model_domains)
  );

grant select (life_model_domains) on public.reality_profiles to authenticated;
grant insert (life_model_domains) on public.reality_profiles to authenticated;
grant update (life_model_domains) on public.reality_profiles to authenticated;

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
    new.world_model_inputs,
    new.life_model_domains
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
    old.world_model_inputs,
    old.life_model_domains
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
