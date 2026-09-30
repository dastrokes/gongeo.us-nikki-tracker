export const createItemSlugOverrides = (
  data: EntitySlugData,
  getType: (id: number) => string
): EntitySlugData => {
  const groups = new Map<string, number[]>()
  for (const [id, slug] of data) {
    if (!slug.endsWith(`-${id}`)) continue
    const name = slug.slice(0, -String(id).length - 1)
    groups.set(name, [...(groups.get(name) ?? []), id])
  }

  const getRegion = (id: number) => {
    const global = isCatalogEntryAvailableInScope('item', id, 'global')
    const cn = isCatalogEntryAvailableInScope('item', id, 'cn')
    return global === cn ? '' : global ? 'global' : 'cn'
  }
  const getTypeSlug = (id: number) => {
    const type = getType(id)
    const singularTypes: Record<string, string> = {
      tops: 'top',
      chokers: 'choker',
      hairAccessories: 'hairAccessory',
    }
    return toSeoListSlug(singularTypes[type] ?? type)
  }

  const overrides: Array<readonly [number, string]> = []
  for (const [name, ids] of groups) {
    const types = ids.map(getTypeSlug)
    const regions = ids.map(getRegion)
    const uniqueTypes = new Set(types).size === ids.length
    const uniqueRegions =
      regions.every(Boolean) && new Set(regions).size === ids.length
    ids.forEach((id, index) => {
      const suffix = uniqueTypes
        ? types[index]
        : uniqueRegions
          ? regions[index]
          : [types[index], regions[index]].filter(Boolean).join('-')
      overrides.push([id, `${name}-${suffix}`])
    })
  }

  const byId = new Map(overrides)
  const idsBySlug = new Map<string, number[]>()
  for (const [id, original] of data) {
    const slug = byId.get(id) ?? original
    idsBySlug.set(slug, [...(idsBySlug.get(slug) ?? []), id])
  }
  const usedSlugs = new Set(idsBySlug.keys())
  for (const [slug, ids] of idsBySlug) {
    if (ids.length < 2) continue
    let suffix = 1
    for (const id of ids.slice().sort((a, b) => a - b)) {
      if (!byId.has(id)) continue
      while (usedSlugs.has(`${slug}-${suffix}`)) suffix++
      const numberedSlug = `${slug}-${suffix++}`
      byId.set(id, numberedSlug)
      usedSlugs.add(numberedSlug)
    }
  }
  return [...byId]
}
