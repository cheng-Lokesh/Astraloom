-- Project MiroFish MVP core schema
-- Run this in Supabase SQL editor after the project is created.
-- This migration defines the minimum tables needed for the VibeCoding MVP path.

create extension if not exists pgcrypto;

do $$ begin
  create type public.track_type as enum ('crossroad', 'life_climate');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.time_window as enum ('30_days', '90_days', '1_year', '3_years', '5_years');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.seed_context_status as enum ('draft', 'submitted', 'archived');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seed_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_text text not null,
  track_type public.track_type not null,
  time_window public.time_window not null,
  situation_summary text not null default '',
  key_people_text text not null default '',
  privacy_ack boolean not null default false,
  locale text not null default 'en',
  status public.seed_context_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.key_people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_context_id uuid not null references public.seed_contexts(id) on delete cascade,
  label text not null,
  role text not null default 'unknown',
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_context_id uuid not null references public.seed_contexts(id) on delete cascade,
  agent_type text not null,
  profile_json jsonb not null default '{}'::jsonb,
  prompt_version text not null default 'unreleased',
  model_version text not null default 'unreleased',
  created_at timestamptz not null default now()
);

create table if not exists public.relation_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_context_id uuid not null references public.seed_contexts(id) on delete cascade,
  from_agent_id uuid references public.agent_profiles(id) on delete set null,
  to_agent_id uuid references public.agent_profiles(id) on delete set null,
  relation_type text not null,
  strength_band text not null default 'unknown',
  confidence numeric not null default 0,
  evidence_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.simulation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_context_id uuid not null references public.seed_contexts(id) on delete cascade,
  status text not null default 'queued',
  model_version text not null default 'unreleased',
  prompt_version text not null default 'unreleased',
  cost_cents integer not null default 0,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  simulation_run_id uuid not null references public.simulation_runs(id) on delete cascade,
  tick integer not null,
  event_type text not null,
  summary text not null,
  involved_agents jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  simulation_run_id uuid not null references public.simulation_runs(id) on delete cascade,
  claim_text text not null,
  confidence numeric not null default 0,
  evidence_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  simulation_run_id uuid not null references public.simulation_runs(id) on delete cascade,
  report_json jsonb not null default '{}'::jsonb,
  safety_level text not null default 'normal',
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'stripe',
  provider_payment_id text,
  amount_cents integer not null default 0,
  currency text not null default 'usd',
  status text not null default 'pending',
  entitlement_type text not null default 'none',
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticket_type text not null,
  status text not null default 'open',
  priority text not null default 'p2',
  related_report_id uuid references public.reports(id) on delete set null,
  summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  policy_version text not null,
  accepted_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.seed_contexts enable row level security;
alter table public.key_people enable row level security;
alter table public.agent_profiles enable row level security;
alter table public.relation_edges enable row level security;
alter table public.simulation_runs enable row level security;
alter table public.events enable row level security;
alter table public.claims enable row level security;
alter table public.reports enable row level security;
alter table public.payments enable row level security;
alter table public.support_tickets enable row level security;
alter table public.consent_events enable row level security;

create policy "Users can manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can manage own seed contexts" on public.seed_contexts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own key people" on public.key_people
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can read own agent profiles" on public.agent_profiles
  for select using (auth.uid() = user_id);

create policy "Users can read own relation edges" on public.relation_edges
  for select using (auth.uid() = user_id);

create policy "Users can read own simulation runs" on public.simulation_runs
  for select using (auth.uid() = user_id);

create policy "Users can read own events" on public.events
  for select using (auth.uid() = user_id);

create policy "Users can read own claims" on public.claims
  for select using (auth.uid() = user_id);

create policy "Users can read own reports" on public.reports
  for select using (auth.uid() = user_id);

create policy "Users can read own payments" on public.payments
  for select using (auth.uid() = user_id);

create policy "Users can manage own support tickets" on public.support_tickets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can read own consent events" on public.consent_events
  for select using (auth.uid() = user_id);

