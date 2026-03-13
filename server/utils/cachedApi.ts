import { defineEventHandler, type H3Event } from 'h3'

type NitroCacheOptions = Parameters<typeof defineCachedEventHandler>[1]

interface CachedApiHandlerOptions {
  cache: NitroCacheOptions
  headers?: CacheHeaderOptions
  profile: ApiCacheProfile
}

export function defineCachedApiEventHandler<T>(
  handler: (event: H3Event) => Promise<T> | T,
  { cache, headers, profile }: CachedApiHandlerOptions
) {
  const cachedHandler = defineCachedEventHandler(handler, cache) as (
    event: H3Event
  ) => Promise<T> | T

  return defineEventHandler(async (event) => {
    const data = await cachedHandler(event)
    applyCacheHeaders(event, 'api', profile, headers)
    return data
  })
}
