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
      name: 'sitemap-urls-static-only',
      swr: true,
      getKey: (event) => {
        const localeCode = resolveSitemapLocaleCode(
          String(getQuery(event).locale ?? '')
        )
        return `static-only:${getGameVersion()}:${localeCode ?? 'all'}`
      },
    },
    headers: {
      varyQuery: true,
      varyHeaders: [GAME_VERSION_HEADER],
    },
    profile: 'catalog',
  }
)
