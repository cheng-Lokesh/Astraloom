begin;

create extension if not exists pgtap with schema extensions;
select plan(11);

select has_column('public', 'reality_profiles', 'life_model_domains', 'long-horizon life-model domains are persisted');
select ok(has_column_privilege('authenticated', 'public.reality_profiles', 'life_model_domains', 'select'), 'authenticated can read life-model domains');
select ok(has_column_privilege('authenticated', 'public.reality_profiles', 'life_model_domains', 'insert'), 'authenticated can insert life-model domains');
select ok(has_column_privilege('authenticated', 'public.reality_profiles', 'life_model_domains', 'update'), 'authenticated can update life-model domains');
select ok(not has_column_privilege('anon', 'public.reality_profiles', 'life_model_domains', 'select'), 'anonymous users cannot read life-model domains');
select ok(has_function_privilege('authenticated', 'public.is_valid_reality_profile_life_model_domains(jsonb)', 'execute'), 'authenticated writes can execute the life-model validator');
select ok(not has_function_privilege('anon', 'public.is_valid_reality_profile_life_model_domains(jsonb)', 'execute'), 'anonymous users cannot execute the life-model validator');

select ok(public.is_valid_reality_profile_life_model_domains(
  '{"version":1,"identity":[{"value":"Caregiver","classification":"fact","evidenceSummary":"User confirmed"}],"career":[{"value":"Management path","classification":"assumption","evidenceSummary":"Needs review"}],"wealth":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"relationships":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"environment":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"lifeStage":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}]}'::jsonb
), 'classified life-model domains are accepted');
select ok(not public.is_valid_reality_profile_life_model_domains(
  '{"version":1,"identity":[{"value":"owner@example.test","classification":"fact","evidenceSummary":"User confirmed"}],"career":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"wealth":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"relationships":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"environment":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"lifeStage":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}]}'::jsonb
), 'unsafe email addresses are rejected');
select ok(not public.is_valid_reality_profile_life_model_domains(
  '{"version":1,"identity":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"career":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"wealth":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"relationships":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"environment":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"lifeStage":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"privatePayload":"not allowed"}'::jsonb
), 'unknown root fields are rejected');
select ok(not public.is_valid_reality_profile_life_model_domains(
  '{"version":1,"identity":[{"value":"not empty","classification":"unknown","evidenceSummary":"明确未知"}],"career":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"wealth":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"relationships":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"environment":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}],"lifeStage":[{"value":"","classification":"unknown","evidenceSummary":"明确未知"}]}'::jsonb
), 'unknown domain entries cannot carry a value');

select * from finish();
rollback;
