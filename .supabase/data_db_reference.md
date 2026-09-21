# Legacy Content Supabase Reference (`mkvqvnlunfuyqrpbppiy`)

Condensed rollback reference for LLM/agent context. This project is not the catalog source of truth: Cloudflare D1 owns persisted catalog data, the Worker owns public catalog reads, and the processor owns releases. Keep this map only while the Nitro fallback and legacy bootstrap paths remain.

Canonical source for detailed SQL/query behavior:

- `C:\Users\dastrokes\Dev\git\gongeo.us-data-processor\docs\database-query-reference.md`
- `C:\Users\dastrokes\Dev\git\gongeo.us-data-api\migrations\0001_initial.sql` (current D1 schema)

## Functions

- `public.list_item_facets(...)` is retained only for the Nitro rollback path.
- `public.list_item_attribute_ids(...)` is retained only for the Nitro rollback path.

Current catalog clients call `data.gongeo.us`; legacy Nitro detail routes query these tables only when the external data API is disabled.

## Legacy tables

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
- `version varchar(16)` (synced from the data-processor Momo metadata config)

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

### `public.momo_outfits`

- `momo_id bigint` (PK part, FK -> `momo.id`)
- `outfit_id bigint` (PK part, FK -> `outfits.id`)

### `public.makeups`

- `id bigint` (PK)
- `quality integer`
- `type varchar(50)` (default `unknown`)
- `style_key varchar(16)`
- `obtain_type integer`

### `public.makeup_translations`

- `makeup_id bigint` (PK part, FK -> `makeups.id`)
- `language_code varchar(10)` (PK part)
- `description text`

### `public.makeup_items`

- `full_makeup_id bigint` (PK part, FK -> `makeups.id`)
- `makeup_id bigint` (PK part, FK -> `makeups.id`)

### `public.makeup_outfits`

- `full_makeup_id bigint` (PK part, FK -> `makeups.id`)
- `outfit_id bigint` (PK part, FK -> `outfits.id`)

## Key Indexes

- `items`: `type`, `(quality, type)`, `style_key`, `obtain_type`, `tags` (GIN)
- `item_attributes`: `(item_type, category)`, `(item_type, category, subcategory)`, `metadata` (GIN)
- `item_translations`: `language_code`, `item_id`
- `momo`: `quality`, `obtain_type`, `version`
- `momo_translations`: `language_code`, `momo_id`
- `outfits`: `(quality, id)`, `quality`, `style_key`, `obtain_type`
- `outfit_translations`: `language_code`, `outfit_id`
- `outfit_items`: `item_id`, `outfit_id`
- `momo_outfits`: `momo_id`, `outfit_id`
- `makeups`: `type`, `(quality, type)`, `style_key`, `obtain_type`
- `makeup_translations`: `language_code`, `makeup_id`
- `makeup_items`: `makeup_id`
- `makeup_outfits`: `outfit_id`
