-- Profile entries are intentionally user-authored. Each item keeps its own
-- fact/assumption/unknown state and a short, safe evidence summary.
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
      where pg_catalog.jsonb_typeof(entry.value) is distinct from 'object'
        or pg_catalog.jsonb_object_length(entry.value) <> 3
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
            pg_catalog.char_length(pg_catalog.btrim(entry.value ->> 'value')) not between 1 and 240
            or pg_catalog.char_length(pg_catalog.btrim(entry.value ->> 'evidenceSummary')) not between 1 and 160
            or entry.value ->> 'value' <> pg_catalog.btrim(entry.value ->> 'value')
            or entry.value ->> 'evidenceSummary' <> pg_catalog.btrim(entry.value ->> 'evidenceSummary')
            or (entry.value ->> 'value') ~ '[[:cntrl:]]'
            or (entry.value ->> 'evidenceSummary') ~ '[[:cntrl:]]'
            or (entry.value ->> 'value') ~* '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'
            or (entry.value ->> 'evidenceSummary') ~* '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'
            or (entry.value ->> 'value') ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
            or (entry.value ->> 'evidenceSummary') ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
            or (entry.value ->> 'value') ~* '(raw[[:space:]]+(scenario|evidence)|trace([_-]?id)?|internal([_-]?key)?|token|secret|password|api[_ -]?key)'
            or (entry.value ->> 'evidenceSummary') ~* '(raw[[:space:]]+(scenario|evidence)|trace([_-]?id)?|internal([_-]?key)?|token|secret|password|api[_ -]?key)'
          )
        )
    )
  end;
$function$;

revoke all on function public.is_valid_reality_profile_items(jsonb) from public, anon, authenticated;
grant execute on function public.is_valid_reality_profile_items(jsonb) to authenticated;

alter table public.reality_profiles
  add column life_goals jsonb not null default '[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}]'::jsonb,
  add column core_values jsonb not null default '[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}]'::jsonb,
  add column life_themes jsonb not null default '[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}]'::jsonb,
  add column pressures jsonb not null default '[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}]'::jsonb,
  add column external_variables jsonb not null default '[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}]'::jsonb,
  add constraint reality_profiles_life_goals_valid check (public.is_valid_reality_profile_items(life_goals)),
  add constraint reality_profiles_core_values_valid check (public.is_valid_reality_profile_items(core_values)),
  add constraint reality_profiles_life_themes_valid check (public.is_valid_reality_profile_items(life_themes)),
  add constraint reality_profiles_pressures_valid check (public.is_valid_reality_profile_items(pressures)),
  add constraint reality_profiles_external_variables_valid check (public.is_valid_reality_profile_items(external_variables));

grant select (life_goals, core_values, life_themes, pressures, external_variables)
  on public.reality_profiles to authenticated;
grant insert (life_goals, core_values, life_themes, pressures, external_variables)
  on public.reality_profiles to authenticated;
grant update (life_goals, core_values, life_themes, pressures, external_variables)
  on public.reality_profiles to authenticated;

drop policy if exists "reality_profiles_select_own" on public.reality_profiles;
drop policy if exists "reality_profiles_insert_own" on public.reality_profiles;
drop policy if exists "reality_profiles_update_own" on public.reality_profiles;

create policy "reality_profiles_select_own_current_seed" on public.reality_profiles
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    and seed_context_id = (
      select seed.id
      from public.seed_contexts as seed
      where seed.user_id = (select auth.uid())
        and seed.status = 'submitted'
        and seed.submitted_at is not null
        and seed.frozen_at is not null
      order by seed.submitted_at desc, seed.id desc
      limit 1
    )
  );

create policy "reality_profiles_insert_own_current_seed" on public.reality_profiles
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and seed_context_id = (
      select seed.id
      from public.seed_contexts as seed
      where seed.user_id = (select auth.uid())
        and seed.status = 'submitted'
        and seed.submitted_at is not null
        and seed.frozen_at is not null
      order by seed.submitted_at desc, seed.id desc
      limit 1
    )
  );

create policy "reality_profiles_update_own_current_seed" on public.reality_profiles
  for update to authenticated
  using (
    (select auth.uid()) = user_id
    and seed_context_id = (
      select seed.id
      from public.seed_contexts as seed
      where seed.user_id = (select auth.uid())
        and seed.status = 'submitted'
        and seed.submitted_at is not null
        and seed.frozen_at is not null
      order by seed.submitted_at desc, seed.id desc
      limit 1
    )
  )
  with check (
    (select auth.uid()) = user_id
    and seed_context_id = (
      select seed.id
      from public.seed_contexts as seed
      where seed.user_id = (select auth.uid())
        and seed.status = 'submitted'
        and seed.submitted_at is not null
        and seed.frozen_at is not null
      order by seed.submitted_at desc, seed.id desc
      limit 1
    )
  );
