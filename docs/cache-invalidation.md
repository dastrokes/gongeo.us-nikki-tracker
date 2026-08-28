# Cache Invalidation

This app uses `Netlify-Cache-ID` as the purgeable cache identity for mutable cached responses. Stable deploy-scoped files, like `/catalog/index.json`, should not get a custom cache ID.

## IDs

| Area                            | Cache IDs                              |
| ------------------------------- | -------------------------------------- |
| Item search, facets, attributes | `item-search`                          |
| Item detail                     | `item-details`, `item-detail-{id}`     |
| Outfit detail                   | `outfit-details`, `outfit-detail-{id}` |
| Makeup detail                   | `makeup-details`, `makeup-detail-{id}` |
| Momo detail                     | `momo-details`, `momo-detail-{id}`     |
| Hashed catalog parts            | `catalog-assets`                       |
| Lookbook                        | `lookbook`                             |
| Stats                           | `stats`, `stats-banner-{id}`           |
| Images                          | `images`                               |
| Sitemaps                        | `sitemap`                              |

## Normal Purges

- Item-search publish or feedback apply: purge `item-search` plus touched `item-detail-{id}`.
- Feedback queue and viewer APIs: no purge; these responses are always `no-store`.
- Locale-only search publish: purge `item-search` only.
- Detail response logic change: purge the broad detail ID, such as `item-details`.
- Catalog index release: no purge; the deploy invalidates `/catalog/index.json`.
- Hashed catalog generation bug: purge `catalog-assets`.
- Lookbook decoder/source change: purge `lookbook`.
- One banner's stats change: purge `stats-banner-{id}`. The purge command first
  runs `refresh_global_banner_stats(id)` in the main Supabase project, then
  clears both `/api/global/{id}` variants and, for the latest banner,
  `/api/global`.

## Locale Variants

Localized detail and search APIs vary by query string, `X-Locale`, and `i18n_redirected`. Tracker clients should keep sending `lang`; the header and cookie are API fallbacks.

## Commands

The CLI loads `.env` and requires `NETLIFY_SITE_ID` plus `NETLIFY_AUTH_TOKEN`.

One-off purge:

```powershell
npm run purge -- item-search item-detail-1020780298
```

Sitemap purge:

```powershell
npm run purge -- sitemap
```

Single-banner stats purge (for example, `/api/global/72`):

```powershell
npm run purge -- stats-banner-72
```

If the Supabase refresh fails, the command stops without purging the cache, so
the existing cached response remains available rather than exposing stale
database output as freshly cached data.

Old identity cleanup after deploying this cache model:

```powershell
npm run purge -- game details catalog
```

Positional tags avoid npm 11 consuming the reserved `--tag value` option. The
equivalent `--tag=value` form is also supported.
