import { BANNER_DATA } from './banners'

export const LATEST_BANNER_ID = 73

export const IMPORT_PAGE_MAINTENANCE = false

const limitedBannerRuns = Object.values(BANNER_DATA).flatMap((banner) =>
  banner.bannerType === 1
    ? []
    : banner.runs.map((run: BannerRun, runIndex: number) => ({
        bannerId: banner.bannerId,
        bannerType: banner.bannerType,
        runIndex,
        startTime: new Date(`${run.start}T20:00:00Z`).getTime(),
        endTime: new Date(`${run.end}T20:00:00Z`).getTime(),
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
const isActiveAt = (
  run: (typeof limitedBannerRuns)[number],
  timestamp: number
) =>
  Number.isFinite(run.startTime) &&
  Number.isFinite(run.endTime) &&
  timestamp >= run.startTime &&
  timestamp < run.endTime
const activeRuns = limitedBannerRuns.filter((run) => isActiveAt(run, now))
const hasCurrentNewBanner = activeRuns.some((run) => run.runIndex === 0)
const latestKnownNewRun = limitedBannerRuns
  .filter(
    (run) =>
      run.runIndex === 0 &&
      Number.isFinite(run.startTime) &&
      Number.isFinite(run.endTime) &&
      run.startTime <= now
  )
  .sort(
    (left, right) =>
      right.startTime - left.startTime || right.endTime - left.endTime
  )[0]
const referenceTime =
  hasCurrentNewBanner || !latestKnownNewRun
    ? now
    : latestKnownNewRun.endTime - 1
const displayedBannerRuns = limitedBannerRuns.filter((run) =>
  isActiveAt(run, referenceTime)
)

for (const run of displayedBannerRuns) {
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
