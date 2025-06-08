import type { PullRecord } from '~/types/pull'
import { ref, computed } from 'vue'
import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'gongeousDB'
const DB_VERSION = 1
const STORE_NAME = 'pullsByBanner'

export function useIndexedDB() {
  const isFinished = ref(false)
  const data = ref<Record<number, PullRecord[]>>({})
  const isSaving = ref(false)

  let dbPromise: Promise<IDBPDatabase> | null = null
  let lastSavePromise: Promise<void> | null = null

  const hasData = computed(
    () => data.value && Object.keys(data.value).length > 0
  )

  const getDB = () => {
    if (!dbPromise) {
      dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME)
          }
        },
      })
    }
    return dbPromise
  }

  const mergePullData = (
    existingData: Record<number, PullRecord[]>,
    newData: Record<number, PullRecord[]>
  ): Record<number, PullRecord[]> => {
    const mergedData: Record<number, PullRecord[]> = { ...existingData }

    Object.entries(newData).forEach(([bannerIdStr, newPulls]) => {
      const bannerId = Number(bannerIdStr)
      const existingPulls = mergedData[bannerId] ?? []

      // Get manual entries from both data sets
      const existingManualEntries = existingPulls.filter(
        ([timestamp]) => timestamp === 'manual'
      )
      const newManualEntries = newPulls.filter(
        ([timestamp]) => timestamp === 'manual'
      )

      // Get non-manual entries from both data sets
      const existingNonManualEntries = existingPulls.filter(
        ([timestamp]) => timestamp !== 'manual'
      )
      const newNonManualEntries = newPulls.filter(
        ([timestamp]) => timestamp !== 'manual'
      )

      // If there are no existing non-manual entries
      if (existingNonManualEntries.length === 0) {
        mergedData[bannerId] = [
          ...newNonManualEntries,
          ...mergeManualEntries(existingManualEntries, newManualEntries),
        ]
        return
      }

      const existingNewest = existingNonManualEntries[0][0] // first = newest
      const existingOldest = existingNonManualEntries.at(-1)![0] // last = oldest

      const existingTimestamps = new Set(
        existingNonManualEntries.map(([ts]) => ts)
      )

      const toPrepend: PullRecord[] = []
      const toAppend: PullRecord[] = []

      // Process non-manual entries for merging
      for (const [timestamp, itemId] of newNonManualEntries) {
        if (existingTimestamps.has(timestamp)) continue

        if (timestamp > existingNewest) {
          toPrepend.push([timestamp, itemId])
        } else if (timestamp < existingOldest) {
          toAppend.push([timestamp, itemId])
        } else {
          continue
        }
      }

      // Merge non-manual entries with manual entries
      mergedData[bannerId] = [
        ...toPrepend,
        ...existingNonManualEntries,
        ...toAppend,
        ...mergeManualEntries(existingManualEntries, newManualEntries),
      ]
    })

    return mergedData
  }

  // Helper function to merge manual entries, prioritizing new entries
  const mergeManualEntries = (
    existingManual: PullRecord[],
    newManual: PullRecord[]
  ): PullRecord[] => {
    // If no new manual entries, return existing ones
    if (newManual.length === 0) return existingManual

    // If no existing manual entries, return new ones
    if (existingManual.length === 0) return newManual

    // Keep track of item IDs from new manual entries
    const newManualItemIds = new Set(newManual.map(([_, itemId]) => itemId))

    // Filter out existing manual entries that have been overridden by new ones
    const filteredExistingManual = existingManual.filter(
      ([_, itemId]) => !newManualItemIds.has(itemId)
    )

    // Combine filtered existing entries with all new entries
    return [...filteredExistingManual, ...newManual]
  }

  const savePullData = async (pullsByBanner: Record<number, PullRecord[]>) => {
    // Update reactive state immediately
    data.value = pullsByBanner
    isFinished.value = true
    isSaving.value = true

    try {
      // Wait for any previous save to complete
      if (lastSavePromise) {
        await lastSavePromise
      }

      // Create new save promise
      lastSavePromise = (async () => {
        try {
          const db = await getDB()
          // Check if data already exists
          const existingData = await db.get(STORE_NAME, STORE_NAME)

          // Create a clean copy of the data using JSON parse/stringify to remove any non-serializable content
          const cleanData = JSON.parse(JSON.stringify(pullsByBanner))

          // If data exists, merge with existing data
          if (existingData) {
            // Merge the data, new data takes precedence
            const mergedData = { ...existingData, ...cleanData }
            await db.put(STORE_NAME, mergedData, STORE_NAME)
          } else {
            // If no existing data, just save the new data
            await db.put(STORE_NAME, cleanData, STORE_NAME)
          }
        } finally {
          isSaving.value = false
        }
      })()

      // Return the promise but don't wait for it
      return lastSavePromise
    } catch (error) {
      console.error('Failed to save pull data:', error)
      isSaving.value = false
      throw error
    }
  }

  const loadPullData = async (): Promise<Record<
    number,
    PullRecord[]
  > | null> => {
    try {
      // Wait for any pending save to complete before loading
      if (lastSavePromise) {
        await lastSavePromise
      }

      const db = await getDB()
      const result = await db.get(STORE_NAME, STORE_NAME)
      data.value = result
      isFinished.value = true
      return result
    } catch (error) {
      console.error('Failed to load pull data:', error)
      throw error
    }
  }

  const clearPullData = async () => {
    try {
      // Wait for any pending save to complete before clearing
      if (lastSavePromise) {
        await lastSavePromise
      }

      const db = await getDB()
      await db.clear(STORE_NAME)
      data.value = {}
      isFinished.value = true
    } catch (error) {
      console.error('Failed to clear pull data:', error)
      throw error
    }
  }

  return {
    data,
    hasData,
    isFinished,
    isSaving,
    savePullData,
    loadPullData,
    clearPullData,
    mergePullData,
  }
}
