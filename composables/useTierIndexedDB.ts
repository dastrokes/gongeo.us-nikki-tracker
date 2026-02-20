import type { IDBPDatabase } from 'idb'
import { createIndexedDBConnection } from '~/utils/indexedDbConnection'

type TierKey = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'

export type TierlistTiers = Record<TierKey, string[]>
export type TierlistLabels = Record<TierKey, string>

export type TierlistPayload = {
  tiers: TierlistTiers
  labels?: TierlistLabels
  lastSubmittedAt?: number | null
  lastModifiedAt?: number | null
}

export type TierlistRecord = {
  contextKey: string
  tiers: TierlistTiers
  labels?: TierlistLabels
  lastSubmittedAt?: number | null
  lastModifiedAt?: number | null
  at: number
}

const DB_NAME = 'tierlistDB'
const DB_VERSION = 1
const STORE_NAME = 'tierlists'
const INDEX_AT = 'byAt'
const MAX_TIERLISTS = 30

export function useTierIndexedDB() {
  const { runWithRecovery } = createIndexedDBConnection({
    dbName: DB_NAME,
    dbVersion: DB_VERSION,
    connectionLabel: 'Tierlist',
    healthCheckStoreNames: [STORE_NAME],
    retryIntervalMs: 300,
    maxRetries: 2,
    openDBCallbacks: {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'contextKey',
          })
          store.createIndex(INDEX_AT, 'at')
        }
      },
    },
  })

  const cleanupTierlistsWithDB = async (
    db: IDBPDatabase,
    maxCount = MAX_TIERLISTS,
    keepContextKey?: string
  ) => {
    const limit = Math.max(1, maxCount)
    const records = (await db.getAllFromIndex(
      STORE_NAME,
      INDEX_AT
    )) as TierlistRecord[]

    let overLimit = records.length - limit
    if (overLimit <= 0) return

    for (const record of records) {
      if (overLimit <= 0) break
      if (record.contextKey === keepContextKey) continue
      await db.delete(STORE_NAME, record.contextKey)
      overLimit -= 1
    }
  }

  const cleanupTierlists = async (
    maxCount = MAX_TIERLISTS,
    keepContextKey?: string
  ) =>
    runWithRecovery('cleanupTierlists', (db) =>
      cleanupTierlistsWithDB(db, maxCount, keepContextKey)
    )

  const saveTierlist = async (
    contextKey: string,
    tierlistPayload: TierlistPayload,
    maxCount = MAX_TIERLISTS
  ) => {
    await runWithRecovery('saveTierlist', async (db) => {
      const now = Date.now()

      const payload: TierlistRecord = {
        contextKey,
        tiers: tierlistPayload.tiers,
        labels: tierlistPayload.labels,
        lastSubmittedAt: tierlistPayload.lastSubmittedAt ?? null,
        lastModifiedAt: tierlistPayload.lastModifiedAt ?? null,
        at: now,
      }

      await db.put(STORE_NAME, payload)
      await cleanupTierlistsWithDB(db, maxCount, contextKey)
    })
  }

  const loadTierlist = async (
    contextKey: string
  ): Promise<TierlistRecord | null> => {
    return runWithRecovery('loadTierlist', async (db) => {
      const record = (await db.get(STORE_NAME, contextKey)) as
        | TierlistRecord
        | undefined

      if (!record) return null

      const touched: TierlistRecord = {
        ...record,
        at: Date.now(),
      }

      await db.put(STORE_NAME, touched)
      return touched
    })
  }

  const listTierlists = async (): Promise<TierlistRecord[]> => {
    return runWithRecovery('listTierlists', async (db) => {
      const records = (await db.getAllFromIndex(
        STORE_NAME,
        INDEX_AT
      )) as TierlistRecord[]
      return records.reverse()
    })
  }

  const deleteTierlist = async (contextKey: string) => {
    await runWithRecovery('deleteTierlist', (db) =>
      db.delete(STORE_NAME, contextKey)
    )
  }

  const clearAllTierlists = async () => {
    await runWithRecovery('clearAllTierlists', (db) => db.clear(STORE_NAME))
  }

  return {
    cleanupTierlists,
    saveTierlist,
    loadTierlist,
    listTierlists,
    deleteTierlist,
    clearAllTierlists,
    maxTierlists: MAX_TIERLISTS,
  }
}
