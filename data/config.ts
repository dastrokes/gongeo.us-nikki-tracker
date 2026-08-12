import { BANNER_DATA } from './banners'

export const LATEST_BANNER_ID = 70

export const IMPORT_PAGE_MAINTENANCE = false

const limitedBannerRuns = Object.values(BANNER_DATA).flatMap((banner) =>
  banner.bannerType === 1
    ? []
    : banner.runs.map((run: BannerRun) => ({
        bannerId: banner.bannerId,
        bannerType: banner.bannerType,
        ...run,
      }))
)
const latestLimitedBannerStart = limitedBannerRuns.reduce(
  (latest, run) => (run.start > latest ? run.start : latest),
  ''
)
const currentBannerGroups = new Map<
  string,
  {
    bannerType: Banner['bannerType']
    end: string
    bannerIds: number[]
  }
>()

for (const run of limitedBannerRuns) {
  if (
    run.start > latestLimitedBannerStart ||
    run.end <= latestLimitedBannerStart
  ) {
    continue
  }

  const key = `${run.bannerType}:${run.end}`
  const group = currentBannerGroups.get(key)
  if (group) {
    group.bannerIds.push(run.bannerId)
  } else {
    currentBannerGroups.set(key, {
      bannerType: run.bannerType,
      end: run.end,
      bannerIds: [run.bannerId],
    })
  }
}

export const CURRENT_BANNER_GROUPS = [...currentBannerGroups.values()]
  .sort(
    (left, right) =>
      left.bannerType - right.bannerType || left.end.localeCompare(right.end)
  )
  .map((group) => ({
    key: `type-${group.bannerType}-${group.end}`,
    bannerIds: group.bannerIds.sort((left, right) => left - right),
    targetTime: `${group.end}T20:00:00Z`,
  }))
