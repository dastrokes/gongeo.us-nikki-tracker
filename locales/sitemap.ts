import { BANNER_DATA } from '../data/banners'
import { defaultLocale, i18nLocales } from './locales'
import OUTFIT_DATA from '../data/outfits'
import type { BannerRun } from '~/types/banner'

import enOutfit from './en/outfit.json'
import deOutfit from './de/outfit.json'
import zhOutfit from './zh/outfit.json'
import koOutfit from './ko/outfit.json'
import enItem from './en/item.json'
import deItem from './de/item.json'
import zhItem from './zh/item.json'
import koItem from './ko/item.json'

const translations = {
  en: { outfit: enOutfit, item: enItem },
  de: { outfit: deOutfit, item: deItem },
  zh: { outfit: zhOutfit, item: zhItem },
  ko: { outfit: koOutfit, item: koItem },
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
        `banner.${banner.bannerId}.name` as keyof typeof locale.outfit
      const bannerName = locale.outfit[bannerKey] || `Banner ${banner.bannerId}`

      return {
        loc: `images/banners/${banner.bannerId}.webp`,
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

      // Get banner name from outfit translations
      const bannerKey =
        `banner.${banner.bannerId}.name` as keyof typeof locale.outfit
      const bannerName = locale.outfit[bannerKey] || `Banner ${banner.bannerId}`

      const images = [
        // Banner image
        {
          loc: `images/banners/${banner.bannerId}.webp`,
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
          loc: `images/outfits/${outfitId}.webp`,
          title: outfitName as string,
          caption: outfitName as string,
        })

        // Add individual item images for this outfit
        const outfit = OUTFIT_DATA[outfitId as keyof typeof OUTFIT_DATA]
        if (outfit) {
          outfit.items.forEach((itemId: string) => {
            const itemKey = `item.${itemId}.name` as keyof typeof locale.outfit
            const itemName = locale.outfit[itemKey] || `Item ${itemId}`
            images.push({
              loc: `images/items/${itemId}.webp`,
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
          loc: `images/outfits/${outfitId}.webp`,
          title: outfitName as string,
          caption: outfitName as string,
        })

        // Add individual item images for this outfit
        const outfit = OUTFIT_DATA[outfitId as keyof typeof OUTFIT_DATA]
        if (outfit) {
          outfit.items.forEach((itemId: string) => {
            const itemKey = `item.${itemId}.name` as keyof typeof locale.outfit
            const itemName = locale.outfit[itemKey] || `Item ${itemId}`
            images.push({
              loc: `images/items/${itemId}.webp`,
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
            loc: `images/items/${rewardId}.webp`,
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

  return [...results, ...individualBannerPages]
}
