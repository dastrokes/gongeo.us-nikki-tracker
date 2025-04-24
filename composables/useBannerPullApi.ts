import { ref, computed } from 'vue'
import axios, { AxiosError } from 'axios'
import type { CookieData, VerifyResponse, QueryResponse } from '~/types/api'
import { useUserStore } from '~/stores/user'
import { BANNER_DATA } from '~/data/banners'

export enum Region {
  EUROPE = 'EUROPE',
  ASIA = 'ASIA',
  TW = 'TW',
  AMERICA = 'AMERICA',
  CHINA = 'CHINA',
}

export const REGION_URLS = {
  [Region.AMERICA]: 'https://X6us-clickhouse.infoldgames.com/v1/tlog',
  [Region.EUROPE]: 'https://x6en-clickhouse.infoldgames.com/v1/tlog',
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

// Constants for retry configuration
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000
const REQUEST_INTERVAL = 1000

let lastRequestTime = 0

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Default headers for all requests
const DEFAULT_HEADERS = {
  Accept: '*/*',
  'X-Client-Info': 'X6Game/UE5-CL-0 Windows/10.0.19045.1.256.64bit',
}

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
      error.response.status >= 500 ||
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
  const userStore = useUserStore()

  // Get current API instance based on selected region
  const getApi = () => {
    const region = userStore.getSelectedRegion as Region
    const api = createApi(REGION_URLS[region])

    // Add request interceptor for throttling
    api.interceptors.request.use(async (config) => {
      const now = Date.now()
      const timeSinceLastRequest = now - lastRequestTime

      if (timeSinceLastRequest < REQUEST_INTERVAL) {
        await sleep(REQUEST_INTERVAL - timeSinceLastRequest)
      }

      lastRequestTime = Date.now()
      return config
    })

    return api
  }

  const setRegion = (region: Region) => {
    userStore.setRegion(region)
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

  const fetchPullHistory = async (page: number = 1) => {
    const authToken = userStore.getAuthToken
    if (!authToken) {
      error.value = 'Not authenticated'
      return null
    }

    loading.value = true
    error.value = null

    try {
      // Get all banner IDs except the permanent banner (ID: '1')
      const bannerIds = Object.keys(BANNER_DATA).filter((id) => id !== '1')

      // Make sequential requests for each banner
      const responses = []
      for (const bannerId of bannerIds) {
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
        )
        responses.push(response)
      }

      // Find the first successful response (code === 0)
      const successfulResponse = responses.find(
        (response) => response.data.code === 0
      )

      if (successfulResponse) {
        return successfulResponse.data
      } else {
        error.value = 'No successful responses from any banner'
        return null
      }
    } catch (e) {
      error.value = axios.isAxiosError(e)
        ? e.response?.data?.info || e.message
        : 'Failed to fetch pull history'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    verifyAuth,
    fetchPullHistory,
    selectedRegion: computed(() => userStore.getSelectedRegion),
    setRegion,
  }
}
