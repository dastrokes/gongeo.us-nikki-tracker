type OwnedSearchCandidateFilters = Pick<
  CatalogSearchFilters,
  'itemTypes' | 'version' | 'quality' | 'style' | 'label' | 'source'
>

const toCatalogListingFilters = (filters: OwnedSearchCandidateFilters) => ({
  type: filters.itemTypes[0] ?? 'all',
  version: filters.version,
  quality: filters.quality,
  style: filters.style,
  label: filters.label,
  source: filters.source,
})

export const useOwnedSearchCandidates = () => {
  const wardrobe = useWardrobe()
  const catalogIndex = useCatalogIndex()
  const error = ref<Error | null>(null)
  const loading = ref(false)

  const ensureWardrobeReady = async () => {
    if (!wardrobe.initialized.value) {
      await wardrobe.init()
    }

    if (wardrobe.error.value) {
      throw wardrobe.error.value
    }
  }

  const isOwned = async (itemId: number | null | undefined) => {
    await ensureWardrobeReady()
    return (
      typeof itemId === 'number' && wardrobe.ownedItemIdSet.value.has(itemId)
    )
  }

  const filterOwnedHits = async <THit extends { itemId: number | null }>(
    hits: readonly THit[]
  ) => {
    await ensureWardrobeReady()
    const ownedSet = wardrobe.ownedItemIdSet.value
    return hits.filter((hit) => hit.itemId !== null && ownedSet.has(hit.itemId))
  }

  const getRandomCandidateIds = async (
    filters: OwnedSearchCandidateFilters
  ) => {
    loading.value = true
    error.value = null

    try {
      await ensureWardrobeReady()
      await catalogIndex.load(['items'])
      const index = catalogIndex.index.value
      if (!index) {
        throw new Error('Catalog index is unavailable')
      }

      const catalogIds = getLocalCatalogItemMatchingIds({
        filters: toCatalogListingFilters(filters),
        index,
      })
      const ownedSet = wardrobe.ownedItemIdSet.value
      return catalogIds.filter((itemId) => ownedSet.has(itemId))
    } catch (caughtError) {
      const normalizedError = toError(
        caughtError,
        'Failed to prepare owned search candidates'
      )
      error.value = normalizedError
      throw normalizedError
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    mutationVersion: wardrobe.mutationVersion,
    ensureWardrobeReady,
    isOwned,
    filterOwnedHits,
    getRandomCandidateIds,
  }
}
