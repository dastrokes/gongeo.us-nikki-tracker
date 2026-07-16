import { ENTITY_SLUG_DATA as BANNER_SLUG_DATA } from '../../data/entitySlugs/banner'
import { ENTITY_SLUG_DATA as ITEM_SLUG_DATA } from '../../data/entitySlugs/item'
import { ENTITY_SLUG_DATA as MAKEUP_SLUG_DATA } from '../../data/entitySlugs/makeup'
import { ENTITY_SLUG_DATA as MOMO_SLUG_DATA } from '../../data/entitySlugs/momo'
import { ENTITY_SLUG_DATA as OUTFIT_SLUG_DATA } from '../../data/entitySlugs/outfit'

export type EntitySlugType = 'banner' | 'item' | 'makeup' | 'momo' | 'outfit'

const helpersByEntity = {
  banner: createEntitySlugHelpers('banners', BANNER_SLUG_DATA),
  item: createEntitySlugHelpers('items', ITEM_SLUG_DATA),
  makeup: createEntitySlugHelpers('makeups', MAKEUP_SLUG_DATA),
  momo: createEntitySlugHelpers('momo', MOMO_SLUG_DATA),
  outfit: createEntitySlugHelpers('outfits', OUTFIT_SLUG_DATA),
}

const isMakeupItemId = (id: number | string) =>
  ['81', '82', '83', '84', '85'].includes(String(id).slice(4, 6))

export const getItemEntitySlugType = (
  id: number | string
): 'item' | 'makeup' => (isMakeupItemId(id) ? 'makeup' : 'item')

export const getEntitySlugIds = (entity: EntitySlugType) =>
  helpersByEntity[entity].getIds()

export const getEntitySlug = (entity: EntitySlugType, id: number | string) =>
  helpersByEntity[entity].getSlug(id)

export const getEntityDetailPath = (
  entity: EntitySlugType,
  id: number | string
) => helpersByEntity[entity].getDetailPath(id)

export const getItemEntityDetailPath = (id: number | string) =>
  getEntityDetailPath(getItemEntitySlugType(id), id)

export const resolveEntityRouteId = (
  entity: EntitySlugType,
  routeParam: unknown
) => {
  return helpersByEntity[entity].resolveRouteId(routeParam)
}
