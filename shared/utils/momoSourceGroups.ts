import momoSourceGroups from '../../data/momoSource.json'

export type MomoSourceGroupDefinition = {
  key: string
  labelKey: string
  ids: number[]
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
