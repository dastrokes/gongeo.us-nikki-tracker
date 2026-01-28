import { getStore } from '@netlify/blobs'

const STORE_NAME = 'site-config'
const KEY_NAME = 'import-maintenance'

const parseMaintenanceValue = (value: string | null): boolean =>
  value?.trim().toLowerCase() === 'true'

export default defineEventHandler(async () => {
  try {
    const store = getStore(STORE_NAME)
    const value = await store.get(KEY_NAME, { type: 'text' })
    return { isMaintenance: parseMaintenanceValue(value) }
  } catch (error) {
    console.warn('Maintenance blob unavailable, defaulting to false', error)
    return { isMaintenance: false }
  }
})
