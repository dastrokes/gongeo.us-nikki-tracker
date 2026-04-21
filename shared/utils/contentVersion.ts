export const getVersionFromId = (
  id: number | null | undefined
): string | null => {
  if (id == null || id < 0) return null
  const digits = Math.trunc(id).toString()
  if (digits.length < 3) return null

  return `${digits[0]}.${Number(digits.slice(1, 3))}`
}

export const toMajorMinorVersion = (version: string) => {
  const [major, minor] = version.split('.')
  return major && minor ? `${major}.${minor}` : version
}

const EXACT_VERSION_PATTERN = /^(\d+)\.(\d+)$/
const MAJOR_VERSION_FILTER_PATTERN = /^(\d+)\.x$/i

export type VersionFilterOption = {
  label: string
  value: string
  isMajor?: boolean
}

export const isExactVersion = (version: string) =>
  EXACT_VERSION_PATTERN.test(version)

export const getExactVersionsFromLocaleMessages = (
  messages: Record<string, unknown>
) =>
  Object.keys(messages)
    .filter((key) => key.startsWith('version.'))
    .map((key) => key.slice(8))
    .filter(isExactVersion)

const getVersionPrefix = (version: string): number | null => {
  const match = version.match(EXACT_VERSION_PATTERN)
  if (!match) return null

  return Number(match[1]) * 100 + Number(match[2])
}

export const getVersionPrefixRange = (
  version: string
): { min: number; max: number } | null => {
  const exactPrefix = getVersionPrefix(version)
  if (exactPrefix !== null) {
    return { min: exactPrefix, max: exactPrefix }
  }

  const majorMatch = version.match(MAJOR_VERSION_FILTER_PATTERN)
  if (!majorMatch) return null

  const major = Number(majorMatch[1])

  return {
    min: major * 100,
    max: major * 100 + 99,
  }
}

const compareVersionsDesc = (a: string, b: string) => {
  const aRange = getVersionPrefixRange(a)
  const bRange = getVersionPrefixRange(b)

  if (aRange && bRange) {
    if (aRange.min !== bRange.min) return bRange.min - aRange.min
    return bRange.max - aRange.max
  }

  if (aRange && !bRange) return -1
  if (!aRange && bRange) return 1
  return b.localeCompare(a)
}

export const sortVersionsDesc = (versions: readonly string[]) =>
  versions.slice().sort(compareVersionsDesc)

export const getOldestVersion = (versions: readonly string[]) =>
  versions.slice().sort((a, b) => compareVersionsDesc(b, a))[0] ?? null

export const compareOptionalVersionsAsc = (
  a?: string | null,
  b?: string | null
) => {
  if (a && b && a !== b) return compareVersionsDesc(b, a)
  if (a && !b) return 1
  if (!a && b) return -1
  return 0
}

export const getMajorVersionFilters = (versions: readonly string[]) =>
  Array.from(
    new Set(
      versions
        .map((version) => version.split('.')[0] || '')
        .filter((major) => /^\d+$/.test(major))
    )
  )
    .sort((a, b) => Number(b) - Number(a))
    .map((major) => `${major}.x`)

export const getVersionFilters = (versions: readonly string[]) => [
  ...versions,
  ...getMajorVersionFilters(versions),
]

export const resolveVersionFilter = (
  value: string | null | undefined,
  availableFilters: readonly string[]
) => {
  if (!value || value === 'all') return null
  if (availableFilters.includes(value)) return value

  const majorMatch = value.match(MAJOR_VERSION_FILTER_PATTERN)
  if (!majorMatch) return null

  const normalized = `${Number(majorMatch[1])}.x`
  return availableFilters.includes(normalized) ? normalized : null
}

export const matchesVersionFilter = (version: string, filter: string) => {
  const versionPrefix = getVersionPrefix(toMajorMinorVersion(version))
  const filterRange = getVersionPrefixRange(filter)

  if (versionPrefix === null || filterRange === null) return false

  return versionPrefix >= filterRange.min && versionPrefix <= filterRange.max
}

type VersionedRun = {
  version: string
}

export const getFirstRunMajorMinorVersion = (runs: readonly VersionedRun[]) => {
  const version = runs[0]?.version
  return version ? toMajorMinorVersion(version) : null
}

export const getFirstRunVersions = (
  runGroups: Iterable<readonly VersionedRun[]>
) =>
  sortVersionsDesc(
    Array.from(
      new Set(
        Array.from(runGroups, getFirstRunMajorMinorVersion).filter(
          (version): version is string => !!version && isExactVersion(version)
        )
      )
    )
  )

export const matchesFirstRunVersionFilter = (
  runs: readonly VersionedRun[],
  filter: string
) => {
  const version = runs[0]?.version
  return version ? matchesVersionFilter(version, filter) : false
}

const groupVersionsByMajor = (versions: readonly string[]) => {
  const versionGroups = new Map<string, string[]>()

  for (const version of versions) {
    const major = version.split('.')[0]
    if (!major) continue

    const existing = versionGroups.get(major)
    if (existing) {
      existing.push(version)
    } else {
      versionGroups.set(major, [version])
    }
  }

  return Array.from(versionGroups.entries()).sort(
    ([majorA], [majorB]) => Number(majorB) - Number(majorA)
  )
}

export const createVersionFilterOptions = (
  versions: readonly string[],
  getVersionLabel: (version: string) => string,
  getMajorVersionLabel: (version: string) => string = getVersionLabel
): VersionFilterOption[] =>
  groupVersionsByMajor(versions).flatMap(([major, groupedVersions]) => {
    const majorVersion = `${major}.x`
    return [
      {
        label: getMajorVersionLabel(majorVersion),
        value: majorVersion,
        isMajor: true,
      },
      ...groupedVersions
        .slice()
        .sort(compareVersionsDesc)
        .map((version) => ({
          label: getVersionLabel(version),
          value: version,
        })),
    ]
  })

export const getVersionRangeFromPrefix = (
  prefix: number,
  suffixDigits: number
): { min: number; max: number } => {
  const factor = 10 ** suffixDigits
  return {
    min: prefix * factor,
    max: prefix * factor + factor - 1,
  }
}
