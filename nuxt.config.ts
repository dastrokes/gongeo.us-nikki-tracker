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

  'naive-ui': {
    themeOverrides: {
      common: {
        primaryColor: '#007bff',
        successColor: '#28a745',
        warningColor: '#ffc107',
        errorColor: '#dc3545',
        infoColor: '#17a2b8',

        textColor1: '#212529',
        bodyColor: '#f8f9fa',
        cardColor: '#ffffff',
        borderColor: '#dee2e6',
      },
    },
  },

  build: {
    transpile: ['naive-ui', 'vueuc'],
  },

  compatibilityDate: '2025-04-22',
})
