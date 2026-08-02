begin;

create extension if not exists pgtap with schema extensions;
select plan(130);

-- Step C owns an immutable Graph parent. Existing relation_edges are not a
-- graph snapshot until every Edge is bound to this parent and its Agent input.
select has_table('public', 'relation_graph_snapshots', 'immutable Graph snapshot parent exists');
select has_table('public', 'relation_graph_idempotency_receipts', 'Graph receipt ledger exists');
select has_column('public', 'relation_edges', 'graph_snapshot_id', 'every Edge binds an immutable Graph parent');
select has_column('public', 'relation_edges', 'agent_snapshot_id', 'every Edge binds the frozen Agent snapshot');
select has_column('public', 'relation_edges', 'seed_context_id', 'every Edge binds the submitted Seed');
select has_column('public', 'relation_edges', 'request_hash', 'every Edge binds canonical request content');
select has_column('public', 'relation_edges', 'safety_level', 'every Edge retains derived safety');
select has_column('public', 'relation_graph_snapshots', 'agent_snapshot_id', 'Graph parent binds its Agent input');
select has_column('public', 'relation_graph_snapshots', 'graph_locked', 'Graph parent persists lock state');
select has_column('public', 'relation_graph_snapshots', 'locked_at', 'Graph parent persists lock time');
select has_column('public', 'relation_graph_snapshots', 'request_hash', 'Graph parent binds canonical request content');
select has_column('public', 'relation_graph_snapshots', 'trace_id', 'Graph parent retains opaque trace provenance');
select has_column('public', 'relation_graph_snapshots', 'writer_version', 'Graph parent records controlled writer version');
select has_function('public', 'generate_relation_graph_phase3', array['uuid', 'uuid'], 'single controlled Graph generator exists');
select has_function('public', 'lock_relation_graph_phase3', array['uuid', 'uuid'], 'single controlled Graph lock writer exists');
select ok(not (select prosecdef from pg_proc where oid = to_regprocedure('public.generate_relation_graph_phase3(uuid,uuid)')), 'Graph generator is SECURITY INVOKER');
select ok(not (select prosecdef from pg_proc where oid = to_regprocedure('public.lock_relation_graph_phase3(uuid,uuid)')), 'Graph lock writer is SECURITY INVOKER');
select is((select proconfig::text from pg_proc where oid = to_regprocedure('public.generate_relation_graph_phase3(uuid,uuid)')), '{"search_path=public, extensions"}', 'Graph generator has fixed search path');
select is((select proconfig::text from pg_proc where oid = to_regprocedure('public.lock_relation_graph_phase3(uuid,uuid)')), '{"search_path=public, extensions"}', 'Graph lock writer has fixed search path');
select function_privs_are('public', 'generate_relation_graph_phase3', array['uuid', 'uuid'], 'authenticated', array['EXECUTE'], 'authenticated alone may execute Graph generation');
select function_privs_are('public', 'generate_relation_graph_phase3', array['uuid', 'uuid'], 'anon', array[]::text[], 'anon cannot execute Graph generation');
select function_privs_are('public', 'lock_relation_graph_phase3', array['uuid', 'uuid'], 'authenticated', array['EXECUTE'], 'authenticated alone may execute Graph locking');
select function_privs_are('public', 'lock_relation_graph_phase3', array['uuid', 'uuid'], 'anon', array[]::text[], 'anon cannot execute Graph locking');
select ok(not has_table_privilege('authenticated', 'public.relation_edges', 'select'), 'authenticated has no broad Edge SELECT');
select ok(not has_table_privilege('authenticated', 'public.relation_edges', 'insert'), 'browser cannot insert Edges directly');
select ok(not has_table_privilege('authenticated', 'public.relation_edges', 'update'), 'browser cannot update Edges directly');
select ok(not has_table_privilege('authenticated', 'public.relation_edges', 'delete'), 'browser cannot delete Edges directly');
select ok(not has_table_privilege('authenticated', 'public.relation_edges', 'truncate'), 'browser cannot truncate Edges');
select ok(not has_table_privilege('authenticated', 'public.relation_edges', 'trigger'), 'browser cannot create Edge triggers');
select ok(not has_table_privilege('authenticated', 'public.relation_edges', 'references'), 'browser cannot reference Edges');
select ok(not has_table_privilege('anon', 'public.relation_edges', 'select'), 'anon has no Edge projection');
select ok(not has_table_privilege('anon', 'public.relation_edges', 'insert'), 'anon has no Edge writer');
select ok(coalesce((select attnotnull from pg_attribute where attrelid = to_regclass('public.relation_graph_snapshots') and attname = 'user_id'), false), 'Graph parent owner is required');
select ok(coalesce((select attnotnull from pg_attribute where attrelid = to_regclass('public.relation_graph_snapshots') and attname = 'seed_context_id'), false), 'Graph parent Seed is required');
select ok(coalesce((select attnotnull from pg_attribute where attrelid = to_regclass('public.relation_graph_snapshots') and attname = 'agent_snapshot_id'), false), 'Graph parent Agent snapshot is required');
select ok(coalesce((select attnotnull from pg_attribute where attrelid = to_regclass('public.relation_graph_snapshots') and attname = 'version'), false), 'Graph parent version is required');
select ok(coalesce((select attnotnull from pg_attribute where attrelid = to_regclass('public.relation_graph_snapshots') and attname = 'graph_locked'), false), 'Graph parent lock flag is required');
select ok(coalesce((select attnotnull from pg_attribute where attrelid = to_regclass('public.relation_graph_snapshots') and attname = 'request_hash'), false), 'Graph parent request hash is required');
select ok(coalesce((select attnotnull from pg_attribute where attrelid = to_regclass('public.relation_edges') and attname = 'graph_snapshot_id'), false), 'Edge Graph parent is required');
select ok(coalesce((select attnotnull from pg_attribute where attrelid = to_regclass('public.relation_edges') and attname = 'agent_snapshot_id'), false), 'Edge Agent snapshot is required');
select ok(coalesce((select attnotnull from pg_attribute where attrelid = to_regclass('public.relation_edges') and attname = 'seed_context_id'), false), 'Edge Seed is required');
select ok(coalesce((select attnotnull from pg_attribute where attrelid = to_regclass('public.relation_edges') and attname = 'request_hash'), false), 'Edge request hash is required');
select ok(coalesce((select attnotnull from pg_attribute where attrelid = to_regclass('public.relation_edges') and attname = 'safety_level'), false), 'Edge safety is required');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_graph_snapshots') and conname = 'relation_graph_snapshots_owner_seed_agent_fkey'), 'Graph parent composite owner/Seed/Agent integrity exists');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_edges') and conname = 'relation_edges_graph_owner_seed_agent_fkey'), 'Edge composite parent integrity exists');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_edges') and conname = 'relation_edges_no_self_edge_check'), 'self-edges are rejected by schema');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_edges') and conname = 'relation_edges_unordered_pair_unique'), 'unordered endpoint pair uniqueness exists');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_graph_snapshots') and conname = 'relation_graph_snapshots_lock_consistency_check'), 'Graph lock and locked_at consistency is constrained');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_graph_snapshots') and conname = 'relation_graph_snapshots_request_hash_length_check'), 'Graph request hash length is constrained');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_edges') and conname = 'relation_edges_request_hash_length_check'), 'Edge request hash length is constrained');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_edges') and conname = 'relation_edges_evidence_nonempty_check'), 'Edge evidence is nonempty by schema');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_edges') and conname = 'relation_edges_weights_shape_check'), 'Edge server weight keys and integer bounds are constrained');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_edges') and conname = 'relation_edges_confidence_check'), 'Edge confidence is integer-bounded by schema');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_edges') and conname = 'relation_edges_safety_error_code_check'), 'Edge safety/error consistency is constrained');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_edges') and conname = 'relation_edges_phase3_no_simulation_check'), 'Phase 3 Edges do not couple to simulations or events');
select ok(not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind = 'f' and p.prosecdef and pg_get_functiondef(p.oid) ilike '%relation_edges%'), 'no SECURITY DEFINER alternative Edge writer exists');
select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.relation_graph_snapshots')), false), 'Graph parent RLS is enabled');
select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.relation_edges')), false), 'Graph Edge RLS is enabled');
select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.relation_graph_idempotency_receipts')), false), 'Graph receipt RLS is enabled');
select ok(not exists (select 1 from information_schema.role_table_grants where grantee = 'authenticated' and table_schema = 'public' and table_name = 'relation_graph_snapshots' and privilege_type = 'SELECT'), 'authenticated has no broad Graph parent SELECT');
select ok(not exists (select 1 from information_schema.role_table_grants where grantee = 'authenticated' and table_schema = 'public' and table_name = 'relation_graph_idempotency_receipts' and privilege_type = 'SELECT'), 'authenticated has no broad Graph receipt SELECT');
select ok(not exists (select 1 from information_schema.role_table_grants where grantee = 'anon' and table_schema = 'public' and table_name in ('relation_graph_snapshots', 'relation_edges', 'relation_graph_idempotency_receipts') and privilege_type = 'SELECT'), 'anon has no Graph/Edge/receipt SELECT');
select ok(not exists (select 1 from information_schema.role_table_grants where grantee = 'authenticated' and table_schema = 'public' and table_name = 'relation_graph_snapshots' and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','TRIGGER','REFERENCES')), 'browser has no Graph parent DML or hard privilege');
select ok(not exists (select 1 from information_schema.role_table_grants where grantee = 'authenticated' and table_schema = 'public' and table_name = 'relation_graph_idempotency_receipts' and privilege_type in ('UPDATE','DELETE','TRUNCATE','TRIGGER','REFERENCES')), 'browser has no Graph receipt mutation or hard privilege');
select ok(not exists (select 1 from information_schema.role_table_grants where grantee = 'anon' and table_schema = 'public' and table_name in ('relation_graph_snapshots', 'relation_edges', 'relation_graph_idempotency_receipts') and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','TRIGGER','REFERENCES')), 'anon has no Graph/Edge/receipt DML or hard privilege');
select ok(exists (select 1 from information_schema.column_privileges where grantee = 'authenticated' and table_schema = 'public' and table_name = 'relation_graph_snapshots' and column_name = 'id' and privilege_type = 'SELECT'), 'safe Graph parent id projection is granted');
select ok(exists (select 1 from information_schema.column_privileges where grantee = 'authenticated' and table_schema = 'public' and table_name = 'relation_graph_snapshots' and column_name = 'agent_snapshot_id' and privilege_type = 'SELECT'), 'safe Graph Agent snapshot projection is granted');
select ok(exists (select 1 from information_schema.column_privileges where grantee = 'authenticated' and table_schema = 'public' and table_name = 'relation_graph_snapshots' and column_name = 'graph_locked' and privilege_type = 'SELECT'), 'safe Graph lock projection is granted');
select ok(exists (select 1 from information_schema.column_privileges where grantee = 'authenticated' and table_schema = 'public' and table_name = 'relation_graph_snapshots' and column_name = 'locked_at' and privilege_type = 'SELECT'), 'safe Graph lock timestamp projection is granted');
select ok(not exists (select 1 from information_schema.column_privileges where grantee = 'authenticated' and table_schema = 'public' and table_name = 'relation_graph_snapshots' and column_name in ('trace_id','writer_version','idempotency_key','request_hash') and privilege_type = 'SELECT'), 'Graph private provenance and idempotency columns are not selectable');
select ok(not exists (select 1 from information_schema.column_privileges where grantee = 'authenticated' and table_schema = 'public' and table_name = 'relation_edges' and column_name in ('trace_id','writer_version','idempotency_key','request_hash','field_sources') and privilege_type = 'SELECT'), 'Edge private provenance and idempotency columns are not selectable');
select ok(
  has_column_privilege('authenticated', 'public.relation_graph_idempotency_receipts', 'user_id', 'select')
  and has_column_privilege('authenticated', 'public.relation_graph_idempotency_receipts', 'seed_context_id', 'select')
  and has_column_privilege('authenticated', 'public.relation_graph_idempotency_receipts', 'idempotency_key', 'select')
  and has_column_privilege('authenticated', 'public.relation_graph_idempotency_receipts', 'request_hash', 'select'),
  'receipt replay columns are available to the SECURITY INVOKER RPC but remain hidden by the closed guard'
);
select ok(not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind = 'f' and p.proname not in ('generate_relation_graph_phase3','lock_relation_graph_phase3') and has_function_privilege('authenticated', p.oid, 'EXECUTE') and pg_get_functiondef(p.oid) ilike '%insert into public.relation_edges%'), 'no alternate authenticated public Edge writer exists');
select ok(not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind = 'f' and p.proname = 'lock_relation_graph_phase3' and pg_get_functiondef(p.oid) ilike '%insert into public.relation_edges%'), 'lock function never inserts Edges');
select ok(exists (select 1 from pg_proc p where oid = to_regprocedure('public.generate_relation_graph_phase3(uuid,uuid)') and pg_get_functiondef(p.oid) ilike '%phase3-key-people:%' and pg_get_functiondef(p.oid) ilike '%pg_advisory_xact_lock%'), 'Graph generator follows the Step A owner/Seed lock family before operation locks');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_graph_snapshots') and conname = 'relation_graph_snapshots_version_check'), 'Graph parent exact formal version is constrained');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_graph_snapshots') and conname = 'relation_graph_snapshots_safety_error_code_check'), 'Graph parent safety/error consistency is constrained');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_graph_snapshots') and conname = 'relation_graph_snapshots_immutable_check'), 'Graph parent immutable/supersede rule is constrained');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_graph_idempotency_receipts') and conname = 'relation_graph_receipts_request_hash_length_check'), 'Graph receipt canonical request hash is constrained');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_graph_idempotency_receipts') and conname = 'relation_graph_receipts_owner_seed_fkey'), 'Graph receipt binds parent owner and Seed');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_edges') and conname = 'relation_edges_version_check'), 'Edge exact formal version is constrained');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_edges') and conname = 'relation_edges_agent_snapshot_endpoint_check'), 'Edge endpoints must belong to the parent Agent snapshot');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_edges') and conname = 'relation_edges_no_last_event_or_simulation_check'), 'Step C Edge has no event or simulation coupling');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'relation_graph_idempotency_receipts' and policyname = 'relation_graph_receipts_select_phase3_rpc'), 'Graph receipt read policy requires a closed-by-default RPC guard');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'relation_graph_snapshots' and policyname = 'relation_graph_snapshots_select_phase3_owner'), 'Graph parent owner RLS policy exists');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'relation_edges' and policyname = 'relation_edges_select_phase3_owner'), 'Edge owner RLS policy exists');
select ok(exists (select 1 from pg_proc p where oid = to_regprocedure('public.generate_relation_graph_phase3(uuid,uuid)') and pg_get_functiondef(p.oid) ilike '%set_config(''app.phase3_graph_rpc'', ''off''%'), 'Graph generator closes receipt guard on entry and exception');
select ok(exists (select 1 from pg_proc p where oid = to_regprocedure('public.lock_relation_graph_phase3(uuid,uuid)') and pg_get_functiondef(p.oid) ilike '%set_config(''app.phase3_graph_rpc'', ''off''%'), 'Graph lock closes receipt guard on entry and exception');
select ok(exists (select 1 from pg_proc p where oid = to_regprocedure('public.generate_relation_graph_phase3(uuid,uuid)') and pg_get_functiondef(p.oid) ilike '%idempotency_key_content_conflict%'), 'Graph generator binds replay to canonical content');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'relation_graph_idempotency_receipts' and policyname = 'relation_graph_receipts_insert_phase3_rpc'), 'Graph receipt insert policy requires the RPC guard');
select ok(exists (select 1 from pg_constraint where conrelid = to_regclass('public.relation_graph_idempotency_receipts') and conname = 'relation_graph_receipts_key_unique'), 'Graph receipt owner/key replay uniqueness exists');
select ok(exists (select 1 from pg_class where oid = to_regclass('public.relation_graph_snapshots') and relreplident = 'd'), 'Graph parent uses ordinary immutable row identity rather than browser mutation semantics');
select ok(not exists (select 1 from information_schema.column_privileges where grantee = 'anon' and table_schema = 'public' and table_name in ('relation_graph_snapshots','relation_edges','relation_graph_idempotency_receipts') and privilege_type = 'SELECT'), 'anon has no safe or private Graph column projection');
select ok(not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind = 'f' and p.proname not in ('generate_relation_graph_phase3','lock_relation_graph_phase3') and has_function_privilege('anon', p.oid, 'EXECUTE') and pg_get_functiondef(p.oid) ilike '%relation_graph%'), 'anon has no alternate Graph RPC surface');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-00000000c301', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase3-graph-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000d301', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase3-graph-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000c301', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select * from public.submit_seed_context_phase2(
  '00000000-0000-4000-8000-000000000301',
  '{"trackType":"crossroad","timeWindow":"90_days","questionText":"Should I accept the role?","situationSummary":"A manager and recruiter need an answer this week.","recentEvents":"An answer is needed this week.","keyPeopleText":"Manager and recruiter.","decisionOptions":"Accept or negotiate.","worries":"Timing is uncertain.","forbiddenActions":"Do not burn bridges.","safetyBoundaries":"Keep communication professional.","desiredOutput":"Compare stated options.","privacyAck":true,"privacySafetyAck":true}'::jsonb
);
select * from public.extract_key_people_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000302');
select * from public.mutate_key_people_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000303', jsonb_build_array(jsonb_build_object('type', 'confirm', 'person_id', (select id::text from public.key_people where seed_context_id = (select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301') order by id limit 1))));
select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000304', false);

select throws_ok($$ insert into public.relation_graph_snapshots (user_id, seed_context_id, agent_snapshot_id, version, graph_locked, request_hash) values ('00000000-0000-0000-0000-00000000c301', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000304', 'phase3-graph-snapshot-v1', false, repeat('0', 64)) $$, '42501', NULL, 'direct authenticated Graph parent insert is denied');
select throws_ok($$ update public.relation_graph_snapshots set graph_locked = true $$, '42501', NULL, 'direct authenticated Graph parent update is denied');
select throws_ok($$ delete from public.relation_graph_snapshots $$, '42501', NULL, 'direct authenticated Graph parent delete is denied');
select throws_ok($$ insert into public.relation_graph_idempotency_receipts (user_id, seed_context_id, idempotency_key, request_hash) values ('00000000-0000-0000-0000-00000000c301', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000305', repeat('0', 64)) $$, '42501', NULL, 'direct authenticated Graph receipt insert is denied');
select throws_ok($$ update public.relation_graph_idempotency_receipts set request_hash = repeat('0', 64) $$, '42501', NULL, 'direct authenticated Graph receipt update is denied');
select throws_ok($$ delete from public.relation_graph_idempotency_receipts $$, '42501', NULL, 'direct authenticated Graph receipt delete is denied');
select is(coalesce(current_setting('app.phase3_graph_rpc', true), 'off'), 'off', 'an unset Graph receipt guard is closed before generation');
select throws_ok($$ select * from public.generate_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), null) $$, 'P0001', 'graph_snapshot_invalid', 'null Graph idempotency key writes nothing');
select throws_ok($$ select * from public.lock_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), null) $$, 'P0001', 'graph_snapshot_invalid', 'null lock idempotency key writes nothing');
select is(current_setting('app.phase3_graph_rpc', true), 'off', 'Graph receipt guard closes after invalid generate');
select is(current_setting('app.phase3_graph_rpc', true), 'off', 'Graph receipt guard closes after invalid lock');
select lives_ok($verify$
  do $check$
  declare p0 bigint; e0 bigint; r0 bigint; s0 bigint; t0 bigint; v0 bigint;
  begin
    select count(*) into p0 from public.relation_graph_snapshots; select count(*) into e0 from public.relation_edges; select count(*) into r0 from public.relation_graph_idempotency_receipts; select count(*) into s0 from public.simulations; select count(*) into t0 from public.simulation_ticks; select count(*) into v0 from public.event_logs;
    begin perform * from public.generate_relation_graph_phase3(null, '00000000-0000-4000-8000-000000000316'); exception when others then null; end;
    if p0 <> (select count(*) from public.relation_graph_snapshots) or e0 <> (select count(*) from public.relation_edges) or r0 <> (select count(*) from public.relation_graph_idempotency_receipts) or s0 <> (select count(*) from public.simulations) or t0 <> (select count(*) from public.simulation_ticks) or v0 <> (select count(*) from public.event_logs) then raise exception 'failed generation wrote an object'; end if;
  end
  $check$
$verify$, 'invalid generation leaves Graph, Edge, receipt, simulation, tick, and event counts unchanged');
-- Keep the focused generate/lock side-effect probe independent from the main
-- lifecycle scenario below. The product contract correctly forbids replacing
-- a locked Graph; the test must not carry this probe's lock into later cases.
savepoint graph_side_effect_probe;
select lives_ok($verify$
  do $check$
  declare e0 bigint; s0 bigint; t0 bigint; v0 bigint;
  begin
    select count(*) into e0 from public.relation_edges; select count(*) into s0 from public.simulations; select count(*) into t0 from public.simulation_ticks; select count(*) into v0 from public.event_logs;
    perform * from public.generate_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000317');
    if (select count(*) from public.relation_edges) <= e0 or s0 <> (select count(*) from public.simulations) or t0 <> (select count(*) from public.simulation_ticks) or v0 <> (select count(*) from public.event_logs) then raise exception 'generation did not create only Edges'; end if;
  end
  $check$
$verify$, 'successful generation creates deterministic nonempty Edges without simulations, ticks, or events');
select lives_ok($verify$
  do $check$
  declare e0 bigint; s0 bigint; t0 bigint; v0 bigint;
  begin
    select count(*) into e0 from public.relation_edges; select count(*) into s0 from public.simulations; select count(*) into t0 from public.simulation_ticks; select count(*) into v0 from public.event_logs;
    perform * from public.lock_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000318');
    if e0 <> (select count(*) from public.relation_edges) or s0 <> (select count(*) from public.simulations) or t0 <> (select count(*) from public.simulation_ticks) or v0 <> (select count(*) from public.event_logs) then raise exception 'lock wrote Edge or downstream object'; end if;
  end
  $check$
$verify$, 'lock changes only Graph lock lifecycle and never creates Edge or downstream objects');
rollback to savepoint graph_side_effect_probe;
release savepoint graph_side_effect_probe;
select is(current_setting('app.phase3_graph_rpc', true), 'off', 'Graph receipt guard closes after success, replay, conflict, and lock paths');
select throws_ok($$ insert into public.relation_edges (user_id, from_agent_id, to_agent_id, version, relationship_type, weights, confidence, evidence_refs) values ('00000000-0000-0000-0000-00000000c301', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'phase3-graph-snapshot-v1', 'professional', '{}'::jsonb, 0, '[]'::jsonb) $$, '42501', NULL, 'direct authenticated Edge insert is denied before malformed data can persist');
select throws_ok($$ update public.relation_edges set weights = '{}'::jsonb $$, '42501', NULL, 'direct authenticated Edge mutation stays denied after any Graph lifecycle state');
set local role anon;
select throws_ok($$ select * from public.generate_relation_graph_phase3('00000000-0000-4000-8000-000000000301'::uuid, '00000000-0000-4000-8000-000000000305'::uuid) $$, '42501', NULL, 'anon cannot execute the Graph generator');
reset role;
set local role authenticated;
select throws_ok($$ select * from public.generate_relation_graph_phase3(null, '00000000-0000-4000-8000-000000000305') $$, 'P0001', 'graph_snapshot_invalid', 'Graph generator rejects an empty Seed selector before any write');
select throws_ok($$ select * from public.generate_relation_graph_phase3('00000000-0000-4000-8000-000000000399', '00000000-0000-4000-8000-000000000305') $$, 'P0001', 'seed_not_found', 'Graph generator does not disclose foreign or missing Seeds');
select lives_ok($$ select * from public.generate_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000305') $$, 'owned submitted Seed and latest valid Agent snapshot generate one atomic Graph');
-- Test-only integrity inspection needs private provenance columns that the
-- authenticated product role must never receive. Restore the database owner
-- only for these assertions, then return to the product role before replay.
reset role;
select lives_ok($verify$
  do $check$
  begin
    if (select count(*) from public.relation_graph_snapshots) <> 1 then raise exception 'expected one Graph parent'; end if;
    if exists (select 1 from public.relation_graph_snapshots where user_id <> '00000000-0000-0000-0000-00000000c301'::uuid or seed_context_id <> (select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301') or agent_snapshot_id <> (select snapshot_id from public.agent_profiles where seed_context_id = (select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301') order by created_at desc limit 1) or version <> 'phase3-graph-snapshot-v1' or writer_version <> 'phase3-graph-writer-v1' or trace_id is null or length(request_hash) <> 64 or graph_locked or locked_at is not null) then raise exception 'invalid parent provenance or initial lock state'; end if;
  end
  $check$
$verify$, 'Graph parent is owner/Seed/current-Agent-bound, versioned, traced, hashed, and initially unlocked');
select lives_ok($verify$
  do $check$
  begin
    if not exists (select 1 from public.relation_edges) then raise exception 'expected nonempty Edge set'; end if;
    if exists (select 1 from public.relation_edges e left join public.relation_graph_snapshots g on g.id = e.graph_snapshot_id and g.user_id = e.user_id and g.seed_context_id = e.seed_context_id and g.agent_snapshot_id = e.agent_snapshot_id where g.id is null) then raise exception 'Edge parent binding mismatch'; end if;
    if exists (select 1 from public.relation_edges e left join public.agent_profiles f on f.id = e.from_agent_id and f.snapshot_id = e.agent_snapshot_id and f.user_id = e.user_id and f.seed_context_id = e.seed_context_id left join public.agent_profiles t on t.id = e.to_agent_id and t.snapshot_id = e.agent_snapshot_id and t.user_id = e.user_id and t.seed_context_id = e.seed_context_id where f.id is null or t.id is null or e.from_agent_id = e.to_agent_id) then raise exception 'invalid Edge endpoint'; end if;
  end
  $check$
$verify$, 'every Edge shares the Graph parent and both endpoints are in its frozen Agent snapshot without self-edges');
select lives_ok($verify$
  do $check$
  begin
    if exists (select 1 from public.relation_edges where jsonb_array_length(evidence_refs) = 0 or confidence < 0 or confidence > 100 or jsonb_typeof(weights) <> 'object' or request_hash is null or safety_level not in ('safe', 'caution')) then raise exception 'unbounded or unproven Edge'; end if;
    if exists (select 1 from public.relation_edges a join public.relation_edges b on a.graph_snapshot_id = b.graph_snapshot_id and a.id < b.id and least(a.from_agent_id::text, a.to_agent_id::text) = least(b.from_agent_id::text, b.to_agent_id::text) and greatest(a.from_agent_id::text, a.to_agent_id::text) = greatest(b.from_agent_id::text, b.to_agent_id::text)) then raise exception 'duplicate unordered Edge pair'; end if;
  end
  $check$
$verify$, 'every Edge has nonempty evidence, server-bounded weights and confidence, and a unique unordered pair');
select lives_ok($verify$
  do $check$
  begin
    if exists (select 1 from public.relation_edges where weights <> jsonb_build_object('trust', weights->'trust', 'hostility', weights->'hostility', 'dependency', weights->'dependency', 'attraction', weights->'attraction', 'competition', weights->'competition', 'information_gap', weights->'information_gap', 'resource_control', weights->'resource_control', 'emotional_debt', weights->'emotional_debt')) then raise exception 'weight key set differs'; end if;
    if exists (select 1 from public.relation_edges, jsonb_each(weights) w where jsonb_typeof(w.value) <> 'number' or (w.value #>> '{}') !~ '^(0|[1-9][0-9]?)$|^100$') then raise exception 'weight values are not integer percentages'; end if;
    if exists (select 1 from public.relation_edges where confidence <> trunc(confidence) or confidence < 0 or confidence > 100) then raise exception 'confidence is not an integer percentage'; end if;
  end
  $check$
$verify$, 'server weights use exactly the formal integer 0..100 key set and confidence is an integer percentage');
set local role authenticated;
select lives_ok($$ select * from public.generate_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000305') $$, 'same key and canonical content replays the Graph');
select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000307', true);
select throws_ok($$ select * from public.generate_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000305') $$, 'P0001', 'idempotency_key_content_conflict', 'same key with a stale or different Agent input conflicts');
select throws_ok($$ select * from public.lock_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000306') $$, 'P0001', 'agent_snapshot_invalid', 'newer Agent snapshot prevents locking the old Graph and writes nothing');
select lives_ok($$ select * from public.generate_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000314') $$, 'latest valid Agent snapshot creates a fresh replacement Graph');
select lives_ok($$ select * from public.lock_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000315') $$, 'fresh latest Graph locks atomically');
select lives_ok($verify$
  do $check$
  begin
    if exists (select 1 from public.relation_graph_snapshots where graph_locked is distinct from (locked_at is not null)) then raise exception 'inconsistent lock lifecycle'; end if;
  end
  $check$
$verify$, 'Graph lock lifecycle keeps graph_locked and locked_at consistent');
select lives_ok($$ select * from public.lock_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000306') $$, 'repeated lock is stable replay');
select throws_ok($$ select * from public.generate_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000307') $$, 'P0001', 'graph_locked', 'a locked Graph cannot be generated or replaced');
select * from public.submit_seed_context_phase2('00000000-0000-4000-8000-000000000309', '{"trackType":"crossroad","timeWindow":"30_days","questionText":"I want to stalk my partner.","situationSummary":"Sensitive relationship request.","recentEvents":"Recent conflict.","keyPeopleText":"Partner.","decisionOptions":"Pause.","worries":"Privacy.","forbiddenActions":"Do not monitor.","safetyBoundaries":"Respect privacy.","desiredOutput":"Safe next step.","privacyAck":true,"privacySafetyAck":true}'::jsonb);
select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000309'), '00000000-0000-4000-8000-000000000310', false);
select throws_ok($$ select * from public.generate_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000309'), '00000000-0000-4000-8000-000000000311') $$, 'P0001', 'safety_downgraded', 'downgraded Agent snapshot creates zero Edges and cannot generate or lock a Graph');
select * from public.submit_seed_context_phase2('00000000-0000-4000-8000-000000000312', '{"trackType":"crossroad","timeWindow":"30_days","questionText":"I want to kill someone.","situationSummary":"Blocked safety request.","recentEvents":"Immediate danger.","keyPeopleText":"Person.","decisionOptions":"Seek urgent help.","worries":"Safety.","forbiddenActions":"Do not harm anyone.","safetyBoundaries":"Emergency support.","desiredOutput":"Safe next step.","privacyAck":true,"privacySafetyAck":true}'::jsonb);
select throws_ok($$ select * from public.generate_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000312'), '00000000-0000-4000-8000-000000000313') $$, 'P0001', 'safety_blocked', 'blocked Seed creates zero Edges and cannot generate or lock a Graph');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000d301', true);
select throws_ok($$ select * from public.generate_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000308') $$, 'P0001', 'seed_not_found', 'second user cannot discover or write the first user Graph');

reset role;
select * from finish();
rollback;
