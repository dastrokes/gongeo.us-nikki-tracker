import { defaultLocale, i18nLocales } from './locales'
import { getOgImageSrc } from '../utils/imageProvider'
import { getItemType, makeupItemTypes } from '../utils/itemType'
import {
  SEO_BANNER_LIST_PATHS,
  SEO_ITEM_LIST_PATHS,
  SEO_MAKEUP_LIST_PATHS,
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
  '/makeups',
  '/outfits',
  '/banners',
  '/tierlist',
] as const

const SEO_LIST_PATHS = [
  ...SEO_ITEM_LIST_PATHS,
  ...SEO_MAKEUP_LIST_PATHS,
  ...SEO_OUTFIT_LIST_PATHS,
  ...SEO_BANNER_LIST_PATHS,
]
const STATIC_SITEMAP_PATHS = [...BASE_PATHS, ...SEO_LIST_PATHS]

type TranslationDictionary = Record<string, string>
type LocaleCode = (typeof i18nLocales)[number]['code']
type TranslationSection = 'banner' | 'outfit' | 'item' | 'makeup'
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
  imageType: Parameters<typeof getOgImageSrc>[0]
  fallbackLabel: string
}

type ContentConfigOptions = {
  idFilter?: (id: string) => boolean
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
    makeup: () =>
      import('./en/makeup.json').then(
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
    makeup: () =>
      import('./de/makeup.json').then(
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
    makeup: () =>
      import('./es/makeup.json').then(
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
    makeup: () =>
      import('./fr/makeup.json').then(
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
    makeup: () =>
      import('./it/makeup.json').then(
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
    makeup: () =>
      import('./ja/makeup.json').then(
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
    makeup: () =>
      import('./ko/makeup.json').then(
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
    makeup: () =>
      import('./pt/makeup.json').then(
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
    makeup: () =>
      import('./zh/makeup.json').then(
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
    makeup: () =>
      import('./tw/makeup.json').then(
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
  imageType: Parameters<typeof getOgImageSrc>[0],
  fallbackLabel: string,
  options: ContentConfigOptions = {}
): Promise<ContentConfig> => {
  const cacheKey = `${localeKey}:${routePrefix}:${fallbackLabel}`
  const cached = contentConfigCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const promise = loadTranslations(defaultLocale, localeKey).then(
    (translations) => ({
      ids: extractIds(Object.keys(translations)).filter(
        options.idFilter ?? (() => true)
      ),
      localeKey,
      routePrefix,
      imageType,
      fallbackLabel,
    })
  )

  contentConfigCache.set(cacheKey, promise)
  return promise
}

const loadContentConfigs = () =>
  Promise.all([
    loadContentConfig('banner', 'banners', 'banner', 'Banner'),
    loadContentConfig('outfit', 'outfits', 'outfit', 'Outfit'),
    loadContentConfig('item', 'items', 'item', 'Item', {
      idFilter: (id) =>
        !(makeupItemTypes as readonly string[]).includes(getItemType(id)),
    }),
    loadContentConfig('item', 'makeups', 'item', 'Makeup', {
      idFilter: (id) =>
        (makeupItemTypes as readonly string[]).includes(getItemType(id)),
    }),
    loadContentConfig('makeup', 'makeups', 'fullMakeup', 'Full Makeup'),
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
              loc: getOgImageSrc(config.imageType, contentId),
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
