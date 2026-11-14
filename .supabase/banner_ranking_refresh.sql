-- Apply as the owner of public.banner_ranking_snapshots.
begin;

-- Rankings before the last refresh that had new votes; drives rank-change arrows.
create table if not exists public.banner_ranking_previous (
  id integer primary key,
  rankings jsonb not null
);
revoke all on public.banner_ranking_previous from public, anon, authenticated;
grant select on public.banner_ranking_previous to service_role;

create or replace function public.refresh_banner_ranking_snapshot()
returns void
language sql security definer set search_path = ''
as $$
  insert into public.banner_ranking_previous (id, rankings)
  select s.id, s.rankings from public.banner_ranking_snapshots s
  where exists (
    select 1 from public.banner_votes v where v.created_at > s.updated_at
  )
  on conflict (id) do update set rankings = excluded.rankings;
  refresh materialized view concurrently public.banner_ranking_snapshots;
$$;

revoke all on function public.refresh_banner_ranking_snapshot()
  from public, anon, authenticated;
grant execute on function public.refresh_banner_ranking_snapshot()
  to service_role;

notify pgrst, 'reload schema';
commit;
