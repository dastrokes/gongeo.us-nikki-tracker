# Main DB Reference (`fimzdbqulflilnnopibz`)

Condensed tracker-side schema contract for LLM/agent context. Executable global-stat and tier-list aggregation SQL is owned by the backup workflow repository.

Canonical source for expanded query notes:

- `C:\Users\dastrokes\Dev\git\gongeo.us-data-processor\docs\database-query-reference.md`
- `C:\Users\dastrokes\Dev\git\gongeo.us-db-backup\sql\supabase\global-banner-stats.sql`
- `C:\Users\dastrokes\Dev\git\gongeo.us-db-backup\sql\supabase\generate-percentile-data.sql`
- `C:\Users\dastrokes\Dev\git\gongeo.us-db-backup\sql\supabase\generate-tierlist-data.sql`

## Functions

- `public.generate_tierlist_data()`

Global-stat generators and refresh functions, including `generate_percentile_data()`, run in the backup workflow's disposable PostgreSQL database. They read raw stats from D1 `gongeous-stats` and banner config from D1 `gongeous`. Published global stats are served from D1.

Legacy Supabase objects `user_banner_stats`, `user_banner_stats_pearpal`, `user_banner_stats_view`, and `global_banner_config` are outside the active stats contract and pending retirement.

Community banner voting uses a dedicated Supabase project during an active poll. Completed rankings are served from the repository. See [banner vote operations](banner-vote/README.md).

## Tables

### `public.user_tierlists`

- `scope_type text` (allowed: `banners|outfits|items|momo|props`)
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

### `public.feedback_queue`

- `security_invoker` view over suggestions and aggregated votes.
- Exposes suggestion fields plus agree, disagree, score, and total-vote counts.
- Only `service_role` has `SELECT`; browser roles have no privileges.

## Explicit Indexes in Reference Schema

- `idx_feedback_suggestions_status_created` on `(status, created_at DESC)`
- `idx_feedback_suggestions_entity_status` on `(entity_type, entity_id, status, created_at DESC)`
- `idx_feedback_suggestions_changed_fields` GIN on `changed_fields`
- `idx_feedback_suggestions_open_entity` unique partial index on `(entity_type, entity_id)` where status is `open`
- `idx_feedback_votes_user` on `(user_id, updated_at DESC)`
