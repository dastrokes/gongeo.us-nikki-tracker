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

export const createOgImageProps = () => {
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
    siteName: 'gongeo.us',
    eyebrow: 'Infinity Nikki Companion',
    headlineOne: 'Infinity Nikki',
    headlineTwo: 'Tracker & Styling',
    headlineThree: 'Companion',
    summary: 'Track pulls, explore banners, and discover outfits.',
    logoImage: assetUrl('/images/logo.webp'),
    mascotImage: assetUrl('/images/emotes/hi.webp'),
    bannerImages,
    outfitImages: outfitIds.map((id) => assetUrl(`/images/outfits/${id}.png`)),
    itemImages: itemIds.map((id) => assetUrl(`/images/items/icons/${id}.png`)),
    itemCards: itemIds.map((id, index) => ({
      image: assetUrl(`/images/items/icons/${id}.png`),
      pullsToObtain: getSyntheticPullsToObtain(id, index),
    })),
    navLabels: ['Tracker', 'Resonance', 'Compendium', 'Community'],
    statCards: [
      {
        label: 'Total Pulls',
        value: '2,473',
      },
      {
        label: '5★ / 4★',
        value: '91 / 219',
      },
      {
        label: 'Avg 5★',
        value: '16.33',
      },
    ],
    trackerTitle: 'Resonance Tracker',
    compendiumTitle: 'Compendium',
    featuredOutfitsTitle: 'Featured Outfits',
    searchPlaceholder: 'Whim Search',
    filterLabels: ['By Version', 'By Style', 'By Source'],
  }
}
