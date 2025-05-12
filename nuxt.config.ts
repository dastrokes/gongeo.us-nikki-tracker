// https://nuxt.com/docs/api/configuration/nuxt-config
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'

export default defineNuxtConfig({
  devtools: { enabled: true },

  // Add global CSS files
  css: ['~/assets/styles/global.scss'],

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxtjs/i18n',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@bg-dev/nuxt-naiveui',
    'nuxt-echarts',
  ],

  i18n: {
    restructureDir: 'locales',
    langDir: './',
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English',
        files: [
          'en/common.json',
          'en/outfit.json',
          'en/meta.json',
          'en/error.json',
        ],
      },
      {
        code: 'zh',
        iso: 'zh-CN',
        name: '中文',
        files: [
          'zh/common.json',
          'zh/outfit.json',
          'zh/meta.json',
          'zh/error.json',
        ],
      },
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    lazy: true,
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'no prefix',
      alwaysRedirect: false,
      fallbackLocale: 'en',
    },
  },

  runtimeConfig: {
    supabaseUrl: process.env.SUPABASE_DATABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

    public: {
      gongeousSecretKey: process.env.GONGEOUS_APP_SECRET,
      supabaseUrl: process.env.SUPABASE_DATABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      siteUrl:
        process.env.NUXT_PUBLIC_SITE_URL || 'https://gongeous.netlify.app/',
    },
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://gongeous.netlify.app/',
    name: 'gongeo.us Infinity Nikki Resonance Tracker',
  },

  image: {
    dir: 'public',
    provider: process.env.NODE_ENV === 'development' ? 'ipx' : 'netlify',
    static: {
      baseURL:
        process.env.NUXT_PUBLIC_SITE_URL || 'https://gongeous.netlify.app/',
    },
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
      '2xl': 1536,
    },
  },

  echarts: {
    ssr: true,
    charts: ['BarChart', 'LineChart'],
    components: [
      'TooltipComponent',
      'LegendComponent',
      'GridComponent',
      'TitleComponent',
    ],
  },

  nitro: {
    preset: 'netlify-legacy',
  },

  compatibilityDate: '2025-02-01',

  components: {
    dirs: ['~/components'],
  },

  vite: {
    plugins: [
      Components({
        resolvers: [NaiveUiResolver()],
        dts: true,
      }),
    ],
  },
})
