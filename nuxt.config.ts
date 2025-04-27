// https://nuxt.com/docs/api/configuration/nuxt-config
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'

export default defineNuxtConfig({
  devtools: { enabled: true },

  // Add global CSS files
  css: ['~/assets/styles/global.scss', '~/assets/styles/tailwind.scss'],

  modules: [
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@bg-dev/nuxt-naiveui',
    '@nuxt/image',
    '@nuxt/icon',
  ],

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_SUPABASE_URL,
      supabaseKey: process.env.NUXT_SUPABASE_KEY,
    },
  },

  image: {
    dir: 'public',
    provider: process.env.NODE_ENV === 'production' ? 'netlify' : 'ipx', // use ipx only when not in production
    providers: {
      netlify: {
        provider: 'ipx',
        options: {
          baseURL: 'https://gongeous.netlify.app',
        },
      },
    },
    presets: {
      item: {
        modifiers: {
          format: 'webp',
          width: 200,
          height: 200,
          fit: 'cover',
          quality: 80,
        },
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
    format: ['webp', 'jpg', 'png', 'gif'],
  },

  nitro: {
    preset: 'netlify',
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
  },

  logLevel: 'silent',
  compatibilityDate: '2025-04-27',
})
