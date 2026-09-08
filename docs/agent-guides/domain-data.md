# Domain-data rules

Read this guide when changing banners, outfits, source maps, game versions, or maintained domain data.

- `data/banners.ts` is the fallback source for the game version through `shared/utils/gameVersion.ts`.
- Keep banner IDs and each banner's `runs` list in chronological order.
- When adding a file under `data/outfits/`, also update `data/outfits/index.ts`.
- `data/source.json` and `data/momoSource.json` are source-group maps used by shared filter and route helpers. Update them intentionally with matching locale labels.
- Reuse style and tag mappings from `shared/utils/itemInfo.ts`; do not duplicate the tables inline.
- Avoid rewriting large data assets for small semantic changes.
