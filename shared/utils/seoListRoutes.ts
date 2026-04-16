type SeoFilterKind = 'quality' | 'version' | 'style' | 'tag' | 'source'

export type SeoListRouteFilterSlug = {
  kind: SeoFilterKind
  slug: string
}

export type SeoListRouteFilter = SeoListRouteFilterSlug & {
  value: string | number
}

export const SEO_QUALITY_LIST_SLUGS = [
  '5-star',
  '4-star',
  '3-star',
  '2-star',
] as const

export type SeoQualityListSlug = (typeof SEO_QUALITY_LIST_SLUGS)[number]

export const toSeoListSlug = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s.]+/g, '-')
    .toLowerCase()

export const toSeoVersionSlug = (version: string) => version.replace('.', '-')

export const fromSeoVersionSlug = (slug: string) => slug.replace('-', '.')

const getSeoListSegments = (path: string) => {
  const [pathname = ''] = path.split(/[?#]/)
  return pathname.split('/').filter(Boolean)
}

export const getSeoListRouteSlug = (path: string, section: string) => {
  const segments = getSeoListSegments(path)
  const sectionIndex = segments.indexOf(section)
  if (sectionIndex === -1) return null

  const slug = segments[sectionIndex + 1]
  return slug ? decodeURIComponent(slug) : null
}

export const getSeoListRouteFilterSlug = (
  path: string,
  section: string
): SeoListRouteFilterSlug | null => {
  const segments = getSeoListSegments(path)
  const sectionIndex = segments.indexOf(section)
  if (sectionIndex === -1) return null

  const kind = segments[sectionIndex + 1] as SeoFilterKind | undefined
  const slug = segments[sectionIndex + 2]
  if (!kind || !slug) return null

  if (
    kind !== 'quality' &&
    kind !== 'version' &&
    kind !== 'style' &&
    kind !== 'tag' &&
    kind !== 'source'
  ) {
    return null
  }

  return {
    kind,
    slug: decodeURIComponent(slug),
  }
}

export const resolveSeoQuality = (
  slug?: string | null
): 2 | 3 | 4 | 5 | null => {
  if (slug === '5-star') return 5
  if (slug === '4-star') return 4
  if (slug === '3-star') return 3
  if (slug === '2-star') return 2
  return null
}

export const resolveSeoQualitySlug = (
  quality?: number | null
): SeoQualityListSlug | null => {
  if (quality === 5) return '5-star'
  if (quality === 4) return '4-star'
  if (quality === 3) return '3-star'
  if (quality === 2) return '2-star'
  return null
}
