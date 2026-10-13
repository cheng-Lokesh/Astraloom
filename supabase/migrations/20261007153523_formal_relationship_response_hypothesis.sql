begin;
-- Fix extraction/deletion operator precedence in the existing context helper
-- forward-only; no historical migration or accepted context is rewritten.
create or replace function public.formal_default_planning_context_fingerprint_v1(p_source jsonb)
returns text language sql immutable security invoker set search_path=public,extensions as $$
 select encode(digest(convert_to(jsonb_build_object(
  'version','formal-default-planning-context-v1',
  'graph',jsonb_build_object('owner',p_source#>'{relation_graph_snapshots,user_id}',
    'id',p_source#>'{relation_graph_snapshots,id}','seed',p_source#>'{relation_graph_snapshots,seed_context_id}',
    'agent',p_source#>'{relation_graph_snapshots,agent_snapshot_id}','version',p_source#>'{relation_graph_snapshots,version}',
    'agentVersion',p_source#>'{relation_graph_snapshots,agent_snapshot_version}'),
  'seed',jsonb_build_object('id',p_source#>'{seed_contexts,id}','version',p_source#>'{seed_contexts,version}',
    'submittedAt',p_source#>'{seed_contexts,submitted_at}','frozenAt',p_source#>'{seed_contexts,frozen_at}'),
  'agents',p_source->'agent_profiles','edges',p_source->'relation_edges','profile',p_source->'reality_profiles',
  'symbolic',(p_source->'symbolic_lens')-'frozenAt')::text,'UTF8'),'sha256'),'hex');
$$;
-- Forward-only v2 self-response lane; old reservations and v1 validation remain readable.
create function public.formal_relationship_request_valid_v1(p_request jsonb)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare pair jsonb;
begin
 if not public.symbolic_keys_v1(p_request,array['version','pathKey','resourceKey','confirmedForSimulation','requestRule','responseRule','symbolicSensitivity'])
  or p_request->>'version' is distinct from 'formal-relationship-response-hypothesis-v1'
  or coalesce(p_request->>'pathKey','')!~'^(main|person-[1-9][0-9]*)$'
  or coalesce(p_request->>'resourceKey','')!~'^resource-[1-8]$'
  or p_request->'confirmedForSimulation' is distinct from 'true'::jsonb
  or not public.symbolic_keys_v1(p_request->'symbolicSensitivity',array['enabled','confirmedForSimulation'])
  or jsonb_typeof(p_request#>'{symbolicSensitivity,enabled}') is distinct from 'boolean'
  or p_request#>'{symbolicSensitivity,enabled}' is distinct from p_request#>'{symbolicSensitivity,confirmedForSimulation}' then return false;end if;
 pair:=jsonb_build_object('version','digital-life-rules-v1','graphSnapshotId','11111111-1111-4111-8111-111111111111','agentSnapshotId','11111111-1111-4111-8111-111111111111','profileRevision',0,'strategies','[]'::jsonb,'actions',jsonb_build_array(p_request->'requestRule',p_request->'responseRule'));
 return public.formal_run_rules_valid(pair)
  and p_request#>'{requestRule,pathKey}' is not distinct from p_request->'pathKey'
  and p_request#>'{responseRule,pathKey}' is not distinct from p_request->'pathKey'
  and p_request#>>'{requestRule,operation,actionType}'='request_information'
  and p_request#>>'{responseRule,operation,actionType}'='update_relation_signal'
  and p_request#>>'{responseRule,when,kind}'='after_rule'
  and p_request#>'{responseRule,when,ruleKey}' is not distinct from p_request#>'{requestRule,key}'
  and p_request#>'{requestRule,operation,targetPersonKey}' is not distinct from p_request#>'{responseRule,actorKey}';
exception when others then return false;
end;$$;

create function public.formal_default_planning_request_valid_v2(p_request jsonb)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
begin
 if p_request is null or p_request->>'version'='formal-default-planner-v1' then return public.formal_default_planning_request_valid_v1(p_request);end if;
 return public.symbolic_keys_v1(p_request,array['version','consentContext','resources','fusion','relationshipResponse'])
  and p_request->>'version'='formal-default-planner-v2'
  and public.formal_default_planning_request_valid_v1(jsonb_set(p_request-'relationshipResponse','{version}','"formal-default-planner-v1"'))
  and public.formal_relationship_request_valid_v1(p_request->'relationshipResponse')
  and exists(select 1 from jsonb_array_elements(p_request->'resources')r where r->'resourceKey'=p_request#>'{relationshipResponse,resourceKey}');
exception when others then return false;
end;$$;

-- Derive effective rules from the accepted source, never from a caller's frozen signature.
create function public.formal_relationship_effective_rules_v1(p_source jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare rules jsonb:=p_source->'digital_life_rules'; correction jsonb; original jsonb; historical jsonb; rule_index integer; operation jsonb; seen text[]:=array[]::text[];
begin
 for correction in select value from jsonb_array_elements(coalesce(p_source#>'{outcome_calibration,corrections}','[]'::jsonb))loop
  select r,ord::integer-1 into original,rule_index from jsonb_array_elements(rules->'actions')with ordinality t(r,ord)where r->>'key'=correction->>'ruleKey' and r->>'pathKey'='main';
  select r into historical from public.simulations s cross join lateral jsonb_array_elements(s.input_snapshot#>'{digitalLifeModel,rules,actions}')r
   where s.id=(correction->>'sourceRunId')::uuid and s.user_id=auth.uid() and s.status='completed' and r->>'key'=correction->>'ruleKey';
  if original is null or original is distinct from historical or correction->>'ruleKey'=any(seen)
   or correction->'ownerId' is distinct from p_source#>'{relation_graph_snapshots,user_id}'
   or correction->'seedContextId' is distinct from p_source#>'{relation_graph_snapshots,seed_context_id}'
   or correction->'graphSnapshotId' is distinct from p_source#>'{relation_graph_snapshots,id}'
   or correction->'agentSnapshotId' is distinct from p_source#>'{relation_graph_snapshots,agent_snapshot_id}'
   or correction->'profileRevision' is distinct from coalesce(p_source#>'{reality_profiles,revision}','0'::jsonb)
   or (correction->>'recordedAt')::timestamptz>(p_source#>>'{symbolic_lens,frozenAt}')::timestamptz then return null;end if;
  operation:=original->'operation';
  if correction->>'kind'='allocate_resource' and operation->>'actionType'='allocate_resource' and operation->'amount'=correction->'previousValue' then operation:=jsonb_set(operation,'{amount}',correction->'nextValue');
  elsif correction->>'kind'='update_relation_signal' and operation->>'actionType'='update_relation_signal' and operation->'signal'=correction->'previousValue' then operation:=jsonb_set(operation,'{signal}',correction->'nextValue');
  else return null;end if;
  rules:=jsonb_set(rules,array['actions',rule_index::text],jsonb_set(jsonb_set(original,'{operation}',operation),'{evidenceSummary}',correction->'evidenceSummary'));
  seen:=array_append(seen,correction->>'ruleKey');
 end loop;
 if not public.formal_run_rules_valid(rules) then return null;end if;
 return rules;
exception when others then return null;
end;$$;

-- All ordinal source maps are derived with the same ordering as the server adapter.
create function public.formal_relationship_source_valid_v1(p_request jsonb,p_source jsonb,p_horizon integer)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare rules jsonb:=public.formal_relationship_effective_rules_v1(p_source); rr jsonb:=p_request->'relationshipResponse';
 request_rule jsonb;response_rule jsonb;self_actor jsonb;npc jsonb;core jsonb;edge jsonb;
 rule jsonb;prior jsonb;seen text[]:=array[]::text[];ticks integer:=case when p_horizon=30 then 3 else 6 end;
begin
 if not public.formal_default_planning_request_valid_v2(p_request) then return false;end if;
 if p_request->>'version'='formal-default-planner-v1' then return true;end if;
 if rules is null or rules#>'{graphSnapshotId}' is distinct from p_source#>'{relation_graph_snapshots,id}'
  or rules->'agentSnapshotId' is distinct from p_source#>'{relation_graph_snapshots,agent_snapshot_id}'
  or rules->'profileRevision' is distinct from coalesce(p_source#>'{reality_profiles,revision}','0'::jsonb) then return false;end if;
 select value into request_rule from jsonb_array_elements(rules->'actions')where value->'key'=rr#>'{requestRule,key}';
 select value into response_rule from jsonb_array_elements(rules->'actions')where value->'key'=rr#>'{responseRule,key}';
 if request_rule is distinct from rr->'requestRule' or response_rule is distinct from rr->'responseRule' then return false;end if;
 select a||jsonb_build_object('key','person-'||ord::text) into core from jsonb_array_elements(p_source->'agent_profiles')with ordinality t(a,ord)where a->>'agent_type'='user_core';
 select a||jsonb_build_object('key','person-'||ord::text) into self_actor from jsonb_array_elements(p_source->'agent_profiles')with ordinality t(a,ord)
  where (rr->>'pathKey'='main' and a->>'agent_type'='user_core')or ('person-'||ord::text=rr->>'pathKey' and a->>'agent_type'='user_variant');
 select a||jsonb_build_object('key','person-'||ord::text) into npc from jsonb_array_elements(p_source->'agent_profiles')with ordinality t(a,ord)
  where 'person-'||ord::text=response_rule->>'actorKey' and a->>'agent_type' in ('npc','group');
 edge:=p_source->'relation_edges'->((substring(response_rule#>>'{operation,relationKey}' from 10))::integer-1);
 if core is null or self_actor is null or npc is null or request_rule->'actorKey' is distinct from self_actor->'key'
  or edge is null or not jsonb_build_array(edge->'from_agent_id',edge->'to_agent_id') @> jsonb_build_array(core->'id',npc->'id')
  or (rr->>'pathKey'<>'main' and not exists(select 1 from jsonb_array_elements(rules->'strategies')s where s->'participantKey'=rr->'pathKey'))
  or (rr#>>'{symbolicSensitivity,enabled}'='true' and p_source#>>'{symbolic_lens,status}' is distinct from 'attached')then return false;end if;
 -- Complete ancestor rules must be ordered, same-path and inside this horizon.
 for rule in select value from jsonb_array_elements(rules->'actions')loop
  if rule->>'key'=any(seen) then return false;end if;
  if rule#>>'{when,kind}'='at_tick' then
   if (rule#>>'{when,tickIndex}')::integer>=ticks then return false;end if;
  else
   select value into prior from jsonb_array_elements(rules->'actions')where value->'key'=rule#>'{when,ruleKey}';
   if prior is null or not prior->>'key'=any(seen) or prior->'pathKey' is distinct from rule->'pathKey' then return false;end if;
  end if;
  seen:=array_append(seen,rule->>'key');
 end loop;
 return true;
exception when others then return false;
end;$$;

create function public.formal_relationship_frozen_valid_v1(p_frame jsonb,p_request jsonb,p_planning jsonb,p_source jsonb)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare rr jsonb:=p_request->'relationshipResponse';rules jsonb:=public.formal_relationship_effective_rules_v1(p_source);
 lens jsonb:=p_source->'symbolic_lens';agents jsonb;relations jsonb;resources jsonb;self_actor jsonb;npc jsonb;edge jsonb;resource jsonb;
 inputs jsonb;symbolic_source jsonb;extra numeric:=0;enabled boolean:=rr#>'{symbolicSensitivity,enabled}'='true'::jsonb;
begin
 if (p_frame->>'effectiveRulesSignature')::jsonb is distinct from rules then return false;end if;
 select jsonb_agg(jsonb_build_object('key','person-'||ord::text,'sourceAgentId',a->'id','sourceOrdinal',ord,'role',a->'agent_type')order by ord) into agents from jsonb_array_elements(p_source->'agent_profiles')with ordinality t(a,ord);
 select jsonb_agg(jsonb_build_object('key','relation-'||ord::text,'sourceEdgeId',e->'id',
  'fromPersonKey',(select 'person-'||n::text from jsonb_array_elements(p_source->'agent_profiles')with ordinality a(v,n)where v->'id'=e->'from_agent_id'),
  'toPersonKey',(select 'person-'||n::text from jsonb_array_elements(p_source->'agent_profiles')with ordinality a(v,n)where v->'id'=e->'to_agent_id'))order by ord)into relations
  from jsonb_array_elements(p_source->'relation_edges')with ordinality t(e,ord);
 select coalesce(jsonb_agg(jsonb_build_object('key','resource-'||ord::text,'profileResourceKey',r->'key')order by ord),'[]'::jsonb)into resources from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,resources}','[]'::jsonb))with ordinality t(r,ord);
 select a||jsonb_build_object('ordinal',ord)into self_actor from jsonb_array_elements(p_source->'agent_profiles')with ordinality t(a,ord)where 'person-'||ord::text=rr#>>'{requestRule,actorKey}';
 select a||jsonb_build_object('ordinal',ord)into npc from jsonb_array_elements(p_source->'agent_profiles')with ordinality t(a,ord)where 'person-'||ord::text=rr#>>'{responseRule,actorKey}';
 edge:=p_source->'relation_edges'->((substring(rr#>>'{responseRule,operation,relationKey}' from 10))::integer-1);
 select value into resource from jsonb_array_elements(p_planning->'resources')where value->'resourceKey'=rr->'resourceKey';
 if enabled then
  if lens->>'status' is distinct from 'attached' then return false;end if;
  inputs:=jsonb_build_object('responsibilityCount',lens#>'{frame,calculation,groupCounts,responsibility}','peerCount',lens#>'{frame,calculation,groupCounts,peer}');
  if (inputs->>'responsibilityCount')::numeric>(inputs->>'peerCount')::numeric then extra:=0.05;end if;
  symbolic_source:=jsonb_build_object('sourceVersion',lens#>'{frame,sourceVersion}','snapshotId',lens#>'{provenance,snapshotId}','preferenceRevision',lens->'preferenceRevision','frameVersion','formal-symbolic-frame-v1','ruleVersion','symbolic-product-rules-v1','calculationVersion','local-pillar-approximation-v1');
 end if;
 return p_frame is not distinct from jsonb_build_object('authorization',rr,'status',resource->'status','selfLabel',btrim(self_actor->>'display_name'),'npcLabel',btrim(npc->>'display_name'),'relationLabel',btrim(edge->>'relationship_type'),
  'selfSourceAgentId',self_actor->'id','npcSourceAgentId',npc->'id','sourceEdgeId',edge->'id','npcSourceOrdinal',npc->'ordinal',
  'effectiveRulesSignature',p_frame->'effectiveRulesSignature','ruleBindings',jsonb_build_object('agents',agents,'relations',relations,'resources',resources),
  'baseNegativeReduction',0.05,'symbolicAdditionalReduction',extra,'negativeReduction',0.05+extra,'reductionCap',0.1,
  'symbolicStatus',case when enabled then 'active' else 'off' end,'symbolicInputs',inputs,'symbolicSource',symbolic_source,'classification','hypothesis','realWorldEvidence',false,'scientificProbability',false);
exception when others then return false;
end;$$;

-- Validate one rule Event and all its after_rule ancestors in the exact sample.
create function public.formal_relationship_rule_event_valid_v1(p_rule jsonb,p_frame jsonb,p_world jsonb,p_namespace text,p_world_namespace text,p_start timestamptz,p_ticks integer,p_seen text[] default array[]::text[])
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare e jsonb;actor_source jsonb;actor jsonb;actor_evidence jsonb;assumption jsonb;operation jsonb;target jsonb;relation jsonb;
 actor_id text;entity_id text;resource_id text;relation_id text;tick integer;expected_at timestamptz;previous_rule jsonb;previous jsonb;previous_index integer;event_index integer;
 entity_targets jsonb;relation_targets jsonb:='[]';resource_targets jsonb:='[]';rules jsonb:=(p_frame->>'effectiveRulesSignature')::jsonb;
begin
 if p_rule is null or p_rule->>'key'=any(p_seen) or p_rule->'pathKey' is distinct from p_frame#>'{authorization,pathKey}' then return false;end if;
 select value,ord::integer into e,event_index from jsonb_array_elements(p_world->'worldEvents')with ordinality t(value,ord)
  where value->>'proposalId' ~ ('^action_proposal_v2_'||p_namespace||'_[0-5]_'||(p_rule->>'key')||'$');
 if e is null then return false;end if;
 tick:=(regexp_match(e->>'proposalId','_([0-5])_rule-[1-9][0-9]*$'))[1]::integer;
 expected_at:=p_start+tick*(case when p_ticks=3 then 10 else 15 end)*interval '1 day';
 select value into actor_source from jsonb_array_elements(p_frame#>'{ruleBindings,agents}')where value->'key'=p_rule->'actorKey';
 actor_id:=public.formal_planning_core_id_v1('agent_definition',p_world_namespace,actor_source->>'sourceAgentId');
 entity_id:=public.formal_planning_core_id_v1('world_entity',p_world_namespace,actor_source->>'sourceAgentId');
 select value into actor from jsonb_array_elements(p_world->'agentDefinitions')where value->>'id'=actor_id;
 select value into actor_evidence from jsonb_array_elements(p_world#>'{realityBoundarySnapshot,evidenceLedger,items}')where value->>'claimKey'='formal.agent.'||(actor_source->>'sourceOrdinal');
 select value into assumption from jsonb_array_elements(p_world#>'{realityBoundarySnapshot,assumptionLedger,assumptions}')where value->>'category'='digital_life_rule_'||(p_rule->>'key');
 if actor is null or actor->>'actorType' is distinct from case when actor_source->>'role'='group' then 'organization' when actor_source->>'role'='npc' then 'third_party' else 'self' end or actor_evidence is null or assumption is null or not actor->'realEvidenceIds' @> jsonb_build_array(actor_evidence->'id')
  or not exists(select 1 from jsonb_array_elements(actor_evidence->'provenance')p where p->>'sourceRef'='agent_snapshot:'||(rules->>'agentSnapshotId')||':'||(actor_source->>'sourceAgentId')and (p->>'capturedAt')::timestamptz=(p_world#>>'{realityBoundarySnapshot,updatedAt}')::timestamptz)
  or e->'causalRealEvidenceIds' is distinct from jsonb_build_array(actor_evidence->'id')
  or e->'causalAssumptionIds' is distinct from jsonb_build_array(assumption->'id')
  or e->>'actorId' is distinct from actor_id or tick>=p_ticks
  or (e->>'createdAt')::timestamptz is distinct from expected_at or (e->>'commandCreatedAt')::timestamptz is distinct from expected_at
  or e->'seedContextId' is distinct from p_world->'seedContextId' or not p_world->'worldEventIds' @> jsonb_build_array(e->'id')
  or not p_world->'appliedTransitionCommandIds' @> jsonb_build_array(e->'commandId')
  or e->>'evidenceClass' is distinct from 'world_transition_simulation_evidence' or e->'engineVersion' is distinct from p_world->'engineVersion'
  or (e->>'afterRevision')::integer<>(e->>'beforeRevision')::integer+1 or (e->>'afterRevision')::integer>(p_world->>'revision')::integer
  or assumption->>'subjectType' is distinct from case when actor_source->>'role' in ('npc','group')then 'third_party' else 'self' end
  or assumption->>'epistemicStatus' is distinct from 'confirmed_for_simulation' or assumption->>'confirmationStatus' is distinct from 'confirmed'
  or assumption->>'confirmationRequirement' is distinct from 'required' or assumption->>'impactLevel' is distinct from 'high'
  or assumption->>'statement' is distinct from '用户确认的条件模拟规则：'||(p_rule#>>'{operation,actionType}')||'。依据：'||(p_rule->>'evidenceSummary')
  or assumption ? 'parameterRange' or assumption->'contradictingRealEvidenceIds' is distinct from '[]'::jsonb
  or jsonb_typeof(assumption->'supportingRealEvidenceIds') is distinct from 'array'
  or exists(select 1 from jsonb_array_elements(assumption->'supportingRealEvidenceIds')s where not exists(select 1 from jsonb_array_elements(p_world#>'{realityBoundarySnapshot,evidenceLedger,items}')x where x->'id'=s and x->>'claimKey'='formal.outcome.correction.'||(p_rule->>'key')))then return false;end if;
 entity_targets:=jsonb_build_array(entity_id);
 if p_rule#>>'{operation,actionType}'='request_information' then
  select value into target from jsonb_array_elements(p_frame#>'{ruleBindings,agents}')where value->'key'=p_rule#>'{operation,targetPersonKey}';
  if target is null then return false;end if;
  entity_targets:=entity_targets||jsonb_build_array(public.formal_planning_core_id_v1('world_entity',p_world_namespace,target->>'sourceAgentId'));
  operation:=jsonb_build_object('actionType','request_information','targetEntityId',entity_targets->1,'question',p_rule#>'{operation,question}');
 elsif p_rule#>>'{operation,actionType}'='update_relation_signal' then
  select value into target from jsonb_array_elements(p_frame#>'{ruleBindings,relations}')where value->'key'=p_rule#>'{operation,relationKey}';
  relation_id:=public.formal_planning_core_id_v1('world_relation',p_world_namespace,target->>'sourceEdgeId');
  select value into relation from jsonb_array_elements(p_world->'relations')where value->>'id'=relation_id;
  if relation is null or not exists(select 1 from jsonb_array_elements(e->'deltas')d where d->>'valueType'='relation'and d->>'path'='relations.'||relation_id||'.signal'and d->'after'=p_rule#>'{operation,signal}')then return false;end if;
  entity_targets:=jsonb_build_array(relation->'fromEntityId',relation->'toEntityId');relation_targets:=jsonb_build_array(relation_id);
  operation:=jsonb_build_object('actionType','update_relation_signal','relationId',relation_id,'signal',p_rule#>'{operation,signal}');
 elsif p_rule#>>'{operation,actionType}'='allocate_resource' then
  select value into target from jsonb_array_elements(p_frame#>'{ruleBindings,resources}')where value->'key'=p_rule#>'{operation,resourceKey}';
  if target is null then return false;end if;
  resource_id:=public.formal_planning_core_id_v1('world_resource',p_world_namespace,target->>'profileResourceKey');resource_targets:=jsonb_build_array(resource_id);
  operation:=jsonb_build_object('actionType','allocate_resource','resourceId',resource_id,'amount',p_rule#>'{operation,amount}');
 else
  operation:=jsonb_build_object('actionType','update_commitment','commitmentId','digital_life_'||(p_rule->>'actorKey')||'_'||(p_rule#>>'{operation,commitmentKey}'),'label',p_rule#>'{operation,label}','status',p_rule#>'{operation,status}');
 end if;
 if e->'operation' is distinct from operation or e->'eventType' is distinct from operation->'actionType'
  or e->'targetEntityIds' is distinct from entity_targets or e->'targetResourceIds' is distinct from resource_targets
  or e->'targetRelationIds' is distinct from relation_targets or e->'targetVariableIds' is distinct from '[]'::jsonb then return false;end if;
 if p_rule#>>'{when,kind}'='at_tick' then return tick=(p_rule#>>'{when,tickIndex}')::integer and e->'priorWorldEventIds'='[]'::jsonb;end if;
 select value into previous_rule from jsonb_array_elements(rules->'actions')where value->'key'=p_rule#>'{when,ruleKey}';
 if public.formal_relationship_rule_event_valid_v1(previous_rule,p_frame,p_world,p_namespace,p_world_namespace,p_start,p_ticks,array_append(p_seen,p_rule->>'key')) is distinct from true then return false;end if;
 select value,ord::integer into previous,previous_index from jsonb_array_elements(p_world->'worldEvents')with ordinality t(value,ord)where value->>'proposalId' ~ ('^action_proposal_v2_'||p_namespace||'_[0-5]_'||(previous_rule->>'key')||'$');
 return e->'priorWorldEventIds'=jsonb_build_array(previous->'id')and previous_index<event_index and (previous->>'afterRevision')::integer<=(e->>'beforeRevision')::integer and (previous->>'createdAt')::timestamptz<(e->>'createdAt')::timestamptz;
exception when others then return false;
end;$$;

-- JSON/JS numeric and omission semantics for accepted planner policy fingerprints.
create function public.formal_relationship_canonical_json_v1(p_value jsonb)
returns text language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare result text;n double precision;
begin
 if jsonb_typeof(p_value)='object' then select '{'||coalesce(string_agg(to_jsonb(k)::text||':'||public.formal_relationship_canonical_json_v1(v),','order by k collate "C"),'')||'}' into result from jsonb_each(p_value)t(k,v);return result;end if;
 if jsonb_typeof(p_value)='array' then select '['||coalesce(string_agg(public.formal_relationship_canonical_json_v1(v),','order by ord),'')||']'into result from jsonb_array_elements(p_value)with ordinality t(v,ord);return result;end if;
 if jsonb_typeof(p_value)='number' then
  n:=p_value::text::double precision;
  if n=0 then return '0';end if;
  if abs(n)>=0.000001 and abs(n)<1e21 then return (n::text::numeric)::text;end if;
  return regexp_replace(n::text,'e([+-]?)0+([0-9]+)$','e\1\2');
 end if;
 return p_value::text;
end;$$;

create or replace function public.formal_planning_core_id_v1(p_kind text,p_namespace text,p_source_key text)
returns text language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare first bigint:=2166136261; second bigint:=2246822519; content text:=p_namespace||':'||p_kind||':'||p_source_key; code integer; i integer; prefix text;
begin
 prefix:=case p_kind when 'agent_definition' then 'agent_definition_v2_' when 'world_entity' then 'world_entity_v2_' when 'world_relation' then 'world_relation_v2_' when 'world_resource' then 'world_resource_v2_' else null end;
 if prefix is null or content!~'^[a-zA-Z0-9:_-]+$' then return null;end if;
 for i in 1..length(content) loop
  code:=ascii(substr(content,i,1));
  first:=mod(((first # code::bigint)::numeric*16777619),4294967296)::bigint;
  second:=mod(((second # code::bigint)::numeric*3266489917),4294967296)::bigint;
 end loop;
 return prefix||public.formal_planning_base36_v1(first)||public.formal_planning_base36_v1(second);
end;$$;

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
  insert into public.generation_jobs(user_id,seed_context_id,trace_id,version,writer_version,idempotency_key,job_type,status,input_refs,formal_graph_snapshot_id,formal_content_hash,formal_accepted_at,formal_simulation_start_at,frozen_source_input)
    values(owner_id,graph_row.seed_context_id,gen_random_uuid()::text,'formal-run-reservation-v1','formal-run-reservation-v1',p_idempotency_key::text,'formal_run_reservation','queued',jsonb_build_object('graph_snapshot_id',graph_row.id),graph_row.id,content_hash,accepted_at,simulation_start_at,source);
  frozen_source_input:=source; run:=null; perform set_config('app.formal_reservation_rpc','off',true); return next;
exception when others then perform set_config('app.formal_reservation_rpc','off',true); raise;
end; $$;


alter function public.formal_run_bundle_matches_reservation(jsonb,jsonb,timestamptz,timestamptz,integer) rename to formal_run_bundle_matches_reservation_before_relationship;
create function public.formal_run_bundle_matches_reservation(p_bundle jsonb,p_source jsonb,p_accepted timestamptz,p_start timestamptz,p_horizon integer)
returns boolean language plpgsql security invoker set search_path=public,extensions as $$
declare request jsonb:=nullif(p_source->'default_planning','null'::jsonb);planning jsonb:=p_bundle->'defaultPlanningSnapshot';
 graph jsonb:=p_source->'relation_graph_snapshots';profile jsonb:=p_source->'reality_profiles';lens jsonb:=p_source->'symbolic_lens';
 expected_paths jsonb;core_actor jsonb;strategy jsonb;path_key text:=p_bundle#>>'{inputSnapshot,activePathKey}';source_actor jsonb;
 actor_id text;entity_id text;namespace text;fusion_status text;caution numeric:=0;rhythm numeric:=0;reduction numeric:=0;peak numeric:=0;
 inputs jsonb;derived jsonb;expected_provenance jsonb;ticks integer:=case when p_horizon=30 then 3 else 6 end;
 authorized jsonb;source_resource jsonb;resource jsonb;resource_id text;bound_resource jsonb;
 neutral double precision;expected_status text;explicit_rule boolean;all_inactive boolean:=true;resource_ordinal integer;
 entry jsonb;trajectory jsonb;world jsonb;trace jsonb;binding jsonb;event jsonb;delta jsonb;actor jsonb;entity jsonb;actor_evidence jsonb;
 final_resource jsonb;provenance jsonb;prior boolean;amount double precision;spent double precision;causal_ids jsonb;
 base_assumption jsonb;prior_assumption jsonb;source_provenance jsonb;i integer;trace_count integer;remaining double precision;expected_events jsonb;
 relationship jsonb;request_event jsonb;response_event jsonb;response_trace jsonb;relationship_assumption jsonb;rule jsonb;
 sample_namespace text;occurred_at timestamptz;consumed boolean;response_reduction double precision;first_response boolean;expected_source_signature jsonb;policy_input jsonb;
begin
 if request is null or request->>'version'='formal-default-planner-v1' then
  return public.formal_run_bundle_matches_reservation_before_relationship(p_bundle,p_source,p_accepted,p_start,p_horizon);
 end if;
 if public.formal_default_planning_request_valid_v2(request) is distinct from true
  or p_source->>'planning_version' is distinct from request->>'version'
  or request->>'consentContext' is distinct from p_source->>'planning_consent_context'
  or request->>'consentContext' is distinct from public.formal_default_planning_context_fingerprint_v1(p_source)
  or jsonb_typeof(planning) is distinct from 'object' or planning->>'version' is distinct from 'formal-default-planner-v2'
  or planning->>'budgetSemantics' is distinct from 'per_path_per_sample_whole_run'
  or planning->'maxTicks' is distinct from to_jsonb(ticks)
  or coalesce(p_bundle->>'policyFingerprint','')!~'^[a-f0-9]{24}$'
  or planning#>'{sourceBinding,ownerId}' is distinct from graph->'user_id'
  or planning#>'{sourceBinding,seedContextId}' is distinct from graph->'seed_context_id'
  or planning#>'{sourceBinding,graphSnapshotId}' is distinct from graph->'id'
  or planning#>'{sourceBinding,agentSnapshotId}' is distinct from graph->'agent_snapshot_id'
  or planning#>'{sourceBinding,profileId}' is distinct from coalesce(profile->'id','null'::jsonb)
  or planning#>'{sourceBinding,profileRevision}' is distinct from coalesce(profile->'revision','0'::jsonb)
  or planning#>>'{sourceBinding,consentContext}' is distinct from p_source->>'planning_consent_context'
  or (planning#>>'{sourceBinding,acceptedAt}')::timestamptz is distinct from p_accepted
  or p_bundle#>'{inputSnapshot,defaultPlanningAuthorization}' is distinct from jsonb_build_object('version',request->'version','resources',request->'resources')
  then return false;end if;
 if public.formal_relationship_source_valid_v1(request,p_source,p_horizon) is distinct from true
  or public.formal_relationship_frozen_valid_v1(planning->'relationshipResponse',request,planning,p_source) is distinct from true
  or p_bundle#>'{inputSnapshot,relationshipResponseAuthorization}' is distinct from (request->'relationshipResponse')-'symbolicSensitivity'
  or p_bundle#>'{inputSnapshot,relationshipResponseHypothesis}' is distinct from planning->'relationshipResponse'
  or p_bundle#>'{inputSnapshot,digitalLifeModel,rules}' is distinct from public.formal_relationship_effective_rules_v1(p_source) then return false;end if;
 relationship:=planning->'relationshipResponse';
 policy_input:=(p_bundle->'inputSnapshot')-array['planningHypothesis','relationshipResponseHypothesis'];
 if p_bundle->>'policyFingerprint' is distinct from left(encode(digest(convert_to(public.formal_relationship_canonical_json_v1(policy_input),'UTF8'),'sha256'),'hex'),24)
  or p_bundle->>'causalFingerprint' is distinct from left(encode(digest(convert_to(public.formal_relationship_canonical_json_v1(p_bundle->'inputSnapshot'),'UTF8'),'sha256'),'hex'),24)then return false;end if;
 expected_source_signature:=jsonb_build_object('sourceBinding',planning->'sourceBinding','resources',planning->'resources','maxTicks',ticks,
  'relationshipSource',jsonb_build_object('authorization',(relationship->'authorization')-'symbolicSensitivity','ruleBindings',relationship->'ruleBindings','effectiveRulesSignature',relationship->'effectiveRulesSignature'));
 select jsonb_build_object('pathKey','main','sourceAgentId',a->'id','sourceAgentOrdinal',ord)
 into core_actor from jsonb_array_elements(p_source->'agent_profiles')with ordinality t(a,ord) where a->>'agent_type'='user_core';
 if core_actor is null then return false;end if;
 expected_paths:=jsonb_build_array(core_actor);
 for strategy in select value from jsonb_array_elements(coalesce(p_source#>'{digital_life_rules,strategies}','[]'::jsonb))loop
  select jsonb_build_object('pathKey',strategy->'participantKey','sourceAgentId',a->'id','sourceAgentOrdinal',ord) into source_actor
  from jsonb_array_elements(p_source->'agent_profiles')with ordinality t(a,ord)
  where 'person-'||ord::text=strategy->>'participantKey' and a->>'agent_type'='user_variant';
  if source_actor is null then return false;end if;
  expected_paths:=expected_paths||jsonb_build_array(source_actor);
 end loop;
 if planning#>'{sourceBinding,allowedPaths}' is distinct from expected_paths then return false;end if;
 select value into source_actor from jsonb_array_elements(expected_paths) where value->>'pathKey'=path_key;
 if source_actor is null then return false;end if;
 namespace:='formal-'||(p_bundle->>'policyFingerprint');
 actor_id:=public.formal_planning_core_id_v1('agent_definition',namespace,source_actor->>'sourceAgentId');
 entity_id:=public.formal_planning_core_id_v1('world_entity',namespace,source_actor->>'sourceAgentId');
 fusion_status:=case when request#>>'{fusion,enabled}'='true' then case when lens->>'status'='attached' then 'active' else 'unavailable' end else 'off' end;
 if fusion_status='active' then
  inputs:=jsonb_build_object('groupCounts',lens#>'{frame,calculation,groupCounts}','natalDayElement',lens#>'{frame,calculation,natalDayElement}','periodYearElement',lens#>'{frame,calculation,periodYearElement}','periodMonthElement',lens#>'{frame,calculation,periodMonthElement}');
  select max(value::numeric) into peak from jsonb_each_text(inputs->'groupCounts');
  if peak>0 and ((inputs#>>'{groupCounts,responsibility}')::numeric=peak or (inputs#>>'{groupCounts,support}')::numeric=peak)then caution:=0.05;end if;
  if public.formal_planning_element_channel_v1(inputs->>'natalDayElement',inputs->>'periodYearElement')<>public.formal_planning_element_channel_v1(inputs->>'natalDayElement',inputs->>'periodMonthElement')then rhythm:=0.05;end if;
  expected_provenance:=jsonb_build_object('sourceVersion',lens#>'{frame,sourceVersion}','snapshotId',lens#>'{provenance,snapshotId}','preferenceRevision',lens->'preferenceRevision','frameVersion','formal-symbolic-frame-v1','ruleVersion','symbolic-product-rules-v1','calculationVersion','local-pillar-approximation-v1','sourceRefs',jsonb_build_array('natal_stem_counts','current_year_month','natal_day_element','element_relation_table'));
 end if;
 reduction:=least(0.1,caution+rhythm);
 derived:=jsonb_build_object('cautionReduction',caution,'rhythmReduction',rhythm,'relationshipEffect','not_implemented');
 if planning->'fusion' is distinct from jsonb_build_object('version','symbolic-initial-planning-hypothesis-v1',
  'enabled',request#>'{fusion,enabled}','confirmedForSimulation',request#>'{fusion,confirmedForSimulation}',
  'status',fusion_status,'reductionCap',0.1,'reduction',reduction,'initialAmountFactor',1-reduction,
  'inputs',inputs,'provenance',expected_provenance,'derivation',derived,'classification','hypothesis','realWorldEvidence',false,'scientificProbability',false)
  or p_bundle#>'{inputSnapshot,planningHypothesis}' is distinct from jsonb_build_object('version','symbolic-initial-planning-hypothesis-v1','enabled',request#>'{fusion,enabled}','status',fusion_status,'reductionCap',0.1,'reduction',reduction,'initialAmountFactor',1-reduction,'inputs',inputs,'derivation',derived,'classification','hypothesis','scientificProbability',false,'realWorldEvidence',false)
  then return false;end if;
 if jsonb_typeof(planning->'resources') is distinct from 'array' or jsonb_array_length(planning->'resources')<>jsonb_array_length(request->'resources')then return false;end if;
 for authorized,i in select value,ord::integer-1 from jsonb_array_elements(request->'resources')with ordinality t(value,ord)loop
  resource_ordinal:=(substring(authorized->>'resourceKey' from 10))::integer;
  source_resource:=profile#>array['world_model_inputs','resources',(resource_ordinal-1)::text];resource:=planning->'resources'->i;
  neutral:=public.formal_planning_neutral_amount_v1((authorized->>'totalBudgetLimit')::double precision,(source_resource->>'available')::double precision,(source_resource->>'minimum')::double precision,ticks);
  explicit_rule:=exists(select 1 from jsonb_array_elements(coalesce(p_bundle#>'{inputSnapshot,digitalLifeModel,rules,actions}','[]'::jsonb))r where r#>>'{operation,actionType}'='allocate_resource' and r#>'{operation,resourceKey}'=authorized->'resourceKey');
  expected_status:=case when source_resource->'usePerTick'<>'null'::jsonb then 'explicit_rate' when explicit_rule then 'explicit_rule' when neutral<0.000001 then 'no_budget_headroom' else 'active' end;
  all_inactive:=all_inactive and expected_status<>'active';
  if source_resource is null or resource is distinct from jsonb_build_object('resourceKey',authorized->'resourceKey','label',source_resource->'label','unit',source_resource->'unit','profileResourceKey',source_resource->'key','resourceType',source_resource->'resourceType','maximum',source_resource->'maximum','classification',source_resource->'classification','evidenceSummary',source_resource->'evidenceSummary','status',expected_status,'totalBudgetLimit',authorized->'totalBudgetLimit','initialAvailable',source_resource->'available','minimum',source_resource->'minimum','neutralAmount',case when expected_status='active' then neutral else 0 end,'declaredRate',source_resource->'usePerTick','explicitRulePresent',explicit_rule,'assumptionCategory','formal_default_planning_resource_'||resource_ordinal::text)then return false;end if;
 end loop;
 if planning->>'status' is distinct from case when all_inactive then 'inactive' else 'active' end then return false;end if;
 if jsonb_typeof(p_bundle->'defaultPlanningTraces') is distinct from 'array'
  or jsonb_array_length(p_bundle->'defaultPlanningTraces')<>3
  or jsonb_array_length(p_bundle#>'{trajectoryAnalysis,trajectories}')<>3
  or jsonb_array_length(p_bundle->'worldSnapshots')<>3 then return false;end if;
 -- event_logs/simulation_ticks persist the top-level ledger. Require the exact
 -- controlled World ledger expanded in runtime order, including branch/time/index.
 select coalesce(jsonb_agg(e.value||jsonb_build_object('branchId',t.value->'trajectoryId','tickIndex',e.event_order-1)
  order by t.trajectory_order,e.event_order),'[]'::jsonb) into expected_events
 from jsonb_array_elements(p_bundle#>'{trajectoryAnalysis,trajectories}')with ordinality t(value,trajectory_order)
 cross join lateral jsonb_array_elements((p_bundle->'worldSnapshots'->(t.trajectory_order::integer-1))->'worldEvents')with ordinality e(value,event_order);
 if p_bundle->'events' is distinct from expected_events then return false;end if;
 for entry,i in select value,ord::integer-1 from jsonb_array_elements(p_bundle->'defaultPlanningTraces')with ordinality t(value,ord)loop
  trajectory:=p_bundle#>array['trajectoryAnalysis','trajectories',i::text];world:=p_bundle->'worldSnapshots'->i;
  if entry->'trajectoryId' is distinct from trajectory->'trajectoryId' or world is distinct from trajectory->'finalWorld'
   or trajectory->'trajectorySeed' is distinct from to_jsonb((p_bundle#>>'{inputSnapshot,deterministicSeed}')::integer+i)
   or world->'seedContextId' is distinct from graph->'seed_context_id'
   or (select count(distinct value->>'proposalId')from jsonb_array_elements(world->'worldEvents'))<>jsonb_array_length(world->'worldEvents')
   or (select count(distinct value->>'proposalId')from jsonb_array_elements(entry->'trace'))<>jsonb_array_length(entry->'trace')
   or jsonb_typeof(entry->'trace') is distinct from 'array' or jsonb_array_length(entry->'trace')>48 then return false;end if;
  select value into actor from jsonb_array_elements(world->'agentDefinitions') where value->>'id'=actor_id and value->>'actorType'='self';
  select value into entity from jsonb_array_elements(world->'entities') where value->>'id'=entity_id and value->>'agentDefinitionId'=actor_id;
  select value into actor_evidence from jsonb_array_elements(world#>'{realityBoundarySnapshot,evidenceLedger,items}')where value->'id'=actor->'realEvidenceIds'->0;
  if actor is null or entity is null or actor_evidence->>'claimKey' is distinct from 'formal.agent.'||(source_actor->>'sourceAgentOrdinal')
   or not exists(select 1 from jsonb_array_elements(actor_evidence->'provenance')p where p->>'sourceRef'='agent_snapshot:'||(graph->>'agent_snapshot_id')||':'||(source_actor->>'sourceAgentId)
    and (p->>'capturedAt')::timestamptz=(p_bundle#>>'{forecastTiming,boundaryAt}')::timestamptz)then return false;end if;
  sample_namespace:='formal_'||(p_bundle->>'policyFingerprint')||'_'||(trajectory->>'trajectorySeed');
  for rule in select value from jsonb_array_elements(p_bundle#>'{inputSnapshot,digitalLifeModel,rules,actions}')where value->>'pathKey'=path_key loop
   if path_key=relationship#>>'{authorization,pathKey}' and exists(select 1 from jsonb_array_elements(world->'worldEvents')e where e->>'proposalId'~('^action_proposal_v2_'||sample_namespace||'_[0-5]_'||(rule->>'key')||'$'))
    and public.formal_relationship_rule_event_valid_v1(rule,relationship,world,sample_namespace,namespace,p_start,ticks) is distinct from true then return false;end if;
  end loop;
  select value into request_event from jsonb_array_elements(world->'worldEvents')where value->>'proposalId'~('^action_proposal_v2_'||sample_namespace||'_[0-5]_'||(relationship#>>'{authorization,requestRule,key}')||'$');
  select value into response_event from jsonb_array_elements(world->'worldEvents')where value->>'proposalId'~('^action_proposal_v2_'||sample_namespace||'_[0-5]_'||(relationship#>>'{authorization,responseRule,key}')||'$');
  for trace in select value from jsonb_array_elements(entry->'trace')loop
   select value into resource from jsonb_array_elements(planning->'resources')where value->'resourceKey'=trace->'resourceKey' and value->>'status'='active';
   if resource is null then return false;end if;
   resource_id:=public.formal_planning_core_id_v1('world_resource',namespace,resource->>'profileResourceKey');
   binding:=trace->'worldBinding';
   select value into bound_resource from jsonb_array_elements(binding->'resources')where value->'resourceKey'=resource->'resourceKey';
   select value into final_resource from jsonb_array_elements(world->'resources')where value->>'id'=resource_id;
   prior:=(trace->>'tickIndex')::integer=0 and fusion_status='active';
   amount:=(resource->>'neutralAmount')::double precision*(case when prior then (1-reduction)::double precision else 1 end);
   occurred_at:=p_start+(trace->>'tickIndex')::integer*(case when ticks=3 then 10 else 15 end)*interval '1 day';
   response_trace:=null;relationship_assumption:=null;response_reduction:=0;first_response:=false;
   if path_key=relationship#>>'{authorization,pathKey}' and resource->'resourceKey'=relationship#>'{authorization,resourceKey}'
    and response_event is not null and (response_event->>'createdAt')::timestamptz<occurred_at then
    if prior or request_event is null
     or public.formal_relationship_rule_event_valid_v1(relationship#>'{authorization,responseRule}',relationship,world,sample_namespace,namespace,p_start,ticks) is distinct from true then return false;end if;
    select value into relationship_assumption from jsonb_array_elements(world#>'{realityBoundarySnapshot,assumptionLedger,assumptions}')where value->>'category'='formal_relationship_response_v1';
    if relationship_assumption is null or relationship_assumption->>'subjectType' is distinct from 'self'
     or relationship_assumption->>'epistemicStatus' is distinct from 'confirmed_for_simulation' or relationship_assumption->>'confirmationStatus' is distinct from 'confirmed'
     or relationship_assumption->>'confirmationRequirement' is distinct from 'required' or relationship_assumption->>'impactLevel' is distinct from 'low'
     or relationship_assumption->'supportingRealEvidenceIds' is distinct from '[]'::jsonb or relationship_assumption->'contradictingRealEvidenceIds' is distinct from '[]'::jsonb
     or relationship_assumption->'parameterRange' is distinct from jsonb_build_object('min',0,'max',10,'defaultValue',(relationship->>'negativeReduction')::numeric*100,'unit','percent reduction')
     or relationship_assumption->>'statement' is distinct from '本人明确授权的关系回应假设：在已确认的条件回应发生后，首次本人资源候选在负向模拟信号下缩减百分之五，独立人生气候假设最多再缩减百分之五；正向和中性不缩减。' then return false;end if;
    consumed:=exists(select 1 from jsonb_array_elements(world->'worldEvents')e where (e->>'createdAt')::timestamptz<occurred_at
      and left(e->>'proposalId',length('action_proposal_v2_formal_planning_'||sample_namespace||'_'))='action_proposal_v2_formal_planning_'||sample_namespace||'_'
      and e#>>'{operation,actionType}'='allocate_resource' and e#>>'{operation,resourceId}'=resource_id
      and e->'causalAssumptionIds' @> jsonb_build_array(relationship_assumption->'id')and e->'priorWorldEventIds' @> jsonb_build_array(response_event->'id'));
    first_response:=not consumed;
    if first_response and response_event#>>'{operation,signal}'='negative' then response_reduction:=(relationship->>'negativeReduction')::double precision;end if;
    amount:=(resource->>'neutralAmount')::double precision*(1-response_reduction);
    response_trace:=jsonb_build_object('requestEventId',request_event->'id','responseEventId',response_event->'id',
      'responseTickIndex',(regexp_match(response_event->>'proposalId','_([0-5])_rule-[1-9][0-9]*$'))[1]::integer,
      'signal',response_event#>'{operation,signal}','reduction',response_reduction,'firstResponseAllocation',first_response);
   end if;
   if (trace->'relationshipResponse') is distinct from response_trace then return false;end if;
   if trace->>'version' is distinct from 'formal-default-planning-trace-v1' or trace->>'pathKey' is distinct from path_key
    or not public.symbolic_keys_v1(trace,array['version','pathKey','tickIndex','resourceKey','resourceId','proposalId','neutralAmount','proposedAmount','priorApplied','reduction','reductionCap','totalBudgetLimit','spentBefore','causalAssumptionIds','worldBinding']||case when response_trace is null then array[]::text[] else array['relationshipResponse'] end)
    or jsonb_typeof(trace->'tickIndex') is distinct from 'number' or trace->>'tickIndex'!~'^[0-5]$'
    or jsonb_typeof(trace->'proposedAmount') is distinct from 'number' or (trace->>'proposedAmount')::double precision<=0
    or jsonb_typeof(trace->'spentBefore') is distinct from 'number'
    or (trace->>'spentBefore')::double precision is distinct from coalesce((select sum((e#>>'{operation,amount}')::double precision order by event_order)from jsonb_array_elements(world->'worldEvents')with ordinality t(e,event_order)where e#>>'{operation,actionType}'='allocate_resource'and e#>>'{operation,resourceId}'=resource_id and (e->>'createdAt')::timestamptz<occurred_at),0::double precision)
    or (trace->>'tickIndex')::integer<0 or (trace->>'tickIndex')::integer>=ticks
    or trace->>'resourceId' is distinct from resource_id or bound_resource->>'resourceId' is distinct from resource_id
    or trace->>'proposalId' is distinct from 'action_proposal_v2_formal_planning_formal_'||(p_bundle->>'policyFingerprint')||'_'||(trajectory->>'trajectorySeed')||'_'||(trace->>'tickIndex')||'_'||(resource->>'resourceKey')
    or trace->'neutralAmount' is distinct from resource->'neutralAmount' or (trace->>'proposedAmount')::double precision<>amount
    or trace->'priorApplied' is distinct from to_jsonb(prior) or (trace->>'reduction')::numeric<>(case when prior then reduction else 0 end)
    or trace->'reductionCap' is distinct from '0.1'::jsonb or trace->'totalBudgetLimit' is distinct from resource->'totalBudgetLimit'
    or binding->>'worldNamespace' is distinct from namespace or binding->>'pathKey' is distinct from path_key
    or not public.symbolic_keys_v1(binding,array['acceptedSourceSignature','worldNamespace','pathKey','actorAgentId','actorEntityId','actorSignature','capturedBoundaryAt','simulationStartAt','resources'])
    or jsonb_typeof(binding->'acceptedSourceSignature') is distinct from 'string' or jsonb_typeof(binding->'actorSignature') is distinct from 'string'
    or jsonb_typeof(bound_resource->'definitionSignature') is distinct from 'string' or jsonb_typeof(bound_resource->'provenanceSignature') is distinct from 'string'
    or binding->>'actorAgentId' is distinct from actor_id or binding->>'actorEntityId' is distinct from entity_id
    or (binding->>'acceptedSourceSignature')::jsonb is distinct from expected_source_signature
    or (binding->>'actorSignature')::jsonb is distinct from jsonb_build_object('actor',actor,'entity',entity,'actorEvidence',actor_evidence)
    or (binding->>'simulationStartAt')::timestamptz is distinct from p_start
    or (binding->>'capturedBoundaryAt')::timestamptz is distinct from (p_bundle#>>'{forecastTiming,boundaryAt}')::timestamptz
    or (binding->>'capturedBoundaryAt')::timestamptz<p_accepted or (binding->>'capturedBoundaryAt')::timestamptz>p_start
    or (bound_resource->>'definitionSignature')::jsonb is distinct from jsonb_build_object('id',resource_id,'resourceType',resource->'resourceType','label',resource->'label','unit',resource->'unit','ownerEntityId',entity_id,'controllerAgentId',actor_id,'min',resource->'minimum','max',resource->'maximum')
    or final_resource->>'ownerEntityId' is distinct from entity_id or final_resource->>'controllerAgentId' is distinct from actor_id
    or final_resource->'resourceType' is distinct from resource->'resourceType' or final_resource->'label' is distinct from resource->'label'
    or final_resource->'unit' is distinct from resource->'unit' or final_resource->'min' is distinct from resource->'minimum' or final_resource->'max' is distinct from resource->'maximum'
    then return false;end if;
   provenance:=jsonb_build_object('provenance',final_resource->'provenance',
    'evidence',coalesce((select jsonb_agg(e order by ord)from jsonb_array_elements(final_resource#>'{provenance,realEvidenceIds}')with ordinality t(id,ord)join lateral(select value e from jsonb_array_elements(world#>'{realityBoundarySnapshot,evidenceLedger,items}')where value->'id'=id)q on true),'[]'::jsonb),
    'assumptions',coalesce((select jsonb_agg(a order by ord)from jsonb_array_elements(final_resource#>'{provenance,assumptionIds}')with ordinality t(id,ord)join lateral(select value a from jsonb_array_elements(world#>'{realityBoundarySnapshot,assumptionLedger,assumptions}')where value->'id'=id)q on true),'[]'::jsonb));
   if (bound_resource->>'provenanceSignature')::jsonb is distinct from provenance then return false;end if;
   if final_resource#>'{provenance,visible}' is distinct from 'true'::jsonb
    or final_resource#>'{provenance,provisional}' is distinct from to_jsonb(resource->>'classification'='assumption') then return false;end if;
   if resource->>'classification'='fact' then
    source_provenance:=provenance->'evidence'->0;
    if jsonb_array_length(provenance->'evidence')<>1 or provenance->'assumptions'<>'[]'::jsonb
     or source_provenance->>'claimKey' is distinct from 'reality.profile.world_resource.'||(resource->>'profileResourceKey')
     or source_provenance->'seedContextId' is distinct from graph->'seed_context_id'
     or not source_provenance->'limitations' @> jsonb_build_array('User-supplied basis: '||(resource->>'evidenceSummary'))
     or not exists(select 1 from jsonb_array_elements(source_provenance->'provenance')p where
       p->>'sourceRef'='reality_profile:'||coalesce(profile->>'id','absent')||':revision:'||coalesce(profile->>'revision','0')||':world_resource:'||(resource->>'profileResourceKey')
       and (p->>'capturedAt')::timestamptz=(p_bundle#>>'{forecastTiming,boundaryAt}')::timestamptz)then return false;end if;
   else
    source_provenance:=provenance->'assumptions'->0;
    if provenance->'evidence'<>'[]'::jsonb or jsonb_array_length(provenance->'assumptions')<>1
     or source_provenance->>'category' is distinct from 'reality_profile_world_resource_'||(resource->>'profileResourceKey')
     or source_provenance->'seedContextId' is distinct from graph->'seed_context_id' or source_provenance->>'subjectType' is distinct from 'self'
     or source_provenance->>'confirmationStatus' is distinct from 'confirmed'
     or not source_provenance->'limitations' @> jsonb_build_array('User designated this resource value as a simulation assumption: '||(resource->>'evidenceSummary'))then return false;end if;
   end if;
   select value into base_assumption from jsonb_array_elements(world#>'{realityBoundarySnapshot,assumptionLedger,assumptions}')where value->>'category'=resource->>'assumptionCategory';
   select value into prior_assumption from jsonb_array_elements(world#>'{realityBoundarySnapshot,assumptionLedger,assumptions}')where value->>'category'='formal_symbolic_initial_planning_v1';
   causal_ids:=jsonb_build_array(base_assumption->'id')||(case when first_response then jsonb_build_array(relationship_assumption->'id') when prior then jsonb_build_array(prior_assumption->'id') else '[]'::jsonb end);
   if base_assumption is null or (prior and prior_assumption is null) or trace->'causalAssumptionIds' is distinct from causal_ids
    or base_assumption->'parameterRange' is distinct from jsonb_build_object('min',(resource->>'neutralAmount')::double precision*0.9,'max',resource->'neutralAmount','defaultValue',resource->'neutralAmount','unit',resource->'unit')
    or (prior and prior_assumption->'parameterRange' is distinct from jsonb_build_object('min',0,'max',10,'defaultValue',reduction*100,'unit','percent reduction'))
    or exists(select 1 from jsonb_array_elements(world#>'{realityBoundarySnapshot,assumptionLedger,assumptions}')a where causal_ids @> jsonb_build_array(a->'id') and
     (a->>'subjectType'<>'self' or a->>'epistemicStatus'<>'confirmed_for_simulation' or a->>'confirmationStatus'<>'confirmed'
      or a->>'confirmationRequirement'<>'required' or a->>'impactLevel'<>'low'
      or a->'supportingRealEvidenceIds'<>'[]'::jsonb or a->'contradictingRealEvidenceIds'<>'[]'::jsonb))then return false;end if;
   select value into event from jsonb_array_elements(world->'worldEvents')where value->'proposalId'=trace->'proposalId';
   if event is not null then
    select value into delta from jsonb_array_elements(event->'deltas')where value->>'valueType'='resource' and value->>'path'='resources.'||resource_id||'.available';
    if event->>'actorId' is distinct from actor_id or event#>>'{operation,actionType}' is distinct from 'allocate_resource'
     or event->'seedContextId' is distinct from graph->'seed_context_id'
     or event->>'evidenceClass' is distinct from 'world_transition_simulation_evidence'
     or event->'engineVersion' is distinct from world->'engineVersion'
     or event->'targetEntityIds' is distinct from jsonb_build_array(entity_id)
     or event->'targetResourceIds' is distinct from jsonb_build_array(resource_id)
     or event->'targetRelationIds' is distinct from '[]'::jsonb or event->'targetVariableIds' is distinct from '[]'::jsonb
     or (event->>'afterRevision')::integer<>(event->>'beforeRevision')::integer+1
     or (event->>'afterRevision')::integer>(world->>'revision')::integer
     or event#>>'{operation,resourceId}' is distinct from resource_id or (event#>>'{operation,amount}')::double precision<>amount
     or event->'causalAssumptionIds' is distinct from causal_ids or delta is null
     or (event->>'createdAt')::timestamptz is distinct from occurred_at or (event->>'commandCreatedAt')::timestamptz is distinct from occurred_at
     or not world->'worldEventIds' @> jsonb_build_array(event->'id')or not world->'appliedTransitionCommandIds' @> jsonb_build_array(event->'commandId')
     or (response_trace is not null and event->'priorWorldEventIds' is distinct from jsonb_build_array(request_event->'id',response_event->'id'))
     or abs((delta->>'before')::double precision-(delta->>'after')::double precision-amount)>2.220446049250313e-16*greatest(1,(delta->>'before')::double precision)*4 then return false;end if;
   end if;
  end loop;
  for resource in select value from jsonb_array_elements(planning->'resources')where value->>'status'='active'loop
   resource_id:=public.formal_planning_core_id_v1('world_resource',namespace,resource->>'profileResourceKey');
   spent:=0;trace_count:=0;remaining:=(resource->>'initialAvailable')::double precision;
   for event in select value from jsonb_array_elements(world->'worldEvents')with ordinality t(value,event_order)where value#>>'{operation,actionType}'='allocate_resource'
    and value#>>'{operation,resourceId}'=resource_id order by event_order loop
    if not exists(select 1 from jsonb_array_elements(entry->'trace')t where t->'proposalId'=event->'proposalId')then return false;end if;
    spent:=spent+(event#>>'{operation,amount}')::double precision;remaining:=remaining-(event#>>'{operation,amount}')::double precision;trace_count:=trace_count+1;
   end loop;
   select value into final_resource from jsonb_array_elements(world->'resources')where value->>'id'=resource_id;
   if spent>(resource->>'totalBudgetLimit')::double precision or trace_count>ticks or final_resource is null
    or (final_resource->>'available')::double precision<>remaining or remaining<(resource->>'minimum')::double precision then return false;end if;
  end loop;
 end loop;
 return public.formal_run_bundle_matches_reservation_before_planning(jsonb_set(p_bundle-array['defaultPlanningSnapshot','defaultPlanningTraces','policyFingerprint'],'{inputSnapshot}',(p_bundle->'inputSnapshot')-array['relationshipResponseHypothesis','relationshipResponseAuthorization']),p_source,p_accepted,p_start,p_horizon);
exception when others then return false;
end;$$;


revoke all on function public.formal_relationship_request_valid_v1(jsonb) from public,anon;
grant execute on function public.formal_relationship_request_valid_v1(jsonb) to authenticated;
revoke all on function public.formal_default_planning_request_valid_v2(jsonb) from public,anon;
grant execute on function public.formal_default_planning_request_valid_v2(jsonb) to authenticated;
revoke all on function public.formal_relationship_effective_rules_v1(jsonb) from public,anon;
grant execute on function public.formal_relationship_effective_rules_v1(jsonb) to authenticated;
revoke all on function public.formal_relationship_source_valid_v1(jsonb,jsonb,integer) from public,anon;
grant execute on function public.formal_relationship_source_valid_v1(jsonb,jsonb,integer) to authenticated;
revoke all on function public.formal_relationship_frozen_valid_v1(jsonb,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.formal_relationship_frozen_valid_v1(jsonb,jsonb,jsonb,jsonb) to authenticated;
revoke all on function public.formal_relationship_rule_event_valid_v1(jsonb,jsonb,jsonb,text,text,timestamptz,integer,text[]) from public,anon;
grant execute on function public.formal_relationship_rule_event_valid_v1(jsonb,jsonb,jsonb,text,text,timestamptz,integer,text[]) to authenticated;
revoke all on function public.formal_relationship_canonical_json_v1(jsonb) from public,anon;
grant execute on function public.formal_relationship_canonical_json_v1(jsonb) to authenticated;
revoke all on function public.formal_run_bundle_matches_reservation(jsonb,jsonb,timestamptz,timestamptz,integer) from public,anon;
grant execute on function public.formal_run_bundle_matches_reservation(jsonb,jsonb,timestamptz,timestamptz,integer) to authenticated;
notify pgrst, 'reload schema';
commit;
