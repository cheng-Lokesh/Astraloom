-- Account-owned Reality Profile for the current formal Seed chain.  These are
-- deliberate user entries, never simulated events or private inferred facts.
create table public.reality_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_context_id uuid not null,
  life_climate_value text,
  life_climate_classification text not null check (life_climate_classification in ('fact', 'assumption', 'unknown')),
  life_climate_evidence_summary text,
  resources_value text,
  resources_classification text not null check (resources_classification in ('fact', 'assumption', 'unknown')),
  resources_evidence_summary text,
  constraints_value text,
  constraints_classification text not null check (constraints_classification in ('fact', 'assumption', 'unknown')),
  constraints_evidence_summary text,
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint reality_profiles_owner_seed_context_fkey
    foreign key (seed_context_id, user_id)
    references public.seed_contexts(id, user_id) on delete cascade,
  unique (user_id, seed_context_id),
  check (
    (life_climate_classification = 'unknown' and life_climate_value is null and life_climate_evidence_summary = '明确未知')
    or (life_climate_classification <> 'unknown' and length(trim(coalesce(life_climate_value, ''))) between 1 and 240 and length(trim(coalesce(life_climate_evidence_summary, ''))) between 1 and 160)
  ),
  check (
    (resources_classification = 'unknown' and resources_value is null and resources_evidence_summary = '明确未知')
    or (resources_classification <> 'unknown' and length(trim(coalesce(resources_value, ''))) between 1 and 240 and length(trim(coalesce(resources_evidence_summary, ''))) between 1 and 160)
  ),
  check (
    (constraints_classification = 'unknown' and constraints_value is null and constraints_evidence_summary = '明确未知')
    or (constraints_classification <> 'unknown' and length(trim(coalesce(constraints_value, ''))) between 1 and 240 and length(trim(coalesce(constraints_evidence_summary, ''))) between 1 and 160)
  )
);

create index reality_profiles_owner_seed_idx on public.reality_profiles(user_id, seed_context_id);

alter table public.reality_profiles enable row level security;
revoke all on public.reality_profiles from public, anon;
revoke all on public.reality_profiles from authenticated;
grant select (
  user_id, seed_context_id,
  life_climate_value, life_climate_classification, life_climate_evidence_summary,
  resources_value, resources_classification, resources_evidence_summary,
  constraints_value, constraints_classification, constraints_evidence_summary, revision
) on public.reality_profiles to authenticated;
grant insert (
  user_id, seed_context_id,
  life_climate_value, life_climate_classification, life_climate_evidence_summary,
  resources_value, resources_classification, resources_evidence_summary,
  constraints_value, constraints_classification, constraints_evidence_summary, revision
) on public.reality_profiles to authenticated;
grant update (
  life_climate_value, life_climate_classification, life_climate_evidence_summary,
  resources_value, resources_classification, resources_evidence_summary,
  constraints_value, constraints_classification, constraints_evidence_summary, revision
) on public.reality_profiles to authenticated;

create policy "reality_profiles_select_own" on public.reality_profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "reality_profiles_insert_own" on public.reality_profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "reality_profiles_update_own" on public.reality_profiles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger reality_profiles_updated_at
  before update on public.reality_profiles
  for each row execute function public.set_updated_at();
