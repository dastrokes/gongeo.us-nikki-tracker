# Server and database rules

Read this guide for server endpoints, caching, locale resolution, Supabase, SQL, or database-ownership work.

## Project boundaries

- Main app project `fimzdbqulflilnnopibz`: authentication, users, banner/global stats, tier lists, feedback suggestions/votes, and feedback workflow state.
- Cloudflare D1 database `gongeous`: authoritative item, outfit, makeup, Momo, reviewed attribute, listing-filter, and content-revision data.
- Hono Worker `data.gongeo.us`: public catalog details, facets, attribute matches, and Pinecone-backed item search.
- Main-project environment variables: `SUPABASE_DATABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
- Main DB reference: `.supabase/main_db_reference.md`.
- Tracker-owned main DB SQL notes stay in `.supabase/`.
- D1 query/schema behavior belongs in the sibling data API and data processor projects. Keep tracker reference markdown condensed.
- Reference files are non-executable maps. Verify risky behavior against code, schemas, or APIs.

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
- `.supabase/`: main-project schemas and SQL notes
