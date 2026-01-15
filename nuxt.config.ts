// https://nuxt.com/docs/api/configuration/nuxt-config
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defaultLocale, i18nLocales } from './locales/locales'
import { buildSitemap } from './locales/sitemap'
import { CACHE_STATIC, CACHE_STABLE, CACHE_DYNAMIC } from './utils/cacheHeaders'
import { getImageProvider } from './utils/imageProvider'

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
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://gongeo.us',
  },

  sitemap: {
    zeroRuntime: true,
    urls: buildSitemap(),
  },

  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseDataSecretKey: process.env.SUPABASE_DATA_SECRET_KEY,

    public: {
      supabaseUrl: process.env.SUPABASE_DATABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      supabaseDataUrl: process.env.SUPABASE_DATA_URL,
      gongeousApiKey: process.env.GONGEOUS_API_KEY,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
      gameVersion: process.env.NUXT_PUBLIC_GAME_VERSION,
      imagekitBaseUrl: process.env.NUXT_PUBLIC_IMAGEKIT_BASE_URL,
      bunnyBaseUrl: process.env.NUXT_PUBLIC_BUNNY_BASE_URL,
      imageProvider: getImageProvider(),
    },
  },

  image: {
    dir: 'public',
    provider: getImageProvider(),
    imagekit: {
      baseURL:
        process.env.NUXT_PUBLIC_IMAGEKIT_BASE_URL ||
        'https://ik.imagekit.io/gongeous',
    },
    bunny: {
      baseURL:
        process.env.NUXT_PUBLIC_BUNNY_BASE_URL || 'https://cdn.gongeo.us',
    },
    domains: [
      process.env.NUXT_PUBLIC_IMAGEKIT_BASE_URL ||
        'https://ik.imagekit.io/gongeous',
    ],
    format: ['webp'],
    quality: 80,
    presets: {
      bannerHero: {
        modifiers: { width: 800, height: 400, format: 'webp' },
      },
      bannerThumb: {
        modifiers: { width: 200, height: 100, format: 'webp' },
      },
      tallLg: {
        modifiers: { width: 300, height: 450, format: 'webp' },
      },
      tallMd: {
        modifiers: { width: 200, height: 300, format: 'webp' },
      },
      tallSm: {
        modifiers: { width: 100, height: 150, format: 'webp' },
      },
      iconLg: {
        modifiers: { width: 120, height: 120, format: 'webp' },
      },
      iconSm: {
        modifiers: { width: 60, height: 60, format: 'webp' },
      },
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

  routeRules: {
    ...(() => {
      const withLocalePrefixes = (path: string) => {
        if (path === '/') {
          return [
            '/',
            ...i18nLocales
              .filter((locale) => locale.code !== defaultLocale)
              .map((locale) => `/${locale.code}`),
          ]
        }

        return [
          path,
          ...i18nLocales
            .filter((locale) => locale.code !== defaultLocale)
            .map((locale) => `/${locale.code}${path}`),
        ]
      }

      type I18nRouteRule = {
        prerender?: boolean
        robots?: boolean
        swr?: boolean | number
        headers?: Record<string, string>
      }

      const buildI18nRules = (paths: string[], rule: I18nRouteRule) =>
        Object.fromEntries(
          paths.flatMap((path) =>
            withLocalePrefixes(path).map((route) => [route, rule])
          )
        )

      return {
        ...buildI18nRules(
          ['/', '/import', '/faq', '/about', '/timeline', '/vote', '/ranking'],
          { prerender: true, headers: CACHE_STATIC }
        ),
        ...buildI18nRules(['/error'], {
          prerender: true,
          robots: false,
          headers: CACHE_STATIC,
        }),
        ...buildI18nRules(['/banners/**', '/items/**', '/outfits/**'], {
          headers: CACHE_STATIC,
        }),
        ...buildI18nRules(['/banners', '/outfits', '/items'], {
          swr: 86400,
          headers: CACHE_STABLE,
        }),
        ...buildI18nRules(['/global'], {
          swr: 3600,
          headers: CACHE_DYNAMIC,
        }),
        ...buildI18nRules(['/login', '/tracker'], {
          headers: { 'Cache-Control': 'private, no-store' },
        }),
      }
    })(),
  },

  nitro: {
    preset: 'netlify_edge',
    future: {
      nativeSWR: true,
    },
    prerender: {
      autoSubfolderIndex: false,
      routes: ['/sitemap.xml', '/robots.txt'],
    },
  },

  compatibilityDate: '2025-10-01',

  experimental: {
    appManifest: false,
  },

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
      enabled: false,
    },

    telemetry: false,
    autoInjectServerSentry: 'top-level-import',
    enabled: process.env.NODE_ENV === 'production',
  },

  sourcemap: false,
})
