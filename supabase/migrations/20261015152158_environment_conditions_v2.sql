begin;
-- Dedicated ASCII protocol for the two original profile collections. Keep the
-- established v1 core-ID helper and its supported kinds/input boundary unchanged.
create function public.formal_environment_core_variable_id_v2(p_namespace text,p_source_key text)
returns text language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare first bigint:=2166136261; second bigint:=2246822519; content text:=p_namespace||':world_variable:'||p_source_key; code integer; i integer;
begin
 if p_namespace is null or p_source_key is null or p_namespace!~'^formal-[a-f0-9]{24}$' or p_source_key!~'^(pressures|externalVariables)\.[1-8]$' then return null; end if;
 for i in 1..length(content) loop
  code:=ascii(substr(content,i,1));
  first:=mod(((first # code::bigint)::numeric*16777619),4294967296)::bigint;
  second:=mod(((second # code::bigint)::numeric*3266489917),4294967296)::bigint;
 end loop;
 return 'world_variable_v2_'||public.formal_planning_base36_v1(first)||public.formal_planning_base36_v1(second);
end; $$;
revoke all on function public.formal_environment_core_variable_id_v2(text,text) from public,anon,authenticated,service_role;
grant execute on function public.formal_environment_core_variable_id_v2(text,text) to authenticated;

create function public.formal_environment_bundle_valid_v2(p_bundle jsonb,p_source jsonb,p_start timestamptz,p_horizon integer)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare rules jsonb:=p_bundle#>'{inputSnapshot,digitalLifeModel,rules}'; model jsonb:=p_bundle#>'{inputSnapshot,digitalLifeModel}'; path_key text:=p_bundle#>>'{inputSnapshot,activePathKey}';
 variables jsonb; expected_variables jsonb; spec jsonb; v jsonb; rule jsonb; e jsonb; trajectory jsonb; world jsonb; frame jsonb; delta jsonb; causal jsonb; expected_events jsonb;
 namespace text:='formal-'||coalesce(p_bundle->>'policyFingerprint',p_bundle->>'causalFingerprint'); sample_namespace text; raw_key text; variable_id text; baseline jsonb; expected_value jsonb; allowed jsonb; provenance jsonb; rule_event jsonb; prior_event jsonb; previous_rule jsonb; core_key text; expected_actor text; i integer; ticks integer:=case when p_horizon=30 then 3 else 6 end;
begin
 if model->>'version' is distinct from 'digital-life-model-v2' or public.formal_environment_rules_valid_v2(p_source,rules,p_horizon) is not true
  or p_bundle->>'causalFingerprint' is distinct from left(encode(extensions.digest(convert_to(public.formal_relationship_canonical_json_v1(p_bundle->'inputSnapshot'),'UTF8'),'sha256'),'hex'),24)
  or rules is distinct from public.formal_relationship_effective_rules_v1(p_source)
  or model->'ownerId' is distinct from p_source#>'{relation_graph_snapshots,user_id}'
  or model->'seedContextId' is distinct from p_source#>'{relation_graph_snapshots,seed_context_id}'
  or model->'graphSnapshotId' is distinct from rules->'graphSnapshotId' or model->'agentSnapshotId' is distinct from rules->'agentSnapshotId' or model->'profileRevision' is distinct from rules->'profileRevision'
  or jsonb_typeof(model->'background') is distinct from 'array' or jsonb_array_length(model->'background')<14
  or exists(select 1 from jsonb_array_elements(model->'background') b where b->>'usage' is distinct from 'background_only')
  or jsonb_typeof(p_bundle#>'{trajectoryAnalysis,trajectories}') is distinct from 'array' or jsonb_array_length(p_bundle#>'{trajectoryAnalysis,trajectories}')<>3
  or jsonb_typeof(p_bundle->'worldSnapshots') is distinct from 'array' or jsonb_array_length(p_bundle->'worldSnapshots')<>3 then return false; end if;
 select 'person-'||ord::text into core_key from jsonb_array_elements(p_source->'agent_profiles') with ordinality t(a,ord) where a->>'agent_type'='user_core';
 expected_actor:=case when path_key='main' then core_key else path_key end;
 if expected_actor is null or (path_key<>'main' and not exists(select 1 from jsonb_array_elements(rules->'strategies') s where s->>'participantKey'=path_key)) then return false; end if;
 variables:=public.digital_life_model_draft_safe_context_v2(p_source)#>'{modelContext,variables}';
 frame:=jsonb_build_object('authorization',jsonb_build_object('pathKey',path_key),'effectiveRulesSignature',rules::text,'ruleBindings',jsonb_build_object(
  'agents',(select jsonb_agg(jsonb_build_object('key','person-'||ord::text,'sourceOrdinal',ord,'sourceAgentId',a->'id','role',a->'agent_type') order by ord) from jsonb_array_elements(p_source->'agent_profiles') with ordinality t(a,ord)),
  'relations',(select jsonb_agg(jsonb_build_object('key','relation-'||ord::text,'sourceEdgeId',a->'id') order by ord) from jsonb_array_elements(p_source->'relation_edges') with ordinality t(a,ord)),
  'resources',coalesce((select jsonb_agg(jsonb_build_object('key','resource-'||ord::text,'profileResourceKey',a->'key') order by ord) from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,resources}','[]')) with ordinality t(a,ord)),'[]')));
 select coalesce(jsonb_agg(e.value||jsonb_build_object('branchId',t.value->'trajectoryId','tickIndex',e.event_order-1) order by t.trajectory_order,e.event_order),'[]') into expected_events
 from jsonb_array_elements(p_bundle#>'{trajectoryAnalysis,trajectories}') with ordinality t(value,trajectory_order)
 cross join lateral jsonb_array_elements(t.value#>'{finalWorld,worldEvents}') with ordinality e(value,event_order);
 if p_bundle->'events' is distinct from expected_events then return false; end if;
 for trajectory,i in select value,ord::integer-1 from jsonb_array_elements(p_bundle#>'{trajectoryAnalysis,trajectories}') with ordinality t(value,ord) loop
  world:=p_bundle->'worldSnapshots'->i;
  sample_namespace:='formal_'||coalesce(p_bundle->>'policyFingerprint',p_bundle->>'causalFingerprint')||'_'||(trajectory->>'trajectorySeed');
  if world is distinct from trajectory->'finalWorld' or trajectory->'trajectorySeed' is distinct from to_jsonb((p_bundle#>>'{inputSnapshot,deterministicSeed}')::integer+i)
   or world->'seedContextId' is distinct from p_source#>'{relation_graph_snapshots,seed_context_id}'
   or jsonb_typeof(world->'externalVariables') is distinct from 'array' or jsonb_array_length(world->'externalVariables')<>jsonb_array_length(variables)
   or (select count(distinct value->>'id') from jsonb_array_elements(world->'externalVariables'))<>jsonb_array_length(variables)
   or (select count(distinct value->>'proposalId') from jsonb_array_elements(world->'worldEvents'))<>jsonb_array_length(world->'worldEvents') then return false; end if;
  for spec in select value from jsonb_array_elements(variables) loop
   raw_key:=case when spec->>'category'='pressure' then 'pressures.'||substring(spec->>'key' from 10) else 'externalVariables.'||substring(spec->>'key' from 19) end;
   variable_id:=public.formal_environment_core_variable_id_v2(namespace,raw_key);
   select value into v from jsonb_array_elements(world->'externalVariables') where value->>'id'=variable_id;
   select value into rule from jsonb_array_elements(rules->'actions') where value->>'pathKey'=path_key and value#>>'{operation,actionType}'='update_external_variable' and value#>'{operation,variableKey}'=spec->'key';
   baseline:=spec->'value'; allowed:=jsonb_build_array(baseline)||case when rule is null then '[]'::jsonb else jsonb_build_array(rule#>'{operation,value}') end;
   rule_event:=null;
   if rule is not null then select value into rule_event from jsonb_array_elements(world->'worldEvents') where value->>'proposalId' ~ ('^action_proposal_v2_'||sample_namespace||'_[0-5]_'||(rule->>'key')||'$'); end if;
   expected_value:=case when rule_event is null then baseline else rule#>'{operation,value}' end;
   if v is null or v->>'variableType' is distinct from 'enum' or v->'key' is distinct from spec->'key' or v->'allowedValues' is distinct from allowed or v->'value' is distinct from expected_value
    or v->'seedContextId' is distinct from world->'seedContextId' or v->'provisional' is distinct from to_jsonb(spec->>'classification'='assumption')
    or v#>'{provenance,visible}' is distinct from 'true'::jsonb or v#>'{provenance,provisional}' is distinct from v->'provisional' then return false; end if;
   if spec->>'classification'='fact' then
    select value into provenance from jsonb_array_elements(world#>'{realityBoundarySnapshot,evidenceLedger,items}') where value->>'claimKey'='reality.profile.'||lower(raw_key);
    if provenance is null or v#>'{provenance,realEvidenceIds}' is distinct from jsonb_build_array(provenance->'id') or v#>'{provenance,assumptionIds}' is distinct from '[]'::jsonb
     or provenance->'seedContextId' is distinct from world->'seedContextId' or provenance->>'statement' is distinct from (spec->>'label')||'：'||(spec->>'value')
     or not provenance->'limitations' @> jsonb_build_array('User-supplied basis: '||(spec->>'evidenceSummary'))
     or not exists(select 1 from jsonb_array_elements(provenance->'provenance') p where p->>'sourceRef'='reality_profile:'||coalesce(p_source#>>'{reality_profiles,id}','absent')||':revision:'||coalesce(p_source#>>'{reality_profiles,revision}','0')||':'||raw_key and (p->>'capturedAt')::timestamptz=(p_bundle#>>'{sourceBoundary,updatedAt}')::timestamptz) then return false; end if;
   else
    select value into provenance from jsonb_array_elements(world#>'{realityBoundarySnapshot,assumptionLedger,assumptions}') where value->>'category'='reality_profile_'||raw_key;
    if provenance is null or provenance->>'subjectType' is distinct from 'unknown' or provenance->>'statement' is distinct from spec->>'value'
     or provenance->>'confirmationStatus' is distinct from 'confirmed' or provenance->>'epistemicStatus' is distinct from 'confirmed_for_simulation'
     or not provenance->'limitations' @> jsonb_build_array('User designated this as an assumption: '||(spec->>'evidenceSummary'))
     or v#>'{provenance,assumptionIds}' is distinct from jsonb_build_array(provenance->'id') or v#>'{provenance,realEvidenceIds}' is distinct from '[]'::jsonb then return false; end if;
   end if;
   if rule_event is not null then
    if rule->>'actorKey' is distinct from expected_actor or public.formal_relationship_rule_event_valid_v1(rule,frame,world,sample_namespace,namespace,p_start,ticks) is not true
     or rule_event->'deltas' is distinct from jsonb_build_array(jsonb_build_object('path','externalVariables.'||variable_id||'.value','valueType','variable','before',baseline,'after',rule#>'{operation,value}')) then return false; end if;
   end if;
   if exists(select 1 from jsonb_array_elements(world->'worldEvents') e where e#>>'{operation,actionType}'='update_external_variable' and e#>>'{operation,variableId}'=variable_id and (rule_event is null or e->'id' is distinct from rule_event->'id')) then return false; end if;
  end loop;
  for e in select value from jsonb_array_elements(world->'worldEvents') loop
   if e#>>'{operation,actionType}'='update_external_variable' and not exists(select 1 from jsonb_array_elements(world->'externalVariables') v where v->'id'=e#>'{operation,variableId}') then return false; end if;
   select value into rule from jsonb_array_elements(rules->'actions') where value->>'pathKey'=path_key and e->>'proposalId' ~ ('^action_proposal_v2_'||sample_namespace||'_[0-5]_'||(value->>'key')||'$');
   if rule is not null and rule#>>'{when,kind}'='after_rule' then
    select value into previous_rule from jsonb_array_elements(rules->'actions') where value->'key'=rule#>'{when,ruleKey}';
    if previous_rule#>>'{operation,actionType}'='update_external_variable' and public.formal_relationship_rule_event_valid_v1(rule,frame,world,sample_namespace,namespace,p_start,ticks) is not true then return false; end if;
   end if;
  end loop;
 end loop;
 return true;
exception when others then return false;
end; $$;

alter function public.formal_run_bundle_matches_reservation(jsonb,jsonb,timestamptz,timestamptz,integer) rename to formal_run_bundle_matches_reservation_before_environment_v2;
create function public.formal_run_bundle_matches_reservation(p_bundle jsonb,p_source jsonb,p_accepted timestamptz,p_start timestamptz,p_horizon integer)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if public.formal_run_bundle_matches_reservation_before_environment_v2(p_bundle,p_source,p_accepted,p_start,p_horizon) is not true then return false; end if;
 if p_source#>>'{digital_life_rules,version}'='digital-life-rules-v2' then return public.formal_environment_bundle_valid_v2(p_bundle,p_source,p_start,p_horizon); end if;
 return p_bundle#>>'{inputSnapshot,digitalLifeModel,version}' is distinct from 'digital-life-model-v2';
exception when others then return false;
end; $$;
-- Environment events share the existing recursive controlled-event boundary.
alter function public.formal_relationship_rule_event_valid_v1(jsonb,jsonb,jsonb,text,text,timestamptz,integer,text[]) rename to formal_relationship_rule_event_valid_before_environment_v2;
create function public.formal_relationship_rule_event_valid_v1(p_rule jsonb,p_frame jsonb,p_world jsonb,p_namespace text,p_world_namespace text,p_start timestamptz,p_ticks integer,p_seen text[] default array[]::text[])
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare e jsonb; actor_source jsonb; actor jsonb; evidence jsonb; assumption jsonb; variable_id text; actor_id text; entity_id text; tick integer; expected_at timestamptz; previous_rule jsonb; previous jsonb; event_index integer; previous_index integer; raw_key text;
begin
 if p_rule#>>'{operation,actionType}' is distinct from 'update_external_variable' then return public.formal_relationship_rule_event_valid_before_environment_v2(p_rule,p_frame,p_world,p_namespace,p_world_namespace,p_start,p_ticks,p_seen); end if;
 if p_rule->>'key'=any(p_seen) or p_rule->'pathKey' is distinct from p_frame#>'{authorization,pathKey}' then return false; end if;
 select value,ord::integer into e,event_index from jsonb_array_elements(p_world->'worldEvents') with ordinality t(value,ord) where value->>'proposalId' ~ ('^action_proposal_v2_'||p_namespace||'_[0-5]_'||(p_rule->>'key')||'$');
 if e is null then return false; end if;
 tick:=(regexp_match(e->>'proposalId','_([0-5])_rule-[1-9][0-9]*$'))[1]::integer;
 expected_at:=p_start+tick*(case when p_ticks=3 then 10 else 15 end)*interval '1 day';
 select value into actor_source from jsonb_array_elements(p_frame#>'{ruleBindings,agents}') where value->'key'=p_rule->'actorKey';
 actor_id:=public.formal_planning_core_id_v1('agent_definition',p_world_namespace,actor_source->>'sourceAgentId');
 entity_id:=public.formal_planning_core_id_v1('world_entity',p_world_namespace,actor_source->>'sourceAgentId');
 raw_key:=case when p_rule#>>'{operation,variableKey}' like 'pressure-%' then 'pressures.'||substring(p_rule#>>'{operation,variableKey}' from 10) else 'externalVariables.'||substring(p_rule#>>'{operation,variableKey}' from 19) end;
 variable_id:=public.formal_environment_core_variable_id_v2(p_world_namespace,raw_key);
 select value into actor from jsonb_array_elements(p_world->'agentDefinitions') where value->>'id'=actor_id;
 select value into evidence from jsonb_array_elements(p_world#>'{realityBoundarySnapshot,evidenceLedger,items}') where value->>'claimKey'='formal.agent.'||(actor_source->>'sourceOrdinal');
 select value into assumption from jsonb_array_elements(p_world#>'{realityBoundarySnapshot,assumptionLedger,assumptions}') where value->>'category'='digital_life_rule_'||(p_rule->>'key');
 if actor is null or actor->>'actorType' is distinct from 'self' or evidence is null or assumption is null
  or actor_source->>'role' not in ('user_core','user_variant') or not actor->'realEvidenceIds' @> jsonb_build_array(evidence->'id')
  or not exists(select 1 from jsonb_array_elements(evidence->'provenance') p where p->>'sourceRef'='agent_snapshot:'||((p_frame->>'effectiveRulesSignature')::jsonb->>'agentSnapshotId')||':'||(actor_source->>'sourceAgentId') and (p->>'capturedAt')::timestamptz=(p_world#>>'{realityBoundarySnapshot,updatedAt}')::timestamptz)
  or e->>'actorId' is distinct from actor_id or tick>=p_ticks
  or e->'operation' is distinct from jsonb_build_object('actionType','update_external_variable','variableId',variable_id,'value',p_rule#>'{operation,value}')
  or e->>'eventType' is distinct from 'update_external_variable'
  or e->'targetEntityIds' is distinct from jsonb_build_array(entity_id) or e->'targetVariableIds' is distinct from jsonb_build_array(variable_id)
  or e->'targetResourceIds' is distinct from '[]'::jsonb or e->'targetRelationIds' is distinct from '[]'::jsonb
  or e->'causalRealEvidenceIds' is distinct from jsonb_build_array(evidence->'id') or e->'causalAssumptionIds' is distinct from jsonb_build_array(assumption->'id')
  or e->>'evidenceClass' is distinct from 'world_transition_simulation_evidence' or e->'seedContextId' is distinct from p_world->'seedContextId' or e->'engineVersion' is distinct from p_world->'engineVersion'
  or (e->>'createdAt')::timestamptz is distinct from expected_at or (e->>'commandCreatedAt')::timestamptz is distinct from expected_at
  or (e->>'afterRevision')::integer<>(e->>'beforeRevision')::integer+1 or (e->>'afterRevision')::integer>(p_world->>'revision')::integer
  or not p_world->'worldEventIds' @> jsonb_build_array(e->'id') or not p_world->'appliedTransitionCommandIds' @> jsonb_build_array(e->'commandId')
  or assumption->>'subjectType' is distinct from 'external_variable' or assumption->>'epistemicStatus' is distinct from 'confirmed_for_simulation'
  or assumption->>'confirmationStatus' is distinct from 'confirmed' or assumption->>'confirmationRequirement' is distinct from 'required' or assumption->>'impactLevel' is distinct from 'high'
  or assumption->>'statement' is distinct from '用户确认的条件模拟规则：update_external_variable。依据：'||(p_rule->>'evidenceSummary')
  or assumption ? 'parameterRange' or assumption->'contradictingRealEvidenceIds' is distinct from '[]'::jsonb
  or assumption->'supportingRealEvidenceIds' is distinct from '[]'::jsonb then return false; end if;
 if p_rule#>>'{when,kind}'='at_tick' then return tick=(p_rule#>>'{when,tickIndex}')::integer and e->'priorWorldEventIds'='[]'::jsonb; end if;
 select value into previous_rule from jsonb_array_elements((p_frame->>'effectiveRulesSignature')::jsonb->'actions') where value->'key'=p_rule#>'{when,ruleKey}';
 if public.formal_relationship_rule_event_valid_v1(previous_rule,p_frame,p_world,p_namespace,p_world_namespace,p_start,p_ticks,array_append(p_seen,p_rule->>'key')) is not true then return false; end if;
 select value,ord::integer into previous,previous_index from jsonb_array_elements(p_world->'worldEvents') with ordinality t(value,ord) where value->>'proposalId' ~ ('^action_proposal_v2_'||p_namespace||'_[0-5]_'||(previous_rule->>'key')||'$');
 return e->'priorWorldEventIds'=jsonb_build_array(previous->'id') and previous_index<event_index and (previous->>'afterRevision')::integer<=(e->>'beforeRevision')::integer and (previous->>'createdAt')::timestamptz<(e->>'createdAt')::timestamptz;
exception when others then return false;
end; $$;
create or replace function public.digital_life_model_draft_guard_v1()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid(); source jsonb; latest_revision bigint; body jsonb:=new.request;
begin
 if tg_op<>'INSERT' then raise exception using errcode='42501',message='model_draft_immutable'; end if;
 if owner_id is null or owner_id is distinct from new.user_id or coalesce(auth.jwt()->>'is_anonymous','false')='true'
  or current_setting('app.digital_life_model_draft_rpc',true) is distinct from 'on' then raise exception using errcode='42501',message='unauthenticated'; end if;
 perform pg_advisory_xact_lock(hashtextextended(owner_id::text||':digital-life-model-draft-v1',0));
 if (case when body->>'version'='digital-life-model-draft-v2' then public.digital_life_model_draft_request_valid_v2(body) else body#>>'{draftRules,version}'='digital-life-rules-v1' and public.digital_life_model_draft_request_valid_v1(body) end) is not true
  or (body->>'expectedRevision')::numeric<>new.parent_revision
  or (body->>'idempotencyKey')::uuid is distinct from new.idempotency_key
  or jsonb_typeof(body->'horizonDays') is distinct from 'number' or body->'horizonDays' not in ('30'::jsonb,'90'::jsonb)
  or jsonb_typeof(body->'sourceContext') is distinct from 'object'
  or body#>>'{sourceContext,signature}' is distinct from new.source_signature then raise exception using errcode='P0001',message='invalid_request'; end if;
 select coalesce(max(revision),0) into latest_revision from public.digital_life_model_drafts where user_id=owner_id;
 if new.parent_revision<>latest_revision or new.revision<>latest_revision+1 then raise exception using errcode='P0001',message='revision_conflict'; end if;
 source:=case when body->>'version'='digital-life-model-draft-v2' then public.digital_life_model_draft_source_v2() else public.digital_life_model_draft_source_v1() end;
 if source is null or body->'sourceContext' is distinct from case when body->>'version'='digital-life-model-draft-v2' then public.digital_life_model_draft_safe_context_v2(source) else public.digital_life_model_draft_safe_context_v1(source) end
  or new.seed_context_id::text is distinct from source#>>'{seed_contexts,id}' then raise exception using errcode='P0001',message='model_source_stale'; end if;
 if (case when body->>'version'='digital-life-model-draft-v2' then public.formal_environment_rules_valid_v2(source,public.digital_life_draft_confirmed_shape_v2(body->'draftRules'),(body->>'horizonDays')::integer) else public.digital_life_model_draft_rules_valid_v1(source,body->'draftRules',(body->>'horizonDays')::integer) end) is not true then raise exception using errcode='P0001',message='invalid_request'; end if;
 return new;
end; $$;


create or replace function public.read_digital_life_model_draft_v1()
returns jsonb language plpgsql stable security invoker set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then raise exception using errcode='42501',message='unauthenticated'; end if;
 select jsonb_build_object('source',public.digital_life_model_draft_source_v2(),'current',
   (select jsonb_build_object('user_id',user_id,'revision',revision,'request',request) from public.digital_life_model_drafts where user_id=auth.uid() order by revision desc limit 1)) into result;
 return result;
end; $$;

create or replace function public.save_digital_life_model_draft_v1(p_request jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid(); saved public.digital_life_model_drafts; source jsonb; request_key uuid; expected bigint;
begin
 perform set_config('app.digital_life_model_draft_rpc','off',true);
 if owner_id is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then raise exception using errcode='42501',message='unauthenticated'; end if;
 if p_request is null or jsonb_typeof(p_request) is distinct from 'object'
  or jsonb_typeof(p_request->'idempotencyKey') is distinct from 'string' then raise exception using errcode='P0001',message='invalid_request'; end if;
 begin request_key:=(p_request->>'idempotencyKey')::uuid; exception when others then raise exception using errcode='P0001',message='invalid_request'; end;
 perform pg_advisory_xact_lock(hashtextextended(owner_id::text||':digital-life-model-draft-v1',0));
 -- Replay first, including JSON numeric equivalence and object-key order, before reading any current source.
 select * into saved from public.digital_life_model_drafts where user_id=owner_id and idempotency_key=request_key;
 if found then
  if saved.request is distinct from p_request then raise exception using errcode='P0001',message='idempotency_key_content_conflict'; end if;
  return jsonb_build_object('row',jsonb_build_object('user_id',saved.user_id,'revision',saved.revision,'request',saved.request),'idempotent',true);
 end if;
 if (case when p_request->>'version'='digital-life-model-draft-v2' then public.digital_life_model_draft_request_valid_v2(p_request) else p_request#>>'{draftRules,version}'='digital-life-rules-v1' and public.digital_life_model_draft_request_valid_v1(p_request) end) is not true then raise exception using errcode='P0001',message='invalid_request'; end if;
 if jsonb_typeof(p_request->'expectedRevision') is distinct from 'number' then raise exception using errcode='P0001',message='invalid_request'; end if;
 begin
  if (p_request->>'expectedRevision')::numeric<>trunc((p_request->>'expectedRevision')::numeric) or (p_request->>'expectedRevision')::numeric not between 0 and 9007199254740990 then raise exception 'invalid'; end if;
  expected:=(p_request->>'expectedRevision')::bigint;
 exception when others then raise exception using errcode='P0001',message='invalid_request'; end;
 -- The INSERT trigger captures and validates the complete source in its own single atomic snapshot.
 source:=case when p_request->>'version'='digital-life-model-draft-v2' then public.digital_life_model_draft_source_v2() else public.digital_life_model_draft_source_v1() end;
 if source is null then raise exception using errcode='P0001',message='model_source_stale'; end if;
 perform set_config('app.digital_life_model_draft_rpc','on',true);
 insert into public.digital_life_model_drafts(user_id,revision,parent_revision,seed_context_id,idempotency_key,source_signature,request)
 values(owner_id,expected+1,expected,(source#>>'{seed_contexts,id}')::uuid,request_key,p_request#>>'{sourceContext,signature}',p_request) returning * into saved;
 perform set_config('app.digital_life_model_draft_rpc','off',true);
 return jsonb_build_object('row',jsonb_build_object('user_id',saved.user_id,'revision',saved.revision,'request',saved.request),'idempotent',false);
end; $$;

-- Additive protocol: immutable v1 sources, receipts, hashes and owner RLS remain authoritative.
create function public.digital_life_model_draft_source_v2()
returns jsonb language plpgsql stable security invoker set search_path=public,extensions as $$
declare old jsonb; base jsonb;
begin
 old:=public.digital_life_model_draft_source_v1();
 if old is null then return null; end if;
 base:=old-'signature';
 return old||jsonb_build_object('signature_v2',encode(digest(convert_to(jsonb_build_object('version','digital-life-model-draft-source-v2','source',base)::text,'UTF8'),'sha256'),'hex'));
end; $$;

create function public.digital_life_model_draft_safe_context_v2(p_source jsonb)
returns jsonb language sql immutable security invoker set search_path=public,pg_temp as $$
 with variables as (
 select 0 category_order,ord,jsonb_build_object('key','pressure-'||ord::text,'category','pressure','label',case when jsonb_array_length(p_source#>'{reality_profiles,pressures}')=1 then '压力' else '压力（第'||ord::text||'项）' end,'value',v->'value','classification',v->'classification','evidenceSummary',v->'evidenceSummary') item
 from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,pressures}','[]'::jsonb)) with ordinality t(v,ord) where v->>'classification' in ('fact','assumption')
 union all
 select 1,ord,jsonb_build_object('key','external-variable-'||ord::text,'category','external_variable','label',case when jsonb_array_length(p_source#>'{reality_profiles,external_variables}')=1 then '外部变量' else '外部变量（第'||ord::text||'项）' end,'value',v->'value','classification',v->'classification','evidenceSummary',v->'evidenceSummary')
 from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,external_variables}','[]'::jsonb)) with ordinality t(v,ord) where v->>'classification' in ('fact','assumption'))
 select jsonb_build_object('version','digital-life-model-draft-source-v2','signature',p_source->'signature_v2','modelContext',
 (public.digital_life_model_draft_safe_context_v1(p_source)->'modelContext')||jsonb_build_object('variables',coalesce((select jsonb_agg(item order by category_order,ord) from variables),'[]'::jsonb)));
$$;

create function public.digital_life_model_draft_context_valid_v2(p_context jsonb)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare item jsonb; model jsonb:=p_context->'modelContext';
begin
 if jsonb_typeof(p_context) is distinct from 'object' or (select count(*) from jsonb_object_keys(p_context))<>3
  or p_context->>'version' is distinct from 'digital-life-model-draft-source-v2'
  or jsonb_typeof(model->'variables') is distinct from 'array' or jsonb_array_length(model->'variables')>16
  or public.digital_life_model_draft_context_valid_v1(jsonb_build_object('signature',p_context->'signature','modelContext',model-'variables')) is not true then return false; end if;
 for item in select value from jsonb_array_elements(model->'variables') loop
  if jsonb_typeof(item) is distinct from 'object' or (select count(*) from jsonb_object_keys(item))<>6
   or not (item ?& array['key','category','label','value','classification','evidenceSummary'])
   or jsonb_typeof(item->'key') is distinct from 'string' or item->>'key' !~ '^(pressure|external-variable)-[1-8]$'
   or item->>'category' is distinct from case when item->>'key' like 'pressure-%' then 'pressure' else 'external_variable' end
   or jsonb_typeof(item->'classification') is distinct from 'string' or item->>'classification' not in ('fact','assumption')
   or public.digital_life_model_draft_visible_text_valid_v1(item->>'label',240) is not true
   or public.digital_life_model_draft_visible_text_valid_v1(item->>'value',240) is not true
   or public.digital_life_model_draft_visible_text_valid_v1(item->>'evidenceSummary',240) is not true then return false; end if;
 end loop;
 return (select count(distinct value->>'key') from jsonb_array_elements(model->'variables'))=jsonb_array_length(model->'variables');
exception when others then return false;
end; $$;

-- Reuse the exact v1 common shape boundary, then validate the added operation separately.
-- This is validation only; the accepted request and frozen rules are never rewritten.
alter function public.formal_run_rules_valid(jsonb) rename to formal_run_rules_valid_before_environment_v2;
create function public.formal_environment_legacy_shape_v2(p_rules jsonb)
returns jsonb language sql immutable security invoker set search_path=public,pg_temp as $$
 select jsonb_set(jsonb_set(p_rules,'{version}','"digital-life-rules-v1"'),'{actions}',coalesce((select jsonb_agg(case when a#>>'{operation,actionType}'='update_external_variable' then jsonb_set(a,'{operation}','{"actionType":"update_commitment","commitmentKey":"commitment-1","label":"环境条件假设","status":"planned"}') else a end order by ord) from jsonb_array_elements(p_rules->'actions') with ordinality t(a,ord)),'[]'::jsonb));
$$;
create function public.formal_run_rules_valid(p_rules jsonb)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare a jsonb; op jsonb;
begin
 if p_rules is null or p_rules->>'version' is distinct from 'digital-life-rules-v2' then return public.formal_run_rules_valid_before_environment_v2(p_rules); end if;
 if public.formal_run_rules_valid_before_environment_v2(public.formal_environment_legacy_shape_v2(p_rules)) is not true then return false; end if;
 for a in select value from jsonb_array_elements(p_rules->'actions') where value#>>'{operation,actionType}'='update_external_variable' loop
  op:=a->'operation';
  if (select count(*) from jsonb_object_keys(op))<>3 or not (op ?& array['actionType','variableKey','value'])
   or jsonb_typeof(op->'variableKey') is distinct from 'string' or op->>'variableKey' !~ '^(pressure|external-variable)-[1-8]$'
   or jsonb_typeof(op->'value') is distinct from 'string' or public.digital_life_model_draft_text_valid_v1(op->>'value',240) is not true
   or public.digital_life_model_draft_text_valid_v1(a->>'evidenceSummary',160) is not true
   or (select count(*) from jsonb_array_elements(p_rules->'actions') where value->'pathKey'=a->'pathKey' and value#>>'{operation,actionType}'='update_external_variable')>1 then return false; end if;
 end loop;
 return true;
exception when others then return false;
end; $$;

create function public.formal_environment_rules_valid_v2(p_source jsonb,p_rules jsonb,p_horizon integer)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare draft jsonb; a jsonb; variable jsonb; core_key text;
begin
 if p_rules->>'version' is distinct from 'digital-life-rules-v2' or public.formal_run_rules_valid(p_rules) is not true then return false; end if;
 -- The old semantic validator checks every common actor/path/trigger/resource rule unchanged.
 draft:=public.formal_environment_legacy_shape_v2(p_rules);
 draft:=jsonb_set(draft,'{actions}',coalesce((select jsonb_agg(jsonb_set(value,'{confirmedForSimulation}','false') order by ord) from jsonb_array_elements(draft->'actions') with ordinality t(value,ord)),'[]'));
 draft:=jsonb_set(draft,'{strategies}',coalesce((select jsonb_agg(jsonb_set(value,'{confirmedForSimulation}','false') order by ord) from jsonb_array_elements(draft->'strategies') with ordinality t(value,ord)),'[]'));
 if public.digital_life_model_draft_rules_valid_v1(p_source,draft,p_horizon) is not true then return false; end if;
 select 'person-'||ord::text into core_key from jsonb_array_elements(p_source->'agent_profiles') with ordinality t(a,ord) where a->>'agent_type'='user_core';
 for a in select value from jsonb_array_elements(p_rules->'actions') where value#>>'{operation,actionType}'='update_external_variable' loop
  select value into variable from jsonb_array_elements(public.digital_life_model_draft_safe_context_v2(p_source)#>'{modelContext,variables}') where value->'key'=a#>'{operation,variableKey}';
  if variable is null or a->>'actorKey' is distinct from case when a->>'pathKey'='main' then core_key else a->>'pathKey' end
   or variable->'value' is not distinct from a#>'{operation,value}' then return false; end if;
 end loop;
 return true;
exception when others then return false;
end; $$;

create function public.digital_life_model_draft_request_valid_v2(p_request jsonb)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare legacy jsonb;
begin
 if p_request->>'version' is distinct from 'digital-life-model-draft-v2' or p_request#>>'{draftRules,version}' is distinct from 'digital-life-rules-v2'
  or public.digital_life_model_draft_context_valid_v2(p_request->'sourceContext') is not true then return false; end if;
 legacy:=jsonb_set(jsonb_set(p_request,'{version}','"digital-life-model-draft-v1"'),'{sourceContext}',jsonb_build_object('signature',p_request#>'{sourceContext,signature}','modelContext',(p_request#>'{sourceContext,modelContext}')-'variables'));
 return public.digital_life_model_draft_request_common_shape_v2(legacy);
exception when others then return false;
end; $$;

create or replace function public.reserve_account_sandbox_run(p_graph_snapshot_id uuid,p_idempotency_key uuid,p_horizon_days integer,p_digital_life_rules jsonb,p_outcome_calibration jsonb,p_default_planning jsonb)
returns table(accepted_at timestamptz,simulation_start_at timestamptz,frozen_source_input jsonb,run jsonb)
language plpgsql security invoker set search_path=public,extensions as $$
declare owner_id uuid:=auth.uid(); graph_row record; job_row record; source jsonb; content_hash text; legacy_content_hash text; bridge_content_hash text; profile_row jsonb; seed_row jsonb; agent_rows jsonb; edge_rows jsonb; feedback_rows jsonb; lens_row jsonb; now_at timestamptz; selected_corrections jsonb; selected_row record; original_rules jsonb:=p_digital_life_rules; current_seed uuid; current_graph uuid; source_run uuid; planning_context text;
begin
  perform set_config('app.formal_reservation_rpc','off',true);
  if owner_id is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then raise exception using errcode='42501',message='unauthenticated'; end if;
  if p_graph_snapshot_id is null or p_idempotency_key is null or p_horizon_days is null or p_horizon_days not in (30,90)
    or not public.formal_run_rules_valid(p_digital_life_rules) then raise exception using errcode='P0001',message='invalid_request'; end if;
  if public.formal_default_planning_request_valid_v2(p_default_planning) is distinct from true then raise exception using errcode='P0001',message='invalid_planning_request'; end if;
  legacy_content_hash:=encode(digest(convert_to(jsonb_build_object('graph',p_graph_snapshot_id,'horizon',p_horizon_days,'rules',p_digital_life_rules,'version','formal-run-reservation-v1')::text,'UTF8'),'sha256'),'hex');
  bridge_content_hash:=encode(digest(convert_to(jsonb_build_object('graph',p_graph_snapshot_id,'horizon',p_horizon_days,'rules',p_digital_life_rules,'version','formal-run-reservation-outcome-v1','outcome_calibration',p_outcome_calibration)::text,'UTF8'),'sha256'),'hex');
  content_hash:=case when p_outcome_calibration is null then legacy_content_hash else bridge_content_hash end;
  if p_default_planning is not null then content_hash:=encode(digest(convert_to(jsonb_build_object('graph',p_graph_snapshot_id,'horizon',p_horizon_days,'rules',p_digital_life_rules,'outcome_calibration',p_outcome_calibration,'default_planning',p_default_planning,'version','formal-run-reservation-planning-v1')::text,'UTF8'),'sha256'),'hex'); end if;
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text||':m1-run:'||p_idempotency_key::text,0));
  perform set_config('app.formal_reservation_rpc','on',true);
  select id,formal_content_hash,formal_accepted_at,formal_simulation_start_at,generation_jobs.frozen_source_input,simulation_id,status into job_row
    from public.generation_jobs where user_id=owner_id and job_type='formal_run_reservation' and idempotency_key=p_idempotency_key::text;
  if found then
    if job_row.formal_content_hash is distinct from content_hash and not (p_default_planning is null and p_outcome_calibration is null and job_row.formal_content_hash=bridge_content_hash) then raise exception using errcode='P0001',message='idempotency_key_content_conflict'; end if;
    accepted_at:=job_row.formal_accepted_at; simulation_start_at:=job_row.formal_simulation_start_at;
    if job_row.status='completed' then
      select jsonb_build_object('id',id,'status',status,'seed_context_id',seed_context_id,'graph_snapshot_id',graph_snapshot_id,'time_horizon',time_horizon,'completed_at',completed_at) into run
        from public.simulations where id=job_row.simulation_id and user_id=owner_id and status='completed';
      if run is null then raise exception using errcode='P0001',message='persistence_failed'; end if;
      frozen_source_input:=null;
    else
      if clock_timestamp()>=simulation_start_at then raise exception using errcode='P0001',message='reservation_expired'; end if;
      frozen_source_input:=job_row.frozen_source_input; run:=null;
    end if;
    perform set_config('app.formal_reservation_rpc','off',true); return next; return;
  end if;
  -- Pre-reservation completed history can be recovered, never re-timed.
  select id,graph_snapshot_id,time_horizon,input_snapshot,created_at,completed_at,seed_context_id,status into job_row
    from public.simulations where user_id=owner_id and idempotency_key=p_idempotency_key::text and execution_version='formal-account-sandbox-m1-v1' and status='completed';
  if found then
    if job_row.graph_snapshot_id is distinct from p_graph_snapshot_id or p_outcome_calibration is not null or p_default_planning is not null or job_row.time_horizon::text is distinct from p_horizon_days::text||'_days'
      or (p_digital_life_rules is not null and job_row.input_snapshot#>'{digitalLifeModel,rules}' is distinct from p_digital_life_rules)
      or (p_digital_life_rules is null and (coalesce(jsonb_array_length(job_row.input_snapshot#>'{digitalLifeModel,rules,actions}'),0)>0 or coalesce(jsonb_array_length(job_row.input_snapshot#>'{digitalLifeModel,rules,strategies}'),0)>0))
    then raise exception using errcode='P0001',message='idempotency_key_content_conflict'; end if;
    accepted_at:=job_row.created_at; simulation_start_at:=coalesce((job_row.input_snapshot->>'startedAt')::timestamptz,job_row.created_at);
    run:=jsonb_build_object('id',job_row.id,'status',job_row.status,'seed_context_id',job_row.seed_context_id,'graph_snapshot_id',job_row.graph_snapshot_id,'time_horizon',job_row.time_horizon,'completed_at',job_row.completed_at);
    frozen_source_input:=null; perform set_config('app.formal_reservation_rpc','off',true); return next; return;
  end if;
  select g.id,g.user_id,g.seed_context_id,g.agent_snapshot_id,g.graph_locked,g.locked_at,g.safety_level,g.version,a.safety_level as agent_safety,a.version as agent_snapshot_version into graph_row
    from public.relation_graph_snapshots g join public.agent_profile_snapshots a on a.id=g.agent_snapshot_id and a.user_id=g.user_id and a.seed_context_id=g.seed_context_id
    where g.id=p_graph_snapshot_id and g.user_id=owner_id and g.graph_locked and g.locked_at is not null;
  if not found then raise exception using errcode='P0001',message='graph_not_found'; end if;
  if graph_row.safety_level not in ('safe','caution') or graph_row.agent_safety not in ('safe','caution') then raise exception using errcode='P0001',message='safety_blocked'; end if;
  -- Symbolic writers share this owner lock. Replays above never read today's lens.
  perform pg_advisory_xact_lock(hashtextextended('symbolic_lens_v1:'||owner_id::text,0));
  if p_outcome_calibration is not null then
    if jsonb_typeof(p_outcome_calibration) is distinct from 'object' or p_outcome_calibration->>'version' is distinct from '1'
      or p_outcome_calibration->'confirmed' is distinct from 'true'::jsonb or jsonb_typeof(p_outcome_calibration->'correction_keys') is distinct from 'array'
      or jsonb_array_length(p_outcome_calibration->'correction_keys') not between 1 and 6
      or (select count(*) from jsonb_object_keys(p_outcome_calibration))<>3 then raise exception using errcode='P0001',message='invalid_correction'; end if;
    select id into current_seed from public.seed_contexts where user_id=owner_id and status='submitted' and submitted_at is not null and frozen_at is not null order by submitted_at desc,id desc limit 1;
    select id into current_graph from public.relation_graph_snapshots where user_id=owner_id and seed_context_id=current_seed order by created_at desc,id desc limit 1;
    if graph_row.id is distinct from current_graph then raise exception using errcode='P0001',message='current_graph_required'; end if;
    select jsonb_agg(o.correction order by o.correction->>'key') into selected_corrections from public.formal_outcome_observations o
      where o.user_id=owner_id and o.correction->>'key' in (select jsonb_array_elements_text(p_outcome_calibration->'correction_keys'));
    if selected_corrections is null or jsonb_array_length(selected_corrections)<>jsonb_array_length(p_outcome_calibration->'correction_keys')
      or (select count(distinct c->>'ruleKey') from jsonb_array_elements(selected_corrections)c)<>jsonb_array_length(selected_corrections)
      or (select count(distinct c->>'sourceRunId') from jsonb_array_elements(selected_corrections)c)<>1 then raise exception using errcode='P0001',message='invalid_correction'; end if;
    source_run:=(selected_corrections->0->>'sourceRunId')::uuid;
    if p_digital_life_rules is null or (p_digital_life_rules->'actions'='[]'::jsonb and p_digital_life_rules->'strategies'='[]'::jsonb) then
      select input_snapshot#>'{digitalLifeModel,rules}' into p_digital_life_rules from public.simulations where id=source_run and user_id=owner_id and status='completed';
    end if;
  end if;
  now_at:=date_trunc('milliseconds',clock_timestamp()); accepted_at:=now_at; simulation_start_at:=now_at+interval '5 minutes';
  -- One SQL statement freezes every mutable source under one MVCC snapshot.
  select
    (select jsonb_build_object('id',s.id,'version',s.version,'submitted_at',s.submitted_at,'frozen_at',s.frozen_at,'user_question',s.user_question,'raw_context',s.raw_context,'safety_flags',s.safety_flags)
      from public.seed_contexts s where s.id=graph_row.seed_context_id and s.user_id=owner_id and s.status='submitted' and s.frozen_at is not null and s.submitted_at is not null and s.simulation_track='crossroad'),
    (select jsonb_agg(jsonb_build_object('id',a.id,'version',a.version,'display_name',a.display_name,'agent_type',a.agent_type,'evidence_refs',a.evidence_refs) order by a.id) from public.agent_profiles a where a.user_id=owner_id and a.seed_context_id=graph_row.seed_context_id and a.snapshot_id=graph_row.agent_snapshot_id),
    (select jsonb_agg(jsonb_build_object('id',e.id,'version',e.version,'from_agent_id',e.from_agent_id,'to_agent_id',e.to_agent_id,'relationship_type',e.relationship_type,'evidence_refs',e.evidence_refs) order by e.id) from public.relation_edges e where e.user_id=owner_id and e.graph_snapshot_id=graph_row.id and e.agent_snapshot_id=graph_row.agent_snapshot_id),
    (select to_jsonb(p) from (select id,user_id,seed_context_id,life_climate_value,life_climate_classification,life_climate_evidence_summary,resources_value,resources_classification,resources_evidence_summary,constraints_value,constraints_classification,constraints_evidence_summary,life_goals,core_values,life_themes,pressures,external_variables,life_model_domains,world_model_inputs,revision from public.reality_profiles where user_id=owner_id and seed_context_id=graph_row.seed_context_id) p),
    (select coalesce(jsonb_agg(to_jsonb(f) order by f.created_at desc,f.id desc),'[]'::jsonb) from (select id,version,rating,target_type,created_at from public.feedback_logs where user_id=owner_id and version in ('formal-run-feedback-m1-v1','formal-run-feedback-m2-v1') order by created_at desc,id desc limit 20) f)
     ,public.freeze_symbolic_run_lens_v1(owner_id,now_at)
    into seed_row,agent_rows,edge_rows,profile_row,feedback_rows,lens_row;
  if selected_corrections is not null and exists(select 1 from jsonb_array_elements(selected_corrections)c where
    c->>'ownerId' is distinct from owner_id::text or c->>'seedContextId' is distinct from graph_row.seed_context_id::text
    or c->>'graphSnapshotId' is distinct from graph_row.id::text or c->>'agentSnapshotId' is distinct from graph_row.agent_snapshot_id::text
    or c->'profileRevision' is distinct from coalesce(profile_row->'revision','0'::jsonb)
    or (c->>'recordedAt')::timestamptz>now_at) then raise exception using errcode='P0001',message='invalid_correction'; end if;
  if seed_row is null then raise exception using errcode='P0001',message='seed_not_found'; end if;
  if agent_rows is null or edge_rows is null or jsonb_array_length(agent_rows)>50 or jsonb_array_length(edge_rows)>200 then raise exception using errcode='P0001',message='incomplete_object_chain'; end if;
  if p_digital_life_rules is not null and (p_digital_life_rules->>'graphSnapshotId' is distinct from graph_row.id::text
    or p_digital_life_rules->>'agentSnapshotId' is distinct from graph_row.agent_snapshot_id::text
    or p_digital_life_rules->'profileRevision' is distinct from coalesce(profile_row->'revision','0'::jsonb)) then raise exception using errcode='P0001',message='invalid_request'; end if;
  source:=jsonb_build_object('relation_graph_snapshots',to_jsonb(graph_row)-'agent_safety','seed_contexts',seed_row,'agent_profiles',agent_rows,'relation_edges',edge_rows,'reality_profiles',profile_row,'feedback_logs',feedback_rows,
    'digital_life_rules',p_digital_life_rules,'symbolic_lens',lens_row,'symbolic_lens_version','formal-symbolic-run-v1','source_version','formal-run-reservation-outcome-v1','outcome_lock_required',true,'reality_criteria_required',true,'outcome_calibration',case when selected_corrections is null then null else jsonb_build_object('version','formal-outcome-run-v1','corrections',selected_corrections) end,'outcome_selection',p_outcome_calibration,'original_requested_rules',original_rules);
  if p_default_planning is not null then
    -- Receipt recovery above never reads this current source or rebinds old authorization.
    select id into current_seed from public.seed_contexts where user_id=owner_id and status='submitted' and submitted_at is not null and frozen_at is not null order by submitted_at desc,id desc limit 1;
    select id into current_graph from public.relation_graph_snapshots where user_id=owner_id and seed_context_id=current_seed order by created_at desc,id desc limit 1;
    if graph_row.id is distinct from current_graph then raise exception using errcode='P0001',message='current_graph_required'; end if;
    planning_context:=public.formal_default_planning_context_fingerprint_v1(source);
    if p_default_planning->>'consentContext' is distinct from planning_context then raise exception using errcode='P0001',message='planning_context_stale'; end if;
    if exists(select 1 from jsonb_array_elements(p_default_planning->'resources')r where profile_row#>array['world_model_inputs','resources',((substring(r->>'resourceKey' from 10))::integer-1)::text] is null) then raise exception using errcode='P0001',message='invalid_planning_request'; end if;
    if p_default_planning->>'version'='formal-default-planner-v2' and public.formal_relationship_source_valid_v1(p_default_planning,source,p_horizon_days) is distinct from true then raise exception using errcode='P0001',message='invalid_planning_request';end if;
    source:=source||jsonb_build_object('default_planning',p_default_planning,'planning_consent_context',planning_context,'planning_version',p_default_planning->>'version');
  end if;
  if p_digital_life_rules->>'version'='digital-life-rules-v2' and public.formal_environment_rules_valid_v2(source,p_digital_life_rules,p_horizon_days) is not true then raise exception using errcode='P0001',message='invalid_request'; end if;
  insert into public.generation_jobs(user_id,seed_context_id,trace_id,version,writer_version,idempotency_key,job_type,status,input_refs,formal_graph_snapshot_id,formal_content_hash,formal_accepted_at,formal_simulation_start_at,frozen_source_input)
    values(owner_id,graph_row.seed_context_id,gen_random_uuid()::text,'formal-run-reservation-v1','formal-run-reservation-v1',p_idempotency_key::text,'formal_run_reservation','queued',jsonb_build_object('graph_snapshot_id',graph_row.id),graph_row.id,content_hash,accepted_at,simulation_start_at,source);
  frozen_source_input:=source; run:=null; perform set_config('app.formal_reservation_rpc','off',true); return next;
exception when others then perform set_config('app.formal_reservation_rpc','off',true); raise;
end; $$;
-- Every invoker helper is explicit; no table, policy, owner or role grants change.
revoke all on function public.digital_life_model_draft_source_v2(),public.digital_life_model_draft_safe_context_v2(jsonb),public.digital_life_model_draft_context_valid_v2(jsonb),public.digital_life_model_draft_request_valid_v2(jsonb),public.formal_environment_legacy_shape_v2(jsonb),public.formal_run_rules_valid(jsonb),public.formal_environment_rules_valid_v2(jsonb,jsonb,integer),public.formal_environment_bundle_valid_v2(jsonb,jsonb,timestamptz,integer),public.formal_relationship_rule_event_valid_v1(jsonb,jsonb,jsonb,text,text,timestamptz,integer,text[]),public.formal_run_bundle_matches_reservation(jsonb,jsonb,timestamptz,timestamptz,integer) from public,anon,authenticated,service_role;
grant execute on function public.digital_life_model_draft_source_v2(),public.digital_life_model_draft_safe_context_v2(jsonb),public.digital_life_model_draft_context_valid_v2(jsonb),public.digital_life_model_draft_request_valid_v2(jsonb),public.formal_environment_legacy_shape_v2(jsonb),public.formal_run_rules_valid(jsonb),public.formal_environment_rules_valid_v2(jsonb,jsonb,integer),public.formal_environment_bundle_valid_v2(jsonb,jsonb,timestamptz,integer),public.formal_relationship_rule_event_valid_v1(jsonb,jsonb,jsonb,text,text,timestamptz,integer,text[]),public.formal_run_bundle_matches_reservation(jsonb,jsonb,timestamptz,timestamptz,integer) to authenticated;
create or replace function public.digital_life_draft_confirmed_shape_v1(p_rules jsonb)
returns jsonb language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare result jsonb; actions jsonb:='[]'::jsonb; strategies jsonb:='[]'::jsonb; item jsonb;
begin
 if p_rules->>'version' is distinct from 'digital-life-rules-v1' or p_rules is null or jsonb_typeof(p_rules) is distinct from 'object'
  or jsonb_typeof(p_rules->'actions') is distinct from 'array'
  or jsonb_typeof(p_rules->'strategies') is distinct from 'array'
  or jsonb_typeof(p_rules->'profileRevision') is distinct from 'number' then return null; end if;
 if (p_rules->>'profileRevision')::numeric<>trunc((p_rules->>'profileRevision')::numeric)
  or (p_rules->>'profileRevision')::numeric not between 0 and 9007199254740991 then return null; end if;
 for item in select value from jsonb_array_elements(p_rules->'actions') loop
  if jsonb_typeof(item) is distinct from 'object' or item->'confirmedForSimulation' is distinct from 'false'::jsonb then return null; end if;
  if jsonb_typeof(item->'evidenceSummary') is distinct from 'string' or public.digital_life_model_draft_text_valid_v1(item->>'evidenceSummary',160) is not true then return null; end if;
  if item#>>'{operation,actionType}'='request_information' and public.digital_life_model_draft_text_valid_v1(item#>>'{operation,question}',240) is not true then return null; end if;
  if item#>>'{operation,actionType}'='update_commitment' and public.digital_life_model_draft_text_valid_v1(item#>>'{operation,label}',240) is not true then return null; end if;
  if item#>>'{when,kind}'='at_tick' and jsonb_typeof(item#>'{when,tickIndex}')='number' then
   if (item#>>'{when,tickIndex}')::numeric<>trunc((item#>>'{when,tickIndex}')::numeric) or (item#>>'{when,tickIndex}')::numeric not between 0 and 5 then return null; end if;
   item:=jsonb_set(item,'{when,tickIndex}',to_jsonb((item#>>'{when,tickIndex}')::integer));
  end if;
  actions:=actions||jsonb_build_array(jsonb_set(item,'{confirmedForSimulation}','true'::jsonb));
 end loop;
 for item in select value from jsonb_array_elements(p_rules->'strategies') loop
  if jsonb_typeof(item) is distinct from 'object' or item->'confirmedForSimulation' is distinct from 'false'::jsonb then return null; end if;
  if public.digital_life_model_draft_text_valid_v1(item->>'label',240) is not true or public.digital_life_model_draft_text_valid_v1(item->>'evidenceSummary',160) is not true then return null; end if;
  strategies:=strategies||jsonb_build_array(jsonb_set(item,'{confirmedForSimulation}','true'::jsonb));
 end loop;
 result:=p_rules||jsonb_build_object('profileRevision',(p_rules->>'profileRevision')::bigint,'actions',actions,'strategies',strategies);
 if public.formal_run_rules_valid(result) is not true then return null; end if;
 return result;
exception when others then return null;
end; $$;

create function public.digital_life_draft_confirmed_shape_v2(p_rules jsonb)
returns jsonb language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare result jsonb; actions jsonb:='[]'::jsonb; strategies jsonb:='[]'::jsonb; item jsonb;
begin
 if p_rules->>'version' is distinct from 'digital-life-rules-v2' or p_rules is null or jsonb_typeof(p_rules) is distinct from 'object'
  or jsonb_typeof(p_rules->'actions') is distinct from 'array'
  or jsonb_typeof(p_rules->'strategies') is distinct from 'array'
  or jsonb_typeof(p_rules->'profileRevision') is distinct from 'number' then return null; end if;
 if (p_rules->>'profileRevision')::numeric<>trunc((p_rules->>'profileRevision')::numeric)
  or (p_rules->>'profileRevision')::numeric not between 0 and 9007199254740991 then return null; end if;
 for item in select value from jsonb_array_elements(p_rules->'actions') loop
  if jsonb_typeof(item) is distinct from 'object' or item->'confirmedForSimulation' is distinct from 'false'::jsonb then return null; end if;
  if jsonb_typeof(item->'evidenceSummary') is distinct from 'string' or public.digital_life_model_draft_text_valid_v1(item->>'evidenceSummary',160) is not true then return null; end if;
  if item#>>'{operation,actionType}'='request_information' and public.digital_life_model_draft_text_valid_v1(item#>>'{operation,question}',240) is not true then return null; end if;
  if item#>>'{operation,actionType}'='update_commitment' and public.digital_life_model_draft_text_valid_v1(item#>>'{operation,label}',240) is not true then return null; end if;
  if item#>>'{when,kind}'='at_tick' and jsonb_typeof(item#>'{when,tickIndex}')='number' then
   if (item#>>'{when,tickIndex}')::numeric<>trunc((item#>>'{when,tickIndex}')::numeric) or (item#>>'{when,tickIndex}')::numeric not between 0 and 5 then return null; end if;
   item:=jsonb_set(item,'{when,tickIndex}',to_jsonb((item#>>'{when,tickIndex}')::integer));
  end if;
  actions:=actions||jsonb_build_array(jsonb_set(item,'{confirmedForSimulation}','true'::jsonb));
 end loop;
 for item in select value from jsonb_array_elements(p_rules->'strategies') loop
  if jsonb_typeof(item) is distinct from 'object' or item->'confirmedForSimulation' is distinct from 'false'::jsonb then return null; end if;
  if public.digital_life_model_draft_text_valid_v1(item->>'label',240) is not true or public.digital_life_model_draft_text_valid_v1(item->>'evidenceSummary',160) is not true then return null; end if;
  strategies:=strategies||jsonb_build_array(jsonb_set(item,'{confirmedForSimulation}','true'::jsonb));
 end loop;
 result:=p_rules||jsonb_build_object('profileRevision',(p_rules->>'profileRevision')::bigint,'actions',actions,'strategies',strategies);
 if public.formal_run_rules_valid(result) is not true then return null; end if;
 return result;
exception when others then return null;
end; $$;

create or replace function public.digital_life_model_draft_request_valid_v1(p_request jsonb)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
begin
 if p_request is null or jsonb_typeof(p_request) is distinct from 'object' then return false; end if;
 if (select count(*) from jsonb_object_keys(p_request))<>6
  or not (p_request ?& array['version','expectedRevision','idempotencyKey','horizonDays','sourceContext','draftRules'])
  or p_request->>'version' is distinct from 'digital-life-model-draft-v1'
  or p_request#>>'{draftRules,version}' is distinct from 'digital-life-rules-v1'
  or jsonb_typeof(p_request->'expectedRevision') is distinct from 'number'
  or jsonb_typeof(p_request->'horizonDays') is distinct from 'number'
  or p_request->'horizonDays' not in ('30'::jsonb,'90'::jsonb)
  or jsonb_typeof(p_request->'idempotencyKey') is distinct from 'string'
  or coalesce(p_request->>'idempotencyKey','')!~'^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$'
  or jsonb_typeof(p_request->'sourceContext') is distinct from 'object'
  or (select count(*) from jsonb_object_keys(p_request->'sourceContext'))<>2
  or jsonb_typeof(p_request#>'{sourceContext,signature}') is distinct from 'string'
  or coalesce(p_request#>>'{sourceContext,signature}','')!~'^[a-f0-9]{64}$'
  or jsonb_typeof(p_request#>'{sourceContext,modelContext}') is distinct from 'object'
  or public.digital_life_model_draft_context_valid_v1(p_request->'sourceContext') is not true
  or public.digital_life_draft_confirmed_shape_v1(p_request->'draftRules') is null then return false; end if;
 return (p_request->>'expectedRevision')::numeric=trunc((p_request->>'expectedRevision')::numeric)
  and (p_request->>'expectedRevision')::numeric between 0 and 9007199254740990;
exception when others then return false;
end; $$;

create function public.digital_life_model_draft_request_common_shape_v2(p_request jsonb)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
begin
 if p_request is null or jsonb_typeof(p_request) is distinct from 'object' then return false; end if;
 if (select count(*) from jsonb_object_keys(p_request))<>6
  or not (p_request ?& array['version','expectedRevision','idempotencyKey','horizonDays','sourceContext','draftRules'])
  or p_request->>'version' is distinct from 'digital-life-model-draft-v1'
  or jsonb_typeof(p_request->'expectedRevision') is distinct from 'number'
  or jsonb_typeof(p_request->'horizonDays') is distinct from 'number'
  or p_request->'horizonDays' not in ('30'::jsonb,'90'::jsonb)
  or jsonb_typeof(p_request->'idempotencyKey') is distinct from 'string'
  or coalesce(p_request->>'idempotencyKey','')!~'^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$'
  or jsonb_typeof(p_request->'sourceContext') is distinct from 'object'
  or (select count(*) from jsonb_object_keys(p_request->'sourceContext'))<>2
  or jsonb_typeof(p_request#>'{sourceContext,signature}') is distinct from 'string'
  or coalesce(p_request#>>'{sourceContext,signature}','')!~'^[a-f0-9]{64}$'
  or jsonb_typeof(p_request#>'{sourceContext,modelContext}') is distinct from 'object'
  or public.digital_life_model_draft_context_valid_v1(p_request->'sourceContext') is not true
  or public.digital_life_draft_confirmed_shape_v2(p_request->'draftRules') is null then return false; end if;
 return (p_request->>'expectedRevision')::numeric=trunc((p_request->>'expectedRevision')::numeric)
  and (p_request->>'expectedRevision')::numeric between 0 and 9007199254740990;
exception when others then return false;
end; $$;

create or replace function public.digital_life_model_draft_rules_valid_v1(p_source jsonb,p_rules jsonb,p_horizon integer)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare confirmed jsonb; context jsonb; agents jsonb; edges jsonb; item jsonb; strategy jsonb; previous jsonb;
 role text; active_self text; core_key text; actor jsonb; target jsonb; relation jsonb; resource jsonb;
 seen jsonb:='{}'::jsonb; operation jsonb; profile_field jsonb; field_key text; field_parts text[]; field_index integer;
begin
 confirmed:=public.digital_life_draft_confirmed_shape_v1(p_rules);
 if p_rules->>'version' is distinct from 'digital-life-rules-v1' or confirmed is null or p_source is null or p_horizon is null or p_horizon not in (30,90) then return false; end if;
 context:=public.digital_life_model_draft_safe_context_v1(p_source)->'modelContext'; agents:=context->'agents'; edges:=context->'relationships';
 if p_rules->'graphSnapshotId' is distinct from context->'graphSnapshotId' or p_rules->'agentSnapshotId' is distinct from context->'agentSnapshotId'
  or p_rules->'profileRevision' is distinct from context->'profileRevision' then return false; end if;
 if jsonb_array_length(agents) not between 1 and 50 or jsonb_array_length(edges) not between 1 and 200
  or (select count(*) from jsonb_array_elements(agents) where value->>'role'='user_core')<>1
  or (select count(*) from jsonb_array_elements(agents) where value->>'role'='user_variant')>2 then return false; end if;
 select value->>'key' into core_key from jsonb_array_elements(agents) where value->>'role'='user_core';
 if (select count(distinct value->>'key') from jsonb_array_elements(p_rules->'actions'))<>jsonb_array_length(p_rules->'actions')
  or (select count(distinct value->>'participantKey') from jsonb_array_elements(p_rules->'strategies'))<>jsonb_array_length(p_rules->'strategies') then return false; end if;
 for strategy in select value from jsonb_array_elements(p_rules->'strategies') loop
  if not exists(select 1 from jsonb_array_elements(agents) where value->>'key'=strategy->>'participantKey' and value->>'role'='user_variant')
   or not exists(select 1 from jsonb_array_elements(p_rules->'actions') where value->>'pathKey'=strategy->>'participantKey' and value->>'actorKey'=strategy->>'participantKey') then return false; end if;
 end loop;
 for item in select value from jsonb_array_elements(p_rules->'actions') loop
  select value into actor from jsonb_array_elements(agents) where value->>'key'=item->>'actorKey';
  if actor is null then return false; end if;
  role:=actor->>'role'; active_self:=case when item->>'pathKey'='main' then core_key else item->>'pathKey' end;
  if item->>'pathKey'<>'main' and not exists(select 1 from jsonb_array_elements(p_rules->'strategies') where value->>'participantKey'=item->>'pathKey') then return false; end if;
  if role in ('user_core','user_variant') and item->>'actorKey'<>active_self then return false; end if;
  if (select count(*) from jsonb_array_elements(p_rules->'actions') where value->>'pathKey'=item->>'pathKey')>case when p_horizon=30 then 3 else 6 end then return false; end if;
  previous:=null;
  if item#>>'{when,kind}'='at_tick' then
   if (item#>>'{when,tickIndex}')::numeric>=case when p_horizon=30 then 3 else 6 end then return false; end if;
  else
   previous:=seen->(item#>>'{when,ruleKey}');
   if previous is null or previous->>'pathKey' is distinct from item->>'pathKey' then return false; end if;
  end if;
  operation:=item->'operation';
  if role in ('npc','group') and (operation->>'actionType'<>'update_relation_signal' or previous#>>'{operation,actionType}' is distinct from 'request_information'
    or previous#>>'{operation,targetPersonKey}' is distinct from item->>'actorKey') then return false; end if;
  if operation->>'actionType'='request_information' then
   select value into target from jsonb_array_elements(agents) where value->>'key'=operation->>'targetPersonKey';
   if target is null or target->>'role' not in ('npc','group') or not exists(select 1 from jsonb_array_elements(edges)
     where (value->>'fromPersonKey'=core_key and value->>'toPersonKey'=operation->>'targetPersonKey') or (value->>'toPersonKey'=core_key and value->>'fromPersonKey'=operation->>'targetPersonKey')) then return false; end if;
  elsif operation->>'actionType'='update_relation_signal' then
   select value into relation from jsonb_array_elements(edges) where value->>'key'=operation->>'relationKey';
   if role not in ('npc','group') or relation is null or not (relation->>'fromPersonKey'=item->>'actorKey' or relation->>'toPersonKey'=item->>'actorKey')
    or not (relation->>'fromPersonKey'=core_key or relation->>'toPersonKey'=core_key) then return false; end if;
  elsif operation->>'actionType'='allocate_resource' then
   select value into resource from jsonb_array_elements(context->'resources') where value->>'key'=operation->>'resourceKey';
   -- Match JavaScript's binary64 subtraction, rather than allowing a decimal-only larger quantity.
   if resource is null or item->>'actorKey'<>active_self or (operation->>'amount')::double precision>(resource->>'available')::double precision-(resource->>'minimum')::double precision then return false; end if;
  elsif operation ? 'profileEntryKey' then
   field_key:=operation->>'profileEntryKey'; field_parts:=string_to_array(field_key,'.'); profile_field:=null;
   if array_length(field_parts,1)=1 and field_key in ('lifeClimate','resources','constraints') then
    profile_field:=jsonb_build_object('classification',p_source#>array['reality_profiles',case field_key when 'lifeClimate' then 'life_climate_classification' when 'resources' then 'resources_classification' else 'constraints_classification' end]);
   elsif array_length(field_parts,1)=2 and field_parts[2] ~ '^[1-9][0-9]*$' then
    field_index:=field_parts[2]::integer-1;
    profile_field:=(p_source#>array['reality_profiles',case field_parts[1] when 'goals' then 'life_goals' when 'values' then 'core_values' when 'lifeThemes' then 'life_themes' when 'pressures' then 'pressures' when 'externalVariables' then 'external_variables' else '__invalid__' end])->field_index;
   elsif array_length(field_parts,1)=3 and field_parts[1]='lifeModelDomains' and field_parts[3] ~ '^[1-9][0-9]*$' then
    profile_field:=(p_source#>array['reality_profiles','life_model_domains',field_parts[2]])->(field_parts[3]::integer-1);
   end if;
   if profile_field->>'classification' is null or profile_field->>'classification' not in ('fact','assumption') then return false; end if;
  end if;
  seen:=seen||jsonb_build_object(item->>'key',item);
 end loop;
 return true;
exception when others then return false;
end; $$;


create function public.digital_life_model_draft_rules_shape_valid_v2(p_rules jsonb)
returns boolean language sql immutable security invoker set search_path=public,pg_temp as $$
 select case when p_rules->>'version'='digital-life-rules-v2' then public.digital_life_draft_confirmed_shape_v2(p_rules) is not null else public.digital_life_draft_confirmed_shape_v1(p_rules) is not null end;
$$;
do $guard$
declare c record;
begin
 for c in select conname from pg_constraint where conrelid='public.digital_life_model_drafts'::regclass and contype='c' and pg_get_constraintdef(oid) like '%digital_life_draft_confirmed_shape_v1%' loop
  execute format('alter table public.digital_life_model_drafts drop constraint %I',c.conname);
 end loop;
end; $guard$;
alter table public.digital_life_model_drafts add constraint digital_life_model_drafts_rules_protocol_check check(public.digital_life_model_draft_rules_shape_valid_v2(request->'draftRules'));
revoke all on function public.digital_life_draft_confirmed_shape_v2(jsonb),public.digital_life_model_draft_request_common_shape_v2(jsonb),public.digital_life_model_draft_rules_shape_valid_v2(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.digital_life_draft_confirmed_shape_v2(jsonb),public.digital_life_model_draft_request_common_shape_v2(jsonb),public.digital_life_model_draft_rules_shape_valid_v2(jsonb) to authenticated;
commit;
