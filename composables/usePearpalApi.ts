import type { CookieData, PearpalUserInfoResponse } from '~/types/api'

export const usePearpalApi = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch user info from external Pearpal API
  const fetchUserInfo = async (
    cookieData: CookieData,
    region: Region
  ): Promise<PearpalUserInfoResponse> => {
    loading.value = true
    error.value = null

    try {
      // Get zone_id based on region
      const zoneId = {
        [Region.AMERICA]: 6,
        [Region.EUROPE]: 2,
        [Region.ASIA]: 4,
        [Region.CHINA]: 1,
        [Region.TW]: 8,
      }[region]

      if (!zoneId) {
        throw new Error('Invalid region')
      }

      // Determine API URL based on region
      const apiUrl =
        region === Region.CHINA
          ? 'https://myl-api.nuanpaper.com/v1/strategy/user/info/get'
          : 'https://pearpal-api.infoldgames.com/v1/strategy/user/info/get'

      // Set client_id based on region
      const clientId = region === Region.CHINA ? 1106 : 1116

      const response = await $fetch<PearpalUserInfoResponse>(apiUrl, {
        method: 'POST',
        body: {
          client_id: clientId,
          token: cookieData.token,
          openid: cookieData.id,
        },
      })

      return response
    } catch (err: Error | unknown) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Failed to fetch user info from Pearpal API'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch note book info (gacha data) from external Pearpal API
  const fetchNoteBookInfo = async (
    cookieData: CookieData,
    region: Region
  ): Promise<ArrayBuffer> => {
    loading.value = true
    error.value = null

    try {
      // Get zone_id based on region
      const zoneId = {
        [Region.AMERICA]: 6,
        [Region.EUROPE]: 2,
        [Region.ASIA]: 4,
        [Region.CHINA]: 1,
        [Region.TW]: 8,
      }[region]

      if (!zoneId) {
        throw new Error('Invalid region')
      }

      // Determine API URL based on region
      const apiUrl =
        region === Region.CHINA
          ? 'https://myl-api.nuanpaper.com/v1/strategy/user/note/book/info'
          : 'https://pearpal-api.infoldgames.com/v1/strategy/user/note/book/info'

      // Set client_id based on region
      const clientId = region === Region.CHINA ? 1106 : 1116

      const response = await $fetch<ArrayBuffer>(apiUrl, {
        method: 'POST',
        responseType: 'arrayBuffer',
        body: {
          client_id: clientId,
          token: cookieData.token,
          openid: cookieData.id,
        },
      })

      return response
    } catch (err: Error | unknown) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Failed to fetch note book info from Pearpal API'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    fetchUserInfo,
    fetchNoteBookInfo,
  }
}
