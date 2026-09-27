begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

select has_table('public', 'reality_profiles', 'Reality Profile table exists');
select has_index('public', 'reality_profiles', 'reality_profiles_owner_seed_idx', 'owner and current-seed index exists');
select ok(not has_table_privilege('anon', 'public.reality_profiles', 'select'), 'anon cannot read profiles');
select ok(not has_table_privilege('anon', 'public.reality_profiles', 'insert'), 'anon cannot insert profiles');
select ok(has_table_privilege('authenticated', 'public.reality_profiles', 'select'), 'authenticated can use product-safe reads');
select ok(has_table_privilege('authenticated', 'public.reality_profiles', 'update'), 'authenticated can update own profile through RLS');
select policies_are('public', 'reality_profiles', array['reality_profiles_insert_own', 'reality_profiles_select_own', 'reality_profiles_update_own'], 'only owner-scoped Reality Profile policies exist');
select ok((select relrowsecurity from pg_class where oid = 'public.reality_profiles'::regclass), 'RLS is enabled');

select * from finish();
rollback;
