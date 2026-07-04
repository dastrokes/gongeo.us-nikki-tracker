import type Fuse from 'fuse.js'
import type { FuseResult } from 'fuse.js'

type FuseConstructor = (typeof import('fuse.js'))['default']

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
  const fuseConstructor = shallowRef<FuseConstructor | null>(null)
  const isIndexBuilt = ref(false)
  let buildIndexPromise: Promise<void> | null = null
  let fuseLoadPromise: Promise<void> | null = null
  const {
    ensurePinyinLoaded,
    getChineseSearchMeta,
    getOutfitAbilityAliases,
    getOutfitSearchAliases,
    getSearchKeys,
    getSearchThreshold,
  } = useSearchFields(() => isChineseLocale.value)

  const searchOptions: SearchOptions = {
    threshold: getSearchThreshold(),
    keys: ['name'],
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 1,
    ignoreDiacritics: true,
  }

  const ensureFuseLoaded = async () => {
    if (import.meta.server || fuseConstructor.value) {
      return
    }

    if (!fuseLoadPromise) {
      fuseLoadPromise = import('fuse.js')
        .then(({ default: Fuse }) => {
          fuseConstructor.value = Fuse
        })
        .finally(() => {
          fuseLoadPromise = null
        })
    }

    await fuseLoadPromise
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

  const createSearchResult = (
    payload: Omit<SearchResult, 'pinyin' | 'pinyinInitials'>
  ): SearchResult => ({
    ...payload,
    ...getChineseSearchMeta([payload.name, ...(payload.searchAliases ?? [])]),
  })

  const buildSearchIndex = async () => {
    if (import.meta.server || isIndexBuilt.value) return

    if (!buildIndexPromise) {
      buildIndexPromise = (async () => {
        searchOptions.keys = getSearchKeys()
        searchOptions.threshold = getSearchThreshold()

        await ensureFuseLoaded()
        if (isChineseLocale.value) {
          await ensurePinyinLoaded()
        }
        const { BANNER_DATA } = await import('~~/data/banners')

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
                route: localePath(getEntityDetailPath('banner', id)),
              })
            )
          })

        // Index all outfits from the catalog slug map, including variations
        const allOutfitIds = getEntitySlugIds('outfit')
        for (const outfitId of allOutfitIds) {
          const name = getLocalizedOutfitName(outfitId)
          const searchAliases = getOutfitSearchAliases(locale.value, outfitId)
          const searchAbilityAliases = getOutfitAbilityAliases(
            locale.value,
            outfitId
          )

          // Only add if the outfit has a valid localized name
          if (name.en && name.en !== `outfit.${outfitId}.name`) {
            outfits.set(
              outfitId,
              createSearchResult({
                id: outfitId,
                type: 'outfit',
                name: name[locale.value] || name.en,
                ...(searchAliases.length > 0 ? { searchAliases } : {}),
                ...(searchAbilityAliases.length > 0
                  ? { searchAbilityAliases }
                  : {}),
                route: localePath(getEntityDetailPath('outfit', outfitId)),
              })
            )
          }
        }

        // Index all items from the catalog slug map, including variations
        const allItemIds = getEntitySlugIds('item')
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
                route: localePath(getItemEntityDetailPath(itemId)),
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

        const Fuse = fuseConstructor.value
        if (!Fuse) return

        fuseInstance.value = new Fuse(allSearchableItems, searchOptions)
        isIndexBuilt.value = true
      })().finally(() => {
        buildIndexPromise = null
      })
    }

    await buildIndexPromise
  }

  const toSearchResult = (result: FuseResult<SearchResult>): SearchResult => {
    const aliasMatch = result.matches?.find(
      (match) => match.key === 'searchAliases' && match.refIndex !== undefined
    )

    return {
      ...result.item,
      matchedAlias:
        aliasMatch?.refIndex !== undefined
          ? result.item.searchAliases?.[aliasMatch.refIndex]
          : undefined,
    }
  }

  const searchEntities = (query: string, limit?: number): SearchResult[] => {
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

    const searchResults = fuseInstance.value
      .search(normalizedQuery)
      .map(toSearchResult)

    return limit === undefined ? searchResults : searchResults.slice(0, limit)
  }

  const search = (query: string): SearchCategory[] => {
    const searchResults = searchEntities(query)

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

    if (outfitResults.length > 0) {
      categories.push({
        type: 'outfit',
        label: t('common.outfits'),
        results: outfitResults,
      })
    }

    if (itemResults.length > 0) {
      categories.push({
        type: 'item',
        label: t('common.items'),
        results: itemResults,
      })
    }

    if (bannerResults.length > 0) {
      categories.push({
        type: 'banner',
        label: t('common.banners'),
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
    if (isIndexBuilt.value) {
      clearSearchIndex()
    }
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
    searchEntities,
    searchOptions,
  }
}
