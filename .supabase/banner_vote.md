# Banner vote operations

The dedicated Supabase project `gongeous-vote` (`mlkhcalrpdyimgshjvwv`) hosts the live banner poll. The original voting schema on `fimzdbqulflilnnopibz` was removed after cutover verification. Completed results are static archives. Raw votes and live rankings can be exported and cleared after archiving.

## Setup and opening

1. Confirm the previous poll is archived. Inspect the installed table definitions, triggers and dependent views before applying [banner_vote.sql](banner_vote.sql). The current setup enables voting with no automatic closing date.
2. For a fresh poll, start with empty `banner_votes` and `banner_rankings` tables and apply the SQL as the database owner. It seeds the current roster.
3. Keep UTC dates and enabled flags matched in `banner_vote_window()` and `shared/utils/bannerVoteSeasons.ts`. A null closing date keeps voting open. The seeded ranking rows are the allowed roster.
4. Refresh results manually when needed. The RPC also keeps the previous ranking for rank-change arrows:

   ```sql
   select public.refresh_banner_ranking_snapshot();
   ```

5. At opening, deploy `CURRENT_BANNER_VOTE_SEASON = '2x'`. `LIVE_BANNER_VOTE_SEASON` identifies the poll stored in Supabase; explicit older routes read their archive. Confirm the roster matches the manifest.

The RPC accepts five arguments: banner 1, banner 2, winner, fingerprint and request UUID. It enforces the voting window, eligibility, 50 accepted votes per rolling 24 hours, and retry deduplication. A receipt at the cap includes `retry_after_ms`. Over-limit requests return HTTP 400 with `RATE_LIMIT` and the wait in milliseconds in `details`, without raising a PostgreSQL exception. The browser disables community voting until that wait expires. Skips stay local and free.

The public API serves the single snapshot row (`id = 1`) for the live poll. Archived routes use `shared/data/bannerRankingArchives.ts`. The API checks that returned banner IDs match the requested roster, so a replaced database poll cannot be shown as an older result.

The refresh never reads `banner_votes`, to save Supabase disk IO. Vote totals come from `banner_rankings` wins, and voter totals from `banner_voters`. The RPC skips the refresh when the win total, roster size and latest ranking `updated_at` are unchanged. After a repair, refresh the view directly as shown below.

Before refreshing, the RPC copies the current rankings into `banner_ranking_previous` when new votes arrived since the snapshot. The API returns them as `previous_rankings`, and the ranking page shows up/down arrows against them.

Netlify caches ranking responses for one hour. Nitro reads the Supabase snapshot on a CDN miss, so a Netlify purge can pick up a fresh snapshot immediately. Voting reuses its browser snapshot for up to ten minutes when selecting new pairs.

To publish a snapshot early, refresh it in Supabase first, then run `npm run purge -- banner-ranking-2x` with `NETLIFY_SITE_ID` and `NETLIFY_AUTH_TOKEN` set. This tag covers both the default request and the explicit 2.x request when both resolve to 2.x.

Apply [banner_ranking_refresh.sql](banner_ranking_refresh.sql) after `banner_vote.sql` on the vote project. Set `VOTE_SUPABASE_URL` and `VOTE_SUPABASE_PUBLISHABLE_KEY` for Netlify Builds. Store `VOTE_SUPABASE_SECRET_KEY` in Netlify for the ranking API runtime. Get the secret from the vote project's API Keys dashboard and store it in Netlify.

Snapshots are refreshed manually. After an early refresh, use `npm run purge -- banner-ranking-2x` to publish it before the one-hour cache expires. Disable the old `banner-ranking-hourly` Supabase job if it is still active.

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

## Current readiness

Originally installed on the main project `fimzdbqulflilnnopibz` on 2026-10-21 under migration `setup_current_banner_vote`. The live 2.x roster covers IDs 42–82 through version 2.11.2. The poll has no scheduled closing date.

The original setup verified anonymous voting, retry deduplication, request conflicts, roster and fingerprint validation, the rolling 50-vote allowance and expiry, private raw data and admin functions, replay agreement, and the repair pause guard. The setup tests rolled back all 51 test votes.

The security advisor reports the intended no-policy RLS tables and publicly executable `SECURITY DEFINER` voting endpoint. Raw tables and the snapshot have no browser-role access; only `process_vote` can accept anonymous writes. See the [RLS advisory](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) and [anonymous function advisory](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

Wishfield remains archived. The short routes select Itzaland.
