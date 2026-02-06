import { defaultLocale, i18nLocales } from './locales'

import enBanner from './en/banner.json'
import deBanner from './de/banner.json'
import esBanner from './es/banner.json'
import frBanner from './fr/banner.json'
import idBanner from './id/banner.json'
import itBanner from './it/banner.json'
import jaBanner from './ja/banner.json'
import koBanner from './ko/banner.json'
import ptBanner from './pt/banner.json'
import thBanner from './th/banner.json'
import twBanner from './tw/banner.json'
import zhBanner from './zh/banner.json'
import enOutfit from './en/outfit.json'
import deOutfit from './de/outfit.json'
import esOutfit from './es/outfit.json'
import frOutfit from './fr/outfit.json'
import idOutfit from './id/outfit.json'
import itOutfit from './it/outfit.json'
import jaOutfit from './ja/outfit.json'
import koOutfit from './ko/outfit.json'
import ptOutfit from './pt/outfit.json'
import thOutfit from './th/outfit.json'
import twOutfit from './tw/outfit.json'
import zhOutfit from './zh/outfit.json'
import enItem from './en/item.json'
import deItem from './de/item.json'
import esItem from './es/item.json'
import frItem from './fr/item.json'
import idItem from './id/item.json'
import itItem from './it/item.json'
import jaItem from './ja/item.json'
import koItem from './ko/item.json'
import ptItem from './pt/item.json'
import thItem from './th/item.json'
import twItem from './tw/item.json'
import zhItem from './zh/item.json'

const BASE_PATHS = [
  '/',
  '/import',
  '/tracker',
  '/global',
  '/timeline',
  '/quiz',
  '/ranking',
  '/faq',
  '/about',
  '/vote',
  '/login',
  '/profile',
  '/items',
  '/outfits',
  '/banners',
] as const

const translations = {
  en: { outfit: enOutfit, item: enItem, banner: enBanner },
  de: { outfit: deOutfit, item: deItem, banner: deBanner },
  es: { outfit: esOutfit, item: esItem, banner: esBanner },
  fr: { outfit: frOutfit, item: frItem, banner: frBanner },
  id: { outfit: idOutfit, item: idItem, banner: idBanner },
  it: { outfit: itOutfit, item: itItem, banner: itBanner },
  ja: { outfit: jaOutfit, item: jaItem, banner: jaBanner },
  ko: { outfit: koOutfit, item: koItem, banner: koBanner },
  pt: { outfit: ptOutfit, item: ptItem, banner: ptBanner },
  th: { outfit: thOutfit, item: thItem, banner: thBanner },
  tw: { outfit: twOutfit, item: twItem, banner: twBanner },
  zh: { outfit: zhOutfit, item: zhItem, banner: zhBanner },
}

const imagekitBaseUrl =
  process.env.NUXT_PUBLIC_IMAGEKIT_BASE_URL ||
  'https://ik.imagekit.io/gongeouscdn'
const imageBaseUrl = `${imagekitBaseUrl.replace(/\/+$/, '')}/images`

const extractIds = (keys: string[]) =>
  Array.from(
    new Set(
      keys
        .map((key) => key.split('.')[1])
        .filter((value): value is string => Boolean(value))
    )
  )

const bannerIds = extractIds(Object.keys(enBanner))
const outfitIds = extractIds(Object.keys(enOutfit))
const itemIds = extractIds(Object.keys(enItem))

type LocaleCode = (typeof i18nLocales)[number]['code']
type TranslationSection = keyof (typeof translations)[keyof typeof translations]

type ContentConfig = {
  ids: string[]
  localeKey: TranslationSection
  routePrefix: string
  imageFolder: string
  fallbackLabel: string
}

const contentConfigs: ContentConfig[] = [
  {
    ids: bannerIds,
    localeKey: 'banner',
    routePrefix: 'banners',
    imageFolder: 'banners',
    fallbackLabel: 'Banner',
  },
  {
    ids: outfitIds,
    localeKey: 'outfit',
    routePrefix: 'outfits',
    imageFolder: 'outfits',
    fallbackLabel: 'Outfit',
  },
  {
    ids: itemIds,
    localeKey: 'item',
    routePrefix: 'items',
    imageFolder: 'items',
    fallbackLabel: 'Item',
  },
]

function resolveLocales(localeCode?: LocaleCode) {
  return localeCode
    ? i18nLocales.filter((locale) => locale.code === localeCode)
    : i18nLocales
}

export function buildSitemap() {
  return [...baseSitemap(), ...contentSitemap()]
}

export function baseSitemap(localeCode?: LocaleCode) {
  const results: Array<{
    loc: string
    images: Array<{
      loc: string
      title: string
      caption: string
    }>
  }> = []

  resolveLocales(localeCode).forEach(({ code }) => {
    const prefix = code === defaultLocale ? '' : `/${code}`

    BASE_PATHS.forEach((path) => {
      const loc = path === '/' ? `${prefix}/` : `${prefix}${path}`
      results.push({
        loc,
        images: [],
      })
    })
  })

  return results
}

export function contentSitemap(localeCode?: LocaleCode) {
  return contentConfigs.flatMap((config) =>
    config.ids.flatMap((contentId) =>
      resolveLocales(localeCode).map(({ code }) => {
        const prefix = code === defaultLocale ? '' : `/${code}`
        const locale =
          translations[code as keyof typeof translations] ||
          translations[defaultLocale as keyof typeof translations]
        const translationKey = `${config.localeKey}.${contentId}.name`
        const localeTranslations = locale[config.localeKey] as Record<
          string,
          string
        >
        const name =
          localeTranslations?.[translationKey] ||
          `${config.fallbackLabel} ${contentId}`

        return {
          loc: `${prefix}/${config.routePrefix}/${contentId}`,
          images: [
            {
              loc: `${imageBaseUrl}/${config.imageFolder}/${contentId}.png`,
              title: name,
              caption: name,
            },
          ],
        }
      })
    )
  )
}
