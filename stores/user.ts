import { defineStore } from 'pinia'
import { Region } from '~/composables/useBannerPullApi'

export interface UserProfile {
  id: string
  preferences?: {
    theme: 'light' | 'dark'
    language: string
  }
}

export interface UserState {
  currentUser: UserProfile | null
  isAuthenticated: boolean
  loading: boolean
  authToken: string | null
  selectedRegion: Region
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    currentUser: null,
    isAuthenticated: false,
    loading: false,
    authToken: null,
    selectedRegion: Region.EUROPE,
  }),

  getters: {
    user: (state) => state.currentUser,
    isLoggedIn: (state) => state.isAuthenticated,
    getAuthToken: (state) => state.authToken,
    getSelectedRegion: (state) => state.selectedRegion,
  },

  actions: {
    async auth() {},

    setAuthToken(token: string | null) {
      this.authToken = token
    },

    setRegion(region: Region) {
      this.selectedRegion = region
    },
  },
})
