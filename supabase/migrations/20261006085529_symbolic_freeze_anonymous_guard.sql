begin;
create or replace function public.freeze_symbolic_run_lens_v1(p_owner_id uuid,p_at timestamptz) returns jsonb
language plpgsql stable security invoker set search_path=public,pg_temp as $$
declare pref record; period jsonb:=public.symbolic_calendar_period_v1(p_at); result jsonb; state text;
begin
  -- Explicit anonymous claims cannot create new symbolic snapshots. Missing
  -- flags on older legal tokens stay compatible; owner identity is mandatory.
  if p_owner_id is null or (current_user<>'service_role' and (auth.uid() is distinct from p_owner_id or auth.jwt()->>'is_anonymous'='true'))
    then raise exception using errcode='42501',message='unauthenticated'; end if;
  if period is null then raise exception 'invalid_symbolic_input'; end if;
  select p.revision,p.storage_consent,p.calculation_consent,p.future_attachment_consent,p.source_id,p.source_version,p.current_snapshot_id,
    s.frame,s.version,s.writer_version,s.calculation_consent_id,b.storage_consent_id,
    cs.status as storage_status,cs.consent_type as storage_type,cs.source as storage_source,
    cc.status as calculation_status,cc.consent_type as calculation_type,cc.source as calculation_source,
    cf.id as future_id,cf.status as future_status,cf.source as future_source,cf.consent_type as future_type,cf.metadata as future_metadata
    into pref from public.symbolic_lens_preferences p
    left join public.symbolic_birth_sources b on b.id=p.source_id and b.user_id=p.user_id and b.source_version=p.source_version
    left join public.symbolic_lens_snapshots s on s.id=p.current_snapshot_id and s.user_id=p.user_id and s.source_id=p.source_id and s.source_version=p.source_version
    left join public.consent_events cs on cs.id=b.storage_consent_id and cs.user_id=p.user_id
    left join public.consent_events cc on cc.id=s.calculation_consent_id and cc.user_id=p.user_id
    left join public.consent_events cf on cf.id=p.future_attachment_consent_id and cf.user_id=p.user_id
    where p.user_id=p_owner_id;
  if not found then state:='not_configured';
  elsif not pref.storage_consent or not pref.calculation_consent then state:='withdrawn';
  else
    if pref.frame is null or not public.valid_symbolic_frame_v1(pref.frame) or pref.frame->>'sourceVersion' is distinct from pref.source_version::text
      or pref.storage_status is distinct from 'active' or pref.storage_type is distinct from 'symbolic_storage' or pref.storage_source is distinct from 'formal_symbolic_lens_v1'
      or pref.calculation_status is distinct from 'active' or pref.calculation_type is distinct from 'symbolic_calculation' or pref.calculation_source is distinct from 'formal_symbolic_lens_v1'
      then raise exception 'symbolic_source_invalid'; end if;
    if pref.frame#>>'{referencePeriod,key}' is distinct from period->>'key' or pref.frame#>>'{referencePeriod,structureKey}' is distinct from period->>'structureKey'
      then state:='stale';
    elsif not pref.future_attachment_consent then state:='not_authorized';
    else
      if pref.future_id is null or pref.future_status is distinct from 'active' or pref.future_type is distinct from 'symbolic_future_attachment'
        or pref.future_source is distinct from 'formal_symbolic_future_attachment_v1' or pref.future_metadata->>'version' is distinct from 'symbolic-future-attachment-v1'
        or pref.future_metadata->>'revision' is distinct from pref.revision::text or pref.future_metadata->>'source_id' is distinct from pref.source_id::text
        or pref.future_metadata->>'source_version' is distinct from pref.source_version::text or pref.future_metadata->>'snapshot_id' is distinct from pref.current_snapshot_id::text
        then raise exception 'symbolic_consent_required'; end if;
      state:='attached';
    end if;
  end if;
  result:=jsonb_build_object('version','formal-symbolic-run-v1','classification','symbolic_lens','causalUse',false,
    'status',state,'frozenAt',to_char(p_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'assessedPeriod',period,
    'preferenceRevision',coalesce(pref.revision,0),'frame',null,'provenance',null);
  if state='attached' then result:=result||jsonb_build_object('frame',pref.frame,'provenance',jsonb_build_object(
    'ownerId',p_owner_id,'sourceId',pref.source_id,'sourceVersion',pref.source_version,'snapshotId',pref.current_snapshot_id,
    'snapshotVersion',pref.version,'writerVersion',pref.writer_version,'storageConsentId',pref.storage_consent_id,
    'calculationConsentId',pref.calculation_consent_id,'futureAttachmentConsentId',pref.future_id,
    'consentVersion','symbolic-future-attachment-v1','consentRevision',pref.revision)); end if;
  return result;
end $$;
revoke all on function public.freeze_symbolic_run_lens_v1(uuid,timestamptz) from public,anon;
grant execute on function public.freeze_symbolic_run_lens_v1(uuid,timestamptz) to authenticated,service_role;
commit;
