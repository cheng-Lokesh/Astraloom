-- Phase 2: immutable, authenticated Track A submissions only.
alter table public.seed_contexts
  add column if not exists trace_id text,
  add column if not exists submission_key uuid,
  add column if not exists submitted_at timestamptz,
  add column if not exists frozen_at timestamptz,
  add column if not exists consent_event_id uuid references public.consent_events(id) on delete restrict;

alter table public.seed_contexts
  add constraint seed_contexts_phase2_submitted_contract check (
    status <> 'submitted' or (
      simulation_track = 'crossroad' and time_horizon in ('30_days', '90_days') and
      scenario_type in ('career_decision', 'workplace_collaboration') and
      trace_id is not null and length(trace_id) > 0 and submission_key is not null and
      submitted_at is not null and frozen_at is not null
    )
  ) not valid;
alter table public.seed_contexts validate constraint seed_contexts_phase2_submitted_contract;
create unique index if not exists seed_contexts_owner_submission_key_idx on public.seed_contexts(user_id, submission_key) where submission_key is not null;
create index if not exists seed_contexts_owner_submitted_at_idx on public.seed_contexts(user_id, submitted_at desc) where status = 'submitted';

revoke all on public.seed_contexts, public.consent_events from anon;
revoke update, delete on public.seed_contexts, public.consent_events from authenticated;
grant select, insert on public.seed_contexts, public.consent_events to authenticated;
drop policy if exists "seed_contexts_update_own" on public.seed_contexts;
drop policy if exists "seed_contexts_delete_own" on public.seed_contexts;
