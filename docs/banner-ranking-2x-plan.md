# Banner ranking implementation

Updated 2026-10-21. Local implementation and the main Supabase setup are available. See the [operations guide](../.supabase/banner_vote.md) for installed objects and verification.

Itzaland voting is enabled in SQL and locally, and selected by the short routes. No closing date is set. The site has not been deployed. Finalize the roster before publishing.

## Method

Reuse the 1.x flow: browser-selected 1v1 pairs, Supabase `process_vote`, hourly ranking refresh and on-demand `rebuild_all_rankings`. Community standings use win percentage; personal standings use Elo. Initial Elo is 1500 with K=32.

Keep the existing exposure/Elo opponent selection, recent-pair history and randomized left/right placement. Keep the 50-vote rolling 24-hour allowance per fingerprint. Skips are free and change no ratings or counters. Browser fingerprints and client-selected pairs retain the 1.x limitations against deliberate manipulation.

Include only banners that first debuted in 2.x. Exclude permanent banners and older reruns. The draft roster through 2.10.2 contains 38 banners, IDs 42–79; finalize it after 2.11.2.

## Storage and ownership

**Supabase stores only the current poll.** `banner_votes` holds the current ledger and retry UUIDs; `banner_rankings` holds the seeded roster, Elo and win/loss counters. One materialized-view row holds the hourly snapshot.

There are no season columns, season arguments or season tables in SQL. The frontend manifest maps routes to the live poll or static archives. Once a poll ends, export its final snapshot, add and verify its static archive, then remove its live database rows before the next poll.

All code and SQL remain tracker-owned. Supabase handles acceptance and aggregation; Nitro serves public reads; the browser handles pairing and personal data. D1 and the backup repository are not involved.

## Routes and entry points

| Route               | Result                                                                           |
| ------------------- | -------------------------------------------------------------------------------- |
| `/ranking`, `/vote` | Current selected season; switch to 2.x when it opens and retain it after closure |
| `/ranking/1x`       | Existing static 1.x archive                                                      |
| `/ranking/2x`       | Upcoming, live, then archived 2.x results                                        |
| `/vote/:season`     | Community voting while live; personal voting remains available                   |

Add one landing card after the hero and a Community navigation entry. Keep the UI to a title, season selector, compact state badge and relevant controls. Show the fair-voting notice during active community voting and one timestamp on the ranking page. Explain the daily limit when it is reached.

Personal data and pair history stay separate by season/mode. Preserve legacy 1.x personal data.

## Vote processing and refresh

`process_vote` validates the window, fingerprint, distinct seeded opponents and winner. It uses a fixed K factor, checks quota under a fingerprint lock, returns existing retry receipts, locks ranking rows in ID order, and inserts/updates atomically. Table writes and raw fingerprints remain private.

Refresh the public snapshot hourly; do not replay the ledger hourly. The snapshot includes Elo/exposure for pairing and win percentage for display. Public reads cache for one hour in Nitro and Netlify's durable CDN cache; the combined layers can delay visibility of a refreshed snapshot by roughly two hours. Ranking pages fetch on entry/reload or mode changes, with no background polling. Consecutive vote pairs reuse a local snapshot for up to ten minutes.

`rebuild_all_rankings()` validates the complete current ledger in recorded order. Repair requires paused voting. Finalize and archive the snapshot before clearing completed data.

## Rollout and verification

1. Finalize the first-debut roster and UTC voting window after 2.11.2.
2. The current-poll setup is installed in the main project. The provisional SQL/frontend roster has 38 banners; update both together after the final debut.
3. Hourly cron is installed and voting is enabled. Refresh and validate the finalized roster before publication.
4. Deploy the short-route switch at opening.
5. At closure, validate, refresh, archive and verify the archive before clearing database rows.

Verify invalid/closed votes, quota enforcement, retry deduplication, reversed-pair locking, replay/repair agreement, archived reads after live-data deletion, and local personal-data isolation. Use temporary verification scripts and run lint after code changes.

## Historical references

Repository commits `e7956088` (pairing), `e0977190` (win-percentage community standings), `f97f2114` (direct RPC), and `8b2a61cf` (static archive) establish the baseline.

The supplied [process_vote.sql](https://drive.google.com/file/d/1LDw33lon99-azqTLjVGJRHv6-ZRaMPF6/view) and [rebuild_all_rankings](https://drive.google.com/file/d/1isSB7n7c5PwbNCay99YjOmxvKolh1eHB/view) informed the implementation. The 1.x archive has 40 banners and 177,381 votes. Its raw ledger was not replayed. Main-project schema, grants and Cron were inspected before installation; no prior banner-voting objects existed.
