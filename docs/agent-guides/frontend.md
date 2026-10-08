# Frontend rules

Read this guide for UI, page, component, catalog-listing, filter, or localization work.

## Design and localization

- `DESIGN.md` is the visual source of truth. Follow its tokens, component rules, responsive behavior, and accessibility requirements.
- Do not hardcode user-facing text in Vue templates, scripts, or composables. Use i18n keys.
- For normal feature work, update only `en`. Update other locales only when the user requests broader coverage.
- Locales are defined in `app/locales/locales.ts`.
- Preserve the existing Naive UI and Tailwind 4 patterns.
- Use Outfit weights `400`, `500`, `600`, and `700`; avoid heavier weights unless requested.

## Component boundaries

- Avoid unnecessary micro-components and premature abstraction. Keep simple implementation details inline unless extraction provides meaningful reuse, encapsulates substantial behavior, or establishes a clear component boundary.

## Chart rendering

- Check initial chart rendering after refresh and client navigation, including animations, responsive sizing, and image labels.
- Prepare the required layout and assets before rendering, avoid redundant updates that interrupt animations, and honor reduced-motion preferences.

## Catalog behavior

- Use `useCatalogListing` or `useStaticCatalogListing` for catalog listing pages.
- Catalog listings hydrate from `public/catalog/index.json`; do not reintroduce paginated item, outfit, makeup, or momo listing APIs without a concrete reason.
- Use the configured data API for catalog details, facets, and search. Keep authenticated user, stats, and feedback workflow mutations on the main Supabase path.
- Keep the listing response shape stable wherever produced: `{ data, total, page, totalPages }`.
- Keep listing page size at `18` across catalog helpers and UI unless the product requirement changes.
- Preserve filter and query synchronization in `items`, `outfits`, `tierlist`, and similar listing pages.

## Relevant locations

- `app/pages/`: route pages
- `app/components/`: reusable components
- `app/composables/`: shared fetch, state, and domain logic
- `app/layouts/`, `app/plugins/`, `app/stores/`, `app/assets/`: shell, integrations, state, and styling
- `public/catalog/`: static catalog index
