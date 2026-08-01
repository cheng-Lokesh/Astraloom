begin;

create extension if not exists pgtap with schema extensions;
select plan(22);

select has_table('public', 'agent_profile_snapshots', 'immutable Agent snapshot parent exists');
select has_table('public', 'agent_snapshot_idempotency_receipts', 'Agent receipt ledger exists');
select has_column('public', 'agent_profiles', 'snapshot_id', 'Agent rows belong to an explicit snapshot');
select has_column('public', 'agent_profiles', 'field_sources', 'Agent rows retain field provenance');
select has_column('public', 'agent_profiles', 'writer_version', 'Agent rows retain writer version');
select has_column('public', 'agent_profiles', 'safety_level', 'Agent rows retain persisted safety result');
select has_type('public', 'phase3_agent_type', 'formal Agent enum exists');
select enum_has_labels('public', 'phase3_agent_type', array['user_core', 'user_variant', 'npc'], 'formal Agent enum excludes local UI labels');
select has_function('public', 'generate_agent_snapshot_phase3', array['uuid', 'uuid', 'boolean'], 'single controlled Agent writer exists');
select function_is_security_invoker('public', 'generate_agent_snapshot_phase3', array['uuid', 'uuid', 'boolean'], 'writer is SECURITY INVOKER');
select function_has_configuration('public', 'generate_agent_snapshot_phase3', array['uuid', 'uuid', 'boolean'], 'search_path', 'public, extensions', 'writer fixes search path');
select function_privs_are('public', 'generate_agent_snapshot_phase3', array['uuid', 'uuid', 'boolean'], 'anon', array[]::text[], 'anon cannot execute writer');
select function_privs_are('public', 'generate_agent_snapshot_phase3', array['uuid', 'uuid', 'boolean'], 'authenticated', array['EXECUTE'], 'authenticated alone can execute writer');
select table_privs_are('public', 'agent_profiles', 'anon', array[]::text[], 'anon has no Agent table privileges');
select table_privs_are('public', 'relation_edges', 'anon', array[]::text[], 'anon has no Edge table privileges');
select table_privs_are('public', 'agent_profiles', 'authenticated', array['SELECT'], 'authenticated cannot directly mutate Agent rows');
select table_privs_are('public', 'relation_edges', 'authenticated', array['SELECT'], 'authenticated has owner-safe Edge read only');
select col_privs_are('public', 'agent_profiles', 'authenticated', 'trace_id', array[]::text[], 'trace stays off the Data API');
select col_privs_are('public', 'agent_profiles', 'authenticated', 'field_sources', array[]::text[], 'field provenance stays off the Data API');
select col_privs_are('public', 'agent_profiles', 'authenticated', 'idempotency_key', array[]::text[], 'idempotency key stays off the Data API');
select col_privs_are('public', 'agent_profiles', 'authenticated', 'writer_version', array[]::text[], 'writer metadata stays off the Data API');
select ok(not has_function_privilege('anon', 'public.generate_agent_snapshot_phase3(uuid,uuid,boolean)', 'EXECUTE'), 'anon cannot invoke Agent generation');

select * from finish();
rollback;
