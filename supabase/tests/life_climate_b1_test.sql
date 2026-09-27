begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select has_table('public', 'life_climate_runs', 'Track B runs have a dedicated immutable ledger');
select has_function('public', 'persist_life_climate_run_b1', array['uuid','uuid','integer','uuid','jsonb','jsonb','text'], 'Track B runs use one versioned server-side writer');

select * from finish();
rollback;
