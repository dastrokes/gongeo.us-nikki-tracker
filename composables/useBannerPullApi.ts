import { ref } from 'vue'
import type { CookieData, VerifyResponse, QueryResponse } from '~/types/api'
import { useUserStore, Region } from '~/stores/user'
import { BANNER_DATA } from '~/data/banners'
import { retryRequest, sleep } from '~/server/utils/retry'

export const REGION_URLS = {
  [Region.EUROPE]: 'https://x6en-clickhouse.infoldgames.com/v1/tlog',
  [Region.AMERICA]: 'https://X6us-clickhouse.infoldgames.com/v1/tlog',
  [Region.CHINA]: 'https://x6cn-clickhouse.nuanpaper.com/v1/tlog',
  [Region.TW]: 'https://X6tw-clickhouse.infoldgames.com/v1/tlog',
  [Region.ASIA]: 'https://X6asia-clickhouse.infoldgames.com/v1/tlog',
} as const

const REQUEST_DELAY = 1000

export const useBannerPullApi = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const progress = ref<{ banner: number; page: number } | null>(null)
  const userStore = useUserStore()

  // Get current API base URL based on selected region
  const getBaseUrl = () => {
    const region = userStore.getRegion as Region
    return REGION_URLS[region]
  }

  // Verify authentication
  const verifyAuth = async (cookieData: CookieData) => {
    loading.value = true
    error.value = null

    try {
      const response = await retryRequest(() =>
        $fetch<VerifyResponse>('/verify', {
          baseURL: getBaseUrl(),
          method: 'GET',
          params: {
            token: cookieData.token,
            roleid: cookieData.roleid,
            id: cookieData.id,
          },
        })
      )

      if (response?.code === 0) {
        userStore.setAuthToken(response.data)
        userStore.setUid(cookieData.roleid)
        return true
      } else {
        error.value = response?.info || 'Verification failed'
        return false
      }
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : 'Failed to verify authentication'
      return false
    } finally {
      loading.value = false
    }
  }
  // Main function to fetch all banner history
  const fetchPullHistory = async (selectedBannerIds?: number[]) => {
    const token = userStore.getAuthToken
    if (!token) {
      error.value = 'Not authenticated'
      return null
    }

    loading.value = true
    error.value = null
    progress.value = null

    try {
      const bannerIds =
        selectedBannerIds ||
        Object.values(BANNER_DATA).map((banner) => banner.bannerId)

      const allResults = []

      for (const bannerId of bannerIds) {
        try {
          const results = await queryBannerHistory(bannerId, token)
          if (results) {
            allResults.push({ bannerId, results })
          }

          // Delay between banners
          if (bannerId !== bannerIds[bannerIds.length - 1]) {
            await sleep(REQUEST_DELAY)
          }
        } catch (e) {
          console.error(`Failed to fetch banner ${bannerId}:`, e)
          // Continue with other banners even if one fails
          continue
        }
      }

      return allResults
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : 'Failed to fetch pull history'
      return null
    } finally {
      loading.value = false
    }
  }

  // Query all pages for a single banner
  const queryBannerHistory = async (
    bannerId: number,
    token: string
  ): Promise<QueryResponse[]> => {
    const results: QueryResponse[] = []
    let page = 1
    let isEnd = false

    while (!isEnd) {
      progress.value = { banner: bannerId, page }

      const response = await queryBannerPage(bannerId, page, token)

      if (response.code !== 0) {
        throw new Error(response.info || 'Failed to fetch banner data')
      }

      results.push(response)
      isEnd = response.data.end
      page++

      if (!isEnd) {
        await sleep(REQUEST_DELAY)
      }
    }

    return results
  }

  // Query a single page for a banner
  const queryBannerPage = async (
    bannerId: number,
    page: number,
    token: string
  ): Promise<QueryResponse> => {
    const response = await retryRequest(() =>
      $fetch<QueryResponse>('/query', {
        baseURL: getBaseUrl(),
        method: 'GET',
        params: {
          page: page.toString(),
          args: bannerId,
          name: 'gacha',
          etime: Math.floor(Date.now() / 1000).toString(),
        },
        headers: {
          'X-Authority': token,
        },
      })
    )

    // Add banner_id to the response
    response.banner_id = bannerId
    return response
  }

  return {
    loading,
    progress,
    verifyAuth,
    fetchPullHistory,
  }
}
