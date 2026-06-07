export const useEntityDetailRoute = (entity: EntitySlugType) => {
  const route = useRoute()
  const localePath = useLocalePath()
  const runtimeConfig = useRuntimeConfig()

  const entityId = computed(() => resolveEntityRouteId(entity, route.params.id))
  const canonicalPath = computed(() =>
    Number.isFinite(entityId.value)
      ? localePath(getEntityDetailPath(entity, entityId.value))
      : ''
  )
  const canonicalUrl = computed(() => {
    const siteUrl = String(runtimeConfig.public.siteUrl || '').replace(
      /\/$/,
      ''
    )

    return siteUrl && canonicalPath.value
      ? `${siteUrl}${canonicalPath.value}`
      : undefined
  })
  const routeParam = computed(() =>
    Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  )
  const shouldRedirectToSlug = computed(
    () =>
      Number.isFinite(entityId.value) &&
      String(routeParam.value ?? '') !== getEntitySlug(entity, entityId.value)
  )

  const redirectToCanonicalSlug = () => {
    if (!shouldRedirectToSlug.value || !canonicalPath.value) return

    return navigateTo(canonicalPath.value, {
      redirectCode: 301,
      replace: true,
    })
  }

  return {
    entityId,
    canonicalPath,
    canonicalUrl,
    redirectToCanonicalSlug,
  }
}
