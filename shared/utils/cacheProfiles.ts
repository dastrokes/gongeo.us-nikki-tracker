import { getGameVersion } from './gameVersion'

export const GAME_VERSION_HEADER = 'X-Game-Version'
export const CACHE_TAGS = {
  catalogAssets: 'catalog-assets',
  itemSearch: 'item-search',
  itemDetails: 'item-details',
  outfitDetails: 'outfit-details',
  makeupDetails: 'makeup-details',
  momoDetails: 'momo-details',
  stats: 'stats',
  images: 'images',
  lookbook: 'lookbook',
} as const

export const itemDetailCacheId = (id: string) => `item-detail-${id}`
export const outfitDetailCacheId = (id: string) => `outfit-detail-${id}`
export const makeupDetailCacheId = (id: string) => `makeup-detail-${id}`
export const momoDetailCacheId = (id: string) => `momo-detail-${id}`

const HEADER = {
  cache: 'Cache-Control',
  cdn: 'Netlify-CDN-Cache-Control',
  sharedCdn: 'CDN-Cache-Control',
  cacheId: 'Netlify-Cache-ID',
  vary: 'Netlify-Vary',
} as const

const THEME_COOKIE = 'theme'

const NO_STORE = 'no-store'
const BROWSER_REVALIDATE = 'public, max-age=0, must-revalidate'
const BROWSER_LONG = 'public, max-age=86400, stale-while-revalidate=604800'
const CDN_LONG =
  'public, s-maxage=2592000, stale-while-revalidate=604800, stale-if-error=86400'
const CDN_IMMUTABLE =
  'public, s-maxage=31536000, stale-while-revalidate=604800, stale-if-error=86400'
const CDN_SITEMAP =
  'public, s-maxage=86400, stale-while-revalidate=3600, stale-if-error=3600'
const CDN_API_SHORT =
  'public, durable, s-maxage=86400, stale-while-revalidate=86400, stale-if-error=86400'
const CDN_API_LONG =
  'public, durable, s-maxage=2592000, stale-while-revalidate=604800, stale-if-error=86400'
const CDN_SEARCH =
  'public, durable, s-maxage=86400, stale-while-revalidate=86400, stale-if-error=3600'
const CDN_FEEDBACK = 'public, s-maxage=30, stale-while-revalidate=30'

const THEME_VARY = `cookie=${THEME_COOKIE}`
const THEME_QUERY_VARY = `${THEME_VARY},query`

export type CacheHeaders = Record<string, string>
export type CacheScope = 'page' | 'api'

interface CacheProfile {
  cacheIds?: string[]
  headers: CacheHeaders
  includeVersion?: boolean
}

export interface CacheHeaderOptions {
  cacheIds?: string[]
  includeVersion?: boolean
  varyCookies?: string[]
  varyQuery?: boolean
  varyHeaders?: string[]
}

type ResolvedCacheHeaders = {
  headers: CacheHeaders
  version: string
}

function createHeaders(
  browser: string,
  cdn: string,
  extra: Partial<CacheHeaders> = {}
): CacheHeaders {
  return {
    [HEADER.cache]: browser,
    [HEADER.cdn]: cdn,
    ...extra,
  }
}

function createProfile(
  browser: string,
  cdn: string,
  {
    cacheIds = [],
    sharedCdn = false,
    vary,
    includeVersion = false,
  }: {
    cacheIds?: string[]
    sharedCdn?: string | false
    vary?: string
    includeVersion?: boolean
  } = {}
): CacheProfile {
  const extra: CacheHeaders = {}

  if (sharedCdn) {
    extra[HEADER.sharedCdn] = sharedCdn
  }

  if (vary) {
    extra[HEADER.vary] = vary
  }

  return {
    headers: createHeaders(browser, cdn, extra),
    cacheIds: normalizeCacheIds(cacheIds),
    includeVersion,
  }
}

const sharedProfiles = {
  noStore: createProfile(NO_STORE, NO_STORE, { sharedCdn: NO_STORE }),
} as const

const pageProfiles = {
  rootNoStore: sharedProfiles.noStore,
  prerenderedStatic: createProfile(BROWSER_REVALIDATE, CDN_LONG),
  themeAware: createProfile(BROWSER_REVALIDATE, CDN_LONG, {
    vary: THEME_VARY,
  }),
  themeAwareQuery: createProfile(BROWSER_REVALIDATE, CDN_LONG, {
    vary: THEME_QUERY_VARY,
  }),
  i18nMessages: createProfile(BROWSER_LONG, CDN_IMMUTABLE, {
    sharedCdn: CDN_IMMUTABLE,
  }),
  sitemap: createProfile(BROWSER_LONG, CDN_SITEMAP, {
    sharedCdn: CDN_SITEMAP,
  }),
  noStore: sharedProfiles.noStore,
} as const satisfies Record<string, CacheProfile>

const apiProfiles = {
  catalog: createProfile(BROWSER_REVALIDATE, CDN_API_LONG, {
    includeVersion: true,
  }),
  detail: createProfile(BROWSER_REVALIDATE, CDN_API_LONG, {
    includeVersion: true,
  }),
  search: createProfile(NO_STORE, CDN_SEARCH, {
    cacheIds: [CACHE_TAGS.itemSearch],
    includeVersion: true,
  }),
  lookbook: createProfile(NO_STORE, CDN_SEARCH, {
    cacheIds: [CACHE_TAGS.lookbook],
    includeVersion: true,
  }),
  feedback: createProfile(NO_STORE, CDN_FEEDBACK),
  stats: createProfile(BROWSER_REVALIDATE, CDN_API_SHORT, {
    cacheIds: [CACHE_TAGS.stats],
    includeVersion: true,
  }),
  noStore: sharedProfiles.noStore,
} as const satisfies Record<string, CacheProfile>

const profileMaps: Record<CacheScope, Record<string, CacheProfile>> = {
  page: pageProfiles,
  api: apiProfiles,
}

export type PageCacheProfile = keyof typeof pageProfiles
export type ApiCacheProfile = keyof typeof apiProfiles
export type AnyCacheProfile = PageCacheProfile | ApiCacheProfile

function buildVary({
  varyCookies = [],
  varyQuery = false,
  varyHeaders = [],
}: CacheHeaderOptions = {}): string | undefined {
  const parts: string[] = []

  if (varyCookies.length) {
    parts.push(`cookie=${varyCookies.join('|')}`)
  }

  if (varyHeaders.length) {
    parts.push(`header=${varyHeaders.join('|')}`)
  }

  if (varyQuery) {
    parts.push('query')
  }

  return parts.length ? parts.join(',') : undefined
}

function normalizeCacheIds(cacheIds: readonly string[] = []): string[] {
  return [...new Set(cacheIds.map((cacheId) => cacheId.trim()).filter(Boolean))]
}

function mergeVary(current?: string, extra?: string): string | undefined {
  if (!current) return extra
  if (!extra) return current
  return `${current},${extra}`
}

function getProfile(scope: CacheScope, profile: AnyCacheProfile): CacheProfile {
  return profileMaps[scope][profile]!
}

export function resolveCacheHeaders(
  scope: CacheScope,
  profile: AnyCacheProfile,
  options: CacheHeaderOptions = {}
): ResolvedCacheHeaders {
  const version = getGameVersion()
  const config = getProfile(scope, profile)
  const headers: CacheHeaders = { ...config.headers }
  const vary = mergeVary(headers[HEADER.vary], buildVary(options))
  const cacheIds = normalizeCacheIds([
    ...(config.cacheIds ?? []),
    ...(options.cacheIds ?? []),
  ])
  const includeVersion = options.includeVersion ?? config.includeVersion

  if (includeVersion) {
    headers[GAME_VERSION_HEADER] = version
  }

  if (cacheIds.length) {
    headers[HEADER.cacheId] = cacheIds.join(',')
  }

  if (vary) {
    headers[HEADER.vary] = vary
  }

  return { headers, version }
}

export function getCacheHeaders(
  scope: 'page',
  profile: PageCacheProfile,
  options?: CacheHeaderOptions
): CacheHeaders
export function getCacheHeaders(
  scope: 'api',
  profile: ApiCacheProfile,
  options?: CacheHeaderOptions
): CacheHeaders
export function getCacheHeaders(
  scope: CacheScope,
  profile: AnyCacheProfile,
  options: CacheHeaderOptions = {}
): CacheHeaders {
  return resolveCacheHeaders(scope, profile, options).headers
}

export function getGameVersionRequestHeaders(): CacheHeaders {
  return {
    [GAME_VERSION_HEADER]: getGameVersion(),
  }
}

const pageVersionVaryOptions = {
  includeVersion: true,
  varyHeaders: [GAME_VERSION_HEADER],
} satisfies CacheHeaderOptions

export const pageStatic = getCacheHeaders('page', 'prerenderedStatic')
export const pageThemeNoTag = getCacheHeaders('page', 'themeAware')
export const pageTheme = getCacheHeaders('page', 'themeAware', {
  ...pageVersionVaryOptions,
})
export const pageThemeQuery = getCacheHeaders('page', 'themeAwareQuery', {
  ...pageVersionVaryOptions,
})
export const i18nMessages = getCacheHeaders('page', 'i18nMessages')
export const sitemapHeaders = getCacheHeaders('page', 'sitemap')
export const noStoreHeaders = getCacheHeaders('page', 'noStore')
export const rootNoStoreHeaders = getCacheHeaders('page', 'rootNoStore')

export const pagePrerenderedStatic = pageStatic
export const pageThemeAwareNoTag = pageThemeNoTag
export const pageThemeAware = pageTheme
export const pageThemeAwareQuery = pageThemeQuery
export const noStore = noStoreHeaders
export const pageRootNoStore = rootNoStoreHeaders
