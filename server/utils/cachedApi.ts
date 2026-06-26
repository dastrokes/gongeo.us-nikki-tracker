import { defineEventHandler, type H3Event } from 'h3'

type NitroCacheOptions = Parameters<typeof defineCachedEventHandler>[1]

interface CachedApiHandlerOptions {
  cache: NitroCacheOptions | false
  headers?: CacheHeaderOptions | ((event: H3Event) => CacheHeaderOptions)
  profile: ApiCacheProfile
}

export function defineCachedApiEventHandler<T>(
  handler: (event: H3Event) => Promise<T> | T,
  { cache, headers, profile }: CachedApiHandlerOptions
) {
  const responseHandler =
    cache === false
      ? handler
      : (defineCachedEventHandler(handler, cache) as typeof handler)

  return defineEventHandler(async (event) => {
    const data = await responseHandler(event)
    applyCacheHeaders(
      event,
      'api',
      profile,
      typeof headers === 'function' ? headers(event) : headers
    )
    return data
  })
}
