begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

select has_function('public', 'persist_account_sandbox_run_m1', array['uuid','uuid','uuid','integer','jsonb'], 'one controlled formal Run writer remains available');
select ok(not (select prosecdef from pg_proc where oid = to_regprocedure('public.persist_account_sandbox_run_m1(uuid,uuid,uuid,integer,jsonb)')), 'formal Run persistence stays SECURITY INVOKER');
select function_privs_are('public', 'persist_account_sandbox_run_m1', array['uuid','uuid','uuid','integer','jsonb'], 'anon', array[]::text[], 'anonymous users cannot execute the formal Run writer');
select function_privs_are('public', 'persist_account_sandbox_run_m1', array['uuid','uuid','uuid','integer','jsonb'], 'authenticated', array['EXECUTE'], 'authenticated callers use the controlled Run writer');
select function_privs_are('public', 'persist_account_sandbox_run_m1', array['uuid','uuid','uuid','integer','jsonb'], 'service_role', array[]::text[], 'service-role cannot substitute for an authenticated owner');
select ok((select prosrc ilike '%auth.uid()%' and prosrc ilike '%p_user_id is distinct from auth.uid()%' from pg_proc where oid = to_regprocedure('public.persist_account_sandbox_run_m1(uuid,uuid,uuid,integer,jsonb)')), 'the writer rejects missing or mismatched caller identity using auth.uid()');

select ok((select bool_and(relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('simulations','simulation_ticks','event_logs','claims','reports','simulation_run_idempotency_receipts')), 'every formal output and receipt table keeps RLS enabled');
select ok(has_column_privilege('authenticated', 'public.simulations', 'user_id', 'INSERT'), 'the controlled invoker can insert the minimum Run columns');
select ok(has_column_privilege('authenticated', 'public.simulations', 'result_bundle', 'UPDATE'), 'the controlled invoker can complete a Run with its immutable Bundle');
select ok(has_column_privilege('authenticated', 'public.simulation_ticks', 'user_id', 'INSERT'), 'the controlled invoker can append canonical Ticks');
select ok(has_column_privilege('authenticated', 'public.event_logs', 'user_id', 'INSERT'), 'the controlled invoker can append canonical Events');
select ok(has_column_privilege('authenticated', 'public.claims', 'user_id', 'INSERT'), 'the controlled invoker can append canonical Claims');
select ok(has_column_privilege('authenticated', 'public.reports', 'user_id', 'INSERT'), 'the controlled invoker can append the canonical Report');
select ok(has_column_privilege('authenticated', 'public.simulation_run_idempotency_receipts', 'user_id', 'SELECT'), 'the controlled invoker can read owner-scoped idempotency receipts');
select ok(has_column_privilege('authenticated', 'public.simulation_run_idempotency_receipts', 'user_id', 'INSERT'), 'the controlled invoker can append owner-scoped idempotency receipts');
select ok(not has_any_column_privilege('authenticated', 'public.simulation_ticks', 'UPDATE') and not has_any_column_privilege('authenticated', 'public.event_logs', 'UPDATE') and not has_any_column_privilege('authenticated', 'public.claims', 'UPDATE') and not has_any_column_privilege('authenticated', 'public.reports', 'UPDATE') and not has_any_column_privilege('authenticated', 'public.simulation_run_idempotency_receipts', 'UPDATE'), 'browser callers receive no update capability for immutable artifacts');
select ok(not has_table_privilege('authenticated', 'public.simulation_ticks', 'DELETE') and not has_table_privilege('authenticated', 'public.event_logs', 'DELETE') and not has_table_privilege('authenticated', 'public.claims', 'DELETE') and not has_table_privilege('authenticated', 'public.reports', 'DELETE') and not has_table_privilege('authenticated', 'public.simulation_run_idempotency_receipts', 'DELETE'), 'browser callers receive no delete capability for immutable artifacts');

select is((select count(*)::integer from pg_policies where schemaname='public' and policyname in (
  'simulations_m1_writer_insert', 'simulations_m1_writer_update',
  'simulation_ticks_m1_writer_insert', 'event_logs_m1_writer_insert',
  'claims_m1_writer_insert', 'reports_m1_writer_insert',
  'simulation_run_receipts_m1_writer_select', 'simulation_run_receipts_m1_writer_insert'
)), 8, 'formal writes and receipt replay use the complete narrow RLS policy set');
select ok((select bool_and(coalesce(qual, '') || coalesce(with_check, '') ilike '%auth.uid()%' and coalesce(qual, '') || coalesce(with_check, '') ilike '%app.m1_run_rpc%') from pg_policies where schemaname='public' and policyname in (
  'simulations_m1_writer_insert', 'simulations_m1_writer_update',
  'simulation_ticks_m1_writer_insert', 'event_logs_m1_writer_insert',
  'claims_m1_writer_insert', 'reports_m1_writer_insert',
  'simulation_run_receipts_m1_writer_select', 'simulation_run_receipts_m1_writer_insert'
)), 'every write capability is scoped to auth.uid() and the transaction-local writer gate');
select ok(not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname in ('public','graphql_public')
    and p.oid <> to_regprocedure('public.persist_account_sandbox_run_m1(uuid,uuid,uuid,integer,jsonb)')
    and p.prosrc ilike '%app.m1_run_rpc%'
    and p.prosrc ilike '%set_config%'
), 'the exposed API has no second RPC that can open the transaction-local writer gate');
select ok(exists(select 1 from supabase_migrations.schema_migrations where version='20260830140000'), 'the canonical formal Run writer migration remains applied');

select * from finish();
rollback;
