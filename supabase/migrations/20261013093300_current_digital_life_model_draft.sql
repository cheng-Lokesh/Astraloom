begin;
-- Unconfirmed configuration revisions only. No Run, Reality or permission ledger is written.
-- New draft-only text boundary mirrors digitalLifeSafeText and safetyRules; old Run validators stay unchanged.
create function public.digital_life_model_draft_visible_text_valid_v1(p_text text,p_limit integer)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare normalized text; js_space_pattern text:=U&'[\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF]';
begin
 if p_text is null or p_limit is null or p_limit not in (160,240) then return false; end if;
 normalized:=btrim(p_text,U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF');
 -- JS limits count UTF-16 code units, so astral characters count twice.
 if p_text<>normalized or char_length(normalized)+char_length(regexp_replace(normalized,U&'[^\+010000-\+10FFFF]','','g')) not between 1 and p_limit
  or normalized ~ '[[:cntrl:]]' or normalized ~ U&'[\007F-\009F]'
  or normalized ~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
  or normalized ~* '(^|[^A-Za-z0-9_])[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}($|[^A-Za-z0-9_])'
  or normalized ~* ('(^|[^A-Za-z0-9_])(raw'||js_space_pattern||'+(scenario|evidence)|trace([_ -]?id)?|internal([_ -]?key)?|token|secret|password|api[_ -]?key|bearer|private'||js_space_pattern||'+key)($|[^A-Za-z0-9_])')
  or normalized ~* 'https?://' then return false; end if;
 return true;
end; $$;

create function public.digital_life_model_draft_text_valid_v1(p_text text,p_limit integer)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare normalized text:=p_text; js_space_pattern text:=U&'[\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF]';
begin
 if public.digital_life_model_draft_visible_text_valid_v1(p_text,p_limit) is not true then return false; end if;
  return normalized !~* ('suicide|self(-|'||js_space_pattern||')?harm|kill myself|end my life|kill|assault|attack|beat up|weapon|threaten|minor|underage|child abuse|teen abuse|grooming|stalk|follow them|track their location|where they go|spy|surveillance|hidden camera|record secretly|monitor their phone|check (my )?(partner|boyfriend|girlfriend|spouse).*(phone|messages|location)|diagnos|medication|treatment|disease|symptom|doctor|lawsuit|sue|legal advice|contract dispute|custody|divorce court|(^|[^A-Za-z0-9_])(invest|investing|investment|stock|stocks|crypto|loan|debt)($|[^A-Za-z0-9_])|buy.*shares|sell.*shares|therapy|therapist|mental health treatment|trauma treatment|clinical|revenge|get back at|expose them|ruin their reputation|blackmail|force them|make them obey|pressure them|manipulate them|control them|what (does|is).*(really think|hiding|true intention|secretly want)|will definitely|guaranteed|certain future|must happen|fate|guarantee.*(get back together|reconcile)|win them back for sure')
  and normalized !~ '自杀|自残|轻生|不想活|结束生命|伤害自己|杀人|打死|袭击|殴打|武器|威胁|暴力|未成年|儿童安全|虐待儿童|诱骗未成年|未成年人|跟踪|尾随|定位.*行踪|查.*行踪|监控|偷拍|偷录|窃听|查手机|偷看手机|监听|查.*(伴侣|男友|女友|老公|老婆|配偶).*(手机|聊天|定位|位置)|诊断|吃药|药物|治疗|疾病|症状|医生|医院|起诉|律师|法律建议|合同纠纷|抚养权|离婚诉讼|法院|投资|股票|基金|币圈|加密货币|贷款|债务|买入|卖出|心理治疗|治疗方案|创伤治疗|临床|精神科|心理医生|报复|整他|曝光.*隐私|毁掉.*名声|勒索|敲诈|强迫|逼迫|操控|控制.*对方|让.*服从|拿捏|他.*真实想法|她.*真实想法|对方.*心里|内心真实|真正意图|是不是.*背叛|一定会|必然|命中注定|注定|绝对会|肯定会|保证.*复合|一定复合|必定挽回|挽回成功率.*100';
end; $$;

create function public.digital_life_draft_confirmed_shape_v1(p_rules jsonb)
returns jsonb language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare result jsonb; actions jsonb:='[]'::jsonb; strategies jsonb:='[]'::jsonb; item jsonb;
begin
 if p_rules is null or jsonb_typeof(p_rules) is distinct from 'object'
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

-- Exact installed Zod RFC UUID boundary, including nil/max UUIDs.
create function public.digital_life_model_draft_uuid_valid_v1(p_value jsonb)
returns boolean language sql immutable security invoker set search_path=public,pg_temp as $$
 select coalesce(jsonb_typeof(p_value)='string' and (p_value#>>'{}') ~ '^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$',false);
$$;

-- Validate the safe projection before it can become an immutable saved request.
-- Visible labels are neutral context, so they do not inherit action-rule safety bans.
create function public.digital_life_model_draft_context_valid_v1(p_context jsonb)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare model jsonb; item jsonb; field_name text; quantity double precision;
begin
 if jsonb_typeof(p_context) is distinct from 'object' then return false; end if;
 if (select count(*) from jsonb_object_keys(p_context))<>2 or not (p_context ?& array['signature','modelContext'])
  or jsonb_typeof(p_context->'signature') is distinct from 'string' or coalesce(p_context->>'signature','')!~'^[a-f0-9]{64}$'
  or jsonb_typeof(p_context->'modelContext') is distinct from 'object' then return false; end if;
 model:=p_context->'modelContext';
 if (select count(*) from jsonb_object_keys(model))<>6
  or not (model ?& array['graphSnapshotId','agentSnapshotId','profileRevision','agents','relationships','resources'])
  or public.digital_life_model_draft_uuid_valid_v1(model->'graphSnapshotId') is not true
  or public.digital_life_model_draft_uuid_valid_v1(model->'agentSnapshotId') is not true
  or jsonb_typeof(model->'profileRevision') is distinct from 'number'
  or jsonb_typeof(model->'agents') is distinct from 'array'
  or jsonb_typeof(model->'relationships') is distinct from 'array'
  or jsonb_typeof(model->'resources') is distinct from 'array' then return false; end if;
 if (model->>'profileRevision')::numeric<>trunc((model->>'profileRevision')::numeric)
  or (model->>'profileRevision')::numeric not between 0 and 9007199254740991
  or jsonb_array_length(model->'agents') not between 1 and 50
  or jsonb_array_length(model->'relationships')>200 or jsonb_array_length(model->'resources')>8 then return false; end if;
 for item in select value from jsonb_array_elements(model->'agents') loop
  if jsonb_typeof(item) is distinct from 'object' then return false; end if;
  if (select count(*) from jsonb_object_keys(item))<>3 or not (item ?& array['key','label','role'])
   or jsonb_typeof(item->'key') is distinct from 'string' or coalesce(item->>'key','')!~'^person-[1-9][0-9]*$'
   or jsonb_typeof(item->'label') is distinct from 'string' or public.digital_life_model_draft_visible_text_valid_v1(item->>'label',240) is not true
   or jsonb_typeof(item->'role') is distinct from 'string' or item->>'role' not in ('user_core','user_variant','npc','group') then return false; end if;
 end loop;
 for item in select value from jsonb_array_elements(model->'relationships') loop
  if jsonb_typeof(item) is distinct from 'object' then return false; end if;
  if (select count(*) from jsonb_object_keys(item))<>4 or not (item ?& array['key','label','fromPersonKey','toPersonKey'])
   or jsonb_typeof(item->'key') is distinct from 'string' or coalesce(item->>'key','')!~'^relation-[1-9][0-9]*$'
   or jsonb_typeof(item->'label') is distinct from 'string' or public.digital_life_model_draft_visible_text_valid_v1(item->>'label',240) is not true
   or jsonb_typeof(item->'fromPersonKey') is distinct from 'string' or coalesce(item->>'fromPersonKey','')!~'^person-[1-9][0-9]*$'
   or jsonb_typeof(item->'toPersonKey') is distinct from 'string' or coalesce(item->>'toPersonKey','')!~'^person-[1-9][0-9]*$' then return false; end if;
 end loop;
 for item in select value from jsonb_array_elements(model->'resources') loop
  if jsonb_typeof(item) is distinct from 'object' then return false; end if;
  if (select count(*) from jsonb_object_keys(item))<>9 or not (item ?& array['key','label','available','minimum','maximum','unit','usePerTick','classification','evidenceSummary'])
   or jsonb_typeof(item->'key') is distinct from 'string' or coalesce(item->>'key','')!~'^resource-[1-9][0-9]*$'
   or jsonb_typeof(item->'classification') is distinct from 'string' or item->>'classification' not in ('fact','assumption') then return false; end if;
  foreach field_name in array array['label','unit','evidenceSummary'] loop
   if jsonb_typeof(item->field_name) is distinct from 'string'
    or public.digital_life_model_draft_visible_text_valid_v1(item->>field_name,240) is not true then return false; end if;
  end loop;
  foreach field_name in array array['available','minimum','maximum'] loop
   if jsonb_typeof(item->field_name) is distinct from 'number' then return false; end if;
   quantity:=(item->>field_name)::double precision;
   if quantity<0 or quantity in ('Infinity'::double precision,'-Infinity'::double precision,'NaN'::double precision) then return false; end if;
  end loop;
  if item->'usePerTick' is distinct from 'null'::jsonb then
   if jsonb_typeof(item->'usePerTick') is distinct from 'number' then return false; end if;
   quantity:=(item->>'usePerTick')::double precision;
   if quantity<=0 or quantity in ('Infinity'::double precision,'-Infinity'::double precision,'NaN'::double precision) then return false; end if;
  end if;
 end loop;
 return true;
exception when others then return false;
end; $$;

create function public.digital_life_model_draft_request_valid_v1(p_request jsonb)
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
  or public.digital_life_draft_confirmed_shape_v1(p_request->'draftRules') is null then return false; end if;
 return (p_request->>'expectedRevision')::numeric=trunc((p_request->>'expectedRevision')::numeric)
  and (p_request->>'expectedRevision')::numeric between 0 and 9007199254740990;
exception when others then return false;
end; $$;

create table public.digital_life_model_drafts (
 user_id uuid not null references auth.users(id),
 revision bigint not null check(revision between 1 and 9007199254740991),
 parent_revision bigint not null check(parent_revision>=0 and revision=parent_revision+1),
 seed_context_id uuid not null,
 idempotency_key uuid not null,
 source_signature text not null check(source_signature ~ '^[a-f0-9]{64}$'),
 request jsonb not null,
 created_at timestamptz not null default clock_timestamp(),
 primary key(user_id,revision),
 unique(user_id,idempotency_key),
 foreign key(seed_context_id,user_id) references public.seed_contexts(id,user_id),
 check(jsonb_typeof(request)='object'),
 check(public.digital_life_draft_confirmed_shape_v1(request->'draftRules') is not null)
);
alter table public.digital_life_model_drafts enable row level security;
revoke all on public.digital_life_model_drafts from public,anon,authenticated,service_role;
grant select on public.digital_life_model_drafts to authenticated;
grant insert(user_id,revision,parent_revision,seed_context_id,idempotency_key,source_signature,request) on public.digital_life_model_drafts to authenticated;
create policy digital_life_model_drafts_read_own on public.digital_life_model_drafts for select to authenticated
 using((select auth.uid())=user_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')<>'true');
create policy digital_life_model_drafts_append_own on public.digital_life_model_drafts for insert to authenticated
 with check((select auth.uid())=user_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')<>'true'
  and current_setting('app.digital_life_model_draft_rpc',true)='on');

-- STABLE plus one SELECT: all source identities, whole contents and source order share one MVCC snapshot.
-- Latest Graph selection precedes lock/safety filters; an older locked Graph is never substituted.
create function public.digital_life_model_draft_source_v1()
returns jsonb language sql stable security invoker set search_path=public,extensions as $$
 with source as (
  select jsonb_build_object('seed_contexts',to_jsonb(s),'relation_graph_snapshots',to_jsonb(g),
   'agent_profile_snapshots',to_jsonb(a),
   'agent_profiles',(select jsonb_agg(to_jsonb(p) order by p.id) from public.agent_profiles p
     where p.user_id=auth.uid() and p.seed_context_id=s.id and p.snapshot_id=a.id),
   'relation_edges',(select jsonb_agg(to_jsonb(e) order by e.id) from public.relation_edges e
     where e.user_id=auth.uid() and e.graph_snapshot_id=g.id and e.agent_snapshot_id=a.id),
   'reality_profiles',(select to_jsonb(p) from public.reality_profiles p where p.user_id=auth.uid() and p.seed_context_id=s.id)) value
  from public.seed_contexts s
  join public.relation_graph_snapshots g on g.user_id=s.user_id and g.seed_context_id=s.id
  join public.agent_profile_snapshots a on a.id=g.agent_snapshot_id and a.user_id=s.user_id and a.seed_context_id=s.id
  where auth.uid() is not null and coalesce(auth.jwt()->>'is_anonymous','false')<>'true'
   and s.user_id=auth.uid() and s.status='submitted' and s.submitted_at is not null and s.frozen_at is not null
   and s.simulation_track='crossroad'
   and s.id=(select id from public.seed_contexts where user_id=auth.uid() and status='submitted' and submitted_at is not null and frozen_at is not null order by submitted_at desc,id desc limit 1)
   and g.id=(select id from public.relation_graph_snapshots where user_id=auth.uid() and seed_context_id=s.id order by created_at desc,id desc limit 1)
   and g.graph_locked and g.locked_at is not null and g.safety_level in ('safe','caution') and a.safety_level in ('safe','caution')
 ) select value||jsonb_build_object('signature',encode(digest(convert_to(jsonb_build_object('version','digital-life-model-draft-source-v1','source',value)::text,'UTF8'),'sha256'),'hex')) from source;
$$;

create function public.digital_life_model_draft_safe_context_v1(p_source jsonb)
returns jsonb language sql immutable security invoker set search_path=public,pg_temp as $$
 with agents as (select p,ord from jsonb_array_elements(p_source->'agent_profiles') with ordinality t(p,ord)),
 edges as (select e,ord from jsonb_array_elements(p_source->'relation_edges') with ordinality t(e,ord))
 select jsonb_build_object('signature',p_source->'signature','modelContext',jsonb_build_object(
  'graphSnapshotId',p_source#>'{relation_graph_snapshots,id}','agentSnapshotId',p_source#>'{relation_graph_snapshots,agent_snapshot_id}',
  'profileRevision',coalesce(p_source#>'{reality_profiles,revision}','0'::jsonb),
  'agents',coalesce((select jsonb_agg(jsonb_build_object('key','person-'||ord::text,'label',p->'display_name','role',p->'agent_type') order by ord) from agents),'[]'::jsonb),
  'relationships',coalesce((select jsonb_agg(jsonb_build_object('key','relation-'||e.ord::text,'label',e.e->'relationship_type',
    'fromPersonKey','person-'||f.ord::text,'toPersonKey','person-'||t.ord::text) order by e.ord)
    from edges e join agents f on f.p->'id'=e.e->'from_agent_id' join agents t on t.p->'id'=e.e->'to_agent_id'),'[]'::jsonb),
  'resources',coalesce((select jsonb_agg(jsonb_build_object('key','resource-'||ord::text,'label',r->'label','available',r->'available',
   'minimum',r->'minimum','maximum',r->'maximum','unit',r->'unit','usePerTick',r->'usePerTick','classification',r->'classification','evidenceSummary',r->'evidenceSummary') order by ord)
   from jsonb_array_elements(coalesce(p_source#>'{reality_profiles,world_model_inputs,resources}','[]'::jsonb)) with ordinality t(r,ord)),'[]'::jsonb)));
$$;

create function public.digital_life_model_draft_rules_valid_v1(p_source jsonb,p_rules jsonb,p_horizon integer)
returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare confirmed jsonb; context jsonb; agents jsonb; edges jsonb; item jsonb; strategy jsonb; previous jsonb;
 role text; active_self text; core_key text; actor jsonb; target jsonb; relation jsonb; resource jsonb;
 seen jsonb:='{}'::jsonb; operation jsonb; profile_field jsonb; field_key text; field_parts text[]; field_index integer;
begin
 confirmed:=public.digital_life_draft_confirmed_shape_v1(p_rules);
 if confirmed is null or p_source is null or p_horizon is null or p_horizon not in (30,90) then return false; end if;
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

create function public.digital_life_model_draft_guard_v1()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid(); source jsonb; latest_revision bigint; body jsonb:=new.request;
begin
 if tg_op<>'INSERT' then raise exception using errcode='42501',message='model_draft_immutable'; end if;
 if owner_id is null or owner_id is distinct from new.user_id or coalesce(auth.jwt()->>'is_anonymous','false')='true'
  or current_setting('app.digital_life_model_draft_rpc',true) is distinct from 'on' then raise exception using errcode='42501',message='unauthenticated'; end if;
 perform pg_advisory_xact_lock(hashtextextended(owner_id::text||':digital-life-model-draft-v1',0));
 if public.digital_life_model_draft_request_valid_v1(body) is not true
  or public.digital_life_model_draft_context_valid_v1(body->'sourceContext') is not true
  or (body->>'expectedRevision')::numeric<>new.parent_revision
  or (body->>'idempotencyKey')::uuid is distinct from new.idempotency_key
  or jsonb_typeof(body->'horizonDays') is distinct from 'number' or body->'horizonDays' not in ('30'::jsonb,'90'::jsonb)
  or jsonb_typeof(body->'sourceContext') is distinct from 'object'
  or body#>>'{sourceContext,signature}' is distinct from new.source_signature then raise exception using errcode='P0001',message='invalid_request'; end if;
 select coalesce(max(revision),0) into latest_revision from public.digital_life_model_drafts where user_id=owner_id;
 if new.parent_revision<>latest_revision or new.revision<>latest_revision+1 then raise exception using errcode='P0001',message='revision_conflict'; end if;
 source:=public.digital_life_model_draft_source_v1();
 if source is null or body->'sourceContext' is distinct from public.digital_life_model_draft_safe_context_v1(source)
  or new.seed_context_id::text is distinct from source#>>'{seed_contexts,id}' then raise exception using errcode='P0001',message='model_source_stale'; end if;
 if public.digital_life_model_draft_rules_valid_v1(source,body->'draftRules',(body->>'horizonDays')::integer) is not true then raise exception using errcode='P0001',message='invalid_request'; end if;
 return new;
end; $$;
create trigger digital_life_model_draft_guard before insert or update or delete on public.digital_life_model_drafts
 for each row execute function public.digital_life_model_draft_guard_v1();

create function public.read_digital_life_model_draft_v1()
returns jsonb language plpgsql stable security invoker set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then raise exception using errcode='42501',message='unauthenticated'; end if;
 select jsonb_build_object('source',public.digital_life_model_draft_source_v1(),'current',
   (select jsonb_build_object('user_id',user_id,'revision',revision,'request',request) from public.digital_life_model_drafts where user_id=auth.uid() order by revision desc limit 1)) into result;
 return result;
end; $$;

create function public.save_digital_life_model_draft_v1(p_request jsonb)
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
 if public.digital_life_model_draft_request_valid_v1(p_request) is not true then raise exception using errcode='P0001',message='invalid_request'; end if;
 if jsonb_typeof(p_request->'expectedRevision') is distinct from 'number' then raise exception using errcode='P0001',message='invalid_request'; end if;
 begin
  if (p_request->>'expectedRevision')::numeric<>trunc((p_request->>'expectedRevision')::numeric) or (p_request->>'expectedRevision')::numeric not between 0 and 9007199254740990 then raise exception 'invalid'; end if;
  expected:=(p_request->>'expectedRevision')::bigint;
 exception when others then raise exception using errcode='P0001',message='invalid_request'; end;
 -- The INSERT trigger captures and validates the complete source in its own single atomic snapshot.
 source:=public.digital_life_model_draft_source_v1();
 if source is null then raise exception using errcode='P0001',message='model_source_stale'; end if;
 perform set_config('app.digital_life_model_draft_rpc','on',true);
 insert into public.digital_life_model_drafts(user_id,revision,parent_revision,seed_context_id,idempotency_key,source_signature,request)
 values(owner_id,expected+1,expected,(source#>>'{seed_contexts,id}')::uuid,request_key,p_request#>>'{sourceContext,signature}',p_request) returning * into saved;
 perform set_config('app.digital_life_model_draft_rpc','off',true);
 return jsonb_build_object('row',jsonb_build_object('user_id',saved.user_id,'revision',saved.revision,'request',saved.request),'idempotent',false);
end; $$;

revoke all on function public.digital_life_model_draft_visible_text_valid_v1(text,integer),public.digital_life_model_draft_uuid_valid_v1(jsonb),public.digital_life_model_draft_context_valid_v1(jsonb),public.digital_life_model_draft_text_valid_v1(text,integer),public.digital_life_draft_confirmed_shape_v1(jsonb),public.digital_life_model_draft_request_valid_v1(jsonb),public.digital_life_model_draft_source_v1(),
 public.digital_life_model_draft_safe_context_v1(jsonb),public.digital_life_model_draft_rules_valid_v1(jsonb,jsonb,integer),
 public.digital_life_model_draft_guard_v1(),public.read_digital_life_model_draft_v1(),public.save_digital_life_model_draft_v1(jsonb) from public,anon,authenticated,service_role;
-- Invoker helpers require EXECUTE; they cannot write or select another owner's sources.
grant execute on function public.digital_life_model_draft_visible_text_valid_v1(text,integer),public.digital_life_model_draft_uuid_valid_v1(jsonb),public.digital_life_model_draft_context_valid_v1(jsonb),public.digital_life_model_draft_text_valid_v1(text,integer),public.digital_life_draft_confirmed_shape_v1(jsonb),public.digital_life_model_draft_request_valid_v1(jsonb),public.digital_life_model_draft_source_v1(),
 public.digital_life_model_draft_safe_context_v1(jsonb),public.digital_life_model_draft_rules_valid_v1(jsonb,jsonb,integer),
 public.read_digital_life_model_draft_v1(),public.save_digital_life_model_draft_v1(jsonb) to authenticated;
commit;
