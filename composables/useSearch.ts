import Fuse from 'fuse.js'
import type {
  SearchResult,
  SearchIndex,
  SearchOptions,
  SearchCategory,
} from '~/types/search'
import { BANNER_DATA } from '~/data/banners'

export const useSearch = () => {
  const { t, locale } = useI18n()
  const localePath = useLocalePath()

  const searchIndex = ref<SearchIndex>({
    items: new Map(),
    outfits: new Map(),
    banners: new Map(),
  })

  const fuseInstance = ref<Fuse<SearchResult> | null>(null)
  const isIndexBuilt = ref(false)

  const searchOptions: SearchOptions = {
    threshold: 0.3,
    keys: ['name'],
    includeScore: true,
    minMatchCharLength: 1,
    ignoreDiacritics: true,
  }

  const getLocalizedBannerName = (
    bannerId: string
  ): { en: string; [key: string]: string } => {
    const key = `banner.${bannerId}.name`
    return {
      en: t(key, {}, { locale: 'en' }),
      [locale.value]: t(key),
    }
  }

  const getLocalizedOutfitName = (
    outfitId: string
  ): { en: string; [key: string]: string } => {
    const key = `outfit.${outfitId}.name`
    return {
      en: t(key, {}, { locale: 'en' }),
      [locale.value]: t(key),
    }
  }

  const getLocalizedItemName = (
    itemId: string
  ): { en: string; [key: string]: string } => {
    const key = `item.${itemId}.name`

    // Try outfit.json first (for outfit items), then item.json (for reward items)
    const enName = t(key, {}, { locale: 'en' })
    const name = t(key)

    // If not found in current domain, the translation will return the key itself
    // This means we need to check if it's a valid translation
    if (enName === key) {
      // Item not found in current localization, return empty
      return { en: '', [locale.value]: '' }
    }

    return {
      en: enName,
      [locale.value]: name !== key ? name : enName,
    }
  }

  const loadOutfitData = async (outfitId: string) => {
    try {
      const outfit = await import(`~/data/outfits/${outfitId}.ts`)
      return outfit.default
    } catch {
      return null
    }
  }

  const buildSearchIndex = async () => {
    if (isIndexBuilt.value) return

    const banners = new Map<string, SearchResult>()
    const outfits = new Map<string, SearchResult>()
    const items = new Map<string, SearchResult>()

    // Index banners
    Object.entries(BANNER_DATA)
      .reverse()
      .forEach(([id, banner]) => {
        const name = getLocalizedBannerName(id)
        // Banner types 1 and 2 are 5-star, type 3 is 4-star
        const rarity = banner.bannerType === 3 ? 4 : 5
        banners.set(id, {
          id,
          type: 'banner',
          name: name[locale.value] || name.en,
          rarity,
          route: localePath(`/banner/${id}`),
        })
      })

    // Index outfits and items from banners
    const processedItems = new Set<string>()

    for (const [bannerId, banner] of Object.entries(BANNER_DATA).reverse()) {
      // Index 5-star outfits
      if (banner.outfit5StarId) {
        for (const outfitId of banner.outfit5StarId) {
          const name = getLocalizedOutfitName(outfitId)
          outfits.set(outfitId, {
            id: outfitId,
            type: 'outfit',
            name: name[locale.value] || name.en,
            rarity: 5,
            route: localePath(`/banner/${bannerId}`),
          })

          // Index items from this outfit
          const outfitData = await loadOutfitData(outfitId)
          if (outfitData?.items) {
            for (const itemId of outfitData.items) {
              if (!processedItems.has(itemId)) {
                const itemname = getLocalizedItemName(itemId)
                // Only add if the item has a localized name (exists in localization files)
                if (itemname.en) {
                  items.set(itemId, {
                    id: itemId,
                    type: 'item',
                    name: itemname[locale.value] || itemname.en,
                    rarity: 5,
                    route: localePath(`/banner/${bannerId}`),
                  })
                  processedItems.add(itemId)
                }
              }
            }
          }
        }
      }

      // Index 4-star outfits
      if (banner.outfit4StarId) {
        for (const outfitId of banner.outfit4StarId) {
          const name = getLocalizedOutfitName(outfitId)
          outfits.set(outfitId, {
            id: outfitId,
            type: 'outfit',
            name: name[locale.value] || name.en,
            rarity: 4,
            route: localePath(`/banner/${bannerId}`),
          })

          // Index items from this outfit
          const outfitData = await loadOutfitData(outfitId)
          if (outfitData?.items) {
            for (const itemId of outfitData.items) {
              if (!processedItems.has(itemId)) {
                const itemname = getLocalizedItemName(itemId)
                // Only add if the item has a localized name (exists in localization files)
                if (itemname.en) {
                  items.set(itemId, {
                    id: itemId,
                    type: 'item',
                    name: itemname[locale.value] || itemname.en,
                    rarity: 4,
                    route: localePath(`/banner/${bannerId}`),
                  })
                  processedItems.add(itemId)
                }
              }
            }
          }
        }
      }

      // Index reward items (from 4-star banners)
      if (banner.rewardIds) {
        for (const itemId of banner.rewardIds) {
          if (!processedItems.has(itemId)) {
            const itemname = getLocalizedItemName(itemId)
            // Only add if the item has a localized name (exists in localization files)
            if (itemname.en) {
              items.set(itemId, {
                id: itemId,
                type: 'item',
                name: itemname[locale.value] || itemname.en,
                rarity: 5,
                route: localePath(`/banner/${bannerId}`),
              })
              processedItems.add(itemId)
            }
          }
        }
      }
    }

    searchIndex.value = { banners, outfits, items }

    // Create Fuse instance with all searchable items
    const allItems = [
      ...Array.from(banners.values()),
      ...Array.from(outfits.values()),
      ...Array.from(items.values()),
    ]

    fuseInstance.value = new Fuse(allItems, searchOptions)
    isIndexBuilt.value = true
  }

  const search = (query: string): SearchCategory[] => {
    if (
      !fuseInstance.value ||
      (query && query.length < searchOptions.minMatchCharLength)
    ) {
      return []
    }

    const results = fuseInstance.value.search(query)
    const searchResults = results.map((result) => result.item)

    // Group results by type with fixed limits
    const bannerResults = searchResults
      .filter((r) => r.type === 'banner')
      .slice(0, 5)
    const outfitResults = searchResults
      .filter((r) => r.type === 'outfit')
      .slice(0, 5)
    const itemResults = searchResults
      .filter((r) => r.type === 'item')
      .slice(0, 5)

    const categories: SearchCategory[] = []

    if (itemResults.length > 0) {
      categories.push({
        type: 'item',
        label: t('search.categories.items'),
        results: itemResults,
      })
    }

    if (outfitResults.length > 0) {
      categories.push({
        type: 'outfit',
        label: t('search.categories.outfits'),
        results: outfitResults,
      })
    }

    if (bannerResults.length > 0) {
      categories.push({
        type: 'banner',
        label: t('search.categories.banners'),
        results: bannerResults,
      })
    }

    return categories
  }

  // Rebuild index when locale changes
  watch(locale, () => {
    isIndexBuilt.value = false
    buildSearchIndex()
  })

  return {
    searchIndex: readonly(searchIndex),
    isIndexBuilt: readonly(isIndexBuilt),
    buildSearchIndex,
    search,
    searchOptions,
  }
}
