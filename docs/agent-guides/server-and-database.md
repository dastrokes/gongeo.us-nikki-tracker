# Server and database rules

Read this guide for server endpoints, caching, locale resolution, Supabase, SQL, or database-ownership work.

## Project boundaries

- Main app project `fimzdbqulflilnnopibz`: authentication, users, raw banner stats, installed aggregation objects, tier lists, feedback suggestions/votes, and feedback workflow state.
- Cloudflare D1 database `gongeous`: authoritative published global-stat and community tier-list snapshots plus item, outfit, makeup, Momo, reviewed attribute, listing-filter, and content-revision data.
- Hono Worker `data.gongeo.us`: public global stats, community tier lists, catalog details, facets, attribute matches, and Pinecone-backed item search.
- Workflow repository `gongeo.us-db-backup`: canonical global-stat and tier-list aggregation SQL, scheduled snapshot generation, validation, and D1 publication.
- Main-project environment variables: `SUPABASE_DATABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
- Main DB reference: `.supabase/main_db_reference.md`.
- Tracker-owned main DB SQL notes stay in `.supabase/`. Global-stat and tier-list aggregation definitions live in `gongeo.us-db-backup/sql/supabase/`.
- D1 query/schema behavior belongs in the sibling data API and data processor projects. Keep tracker reference markdown condensed.
- Reference files are non-executable maps. Verify risky behavior against code, schemas, or APIs.

## Runtime boundaries

- Nitro auto-imports server and shared helpers, but not frontend helpers from `app/`. Explicitly import any frontend dependency in a module loaded by server code, including transitive dependencies.
- Put pure logic used by both runtimes in `shared/`; do not import a client composable into a server handler for its validation helpers or constants.
- When adding a dependency to server-loaded code, inspect its import chain and explicitly import frontend helpers where they are used. Frontend auto-import declarations and a passing type check do not prove a dependency exists in Nitro at runtime.

## Public data API requests

- Keep public data API reads in the browser (`useAsyncData` with `server: false`, a client guard, or a browser event) unless production server access has been verified. Upstream access rules can reject SSR requests even when browser requests and local development succeed.
- When direct visits or refreshes fail but client-side navigation works, inspect the serialized SSR error and compare server and browser requests. Distinguish an upstream API failure from a challenge blocking the page itself.
- Deferred `useAsyncData` requests start with `status === 'idle'` during SSR and hydration. Show the loading state for both `idle` and `pending` on valid resources, while preserving the not-found state for invalid routes.

## Supabase clients

- App/client code uses `useSupabaseClient` from `app/composables/useSupabaseClient.ts`.
- Server code uses the auto-imported `useSupabaseServerClient` from `server/utils/supabaseClient.ts`.
- Server code must not import Supabase helpers from `app/composables`.
- Use `withSupabaseRetry` and `isTransientSupabaseError` for transient Supabase or network failures.

## API invariants

- Prefer `defineCachedApiEventHandler` from `server/utils/cachedApi.ts` for cached public GET endpoints.
- Use `setCacheHeaders` from `shared/utils/cacheHeaders.ts` only when the handler cannot use `defineCachedApiEventHandler`.
- Include `getGameVersion()` in versioned cache keys.
- Use factories in `server/utils/apiErrors.ts` for common 400, 404, 500, and 503 errors.
- Normalize unknown errors with `toErrorMessage` before logging. Include relevant resource names and IDs in logs.
- Catalog detail localization is handled by the Worker through an explicit `lang` query parameter.

## Relevant locations

- `server/api/`: Nitro endpoints
- `server/utils/`: server-only helpers
- `shared/utils/`: cross-runtime helpers
- `shared/types/`: shared types
- `.supabase/`: tracker-owned main-project schemas, contracts, and SQL notes
