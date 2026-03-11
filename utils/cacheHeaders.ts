import { setResponseHeader, type H3Event } from 'h3'

import { getGameVersion } from './gameVersion'

export const GAME_VERSION_HEADER = 'X-Game-Version'
export const CACHE_TAGS = {
  game: 'game',
  stats: 'stats',
} as const

export const MANUAL_INVALIDATION_TAGS = {
  gameUpdate: CACHE_TAGS.game,
  statsRefresh: CACHE_TAGS.stats,
} as const

const HEADER = {
  cache: 'Cache-Control',
  cdn: 'Netlify-CDN-Cache-Control',
  tag: 'Netlify-Cache-Tag',
  vary: 'Netlify-Vary',
} as const

const THEME_COOKIE = 'theme'

const NO_STORE = 'no-store'
const BROWSER_SHORT = 'public, max-age=3600, stale-while-revalidate=86400'
const BROWSER_STATS = 'public, max-age=86400, stale-while-revalidate=86400'
const BROWSER_STATIC = 'public, max-age=86400, stale-while-revalidate=604800'
const CDN_LONG = 'public, s-maxage=2592000, stale-while-revalidate=604800'
const CDN_CATALOG =
  'public, s-maxage=2592000, stale-while-revalidate=604800, stale-if-error=86400'
const CDN_STATS =
  'public, s-maxage=86400, stale-while-revalidate=86400, stale-if-error=86400'
const THEME_VARY = `cookie=${THEME_COOKIE}`
const THEME_QUERY_VARY = `${THEME_VARY},query`

type CacheHeaders = Record<string, string>
type CacheScope = 'page' | 'api'

interface CacheProfile {
  headers: CacheHeaders
  includeVersion?: boolean
  tags?: string[]
}

interface CacheHeaderOptions {
  includeVersion?: boolean
  tags?: string[]
  varyQuery?: boolean
  varyHeaders?: string[]
}

interface NitroCacheOptions {
  base?: string
  getKey?: (event: H3Event) => string
  group?: string
  integrity?: string
  maxAge?: number
  name?: string
  shouldBypassCache?: (event: H3Event) => boolean
  shouldInvalidateCache?: (event: H3Event) => boolean
  staleMaxAge?: number
  swr?: boolean
}

interface CachedApiHandlerOptions {
  cache: NitroCacheOptions
  headers?: CacheHeaderOptions
  profile: ApiCacheProfile
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
    tags = [],
    vary,
    includeVersion = false,
  }: {
    tags?: string[]
    vary?: string
    includeVersion?: boolean
  } = {}
): CacheProfile {
  const extra: CacheHeaders = {}

  if (vary) {
    extra[HEADER.vary] = vary
  }

  return {
    headers: createHeaders(browser, cdn, extra),
    includeVersion,
    tags: normalizeCacheTags(tags),
  }
}

const sharedProfiles = {
  noStore: createProfile(NO_STORE, NO_STORE),
} as const

const pageProfiles = {
  rootNoStore: sharedProfiles.noStore,
  prerenderedStatic: createProfile(BROWSER_STATIC, CDN_LONG),
  themeAware: createProfile(BROWSER_SHORT, CDN_LONG, { vary: THEME_VARY }),
  themeAwareQuery: createProfile(BROWSER_SHORT, CDN_LONG, {
    vary: THEME_QUERY_VARY,
  }),
  noStore: sharedProfiles.noStore,
} as const satisfies Record<string, CacheProfile>

const apiProfiles = {
  catalog: createProfile(BROWSER_SHORT, CDN_CATALOG, {
    tags: [CACHE_TAGS.game],
    includeVersion: true,
  }),
  stats: createProfile(BROWSER_STATS, CDN_STATS, {
    tags: [CACHE_TAGS.stats],
    includeVersion: true,
  }),
  noStore: sharedProfiles.noStore,
} as const satisfies Record<string, CacheProfile>

const profileMaps: Record<CacheScope, Record<string, CacheProfile>> = {
  page: pageProfiles,
  api: apiProfiles,
}

type PageCacheProfile = keyof typeof pageProfiles
type ApiCacheProfile = keyof typeof apiProfiles
type AnyCacheProfile = PageCacheProfile | ApiCacheProfile

function setHeaders(event: H3Event, headers: CacheHeaders) {
  for (const [key, value] of Object.entries(headers)) {
    setResponseHeader(event, key, value)
  }
}

function buildVary({
  varyQuery = false,
  varyHeaders = [],
}: CacheHeaderOptions = {}): string | undefined {
  const parts: string[] = []

  if (varyHeaders.length) {
    parts.push(`header=${varyHeaders.join('|')}`)
  }

  if (varyQuery) {
    parts.push('query')
  }

  return parts.length ? parts.join(',') : undefined
}

function normalizeCacheTags(tags: readonly string[] = []): string[] {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))]
}

function mergeVary(current?: string, extra?: string): string | undefined {
  if (!current) return extra
  if (!extra) return current
  return `${current},${extra}`
}

function mergeTags(
  base: readonly string[] = [],
  extra: readonly string[] = []
) {
  return normalizeCacheTags([...base, ...extra])
}

function getProfile(scope: CacheScope, profile: AnyCacheProfile): CacheProfile {
  return profileMaps[scope][profile]!
}

function resolveCacheHeaders(
  scope: CacheScope,
  profile: AnyCacheProfile,
  options: CacheHeaderOptions = {}
): ResolvedCacheHeaders {
  const version = getGameVersion()
  const config = getProfile(scope, profile)
  const headers: CacheHeaders = { ...config.headers }
  const vary = mergeVary(headers[HEADER.vary], buildVary(options))
  const tags = mergeTags(config.tags, options.tags)
  const includeVersion = options.includeVersion ?? config.includeVersion

  if (includeVersion) {
    headers[GAME_VERSION_HEADER] = version
  }

  if (tags.length) {
    headers[HEADER.tag] = tags.join(',')
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

export function applyCacheHeaders(
  event: H3Event,
  scope: 'page',
  profile: PageCacheProfile,
  options?: CacheHeaderOptions
): string
export function applyCacheHeaders(
  event: H3Event,
  scope: 'api',
  profile: ApiCacheProfile,
  options?: CacheHeaderOptions
): string
export function applyCacheHeaders(
  event: H3Event,
  scope: CacheScope,
  profile: AnyCacheProfile,
  options: CacheHeaderOptions = {}
): string {
  const { headers, version } = resolveCacheHeaders(scope, profile, options)

  setHeaders(event, headers)

  return version
}

export function getGameVersionRequestHeaders(): CacheHeaders {
  return {
    [GAME_VERSION_HEADER]: getGameVersion(),
  }
}

export function applyPageCacheHeaders(
  event: H3Event,
  profile: PageCacheProfile
) {
  applyCacheHeaders(event, 'page', profile)
}

export function applyNoStoreHeaders(event: H3Event) {
  applyCacheHeaders(event, 'api', 'noStore')
}

export function applyApiCacheHeaders(
  event: H3Event,
  profileOrOptions: ApiCacheProfile | CacheHeaderOptions = 'catalog',
  maybeOptions: CacheHeaderOptions = {}
) {
  const profile =
    typeof profileOrOptions === 'string' ? profileOrOptions : 'catalog'
  const options =
    typeof profileOrOptions === 'string' ? maybeOptions : profileOrOptions

  return applyCacheHeaders(event, 'api', profile, options)
}

export const setCacheHeaders = applyApiCacheHeaders

export function defineCachedApiEventHandler<T>(
  handler: (event: H3Event) => Promise<T> | T,
  { cache, headers, profile }: CachedApiHandlerOptions
) {
  const cachedHandler = defineCachedEventHandler(handler, cache)

  return defineEventHandler(async (event) => {
    const data = await cachedHandler(event)
    applyCacheHeaders(event, 'api', profile, headers)
    return data
  })
}

const pageVersionVaryOptions = {
  includeVersion: true,
  varyHeaders: [GAME_VERSION_HEADER],
} satisfies CacheHeaderOptions

export const pageStatic = getCacheHeaders('page', 'prerenderedStatic')
export const pageThemeNoTag = getCacheHeaders('page', 'themeAware')
export const pageTheme = getCacheHeaders('page', 'themeAware', {
  tags: [CACHE_TAGS.game],
  ...pageVersionVaryOptions,
})
export const pageThemeQuery = getCacheHeaders('page', 'themeAwareQuery', {
  tags: [CACHE_TAGS.game],
  ...pageVersionVaryOptions,
})
export const noStoreHeaders = getCacheHeaders('page', 'noStore')
export const rootNoStoreHeaders = getCacheHeaders('page', 'rootNoStore')

export const pagePrerenderedStatic = pageStatic
export const pageThemeAwareNoTag = pageThemeNoTag
export const pageThemeAware = pageTheme
export const pageThemeAwareQuery = pageThemeQuery
export const noStore = noStoreHeaders
export const pageRootNoStore = rootNoStoreHeaders
