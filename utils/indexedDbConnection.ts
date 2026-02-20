import { openDB, type IDBPDatabase, type OpenDBCallbacks } from 'idb'
import { toErrorMessage } from '~/utils/errors'

type IndexedDBConnectionOptions = {
  dbName: string
  dbVersion: number
  connectionLabel: string
  healthCheckStoreNames?: string[]
  retryIntervalMs?: number
  maxRetries?: number
  openDBCallbacks: OpenDBCallbacks<unknown>
}

const DEFAULT_RETRY_INTERVAL_MS = 300
const DEFAULT_MAX_RETRIES = 2

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

export function createIndexedDBConnection({
  dbName,
  dbVersion,
  connectionLabel,
  healthCheckStoreNames = [],
  retryIntervalMs = DEFAULT_RETRY_INTERVAL_MS,
  maxRetries = DEFAULT_MAX_RETRIES,
  openDBCallbacks,
}: IndexedDBConnectionOptions) {
  let dbPromise: Promise<IDBPDatabase> | null = null

  const resetDatabase = async () => {
    const pending = dbPromise
    dbPromise = null
    if (!pending) return

    try {
      const db = await pending
      db.close()
    } catch {
      // Ignore close failures during reset.
    }
  }

  const getDB = async (): Promise<IDBPDatabase> => {
    if (!dbPromise) {
      const { blocking, terminated, ...callbacks } = openDBCallbacks
      dbPromise = openDB(dbName, dbVersion, {
        ...callbacks,
        blocking(...args) {
          blocking?.(...args)
          void resetDatabase()
        },
        terminated() {
          terminated?.()
          dbPromise = null
        },
      })
    }

    const db = await dbPromise
    const availableStoreNames = healthCheckStoreNames.filter((storeName) =>
      db.objectStoreNames.contains(storeName)
    )
    if (availableStoreNames.length > 0) {
      const tx = db.transaction(availableStoreNames, 'readonly')
      await tx.done
    }
    return db
  }

  const runWithRecovery = async <T>(
    operationName: string,
    operation: (db: IDBPDatabase) => Promise<T>,
    retries = 0
  ): Promise<T> => {
    try {
      const db = await getDB()
      return await operation(db)
    } catch (error) {
      if (retries >= maxRetries) {
        throw error
      }

      const attempt = retries + 1
      const totalAttempts = maxRetries + 1
      const message = toErrorMessage(
        error,
        `Failed to execute ${connectionLabel} IndexedDB operation`
      )
      console.warn(
        `${connectionLabel} IndexedDB operation "${operationName}" failed (attempt ${attempt}/${totalAttempts}): ${message}`
      )

      await resetDatabase()
      await sleep(retryIntervalMs)
      return runWithRecovery(operationName, operation, retries + 1)
    }
  }

  return {
    getDB,
    runWithRecovery,
    resetDatabase,
  }
}
