import { defaultLocale, i18nLocales } from './locales'
import {
  SEO_BANNER_LIST_PATHS,
  SEO_ITEM_LIST_PATHS,
  SEO_OUTFIT_LIST_PATHS,
} from '../utils/seoListRouteDefinitions'

const BASE_PATHS = [
  '/',
  '/import',
  '/tracker',
  '/global',
  '/timeline',
  '/quiz',
  '/ranking',
  '/feedback',
  '/guideline',
  '/faq',
  '/about',
  '/vote',
  '/login',
  '/profile',
  '/items',
  '/outfits',
  '/banners',
  '/tierlist',
] as const

const SEO_LIST_PATHS = [
  ...SEO_ITEM_LIST_PATHS,
  ...SEO_OUTFIT_LIST_PATHS,
  ...SEO_BANNER_LIST_PATHS,
]
const STATIC_SITEMAP_PATHS = [...BASE_PATHS, ...SEO_LIST_PATHS]

const imagekitBaseUrl =
  process.env.NUXT_PUBLIC_IMAGEKIT_BASE_URL || 'https://ik.imagekit.io/gongeous'
const cloudinaryBaseUrl =
  process.env.NUXT_PUBLIC_CLOUDINARY_BASE_URL ||
  'https://res.cloudinary.com/gongeous/image/upload'
const bunnyBaseUrl =
  process.env.NUXT_PUBLIC_BUNNY_BASE_URL || 'https://cdn.gongeo.us'
const imageBaseUrl = `${imagekitBaseUrl || bunnyBaseUrl || cloudinaryBaseUrl}/images`

type TranslationDictionary = Record<string, string>
type LocaleCode = (typeof i18nLocales)[number]['code']
type TranslationSection = 'banner' | 'outfit' | 'item'
type TranslationLoader = () => Promise<TranslationDictionary>

type SitemapUrl = {
  loc: string
  images: Array<{
    loc: string
    title: string
    caption: string
  }>
}

type ContentConfig = {
  ids: string[]
  localeKey: TranslationSection
  routePrefix: string
  imageFolder: string
  fallbackLabel: string
}

const translationLoaders = {
  en: {
    banner: () =>
      import('./en/banner.json').then(
        (module) => module.default as TranslationDictionary
      ),
    outfit: () =>
      import('./en/outfit.json').then(
        (module) => module.default as TranslationDictionary
      ),
    item: () =>
      import('./en/item.json').then(
        (module) => module.default as TranslationDictionary
      ),
  },
  de: {
    banner: () =>
      import('./de/banner.json').then(
        (module) => module.default as TranslationDictionary
      ),
    outfit: () =>
      import('./de/outfit.json').then(
        (module) => module.default as TranslationDictionary
      ),
    item: () =>
      import('./de/item.json').then(
        (module) => module.default as TranslationDictionary
      ),
  },
  es: {
    banner: () =>
      import('./es/banner.json').then(
        (module) => module.default as TranslationDictionary
      ),
    outfit: () =>
      import('./es/outfit.json').then(
        (module) => module.default as TranslationDictionary
      ),
    item: () =>
      import('./es/item.json').then(
        (module) => module.default as TranslationDictionary
      ),
  },
  fr: {
    banner: () =>
      import('./fr/banner.json').then(
        (module) => module.default as TranslationDictionary
      ),
    outfit: () =>
      import('./fr/outfit.json').then(
        (module) => module.default as TranslationDictionary
      ),
    item: () =>
      import('./fr/item.json').then(
        (module) => module.default as TranslationDictionary
      ),
  },

  it: {
    banner: () =>
      import('./it/banner.json').then(
        (module) => module.default as TranslationDictionary
      ),
    outfit: () =>
      import('./it/outfit.json').then(
        (module) => module.default as TranslationDictionary
      ),
    item: () =>
      import('./it/item.json').then(
        (module) => module.default as TranslationDictionary
      ),
  },
  ja: {
    banner: () =>
      import('./ja/banner.json').then(
        (module) => module.default as TranslationDictionary
      ),
    outfit: () =>
      import('./ja/outfit.json').then(
        (module) => module.default as TranslationDictionary
      ),
    item: () =>
      import('./ja/item.json').then(
        (module) => module.default as TranslationDictionary
      ),
  },
  ko: {
    banner: () =>
      import('./ko/banner.json').then(
        (module) => module.default as TranslationDictionary
      ),
    outfit: () =>
      import('./ko/outfit.json').then(
        (module) => module.default as TranslationDictionary
      ),
    item: () =>
      import('./ko/item.json').then(
        (module) => module.default as TranslationDictionary
      ),
  },
  pt: {
    banner: () =>
      import('./pt/banner.json').then(
        (module) => module.default as TranslationDictionary
      ),
    outfit: () =>
      import('./pt/outfit.json').then(
        (module) => module.default as TranslationDictionary
      ),
    item: () =>
      import('./pt/item.json').then(
        (module) => module.default as TranslationDictionary
      ),
  },

  zh: {
    banner: () =>
      import('./zh/banner.json').then(
        (module) => module.default as TranslationDictionary
      ),
    outfit: () =>
      import('./zh/outfit.json').then(
        (module) => module.default as TranslationDictionary
      ),
    item: () =>
      import('./zh/item.json').then(
        (module) => module.default as TranslationDictionary
      ),
  },
  tw: {
    banner: () =>
      import('./tw/banner.json').then(
        (module) => module.default as TranslationDictionary
      ),
    outfit: () =>
      import('./tw/outfit.json').then(
        (module) => module.default as TranslationDictionary
      ),
    item: () =>
      import('./tw/item.json').then(
        (module) => module.default as TranslationDictionary
      ),
  },
} satisfies Record<LocaleCode, Record<TranslationSection, TranslationLoader>>

const extractIds = (keys: string[]) =>
  Array.from(
    new Set(
      keys
        .map((key) => key.split('.')[1])
        .filter((value): value is string => Boolean(value))
    )
  )

const contentConfigCache = new Map<string, Promise<ContentConfig>>()

const loadTranslations = async (
  localeCode: LocaleCode,
  section: TranslationSection
): Promise<TranslationDictionary> => {
  const loader = translationLoaders[localeCode]?.[section]

  if (!loader) {
    throw new Error(
      `Missing sitemap translations for locale "${localeCode}" and section "${section}"`
    )
  }

  return loader()
}

const loadContentConfig = async (
  localeKey: TranslationSection,
  routePrefix: string,
  imageFolder: string,
  fallbackLabel: string
): Promise<ContentConfig> => {
  const cacheKey = `${localeKey}:${routePrefix}`
  const cached = contentConfigCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const promise = loadTranslations(defaultLocale, localeKey).then(
    (translations) => ({
      ids: extractIds(Object.keys(translations)),
      localeKey,
      routePrefix,
      imageFolder,
      fallbackLabel,
    })
  )

  contentConfigCache.set(cacheKey, promise)
  return promise
}

const loadContentConfigs = () =>
  Promise.all([
    loadContentConfig('banner', 'banners', 'banners', 'Banner'),
    loadContentConfig('outfit', 'outfits', 'outfits', 'Outfit'),
    loadContentConfig('item', 'items', 'items', 'Item'),
  ])

function resolveLocales(localeCode?: LocaleCode) {
  return localeCode
    ? i18nLocales.filter((locale) => locale.code === localeCode)
    : i18nLocales
}

export function buildSitemap() {
  return Promise.all([Promise.resolve(baseSitemap()), contentSitemap()]).then(
    ([baseRoutes, contentRoutes]) => [...baseRoutes, ...contentRoutes]
  )
}

export function baseSitemap(localeCode?: LocaleCode) {
  const results: SitemapUrl[] = []

  resolveLocales(localeCode).forEach(({ code }) => {
    const prefix = code === defaultLocale ? '' : `/${code}`

    STATIC_SITEMAP_PATHS.forEach((path) => {
      const loc = path === '/' ? `${prefix}/` : `${prefix}${path}`
      results.push({
        loc,
        images: [],
      })
    })
  })

  return results
}

export async function contentSitemap(localeCode?: LocaleCode) {
  const results: SitemapUrl[] = []
  const locales = resolveLocales(localeCode)
  const contentConfigs = await loadContentConfigs()

  for (const config of contentConfigs) {
    const fallbackTranslations = await loadTranslations(
      defaultLocale,
      config.localeKey
    )

    for (const { code } of locales) {
      const localeTranslations =
        code === defaultLocale
          ? fallbackTranslations
          : await loadTranslations(code, config.localeKey)

      for (const contentId of config.ids) {
        const prefix = code === defaultLocale ? '' : `/${code}`
        const translationKey = `${config.localeKey}.${contentId}.name`
        const name =
          localeTranslations?.[translationKey] ||
          fallbackTranslations?.[translationKey] ||
          `${config.fallbackLabel} ${contentId}`

        results.push({
          loc: `${prefix}/${config.routePrefix}/${contentId}`,
          images: [
            {
              loc: `${imageBaseUrl}/${config.imageFolder}/${contentId}.png`,
              title: name,
              caption: name,
            },
          ],
        })
      }
    }
  }

  return results
}
