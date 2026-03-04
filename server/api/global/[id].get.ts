import { useSupabaseClient } from '~/composables/useSupabaseClient'
import { BANNER_DATA } from '~/data/banners'
import {
  createInternalError,
  createInvalidIdError,
  createNotFoundError,
  createUpstreamUnavailableError,
} from '~/utils/apiErrors'
import { GAME_VERSION_HEADER, setCacheHeaders } from '~/utils/cacheHeaders'
import { toErrorMessage } from '~/utils/errors'
import { getGameVersion } from '~/utils/gameVersion'
import { isTransientSupabaseError } from '~/utils/supabaseRetry'
import { getBannerStats } from '~/utils/globalStats'

export default defineCachedEventHandler(
  async (event) => {
    setCacheHeaders(event, {
      varyHeaders: [GAME_VERSION_HEADER],
    })

    const idParam = getRouterParam(event, 'id')
    const bannerId = Number.parseInt(idParam ?? '', 10)
    if (Number.isNaN(bannerId) || bannerId < 1) {
      throw createInvalidIdError('banner')
    }

    if (!Object.prototype.hasOwnProperty.call(BANNER_DATA, bannerId)) {
      throw createNotFoundError('banner')
    }

    const supabase = useSupabaseClient('server')

    try {
      const bannerCache = await getBannerStats(supabase, bannerId)

      return {
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
    maxAge: 60 * 60 * 24, // 1 day
    name: 'global-banner-first-item',
    getKey: (event) =>
      `${getGameVersion()}:global:banner:${getRouterParam(event, 'id') ?? 'invalid'}`,
    swr: true,
  }
)
