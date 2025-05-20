export default defineNuxtRouteMiddleware(() => {
  const isMaintenanceMode = process.env.MAINTENANCE === 'true'
  const route = useRoute()

  // Allow the maintenance page itself to be accessed
  if (isMaintenanceMode && route.path !== '/maintenance') {
    return navigateTo('/maintenance')
  }
})
