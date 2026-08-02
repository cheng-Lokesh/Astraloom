begin;

create extension if not exists pgtap with schema extensions;
select plan(47);

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

select throws_ok($$ select * from public.generate_relation_graph_phase3(null, '00000000-0000-4000-8000-000000000305') $$, 'P0001', 'graph_snapshot_invalid', 'Graph generator rejects an empty Seed selector before any write');
select throws_ok($$ select * from public.generate_relation_graph_phase3('00000000-0000-4000-8000-000000000399', '00000000-0000-4000-8000-000000000305') $$, 'P0001', 'seed_not_found', 'Graph generator does not disclose foreign or missing Seeds');
select lives_ok($$ select * from public.generate_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000305') $$, 'owned submitted Seed and latest valid Agent snapshot generate one atomic Graph');
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
select lives_ok($$ select * from public.generate_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000305') $$, 'same key and canonical content replays the Graph');
select * from public.generate_agent_snapshot_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000307', true);
select throws_ok($$ select * from public.generate_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000305') $$, 'P0001', 'idempotency_key_content_conflict', 'same key with a stale or different Agent input conflicts');
select lives_ok($$ select * from public.lock_relation_graph_phase3((select id from public.seed_contexts where submission_key = '00000000-0000-4000-8000-000000000301'), '00000000-0000-4000-8000-000000000306') $$, 'complete safe Graph locks atomically');
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
