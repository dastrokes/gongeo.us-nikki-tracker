import type { H3Event } from 'h3'

import { getGameVersion } from './gameVersion'

const BROWSER_CACHE_VALUE = 'public, max-age=300'
const CDN_CACHE_VALUE =
  'public, s-maxage=604800, stale-while-revalidate=86400, stale-if-error=86400'
export const GAME_VERSION_HEADER = 'X-Game-Version'

export const CACHE_STATIC = {
  'Cache-Control': 'public, max-age=86400, immutable',
  'Netlify-CDN-Cache-Control':
    'public, s-maxage=86400, stale-while-revalidate=604800',
}

export const CACHE_STABLE = {
  'Cache-Control': 'public, max-age=300',
  'Netlify-CDN-Cache-Control':
    'public, s-maxage=86400, stale-while-revalidate=86400',
  'Netlify-Vary': 'header=' + GAME_VERSION_HEADER,
}

export const CACHE_DYNAMIC = {
  'Cache-Control': 'public, max-age=300',
  'Netlify-CDN-Cache-Control':
    'public, s-maxage=3600, stale-while-revalidate=86400',
  'Netlify-Vary': 'header=' + GAME_VERSION_HEADER,
}

interface CacheHeaderOptions {
  varyQuery?: string[]
  varyHeaders?: string[]
}

type CacheHeaderResult = {
  headers: Record<string, string>
  version: string
}

function buildCacheHeaders({
  varyQuery = [],
  varyHeaders = [],
}: CacheHeaderOptions = {}): CacheHeaderResult {
  const version = getGameVersion()
  const netlifyVaryParts: string[] = []

  if (varyQuery.length) {
    // Netlify-Vary query keys are pipe-delimited.
    // Example: Netlify-Vary: query=page|quality|type
    netlifyVaryParts.push(`query=${varyQuery.join('|')}`)
  }

  if (varyHeaders.length) {
    // Netlify-Vary headers are pipe-delimited.
    // Example: Netlify-Vary: header=Device-Type|App-Version
    netlifyVaryParts.push(`header=${varyHeaders.join('|')}`)
  }

  const headers: Record<string, string> = {
    'Cache-Control': BROWSER_CACHE_VALUE,
    'Netlify-CDN-Cache-Control': CDN_CACHE_VALUE,
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
  { varyQuery = [], varyHeaders = [] }: CacheHeaderOptions = {}
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
