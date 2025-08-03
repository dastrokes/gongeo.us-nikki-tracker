import percentileData from '~/data/percentile.json'

// Define types for our data structure
type PercentilePoint = [number, number] // [percentile, value]
type PercentileData = {
  generated_at: string
  metrics: {
    avg_5star_pulls: PercentilePoint[]
    avg_4star_pulls_type2: PercentilePoint[]
    avg_4star_pulls_type3: PercentilePoint[]
    total_pulls_per_user: PercentilePoint[]
  }
}

// Type assert our imported data
const typedPercentileData = percentileData as PercentileData

export const usePercentile = () => {
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
        const ratio = (value - prevThreshold) / (threshold - prevThreshold)
        return prevPercentile + ratio * (percentile - prevPercentile)
      }
    }

    return 100
  }

  const getAvg5StarPercentile = (avg: number): number => {
    // Lower average is better, so we need to invert the percentile
    return (
      100 -
      calculatePercentile(avg, typedPercentileData.metrics.avg_5star_pulls)
    )
  }

  const getAvg4StarType2Percentile = (avg: number): number => {
    // Lower average is better, so we need to invert the percentile
    return (
      100 -
      calculatePercentile(
        avg,
        typedPercentileData.metrics.avg_4star_pulls_type2
      )
    )
  }

  const getAvg4StarType3Percentile = (avg: number): number => {
    // Lower average is better, so we need to invert the percentile
    return (
      100 -
      calculatePercentile(
        avg,
        typedPercentileData.metrics.avg_4star_pulls_type3
      )
    )
  }

  const getTotalPullsPercentile = (total: number): number => {
    // Higher total is more, so we don't need to invert
    return calculatePercentile(
      total,
      typedPercentileData.metrics.total_pulls_per_user
    )
  }

  return {
    getAvg5StarPercentile,
    getAvg4StarType2Percentile,
    getAvg4StarType3Percentile,
    getTotalPullsPercentile,
  }
}
