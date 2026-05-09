# Item Search Workflows

`gongeo.us-nikki-tracker` is the maintainer entrypoint for item-search taxonomy, curated overrides, feedback review, and publishing. `gongeo.us-image-search` is the build worker that consumes the generated tracker export and produces structured rows plus Pinecone-ready documents.

## Source Of Truth

- Canonical registry lives in [data/item-search/registry.mjs](../data/item-search/registry.mjs).
- Canonical taxonomy and shared terms live in [data/item-search/taxonomy.json](../data/item-search/taxonomy.json) and [data/item-search/terms.json](../data/item-search/terms.json).
- Maintainer override snapshots live in [data/item-search/generated/overrides.json](../data/item-search/generated/overrides.json).
- Generated tracker and image-search outputs are written by [scripts/item-search-registry-lib.mjs](../scripts/item-search-registry-lib.mjs).

`data/item-search/generated/` is an operational output directory and is gitignored.

Important split:

- `data/item-search/registry.mjs`, `taxonomy.json`, and `terms.json` are maintainer-owned source inputs.
- `scripts/*.mjs` are handwritten operational source code and should stay tracked.
- `data/item-search/generated/` contains runtime artifacts, snapshots, and reports and should not be committed.

## Generated Directory Layout

Current generated paths:

- [data/item-search/generated/image-search-taxonomy.json](../data/item-search/generated/image-search-taxonomy.json): tracker export consumed by `gongeo.us-image-search`.
- [data/item-search/generated/overrides.json](../data/item-search/generated/overrides.json): accepted maintainer override snapshot with `audit` metadata.
- `data/item-search/generated/supabase/item-attributes.jsonl`: tracker-owned local mirror of the current Supabase `item_attributes` table.
- `data/item-search/generated/reports/publish/latest.json`: most recent publish summary.
- `data/item-search/generated/reports/publish/publish-*.json`: immutable per-run publish reports.
- `data/item-search/generated/reports/publish/staging/*.jsonl`: temporary staged item rows used by override-only or feedback-selected publishes.

Treat everything in this tree as rebuildable operational state.

## Script Roles

Main scripts:

- [scripts/generate_filters.mjs](../scripts/generate_filters.mjs): regenerates tracker-side derived assets from the canonical registry and taxonomy.
- [scripts/item-search-publish.mjs](../scripts/item-search-publish.mjs): JS-only publish entrypoint that reads an already-built `item-attributes.jsonl`, syncs Supabase, syncs Pinecone, refreshes the local copy, and writes a publish report.
- [scripts/item-search-feedback.mjs](../scripts/item-search-feedback.mjs): review CLI for community suggestions; it lists suggestions, promotes them into overrides, rejects them, or marks them applied.
- [scripts/refresh-item-search-local-copy.mjs](../scripts/refresh-item-search-local-copy.mjs): manual CLI wrapper that refreshes the current Supabase `item_attributes` rows into the generated local mirror.
- [scripts/sync-item-search-terms-from-attributes.mjs](../scripts/sync-item-search-terms-from-attributes.mjs): maintainer helper that reads a canonical `item-attributes.jsonl`, adds missing registry/taxonomy terms, regenerates derived assets, and only refreshes `app/locales/en/filter.json`.

## Generated Assets

Run:

```bash
node scripts/generate_filters.mjs
```

This regenerates:

- [data/attribute.json](../data/attribute.json)
- [shared/constants/itemSearchRegistry.ts](../shared/constants/itemSearchRegistry.ts)
- [shared/constants/itemSearchTaxonomy.ts](../shared/constants/itemSearchTaxonomy.ts)
- `app/locales/*/filter.json`
- [data/item-search/generated/image-search-taxonomy.json](../data/item-search/generated/image-search-taxonomy.json)

## Publish Entry Point

Use [scripts/item-search-publish.mjs](../scripts/item-search-publish.mjs) for the tracker-side publish step. It does not run Python or invoke `gongeo.us-image-search`. Instead, it reads an already-generated canonical `item-attributes.jsonl`, syncs Supabase, syncs Pinecone, and writes a report under `data/item-search/generated/reports/publish/`.

Each publish also refreshes a tracker-owned local copy of the synced `item_attributes` dataset under `data/item-search/generated/supabase/`.

Canonical local copy:

- `item-attributes.jsonl`: the only persisted final artifact

Canonical row shape:

- `{ item_id, item_type, category, subcategory, metadata }`
- `metadata` contains only actual tagging fields for that item type
- `metadata` does not repeat `item_id`, `item_type`, `slot`, `category`, or `subcategory`
- search documents and Pinecone payload rows are derived in memory from this file

Common scopes:

- `full`: publish an already-generated full canonical dataset.
- `types`: publish an already-generated type-filtered dataset.
- `item-ids`: publish an already-generated item-id-filtered dataset.
- `refresh-only`: publish an already-generated refresh output without rerunning extraction from tracker.
- `locales-only`: skip Supabase and only republish Pinecone namespaces from existing final metadata.
- `feedback-selected`: promote selected feedback suggestions into overrides, then run the minimal item-id publish.

Useful flags:

- `--item-attributes-path <path>`: explicit path to the canonical JSONL file to publish.
- `--output-root <path>`: directory containing `item-attributes.jsonl` when `--item-attributes-path` is not supplied.
- `--overrides-only`: skip image-search extraction and sync directly from staged override rows; only valid with `item-ids` and `feedback-selected`.

Examples:

```bash
node scripts/item-search-publish.mjs --scope full
node scripts/item-search-publish.mjs --scope full --item-attributes-path ../gongeo.us-image-search/index/item-attributes.jsonl
node scripts/item-search-publish.mjs --scope types --type dresses --type headwear --item-attributes-path ../gongeo.us-image-search/index/item-attributes.jsonl
node scripts/item-search-publish.mjs --scope item-ids --item-id 120034 --item-id 120035 --item-attributes-path ../gongeo.us-image-search/index/item-attributes.jsonl
node scripts/item-search-publish.mjs --scope refresh-only --type hair --item-attributes-path ../gongeo.us-image-search/index/item-attributes.jsonl
node scripts/item-search-publish.mjs --scope locales-only --namespace en --namespace zh
node scripts/item-search-publish.mjs --scope feedback-selected --feedback-id 123 --feedback-id 456
node scripts/refresh-item-search-local-copy.mjs
```

Publish report behavior:

- Every publish writes `latest.json` plus a timestamped `publish-*.json`.
- Reports include requested scope inputs, touched item ids, final row count, Supabase sync summary, Pinecone sync summary, local-copy export summary, promoted feedback ids, and the item-attributes source path that was published.
- Override-only publishes stage temporary JSONL rows under `data/item-search/generated/reports/publish/staging/`.

## Split Workflow

Recommended separation between tracker JS and image-search Python:

1. In `gongeo.us-data-processor`, refresh upstream items/outfits and locale name sources.
2. In `gongeo.us-image-search`, run the Python tagging pipeline to build or refresh canonical `item-attributes.jsonl`.
3. In `gongeo.us-nikki-tracker`, review the generated artifact, collapse near-duplicate terms where needed, sync tracker taxonomy/terms, regenerate localized filter assets, then publish.

## Upstream Preconditions

Before rebuilding image-search artifacts, make sure the upstream source repos are aligned:

1. Run `gongeo.us-data-processor/scripts/sync-database.ts`.
2. Run `gongeo.us-data-processor/scripts/populate-i18n.ts`.
3. Only then run the `gongeo.us-image-search` manifest or index workflow.

Normal contract:

- upstream `items` / `outfits` and locale `item.json` / `outfit.json` should already reflect the current curated item set
- image-search should produce a clean canonical `item-attributes.jsonl`
- tracker should treat artifact review, token collapse, taxonomy sync, and localization sync as part of the standard publish path

## Artifact Review Checklist

Before publish, review the current `gongeo.us-image-search/index/item-attributes.jsonl` for:

1. duplicate `item_id` rows
2. empty rows with no category, subcategory, or metadata
3. weak one-token search rows
4. near-duplicate or overly specific tokens that should collapse to an existing canonical term
5. registry drift via `node scripts/sync-item-search-terms-from-attributes.mjs --dry-run --item-attributes-path ../gongeo.us-image-search/index/item-attributes.jsonl`
6. cross-field ownership cases where the same concept appears under multiple fields and should be normalized to one canonical owner before backfill
7. field reuse cases where an existing token is now appearing under a new field and therefore still needs tracker/localization backfill

If the dry-run reports shared or scoped term additions, run the non-dry backfill before publish so tracker taxonomy, filter labels, and image-search tokens stay aligned.

When reviewing new tokens, distinguish between:

- genuinely new concepts, such as a new ornament or subcategory value
- existing words reused under a new field, which still require tracker and localization updates for that field
- near-synonyms that should collapse to an existing canonical token before backfill

Typical collapse questions:

- does the new token express the same concept as an existing canonical token with only narrower wording (`binder_clip` vs `clip`)?
- does the new token deserve its own searchable concept (`tambourine`) or is it just a phrasing variant?
- is the distinction important for search and filtering, or only for visual description?

Typical ownership questions:

- if a concept already exists in tracker, which field should own it long-term?
- is the current artifact introducing the same concept under a second field (`mesh`, `cross`, `filigree`, `paper`)?
- should the concept move into an existing owner field, or should the source token be dropped entirely?

## Review-First Workflow

For a normal search-artifact update, the main maintainer workflow is:

1. Refresh upstream data and locale source files in `gongeo.us-data-processor`.
2. Rebuild the canonical `item-attributes.jsonl` in `gongeo.us-image-search`.
3. Run the tracker dry-run:

```bash
node scripts/sync-item-search-terms-from-attributes.mjs --dry-run --item-attributes-path ../gongeo.us-image-search/index/item-attributes.jsonl
```

4. Review the reported new terms, scoped values, and taxonomy parents.
5. Normalize cross-field ownership in `gongeo.us-image-search` so one concept belongs to one canonical field before tracker backfill.
6. Collapse near-synonyms or over-specific values in `gongeo.us-image-search` when a simpler canonical token is better.
7. Run the non-dry tracker sync to backfill canonical terms/taxonomy.
8. Regenerate tracker-side derived assets so `filter.json`, registry constants, and `data/attribute.json` match the canonical token set.
9. Verify localization coverage for the affected filter fields and namespaces, keeping locale schema and key order aligned with English.
10. Publish from tracker to Supabase and Pinecone.

This review/collapse/backfill/localization loop is the default workflow. Treat it as the normal path, not a special cleanup path.

Tracker-side preparation:

```bash
node scripts/generate_filters.mjs
```

Typical Python-side commands in `gongeo.us-image-search`:

```bash
python cli.py index --output-root index --manifest-root manifest --regen-manifest
python cli.py index --output-root index --manifest-root manifest --type dresses --type headwear
python cli.py index --output-root index --manifest-root manifest --item-ids 120034 120035
python cli.py refresh --output-root index --type hair
```

If `manifest/item-attributes.jsonl` exists, manifest generation uses its `item_id` values to skip already-published items. That file accepts the same canonical row shape as tracker's generated Supabase mirror.

Typical JS-side publish commands in `gongeo.us-nikki-tracker`:

```bash
node scripts/item-search-publish.mjs --scope full --item-attributes-path ../gongeo.us-image-search/index/item-attributes.jsonl
node scripts/item-search-publish.mjs --scope item-ids --item-id 120034 --item-id 120035 --item-attributes-path ../gongeo.us-image-search/index/item-attributes.jsonl
node scripts/item-search-publish.mjs --scope locales-only --namespace en --namespace zh
```

For a normal game update with new upstream items, the usual flow is:

1. Run `gongeo.us-data-processor/scripts/sync-database.ts`.
2. Run `gongeo.us-data-processor/scripts/populate-i18n.ts`.
3. Run `node scripts/generate_filters.mjs` if tracker taxonomy or terms changed.
4. Optionally run `node scripts/refresh-item-search-local-copy.mjs` and copy `data/item-search/generated/supabase/item-attributes.jsonl` to `../gongeo.us-image-search/manifest/item-attributes.jsonl` if you want the Python manifest step to skip already-published items.
5. Run the Python `index` workflow in `gongeo.us-image-search`.
6. Run `node scripts/sync-item-search-terms-from-attributes.mjs --dry-run --item-attributes-path ../gongeo.us-image-search/index/item-attributes.jsonl`.
7. Review the artifact for cross-field ownership, then collapse near-duplicate tokens before accepting new tracker terms.
8. Run the non-dry term/taxonomy sync when the canonical token set looks right.
9. Regenerate tracker-side derived assets and confirm localization coverage plus locale-schema parity for the affected filter fields.
10. Publish the resulting `item-attributes.jsonl` with `node scripts/item-search-publish.mjs --scope full --item-attributes-path ../gongeo.us-image-search/index/item-attributes.jsonl`.
11. Check `data/item-search/generated/reports/publish/latest.json` and `data/item-search/generated/supabase/item-attributes.jsonl`.

## Local Copy Refresh

Use [scripts/refresh-item-search-local-copy.mjs](../scripts/refresh-item-search-local-copy.mjs) when you want to refresh the tracker-owned local mirror without running a full publish.

What it does:

- Reads all `item_attributes` rows from the data Supabase project.
- Normalizes each row into the canonical `{ item_id, item_type, category, subcategory, metadata }` shape.
- Writes `item-attributes.jsonl` into `data/item-search/generated/supabase/` by default.
- Removes older stale files such as `item-structured-final.jsonl`, `item-search-documents.jsonl`, and `item-search-snapshot.jsonl` from that output directory.

Flags:

- `--output-root <path>`: write the exported local mirror to a different directory.
- `--page-size <n>`: control the Supabase pagination size for the export.

How publish uses it:

- `locales-only` publish reads from a freshly exported local copy instead of running image-search extraction.
- Other publish scopes refresh the local copy after Supabase and Pinecone sync complete.

## Feedback Review

Use [scripts/item-search-feedback.mjs](../scripts/item-search-feedback.mjs) to review and promote community suggestions from Supabase.

Examples:

```bash
node scripts/item-search-feedback.mjs
node scripts/item-search-feedback.mjs promote --feedback-id 123 --maintainer dastrokes
node scripts/item-search-feedback.mjs reject --feedback-id 123 --maintainer dastrokes
node scripts/item-search-feedback.mjs mark-applied --feedback-id 123 --maintainer dastrokes
```

Status meaning:

- `open`: queued for maintainer review.
- `accepted`: promoted into generated overrides but not yet published.
- `applied`: published to Supabase and Pinecone.
- `rejected`: declined by maintainer review.

Feedback command notes:

- Default command is `list`.
- `promote` merges the selected feedback patch into `data/item-search/generated/overrides.json` and records `audit.feedbackSuggestionIds`.
- `reject` only changes feedback status in Supabase.
- `mark-applied` is normally handled by publish after a successful sync, but can be run directly if needed.
- `--output <path>` writes the JSON result of the feedback command to a file.

## Maintainer Workflows

Manual override for one item:

1. Edit or create [data/item-search/generated/overrides.json](../data/item-search/generated/overrides.json) using the same canonical row shape plus `audit`.
2. Run `node scripts/item-search-publish.mjs --scope item-ids --item-id <id>`.
3. Verify the item in Supabase-backed detail/facet flows and Pinecone-backed search.

Community feedback intake:

1. Review suggestions with `node scripts/item-search-feedback.mjs`.
2. Promote selected suggestions into overrides.
3. Publish with `--scope feedback-selected` or `--scope item-ids`.
4. Confirm suggestions moved to `applied`.

Taxonomy or metadata-term change:

1. Edit the canonical registry or taxonomy files once.
2. Regenerate tracker-side generated assets.
3. Run the Python image-search pipeline with the affected scope.
4. Publish the resulting canonical JSONL from tracker.

Taxonomy or metadata-term backfill from generated attributes:

1. Refresh or provide a canonical `item-attributes.jsonl`.
2. Run `node scripts/sync-item-search-terms-from-attributes.mjs --dry-run` to inspect missing terms and parent conflicts.
3. Review whether any reported values should collapse to existing canonical tokens before tracker sync.
4. Run `node scripts/sync-item-search-terms-from-attributes.mjs` to update `data/item-search/terms.json`, `data/item-search/taxonomy.json`, generated registry assets, and English filter labels.
5. Review any reported `parentConflicts`; the script reports but does not overwrite existing parent mappings when the observed data disagrees with the registry.
6. Confirm that the affected locale `filter.json` files now include the accepted new field/value combinations.

Localization-only correction:

1. Update canonical labels in tracker-owned data.
2. Regenerate tracker-side generated assets.
3. Run `node scripts/item-search-publish.mjs --scope locales-only --namespace en --namespace zh`.

Normalization or document-format change:

1. Update image-search normalization or document-building logic.
2. Run the Python refresh workflow in `gongeo.us-image-search`.
3. Publish the refreshed canonical JSONL from tracker with `--scope refresh-only`.

## Data Flow

1. Tracker registry generates the shared taxonomy export.
2. Image-search uses that export to constrain extraction and normalization.
3. Image-search produces raw rows, normalized rows, and final canonical `item-attributes.jsonl` rows.
4. Tracker publish syncs canonical rows to Supabase and derives final localized Pinecone documents from those rows.

## Operational Notes

- Supabase and Pinecone are the only supported publish targets in this workflow.
- Unsupported item types must not appear in feedback edit surfaces until the tracker registry adds them.
- Routine publishes should use overwrite mode for deterministic sync behavior.
- Only `en` and `zh` are treated as reviewed Pinecone namespaces in the normal flow.
- Tracker publish assumes the canonical artifact has already been reviewed for token quality; it is not the place to decide synonym collapse after the fact.
