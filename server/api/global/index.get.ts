import { useSupabaseClient } from '~/composables/useSupabaseClient'
import { BANNER_DATA } from '~/data/banners'
import {
  createInternalError,
  createUpstreamUnavailableError,
} from '~/utils/apiErrors'
import { GAME_VERSION_HEADER, setCacheHeaders } from '~/utils/cacheHeaders'
import { toErrorMessage } from '~/utils/errors'
import { getGameVersion } from '~/utils/gameVersion'
import { isTransientSupabaseError } from '~/utils/supabaseRetry'
import { getBannerStats, getCoreStats } from '~/utils/globalStats'

const latestBannerId = Math.max(
  ...Object.keys(BANNER_DATA).map((id) => Number.parseInt(id, 10))
)

export default defineCachedEventHandler(
  async (event) => {
    setCacheHeaders(event, {
      varyHeaders: [GAME_VERSION_HEADER],
    })

    const supabase = useSupabaseClient('server')

    try {
      const [coreCache, latestBannerCache] = await Promise.all([
        getCoreStats(supabase),
        getBannerStats(supabase, latestBannerId),
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
        bannerId: latestBannerCache.payload.bannerId ?? latestBannerId,
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
    maxAge: 60 * 60, // 1 hour
    name: 'global-bootstrap',
    getKey: () => `${getGameVersion()}:global:latest`,
    swr: true,
  }
)
