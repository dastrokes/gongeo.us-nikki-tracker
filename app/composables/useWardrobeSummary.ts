export const useWardrobeSummary = (
  options: {
    scope?: Ref<WardrobeSummaryScope>
  } = {}
) => {
  const catalogIndex = useCatalogIndex()
  const { ownedItemIds, ownedMakeupIds, ownedMomoIds, mutationVersion } =
    useWardrobe()
  const { activeRegionScope } = useWardrobeSettings()

  const load = async () => {
    await catalogIndex.load([
      'items',
      'outfits',
      'outfitItems',
      'makeups',
      'makeupItems',
      'momo',
    ])
  }

  const summary = computed(() => {
    const index = catalogIndex.index.value
    if (!index) return null

    return createWardrobeSummary({
      index,
      ownedItemIds: ownedItemIds.value,
      ownedMakeupIds: ownedMakeupIds.value,
      ownedMomoIds: ownedMomoIds.value,
      nearCompleteLimit: 6,
      scope: options.scope?.value ?? 'base',
      regionScope: activeRegionScope.value,
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
