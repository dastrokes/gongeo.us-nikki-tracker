# Data DB Reference (`mkvqvnlunfuyqrpbppiy`)

Condensed schema reference for LLM/agent context.

## Functions

- `public.list_items_sorted_page(...) -> table(id, quality, obtain_type)`
- `public.list_items(p_page integer default 1, p_page_size integer default 18, p_quality integer default null, p_type text default null, p_style_key varchar(16) default null, p_label_id integer default null, p_obtain_min integer default null, p_obtain_max integer default null, p_obtain_ids integer[] default null, p_category text default null, p_subcategory text default null, p_metadata jsonb default null) -> table(id, quality, type, props, style_key, tags, obtain_type, total_count)`
- `public.list_outfits_sorted_page(...) -> table(id, quality, obtain_type)`
- `public.search_items(p_query text, p_limit integer default 24, p_type text default null, p_category text default null, p_subcategory text default null) -> table(item_id, item_type, category, subcategory, score, metadata)`

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
- `search_text text`
- `metadata jsonb`
- `search_tsv tsvector` (generated from `search_text`)

### `public.item_translations`

- `item_id bigint` (PK part, FK -> `items.id`)
- `language_code varchar(10)` (PK part)
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

## Explicit Indexes in Reference Schema

- `idx_item_translations_language` on `item_translations(language_code)`
- `idx_items_obtain_type` on `items(obtain_type)`
- `idx_items_quality_type` on `items(quality, type)`
- `idx_items_style_key` on `items(style_key)`
- `idx_items_tags_gin` on `items(tags)` (GIN)
- `idx_items_type` on `items(type)`
- `idx_item_attributes_metadata` on `item_attributes(metadata)` (GIN)
- `idx_item_attributes_search_text_trgm` on `item_attributes(search_text)` (GIN trigram)
- `idx_item_attributes_search_tsv` on `item_attributes(search_tsv)` (GIN)
- `idx_item_attributes_type_category` on `item_attributes(item_type, category)`
- `idx_item_attributes_type_category_subcategory` on `item_attributes(item_type, category, subcategory)`
- `idx_outfit_items_item_id` on `outfit_items(item_id)`
- `idx_outfit_translations_language` on `outfit_translations(language_code)`
- `idx_outfits_quality_id` on `outfits(quality, id)`
- `idx_outfits_style_key` on `outfits(style_key)`
- `item_translations_item_id_idx` on `item_translations(item_id)`
- `outfit_items_outfit_id_idx` on `outfit_items(outfit_id)`
- `outfit_translations_outfit_id_idx` on `outfit_translations(outfit_id)`
- `outfits_obtain_type_idx` on `outfits(obtain_type)`
- `outfits_quality_idx` on `outfits(quality)`
