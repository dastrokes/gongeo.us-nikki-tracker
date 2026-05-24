import { BANNER_DATA } from '../../data/banners'
import {
  getBannerOutfitVariantLevels,
  type BannerOutfitVariantLevel,
} from './bannerCompletionLevels'

type WardrobeTrackerCatalogIndex = {
  itemById: ReadonlyMap<number, unknown>
  outfitItemsById: ReadonlyMap<number, readonly number[]>
  makeupById: ReadonlyMap<number, unknown>
  makeupItemsById: ReadonlyMap<number, readonly number[]>
  momoById: ReadonlyMap<number, unknown>
  fullMakeupIdsByOutfitId: ReadonlyMap<number, readonly number[]>
  momoIdsByOutfitId: ReadonlyMap<number, readonly number[]>
}

export type WardrobeTrackerImportInferenceInput = {
  processedBanners: Record<string, ProcessedBanner>
  evoData?: Record<number, EvoRecord[]>
  catalogIndex: WardrobeTrackerCatalogIndex
  bannerData?: BannerData
}

export type WardrobeTrackerImportInference = {
  itemIds: number[]
  makeupIds: number[]
  momoIds: number[]
  found: {
    items: number
    makeups: number
    momo: number
  }
  skipped: {
    partialFiveStarMakeupOutfits: number
  }
}

const toSafeId = (value: unknown) => {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

const getBaseOutfitId = (outfitId: string | number) => {
  const raw = String(outfitId)
  return raw.length === 7 ? Number(raw.slice(0, 5)) : Number(raw)
}

const getOutfitIdForVariantLevel = (
  outfitId: string | number,
  level: BannerOutfitVariantLevel
) => {
  const baseId = getBaseOutfitId(outfitId)
  if (!Number.isSafeInteger(baseId)) return null

  if (level === 'base') return baseId
  if (level === 'glowup') return Number(`${baseId}01`)
  if (level === 'evo1') return Number(`${baseId}02`)
  if (level === 'evo2') return Number(`${baseId}03`)
  return Number(`${baseId}04`)
}

const isObtainedTrackerPull = (pull: PullItem) =>
  typeof pull.obtainedAt === 'string' && pull.obtainedAt.length > 0

const addValidId = (
  ids: Set<number>,
  catalogIds: ReadonlyMap<number, unknown>,
  value: unknown
) => {
  const id = toSafeId(value)
  if (id !== null && catalogIds.has(id)) {
    ids.add(id)
  }
}

const getManualEvoLevel = (
  evoData: Record<number, EvoRecord[]> | undefined,
  bannerId: number,
  outfitId: string
) => evoData?.[bannerId]?.find(([id]) => id === outfitId)?.[1] ?? 0

export const mergeProcessedBannerSources = (
  sources: readonly Record<string, ProcessedBanner>[]
) => {
  const merged: Record<string, ProcessedBanner> = {}

  sources.forEach((source) => {
    Object.entries(source).forEach(([bannerId, banner]) => {
      const existing = merged[bannerId]
      if (!existing) {
        merged[bannerId] = banner
        return
      }

      const outfitsById = new Map(
        existing.outfits.map((outfit) => [outfit.id, outfit])
      )
      banner.outfits.forEach((outfit) => {
        const previous = outfitsById.get(outfit.id)
        if (!previous || outfit.completion > previous.completion) {
          outfitsById.set(outfit.id, outfit)
        }
      })

      merged[bannerId] = {
        ...existing,
        pulls: [...existing.pulls, ...banner.pulls],
        outfits: Array.from(outfitsById.values()),
        stats: {
          ...existing.stats,
          totalPulls: Math.max(
            existing.stats.totalPulls,
            banner.stats.totalPulls
          ),
        },
      }
    })
  })

  return merged
}

export const inferWardrobeIdsFromTracker = ({
  processedBanners,
  evoData,
  catalogIndex,
  bannerData = BANNER_DATA,
}: WardrobeTrackerImportInferenceInput): WardrobeTrackerImportInference => {
  const itemIds = new Set<number>()
  const makeupIds = new Set<number>()
  const momoIds = new Set<number>()
  let skippedPartialFiveStarMakeupOutfits = 0

  Object.values(processedBanners).forEach((banner) => {
    const bannerInfo = bannerData[banner.bannerId]
    const isPermanent = bannerInfo?.bannerType === 1

    banner.pulls.forEach((pull) => {
      if (!isObtainedTrackerPull(pull)) return
      addValidId(itemIds, catalogIndex.itemById, pull.itemId)
    })

    if (!bannerInfo || isPermanent) return

    banner.outfits.forEach((outfit) => {
      const manualEvoLevel = getManualEvoLevel(
        evoData,
        banner.bannerId,
        outfit.id
      )
      const levels = getBannerOutfitVariantLevels({
        quality: outfit.quality,
        totalPulls: banner.stats.totalPulls,
        outfitCompletion: outfit.completion,
        manualEvoLevel,
      })

      levels.forEach((level) => {
        const variantOutfitId = getOutfitIdForVariantLevel(outfit.id, level)
        if (variantOutfitId === null) return

        catalogIndex.outfitItemsById
          .get(variantOutfitId)
          ?.forEach((itemId) =>
            addValidId(itemIds, catalogIndex.itemById, itemId)
          )
      })

      if (outfit.quality === 5) {
        const baseOutfitId = getBaseOutfitId(outfit.id)
        const relatedFullMakeupIds =
          catalogIndex.fullMakeupIdsByOutfitId.get(baseOutfitId) ?? []

        if (banner.stats.totalPulls >= 100) {
          relatedFullMakeupIds.forEach((fullMakeupId) => {
            addValidId(makeupIds, catalogIndex.makeupById, fullMakeupId)
            catalogIndex.makeupItemsById
              .get(fullMakeupId)
              ?.forEach((makeupId) =>
                addValidId(makeupIds, catalogIndex.makeupById, makeupId)
              )
          })
        } else if (relatedFullMakeupIds.length > 0) {
          skippedPartialFiveStarMakeupOutfits += 1
        }

        if (banner.stats.totalPulls >= 140) {
          catalogIndex.momoIdsByOutfitId
            .get(baseOutfitId)
            ?.forEach((momoId) =>
              addValidId(momoIds, catalogIndex.momoById, momoId)
            )
        }
      }
    })

    if (bannerInfo.bannerType === 3 && bannerInfo.rewardIds?.length) {
      bannerInfo.rewardIds
        .slice(0, Math.floor(banner.stats.totalPulls / 5))
        .forEach((rewardId) =>
          addValidId(itemIds, catalogIndex.itemById, rewardId)
        )
    }
  })

  return {
    itemIds: Array.from(itemIds).sort((left, right) => left - right),
    makeupIds: Array.from(makeupIds).sort((left, right) => left - right),
    momoIds: Array.from(momoIds).sort((left, right) => left - right),
    found: {
      items: itemIds.size,
      makeups: makeupIds.size,
      momo: momoIds.size,
    },
    skipped: {
      partialFiveStarMakeupOutfits: skippedPartialFiveStarMakeupOutfits,
    },
  }
}
