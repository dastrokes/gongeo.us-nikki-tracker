import percentileData from '~/data/percentile.json'

export const usePercentile = () => {
  const calculatePercentile = (
    value: number,
    data: Record<string, number>
  ): number => {
    const percentiles = Object.entries(data).map(([percentile, threshold]) => ({
      percentile: Number(percentile),
      threshold,
    }))

    // Sort by threshold ascending
    percentiles.sort((a, b) => a.threshold - b.threshold)

    // Find the first percentile where the value is less than the threshold
    for (let i = 0; i < percentiles.length; i++) {
      if (value <= percentiles[i].threshold) {
        if (i === 0) return 0

        // Linear interpolation between percentiles
        const prev = percentiles[i - 1]
        const curr = percentiles[i]
        const ratio =
          (value - prev.threshold) / (curr.threshold - prev.threshold)
        return prev.percentile + ratio * (curr.percentile - prev.percentile)
      }
    }

    return 100
  }

  const getAvg5StarPercentile = (avg: number): number => {
    // Lower average is better, so we need to invert the percentile
    return 100 - calculatePercentile(avg, percentileData.avg_5star_pulls)
  }

  const getAvg4StarType2Percentile = (avg: number): number => {
    // Lower average is better, so we need to invert the percentile
    return 100 - calculatePercentile(avg, percentileData.avg_4star_pulls_type2)
  }

  const getAvg4StarType3Percentile = (avg: number): number => {
    // Lower average is better, so we need to invert the percentile
    return 100 - calculatePercentile(avg, percentileData.avg_4star_pulls_type3)
  }

  const getTotalPullsPercentile = (total: number): number => {
    // Higher total is more, so we don't need to invert
    return calculatePercentile(total, percentileData.total_pulls_per_user)
  }

  return {
    getAvg5StarPercentile,
    getAvg4StarType2Percentile,
    getAvg4StarType3Percentile,
    getTotalPullsPercentile,
  }
}
