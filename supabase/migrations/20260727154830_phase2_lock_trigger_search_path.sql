-- Keep the pre-existing timestamp trigger deterministic under the security advisor.
alter function public.set_updated_at() set search_path = public;
