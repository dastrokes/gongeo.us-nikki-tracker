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

Replaced image purge:

Cloudflare edge-caches cdn images, `/images/*` and `/.netlify/images*` for one
year, so Netlify purges do not reach it. After replacing an image under the same
name, purge its cdn path and the transformed variants. A prefix purge covers every
query-string variant, and it needs `CLOUDFLARE_ZONE_ID` plus
`CLOUDFLARE_ZONE_PURGE_TOKEN`. The Free plan allows 5 prefix purge requests per
minute, with up to 100 prefixes per request.

```powershell
npm run purge -- --prefix=cdn.gongeo.us/images/outfits/10366.png --prefix=gongeo.us/.netlify/images
```

Browsers keep images for 30 days, so prefer a new file name for visible fixes.

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
