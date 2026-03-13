import { setResponseHeader, type H3Event } from 'h3'

import { resolveCacheHeaders } from './cacheProfiles'
import type {
  ApiCacheProfile,
  CacheHeaderOptions,
  CacheHeaders,
  CacheScope,
  PageCacheProfile,
  AnyCacheProfile,
} from './cacheProfiles'

function setHeaders(event: H3Event, headers: CacheHeaders) {
  for (const [key, value] of Object.entries(headers)) {
    setResponseHeader(event, key, value)
  }
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
