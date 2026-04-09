export type Theme = 'light' | 'dark'

export enum Region {
  EUROPE = 'EUROPE',
  AMERICA = 'AMERICA',
  CHINA = 'CHINA',
  TW = 'TW',
  ASIA = 'ASIA',
}

export interface UserState {
  region: Region
  theme: Theme
  uid: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => {
    // Get cookie helpers
    const { get, remove } = useCookieHelpers()

    // Initialize theme
    const savedTheme = get('theme') as Theme
    const systemPrefersDark =
      import.meta.client &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light')

    if (import.meta.client) {
      remove('uid')
      remove('authToken')
    }

    return {
      region: Region.AMERICA,
      theme: initialTheme,
      uid: null,
    }
  },

  getters: {
    getRegion: (state) => state.region,
    getCurrentTheme: (state) => state.theme,
  },

  actions: {
    reset() {
      const { remove } = useCookieHelpers()

      // Clear store state
      this.region = Region.AMERICA
      this.uid = null

      // Clear cookies
      remove('uid')
      remove('authToken')
    },

    setRegion(region: Region) {
      if (this.region === region) return
      this.region = region
    },

    initializeTheme() {
      const { get } = useCookieHelpers()

      const savedTheme = get('theme') as Theme
      if (savedTheme) {
        this.setTheme(savedTheme)
      } else {
        const systemPrefersDark =
          import.meta.client &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
        this.setTheme(systemPrefersDark ? 'dark' : 'light')
      }
    },

    setTheme(newTheme: Theme) {
      const { set } = useCookieHelpers()

      this.theme = newTheme
      set('theme', newTheme)
    },

    setUid(uid: string | null) {
      this.uid = uid
    },
  },
})
