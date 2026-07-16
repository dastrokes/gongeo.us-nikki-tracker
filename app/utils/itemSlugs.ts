import { ENTITY_SLUG_DATA } from '../../data/entitySlugs/item'

export const itemSlugHelpers = createEntitySlugHelpers(
  'items',
  ENTITY_SLUG_DATA
)

export const getItemSlugIds = itemSlugHelpers.getIds
export const getItemSlug = itemSlugHelpers.getSlug
export const getItemDetailPath = itemSlugHelpers.getDetailPath
export const resolveItemRouteId = itemSlugHelpers.resolveRouteId
