export const OUTFIT_POSTER_SOURCE_PRESETS = {
  limited: { source: 'limited', sourceDetail: null },
  limited_five: { source: 'limited', sourceDetail: '5star' },
  limited_four: { source: 'limited', sourceDetail: '4star' },
  shop: { source: 'pear', sourceDetail: null },
  event: { source: 'event', sourceDetail: null },
} as const

export interface OutfitCollectionPosterFilters {
  sourcePreset: 'current' | keyof typeof OUTFIT_POSTER_SOURCE_PRESETS
  version: string | null
  ownership: 'all' | 'owned'
}

export const OUTFIT_POSTER_SOURCE_LABEL_KEYS = {
  current: 'compendium.image.current_filters',
  limited: 'compendium.source.limited',
  limited_five: 'global.charts.five_star_banners',
  limited_four: 'global.charts.four_star_banners',
  shop: 'compendium.source.pear',
  event: 'compendium.source.event',
} as const satisfies Record<
  OutfitCollectionPosterFilters['sourcePreset'],
  string
>

export interface OutfitCollectionPosterEntry {
  id: number
  name: string
  quality: number
  progress: WardrobeOutfitProgress | null
  evoLevel: number | null
}

export interface OutfitCollectionPosterSnapshot {
  entries: OutfitCollectionPosterEntry[]
  titleHighlight: string | null
  version: string | null
  showProgress: boolean
}

export const paginateOutfitCollectionPoster = <T>(
  entries: readonly T[]
): T[][] => {
  if (!entries.length) return []
  const pageCount = Math.ceil(entries.length / 24)
  const baseSize = Math.floor(entries.length / pageCount)
  const extra = entries.length % pageCount
  let start = 0

  return Array.from({ length: pageCount }, (_, index) => {
    const end = start + baseSize + Number(index < extra)
    const page = entries.slice(start, end)
    start = end
    return page
  })
}
