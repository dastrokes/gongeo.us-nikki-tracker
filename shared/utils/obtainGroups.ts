import sourceGroups from '../../data/source.json'
import {
  compareOptionalVersionsAsc,
  getOldestVersion,
  getVersionFromId,
} from './contentVersion'

export type ObtainGroupDefinition = {
  key: string
  labelKey: string
  ids: number[]
  outfit?: boolean
  makeup?: boolean
}

export type ObtainFilterOption = {
  label: string
  value: string
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

export const isObtainGroupVisibleInMakeups = (groupKey: string): boolean => {
  const group = GROUP_BY_KEY.get(groupKey)
  if (!group) return false
  return group.makeup !== false
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

export const createObtainFilterOptions = (
  availableObtainIds: readonly number[],
  translate: (key: string) => string,
  options: {
    includeGroup?: (groupKey: string) => boolean
    fallbackLabel?: (id: number, labelKey: string) => string
  } = {}
): ObtainFilterOption[] => {
  const { includeGroup, fallbackLabel } = options
  const groupMap = new Map<string, { labelKey: string; ids: number[] }>()

  availableObtainIds.forEach((id) => {
    const groupKey = resolveObtainGroupKey(id)
    if (!groupKey || (includeGroup && !includeGroup(groupKey))) {
      return
    }

    const existing = groupMap.get(groupKey)
    if (existing) {
      existing.ids.push(id)
      return
    }

    const labelKey = resolveObtainGroupLabelKey(groupKey)
    if (!labelKey) {
      return
    }

    groupMap.set(groupKey, {
      labelKey,
      ids: [id],
    })
  })

  return Array.from(groupMap.entries())
    .map(([groupKey, group]) => {
      const translated = translate(group.labelKey)
      const label =
        translated !== group.labelKey
          ? translated
          : (fallbackLabel?.(group.ids[0] ?? 0, group.labelKey) ??
            group.labelKey)
      const sortKey = getOldestVersion(
        group.ids
          .map((id) => getVersionFromId(id))
          .filter((value): value is string => Boolean(value))
      )

      return {
        label,
        value: groupKey,
        sortKey: sortKey ?? '',
      }
    })
    .sort((a, b) => {
      const versionComparison = compareOptionalVersionsAsc(a.sortKey, b.sortKey)
      if (versionComparison !== 0) return versionComparison
      return a.label.localeCompare(b.label)
    })
    .map(({ label, value }) => ({ label, value }))
}

export const resolveObtainFilterValue = (
  value: string | null | undefined,
  availableValues: readonly string[]
): string | null => {
  if (!value || value === 'all') return null
  if (availableValues.includes(value)) return value
  const ids = resolveObtainIdsFromValue(value)
  if (!ids) return null
  const groupKey = resolveObtainGroupKeyFromIds(ids)
  if (!groupKey) return null
  return availableValues.includes(groupKey) ? groupKey : null
}
