// https://nuxt.com/docs/api/configuration/nuxt-config
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'

export default defineNuxtConfig({
  devtools: { enabled: true },

  // Add global CSS files
  css: ['~/assets/styles/global.scss'],

  modules: [
    '@nuxt/eslint',
    'nuxtjs-naive-ui',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  components: {
    dirs: [
      '~/components', // Limit scanning to only necessary folders
    ],
  },

  vite: {
    plugins: [
      Components({
        resolvers: [NaiveUiResolver()],
        dts: true,
      }),
    ],
  },

  build: {
    transpile: ['naive-ui', 'vueuc'],
  },

  compatibilityDate: '2025-04-22',
})
