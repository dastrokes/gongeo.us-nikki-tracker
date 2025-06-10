import type { PullRecord, EditRecord } from '~/types/pull'
import { ref, computed } from 'vue'
import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'gongeousDB'
const DB_VERSION = 2
const PULLS_STORE = 'pullsByBanner'
const EDITS_STORE = 'editsByBanner'

export function useIndexedDB() {
  const pullsData = ref<Record<number, PullRecord[]>>({})
  const editsData = ref<Record<number, EditRecord[]>>({})
  const isSaving = ref(false)

  let dbPromise: Promise<IDBPDatabase> | null = null
  let lastSavePromise: Promise<void> | null = null
  const DB_RETRY_INTERVAL_MS = 1000
  const MAX_RETRIES = 3

  const getDB = async (retries = 0) => {
    if (!dbPromise) {
      dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(PULLS_STORE)) {
            db.createObjectStore(PULLS_STORE)
          }

          if (!db.objectStoreNames.contains(EDITS_STORE)) {
            db.createObjectStore(EDITS_STORE)
          }
        },
      })
    }

    const db = await dbPromise

    try {
      // Transaction covering both stores
      const storeNames = [PULLS_STORE, EDITS_STORE].filter((name) =>
        db.objectStoreNames.contains(name)
      )
      const tx = db.transaction(storeNames, 'readonly')

      // Minimal read ops on both stores
      const ops = storeNames.map((name) => tx.objectStore(name).getAll())
      await Promise.all(ops)

      await tx.done
      return db
    } catch {
      console.warn(`DB is unavailable, retry connection.`)

      if (retries >= MAX_RETRIES) {
        throw new Error('DB failed to connect after multiple retries.')
      }

      dbPromise = null
      await new Promise((resolve) => setTimeout(resolve, DB_RETRY_INTERVAL_MS))

      return getDB(retries + 1)
    }
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

      const existingNewest = existingPulls[0][0] // first = newest
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

  const saveData = async (
    pullsByBanner: Record<number, PullRecord[]>,
    editsByBanner: Record<number, EditRecord[]>
  ) => {
    // Update reactive state immediately
    pullsData.value = pullsByBanner
    editsData.value = editsByBanner
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

          // Check if pull data already exists
          const existingData = await db.get(PULLS_STORE, PULLS_STORE)

          // Create a clean copy of the pull data
          const cleanPullData = JSON.parse(JSON.stringify(pullsByBanner))

          // If data exists, merge with existing data
          if (existingData) {
            // Merge the data, new data takes precedence
            const mergedData = { ...existingData, ...cleanPullData }
            await db.put(PULLS_STORE, mergedData, PULLS_STORE)
          } else {
            // If no existing data, just save the new data
            await db.put(PULLS_STORE, cleanPullData, PULLS_STORE)
          }

          // Save edit data
          await db.put(EDITS_STORE, editsByBanner, EDITS_STORE)
        } finally {
          isSaving.value = false
        }
      })()

      // Return the promise but don't wait for it
      return lastSavePromise
    } catch (error) {
      console.error('Failed to save data:', error)
      isSaving.value = false
      throw error
    }
  }

  const loadData = async (): Promise<{
    pulls: Record<number, PullRecord[]>
    edits: Record<number, EditRecord[]>
  }> => {
    try {
      // Wait for any pending save to complete before loading
      if (lastSavePromise) {
        await lastSavePromise
      }

      const db = await getDB()
      const pullsResult = await db.get(PULLS_STORE, PULLS_STORE)
      const editsResult = await db.get(EDITS_STORE, EDITS_STORE)

      pullsData.value = pullsResult
      editsData.value = editsResult

      return {
        pulls: pullsResult || {},
        edits: editsResult || {},
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
      await db.clear(PULLS_STORE)
      await db.clear(EDITS_STORE)

      pullsData.value = {}
      editsData.value = {}
    } catch (error) {
      console.error('Failed to clear data:', error)
      throw error
    }
  }

  return {
    pullsData,
    editsData,
    isSaving,
    saveData,
    loadData,
    clearData,
    mergePullData,
  }
}
