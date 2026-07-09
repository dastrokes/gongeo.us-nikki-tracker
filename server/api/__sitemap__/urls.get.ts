import { buildSitemap, resolveSitemapLocaleCode } from '~/locales/sitemap'

// Keep sitemap URL generation out of nuxt.config so Nitro can fetch it lazily.
export default defineCachedApiEventHandler(
  async (event) =>
    buildSitemap(
      resolveSitemapLocaleCode(String(getQuery(event).locale ?? ''))
    ),
  {
    cache: {
      maxAge: 60 * 60 * 24 * 30,
      staleMaxAge: 60 * 60 * 24 * 7,
      name: 'sitemap-urls',
      swr: true,
      getKey: (event) => {
        const localeCode = resolveSitemapLocaleCode(
          String(getQuery(event).locale ?? '')
        )
        return `${getGameVersion()}:${localeCode ?? 'all'}`
      },
    },
    headers: {
      cacheIds: [CACHE_TAGS.sitemap],
      varyQuery: true,
      varyHeaders: [GAME_VERSION_HEADER],
    },
    profile: 'catalog',
  }
)
