// https://nuxt.com/docs/api/configuration/nuxt-config
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defaultLocale, i18nLocales } from './locales/locales'
import { buildSitemap } from './locales/sitemap'
import {
  noStoreHeaders,
  pageStatic,
  pageTheme,
  pageThemeNoTag,
  pageThemeQuery,
} from './utils/cacheHeaders'
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
    lazy: true,
    restructureDir: 'locales',
    langDir: './',
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://gongeo.us',
    locales: i18nLocales,
    defaultLocale: defaultLocale,
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      cookieKey: 'i18n_redirected',
      fallbackLocale: defaultLocale,
      redirectOn: 'root',
    },
    bundle: {
      optimizeTranslationDirective: false,
    },
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://gongeo.us',
  },

  sitemap: {
    zeroRuntime: true,
    excludeAppSources: true,
    urls: buildSitemap(),
  },

  robots: {
    blockNonSeoBots: true,
    disallow: ['/error'],
  },

  runtimeConfig: {
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
    supabaseDataSecretKey: process.env.SUPABASE_DATA_SECRET_KEY,

    public: {
      supabaseUrl: process.env.SUPABASE_DATABASE_URL,
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
      supabaseDataUrl: process.env.SUPABASE_DATA_URL,
      gongeousApiKey: process.env.GONGEOUS_API_KEY,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://gongeo.us',
      imagekitBaseUrl:
        process.env.NUXT_PUBLIC_IMAGEKIT_BASE_URL ||
        'https://ik.imagekit.io/gongeouscdn',
      cloudinaryBaseUrl:
        process.env.NUXT_PUBLIC_CLOUDINARY_BASE_URL ||
        'https://res.cloudinary.com/gongeous/image/upload',
      imageProvider: getImageProvider(),
    },
  },

  image: {
    dir: 'public',
    provider: getImageProvider(),
    netlify: {
      baseURL: process.env.NUXT_PUBLIC_SITE_URL || 'https://gongeo.us',
    },
    imagekit: {
      baseURL: process.env.NUXT_PUBLIC_IMAGEKIT_BASE_URL,
    },
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
    charts: ['BarChart', 'LineChart', 'CustomChart'],
    components: [
      'TooltipComponent',
      'LegendComponent',
      'GridComponent',
      'TitleComponent',
      'DataZoomComponent',
    ],
  },

  routeRules: {
    ...(() => {
      const localePrefixes = i18nLocales
        .filter((locale) => locale.code !== defaultLocale)
        .map((locale) => `/${locale.code}`)

      type I18nRouteRule = {
        prerender?: boolean
        headers?: Record<string, string>
      }

      const buildLocalizedRules = (paths: string[], rule: I18nRouteRule) =>
        Object.fromEntries(
          paths.flatMap((path) =>
            [
              path,
              ...localePrefixes.map((prefix) =>
                path === '/' ? prefix : `${prefix}${path}`
              ),
            ].map((route) => [route, rule])
          )
        )

      return {
        ...buildLocalizedRules(
          ['/faq', '/about', '/vote', '/ranking', '/timeline', '/error'],
          {
            prerender: true,
            headers: pageStatic,
          }
        ),
        ...buildLocalizedRules(
          ['/', '/import', '/banners', '/quiz', '/global'],
          {
            headers: pageTheme,
          }
        ),
        ...buildLocalizedRules(['/banners/**', '/outfits/**', '/items/**'], {
          headers: pageThemeNoTag,
        }),
        ...buildLocalizedRules(['/outfits', '/items', '/tierlist'], {
          headers: pageThemeQuery,
        }),
        ...buildLocalizedRules(['/tracker', '/login', '/profile'], {
          headers: noStoreHeaders,
        }),
      }
    })(),
  },

  nitro: {
    preset: 'netlify',
    future: {
      nativeSWR: true,
    },
    prerender: {
      autoSubfolderIndex: false,
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
        '@fingerprintjs/fingerprintjs',
        '@vicons/fa',
        '@vueuse/integrations/useSortable',
        '@supabase/supabase-js',
        '@zumer/snapdom',
        'fflate',
        'idb',
        'snappyjs',
        'fuse.js',
        'pinyin-pro',
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
