import type { PullRecord } from '~/types/pull'
import { ref, computed } from 'vue'
import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'nikkiResonanceDB'
const DB_VERSION = 1
const STORE_NAME = 'pullsByBanner'

export function useIndexedDB() {
  const isFinished = ref(false)
  const data = ref<Record<number, PullRecord[]>>({})
  const isSaving = ref(false)

  let dbPromise: Promise<IDBPDatabase> | null = null
  let lastSavePromise: Promise<void> | null = null

  const hasData = computed(() => data.value && Object.keys(data.value).length > 0)

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
          await db.put(STORE_NAME, pullsByBanner, STORE_NAME)
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

  const loadPullData = async (): Promise<Record<number, PullRecord[]> | null> => {
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
    clearPullData
  }
} 