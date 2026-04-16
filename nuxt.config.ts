// https://nuxt.com/docs/api/configuration/nuxt-config
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defaultLocale, i18nLocales } from './app/locales/locales'
import {
  SEO_BANNER_LIST_PATHS,
  SEO_ITEM_LIST_PATHS,
  SEO_OUTFIT_LIST_PATHS,
} from './app/utils/seoListRouteDefinitions'
import {
  noStoreHeaders,
  pageStatic,
  pageTheme,
  pageThemeNoTag,
  pageThemeQuery,
} from './shared/utils/cacheProfiles'
import { getImageProvider } from './app/utils/imageProvider'

const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://gongeo.us'
const imagekitBaseUrl =
  process.env.NUXT_PUBLIC_IMAGEKIT_BASE_URL || 'https://ik.imagekit.io/gongeous'
const cloudinaryBaseUrl =
  process.env.NUXT_PUBLIC_CLOUDINARY_BASE_URL ||
  'https://res.cloudinary.com/gongeous/image/upload'
const bunnyBaseUrl =
  process.env.NUXT_PUBLIC_BUNNY_BASE_URL || 'https://cdn.gongeo.us'

export default defineNuxtConfig({
  devtools: { enabled: false },

  // Add global CSS files
  css: ['~/assets/styles/global.scss'],

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/scripts',
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

  scripts: {
    registry: {
      umamiAnalytics: {
        websiteId: 'dd22ab5d-2045-4450-aaff-f513339b5ca6',
        hostUrl: 'https://api.gongeo.us',
        domains: ['gongeo.us'],
        trigger: 'onNuxtReady',
      },
      googleAdsense: {
        client: 'ca-pub-9717879492261560',
        autoAds: true,
        trigger: 'onNuxtReady',
      },
    },
  },

  i18n: {
    restructureDir: 'app/locales',
    langDir: './',
    vueI18n: 'i18n.config',
    baseUrl: siteUrl,
    locales: i18nLocales,
    defaultLocale: defaultLocale,
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      cookieKey: 'i18n_redirected',
      fallbackLocale: defaultLocale,
      redirectOn: 'root',
    },
  },

  site: {
    url: siteUrl,
  },

  hooks: {
    'pages:extend'(pages) {
      const addSeoListRoutes = (
        basePath: string,
        routeNamePrefix: string,
        paths: readonly string[]
      ) => {
        const basePage = pages.find((page) => page.path === basePath)
        if (!basePage?.file) return

        paths.forEach((path) => {
          const suffix = path
            .replace(`${basePath}/`, '')
            .replace(/[^a-z0-9]+/gi, '-')
          pages.push({
            name: `${routeNamePrefix}-${suffix}`,
            path,
            file: basePage.file,
          })
        })
      }

      addSeoListRoutes('/items', 'seo-items', SEO_ITEM_LIST_PATHS)
      addSeoListRoutes('/outfits', 'seo-outfits', SEO_OUTFIT_LIST_PATHS)
      addSeoListRoutes('/banners', 'seo-banners', SEO_BANNER_LIST_PATHS)
    },
  },

  sitemap: {
    excludeAppSources: true,
    sources: ['/api/__sitemap__/urls'],
  },

  robots: {
    blockNonSeoBots: true,
    disallow: ['/error'],
  },

  runtimeConfig: {
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
    supabaseDataSecretKey: process.env.SUPABASE_DATA_SECRET_KEY,
    pineconeApiKey: process.env.PINECONE_API_KEY,
    pineconeIndexHost: process.env.PINECONE_INDEX_HOST,

    public: {
      supabaseUrl: process.env.SUPABASE_DATABASE_URL,
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
      supabaseDataUrl: process.env.SUPABASE_DATA_URL,
      gongeousApiKey: process.env.GONGEOUS_API_KEY,
      siteUrl,
      imagekitBaseUrl,
      cloudinaryBaseUrl,
      bunnyBaseUrl,
      imageProvider: getImageProvider(),
    },
  },

  image: {
    dir: '../public',
    provider: getImageProvider(),
    domains: [imagekitBaseUrl, cloudinaryBaseUrl, bunnyBaseUrl],
    imagekit: {
      baseURL: imagekitBaseUrl,
    },
    bunny: {
      baseURL: bunnyBaseUrl,
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
        ...buildLocalizedRules(['/error'], {
          prerender: true,
          headers: pageStatic,
        }),
        ...buildLocalizedRules(
          ['/faq', '/about', '/vote', '/ranking', '/timeline'],
          {
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
        ...buildLocalizedRules(['/outfits', '/items', '/tierlist', '/search'], {
          headers: pageThemeQuery,
        }),
        ...buildLocalizedRules(['/tracker', '/login', '/profile', '/stats'], {
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
