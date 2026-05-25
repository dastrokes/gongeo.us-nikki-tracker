export const parseCatalogIdList = (value: unknown, maxIds = 200): number[] => {
  const raw = Array.isArray(value) ? value.join(',') : value
  if (raw === null || raw === undefined || typeof raw === 'object') return []

  const seen = new Set<number>()
  const ids: number[] = []

  String(raw)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      if (ids.length >= maxIds) return
      const parsed = Number(entry)
      if (!Number.isInteger(parsed) || parsed <= 0) return
      if (seen.has(parsed)) return
      seen.add(parsed)
      ids.push(parsed)
    })

  return ids
}

export const sortByCatalogIdOrder = <T extends { id: number }>(
  rows: T[],
  ids: readonly number[]
): T[] => {
  const order = new Map(ids.map((id, index) => [id, index]))
  return [...rows].sort(
    (left, right) =>
      (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(right.id) ?? Number.MAX_SAFE_INTEGER)
  )
}
