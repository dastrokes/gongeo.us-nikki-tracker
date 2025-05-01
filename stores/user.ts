import { defineStore } from 'pinia'
import { Region } from '~/composables/useBannerPullApi'
import { setWithExpiry, getWithExpiry, removeItem } from '~/utils/localStorage'

export type Theme = 'light' | 'dark'

export interface UserState {
  region: Region
  theme: Theme
  uid: string | null
  authToken: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => {
    // Initialize theme
    const savedTheme =
      typeof window !== 'undefined' ? getWithExpiry<Theme>('theme') : null
    const initialTheme = savedTheme || 'light'

    // Initialize UID
    const savedUid =
      typeof window !== 'undefined' ? getWithExpiry<string>('uid') : null

    // Initialize auth token
    const savedToken =
      typeof window !== 'undefined' ? getWithExpiry<string>('authToken') : null

    return {
      region: Region.AMERICA,
      theme: initialTheme,
      uid: savedUid,
      authToken: savedToken,
    }
  },

  getters: {
    getRegion: (state) => state.region,
    getCurrentTheme: (state) => state.theme,
    getUid: (state) => state.uid,
    getAuthToken: (state) => state.authToken,
  },

  actions: {
    reset() {
      // Clear store state
      this.region = Region.AMERICA
      this.theme = 'light'
      this.uid = null
      this.authToken = null

      // Clear local storage
      if (typeof window !== 'undefined') {
        removeItem('theme')
        removeItem('uid')
        removeItem('authToken')
      }
    },

    setRegion(region: Region) {
      this.region = region
    },

    initializeTheme() {
      const savedTheme =
        typeof window !== 'undefined' ? getWithExpiry<Theme>('theme') : null
      if (savedTheme) {
        this.setTheme(savedTheme)
      } else {
        this.setTheme('light')
      }
    },

    setTheme(newTheme: Theme) {
      this.theme = newTheme
      if (typeof window !== 'undefined') {
        setWithExpiry('theme', newTheme)
      }
    },

    setUid(uid: string) {
      this.uid = uid
      if (typeof window !== 'undefined') {
        setWithExpiry('uid', uid)
      }
    },

    setAuthToken(token: string | null) {
      this.authToken = token
      if (typeof window !== 'undefined') {
        if (token) {
          setWithExpiry('authToken', token)
        } else {
          removeItem('authToken')
        }
      }
    },
  },
})
