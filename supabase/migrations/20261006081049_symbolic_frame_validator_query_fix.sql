create or replace function public.valid_symbolic_frame_v1(f jsonb) returns boolean language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare c jsonb; d jsonb; s jsonb; i integer; k text; expected text[]:=array['initial_tendency','relationship_sensitivity','rhythm','symbolic_support_tension','observation_window']; rules text[]:=array['natal-group-max-v1','natal-relation-presence-v1','period-channel-match-v1','period-element-relation-v1','coarse-period-review-v1'];
begin
  if not public.symbolic_keys_v1(f,array['version','ruleVersion','sourceVersion','referencePeriod','classification','methodKind','causalUse','calculation','dimensions','limitations']) or
    f->>'version' is distinct from 'formal-symbolic-frame-v1' or f->>'ruleVersion' is distinct from 'symbolic-product-rules-v1' or
    f->>'classification' is distinct from 'symbolic_lens' or f->>'methodKind' is distinct from 'explicit_product_symbolic_rules' or f->'causalUse' is distinct from 'false'::jsonb or
    jsonb_typeof(f->'sourceVersion') is distinct from 'number' or (f->>'sourceVersion') !~ '^[1-9][0-9]{0,8}$' then return false; end if;
  s:=f->'referencePeriod';
  if not public.symbolic_keys_v1(s,array['key','referenceDate','structureKey','timezone','granularity']) or s->>'key' !~ '^20[0-9]{2}-[0-9]{2}$' or
    s->>'referenceDate' !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' or s->>'structureKey' !~ '^[a-z_]{5,100}$' or
    s->>'timezone' is distinct from 'Asia/Shanghai' or s->>'granularity' is distinct from 'month' then return false; end if;
  c:=f->'calculation';
  if not public.symbolic_keys_v1(c,array['calculationVersion','precision','inputUsed','usesSolarTermApproximation','usesTrueSolarTime','birthTimezoneCorrection','pillarsAvailable','natalDayElement','natalStrongestElement','periodYearElement','periodMonthElement','groupCounts']) or
    c->>'calculationVersion' is distinct from 'local-pillar-approximation-v1' or c->'usesSolarTermApproximation' is distinct from 'true'::jsonb or c->'usesTrueSolarTime' is distinct from 'false'::jsonb or c->'birthTimezoneCorrection' is distinct from 'false'::jsonb then return false; end if;
  if ((c->>'precision'='date_only' and c->'pillarsAvailable'='3'::jsonb and c->'inputUsed'='["birthDate"]'::jsonb) or
    (c->>'precision'='date_time_local' and c->'pillarsAvailable'='4'::jsonb and c->'inputUsed'='["birthDate","birthTime"]'::jsonb)) is not true then return false; end if;
  foreach k in array array['natalDayElement','natalStrongestElement','periodYearElement','periodMonthElement'] loop
    if c->>k not in ('wood','fire','earth','metal','water') or jsonb_typeof(c->k) is distinct from 'string' then return false; end if;
  end loop;
  if not public.symbolic_keys_v1(c->'groupCounts',array['peer','expression','resource','responsibility','support']) then return false; end if;
  foreach k in array array['peer','expression','resource','responsibility','support'] loop
    if jsonb_typeof(c->'groupCounts'->k) is distinct from 'number' then return false; end if;
    if (c->'groupCounts'->>k)::numeric < 0 or (c->'groupCounts'->>k)::numeric > 20 then return false; end if;
  end loop;
  if jsonb_typeof(f->'dimensions') is distinct from 'array' or jsonb_array_length(f->'dimensions')<>5 or jsonb_typeof(f->'limitations') is distinct from 'array' or jsonb_array_length(f->'limitations') not between 3 and 8 then return false; end if;
  for i in 0..4 loop
    d:=f->'dimensions'->i;
    if not public.symbolic_keys_v1(d,array['key','label','value','summary','ruleId','sourceRefs','limitations']) or d->>'key' is distinct from expected[i+1] or d->>'ruleId' is distinct from rules[i+1] or
      jsonb_typeof(d->'sourceRefs') is distinct from 'array' or jsonb_array_length(d->'sourceRefs') not between 1 and 3 or jsonb_typeof(d->'limitations') is distinct from 'array' or jsonb_array_length(d->'limitations') not between 1 and 5 then return false; end if;
    foreach k in array array['label','value','summary'] loop if jsonb_typeof(d->k) is distinct from 'string' then return false; end if; end loop;
    for s in select value from jsonb_array_elements(d->'sourceRefs') loop
      if jsonb_typeof(s) is distinct from 'string' or s#>>'{}' not in ('natal_stem_counts','natal_day_element','current_year_month','element_relation_table','calendar_period') then return false; end if;
    end loop;
    for s in select value from jsonb_array_elements(d->'limitations') loop if jsonb_typeof(s) is distinct from 'string' then return false; end if; end loop;
  end loop;
  for s in select value from jsonb_array_elements(f->'limitations') loop if jsonb_typeof(s) is distinct from 'string' then return false; end if; end loop;
  foreach k in array array['key','referenceDate','structureKey','timezone','granularity'] loop if jsonb_typeof(f->'referencePeriod'->k) is distinct from 'string' then return false; end if; end loop;
  -- Generated text cannot carry raw source dates, identifiers, addresses or controls.
  for s in select v from jsonb_path_query(f #- '{referencePeriod,referenceDate}', 'strict $.** ? (@.type() == "string")') as q(v) loop
    k:=s#>>'{}';
    if length(k) not between 1 and 600 or k ~ '[[:cntrl:]@]' or k ~ '[0-9]{4}-[0-9]{2}-[0-9]{2}' or k ~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' then return false; end if;
  end loop;
  return true;
exception when others then return false;
end $$;
alter table public.symbolic_lens_snapshots add constraint symbolic_lens_frame_contract check (public.valid_symbolic_frame_v1(frame));
