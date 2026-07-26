# Item Search Operations: Tracker

`gongeo.us-nikki-tracker` owns item-search taxonomy, curated overrides, localization, Supabase/Pinecone publishing, the published local mirror, and cache invalidation. `gongeo.us-image-search` owns extraction and canonical JSONL generation.

Use `$review-item-search-batches` for the cross-project batch review/correction workflow, taxonomy and metadata review rules, historical-normalizer audits, exact override validation, localization gates, and post-publish checks. This document covers tracker-owned operations only.

## Source of truth

- [data/item-search/registry.mjs](../data/item-search/registry.mjs): registered fields and scoped values.
- [data/item-search/terms.json](../data/item-search/terms.json): canonical shared terms.
- [data/item-search/taxonomy.json](../data/item-search/taxonomy.json): category/subcategory parent mappings.
- `app/locales/<locale>/filter.json`: filter labels.
- [scripts/item-search-registry-lib.mjs](../scripts/item-search-registry-lib.mjs): generated asset writer.

Operational state under `data/item-search/generated/` is gitignored and rebuildable:

- `image-search-taxonomy.json`: export consumed by image-search.
- `overrides.json`: accepted complete-row override snapshots plus `audit`.
- `supabase/item-attributes.jsonl`: local mirror of published Supabase rows.
- `reports/publish/latest.json` and `publish-*.json`: publish reports.
- `reports/publish/staging/*.jsonl`: scoped staged publish rows.

Canonical rows are `{ item_id, item_type, category, subcategory, metadata }`. Metadata must not repeat identity fields.

## Operational scripts

- [scripts/generate_filters.mjs](../scripts/generate_filters.mjs): regenerate tracker constants, locale filter schemas, and the image-search taxonomy export.
- [scripts/sync-item-search-terms-from-attributes.mjs](../scripts/sync-item-search-terms-from-attributes.mjs): dry-run or apply missing terms and taxonomy from a reviewed canonical artifact.
- [scripts/item-search-publish.mjs](../scripts/item-search-publish.mjs): publish to Supabase and Pinecone, refresh the local mirror, invalidate caches, and write a report.
- [scripts/refresh-item-search-local-copy.mjs](../scripts/refresh-item-search-local-copy.mjs): refresh the Supabase mirror without publishing.
- [scripts/item-search-feedback.mjs](../scripts/item-search-feedback.mjs): list, promote, reject, or mark community suggestions applied.

Keep these runtime scripts in tracker. Reusable read-only review and validation helpers live in `$review-item-search-batches`.

## Registry and localization

Regenerate derived assets after registry, taxonomy, term, or locale-schema changes:

```powershell
node scripts/generate_filters.mjs
```

This writes:

- `data/attribute.json`
- `shared/constants/itemSearchRegistry.ts`
- `shared/constants/itemSearchTaxonomy.ts`
- `app/locales/*/filter.json`
- `data/item-search/generated/image-search-taxonomy.json`

Image-search validates that every registered subcategory has one registered parent and that removed subcategories have no stale mappings.

Dry-run term/taxonomy changes before applying them:

```powershell
node scripts/sync-item-search-terms-from-attributes.mjs --dry-run --item-attributes-path ../gongeo.us-image-search/index/item-attributes.jsonl
```

Resolve synonyms, field ownership, parent conflicts, and ungrouped subcategories before running the command without `--dry-run`. Use `--prune` only with a reviewed full-catalog artifact.

For accepted new values, add reviewed native labels in every supported locale and keep each `filter.json` schema/key order aligned with English. Skip locale edits when no new field/value ownership is introduced.

## Curated overrides

Store complete canonical rows plus `audit` in `data/item-search/generated/overrides.json`. Merge existing curation and increment revision/timestamp once per accepted batch; do not edit the published mirror directly.

Use `$review-item-search-batches` to assert that pending override IDs equal the approved batch and to create a temporary fully overlaid artifact for registry dry-run. Preparation is not permission to publish.

## Publish

Required environment:

- `SUPABASE_DATA_URL`
- `SUPABASE_DATA_SECRET_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_HOST`
- `NETLIFY_SITE_ID`
- `NETLIFY_AUTH_TOKEN`

Common scopes:

- `full`: verified full-catalog artifact.
- `types`: already type-filtered artifact.
- `item-ids`: artifact containing exactly the requested IDs.
- `refresh-only`: already scoped refresh artifact.
- `locales-only`: republish Pinecone localization from the current mirror.
- `feedback-selected`: promote and publish selected feedback.
- `pending-overrides`: publish every accepted override that differs from the current mirror.

For an approved curated batch:

```powershell
node scripts/item-search-publish.mjs --scope pending-overrides
```

For a verified full artifact:

```powershell
node scripts/item-search-publish.mjs --scope full --item-attributes-path ../gongeo.us-image-search/index/item-attributes.jsonl
```

For an already scoped small artifact:

```powershell
node scripts/item-search-publish.mjs --scope item-ids --item-id <id1> --item-id <id2> --item-attributes-path ../gongeo.us-image-search/index/item-attributes.jsonl
```

Safety invariants:

- Publishing is allowed only after explicit user approval.
- Every supplied row is published; `types`, `item-ids`, and `refresh-only` do not filter a larger file.
- Every generated-artifact publish overlays matching canonical overrides before upload.
- Use `pending-overrides` instead of a manual curated ID list.
- Use `full` only with a verified full-catalog artifact.
- `--help` is safe; unknown options fail before environment loading or network access.

Successful publish writes Supabase, Pinecone `en` and `zh`, the refreshed local mirror, cache invalidation, and timestamped reports. Verify exact touched IDs, expected counts, empty `failedItems`, zero remaining pending overrides, and a clean registry dry-run.

## Local mirror

Refresh without publishing:

```powershell
node scripts/refresh-item-search-local-copy.mjs
```

Flags:

- `--output-root <path>`: alternate output directory.
- `--page-size <n>`: Supabase pagination size.

Copy the refreshed mirror to image-search `manifest/item-attributes.jsonl` when manifest generation should skip already published IDs.

## Feedback

```powershell
node scripts/item-search-feedback.mjs
node scripts/item-search-feedback.mjs promote --feedback-id <id> --maintainer <name>
node scripts/item-search-feedback.mjs reject --feedback-id <id> --maintainer <name>
```

Statuses are `open`, `accepted`, `applied`, and `rejected`. Promotion merges the patch into overrides. Publishing normally marks accepted feedback applied after successful sync.

## Data flow

1. Tracker generates the shared taxonomy export.
2. Image-search uses it during extraction and normalization.
3. Image-search produces reviewed canonical rows.
4. Tracker overlays accepted curation and publishes canonical rows.
5. Tracker derives localized Pinecone records, refreshes the mirror, and invalidates caches.
