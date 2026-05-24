export const WARDROBE_DATA_VERSION = 1 as const

export const createEmptyWardrobeData = (): WardrobeData => ({
  version: WARDROBE_DATA_VERSION,
  ownedItemIds: [],
  ownedMakeupIds: [],
  ownedMomoIds: [],
  updatedAt: '',
})

const normalizeWardrobeItemId = (value: unknown): number | null => {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : null

  if (parsed === null || !Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

export const normalizeWardrobeItemIds = (values: unknown): number[] => {
  if (!Array.isArray(values)) return []

  return Array.from(
    new Set(
      values
        .map(normalizeWardrobeItemId)
        .filter((value): value is number => value !== null)
    )
  ).sort((left, right) => left - right)
}

export const normalizeWardrobeData = (value: unknown): WardrobeData => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return createEmptyWardrobeData()
  }

  const candidate = value as Partial<WardrobeData>
  const updatedAt =
    typeof candidate.updatedAt === 'string' ? candidate.updatedAt : ''

  return {
    version: WARDROBE_DATA_VERSION,
    ownedItemIds: normalizeWardrobeItemIds(candidate.ownedItemIds),
    ownedMakeupIds: normalizeWardrobeItemIds(candidate.ownedMakeupIds),
    ownedMomoIds: normalizeWardrobeItemIds(candidate.ownedMomoIds),
    updatedAt,
  }
}

export const getWardrobeSetProgress = (
  itemIds: readonly number[],
  ownedItemIds: ReadonlySet<number>
): WardrobeOutfitProgress => {
  const normalizedItemIds = normalizeWardrobeItemIds([...itemIds])
  const total = normalizedItemIds.length
  const owned = normalizedItemIds.reduce(
    (count, itemId) => count + (ownedItemIds.has(itemId) ? 1 : 0),
    0
  )
  const status: WardrobeOutfitStatus =
    owned === total && total > 0 ? 'owned' : owned > 0 ? 'partial' : 'missing'

  return {
    status,
    owned,
    total,
  }
}

export const getWardrobeOutfitProgress = getWardrobeSetProgress
