import { defineStore } from 'pinia'
import { Region } from '~/composables/useBannerPullApi'
import { setWithExpiry, getWithExpiry, removeItem } from '~/utils/localStorage'

export type Theme = 'light' | 'dark'

export interface UserProfile {
  id: string
  preferences?: {
    theme: Theme
    language: string
  }
}

export interface UserState {
  currentUser: UserProfile | null
  selectedRegion: Region
  theme: Theme
  uid: string | null
  authToken: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => {
    // Initialize theme from localStorage or system preference immediately
    const savedTheme = typeof window !== 'undefined'
      ? getWithExpiry<Theme>('theme')
      : null
    const initialTheme = savedTheme || 'light'

    // Initialize or generate UID
    const savedUid = typeof window !== 'undefined'
      ? getWithExpiry<string>('uid')
      : null
    
    // Initialize auth token
    const savedToken = typeof window !== 'undefined'
      ? getWithExpiry<string>('authToken')
      : null

    return {
      currentUser: null,
      selectedRegion: Region.AMERICA,
      theme: initialTheme,
      uid: savedUid,
      authToken: savedToken,
    }
  },

  getters: {
    user: (state) => state.currentUser,
    getSelectedRegion: (state) => state.selectedRegion,
    getCurrentTheme: (state) => state.theme,
    getUid: (state) => state.uid,
    getAuthToken: (state) => state.authToken,
  },

  actions: {
    setRegion(region: Region) {
      this.selectedRegion = region
    },

    initializeTheme() {
      const savedTheme = typeof window !== 'undefined'
        ? getWithExpiry<Theme>('theme')
        : null
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

      // Update user profile if exists
      if (this.currentUser?.preferences) {
        this.currentUser.preferences.theme = newTheme
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
