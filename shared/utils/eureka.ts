export const getEurekaOwnershipProgress = (
  eureka: EurekaCatalogEntry,
  ownedColorIds: ReadonlySet<number>
): EurekaOwnershipProgress => {
  const total = eureka.colors.length
  const owned = eureka.colors.reduce(
    (count, color) => count + (ownedColorIds.has(color.id) ? 1 : 0),
    0
  )

  return {
    status:
      owned === total && total > 0
        ? 'complete'
        : owned > 0
          ? 'partial'
          : 'missing',
    owned,
    total,
  }
}

export const resolvePearpalEurekaColors = (
  rows: readonly PearpalMagicBallItem[],
  entries: readonly EurekaCatalogEntry[]
) => {
  const validColorsByEureka = new Map(
    entries.map((entry) => [
      entry.id,
      new Set(entry.colors.map((color) => color.id)),
    ])
  )
  const colorIds = new Set<number>()
  let invalid = 0

  rows.forEach((row) => {
    const eurekaId = Number(row.magic_ball_id)
    const colorId = Number(row.magic_ball_color)
    if (
      !Number.isSafeInteger(eurekaId) ||
      eurekaId <= 0 ||
      !Number.isSafeInteger(colorId) ||
      colorId <= 0 ||
      !validColorsByEureka.get(eurekaId)?.has(colorId)
    ) {
      invalid += 1
      return
    }

    colorIds.add(colorId)
  })

  return {
    colorIds: Array.from(colorIds).sort((left, right) => left - right),
    found: colorIds.size,
    invalid,
  }
}
