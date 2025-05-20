import { defineEventHandler, sendRedirect, getRequestURL } from 'h3'

export default defineEventHandler((event) => {
  const isMaintenanceMode = useRuntimeConfig().public.maintenance === 'true'

  // Allow API requests and the maintenance page itself to go through
  const url = getRequestURL(event).pathname
  const isApi = url.startsWith('/api')
  const isMaintenancePage = url === '/maintenance'

  if (isMaintenanceMode && !isApi && !isMaintenancePage) {
    return sendRedirect(event, '/maintenance', 302)
  }
})
