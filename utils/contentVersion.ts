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

const EXACT_VERSION_PATTERN = /^(\d+)\.(\d+)$/
const MAJOR_VERSION_FILTER_PATTERN = /^(\d+)\.x$/i

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
