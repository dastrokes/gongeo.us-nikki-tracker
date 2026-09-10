import { BANNER_DATA } from './banners'

export const LATEST_BANNER_ID = 73

export const IMPORT_PAGE_MAINTENANCE = false

const MAINTENANCE_TIMES = {
  major: '12:50:00',
  midPatch: '19:00:00',
  end: '20:00:00',
} as const
type MaintenanceSchedule = 'major' | 'midPatch'

const getMaintenanceTime = (date: string, time: string) =>
  new Date(`${date}T${time}-07:00`).getTime()
const getMaintenanceStartTime = (date: string, schedule: MaintenanceSchedule) =>
  getMaintenanceTime(date, MAINTENANCE_TIMES[schedule])
const getMaintenanceEndTime = (date: string) =>
  getMaintenanceTime(date, MAINTENANCE_TIMES.end)
const getCanonicalBannerStartTime = (date: string) =>
  new Date(`${date}T20:00:00Z`).getTime()
const isMidPatchFourStarRun = (
  bannerType: Banner['bannerType'],
  run: BannerRun
) => bannerType === 3 && run.version.endsWith('.2')
const getBannerTransitionKey = (
  bannerType: Banner['bannerType'],
  date: string
) => `${bannerType}:${date}`

const bannerRuns = Object.values(BANNER_DATA).flatMap((banner) =>
  banner.bannerType === 1
    ? []
    : banner.runs.map((run: BannerRun, runIndex: number) => ({
        bannerId: banner.bannerId,
        bannerType: banner.bannerType,
        runIndex,
        ...run,
      }))
)
const majorMaintenanceDates = new Set(
  bannerRuns
    .filter(
      (run) => run.runIndex === 0 && !isMidPatchFourStarRun(run.bannerType, run)
    )
    .map((run) => run.start)
)
const midPatchMaintenanceDates = new Set(
  bannerRuns
    .filter(
      (run) => run.runIndex === 0 && isMidPatchFourStarRun(run.bannerType, run)
    )
    .map((run) => run.start)
)
const scheduledBannerRuns = bannerRuns.map((run) => ({
  ...run,
  startTime: majorMaintenanceDates.has(run.start)
    ? getMaintenanceStartTime(run.start, 'major')
    : run.bannerType === 3 && midPatchMaintenanceDates.has(run.start)
      ? getMaintenanceStartTime(run.start, 'midPatch')
      : getCanonicalBannerStartTime(run.start),
}))
const bannerTransitionTimes = new Map<string, number>()
for (const run of scheduledBannerRuns) {
  const key = getBannerTransitionKey(run.bannerType, run.start)
  const transitionTime = bannerTransitionTimes.get(key)
  if (transitionTime === undefined || run.startTime < transitionTime) {
    bannerTransitionTimes.set(key, run.startTime)
  }
}
const scheduledMaintenanceWindows = [
  ...[...majorMaintenanceDates].map((date) => ({
    startTime: getMaintenanceStartTime(date, 'major') - 10 * 60 * 1000,
    endTime: getMaintenanceEndTime(date),
  })),
  ...[...midPatchMaintenanceDates].map((date) => ({
    startTime: getMaintenanceStartTime(date, 'midPatch') - 10 * 60 * 1000,
    endTime: getMaintenanceEndTime(date),
  })),
]
export const isImportPageMaintenance = (timestamp = Date.now()) =>
  IMPORT_PAGE_MAINTENANCE ||
  scheduledMaintenanceWindows.some(
    (window) => timestamp >= window.startTime && timestamp < window.endTime
  )
const limitedBannerRuns = scheduledBannerRuns.map((run) => ({
  ...run,
  endTime:
    bannerTransitionTimes.get(
      getBannerTransitionKey(run.bannerType, run.end)
    ) ??
    (run.bannerType === 3 && run.version.endsWith('.1')
      ? getMaintenanceStartTime(run.end, 'midPatch')
      : getMaintenanceStartTime(run.end, 'major')),
}))
const currentBannerGroups = new Map<
  string,
  {
    bannerType: Banner['bannerType']
    end: string
    endTime: number
    runs: Array<{
      bannerId: number
      runIndex: number
    }>
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
const latestStartedRun = limitedBannerRuns
  .filter((run) => Number.isFinite(run.startTime) && run.startTime <= now)
  .sort((left, right) => right.startTime - left.startTime)[0]
const hasNewBannerAtLatestTransition =
  !latestStartedRun ||
  limitedBannerRuns.some(
    (run) => run.startTime === latestStartedRun.startTime && run.runIndex === 0
  )
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
  latestStartedRun && !hasNewBannerAtLatestTransition
    ? latestStartedRun.startTime - 1
    : activeRuns.length > 0 || !latestKnownNewRun
      ? now
      : latestKnownNewRun.endTime - 1
const displayedBannerRuns = limitedBannerRuns.filter((run) =>
  isActiveAt(run, referenceTime)
)
export const CURRENT_FIRST_RUN_BANNER_IDS = displayedBannerRuns
  .filter((run) => run.runIndex === 0)
  .sort(
    (left, right) =>
      left.bannerType - right.bannerType || left.bannerId - right.bannerId
  )
  .map((run) => run.bannerId)

for (const run of displayedBannerRuns) {
  const key = `${run.bannerType}:${run.end}`
  const group = currentBannerGroups.get(key)
  if (group) {
    group.runs.push({ bannerId: run.bannerId, runIndex: run.runIndex })
  } else {
    currentBannerGroups.set(key, {
      bannerType: run.bannerType,
      end: run.end,
      endTime: run.endTime,
      runs: [{ bannerId: run.bannerId, runIndex: run.runIndex }],
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
    bannerIds: group.runs
      .sort(
        (left, right) =>
          Number(left.runIndex !== 0) - Number(right.runIndex !== 0) ||
          left.bannerId - right.bannerId
      )
      .map((run) => run.bannerId),
    targetTime: new Date(group.endTime).toISOString(),
  }))
