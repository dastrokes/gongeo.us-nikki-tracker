const wardrobeState = () => ({
  data: useState<WardrobeDataV1>('wardrobe:data', () =>
    createEmptyWardrobeData()
  ),
  initialized: useState<boolean>('wardrobe:initialized', () => false),
  loading: useState<boolean>('wardrobe:loading', () => false),
  saving: useState<boolean>('wardrobe:saving', () => false),
  error: useState<Error | null>('wardrobe:error', () => null),
  activeSlotLoaded: useState<number | null>(
    'wardrobe:active-slot-loaded',
    () => null
  ),
  mutationVersion: useState<number>('wardrobe:mutation-version', () => 0),
  watcherRegistered: useState<boolean>(
    'wardrobe:watcher-registered',
    () => false
  ),
})

let wardrobeInitRunId = 0

const collectTrackerItemIds = (data: {
  pulls: Record<number, PullRecord[]>
  edits: Record<number, EditRecord[]>
  pearpal: Record<number, PearpalTrackerItem[]>
}) => {
  const itemIds = new Set<number>()

  const addItemId = (value: unknown) => {
    const normalized = normalizeWardrobeItemIds([value])
    if (normalized[0] !== undefined) {
      itemIds.add(normalized[0])
    }
  }

  Object.values(data.pulls).forEach((pulls) => {
    pulls.forEach((pull) => addItemId(pull[1]))
  })

  Object.values(data.edits).forEach((edits) => {
    edits.forEach((edit) => addItemId(edit[1]))
  })

  Object.values(data.pearpal).forEach((items) => {
    items.forEach((item) => addItemId(item.result))
  })

  return Array.from(itemIds).sort((left, right) => left - right)
}

export const useWardrobe = () => {
  const {
    data,
    initialized,
    loading,
    saving,
    error,
    activeSlotLoaded,
    mutationVersion,
    watcherRegistered,
  } = wardrobeState()
  const { activeSlot } = useProfileSlots()
  const { loadWardrobe, saveWardrobe, loadData } = useIndexedDB()
  const catalogIndex = useCatalogIndex()

  const ownedItemIds = computed(() => data.value.ownedItemIds)
  const ownedItemIdSet = computed(() => new Set(data.value.ownedItemIds))
  const canMutate = computed(
    () => initialized.value && !loading.value && !error.value
  )

  const init = async (options: { force?: boolean } = {}) => {
    const slot = activeSlot.value
    if (
      !options.force &&
      initialized.value &&
      activeSlotLoaded.value === slot
    ) {
      return
    }

    const runId = ++wardrobeInitRunId
    loading.value = true
    error.value = null

    try {
      const nextData = await loadWardrobe(slot)
      if (runId !== wardrobeInitRunId) return

      data.value = nextData
      activeSlotLoaded.value = slot
      initialized.value = true
      mutationVersion.value += 1
    } catch (caughtError) {
      if (runId !== wardrobeInitRunId) return

      error.value = toError(caughtError, 'Failed to load wardrobe')
      initialized.value = false
    } finally {
      if (runId === wardrobeInitRunId) {
        loading.value = false
      }
    }

    if (!watcherRegistered.value) {
      watcherRegistered.value = true
      watch(activeSlot, () => {
        void init({ force: true })
      })
    }
  }

  const persistOptimistic = async (nextData: WardrobeDataV1) => {
    if (!canMutate.value) {
      throw new Error('Wardrobe storage is not ready')
    }

    const previousData = data.value
    const normalized = normalizeWardrobeData(nextData)

    data.value = normalized
    saving.value = true
    error.value = null
    mutationVersion.value += 1

    try {
      await saveWardrobe(normalized, activeSlot.value)
    } catch (caughtError) {
      data.value = previousData
      mutationVersion.value += 1
      error.value = toError(caughtError, 'Failed to save wardrobe')
      throw error.value
    } finally {
      saving.value = false
    }
  }

  const markItemsOwned = async (itemIds: readonly number[], owned: boolean) => {
    const normalizedItemIds = normalizeWardrobeItemIds([...itemIds])
    if (normalizedItemIds.length === 0) return { changed: 0 }

    const nextSet = new Set(data.value.ownedItemIds)
    let changed = 0

    normalizedItemIds.forEach((itemId) => {
      const wasOwned = nextSet.has(itemId)
      if (owned && !wasOwned) {
        nextSet.add(itemId)
        changed += 1
      } else if (!owned && wasOwned) {
        nextSet.delete(itemId)
        changed += 1
      }
    })

    if (changed === 0) return { changed: 0 }

    await persistOptimistic({
      version: WARDROBE_DATA_VERSION,
      ownedItemIds: Array.from(nextSet),
      updatedAt: new Date().toISOString(),
    })

    return { changed }
  }

  const toggleItemOwned = async (itemId: number, owned?: boolean) => {
    const normalizedItemIds = normalizeWardrobeItemIds([itemId])
    const normalizedItemId = normalizedItemIds[0]
    if (normalizedItemId === undefined) return { changed: 0 }

    const nextOwned = owned ?? !ownedItemIdSet.value.has(normalizedItemId)
    return markItemsOwned([normalizedItemId], nextOwned)
  }

  const markOutfitOwned = async (itemIds: readonly number[], owned: boolean) =>
    markItemsOwned(itemIds, owned)

  const isItemOwned = (itemId: number) => ownedItemIdSet.value.has(itemId)

  const getOutfitProgress = (itemIds: readonly number[]) =>
    getWardrobeOutfitProgress(itemIds, ownedItemIdSet.value)

  const retry = () => init({ force: true })

  const importOwnedItemsFromTracker = async () => {
    if (!canMutate.value) {
      throw new Error('Wardrobe storage is not ready')
    }

    const trackerData = await loadData(activeSlot.value)
    const trackerItemIds = collectTrackerItemIds(trackerData)
    if (trackerItemIds.length === 0) {
      return { found: 0, imported: 0 }
    }

    await catalogIndex.load()
    const catalogItemSet = new Set(
      catalogIndex.index.value?.items.map((item) => item.id) ?? []
    )
    const validItemIds = trackerItemIds.filter((itemId) =>
      catalogItemSet.has(itemId)
    )

    const result = await markItemsOwned(validItemIds, true)
    return {
      found: validItemIds.length,
      imported: result.changed,
    }
  }

  return {
    data: readonly(data),
    ownedItemIds,
    ownedItemIdSet,
    initialized: readonly(initialized),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    canMutate,
    mutationVersion: readonly(mutationVersion),
    init,
    retry,
    isItemOwned,
    getOutfitProgress,
    toggleItemOwned,
    markItemsOwned,
    markOutfitOwned,
    importOwnedItemsFromTracker,
  }
}
