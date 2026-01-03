import type Fuse from 'fuse.js'
import { pinyin } from 'pinyin-pro'
import type {
  SearchResult,
  SearchIndex,
  SearchOptions,
  SearchCategory,
} from '~/types/search'
import { BANNER_DATA } from '~/data/banners'

const CHINESE_CHAR_REGEX = /[\u4e00-\u9fff]/

export const useSearch = () => {
  const { t, locale } = useI18n()
  const localePath = useLocalePath()
  const isChineseLocale = computed(() => locale.value === 'zh')

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

  type SearchMeta = Pick<SearchResult, 'pinyin' | 'pinyinInitials'>

  const toUniqueValues = (values: string[]): string[] =>
    Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))

  const getChineseSearchMeta = (name: string): Partial<SearchMeta> => {
    if (!isChineseLocale.value) {
      return {}
    }

    const normalizedName = name.trim()
    if (!normalizedName || !CHINESE_CHAR_REGEX.test(normalizedName)) {
      return {}
    }

    const syllables = pinyin(normalizedName, {
      toneType: 'none',
      type: 'array',
      nonZh: 'removed',
    }) as string[]

    if (syllables.length === 0) {
      return {}
    }

    const pinyinCandidates = toUniqueValues([
      syllables.join(' '),
      syllables.join(''),
    ])

    const initialsArray = pinyin(normalizedName, {
      pattern: 'first',
      type: 'array',
      toneType: 'none',
      nonZh: 'removed',
    }) as string[]

    const initialsCandidates = toUniqueValues([
      initialsArray.join(' '),
      initialsArray.join(''),
    ])

    const meta: Partial<SearchMeta> = {}

    if (pinyinCandidates.length > 0) {
      meta.pinyin = pinyinCandidates.join(' ')
    }

    if (initialsCandidates.length > 0) {
      meta.pinyinInitials = initialsCandidates.join(' ')
    }

    return meta
  }

  const createSearchResult = (
    payload: Omit<SearchResult, 'pinyin' | 'pinyinInitials'>
  ): SearchResult => ({
    ...payload,
    ...getChineseSearchMeta(payload.name),
  })

  /**
   * Extract all item IDs from i18n JSON files
   */
  const getAllItemIdsFromI18n = async () => {
    const itemIds: string[] = []

    try {
      // Import the English item translations to get all available item IDs
      const itemMessages = await import('~/locales/en/item.json')

      Object.keys(itemMessages.default || itemMessages).forEach((key) => {
        // Extract ID from keys like "item.1020100001.name"
        const match = key.match(/^item\.(\d+)\.name$/)
        if (match && match[1]) {
          itemIds.push(match[1])
        }
      })
    } catch (error) {
      console.error('Failed to load item translations:', error)
    }

    return itemIds
  }

  /**
   * Extract all outfit IDs from i18n JSON files
   */
  const getAllOutfitIdsFromI18n = async () => {
    const outfitIds: string[] = []

    try {
      // Import the English outfit translations to get all available outfit IDs
      const outfitMessages = await import('~/locales/en/outfit.json')

      Object.keys(outfitMessages.default || outfitMessages).forEach((key) => {
        // Extract ID from keys like "outfit.10001.name"
        const match = key.match(/^outfit\.(\d+)\.name$/)
        if (match && match[1]) {
          outfitIds.push(match[1])
        }
      })
    } catch (error) {
      console.error('Failed to load outfit translations:', error)
    }

    return outfitIds
  }

  const buildSearchIndex = async () => {
    if (import.meta.server || isIndexBuilt.value) return

    searchOptions.keys = isChineseLocale.value
      ? ['name', 'pinyin', 'pinyinInitials']
      : ['name']

    const banners = new Map<string, SearchResult>()
    const outfits = new Map<string, SearchResult>()
    const items = new Map<string, SearchResult>()

    // Index banners
    Object.entries(BANNER_DATA)
      .reverse()
      .forEach(([id, banner]) => {
        const name = getLocalizedBannerName(id)
        // Banner types 1 and 2 are 5-star, type 3 is 4-star
        const quality = banner.bannerType === 3 ? 4 : 5
        banners.set(
          id,
          createSearchResult({
            id,
            type: 'banner',
            name: name[locale.value] || name.en,
            quality,
            route: localePath(`/banner/${id}`),
          })
        )
      })

    // Index all outfits from i18n files
    const allOutfitIds = await getAllOutfitIdsFromI18n()
    for (const outfitId of allOutfitIds) {
      const name = getLocalizedOutfitName(outfitId)

      // Only add if the outfit has a valid localized name
      if (name.en && name.en !== `outfit.${outfitId}.name`) {
        outfits.set(
          outfitId,
          createSearchResult({
            id: outfitId,
            type: 'outfit',
            name: name[locale.value] || name.en,
            route: localePath(`/outfit/${outfitId}`),
          })
        )
      }
    }

    // Index all items from i18n files
    const allItemIds = await getAllItemIdsFromI18n()
    for (const itemId of allItemIds) {
      const name = getLocalizedItemName(itemId)

      // Only add if the item has a valid localized name
      if (name.en && name.en !== `item.${itemId}.name`) {
        items.set(
          itemId,
          createSearchResult({
            id: itemId,
            type: 'item',
            name: name[locale.value] || name.en,
            route: localePath(`/item/${itemId}`),
          })
        )
      }
    }

    searchIndex.value = { banners, outfits, items }

    // Create Fuse instance with all searchable items
    const allSearchableItems = [
      ...Array.from(banners.values()),
      ...Array.from(outfits.values()),
      ...Array.from(items.values()),
    ]

    // Dynamically import Fuse.js only on client side
    const { default: Fuse } = await import('fuse.js')
    fuseInstance.value = new Fuse(allSearchableItems, searchOptions)
    isIndexBuilt.value = true
  }

  const search = (query: string): SearchCategory[] => {
    // Only run on client side
    if (import.meta.server) return []

    const normalizedQuery = query.trim()

    if (
      !fuseInstance.value ||
      !normalizedQuery ||
      normalizedQuery.length < searchOptions.minMatchCharLength
    ) {
      return []
    }

    const results = fuseInstance.value.search(normalizedQuery)
    const searchResults = results.map((result) => result.item)

    // Group results by type with fixed limits
    const itemResults = searchResults
      .filter((r) => r.type === 'item')
      .slice(0, 10)
    const outfitResults = searchResults
      .filter((r) => r.type === 'outfit')
      .slice(0, 5)
    const bannerResults = searchResults
      .filter((r) => r.type === 'banner')
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

  const clearSearchIndex = () => {
    searchIndex.value.items.clear()
    searchIndex.value.outfits.clear()
    searchIndex.value.banners.clear()
    fuseInstance.value = null
    isIndexBuilt.value = false
  }

  // Rebuild index when locale changes
  watch(locale, () => {
    clearSearchIndex()
    buildSearchIndex()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    clearSearchIndex()
  })

  return {
    searchIndex: readonly(searchIndex),
    isIndexBuilt: readonly(isIndexBuilt),
    buildSearchIndex,
    search,
    searchOptions,
  }
}
