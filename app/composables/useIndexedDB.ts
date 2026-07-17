const DB_NAME = 'gongeousDB'
const DB_VERSION = 5
const PULLS_STORE = 'pullsByBanner'
const EDITS_STORE = 'editsByBanner'
const EVO_STORE = 'evoByBanner'
const PEARPAL_STORE = 'pearpalByBanner'
const WARDROBE_STORE = 'wardrobeByProfile'

const { runWithRecovery } = createIndexedDBConnection({
  dbName: DB_NAME,
  dbVersion: DB_VERSION,
  connectionLabel: 'Tracker',
  healthCheckStoreNames: [
    PULLS_STORE,
    EDITS_STORE,
    EVO_STORE,
    PEARPAL_STORE,
    WARDROBE_STORE,
  ],
  retryIntervalMs: 1000,
  maxRetries: 3,
  openDBCallbacks: {
    upgrade(db) {
      if (!db.objectStoreNames.contains(PULLS_STORE)) {
        db.createObjectStore(PULLS_STORE)
      }

      if (!db.objectStoreNames.contains(EDITS_STORE)) {
        db.createObjectStore(EDITS_STORE)
      }

      if (!db.objectStoreNames.contains(EVO_STORE)) {
        db.createObjectStore(EVO_STORE)
      }

      if (!db.objectStoreNames.contains(PEARPAL_STORE)) {
        db.createObjectStore(PEARPAL_STORE)
      }

      if (!db.objectStoreNames.contains(WARDROBE_STORE)) {
        db.createObjectStore(WARDROBE_STORE)
      }
    },
  },
})
const runQueuedIndexedDBOperation = createIndexedDBOperationQueue()

export function useIndexedDB() {
  const pullsData = ref<Record<number, PullRecord[]>>({})
  const editsData = ref<Record<number, EditRecord[]>>({})
  const evoData = ref<Record<number, EvoRecord[]>>({})
  const isSaving = ref(false)
  const { activeSlot } = useProfileSlots()

  const resolveSlot = (slotOverride?: number) =>
    slotOverride ?? activeSlot.value ?? 1

  const resolveSlotKey = (storeName: string, slot: number): string => {
    if (slot === 1) return storeName
    return `${storeName}_${slot}`
  }

  const checkActiveSlot = (slot: number): boolean => slot === activeSlot.value

  const saveData = async (
    pullsByBanner: Record<number, PullRecord[]>,
    editsByBanner: Record<number, EditRecord[]>,
    evoByBanner: Record<number, EvoRecord[]> = {},
    slotOverride?: number
  ) => {
    const slot = resolveSlot(slotOverride)
    const isActiveSlot = checkActiveSlot(slot)

    // Update reactive state immediately for active slot saves only
    if (isActiveSlot) {
      pullsData.value = pullsByBanner
      editsData.value = editsByBanner
      evoData.value = evoByBanner
      isSaving.value = true
    }

    try {
      await runQueuedIndexedDBOperation(async () => {
        const pullsKey = resolveSlotKey(PULLS_STORE, slot)
        const editsKey = resolveSlotKey(EDITS_STORE, slot)
        const evoKey = resolveSlotKey(EVO_STORE, slot)
        await runWithRecovery('saveData', async (db) => {
          const existingData = await db.get(PULLS_STORE, pullsKey)
          const cleanPullData = JSON.parse(JSON.stringify(pullsByBanner))
          const mergedData = existingData
            ? { ...existingData, ...cleanPullData }
            : cleanPullData

          await db.put(PULLS_STORE, mergedData, pullsKey)
          await db.put(EDITS_STORE, editsByBanner, editsKey)
          await db.put(EVO_STORE, evoByBanner, evoKey)
        })
      })
    } catch (error) {
      console.error('Failed to save data:', error)
      throw error
    } finally {
      if (isActiveSlot) {
        isSaving.value = false
      }
    }
  }

  const loadData = async (
    slotOverride?: number
  ): Promise<{
    pulls: Record<number, PullRecord[]>
    edits: Record<number, EditRecord[]>
    evo: Record<number, EvoRecord[]>
    pearpal: Record<number, PearpalTrackerItem[]>
  }> => {
    try {
      const slot = resolveSlot(slotOverride)
      const pullsKey = resolveSlotKey(PULLS_STORE, slot)
      const editsKey = resolveSlotKey(EDITS_STORE, slot)
      const evoKey = resolveSlotKey(EVO_STORE, slot)
      const pearpalKey = resolveSlotKey(PEARPAL_STORE, slot)

      const { pullsResult, editsResult, evoResult, pearpalResult } =
        await runQueuedIndexedDBOperation(() =>
          runWithRecovery('loadData', async (db) => {
            const pullsResult = await db.get(PULLS_STORE, pullsKey)
            const editsResult = await db.get(EDITS_STORE, editsKey)
            const evoResult = await db.get(EVO_STORE, evoKey)
            const pearpalResult = await db.get(PEARPAL_STORE, pearpalKey)
            return {
              pullsResult,
              editsResult,
              evoResult,
              pearpalResult,
            }
          })
        )

      if (checkActiveSlot(slot)) {
        pullsData.value = pullsResult
        editsData.value = editsResult
        evoData.value = evoResult
      }

      return {
        pulls: pullsResult || {},
        edits: editsResult || {},
        evo: evoResult || {},
        pearpal: pearpalResult || {},
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      throw error
    }
  }

  const clearData = async () => {
    try {
      const slot = resolveSlot()
      const pullsKey = resolveSlotKey(PULLS_STORE, slot)
      const editsKey = resolveSlotKey(EDITS_STORE, slot)
      const evoKey = resolveSlotKey(EVO_STORE, slot)
      const pearpalKey = resolveSlotKey(PEARPAL_STORE, slot)
      const wardrobeKey = resolveSlotKey(WARDROBE_STORE, slot)

      await runQueuedIndexedDBOperation(() =>
        runWithRecovery('clearData', async (db) => {
          await db.delete(PULLS_STORE, pullsKey)
          await db.delete(EDITS_STORE, editsKey)
          await db.delete(EVO_STORE, evoKey)
          await db.delete(PEARPAL_STORE, pearpalKey)
          await db.delete(WARDROBE_STORE, wardrobeKey)
        })
      )

      if (checkActiveSlot(slot)) {
        pullsData.value = {}
        editsData.value = {}
        evoData.value = {}
        await useWardrobe().init({ force: true })
      }
    } catch (error) {
      console.error('Failed to clear data:', error)
      throw error
    }
  }

  const savePearpalData = async (
    data: Record<number, PearpalTrackerItem[]>,
    slotOverride?: number
  ) => {
    try {
      // Test JSON serialization first
      try {
        const jsonString = JSON.stringify(data)
        const cleanData = JSON.parse(jsonString)

        const slot = resolveSlot(slotOverride)
        const pearpalKey = resolveSlotKey(PEARPAL_STORE, slot)
        await runQueuedIndexedDBOperation(() =>
          runWithRecovery('savePearpalData', async (db) => {
            const existingData = await db.get(PEARPAL_STORE, pearpalKey)
            const mergedData = existingData
              ? { ...existingData, ...cleanData }
              : cleanData

            await db.put(PEARPAL_STORE, mergedData, pearpalKey)
          })
        )
      } catch (jsonError) {
        console.error('JSON serialization failed:', jsonError)
        throw jsonError
      }
    } catch (error) {
      console.error('Failed to save raw pearpal tracker data:', error)
      throw error
    }
  }

  const clearSlotData = async (slot: number) => {
    try {
      const pullsKey = resolveSlotKey(PULLS_STORE, slot)
      const editsKey = resolveSlotKey(EDITS_STORE, slot)
      const evoKey = resolveSlotKey(EVO_STORE, slot)
      const pearpalKey = resolveSlotKey(PEARPAL_STORE, slot)
      const wardrobeKey = resolveSlotKey(WARDROBE_STORE, slot)

      await runQueuedIndexedDBOperation(() =>
        runWithRecovery('clearSlotData', async (db) => {
          await db.delete(PULLS_STORE, pullsKey)
          await db.delete(EDITS_STORE, editsKey)
          await db.delete(EVO_STORE, evoKey)
          await db.delete(PEARPAL_STORE, pearpalKey)
          await db.delete(WARDROBE_STORE, wardrobeKey)
        })
      )

      if (slot === activeSlot.value) {
        pullsData.value = {}
        editsData.value = {}
        evoData.value = {}
        await useWardrobe().init({ force: true })
      }
    } catch (error) {
      console.error('Failed to clear slot data:', error)
      throw error
    }
  }

  const loadWardrobe = async (slotOverride?: number): Promise<WardrobeData> => {
    try {
      const slot = resolveSlot(slotOverride)
      const wardrobeKey = resolveSlotKey(WARDROBE_STORE, slot)

      const result = await runQueuedIndexedDBOperation(() =>
        runWithRecovery('loadWardrobe', async (db) => {
          return db.get(WARDROBE_STORE, wardrobeKey)
        })
      )

      return normalizeWardrobeData(result)
    } catch (error) {
      console.error('Failed to load wardrobe data:', error)
      throw error
    }
  }

  const saveWardrobe = async (data: WardrobeData, slotOverride?: number) => {
    try {
      const slot = resolveSlot(slotOverride)
      const wardrobeKey = resolveSlotKey(WARDROBE_STORE, slot)
      const cleanData = normalizeWardrobeData(data)

      await runQueuedIndexedDBOperation(() =>
        runWithRecovery('saveWardrobe', async (db) => {
          await db.put(WARDROBE_STORE, cleanData, wardrobeKey)
        })
      )
    } catch (error) {
      console.error('Failed to save wardrobe data:', error)
      throw error
    }
  }

  return {
    pullsData,
    editsData,
    evoData,
    isSaving,
    saveData,
    loadData,
    clearData,
    clearSlotData,
    mergePullData,
    mergeEditData,
    savePearpalData,
    loadWardrobe,
    saveWardrobe,
  }
}
