# Main DB Reference (`fimzdbqulflilnnopibz`)

Condensed schema reference for LLM/agent context.

## Functions

- `public.generate_first_item_json_for_banner(p_banner_id integer) -> jsonb`
- `public.generate_global_core_json() -> jsonb`
- `public.generate_percentile_data() -> jsonb`
- `public.generate_tierlist_data() -> jsonb`
- `public.refresh_global_banner_stats(p_banner_id integer) -> jsonb`
- `public.refresh_global_banner_stats_all() -> integer`
- `public.refresh_global_core_stats() -> jsonb`

## Tables

### `public.user_banner_stats`

- `uid text` (PK part)
- `region text` (PK part)
- `banner_id integer` (PK part)
- `banner_type integer`
- `total_pulls integer`
- `total_4star_items integer`
- `total_5star_items integer`
- `total_4star_pulls integer`
- `total_5star_pulls integer`
- `pulls_4star jsonb`
- `pulls_5star jsonb`
- `last_pull_time timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`
- `user_id text`

### `public.user_banner_stats_pearpal`

- Same column set as `public.user_banner_stats`
- PK: `(uid, region, banner_id)`

### `public.user_global_stats`

- `banner_id integer` (PK, check `banner_id >= 0`)
- `payload jsonb`
- `updated_at timestamptz`

### `public.user_tierlists`

- `scope_type text` (allowed: `banners|outfits|items`)
- `scope_filters jsonb` (default `{}`)
- `voter_fingerprint text`
- `tiers_json jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`
- PK: `(scope_type, scope_filters, voter_fingerprint)`

## Views

### `public.user_banner_stats_view`

- Combines `user_banner_stats` and `user_banner_stats_pearpal`.
- Join key: `(uid, region, banner_id)`.
- Chooses source row by `prefer_game` rule based on availability and `total_pulls`.
- Includes derived `source_table` (`game` or `pearpal`).

## Explicit Indexes in Reference Schema

- `idx_user_global_stats_updated_at` on `public.user_global_stats(updated_at DESC)`
