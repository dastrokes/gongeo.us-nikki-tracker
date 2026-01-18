export const getVersionFromId = (id: number): string | null => {
  const digits = Math.trunc(id).toString()
  if (digits.length < 3) return null

  const prefix = digits.slice(0, 3)
  const major = Number(prefix[0])
  const minor = Number(prefix.slice(1))

  if (Number.isNaN(major) || Number.isNaN(minor)) return null

  return `${major}.${minor}`
}

export const getVersionPrefix = (version: string): number | null => {
  const match = version.match(/^(\d+)\.(\d+)$/)
  if (!match) return null

  const major = Number(match[1])
  const minor = Number(match[2])

  if (Number.isNaN(major) || Number.isNaN(minor)) return null

  return major * 100 + minor
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
