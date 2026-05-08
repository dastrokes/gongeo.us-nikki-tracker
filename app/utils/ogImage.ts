import { BANNER_DATA } from '../../data/banners'
import { CURRENT_BANNER_GROUPS, LATEST_BANNER_ID } from '../../data/config'
import OUTFIT_DATA, { type OutfitKey } from '../../data/outfits'

const unique = <T>(values: T[]) => Array.from(new Set(values))

const isOutfitKey = (id: string): id is OutfitKey => id in OUTFIT_DATA

const getSortedBannerIds = () =>
  Object.keys(BANNER_DATA)
    .map(Number)
    .filter((id) => !Number.isNaN(id) && id in BANNER_DATA)
    .sort((a, b) => b - a)

const getConfiguredBannerIds = () =>
  unique(CURRENT_BANNER_GROUPS.flatMap((group) => group.bannerIds)).filter(
    (id) => id in BANNER_DATA
  )

const getPrimaryBannerId = () => {
  if (LATEST_BANNER_ID in BANNER_DATA) return LATEST_BANNER_ID

  const [configuredBannerId] = getConfiguredBannerIds().slice(-1)
  if (configuredBannerId) return configuredBannerId

  return getSortedBannerIds()[0] ?? null
}

const getDisplayBannerIds = () =>
  unique([
    ...getConfiguredBannerIds(),
    ...[getPrimaryBannerId()].filter((id): id is number => id !== null),
    ...getSortedBannerIds(),
  ]).slice(0, 2)

const getSortedOutfitIds = () =>
  (Object.keys(OUTFIT_DATA) as OutfitKey[]).sort(
    (a, b) => Number(b) - Number(a)
  )

const getBannerOutfitIds = (
  banner: (typeof BANNER_DATA)[number] | null | undefined
) => {
  if (!banner) return []
  return [...banner.outfit5StarId, ...banner.outfit4StarId]
}

const getFeaturedOutfitIds = () => {
  const bannerOutfits = unique(
    getDisplayBannerIds().flatMap((id) => getBannerOutfitIds(BANNER_DATA[id]))
  ).filter(isOutfitKey)

  return unique([...bannerOutfits, ...getSortedOutfitIds()]).slice(0, 4)
}

const getFeaturedItemIds = (outfitIds: OutfitKey[]) => {
  const selectedItems = outfitIds.flatMap((id) => OUTFIT_DATA[id].items)
  const catalogItems = getSortedOutfitIds().flatMap(
    (id) => OUTFIT_DATA[id].items
  )

  return unique([...selectedItems, ...catalogItems]).slice(0, 5)
}

const getSyntheticPullsToObtain = (itemId: string, index: number) => {
  let seed = 0
  for (const ch of itemId) seed += ch.charCodeAt(0)
  const base = (seed + index * 17) % 18
  return base + 3
}

const getSiteUrl = () => {
  const runtimeConfig = useRuntimeConfig()
  const requestUrl = useRequestURL()

  return String(
    requestUrl.origin || runtimeConfig.public.siteUrl || ''
  ).replace(/\/$/, '')
}

export type OgLocale = 'en' | 'zh'

export interface OgImageProps {
  locale: OgLocale
  siteName: string
  eyebrow: string
  headlineOne: string
  headlineTwo: string
  headlineThree: string
  summary: string
  logoImage: string
  mascotImage: string
  bannerImages: string[]
  outfitImages: string[]
  itemImages: string[]
  itemCards: { image: string; pullsToObtain: number }[]
  navLabels: string[]
  statCards: { label: string; value: string }[]
  trackerTitle: string
  whimSearchTitle: string
  compendiumTitle: string
  filterLabels: string[]
}

const OG_COPY: Record<
  OgLocale,
  {
    eyebrow: string
    headlineOne: string
    headlineTwo: string
    headlineThree: string
    summary: string
    navLabels: string[]
    statCards: { label: string; value: string }[]
    trackerTitle: string
    whimSearchTitle: string
    compendiumTitle: string
    filterLabels: string[]
  }
> = {
  en: {
    eyebrow: 'Infinity Nikki Companion',
    headlineOne: 'Infinity Nikki',
    headlineTwo: 'Tracker & Styling',
    headlineThree: 'Companion',
    summary: 'Track pulls, explore banners, and discover outfits.',
    navLabels: ['Tracker', 'Resonance', 'Compendium', 'Community'],
    statCards: [
      { label: 'Total Pulls', value: '2,473' },
      { label: '5★ / 4★', value: '91 / 219' },
      { label: 'Avg 5★', value: '16.33' },
    ],
    trackerTitle: 'Resonance Tracker',
    whimSearchTitle: 'Whim Search',
    compendiumTitle: 'Compendium',
    filterLabels: ['Version', 'Style', 'Label'],
  },
  zh: {
    eyebrow: '无限暖暖助手',
    headlineOne: '无限暖暖',
    headlineTwo: '暖暖共鸣录',
    headlineThree: '',
    summary: '📒 抽卡记录\n📊 数据分析\n👥 社区统计\n📖 游戏图鉴',
    navLabels: ['抽卡记录', '共鸣卡池', '游戏图鉴', '社区工具'],
    statCards: [
      { label: '总抽数', value: '2,473' },
      { label: '5★ / 4★', value: '91 / 219' },
      { label: '5★平均', value: '16.33' },
    ],
    trackerTitle: '共鸣记录',
    whimSearchTitle: '奇想搜索',
    compendiumTitle: '游戏图鉴',
    filterLabels: ['版本', '风格', '标签'],
  },
}

const getLocale = (): OgLocale => {
  try {
    const route = useRoute()
    const lang = route.query.lang
    if (lang === 'zh') return 'zh'
  } catch {
    // not in a route context
  }
  return 'en'
}

export const createOgImageProps = (): OgImageProps => {
  const locale = getLocale()
  const copy = OG_COPY[locale]
  const siteUrl = getSiteUrl()
  const assetUrl = (path: string) =>
    `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
  const outfitIds = getFeaturedOutfitIds()
  const itemIds = getFeaturedItemIds(outfitIds)
  const bannerImages = getDisplayBannerIds()
    .map((id) => BANNER_DATA[id])
    .filter((banner): banner is (typeof BANNER_DATA)[number] => Boolean(banner))
    .map((banner) => assetUrl(`/images/banners/${banner.bannerId}.png`))

  return {
    locale,
    siteName: 'gongeo.us',
    eyebrow: copy.eyebrow,
    headlineOne: copy.headlineOne,
    headlineTwo: copy.headlineTwo,
    headlineThree: copy.headlineThree,
    summary: copy.summary,
    logoImage: assetUrl('/images/logo.webp'),
    mascotImage: assetUrl('/images/emotes/hi.webp'),
    bannerImages,
    outfitImages: outfitIds.map((id) => assetUrl(`/images/outfits/${id}.png`)),
    itemImages: itemIds.map((id) => assetUrl(`/images/items/icons/${id}.png`)),
    itemCards: itemIds.map((id, index) => ({
      image: assetUrl(`/images/items/icons/${id}.png`),
      pullsToObtain: getSyntheticPullsToObtain(id, index),
    })),
    navLabels: copy.navLabels,
    statCards: copy.statCards,
    trackerTitle: copy.trackerTitle,
    whimSearchTitle: copy.whimSearchTitle,
    compendiumTitle: copy.compendiumTitle,
    filterLabels: copy.filterLabels,
  }
}
