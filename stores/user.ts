import { defineStore } from 'pinia'
import { Region } from '~/composables/useBannerPullApi'

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
  isAuthenticated: boolean
  loading: boolean
  authToken: string | null
  selectedRegion: Region
  theme: Theme
}

export const useUserStore = defineStore('user', {
  state: (): UserState => {
    // Initialize theme from localStorage or system preference immediately
    const savedTheme =
      typeof window !== 'undefined'
        ? (localStorage.getItem('theme') as Theme | null)
        : null
    const initialTheme = savedTheme || 'light'

    return {
      currentUser: null,
      isAuthenticated: false,
      loading: false,
      authToken: null,
      selectedRegion: Region.AMERICA,
      theme: initialTheme,
    }
  },

  getters: {
    user: (state) => state.currentUser,
    isLoggedIn: (state) => state.isAuthenticated,
    getAuthToken: (state) => state.authToken,
    getSelectedRegion: (state) => state.selectedRegion,
    getCurrentTheme: (state) => state.theme,
  },

  actions: {
    setAuthToken(token: string | null) {
      this.authToken = token
    },

    setRegion(region: Region) {
      this.selectedRegion = region
    },

    setTheme(newTheme: Theme) {
      this.theme = newTheme
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme)
      }

      // Update user profile if exists
      if (this.currentUser?.preferences) {
        this.currentUser.preferences.theme = newTheme
      }
    },

    initializeTheme() {
      const savedTheme =
        typeof window !== 'undefined'
          ? (localStorage.getItem('theme') as Theme | null)
          : null
      if (savedTheme) {
        this.setTheme(savedTheme)
      } else {
        this.setTheme('light')
      }
    },
  },
})
