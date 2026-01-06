import type { H3Event } from 'h3'

import { getGameVersion } from '~/utils/gameVersion'

const BROWSER_CACHE_VALUE = 'public, max-age=3600, stale-while-revalidate=300'
const CDN_CACHE_VALUE = 'public, s-maxage=604800, stale-while-revalidate=86400'

interface CacheHeaderOptions {
  varyQuery?: string[]
}

/**
 * Apply consistent Netlify Edge CDN cache headers.
 * Returns the data version so callers can reuse it for response metadata.
 */
export function setCacheHeaders(
  event: H3Event,
  { varyQuery = [] }: CacheHeaderOptions = {}
) {
  const version = getGameVersion()
  const netlifyVaryParts: string[] = []

  if (varyQuery.length) {
    // Netlify-Vary query keys are pipe-delimited.
    // Example: Netlify-Vary: query=page|quality|type
    netlifyVaryParts.push(`query=${varyQuery.join('|')}`)
  }

  setResponseHeader(event, 'Cache-Control', BROWSER_CACHE_VALUE)
  setResponseHeader(event, 'CDN-Cache-Control', CDN_CACHE_VALUE)
  setResponseHeader(event, 'Netlify-CDN-Cache-Control', CDN_CACHE_VALUE)
  if (netlifyVaryParts.length) {
    // Netlify-Vary directives are comma-delimited.
    setResponseHeader(event, 'Netlify-Vary', netlifyVaryParts.join(','))
  }
  setResponseHeader(event, 'X-Data-Version', version)

  return version
}
