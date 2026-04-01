import { buildSitemap } from '~/locales/sitemap'

// Keep sitemap URL generation out of nuxt.config so Nitro can fetch it lazily.
export default defineCachedApiEventHandler(async () => buildSitemap(), {
  cache: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    staleMaxAge: 60 * 60 * 24 * 7, // 7 days
    name: 'sitemap-urls',
    swr: true,
    getKey: () => getGameVersion(),
  },
  headers: {
    varyHeaders: [GAME_VERSION_HEADER],
  },
  profile: 'catalog',
})
