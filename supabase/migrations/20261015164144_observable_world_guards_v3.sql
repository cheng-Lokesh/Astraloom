begin;
create function public.formal_world_guard_model_v3(p_source jsonb,p_rules jsonb)
returns jsonb language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare profile jsonb:=public.formal_run_frozen_profile(p_source->'reality_profiles'); background jsonb:='[]'; agents jsonb; relationships jsonb; spec record; item jsonb; ordinal integer; fields jsonb; source_key text; dimension text;
begin
 for spec in select * from (values (1,'lifeClimate','人生气候'),(2,'resources','资源'),(3,'constraints','约束'),(4,'goals','目标'),(5,'values','价值观'),(6,'lifeThemes','人生主题'),(7,'pressures','压力'),(8,'externalVariables','外部变量'),(9,'lifeModelDomains.identity','身份结构'),(10,'lifeModelDomains.career','职业结构'),(11,'lifeModelDomains.wealth','财富结构'),(12,'lifeModelDomains.relationships','关系生态'),(13,'lifeModelDomains.environment','城市与生活环境'),(14,'lifeModelDomains.lifeStage','人生阶段')) t(position,key,label) order by position loop
  if spec.position<=3 then fields:=jsonb_build_array(profile->spec.key); elsif spec.position<=8 then fields:=profile->spec.key; else fields:=profile#>string_to_array(spec.key,'.'); end if;
  for item,ordinal in select value,ord::integer from jsonb_array_elements(fields) with ordinality t(value,ord) order by ord loop
   source_key:=case when spec.position<=3 then spec.key else spec.key||'.'||ordinal::text end; dimension:=spec.key;
   background:=background||jsonb_build_array(item||jsonb_build_object('sourceKey',source_key,'dimension',dimension,'label',spec.label||case when jsonb_array_length(fields)>1 then '（第'||ordinal::text||'项）' else '' end,'usage','background_only'));
  end loop;
 end loop;
 select jsonb_agg(jsonb_build_object('key','person-'||ord::text,'sourceAgentId',a->'id','label',a->'display_name','role',a->'agent_type','evidenceSummary','来自本次冻结的账户人物快照；不推断私密意图','strategyStatus',case when a->>'agent_type'='user_variant' then case when exists(select 1 from jsonb_array_elements(p_rules->'strategies') s where s->>'participantKey'='person-'||ord::text) then 'explicit' else 'not_defined' end else 'not_applicable' end) order by ord) into agents from jsonb_array_elements(p_source->'agent_profiles') with ordinality t(a,ord);
 select jsonb_agg(jsonb_build_object('key','relation-'||ord::text,'sourceEdgeId',e->'id','fromPersonKey',(select 'person-'||n::text from jsonb_array_elements(p_source->'agent_profiles') with ordinality a(v,n) where v->'id'=e->'from_agent_id'),'toPersonKey',(select 'person-'||n::text from jsonb_array_elements(p_source->'agent_profiles') with ordinality a(v,n) where v->'id'=e->'to_agent_id'),'label',e->'relationship_type','evidenceSummary','来自本次锁定关系图的账户关系记录') order by ord) into relationships from jsonb_array_elements(p_source->'relation_edges') with ordinality t(e,ord);
 return jsonb_build_object('version','digital-life-model-v3','ownerId',p_source#>'{relation_graph_snapshots,user_id}','seedContextId',p_source#>'{relation_graph_snapshots,seed_context_id}','graphSnapshotId',p_rules->'graphSnapshotId','agentSnapshotId',p_rules->'agentSnapshotId','profileRevision',p_rules->'profileRevision','background',background,'agents',agents,'relationships',relationships,'rules',p_rules,'limitations',jsonb_build_array('背景记录不代表已建立因果规则','第三方回应仅为本人确认的条件模拟假设','平行策略分别运行，资源与模拟频次不会合并','人生气候与象征解释不直接决定行动或结果'));
exception when others then return null;
end; $$;
create function public.formal_world_guard_constraint_id_v3(p_namespace text,p_key text)
returns text language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare first bigint:=2166136261; second bigint:=2246822519; content text:=p_namespace||':world_constraint:'||p_key; code integer; i integer;
begin
 if p_namespace!~'^formal-[a-f0-9]{24}$' or p_key!~'^[a-z][a-z0-9-]{0,39}$' or content is null then return null; end if;
 for i in 1..length(content) loop
  code:=ascii(substr(content,i,1)); first:=mod((first # code::bigint)::numeric*16777619,4294967296)::bigint; second:=mod((second # code::bigint)::numeric*3266489917,4294967296)::bigint;
 end loop;
 return 'world_constraint_v2_'||public.formal_planning_base36_v1(first)||public.formal_planning_base36_v1(second);
end; $$;

-- The same stable hash as the public Core factories, including UTF-16 surrogate
-- pairs for non-BMP text. This does not grant any transition or write authority.
create function public.formal_world_guard_core_id_v3(p_kind text,p_namespace text,p_fingerprint text)
returns text language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare first bigint:=2166136261; second bigint:=2246822519; content text:=p_namespace||':'||p_kind||':'||p_fingerprint; code integer; unit integer; units integer[]; i integer; prefix text;
begin
 prefix:=case p_kind when 'evidence_ledger' then 'real_evidence_ledger_v2_' when 'evidence' then 'real_evidence_v2_' when 'assumption_ledger' then 'assumption_ledger_v2_' when 'assumption' then 'assumption_v2_' when 'world' then 'world_v2_' when 'world_relation' then 'world_relation_v2_' else null end;
 if prefix is null or content is null or p_namespace!~'^formal-[a-f0-9]{24}$' then return null; end if;
 for i in 1..length(content) loop
  code:=ascii(substr(content,i,1)); units:=case when code>65535 then array[55296+(code-65536)/1024,56320+mod(code-65536,1024)] else array[code] end;
  foreach unit in array units loop
   first:=mod((first # unit::bigint)::numeric*16777619,4294967296)::bigint; second:=mod((second # unit::bigint)::numeric*3266489917,4294967296)::bigint;
  end loop;
 end loop;
 return prefix||public.formal_planning_base36_v1(first)||public.formal_planning_base36_v1(second);
end; $$;
-- Rebuild every boundary descriptor in producer order from the frozen source.
-- Extra/missing/duplicate entries and synchronized changes to source bodies fail.
create function public.formal_world_guard_boundary_valid_v3(p_boundary jsonb,p_source jsonb,p_rules jsonb,p_path text,p_horizon integer,p_namespace text)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare seed_id jsonb:=p_source#>'{relation_graph_snapshots,seed_context_id}'; at_text text:=p_boundary->>'updatedAt';
 evidence_specs jsonb:='[]'; assumption_specs jsonb:='[]'; actual jsonb; expected jsonb; item jsonb; spec jsonb; actor jsonb; correction jsonb; resource jsonb; authorized jsonb; rule jsonb; field jsonb; ordinal integer; i integer;
 source_ref text; profile_ref text:='reality_profile:'||coalesce(p_source#>>'{reality_profiles,id}','absent')||':revision:'||coalesce(p_source#>>'{reality_profiles,revision}','0');
 primary_id jsonb; supporting jsonb; common jsonb; id_fingerprint text; neutral double precision; active_count integer:=0; reduction numeric:=0; caution numeric:=0; rhythm numeric:=0; peak numeric; lens jsonb:=p_source->'symbolic_lens'; planning jsonb:=nullif(p_source->'default_planning','null'::jsonb); relationship_active boolean:=false;
begin
 if p_horizon not in (30,90) or jsonb_typeof(p_boundary) is distinct from 'object'
  or p_boundary->'seedContextId' is distinct from seed_id or p_boundary->>'schemaVersion' is distinct from '2.0' or p_boundary->'revision' is distinct from '1'::jsonb
  or p_boundary->'createdAt' is distinct from p_boundary->'updatedAt' or jsonb_typeof(p_boundary->'updatedAt') is distinct from 'string'
  or (select count(*) from jsonb_object_keys(p_boundary))<>7
  or jsonb_typeof(p_boundary#>'{evidenceLedger,items}') is distinct from 'array' or jsonb_typeof(p_boundary#>'{assumptionLedger,assumptions}') is distinct from 'array' then return false; end if;
 evidence_specs:=jsonb_build_array(jsonb_build_object('statement',btrim(left(concat_ws(' ',nullif(p_source#>>'{seed_contexts,user_question}',''),nullif(p_source#>>'{seed_contexts,raw_context}','')),4000)),'claimKey','formal.seed.summary','sourceRef','seed_context:'||(seed_id#>>'{}'),'limitations',jsonb_build_array('User-confirmed input can still be incomplete.')));
 for item,ordinal in select value,ord::integer from jsonb_array_elements(p_source->'relation_edges') with ordinality t(value,ord) order by ord loop
  evidence_specs:=evidence_specs||jsonb_build_array(jsonb_build_object('statement','Confirmed relationship '||ordinal::text||': '||(item->>'relationship_type')||'.','claimKey','formal.relation.'||ordinal::text,'sourceRef','relation_edge:'||(item->>'id'),'limitations',jsonb_build_array('Relationship structure is confirmed; private intent is not inferred.')));
 end loop;
 for actor,ordinal in select value,ord::integer from jsonb_array_elements(p_source->'agent_profiles') with ordinality t(value,ord) order by ord loop
  evidence_specs:=evidence_specs||jsonb_build_array(jsonb_build_object('statement',(actor->>'display_name')||'：'||case when actor->>'agent_type'='user_core' then '本人' when actor->>'agent_type'='user_variant' then '本人在独立条件下的平行策略' else '账户确认的人物角色' end,'claimKey','formal.agent.'||ordinal::text,'sourceRef','agent_snapshot:'||(p_source#>>'{relation_graph_snapshots,agent_snapshot_id}')||':'||(actor->>'id'),'limitations',jsonb_build_array('Snapshot identity is supported; behavior and private intent are not inferred.')));
 end loop;
 for correction in select value from jsonb_array_elements(coalesce(p_source#>'{outcome_calibration,corrections}','[]')) loop
  evidence_specs:=evidence_specs||jsonb_build_array(jsonb_build_object('statement',correction->'evidenceSummary','claimKey','formal.outcome.correction.'||(correction->>'ruleKey'),'sourceRef','formal_user_observation:'||(correction->>'observationSignature'),'capturedAt',correction->'recordedAt','limitations',jsonb_build_array('本人观察记录，未独立核实；仅支持下次条件假设，不证明未来会重复。')));
 end loop;
 for field in select value from jsonb_array_elements(public.formal_world_guard_model_v3(p_source,p_rules)->'background') where value->>'sourceKey' not like 'lifeModelDomains.%' and value->>'classification'='fact' loop
  evidence_specs:=evidence_specs||jsonb_build_array(jsonb_build_object('statement',(field->>'label')||'：'||(field->>'value'),'claimKey','reality.profile.'||(field->>'sourceKey'),'sourceRef',profile_ref||':'||(field->>'sourceKey'),'limitations',jsonb_build_array('User-supplied basis: '||(field->>'evidenceSummary'),'A user-recorded fact can still be incomplete.')));
 end loop;
 for resource in select value from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,resources}','[]')) where value->>'classification'='fact' loop
  evidence_specs:=evidence_specs||jsonb_build_array(jsonb_build_object('statement',(resource->>'label')||'：'||public.formal_relationship_canonical_json_v1(resource->'available')||' '||(resource->>'unit')||'（范围 '||public.formal_relationship_canonical_json_v1(resource->'minimum')||'–'||public.formal_relationship_canonical_json_v1(resource->'maximum')||' '||(resource->>'unit')||'）','claimKey','reality.profile.world_resource.'||(resource->>'key'),'sourceRef',profile_ref||':world_resource:'||(resource->>'key'),'limitations',jsonb_build_array('User-supplied basis: '||(resource->>'evidenceSummary'),'A user-recorded resource can still be incomplete.')));
 end loop;
 for item in select value from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,constraints}','[]')) where value->>'classification'='fact' loop
  evidence_specs:=evidence_specs||jsonb_build_array(jsonb_build_object('statement',(item->>'label')||'：'||(item#>>'{rule,value}')||' 之前','claimKey','reality.profile.world_constraint.'||(item->>'key'),'sourceRef',profile_ref||':world_constraint:'||(item->>'key'),'limitations',jsonb_build_array('User-supplied basis: '||(item->>'evidenceSummary'),'A user-recorded constraint can still be incomplete.')));
 end loop;
 if jsonb_array_length(p_boundary#>'{evidenceLedger,items}')<>jsonb_array_length(evidence_specs)
  or (select count(distinct value->>'id') from jsonb_array_elements(p_boundary#>'{evidenceLedger,items}'))<>jsonb_array_length(evidence_specs) then return false; end if;
 for spec,i in select value,ord::integer-1 from jsonb_array_elements(evidence_specs) with ordinality t(value,ord) loop
  actual:=p_boundary#>array['evidenceLedger','items',i::text];
  expected:=jsonb_build_object('seedContextId',seed_id,'statement',public.formal_world_guard_text_v3(spec->>'statement'),'claimKey',lower(spec->>'claimKey'),'sourceKind','user_statement','sourceTier','tier_1_user_confirmed','verificationStatus','user_confirmed','provenance',jsonb_build_array(jsonb_build_object('sourceRef',spec->'sourceRef','capturedAt',coalesce(spec->'capturedAt',to_jsonb(at_text)))),'limitations',(select jsonb_agg(to_jsonb(public.formal_world_guard_text_v3(value#>>'{}')) order by ord) from jsonb_array_elements(spec->'limitations') with ordinality t(value,ord)),'capturedAt',coalesce(spec->'capturedAt',to_jsonb(at_text)),'createdAt',at_text,'updatedAt',at_text);
  id_fingerprint:='{"seedContextId":'||seed_id::text||',"statement":'||to_jsonb(lower(expected->>'statement'))::text||',"claimKey":'||to_jsonb(lower(expected->>'claimKey'))::text||',"sourceRef":'||to_jsonb(lower(spec->>'sourceRef'))::text||'}';
  if actual is distinct from expected||jsonb_build_object('id',public.formal_world_guard_core_id_v3('evidence',p_namespace,id_fingerprint)) then return false; end if;
 end loop;
 primary_id:=p_boundary#>'{evidenceLedger,items,0,id}';
 assumption_specs:=jsonb_build_array(jsonb_build_object('statement','Observed relationship conditions may remain stable during the selected horizon.','subjectType','external_variable','category','relationship_stability','epistemicStatus','inferred','impactLevel','medium','supportingRealEvidenceIds',jsonb_build_array(primary_id),'confirmationStatus','not_required','limitations',jsonb_build_array('Visible simulation assumption, not a real-world fact.')));
 for field in select value from jsonb_array_elements(public.formal_world_guard_model_v3(p_source,p_rules)->'background') where value->>'sourceKey' not like 'lifeModelDomains.%' and value->>'classification'='assumption' loop
  assumption_specs:=assumption_specs||jsonb_build_array(jsonb_build_object('statement',field->'value','subjectType','unknown','category','reality_profile_'||(field->>'sourceKey'),'limitations',jsonb_build_array('User designated this as an assumption: '||(field->>'evidenceSummary'),'Not a verified real-world fact.')));
 end loop;
 for resource in select value from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,resources}','[]')) loop
  if resource->>'classification'='assumption' then assumption_specs:=assumption_specs||jsonb_build_array(jsonb_build_object('statement','模拟假设：'||(resource->>'label')||' 从 '||public.formal_relationship_canonical_json_v1(resource->'available')||' '||(resource->>'unit')||' 开始。','subjectType','self','category','reality_profile_world_resource_'||(resource->>'key'),'limitations',jsonb_build_array('User designated this resource value as a simulation assumption: '||(resource->>'evidenceSummary'),'Not a verified real-world fact.'))); end if;
  if jsonb_typeof(resource->'usePerTick')='number' then assumption_specs:=assumption_specs||jsonb_build_array(jsonb_build_object('statement','模拟规则：当行动被选中时，从“'||(resource->>'label')||'”分配 '||public.formal_relationship_canonical_json_v1(resource->'usePerTick')||' '||(resource->>'unit')||'。','subjectType','self','category','reality_profile_world_rate_'||(resource->>'key'),'limitations',jsonb_build_array('This is an explicit user-entered simulation rule, not a prediction or measured future change.'))); end if;
 end loop;
 for item in select value from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,constraints}','[]')) where value->>'classification'='assumption' loop
  assumption_specs:=assumption_specs||jsonb_build_array(jsonb_build_object('statement','模拟假设：'||(item->>'label')||' 适用于 '||(item#>>'{rule,value}')||' 之前。','subjectType','external_variable','category','reality_profile_world_constraint_'||(item->>'key'),'limitations',jsonb_build_array('User designated this constraint as a simulation assumption: '||(item->>'evidenceSummary'),'Not a verified real-world fact.')));
 end loop;
 for rule in select value from jsonb_array_elements(p_rules->'actions') where value->>'pathKey'=p_path loop
  actor:=p_source->'agent_profiles'->((substring(rule->>'actorKey' from 8))::integer-1); supporting:='[]';
  select jsonb_build_array(value->'id') into supporting from jsonb_array_elements(p_boundary#>'{evidenceLedger,items}') where value->>'claimKey'='formal.outcome.correction.'||(rule->>'key');
  assumption_specs:=assumption_specs||jsonb_build_array(jsonb_build_object('statement','用户确认的条件模拟规则：'||(rule#>>'{operation,actionType}')||'。'||case when rule ? 'guard' then '触发条件：'||public.formal_world_guard_description_v3(rule->'guard',p_source)||'。' else '' end||'依据：'||(rule->>'evidenceSummary'),'subjectType',case when rule#>>'{operation,actionType}'='update_external_variable' then 'external_variable' when actor->>'agent_type' in ('npc','group') then 'third_party' else 'self' end,'category','digital_life_rule_'||(rule->>'key'),'impactLevel','high','supportingRealEvidenceIds',coalesce(supporting,'[]'::jsonb),'confirmationRequirement','required','limitations',jsonb_build_array('Explicit user-authored conditional simulation rule, not observed behavior or private intent.')));
 end loop;
 if planning is not null then
  for authorized in select value from jsonb_array_elements(planning->'resources') loop
   ordinal:=(substring(authorized->>'resourceKey' from 10))::integer; resource:=p_source#>array['reality_profiles','world_model_inputs','resources',(ordinal-1)::text];
   neutral:=public.formal_planning_neutral_amount_v1((authorized->>'totalBudgetLimit')::double precision,(resource->>'available')::double precision,(resource->>'minimum')::double precision,case when p_horizon=30 then 3 else 6 end);
   if jsonb_typeof(resource->'usePerTick')='number' or neutral<0.000001 or exists(select 1 from jsonb_array_elements(p_rules->'actions') r where r#>>'{operation,actionType}'='allocate_resource' and r#>'{operation,resourceKey}'=authorized->'resourceKey') then continue; end if;
   active_count:=active_count+1; relationship_active:=relationship_active or planning#>'{relationshipResponse,resourceKey}'=authorized->'resourceKey';
   assumption_specs:=assumption_specs||jsonb_build_array(jsonb_build_object('statement','本人授权的默认模拟规划：每条路径每个样本整次运行最多分配 '||public.formal_relationship_canonical_json_v1(authorized->'totalBudgetLimit')||' '||(resource->>'unit')||'，每轮中性候选 '||neutral::text||' '||(resource->>'unit')||'；首轮仅按可关闭的产品规划假设缩减，最多百分之十。','subjectType','self','category','formal_default_planning_resource_'||ordinal::text,'confirmationRequirement','required','parameterRange',jsonb_build_object('min',neutral*0.9,'max',neutral,'defaultValue',neutral,'unit',resource->'unit'),'limitations',jsonb_build_array('仅为本人明确授权的模拟规划假设，不是现实事实、科学概率或行动建议。','符号来源仅保留在规划推导记录，不作为现实证据。','已明确的行动与每轮用量不受本规划影响。','关系敏感度尚未接入关系变化。')));
  end loop;
  if active_count>0 and planning#>>'{fusion,enabled}'='true' and lens->>'status'='attached' then
   select max(value::numeric) into peak from jsonb_each_text(lens#>'{frame,calculation,groupCounts}');
   if peak>0 and ((lens#>>'{frame,calculation,groupCounts,responsibility}')::numeric=peak or (lens#>>'{frame,calculation,groupCounts,support}')::numeric=peak) then caution:=0.05; end if;
   if public.formal_planning_element_channel_v1(lens#>>'{frame,calculation,natalDayElement}',lens#>>'{frame,calculation,periodYearElement}')<>public.formal_planning_element_channel_v1(lens#>>'{frame,calculation,natalDayElement}',lens#>>'{frame,calculation,periodMonthElement}') then rhythm:=0.05; end if;
   reduction:=least(0.1,caution+rhythm);
   assumption_specs:=assumption_specs||jsonb_build_array(jsonb_build_object('statement','本人另行确认的首轮规划假设：按产品规则 symbolic-initial-planning-hypothesis-v1 将默认候选用量缩减 '||public.formal_relationship_canonical_json_v1(to_jsonb(reduction*100))||'%，固定上限 10%；后续轮次使用中性候选用量。','subjectType','self','category','formal_symbolic_initial_planning_v1','confirmationRequirement','required','parameterRange',jsonb_build_object('min',0,'max',10,'defaultValue',reduction*100,'unit','percent reduction'),'limitations',jsonb_build_array('这是明示的产品规划假设，不代表传统权威、科学权重或现实概率。','符号镜头仍独立保存，不是现实证据；每个实际变化仍须通过受控转换。','关系敏感度仅供对照，尚未改变关系。')));
  end if;
  if planning->>'version'='formal-default-planner-v2' and relationship_active then
   reduction:=case when planning#>>'{relationshipResponse,symbolicSensitivity,enabled}'='true' and (lens#>>'{frame,calculation,groupCounts,responsibility}')::numeric>(lens#>>'{frame,calculation,groupCounts,peer}')::numeric then 10 else 5 end;
   assumption_specs:=assumption_specs||jsonb_build_array(jsonb_build_object('statement','本人明确授权的关系回应假设：在已确认的条件回应发生后，首次本人资源候选在负向模拟信号下缩减百分之五，独立人生气候假设最多再缩减百分之五；正向和中性不缩减。','subjectType','self','category','formal_relationship_response_v1','confirmationRequirement','required','parameterRange',jsonb_build_object('min',0,'max',10,'defaultValue',reduction,'unit','percent reduction'),'limitations',jsonb_build_array('仅作用于本人明确授权的模拟候选，不代表第三人的心理、现实行为或科学概率。','条件回应来自本次运行受控模拟事件，不是现实证据。','仅首次实际选中投入消费此假设；不与首轮假设叠加。')));
  end if;
 end if;
 if jsonb_array_length(p_boundary#>'{assumptionLedger,assumptions}')<>jsonb_array_length(assumption_specs)
  or (select count(distinct value->>'id') from jsonb_array_elements(p_boundary#>'{assumptionLedger,assumptions}'))<>jsonb_array_length(assumption_specs) then return false; end if;
 common:=jsonb_build_object('seedContextId',seed_id,'epistemicStatus','confirmed_for_simulation','impactLevel','low','supportingRealEvidenceIds','[]'::jsonb,'contradictingRealEvidenceIds','[]'::jsonb,'confirmationRequirement','not_required','confirmationStatus','confirmed','factStatus','not_real_world_fact','createdAt',at_text,'updatedAt',at_text);
 for spec,i in select value,ord::integer-1 from jsonb_array_elements(assumption_specs) with ordinality t(value,ord) loop
  actual:=p_boundary#>array['assumptionLedger','assumptions',i::text];
  expected:=common||spec||jsonb_build_object('statement',public.formal_world_guard_text_v3(spec->>'statement'),'limitations',(select jsonb_agg(to_jsonb(public.formal_world_guard_text_v3(value#>>'{}')) order by ord) from jsonb_array_elements(spec->'limitations') with ordinality t(value,ord)));
  id_fingerprint:='{"seedContextId":'||seed_id::text||',"statement":'||to_jsonb(lower(expected->>'statement'))::text||',"subjectType":'||(expected->'subjectType')::text||',"category":'||to_jsonb(lower(expected->>'category'))::text||'}';
  if actual is distinct from expected||jsonb_build_object('id',public.formal_world_guard_core_id_v3('assumption',p_namespace,id_fingerprint)) then return false; end if;
 end loop;
 for source_ref in select unnest(array['evidenceLedger','assumptionLedger']) loop
  actual:=p_boundary->source_ref;
  expected:=jsonb_build_object('seedContextId',seed_id,'schemaVersion','2.0','revision',1,'createdAt',at_text,'updatedAt',at_text);
  if source_ref='evidenceLedger' then expected:=expected||jsonb_build_object('conflicts','[]'::jsonb); end if;
  expected:=expected||jsonb_build_object('id',public.formal_world_guard_core_id_v3(case when source_ref='evidenceLedger' then 'evidence_ledger' else 'assumption_ledger' end,p_namespace,seed_id#>>'{}'));
  if actual-array['items','assumptions'] is distinct from expected then return false; end if;
 end loop;
 return true;
exception when others then return false;
end; $$;
create function public.formal_world_guard_text_v3(p_text text)
returns text language sql immutable security invoker set search_path=public,pg_temp as $$
 select btrim(regexp_replace(p_text,U&'[\0009-\000D\0020\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]+',' ','g'));
$$;

create function public.formal_world_guard_initial_authority_v3(p_world jsonb,p_source jsonb,p_rules jsonb,p_path text,p_namespace text,p_start timestamptz,p_horizon integer)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare actor jsonb; evidence jsonb; assumption jsonb; rule jsonb; edge jsonb; from_actor jsonb; to_actor jsonb; item jsonb; declared jsonb; variable jsonb; commitment jsonb; background_assumption jsonb;
 agents jsonb:='[]'; states jsonb:='[]'; entities jsonb:='[]'; relations jsonb:='[]'; constraints jsonb:='[]'; variables jsonb:='[]'; real_ids jsonb; assumption_ids jsonb; commitments jsonb; access_ids jsonb; provenance jsonb; role_provenance jsonb; allowed jsonb;
 seed_id jsonb:=p_source#>'{relation_graph_snapshots,seed_context_id}'; ordinal integer; core_id text; self_key text; self_source_id text; core_source_id text; actor_id text; entity_id text; source_key text; actor_type text; role_label text; raw_key text; variable_id text; from_id text; to_id text;
begin
 if public.formal_world_guard_boundary_valid_v3(p_world->'realityBoundarySnapshot',p_source,p_rules,p_path,p_horizon,p_namespace) is not true
  or p_world->>'id' is distinct from public.formal_world_guard_core_id_v3('world',p_namespace,'['||seed_id::text||',1,"agent-world-engine-v2-stage-3"]')
  or p_world->'realityBoundaryRevisionSnapshot' is distinct from '1'::jsonb
  or p_world->>'schemaVersion' is distinct from '2.0' or p_world->>'engineVersion' is distinct from 'agent-world-engine-v2-stage-3'
  or p_world->'seedContextId' is distinct from seed_id or p_world#>'{realityBoundarySnapshot,seedContextId}' is distinct from seed_id
  or jsonb_typeof(p_world->'agentDefinitions') is distinct from 'array' or jsonb_typeof(p_world->'agentStates') is distinct from 'array'
  or jsonb_typeof(p_world->'entities') is distinct from 'array' or jsonb_typeof(p_world->'relations') is distinct from 'array' or jsonb_typeof(p_world->'constraints') is distinct from 'array' then return false; end if;
 select 'person-'||ord::text,a->>'id' into core_id,core_source_id from jsonb_array_elements(p_source->'agent_profiles') with ordinality t(a,ord) where a->>'agent_type'='user_core';
 self_key:=case when p_path='main' then core_id else p_path end;
 select a->>'id' into self_source_id from jsonb_array_elements(p_source->'agent_profiles') with ordinality t(a,ord) where 'person-'||ord::text=self_key;
 background_assumption:=p_world#>'{realityBoundarySnapshot,assumptionLedger,assumptions,0}';
 select value into evidence from jsonb_array_elements(p_world#>'{realityBoundarySnapshot,evidenceLedger,items}') where value->>'claimKey'='formal.seed.summary';
 if evidence is null or evidence->>'statement' is distinct from public.formal_world_guard_text_v3(btrim(left(concat_ws(' ',nullif(p_source#>>'{seed_contexts,user_question}',''),nullif(p_source#>>'{seed_contexts,raw_context}','')),4000)))
  or evidence->>'sourceKind' is distinct from 'user_statement' or evidence->>'sourceTier' is distinct from 'tier_1_user_confirmed' or evidence->>'verificationStatus' is distinct from 'user_confirmed'
  or not exists(select 1 from jsonb_array_elements(evidence->'provenance') p where p->>'sourceRef'='seed_context:'||(seed_id#>>'{}') and (p->>'capturedAt')::timestamptz=(p_world#>>'{realityBoundarySnapshot,updatedAt}')::timestamptz)
  or (background_assumption-array['id','createdAt','updatedAt']) is distinct from jsonb_build_object('seedContextId',seed_id,'statement','Observed relationship conditions may remain stable during the selected horizon.','subjectType','external_variable','category','relationship_stability','epistemicStatus','inferred','impactLevel','medium','supportingRealEvidenceIds',jsonb_build_array(evidence->'id'),'contradictingRealEvidenceIds','[]'::jsonb,'limitations',jsonb_build_array('Visible simulation assumption, not a real-world fact.'),'confirmationRequirement','not_required','confirmationStatus','not_required','factStatus','not_real_world_fact') then return false; end if;
 select coalesce(jsonb_agg(to_jsonb(public.formal_planning_core_id_v1('world_resource',p_namespace,r->>'key')) order by ord),'[]') into access_ids from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,resources}','[]')) with ordinality t(r,ord);
 for actor,ordinal in select a,ord::integer from jsonb_array_elements(p_source->'agent_profiles') with ordinality t(a,ord) where a->>'id'=self_source_id or a->>'agent_type' not in ('user_core','user_variant') order by ord loop
  source_key:='person-'||ordinal::text; actor_id:=public.formal_planning_core_id_v1('agent_definition',p_namespace,actor->>'id'); entity_id:=public.formal_planning_core_id_v1('world_entity',p_namespace,actor->>'id');
  actor_type:=case when actor->>'agent_type' in ('user_core','user_variant') then 'self' when actor->>'agent_type'='group' then 'organization' else 'third_party' end;
  select value into evidence from jsonb_array_elements(p_world#>'{realityBoundarySnapshot,evidenceLedger,items}') where value->>'claimKey'='formal.agent.'||ordinal::text;
  if evidence is null or evidence->'seedContextId' is distinct from seed_id or evidence->>'sourceKind' is distinct from 'user_statement' or evidence->>'verificationStatus' is distinct from 'user_confirmed'
   or evidence->>'statement' is distinct from public.formal_world_guard_text_v3((actor->>'display_name')||'：'||case when actor->>'agent_type'='user_core' then '本人' when actor->>'agent_type'='user_variant' then '本人在独立条件下的平行策略' else '账户确认的人物角色' end)
   or not exists(select 1 from jsonb_array_elements(evidence->'provenance') p where p->>'sourceRef'='agent_snapshot:'||(p_source#>>'{relation_graph_snapshots,agent_snapshot_id}')||':'||(actor->>'id') and (p->>'capturedAt')::timestamptz=(p_world#>>'{realityBoundarySnapshot,updatedAt}')::timestamptz) then return false; end if;
  assumption_ids:='[]'; commitments:='[]';
  for rule in select value from jsonb_array_elements(p_rules->'actions') where value->>'pathKey'=p_path and value->>'actorKey'=source_key loop
   select value into assumption from jsonb_array_elements(p_world#>'{realityBoundarySnapshot,assumptionLedger,assumptions}') where value->>'category'='digital_life_rule_'||(rule->>'key');
   if assumption is null or assumption->'seedContextId' is distinct from seed_id or assumption->>'confirmationStatus' is distinct from 'confirmed' or assumption->>'epistemicStatus' is distinct from 'confirmed_for_simulation'
    or assumption->>'statement' is distinct from public.formal_world_guard_text_v3('用户确认的条件模拟规则：'||(rule#>>'{operation,actionType}')||'。'||case when rule ? 'guard' then '触发条件：'||public.formal_world_guard_description_v3(rule->'guard',p_source)||'。' else '' end||'依据：'||(rule->>'evidenceSummary')) then return false; end if;
   if assumption->>'subjectType' is distinct from case when rule#>>'{operation,actionType}'='update_external_variable' then 'external_variable' when actor->>'agent_type' in ('npc','group') then 'third_party' else 'self' end
    or assumption->>'impactLevel' is distinct from 'high' or assumption->>'confirmationRequirement' is distinct from 'required' or assumption->>'factStatus' is distinct from 'not_real_world_fact'
    or assumption->'contradictingRealEvidenceIds' is distinct from '[]'::jsonb or assumption ? 'parameterRange'
    or assumption->'limitations' is distinct from jsonb_build_array('Explicit user-authored conditional simulation rule, not observed behavior or private intent.')
    or assumption->'supportingRealEvidenceIds' is distinct from case when exists(select 1 from jsonb_array_elements(coalesce(p_source#>'{outcome_calibration,corrections}','[]')) c where c->'ruleKey'=rule->'key') then
     (select jsonb_build_array(e->'id') from jsonb_array_elements(p_world#>'{realityBoundarySnapshot,evidenceLedger,items}') e where e->>'claimKey'='formal.outcome.correction.'||(rule->>'key')) else '[]'::jsonb end then return false; end if;
   assumption_ids:=assumption_ids||jsonb_build_array(assumption->'id');
   if rule#>>'{operation,actionType}'='update_commitment' then
    commitment:=jsonb_build_object('id','digital_life_'||source_key||'_'||(rule#>>'{operation,commitmentKey}'),'label',rule#>'{operation,label}','status','planned');
    if exists(select 1 from jsonb_array_elements(commitments) c where c->'id'=commitment->'id') then
     select jsonb_agg(case when c->'id'=commitment->'id' then commitment else c end order by ord) into commitments from jsonb_array_elements(commitments) with ordinality t(c,ord);
    else commitments:=commitments||jsonb_build_array(commitment); end if;
   end if;
  end loop;
  real_ids:=jsonb_build_array(evidence->'id'); provenance:=jsonb_build_object('realEvidenceIds',real_ids,'assumptionIds','[]'::jsonb,'provisional',false,'visible',true);
  role_provenance:=jsonb_build_object('realEvidenceIds',real_ids,'assumptionIds',assumption_ids,'provisional',jsonb_array_length(assumption_ids)>0,'visible',true);
  if actor->>'id'=self_source_id then
   if p_path='main' then role_label:='本人数字分身；目标与价值观作为有来源背景'; else select '本人平行策略：'||(s->>'label') into role_label from jsonb_array_elements(p_rules->'strategies') s where s->>'participantKey'=p_path; end if;
  else
   select '账户确认的关键人物：'||(e->>'relationship_type') into role_label from jsonb_array_elements(p_source->'relation_edges') with ordinality t(e,ord) where e->'from_agent_id'=actor->'id' or e->'to_agent_id'=actor->'id' order by ord limit 1;
   role_label:=coalesce(role_label,'账户确认的关键人物：角色记录');
  end if;
  agents:=agents||jsonb_build_array(jsonb_build_object('id',actor_id,'actorType',actor_type,'displayName',actor->'display_name','role',role_label,'realEvidenceIds',real_ids,'assumptionIds',assumption_ids,'fieldProvenance',jsonb_build_object('displayName',provenance,'role',role_provenance),'constraints',jsonb_build_array('Private thoughts and deterministic outcomes are not inferred.'),'seedContextId',seed_id,'schemaVersion','2.0','createdAt',p_world->'createdAt'));
  states:=states||jsonb_build_array(jsonb_build_object('agentDefinitionId',actor_id,'observableStatus','available','commitments',commitments,'resourceAccessIds',case when actor->>'id'=self_source_id then access_ids else '[]'::jsonb end,'observations','[]'::jsonb,'memory','[]'::jsonb,'activeAssumptionIds',assumption_ids,'lastActionReference','null'::jsonb,'seedContextId',seed_id,'revision',0,'updatedAt',p_world->'createdAt'));
  entities:=entities||jsonb_build_array(jsonb_build_object('id',entity_id,'entityType',case when actor_type='organization' then 'organization' else 'person' end,'label',actor->'display_name','agentDefinitionId',actor_id,'provenance',provenance,'seedContextId',seed_id));
 end loop;
 for edge,ordinal in select e,ord::integer from jsonb_array_elements(p_source->'relation_edges') with ordinality t(e,ord) order by ord loop
  select a into from_actor from jsonb_array_elements(p_source->'agent_profiles') a where a->'id'=edge->'from_agent_id';
  select a into to_actor from jsonb_array_elements(p_source->'agent_profiles') a where a->'id'=edge->'to_agent_id';
  if from_actor->>'agent_type'='user_variant' or to_actor->>'agent_type'='user_variant' then continue; end if;
  from_id:=case when edge->>'from_agent_id'=core_source_id then self_source_id else edge->>'from_agent_id' end; to_id:=case when edge->>'to_agent_id'=core_source_id then self_source_id else edge->>'to_agent_id' end;
  select value into evidence from jsonb_array_elements(p_world#>'{realityBoundarySnapshot,evidenceLedger,items}') where value->>'claimKey'='formal.relation.'||ordinal::text;
  if evidence is null or not exists(select 1 from jsonb_array_elements(evidence->'provenance') p where p->>'sourceRef'='relation_edge:'||(edge->>'id') and (p->>'capturedAt')::timestamptz=(p_world#>>'{realityBoundarySnapshot,updatedAt}')::timestamptz) then return false; end if;
  relations:=relations||jsonb_build_array(jsonb_build_object('id',public.formal_world_guard_core_id_v3('world_relation',p_namespace,edge->>'id'),'relationType','collaborates_with','fromEntityId',public.formal_planning_core_id_v1('world_entity',p_namespace,from_id),'toEntityId',public.formal_planning_core_id_v1('world_entity',p_namespace,to_id),'signal','neutral','provenance',jsonb_build_object('realEvidenceIds',jsonb_build_array(evidence->'id'),'assumptionIds',jsonb_build_array(background_assumption->'id'),'provisional',true,'visible',true),'seedContextId',seed_id));
 end loop;
 for declared in select value from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,constraints}','[]')) loop
  select r into item from jsonb_array_elements(p_source#>'{reality_profiles,world_model_inputs,resources}') r where r->'key'=declared->'resourceKey';
  real_ids:='[]'; assumption_ids:='[]';
  if declared->>'classification'='fact' then
   select value into evidence from jsonb_array_elements(p_world#>'{realityBoundarySnapshot,evidenceLedger,items}') where value->>'claimKey'='reality.profile.world_constraint.'||(declared->>'key');
   if evidence is null then return false; end if; real_ids:=jsonb_build_array(evidence->'id');
  else
   select value into assumption from jsonb_array_elements(p_world#>'{realityBoundarySnapshot,assumptionLedger,assumptions}') where value->>'category'='reality_profile_world_constraint_'||(declared->>'key');
   if assumption is null then return false; end if; assumption_ids:=jsonb_build_array(assumption->'id');
  end if;
  constraints:=constraints||jsonb_build_array(jsonb_build_object('id',public.formal_world_guard_constraint_id_v3(p_namespace,declared->>'key'),'constraintType','deadline','target',jsonb_build_object('type','resource','id',public.formal_planning_core_id_v1('world_resource',p_namespace,item->>'key')),'rule',declared->'rule','provenance',jsonb_build_object('realEvidenceIds',real_ids,'assumptionIds',assumption_ids,'provisional',jsonb_array_length(assumption_ids)>0,'visible',true),'seedContextId',seed_id));
 end loop;
 for variable in select value from jsonb_array_elements(public.digital_life_model_draft_safe_context_v2(p_source)#>'{modelContext,variables}') loop
  raw_key:=case when variable->>'category'='pressure' then 'pressures.'||substring(variable->>'key' from 10) else 'externalVariables.'||substring(variable->>'key' from 19) end;
  variable_id:=public.formal_environment_core_variable_id_v2(p_namespace,raw_key); real_ids:='[]'; assumption_ids:='[]'; allowed:=jsonb_build_array(variable->'value');
  select value into rule from jsonb_array_elements(p_rules->'actions') where value->>'pathKey'=p_path and value#>>'{operation,actionType}'='update_external_variable' and value#>'{operation,variableKey}'=variable->'key';
  if rule is not null then allowed:=allowed||jsonb_build_array(rule#>'{operation,value}'); end if;
  if variable->>'classification'='fact' then select value into evidence from jsonb_array_elements(p_world#>'{realityBoundarySnapshot,evidenceLedger,items}') where value->>'claimKey'='reality.profile.'||lower(raw_key); if evidence is null then return false; end if; real_ids:=jsonb_build_array(evidence->'id');
  else select value into assumption from jsonb_array_elements(p_world#>'{realityBoundarySnapshot,assumptionLedger,assumptions}') where value->>'category'='reality_profile_'||raw_key; if assumption is null then return false; end if; assumption_ids:=jsonb_build_array(assumption->'id'); end if;
  variables:=variables||jsonb_build_array(jsonb_build_object('id',variable_id,'variableType','enum','key',variable->'key','value',variable->'value','allowedValues',allowed,'provisional',variable->>'classification'='assumption','provenance',jsonb_build_object('realEvidenceIds',real_ids,'assumptionIds',assumption_ids,'provisional',variable->>'classification'='assumption','visible',true),'seedContextId',seed_id));
 end loop;
 return p_world->'agentDefinitions'=agents and p_world->'agentStates'=states and p_world->'entities'=entities and p_world->'relations'=relations and p_world->'constraints'=constraints and p_world->'externalVariables'=variables;
exception when others then return false;
end; $$;
create function public.formal_world_guard_rng_raw_v3(p_seed bigint,p_draw integer)
returns bigint language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare state bigint; value bigint;
begin
 if p_seed is null or p_seed not between 0 and 4294967295 or p_draw is null or p_draw not between 0 and 5 then return null; end if;
 state:=mod(p_seed::numeric+(p_draw+1)::numeric*1831565813,4294967296)::bigint;
 value:=mod((state # (state >> 15))::numeric*(state | 1)::numeric,4294967296)::bigint;
 value:=value # mod(value::numeric+mod((value # (value >> 7))::numeric*(value | 61)::numeric,4294967296),4294967296)::bigint;
 return value # (value >> 14);
end; $$;

create function public.formal_world_guard_candidate_ids_v3(p_world jsonb,p_source jsonb,p_rules jsonb,p_path text,p_namespace text,p_tick integer,p_at timestamptz,p_horizon integer,p_sample_namespace text)
returns jsonb language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare candidates jsonb:='[]'; rule jsonb; declared jsonb; authorized jsonb; resource jsonb; core_id text; neutral double precision; spent double precision; prior_count integer; ticks integer:=case when p_horizon=30 then 3 else 6 end;
begin
 for rule in select value from jsonb_array_elements(p_rules->'actions') r where r->>'pathKey'=p_path and public.formal_world_guard_rule_eligible_v3(r,p_world,p_source,p_namespace,p_tick,p_at) loop
  candidates:=candidates||jsonb_build_array('action_proposal_v2_'||p_sample_namespace||'_'||p_tick::text||'_'||(rule->>'key'));
 end loop;
 if jsonb_array_length(candidates)>0 then return candidates; end if;
 for declared in select value from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,resources}','[]')) loop
  core_id:=public.formal_planning_core_id_v1('world_resource',p_namespace,declared->>'key');
  select value into resource from jsonb_array_elements(p_world->'resources') where value->>'id'=core_id;
  if exists(select 1 from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,constraints}','[]')) c where c->'resourceKey'=declared->'key' and p_at>=(c#>>'{rule,value}')::timestamptz) then continue; end if;
  if jsonb_typeof(declared->'usePerTick')='number' and (resource->>'available')::double precision-(declared->>'usePerTick')::double precision>=(resource->>'min')::double precision then candidates:=candidates||jsonb_build_array('action_proposal_v2_'||p_sample_namespace||'_'||p_tick::text||'_'||(declared->>'key')); end if;
 end loop;
 for authorized in select value from jsonb_array_elements(coalesce(p_source#>'{default_planning,resources}','[]')) loop
  declared:=p_source#>array['reality_profiles','world_model_inputs','resources',((substring(authorized->>'resourceKey' from 10))::integer-1)::text];
  if jsonb_typeof(declared->'usePerTick')='number' or exists(select 1 from jsonb_array_elements(p_rules->'actions') r where r#>>'{operation,actionType}'='allocate_resource' and r#>'{operation,resourceKey}'=authorized->'resourceKey') then continue; end if;
  core_id:=public.formal_planning_core_id_v1('world_resource',p_namespace,declared->>'key');
  select value into resource from jsonb_array_elements(p_world->'resources') where value->>'id'=core_id;
  neutral:=public.formal_planning_neutral_amount_v1((authorized->>'totalBudgetLimit')::double precision,(declared->>'available')::double precision,(declared->>'minimum')::double precision,ticks);
  if neutral is null or neutral<=0 or (resource->>'available')::double precision-neutral<(resource->>'min')::double precision then continue; end if;
  select count(*),coalesce(sum((e#>>'{operation,amount}')::double precision),0) into prior_count,spent from jsonb_array_elements(p_world->'worldEvents') e where e->>'proposalId' like 'action_proposal_v2_formal_planning_%' and e#>'{operation,resourceId}'=resource->'id';
  if (prior_count+1)*neutral>(authorized->>'totalBudgetLimit')::double precision or spent>(authorized->>'totalBudgetLimit')::double precision then continue; end if;
  if exists(select 1 from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,constraints}','[]')) c where c->'resourceKey'=declared->'key' and p_at>=(c#>>'{rule,value}')::timestamptz) then continue; end if;
  candidates:=candidates||jsonb_build_array('action_proposal_v2_formal_planning_'||p_sample_namespace||'_'||p_tick::text||'_'||(authorized->>'resourceKey'));
 end loop;
 return candidates;
exception when others then return null;
end; $$;

alter table public.generation_jobs add column formal_terminal_receipt jsonb;
alter table public.generation_jobs drop constraint generation_jobs_formal_reservation_shape;
alter table public.generation_jobs add constraint generation_jobs_formal_reservation_shape check (
 (job_type<>'formal_run_reservation' and formal_terminal_receipt is null) or (job_type='formal_run_reservation' and (
  version='formal-run-reservation-v1' and writer_version='formal-run-reservation-v1'
  and formal_graph_snapshot_id is not null and seed_context_id is not null
  and formal_content_hash is not null and formal_content_hash ~ '^[a-f0-9]{64}$' and formal_accepted_at is not null
  and formal_simulation_start_at is not null and formal_simulation_start_at=formal_accepted_at+interval '5 minutes'
  and frozen_source_input is not null and jsonb_typeof(frozen_source_input)='object'
  and ((status='queued' and simulation_id is null and formal_terminal_receipt is null)
   or (status='completed' and simulation_id is not null and formal_terminal_receipt is null)
   or (status='failed' and simulation_id is null and frozen_source_input#>>'{digital_life_rules,version}'='digital-life-rules-v3'
    and jsonb_typeof(formal_terminal_receipt)='object'
    and formal_terminal_receipt->>'version'='formal-no-eligible-actions-v1'
    and formal_terminal_receipt->>'requestHash'=formal_content_hash
    and formal_terminal_receipt->>'attemptHash' ~ '^[a-f0-9]{64}$'
    and formal_terminal_receipt#>>'{pathDiagnostics,version}'='formal-path-diagnostics-v1'
    and formal_terminal_receipt#>>'{pathDiagnostics,status}'='not_saved'))
 ) is true)
);
-- Only the dedicated nullable receipt column is added to the existing writer
-- grant. No general output_refs/error_code privilege or RLS policy is added.
grant update(formal_terminal_receipt) on public.generation_jobs to authenticated;

create function public.formal_world_guard_request_hash_v3(p_request jsonb,p_key uuid)
returns text language plpgsql immutable security invoker set search_path=public,extensions as $$
declare graph_id uuid; horizon integer; rules jsonb; outcome jsonb; planning jsonb;
begin
 if jsonb_typeof(p_request) is distinct from 'object' or not p_request ?& array['graph_snapshot_id','idempotency_key','horizon_days','digital_life_rules']
  or exists(select 1 from jsonb_object_keys(p_request) k where k not in ('graph_snapshot_id','idempotency_key','horizon_days','digital_life_rules','outcome_calibration','default_planning'))
  or (p_request->>'idempotency_key')::uuid is distinct from p_key or jsonb_typeof(p_request->'horizon_days') is distinct from 'number'
  or p_request->'horizon_days' not in ('30'::jsonb,'90'::jsonb) or p_request#>>'{digital_life_rules,version}' is distinct from 'digital-life-rules-v3'
  or public.formal_run_rules_valid(p_request->'digital_life_rules') is not true then return null; end if;
 graph_id:=(p_request->>'graph_snapshot_id')::uuid; horizon:=(p_request->>'horizon_days')::integer; rules:=p_request->'digital_life_rules'; outcome:=p_request->'outcome_calibration'; planning:=p_request->'default_planning';
 if graph_id is null or (p_request ? 'outcome_calibration' and jsonb_typeof(outcome) is distinct from 'object') or (p_request ? 'default_planning' and jsonb_typeof(planning) is distinct from 'object') then return null; end if;
 if planning is not null then return encode(digest(convert_to(jsonb_build_object('graph',graph_id,'horizon',horizon,'rules',rules,'outcome_calibration',outcome,'default_planning',planning,'version','formal-run-reservation-planning-v1')::text,'UTF8'),'sha256'),'hex'); end if;
 if outcome is not null then return encode(digest(convert_to(jsonb_build_object('graph',graph_id,'horizon',horizon,'rules',rules,'version','formal-run-reservation-outcome-v1','outcome_calibration',outcome)::text,'UTF8'),'sha256'),'hex'); end if;
 return encode(digest(convert_to(jsonb_build_object('graph',graph_id,'horizon',horizon,'rules',rules,'version','formal-run-reservation-v1')::text,'UTF8'),'sha256'),'hex');
exception when others then return null;
end; $$;

create function public.finalize_account_sandbox_no_eligible_actions_v3(p_idempotency_key uuid,p_request jsonb,p_attempt jsonb)
returns jsonb language plpgsql security invoker set search_path=public,extensions as $$
declare owner_id uuid:=auth.uid(); job public.generation_jobs; request_hash text; attempt_hash text; diagnostics jsonb; receipt jsonb; seed integer;
begin
 perform set_config('app.formal_reservation_rpc','off',true); perform set_config('app.formal_no_actions_rpc','off',true);
 if owner_id is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then raise exception using errcode='42501',message='unauthenticated'; end if;
 request_hash:=public.formal_world_guard_request_hash_v3(p_request,p_idempotency_key);
 if p_idempotency_key is null or request_hash is null then raise exception using errcode='P0001',message='invalid_request'; end if;
 perform pg_advisory_xact_lock(hashtextextended(owner_id::text||':m1-run:'||p_idempotency_key::text,0));
 perform set_config('app.formal_reservation_rpc','on',true);
 select * into job from public.generation_jobs where user_id=owner_id and job_type='formal_run_reservation' and idempotency_key=p_idempotency_key::text for update;
 if not found then raise exception using errcode='P0001',message='reservation_not_found'; end if;
 if job.formal_content_hash is distinct from request_hash then raise exception using errcode='P0001',message='idempotency_key_content_conflict'; end if;
 -- A durable receipt wins before current sources, attempt validation and expiry.
 if job.status='failed' and job.formal_terminal_receipt->>'version'='formal-no-eligible-actions-v1' then
  perform set_config('app.formal_reservation_rpc','off',true);
  return jsonb_build_object('idempotent',true,'pathDiagnostics',job.formal_terminal_receipt->'pathDiagnostics');
 end if;
 if job.status<>'queued' or job.simulation_id is not null then raise exception using errcode='P0001',message='reservation_not_pending'; end if;
 if clock_timestamp()>=job.formal_simulation_start_at then raise exception using errcode='P0001',message='reservation_expired'; end if;
 seed:=(('x'||left(encode(digest(convert_to(job.formal_graph_snapshot_id::text||':'||p_idempotency_key::text,'UTF8'),'sha256'),'hex'),7))::bit(28)::integer % 1999999999)+1;
 diagnostics:=public.formal_world_guard_attempt_diagnostics_v3(p_attempt,job.frozen_source_input,job.formal_accepted_at,job.formal_simulation_start_at,(p_request->>'horizon_days')::integer,seed);
 if diagnostics is null then raise exception using errcode='P0001',message='invalid_no_actions_attempt'; end if;
 attempt_hash:=encode(digest(convert_to(public.formal_relationship_canonical_json_v1(p_attempt),'UTF8'),'sha256'),'hex');
 receipt:=jsonb_build_object('version','formal-no-eligible-actions-v1','requestHash',request_hash,'attemptHash',attempt_hash,'pathDiagnostics',diagnostics);
 perform set_config('app.formal_no_actions_rpc','on',true);
 perform set_config('app.formal_no_actions_attempt',p_attempt::text,true); perform set_config('app.formal_no_actions_request',p_request::text,true);
 update public.generation_jobs set status='failed',formal_terminal_receipt=receipt where id=job.id and user_id=owner_id and status='queued';
 if not found then raise exception using errcode='P0001',message='reservation_not_pending'; end if;
 perform set_config('app.formal_no_actions_rpc','off',true); perform set_config('app.formal_reservation_rpc','off',true);
 perform set_config('app.formal_no_actions_attempt','',true); perform set_config('app.formal_no_actions_request','',true);
 return jsonb_build_object('idempotent',false,'pathDiagnostics',diagnostics);
exception when others then
 perform set_config('app.formal_no_actions_attempt','',true); perform set_config('app.formal_no_actions_request','',true);
 perform set_config('app.formal_no_actions_rpc','off',true); perform set_config('app.formal_reservation_rpc','off',true); raise;
end; $$;
create function public.formal_world_guard_observations_v3(p_initial jsonb,p_trajectories jsonb,p_source jsonb,p_rules jsonb,p_path text,p_namespace text,p_horizon integer)
returns jsonb language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare sample jsonb; sample_index integer; ticks jsonb; rows jsonb; result jsonb:='[]'; current_world jsonb; before_world jsonb; step jsonb; event jsonb; delta jsonb; rule jsonb; actor jsonb; item jsonb; observed jsonb; after_observed jsonb;
 tick_index integer; item_index integer; offset_count integer:=0; max_ticks integer:=case when p_horizon=30 then 3 else 6 end; core_id text; actor_id text; raw_key text; collection text; label text; unit jsonb; schedule text; candidate jsonb; satisfied jsonb; due boolean; already boolean; offered boolean;
begin
 for sample,sample_index in select value,ord::integer from jsonb_array_elements(p_trajectories) with ordinality t(value,ord) loop
  current_world:=p_initial; ticks:='[]';
  for tick_index in 0..max_ticks-1 loop
   step:=sample->'steps'->tick_index; event:=null; before_world:=current_world; rows:='[]';
   if step ? 'worldEventId' then
    select value into event from jsonb_array_elements(sample#>'{finalWorld,worldEvents}') where value->'id'=step->'worldEventId';
    delta:=event->'deltas'->0;
    if delta->>'valueType' in ('resource','variable') then
     collection:=case when delta->>'valueType'='resource' then 'resources' else 'externalVariables' end;
     select ord::integer-1 into item_index from jsonb_array_elements(current_world->collection) with ordinality t(value,ord) where value->>'id'=split_part(delta->>'path','.',2);
     current_world:=jsonb_set(current_world,array[collection,item_index::text,case when collection='resources' then 'available' else 'value' end],delta->'after');
    end if;
    current_world:=jsonb_set(current_world,'{worldEvents}',current_world->'worldEvents'||jsonb_build_array(event));
   end if;
   for rule in select value from jsonb_array_elements(p_rules->'actions') where value->>'pathKey'=p_path and value ? 'guard' loop
    actor:=p_source->'agent_profiles'->((substring(rule->>'actorKey' from 8))::integer-1);
    actor_id:=public.formal_planning_core_id_v1('agent_definition',p_namespace,actor->>'id');
    if rule#>>'{guard,kind}'='resource_balance' then
     item:=p_source#>array['reality_profiles','world_model_inputs','resources',((substring(rule#>>'{guard,resourceKey}' from 10))::integer-1)::text];
     core_id:=public.formal_planning_core_id_v1('world_resource',p_namespace,item->>'key'); label:=item->>'label'; unit:=item->'unit';
     select value->'available' into observed from jsonb_array_elements(before_world->'resources') where value->>'id'=core_id;
     select value->'available' into after_observed from jsonb_array_elements(current_world->'resources') where value->>'id'=core_id;
    else
     select value into item from jsonb_array_elements(public.digital_life_model_draft_safe_context_v2(p_source)#>'{modelContext,variables}') where value->'key'=rule#>'{guard,variableKey}';
     raw_key:=case when item->>'category'='pressure' then 'pressures.'||substring(item->>'key' from 10) else 'externalVariables.'||substring(item->>'key' from 19) end;
     core_id:=public.formal_environment_core_variable_id_v2(p_namespace,raw_key); label:=item->>'label'; unit:='null';
     select value->'value' into observed from jsonb_array_elements(before_world->'externalVariables') where value->>'id'=core_id;
     select value->'value' into after_observed from jsonb_array_elements(current_world->'externalVariables') where value->>'id'=core_id;
    end if;
    already:=exists(select 1 from jsonb_array_elements(before_world->'worldEvents') e where e->>'proposalId' ~ ('_'||(rule->>'key')||'$'));
    due:=case when rule#>>'{when,kind}'='at_tick' then rule#>'{when,tickIndex}'=to_jsonb(tick_index) else exists(select 1 from jsonb_array_elements(before_world->'worldEvents') e where e->>'proposalId' ~ ('_'||(rule#>>'{when,ruleKey}')||'$')) end;
    schedule:=case when step is null then 'not_reached' when already then 'already_selected' when due then 'due' else 'not_due' end;
    satisfied:=case when step is not null and due and not already then to_jsonb(public.formal_world_guard_satisfied_v3(rule->'guard',before_world,p_source,p_namespace,actor_id)) else 'null'::jsonb end;
    offered:=step is not null and public.formal_world_guard_rule_eligible_v3(rule,before_world,p_source,p_namespace,tick_index,(step->>'occurredAt')::timestamptz);
    candidate:=case when step is null or not due or already or satisfied is distinct from 'true'::jsonb then 'null'::jsonb
     when offered and event->>'proposalId' ~ ('_'||(rule->>'key')||'$') then '"selected"'::jsonb when offered then '"not_selected"'::jsonb else '"ineligible"'::jsonb end;
    rows:=rows||jsonb_build_array(jsonb_build_object('ruleKey',rule->'key','tickIndex',tick_index,'label',label,'unit',unit,'conditionDescription',public.formal_world_guard_description_v3(rule->'guard',p_source),'schedule',schedule,'guard',satisfied,'candidate',candidate,
     'before',case when step is null then 'null'::jsonb else observed end,'after',case when step is null then 'null'::jsonb else after_observed end,'stepKey',case when candidate='"selected"'::jsonb then to_jsonb('step-'||(offset_count+tick_index+1)::text) else 'null'::jsonb end));
   end loop;
   ticks:=ticks||jsonb_build_array(jsonb_build_object('tickIndex',tick_index,'occurredAt',case when step is null then 'null'::jsonb else step->'occurredAt' end,'observations',rows));
  end loop;
  result:=result||jsonb_build_array(jsonb_build_object('key','sample-'||sample_index::text,'ticks',ticks));
  offset_count:=offset_count+jsonb_array_length(sample#>'{finalWorld,worldEvents}');
 end loop;
 return jsonb_build_object('version','digital-life-guard-observations-v1','samples',result);
exception when others then return null;
end; $$;

create function public.formal_world_guard_attempt_diagnostics_v3(p_attempt jsonb,p_source jsonb,p_accepted timestamptz,p_start timestamptz,p_horizon integer,p_seed integer)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare rules jsonb:=public.formal_relationship_effective_rules_v1(p_source); expected_paths jsonb; path jsonb; path_index integer; frame jsonb; trajectory jsonb; sample_index integer; expected_events jsonb; snapshots jsonb; samples jsonb; observations jsonb; paths jsonb:='[]'; has_empty boolean:=false; empty_path boolean; namespace text; sample_namespace text; label text;
begin
 if p_attempt->>'version' is distinct from 'formal-guard-attempt-v1' or jsonb_typeof(p_attempt) is distinct from 'object' or (select count(*) from jsonb_object_keys(p_attempt))<>2
  or jsonb_typeof(p_attempt->'paths') is distinct from 'array' or rules->>'version' is distinct from 'digital-life-rules-v3'
  or public.formal_world_guard_rules_valid_v3(p_source,rules,p_horizon) is not true then return null; end if;
 select jsonb_build_array('main')||coalesce(jsonb_agg(s->'participantKey' order by ord),'[]') into expected_paths from jsonb_array_elements(rules->'strategies') with ordinality t(s,ord);
 if jsonb_array_length(p_attempt->'paths')<>jsonb_array_length(expected_paths) then return null; end if;
 for path,path_index in select value,ord::integer-1 from jsonb_array_elements(p_attempt->'paths') with ordinality t(value,ord) loop
  if jsonb_typeof(path) is distinct from 'object' or not path ?& array['pathKey','causalFingerprint','inputSnapshot','sourceBoundary','forecastTiming','initialWorld','trajectories']
   or exists(select 1 from jsonb_object_keys(path) k where k not in ('pathKey','causalFingerprint','policyFingerprint','inputSnapshot','sourceBoundary','forecastTiming','initialWorld','trajectories','defaultPlanningSnapshot','defaultPlanningTraces'))
   or path->'pathKey' is distinct from expected_paths->path_index or path->'pathKey' is distinct from path#>'{inputSnapshot,activePathKey}'
   or path#>'{inputSnapshot,deterministicSeed}' is distinct from to_jsonb(p_seed)
   or path#>>'{inputSnapshot,digitalLifeModel,version}' is distinct from 'digital-life-model-v3'
   or jsonb_typeof(path->'trajectories') is distinct from 'array' or jsonb_array_length(path->'trajectories')<>3
   or (select count(*) from jsonb_object_keys(path->'forecastTiming'))<>3 then return null; end if;
  select coalesce(jsonb_agg(e.value||jsonb_build_object('branchId',t.value->'trajectoryId','tickIndex',e.event_order-1) order by t.trajectory_order,e.event_order),'[]') into expected_events
   from jsonb_array_elements(path->'trajectories') with ordinality t(value,trajectory_order) cross join lateral jsonb_array_elements(t.value#>'{finalWorld,worldEvents}') with ordinality e(value,event_order);
  select jsonb_agg(t->'finalWorld' order by ord) into snapshots from jsonb_array_elements(path->'trajectories') with ordinality a(t,ord);
  frame:=(path-array['pathKey','initialWorld','trajectories'])||jsonb_build_object('trajectoryAnalysis',jsonb_build_object('spec',jsonb_build_object('policyVersion','digital-life-adapter-v3','trajectoryTemplate',jsonb_build_object('initialWorld',path->'initialWorld')),'trajectories',path->'trajectories'),'worldSnapshots',snapshots,'events',expected_events,'symbolicLensSnapshot',p_source->'symbolic_lens');
  if public.formal_world_guard_attempt_planning_valid_v2(frame,p_source,p_accepted,p_start,p_horizon) is not true
   or public.formal_world_guard_environment_bundle_valid_v3(frame,p_source,p_start,p_horizon) is not true then return null; end if;
  namespace:='formal-'||coalesce(path->>'policyFingerprint',path->>'causalFingerprint'); samples:='[]'; empty_path:=true;
  for trajectory,sample_index in select value,ord::integer-1 from jsonb_array_elements(path->'trajectories') with ordinality t(value,ord) loop
   sample_namespace:='formal_'||coalesce(path->>'policyFingerprint',path->>'causalFingerprint')||'_'||(trajectory->>'trajectorySeed');
   if trajectory->'trajectorySeed' is distinct from to_jsonb(p_seed+sample_index)
    or public.formal_world_guard_trajectory_valid_v3(path->'initialWorld',trajectory,p_source,rules,path->>'pathKey',namespace,sample_namespace,p_start,p_horizon) is not true then return null; end if;
   if trajectory->>'status'<>'no_actions' or jsonb_array_length(trajectory->'steps')<>1 or trajectory#>'{finalWorld,worldEvents}'<>'[]'::jsonb then empty_path:=false; end if;
   samples:=samples||jsonb_build_array(jsonb_build_object('key','sample-'||(sample_index+1)::text,'terminalStatus',trajectory->'status','executedTickCount',jsonb_array_length(trajectory->'steps'),'selectedEventCount',jsonb_array_length(trajectory#>'{finalWorld,worldEvents}')));
  end loop;
  has_empty:=has_empty or empty_path;
  observations:=public.formal_world_guard_observations_v3(path->'initialWorld',path->'trajectories',p_source,rules,path->>'pathKey',namespace,p_horizon);
  if observations is null then return null; end if;
  if path_index=0 then label:='当前路径'; else select s->>'label' into label from jsonb_array_elements(rules->'strategies') s where s->'participantKey'=path->'pathKey'; end if;
  paths:=paths||jsonb_build_array(jsonb_build_object('key','path-'||(path_index+1)::text,'label',label,'status',case when empty_path then 'no_actions' else 'has_events' end,'samples',samples,'guardObservations',observations));
 end loop;
 if not has_empty then return null; end if;
 return jsonb_build_object('version','formal-path-diagnostics-v1','status','not_saved','paths',paths);
exception when others then return null;
end; $$;
create function public.formal_world_guard_rule_eligible_v3(p_rule jsonb,p_world jsonb,p_source jsonb,p_namespace text,p_tick integer,p_at timestamptz)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare actor jsonb; actor_id text; declared jsonb; resource jsonb; variable jsonb; core_id text; raw_key text;
begin
 if exists(select 1 from jsonb_array_elements(p_world->'worldEvents') e where e->>'proposalId' ~ ('_'||(p_rule->>'key')||'$')) then return false; end if;
 if p_rule#>>'{when,kind}'='at_tick' then
  if p_rule#>'{when,tickIndex}' is distinct from to_jsonb(p_tick) then return false; end if;
 elsif not exists(select 1 from jsonb_array_elements(p_world->'worldEvents') e where e->>'proposalId' ~ ('_'||(p_rule#>>'{when,ruleKey}')||'$')) then return false;
 end if;
 actor:=p_source->'agent_profiles'->((substring(p_rule->>'actorKey' from 8))::integer-1);
 actor_id:=public.formal_planning_core_id_v1('agent_definition',p_namespace,actor->>'id');
 if not exists(select 1 from jsonb_array_elements(p_world->'agentDefinitions') a where a->>'id'=actor_id) then return false; end if;
 if p_rule ? 'guard' and public.formal_world_guard_satisfied_v3(p_rule->'guard',p_world,p_source,p_namespace,actor_id) is not true then return false; end if;
 if p_rule#>>'{operation,actionType}'='allocate_resource' then
  declared:=p_source#>array['reality_profiles','world_model_inputs','resources',((substring(p_rule#>>'{operation,resourceKey}' from 10))::integer-1)::text];
  core_id:=public.formal_planning_core_id_v1('world_resource',p_namespace,declared->>'key');
  select value into resource from jsonb_array_elements(p_world->'resources') where value->>'id'=core_id and value->>'controllerAgentId'=actor_id;
  return resource is not null and (resource->>'available')::double precision-(p_rule#>>'{operation,amount}')::double precision>=(resource->>'min')::double precision
   and not exists(select 1 from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,constraints}','[]')) c where c->'resourceKey'=declared->'key' and p_at>=(c#>>'{rule,value}')::timestamptz);
 elsif p_rule#>>'{operation,actionType}'='update_external_variable' then
  raw_key:=case when p_rule#>>'{operation,variableKey}' like 'pressure-%' then 'pressures.'||substring(p_rule#>>'{operation,variableKey}' from 10) else 'externalVariables.'||substring(p_rule#>>'{operation,variableKey}' from 19) end;
  core_id:=public.formal_environment_core_variable_id_v2(p_namespace,raw_key);
  select value into variable from jsonb_array_elements(p_world->'externalVariables') where value->>'id'=core_id;
  return variable is not null and variable->'value' is distinct from p_rule#>'{operation,value}';
 elsif p_rule#>>'{operation,actionType}'='update_relation_signal' then
  declared:=p_source->'relation_edges'->((substring(p_rule#>>'{operation,relationKey}' from 10))::integer-1);
  core_id:=public.formal_world_guard_core_id_v3('world_relation',p_namespace,declared->>'id');
  return exists(select 1 from jsonb_array_elements(p_world->'relations') r where r->>'id'=core_id);
 end if;
 return p_rule#>>'{operation,actionType}' in ('request_information','update_commitment');
exception when others then return false;
end; $$;

-- This is an eligibility test, not a claim that a proposal was selected. Neutral
-- planner quantity controls eligibility even when an independently authorized
-- hypothesis changes the offered quantity. No RNG draw occurs for a guard read.
create function public.formal_world_guard_has_candidates_v3(p_world jsonb,p_source jsonb,p_rules jsonb,p_path text,p_namespace text,p_tick integer,p_at timestamptz,p_horizon integer)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare declared jsonb; authorized jsonb; resource jsonb; core_id text; neutral double precision; spent double precision; prior_count integer; ticks integer:=case when p_horizon=30 then 3 else 6 end;
begin
 if exists(select 1 from jsonb_array_elements(p_rules->'actions') r where r->>'pathKey'=p_path and public.formal_world_guard_rule_eligible_v3(r,p_world,p_source,p_namespace,p_tick,p_at)) then return true; end if;
 for declared in select value from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,resources}','[]')) loop
  core_id:=public.formal_planning_core_id_v1('world_resource',p_namespace,declared->>'key');
  select value into resource from jsonb_array_elements(p_world->'resources') where value->>'id'=core_id;
  if exists(select 1 from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,constraints}','[]')) c where c->'resourceKey'=declared->'key' and p_at>=(c#>>'{rule,value}')::timestamptz) then continue; end if;
  if jsonb_typeof(declared->'usePerTick')='number' and (resource->>'available')::double precision-(declared->>'usePerTick')::double precision>=(resource->>'min')::double precision then return true; end if;
 end loop;
 for authorized in select value from jsonb_array_elements(coalesce(p_source#>'{default_planning,resources}','[]')) loop
  declared:=p_source#>array['reality_profiles','world_model_inputs','resources',((substring(authorized->>'resourceKey' from 10))::integer-1)::text];
  if jsonb_typeof(declared->'usePerTick')='number' or exists(select 1 from jsonb_array_elements(p_rules->'actions') r where r#>>'{operation,actionType}'='allocate_resource' and r#>'{operation,resourceKey}'=authorized->'resourceKey') then continue; end if;
  core_id:=public.formal_planning_core_id_v1('world_resource',p_namespace,declared->>'key');
  select value into resource from jsonb_array_elements(p_world->'resources') where value->>'id'=core_id;
  neutral:=public.formal_planning_neutral_amount_v1((authorized->>'totalBudgetLimit')::double precision,(declared->>'available')::double precision,(declared->>'minimum')::double precision,ticks);
  if neutral is null or neutral<=0 or (resource->>'available')::double precision-neutral<(resource->>'min')::double precision then continue; end if;
  select count(*),coalesce(sum((e#>>'{operation,amount}')::double precision),0) into prior_count,spent from jsonb_array_elements(p_world->'worldEvents') e where e->>'proposalId' like 'action_proposal_v2_formal_planning_%' and e#>'{operation,resourceId}'=resource->'id';
  if (prior_count+1)*neutral>(authorized->>'totalBudgetLimit')::double precision or spent>(authorized->>'totalBudgetLimit')::double precision then continue; end if;
  if exists(select 1 from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,constraints}','[]')) c where c->'resourceKey'=declared->'key' and p_at>=(c#>>'{rule,value}')::timestamptz) then continue; end if;
  return true;
 end loop;
 return false;
exception when others then return null;
end; $$;
create function public.formal_world_guard_unique_ids_v3(p_ids jsonb)
returns jsonb language sql immutable security invoker set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(value order by first_ord),'[]') from (select value,min(ord) first_ord from jsonb_array_elements(p_ids) with ordinality t(value,ord) group by value) d;
$$;
-- Legacy validation is restricted to its unchanged non-guard envelope. The real
-- guard envelope is checked against the before-World in the trajectory fold.
create function public.formal_world_guard_baseline_world_v3(p_world jsonb,p_frame jsonb)
returns jsonb language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare rules jsonb:=(p_frame->>'effectiveRulesSignature')::jsonb; event jsonb; rule jsonb; actor jsonb; evidence jsonb; assumption jsonb; prior jsonb; events jsonb:='[]'; assumptions jsonb:='[]';
begin
 for event in select value from jsonb_array_elements(p_world->'worldEvents') loop
  select value into rule from jsonb_array_elements(rules->'actions') where event->>'proposalId' ~ ('_'||(value->>'key')||'$');
  if rule ? 'guard' then
   select value into actor from jsonb_array_elements(p_frame#>'{ruleBindings,agents}') where value->'key'=rule->'actorKey';
   select value into evidence from jsonb_array_elements(p_world#>'{realityBoundarySnapshot,evidenceLedger,items}') where value->>'claimKey'='formal.agent.'||(actor->>'sourceOrdinal');
   select value into assumption from jsonb_array_elements(p_world#>'{realityBoundarySnapshot,assumptionLedger,assumptions}') where value->>'category'='digital_life_rule_'||(rule->>'key');
   prior:=null;
   if rule#>>'{when,kind}'='after_rule' then select value into prior from jsonb_array_elements(p_world->'worldEvents') where value->>'proposalId' ~ ('_'||(rule#>>'{when,ruleKey}')||'$'); end if;
   event:=event||jsonb_build_object('causalRealEvidenceIds',jsonb_build_array(evidence->'id'),'causalAssumptionIds',jsonb_build_array(assumption->'id'),'priorWorldEventIds',case when prior is null then '[]'::jsonb else jsonb_build_array(prior->'id') end);
  end if;
  events:=events||jsonb_build_array(event);
 end loop;
 for assumption in select value from jsonb_array_elements(p_world#>'{realityBoundarySnapshot,assumptionLedger,assumptions}') loop
  select value into rule from jsonb_array_elements(rules->'actions') where assumption->>'category'='digital_life_rule_'||(value->>'key');
  if rule ? 'guard' then assumption:=jsonb_set(assumption,'{statement}',to_jsonb('用户确认的条件模拟规则：'||(rule#>>'{operation,actionType}')||'。依据：'||(rule->>'evidenceSummary'))); end if;
  assumptions:=assumptions||jsonb_build_array(assumption);
 end loop;
 return jsonb_set(jsonb_set(p_world,'{worldEvents}',events),'{realityBoundarySnapshot,assumptionLedger,assumptions}',assumptions);
exception when others then return null;
end; $$;
alter function public.formal_relationship_rule_event_valid_v1(jsonb,jsonb,jsonb,text,text,timestamptz,integer,text[]) rename to formal_relationship_rule_event_valid_before_world_guards_v3;
create function public.formal_relationship_rule_event_valid_v1(p_rule jsonb,p_frame jsonb,p_world jsonb,p_namespace text,p_world_namespace text,p_start timestamptz,p_ticks integer,p_seen text[] default array[]::text[])
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if ((p_frame->>'effectiveRulesSignature')::jsonb)->>'version'='digital-life-rules-v3' then
  return public.formal_relationship_rule_event_valid_before_world_guards_v3(p_rule,p_frame,public.formal_world_guard_baseline_world_v3(p_world,p_frame),p_namespace,p_world_namespace,p_start,p_ticks,p_seen);
 end if;
 return public.formal_relationship_rule_event_valid_before_world_guards_v3(p_rule,p_frame,p_world,p_namespace,p_world_namespace,p_start,p_ticks,p_seen);
exception when others then return false;
end; $$;
-- Forward source candidate. No V2 Core, source/signature protocol, Run storage
-- version or historical artifacts change. The only added table privilege is
-- UPDATE on the dedicated, independently guarded formal_terminal_receipt column.
-- Completed bundle validation remains separate from terminal attempt validation.
create function public.formal_world_guard_bundle_valid_v3(p_bundle jsonb,p_source jsonb,p_start timestamptz,p_horizon integer)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare trajectory jsonb; sample_index integer; namespace text:='formal-'||coalesce(p_bundle->>'policyFingerprint',p_bundle->>'causalFingerprint'); sample_namespace text; initial_world jsonb:=p_bundle#>'{trajectoryAnalysis,spec,trajectoryTemplate,initialWorld}';
begin
 if p_bundle#>>'{versions,runtime}' is distinct from 'formal-account-sandbox-m1-v1' or p_bundle#>>'{versions,schema}' is distinct from 'formal-run-bundle-m1-v1'
  or p_bundle#>>'{trajectoryAnalysis,spec,policyVersion}' is distinct from 'digital-life-adapter-v3'
  or public.formal_world_guard_environment_bundle_valid_v3(p_bundle,p_source,p_start,p_horizon) is not true then return false; end if;
 for trajectory,sample_index in select value,ord::integer-1 from jsonb_array_elements(p_bundle#>'{trajectoryAnalysis,trajectories}') with ordinality t(value,ord) loop
  sample_namespace:='formal_'||coalesce(p_bundle->>'policyFingerprint',p_bundle->>'causalFingerprint')||'_'||(trajectory->>'trajectorySeed');
  if public.formal_world_guard_trajectory_valid_v3(initial_world,trajectory,p_source,p_bundle#>'{inputSnapshot,digitalLifeModel,rules}',p_bundle#>>'{inputSnapshot,activePathKey}',namespace,sample_namespace,p_start,p_horizon) is not true then return false; end if;
 end loop;
 return true;
exception when others then return false;
end; $$;
alter function public.formal_run_bundle_matches_reservation(jsonb,jsonb,timestamptz,timestamptz,integer) rename to formal_run_bundle_matches_reservation_before_world_guards_v3;
create function public.formal_run_bundle_matches_reservation(p_bundle jsonb,p_source jsonb,p_accepted timestamptz,p_start timestamptz,p_horizon integer)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if p_source#>>'{digital_life_rules,version}'='digital-life-rules-v3' then
  if p_bundle#>>'{inputSnapshot,digitalLifeModel,version}' is distinct from 'digital-life-model-v3'
   or public.formal_run_bundle_matches_reservation_before_world_guards_v3(p_bundle,p_source,p_accepted,p_start,p_horizon) is not true then return false; end if;
  return public.formal_world_guard_bundle_valid_v3(p_bundle,p_source,p_start,p_horizon);
 end if;
 if p_bundle#>>'{inputSnapshot,digitalLifeModel,version}'='digital-life-model-v3' or p_bundle#>>'{trajectoryAnalysis,spec,policyVersion}'='digital-life-adapter-v3' then return false; end if;
 return public.formal_run_bundle_matches_reservation_before_world_guards_v3(p_bundle,p_source,p_accepted,p_start,p_horizon);
exception when others then return false;
end; $$;
create function public.formal_world_guard_shape_valid_v3(p_guard jsonb)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
begin
 if jsonb_typeof(p_guard) is distinct from 'object' then return false; end if;
 if p_guard->>'kind'='resource_balance' then
  return (select count(*) from jsonb_object_keys(p_guard))=4 and p_guard ?& array['kind','resourceKey','operator','value']
   and jsonb_typeof(p_guard->'resourceKey')='string' and p_guard->>'resourceKey' ~ '^resource-[1-9][0-9]*$'
   and jsonb_typeof(p_guard->'operator')='string' and p_guard->>'operator' in ('lte','gte')
   and jsonb_typeof(p_guard->'value')='number' and abs((p_guard->>'value')::numeric)<=1.7976931348623157e308;
 elsif p_guard->>'kind'='environment_equals' then
  return (select count(*) from jsonb_object_keys(p_guard))=3 and p_guard ?& array['kind','variableKey','value']
   and jsonb_typeof(p_guard->'variableKey')='string' and p_guard->>'variableKey' ~ '^(pressure|external-variable)-[1-8]$'
   and jsonb_typeof(p_guard->'value')='string' and public.digital_life_model_draft_text_valid_v1(p_guard->>'value',240);
 end if;
 return false;
exception when others then return false;
end; $$;

create function public.formal_world_guard_description_v3(p_guard jsonb,p_source jsonb)
returns text language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare item jsonb;
begin
 if p_guard->>'kind'='resource_balance' then
  item:=p_source#>array['reality_profiles','world_model_inputs','resources',((substring(p_guard->>'resourceKey' from 10))::integer-1)::text];
  return (item->>'label')||'余额'||case when p_guard->>'operator'='lte' then '不高于' else '不低于' end||public.formal_relationship_canonical_json_v1(p_guard->'value')||(item->>'unit');
 end if;
 select value into item from jsonb_array_elements(public.digital_life_model_draft_safe_context_v2(p_source)#>'{modelContext,variables}') where value->'key'=p_guard->'variableKey';
 return (item->>'label')||'等于“'||(p_guard->>'value')||'”';
exception when others then return null;
end; $$;
create function public.formal_world_guard_satisfied_v3(p_guard jsonb,p_world jsonb,p_source jsonb,p_namespace text,p_actor_id text)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare declared jsonb; current_value jsonb; core_id text; raw_key text;
begin
 if public.formal_world_guard_shape_valid_v3(p_guard) is not true then return false; end if;
 if p_guard->>'kind'='resource_balance' then
  declared:=p_source#>array['reality_profiles','world_model_inputs','resources',((substring(p_guard->>'resourceKey' from 10))::integer-1)::text];
  core_id:=public.formal_planning_core_id_v1('world_resource',p_namespace,declared->>'key');
  select value into current_value from jsonb_array_elements(p_world->'resources') where value->>'id'=core_id and value->>'controllerAgentId'=p_actor_id;
  if current_value is null then return false; end if;
  return case when p_guard->>'operator'='lte' then (current_value->>'available')::double precision<=(p_guard->>'value')::double precision
   else (current_value->>'available')::double precision>=(p_guard->>'value')::double precision end;
 end if;
 raw_key:=case when p_guard->>'variableKey' like 'pressure-%' then 'pressures.'||substring(p_guard->>'variableKey' from 10) else 'externalVariables.'||substring(p_guard->>'variableKey' from 19) end;
 core_id:=public.formal_environment_core_variable_id_v2(p_namespace,raw_key);
 select value into current_value from jsonb_array_elements(p_world->'externalVariables') where value->>'id'=core_id;
 return current_value is not null and current_value->'value'=p_guard->'value';
exception when others then return false;
end; $$;

-- Replay the real step ledger, never the display ledger's event ordinal tickIndex.
-- Delta.before must equal the previously folded World; Delta.after is rebuilt
-- from its typed operation before comparison with the supplied Event and World.
create function public.formal_world_guard_trajectory_valid_v3(p_initial jsonb,p_trajectory jsonb,p_source jsonb,p_rules jsonb,p_path text,p_namespace text,p_sample_namespace text,p_start timestamptz,p_horizon integer)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare current_world jsonb:=p_initial; final_world jsonb:=p_trajectory->'finalWorld'; frame jsonb; step jsonb; event jsonb; delta jsonb; rule jsonb; state jsonb; next_state jsonb; resource jsonb; declared jsonb; variable jsonb; spec jsonb; actor jsonb; prior jsonb; relation jsonb; commitment jsonb; expected jsonb;
 core_key text; self_key text; self_id text; self_entity text; actor_id text; target_id text; field text; raw_key text; item_index integer; step_index integer; event_index integer:=0; ticks integer:=case when p_horizon=30 then 3 else 6 end; expected_time timestamptz; before_amount double precision; after_amount double precision; terminated boolean:=false;
 observed jsonb; expected_real jsonb; expected_assumptions jsonb; expected_prior jsonb; actor_source jsonb; actor_evidence jsonb; rule_assumption jsonb; last_change jsonb; target_path text; candidate_ids jsonb; rng_raw bigint;
begin
 if p_horizon is null or p_horizon not in (30,90) or p_rules->>'version' is distinct from 'digital-life-rules-v3'
  or public.formal_world_guard_initial_authority_v3(p_initial,p_source,p_rules,p_path,p_namespace,p_start,p_horizon) is not true
  or jsonb_typeof(p_initial) is distinct from 'object' or p_initial->'revision' is distinct from '0'::jsonb
  or p_initial->'worldEvents' is distinct from '[]'::jsonb or p_initial->'worldEventIds' is distinct from '[]'::jsonb or p_initial->'appliedTransitionCommandIds' is distinct from '[]'::jsonb
  or p_initial->'seedContextId' is distinct from p_source#>'{relation_graph_snapshots,seed_context_id}'
  or (p_initial->>'createdAt')::timestamptz is distinct from p_start or (p_initial->>'updatedAt')::timestamptz is distinct from p_start
  or p_trajectory->'initialWorldId' is distinct from p_initial->'id' or p_trajectory->'initialWorldRevision' is distinct from '0'::jsonb
  or p_trajectory->>'policyVersion' is distinct from 'digital-life-adapter-v3'
  or p_trajectory->'seedContextId' is distinct from p_initial->'seedContextId' or p_trajectory->'horizonDays' is distinct from to_jsonb(p_horizon)
  or p_trajectory->'agentWorldEngineVersion' is distinct from p_initial->'engineVersion'
  or (p_trajectory->>'startedAt')::timestamptz is distinct from p_start
  or jsonb_typeof(p_trajectory->'steps') is distinct from 'array' or jsonb_array_length(p_trajectory->'steps') not between 1 and ticks
  or jsonb_typeof(final_world->'worldEvents') is distinct from 'array' then return false; end if;
 select 'person-'||ord::text into core_key from jsonb_array_elements(p_source->'agent_profiles') with ordinality t(a,ord) where a->>'agent_type'='user_core';
 self_key:=case when p_path='main' then core_key else p_path end;
 select value into actor from jsonb_array_elements(p_source->'agent_profiles') with ordinality t(value,ord) where 'person-'||ord::text=self_key and value->>'agent_type' in ('user_core','user_variant');
 self_id:=public.formal_planning_core_id_v1('agent_definition',p_namespace,actor->>'id'); self_entity:=public.formal_planning_core_id_v1('world_entity',p_namespace,actor->>'id');
 if self_id is null or (p_path<>'main' and not exists(select 1 from jsonb_array_elements(p_rules->'strategies') s where s->>'participantKey'=p_path)) then return false; end if;
 if not exists(select 1 from jsonb_array_elements(p_initial->'agentDefinitions') a where a->>'id'=self_id and a->>'actorType'='self')
  or not exists(select 1 from jsonb_array_elements(p_initial->'entities') e where e->>'id'=self_entity and e->>'agentDefinitionId'=self_id) then return false; end if;
 frame:=jsonb_build_object('authorization',jsonb_build_object('pathKey',p_path),'effectiveRulesSignature',p_rules::text,'ruleBindings',jsonb_build_object(
  'agents',(select jsonb_agg(jsonb_build_object('key','person-'||ord::text,'sourceOrdinal',ord,'sourceAgentId',a->'id','role',a->'agent_type') order by ord) from jsonb_array_elements(p_source->'agent_profiles') with ordinality t(a,ord)),
  'relations',(select jsonb_agg(jsonb_build_object('key','relation-'||ord::text,'sourceEdgeId',a->'id') order by ord) from jsonb_array_elements(p_source->'relation_edges') with ordinality t(a,ord)),
  'resources',coalesce((select jsonb_agg(jsonb_build_object('key','resource-'||ord::text,'profileResourceKey',a->'key') order by ord) from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,resources}','[]')) with ordinality t(a,ord)),'[]')));
 if jsonb_array_length(p_initial->'resources')<>jsonb_array_length(coalesce(p_source#>'{reality_profiles,world_model_inputs,resources}','[]')) then return false; end if;
 for declared in select value from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,resources}','[]')) loop
  target_id:=public.formal_planning_core_id_v1('world_resource',p_namespace,declared->>'key');
  select value into resource from jsonb_array_elements(p_initial->'resources') where value->>'id'=target_id;
  if resource is null or resource->'available' is distinct from declared->'available' or resource->'min' is distinct from declared->'minimum' or resource->'max' is distinct from declared->'maximum'
   or resource->'resourceType' is distinct from declared->'resourceType' or resource->'unit' is distinct from declared->'unit' or resource->'label' is distinct from declared->'label'
   or resource->>'controllerAgentId' is distinct from self_id or resource->>'ownerEntityId' is distinct from self_entity then return false; end if;
  expected_real:='[]'; expected_assumptions:='[]';
  if declared->>'classification'='fact' then
   select value into actor_evidence from jsonb_array_elements(p_initial#>'{realityBoundarySnapshot,evidenceLedger,items}') where value->>'claimKey'='reality.profile.world_resource.'||(declared->>'key');
   if actor_evidence is null or actor_evidence->>'sourceKind' is distinct from 'user_statement' or actor_evidence->>'verificationStatus' is distinct from 'user_confirmed'
    or actor_evidence->>'statement' is distinct from (declared->>'label')||'：'||public.formal_relationship_canonical_json_v1(declared->'available')||' '||(declared->>'unit')||'（范围 '||public.formal_relationship_canonical_json_v1(declared->'minimum')||'–'||public.formal_relationship_canonical_json_v1(declared->'maximum')||' '||(declared->>'unit')||'）'
    or not exists(select 1 from jsonb_array_elements(actor_evidence->'provenance') p where p->>'sourceRef'='reality_profile:'||coalesce(p_source#>>'{reality_profiles,id}','absent')||':revision:'||coalesce(p_source#>>'{reality_profiles,revision}','0')||':world_resource:'||(declared->>'key') and (p->>'capturedAt')::timestamptz=(p_initial#>>'{realityBoundarySnapshot,updatedAt}')::timestamptz)
    or not actor_evidence->'limitations' @> jsonb_build_array('User-supplied basis: '||(declared->>'evidenceSummary')) then return false; end if;
   expected_real:=jsonb_build_array(actor_evidence->'id');
  elsif declared->>'classification'='assumption' then
   select value into rule_assumption from jsonb_array_elements(p_initial#>'{realityBoundarySnapshot,assumptionLedger,assumptions}') where value->>'category'='reality_profile_world_resource_'||(declared->>'key');
   if rule_assumption is null or rule_assumption->>'subjectType' is distinct from 'self' or rule_assumption->>'confirmationStatus' is distinct from 'confirmed' or rule_assumption->>'epistemicStatus' is distinct from 'confirmed_for_simulation'
    or rule_assumption->>'statement' is distinct from '模拟假设：'||(declared->>'label')||' 从 '||public.formal_relationship_canonical_json_v1(declared->'available')||' '||(declared->>'unit')||' 开始。'
    or rule_assumption->'supportingRealEvidenceIds' is distinct from '[]'::jsonb or rule_assumption->'contradictingRealEvidenceIds' is distinct from '[]'::jsonb
    or not rule_assumption->'limitations' @> jsonb_build_array('User designated this resource value as a simulation assumption: '||(declared->>'evidenceSummary')) then return false; end if;
   expected_assumptions:=jsonb_build_array(rule_assumption->'id');
  else return false;
  end if;
  if jsonb_typeof(declared->'usePerTick')='number' then
   select value into rule_assumption from jsonb_array_elements(p_initial#>'{realityBoundarySnapshot,assumptionLedger,assumptions}') where value->>'category'='reality_profile_world_rate_'||(declared->>'key');
   if rule_assumption is null or rule_assumption->>'subjectType' is distinct from 'self' or rule_assumption->>'confirmationStatus' is distinct from 'confirmed' or rule_assumption->>'epistemicStatus' is distinct from 'confirmed_for_simulation'
    or rule_assumption->>'statement' is distinct from '模拟规则：当行动被选中时，从“'||(declared->>'label')||'”分配 '||public.formal_relationship_canonical_json_v1(declared->'usePerTick')||' '||(declared->>'unit')||'。' then return false; end if;
   expected_assumptions:=expected_assumptions||jsonb_build_array(rule_assumption->'id');
  end if;
  if resource#>'{provenance,realEvidenceIds}' is distinct from expected_real or resource#>'{provenance,assumptionIds}' is distinct from expected_assumptions
   or resource#>'{provenance,visible}' is distinct from 'true'::jsonb or resource#>'{provenance,provisional}' is distinct from to_jsonb(jsonb_array_length(expected_assumptions)>0) then return false; end if;
 end loop;
 for spec in select value from jsonb_array_elements(public.digital_life_model_draft_safe_context_v2(p_source)#>'{modelContext,variables}') loop
  raw_key:=case when spec->>'category'='pressure' then 'pressures.'||substring(spec->>'key' from 10) else 'externalVariables.'||substring(spec->>'key' from 19) end;
  target_id:=public.formal_environment_core_variable_id_v2(p_namespace,raw_key);
  select value into variable from jsonb_array_elements(p_initial->'externalVariables') where value->>'id'=target_id;
  if variable is null or variable->'value' is distinct from spec->'value' then return false; end if;
 end loop;
 for state in select value from jsonb_array_elements(p_initial->'agentStates') loop
  if state->'revision' is distinct from '0'::jsonb or state->>'observableStatus' is distinct from 'available'
   or state->'observations' is distinct from '[]'::jsonb or state->'memory' is distinct from '[]'::jsonb or state->'lastActionReference' is distinct from 'null'::jsonb
   or (state->>'updatedAt')::timestamptz is distinct from p_start then return false; end if;
 end loop;
 for step,step_index in select value,ord::integer-1 from jsonb_array_elements(p_trajectory->'steps') with ordinality t(value,ord) loop
  expected_time:=p_start+step_index*(case when ticks=3 then 10 else 15 end)*interval '1 day';
  if jsonb_typeof(step) is distinct from 'object' or step->'tickIndex' is distinct from to_jsonb(step_index) or (step->>'occurredAt')::timestamptz is distinct from expected_time
   or step->'beforeRevision' is distinct from current_world->'revision' or step ? 'error' then return false; end if;
  if step ? 'termination' then
   if step->'termination' is distinct from '{"reason":"no_actions"}'::jsonb or step ?| array['proposalId','commandId','worldEventId','selectedCandidateIndex','rngAudit']
    or step->'afterRevision' is distinct from current_world->'revision' or step_index<>jsonb_array_length(p_trajectory->'steps')-1 or p_trajectory->>'status' is distinct from 'no_actions' then return false; end if;
   if public.formal_world_guard_has_candidates_v3(current_world,p_source,p_rules,p_path,p_namespace,step_index,expected_time,p_horizon) is distinct from false then return false; end if;
   terminated:=true; exit;
  end if;
  event:=final_world->'worldEvents'->event_index;
  candidate_ids:=public.formal_world_guard_candidate_ids_v3(current_world,p_source,p_rules,p_path,p_namespace,step_index,expected_time,p_horizon,p_sample_namespace);
  rng_raw:=public.formal_world_guard_rng_raw_v3((p_trajectory->>'trajectorySeed')::bigint,step_index);
  if candidate_ids is null or jsonb_array_length(candidate_ids)=0 or rng_raw is null then return false; end if;
  if step->'proposalId' is distinct from candidate_ids->(mod(rng_raw,jsonb_array_length(candidate_ids))::integer)
   or step->'selectedCandidateIndex' is distinct from to_jsonb(mod(rng_raw,jsonb_array_length(candidate_ids)))
   or step#>'{rngAudit,rawValue}' is distinct from to_jsonb(rng_raw) or step#>'{rngAudit,drawIndex}' is distinct from to_jsonb(step_index)
   or step#>>'{rngAudit,algorithm}' is distinct from 'mulberry32' or step#>>'{rngAudit,version}' is distinct from '1' then return false; end if;
  if event is null or step->'worldEventId' is distinct from event->'id' or step->'commandId' is distinct from event->'commandId' or step->'proposalId' is distinct from event->'proposalId'
   or step->'afterRevision' is distinct from to_jsonb((current_world->>'revision')::integer+1) or event->'beforeRevision' is distinct from step->'beforeRevision' or event->'afterRevision' is distinct from step->'afterRevision'
   or event->'seedContextId' is distinct from current_world->'seedContextId' or event->'engineVersion' is distinct from current_world->'engineVersion'
   or event->>'evidenceClass' is distinct from 'world_transition_simulation_evidence' or event->'eventType' is distinct from event#>'{operation,actionType}'
   or (event->>'createdAt')::timestamptz is distinct from expected_time or (event->>'commandCreatedAt')::timestamptz is distinct from expected_time
   or jsonb_array_length(event->'deltas')<>1 or current_world->'worldEventIds' @> jsonb_build_array(event->'id') or current_world->'appliedTransitionCommandIds' @> jsonb_build_array(event->'commandId')
   or jsonb_typeof(step->'selectedCandidateIndex') is distinct from 'number' or (step->>'selectedCandidateIndex')::numeric<>trunc((step->>'selectedCandidateIndex')::numeric) or (step->>'selectedCandidateIndex')::numeric<0
   or step#>'{rngAudit,selectedIndex}' is distinct from step->'selectedCandidateIndex' or step#>'{rngAudit,seed}' is distinct from p_trajectory->'trajectorySeed' then return false; end if;
  if exists(select 1 from jsonb_array_elements(event->'causalRealEvidenceIds') r where not exists(select 1 from jsonb_array_elements(current_world#>'{realityBoundarySnapshot,evidenceLedger,items}') e where e->'id'=r))
   or exists(select 1 from jsonb_array_elements(event->'causalAssumptionIds') r where not exists(select 1 from jsonb_array_elements(current_world#>'{realityBoundarySnapshot,assumptionLedger,assumptions}') a where a->'id'=r and a->>'confirmationStatus'='confirmed' and a->>'epistemicStatus'='confirmed_for_simulation'))
   or exists(select 1 from jsonb_array_elements(event->'priorWorldEventIds') r where not current_world->'worldEventIds' @> jsonb_build_array(r)) then return false; end if;
  select value into rule from jsonb_array_elements(p_rules->'actions') where value->>'pathKey'=p_path and event->>'proposalId'='action_proposal_v2_'||p_sample_namespace||'_'||step_index::text||'_'||(value->>'key');
  if rule is not null then
   if public.formal_relationship_rule_event_valid_v1(rule,frame,final_world,p_sample_namespace,p_namespace,p_start,ticks) is not true
    or (rule ? 'guard' and public.formal_world_guard_satisfied_v3(rule->'guard',current_world,p_source,p_namespace,event->>'actorId') is not true) then return false; end if;
   if rule ? 'guard' then
    select value into actor_source from jsonb_array_elements(frame#>'{ruleBindings,agents}') where value->'key'=rule->'actorKey';
    select value into actor_evidence from jsonb_array_elements(current_world#>'{realityBoundarySnapshot,evidenceLedger,items}') where value->>'claimKey'='formal.agent.'||(actor_source->>'sourceOrdinal');
    select value into rule_assumption from jsonb_array_elements(current_world#>'{realityBoundarySnapshot,assumptionLedger,assumptions}') where value->>'category'='digital_life_rule_'||(rule->>'key');
    if rule_assumption->>'statement' is distinct from '用户确认的条件模拟规则：'||(rule#>>'{operation,actionType}')||'。触发条件：'||public.formal_world_guard_description_v3(rule->'guard',p_source)||'。依据：'||(rule->>'evidenceSummary') then return false; end if;
    if rule#>>'{guard,kind}'='resource_balance' then
     declared:=p_source#>array['reality_profiles','world_model_inputs','resources',((substring(rule#>>'{guard,resourceKey}' from 10))::integer-1)::text];
     target_id:=public.formal_planning_core_id_v1('world_resource',p_namespace,declared->>'key');
     select value into observed from jsonb_array_elements(current_world->'resources') where value->>'id'=target_id;
     target_path:='resources.'||target_id||'.available';
    else
     raw_key:=case when rule#>>'{guard,variableKey}' like 'pressure-%' then 'pressures.'||substring(rule#>>'{guard,variableKey}' from 10) else 'externalVariables.'||substring(rule#>>'{guard,variableKey}' from 19) end;
     target_id:=public.formal_environment_core_variable_id_v2(p_namespace,raw_key);
     select value into observed from jsonb_array_elements(current_world->'externalVariables') where value->>'id'=target_id;
     target_path:='externalVariables.'||target_id||'.value';
    end if;
    expected_real:=public.formal_world_guard_unique_ids_v3(jsonb_build_array(actor_evidence->'id')||(observed#>'{provenance,realEvidenceIds}'));
    expected_assumptions:=public.formal_world_guard_unique_ids_v3(jsonb_build_array(rule_assumption->'id')||(observed#>'{provenance,assumptionIds}'));
    expected_prior:='[]';
    if rule#>>'{when,kind}'='after_rule' then
     select value into prior from jsonb_array_elements(current_world->'worldEvents') where value->>'proposalId' ~ ('_'||(rule#>>'{when,ruleKey}')||'$');
     if prior is null then return false; end if;
     expected_prior:=jsonb_build_array(prior->'id');
    end if;
    select value into last_change from jsonb_array_elements(current_world->'worldEvents') with ordinality t(value,ord) where exists(select 1 from jsonb_array_elements(value->'deltas') d where d->>'path'=target_path) order by ord desc limit 1;
    if last_change is not null then expected_prior:=public.formal_world_guard_unique_ids_v3(expected_prior||jsonb_build_array(last_change->'id')); end if;
    if event->'causalRealEvidenceIds' is distinct from expected_real or event->'causalAssumptionIds' is distinct from expected_assumptions or event->'priorWorldEventIds' is distinct from expected_prior then return false; end if;
   end if;
  elsif event->>'proposalId' ~ '_rule-[1-9][0-9]*$' then return false;
  elsif event->>'proposalId' not like 'action_proposal_v2_formal_planning_%' then
   select value into declared from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,resources}','[]')) where event->>'proposalId'='action_proposal_v2_'||p_sample_namespace||'_'||step_index::text||'_'||(value->>'key');
   target_id:=public.formal_planning_core_id_v1('world_resource',p_namespace,declared->>'key');
   select value into resource from jsonb_array_elements(current_world->'resources') where value->>'id'=target_id;
   select value into actor_evidence from jsonb_array_elements(current_world#>'{realityBoundarySnapshot,evidenceLedger,items}') where value->>'claimKey'='formal.seed.summary';
   select value into rule_assumption from jsonb_array_elements(current_world#>'{realityBoundarySnapshot,assumptionLedger,assumptions}') where value->>'category'='reality_profile_world_rate_'||(declared->>'key');
   if declared is null or jsonb_typeof(declared->'usePerTick') is distinct from 'number' or resource is null or actor_evidence is null or rule_assumption is null
    or event->>'actorId' is distinct from self_id or event->'operation' is distinct from jsonb_build_object('actionType','allocate_resource','resourceId',target_id,'amount',declared->'usePerTick')
    or event->'targetEntityIds' is distinct from jsonb_build_array(self_entity) or event->'targetResourceIds' is distinct from jsonb_build_array(target_id)
    or event->'targetRelationIds' is distinct from '[]'::jsonb or event->'targetVariableIds' is distinct from '[]'::jsonb
    or event->'causalRealEvidenceIds' is distinct from public.formal_world_guard_unique_ids_v3((resource#>'{provenance,realEvidenceIds}')||jsonb_build_array(actor_evidence->'id'))
    or event->'causalAssumptionIds' is distinct from public.formal_world_guard_unique_ids_v3((resource#>'{provenance,assumptionIds}')||jsonb_build_array(rule_assumption->'id'))
    or event->'priorWorldEventIds' is distinct from current_world->'worldEventIds' then return false; end if;
  end if;
  delta:=event->'deltas'->0; actor_id:=event->>'actorId';
  if not exists(select 1 from jsonb_array_elements(current_world->'agentDefinitions') a where a->>'id'=actor_id) then return false; end if;
  if event->>'eventType'='allocate_resource' then
   target_id:=event#>>'{operation,resourceId}';
   select value,ord::integer-1 into resource,item_index from jsonb_array_elements(current_world->'resources') with ordinality t(value,ord) where value->>'id'=target_id;
   before_amount:=(resource->>'available')::double precision; after_amount:=before_amount-(event#>>'{operation,amount}')::double precision;
   if resource is null or actor_id is distinct from resource->>'controllerAgentId' or (event#>>'{operation,amount}')::double precision<=0 or after_amount<(resource->>'min')::double precision or after_amount>(resource->>'max')::double precision
    or delta is distinct from jsonb_build_object('path','resources.'||target_id||'.available','valueType','resource','before',resource->'available','after',after_amount) then return false; end if;
   current_world:=jsonb_set(current_world,array['resources',item_index::text,'available'],to_jsonb(after_amount));
  elsif event->>'eventType'='update_external_variable' then
   target_id:=event#>>'{operation,variableId}';
   select value,ord::integer-1 into variable,item_index from jsonb_array_elements(current_world->'externalVariables') with ordinality t(value,ord) where value->>'id'=target_id;
   if variable is null or variable->>'variableType' is distinct from 'enum' or not variable->'allowedValues' @> jsonb_build_array(event#>'{operation,value}')
    or delta is distinct from jsonb_build_object('path','externalVariables.'||target_id||'.value','valueType','variable','before',variable->'value','after',event#>'{operation,value}') then return false; end if;
   current_world:=jsonb_set(current_world,array['externalVariables',item_index::text,'value'],event#>'{operation,value}');
  elsif event->>'eventType'='update_relation_signal' then
   target_id:=event#>>'{operation,relationId}';
   select value,ord::integer-1 into relation,item_index from jsonb_array_elements(current_world->'relations') with ordinality t(value,ord) where value->>'id'=target_id;
   if relation is null or delta is distinct from jsonb_build_object('path','relations.'||target_id||'.signal','valueType','relation','before',relation->'signal','after',event#>'{operation,signal}') then return false; end if;
   current_world:=jsonb_set(current_world,array['relations',item_index::text,'signal'],event#>'{operation,signal}');
  elsif event->>'eventType' in ('request_information','update_commitment') then
   select value,ord::integer-1 into state,item_index from jsonb_array_elements(current_world->'agentStates') with ordinality t(value,ord) where value->>'agentDefinitionId'=actor_id;
   if state is null then return false; end if;
   next_state:=state;
   if event->>'eventType'='request_information' then
    next_state:=jsonb_set(jsonb_set(next_state,'{observableStatus}','"awaiting_information"'),'{commitments}',state->'commitments'||jsonb_build_array(jsonb_build_object('id','request_'||(event->>'id'),'label',event#>'{operation,question}','status','active')));
    field:='observableStatus';
   else
    commitment:=jsonb_build_object('id',event#>'{operation,commitmentId}','label',event#>'{operation,label}','status',event#>'{operation,status}');
    select coalesce(jsonb_agg(case when value->'id'=commitment->'id' then commitment else value end order by ord),'[]') into expected from jsonb_array_elements(state->'commitments') with ordinality t(value,ord);
    if not exists(select 1 from jsonb_array_elements(state->'commitments') c where c->'id'=commitment->'id') then expected:=expected||jsonb_build_array(commitment); end if;
    next_state:=jsonb_set(next_state,'{commitments}',expected);
    if event#>>'{operation,status}'='active' then next_state:=jsonb_set(next_state,'{observableStatus}','"committed"'); end if;
    field:='commitments';
   end if;
   next_state:=next_state||jsonb_build_object('revision',(state->>'revision')::integer+1,'lastActionReference',jsonb_build_object('referenceType','world_event','worldEventId',event->'id'),'updatedAt',event->'createdAt');
   if delta is distinct from jsonb_build_object('path','agentStates.'||actor_id||'.'||field,'valueType','agent_state','before',state,'after',next_state) then return false; end if;
   current_world:=jsonb_set(current_world,array['agentStates',item_index::text],next_state);
  else return false;
  end if;
  current_world:=current_world||jsonb_build_object('revision',event->'afterRevision','updatedAt',event->'createdAt','worldEvents',current_world->'worldEvents'||jsonb_build_array(event),'worldEventIds',current_world->'worldEventIds'||jsonb_build_array(event->'id'),'appliedTransitionCommandIds',current_world->'appliedTransitionCommandIds'||jsonb_build_array(event->'commandId'));
  event_index:=event_index+1;
 end loop;
 if not terminated and (p_trajectory->>'status' is distinct from 'completed' or jsonb_array_length(p_trajectory->'steps')<>ticks) then return false; end if;
 return event_index=jsonb_array_length(final_world->'worldEvents') and current_world=final_world
  and (p_trajectory->>'completedAt')::timestamptz=expected_time;
exception when others then return false;
end; $$;

-- A legacy projection is used only for the unchanged non-guard baseline.
-- Guard shape, source semantics and selected-step truth are checked independently.
create function public.formal_world_guard_legacy_rules_v3(p_rules jsonb)
returns jsonb language sql immutable security invoker set search_path=public,pg_temp as $$
 select jsonb_set(jsonb_set(p_rules,'{version}','"digital-life-rules-v2"'),'{actions}',
 coalesce((select jsonb_agg(a-'guard' order by ord) from jsonb_array_elements(p_rules->'actions') with ordinality t(a,ord)),'[]'::jsonb));
$$;
alter function public.formal_run_rules_valid(jsonb) rename to formal_run_rules_valid_before_world_guards_v3;
create function public.formal_run_rules_valid(p_rules jsonb)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare action jsonb;
begin
 if p_rules->>'version' is distinct from 'digital-life-rules-v3' then return public.formal_run_rules_valid_before_world_guards_v3(p_rules); end if;
 if public.formal_run_rules_valid_before_world_guards_v3(public.formal_world_guard_legacy_rules_v3(p_rules)) is not true then return false; end if;
 for action in select value from jsonb_array_elements(p_rules->'actions') loop
  if action ? 'guard' and public.formal_world_guard_shape_valid_v3(action->'guard') is not true then return false; end if;
 end loop;
 return true;
exception when others then return false;
end; $$;

create function public.formal_world_guard_rules_valid_v3(p_source jsonb,p_rules jsonb,p_horizon integer)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare context jsonb:=public.digital_life_model_draft_safe_context_v2(p_source)->'modelContext'; action jsonb; guard jsonb; resource jsonb; variable jsonb; core_key text; self_key text;
begin
 if p_rules->>'version' is distinct from 'digital-life-rules-v3' or public.formal_run_rules_valid(p_rules) is not true
  or public.formal_environment_rules_valid_v2(p_source,public.formal_world_guard_legacy_rules_v3(p_rules),p_horizon) is not true then return false; end if;
 select value->>'key' into core_key from jsonb_array_elements(context->'agents') where value->>'role'='user_core';
 for action in select value from jsonb_array_elements(p_rules->'actions') where value ? 'guard' loop
  guard:=action->'guard'; self_key:=case when action->>'pathKey'='main' then core_key else action->>'pathKey' end;
  if self_key is null or action->>'actorKey' is distinct from self_key
   or not exists(select 1 from jsonb_array_elements(context->'agents') a where a->>'key'=self_key and a->>'role' in ('user_core','user_variant')) then return false; end if;
  if guard->>'kind'='resource_balance' then
   select value into resource from jsonb_array_elements(context->'resources') where value->'key'=guard->'resourceKey';
   if resource is null or (guard->>'value')::double precision<(resource->>'minimum')::double precision
    or (guard->>'value')::double precision>(resource->>'maximum')::double precision then return false; end if;
  else
   select value into variable from jsonb_array_elements(context->'variables') where value->'key'=guard->'variableKey';
   if variable is null or (variable->'value' is distinct from guard->'value' and not exists(
    select 1 from jsonb_array_elements(p_rules->'actions') a where a->'pathKey'=action->'pathKey'
     and a#>>'{operation,actionType}'='update_external_variable' and a#>'{operation,variableKey}'=guard->'variableKey' and a#>'{operation,value}'=guard->'value')) then return false; end if;
  end if;
 end loop;
 return true;
exception when others then return false;
end; $$;

create function public.digital_life_draft_confirmed_shape_v3(p_rules jsonb)
returns jsonb language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare baseline jsonb; result jsonb; action jsonb; actions jsonb:='[]';
begin
 if p_rules->>'version' is distinct from 'digital-life-rules-v3' then return null; end if;
 baseline:=public.digital_life_draft_confirmed_shape_v2(public.formal_world_guard_legacy_rules_v3(p_rules));
 if baseline is null then return null; end if;
 for action in select value from jsonb_array_elements(p_rules->'actions') loop
  if action ? 'guard' and public.formal_world_guard_shape_valid_v3(action->'guard') is not true then return null; end if;
  actions:=actions||jsonb_build_array(jsonb_set(action,'{confirmedForSimulation}','true'));
 end loop;
 result:=baseline||jsonb_build_object('version','digital-life-rules-v3','actions',actions);
 if public.formal_run_rules_valid(result) is not true then return null; end if;
 return result;
exception when others then return null;
end; $$;

create function public.digital_life_model_draft_request_valid_v3(p_request jsonb)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare baseline jsonb;
begin
 if p_request->>'version' is distinct from 'digital-life-model-draft-v3' or p_request#>>'{draftRules,version}' is distinct from 'digital-life-rules-v3'
  or public.digital_life_model_draft_context_valid_v2(p_request->'sourceContext') is not true
  or public.digital_life_draft_confirmed_shape_v3(p_request->'draftRules') is null then return false; end if;
 baseline:=jsonb_set(jsonb_set(p_request,'{version}','"digital-life-model-draft-v2"'),'{draftRules}',public.formal_world_guard_legacy_rules_v3(p_request->'draftRules'));
 return public.digital_life_model_draft_request_valid_v2(baseline);
exception when others then return false;
end; $$;

create or replace function public.digital_life_model_draft_rules_shape_valid_v2(p_rules jsonb)
returns boolean language sql immutable security invoker set search_path=public,pg_temp as $$
 select case when p_rules->>'version'='digital-life-rules-v3' then public.digital_life_draft_confirmed_shape_v3(p_rules) is not null
  when p_rules->>'version'='digital-life-rules-v2' then public.digital_life_draft_confirmed_shape_v2(p_rules) is not null
  else public.digital_life_draft_confirmed_shape_v1(p_rules) is not null end;
$$;

-- Existing transactional guards retain owner locks, strict CAS and receipt-first replay.
create or replace function public.digital_life_model_draft_guard_v1()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid(); source jsonb; latest_revision bigint; body jsonb:=new.request;
begin
 if tg_op<>'INSERT' then raise exception using errcode='42501',message='model_draft_immutable'; end if;
 if owner_id is null or owner_id is distinct from new.user_id or coalesce(auth.jwt()->>'is_anonymous','false')='true'
  or current_setting('app.digital_life_model_draft_rpc',true) is distinct from 'on' then raise exception using errcode='42501',message='unauthenticated'; end if;
 perform pg_advisory_xact_lock(hashtextextended(owner_id::text||':digital-life-model-draft-v1',0));
 if (case when body->>'version'='digital-life-model-draft-v3' then public.digital_life_model_draft_request_valid_v3(body) when body->>'version'='digital-life-model-draft-v2' then public.digital_life_model_draft_request_valid_v2(body) else body#>>'{draftRules,version}'='digital-life-rules-v1' and public.digital_life_model_draft_request_valid_v1(body) end) is not true
  or (body->>'expectedRevision')::numeric<>new.parent_revision
  or (body->>'idempotencyKey')::uuid is distinct from new.idempotency_key
  or jsonb_typeof(body->'horizonDays') is distinct from 'number' or body->'horizonDays' not in ('30'::jsonb,'90'::jsonb)
  or jsonb_typeof(body->'sourceContext') is distinct from 'object'
  or body#>>'{sourceContext,signature}' is distinct from new.source_signature then raise exception using errcode='P0001',message='invalid_request'; end if;
 select coalesce(max(revision),0) into latest_revision from public.digital_life_model_drafts where user_id=owner_id;
 if new.parent_revision<>latest_revision or new.revision<>latest_revision+1 then raise exception using errcode='P0001',message='revision_conflict'; end if;
 source:=case when body->>'version' in ('digital-life-model-draft-v2','digital-life-model-draft-v3') then public.digital_life_model_draft_source_v2() else public.digital_life_model_draft_source_v1() end;
 if source is null or body->'sourceContext' is distinct from case when body->>'version' in ('digital-life-model-draft-v2','digital-life-model-draft-v3') then public.digital_life_model_draft_safe_context_v2(source) else public.digital_life_model_draft_safe_context_v1(source) end
  or new.seed_context_id::text is distinct from source#>>'{seed_contexts,id}' then raise exception using errcode='P0001',message='model_source_stale'; end if;
 if (case when body->>'version'='digital-life-model-draft-v3' then public.formal_world_guard_rules_valid_v3(source,public.digital_life_draft_confirmed_shape_v3(body->'draftRules'),(body->>'horizonDays')::integer) when body->>'version'='digital-life-model-draft-v2' then public.formal_environment_rules_valid_v2(source,public.digital_life_draft_confirmed_shape_v2(body->'draftRules'),(body->>'horizonDays')::integer) else public.digital_life_model_draft_rules_valid_v1(source,body->'draftRules',(body->>'horizonDays')::integer) end) is not true then raise exception using errcode='P0001',message='invalid_request'; end if;
 return new;
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
 if (case when p_request->>'version'='digital-life-model-draft-v3' then public.digital_life_model_draft_request_valid_v3(p_request) when p_request->>'version'='digital-life-model-draft-v2' then public.digital_life_model_draft_request_valid_v2(p_request) else p_request#>>'{draftRules,version}'='digital-life-rules-v1' and public.digital_life_model_draft_request_valid_v1(p_request) end) is not true then raise exception using errcode='P0001',message='invalid_request'; end if;
 if jsonb_typeof(p_request->'expectedRevision') is distinct from 'number' then raise exception using errcode='P0001',message='invalid_request'; end if;
 begin
  if (p_request->>'expectedRevision')::numeric<>trunc((p_request->>'expectedRevision')::numeric) or (p_request->>'expectedRevision')::numeric not between 0 and 9007199254740990 then raise exception 'invalid'; end if;
  expected:=(p_request->>'expectedRevision')::bigint;
 exception when others then raise exception using errcode='P0001',message='invalid_request'; end;
 -- The INSERT trigger captures and validates the complete source in its own single atomic snapshot.
 source:=case when p_request->>'version' in ('digital-life-model-draft-v2','digital-life-model-draft-v3') then public.digital_life_model_draft_source_v2() else public.digital_life_model_draft_source_v1() end;
 if source is null then raise exception using errcode='P0001',message='model_source_stale'; end if;
 perform set_config('app.digital_life_model_draft_rpc','on',true);
 insert into public.digital_life_model_drafts(user_id,revision,parent_revision,seed_context_id,idempotency_key,source_signature,request)
 values(owner_id,expected+1,expected,(source#>>'{seed_contexts,id}')::uuid,request_key,p_request#>>'{sourceContext,signature}',p_request) returning * into saved;
 perform set_config('app.digital_life_model_draft_rpc','off',true);
 return jsonb_build_object('row',jsonb_build_object('user_id',saved.user_id,'revision',saved.revision,'request',saved.request),'idempotent',false);
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
  select id,formal_content_hash,formal_accepted_at,formal_simulation_start_at,generation_jobs.frozen_source_input,simulation_id,status,formal_terminal_receipt into job_row
    from public.generation_jobs where user_id=owner_id and job_type='formal_run_reservation' and idempotency_key=p_idempotency_key::text;
  if found then
    if job_row.formal_content_hash is distinct from content_hash and not (p_default_planning is null and p_outcome_calibration is null and job_row.formal_content_hash=bridge_content_hash) then raise exception using errcode='P0001',message='idempotency_key_content_conflict'; end if;
    accepted_at:=job_row.formal_accepted_at; simulation_start_at:=job_row.formal_simulation_start_at;
    if job_row.status='failed' then
      if p_digital_life_rules->>'version' is distinct from 'digital-life-rules-v3' or job_row.formal_terminal_receipt->>'version' is distinct from 'formal-no-eligible-actions-v1'
       or job_row.formal_terminal_receipt->>'requestHash' is distinct from content_hash then raise exception using errcode='P0001',message='persistence_failed'; end if;
      run:=jsonb_build_object('status','no_eligible_actions','pathDiagnostics',job_row.formal_terminal_receipt->'pathDiagnostics'); frozen_source_input:=null;
    elsif job_row.status='completed' then
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
  if p_digital_life_rules->>'version'='digital-life-rules-v3' and public.formal_world_guard_rules_valid_v3(source,p_digital_life_rules,p_horizon_days) is not true then raise exception using errcode='P0001',message='invalid_request'; end if;
  insert into public.generation_jobs(user_id,seed_context_id,trace_id,version,writer_version,idempotency_key,job_type,status,input_refs,formal_graph_snapshot_id,formal_content_hash,formal_accepted_at,formal_simulation_start_at,frozen_source_input)
    values(owner_id,graph_row.seed_context_id,gen_random_uuid()::text,'formal-run-reservation-v1','formal-run-reservation-v1',p_idempotency_key::text,'formal_run_reservation','queued',jsonb_build_object('graph_snapshot_id',graph_row.id),graph_row.id,content_hash,accepted_at,simulation_start_at,source);
  frozen_source_input:=source; run:=null; perform set_config('app.formal_reservation_rpc','off',true); return next;
exception when others then perform set_config('app.formal_reservation_rpc','off',true); raise;
end; $$;

create function public.formal_world_guard_environment_bundle_valid_v3(p_bundle jsonb,p_source jsonb,p_start timestamptz,p_horizon integer)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare rules jsonb:=p_bundle#>'{inputSnapshot,digitalLifeModel,rules}'; model jsonb:=p_bundle#>'{inputSnapshot,digitalLifeModel}'; path_key text:=p_bundle#>>'{inputSnapshot,activePathKey}';
 variables jsonb; expected_variables jsonb; spec jsonb; v jsonb; rule jsonb; e jsonb; trajectory jsonb; world jsonb; frame jsonb; delta jsonb; causal jsonb; expected_events jsonb;
 namespace text:='formal-'||coalesce(p_bundle->>'policyFingerprint',p_bundle->>'causalFingerprint'); sample_namespace text; raw_key text; variable_id text; baseline jsonb; expected_value jsonb; allowed jsonb; provenance jsonb; rule_event jsonb; prior_event jsonb; previous_rule jsonb; core_key text; expected_actor text; i integer; ticks integer:=case when p_horizon=30 then 3 else 6 end;
begin
 if model is distinct from public.formal_world_guard_model_v3(p_source,rules) or model->>'version' is distinct from 'digital-life-model-v3' or public.formal_world_guard_rules_valid_v3(p_source,rules,p_horizon) is not true
  or p_bundle->'sourceBoundary' is distinct from p_bundle#>'{trajectoryAnalysis,spec,trajectoryTemplate,initialWorld,realityBoundarySnapshot}'
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


-- Attempts have no Forecast Lock. These source/planning validators reuse the
-- unchanged non-forecast checks and require only the three actual admission clocks.
create function public.formal_world_guard_attempt_source_valid_v3(p_bundle jsonb,p_source jsonb,p_accepted timestamptz,p_start timestamptz,p_horizon integer)
returns boolean language plpgsql security invoker set search_path=public,extensions as $$
declare input jsonb:=p_bundle->'inputSnapshot'; graph jsonb:=p_source->'relation_graph_snapshots'; profile_row jsonb:=nullif(p_source->'reality_profiles','null'::jsonb); expected_profile jsonb; expected_agents jsonb; expected_edges jsonb; expected_feedback jsonb; rules jsonb; field text; timing jsonb:=p_bundle->'forecastTiming'; boundary_at timestamptz; lock_at timestamptz; generated_at timestamptz;
begin
  if jsonb_typeof(input) is distinct from 'object' or jsonb_typeof(timing) is distinct from 'object' then return false; end if;
  for field in select unnest(array['acceptedAt','boundaryAt','simulationStartAt']) loop
    if jsonb_typeof(timing->field) is distinct from 'string' or timing->>field !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$' then return false; end if;
  end loop;
  boundary_at:=(timing->>'boundaryAt')::timestamptz;
  if (timing->>'acceptedAt')::timestamptz is distinct from p_accepted or (timing->>'simulationStartAt')::timestamptz is distinct from p_start
    or boundary_at<p_accepted or boundary_at>clock_timestamp() or boundary_at>=p_start
    or (input->>'acceptedAt')::timestamptz is distinct from p_accepted or (input->>'startedAt')::timestamptz is distinct from p_start
    or (input->>'graphLockedAt')::timestamptz is distinct from (graph->>'locked_at')::timestamptz
    or (p_bundle#>>'{sourceBoundary,updatedAt}')::timestamptz is distinct from boundary_at then return false; end if;
  if jsonb_typeof(input->'acceptedAt') is distinct from 'string' or jsonb_typeof(input->'startedAt') is distinct from 'string'
    or jsonb_typeof(input->'graphLockedAt') is distinct from 'string' then return false; end if;
  expected_profile:=jsonb_build_object('ownerId',graph->'user_id','seedContextId',graph->'seed_context_id','profileId',profile_row->'id','revision',coalesce(profile_row->'revision','0'::jsonb),'profile',public.formal_run_frozen_profile(profile_row));
  select jsonb_agg(jsonb_build_object('id',a->'id','displayName',a->'display_name','sourceRole',a->'agent_type','actorType',case when a->>'agent_type' in ('user_core','user_variant') then 'self' when a->>'agent_type'='group' then 'organization' else 'third_party' end,'evidenceRefs',a->'evidence_refs') order by ord) into expected_agents from jsonb_array_elements(p_source->'agent_profiles') with ordinality t(a,ord);
  select jsonb_agg(jsonb_build_object('id',e->'id','fromAgentId',e->'from_agent_id','toAgentId',e->'to_agent_id','relationshipType',e->'relationship_type','evidenceRefs',e->'evidence_refs') order by ord) into expected_edges from jsonb_array_elements(p_source->'relation_edges') with ordinality t(e,ord);
  select jsonb_build_object('source','account_feedback','signals',coalesce(jsonb_agg(jsonb_build_object('rating',f->>'rating','targetType',f->>'target_type','createdAt',f->>'created_at') order by ord),'[]'::jsonb)) into expected_feedback from jsonb_array_elements(p_source->'feedback_logs') with ordinality t(f,ord);
  rules:=public.formal_relationship_effective_rules_v1(p_source);
  if rules is null then rules:=jsonb_build_object('version','digital-life-rules-v1','graphSnapshotId',graph->'id','agentSnapshotId',graph->'agent_snapshot_id','profileRevision',coalesce(profile_row->'revision','0'::jsonb),'strategies','[]'::jsonb,'actions','[]'::jsonb); end if;
  return input->'ownerId' is not distinct from graph->'user_id' and input->'seedContextId' is not distinct from graph->'seed_context_id'
    and input->'graphSnapshotId' is not distinct from graph->'id' and input->'agentSnapshotId' is not distinct from graph->'agent_snapshot_id'
    and input->'horizonDays' is not distinct from to_jsonb(p_horizon) and input->'safetyLevel' is not distinct from graph->'safety_level'
    and btrim(input->>'seedSummary') is not distinct from btrim(left(concat_ws(' ',nullif(p_source#>>'{seed_contexts,user_question}',''),nullif(p_source#>>'{seed_contexts,raw_context}','')),4000))
    and public.formal_run_normalize_json(input->'realityProfileSnapshot') is not distinct from expected_profile
    and public.formal_run_normalize_json(input->'agents') is not distinct from public.formal_run_normalize_json(expected_agents)
    and public.formal_run_normalize_json(input->'edges') is not distinct from public.formal_run_normalize_json(expected_edges)
    and input->'calibrationSnapshot' is not distinct from expected_feedback
    and public.formal_run_normalize_json(input#>'{digitalLifeModel,rules}') is not distinct from public.formal_run_normalize_json(rules)
    and p_bundle->'symbolicLensSnapshot' is not distinct from p_source->'symbolic_lens';
exception when others then return false;
end; $$;

create function public.formal_world_guard_attempt_planning_valid_v1(p_bundle jsonb,p_source jsonb,p_accepted timestamptz,p_start timestamptz,p_horizon integer)
returns boolean language plpgsql security invoker set search_path=public,extensions as $$
declare request jsonb:=nullif(p_source->'default_planning','null'::jsonb);planning jsonb:=p_bundle->'defaultPlanningSnapshot';
 graph jsonb:=p_source->'relation_graph_snapshots';profile jsonb:=p_source->'reality_profiles';lens jsonb:=p_source->'symbolic_lens';
 expected_paths jsonb;core_actor jsonb;strategy jsonb;path_key text:=p_bundle#>>'{inputSnapshot,activePathKey}';source_actor jsonb;
 actor_id text;entity_id text;namespace text;fusion_status text;caution numeric:=0;rhythm numeric:=0;reduction numeric:=0;peak numeric:=0;
 inputs jsonb;derived jsonb;expected_provenance jsonb;ticks integer:=case when p_horizon=30 then 3 else 6 end;
 authorized jsonb;source_resource jsonb;resource jsonb;resource_id text;bound_resource jsonb;
 neutral double precision;expected_status text;explicit_rule boolean;all_inactive boolean:=true;resource_ordinal integer;
 entry jsonb;trajectory jsonb;world jsonb;trace jsonb;binding jsonb;event jsonb;delta jsonb;actor jsonb;entity jsonb;actor_evidence jsonb;
 final_resource jsonb;provenance jsonb;prior boolean;amount double precision;spent double precision;causal_ids jsonb;expected_prior jsonb;
 base_assumption jsonb;prior_assumption jsonb;source_provenance jsonb;i integer;trace_count integer;remaining double precision;expected_events jsonb;
begin
 if request is null then
  if p_bundle ?| array['defaultPlanningSnapshot','defaultPlanningTraces','policyFingerprint']
   or p_bundle#>'{inputSnapshot}' ?| array['defaultPlanningAuthorization','planningHypothesis'] then return false;end if;
  return public.formal_world_guard_attempt_source_valid_v3(p_bundle,p_source,p_accepted,p_start,p_horizon);
 end if;
 if not public.formal_default_planning_request_valid_v1(request)
  or p_source->>'planning_version' is distinct from 'formal-default-planner-v1'
  or request->>'consentContext' is distinct from p_source->>'planning_consent_context'
  or request->>'consentContext' is distinct from public.formal_default_planning_context_fingerprint_v1(p_source)
  or jsonb_typeof(planning) is distinct from 'object' or planning->>'version' is distinct from 'formal-default-planner-v1'
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
   or jsonb_typeof(entry->'trace') is distinct from 'array' or jsonb_array_length(entry->'trace')>48 then return false;end if;
  select value into actor from jsonb_array_elements(world->'agentDefinitions') where value->>'id'=actor_id and value->>'actorType'='self';
  select value into entity from jsonb_array_elements(world->'entities') where value->>'id'=entity_id and value->>'agentDefinitionId'=actor_id;
  select value into actor_evidence from jsonb_array_elements(world#>'{realityBoundarySnapshot,evidenceLedger,items}')where value->'id'=actor->'realEvidenceIds'->0;
  if actor is null or entity is null or actor_evidence->>'claimKey' is distinct from 'formal.agent.'||(source_actor->>'sourceAgentOrdinal')
   or not exists(select 1 from jsonb_array_elements(actor_evidence->'provenance')p where p->>'sourceRef'='agent_snapshot:'||(graph->>'agent_snapshot_id')||':'||(source_actor->>'sourceAgentId)
    and (p->>'capturedAt')::timestamptz=(p_bundle#>>'{forecastTiming,boundaryAt}')::timestamptz)then return false;end if;
  for trace in select value from jsonb_array_elements(entry->'trace')loop
   select value into resource from jsonb_array_elements(planning->'resources')where value->'resourceKey'=trace->'resourceKey' and value->>'status'='active';
   if resource is null then return false;end if;
   resource_id:=public.formal_planning_core_id_v1('world_resource',namespace,resource->>'profileResourceKey');
   binding:=trace->'worldBinding';
   select value into bound_resource from jsonb_array_elements(binding->'resources')where value->'resourceKey'=resource->'resourceKey';
   select value into final_resource from jsonb_array_elements(world->'resources')where value->>'id'=resource_id;
   prior:=(trace->>'tickIndex')::integer=0 and fusion_status='active';
   amount:=(resource->>'neutralAmount')::double precision*(case when prior then (1-reduction)::double precision else 1 end);
   if trace->>'version' is distinct from 'formal-default-planning-trace-v1' or trace->>'pathKey' is distinct from path_key
    or (trace->>'tickIndex')::integer<0 or (trace->>'tickIndex')::integer>=ticks
    or trace->>'resourceId' is distinct from resource_id or bound_resource->>'resourceId' is distinct from resource_id
    or trace->>'proposalId' is distinct from 'action_proposal_v2_formal_planning_formal_'||(p_bundle->>'policyFingerprint')||'_'||(trajectory->>'trajectorySeed')||'_'||(trace->>'tickIndex')||'_'||(resource->>'resourceKey')
    or trace->'neutralAmount' is distinct from resource->'neutralAmount' or (trace->>'proposedAmount')::double precision<>amount
    or trace->'priorApplied' is distinct from to_jsonb(prior) or (trace->>'reduction')::numeric<>(case when prior then reduction else 0 end)
    or trace->'reductionCap' is distinct from '0.1'::jsonb or trace->'totalBudgetLimit' is distinct from resource->'totalBudgetLimit'
    or binding->>'worldNamespace' is distinct from namespace or binding->>'pathKey' is distinct from path_key
    or binding->>'actorAgentId' is distinct from actor_id or binding->>'actorEntityId' is distinct from entity_id
    or (binding->>'acceptedSourceSignature')::jsonb is distinct from jsonb_build_object('sourceBinding',planning->'sourceBinding','resources',planning->'resources','maxTicks',ticks)
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
   causal_ids:=jsonb_build_array(base_assumption->'id')||(case when prior then jsonb_build_array(prior_assumption->'id') else '[]'::jsonb end);
   if base_assumption is null or (prior and prior_assumption is null) or trace->'causalAssumptionIds' is distinct from causal_ids
    or base_assumption->'parameterRange' is distinct from jsonb_build_object('min',(resource->>'neutralAmount')::double precision*0.9,'max',resource->'neutralAmount','defaultValue',resource->'neutralAmount','unit',resource->'unit')
    or (prior and prior_assumption->'parameterRange' is distinct from jsonb_build_object('min',0,'max',10,'defaultValue',reduction*100,'unit','percent reduction'))
    or exists(select 1 from jsonb_array_elements(world#>'{realityBoundarySnapshot,assumptionLedger,assumptions}')a where causal_ids @> jsonb_build_array(a->'id') and
     (a->>'subjectType'<>'self' or a->>'epistemicStatus'<>'confirmed_for_simulation' or a->>'confirmationStatus'<>'confirmed'
      or a->>'confirmationRequirement'<>'required' or a->>'impactLevel'<>'low'
      or a->'supportingRealEvidenceIds'<>'[]'::jsonb or a->'contradictingRealEvidenceIds'<>'[]'::jsonb))then return false;end if;
   select value into event from jsonb_array_elements(world->'worldEvents')where value->'proposalId'=trace->'proposalId';
   if event is not null then
    select coalesce(jsonb_agg(e->'id' order by ord),'[]'::jsonb) into expected_prior
    from jsonb_array_elements(world->'worldEvents') with ordinality t(e,ord)
    where ord<(select event_order from jsonb_array_elements(world->'worldEvents') with ordinality t(selected,event_order) where selected->'id'=event->'id');
    select value into delta from jsonb_array_elements(event->'deltas')where value->>'valueType'='resource' and value->>'path'='resources.'||resource_id||'.available';
    if event->>'actorId' is distinct from actor_id or event#>>'{operation,actionType}' is distinct from 'allocate_resource'
     or event#>>'{operation,resourceId}' is distinct from resource_id or (event#>>'{operation,amount}')::double precision<>amount
     or event->'operation' is distinct from jsonb_build_object('actionType','allocate_resource','resourceId',resource_id,'amount',amount)
     or event->'targetEntityIds' is distinct from jsonb_build_array(entity_id)
     or event->'targetResourceIds' is distinct from jsonb_build_array(resource_id)
     or event->'targetRelationIds' is distinct from '[]'::jsonb or event->'targetVariableIds' is distinct from '[]'::jsonb
     or event->'causalRealEvidenceIds' is distinct from public.formal_world_guard_unique_ids_v3((final_resource#>'{provenance,realEvidenceIds}')||(actor->'realEvidenceIds'))
     or event->'causalAssumptionIds' is distinct from public.formal_world_guard_unique_ids_v3(causal_ids)
     or event->'priorWorldEventIds' is distinct from expected_prior or delta is null
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
 return public.formal_world_guard_attempt_source_valid_v3(p_bundle-array['defaultPlanningSnapshot','defaultPlanningTraces','policyFingerprint'],p_source,p_accepted,p_start,p_horizon);
exception when others then return false;
end;$$;

create function public.formal_world_guard_attempt_planning_valid_v2(p_bundle jsonb,p_source jsonb,p_accepted timestamptz,p_start timestamptz,p_horizon integer)
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
  return public.formal_world_guard_attempt_planning_valid_v1(p_bundle,p_source,p_accepted,p_start,p_horizon);
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
 return public.formal_world_guard_attempt_source_valid_v3(jsonb_set(p_bundle-array['defaultPlanningSnapshot','defaultPlanningTraces','policyFingerprint'],'{inputSnapshot}',(p_bundle->'inputSnapshot')-array['relationshipResponseHypothesis','relationshipResponseAuthorization']),p_source,p_accepted,p_start,p_horizon);
exception when others then return false;
end;$$;


create or replace function public.formal_run_reservation_guard() returns trigger language plpgsql security invoker
set search_path=public,extensions as $$
declare attempt jsonb; request jsonb; diagnostics jsonb; seed integer;
begin
  if tg_op='UPDATE' and old.job_type='formal_run_reservation' and new.status='failed' then
    if auth.uid() is distinct from old.user_id or current_setting('app.formal_reservation_rpc',true) is distinct from 'on'
      or current_setting('app.formal_no_actions_rpc',true) is distinct from 'on' or old.status<>'queued' or old.simulation_id is not null or new.simulation_id is not null or clock_timestamp()>=old.formal_simulation_start_at
      or (to_jsonb(new)-array['status','formal_terminal_receipt','updated_at']) is distinct from (to_jsonb(old)-array['status','formal_terminal_receipt','updated_at'])
      or old.frozen_source_input#>>'{digital_life_rules,version}' is distinct from 'digital-life-rules-v3'
      or jsonb_typeof(new.formal_terminal_receipt) is distinct from 'object' or (select count(*) from jsonb_object_keys(new.formal_terminal_receipt))<>4
      or new.formal_terminal_receipt->>'version' is distinct from 'formal-no-eligible-actions-v1'
      or new.formal_terminal_receipt->>'requestHash' is distinct from old.formal_content_hash then raise exception using errcode='42501',message='reservation_terminal_invalid'; end if;
    begin
      attempt:=current_setting('app.formal_no_actions_attempt',true)::jsonb;
      request:=current_setting('app.formal_no_actions_request',true)::jsonb;
      if public.formal_world_guard_request_hash_v3(request,old.idempotency_key::uuid) is distinct from old.formal_content_hash
        or new.formal_terminal_receipt->>'attemptHash' is distinct from encode(digest(convert_to(public.formal_relationship_canonical_json_v1(attempt),'UTF8'),'sha256'),'hex') then raise exception 'invalid'; end if;
      seed:=(('x'||left(encode(digest(convert_to(old.formal_graph_snapshot_id::text||':'||old.idempotency_key,'UTF8'),'sha256'),'hex'),7))::bit(28)::integer % 1999999999)+1;
      diagnostics:=public.formal_world_guard_attempt_diagnostics_v3(attempt,old.frozen_source_input,old.formal_accepted_at,old.formal_simulation_start_at,(request->>'horizon_days')::integer,seed);
      if diagnostics is null or diagnostics is distinct from new.formal_terminal_receipt->'pathDiagnostics' then raise exception 'invalid'; end if;
    exception when others then raise exception using errcode='42501',message='reservation_terminal_invalid'; end;
    return new;
  end if;
  if tg_op='INSERT' and new.job_type='formal_run_reservation' then
    if auth.uid() is distinct from new.user_id or current_setting('app.formal_reservation_rpc',true) is distinct from 'on' then
      raise exception using errcode='42501',message='reservation_write_denied';
    end if;
  elsif tg_op<>'INSERT' and old.job_type='formal_run_reservation' then
    if tg_op='DELETE' then raise exception using errcode='42501',message='reservation_immutable'; end if;
    if auth.uid() is distinct from old.user_id or current_setting('app.formal_reservation_rpc',true) is distinct from 'on'
      or old.status<>'queued' or new.status<>'completed' or new.simulation_id is null
      or (to_jsonb(new)-array['status','simulation_id','updated_at']) is distinct from (to_jsonb(old)-array['status','simulation_id','updated_at'])
    then raise exception using errcode='42501',message='reservation_immutable'; end if;
    if not exists (select 1 from public.simulations s join public.simulation_run_idempotency_receipts r
      on r.simulation_id=s.id and r.user_id=s.user_id and r.graph_snapshot_id=s.graph_snapshot_id
      and r.idempotency_key::text=s.idempotency_key and r.request_hash=s.request_hash
      where s.id=new.simulation_id and s.user_id=old.user_id
      and s.graph_snapshot_id=old.formal_graph_snapshot_id and s.idempotency_key=old.idempotency_key and s.status='completed'
      and public.formal_run_bundle_matches_reservation(s.result_bundle,old.frozen_source_input,old.formal_accepted_at,old.formal_simulation_start_at,case s.time_horizon when '30_days' then 30 when '90_days' then 90 end)) then
      raise exception using errcode='42501',message='reservation_completion_invalid';
    end if;
  elsif tg_op='UPDATE' and new.job_type='formal_run_reservation' then
    raise exception using errcode='42501',message='reservation_immutable';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end; $$;

-- Every added callable helper is invoker-only. Recreated dispatchers do not
-- inherit a default PUBLIC execute grant. Existing RLS policies remain intact.
do $acl$
declare f record;
begin
 for f in select p.oid,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and (p.proname like 'formal_world_guard_%_v3'
   or p.proname in ('formal_world_guard_attempt_planning_valid_v1','formal_world_guard_attempt_planning_valid_v2','finalize_account_sandbox_no_eligible_actions_v3',
    'formal_run_rules_valid','formal_run_bundle_matches_reservation','formal_relationship_rule_event_valid_v1','digital_life_draft_confirmed_shape_v3','digital_life_model_draft_request_valid_v3')) loop
  execute format('revoke all on function %s from public,anon,authenticated,service_role',f.oid::regprocedure);
  execute format('grant execute on function %s to authenticated',f.oid::regprocedure);
 end loop;
end; $acl$;
commit;
