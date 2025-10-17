// https://nuxt.com/docs/api/configuration/nuxt-config
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defaultLocale, i18nLocales } from './locales/locales'
import { imageSitemap } from './locales/sitemap'

export default defineNuxtConfig({
  devtools: { enabled: false },

  srcDir: '.',

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
      redirectOn: 'no prefix',
    },
    bundle: {
      optimizeTranslationDirective: false,
    },
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
  },

  sitemap: {
    urls: imageSitemap(),
  },

  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

    public: {
      supabaseUrl: process.env.SUPABASE_DATABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      gongeousApiKey: process.env.GONGEOUS_API_KEY,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
    },
  },

  image: {
    dir: 'public',
    provider: process.env.NODE_ENV === 'production' ? 'netlify' : 'ipx',
    static: {
      baseURL: process.env.NUXT_PUBLIC_SITE_URL,
    },
    quality: 80,
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

  routeRules: {
    ...Object.fromEntries([
      ...['error'].flatMap((page) => [
        [`/${page}`, { prerender: true, robots: false }],
        ...i18nLocales
          .filter((locale) => locale.code !== defaultLocale)
          .map((locale) => [
            `/${locale.code}/${page}`,
            { prerender: true, robots: false },
          ]),
      ]),
    ]),
  },

  nitro: {
    preset: 'netlify_edge',
    future: {
      nativeSWR: true,
    },
    prerender: {
      autoSubfolderIndex: false,
    },
  },

  compatibilityDate: '2025-10-01',

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

    telemetry: false,
    autoInjectServerSentry: 'top-level-import',
    enabled: process.env.NODE_ENV === 'production',
  },

  sourcemap: {
    client: 'hidden',
  },
})
