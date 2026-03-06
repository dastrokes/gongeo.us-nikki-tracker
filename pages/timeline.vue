<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl"
      content-class="!p-2 sm:!p-4"
    >
      <n-card size="small">
        <template v-if="showTimelineChart">
          <div
            class="h-[calc(100vh-210px)] sm:h-[calc(100vh-170px)] min-h-[500px] rounded-xl"
          >
            <VChart
              id="bannerTimelineChart"
              ref="timelineChartRef"
              class="h-full w-full"
              :option="timelineChartOption"
              autoresize
              @datazoom="handleDataZoom"
              @mouseover="handleTimelineMouseover"
              @mouseout="handleTimelineMouseout"
              @click="handleTimelineClick"
              @globalout="clearTimelineHoveredRow"
              @zr:mousewheel="handleZrMousewheel"
            />
          </div>
        </template>
        <div
          v-else
          class="h-[calc(100vh-210px)] sm:h-[calc(100vh-170px)] min-h-[500px] rounded-xl"
        >
          <div class="relative h-full w-full rounded-lg overflow-hidden">
            <div
              class="absolute inset-x-0 top-2 bottom-12 sm:bottom-14 pr-6 sm:pr-8"
            >
              <div class="relative h-full w-full">
                <div
                  v-for="bar in timelineSkeletonBars"
                  :key="bar.key"
                  class="absolute h-3 sm:h-4 rounded-md animate-pulse"
                  :class="timelineSkeletonBarClass[bar.tone]"
                  :style="bar.style"
                />
              </div>
            </div>

            <div
              class="absolute left-3 right-6 sm:right-8 bottom-2 h-4 rounded-full bg-black/10 dark:bg-white/15"
            >
              <div
                class="absolute left-0 top-1/2 h-5 w-2.5 -translate-y-1/2 rounded bg-white/80 dark:bg-slate-200/70 border border-black/10 dark:border-white/20"
              />
              <div
                class="absolute right-0 top-1/2 h-5 w-2.5 -translate-y-1/2 rounded bg-white/80 dark:bg-slate-200/70 border border-black/10 dark:border-white/20"
              />
            </div>

            <div
              class="absolute right-1 top-2 bottom-12 sm:bottom-14 w-4 rounded-full bg-black/10 dark:bg-white/15"
            >
              <div
                class="absolute left-1/2 top-0 h-2.5 w-5 -translate-x-1/2 rounded bg-white/80 dark:bg-slate-200/70 border border-black/10 dark:border-white/20"
              />
              <div
                class="absolute left-1/2 bottom-0 h-2.5 w-5 -translate-x-1/2 rounded bg-white/80 dark:bg-slate-200/70 border border-black/10 dark:border-white/20"
              />
            </div>
          </div>
        </div>
      </n-card>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import type { CustomSeriesRenderItemReturn } from 'echarts'
  import type { ECElementEvent } from 'echarts/core'
  import { useThemeVars } from 'naive-ui'
  import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
  import { BANNER_DATA } from '~/data/banners'
  import type { Banner, BannerRun } from '~/types/banner'
  import { intlLocaleMap, type SupportedLocaleCode } from '~/locales/locales'

  interface TimelineRunRow {
    rowId: string
    rowLabel: string
    bannerId: number
    bannerType: 2 | 3
    runIndex: number
    isRerun: boolean
    versionFull: string
    versionMinor: string
    startDate: string
    endDate: string
    startTs: number
    endTs: number
    bannerName: string
    markerImageUrl: string
    tooltipImageUrl: string
    daysAfterLastActive: number | null
  }

  interface TimelineSeriesDatum {
    value: [number, number, number, number]
    row: TimelineRunRow
  }

  interface BannerTimelineRow {
    bannerId: number
    bannerName: string
    firstStartTs: number
  }

  interface TimelineTooltipParams {
    data?: TimelineSeriesDatum
  }

  interface TimelineRenderParams {
    dataIndex: number
    coordSys?: {
      x: number
      y: number
      width: number
      height: number
    }
  }

  interface TimelineRenderApi {
    value: (dimension: number) => number
    coord: (value: [number, number]) => [number, number]
    size: (value: [number, number]) => [number, number]
  }

  interface TimelineChartRef {
    dispatchAction: (payload: Record<string, unknown>) => void
  }

  interface DataZoomEventPayload {
    dataZoomId?: string
    start?: number
    end?: number
  }

  interface DataZoomEventParams {
    dataZoomId?: string
    start?: number
    end?: number
    batch?: DataZoomEventPayload[]
  }

  interface ZrWheelEventData {
    event?: WheelEvent
    shiftKey?: boolean
    ctrlKey?: boolean
    altKey?: boolean
    metaKey?: boolean
    deltaY?: number
    preventDefault?: () => void
    stopPropagation?: () => void
  }

  interface ZrWheelEventParams {
    event?: ZrWheelEventData
  }

  const { t, locale } = useI18n()
  const localePath = useLocalePath()
  const { getImageSrc } = imageProvider()
  const nuxtImg = useImage()
  const { isDark } = useTheme()
  const palette = usePalette()
  const themeVars = useThemeVars()
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const isMobile = breakpoints.smaller('sm')
  const timelineChartRef = ref<TimelineChartRef | null>(null)
  const timelineHoveredBannerId = ref<number | null>(null)
  const showTimelineChart = ref(false)

  interface TimelineSkeletonBar {
    key: string
    tone: 'blue' | 'gold'
    style: {
      top: string
      left: string
      width: string
    }
  }

  const timelineSkeletonBarClass: Record<TimelineSkeletonBar['tone'], string> =
    {
      blue: 'bg-[#2f7fd6]/70 dark:bg-[#67b9ff]/65',
      gold: 'bg-[#d9922f]/70 dark:bg-[#f6c659]/65',
    }

  const timelineSkeleton = {
    versionCount: 7,
    startLeftPercent: 2,
    goldWidthPercent: 14,
    blueWidthPercent: 6,
    overlapPercent: 0.35,
    goldTopStartPercent: 86,
    rowGapPercent: 3.8,
  } as const

  const timelineSkeletonBars: TimelineSkeletonBar[] = (() => {
    const versionStep =
      timelineSkeleton.goldWidthPercent - timelineSkeleton.overlapPercent
    const topStep = timelineSkeleton.rowGapPercent * 3
    const fourStarOffset =
      timelineSkeleton.goldWidthPercent - timelineSkeleton.blueWidthPercent
    const widths: Record<TimelineSkeletonBar['tone'], string> = {
      blue: `${timelineSkeleton.blueWidthPercent}%`,
      gold: `${timelineSkeleton.goldWidthPercent}%`,
    }
    const bars: TimelineSkeletonBar[] = []

    for (
      let versionIndex = 0;
      versionIndex < timelineSkeleton.versionCount;
      versionIndex += 1
    ) {
      const versionNumber = versionIndex + 1
      const goldLeft =
        timelineSkeleton.startLeftPercent + versionIndex * versionStep
      const blueLeft = goldLeft + fourStarOffset
      const goldTop =
        timelineSkeleton.goldTopStartPercent - versionIndex * topStep

      bars.push(
        {
          key: `timeline-v${versionNumber}-4a`,
          tone: 'blue',
          style: {
            top: `${goldTop - timelineSkeleton.rowGapPercent * 2}%`,
            left: `${blueLeft}%`,
            width: widths.blue,
          },
        },
        {
          key: `timeline-v${versionNumber}-4b`,
          tone: 'blue',
          style: {
            top: `${goldTop - timelineSkeleton.rowGapPercent}%`,
            left: `${blueLeft}%`,
            width: widths.blue,
          },
        },
        {
          key: `timeline-v${versionNumber}-5`,
          tone: 'gold',
          style: {
            top: `${goldTop}%`,
            left: `${goldLeft}%`,
            width: widths.gold,
          },
        }
      )
    }

    return bars
  })()

  onMounted(() => {
    showTimelineChart.value = true
  })

  const isTimelineBanner = (
    banner: Banner
  ): banner is Banner & { bannerType: 2 | 3 } =>
    banner.bannerType === 2 || banner.bannerType === 3

  const getVersionMinor = (version: string) => {
    const [major = '', minor = ''] = version.split('.')
    return major && minor ? `${major}.${minor}` : version
  }

  const toStartTimestamp = (date: string) =>
    new Date(`${date}T00:00:00`).getTime()
  const toEndTimestamp = (date: string) =>
    new Date(`${date}T23:59:59`).getTime()
  const DAY_IN_MS = 24 * 60 * 60 * 1000
  const getLocalTodayDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const getDaysAfterDate = (currentDate: string, previousDate: string) =>
    Math.max(
      0,
      Math.floor(
        (new Date(`${currentDate}T00:00:00`).getTime() -
          new Date(`${previousDate}T00:00:00`).getTime()) /
          DAY_IN_MS
      )
    )

  const timelineLocale = computed(() => {
    const code = locale.value as SupportedLocaleCode
    return intlLocaleMap[code] ?? intlLocaleMap.en
  })

  const dateFormatter = computed(
    () =>
      new Intl.DateTimeFormat(timelineLocale.value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
  )

  const chartTooltipExtraCssText = computed(
    () => `box-shadow: ${themeVars.value.boxShadow2}; border-radius: 8px;`
  )

  const axisLabelDateFormatter = computed(
    () =>
      new Intl.DateTimeFormat(timelineLocale.value, {
        month: isMobile.value ? 'numeric' : 'short',
        year: '2-digit',
      })
  )

  const timelineZoomFillerColor = computed(() =>
    isDark.value ? '#9db2db3a' : '#5d7bc01f'
  )
  const timelineZoomBackgroundColor = computed(() =>
    isDark.value ? '#00000012' : '#0000000c'
  )
  const timelineZoomHandleIcon =
    'path://M11,1h6a3,3 0 0 1 3,3v20a3,3 0 0 1-3,3h-6a3,3 0 0 1-3-3V4a3,3 0 0 1 3-3z'
  const timelineZoomHandleStyle = computed(() => ({
    color: isDark.value ? '#edf2fb' : '#ffffff',
    borderColor: isDark.value ? '#5c6b86' : '#94a3b8',
    borderWidth: 1,
    shadowBlur: 8,
    shadowColor: isDark.value ? 'rgba(0, 0, 0, 0.4)' : 'rgba(15, 23, 42, 0.16)',
  }))

  const timelineBanners = computed(() =>
    Object.values(BANNER_DATA).filter(isTimelineBanner)
  )

  const normalizedRows = computed<TimelineRunRow[]>(() => {
    const rerunText = t('default.rerun')
    const todayDate = getLocalTodayDateString()

    return timelineBanners.value.flatMap((banner) => {
      const bannerName = t(`banner.${banner.bannerId}.name`)
      const bannerImageSrc = getImageSrc('bannerThumb', banner.bannerId)
      const latestRunEndDate = banner.runs[banner.runs.length - 1]?.end
      const daysAfterLastActive = latestRunEndDate
        ? getDaysAfterDate(todayDate, latestRunEndDate)
        : 0
      const markerImageUrl = nuxtImg(bannerImageSrc, {
        width: 160,
        height: 80,
        quality: 80,
        format: 'webp',
      })
      const tooltipImageUrl = nuxtImg(bannerImageSrc, {
        width: 320,
        height: 160,
        quality: 80,
        format: 'webp',
      })

      return banner.runs.map((run: BannerRun, runIndex: number) => {
        const isRerun = runIndex > 0
        const versionMinor = getVersionMinor(run.version)
        const rowLabel = `${t('banner.version')} ${run.version} · ${bannerName}${isRerun ? ` · ${rerunText}` : ''}`

        return {
          rowId: `${banner.bannerId}-${run.start}-${runIndex}`,
          rowLabel,
          bannerId: banner.bannerId,
          bannerType: banner.bannerType,
          runIndex,
          isRerun,
          versionFull: run.version,
          versionMinor,
          startDate: run.start,
          endDate: run.end,
          startTs: toStartTimestamp(run.start),
          endTs: toEndTimestamp(run.end),
          bannerName,
          markerImageUrl,
          tooltipImageUrl,
          daysAfterLastActive,
        } satisfies TimelineRunRow
      })
    })
  })

  const bannerRows = computed<BannerTimelineRow[]>(() => {
    const groupedRows = new Map<number, BannerTimelineRow>()

    normalizedRows.value.forEach((row) => {
      const existingRow = groupedRows.get(row.bannerId)

      if (!existingRow) {
        groupedRows.set(row.bannerId, {
          bannerId: row.bannerId,
          bannerName: row.bannerName,
          firstStartTs: row.startTs,
        })
        return
      }

      if (row.startTs < existingRow.firstStartTs) {
        existingRow.firstStartTs = row.startTs
      }
    })

    return [...groupedRows.values()].sort(
      (left, right) => left.firstStartTs - right.firstStartTs
    )
  })

  const bannerRowIndexMap = computed(() => {
    const map = new Map<number, number>()
    bannerRows.value.forEach((row, index) => {
      map.set(row.bannerId, index)
    })
    return map
  })

  const yZoomWindow = ref({
    start: 0,
    end: 100,
  })

  const timelineRange = computed(() => {
    if (normalizedRows.value.length === 0) {
      const now = Date.now()
      return {
        min: now,
        max: now,
      }
    }

    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    normalizedRows.value.forEach((row) => {
      if (row.startTs < min) min = row.startTs
      if (row.endTs > max) max = row.endTs
    })

    return {
      min,
      max,
    }
  })

  const timelinePaddingMs = computed(() => {
    const span = Math.max(0, timelineRange.value.max - timelineRange.value.min)
    return Math.max(DAY_IN_MS, Math.round(span * 0.008))
  })

  const timelineSeriesData = computed<TimelineSeriesDatum[]>(() =>
    normalizedRows.value
      .map((row): TimelineSeriesDatum | null => {
        const rowIndex = bannerRowIndexMap.value.get(row.bannerId)
        if (rowIndex === undefined) return null

        return {
          value: [row.startTs, row.endTs, rowIndex, row.bannerType],
          row,
        }
      })
      .filter((entry): entry is TimelineSeriesDatum => entry !== null)
  )

  const getBannerTypeColor = (type: number) => {
    if (type === 2) {
      return isDark.value ? '#f6c659cc' : '#d9922f'
    }

    return isDark.value ? '#67b9ffcc' : '#2f7fd6'
  }

  const renderTimelineItem = (
    params: TimelineRenderParams,
    api: TimelineRenderApi,
    hoveredBannerId: number | null
  ): CustomSeriesRenderItemReturn => {
    if (!params.coordSys) return null

    const startCoord = api.coord([api.value(0), api.value(2)])
    const endCoord = api.coord([api.value(1), api.value(2)])
    const rowHeight = api.size([0, 1])[1]

    const row = timelineSeriesData.value[params.dataIndex]?.row
    const availableBarHeight = Math.max(2, rowHeight - 2)
    const preferredBarHeight = rowHeight * (isMobile.value ? 0.66 : 0.74)
    const minBarHeight = isMobile.value ? 5 : 7
    const barHeight = Math.min(
      availableBarHeight,
      Math.max(minBarHeight, preferredBarHeight)
    )
    const x = Math.min(startCoord[0], endCoord[0])
    const width = Math.max(Math.abs(endCoord[0] - startCoord[0]), 3)
    const y = startCoord[1] - barHeight / 2
    const barRadius = 4

    const chartLeft = params.coordSys.x
    const chartRight = params.coordSys.x + params.coordSys.width
    if (x > chartRight || x + width < chartLeft) {
      return null
    }

    const markerHeight = barHeight
    const markerWidth = markerHeight * 2
    const markerX = width < markerWidth ? x + (width - markerWidth) / 2 : x
    const markerY = y
    const minMarkerRenderHeight = isMobile.value ? 24 : 32
    const canRenderMarker = markerHeight >= minMarkerRenderHeight
    const isHoveredRow =
      row?.bannerId !== undefined && hoveredBannerId === row.bannerId

    return {
      type: 'group',
      children: [
        {
          type: 'rect',
          z2: isHoveredRow ? 8 : 2,
          shape: {
            x,
            y,
            width,
            height: barHeight,
            r: barRadius,
          },
          style: {
            fill: getBannerTypeColor(api.value(3)),
            stroke: isHoveredRow
              ? isDark.value
                ? '#ffffffcc'
                : '#0f172acc'
              : isDark.value
                ? '#ffffff55'
                : '#00000030',
            lineWidth: isHoveredRow ? 2 : 1,
            lineDash: row?.isRerun ? [4, 3] : undefined,
            shadowBlur: isHoveredRow ? 10 : 0,
            shadowColor: isHoveredRow
              ? isDark.value
                ? 'rgba(255, 255, 255, 0.35)'
                : 'rgba(15, 23, 42, 0.25)'
              : 'transparent',
          },
        },
        ...(row && canRenderMarker
          ? [
              {
                type: 'image' as const,
                z2: isHoveredRow ? 9 : 3,
                style: {
                  image: row.markerImageUrl,
                  x: markerX,
                  y: markerY,
                  width: markerWidth,
                  height: markerHeight,
                },
                clipPath: {
                  type: 'rect' as const,
                  shape: {
                    x,
                    y,
                    width,
                    height: barHeight,
                    r: barRadius,
                  },
                },
                silent: true,
              },
            ]
          : []),
      ],
    }
  }

  const timelineChartOption = computed(() => {
    const hoveredBannerId = timelineHoveredBannerId.value

    return {
      animation: false,
      textStyle: {
        fontFamily:
          "'Outfit', ui-sans-serif, system-ui, sans-serif, 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
        color: isDark.value ? palette.textDark : palette.textLight,
      },
      tooltip: {
        trigger: 'item',
        confine: true,
        appendToBody: true,
        formatter: (params: TimelineTooltipParams) => {
          const row = params.data?.row
          if (!row) return ''

          const versionText = `${t('banner.version')} ${row.versionFull}`
          const seasonText = t(`version.${row.versionMinor}`)
          const hasSeasonText = seasonText !== `version.${row.versionMinor}`
          const startDateText = dateFormatter.value.format(
            new Date(`${row.startDate}T00:00:00`)
          )
          const endDateText = dateFormatter.value.format(
            new Date(`${row.endDate}T00:00:00`)
          )
          const dateRange = `${startDateText} - ${endDateText}`
          const todayDate = getLocalTodayDateString()
          const isCurrentBanner =
            todayDate >= row.startDate && todayDate <= row.endDate
          const statusText = isCurrentBanner
            ? t('default.current_banners')
            : row.daysAfterLastActive === null
              ? ''
              : t('timeline.banner_timer', {
                  days: row.daysAfterLastActive,
                })
          const wrapTextStyle =
            'white-space:normal;overflow-wrap:anywhere;word-break:break-word;'
          const containerStyle = `display:flex;flex-direction:column;gap:2px;max-width:160px;${wrapTextStyle}`
          const titleStyle = `font-weight:700;font-size:16px;${wrapTextStyle}`
          const subtitleStyle = `font-size:12px;opacity:0.9;${wrapTextStyle}`
          const metaStyle = `font-size:10px;opacity:0.9;${wrapTextStyle}`
          const rerunBadgeStyle = `display:inline-block;padding:1px 6px;border-radius:999px;font-size:10px;background:${isDark.value ? '#ffffff2e' : '#00000015'}`
          const rerunBadge = row.isRerun
            ? `<span style="${rerunBadgeStyle}">${t('default.rerun')}</span>`
            : ''
          const statusHtml = statusText
            ? `<div style="${metaStyle}">${statusText}</div>`
            : ''

          return `
          <div style="${containerStyle}">
            <div style="${titleStyle}">
              ${row.bannerName}
            </div>
            ${rerunBadge ? `<div style="line-height:1;">${rerunBadge}</div>` : ''}
            <div style="${subtitleStyle}">
              ${versionText}${hasSeasonText ? ` · ${seasonText}` : ''}
            </div>
            <div style="${metaStyle}">
              ${dateRange}
            </div>
            ${statusHtml}
            <img
              src="${row.tooltipImageUrl}"
              alt="${row.bannerName}"
              style="width:100%;aspect-ratio:2 / 1;height:auto;object-fit:cover;border-radius:8px;"
            />
          </div>
        `
        },
        backgroundColor: isDark.value ? palette.dark : palette.light,
        borderColor: isDark.value ? '#5f6368' : '#ddd5d8',
        borderWidth: 1,
        padding: 10,
        textStyle: {
          color: isDark.value ? palette.textDark : palette.textLight,
        },
        extraCssText: chartTooltipExtraCssText.value,
      },
      grid: {
        top: 10,
        left: 10,
        right: 40,
        bottom: 60,
      },
      xAxis: {
        type: 'time',
        min: timelineRange.value.min - timelinePaddingMs.value,
        max: timelineRange.value.max + timelinePaddingMs.value,
        splitLine: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            color: isDark.value ? '#b7bcc6' : '#8a8f98',
          },
        },
        axisLabel: {
          margin: 10,
          formatter: (value: number) =>
            axisLabelDateFormatter.value.format(new Date(value)),
        },
      },
      yAxis: {
        type: 'category',
        data: bannerRows.value.map((_, index) => String(index)),
        splitLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
      },
      dataZoom: [
        {
          id: 'timeline-x-inside-zoom',
          type: 'inside',
          xAxisIndex: 0,
          zoomLock: isMobile.value,
          zoomOnMouseWheel: 'shift',
          moveOnMouseWheel: 'ctrl',
          moveOnMouseMove: true,
          filterMode: 'weakFilter',
        },
        {
          id: 'timeline-y-inside-zoom',
          type: 'inside',
          yAxisIndex: 0,
          zoomLock: isMobile.value,
          zoomOnMouseWheel: false,
          moveOnMouseWheel: false,
          moveOnMouseMove: true,
          filterMode: 'filter',
        },
        {
          id: 'timeline-x-slider-zoom',
          type: 'slider',
          xAxisIndex: 0,
          bottom: 8,
          height: 16,
          brushSelect: false,
          showDetail: false,
          filterMode: 'weakFilter',
          borderColor: 'transparent',
          fillerColor: timelineZoomFillerColor.value,
          backgroundColor: timelineZoomBackgroundColor.value,
          handleSize: 20,
          handleIcon: timelineZoomHandleIcon,
          handleStyle: timelineZoomHandleStyle.value,
        },
        {
          id: 'timeline-y-slider-zoom',
          type: 'slider',
          yAxisIndex: 0,
          orient: 'vertical',
          right: 4,
          top: 16,
          bottom: 60,
          width: 16,
          start: yZoomWindow.value.start,
          end: yZoomWindow.value.end,
          showDetail: false,
          brushSelect: false,
          filterMode: 'filter',
          borderColor: 'transparent',
          fillerColor: timelineZoomFillerColor.value,
          backgroundColor: timelineZoomBackgroundColor.value,
          handleSize: 20,
          handleIcon: timelineZoomHandleIcon,
          handleStyle: timelineZoomHandleStyle.value,
        },
      ],
      series: [
        {
          type: 'custom',
          clip: true,
          renderItem: (params: TimelineRenderParams, api: TimelineRenderApi) =>
            renderTimelineItem(params, api, hoveredBannerId),
          encode: {
            x: [0, 1],
            y: 2,
            tooltip: [0, 1],
          },
          data: timelineSeriesData.value,
        },
      ],
    }
  })

  const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

  const updateYZoomWindow = (start: number, end: number) => {
    yZoomWindow.value = {
      start: clampPercent(start),
      end: clampPercent(end),
    }
  }

  const handleDataZoom = (params: DataZoomEventParams) => {
    const payloads = params.batch?.length ? params.batch : [params]
    const yPayload = payloads.find(
      (payload) =>
        payload.dataZoomId === 'timeline-y-slider-zoom' ||
        payload.dataZoomId === 'timeline-y-inside-zoom'
    )

    if (yPayload?.start === undefined || yPayload.end === undefined) {
      return
    }

    updateYZoomWindow(yPayload.start, yPayload.end)
  }

  const isTimelineSeriesDatum = (
    value: unknown
  ): value is TimelineSeriesDatum => {
    if (!value || typeof value !== 'object') {
      return false
    }

    const row = (value as TimelineSeriesDatum).row
    return Boolean(row && typeof row.bannerId === 'number')
  }

  const clearTimelineHoveredRow = () => {
    timelineHoveredBannerId.value = null
  }

  const handleTimelineMouseover = (params: ECElementEvent) => {
    if (!isTimelineSeriesDatum(params.data)) {
      return
    }

    timelineHoveredBannerId.value = params.data.row.bannerId
  }

  const handleTimelineMouseout = () => {
    clearTimelineHoveredRow()
  }

  const handleTimelineClick = (params: ECElementEvent) => {
    if (isMobile.value || !isTimelineSeriesDatum(params.data)) {
      return
    }

    navigateTo(localePath(`/banners/${params.data.row.bannerId}`))
  }

  const handleZrMousewheel = (params: ZrWheelEventParams) => {
    const zrEvent = params.event
    const nativeEvent = zrEvent?.event

    if (!zrEvent) {
      return
    }

    const isShift = Boolean(zrEvent.shiftKey ?? nativeEvent?.shiftKey)
    const isCtrl = Boolean(zrEvent.ctrlKey ?? nativeEvent?.ctrlKey)
    const isAlt = Boolean(zrEvent.altKey ?? nativeEvent?.altKey)
    const isMeta = Boolean(zrEvent.metaKey ?? nativeEvent?.metaKey)

    if (isShift || isCtrl || isMeta) {
      return
    }

    if (bannerRows.value.length <= 1) {
      return
    }

    const deltaY = nativeEvent?.deltaY ?? zrEvent.deltaY ?? 0
    if (!deltaY) {
      return
    }

    nativeEvent?.preventDefault()
    zrEvent.preventDefault?.()
    zrEvent.stopPropagation?.()

    const currentStart = yZoomWindow.value.start
    const currentEnd = yZoomWindow.value.end
    const windowSize = Math.max(1, currentEnd - currentStart)
    let nextStart = currentStart
    let nextEnd = currentEnd

    if (isAlt) {
      const minWindowSize = Math.max(
        2,
        100 / Math.max(1, bannerRows.value.length)
      )
      const zoomStep = Math.max(2, Math.min(16, windowSize * 0.18))
      const nextWindowSize =
        deltaY > 0
          ? Math.min(100, windowSize + zoomStep)
          : Math.max(minWindowSize, windowSize - zoomStep)
      const center = (currentStart + currentEnd) / 2
      const maxStart = Math.max(0, 100 - nextWindowSize)
      nextStart = clampPercent(
        Math.min(maxStart, Math.max(0, center - nextWindowSize / 2))
      )
      nextEnd = clampPercent(nextStart + nextWindowSize)
    } else {
      const step = Math.max(1, Math.min(8, windowSize * 0.14))
      const direction = deltaY > 0 ? -1 : 1
      const maxStart = Math.max(0, 100 - windowSize)
      nextStart = clampPercent(
        Math.min(maxStart, Math.max(0, currentStart + direction * step))
      )
      nextEnd = clampPercent(nextStart + windowSize)
    }

    updateYZoomWindow(nextStart, nextEnd)

    timelineChartRef.value?.dispatchAction({
      type: 'dataZoom',
      dataZoomId: 'timeline-y-slider-zoom',
      start: nextStart,
      end: nextEnd,
    })
  }

  useSeoMeta({
    title: () =>
      `${t('navigation.timeline')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('meta.description.timeline'),
    ogTitle: () =>
      `${t('navigation.timeline')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () => t('meta.description.timeline'),
    twitterTitle: () =>
      `${t('navigation.timeline')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () => t('meta.description.timeline'),
  })
</script>
