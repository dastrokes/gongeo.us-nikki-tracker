import type { H3Event } from 'h3'

import { getGameVersion } from '~/utils/gameVersion'

const BROWSER_CACHE_VALUE = 'public, max-age=3600, stale-while-revalidate=300'
const CDN_CACHE_VALUE =
  'public, s-maxage=604800, stale-while-revalidate=86400, stale-if-error=86400, durable'

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
  const varyParts: string[] = []

  if (varyQuery.length) {
    varyParts.push(`query=${varyQuery.join(',')}`)
  }
  varyParts.push('cookie=__none__')

  setResponseHeader(event, 'Cache-Control', BROWSER_CACHE_VALUE)
  setResponseHeader(event, 'CDN-Cache-Control', CDN_CACHE_VALUE)
  setResponseHeader(event, 'Netlify-CDN-Cache-Control', CDN_CACHE_VALUE)
  setResponseHeader(event, 'Netlify-Vary', varyParts.join(';'))
  setResponseHeader(event, 'X-Data-Version', version)

  return version
}
