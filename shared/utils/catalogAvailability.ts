export type CatalogRegionScope = 'global' | 'cn'

export type CatalogAvailabilityEntity = 'item' | 'makeup' | 'momo'

const DEFAULT_CATALOG_REGION_SCOPE: CatalogRegionScope = 'global'

const ITEM_REGION_OVERRIDES = new Map<number, CatalogRegionScope>([
  [1021720039, 'cn'],
  [1021720040, 'global'],
  [1021780027, 'cn'],
  [1028780027, 'global'],
])

const MOMO_REGION_OVERRIDES = new Map<number, CatalogRegionScope>([
  [1160100148, 'cn'],
])

export const normalizeCatalogRegionScope = (
  value: unknown
): CatalogRegionScope =>
  value === 'cn' || value === 'global' ? value : DEFAULT_CATALOG_REGION_SCOPE

const getCatalogEntryRegionOverride = (
  entity: CatalogAvailabilityEntity,
  id: number
) => {
  if (entity === 'momo') return MOMO_REGION_OVERRIDES.get(id) ?? null
  if (entity === 'item') return ITEM_REGION_OVERRIDES.get(id) ?? null
  return null
}

export const isCatalogEntryAvailableInScope = (
  entity: CatalogAvailabilityEntity,
  id: number,
  scope: CatalogRegionScope
) => {
  const normalizedScope = normalizeCatalogRegionScope(scope)

  const override = getCatalogEntryRegionOverride(entity, id)
  return !override || override === normalizedScope
}

export const filterCatalogIdsByRegionScope = (
  entity: CatalogAvailabilityEntity,
  ids: readonly number[],
  scope: CatalogRegionScope
) => ids.filter((id) => isCatalogEntryAvailableInScope(entity, id, scope))
