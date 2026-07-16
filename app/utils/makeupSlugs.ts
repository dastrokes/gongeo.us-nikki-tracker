import { ENTITY_SLUG_DATA } from '../../data/entitySlugs/makeup'

export const makeupSlugHelpers = createEntitySlugHelpers(
  'makeups',
  ENTITY_SLUG_DATA
)

export const getMakeupSlugIds = makeupSlugHelpers.getIds
export const getMakeupSlug = makeupSlugHelpers.getSlug
export const getMakeupDetailPath = makeupSlugHelpers.getDetailPath
export const resolveMakeupRouteId = makeupSlugHelpers.resolveRouteId
