-- Project MiroFish full product initial schema.
-- This migration establishes Supabase Auth-owned product data with RLS.
-- It does not enable LLM calls, real payment writes, or replace localStorage.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  create type public.simulation_track as enum ('crossroad', 'life_climate');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.time_horizon as enum ('30_days', '90_days', '1_year', '3_years', '5_years');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.key_person_status as enum ('candidate', 'confirmed', 'deleted', 'merged', 'needs_confirmation');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.agent_profile_type as enum ('user_core', 'user_variant', 'npc', 'group');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.simulation_status as enum ('draft', 'queued', 'running', 'completed', 'blocked', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.claim_risk_level as enum ('low', 'medium', 'high');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_status as enum ('draft', 'preview_ready', 'paid_locked', 'unlocked', 'blocked', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.feedback_target_type as enum ('claim', 'agent', 'relation_edge', 'strategy', 'overall');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.entitlement_type as enum ('free_preview', 'paid_report', 'subscription');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.entitlement_status as enum ('inactive', 'active', 'expired', 'revoked');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'checkout_created', 'paid', 'failed', 'expired', 'refunded', 'disputed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.support_ticket_type as enum ('refund_request', 'delete_request', 'generation_failure', 'safety_appeal', 'general_support');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.support_ticket_status as enum ('open', 'in_review', 'resolved', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.generation_job_status as enum ('queued', 'running', 'completed', 'blocked', 'failed');
exception when duplicate_object then null;
end $$;

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  locale text not null default 'en',
  calibration_profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seed_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'local-deterministic-v0',
  simulation_track public.simulation_track not null default 'crossroad',
  scenario_type text not null default 'career_decision',
  user_question text not null,
  theme_domain text,
  time_horizon public.time_horizon not null default '90_days',
  tick_granularity text not null default 'weekly',
  raw_context text not null default '',
  decision_options jsonb not null default '[]'::jsonb,
  forbidden_actions jsonb not null default '[]'::jsonb,
  desired_output jsonb not null default '{}'::jsonb,
  safety_flags jsonb not null default '[]'::jsonb,
  status text not null default 'draft'
);

create table if not exists public.key_people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_context_id uuid not null references public.seed_contexts(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  display_name text not null,
  relationship_to_user text not null default 'unknown',
  role_type text not null default 'unknown',
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 100),
  known_evidence jsonb not null default '[]'::jsonb,
  missing_fields jsonb not null default '[]'::jsonb,
  status public.key_person_status not null default 'candidate',
  merged_into_id uuid references public.key_people(id) on delete set null,
  evidence_refs jsonb not null default '[]'::jsonb
);

create table if not exists public.agent_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_context_id uuid not null references public.seed_contexts(id) on delete cascade,
  key_person_id uuid references public.key_people(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'agent-profile-v1',
  agent_type public.agent_profile_type not null,
  display_name text not null,
  relationship_to_user text not null default 'unknown',
  source text not null default 'structured_generation',
  psychology jsonb not null default '{}'::jsonb,
  motivation jsonb not null default '{}'::jsonb,
  resources jsonb not null default '{}'::jsonb,
  behavior_policy jsonb not null default '{}'::jsonb,
  state jsonb not null default '{}'::jsonb,
  memory jsonb not null default '[]'::jsonb,
  triggers jsonb not null default '[]'::jsonb,
  variant_axis text,
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 100),
  evidence_refs jsonb not null default '[]'::jsonb,
  model_version text,
  prompt_version text,
  trace_id text not null default gen_random_uuid()::text,
  cost_estimate numeric not null default 0,
  error_code text
);

create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_context_id uuid not null references public.seed_contexts(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'simulation-v1',
  status public.simulation_status not null default 'draft',
  track public.simulation_track not null default 'crossroad',
  time_horizon public.time_horizon not null default '90_days',
  tick_count integer not null default 0 check (tick_count >= 0),
  frozen_agent_profile_ids uuid[] not null default '{}'::uuid[],
  frozen_relation_edge_ids uuid[] not null default '{}'::uuid[],
  safety_level text not null default 'normal',
  trace_id text not null default gen_random_uuid()::text,
  error_code text
);

create table if not exists public.relation_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  simulation_id uuid references public.simulations(id) on delete cascade,
  from_agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  to_agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'relation-edge-v1',
  relationship_type text not null,
  weights jsonb not null default '{}'::jsonb,
  trend jsonb not null default '{}'::jsonb,
  last_interaction_event_id uuid,
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 100),
  evidence_refs jsonb not null default '[]'::jsonb,
  trace_id text not null default gen_random_uuid()::text
);

create table if not exists public.simulation_ticks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  simulation_id uuid not null references public.simulations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'simulation-tick-v1',
  tick_index integer not null check (tick_index >= 0),
  time_label text not null default '',
  environment_state jsonb not null default '{}'::jsonb,
  agent_state_snapshot jsonb not null default '{}'::jsonb,
  relation_graph_snapshot jsonb not null default '{}'::jsonb,
  summary text not null default '',
  trace_id text not null default gen_random_uuid()::text,
  error_code text
);

create table if not exists public.event_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  simulation_id uuid not null references public.simulations(id) on delete cascade,
  simulation_tick_id uuid references public.simulation_ticks(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'event-log-v1',
  event_type text not null,
  agent_ids uuid[] not null default '{}'::uuid[],
  relation_edge_ids uuid[] not null default '{}'::uuid[],
  summary text not null default '',
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  edge_weight_deltas jsonb not null default '{}'::jsonb,
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 100),
  source text not null default 'simulation_engine',
  trace_id text not null default gen_random_uuid()::text
);

alter table public.relation_edges
  add constraint relation_edges_last_event_fk
  foreign key (last_interaction_event_id)
  references public.event_logs(id)
  on delete set null;

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  simulation_id uuid not null references public.simulations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'claim-v1',
  claim_type text not null,
  summary text not null,
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 100),
  risk_level public.claim_risk_level not null default 'low',
  evidence_event_ids uuid[] not null default '{}'::uuid[],
  related_agent_ids uuid[] not null default '{}'::uuid[],
  related_relation_edge_ids uuid[] not null default '{}'::uuid[],
  is_paid_locked boolean not null default false,
  safety_notes jsonb not null default '[]'::jsonb,
  trace_id text not null default gen_random_uuid()::text,
  constraint claims_require_evidence check (array_length(evidence_event_ids, 1) is not null)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  simulation_id uuid not null references public.simulations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'report-v1',
  status public.report_status not null default 'draft',
  claim_ids uuid[] not null default '{}'::uuid[],
  free_preview jsonb not null default '{}'::jsonb,
  paid_sections jsonb not null default '{}'::jsonb,
  disclaimer text not null default 'Scenario simulation only. Review evidence and uncertainty before acting.',
  model_version text,
  prompt_version text,
  trace_id text not null default gen_random_uuid()::text,
  cost_estimate numeric not null default 0,
  error_code text,
  constraint reports_require_claims check (array_length(claim_ids, 1) is not null)
);

create table if not exists public.feedback_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_context_id uuid references public.seed_contexts(id) on delete set null,
  simulation_id uuid references public.simulations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  target_type public.feedback_target_type not null,
  target_id text not null,
  rating text not null,
  comment text not null default '',
  agent_correction jsonb not null default '{}'::jsonb,
  edge_correction_note text not null default ''
);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  simulation_id uuid references public.simulations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  entitlement_type public.entitlement_type not null,
  status public.entitlement_status not null default 'inactive',
  scope text not null default 'single_simulation_report',
  starts_at timestamptz,
  expires_at timestamptz,
  source_payment_id uuid,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  simulation_id uuid references public.simulations(id) on delete set null,
  entitlement_id uuid references public.entitlements(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status public.payment_status not null default 'pending',
  provider text not null default 'stripe',
  provider_checkout_session_id text,
  provider_payment_id text,
  amount integer not null default 0 check (amount >= 0),
  currency text not null default 'usd',
  unlock_scope text not null default 'single_simulation_report',
  refund_status text not null default 'none',
  idempotency_key text,
  error_code text,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.entitlements
  add constraint entitlements_source_payment_fk
  foreign key (source_payment_id)
  references public.payments(id)
  on delete set null;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ticket_type public.support_ticket_type not null,
  status public.support_ticket_status not null default 'open',
  subject text not null,
  message text not null default '',
  related_simulation_id uuid references public.simulations(id) on delete set null,
  related_report_id uuid references public.reports(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  consent_type text not null,
  status text not null default 'active',
  source text not null default 'app',
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.model_call_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  trace_id text not null,
  version text not null default 'model-call-log-v1',
  job_type text not null,
  provider text,
  prompt_version text not null,
  model_version text not null,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  cost_estimate numeric not null default 0,
  token_counts jsonb not null default '{}'::jsonb,
  input_refs jsonb not null default '{}'::jsonb,
  output_refs jsonb not null default '{}'::jsonb,
  safety_level text not null default 'normal',
  error_code text
);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_context_id uuid references public.seed_contexts(id) on delete set null,
  simulation_id uuid references public.simulations(id) on delete set null,
  model_call_log_id uuid references public.model_call_logs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  trace_id text not null,
  version text not null default 'generation-job-v1',
  job_type text not null,
  status public.generation_job_status not null default 'queued',
  input_refs jsonb not null default '{}'::jsonb,
  output_refs jsonb not null default '{}'::jsonb,
  model_version text not null default 'unreleased',
  prompt_version text not null default 'unreleased',
  cost_estimate numeric not null default 0,
  error_code text,
  safety_level text not null default 'normal'
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'audit-event-v1',
  trace_id text not null,
  actor_type text not null,
  action text not null,
  target_table text,
  target_id text,
  idempotency_key text,
  request_hash text,
  gate_decision text,
  blocked_codes jsonb not null default '[]'::jsonb,
  model_version text,
  prompt_version text,
  cost_estimate numeric not null default 0,
  error_code text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists user_profiles_user_id_idx on public.user_profiles(user_id);
create index if not exists seed_contexts_user_id_idx on public.seed_contexts(user_id);
create index if not exists key_people_user_seed_idx on public.key_people(user_id, seed_context_id);
create index if not exists agent_profiles_user_seed_idx on public.agent_profiles(user_id, seed_context_id);
create index if not exists relation_edges_user_sim_idx on public.relation_edges(user_id, simulation_id);
create index if not exists simulations_user_seed_idx on public.simulations(user_id, seed_context_id);
create index if not exists simulation_ticks_user_sim_idx on public.simulation_ticks(user_id, simulation_id);
create index if not exists event_logs_user_sim_idx on public.event_logs(user_id, simulation_id);
create index if not exists claims_user_sim_idx on public.claims(user_id, simulation_id);
create index if not exists reports_user_sim_idx on public.reports(user_id, simulation_id);
create index if not exists feedback_logs_user_sim_idx on public.feedback_logs(user_id, simulation_id);
create index if not exists entitlements_user_idx on public.entitlements(user_id);
create index if not exists payments_user_idx on public.payments(user_id);
create index if not exists support_tickets_user_idx on public.support_tickets(user_id);
create index if not exists consent_events_user_idx on public.consent_events(user_id);
create index if not exists model_call_logs_trace_idx on public.model_call_logs(trace_id);
create index if not exists generation_jobs_trace_idx on public.generation_jobs(trace_id);
create index if not exists audit_events_trace_idx on public.audit_events(trace_id);

do $$ declare table_name text;
begin
  foreach table_name in array array[
    'user_profiles',
    'seed_contexts',
    'key_people',
    'agent_profiles',
    'relation_edges',
    'simulations',
    'simulation_ticks',
    'event_logs',
    'claims',
    'reports',
    'feedback_logs',
    'entitlements',
    'payments',
    'support_tickets',
    'consent_events',
    'model_call_logs',
    'generation_jobs',
    'audit_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

create policy "user_profiles_select_own" on public.user_profiles
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);
create policy "user_profiles_insert_own" on public.user_profiles
  for insert to authenticated with check (auth.uid() is not null and auth.uid() = user_id);
create policy "user_profiles_update_own" on public.user_profiles
  for update to authenticated using (auth.uid() is not null and auth.uid() = user_id)
  with check (auth.uid() is not null and auth.uid() = user_id);

create policy "seed_contexts_select_own" on public.seed_contexts
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);
create policy "seed_contexts_insert_own" on public.seed_contexts
  for insert to authenticated with check (auth.uid() is not null and auth.uid() = user_id);
create policy "seed_contexts_update_own" on public.seed_contexts
  for update to authenticated using (auth.uid() is not null and auth.uid() = user_id)
  with check (auth.uid() is not null and auth.uid() = user_id);
create policy "seed_contexts_delete_own" on public.seed_contexts
  for delete to authenticated using (auth.uid() is not null and auth.uid() = user_id);

create policy "key_people_select_own" on public.key_people
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);
create policy "key_people_insert_own" on public.key_people
  for insert to authenticated with check (auth.uid() is not null and auth.uid() = user_id);
create policy "key_people_update_own" on public.key_people
  for update to authenticated using (auth.uid() is not null and auth.uid() = user_id)
  with check (auth.uid() is not null and auth.uid() = user_id);
create policy "key_people_delete_own" on public.key_people
  for delete to authenticated using (auth.uid() is not null and auth.uid() = user_id);

create policy "agent_profiles_select_own" on public.agent_profiles
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);
create policy "relation_edges_select_own" on public.relation_edges
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);
create policy "simulations_select_own" on public.simulations
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);
create policy "simulation_ticks_select_own" on public.simulation_ticks
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);
create policy "event_logs_select_own" on public.event_logs
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);
create policy "claims_select_own" on public.claims
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);
create policy "reports_select_own" on public.reports
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);

create policy "feedback_logs_select_own" on public.feedback_logs
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);
create policy "feedback_logs_insert_own" on public.feedback_logs
  for insert to authenticated with check (auth.uid() is not null and auth.uid() = user_id);
create policy "feedback_logs_update_own" on public.feedback_logs
  for update to authenticated using (auth.uid() is not null and auth.uid() = user_id)
  with check (auth.uid() is not null and auth.uid() = user_id);
create policy "feedback_logs_delete_own" on public.feedback_logs
  for delete to authenticated using (auth.uid() is not null and auth.uid() = user_id);

create policy "entitlements_select_own" on public.entitlements
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);
create policy "payments_select_own" on public.payments
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);

create policy "support_tickets_select_own" on public.support_tickets
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);
create policy "support_tickets_insert_own" on public.support_tickets
  for insert to authenticated with check (auth.uid() is not null and auth.uid() = user_id);
create policy "support_tickets_update_own" on public.support_tickets
  for update to authenticated using (auth.uid() is not null and auth.uid() = user_id)
  with check (auth.uid() is not null and auth.uid() = user_id);

create policy "consent_events_select_own" on public.consent_events
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);
create policy "consent_events_insert_own" on public.consent_events
  for insert to authenticated with check (auth.uid() is not null and auth.uid() = user_id);

create policy "model_call_logs_select_own" on public.model_call_logs
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);
create policy "generation_jobs_select_own" on public.generation_jobs
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);
create policy "audit_events_select_own" on public.audit_events
  for select to authenticated using (auth.uid() is not null and auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.user_profiles,
  public.seed_contexts,
  public.key_people,
  public.feedback_logs,
  public.support_tickets
to authenticated;

grant select on
  public.agent_profiles,
  public.relation_edges,
  public.simulations,
  public.simulation_ticks,
  public.event_logs,
  public.claims,
  public.reports,
  public.entitlements,
  public.payments,
  public.consent_events,
  public.model_call_logs,
  public.generation_jobs,
  public.audit_events
to authenticated;

create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();
create trigger seed_contexts_set_updated_at
  before update on public.seed_contexts
  for each row execute function public.set_updated_at();
create trigger key_people_set_updated_at
  before update on public.key_people
  for each row execute function public.set_updated_at();
create trigger agent_profiles_set_updated_at
  before update on public.agent_profiles
  for each row execute function public.set_updated_at();
create trigger relation_edges_set_updated_at
  before update on public.relation_edges
  for each row execute function public.set_updated_at();
create trigger simulations_set_updated_at
  before update on public.simulations
  for each row execute function public.set_updated_at();
create trigger simulation_ticks_set_updated_at
  before update on public.simulation_ticks
  for each row execute function public.set_updated_at();
create trigger event_logs_set_updated_at
  before update on public.event_logs
  for each row execute function public.set_updated_at();
create trigger claims_set_updated_at
  before update on public.claims
  for each row execute function public.set_updated_at();
create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();
create trigger feedback_logs_set_updated_at
  before update on public.feedback_logs
  for each row execute function public.set_updated_at();
create trigger entitlements_set_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();
create trigger support_tickets_set_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();
create trigger consent_events_set_updated_at
  before update on public.consent_events
  for each row execute function public.set_updated_at();
create trigger model_call_logs_set_updated_at
  before update on public.model_call_logs
  for each row execute function public.set_updated_at();
create trigger generation_jobs_set_updated_at
  before update on public.generation_jobs
  for each row execute function public.set_updated_at();
create trigger audit_events_set_updated_at
  before update on public.audit_events
  for each row execute function public.set_updated_at();
