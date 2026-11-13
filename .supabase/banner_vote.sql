-- Current poll only. Archive and clear completed poll data before reuse.
-- Apply as the database owner. The current voting window is enabled.
begin;

create table if not exists public.banner_rankings (
  banner_id integer primary key,
  elo_rating numeric(18,8) not null default 1500,
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  updated_at timestamptz not null default now()
);
do $$
begin
  if (select format_type(atttypid, atttypmod) from pg_attribute
      where attrelid = 'public.banner_rankings'::regclass and attname = 'elo_rating') <> 'numeric(18,8)' then
    alter table public.banner_rankings
      alter column elo_rating type numeric(18,8) using elo_rating::numeric(18,8);
  end if;
end $$;

create table if not exists public.banner_votes (
  id uuid primary key default gen_random_uuid(),
  banner_id_1 integer not null,
  banner_id_2 integer not null,
  winner_id integer not null,
  voter_fingerprint text,
  created_at timestamptz not null default now()
);
alter table public.banner_votes
  add column if not exists request_id uuid,
  add column if not exists processing_order bigint generated always as identity;
create unique index if not exists banner_votes_request
  on public.banner_votes (voter_fingerprint, request_id)
  where request_id is not null;
create unique index if not exists banner_votes_processing_order
  on public.banner_votes (processing_order);
create index if not exists banner_votes_quota
  on public.banner_votes (voter_fingerprint, created_at desc);

-- Current roster through 2.11.2.
insert into public.banner_rankings (banner_id, elo_rating, wins, losses)
select id, 1500, 0, 0 from generate_series(42, 82) as id
on conflict (banner_id) do nothing;

alter table public.banner_votes enable row level security;
alter table public.banner_rankings enable row level security;
revoke all on public.banner_votes, public.banner_rankings from public, anon, authenticated;
grant select, insert, update, delete on public.banner_votes, public.banner_rankings to service_role;

-- Change these constants together with shared/utils/bannerVoteSeasons.ts.
-- A null closing date leaves voting open until it is disabled or a date is set.
create or replace function public.banner_vote_window()
returns table (enabled boolean, opens_at timestamptz, closes_at timestamptz)
language sql stable set search_path = ''
as $$ select true, '2026-10-22T01:14:37Z'::timestamptz, null::timestamptz $$;
revoke all on function public.banner_vote_window() from public, anon, authenticated;
grant execute on function public.banner_vote_window() to service_role;

create or replace function public.process_vote(
  p_banner_id_1 integer,
  p_banner_id_2 integer,
  p_winner_id integer,
  p_voter_fingerprint text,
  p_request_id uuid
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  previous public.banner_votes%rowtype;
  vote_window record;
  accepted integer;
  locked integer;
  winner_rating numeric;
  loser_rating numeric;
  change numeric;
  accepted_at timestamptz;
begin
  if p_banner_id_1 is null or p_banner_id_2 is null
    or p_winner_id is null or p_request_id is null
    or p_voter_fingerprint is null or length(btrim(p_voter_fingerprint)) not between 1 and 128
    or p_banner_id_1 = p_banner_id_2 or p_winner_id not in (p_banner_id_1, p_banner_id_2)
  then raise exception 'INVALID_VOTE'; end if;

  -- Shared for normal votes, exclusive for rebuild: permits concurrent voting.
  perform pg_advisory_xact_lock_shared(hashtextextended('banner-vote-maintenance', 0));
  perform pg_advisory_xact_lock(hashtextextended('banner-vote-quota:' || p_voter_fingerprint, 0));

  select * into previous from public.banner_votes
  where voter_fingerprint = p_voter_fingerprint and request_id = p_request_id;
  select count(*) into accepted from public.banner_votes
  where voter_fingerprint = p_voter_fingerprint
    and created_at > clock_timestamp() - interval '24 hours';

  if previous.request_id is not null then
    if previous.banner_id_1 <> p_banner_id_1 or previous.banner_id_2 <> p_banner_id_2 or previous.winner_id <> p_winner_id
    then raise exception 'REQUEST_CONFLICT'; end if;
    return jsonb_build_object('success', true, 'request_id', p_request_id, 'votes_remaining', greatest(0, 50 - accepted));
  end if;

  select * into vote_window from public.banner_vote_window();
  if not vote_window.enabled
    or vote_window.opens_at is null or clock_timestamp() < vote_window.opens_at
    or (vote_window.closes_at is not null and
      (vote_window.closes_at <= vote_window.opens_at or clock_timestamp() >= vote_window.closes_at))
  then raise exception 'VOTING_CLOSED'; end if;
  if accepted >= 50 then raise exception 'RATE_LIMIT'; end if;

  perform banner_id from public.banner_rankings
  where banner_id in (p_banner_id_1, p_banner_id_2)
  order by banner_id for update;
  get diagnostics locked = row_count;
  if locked <> 2 then raise exception 'INVALID_VOTE'; end if;

  accepted_at := clock_timestamp();
  if vote_window.closes_at is not null and accepted_at >= vote_window.closes_at then raise exception 'VOTING_CLOSED'; end if;
  select elo_rating into winner_rating from public.banner_rankings
    where banner_id = p_winner_id;
  select elo_rating into loser_rating from public.banner_rankings
    where banner_id = case when p_winner_id = p_banner_id_1 then p_banner_id_2 else p_banner_id_1 end;
  change := 32 * (1 - 1 / (1 + power(10::numeric, (loser_rating - winner_rating) / 400)));

  -- Identity order is allocated after both row locks. Overlapping matches replay
  -- in the order their ratings were updated; independent pairs commute.
  insert into public.banner_votes
    (banner_id_1, banner_id_2, winner_id, voter_fingerprint, request_id, created_at)
  values (p_banner_id_1, p_banner_id_2, p_winner_id, p_voter_fingerprint, p_request_id, accepted_at);
  update public.banner_rankings
  set elo_rating = round(elo_rating + case when banner_id = p_winner_id then change else -change end, 8),
      wins = wins + case when banner_id = p_winner_id then 1 else 0 end,
      losses = losses + case when banner_id = p_winner_id then 0 else 1 end,
      updated_at = accepted_at
  where banner_id in (p_banner_id_1, p_banner_id_2);
  return jsonb_build_object('success', true, 'request_id', p_request_id, 'votes_remaining', 49 - accepted);
end $$;
revoke all on function public.process_vote(integer, integer, integer, text, uuid) from public;
grant execute on function public.process_vote(integer, integer, integer, text, uuid) to anon, authenticated;

create materialized view if not exists public.banner_ranking_snapshots as
with stats as (
  select count(*) as votes, count(distinct voter_fingerprint) as voters
  from public.banner_votes
)
select 1 as id,
  coalesce((select jsonb_agg(jsonb_build_object(
    'banner_id', r.banner_id, 'elo_rating', r.elo_rating, 'wins', r.wins, 'losses', r.losses,
    'total_votes', r.wins + r.losses,
    'win_rate', case when r.wins + r.losses > 0 then r.wins::double precision / (r.wins + r.losses) else 0 end
  ) order by r.banner_id) from public.banner_rankings r), '[]'::jsonb) as rankings,
  jsonb_build_object(
    'totalVotes', stats.votes, 'totalVoters', stats.voters,
    'averageVotesPerVoter', case when stats.voters > 0 then stats.votes::double precision / stats.voters else 0 end
  ) as stats,
  statement_timestamp() as updated_at
from stats;
create unique index if not exists banner_ranking_snapshots_current on public.banner_ranking_snapshots (id);
revoke all on public.banner_ranking_snapshots from public, anon, authenticated;
grant select on public.banner_ranking_snapshots to service_role;

create or replace function public.rebuild_all_rankings(p_validate_only boolean default true)
returns jsonb language plpgsql set search_path = ''
as $$
declare
  ids integer[];
  ratings numeric[];
  rebuilt_wins integer[];
  rebuilt_losses integer[];
  vote record;
  live record;
  wi integer;
  li integer;
  i integer;
  change numeric;
  vote_window record;
  differences jsonb := '[]'::jsonb;
  replayed bigint := 0;
begin
  if p_validate_only is null then raise exception 'INVALID_REQUEST'; end if;
  perform pg_advisory_xact_lock(hashtextextended('banner-vote-maintenance', 0));
  select * into vote_window from public.banner_vote_window();
  if not p_validate_only and vote_window.enabled and clock_timestamp() >= vote_window.opens_at
    and (vote_window.closes_at is null or clock_timestamp() < vote_window.closes_at) then raise exception 'PAUSE_VOTING_BEFORE_REPAIR'; end if;
  select array_agg(banner_id order by banner_id) into ids from public.banner_rankings;
  if coalesce(array_length(ids, 1), 0) < 2 then raise exception 'MISSING_ROSTER'; end if;
  ratings := array_fill(1500::numeric, array[array_length(ids, 1)]);
  rebuilt_wins := array_fill(0, array[array_length(ids, 1)]);
  rebuilt_losses := array_fill(0, array[array_length(ids, 1)]);

  for vote in select * from public.banner_votes order by processing_order loop
    wi := array_position(ids, vote.winner_id);
    li := array_position(ids, case when vote.winner_id = vote.banner_id_1 then vote.banner_id_2 else vote.banner_id_1 end);
    if wi is null or li is null or wi = li or vote.winner_id not in (vote.banner_id_1, vote.banner_id_2) then raise exception 'INVALID_LEDGER'; end if;
    change := 32 * (1 - 1 / (1 + power(10::numeric, (ratings[li] - ratings[wi]) / 400)));
    ratings[wi] := round(ratings[wi] + change, 8);
    ratings[li] := round(ratings[li] - change, 8);
    rebuilt_wins[wi] := rebuilt_wins[wi] + 1;
    rebuilt_losses[li] := rebuilt_losses[li] + 1;
    replayed := replayed + 1;
  end loop;

  for i in 1..array_length(ids, 1) loop
    select * into live from public.banner_rankings where banner_id = ids[i];
    if live.elo_rating <> ratings[i] or live.wins <> rebuilt_wins[i] or live.losses <> rebuilt_losses[i] then
      differences := differences || jsonb_build_array(jsonb_build_object(
        'banner_id', ids[i],
        'stored', jsonb_build_object('elo', live.elo_rating, 'wins', live.wins, 'losses', live.losses),
        'rebuilt', jsonb_build_object('elo', ratings[i], 'wins', rebuilt_wins[i], 'losses', rebuilt_losses[i])
      ));
    end if;
    if not p_validate_only then
      update public.banner_rankings set elo_rating = ratings[i], wins = rebuilt_wins[i], losses = rebuilt_losses[i], updated_at = clock_timestamp()
      where banner_id = ids[i];
    end if;
  end loop;
  return jsonb_build_object('votes_replayed', replayed,
    'matches', jsonb_array_length(differences) = 0, 'differences', differences, 'repaired', not p_validate_only);
end $$;
revoke all on function public.rebuild_all_rankings(boolean) from public, anon, authenticated;
grant execute on function public.rebuild_all_rankings(boolean) to service_role;

notify pgrst, 'reload schema';
commit;

-- Manual refresh: refresh materialized view concurrently public.banner_ranking_snapshots;
-- Validate: select public.rebuild_all_rankings(true);
-- Repair (pause first): select public.rebuild_all_rankings(false);
-- Apply banner_ranking_refresh.sql to enable the Netlify scheduled refresh.

