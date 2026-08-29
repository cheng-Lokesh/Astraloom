-- M1.1: close inherited hard privileges before any formal Run writer exists.
-- This migration is additive and preserves every existing business row.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- Formal feedback is append-only. A later M1 RPC owns validated inserts and
-- content-bound idempotency; browser callers cannot rewrite or delete history.
revoke update, delete on table public.feedback_logs from authenticated;

-- PostgreSQL combines permissive policies with OR. The initial owner-only
-- policy therefore weakened the Phase 3 submitted-Seed condition. Replace both
-- policies with one complete owner/object-chain boundary.
drop policy if exists "relation_edges_select_own" on public.relation_edges;
drop policy if exists "relation_edges_select_phase3_owner" on public.relation_edges;

create policy "relation_edges_select_phase4_owner_chain"
on public.relation_edges
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and exists (
    select 1
    from public.seed_contexts s
    where s.id = relation_edges.seed_context_id
      and s.user_id = (select auth.uid())
      and s.status = 'submitted'
      and s.frozen_at is not null
  )
  and exists (
    select 1
    from public.relation_graph_snapshots g
    where g.id = relation_edges.graph_snapshot_id
      and g.user_id = relation_edges.user_id
      and g.seed_context_id = relation_edges.seed_context_id
      and g.agent_snapshot_id = relation_edges.agent_snapshot_id
      and (
        (not g.graph_locked and g.locked_at is null)
        or (g.graph_locked and g.locked_at is not null)
      )
  )
);
