export const useWardrobeSummary = (
  options: {
    scope?: Ref<WardrobeSummaryScope>
  } = {}
) => {
  const catalogIndex = useCatalogIndex()
  const { ownedItemIds, ownedMakeupIds, ownedMomoIds, mutationVersion } =
    useWardrobe()
  const { activeRegionScope } = useWardrobeSettings()
  const loading = ref(true)
  const loadError = shallowRef<Error | null>(null)

  const load = async () => {
    loading.value = true
    loadError.value = null
    try {
      await catalogIndex.load([
        'items',
        'outfits',
        'outfitItems',
        'makeups',
        'makeupItems',
        'momo',
      ])
    } catch (error) {
      loadError.value = toError(error, 'Failed to load wardrobe summary')
      throw loadError.value
    } finally {
      loading.value = false
    }
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
  const error = computed(() => (ready.value ? null : loadError.value))

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
