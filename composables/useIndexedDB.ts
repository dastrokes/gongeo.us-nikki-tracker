import type {
  PullRecord,
  EditRecord,
  EvoRecord,
  PearpalTrackerItem,
} from '~/types/pull'
import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'gongeousDB'
const DB_VERSION = 4
const PULLS_STORE = 'pullsByBanner'
const EDITS_STORE = 'editsByBanner'
const EVO_STORE = 'evoByBanner'
const PEARPAL_STORE = 'pearpalByBanner'

export function useIndexedDB() {
  const pullsData = ref<Record<number, PullRecord[]>>({})
  const editsData = ref<Record<number, EditRecord[]>>({})
  const evoData = ref<Record<number, EvoRecord[]>>({})
  const isSaving = ref(false)
  const { activeSlot } = useProfileSlots()

  let dbPromise: Promise<IDBPDatabase> | null = null
  let lastSavePromise: Promise<void> | null = null
  const DB_RETRY_INTERVAL_MS = 1000
  const MAX_RETRIES = 3

  const getDB = async (retries = 0): Promise<IDBPDatabase> => {
    if (!dbPromise) {
      dbPromise = openDB(DB_NAME, DB_VERSION, {
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
        },
      })
    }

    try {
      const db = await dbPromise

      // Test connection with minimal transaction
      const storeNames = [
        PULLS_STORE,
        EDITS_STORE,
        EVO_STORE,
        PEARPAL_STORE,
      ].filter((name) => db.objectStoreNames.contains(name))

      if (storeNames.length > 0) {
        const tx = db.transaction(storeNames, 'readonly')
        await tx.done
      }

      return db
    } catch (error) {
      console.warn(
        `DB connection failed (attempt ${retries + 1}/${MAX_RETRIES}):`,
        error
      )

      // Clear failed promise to allow retry
      dbPromise = null

      if (retries >= MAX_RETRIES) {
        throw new Error('DB failed to connect after multiple retries.')
      }

      await new Promise((resolve) => setTimeout(resolve, DB_RETRY_INTERVAL_MS))
      return getDB(retries + 1)
    }
  }

  const resolveSlotKey = (storeName: string, slotOverride?: number): string => {
    const slot = slotOverride ?? activeSlot.value ?? 1
    if (slot === 1) return storeName
    return `${storeName}_${slot}`
  }

  const checkActiveSlot = (slotOverride?: number): boolean => {
    if (slotOverride === undefined || slotOverride === null) return true
    return slotOverride === activeSlot.value
  }

  const mergePullData = (
    existingData: Record<number, PullRecord[]>,
    newData: Record<number, PullRecord[]>
  ): Record<number, PullRecord[]> => {
    const mergedData: Record<number, PullRecord[]> = { ...existingData }

    Object.entries(newData).forEach(([bannerIdStr, newPulls]) => {
      const bannerId = Number(bannerIdStr)
      const existingPulls = mergedData[bannerId] ?? []

      if (existingPulls.length === 0) {
        mergedData[bannerId] = [...newPulls]
        return
      }

      const existingNewest = existingPulls[0]![0] // first = newest
      const existingOldest = existingPulls.at(-1)![0] // last = oldest

      const existingTimestamps = new Set(existingPulls.map(([ts]) => ts))

      const toPrepend: PullRecord[] = []
      const toAppend: PullRecord[] = []

      for (const [timestamp, itemId] of newPulls) {
        if (existingTimestamps.has(timestamp)) continue

        if (timestamp > existingNewest) {
          toPrepend.push([timestamp, itemId])
        } else if (timestamp < existingOldest) {
          toAppend.push([timestamp, itemId])
        } else {
          continue
        }
      }

      mergedData[bannerId] = [...toPrepend, ...existingPulls, ...toAppend]
    })

    return mergedData
  }

  const mergeEditData = (
    existingEdits: Record<number, EditRecord[]>,
    newEdits: Record<number, EditRecord[]>
  ): Record<number, EditRecord[]> => {
    const mergedEdits: Record<number, EditRecord[]> = { ...existingEdits }

    // Process each banner separately to reduce lookup map size
    Object.entries(newEdits).forEach(([bannerIdStr, newEditRecords]) => {
      const bannerId = parseInt(bannerIdStr)
      const existingRecords = mergedEdits[bannerId] || []

      // Create a map of existing edits by itemId for this banner only
      const existingEditMap = new Map<string, EditRecord>()
      existingRecords.forEach((edit) => {
        existingEditMap.set(edit[1], edit)
      })

      // Process new edits for this banner
      newEditRecords.forEach((newEdit) => {
        const existingEdit = existingEditMap.get(newEdit[1])

        if (!existingEdit) {
          // New edit doesn't exist, add it
          existingRecords.push(newEdit)
        }
        // If existing edit exists, keep the existing one (existing data takes priority)
      })

      mergedEdits[bannerId] = existingRecords
    })

    return mergedEdits
  }

  const saveData = async (
    pullsByBanner: Record<number, PullRecord[]>,
    editsByBanner: Record<number, EditRecord[]>,
    evoByBanner: Record<number, EvoRecord[]> = {},
    slotOverride?: number
  ) => {
    const isActiveSlot = checkActiveSlot(slotOverride)

    // Update reactive state immediately for active slot saves only
    if (isActiveSlot) {
      pullsData.value = pullsByBanner
      editsData.value = editsByBanner
      evoData.value = evoByBanner
      isSaving.value = true
    }

    try {
      // Wait for any previous save to complete
      if (lastSavePromise) {
        await lastSavePromise
      }

      // Create new save promise
      lastSavePromise = (async () => {
        try {
          const db = await getDB()

          // Check if pull data already exists
          const pullsKey = resolveSlotKey(PULLS_STORE, slotOverride)
          const editsKey = resolveSlotKey(EDITS_STORE, slotOverride)
          const evoKey = resolveSlotKey(EVO_STORE, slotOverride)

          const existingData = await db.get(PULLS_STORE, pullsKey)

          // Create a clean copy of the pull data
          const cleanPullData = JSON.parse(JSON.stringify(pullsByBanner))

          // If data exists, merge with existing data
          if (existingData) {
            // Merge the data, new data takes precedence
            const mergedData = { ...existingData, ...cleanPullData }
            await db.put(PULLS_STORE, mergedData, pullsKey)
          } else {
            // If no existing data, just save the new data
            await db.put(PULLS_STORE, cleanPullData, pullsKey)
          }

          // Save edit data
          await db.put(EDITS_STORE, editsByBanner, editsKey)

          // Save evolution data
          await db.put(EVO_STORE, evoByBanner, evoKey)
        } finally {
          if (isActiveSlot) {
            isSaving.value = false
          }
        }
      })()

      // Return the promise but don't wait for it
      return lastSavePromise
    } catch (error) {
      console.error('Failed to save data:', error)
      if (isActiveSlot) {
        isSaving.value = false
      }
      throw error
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
      // Wait for any pending save to complete before loading
      if (lastSavePromise) {
        await lastSavePromise
      }

      const db = await getDB()
      const pullsKey = resolveSlotKey(PULLS_STORE, slotOverride)
      const editsKey = resolveSlotKey(EDITS_STORE, slotOverride)
      const evoKey = resolveSlotKey(EVO_STORE, slotOverride)
      const pearpalKey = resolveSlotKey(PEARPAL_STORE, slotOverride)

      const pullsResult = await db.get(PULLS_STORE, pullsKey)
      const editsResult = await db.get(EDITS_STORE, editsKey)
      const evoResult = await db.get(EVO_STORE, evoKey)
      const pearpalResult = await db.get(PEARPAL_STORE, pearpalKey)

      if (checkActiveSlot(slotOverride)) {
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
      // Wait for any pending save to complete before clearing
      if (lastSavePromise) {
        await lastSavePromise
      }

      const db = await getDB()
      const pullsKey = resolveSlotKey(PULLS_STORE)
      const editsKey = resolveSlotKey(EDITS_STORE)
      const evoKey = resolveSlotKey(EVO_STORE)
      const pearpalKey = resolveSlotKey(PEARPAL_STORE)

      await db.delete(PULLS_STORE, pullsKey)
      await db.delete(EDITS_STORE, editsKey)
      await db.delete(EVO_STORE, evoKey)
      await db.delete(PEARPAL_STORE, pearpalKey)

      pullsData.value = {}
      editsData.value = {}
      evoData.value = {}
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
      const db = await getDB()

      // Test JSON serialization first
      try {
        const jsonString = JSON.stringify(data)
        const cleanData = JSON.parse(jsonString)

        // Merge with existing data if present
        const pearpalKey = resolveSlotKey(PEARPAL_STORE, slotOverride)
        const existingData = await db.get(PEARPAL_STORE, pearpalKey)
        let mergedData = cleanData
        if (existingData) {
          mergedData = { ...existingData, ...cleanData }
        }
        // Save merged Pearpal data per banner
        await db.put(PEARPAL_STORE, mergedData, pearpalKey)
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
      if (lastSavePromise) {
        await lastSavePromise
      }

      const db = await getDB()
      const pullsKey = resolveSlotKey(PULLS_STORE, slot)
      const editsKey = resolveSlotKey(EDITS_STORE, slot)
      const evoKey = resolveSlotKey(EVO_STORE, slot)
      const pearpalKey = resolveSlotKey(PEARPAL_STORE, slot)

      await db.delete(PULLS_STORE, pullsKey)
      await db.delete(EDITS_STORE, editsKey)
      await db.delete(EVO_STORE, evoKey)
      await db.delete(PEARPAL_STORE, pearpalKey)

      if (slot === activeSlot.value) {
        pullsData.value = {}
        editsData.value = {}
        evoData.value = {}
      }
    } catch (error) {
      console.error('Failed to clear slot data:', error)
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
  }
}
