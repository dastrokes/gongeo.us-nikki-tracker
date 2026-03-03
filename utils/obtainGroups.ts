import sourceGroups from '~/data/source.json'

export type ObtainGroupDefinition = {
  key: string
  labelKey: string
  ids: number[]
  outfit?: boolean
}

const sortIds = (ids: number[]) => ids.slice().sort((a, b) => a - b)

export const OBTAIN_GROUPS: ObtainGroupDefinition[] =
  sourceGroups as ObtainGroupDefinition[]

const GROUP_BY_KEY = new Map(
  OBTAIN_GROUPS.map((group) => [
    group.key,
    { ...group, ids: sortIds(group.ids) },
  ])
)

const GROUP_KEY_BY_ID = new Map<number, string>()
const GROUP_KEY_BY_ID_SET = new Map<string, string>()

for (const group of OBTAIN_GROUPS) {
  const sortedIds = sortIds(group.ids)
  GROUP_KEY_BY_ID_SET.set(sortedIds.join(','), group.key)
  sortedIds.forEach((id) => GROUP_KEY_BY_ID.set(id, group.key))
}

export const resolveObtainGroupKey = (id: number): string | null => {
  return GROUP_KEY_BY_ID.get(id) ?? null
}

export const resolveObtainGroupLabelKey = (
  groupKey: string | null
): string | null => {
  if (!groupKey) return null
  return GROUP_BY_KEY.get(groupKey)?.labelKey ?? null
}

export const isObtainGroupVisibleInOutfits = (groupKey: string): boolean => {
  const group = GROUP_BY_KEY.get(groupKey)
  if (!group) return false
  return group.outfit !== false
}

export const resolveObtainIdsFromValue = (value: string): number[] | null => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const group = GROUP_BY_KEY.get(trimmed)
  if (group) return group.ids.slice()
  if (trimmed.includes(',')) {
    const ids = trimmed
      .split(',')
      .map((entry) => Number(entry.trim()))
      .filter((entry) => !Number.isNaN(entry))
    const validIds = ids.filter((entry) => GROUP_KEY_BY_ID.has(entry))
    return validIds.length > 0 ? validIds : null
  }
  const numeric = Number(trimmed)
  if (!Number.isNaN(numeric)) {
    const groupKey = GROUP_KEY_BY_ID.get(numeric)
    if (groupKey) {
      const grouped = GROUP_BY_KEY.get(groupKey)
      return grouped ? grouped.ids.slice() : [numeric]
    }
    return null
  }
  return null
}

export const resolveObtainGroupKeyFromIds = (ids: number[]) => {
  if (ids.length === 0) return null
  const key = GROUP_KEY_BY_ID_SET.get(sortIds(ids).join(','))
  if (key) return key
  if (ids.length === 1 && typeof ids[0] === 'number') {
    const groupKey = GROUP_KEY_BY_ID.get(ids[0])
    if (groupKey) return groupKey
    return null
  }
  return null
}
