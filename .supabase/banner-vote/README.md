# Banner vote operations

Wishfield (1.x) and Itzaland (2.x) are closed. Both results are static archives. The short routes and homepage tile show Itzaland, and Personal mode remains available.

## Retire the 2.x project

1. Verify that the deployed 2.x archive shows 41 banners, 64,970 votes, and 1,467 voters. Verify the 1.x archive and the homepage tile.
2. Export all `banner_votes` columns, including `processing_order`. Verify the CSV against the final vote and voter counts and keep it privately outside Supabase. Keep a schema dump if you need an exact copy of the deployed database definitions.
3. When retiring the project, use only the dedicated 2.x project `gongeous-vote` (`mlkhcalrpdyimgshjvwv`). Remove its `VOTE_SUPABASE_*` variables from Netlify and local configuration. The main app project `fimzdbqulflilnnopibz` continues to serve the rest of the site. The hourly Netlify ranking function was removed.

## Open the next season

1. Create a dedicated Supabase project for the new poll. Update the seed roster and UTC window in [banner_vote.sql](banner_vote.sql) for the new season before applying it. The checked-in template contains the historical 2.x roster and an enabled window. Keep the new window disabled or set its opening time in the future during setup.
2. Apply the updated schema as the database owner, then apply [banner_ranking_refresh.sql](banner_ranking_refresh.sql). Start with an empty vote ledger. Confirm that the snapshot contains the expected roster and zero votes. Use a separate test database or a rolled-back transaction to test submissions and replay.
3. Add the new season ID, roster, and UTC dates in [bannerVoteSeasons.ts](../../shared/utils/bannerVoteSeasons.ts), including its route validation and localized season caption. Add the new explicit vote and ranking routes to the prerender list in [nuxt.config.ts](../../nuxt.config.ts). Keep `banner_vote_window()` and the frontend dates and flags aligned. Set `LIVE_BANNER_VOTE_SEASON` to the new database poll and switch `CURRENT_BANNER_VOTE_SEASON` when the new poll opens.
4. Set the new project URL and publishable key as `VOTE_SUPABASE_URL` and `VOTE_SUPABASE_PUBLISHABLE_KEY` in Netlify Builds. Set `VOTE_SUPABASE_SECRET_KEY` in Netlify Functions.
5. Verify the current vote and ranking routes, both explicit archive routes, and Personal mode. After opening, confirm an accepted community vote and publish a fresh snapshot. Use the new season ID in the cache tag.

## Implementation

- [Season manifest](../../shared/utils/bannerVoteSeasons.ts) and [archive registry](../../shared/data/bannerRankingArchives.ts)
- [Community voting composable](../../app/composables/useBannerVote.ts), [Personal voting composable](../../app/composables/usePersonalVote.ts), and [rankings API](../../server/api/vote/rankings.get.ts)
- [Homepage tile](../../app/components/LandingBannerVote.vue) and [shared vote and ranking header](../../app/components/BannerVoteSeasonHeader.vue)
- [Historical 2.x implementation plan](banner-ranking-2x-plan.md)

The RPC accepts five arguments: banner 1, banner 2, winner, fingerprint and request UUID. It enforces the voting window, eligibility, 50 accepted votes per rolling 24 hours, and retry deduplication. A receipt at the cap includes `retry_after_ms`. Over-limit requests return HTTP 400 with `RATE_LIMIT` and the wait in milliseconds in `details`, without raising a PostgreSQL exception. The browser disables community voting until that wait expires. Skips stay local and free.

The public API serves the single snapshot row (`id = 1`) for the live poll. Archived routes use `shared/data/bannerRankingArchives.ts`. The API checks that returned banner IDs match the requested roster, so a replaced database poll cannot be shown as an older result.

The refresh never reads `banner_votes`, to save Supabase disk IO. Vote totals come from `banner_rankings` wins, and voter totals from `banner_voters`. The RPC skips the refresh when the win total, roster size and latest ranking `updated_at` are unchanged. After a repair, refresh the view directly as shown below.

Before refreshing, the RPC copies the current rankings into `banner_ranking_previous` when new votes arrived since the snapshot. The API returns them as `previous_rankings`, and the ranking page shows up/down arrows against them.

Netlify caches ranking responses for one hour. Nitro reads the Supabase snapshot on a CDN miss, so a Netlify purge can pick up a fresh snapshot immediately. Voting reuses its browser snapshot for up to ten minutes when selecting new pairs.

Refresh the live snapshot with `select public.refresh_banner_ranking_snapshot();`. To publish it before the one-hour cache expires, run `npm run purge -- banner-ranking-<season-id>` with `NETLIFY_SITE_ID` and `NETLIFY_AUTH_TOKEN` set. The tag covers both the short and explicit URLs when they resolve to the same season.

## Move the live poll

1. Install both schemas on the vote project with `banner_vote_window()` disabled there. When the Netlify deployment is ready, take the `banner-vote-maintenance` advisory transaction lock on the main project and disable its window to drain in-flight votes.
2. Copy `banner_rankings`, `banner_votes`, `banner_voters`, and `banner_ranking_previous`. Insert the ledger with `OVERRIDING SYSTEM VALUE` to preserve its identity values, alongside the original vote IDs, request UUIDs and timestamps. Reset the identity sequence after the highest copied order.
3. Compare the tables and win totals, and confirm `rebuild_all_rankings(true)` reports a match. Refresh the materialized view directly so the first refresh preserves the copied previous rankings.
4. Once the new deployment is live, enable the original window dates on the vote project and leave the main project's window disabled. Verify a real vote and `/api/vote/rankings`, then refresh and purge a snapshot when needed. Keep the source tables for verification and rollback until cleanup is approved.

## Validate and repair

```sql
select public.rebuild_all_rankings();       -- Compare only.
select public.rebuild_all_rankings(false);  -- Repair; pause voting first.
refresh materialized view concurrently public.banner_ranking_snapshots;
```

Rebuild replays the entire current ledger from Elo 1500/K=32 in processing order. It reports counter/rating differences. Repair updates the current ranking rows under a maintenance lock. The function refuses repair while voting is open.

For a pause, set the SQL window's enabled flag to false and update the frontend flag. Preserve the dates when resuming. Accepted request UUIDs still return their receipt after pause or closure.

## Close, archive, and clear

1. For a scheduled close, set the confirmed UTC deadline in the deployed `banner_vote_window()` and in the `2x` manifest's `closesAt`. Preserve the installed opening time. Deploy the manifest with `enabled: true` and `archived: false` so it switches to Closed at the deadline while the ranking route still reads the database.
2. At close, run [close_banner_vote_2x.sql](close_banner_vote_2x.sql) as the database owner on `gongeous-vote`. With no scheduled deadline, running this file closes voting immediately. With a scheduled deadline, it refuses to run early. It drains in-flight votes, verifies Elo against the ledger, and refreshes and returns the final public snapshot in one transaction. A failed validation rolls back the transaction. The Supabase SQL Editor can run the complete file and return the export.
3. Run `npm run purge -- banner-ranking-2x` and verify that `/api/vote/rankings?season=2x` serves the final totals. Save the returned `archive` object and keep a private raw vote backup if needed.
4. Add the final snapshot as a static archive factory in `shared/data/bannerRankingArchives.ts`, following the existing 1.x archive. Set the manifest's `closesAt` to the returned cutoff, `enabled: false`, and `archived: true`. Verify both `/ranking` and `/ranking/2x` serve the final results. The short routes can remain on 2.x until the next poll opens.
5. When retiring the completed data after verifying the archive and backup, clear the live tables:

   ```sql
   truncate table public.banner_votes, public.banner_rankings, public.banner_voters, public.banner_ranking_previous restart identity;
   refresh materialized view concurrently public.banner_ranking_snapshots;
   ```

The next poll reuses the same tables, RPC and snapshot. Update the live manifest ID, purge tag, roster and dates before reopening voting.

## 2.x closeout record

The 2.x roster covers IDs 42–82 through version 2.11.2. Community voting closed server-side on 2026-11-25 at 22:20:39 UTC. The final Elo replay matched the ledger, and the verified snapshot contained 64,970 votes from 1,467 voters across 41 banners.

The original setup verified anonymous voting, retry deduplication, request conflicts, roster and fingerprint validation, the rolling 50-vote allowance and expiry, private raw data and admin functions, replay agreement, and the repair pause guard. The setup tests rolled back all 51 test votes.

The security advisor reports the intended no-policy RLS tables and publicly executable `SECURITY DEFINER` voting endpoint. Raw tables and the snapshot have no browser-role access; only `process_vote` can accept anonymous writes. See the [RLS advisory](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) and [anonymous function advisory](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

Wishfield remains archived. The short routes select Itzaland.
