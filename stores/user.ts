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
  authToken: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => {
    // Get cookie helpers
    const { get } = useCookieHelpers()

    // Initialize theme
    const savedTheme = get('theme') as Theme
    const systemPrefersDark =
      import.meta.client &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light')

    // Initialize UID
    const savedUid = get('uid')

    // Initialize auth token
    const savedToken = get('authToken')

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
      const { remove } = useCookieHelpers()

      // Clear store state
      this.region = Region.AMERICA
      this.uid = null
      this.authToken = null

      // Clear cookies
      remove('uid')
      remove('authToken')
    },

    setRegion(region: Region) {
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
      const { set, remove } = useCookieHelpers()

      this.uid = uid
      if (uid) {
        set('uid', uid)
      } else {
        remove('uid')
      }
    },

    setAuthToken(token: string | null) {
      const { set, remove } = useCookieHelpers()

      this.authToken = token
      if (token) {
        set('authToken', token)
      } else {
        remove('authToken')
      }
    },
  },
})
