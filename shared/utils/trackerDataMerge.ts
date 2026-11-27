export const mergePullData = (
  existingData: Record<number, PullRecord[]>,
  newData: Record<number, PullRecord[]>
): Record<number, PullRecord[]> => {
  const mergedData: Record<number, PullRecord[]> = { ...existingData }

  Object.entries(newData).forEach(([bannerIdStr, newPulls]) => {
    const bannerId = Number(bannerIdStr)
    const existingPulls = mergedData[bannerId] ?? []

    if (existingPulls.length === 0) {
      mergedData[bannerId] = [...newPulls]
      return
    }

    const existingNewest = existingPulls[0]![0]
    const existingOldest = existingPulls.at(-1)![0]
    const existingTimestamps = new Set(existingPulls.map(([ts]) => ts))
    const toPrepend: PullRecord[] = []
    const toAppend: PullRecord[] = []

    for (const [timestamp, itemId] of newPulls) {
      if (existingTimestamps.has(timestamp)) continue

      if (timestamp > existingNewest) {
        toPrepend.push([timestamp, itemId])
      } else if (timestamp < existingOldest) {
        toAppend.push([timestamp, itemId])
      }
    }

    mergedData[bannerId] = [...toPrepend, ...existingPulls, ...toAppend]
  })

  return mergedData
}

export const mergeEditData = (
  existingEdits: Record<number, EditRecord[]>,
  newEdits: Record<number, EditRecord[]>
): Record<number, EditRecord[]> => {
  const mergedEdits: Record<number, EditRecord[]> = { ...existingEdits }

  Object.entries(newEdits).forEach(([bannerIdStr, newEditRecords]) => {
    const bannerId = Number(bannerIdStr)
    const existingRecords = mergedEdits[bannerId] || []
    const existingEditMap = new Map<string, EditRecord>()

    existingRecords.forEach((edit) => {
      existingEditMap.set(edit[1], edit)
    })

    newEditRecords.forEach((newEdit) => {
      const existingEdit = existingEditMap.get(newEdit[1])
      if (!existingEdit) {
        existingRecords.push(newEdit)
      }
    })

    mergedEdits[bannerId] = existingRecords
  })

  return mergedEdits
}

export const mergeEvoData = (
  localRecords: Record<number, EvoRecord[]> | undefined,
  remoteRecords: Record<number, EvoRecord[]> | undefined,
  mode: 'upload' | 'download'
): Record<number, EvoRecord[]> => {
  if (mode === 'upload') {
    return { ...(remoteRecords ?? {}), ...(localRecords ?? {}) }
  }

  return { ...(localRecords ?? {}), ...(remoteRecords ?? {}) }
}

export const mergeArrayRecords = <T>(
  localRecords: Record<number, T[]> | undefined,
  remoteRecords: Record<number, T[]> | undefined,
  getKey: (row: T) => string
) => {
  const merged: Record<number, T[]> = Object.fromEntries(
    Object.entries(localRecords ?? {}).map(([key, rows]) => [key, [...rows]])
  )

  Object.entries(remoteRecords ?? {}).forEach(([key, remoteRows]) => {
    const existingRows = merged[Number(key)] ?? []
    const seen = new Set(existingRows.map(getKey))
    const additions = remoteRows.filter((row) => {
      const rowKey = getKey(row)
      if (seen.has(rowKey)) return false
      seen.add(rowKey)
      return true
    })

    merged[Number(key)] = [...existingRows, ...additions]
  })

  return merged
}

export const mergePearpalData = (
  localRecords: Record<number, PearpalTrackerItem[]> | undefined,
  remoteRecords: Record<number, PearpalTrackerItem[]> | undefined
): Record<number, PearpalTrackerItem[]> =>
  mergeArrayRecords(localRecords, remoteRecords, (row) => JSON.stringify(row))

// Box rewards only accumulate, so both sides are combined. Each box slot holds
// one piece, and a piece comes from a box at most once per set, so a row is
// dropped when its slot or its piece and set is already taken (local rows
// first). Pearpal rows list every box of a banner, so once either side has
// them the banner's manual rows are dropped.
export const mergeStarCrownBoxData = (
  localRecords: Record<number, StarCrownBoxReward[]> | undefined,
  remoteRecords: Record<number, StarCrownBoxReward[]> | undefined
): Record<number, StarCrownBoxReward[]> => {
  const merged: Record<number, StarCrownBoxReward[]> = {}
  const bannerIds = new Set([
    ...Object.keys(localRecords ?? {}),
    ...Object.keys(remoteRecords ?? {}),
  ])

  bannerIds.forEach((key) => {
    const bannerId = Number(key)
    const rows = [
      ...(localRecords?.[bannerId] ?? []),
      ...(remoteRecords?.[bannerId] ?? []),
    ].filter(isStarCrownBoxReward)
    const hasPearpalRows = rows.some((row) => row.source === 'pearpal')
    const kept: StarCrownBoxReward[] = []
    const takenSlots = new Set<number>()
    const takenPieceSets = new Set<string>()

    rows.forEach((row) => {
      if (hasPearpalRows && row.source !== 'pearpal') return
      const slot = getValidStarCrownBoxIndex(row)
      const pieceSet = `${row.itemId}|${row.round}`
      if (takenPieceSets.has(pieceSet)) return
      if (slot !== null && takenSlots.has(slot)) return
      if (slot !== null) takenSlots.add(slot)
      takenPieceSets.add(pieceSet)
      kept.push(row)
    })

    if (kept.length > 0) merged[bannerId] = kept
  })

  return merged
}
