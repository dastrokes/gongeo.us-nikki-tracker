import type { H3Event } from 'h3'

import { getGameVersion } from './gameVersion'

const BROWSER_CACHE_VALUE = 'public, max-age=300'
const CDN_CACHE_VALUE =
  'public, s-maxage=1209600, stale-while-revalidate=86400, stale-if-error=86400'
const CDN_CACHE_TAG = 'cache-purge'
export const GAME_VERSION_HEADER = 'X-Game-Version'

export const CACHE_STATIC = {
  'Cache-Control': 'public, max-age=86400, immutable',
  'Netlify-CDN-Cache-Control':
    'public, s-maxage=2592000, stale-while-revalidate=604800',
  'Netlify-Vary': 'cookie=i18n_redirected',
}

export const CACHE_STABLE = {
  'Cache-Control': 'public, max-age=300',
  'Netlify-CDN-Cache-Control':
    'public, s-maxage=1209600, stale-while-revalidate=86400',
  'Netlify-Vary':
    'header=' + GAME_VERSION_HEADER + ',cookie=i18n_redirected,query',
  'Netlify-Cache-Tag': CDN_CACHE_TAG,
}

export const CACHE_DYNAMIC = {
  'Cache-Control': 'public, max-age=300',
  'Netlify-CDN-Cache-Control':
    'public, s-maxage=3600, stale-while-revalidate=86400',
  'Netlify-Vary': 'header=' + GAME_VERSION_HEADER + ',cookie=i18n_redirected',
}

interface CacheHeaderOptions {
  varyQuery?: boolean
  varyHeaders?: string[]
}

type CacheHeaderResult = {
  headers: Record<string, string>
  version: string
}

function buildCacheHeaders({
  varyQuery = false,
  varyHeaders = [],
}: CacheHeaderOptions = {}): CacheHeaderResult {
  const version = getGameVersion()
  const netlifyVaryParts: string[] = []

  if (varyQuery) {
    netlifyVaryParts.push('query')
  }

  if (varyHeaders.length) {
    // Netlify-Vary headers are pipe-delimited.
    // Example: Netlify-Vary: header=Device-Type|App-Version
    netlifyVaryParts.push(`header=${varyHeaders.join('|')}`)
  }

  const headers: Record<string, string> = {
    'Cache-Control': BROWSER_CACHE_VALUE,
    'Netlify-CDN-Cache-Control': CDN_CACHE_VALUE,
    'Netlify-Cache-Tag': CDN_CACHE_TAG,
    [GAME_VERSION_HEADER]: version,
  }

  if (netlifyVaryParts.length) {
    // Netlify-Vary directives are comma-delimited.
    headers['Netlify-Vary'] = netlifyVaryParts.join(',')
  }

  return { headers, version }
}

/**
 * Apply consistent Netlify Edge CDN cache headers.
 * Returns the data version so callers can reuse it for response metadata.
 */
export function setCacheHeaders(
  event: H3Event,
  { varyQuery = false, varyHeaders = [] }: CacheHeaderOptions = {}
) {
  const { headers, version } = buildCacheHeaders({
    varyQuery,
    varyHeaders,
  })

  for (const [key, value] of Object.entries(headers)) {
    setResponseHeader(event, key, value)
  }

  return version
}
