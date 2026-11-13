-- Apply as the owner of public.banner_ranking_snapshots.
begin;

create or replace function public.refresh_banner_ranking_snapshot()
returns void
language sql security definer set search_path = ''
as $$
  refresh materialized view concurrently public.banner_ranking_snapshots;
$$;

revoke all on function public.refresh_banner_ranking_snapshot()
  from public, anon, authenticated;
grant execute on function public.refresh_banner_ranking_snapshot()
  to service_role;

notify pgrst, 'reload schema';
commit;
