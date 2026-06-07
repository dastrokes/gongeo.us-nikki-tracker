import { ENTITY_SLUG_DATA } from './entitySlugData'

export type EntitySlugType = 'banner' | 'item' | 'makeup' | 'momo' | 'outfit'

type EntitySlugIndex = {
  byId: ReadonlyMap<string, string>
  bySlug: ReadonlyMap<string, string>
}

const ENTITY_ROUTE_PREFIX: Record<EntitySlugType, string> = {
  banner: 'banners',
  item: 'items',
  makeup: 'makeups',
  momo: 'momo',
  outfit: 'outfits',
}

const slugIndexCache = new Map<EntitySlugType, EntitySlugIndex>()

const normalizeEntityId = (id: number | string) => String(id)

const isMakeupItemId = (id: number | string) =>
  ['81', '82', '83', '84', '85'].includes(String(id).slice(4, 6))

const createEntitySlugIndex = (entity: EntitySlugType): EntitySlugIndex => {
  const byId = new Map<string, string>()
  const bySlug = new Map<string, string>()

  ENTITY_SLUG_DATA[entity].forEach(([id, slug]) => {
    byId.set(String(id), slug)
    bySlug.set(slug, String(id))
  })

  return { byId, bySlug }
}

const getEntitySlugIndex = (entity: EntitySlugType) => {
  const cached = slugIndexCache.get(entity)
  if (cached) return cached

  const index = createEntitySlugIndex(entity)
  slugIndexCache.set(entity, index)
  return index
}

export const getItemEntitySlugType = (
  id: number | string
): 'item' | 'makeup' => (isMakeupItemId(id) ? 'makeup' : 'item')

export const getEntitySlugIds = (entity: EntitySlugType) =>
  ENTITY_SLUG_DATA[entity].map(([id]) => String(id))

export const getEntitySlug = (entity: EntitySlugType, id: number | string) =>
  getEntitySlugIndex(entity).byId.get(normalizeEntityId(id)) ??
  normalizeEntityId(id)

export const getEntityDetailPath = (
  entity: EntitySlugType,
  id: number | string
) => `/${ENTITY_ROUTE_PREFIX[entity]}/${getEntitySlug(entity, id)}`

export const getItemEntityDetailPath = (id: number | string) =>
  getEntityDetailPath(getItemEntitySlugType(id), id)

export const resolveEntityRouteId = (
  entity: EntitySlugType,
  routeParam: unknown
) => {
  const rawParam = Array.isArray(routeParam) ? routeParam[0] : routeParam
  const value = String(rawParam ?? '').trim()
  if (!value) return NaN

  if (/^\d+$/.test(value)) return Number(value)

  const id = getEntitySlugIndex(entity).bySlug.get(value)
  return id ? Number(id) : NaN
}
