-- Apply as the owner of public.banner_ranking_snapshots.
begin;

-- Rankings before the last refresh that had new votes; drives rank-change arrows.
create table if not exists public.banner_ranking_previous (
  id integer primary key,
  rankings jsonb not null
);
alter table public.banner_ranking_previous enable row level security;
revoke all on public.banner_ranking_previous from public, anon, authenticated;
grant select on public.banner_ranking_previous to service_role;

-- Reads only banner_rankings and the snapshot row, never the vote ledger.
-- A changed win total means new votes; a later updated_at or roster size covers
-- seeding and repairs. Hours without changes skip the refresh entirely.
create or replace function public.refresh_banner_ranking_snapshot()
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  snapshot record;
  live record;
begin
  select s.id, s.rankings, s.updated_at, (s.stats->>'totalVotes')::bigint as votes
  into snapshot from public.banner_ranking_snapshots s where s.id = 1;
  select coalesce(sum(r.wins), 0) as votes, count(*) as banners, max(r.updated_at) as updated_at
  into live from public.banner_rankings r;

  if snapshot.id is not null
    and live.votes = snapshot.votes
    and live.banners = jsonb_array_length(snapshot.rankings)
    and (live.updated_at is null or live.updated_at <= snapshot.updated_at)
  then return; end if;

  if snapshot.id is not null and live.votes <> snapshot.votes then
    insert into public.banner_ranking_previous (id, rankings)
    values (snapshot.id, snapshot.rankings)
    on conflict (id) do update set rankings = excluded.rankings;
  end if;
  refresh materialized view concurrently public.banner_ranking_snapshots;
end $$;

revoke all on function public.refresh_banner_ranking_snapshot()
  from public, anon, authenticated;
grant execute on function public.refresh_banner_ranking_snapshot()
  to service_role;

notify pgrst, 'reload schema';
commit;
