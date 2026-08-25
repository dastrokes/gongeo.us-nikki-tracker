import { BANNER_DATA } from './banners'

export const LATEST_BANNER_ID = 72

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
const currentBannerGroups = new Map<
  string,
  {
    bannerType: Banner['bannerType']
    end: string
    bannerIds: number[]
  }
>()
const now = Date.now()

for (const run of limitedBannerRuns) {
  const startTime = new Date(`${run.start}T20:00:00Z`).getTime()
  const endTime = new Date(`${run.end}T20:00:00Z`).getTime()

  if (now < startTime || now >= endTime) {
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
