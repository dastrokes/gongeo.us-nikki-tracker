const resolveCatalogTags = (labels: string[]) =>
  labels.flatMap((label) => {
    const match = /^label\.(\d+)\.name$/i.exec(label)
    return match?.[1] ? [Number(match[1])] : []
  })

export const toSupabaseItem = (item: CatalogLocalItem): SupabaseItem => ({
  id: item.id,
  quality: item.quality,
  type: item.type,
  style_key: resolveStyleKeyFromI18nKey(item.style),
  tags: resolveCatalogTags(item.labels),
  obtain_type: item.obtain_type ?? null,
})

export const toSupabaseOutfit = (
  outfit: CatalogLocalOutfit
): SupabaseOutfit => ({
  id: outfit.id,
  quality: outfit.quality,
  style_key: resolveStyleKeyFromI18nKey(outfit.style),
  tags: resolveCatalogTags(outfit.labels),
  obtain_type: outfit.obtain_type ?? null,
})

export const toSupabaseMakeup = (
  makeup: CatalogLocalMakeup
): SupabaseMakeup => ({
  id: makeup.id,
  quality: makeup.quality,
  type: makeup.type,
  style_key: resolveStyleKeyFromI18nKey(makeup.style),
  obtain_type: makeup.obtain_type ?? null,
})
