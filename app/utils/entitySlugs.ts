import bannerMessages from '../locales/en/banner.json'
import itemMessages from '../locales/en/item.json'
import makeupMessages from '../locales/en/makeup.json'
import momoMessages from '../locales/en/momo.json'
import outfitMessages from '../locales/en/outfit.json'
import {
  getEntityNameMessageEntries,
  type EntityMessageDictionary,
  type EntityMessageSection,
} from './entityLocaleMessages'

export type EntitySlugType = EntityMessageSection

const ENTITY_ROUTE_PREFIX: Record<EntitySlugType, string> = {
  banner: 'banners',
  item: 'items',
  makeup: 'makeups',
  momo: 'momo',
  outfit: 'outfits',
}

const COMMON_RESERVED_SLUGS = ['quality', 'source', 'style', 'tag', 'version']
const ITEM_TYPE_SLUGS = [
  'hair',
  'dresses',
  'outerwear',
  'tops',
  'bottoms',
  'socks',
  'shoes',
  'hair-accessories',
  'headwear',
  'earrings',
  'neckwear',
  'bracelets',
  'chokers',
  'gloves',
  'face-decorations',
  'chest-accessories',
  'pendants',
  'backpieces',
  'rings',
  'arm-decorations',
  'body-paint',
  'handhelds',
]
const MAKEUP_TYPE_SLUGS = [
  'base-makeup',
  'eyebrows',
  'eyelashes',
  'contact-lenses',
  'lips',
  'full-makeup',
]

const RESERVED_SLUGS: Record<EntitySlugType, ReadonlySet<string>> = {
  banner: new Set(COMMON_RESERVED_SLUGS),
  item: new Set([...COMMON_RESERVED_SLUGS, ...ITEM_TYPE_SLUGS]),
  makeup: new Set([...COMMON_RESERVED_SLUGS, ...MAKEUP_TYPE_SLUGS]),
  momo: new Set(COMMON_RESERVED_SLUGS),
  outfit: new Set(COMMON_RESERVED_SLUGS),
}

const MESSAGE_BY_ENTITY: Record<EntitySlugType, EntityMessageDictionary> = {
  banner: bannerMessages,
  item: itemMessages,
  makeup: {
    ...itemMessages,
    ...makeupMessages,
  },
  momo: momoMessages,
  outfit: outfitMessages,
}

type EntitySlugIndex = {
  byId: ReadonlyMap<string, string>
  bySlug: ReadonlyMap<string, string>
}

const slugIndexCache = new Map<EntitySlugType, EntitySlugIndex>()

const normalizeEntityId = (id: number | string) => String(id)
const isMakeupItemId = (id: string) => {
  const typeCode = id.slice(4, 6)
  return ['81', '82', '83', '84', '85'].includes(typeCode)
}

export const toEntitySlug = (name: string) => {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'entry'
}

const extractEntityNames = (entity: EntitySlugType) => {
  const messages = MESSAGE_BY_ENTITY[entity]

  return getEntityNameMessageEntries(messages).flatMap(
    ({ section, id, name }) => {
      if (entity === 'item') {
        return section === 'item' && !isMakeupItemId(id) ? [{ id, name }] : []
      }

      if (entity === 'makeup') {
        return section === 'makeup' ||
          (section === 'item' && isMakeupItemId(id))
          ? [{ id, name }]
          : []
      }

      return section === entity ? [{ id, name }] : []
    }
  )
}

const createEntitySlugIndex = (entity: EntitySlugType): EntitySlugIndex => {
  const entries = extractEntityNames(entity)
  const rawSlugCounts = new Map<string, number>()

  entries.forEach(({ name }) => {
    const slug = toEntitySlug(name)
    rawSlugCounts.set(slug, (rawSlugCounts.get(slug) ?? 0) + 1)
  })

  const byId = new Map<string, string>()
  const bySlug = new Map<string, string>()
  const reservedSlugs = RESERVED_SLUGS[entity]

  entries.forEach(({ id, name }) => {
    const rawSlug = toEntitySlug(name)
    const needsIdSuffix =
      reservedSlugs.has(rawSlug) || (rawSlugCounts.get(rawSlug) ?? 0) > 1
    const slug = needsIdSuffix ? `${rawSlug}-${id}` : rawSlug

    byId.set(id, slug)
    bySlug.set(slug, id)
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
): 'item' | 'makeup' =>
  isMakeupItemId(normalizeEntityId(id)) ? 'makeup' : 'item'

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
