import momoSourceGroups from '../../data/momoSource.json'

export type MomoSourceGroupDefinition = {
  key: string
  labelKey: string
  ids: number[]
}

export type MomoSourceFilterOption = {
  label: string
  value: string
}

const sortIds = (ids: number[]) => ids.slice().sort((a, b) => a - b)

export const MOMO_SOURCE_GROUPS: MomoSourceGroupDefinition[] =
  momoSourceGroups as MomoSourceGroupDefinition[]

const MOMO_GROUP_BY_KEY = new Map(
  MOMO_SOURCE_GROUPS.map((group) => [
    group.key,
    { ...group, ids: sortIds(group.ids) },
  ])
)

const MOMO_GROUP_KEY_BY_ID = new Map<number, string>()
const MOMO_GROUP_KEY_BY_ID_SET = new Map<string, string>()

for (const group of MOMO_SOURCE_GROUPS) {
  const sortedIds = sortIds(group.ids)
  MOMO_GROUP_KEY_BY_ID_SET.set(sortedIds.join(','), group.key)
  sortedIds.forEach((id) => MOMO_GROUP_KEY_BY_ID.set(id, group.key))
}

export const resolveMomoSourceIdsFromValue = (
  value: string
): number[] | null => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const group = MOMO_GROUP_BY_KEY.get(trimmed)
  if (group) return group.ids.slice()
  if (trimmed.includes(',')) {
    const ids = trimmed
      .split(',')
      .map((entry) => Number(entry.trim()))
      .filter((entry) => !Number.isNaN(entry))
    const validIds = ids.filter((entry) => MOMO_GROUP_KEY_BY_ID.has(entry))
    return validIds.length > 0 ? validIds : null
  }
  const numeric = Number(trimmed)
  if (!Number.isNaN(numeric)) {
    const groupKey = MOMO_GROUP_KEY_BY_ID.get(numeric)
    if (groupKey) {
      const grouped = MOMO_GROUP_BY_KEY.get(groupKey)
      return grouped ? grouped.ids.slice() : [numeric]
    }
  }
  return null
}

export const resolveMomoSourceGroupKeyFromIds = (ids: number[]) => {
  if (ids.length === 0) return null
  const key = MOMO_GROUP_KEY_BY_ID_SET.get(sortIds(ids).join(','))
  if (key) return key
  if (ids.length === 1 && typeof ids[0] === 'number') {
    return MOMO_GROUP_KEY_BY_ID.get(ids[0]) ?? null
  }
  return null
}

export const resolveMomoSourceGroupLabelKey = (
  groupKey: string | null
): string | null => {
  if (!groupKey) return null
  return MOMO_GROUP_BY_KEY.get(groupKey)?.labelKey ?? null
}

export const createMomoSourceFilterOptions = (
  translate: (key: string) => string
): MomoSourceFilterOption[] => {
  return MOMO_SOURCE_GROUPS.map((group) => {
    const translated = translate(group.labelKey)
    const fallback = `Source ${group.ids[0]}`
    const label = translated !== group.labelKey ? translated : fallback
    return {
      label,
      value: group.key,
      sortKey: group.ids[0] ?? 0,
    }
  })
    .sort((a, b) => {
      if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey
      return a.label.localeCompare(b.label)
    })
    .map(({ label, value }) => ({ label, value }))
}

export const resolveMomoSourceFilterValue = (
  value: string | null | undefined,
  availableValues: readonly string[]
): string | null => {
  if (!value || value === 'all') return null
  if (availableValues.includes(value)) return value
  const ids = resolveMomoSourceIdsFromValue(value)
  if (!ids) return null
  const groupKey = resolveMomoSourceGroupKeyFromIds(ids)
  if (!groupKey) return null
  return availableValues.includes(groupKey) ? groupKey : null
}
