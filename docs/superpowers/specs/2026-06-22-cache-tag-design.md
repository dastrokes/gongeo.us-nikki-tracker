# Cache Tag Design

## Tag ownership

- `catalog`: `/catalog/index.json`, sitemap URLs, item search, facets, and attribute matching.
- `details`: item, outfit, makeup, and momo detail APIs.
- `stats`: existing global statistics APIs.
- `images`: existing image routes.
- Untagged: lookbook decoder and immutable split catalog files.

## Cache behavior

Keep the existing browser, Netlify CDN, and Cloudflare cache policies. The lookbook decoder keeps its one-year Nitro cache and receives no Netlify cache tag. Tagged responses continue to vary by their existing query, locale, and game-version inputs.

## Implementation

Add `catalog` and rename `game` to `details` in the shared tag constants. Split the API cache profiles so listing-related responses use `catalog`, detail responses use `details`, and lookbook uses an untagged profile. Set `/catalog/index.json` to `catalog` in `netlify.toml` while retaining its existing generic CDN policy.

## Verification

Run lint, inspect the final diff, and verify each cached handler resolves to the intended tag. After deployment, live header checks should confirm Cloudflare and Netlify still cache the index; tag purge behavior requires an authorized Netlify purge request.
