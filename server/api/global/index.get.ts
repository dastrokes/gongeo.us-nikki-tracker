import { LATEST_BANNER_ID } from '~~/data/config'

export default defineCachedApiEventHandler(
  async () => {
    const supabase = useSupabaseServerClient()

    try {
      const [coreCache, latestBannerCache] = await Promise.all([
        getCoreStats(supabase),
        getBannerStats(supabase, LATEST_BANNER_ID),
      ])

      return {
        date:
          coreCache.payload.date ??
          coreCache.updated_at ??
          new Date().toISOString(),
        pulls: coreCache.payload.pulls ?? 0,
        users: coreCache.payload.users ?? 0,
        pullsPerBanner: coreCache.payload.pullsPerBanner ?? {},
        fiveStarDistribution: coreCache.payload.fiveStarDistribution ?? {},
        fourStarType2Distribution:
          coreCache.payload.fourStarType2Distribution ?? {},
        fourStarType3Distribution:
          coreCache.payload.fourStarType3Distribution ?? {},
        bannerId: latestBannerCache.payload.bannerId ?? LATEST_BANNER_ID,
        f: latestBannerCache.payload.f ?? {},
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      const message = toErrorMessage(error, 'Failed to fetch global stats')
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch global stats: ${message}`)
        throw createUpstreamUnavailableError('global stats')
      }

      console.error(`Failed to fetch global stats: ${message}`)
      throw createInternalError('global stats')
    }
  },
  {
    cache: {
      maxAge: 60 * 60 * 24,
      staleMaxAge: 60 * 60 * 24,
      name: 'global-bootstrap',
      getKey: () => `${getGameVersion()}:global:latest`,
      swr: true,
    },
    headers: {
      varyHeaders: [GAME_VERSION_HEADER],
    },
    profile: 'stats',
  }
)
