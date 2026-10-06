begin;
-- The query output needs an explicit alias; otherwise the fail-closed matcher
-- rejects even a valid bundle. Preserve every source/time and causal guard.
create or replace function public.formal_run_bundle_matches_reservation(p_bundle jsonb,p_source jsonb,p_accepted timestamptz,p_start timestamptz,p_horizon integer)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare lens jsonb:=p_source->'symbolic_lens'; provenance jsonb; item jsonb; causal jsonb;
begin
  if not public.formal_run_bundle_matches_reservation_before_symbolic(p_bundle,p_source,p_accepted,p_start,p_horizon) then return false; end if;
  if p_source->>'symbolic_lens_version'='bounded-fusion-static-v1' then return true; end if;
  if p_source->>'symbolic_lens_version' is distinct from 'formal-symbolic-run-v1'
    or not public.valid_frozen_symbolic_run_v1(lens,(p_source#>>'{relation_graph_snapshots,user_id}')::uuid,p_accepted)
    then return false; end if;
  causal:=p_bundle-array['symbolicLensSnapshot','strategyPaths'];
  provenance:=lens->'provenance';
  for item in select v from jsonb_path_query(causal,'strict $.** ? (@.type() == "string")') as q(v) loop
    if item='"symbolic_lens"'::jsonb or item in (provenance->'sourceId',provenance->'snapshotId',provenance->'storageConsentId',provenance->'calculationConsentId',provenance->'futureAttachmentConsentId') then return false; end if;
  end loop;
  if p_bundle#>'{inputSnapshot}' ?| array['symbolicLens','symbolicLensSnapshot','birthDate','birthTime'] then return false; end if;
  return true;
exception when others then return false;
end $$;
revoke all on function public.formal_run_bundle_matches_reservation(jsonb,jsonb,timestamptz,timestamptz,integer) from public,anon;
grant execute on function public.formal_run_bundle_matches_reservation(jsonb,jsonb,timestamptz,timestamptz,integer) to authenticated;
commit;
