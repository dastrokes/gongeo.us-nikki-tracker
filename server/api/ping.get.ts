import { applyNoStoreHeaders } from '~/utils/cacheHeaders'

export default defineEventHandler((event) => {
  applyNoStoreHeaders(event)
  return { status: 'ok' }
})
