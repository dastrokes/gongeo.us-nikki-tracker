import percentileData from '~~/data/percentile.json'

// Define types for our data structure
type PercentilePoint = [number, number] // [percentile, value]
type PercentileData = {
  generated_at: string
  metrics: {
    avg_5star_pulls: PercentilePoint[]
    avg_5star_pulls_banner: PercentilePoint[]
    avg_4star_pulls_type2: PercentilePoint[]
    avg_4star_pulls_type2_banner: PercentilePoint[]
    avg_4star_pulls_type3: PercentilePoint[]
    avg_4star_pulls_type3_banner: PercentilePoint[]
    total_pulls_per_user: PercentilePoint[]
  }
}

// Type assert our imported data
const typedPercentileData = percentileData as PercentileData

const calculatePercentile = (
  value: number,
  data: PercentilePoint[]
): number => {
  // Data is already sorted by percentile in the new format
  for (let i = 0; i < data.length; i++) {
    const dataPoint = data[i]
    if (!dataPoint) continue
    const [percentile, threshold] = dataPoint

    if (value <= threshold) {
      if (i === 0) return 0

      // Linear interpolation between percentiles
      const prevDataPoint = data[i - 1]
      if (!prevDataPoint) continue
      const [prevPercentile, prevThreshold] = prevDataPoint
      if (threshold <= prevThreshold) {
        return (prevPercentile + percentile) / 2
      }
      const ratio = (value - prevThreshold) / (threshold - prevThreshold)
      return prevPercentile + ratio * (percentile - prevPercentile)
    }
  }

  return 100
}

const getThresholdAtPercentile = (
  percentile: number,
  data: PercentilePoint[]
): number => {
  const clampedPercentile = Math.min(100, Math.max(0, percentile))
  const firstDataPoint = data[0]
  if (!firstDataPoint) return 0

  if (clampedPercentile <= firstDataPoint[0]) return firstDataPoint[1]

  for (let i = 1; i < data.length; i++) {
    const dataPoint = data[i]
    const prevDataPoint = data[i - 1]
    if (!dataPoint || !prevDataPoint) continue

    const [currentPercentile, currentThreshold] = dataPoint
    const [previousPercentile, previousThreshold] = prevDataPoint

    if (clampedPercentile <= currentPercentile) {
      const range = currentPercentile - previousPercentile
      if (range <= 0) return currentThreshold

      const ratio = (clampedPercentile - previousPercentile) / range
      return previousThreshold + ratio * (currentThreshold - previousThreshold)
    }
  }

  return data[data.length - 1]?.[1] ?? firstDataPoint[1]
}

const getLuckPercentile = (avg: number, data: PercentilePoint[]): number => {
  // Lower average is better, so we need to invert the percentile
  return 100 - calculatePercentile(avg, data)
}

const getValueForLuckPercentile = (
  luckPercentile: number,
  data: PercentilePoint[]
): number => {
  return getThresholdAtPercentile(100 - luckPercentile, data)
}

export const getAvg5StarPercentile = (avg: number): number => {
  return getLuckPercentile(avg, typedPercentileData.metrics.avg_5star_pulls)
}

export const getBannerAvg5StarPercentile = (avg: number): number => {
  return getLuckPercentile(
    avg,
    typedPercentileData.metrics.avg_5star_pulls_banner
  )
}

export const getAvg5StarValueForLuckPercentile = (
  luckPercentile: number
): number => {
  return getValueForLuckPercentile(
    luckPercentile,
    typedPercentileData.metrics.avg_5star_pulls
  )
}

export const getBannerAvg5StarValueForLuckPercentile = (
  luckPercentile: number
): number => {
  return getValueForLuckPercentile(
    luckPercentile,
    typedPercentileData.metrics.avg_5star_pulls_banner
  )
}

export const getAvg4StarType2Percentile = (avg: number): number => {
  return getLuckPercentile(
    avg,
    typedPercentileData.metrics.avg_4star_pulls_type2
  )
}

export const getBannerAvg4StarType2Percentile = (avg: number): number => {
  return getLuckPercentile(
    avg,
    typedPercentileData.metrics.avg_4star_pulls_type2_banner
  )
}

export const getAvg4StarType3Percentile = (avg: number): number => {
  return getLuckPercentile(
    avg,
    typedPercentileData.metrics.avg_4star_pulls_type3
  )
}

export const getBannerAvg4StarType3Percentile = (avg: number): number => {
  return getLuckPercentile(
    avg,
    typedPercentileData.metrics.avg_4star_pulls_type3_banner
  )
}

export const getAvg4StarType3ValueForLuckPercentile = (
  luckPercentile: number
): number => {
  return getValueForLuckPercentile(
    luckPercentile,
    typedPercentileData.metrics.avg_4star_pulls_type3
  )
}

export const getBannerAvg4StarType3ValueForLuckPercentile = (
  luckPercentile: number
): number => {
  return getValueForLuckPercentile(
    luckPercentile,
    typedPercentileData.metrics.avg_4star_pulls_type3_banner
  )
}

export const getTotalPullsPercentile = (total: number): number => {
  // Higher total is more, so we don't need to invert
  return calculatePercentile(
    total,
    typedPercentileData.metrics.total_pulls_per_user
  )
}
