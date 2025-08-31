// https://nuxt.com/docs/api/configuration/nuxt-config
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { BANNER_DATA } from './data/banners'
import { defaultLocale, i18nLocales } from './locales/locales'

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
    detectBrowserLanguage: {
      cookieKey: 'i18n_redirected',
      fallbackLocale: defaultLocale,
    },
    bundle: {
      optimizeTranslationDirective: false,
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

    public: {
      supabaseUrl: process.env.SUPABASE_DATABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      gongeousApiKey: process.env.GONGEOUS_API_KEY,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
      maintenance: process.env.NUXT_PUBLIC_MAINTENANCE,
    },
  },

  image: {
    dir: 'public',
    provider: process.env.NODE_ENV === 'production' ? 'netlify' : 'ipx',
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
    routeRules: {
      '/banner': { cache: { maxAge: 60 * 60 * 24 } },
      '/faq': { cache: { maxAge: 60 * 60 * 24 } },
      '/about': { cache: { maxAge: 60 * 60 * 24 } },
    },
    prerender: {
      routes: [
        '/banner',
        '/faq',
        '/about',
        ...i18nLocales
          .filter((locale) => locale.code !== defaultLocale)
          .flatMap((locale) => [
            `/${locale.code}/banner`,
            `/${locale.code}/faq`,
            `/${locale.code}/about`,
          ]),
      ],
    },
  },

  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2025-01-24',

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
