// https://nuxt.com/docs/api/configuration/nuxt-config
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'

export default defineNuxtConfig({
  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      title: 'Infinity Nikki Resonance Tracker',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Track your Infinity Nikki resonance history and statistics. A fan-made tool for Infinity Nikki players.',
        },
        { name: 'robots', content: 'index, follow' },
        { name: 'author', content: 'dastrokes' },
        {
          name: 'keywords',
          content:
            'Infinity Nikki, resonance tracker, pull tracker, gacha tracker, game tools, Nikki game',
        },

        // Canonical URL
        {
          property: 'og:site_name',
          content: 'Infinity Nikki Resonance Tracker',
        },
        {
          rel: 'canonical',
          href:
            process.env.NUXT_PUBLIC_SITE_URL || 'https://gongeous.netlify.app/',
        },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
      script: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Infinity Nikki Resonance Tracker',
            description:
              'Track your Infinity Nikki resonance history and statistics. A fan-made tool for Infinity Nikki players.',
            url:
              process.env.NUXT_PUBLIC_SITE_URL ||
              'https://gongeous.netlify.app/',
            applicationCategory: 'Game Tool',
            operatingSystem: 'Any',
            browserRequirements: 'Requires JavaScript. Requires HTML5.',
            author: {
              '@type': 'Person',
              name: 'dastrokes',
            },
            inLanguage: 'en',
            isFree: true,
          }),
        },
      ],
    },
  },

  // Add global CSS files
  css: ['~/assets/styles/global.scss'],

  modules: [
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@bg-dev/nuxt-naiveui',
    '@nuxt/image',
  ],

  runtimeConfig: {
    supabaseUrl: process.env.SUPABASE_DATABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  image: {
    dir: 'public',
    provider: process.env.NODE_ENV === 'production' ? 'netlify' : 'ipx',
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
