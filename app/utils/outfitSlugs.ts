import { ENTITY_SLUG_DATA } from '../../data/entitySlugs/outfit'

export const outfitSlugHelpers = createEntitySlugHelpers(
  'outfits',
  ENTITY_SLUG_DATA
)

export const getOutfitSlugIds = outfitSlugHelpers.getIds
export const getOutfitSlug = outfitSlugHelpers.getSlug
export const getOutfitDetailPath = outfitSlugHelpers.getDetailPath
export const resolveOutfitRouteId = outfitSlugHelpers.resolveRouteId
