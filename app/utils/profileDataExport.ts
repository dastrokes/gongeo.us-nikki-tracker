type ProfileDataExportPayload = {
  pulls: Record<string, PullRecord[]>
  edits: Record<string, EditRecord[]>
  evo: Record<string, EvoRecord[]>
  pearpal: Record<string, PearpalTrackerItem[]>
  starCrownBox?: Record<string, StarCrownBoxReward[]>
  wardrobe: WardrobeData
  bannerWishlist?: BannerWishlistData
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
  starCrownBox,
  wardrobe,
  bannerWishlist,
  profile,
}: {
  pulls: Record<number, PullRecord[]>
  edits: Record<number, EditRecord[]>
  evo: Record<number, EvoRecord[]>
  pearpal: Record<number, PearpalTrackerItem[]>
  starCrownBox: Record<number, StarCrownBoxReward[]>
  wardrobe: WardrobeData
  bannerWishlist?: BannerWishlistData | null
  profile?: {
    label: string
  }
}): ProfileDataExportPayload | null => {
  const filteredPulls = filterNonEmptyRecord(pulls)
  const filteredEdits = filterNonEmptyRecord(edits)
  const filteredEvo = filterNonEmptyRecord(evo)
  const filteredPearpal = filterNonEmptyRecord(pearpal)
  const filteredStarCrownBox = filterNonEmptyRecord(starCrownBox)
  const hasWardrobeData =
    wardrobe.ownedItemIds.length > 0 ||
    wardrobe.ownedMakeupIds.length > 0 ||
    wardrobe.ownedMomoIds.length > 0 ||
    wardrobe.ownedPropIds.length > 0 ||
    (wardrobe.ownedEurekaColorIds?.length ?? 0) > 0

  if (
    Object.keys(filteredPulls).length === 0 &&
    Object.keys(filteredEdits).length === 0 &&
    Object.keys(filteredEvo).length === 0 &&
    Object.keys(filteredPearpal).length === 0 &&
    !hasWardrobeData &&
    !bannerWishlist
  ) {
    return null
  }

  return {
    pulls: filteredPulls,
    edits: filteredEdits,
    evo: filteredEvo,
    pearpal: filteredPearpal,
    ...(Object.keys(filteredStarCrownBox).length > 0
      ? { starCrownBox: filteredStarCrownBox }
      : {}),
    wardrobe,
    ...(bannerWishlist
      ? { bannerWishlist: normalizeBannerWishlist(bannerWishlist) }
      : {}),
    ...(profile ? { profile } : {}),
  }
}

export const getProfileDataExportFileName = (slot: number) =>
  `gongeous-profile-data-${new Date().toISOString().split('T')[0]}-${slot}.json`
