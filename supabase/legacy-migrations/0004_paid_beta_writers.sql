-- Project MiroFish paid Beta writer gates
-- Run after 0002_mvp_evidence_chain_contracts.sql.
-- These tables are server-owned ledgers for real AI and payment writes.

create extension if not exists pgcrypto;

create table if not exists public.writer_audit_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  trace_id text not null,
  contract_id text not null,
  lifecycle text not null,
  actor_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  user_id_hash text,
  target_tables jsonb not null default '[]'::jsonb,
  idempotency_key text,
  request_hash text not null,
  gate_decision text not null,
  blocked_codes jsonb not null default '[]'::jsonb,
  writer_version text not null,
  model_version text,
  prompt_version text,
  cost_estimate numeric not null default 0,
  error_code text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.writer_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  key text not null unique,
  trace_id text not null,
  contract_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  request_hash text not null,
  status text not null default 'reserved',
  response_ref jsonb not null default '{}'::jsonb,
  error_code text,
  expires_at timestamptz
);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_context_id uuid references public.seed_contexts(id) on delete set null,
  simulation_run_id uuid references public.simulation_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  trace_id text not null,
  version text not null default 'paid-beta-writer-v1',
  job_type text not null,
  status text not null default 'queued',
  input_refs jsonb not null default '{}'::jsonb,
  output_refs jsonb not null default '{}'::jsonb,
  model_version text not null default 'unreleased',
  prompt_version text not null default 'unreleased',
  cost_estimate numeric not null default 0,
  error_code text,
  safety_level text not null default 'normal'
);

create index if not exists writer_audit_events_trace_id_idx
  on public.writer_audit_events(trace_id);

create index if not exists writer_audit_events_contract_idx
  on public.writer_audit_events(contract_id, created_at desc);

create index if not exists writer_idempotency_keys_trace_id_idx
  on public.writer_idempotency_keys(trace_id);

create index if not exists generation_jobs_user_id_idx
  on public.generation_jobs(user_id);

create index if not exists generation_jobs_trace_id_idx
  on public.generation_jobs(trace_id);

create index if not exists generation_jobs_status_idx
  on public.generation_jobs(status, created_at desc);

alter table public.writer_audit_events enable row level security;
alter table public.writer_idempotency_keys enable row level security;
alter table public.generation_jobs enable row level security;

drop policy if exists "Users can read own generation jobs" on public.generation_jobs;
create policy "Users can read own generation jobs" on public.generation_jobs
  for select using (auth.uid() = user_id);

-- No browser insert/update/delete policies are intentionally defined for
-- writer_audit_events, writer_idempotency_keys, or generation_jobs.
-- Service-role writers own these tables after gate checks pass.
