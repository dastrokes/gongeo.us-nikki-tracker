# Main DB Reference (`fimzdbqulflilnnopibz`)

Condensed schema reference for LLM/agent context.

Canonical source for expanded query notes:

- `C:\Users\dastrokes\Dev\git\gongeo.us-data-processor\docs\database-query-reference.md`
- `C:\Users\dastrokes\Dev\git\gongeo.us-nikki-tracker\.supabase\generate_percentile_data.sql`

## Functions

- `public.generate_global_banner_json_for_banner(...)`
- `public.generate_global_core_json()`
- `public.generate_percentile_data()`
- `public.generate_tierlist_data()`
- `public.refresh_global_banner_stats(...)`
- `public.refresh_global_banner_stats_all()`
- `public.refresh_global_core_stats()`

Generator helpers may exist behind these refresh functions, but are not app or cron entrypoints.

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

### `public.global_banner_config`

- `banner_id integer` (PK part)
- `banner_type smallint`
- `quality smallint` (PK part)
- `outfit_id text` (PK part)
- `item_count smallint`

### `public.user_tierlists`

- `scope_type text` (allowed: `banners|outfits|items|momo`)
- `scope_filters jsonb` (default `{}`)
- `voter_fingerprint text`
- `tiers_json jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`
- PK: `(scope_type, scope_filters, voter_fingerprint)`

### `public.feedback_suggestions`

- `id uuid` (PK)
- `entity_type text` (allowed: `item|outfit`)
- `entity_id bigint`
- `base_snapshot jsonb`
- `base_signature text`
- `proposed_patch jsonb`
- `changed_fields text[]`
- `status text` (allowed: `open|accepted|rejected|applied`)
- `apply_operation_id text` (nullable deterministic Worker operation ID)
- `apply_claim_token uuid` (nullable active serverless lease owner)
- `apply_claimed_at timestamptz`
- `apply_lease_expires_at timestamptz`
- `apply_attempt_count integer`
- `apply_last_error text`
- `applied_at timestamptz`
- `user_id uuid` (nullable FK -> `auth.users.id`, `ON DELETE SET NULL`)
- `created_at timestamptz`
- `updated_at timestamptz`
- RLS enabled; only `service_role` has table privileges

### `public.feedback_votes`

- `suggestion_id uuid` (PK part, FK -> `feedback_suggestions.id`, `ON DELETE CASCADE`)
- `user_id uuid` (PK part, FK -> `auth.users.id`, `ON DELETE CASCADE`)
- `vote_value smallint` (allowed: `-1|1`)
- `created_at timestamptz`
- `updated_at timestamptz`
- RLS enabled; only `service_role` has table privileges

## Views

### `public.user_banner_stats_view`

- Merges `user_banner_stats` and `user_banner_stats_pearpal`.
- Join key: `(uid, region, banner_id)`.
- Exposes derived `source_table` (`game` or `pearpal`).

### `public.feedback_queue`

- `security_invoker` view over suggestions and aggregated votes.
- Exposes suggestion fields plus agree, disagree, score, and total-vote counts.
- Only `service_role` has `SELECT`; browser roles have no privileges.

## Feedback functions

### `public.claim_feedback_suggestion_apply(uuid, uuid, integer)`

- Atomically claims only an `accepted` suggestion whose prior lease is absent or expired.
- Assigns the deterministic `feedback-apply-<suggestion-id>` operation ID, increments the attempt count, and grants a bounded 30–900 second lease.
- `SECURITY INVOKER`; only `service_role` can execute it.

## Explicit Indexes in Reference Schema

- `idx_user_global_stats_updated_at` on `public.user_global_stats(updated_at DESC)`
- `idx_feedback_suggestions_status_created` on `(status, created_at DESC)`
- `idx_feedback_suggestions_entity_status` on `(entity_type, entity_id, status, created_at DESC)`
- `idx_feedback_suggestions_changed_fields` GIN on `changed_fields`
- `idx_feedback_suggestions_open_entity` unique partial index on `(entity_type, entity_id)` where status is `open`
- `idx_feedback_suggestions_apply_operation` unique partial index on `apply_operation_id` where non-null
- `idx_feedback_votes_user` on `(user_id, updated_at DESC)`
