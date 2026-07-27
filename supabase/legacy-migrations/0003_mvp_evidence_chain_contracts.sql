-- Project MiroFish MVP evidence-chain schema patch
-- Run after 0001_mvp_core_schema.sql.
-- This patch aligns the database ledger with the product constitution:
-- Seed Context -> Key People -> Agent Profiles -> Relation Graph ->
-- Simulation Ticks -> Event Logs -> Report Claims -> Feedback Calibration.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  locale text not null default 'en',
  calibration_profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists calibration_profile jsonb not null default '{}'::jsonb;

alter table public.seed_contexts
  add column if not exists version text not null default 'local-deterministic-v0',
  add column if not exists simulation_track text,
  add column if not exists scenario_type text,
  add column if not exists user_question text,
  add column if not exists theme_domain text,
  add column if not exists time_horizon text,
  add column if not exists tick_granularity text,
  add column if not exists raw_context text,
  add column if not exists decision_options jsonb not null default '[]'::jsonb,
  add column if not exists forbidden_actions jsonb not null default '[]'::jsonb,
  add column if not exists desired_output jsonb not null default '{}'::jsonb,
  add column if not exists safety_flags jsonb not null default '[]'::jsonb;

update public.seed_contexts
set
  simulation_track = coalesce(simulation_track, track_type::text),
  user_question = coalesce(user_question, question_text),
  time_horizon = coalesce(time_horizon, time_window::text),
  raw_context = coalesce(raw_context, situation_summary)
where simulation_track is null
   or user_question is null
   or time_horizon is null
   or raw_context is null;

alter table public.key_people
  add column if not exists display_name text,
  add column if not exists relationship_to_user text,
  add column if not exists role_type text,
  add column if not exists confidence numeric not null default 0,
  add column if not exists known_evidence jsonb not null default '[]'::jsonb,
  add column if not exists missing_fields jsonb not null default '[]'::jsonb,
  add column if not exists status text not null default 'candidate',
  add column if not exists merged_into_id uuid references public.key_people(id) on delete set null,
  add column if not exists evidence_refs jsonb not null default '[]'::jsonb;

update public.key_people
set
  display_name = coalesce(display_name, label),
  relationship_to_user = coalesce(relationship_to_user, role),
  role_type = coalesce(role_type, role),
  status = case
    when confirmed then 'confirmed'
    else status
  end
where display_name is null
   or relationship_to_user is null
   or role_type is null;

alter table public.agent_profiles
  add column if not exists key_person_id uuid references public.key_people(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists version text not null default 'local-deterministic-v0',
  add column if not exists display_name text,
  add column if not exists relationship_to_user text,
  add column if not exists source text not null default 'local_deterministic',
  add column if not exists psychology jsonb not null default '{}'::jsonb,
  add column if not exists motivation jsonb not null default '{}'::jsonb,
  add column if not exists resources jsonb not null default '{}'::jsonb,
  add column if not exists behavior_policy jsonb not null default '{}'::jsonb,
  add column if not exists state jsonb not null default '{}'::jsonb,
  add column if not exists memory jsonb not null default '[]'::jsonb,
  add column if not exists triggers jsonb not null default '[]'::jsonb,
  add column if not exists variant_axis text,
  add column if not exists confidence numeric not null default 0,
  add column if not exists evidence_refs jsonb not null default '[]'::jsonb,
  add column if not exists trace_id text,
  add column if not exists cost_estimate numeric not null default 0,
  add column if not exists error_code text;

alter table public.relation_edges
  add column if not exists simulation_run_id uuid references public.simulation_runs(id) on delete cascade,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists version text not null default 'local-deterministic-v0',
  add column if not exists relationship_type text,
  add column if not exists weights jsonb not null default '{}'::jsonb,
  add column if not exists trend text not null default 'stable',
  add column if not exists last_interaction_event_id uuid,
  add column if not exists trace_id text;

update public.relation_edges
set relationship_type = coalesce(relationship_type, relation_type)
where relationship_type is null;

alter table public.simulation_runs
  add column if not exists version text not null default 'local-deterministic-v0',
  add column if not exists track text,
  add column if not exists time_horizon text,
  add column if not exists tick_count integer not null default 0,
  add column if not exists frozen_agent_profile_ids jsonb not null default '[]'::jsonb,
  add column if not exists frozen_relation_edge_ids jsonb not null default '[]'::jsonb,
  add column if not exists safety_level text not null default 'normal',
  add column if not exists trace_id text,
  add column if not exists cost_estimate numeric not null default 0;

create table if not exists public.simulation_ticks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  simulation_run_id uuid not null references public.simulation_runs(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'local-deterministic-v0',
  tick_index integer not null,
  time_label text not null default '',
  environment_state jsonb not null default '{}'::jsonb,
  agent_state_snapshot jsonb not null default '{}'::jsonb,
  relation_graph_snapshot jsonb not null default '{}'::jsonb,
  summary text not null default '',
  trace_id text,
  error_code text
);

alter table public.events
  add column if not exists simulation_tick_id uuid references public.simulation_ticks(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists version text not null default 'local-deterministic-v0',
  add column if not exists time_label text not null default '',
  add column if not exists agent_ids jsonb not null default '[]'::jsonb,
  add column if not exists relation_edge_ids jsonb not null default '[]'::jsonb,
  add column if not exists before_state jsonb not null default '{}'::jsonb,
  add column if not exists after_state jsonb not null default '{}'::jsonb,
  add column if not exists edge_weight_deltas jsonb not null default '{}'::jsonb,
  add column if not exists confidence numeric not null default 0,
  add column if not exists source text not null default 'rule_engine',
  add column if not exists trace_id text;

update public.events
set
  agent_ids = case
    when jsonb_array_length(agent_ids) = 0 then involved_agents
    else agent_ids
  end,
  time_label = case
    when time_label = '' then 'Tick ' || tick::text
    else time_label
  end;

alter table public.claims
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists version text not null default 'local-deterministic-v0',
  add column if not exists claim_type text not null default 'coordination_signal',
  add column if not exists summary text,
  add column if not exists risk_level text not null default 'low',
  add column if not exists evidence_event_ids jsonb not null default '[]'::jsonb,
  add column if not exists related_agent_ids jsonb not null default '[]'::jsonb,
  add column if not exists related_relation_edge_ids jsonb not null default '[]'::jsonb,
  add column if not exists is_paid_locked boolean not null default false,
  add column if not exists safety_notes jsonb not null default '[]'::jsonb,
  add column if not exists trace_id text;

update public.claims
set
  summary = coalesce(summary, claim_text),
  evidence_event_ids = case
    when jsonb_array_length(evidence_event_ids) = 0 then evidence_refs
    else evidence_event_ids
  end
where summary is null
   or jsonb_array_length(evidence_event_ids) = 0;

alter table public.reports
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists version text not null default 'local-deterministic-v0',
  add column if not exists status text not null default 'draft',
  add column if not exists claim_ids jsonb not null default '[]'::jsonb,
  add column if not exists free_preview jsonb not null default '{}'::jsonb,
  add column if not exists paid_sections jsonb not null default '{}'::jsonb,
  add column if not exists disclaimer text not null default 'Scenario simulation only. Review evidence and uncertainty before acting.',
  add column if not exists model_version text not null default 'unreleased',
  add column if not exists prompt_version text not null default 'unreleased',
  add column if not exists trace_id text,
  add column if not exists cost_estimate numeric not null default 0,
  add column if not exists error_code text;

alter table public.payments
  add column if not exists simulation_run_id uuid references public.simulation_runs(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists unlock_scope text not null default 'none',
  add column if not exists refund_status text not null default 'none',
  add column if not exists error_code text;

alter table public.support_tickets
  add column if not exists subject text,
  add column if not exists message text not null default '',
  add column if not exists related_simulation_run_id uuid references public.simulation_runs(id) on delete set null;

update public.support_tickets
set subject = coalesce(subject, summary)
where subject is null;

alter table public.consent_events
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists status text not null default 'active',
  add column if not exists source text not null default 'app',
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.feedback_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_context_id uuid not null references public.seed_contexts(id) on delete cascade,
  simulation_run_id uuid references public.simulation_runs(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  target_type text not null,
  target_id text not null,
  rating text not null,
  comment text not null default '',
  agent_correction jsonb not null default '{}'::jsonb,
  edge_correction_note text not null default ''
);

create index if not exists seed_contexts_user_id_idx on public.seed_contexts(user_id);
create index if not exists key_people_seed_context_id_idx on public.key_people(seed_context_id);
create index if not exists agent_profiles_seed_context_id_idx on public.agent_profiles(seed_context_id);
create index if not exists relation_edges_seed_context_id_idx on public.relation_edges(seed_context_id);
create index if not exists relation_edges_simulation_run_id_idx on public.relation_edges(simulation_run_id);
create index if not exists simulation_runs_seed_context_id_idx on public.simulation_runs(seed_context_id);
create index if not exists simulation_ticks_run_id_idx on public.simulation_ticks(simulation_run_id);
create index if not exists events_run_id_idx on public.events(simulation_run_id);
create index if not exists claims_run_id_idx on public.claims(simulation_run_id);
create index if not exists reports_run_id_idx on public.reports(simulation_run_id);
create index if not exists feedback_log_run_id_idx on public.feedback_log(simulation_run_id);
create index if not exists feedback_log_seed_context_id_idx on public.feedback_log(seed_context_id);

alter table public.users enable row level security;
alter table public.simulation_ticks enable row level security;
alter table public.feedback_log enable row level security;

drop policy if exists "Users can manage own users row" on public.users;
create policy "Users can manage own users row" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can read own simulation ticks" on public.simulation_ticks;
create policy "Users can read own simulation ticks" on public.simulation_ticks
  for select using (auth.uid() = user_id);

drop policy if exists "Users can manage own feedback log" on public.feedback_log;
create policy "Users can manage own feedback log" on public.feedback_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can read own relation edges" on public.relation_edges;
create policy "Users can read own relation edges" on public.relation_edges
  for select using (auth.uid() = user_id);

drop policy if exists "Users can read own simulation runs" on public.simulation_runs;
create policy "Users can read own simulation runs" on public.simulation_runs
  for select using (auth.uid() = user_id);

drop policy if exists "Users can read own events" on public.events;
create policy "Users can read own events" on public.events
  for select using (auth.uid() = user_id);

drop policy if exists "Users can read own claims" on public.claims;
create policy "Users can read own claims" on public.claims
  for select using (auth.uid() = user_id);

drop policy if exists "Users can read own reports" on public.reports;
create policy "Users can read own reports" on public.reports
  for select using (auth.uid() = user_id);

drop policy if exists "Users can read own payments" on public.payments;
create policy "Users can read own payments" on public.payments
  for select using (auth.uid() = user_id);
