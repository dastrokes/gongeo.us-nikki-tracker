import { BANNER_DATA } from '../../data/banners'
import {
  getFirstRunMajorMinorVersion,
  getMajorVersionFilters,
  getVersionFromId,
  isExactVersion,
  sortVersionsDesc,
} from '../../shared/utils/contentVersion'
import { STYLE_DEFINITIONS, TAG_DEFINITIONS } from '../../shared/utils/itemInfo'
import {
  OBTAIN_GROUPS,
  isObtainGroupVisibleInOutfits,
} from '../../shared/utils/obtainGroups'
import {
  resolveSeoQuality,
  resolveSeoQualitySlug,
  fromSeoVersionSlug,
  getSeoListRouteFilterSlug,
  toSeoListSlug,
  toSeoVersionSlug,
  type SeoListRouteFilter,
} from '../../shared/utils/seoListRoutes'
import { getAllItemTypes, type ItemType } from './itemType'

type SeoValueRoute = {
  value: string
  slug: string
}

type SeoQualityRoute = {
  quality: number
  slug: string
}

export const SEO_ITEM_QUALITY_VALUES = [5, 4, 3, 2] as const
export const SEO_OUTFIT_QUALITY_VALUES = [5, 4, 3] as const
export const SEO_BANNER_QUALITY_VALUES = [5, 4] as const

export const SEO_ITEM_TYPE_ROUTES = getAllItemTypes()
  .filter((type): type is Exclude<ItemType, 'unknown'> => type !== 'unknown')
  .map((type) => ({
    type,
    slug: toSeoListSlug(type),
  }))

export const SEO_ITEM_TYPE_SLUGS = SEO_ITEM_TYPE_ROUTES.map(
  (route) => route.slug
)

const ITEM_TYPE_BY_SEO_SLUG: ReadonlyMap<string, string> = new Map(
  SEO_ITEM_TYPE_ROUTES.map((route) => [route.slug, route.type])
)

const ITEM_TYPE_SEO_SLUG_BY_TYPE: ReadonlyMap<string, string> = new Map(
  SEO_ITEM_TYPE_ROUTES.map((route) => [route.type, route.slug])
)

const createQualityRoutes = (qualities: readonly number[]): SeoQualityRoute[] =>
  qualities.flatMap((quality) => {
    const slug = resolveSeoQualitySlug(quality)
    return slug ? [{ quality, slug }] : []
  })

const SEO_ITEM_QUALITY_ROUTES = createQualityRoutes(SEO_ITEM_QUALITY_VALUES)
const SEO_OUTFIT_QUALITY_ROUTES = createQualityRoutes(SEO_OUTFIT_QUALITY_VALUES)
const SEO_BANNER_QUALITY_ROUTES = createQualityRoutes(SEO_BANNER_QUALITY_VALUES)

export const SEO_ITEM_QUALITY_SLUGS = SEO_ITEM_QUALITY_ROUTES.map(
  (route) => route.slug
)

export const SEO_OUTFIT_QUALITY_SLUGS = SEO_OUTFIT_QUALITY_ROUTES.map(
  (route) => route.slug
)

export const SEO_BANNER_QUALITY_SLUGS = SEO_BANNER_QUALITY_ROUTES.map(
  (route) => route.slug
)

const ITEM_QUALITY_BY_SEO_SLUG: ReadonlyMap<string, number> = new Map(
  SEO_ITEM_QUALITY_ROUTES.map((route) => [route.slug, route.quality])
)

const ITEM_QUALITY_SEO_SLUG_BY_VALUE: ReadonlyMap<number, string> = new Map(
  SEO_ITEM_QUALITY_ROUTES.map((route) => [route.quality, route.slug])
)

const OUTFIT_QUALITY_BY_SEO_SLUG: ReadonlyMap<string, number> = new Map(
  SEO_OUTFIT_QUALITY_ROUTES.map((route) => [route.slug, route.quality])
)

const OUTFIT_QUALITY_SEO_SLUG_BY_VALUE: ReadonlyMap<number, string> = new Map(
  SEO_OUTFIT_QUALITY_ROUTES.map((route) => [route.quality, route.slug])
)

const BANNER_QUALITY_BY_SEO_SLUG: ReadonlyMap<string, number> = new Map(
  SEO_BANNER_QUALITY_ROUTES.map((route) => [route.slug, route.quality])
)

const BANNER_QUALITY_SEO_SLUG_BY_VALUE: ReadonlyMap<number, string> = new Map(
  SEO_BANNER_QUALITY_ROUTES.map((route) => [route.quality, route.slug])
)

export const SEO_ITEM_SOURCE_SLUGS = OBTAIN_GROUPS.map((group) => group.key)

export const SEO_OUTFIT_SOURCE_SLUGS = OBTAIN_GROUPS.filter((group) =>
  isObtainGroupVisibleInOutfits(group.key)
).map((group) => group.key)

const ITEM_SOURCE_BY_SEO_SLUG: ReadonlyMap<string, string> = new Map(
  SEO_ITEM_SOURCE_SLUGS.map((slug) => [slug, slug])
)

const ITEM_SOURCE_SEO_SLUG_BY_VALUE: ReadonlyMap<string, string> = new Map(
  SEO_ITEM_SOURCE_SLUGS.map((slug) => [slug, slug])
)

const OUTFIT_SOURCE_BY_SEO_SLUG: ReadonlyMap<string, string> = new Map(
  SEO_OUTFIT_SOURCE_SLUGS.map((slug) => [slug, slug])
)

const OUTFIT_SOURCE_SEO_SLUG_BY_VALUE: ReadonlyMap<string, string> = new Map(
  SEO_OUTFIT_SOURCE_SLUGS.map((slug) => [slug, slug])
)

const createVersionRoutes = (
  versions: Iterable<string | null>
): SeoValueRoute[] => {
  const exactVersions = Array.from(
    new Set(
      Array.from(versions).filter(
        (version): version is string => !!version && isExactVersion(version)
      )
    )
  )

  const sortedExactVersions = sortVersionsDesc(exactVersions)

  return [
    ...sortedExactVersions,
    ...getMajorVersionFilters(sortedExactVersions),
  ].map((version) => ({
    value: version,
    slug: toSeoVersionSlug(version),
  }))
}

export const SEO_VERSION_ROUTES = createVersionRoutes(
  OBTAIN_GROUPS.flatMap((group) => group.ids).map((id) => getVersionFromId(id))
)

export const SEO_BANNER_VERSION_ROUTES = createVersionRoutes(
  Object.values(BANNER_DATA).map((banner) =>
    getFirstRunMajorMinorVersion(banner.runs)
  )
)

export const SEO_VERSION_SLUGS = SEO_VERSION_ROUTES.map((route) => route.slug)

export const SEO_BANNER_VERSION_SLUGS = SEO_BANNER_VERSION_ROUTES.map(
  (route) => route.slug
)

const VERSION_BY_SEO_SLUG: ReadonlyMap<string, string> = new Map(
  SEO_VERSION_ROUTES.map((route) => [route.slug, route.value])
)

const VERSION_SEO_SLUG_BY_VALUE: ReadonlyMap<string, string> = new Map(
  SEO_VERSION_ROUTES.map((route) => [route.value, route.slug])
)

const BANNER_VERSION_BY_SEO_SLUG: ReadonlyMap<string, string> = new Map(
  SEO_BANNER_VERSION_ROUTES.map((route) => [route.slug, route.value])
)

const BANNER_VERSION_SEO_SLUG_BY_VALUE: ReadonlyMap<string, string> = new Map(
  SEO_BANNER_VERSION_ROUTES.map((route) => [route.value, route.slug])
)

export const SEO_STYLE_SLUGS = STYLE_DEFINITIONS.map((style) => style.key)
export const SEO_TAG_SLUGS = TAG_DEFINITIONS.map((tag) => tag.key)

const STYLE_BY_SEO_SLUG: ReadonlyMap<string, string> = new Map(
  SEO_STYLE_SLUGS.map((slug) => [slug, slug])
)

const TAG_BY_SEO_SLUG: ReadonlyMap<string, string> = new Map(
  SEO_TAG_SLUGS.map((slug) => [slug, slug])
)

export const SEO_ITEM_LIST_PATHS = [
  ...SEO_ITEM_TYPE_SLUGS.map((slug) => `/items/${slug}`),
  ...SEO_ITEM_QUALITY_SLUGS.map((slug) => `/items/quality/${slug}`),
  ...SEO_VERSION_SLUGS.map((slug) => `/items/version/${slug}`),
  ...SEO_STYLE_SLUGS.map((slug) => `/items/style/${slug}`),
  ...SEO_TAG_SLUGS.map((slug) => `/items/tag/${slug}`),
  ...SEO_ITEM_SOURCE_SLUGS.map((slug) => `/items/source/${slug}`),
]

export const SEO_OUTFIT_LIST_PATHS = [
  ...SEO_OUTFIT_QUALITY_SLUGS.map((slug) => `/outfits/quality/${slug}`),
  ...SEO_VERSION_SLUGS.map((slug) => `/outfits/version/${slug}`),
  ...SEO_STYLE_SLUGS.map((slug) => `/outfits/style/${slug}`),
  ...SEO_TAG_SLUGS.map((slug) => `/outfits/tag/${slug}`),
  ...SEO_OUTFIT_SOURCE_SLUGS.map((slug) => `/outfits/source/${slug}`),
]

export const SEO_BANNER_LIST_PATHS = [
  ...SEO_BANNER_QUALITY_SLUGS.map((slug) => `/banners/quality/${slug}`),
  ...SEO_BANNER_VERSION_SLUGS.map((slug) => `/banners/version/${slug}`),
]

export const resolveSeoItemTypeFromSlug = (slug?: string | null) => {
  if (!slug) return null
  return ITEM_TYPE_BY_SEO_SLUG.get(slug) ?? null
}

export const resolveSeoItemTypeSlug = (type?: string | null) => {
  if (!type) return null
  return ITEM_TYPE_SEO_SLUG_BY_TYPE.get(type) ?? null
}

export const resolveSeoItemQualityFromSlug = (slug?: string | null) => {
  if (!slug) return null
  return ITEM_QUALITY_BY_SEO_SLUG.get(slug) ?? null
}

export const resolveSeoItemQualitySlug = (quality?: number | null) => {
  if (quality === null || quality === undefined) return null
  return ITEM_QUALITY_SEO_SLUG_BY_VALUE.get(quality) ?? null
}

export const resolveSeoOutfitQualityFromSlug = (slug?: string | null) => {
  if (!slug) return null
  return OUTFIT_QUALITY_BY_SEO_SLUG.get(slug) ?? null
}

export const resolveSeoOutfitQualitySlug = (quality?: number | null) => {
  if (quality === null || quality === undefined) return null
  return OUTFIT_QUALITY_SEO_SLUG_BY_VALUE.get(quality) ?? null
}

export const resolveSeoBannerQualityFromSlug = (slug?: string | null) => {
  if (!slug) return null
  return BANNER_QUALITY_BY_SEO_SLUG.get(slug) ?? null
}

export const resolveSeoBannerQualitySlug = (quality?: number | null) => {
  if (quality === null || quality === undefined) return null
  return BANNER_QUALITY_SEO_SLUG_BY_VALUE.get(quality) ?? null
}

export const resolveSeoItemSourceFromSlug = (slug?: string | null) => {
  if (!slug) return null
  return ITEM_SOURCE_BY_SEO_SLUG.get(slug) ?? null
}

export const resolveSeoItemSourceSlug = (source?: string | null) => {
  if (!source) return null
  return ITEM_SOURCE_SEO_SLUG_BY_VALUE.get(source) ?? null
}

export const resolveSeoOutfitSourceFromSlug = (slug?: string | null) => {
  if (!slug) return null
  return OUTFIT_SOURCE_BY_SEO_SLUG.get(slug) ?? null
}

export const resolveSeoOutfitSourceSlug = (source?: string | null) => {
  if (!source) return null
  return OUTFIT_SOURCE_SEO_SLUG_BY_VALUE.get(source) ?? null
}

export const resolveSeoVersionFromSlug = (slug?: string | null) => {
  if (!slug) return null
  return VERSION_BY_SEO_SLUG.get(slug) ?? null
}

export const resolveSeoVersionSlug = (version?: string | null) => {
  if (!version) return null
  return VERSION_SEO_SLUG_BY_VALUE.get(version) ?? null
}

export const resolveSeoBannerVersionFromSlug = (slug?: string | null) => {
  if (!slug) return null
  return BANNER_VERSION_BY_SEO_SLUG.get(slug) ?? null
}

export const resolveSeoBannerVersionSlug = (version?: string | null) => {
  if (!version) return null
  return BANNER_VERSION_SEO_SLUG_BY_VALUE.get(version) ?? null
}

export const resolveSeoStyleFromSlug = (slug?: string | null) => {
  if (!slug) return null
  return STYLE_BY_SEO_SLUG.get(slug) ?? null
}

export const resolveSeoStyleSlug = (style?: string | null) => {
  if (!style) return null
  return STYLE_BY_SEO_SLUG.get(style) ?? null
}

export const resolveSeoTagFromSlug = (slug?: string | null) => {
  if (!slug) return null
  return TAG_BY_SEO_SLUG.get(slug) ?? null
}

export const resolveSeoTagSlug = (tag?: string | null) => {
  if (!tag) return null
  return TAG_BY_SEO_SLUG.get(tag) ?? null
}

export const getSeoListRouteFilter = (
  path: string,
  section: string
): SeoListRouteFilter | null => {
  const filter = getSeoListRouteFilterSlug(path, section)
  if (!filter) return null

  if (filter.kind === 'quality') {
    const normalizedQuality = resolveSeoQuality(filter.slug)
    if (normalizedQuality === null) return null

    const value =
      section === 'items'
        ? resolveSeoItemQualityFromSlug(filter.slug)
        : section === 'outfits'
          ? resolveSeoOutfitQualityFromSlug(filter.slug)
          : resolveSeoBannerQualityFromSlug(filter.slug)

    return value
      ? { ...filter, slug: resolveSeoQualitySlug(value) ?? filter.slug, value }
      : null
  }

  if (filter.kind === 'version') {
    const normalizedSlug = toSeoVersionSlug(fromSeoVersionSlug(filter.slug))
    const value =
      section === 'banners'
        ? resolveSeoBannerVersionFromSlug(normalizedSlug)
        : resolveSeoVersionFromSlug(normalizedSlug)
    return value ? { ...filter, slug: normalizedSlug, value } : null
  }

  if (filter.kind === 'style') {
    const value = resolveSeoStyleFromSlug(filter.slug)
    return value ? { ...filter, value } : null
  }

  if (filter.kind === 'tag') {
    const value = resolveSeoTagFromSlug(filter.slug)
    return value ? { ...filter, value } : null
  }

  if (filter.kind === 'source') {
    const value =
      section === 'items'
        ? resolveSeoItemSourceFromSlug(filter.slug)
        : section === 'outfits'
          ? resolveSeoOutfitSourceFromSlug(filter.slug)
          : null
    return value ? { ...filter, value } : null
  }

  return null
}
