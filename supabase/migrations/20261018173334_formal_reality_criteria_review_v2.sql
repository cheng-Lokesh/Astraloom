begin;
-- Forward-only candidate; local PostgreSQL execution has not been verified.
-- Replaces only the completion trigger function; no table, RLS, grant, or append-RPC changes.
create or replace function public.persist_formal_locks_on_completion() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare reservation record; path record; history jsonb; envelope jsonb; frozen jsonb; actual timestamptz:=clock_timestamp(); required boolean; criteria jsonb; target jsonb; trajectory jsonb; expected_trajectory text; condition_keys jsonb; grouped_keys jsonb;
begin
 if new.execution_version<>'formal-account-sandbox-m1-v1' or new.status<>'completed' or (tg_op='UPDATE' and old.status='completed') then return new;end if;
 select frozen_source_input into reservation from public.generation_jobs where user_id=new.user_id and job_type='formal_run_reservation' and idempotency_key=new.idempotency_key;
 required:=coalesce((reservation.frozen_source_input->>'outcome_lock_required')::boolean,false);
 for path in select 'main' as key,new.result_bundle as bundle union all
  select value->>'key',value->'bundle' from jsonb_array_elements(coalesce(new.result_bundle#>'{strategyPaths,paths}','[]'::jsonb))
 loop
  history:=path.bundle->'forecastPersistenceHistory';
  if history is null then if required then raise exception using errcode='P0001',message='invalid_forecast_lock';else continue;end if;end if;
  if jsonb_typeof(history) is distinct from 'array' or jsonb_array_length(history)<>1 then raise exception using errcode='P0001',message='invalid_forecast_lock';end if;
  envelope:=history->0;frozen:=envelope#>'{artifact,value}';
  if jsonb_typeof(envelope->'persistedAt') is distinct from 'string'
   or jsonb_typeof(frozen->'lockedAt') is distinct from 'string'
   or jsonb_typeof(frozen#>'{sourceSnapshots,claimSet,realityBoundary,updatedAt}') is distinct from 'string'
   or not isfinite((envelope->>'persistedAt')::timestamptz) or not isfinite((frozen->>'lockedAt')::timestamptz)
   or not isfinite((frozen#>>'{sourceSnapshots,claimSet,realityBoundary,updatedAt}')::timestamptz)
   or jsonb_typeof(frozen->'forecastUnits') is distinct from 'array' or jsonb_array_length(frozen->'forecastUnits')=0
   or exists(select 1 from jsonb_array_elements(frozen->'forecastUnits')u where
      jsonb_typeof(u#>'{semantics,evaluationWindow,startAt}') is distinct from 'string'
      or jsonb_typeof(u#>'{semantics,evaluationWindow,horizonEnd}') is distinct from 'string'
      or not isfinite((u#>>'{semantics,evaluationWindow,startAt}')::timestamptz)
      or not isfinite((u#>>'{semantics,evaluationWindow,horizonEnd}')::timestamptz)
      or (u#>>'{semantics,evaluationWindow,startAt}')::timestamptz is distinct from (path.bundle#>>'{inputSnapshot,startedAt}')::timestamptz)
   or (envelope->>'persistedAt')::timestamptz is distinct from (path.bundle#>>'{forecastTiming,generatedPersistedAt}')::timestamptz
   or (frozen->>'lockedAt')::timestamptz is distinct from (path.bundle#>>'{forecastTiming,lockedAt}')::timestamptz
   then raise exception using errcode='P0001',message='invalid_forecast_lock';end if;
  criteria:=nullif(path.bundle->'frozenRealityCriteria','null'::jsonb);
  if criteria is null and reservation.frozen_source_input->>'reality_criteria_required'='true'
    then raise exception using errcode='P0001',message='invalid_reality_criteria';end if;
  if criteria is not null and (
    jsonb_typeof(criteria) is distinct from 'object' or coalesce(criteria->>'version','') not in ('formal-reality-criteria-v1','formal-reality-criteria-v2')
    or criteria->>'ownerId' is distinct from new.user_id::text or criteria->>'seedContextId' is distinct from new.seed_context_id::text
    or criteria->>'pathKey' is distinct from path.key
    or criteria->'forecastLockReference' is distinct from path.bundle->'forecastLockReference'
    or jsonb_typeof(criteria->'frozenAt') is distinct from 'string'
    or (criteria->>'frozenAt')::timestamptz is distinct from (frozen->>'lockedAt')::timestamptz
    or coalesce(criteria->>'criteriaFingerprint','')!~'^[a-f0-9]{64}$'
    or coalesce(criteria->>'sourceFingerprint','')!~'^[a-f0-9]{64}$'
    or jsonb_typeof(criteria->'targets') is distinct from 'array' or jsonb_array_length(criteria->'targets')>case when criteria->>'version'='formal-reality-criteria-v1' then 100 else 32 end
    or exists(select 1 from jsonb_array_elements(criteria->'targets')t where
      jsonb_typeof(t->'conditions') is distinct from 'array' or jsonb_array_length(t->'conditions') not between 1 and 32
      or jsonb_typeof(t#>'{observationWindow,startAt}') is distinct from 'string'
      or jsonb_typeof(t#>'{observationWindow,horizonEnd}') is distinct from 'string'
      or (t#>>'{observationWindow,startAt}')::timestamptz is distinct from (path.bundle#>>'{inputSnapshot,startedAt}')::timestamptz
      or (t#>>'{observationWindow,horizonEnd}')::timestamptz is distinct from (path.bundle#>>'{inputSnapshot,startedAt}')::timestamptz+make_interval(days=>(path.bundle#>>'{inputSnapshot,horizonDays}')::integer)))
    then raise exception using errcode='P0001',message='invalid_reality_criteria';end if;
  -- V1 remains byte-compatible. V2 additionally binds its safe review to actual selected sample events.
  if criteria->>'version'='formal-reality-criteria-v2' then
   if (select count(*) from jsonb_object_keys(criteria))<>9
     or not (criteria ?& array['version','ownerId','seedContextId','pathKey','forecastLockReference','frozenAt','sourceFingerprint','targets','criteriaFingerprint'])
     or (select count(distinct t->>'targetKey') from jsonb_array_elements(criteria->'targets')t)<>jsonb_array_length(criteria->'targets')
     then raise exception using errcode='P0001',message='invalid_reality_criteria';end if;
   for target in select value from jsonb_array_elements(criteria->'targets') loop
    if jsonb_typeof(target) is distinct from 'object' or (select count(*) from jsonb_object_keys(target))<>5
      or coalesce(target->>'targetKey','')!~'^target-[1-9][0-9]*$'
      or jsonb_typeof(target->'binding') is distinct from 'object' or (select count(*) from jsonb_object_keys(target->'binding'))<>4
      or jsonb_typeof(target#>'{binding,trajectoryId}') is distinct from 'string'
      or jsonb_typeof(target#>'{binding,trajectorySeed}') is distinct from 'number'
      or jsonb_typeof(target#>'{binding,eventIds}') is distinct from 'array'
      or jsonb_array_length(target#>'{binding,eventIds}') not between 1 and 32
      or jsonb_typeof(target#>'{binding,ruleKeys}') is distinct from 'array'
      or jsonb_array_length(target#>'{binding,ruleKeys}')<>jsonb_array_length(target#>'{binding,eventIds}')
      or jsonb_typeof(target->'review') is distinct from 'object' or (select count(*) from jsonb_object_keys(target->'review'))<>4
      or coalesce(target#>>'{review,kind}','') not in ('resource','relationship_resource_chain')
      or jsonb_typeof(target#>'{review,title}') is distinct from 'string'
      or jsonb_typeof(target#>'{review,stepKeys}') is distinct from 'array'
      or jsonb_typeof(target#>'{review,groups}') is distinct from 'array'
      or jsonb_array_length(target#>'{review,groups}') not between 1 and 32
      then raise exception using errcode='P0001',message='invalid_reality_criteria';end if;
    select c->>'representativeTrajectoryId' into expected_trajectory
      from jsonb_array_elements(path.bundle#>'{trajectoryAnalysis,clusters}')c
      where c->>'clusterId'=path.bundle#>>array['claims',((substring(target->>'targetKey' from 8)::integer)-1)::text,'clusterIds','0'];
    select t into trajectory from jsonb_array_elements(path.bundle#>'{trajectoryAnalysis,trajectories}')t
      where t->>'trajectoryId'=target#>>'{binding,trajectoryId}';
    if trajectory is null or expected_trajectory is distinct from target#>>'{binding,trajectoryId}'
      or trajectory->'trajectorySeed' is distinct from target#>'{binding,trajectorySeed}'
      or (select jsonb_agg(e->'id' order by n) from jsonb_array_elements(trajectory#>'{finalWorld,worldEvents}') with ordinality as q(e,n)) is distinct from target#>'{binding,eventIds}'
      or (select jsonb_agg(to_jsonb('step-'||n::text) order by n) from jsonb_array_elements(path.bundle->'events') with ordinality as q(e,n)
          where e->>'branchId'=trajectory->>'trajectoryId' and e->>'id' in (select jsonb_array_elements_text(target#>'{binding,eventIds}'))) is distinct from target#>'{review,stepKeys}'
      then raise exception using errcode='P0001',message='invalid_reality_criteria';end if;
    if exists(select 1 from jsonb_array_elements(target->'conditions') with ordinality as q(c,n) where
      jsonb_typeof(c) is distinct from 'object' or (select count(*) from jsonb_object_keys(c))<>11
      or not (c ?& array['key','label','kind','expectedValue','ruleKey','correctable','requiresTime','measurement','actorLabel','resourceLabel','sequence'])
      or c->>'key' is distinct from 'condition-'||n::text
      or jsonb_typeof(c->'label') is distinct from 'string' or char_length(c->>'label') not between 1 and 600
      or jsonb_typeof(c->'correctable') is distinct from 'boolean' or jsonb_typeof(c->'requiresTime') is distinct from 'boolean'
      or coalesce(c->>'kind','') not in ('request_information','allocate_resource','update_relation_signal','scope_confirmation')
      or coalesce(c->>'measurement','') not in ('operation','resource_before','resource_after','event_count','actor_scope','resource_scope','relationship_scope','response_source')
      or jsonb_typeof(c->'sequence') is distinct from 'number'
      or (c->>'sequence')::numeric<>trunc((c->>'sequence')::numeric)
      or (c->>'sequence')::numeric<0 or (c->>'sequence')::numeric>jsonb_array_length(target#>'{binding,eventIds}')
      or jsonb_typeof(c->'ruleKey') not in ('string','null')
      or jsonb_typeof(c->'actorLabel') not in ('string','null') or jsonb_typeof(c->'resourceLabel') not in ('string','null'))
      then raise exception using errcode='P0001',message='invalid_reality_criteria';end if;
    if exists(select 1 from jsonb_array_elements(target#>'{binding,ruleKeys}')r where jsonb_typeof(r) not in ('string','null')
        or (jsonb_typeof(r)='string' and (r#>>'{}')!~'^rule-[1-9][0-9]*$'))
      or exists(select 1 from jsonb_array_elements(target->'conditions')c where
        (c->>'measurement' in ('actor_scope','resource_scope','relationship_scope','response_source') and (c->>'kind'<>'scope_confirmation' or c->'expectedValue' is distinct from 'true'::jsonb or c->'requiresTime' is distinct from 'false'::jsonb))
        or (c->>'measurement' in ('resource_before','resource_after','event_count') and jsonb_typeof(c->'expectedValue') is distinct from 'number')
        or (c->>'measurement'='operation' and (c->>'sequence'='0' or c->>'kind' is distinct from trajectory#>>array['finalWorld','worldEvents',((c->>'sequence')::integer-1)::text,'operation','actionType'])))
      then raise exception using errcode='P0001',message='invalid_reality_criteria';end if;
    select jsonb_agg(c->'key' order by n) into condition_keys from jsonb_array_elements(target->'conditions') with ordinality as q(c,n);
    if exists(select 1 from jsonb_array_elements(target#>'{review,groups}') with ordinality as q(g,n) where
      jsonb_typeof(g) is distinct from 'object' or (select count(*) from jsonb_object_keys(g))<>3
      or g->>'key' is distinct from 'review-group-'||n::text
      or jsonb_typeof(g->'label') is distinct from 'string'
      or jsonb_typeof(g->'conditionKeys') is distinct from 'array' or jsonb_array_length(g->'conditionKeys') not between 1 and 32)
      then raise exception using errcode='P0001',message='invalid_reality_criteria';end if;
    select jsonb_agg(k order by gn,kn) into grouped_keys
      from jsonb_array_elements(target#>'{review,groups}') with ordinality as groups(g,gn)
      cross join lateral jsonb_array_elements(g->'conditionKeys') with ordinality as keys(k,kn);
    if grouped_keys is distinct from condition_keys then raise exception using errcode='P0001',message='invalid_reality_criteria';end if;
   end loop;
  end if;
  if envelope->>'version' is distinct from '1' or envelope->'parentVersionId' is distinct from 'null'::jsonb or envelope#>>'{artifact,kind}' is distinct from 'forecast_lock'
   or envelope->>'seedContextId' is distinct from new.seed_context_id::text
   or frozen#>'{sourceSnapshots,run,payload}' is distinct from path.bundle->'trajectoryAnalysis'
   or frozen#>'{sourceSnapshots,claimSet,realityBoundary}' is distinct from path.bundle->'sourceBoundary'
   or frozen#>'{sourceSnapshots,report}' is distinct from path.bundle->'report'
   or (select jsonb_agg(c order by c->>'id') from jsonb_array_elements(frozen#>'{sourceSnapshots,claims}')c) is distinct from path.bundle->'claims'
   or (envelope->>'persistedAt')::timestamptz>actual or (frozen->>'lockedAt')::timestamptz>(envelope->>'persistedAt')::timestamptz
   or (frozen#>>'{sourceSnapshots,claimSet,realityBoundary,updatedAt}')::timestamptz>(frozen->>'lockedAt')::timestamptz
   or exists(select 1 from jsonb_array_elements(frozen->'forecastUnits')u where actual>=(u#>>'{semantics,evaluationWindow,startAt}')::timestamptz)
   or path.bundle#>>'{forecastLockReference,streamId}' is distinct from envelope->>'streamId'
   or path.bundle#>'{forecastLockReference,version}' is distinct from envelope->'version'
   then raise exception using errcode='P0001',message='invalid_forecast_lock';end if;
  insert into public.formal_forecast_locks(user_id,simulation_id,path_key,history,stored_at,reality_criteria)values(new.user_id,new.id,path.key,history,actual,criteria);
 end loop;
 return new;
exception when others then raise exception using errcode='P0001',message='invalid_forecast_lock';
end;$$;

commit;
