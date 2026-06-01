import { BANNER_DATA } from '../../data/banners'
import OUTFIT_DATA from '../../data/outfits'
import { getBaseItemId, getBaseOutfitId } from './variants'

export type SourceDetailEntity = 'item' | 'outfit' | 'makeup'

export type SourceDetailDefinition = {
  key: string
  labelKey: string
  source: string
  entities: readonly SourceDetailEntity[]
}

export type SourceTreeFilterOption = {
  key: string
  label: string
  value: string
  children?: SourceTreeFilterOption[]
}

export const LIMITED_BANNER_SOURCE_KEY = 'limited'

const SOURCE_TREE_VALUE_SEPARATOR = ':'

export const LIMITED_BANNER_SOURCE_DETAILS: readonly SourceDetailDefinition[] =
  [
    {
      key: '5star',
      labelKey: 'global.charts.five_star_banners',
      source: LIMITED_BANNER_SOURCE_KEY,
      entities: ['item', 'outfit'],
    },
    {
      key: '4star-accompanying',
      labelKey: 'tracker.banner.settings.show_4star',
      source: LIMITED_BANNER_SOURCE_KEY,
      entities: ['item', 'outfit'],
    },
    {
      key: '4star',
      labelKey: 'global.charts.four_star_banners',
      source: LIMITED_BANNER_SOURCE_KEY,
      entities: ['item', 'outfit'],
    },
    {
      key: 'deep-echo',
      labelKey: 'banner.deep_echoes',
      source: LIMITED_BANNER_SOURCE_KEY,
      entities: ['item', 'makeup'],
    },
  ] as const

const LIMITED_BANNER_SOURCE_DETAIL_BY_KEY: Map<string, SourceDetailDefinition> =
  new Map(LIMITED_BANNER_SOURCE_DETAILS.map((detail) => [detail.key, detail]))

const getSourceTreeDetailValue = (source: string, detail: string) =>
  `${source}${SOURCE_TREE_VALUE_SEPARATOR}${detail}`

export const parseSourceTreeFilterValue = (
  value: string | null | undefined,
  entity: SourceDetailEntity
) => {
  if (!value) {
    return {
      source: null,
      sourceDetail: null,
    }
  }

  const [source, sourceDetail] = value.split(SOURCE_TREE_VALUE_SEPARATOR)
  if (!sourceDetail) {
    return {
      source,
      sourceDetail: null,
    }
  }

  return {
    source,
    sourceDetail: resolveSourceDetailFilterValue(sourceDetail, source, entity),
  }
}

export const getSourceTreeFilterValue = (
  source: string | null,
  sourceDetail: string | null,
  entity: SourceDetailEntity
) => {
  if (!source) return null

  const resolvedDetail = resolveSourceDetailFilterValue(
    sourceDetail,
    source,
    entity
  )

  return resolvedDetail
    ? getSourceTreeDetailValue(source, resolvedDetail)
    : source
}

export const resolveSourceDetailFilterValue = (
  value: string | null | undefined,
  source: string | null | undefined,
  entity: SourceDetailEntity
) => {
  if (!value || !source) return null

  const detail = LIMITED_BANNER_SOURCE_DETAIL_BY_KEY.get(value)
  if (
    !detail ||
    detail.source !== source ||
    !detail.entities.includes(entity)
  ) {
    return null
  }

  return detail.key
}

export const getLimitedBannerSourceDetails = (entity: SourceDetailEntity) =>
  LIMITED_BANNER_SOURCE_DETAILS.filter((detail) =>
    detail.entities.includes(entity)
  )

export const getLimitedBannerSourceDetailOutfitIds = (
  detail: string | null | undefined
) => {
  if (detail === '5star') return limitedFiveStarOutfitIds
  if (detail === '4star-accompanying') {
    return limitedAccompanyingFourStarOutfitIds
  }
  if (detail === '4star') {
    return limitedStandaloneFourStarOutfitIds
  }

  return null
}

export const createSourceTreeFilterOptions = (
  sourceOptions: readonly { label: string; value: string }[],
  translate: (key: string) => string,
  entity: SourceDetailEntity
): SourceTreeFilterOption[] =>
  sourceOptions.map((option) => {
    const baseOption = {
      ...option,
      key: option.value,
    }

    if (option.value !== LIMITED_BANNER_SOURCE_KEY) {
      return baseOption
    }

    const children = getLimitedBannerSourceDetails(entity).map((detail) => ({
      key: getSourceTreeDetailValue(option.value, detail.key),
      label: translate(detail.labelKey),
      value: getSourceTreeDetailValue(option.value, detail.key),
    }))

    return children.length > 0
      ? {
          ...baseOption,
          children,
        }
      : baseOption
  })

const limitedFiveStarOutfitIds = new Set<number>()
const limitedAccompanyingFourStarOutfitIds = new Set<number>()
const limitedStandaloneFourStarOutfitIds = new Set<number>()
const limitedFiveStarItemIds = new Set<number>()
const limitedAccompanyingFourStarItemIds = new Set<number>()
const limitedStandaloneFourStarItemIds = new Set<number>()
const deepEchoRewardIds = new Set<number>()

const addOutfitItemsToSet = (outfitId: number, itemIds: Set<number>) => {
  const outfit = OUTFIT_DATA[String(outfitId) as keyof typeof OUTFIT_DATA]
  outfit?.items.forEach((itemId: string) => {
    itemIds.add(Number(itemId))
  })
}

Object.values(BANNER_DATA).forEach((banner) => {
  if (banner.bannerType === 1) return

  if (banner.bannerType === 2) {
    banner.outfit5StarId.forEach((id: string) => {
      const outfitId = Number(id)
      limitedFiveStarOutfitIds.add(outfitId)
      addOutfitItemsToSet(outfitId, limitedFiveStarItemIds)
    })
    banner.outfit4StarId.forEach((id: string) => {
      const outfitId = Number(id)
      limitedAccompanyingFourStarOutfitIds.add(outfitId)
      addOutfitItemsToSet(outfitId, limitedAccompanyingFourStarItemIds)
    })
    return
  }

  banner.outfit4StarId.forEach((id: string) => {
    const outfitId = Number(id)
    limitedStandaloneFourStarOutfitIds.add(outfitId)
    addOutfitItemsToSet(outfitId, limitedStandaloneFourStarItemIds)
  })
  banner.rewardIds?.forEach((id: string) => deepEchoRewardIds.add(Number(id)))
})

const hasItemInSet = (itemIds: ReadonlySet<number>, itemId: number) =>
  itemIds.has(itemId) || itemIds.has(Number(getBaseItemId(itemId)))

const hasOutfitInSet = (outfitIds: ReadonlySet<number>, outfitId: number) =>
  outfitIds.has(outfitId) ||
  outfitIds.has(Number(getBaseOutfitId(String(outfitId))))

export const matchesSourceDetailFilter = (
  entry: { id: number },
  filters: Record<string, unknown>,
  entity: SourceDetailEntity
) => {
  const source =
    typeof filters.source === 'string' && filters.source ? filters.source : null
  const sourceDetail =
    typeof filters.sourceDetail === 'string' && filters.sourceDetail
      ? filters.sourceDetail
      : null
  const detail = resolveSourceDetailFilterValue(sourceDetail, source, entity)
  if (!detail) return true

  if (detail === '5star') {
    return entity === 'item'
      ? hasItemInSet(limitedFiveStarItemIds, entry.id)
      : hasOutfitInSet(limitedFiveStarOutfitIds, entry.id)
  }
  if (detail === '4star-accompanying') {
    return entity === 'item'
      ? hasItemInSet(limitedAccompanyingFourStarItemIds, entry.id)
      : hasOutfitInSet(limitedAccompanyingFourStarOutfitIds, entry.id)
  }
  if (detail === '4star') {
    return entity === 'item'
      ? hasItemInSet(limitedStandaloneFourStarItemIds, entry.id)
      : hasOutfitInSet(limitedStandaloneFourStarOutfitIds, entry.id)
  }

  return deepEchoRewardIds.has(entry.id)
}
