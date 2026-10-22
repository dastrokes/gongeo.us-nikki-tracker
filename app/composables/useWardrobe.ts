const wardrobeState = () => ({
  data: useState<WardrobeData>('wardrobe:data', () =>
    createEmptyWardrobeData()
  ),
  initialized: useState<boolean>('wardrobe:initialized', () => false),
  loading: useState<boolean>('wardrobe:loading', () => false),
  pendingMutations: useState<number>('wardrobe:pending-mutations', () => 0),
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

const enqueueWardrobeMutation = createIndexedDBOperationQueue()

export const useWardrobe = () => {
  const {
    data,
    initialized,
    loading,
    pendingMutations,
    error,
    activeSlotLoaded,
    mutationVersion,
    watcherRegistered,
  } = wardrobeState()
  const { activeSlot, withProfileLock } = useProfileSlots()
  const initRunId = useState<number>('wardrobe:init-run-id', () => 0)
  const saving = computed(() => pendingMutations.value > 0)
  const { loadWardrobe, saveWardrobe, loadData } = useIndexedDB()
  const catalogIndex = useCatalogIndex()
  const { activeRegionScope } = useWardrobeSettings()

  const ownedItemIds = computed(() => data.value.ownedItemIds)
  const ownedMakeupIds = computed(() => data.value.ownedMakeupIds)
  const ownedMomoIds = computed(() => data.value.ownedMomoIds)
  const ownedPropIds = computed(() => data.value.ownedPropIds)
  const ownedEurekaColorIds = computed(() => data.value.ownedEurekaColorIds)
  const ownedItemIdSet = computed(() => new Set(data.value.ownedItemIds))
  const ownedMakeupIdSet = computed(() => new Set(data.value.ownedMakeupIds))
  const ownedMomoIdSet = computed(() => new Set(data.value.ownedMomoIds))
  const ownedPropIdSet = computed(() => new Set(data.value.ownedPropIds))
  const ownedEurekaColorIdSet = computed(
    () => new Set(data.value.ownedEurekaColorIds)
  )
  const canMutate = computed(
    () =>
      initialized.value &&
      activeSlotLoaded.value === activeSlot.value &&
      !loading.value &&
      !error.value
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

    const runId = ++initRunId.value
    loading.value = true
    error.value = null

    try {
      const nextData = await loadWardrobe(slot)
      if (runId !== initRunId.value || slot !== activeSlot.value) return

      const wasInitialized = initialized.value
      data.value = nextData
      activeSlotLoaded.value = slot
      initialized.value = true
      if (wasInitialized) {
        mutationVersion.value += 1
      }
    } catch (caughtError) {
      if (runId !== initRunId.value || slot !== activeSlot.value) return

      error.value = toError(caughtError, 'Failed to load wardrobe')
      initialized.value = false
    } finally {
      if (runId === initRunId.value) {
        loading.value = false
      }
    }
  }

  if (import.meta.client && !watcherRegistered.value) {
    watcherRegistered.value = true
    watch(
      activeSlot,
      () => {
        void init({ force: true })
      },
      { flush: 'sync' }
    )
  }

  // Queue the state calculation as well as the write, across all consumers.
  const queueMutation = withProfileLock(
    async <T>(mutate: () => Promise<T>): Promise<T> => {
      if (!canMutate.value) throw new Error('Wardrobe storage is not ready')
      pendingMutations.value += 1
      try {
        return await enqueueWardrobeMutation(() => {
          if (!initialized.value || loading.value) {
            throw new Error('Wardrobe storage is not ready')
          }
          // Earlier failures have rolled back before deriving the next edit.
          error.value = null
          return mutate()
        })
      } finally {
        pendingMutations.value -= 1
      }
    }
  )

  const persistOptimistic = async (nextData: WardrobeData) => {
    const slot = activeSlot.value
    const previousData = data.value
    data.value = normalizeWardrobeData(nextData)
    const optimistic = data.value
    mutationVersion.value += 1

    try {
      await saveWardrobe(optimistic, slot)
    } catch (caughtError) {
      const saveError = toError(caughtError, 'Failed to save wardrobe')
      if (data.value === optimistic) {
        data.value = previousData
        mutationVersion.value += 1
        error.value = saveError
      }
      throw saveError
    }
  }

  type OwnershipField =
    | 'ownedItemIds'
    | 'ownedMakeupIds'
    | 'ownedMomoIds'
    | 'ownedPropIds'
    | 'ownedEurekaColorIds'

  const markOwnershipIds = (
    field: OwnershipField,
    ids: readonly number[],
    owned: boolean | undefined
  ) => {
    const normalizedIds = normalizeWardrobeItemIds([...ids])
    return queueMutation(async () => {
      const nextSet = new Set(data.value[field])
      let changed = 0
      for (const id of normalizedIds) {
        const wasOwned = nextSet.has(id)
        const nextOwned = owned ?? !wasOwned
        if (nextOwned === wasOwned) continue
        if (nextOwned) nextSet.add(id)
        else nextSet.delete(id)
        changed += 1
      }
      if (changed > 0) {
        await persistOptimistic({
          ...data.value,
          [field]: Array.from(nextSet),
          updatedAt: new Date().toISOString(),
        })
      }
      return { changed }
    })
  }

  const markItemsOwned = (ids: readonly number[], owned: boolean) =>
    markOwnershipIds('ownedItemIds', ids, owned)
  const toggleItemOwned = (id: number, owned?: boolean) =>
    markOwnershipIds('ownedItemIds', [id], owned)
  const markOutfitOwned = markItemsOwned
  const markMakeupsOwned = (ids: readonly number[], owned: boolean) =>
    markOwnershipIds('ownedMakeupIds', ids, owned)
  const toggleMakeupOwned = (id: number, owned?: boolean) =>
    markOwnershipIds('ownedMakeupIds', [id], owned)
  const markMomoOwned = (ids: readonly number[], owned: boolean) =>
    markOwnershipIds('ownedMomoIds', ids, owned)
  const toggleMomoOwned = (id: number, owned?: boolean) =>
    markOwnershipIds('ownedMomoIds', [id], owned)
  const markPropsOwned = (ids: readonly number[], owned: boolean) =>
    markOwnershipIds('ownedPropIds', ids, owned)
  const togglePropOwned = (id: number, owned?: boolean) =>
    markOwnershipIds('ownedPropIds', [id], owned)
  const markEurekaColorsOwned = (ids: readonly number[], owned: boolean) =>
    markOwnershipIds('ownedEurekaColorIds', ids, owned)
  const toggleEurekaColorOwned = (id: number, owned?: boolean) =>
    markOwnershipIds('ownedEurekaColorIds', [id], owned)

  const markWardrobeIdsOwned = ({
    itemIds,
    makeupIds,
    momoIds,
    propIds = [],
  }: {
    itemIds: readonly number[]
    makeupIds: readonly number[]
    momoIds: readonly number[]
    propIds?: readonly number[]
  }) => {
    const normalizedItemIds = normalizeWardrobeItemIds([...itemIds])
    const normalizedMakeupIds = normalizeWardrobeItemIds([...makeupIds])
    const normalizedMomoIds = normalizeWardrobeItemIds([...momoIds])
    const normalizedPropIds = normalizeWardrobeItemIds([...propIds])

    return queueMutation(async () => {
      const nextItemSet = new Set(data.value.ownedItemIds)
      const nextMakeupSet = new Set(data.value.ownedMakeupIds)
      const nextMomoSet = new Set(data.value.ownedMomoIds)
      const nextPropSet = new Set(data.value.ownedPropIds)
      const changed = {
        items: 0,
        makeups: 0,
        momo: 0,
        props: 0,
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

      normalizedPropIds.forEach((propId) => {
        if (nextPropSet.has(propId)) return
        nextPropSet.add(propId)
        changed.props += 1
      })

      const totalChanged =
        changed.items + changed.makeups + changed.momo + changed.props
      if (totalChanged === 0) {
        return { ...changed, total: 0 }
      }

      await persistOptimistic({
        version: WARDROBE_DATA_VERSION,
        ownedItemIds: Array.from(nextItemSet),
        ownedMakeupIds: Array.from(nextMakeupSet),
        ownedMomoIds: Array.from(nextMomoSet),
        ownedPropIds: Array.from(nextPropSet),
        ownedEurekaColorIds: data.value.ownedEurekaColorIds,
        updatedAt: new Date().toISOString(),
      })

      return { ...changed, total: totalChanged }
    })
  }

  const importOwnedItemsFromPearpal = async (
    clothes: readonly { item_id: number }[]
  ) => {
    if (!canMutate.value) {
      throw new Error('Wardrobe storage is not ready')
    }

    await catalogIndex.load(['items', 'makeups'])

    const index = catalogIndex.index.value
    if (!index) {
      throw new Error('Catalog index is not ready')
    }

    const itemIds = new Set<number>()
    const makeupIds = new Set<number>()

    clothes.forEach(({ item_id: itemId }) => {
      const normalizedItemId = Number(itemId)
      if (!Number.isSafeInteger(normalizedItemId) || normalizedItemId <= 0) {
        return
      }

      if (index.itemById.has(normalizedItemId)) {
        itemIds.add(normalizedItemId)
      } else if (index.makeupById.has(normalizedItemId)) {
        makeupIds.add(normalizedItemId)
      }
    })

    const result = await markWardrobeIdsOwned({
      itemIds: Array.from(itemIds),
      makeupIds: Array.from(makeupIds),
      momoIds: [],
    })

    return {
      foundItems: itemIds.size,
      foundMakeups: makeupIds.size,
      importedItems: result.items,
      importedMakeups: result.makeups,
      imported: result.total,
    }
  }

  const importCompletedOutfitsFromPearpal = async (
    suitIds: readonly (string | number)[]
  ) => {
    if (!canMutate.value) {
      throw new Error('Wardrobe storage is not ready')
    }

    await catalogIndex.load(['items', 'outfits', 'outfitItems'])

    const index = catalogIndex.index.value
    if (!index) {
      throw new Error('Catalog index is not ready')
    }

    const itemIds = getPearpalCompletedOutfitItemIds(suitIds, index)
    const result = await markWardrobeIdsOwned({
      itemIds,
      makeupIds: [],
      momoIds: [],
    })

    return {
      foundItems: itemIds.length,
      foundMakeups: 0,
      importedItems: result.items,
      importedMakeups: 0,
      imported: result.total,
    }
  }

  const importOwnedEurekasFromPearpal = async (
    rows: readonly PearpalMagicBallItem[]
  ) => {
    if (!canMutate.value) {
      throw new Error('Wardrobe storage is not ready')
    }

    const eurekaCatalog = useEurekaCatalog()
    await eurekaCatalog.load()
    const resolved = resolvePearpalEurekaColors(
      rows,
      eurekaCatalog.entries.value
    )
    const newColorIds = resolved.colorIds.filter(
      (colorId) => !ownedEurekaColorIdSet.value.has(colorId)
    )
    const result = await markEurekaColorsOwned(newColorIds, true)

    return {
      found: resolved.found,
      invalid: resolved.invalid,
      imported: result.changed,
    }
  }

  const isItemOwned = (itemId: number) => ownedItemIdSet.value.has(itemId)
  const isMakeupOwned = (makeupId: number) =>
    ownedMakeupIdSet.value.has(makeupId)
  const isMomoOwned = (momoId: number) => ownedMomoIdSet.value.has(momoId)
  const isPropOwned = (propId: number) => ownedPropIdSet.value.has(propId)
  const isEurekaColorOwned = (colorId: number) =>
    ownedEurekaColorIdSet.value.has(colorId)

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
      'props',
    ])

    const index = catalogIndex.index.value
    if (!index) {
      throw new Error('Catalog index is not ready')
    }

    const inferred = inferWardrobeIdsFromTracker({
      processedBanners,
      evoData: trackerData.evo,
      catalogIndex: index,
      propEntries: catalogIndex.props.value,
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
    const availablePropIds = inferred.propIds
    const totalFound =
      availableItemIds.length +
      availableMakeupIds.length +
      availableMomoIds.length +
      availablePropIds.length
    const itemIds = availableItemIds.filter(
      (itemId) => !ownedItemIdSet.value.has(itemId)
    )
    const makeupIds = availableMakeupIds.filter(
      (makeupId) => !ownedMakeupIdSet.value.has(makeupId)
    )
    const momoIds = availableMomoIds.filter(
      (momoId) => !ownedMomoIdSet.value.has(momoId)
    )
    const propIds = availablePropIds.filter(
      (propId) => !ownedPropIdSet.value.has(propId)
    )

    return {
      itemIds,
      makeupIds,
      momoIds,
      propIds,
      found: totalFound,
      imported:
        itemIds.length + makeupIds.length + momoIds.length + propIds.length,
      foundItems: availableItemIds.length,
      foundMakeups: availableMakeupIds.length,
      foundMomo: availableMomoIds.length,
      foundProps: availablePropIds.length,
      importedItems: itemIds.length,
      importedMakeups: makeupIds.length,
      importedMomo: momoIds.length,
      importedProps: propIds.length,
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
      propIds: preview.propIds,
    })

    return {
      ...preview,
      imported: result.total,
      importedItems: result.items,
      importedMakeups: result.makeups,
      importedMomo: result.momo,
      importedProps: result.props,
    }
  }

  return {
    data: readonly(data),
    ownedItemIds,
    ownedMakeupIds,
    ownedMomoIds,
    ownedPropIds,
    ownedEurekaColorIds,
    ownedItemIdSet,
    ownedMakeupIdSet,
    ownedMomoIdSet,
    ownedPropIdSet,
    ownedEurekaColorIdSet,
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
    isPropOwned,
    isEurekaColorOwned,
    getOutfitProgress,
    getFullMakeupProgress,
    toggleItemOwned,
    toggleMakeupOwned,
    toggleMomoOwned,
    togglePropOwned,
    markItemsOwned,
    markOutfitOwned,
    markMakeupsOwned,
    markMomoOwned,
    markPropsOwned,
    markEurekaColorsOwned,
    toggleEurekaColorOwned,
    markWardrobeIdsOwned,
    importOwnedItemsFromPearpal,
    importCompletedOutfitsFromPearpal,
    importOwnedEurekasFromPearpal,
    getTrackerWardrobeImportPreview,
    importOwnedItemsFromTracker,
  }
}
