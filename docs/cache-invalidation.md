# Cache Invalidation

The Cloudflare data API uses `Cache-Tag` for catalog and stats responses. The tracker uses `Netlify-Cache-ID` for its remaining site-owned cached responses. Stable deploy-scoped files, like `/catalog/index.json`, should not get a custom cache ID.

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
| Stats                           | `stats`, `stats-{id}`                  |
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
- Published stats snapshot: purge `stats` after the D1 publication succeeds;
  this covers both full and summary responses.
- One banner's published stats change: purge `stats-{id}`; summary responses also
  carry `stats-0`, because they include core totals.

## Locale Variants

Tracker clients always send `lang`. The Cloudflare search API requires it and includes it in the canonical cache identity.

## Commands

The CLI loads `.env` and routes catalog and stats tags to the Cloudflare data API;
they require `CLOUDFLARE_CACHE_PURGE_URL` and `CLOUDFLARE_DATA_TOKEN`. Site-owned
tags are sent only to Netlify and require `NETLIFY_SITE_ID` plus
`NETLIFY_AUTH_TOKEN`. A catalog-only purge does not require Netlify credentials.

One-off purge:

```powershell
npm run purge -- item-search item-detail-1020780298
```

Sitemap purge:

```powershell
npm run purge -- sitemap
```

Single-banner stats purge:

```powershell
npm run purge -- stats-72
```

Complete published-stats purge:

```powershell
npm run purge -- stats
```

Purging only invalidates cached responses. Publish a validated D1 snapshot
before purging stats tags; the command no longer runs aggregation in Supabase.

Positional tags avoid npm 11 consuming the reserved `--tag value` option. The
equivalent `--tag=value` form is also supported.
