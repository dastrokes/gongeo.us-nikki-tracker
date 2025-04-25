import { ref, computed } from 'vue'
import axios, { AxiosError } from 'axios'
import type { CookieData, VerifyResponse, QueryResponse } from '~/types/api'
import { useUserStore } from '~/stores/user'
import { BANNER_DATA } from '~/data/banners'

export enum Region {
  EUROPE = 'EUROPE',
  AMERICA = 'AMERICA',
  CHINA = 'CHINA',
  TW = 'TW',
  ASIA = 'ASIA',
}

export const REGION_URLS = {
  [Region.EUROPE]: 'https://x6en-clickhouse.infoldgames.com/v1/tlog',
  [Region.AMERICA]: 'https://X6us-clickhouse.infoldgames.com/v1/tlog',
  [Region.CHINA]: 'https://x6cn-clickhouse.nuanpaper.com/v1/tlog',
  [Region.TW]: 'https://X6tw-clickhouse.infoldgames.com/v1/tlog',
  [Region.ASIA]: 'https://X6asia-clickhouse.infoldgames.com/v1/tlog',
} as const

export const REGION_LABELS = {
  [Region.AMERICA]: 'America',
  [Region.EUROPE]: 'Europe',
  [Region.CHINA]: 'China',
  [Region.TW]: 'TW/HK/Macau',
  [Region.ASIA]: 'Asia',
} as const

// Constants
const REQUEST_DELAY = 1000 // 1 second delay between requests
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 2000

// Default headers
const DEFAULT_HEADERS = {
  Accept: '*/*',
  'X-Client-Info': 'X6Game/UE5-CL-0 Windows/10.0.19045.1.256.64bit',
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Create axios instance with default config
const createApi = (baseURL: string) =>
  axios.create({
    baseURL,
    timeout: 10000,
    headers: DEFAULT_HEADERS,
  })

// Helper function for exponential backoff retries
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  retryCount = 0
): Promise<T> => {
  try {
    return await requestFn()
  } catch (error) {
    if (
      !(error instanceof AxiosError) ||
      !error.response ||
      retryCount >= MAX_RETRIES
    ) {
      throw error
    }

    const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount)
    await sleep(delay)
    return retryRequest(requestFn, retryCount + 1)
  }
}

export const useBannerPullApi = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const progress = ref<{ banner: number; page: number } | null>(null)
  const userStore = useUserStore()

  // Get current API instance based on selected region
  const getApi = () => {
    const region = userStore.getSelectedRegion as Region
    return createApi(REGION_URLS[region])
  }

  const setRegion = (region: Region) => {
    userStore.setRegion(region)
  }

  // Query a single page for a banner
  const queryBannerPage = async (
    bannerId: number,
    page: number,
    authToken: string
  ): Promise<QueryResponse> => {
    const response = await retryRequest(() =>
      getApi().get<QueryResponse>('/query', {
        params: {
          page: page.toString(),
          args: bannerId,
          name: 'gacha',
          etime: Math.floor(Date.now() / 1000).toString(),
        },
        headers: {
          'X-Authority': authToken,
        },
      })
    ).then((response) => response.data)

    // Add banner_id to the response
    response.banner_id = bannerId
    return response
  }

  // Query all pages for a single banner
  const queryBannerHistory = async (
    bannerId: number,
    authToken: string
  ): Promise<QueryResponse[]> => {
    const results: QueryResponse[] = []
    let page = 1
    let isEnd = false

    while (!isEnd) {
      progress.value = { banner: bannerId, page }

      const response = await queryBannerPage(bannerId, page, authToken)

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

  // Main function to fetch all banner history
  const fetchPullHistory = async () => {
    const authToken = userStore.getAuthToken
    if (!authToken) {
      error.value = 'Not authenticated'
      return null
    }

    loading.value = true
    error.value = null
    progress.value = null

    try {
      const bannerIds = Object.values(BANNER_DATA)
        .map((banner) => banner.bannerId)
        .filter((id) => id !== 1) // Exclude permanent banner

      const allResults = []

      for (const bannerId of bannerIds) {
        try {
          const bannerResults = await queryBannerHistory(bannerId, authToken)
          allResults.push({ bannerId, results: bannerResults })

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
      error.value = axios.isAxiosError(e)
        ? e.response?.data?.info || e.message
        : 'Failed to fetch pull history'
      return null
    } finally {
      loading.value = false
      progress.value = null
    }
  }

  const verifyAuth = async (cookieData: CookieData) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await retryRequest(() =>
        getApi().get<VerifyResponse>('/verify', {
          params: {
            token: cookieData.token,
            roleid: cookieData.roleid,
            id: cookieData.id,
          },
        })
      )

      if (data.code === 0) {
        userStore.setAuthToken(data.data)
        return true
      } else {
        error.value = data.info
        return false
      }
    } catch (e) {
      error.value = axios.isAxiosError(e)
        ? e.response?.data?.info || e.message
        : 'Failed to verify authentication'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    progress,
    verifyAuth,
    fetchPullHistory,
    selectedRegion: computed(() => userStore.getSelectedRegion),
    setRegion,
  }
}
