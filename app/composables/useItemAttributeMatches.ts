export type ItemAttributeMatchesResponse = {
  ids: number[]
  total: number
  revision: string
}

export type ItemAttributeMatchStatus = 'idle' | 'loading' | 'ready' | 'error'

const itemAttributeMatchStatus = ref<ItemAttributeMatchStatus>('idle')
const itemAttributeMatchError = ref<Error | null>(null)

const appendAttributeMatchFilterParam = (
  params: Record<string, string>,
  key: 'type' | 'category' | 'subcategory',
  value: string | null | undefined
) => {
  if (!value || value === 'all') return
  params[key] = value
}

const buildItemAttributeMatchParams = (filters: Record<string, unknown>) => {
  const type =
    typeof filters.type === 'string' && filters.type !== 'all'
      ? filters.type
      : null
  const taxonomy = normalizeItemSearchTaxonomyFilterSelection({
    itemType: type,
    category: typeof filters.category === 'string' ? filters.category : null,
    subcategory:
      typeof filters.subcategory === 'string' ? filters.subcategory : null,
  })
  const params: Record<string, string> = {}

  appendAttributeMatchFilterParam(params, 'type', type)
  appendAttributeMatchFilterParam(params, 'category', taxonomy.category)
  appendAttributeMatchFilterParam(params, 'subcategory', taxonomy.subcategory)

  Object.assign(
    params,
    buildItemSearchAdvancedFilterQuery(
      filters as ItemSearchAdvancedFilters,
      type,
      getItemSearchCompendiumAdvancedFields(type)
    )
  )

  return params
}

const fetchItemAttributeMatchingIds = async (
  filters: Record<string, unknown>
) => {
  itemAttributeMatchStatus.value = 'loading'
  itemAttributeMatchError.value = null

  try {
    const response = await $fetch<ItemAttributeMatchesResponse>(
      '/api/items/attributes',
      {
        params: buildItemAttributeMatchParams(filters),
        headers: getGameVersionRequestHeaders(),
      }
    )

    itemAttributeMatchStatus.value = 'ready'
    return response.ids
  } catch (e) {
    const normalizedError = toError(e, 'Failed to fetch item attribute matches')
    itemAttributeMatchStatus.value = 'error'
    itemAttributeMatchError.value = normalizedError
    throw normalizedError
  }
}

export const useItemAttributeMatches = (): {
  status: Ref<ItemAttributeMatchStatus>
  error: Ref<Error | null>
  fetchMatchingIds: (filters: Record<string, unknown>) => Promise<number[]>
} => ({
  status: itemAttributeMatchStatus,
  error: itemAttributeMatchError,
  fetchMatchingIds: fetchItemAttributeMatchingIds,
})
