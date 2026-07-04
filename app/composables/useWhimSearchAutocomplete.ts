import Fuse from 'fuse.js'

export const useWhimSearchAutocomplete = () => {
  const { t, locale } = useI18n()
  const { translateFilterToken } = useFilterToken()
  const entitySearch = useSearch()
  const isChineseLocale = computed(() => locale.value === 'zh')
  const { ensurePinyinLoaded, getChineseSearchMeta, getSearchThreshold } =
    useSearchFields(() => isChineseLocale.value)
  let termPinyinLoadPromise: Promise<void> | null = null

  const ensureTermPinyinLoaded = () => {
    if (!isChineseLocale.value) return Promise.resolve()
    termPinyinLoadPromise ??= ensurePinyinLoaded().finally(() => {
      termPinyinLoadPromise = null
    })
    return termPinyinLoadPromise
  }

  const getTermSearchValues = (...values: string[]) => {
    const chineseMeta = getChineseSearchMeta(values)
    return [
      ...new Set(
        [
          ...values,
          ...(chineseMeta.pinyin ?? []),
          ...(chineseMeta.pinyinInitials ?? []),
        ]
          .map((value) => value.trim())
          .filter(Boolean)
      ),
    ]
  }

  const terms = computed<SearchAutocompleteTerm[]>(() => {
    const itemTypes = getItemSearchTaxonomyItemTypes()
    const typeTerms = itemTypes.map((itemType) => ({
      id: `item-type:${itemType}`,
      value: t(`type.${itemType}`),
      searchValues: getTermSearchValues(itemType, t(`type.${itemType}`)),
    }))
    const taxonomyTerms = itemTypes.flatMap((itemType) =>
      (['category', 'subcategory'] as const).flatMap((field) =>
        getItemSearchAttributeValues(field, itemType).map((value) => {
          const label = translateFilterToken(field, value, itemType)
          return {
            id: `${itemType}:${field}:${value}`,
            value: label,
            searchValues: getTermSearchValues(value, label),
          }
        })
      )
    )
    const advancedTerms = getItemSearchAdvancedFields().flatMap((field) =>
      getItemSearchAttributeValues(field).map((value) => {
        const label = translateFilterToken(field, value)
        return {
          id: `${field}:${value}`,
          value: label,
          searchValues: getTermSearchValues(value, label),
        }
      })
    )

    const uniqueTerms = new Map<string, SearchAutocompleteTerm>()

    for (const term of [...typeTerms, ...taxonomyTerms, ...advancedTerms]) {
      const key = term.value.trim().toLocaleLowerCase()
      const existing = uniqueTerms.get(key)
      if (existing) {
        existing.searchValues = [
          ...new Set([...existing.searchValues, ...term.searchValues]),
        ]
      } else {
        uniqueTerms.set(key, { ...term })
      }
    }

    return [...uniqueTerms.values()]
  })
  const termIndex = computed(
    () =>
      new Fuse(terms.value, {
        keys: ['searchValues'],
        includeScore: true,
        ignoreDiacritics: true,
        ignoreLocation: true,
        threshold: getSearchThreshold(),
      })
  )

  const searchTerms = (query: string) => {
    void ensureTermPinyinLoaded()

    const fragment = query.trim().split(/\s+/).at(-1) ?? ''
    if (!fragment) return []

    const sortedResults = termIndex.value
      .search(fragment)
      .sort((left, right) => {
        const priority =
          getSearchMatchPriority(left.item.value, fragment) -
          getSearchMatchPriority(right.item.value, fragment)
        return priority || (left.score ?? 1) - (right.score ?? 1)
      })

    return sortedResults.slice(0, 7).map((result) => result.item)
  }

  const buildSearchIndex = async () => {
    await Promise.all([
      entitySearch.buildSearchIndex(),
      ensureTermPinyinLoaded(),
    ])
  }

  return {
    ...entitySearch,
    buildSearchIndex,
    searchTerms,
  }
}
