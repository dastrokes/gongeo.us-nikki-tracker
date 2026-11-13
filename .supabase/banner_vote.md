# Banner vote operations

The database holds only the current poll. Completed results are static archives; raw votes and live rankings can be exported and cleared after archiving.

## Setup and opening

1. Confirm the previous poll is archived. Inspect the installed table definitions, triggers and dependent views before applying [banner_vote.sql](banner_vote.sql). The current setup enables voting with no automatic closing date.
2. For a fresh poll, start with empty `banner_votes` and `banner_rankings` tables and apply the SQL as the database owner. It seeds the current roster.
3. Keep UTC dates and enabled flags matched in `banner_vote_window()` and `shared/utils/bannerVoteSeasons.ts`. A null closing date keeps voting open. The seeded ranking rows are the allowed roster.
4. Refresh results manually when needed:

   ```sql
   refresh materialized view concurrently public.banner_ranking_snapshots;
   ```

5. At opening, deploy `CURRENT_BANNER_VOTE_SEASON = '2x'`. `LIVE_BANNER_VOTE_SEASON` identifies the poll stored in Supabase; explicit older routes read their archive. Confirm the roster matches the manifest.

The RPC accepts five arguments: banner 1, banner 2, winner, fingerprint and request UUID. It enforces the voting window, eligibility, 50 accepted votes per rolling 24 hours, and retry deduplication. Skips stay local and free.

The public API serves the single snapshot row (`id = 1`) for the live poll. Archived routes use `shared/data/bannerRankingArchives.ts`. The API checks that returned banner IDs match the requested roster, so a replaced database poll cannot be shown as an older result.

Netlify caches ranking responses for one hour. Nitro reads the Supabase snapshot on a CDN miss, so a Netlify purge can pick up a fresh snapshot immediately. Voting reuses its browser snapshot for up to ten minutes when selecting new pairs.

To publish a snapshot early, refresh it in Supabase first, then run `npm run purge -- banner-ranking-2x` with `NETLIFY_SITE_ID` and `NETLIFY_AUTH_TOKEN` set. This tag covers both the default request and the explicit 2.x request when both resolve to 2.x.

Apply [banner_ranking_refresh.sql](banner_ranking_refresh.sql), then deploy with the existing `SUPABASE_DATABASE_URL` and `SUPABASE_SECRET_KEY` available to Netlify Functions. Netlify runs `refresh-banner-rankings` hourly. It waits for the database refresh to succeed, then purges the 2.x tag using Netlify's built-in credentials. Use **Run now** in the Netlify Functions dashboard to verify the first run, then disable the old `banner-ranking-hourly` Supabase job if it is still active.

## Validate and repair

```sql
select public.rebuild_all_rankings();       -- Compare only.
select public.rebuild_all_rankings(false);  -- Repair; pause voting first.
refresh materialized view concurrently public.banner_ranking_snapshots;
```

Rebuild replays the entire current ledger from Elo 1500/K=32 in processing order. It reports counter/rating differences. Repair updates the current ranking rows under a maintenance lock. The function refuses repair while voting is open.

For a pause, set the SQL window's enabled flag to false and update the frontend flag. Preserve the dates when resuming. Accepted request UUIDs still return their receipt after pause or closure.

## Close, archive, and clear

1. Let the SQL closing time stop new submissions. Disable the SQL flag and wait for outstanding votes by running rebuild validation.
2. Refresh once, then export `rankings`, `stats`, and `updated_at` together from `banner_ranking_snapshots`. Save a raw vote backup if desired.
3. Add the snapshot as a static archive factory in `shared/data/bannerRankingArchives.ts`, following the existing 1.x archive. Mark its manifest entry `archived = true` and deploy.
4. Verify the completed ranking route works from its static archive. Keep the short routes on that season until the next poll opens.
5. Remove the schedule from the Netlify function and deploy, then clear the completed database data:

   ```sql
   truncate table public.banner_votes, public.banner_rankings restart identity;
   refresh materialized view concurrently public.banner_ranking_snapshots;
   ```

The next poll reuses the same tables, RPC and snapshot. Update the live manifest ID, purge tag, roster and dates before restoring the schedule.

## Current readiness

Installed on the main project `fimzdbqulflilnnopibz` on 2026-10-21 under migration `setup_current_banner_vote`. Voting is enabled with no closing date.

Verified anonymous voting, retry deduplication, request conflicts, roster/fingerprint validation, the rolling 50-vote allowance and expiry, private raw data/admin functions, replay agreement, and the repair pause guard. All 51 test votes were rolled back; the installed ledger and snapshot start at zero votes. Manual concurrent refresh also succeeded.

The security advisor reports the intended no-policy RLS tables and publicly executable `SECURITY DEFINER` voting endpoint. Raw tables and the snapshot have no browser-role access; only `process_vote` can accept anonymous writes. See the [RLS advisory](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) and [anonymous function advisory](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

Wishfield remains archived. Itzaland uses the provisional roster through 2.10.2; add the final 2.11.2 banners to SQL and the frontend manifest before publishing. The short routes select Itzaland. The site has not been deployed.
