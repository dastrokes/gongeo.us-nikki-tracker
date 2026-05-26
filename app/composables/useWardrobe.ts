const wardrobeState = () => ({
  data: useState<WardrobeData>('wardrobe:data', () =>
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
  const { activeRegionScope } = useWardrobeSettings()

  const ownedItemIds = computed(() => data.value.ownedItemIds)
  const ownedMakeupIds = computed(() => data.value.ownedMakeupIds)
  const ownedMomoIds = computed(() => data.value.ownedMomoIds)
  const ownedItemIdSet = computed(() => new Set(data.value.ownedItemIds))
  const ownedMakeupIdSet = computed(() => new Set(data.value.ownedMakeupIds))
  const ownedMomoIdSet = computed(() => new Set(data.value.ownedMomoIds))
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

      const wasInitialized = initialized.value
      data.value = nextData
      activeSlotLoaded.value = slot
      initialized.value = true
      if (wasInitialized) {
        mutationVersion.value += 1
      }
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

  const persistOptimistic = async (nextData: WardrobeData) => {
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
      ownedMakeupIds: data.value.ownedMakeupIds,
      ownedMomoIds: data.value.ownedMomoIds,
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

  const markMakeupsOwned = async (
    makeupIds: readonly number[],
    owned: boolean
  ) => {
    const normalizedMakeupIds = normalizeWardrobeItemIds([...makeupIds])
    if (normalizedMakeupIds.length === 0) return { changed: 0 }

    const nextSet = new Set(data.value.ownedMakeupIds)
    let changed = 0

    normalizedMakeupIds.forEach((makeupId) => {
      const wasOwned = nextSet.has(makeupId)
      if (owned && !wasOwned) {
        nextSet.add(makeupId)
        changed += 1
      } else if (!owned && wasOwned) {
        nextSet.delete(makeupId)
        changed += 1
      }
    })

    if (changed === 0) return { changed: 0 }

    await persistOptimistic({
      version: WARDROBE_DATA_VERSION,
      ownedItemIds: data.value.ownedItemIds,
      ownedMakeupIds: Array.from(nextSet),
      ownedMomoIds: data.value.ownedMomoIds,
      updatedAt: new Date().toISOString(),
    })

    return { changed }
  }

  const markMomoOwned = async (momoIds: readonly number[], owned: boolean) => {
    const normalizedMomoIds = normalizeWardrobeItemIds([...momoIds])
    if (normalizedMomoIds.length === 0) return { changed: 0 }

    const nextSet = new Set(data.value.ownedMomoIds)
    let changed = 0

    normalizedMomoIds.forEach((momoId) => {
      const wasOwned = nextSet.has(momoId)
      if (owned && !wasOwned) {
        nextSet.add(momoId)
        changed += 1
      } else if (!owned && wasOwned) {
        nextSet.delete(momoId)
        changed += 1
      }
    })

    if (changed === 0) return { changed: 0 }

    await persistOptimistic({
      version: WARDROBE_DATA_VERSION,
      ownedItemIds: data.value.ownedItemIds,
      ownedMakeupIds: data.value.ownedMakeupIds,
      ownedMomoIds: Array.from(nextSet),
      updatedAt: new Date().toISOString(),
    })

    return { changed }
  }

  const markWardrobeIdsOwned = async ({
    itemIds,
    makeupIds,
    momoIds,
  }: {
    itemIds: readonly number[]
    makeupIds: readonly number[]
    momoIds: readonly number[]
  }) => {
    const normalizedItemIds = normalizeWardrobeItemIds([...itemIds])
    const normalizedMakeupIds = normalizeWardrobeItemIds([...makeupIds])
    const normalizedMomoIds = normalizeWardrobeItemIds([...momoIds])

    const nextItemSet = new Set(data.value.ownedItemIds)
    const nextMakeupSet = new Set(data.value.ownedMakeupIds)
    const nextMomoSet = new Set(data.value.ownedMomoIds)
    const changed = {
      items: 0,
      makeups: 0,
      momo: 0,
    }

    normalizedItemIds.forEach((itemId) => {
      if (nextItemSet.has(itemId)) return
      nextItemSet.add(itemId)
      changed.items += 1
    })

    normalizedMakeupIds.forEach((makeupId) => {
      if (nextMakeupSet.has(makeupId)) return
      nextMakeupSet.add(makeupId)
      changed.makeups += 1
    })

    normalizedMomoIds.forEach((momoId) => {
      if (nextMomoSet.has(momoId)) return
      nextMomoSet.add(momoId)
      changed.momo += 1
    })

    const totalChanged = changed.items + changed.makeups + changed.momo
    if (totalChanged === 0) {
      return { ...changed, total: 0 }
    }

    await persistOptimistic({
      version: WARDROBE_DATA_VERSION,
      ownedItemIds: Array.from(nextItemSet),
      ownedMakeupIds: Array.from(nextMakeupSet),
      ownedMomoIds: Array.from(nextMomoSet),
      updatedAt: new Date().toISOString(),
    })

    return { ...changed, total: totalChanged }
  }

  const toggleMakeupOwned = async (makeupId: number, owned?: boolean) => {
    const normalizedMakeupIds = normalizeWardrobeItemIds([makeupId])
    const normalizedMakeupId = normalizedMakeupIds[0]
    if (normalizedMakeupId === undefined) return { changed: 0 }

    const nextOwned = owned ?? !ownedMakeupIdSet.value.has(normalizedMakeupId)
    return markMakeupsOwned([normalizedMakeupId], nextOwned)
  }

  const toggleMomoOwned = async (momoId: number, owned?: boolean) => {
    const normalizedMomoIds = normalizeWardrobeItemIds([momoId])
    const normalizedMomoId = normalizedMomoIds[0]
    if (normalizedMomoId === undefined) return { changed: 0 }

    const nextOwned = owned ?? !ownedMomoIdSet.value.has(normalizedMomoId)
    return markMomoOwned([normalizedMomoId], nextOwned)
  }

  const isItemOwned = (itemId: number) => ownedItemIdSet.value.has(itemId)
  const isMakeupOwned = (makeupId: number) =>
    ownedMakeupIdSet.value.has(makeupId)
  const isMomoOwned = (momoId: number) => ownedMomoIdSet.value.has(momoId)

  const getOutfitProgress = (itemIds: readonly number[]) =>
    getWardrobeOutfitProgress(itemIds, ownedItemIdSet.value)

  const getFullMakeupProgress = (makeupIds: readonly number[]) =>
    getWardrobeSetProgress(makeupIds, ownedMakeupIdSet.value)

  const retry = () => init({ force: true })

  const getTrackerWardrobeImportPreview = async () => {
    if (!canMutate.value) {
      throw new Error('Wardrobe storage is not ready')
    }

    const trackerData = await loadData(activeSlot.value)
    const bannerPullData = useBannerPullData()
    const gameProcessed = bannerPullData.processBannerPullData(
      trackerData.pulls,
      trackerData.edits
    )
    const { processPearpalData } = usePearpalData()
    const pearpalData = Object.fromEntries(
      Object.entries(trackerData.pearpal).filter(
        ([, items]) => items.length > 0
      )
    )
    const pearpalProcessed = processPearpalData(pearpalData)
    const processedBanners = mergeProcessedBannerSources([
      gameProcessed,
      pearpalProcessed,
    ])

    await catalogIndex.load([
      'items',
      'outfits',
      'outfitItems',
      'makeups',
      'makeupItems',
      'makeupOutfits',
      'momo',
      'momoOutfits',
    ])

    const index = catalogIndex.index.value
    if (!index) {
      throw new Error('Catalog index is not ready')
    }

    const inferred = inferWardrobeIdsFromTracker({
      processedBanners,
      evoData: trackerData.evo,
      catalogIndex: index,
    })

    const availableItemIds = filterCatalogIdsByRegionScope(
      'item',
      inferred.itemIds,
      activeRegionScope.value
    )
    const availableMakeupIds = filterCatalogIdsByRegionScope(
      'makeup',
      inferred.makeupIds,
      activeRegionScope.value
    )
    const availableMomoIds = filterCatalogIdsByRegionScope(
      'momo',
      inferred.momoIds,
      activeRegionScope.value
    )
    const totalFound =
      availableItemIds.length +
      availableMakeupIds.length +
      availableMomoIds.length
    const itemIds = availableItemIds.filter(
      (itemId) => !ownedItemIdSet.value.has(itemId)
    )
    const makeupIds = availableMakeupIds.filter(
      (makeupId) => !ownedMakeupIdSet.value.has(makeupId)
    )
    const momoIds = availableMomoIds.filter(
      (momoId) => !ownedMomoIdSet.value.has(momoId)
    )

    return {
      itemIds,
      makeupIds,
      momoIds,
      found: totalFound,
      imported: itemIds.length + makeupIds.length + momoIds.length,
      foundItems: availableItemIds.length,
      foundMakeups: availableMakeupIds.length,
      foundMomo: availableMomoIds.length,
      importedItems: itemIds.length,
      importedMakeups: makeupIds.length,
      importedMomo: momoIds.length,
      skippedPartialFiveStarMakeupOutfits:
        inferred.skipped.partialFiveStarMakeupOutfits,
    }
  }

  const importOwnedItemsFromTracker = async () => {
    const preview = await getTrackerWardrobeImportPreview()
    const result = await markWardrobeIdsOwned({
      itemIds: preview.itemIds,
      makeupIds: preview.makeupIds,
      momoIds: preview.momoIds,
    })

    return {
      ...preview,
      imported: result.total,
      importedItems: result.items,
      importedMakeups: result.makeups,
      importedMomo: result.momo,
    }
  }

  return {
    data: readonly(data),
    ownedItemIds,
    ownedMakeupIds,
    ownedMomoIds,
    ownedItemIdSet,
    ownedMakeupIdSet,
    ownedMomoIdSet,
    initialized: readonly(initialized),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    canMutate,
    mutationVersion: readonly(mutationVersion),
    init,
    retry,
    isItemOwned,
    isMakeupOwned,
    isMomoOwned,
    getOutfitProgress,
    getFullMakeupProgress,
    toggleItemOwned,
    toggleMakeupOwned,
    toggleMomoOwned,
    markItemsOwned,
    markOutfitOwned,
    markMakeupsOwned,
    markMomoOwned,
    markWardrobeIdsOwned,
    getTrackerWardrobeImportPreview,
    importOwnedItemsFromTracker,
  }
}
