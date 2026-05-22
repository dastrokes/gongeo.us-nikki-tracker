export const useWardrobeSummary = () => {
  const catalogIndex = useCatalogIndex()
  const { ownedItemIds, mutationVersion } = useWardrobe()

  const load = async () => {
    await catalogIndex.load(['items', 'outfits', 'outfitItems'])
  }

  const summary = computed(() => {
    const index = catalogIndex.index.value
    if (!index) return null

    return createWardrobeSummary({
      index,
      ownedItemIds: ownedItemIds.value,
      nearCompleteLimit: 6,
    })
  })

  const ready = computed(
    () => catalogIndex.status.value === 'ready' && !!summary.value
  )
  const loading = computed(() => catalogIndex.status.value === 'loading')
  const error = computed(() => catalogIndex.error.value)

  watch(mutationVersion, () => {
    if (catalogIndex.status.value === 'idle') {
      void load()
    }
  })

  return {
    summary,
    ready,
    loading,
    error,
    load,
  }
}
