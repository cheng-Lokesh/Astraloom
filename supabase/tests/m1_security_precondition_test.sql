begin;

create extension if not exists pgtap with schema extensions;
select plan(27);

select ok(
  not exists (
    select 1
    from information_schema.role_table_grants
    where grantee = 'authenticated'
      and table_schema = 'public'
      and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')
  ),
  'authenticated has no hard table privileges on public business data'
);

select ok(
  not exists (
    select 1
    from information_schema.role_table_grants
    where grantee = 'anon'
      and table_schema = 'public'
      and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')
  ),
  'anon has no hard table privileges on public business data'
);

select ok(not has_table_privilege('authenticated', 'public.feedback_logs', 'update'), 'formal Feedback cannot be updated directly');
select ok(not has_table_privilege('authenticated', 'public.feedback_logs', 'delete'), 'formal Feedback cannot be deleted directly');
select ok(not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'relation_edges' and policyname = 'relation_edges_select_own'), 'legacy permissive Edge owner policy is removed');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'relation_edges' and policyname = 'relation_edges_select_phase4_owner_chain'), 'one Phase 4 owner-chain Edge SELECT policy exists');
select is((select count(*) from pg_policies where schemaname = 'public' and tablename = 'relation_edges' and cmd = 'SELECT'), 1::bigint, 'Edge SELECT has no permissive-policy OR weakening');
select is((select permissive from pg_policies where schemaname = 'public' and tablename = 'relation_edges' and policyname = 'relation_edges_select_phase4_owner_chain'), 'PERMISSIVE', 'the single Edge SELECT policy is the explicit allow boundary');
select ok((select qual ilike '%auth.uid()%' from pg_policies where schemaname = 'public' and tablename = 'relation_edges' and policyname = 'relation_edges_select_phase4_owner_chain'), 'Edge SELECT requires the current auth uid');
select ok((select qual ilike '%seed_contexts%' from pg_policies where schemaname = 'public' and tablename = 'relation_edges' and policyname = 'relation_edges_select_phase4_owner_chain'), 'Edge SELECT re-reads the canonical Seed');
select ok((select qual ilike '%submitted%' from pg_policies where schemaname = 'public' and tablename = 'relation_edges' and policyname = 'relation_edges_select_phase4_owner_chain'), 'Edge SELECT requires a submitted Seed');
select ok((select qual ilike '%frozen_at%' from pg_policies where schemaname = 'public' and tablename = 'relation_edges' and policyname = 'relation_edges_select_phase4_owner_chain'), 'Edge SELECT requires a frozen Seed');
select ok((select qual ilike '%relation_graph_snapshots%' from pg_policies where schemaname = 'public' and tablename = 'relation_edges' and policyname = 'relation_edges_select_phase4_owner_chain'), 'Edge SELECT re-reads the canonical Graph parent');
select ok((select qual ilike '%graph_snapshot_id%' from pg_policies where schemaname = 'public' and tablename = 'relation_edges' and policyname = 'relation_edges_select_phase4_owner_chain'), 'Edge SELECT binds the Graph id');
select ok((select qual ilike '%g.user_id%' from pg_policies where schemaname = 'public' and tablename = 'relation_edges' and policyname = 'relation_edges_select_phase4_owner_chain'), 'Edge SELECT binds Graph owner');
select ok((select qual ilike '%g.seed_context_id%' from pg_policies where schemaname = 'public' and tablename = 'relation_edges' and policyname = 'relation_edges_select_phase4_owner_chain'), 'Edge SELECT binds Graph Seed');
select ok((select qual ilike '%g.agent_snapshot_id%' from pg_policies where schemaname = 'public' and tablename = 'relation_edges' and policyname = 'relation_edges_select_phase4_owner_chain'), 'Edge SELECT binds Graph Agent snapshot');
select ok((select qual ilike '%graph_locked%' and qual ilike '%locked_at%' from pg_policies where schemaname = 'public' and tablename = 'relation_edges' and policyname = 'relation_edges_select_phase4_owner_chain'), 'Edge SELECT requires a canonical Graph lock lifecycle');
select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.relation_edges')), false), 'Relation Edge RLS remains enabled');
select ok(not has_table_privilege('anon', 'public.relation_edges', 'select'), 'anonymous users have no Edge projection');
select ok(not exists (select 1 from pg_proc p where p.oid in (to_regprocedure('public.submit_seed_context_phase2(uuid,jsonb)'), to_regprocedure('public.extract_key_people_phase3(uuid,uuid)'), to_regprocedure('public.mutate_key_people_phase3(uuid,uuid,jsonb)'), to_regprocedure('public.generate_agent_snapshot_phase3(uuid,uuid,boolean)'), to_regprocedure('public.generate_relation_graph_phase3(uuid,uuid)'), to_regprocedure('public.lock_relation_graph_phase3(uuid,uuid)')) and has_function_privilege('anon', p.oid, 'execute')), 'anonymous users cannot execute protected Phase 2/3 RPCs');
select is((select count(*) from pg_proc p where p.oid in (to_regprocedure('public.submit_seed_context_phase2(uuid,jsonb)'), to_regprocedure('public.extract_key_people_phase3(uuid,uuid)'), to_regprocedure('public.mutate_key_people_phase3(uuid,uuid,jsonb)'), to_regprocedure('public.generate_agent_snapshot_phase3(uuid,uuid,boolean)'), to_regprocedure('public.generate_relation_graph_phase3(uuid,uuid)'), to_regprocedure('public.lock_relation_graph_phase3(uuid,uuid)')) and has_function_privilege('authenticated', p.oid, 'execute')), 6::bigint, 'authenticated retains only the six required controlled Phase 2/3 RPC capabilities');
select ok(not exists (select 1 from pg_proc p where p.oid in (to_regprocedure('public.submit_seed_context_phase2(uuid,jsonb)'), to_regprocedure('public.extract_key_people_phase3(uuid,uuid)'), to_regprocedure('public.mutate_key_people_phase3(uuid,uuid,jsonb)'), to_regprocedure('public.generate_agent_snapshot_phase3(uuid,uuid,boolean)'), to_regprocedure('public.generate_relation_graph_phase3(uuid,uuid)'), to_regprocedure('public.lock_relation_graph_phase3(uuid,uuid)')) and p.prosecdef), 'all protected Phase 2/3 RPCs remain SECURITY INVOKER');
select cmp_ok((select count(*) from public.seed_contexts), '>=', 16::bigint, 'the existing 16 Seed rows remain present after later account use');
select cmp_ok((select count(*) from public.consent_events), '>=', 16::bigint, 'the existing 16 Consent rows remain present after later account use');
select is((select count(*) from supabase_migrations.schema_migrations), 16::bigint, 'the canonical migrations plus all forward M1 and M1.6 history-ordering migrations are recorded');
select ok(exists (select 1 from supabase_migrations.schema_migrations where version = '20260830120000'), 'M1 security migration is recorded in migration history');

select * from finish();
rollback;
