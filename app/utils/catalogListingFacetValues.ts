type CatalogFacetEntry = ItemListEntry | OutfitListEntry | MomoListEntry

const getCatalogFacetVersion = (
  entry: CatalogFacetEntry,
  entity: StaticCatalogListingEntity
) =>
  entity === 'momo'
    ? ((entry as MomoListEntry).version ?? null)
    : getVersionFromId((entry as ItemListEntry | OutfitListEntry).obtain_type)

export const hasCatalogQualityFacetValue = (
  entries: readonly CatalogFacetEntry[],
  quality: number
) => entries.some((entry) => entry.quality === quality)

export const hasCatalogVersionFacetValue = (
  entries: readonly CatalogFacetEntry[],
  value: string,
  entity: StaticCatalogListingEntity
) =>
  entries.some((entry) => {
    const version = getCatalogFacetVersion(entry, entity)
    if (isListingMissingFilterValue(value)) return !version
    return version ? matchesVersionFilter(version, value) : false
  })

export const hasCatalogStyleFacetValue = (
  entries: readonly CatalogFacetEntry[],
  value: string
) =>
  entries.some((entry) => {
    const style = resolveStyleKeyFromI18nKey(
      (entry as ItemListEntry | OutfitListEntry).style
    )
    return isListingMissingFilterValue(value) ? !style : style === value
  })

export const hasCatalogLabelFacetValue = (
  entries: readonly CatalogFacetEntry[],
  value: string
) => {
  const definition = TAG_BY_KEY.get(value)
  const expected = definition?.i18nKey ?? value

  return entries.some((entry) => {
    const labels = (entry as ItemListEntry | OutfitListEntry).labels ?? []
    return isListingMissingFilterValue(value)
      ? labels.length === 0
      : labels.includes(expected) || labels.includes(value)
  })
}

export const hasCatalogSourceFacetValue = (
  entries: readonly CatalogFacetEntry[],
  value: string,
  entity: StaticCatalogListingEntity
) =>
  entries.some((entry) => {
    const obtainType = entry.obtain_type
    if (entity === 'momo') {
      const group = resolveMomoSourceGroupKeyFromIds(
        obtainType === null || obtainType === undefined ? [] : [obtainType]
      )
      return isListingMissingFilterValue(value) ? !group : group === value
    }

    const group = resolveObtainGroupKeyFromIds(
      obtainType === null || obtainType === undefined ? [] : [obtainType]
    )
    return isListingMissingFilterValue(value) ? !group : group === value
  })

export const hasCatalogTypeFacetValue = (
  entries: readonly CatalogFacetEntry[],
  value: string
) =>
  entries.some((entry) => {
    const type = (entry as ItemListEntry).type
    return isListingMissingFilterValue(value)
      ? isListingFieldMissing(type)
      : type === value
  })

export const hasCatalogVariationFacetValue = (
  entries: readonly CatalogFacetEntry[],
  value: string,
  entity: 'item' | 'outfit' | 'makeup'
) =>
  entries.some((entry) => {
    const rootId = (entry as CatalogLocalItem).catalogGroupRootId
    const variant =
      entity === 'outfit'
        ? getOutfitVariantType(String(entry.id))
        : entity === 'makeup' && (entry as ItemListEntry).type === 'fullMakeup'
          ? String(entry.id).endsWith('03')
            ? 'evo3'
            : 'base'
          : getItemVariantType(entry.id, rootId)
    return value === 'all'
      ? true
      : value === 'all-evos'
        ? variant.startsWith('evo')
        : variant === value
  })
