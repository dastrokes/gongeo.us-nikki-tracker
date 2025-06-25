// https://nuxt.com/docs/api/configuration/nuxt-config
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { BANNER_DATA } from './data/banners'
import { defaultLocale, i18nLocales } from './locales/i18n.config'

export default defineNuxtConfig({
  devtools: { enabled: false },

  // Add global CSS files
  css: ['~/assets/styles/global.scss'],

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxtjs/device',
    '@nuxtjs/i18n',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@bg-dev/nuxt-naiveui',
    '@sentry/nuxt/module',
    'nuxt-echarts',
  ],

  i18n: {
    restructureDir: 'locales',
    langDir: './',
    locales: i18nLocales,
    defaultLocale: defaultLocale,
    strategy: 'prefix_except_default',
    lazy: true,
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'no prefix',
      alwaysRedirect: false,
      fallbackLocale: defaultLocale,
    },
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
  },

  sitemap: {
    urls: Object.values(BANNER_DATA).flatMap((banner) =>
      i18nLocales.map(({ code }) => {
        const prefix = code === defaultLocale ? '' : `/${code}`
        return {
          loc: `${prefix}/banner/${banner.bannerId}`,
        }
      })
    ),
  },

  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseStorageToken: process.env.SUPABASE_STORAGE_TOKEN,

    public: {
      supabaseUrl: process.env.SUPABASE_DATABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      gongeousApiKey: process.env.GONGEOUS_API_KEY,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
    },
  },

  image: {
    dir: 'public',
    provider: process.env.NODE_ENV === 'development' ? 'ipx' : 'netlify',
    static: {
      baseURL: process.env.NUXT_PUBLIC_SITE_URL,
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
    ssr: process.env.NODE_ENV === 'production',
    renderer: 'canvas',
    charts: ['BarChart', 'LineChart'],
    components: [
      'TooltipComponent',
      'LegendComponent',
      'GridComponent',
      'TitleComponent',
    ],
  },

  nitro: {
    preset: 'netlify',
    future: {
      nativeSWR: true,
    },
    prerender: {
      routes: ['/', '/faq', '/about', '/banner'],
    },
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
    build: {
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      include: [
        'echarts',
        'echarts/core',
        'echarts/charts',
        'echarts/components',
        'echarts/renderers',
        '@vueuse/core',
        '@vueuse/integrations',
        'naive-ui',
      ],
    },
  },

  sentry: {
    sourceMapsUploadOptions: {
      org: 'dastrokes',
      project: 'gongeous',
    },

    autoInjectServerSentry: 'top-level-import',

    enabled: process.env.NODE_ENV === 'production',
  },

  sourcemap: {
    client: 'hidden',
  },
})
