import { ENTITY_SLUG_DATA } from '../../data/entitySlugs/momo'

export const momoSlugHelpers = createEntitySlugHelpers('momo', ENTITY_SLUG_DATA)

export const getMomoSlugIds = momoSlugHelpers.getIds
export const getMomoSlug = momoSlugHelpers.getSlug
export const getMomoDetailPath = momoSlugHelpers.getDetailPath
export const resolveMomoRouteId = momoSlugHelpers.resolveRouteId
