# Data DB Reference (`mkvqvnlunfuyqrpbppiy`)

Condensed schema reference for LLM/agent context.

Canonical source for detailed SQL/query behavior:

- `C:\Users\dastrokes\Dev\git\gongeo.us-data-processor\scripts\create-schema.sql`
- `C:\Users\dastrokes\Dev\git\gongeo.us-data-processor\docs\database-query-reference.md`

## Functions

- `public.list_items(...)` returns paged item rows plus `total_count`; supports quality/type/style/label/obtain/category/subcategory/metadata filters.
- `public.list_item_facets(...)` returns item facet groups/keys/values for the current filter selection.
- `public.list_makeups(...)` returns paged makeup rows plus `total_count`; supports quality/type/style/obtain filters.
- `public.list_momo(...)` returns paged momo rows plus `total_count`; supports quality/obtain filters.
- `public.list_outfits(...)` returns paged outfit rows plus `total_count`; supports quality/style/label/obtain filters.

## Tables

### `public.items`

- `id bigint` (PK)
- `quality integer`
- `type varchar(50)` (default `unknown`)
- `props integer[]`
- `style_key varchar(16)`
- `tags integer[]`
- `obtain_type integer`

### `public.item_attributes`

- `item_id bigint` (PK, FK -> `items.id`)
- `item_type varchar(50)`
- `category text`
- `subcategory text`
- `metadata jsonb` (canonical item search metadata used by item details, facets, and result payloads)

### `public.item_translations`

- `item_id bigint` (PK part, FK -> `items.id`)
- `language_code varchar(10)` (PK part)
- `description text`

### `public.momo`

- `id bigint` (PK)
- `quality integer`
- `obtain_type integer`

### `public.momo_translations`

- `momo_id bigint` (PK part, FK -> `momo.id`)
- `language_code varchar(10)` (PK part)
- `name text`
- `description text`

### `public.outfits`

- `id bigint` (PK)
- `quality integer`
- `props integer[]`
- `style_key varchar(16)`
- `tags integer[]`
- `obtain_type integer`

### `public.outfit_translations`

- `outfit_id bigint` (PK part, FK -> `outfits.id`)
- `language_code varchar(10)` (PK part)
- `description text`

### `public.outfit_items`

- `outfit_id bigint` (PK part, FK -> `outfits.id`)
- `item_id bigint` (PK part, FK -> `items.id`)

## Key Indexes

- `items`: `type`, `(quality, type)`, `style_key`, `obtain_type`, `tags` (GIN)
- `item_attributes`: `(item_type, category)`, `(item_type, category, subcategory)`, `metadata` (GIN)
- `item_translations`: `language_code`, `item_id`
- `momo`: `quality`, `obtain_type`
- `momo_translations`: `language_code`, `momo_id`
- `outfits`: `(quality, id)`, `quality`, `style_key`, `obtain_type`
- `outfit_translations`: `language_code`, `outfit_id`
- `outfit_items`: `item_id`, `outfit_id`
