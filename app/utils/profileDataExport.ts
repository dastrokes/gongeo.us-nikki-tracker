type ProfileDataExportPayload = {
  pulls: Record<string, PullRecord[]>
  edits: Record<string, EditRecord[]>
  evo: Record<string, EvoRecord[]>
  pearpal: Record<string, PearpalTrackerItem[]>
  wardrobe: WardrobeData
  profile?: {
    label: string
  }
}

const filterNonEmptyRecord = <T>(
  data: Record<number, T[]>
): Record<string, T[]> =>
  Object.fromEntries(
    Object.entries(data).filter(([, entries]) => entries.length > 0)
  )

export const createProfileDataExportPayload = ({
  pulls,
  edits,
  evo,
  pearpal,
  wardrobe,
  profile,
}: {
  pulls: Record<number, PullRecord[]>
  edits: Record<number, EditRecord[]>
  evo: Record<number, EvoRecord[]>
  pearpal: Record<number, PearpalTrackerItem[]>
  wardrobe: WardrobeData
  profile?: {
    label: string
  }
}): ProfileDataExportPayload | null => {
  const filteredPulls = filterNonEmptyRecord(pulls)
  const filteredEdits = filterNonEmptyRecord(edits)
  const filteredEvo = filterNonEmptyRecord(evo)
  const filteredPearpal = filterNonEmptyRecord(pearpal)
  const hasWardrobeData =
    wardrobe.ownedItemIds.length > 0 ||
    wardrobe.ownedMakeupIds.length > 0 ||
    wardrobe.ownedMomoIds.length > 0

  if (
    Object.keys(filteredPulls).length === 0 &&
    Object.keys(filteredEdits).length === 0 &&
    Object.keys(filteredEvo).length === 0 &&
    Object.keys(filteredPearpal).length === 0 &&
    !hasWardrobeData
  ) {
    return null
  }

  return {
    pulls: filteredPulls,
    edits: filteredEdits,
    evo: filteredEvo,
    pearpal: filteredPearpal,
    wardrobe,
    ...(profile ? { profile } : {}),
  }
}

export const getProfileDataExportFileName = (slot: number) =>
  `gongeous-profile-data-${new Date().toISOString().split('T')[0]}-${slot}.json`
