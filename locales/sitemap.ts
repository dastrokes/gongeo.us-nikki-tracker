import { BANNER_DATA } from '../data/banners'
import { defaultLocale, i18nLocales } from './locales'
import OUTFIT_DATA from '../data/outfits'
import type { BannerRun } from '~/types/banner'

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

const translations = {
  en: { banner: enBanner, outfit: enOutfit, item: enItem },
  de: { banner: deBanner, outfit: deOutfit, item: deItem },
  es: { banner: esBanner, outfit: esOutfit, item: esItem },
  fr: { banner: frBanner, outfit: frOutfit, item: frItem },
  id: { banner: idBanner, outfit: idOutfit, item: idItem },
  it: { banner: itBanner, outfit: itOutfit, item: itItem },
  ja: { banner: jaBanner, outfit: jaOutfit, item: jaItem },
  ko: { banner: koBanner, outfit: koOutfit, item: koItem },
  pt: { banner: ptBanner, outfit: ptOutfit, item: ptItem },
  th: { banner: thBanner, outfit: thOutfit, item: thItem },
  tw: { banner: twBanner, outfit: twOutfit, item: twItem },
  zh: { banner: zhBanner, outfit: zhOutfit, item: zhItem },
}

// Get the latest banner run start date
function getLatestBannerDate(): string {
  return Object.values(BANNER_DATA)
    .flatMap((banner) => banner.runs.map((run: BannerRun) => run.start))
    .reduce((latest, date) => (date > latest ? date : latest), '')
}

export function imageSitemap() {
  const results: Array<{
    loc: string
    images: Array<{
      loc: string
      title: string
      caption: string
    }>
    lastmod: string
  }> = []

  const latestBannerDate = getLatestBannerDate()

  // Add main banner page with all banner images
  i18nLocales.forEach(({ code }) => {
    const prefix = code === defaultLocale ? '' : `/${code}`
    const locale = translations[code as keyof typeof translations]

    const allBannerImages = Object.values(BANNER_DATA).map((banner) => {
      const bannerKey =
        `banner.${banner.bannerId}.name` as keyof typeof locale.banner
      const bannerName = locale.banner[bannerKey] || `Banner ${banner.bannerId}`

      return {
        loc: `https://ik.imagekit.io/gongeous/banners/${banner.bannerId}.png`,
        title: bannerName as string,
        caption: bannerName as string,
      }
    })

    results.push({
      loc: `${prefix}/banner`,
      images: allBannerImages,
      lastmod: latestBannerDate,
    })

    results.push({
      loc: `${prefix}/`,
      images: [],
      lastmod: latestBannerDate,
    })
  })

  // Add individual banner pages with detailed images
  const individualBannerPages = Object.values(BANNER_DATA).flatMap((banner) =>
    i18nLocales.map(({ code }) => {
      const prefix = code === defaultLocale ? '' : `/${code}`
      const locale = translations[code as keyof typeof translations]

      // Get banner name from banner translations
      const bannerKey =
        `banner.${banner.bannerId}.name` as keyof typeof locale.banner
      const bannerName = locale.banner[bannerKey] || `Banner ${banner.bannerId}`

      const images = [
        // Banner image
        {
          loc: `https://ik.imagekit.io/gongeous/banners/${banner.bannerId}.png`,
          title: bannerName as string,
          caption: bannerName as string,
        },
      ]

      // Add 5-star outfit images
      banner.outfit5StarId.forEach((outfitId: string) => {
        const outfitKey =
          `outfit.${outfitId}.name` as keyof typeof locale.outfit
        const outfitName = locale.outfit[outfitKey] || `Outfit ${outfitId}`
        images.push({
          loc: `https://ik.imagekit.io/gongeous/outfits/${outfitId}.png`,
          title: outfitName as string,
          caption: outfitName as string,
        })

        // Add individual item images for this outfit
        const outfit = OUTFIT_DATA[outfitId as keyof typeof OUTFIT_DATA]
        if (outfit) {
          outfit.items.forEach((itemId: string) => {
            const itemKey = `item.${itemId}.name` as keyof typeof locale.item
            const itemName = locale.item[itemKey] || `Item ${itemId}`
            images.push({
              loc: `https://ik.imagekit.io/gongeous/items/${itemId}.png`,
              title: itemName as string,
              caption: itemName as string,
            })
          })
        }
      })

      // Add 4-star outfit images
      banner.outfit4StarId.forEach((outfitId: string) => {
        const outfitKey =
          `outfit.${outfitId}.name` as keyof typeof locale.outfit
        const outfitName = locale.outfit[outfitKey] || `Outfit ${outfitId}`
        images.push({
          loc: `https://ik.imagekit.io/gongeous/outfits/${outfitId}.png`,
          title: outfitName as string,
          caption: outfitName as string,
        })

        // Add individual item images for this outfit
        const outfit = OUTFIT_DATA[outfitId as keyof typeof OUTFIT_DATA]
        if (outfit) {
          outfit.items.forEach((itemId: string) => {
            const itemKey = `item.${itemId}.name` as keyof typeof locale.item
            const itemName = locale.item[itemKey] || `Item ${itemId}`
            images.push({
              loc: `https://ik.imagekit.io/gongeous/items/${itemId}.png`,
              title: itemName as string,
              caption: itemName as string,
            })
          })
        }
      })

      // Add item images (Deep Echoes rewards)
      if (banner.rewardIds) {
        banner.rewardIds.forEach((rewardId: string) => {
          const itemKey = `item.${rewardId}.name` as keyof typeof locale.item
          const itemName = locale.item[itemKey] || `Item ${rewardId}`
          images.push({
            loc: `https://ik.imagekit.io/gongeous/items/${rewardId}.png`,
            title: itemName as string,
            caption: itemName as string,
          })
        })
      }

      return {
        loc: `${prefix}/banner/${banner.bannerId}`,
        images,
      }
    })
  )

  // Add individual outfit pages for all outfits (including non-banner outfits)
  const allOutfitPages = Object.keys(OUTFIT_DATA).flatMap((outfitId) =>
    i18nLocales.map(({ code }) => {
      const prefix = code === defaultLocale ? '' : `/${code}`
      const locale = translations[code as keyof typeof translations]

      const outfitKey = `outfit.${outfitId}.name` as keyof typeof locale.outfit
      const outfitName = locale.outfit[outfitKey] || `Outfit ${outfitId}`

      const images = [
        // Outfit image
        {
          loc: `https://ik.imagekit.io/gongeous/outfits/${outfitId}.png`,
          title: outfitName as string,
          caption: outfitName as string,
        },
      ]

      // Add individual item images for this outfit
      const outfit = OUTFIT_DATA[outfitId as keyof typeof OUTFIT_DATA]
      if (outfit) {
        outfit.items.forEach((itemId: string) => {
          const itemKey = `item.${itemId}.name` as keyof typeof locale.item
          const itemName = locale.item[itemKey] || `Item ${itemId}`
          images.push({
            loc: `https://ik.imagekit.io/gongeous/items/${itemId}.png`,
            title: itemName as string,
            caption: itemName as string,
          })
        })
      }

      return {
        loc: `${prefix}/outfit/${outfitId}`,
        images,
        lastmod: latestBannerDate,
      }
    })
  )

  // Add individual item pages for all items
  const allItemIds = new Set<string>()
  Object.values(OUTFIT_DATA).forEach((outfit) => {
    outfit.items.forEach((itemId: string) => allItemIds.add(itemId))
  })

  const allItemPages = Array.from(allItemIds).flatMap((itemId) =>
    i18nLocales.map(({ code }) => {
      const prefix = code === defaultLocale ? '' : `/${code}`
      const locale = translations[code as keyof typeof translations]

      const itemKey = `item.${itemId}.name` as keyof typeof locale.item
      const itemName = locale.item[itemKey] || `Item ${itemId}`

      return {
        loc: `${prefix}/item/${itemId}`,
        images: [
          {
            loc: `https://ik.imagekit.io/gongeous/items/${itemId}.png`,
            title: itemName as string,
            caption: itemName as string,
          },
        ],
        lastmod: latestBannerDate,
      }
    })
  )

  return [
    ...results,
    ...individualBannerPages,
    ...allOutfitPages,
    ...allItemPages,
  ]
}
