export type EntitySlugData = readonly (readonly [number, string])[]

export const createEntitySlugHelpers = (
  routePrefix: string,
  data: EntitySlugData
) => {
  let byId: ReadonlyMap<string, string> | null = null
  let bySlug: ReadonlyMap<string, string> | null = null

  const ensureIndexes = () => {
    if (byId && bySlug) return

    const nextById = new Map<string, string>()
    const nextBySlug = new Map<string, string>()
    data.forEach(([id, slug]) => {
      nextById.set(String(id), slug)
      nextBySlug.set(slug, String(id))
    })
    byId = nextById
    bySlug = nextBySlug
  }

  const getSlug = (id: number | string) => {
    ensureIndexes()
    const normalizedId = String(id)
    return byId!.get(normalizedId) ?? normalizedId
  }

  return {
    getIds: () => data.map(([id]) => String(id)),
    getSlug,
    getDetailPath: (id: number | string) => `/${routePrefix}/${getSlug(id)}`,
    resolveRouteId: (routeParam: unknown) => {
      const rawParam = Array.isArray(routeParam) ? routeParam[0] : routeParam
      const value = String(rawParam ?? '').trim()
      if (!value) return NaN
      if (/^\d+$/.test(value)) return Number(value)

      ensureIndexes()
      const id = bySlug!.get(value)
      return id ? Number(id) : NaN
    },
  }
}
