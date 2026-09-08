# Server and database rules

Read this guide for server endpoints, caching, locale resolution, Supabase, SQL, or database-ownership work.

## Project boundaries

- Main app and stats project `fimzdbqulflilnnopibz`: banner stats, global stats, tier-list data, and related user/stat endpoints.
- Game content project `mkvqvnlunfuyqrpbppiy`: item and outfit details, item-search facets, attribute matches, and catalog/domain content.
- Main-project environment variables: `SUPABASE_DATABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
- Content-project environment variables: `SUPABASE_DATA_URL`, `SUPABASE_DATA_SECRET_KEY`.
- Main DB reference: `.supabase/main_db_reference.md`.
- Content DB reference: `.supabase/data_db_reference.md`.
- Tracker-owned main DB SQL notes stay in `.supabase/`.
- Detailed content-DB queries and functions belong in the sibling `gongeo.us-data-processor` project. Keep tracker reference markdown condensed.
- Reference files are non-executable maps. Verify risky behavior against code, schemas, or APIs.

## Supabase clients

- App/client code uses `useSupabaseClient` from `app/composables/useSupabaseClient.ts`.
- Server code uses the auto-imported `useSupabaseServerClient` and `useSupabaseDataClient` from `server/utils/supabaseClient.ts`.
- Server code must not import Supabase helpers from `app/composables`.
- Use `withSupabaseRetry` and `isTransientSupabaseError` for transient Supabase or network failures.

## API invariants

- Prefer `defineCachedApiEventHandler` from `server/utils/cachedApi.ts` for cached public GET endpoints.
- Use `setCacheHeaders` from `shared/utils/cacheHeaders.ts` only when the handler cannot use `defineCachedApiEventHandler`.
- Include `getGameVersion()` in versioned cache keys.
- Use factories in `server/utils/apiErrors.ts` for common 400, 404, 500, and 503 errors.
- Normalize unknown errors with `toErrorMessage` before logging. Include relevant resource names and IDs in logs.
- Localized detail routes resolve locale with `resolveLocaleCode` and support query `lang`, header `X-Locale`, and cookie `i18n_redirected`.

## Relevant locations

- `server/api/`: Nitro endpoints
- `server/utils/`: server-only helpers
- `shared/utils/`: cross-runtime helpers
- `shared/types/`: shared types
- `.supabase/`: schemas, SQL notes, and condensed references
