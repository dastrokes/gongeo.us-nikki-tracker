import { BANNER_DATA } from '~~/data/banners'

export default defineCachedApiEventHandler(
  async (event) => {
    const idParam = getRouterParam(event, 'id')
    const bannerId = Number.parseInt(idParam ?? '', 10)
    if (Number.isNaN(bannerId) || bannerId < 1) {
      throw createInvalidIdError('banner')
    }

    if (!Object.prototype.hasOwnProperty.call(BANNER_DATA, bannerId)) {
      throw createNotFoundError('banner')
    }

    const supabase = useSupabaseServerClient()

    try {
      const bannerCache = await getBannerStats(supabase, bannerId)

      return {
        date:
          bannerCache.payload.date ??
          bannerCache.updated_at ??
          new Date().toISOString(),
        bannerId: bannerCache.payload.bannerId ?? bannerId,
        f: bannerCache.payload.f ?? {},
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      const message = toErrorMessage(
        error,
        `Failed to fetch banner first-item data ${bannerId}`
      )
      if (isTransientSupabaseError(error)) {
        console.warn(
          `Failed to fetch banner first-item data ${bannerId}: ${message}`
        )
        throw createUpstreamUnavailableError('global banner data')
      }

      console.error(
        `Failed to fetch banner first-item data ${bannerId}: ${message}`
      )
      throw createInternalError('global banner data')
    }
  },
  {
    cache: {
      maxAge: 60 * 60 * 24,
      staleMaxAge: 60 * 60 * 24,
      name: 'global-banner-first-item',
      getKey: (event) =>
        `${getGameVersion()}:global:banner:${getRouterParam(event, 'id') ?? 'invalid'}`,
      swr: true,
    },
    headers: {
      varyHeaders: [GAME_VERSION_HEADER],
    },
    profile: 'stats',
  }
)
