# Item search operations

This document covers the maintained review, taxonomy, localization, and publication flow for item-search attributes.

## Ownership

- `gongeo.us-image-search` owns extraction, normalization, and canonical item-attribute JSONL generation.
- `gongeo.us-nikki-tracker` owns the registry, taxonomy, curated overrides, filter localization, and feedback UI/workflow.
- `gongeo.us-data-processor` owns authoritative D1 and Pinecone publication.
- `gongeo.us-data-api` serves D1-backed facets/attribute matches and Pinecone-backed semantic search.

D1 is the persisted catalog source of truth. Do not publish new catalog state only to the secondary Supabase project.

## Maintained tracker inputs

- [data/item-search/registry.mjs](../data/item-search/registry.mjs): registered fields and scoped values.
- [data/item-search/terms.json](../data/item-search/terms.json): canonical shared terms.
- [data/item-search/taxonomy.json](../data/item-search/taxonomy.json): category/subcategory parent mappings.
- `app/locales/<locale>/filter.json`: localized filter labels.
- `data/item-search/generated/overrides.json`: accepted complete-row corrections waiting to be incorporated into an authoritative publish.

Generated files under `data/item-search/generated/` are rebuildable and ignored. The `supabase/item-attributes.jsonl` mirror and old publish reports describe the legacy publisher; they are not authoritative catalog backups.

Canonical rows are `{ item_id, item_type, category, subcategory, metadata }`. Metadata must not repeat identity fields.

## Review and preparation

Use `$game-data-update` for the four-project game-data workflow and its required item-search follow-up. Catalog publication does not require search attributes or Pinecone; this document covers the search work that can be completed later.

Keep review and publication separate:

- Review reports findings without changing data.
- Prepare writes only accepted corrections and required taxonomy/localization changes.
- Publish requires explicit approval.

For accepted new values, add reviewed native labels in every supported locale and keep each `filter.json` schema/key order aligned with English. Regenerate derived assets after registry, taxonomy, term, or locale-schema changes:

```powershell
node scripts/generate_filters.mjs
```

Dry-run registry changes against the reviewed full-catalog artifact:

```powershell
node scripts/sync-item-search-terms-from-attributes.mjs --dry-run --item-attributes-path ../gongeo.us-image-search/index/item-attributes.jsonl
```

Resolve synonyms, field ownership, parent conflicts, and ungrouped subcategories before applying changes. Use `--prune` only with a reviewed full-catalog artifact.

## Curated overrides

Store complete canonical rows plus `audit` in `data/item-search/generated/overrides.json`. Treat it as an active correction queue:

1. Remove semantically identical completed snapshots.
2. Investigate every older entry that still differs from the current published state.
3. Require every remaining field-level delta to be intentional.
4. Require the pending IDs to equal the approved batch exactly.

Export a fresh D1 baseline and use its D1-derived `item-attributes.jsonl`
as the published comparison. Create an overlaid reviewed artifact for validation
and separate search publication:

```powershell
node <skill>/scripts/check-prepared-overrides.mjs --published <D1-exported-item-attributes.jsonl> --attributes <reviewed-item-attributes.jsonl> --expect <id1>,<id2> --overlay-output C:/tmp/item-search-prepared.jsonl
node scripts/sync-item-search-terms-from-attributes.mjs --dry-run --item-attributes-path C:/tmp/item-search-prepared.jsonl
```

The candidate may be a reviewed partial batch. Existing D1-approved rows are
preserved unless their IDs are explicitly selected for replacement. Do not
interpret IDs absent from a partial batch as deletions.

## Authoritative publication

From `gongeo.us-data-processor`:

1. Export D1 and verify the export through an isolated local restore.
2. Generate a dry-run search publication plan using reviewed attribute JSONL,
   or omit it for a Pinecone-only catch-up from D1.
3. Repeat `--replace-item-id <id>` for every approved reviewed-attribute replacement.
4. Review the exact D1/Pinecone changes, source hash, and baseline revision.
5. Apply only after separate explicit approval using that revision and hash.

Example plan:

```powershell
npm run publish:search-attributes -- --backup reports/search-baseline.sql --item-attributes C:/tmp/item-search-prepared.jsonl --replace-item-id <id> --output reports/search-plan.json
```

Example apply:

```powershell
npm run publish:search-attributes -- --backup reports/search-baseline.sql --item-attributes C:/tmp/item-search-prepared.jsonl --replace-item-id <id> --output reports/search-release.json --apply --expected-revision <revision-from-plan> --expected-attributes-sha256 <sha256-from-plan>
```

The processor validates D1 and both Pinecone namespaces, advances
`content_state` only after validation, and purges item-detail/search cache
tags. Verify the report and D1-derived attributes before clearing completed
override entries. A later accepted feedback apply requires a fresh baseline.

## Approved user feedback

The normal accepted-feedback path is targeted rather than a full release:

1. The tracker authenticates the maintainer and loads the accepted suggestion from main Supabase.
2. The tracker reads current D1 state, builds localized search text on the server, and signs a short-lived, body-bound write ticket. The maintainer's browser relays the mutation to the Worker.
3. The Worker applies D1, updates Pinecone, advances the revision, and purges `item-detail-<id>` plus `item-search` idempotently.
4. The tracker conditionally marks the suggestion applied only after the Worker succeeds.

Do not use the legacy Supabase item-search publisher for this path.

## Legacy rollback tools

The following scripts remain only until the final secondary-Supabase backup and rollback retirement:

- `scripts/item-search-publish.mjs`
- `scripts/refresh-item-search-local-copy.mjs`
- the Supabase-backed modes in `scripts/item-search-feedback.mjs`

They must not be used as the normal production catalog publisher. Remove them with the secondary content project in Phase 6.

## Current data flow

1. Tracker generates registry/taxonomy assets.
2. Image-search extracts and normalizes reviewed canonical rows.
3. Tracker overlays accepted curation and validates taxonomy/localization.
4. The processor separately publishes reviewed attributes to D1 and
   reconciles Pinecone from D1-derived rows.
5. The Worker serves catalog/search requests and owns catalog cache invalidation.
