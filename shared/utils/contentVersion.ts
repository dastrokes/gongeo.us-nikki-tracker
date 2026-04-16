export const getVersionFromId = (
  id: number | null | undefined
): string | null => {
  if (id === null || id === undefined) return null
  const digits = Math.trunc(id).toString()
  if (digits.length < 3) return null

  const prefix = digits.slice(0, 3)
  const major = Number(prefix[0])
  const minor = Number(prefix.slice(1))

  if (Number.isNaN(major) || Number.isNaN(minor)) return null

  return `${major}.${minor}`
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
    .map((key) => key.replace('version.', ''))
    .filter(isExactVersion)

export const getVersionPrefix = (version: string): number | null => {
  const match = version.match(EXACT_VERSION_PATTERN)
  if (!match) return null

  const major = Number(match[1])
  const minor = Number(match[2])

  if (Number.isNaN(major) || Number.isNaN(minor)) return null

  return major * 100 + minor
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
  if (Number.isNaN(major)) return null

  return {
    min: major * 100,
    max: major * 100 + 99,
  }
}

export const compareVersionsDesc = (a: string, b: string) => {
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

export const sortVersionsAsc = (versions: readonly string[]) =>
  versions.slice().sort((a, b) => compareVersionsDesc(b, a))

export const getLatestVersion = (versions: readonly string[]) =>
  sortVersionsDesc(versions)[0] ?? null

export const getOldestVersion = (versions: readonly string[]) =>
  sortVersionsAsc(versions)[0] ?? null

export const compareOptionalVersionsDesc = (
  a?: string | null,
  b?: string | null
) => {
  if (a && b && a !== b) return compareVersionsDesc(a, b)
  if (a && !b) return -1
  if (!a && b) return 1
  return 0
}

export const compareOptionalVersionsAsc = (
  a?: string | null,
  b?: string | null
) => compareOptionalVersionsDesc(b, a)

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

export const groupVersionsByMajor = (versions: readonly string[]) => {
  const versionGroups = new Map<string, string[]>()

  versions.forEach((version) => {
    const major = version.split('.')[0]
    if (!major) return

    const existing = versionGroups.get(major)
    if (existing) {
      existing.push(version)
    } else {
      versionGroups.set(major, [version])
    }
  })

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
