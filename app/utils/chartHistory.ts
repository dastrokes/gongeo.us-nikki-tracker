import { format } from 'echarts/core'

export const createBannerChartLabelFormatter = (
  width: number,
  fontFamily: string
) => {
  const font = `12px ${fontFamily}`
  return (value: string) => {
    const name = value.replace(/\s+/g, ' ').trim()
    const firstLine = format.truncateText(name, width, font, '')
    if (firstLine === name) return name

    const wordBoundary = firstLine.lastIndexOf(' ')
    const breakAt = wordBoundary > 0 ? wordBoundary : firstLine.length
    return `${name.slice(0, breakAt).trimEnd()}\n${format.truncateText(
      name.slice(breakAt).trimStart(),
      width,
      font,
      '…'
    )}`
  }
}

export const getMobileBannerChartHeight = (
  count: number,
  headerHeight = 52,
  rowHeight = 44
) => `${Math.max(320, count * rowHeight + headerHeight)}px`
