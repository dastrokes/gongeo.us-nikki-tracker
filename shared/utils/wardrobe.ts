export const WARDROBE_DATA_VERSION = 1 as const

export const createEmptyWardrobeData = (): WardrobeDataV1 => ({
  version: WARDROBE_DATA_VERSION,
  ownedItemIds: [],
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

export const normalizeWardrobeData = (value: unknown): WardrobeDataV1 => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return createEmptyWardrobeData()
  }

  const candidate = value as Partial<WardrobeDataV1>
  const updatedAt =
    typeof candidate.updatedAt === 'string' ? candidate.updatedAt : ''

  return {
    version: WARDROBE_DATA_VERSION,
    ownedItemIds: normalizeWardrobeItemIds(candidate.ownedItemIds),
    updatedAt,
  }
}

export const getWardrobeOutfitProgress = (
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
