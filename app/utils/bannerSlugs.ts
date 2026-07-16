import { ENTITY_SLUG_DATA } from '../../data/entitySlugs/banner'

export const bannerSlugHelpers = createEntitySlugHelpers(
  'banners',
  ENTITY_SLUG_DATA
)

export const getBannerSlugIds = bannerSlugHelpers.getIds
export const getBannerSlug = bannerSlugHelpers.getSlug
export const getBannerDetailPath = bannerSlugHelpers.getDetailPath
export const resolveBannerRouteId = bannerSlugHelpers.resolveRouteId
