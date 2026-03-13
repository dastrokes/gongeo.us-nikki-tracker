export default defineEventHandler((event) => {
  applyNoStoreHeaders(event)
  return { status: 'ok' }
})
