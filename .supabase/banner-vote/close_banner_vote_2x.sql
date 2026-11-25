-- Run as the database owner on gongeous-vote when ready to close 2.x.
-- If a deadline is already configured, wait until it has passed.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '30s';
set local timezone = 'UTC';

-- Drain in-flight submissions and prevent new ones until the final refresh commits.
select pg_advisory_xact_lock(hashtextextended('banner-vote-maintenance', 0));

do $close$
declare
  vote_window record;
  cutoff timestamptz;
  validation jsonb;
begin
  select * into strict vote_window from public.banner_vote_window();
  cutoff := coalesce(vote_window.closes_at, clock_timestamp());
  if vote_window.opens_at is null or cutoff <= vote_window.opens_at then
    raise exception 'Invalid 2.x voting window';
  end if;
  if cutoff > clock_timestamp() then
    raise exception 'The scheduled 2.x deadline has not passed';
  end if;
  if (select array_agg(banner_id order by banner_id) from public.banner_rankings)
      is distinct from array(select generate_series(42, 82)) then
    raise exception 'The live roster is not the 2.x roster';
  end if;

  -- Preserve the installed opening time and any deadline that already passed.
  -- CREATE OR REPLACE keeps the owner's identity and existing function grants.
  execute format(
    'create or replace function public.banner_vote_window()
     returns table (enabled boolean, opens_at timestamptz, closes_at timestamptz)
     language sql stable set search_path = %L as %L',
    '',
    format('select false, %L::timestamptz, %L::timestamptz', vote_window.opens_at, cutoff)
  );

  validation := public.rebuild_all_rankings(true);
  if validation->>'matches' is distinct from 'true' then
    raise exception 'Ranking replay failed: %', validation;
  end if;
  if exists (select 1 from public.banner_votes where created_at >= cutoff) then
    raise exception 'Found an accepted vote at or after the closing timestamp';
  end if;
end $close$;

refresh materialized view concurrently public.banner_ranking_snapshots;

do $verify$
declare
  snapshot record;
begin
  select * into strict snapshot from public.banner_ranking_snapshots where id = 1;
  if jsonb_array_length(snapshot.rankings) is distinct from 41
    or (snapshot.stats->>'totalVotes')::bigint is distinct from
       (select count(*) from public.banner_votes)
    or (snapshot.stats->>'totalVoters')::bigint is distinct from
       (select count(distinct voter_fingerprint) from public.banner_votes)
  then
    raise exception 'Final snapshot totals do not match the vote ledger';
  end if;
end $verify$;

select w.opens_at, w.closes_at,
  jsonb_build_object('rankings', s.rankings, 'stats', s.stats, 'updated_at', s.updated_at) as archive
from public.banner_ranking_snapshots s
cross join public.banner_vote_window() w
where s.id = 1;

commit;
