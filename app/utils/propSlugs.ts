import { ENTITY_SLUG_DATA } from '../../data/entitySlugs/prop'

export const propSlugHelpers = createEntitySlugHelpers(
  'props',
  ENTITY_SLUG_DATA
)

export const getPropSlugIds = propSlugHelpers.getIds
export const getPropSlug = propSlugHelpers.getSlug
export const getPropDetailPath = propSlugHelpers.getDetailPath
export const resolvePropRouteId = propSlugHelpers.resolveRouteId
