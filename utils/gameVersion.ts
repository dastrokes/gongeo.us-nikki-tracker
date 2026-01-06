import { BANNER_DATA } from '~/data/banners'

/**
 * Get the latest game version from banner data
 * Reads the last banner's last run (banners are always in order)
 * @returns Latest game version (e.g., "2.0.2")
 */
export function getGameVersion(): string {
  const bannerIds = Object.keys(BANNER_DATA).map(Number)
  const lastBannerId = Math.max(...bannerIds)
  const lastBanner = BANNER_DATA[lastBannerId]
  const lastRun = lastBanner!.runs[lastBanner!.runs.length - 1]

  return lastRun!.version
}
