# Cache Invalidation

The Nitro fallback uses `Netlify-Cache-ID`; the Cloudflare data API uses the equivalent `Cache-Tag`. Stable deploy-scoped files, like `/catalog/index.json`, should not get a custom cache ID.

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

- Approved searchable-attribute feedback: purge `item-search` plus touched `item-detail-{id}`.
- Pinecone republish/reindex, taxonomy change, localized search-data change, search ranking/response deployment, or full catalog release: purge `item-search`.
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

Tracker clients always send `lang`. The Cloudflare search API requires it and includes it in the canonical cache identity. Retained Nitro routes may still resolve the locale header or cookie for older callers.

## Commands

The CLI loads `.env` and requires `NETLIFY_SITE_ID` plus `NETLIFY_AUTH_TOKEN`.
When `CLOUDFLARE_CACHE_PURGE_URL` and `CLOUDFLARE_DATA_TOKEN` are
configured, Worker-owned catalog tags are also purged from the Cloudflare data
API. Other tags remain Netlify-only. During the cutover, catalog tags are sent
to both configured caches so the Nitro rollback routes do not retain stale data.

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
