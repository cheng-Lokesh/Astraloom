begin;

create extension if not exists pgtap with schema extensions;
select plan(17);

select has_column('public', 'reality_profiles', 'world_model_inputs', 'structured World Model inputs are persisted');
select ok(has_column_privilege('authenticated', 'public.reality_profiles', 'world_model_inputs', 'select'), 'authenticated can read the structured inputs');
select ok(has_column_privilege('authenticated', 'public.reality_profiles', 'world_model_inputs', 'insert'), 'authenticated can insert the structured inputs');
select ok(has_column_privilege('authenticated', 'public.reality_profiles', 'world_model_inputs', 'update'), 'authenticated can update the structured inputs');
select ok(not has_column_privilege('anon', 'public.reality_profiles', 'world_model_inputs', 'select'), 'anonymous users cannot read structured inputs');
select ok(has_function_privilege('authenticated', 'public.is_valid_reality_profile_world_inputs(jsonb)', 'execute'), 'authenticated writes can execute the structured input validator');
select ok(not has_function_privilege('anon', 'public.is_valid_reality_profile_world_inputs(jsonb)', 'execute'), 'anonymous users cannot execute the structured input validator');

select ok(public.is_valid_reality_profile_world_inputs(
  '{"version":1,"resources":[{"key":"weekly-focus","label":"Weekly focus time","resourceType":"time","available":8,"unit":"hours","minimum":2,"maximum":8,"usePerTick":2,"classification":"assumption","evidenceSummary":"User selected simulation parameter"}],"constraints":[{"key":"focus-deadline","label":"Focus deadline","resourceKey":"weekly-focus","rule":{"kind":"before_time","value":"2026-10-01T00:00:00.000Z"},"classification":"fact","evidenceSummary":"User confirmed date"}]}'::jsonb
), 'valid bounded resources and referenced deadlines are accepted');
select ok(public.is_valid_reality_profile_world_inputs('{"version":1,"resources":[],"constraints":[]}'::jsonb), 'an explicitly unmodeled legacy profile remains valid');
select ok(not public.is_valid_reality_profile_world_inputs(
  '{"version":1,"unexpected":"not validated","resources":[],"constraints":[]}'::jsonb
), 'unknown root fields are rejected');
select ok(not public.is_valid_reality_profile_world_inputs(
  '{"version":1,"resources":[{"key":"weekly-focus","label":"Weekly focus time","resourceType":"time","available":8,"unit":"hours","minimum":2,"maximum":8,"usePerTick":2,"classification":"assumption","evidenceSummary":"User selected simulation parameter","privatePayload":"not allowed"}],"constraints":[]}'::jsonb
), 'unknown resource fields are rejected');
select ok(not public.is_valid_reality_profile_world_inputs(
  '{"version":1,"resources":[{"key":"weekly-focus","label":"Weekly focus time","resourceType":"time","available":1,"unit":"hours","minimum":2,"maximum":8,"usePerTick":0.5,"classification":"fact","evidenceSummary":"User confirmed measure"}],"constraints":[]}'::jsonb
), 'a resource cannot start below its reserved minimum');
select ok(not public.is_valid_reality_profile_world_inputs(
  '{"version":1,"resources":[{"key":"weekly-focus","label":"Weekly focus time","resourceType":"time","available":4,"unit":"hours","minimum":2,"maximum":8,"usePerTick":3,"classification":"fact","evidenceSummary":"User confirmed measure"}],"constraints":[]}'::jsonb
), 'a per-action change cannot consume the declared reserve');
select ok(not public.is_valid_reality_profile_world_inputs(
  '{"version":1,"resources":[{"key":"weekly-focus","label":"Weekly focus time","resourceType":"time","available":8,"unit":"hours","minimum":2,"maximum":8,"usePerTick":1,"classification":"fact","evidenceSummary":"User confirmed measure"}],"constraints":[{"key":"focus-deadline","label":"Focus deadline","resourceKey":"missing-resource","rule":{"kind":"before_time","value":"2026-10-01T00:00:00.000Z"},"classification":"fact","evidenceSummary":"User confirmed date"}]}'::jsonb
), 'constraints cannot reference missing resources');
select ok(not public.is_valid_reality_profile_world_inputs(
  '{"version":1,"resources":[{"key":"weekly-focus","label":"Weekly focus time","resourceType":"time","available":8,"unit":"hours","minimum":2,"maximum":8,"usePerTick":1,"classification":"fact","evidenceSummary":"User confirmed measure"}],"constraints":[{"key":"focus-deadline","label":"Focus deadline","resourceKey":"weekly-focus","rule":{"kind":"before_time","value":"not-a-date"},"classification":"fact","evidenceSummary":"User confirmed date"}]}'::jsonb
), 'deadline rules require a valid timezone-aware timestamp');
select ok(not public.is_valid_reality_profile_world_inputs(
  '{"version":1,"resources":[{"key":"weekly-focus","label":"owner@example.test","resourceType":"time","available":8,"unit":"hours","minimum":2,"maximum":8,"usePerTick":1,"classification":"fact","evidenceSummary":"User confirmed measure"}],"constraints":[]}'::jsonb
), 'structured labels reject email addresses');
select ok(not public.is_valid_reality_profile_world_inputs(
  '{"version":1,"resources":[{"key":"weekly-focus","label":"Weekly focus time","resourceType":"time","available":8,"unit":"hours","minimum":2,"maximum":8,"usePerTick":1,"classification":"fact","evidenceSummary":"User confirmed measure"},{"key":"weekly-focus","label":"Other resource","resourceType":"budget","available":10,"unit":"dollars","minimum":0,"maximum":10,"usePerTick":1,"classification":"fact","evidenceSummary":"User confirmed amount"}],"constraints":[]}'::jsonb
), 'resource keys must be unique');

select * from finish();
rollback;
