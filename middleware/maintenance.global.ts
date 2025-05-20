export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig()
  const isMaintenanceMode = config.public.maintenance
  // Allow the maintenance page itself to be accessed
  if (isMaintenanceMode && to.path !== '/maintenance') {
    return navigateTo('/maintenance')
  }
})
