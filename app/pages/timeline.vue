<template>
  <div
    class="mx-auto max-w-7xl space-y-2 sm:space-y-4"
    :style="{ '--timeline-toolbar-height': `${timelineToolbarHeight}px` }"
  >
    <n-card
      size="small"
      class="rounded-xl"
      content-class="p-2 sm:p-4"
    >
      <BannerWishlistToolbar
        ref="timelineToolbarRef"
        v-model:value="wishlistOnly"
        class="mb-3"
      >
        <n-tooltip :show-arrow="false">
          <template #trigger>
            <n-button
              size="small"
              secondary
              :aria-label="t('banner.browse')"
              @click="
                navigateTo(
                  localePath({
                    path: '/banners',
                    query: wishlistOnly ? { wishlist: '1' } : {},
                  })
                )
              "
            >
              <template #icon>
                <n-icon size="16"><ListUl /></n-icon>
              </template>
              {{ t('banner.browse') }}
            </n-button>
          </template>
          {{ t('banner.browse') }}
        </n-tooltip>
        <template #filters>
          <div class="flex flex-wrap items-center gap-2 sm:justify-end">
            <n-select
              v-model:value="timelineSortOrder"
              size="small"
              class="w-40 shrink-0"
              :options="timelineSortOptions"
              :show-checkmark="false"
              :consistent-menu-width="false"
              :aria-label="t('timeline.sort.label')"
            />
            <div class="w-40 shrink-0">
              <CompendiumQualityFilter
                v-model:value="timelineQualityFilter"
                :quality-options="[5, 4]"
              />
            </div>
          </div>
        </template>
      </BannerWishlistToolbar>
      <n-card size="small">
        <n-empty
          v-if="wishlistOnly && wishlistReady && timelineBanners.length === 0"
          class="py-12"
        >
          <template #icon
            ><n-icon><HeartRegular /></n-icon
          ></template>
          <template #default>
            <p class="text-sm font-medium text-slate-700 dark:text-slate-200">
              {{ t(wishCount ? 'wishlist.no_matches' : 'wishlist.empty') }}
            </p>
          </template>
          <template #extra>
            <n-button
              size="small"
              secondary
              type="primary"
              @click="resetTimelineWishlistFilters"
              >{{ t(wishCount ? 'common.clear' : 'banner.browse') }}</n-button
            >
          </template>
        </n-empty>
        <n-collapse-transition
          v-else
          mode="out-in"
          appear
        >
          <div
            v-if="showTimelineChart"
            key="chart"
            class="relative rounded-xl"
            :class="
              wishlistOnly && timelineBanners.length < 6
                ? 'h-64 sm:h-80'
                : 'h-[calc(100vh-116px-var(--timeline-toolbar-height)-12px)] min-h-125 sm:h-[calc(100vh-148px-var(--timeline-toolbar-height)-12px)]'
            "
          >
            <VChart
              id="bannerTimelineChart"
              ref="timelineChartRef"
              class="h-full w-full"
              :option="timelineChartOption"
              manual-update
              autoresize
              @datazoom="handleDataZoom"
              @finished="handleTimelineChartFinished"
              @mouseover="handleTimelineMouseover"
              @mouseout="handleTimelineMouseout"
              @click="handleTimelineClick"
              @globalout="clearTimelineHoveredRow"
              @zr:mousedown="disableTimelineChartAnimation"
              @zr:mousewheel="handleZrMousewheel"
            />
            <div class="absolute right-0.5 bottom-1 z-10">
              <n-tooltip placement="left">
                <template #trigger>
                  <n-button
                    size="tiny"
                    text
                    class="shadow-lg shadow-slate-900/10 transition-all duration-200 hover:scale-110 active:scale-95 dark:shadow-black/25"
                    :aria-label="timelineZoomButtonLabel"
                    @click="resetTimelineZoom"
                  >
                    <template #icon>
                      <n-icon
                        :depth="3"
                        :component="timelineZoomButtonIcon"
                      />
                    </template>
                  </n-button>
                </template>
                {{ timelineZoomButtonLabel }}
              </n-tooltip>
            </div>
          </div>
          <div
            v-else
            key="skeleton"
            class="rounded-xl"
            :class="
              wishlistOnly && timelineBanners.length < 6
                ? 'h-64 sm:h-80'
                : 'h-[calc(100vh-116px-var(--timeline-toolbar-height)-12px)] min-h-125 sm:h-[calc(100vh-148px-var(--timeline-toolbar-height)-12px)]'
            "
          >
            <div class="relative h-full w-full overflow-hidden rounded-lg">
              <div
                class="absolute inset-x-0 top-4 bottom-12 pr-6 sm:bottom-14 sm:pr-8"
              >
                <div class="relative h-full w-full">
                  <div
                    v-for="bar in timelineSkeletonBars"
                    :key="bar.key"
                    class="absolute h-3 animate-pulse rounded-md sm:h-4"
                    :class="timelineSkeletonBarClass[bar.tone]"
                    :style="bar.style"
                  />
                </div>
              </div>

              <div
                class="absolute right-6 bottom-2 left-3 h-4 rounded-full bg-black/10 sm:right-8 dark:bg-white/15"
              >
                <div
                  class="absolute top-1/2 left-0 h-5 w-2.5 -translate-y-1/2 rounded-sm border border-black/10 bg-white/80 dark:border-white/20 dark:bg-slate-200/70"
                />
                <div
                  class="absolute top-1/2 right-0 h-5 w-2.5 -translate-y-1/2 rounded-sm border border-black/10 bg-white/80 dark:border-white/20 dark:bg-slate-200/70"
                />
              </div>

              <div
                class="absolute top-4 right-1 bottom-12 w-4 rounded-full bg-black/10 sm:bottom-14 dark:bg-white/15"
              >
                <div
                  class="absolute top-0 left-1/2 h-2.5 w-5 -translate-x-1/2 rounded-sm border border-black/10 bg-white/80 dark:border-white/20 dark:bg-slate-200/70"
                />
                <div
                  class="absolute bottom-0 left-1/2 h-2.5 w-5 -translate-x-1/2 rounded-sm border border-black/10 bg-white/80 dark:border-white/20 dark:bg-slate-200/70"
                />
              </div>
            </div>
          </div>
        </n-collapse-transition>
      </n-card>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import type { ComponentPublicInstance } from 'vue'
  import { HeartRegular, ListUl, SearchMinus, SearchPlus } from '@vicons/fa'
  import type { CustomSeriesRenderItemReturn } from 'echarts'
  import type { ECElementEvent, ECharts } from 'echarts/core'
  import type { SelectOption } from 'naive-ui'
  import { breakpointsTailwind } from '@vueuse/core'
  import { BANNER_DATA } from '~~/data/banners'

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
    id: string
    value: [number, number, number, number, string]
    row: TimelineRunRow
  }

  type TimelineSortOrder = 'newest' | 'oldest' | 'longest_gap' | 'shortest_gap'
  type TimelineQualityFilter = 4 | 5 | null

  interface BannerTimelineRow {
    bannerId: number
    bannerName: string
    firstStartTs: number
    latestEndTs: number
    daysAfterLastActive: number
  }

  interface TimelineTooltipParams {
    data?: TimelineSeriesDatum
  }

  interface TimelineTooltipRun {
    key: string
    versionFull: string
    versionMinor: string
    startDate: string
    endDate: string
    isRerun: boolean
    gapDaysSincePrevious: number | null
  }

  interface TimelineTooltipBanner {
    bannerId: number
    bannerName: string
    tooltipImageUrl: string
    daysAfterLastActive: number
    isCurrentBanner: boolean
    runs: TimelineTooltipRun[]
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
    chart?: ECharts
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

  interface ZoomWindow {
    start: number
    end: number
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

  const { t } = useI18n()
  const localePath = useLocalePath()
  const { getImageSrc } = imageProvider()
  const nuxtImg = useImage()
  const { isDark } = useTheme()
  const palette = usePalette()
  const themeVars = useThemeVars()
  const route = useRoute()
  const router = useRouter()
  const wishlistOnly = computed({
    get: () => route.query.wishlist === '1',
    set: (enabled: boolean) => {
      void router.replace({
        query: { ...route.query, wishlist: enabled ? '1' : undefined },
        hash: route.hash,
      })
    },
  })
  const {
    savedBannerIds,
    count: wishCount,
    isSaved,
    ready: wishlistReady,
  } = useBannerWishlist()
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const isMobile = breakpoints.smaller('sm')
  const timelineToolbarRef = ref<ComponentPublicInstance | null>(null)
  const { height: timelineToolbarHeight } = useElementSize(timelineToolbarRef, {
    width: 0,
    height: 28,
  })
  const timelineChartRef = ref<TimelineChartRef | null>(null)
  const timelineHoveredBannerId = ref<number | null>(null)
  const showTimelineChart = ref(false)
  // Finishing an animation must not trigger another chart option update.
  let timelineChartAnimationEnabled = true
  const timelineSortOrder = ref<TimelineSortOrder>('newest')
  const timelineQualityFilter = ref<TimelineQualityFilter>(null)
  const resetTimelineWishlistFilters = () => {
    timelineQualityFilter.value = null
    if (!wishCount.value) navigateTo(localePath('/banners'))
  }

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
      blue: 'bg-sky-500/70 dark:bg-sky-400/65',
      gold: 'bg-amber-500/70 dark:bg-amber-400/65',
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

  const disableTimelineChartAnimation = () => {
    timelineChartAnimationEnabled = false
  }

  const handleTimelineChartFinished = () => {
    disableTimelineChartAnimation()
  }

  watch(timelineSortOrder, (nextOrder, previousOrder) => {
    if (nextOrder === previousOrder) {
      return
    }

    timelineChartAnimationEnabled = true
  })

  watch(
    [
      timelineQualityFilter,
      wishlistOnly,
      () => Array.from(savedBannerIds.value).join(','),
    ],
    () => {
      clearTimelineHoveredRow()
      timelineChartAnimationEnabled = true
      xZoomWindow.value = createDefaultZoomWindow()
      yZoomWindow.value = createDefaultZoomWindow()
    }
  )

  const isTimelineBanner = (
    banner: Banner
  ): banner is Banner & { bannerType: 2 | 3 } =>
    banner.bannerType === 2 || banner.bannerType === 3

  const getVersionMinor = (version: string) => {
    const [major = '', minor = ''] = version.split('.')
    return major && minor ? `${major}.${minor}` : version
  }

  const DAY_IN_MS = 24 * 60 * 60 * 1000
  const getDaysAfterDate = (currentTime: number, previousDate: string) =>
    Math.max(
      0,
      Math.floor(
        (currentTime - getBannerDateTimestamp(previousDate)) / DAY_IN_MS
      )
    )
  const getGapDaysBetweenRunPeriods = (
    currentStartDate: string,
    previousEndDate: string
  ) =>
    Math.max(
      0,
      Math.floor(
        (getBannerDateTimestamp(currentStartDate) -
          getBannerDateTimestamp(previousEndDate)) /
          DAY_IN_MS
      ) - 1
    )

  const timelineLocale = useIntlLocale()

  const dateFormatter = computed(
    () =>
      new Intl.DateTimeFormat(timelineLocale.value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
  )

  const formatTimelineDate = (date: string) =>
    dateFormatter.value.format(getBannerDateTime(date))

  const chartTooltipExtraCssText = computed(
    () => `box-shadow: ${themeVars.value.boxShadow2}; border-radius: 8px;`
  )

  const axisLabelDateFormatter = computed(() => {
    const showDay =
      wishlistOnly.value &&
      timelineRange.value.max - timelineRange.value.min < 180 * DAY_IN_MS

    return new Intl.DateTimeFormat(timelineLocale.value, {
      month: isMobile.value ? 'numeric' : 'short',
      day: showDay ? 'numeric' : undefined,
      year: showDay ? undefined : '2-digit',
    })
  })

  const timelineZoomFillerColor = computed(() =>
    isDark.value ? '#9db2db3a' : '#5d7bc01f'
  )
  const timelineZoomBackgroundColor = computed(() =>
    isDark.value ? '#00000012' : '#0000000c'
  )
  const timelineZoomHandleIcon =
    'path://M7,1h10a4,4 0 0 1 4,4v18a4,4 0 0 1-4,4H7a4,4 0 0 1-4-4V5a4,4 0 0 1 4-4z'
  const timelineZoomHandleStyle = computed(() => ({
    color: isDark.value ? '#edf2fb' : '#ffffff',
    borderColor: isDark.value ? '#5c6b86' : '#94a3b8',
    borderWidth: 1,
    shadowBlur: 8,
    shadowColor: isDark.value ? 'rgba(0, 0, 0, 0.4)' : 'rgba(15, 23, 42, 0.16)',
  }))

  const timelineBanners = computed(() =>
    Object.values(BANNER_DATA)
      .filter(isTimelineBanner)
      .filter((banner) => !wishlistOnly.value || isSaved(banner.bannerId))
      .filter((banner) => {
        if (timelineQualityFilter.value === 5) return banner.bannerType === 2
        if (timelineQualityFilter.value === 4) return banner.bannerType === 3
        return true
      })
  )

  const timelineSortOptions = computed<SelectOption[]>(() => [
    {
      label: t('common.sort.newest_first'),
      value: 'newest',
    },
    {
      label: t('common.sort.oldest_first'),
      value: 'oldest',
    },
    {
      label: t('timeline.sort.longest_gap'),
      value: 'longest_gap',
    },
    {
      label: t('timeline.sort.shortest_gap'),
      value: 'shortest_gap',
    },
  ])

  const normalizedRows = computed<TimelineRunRow[]>(() => {
    const rerunText = t('default.rerun')
    const now = Date.now()

    return timelineBanners.value.flatMap((banner) => {
      const bannerName = t(`banner.${banner.bannerId}.name`)
      const bannerImageSrc = getImageSrc('bannerThumb', banner.bannerId)
      const latestRunEndDate = banner.runs[banner.runs.length - 1]?.end
      const daysAfterLastActive = latestRunEndDate
        ? getDaysAfterDate(now, latestRunEndDate)
        : 0
      const markerImageUrl = nuxtImg(
        bannerImageSrc,
        {},
        {
          preset: 'bannerThumb',
        }
      )
      const tooltipImageUrl = nuxtImg(
        bannerImageSrc,
        {},
        {
          preset: 'bannerThumb',
        }
      )

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
          startTs: getBannerDateTimestamp(run.start),
          endTs: getBannerDateTimestamp(run.end),
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
          latestEndTs: row.endTs,
          daysAfterLastActive: row.daysAfterLastActive ?? 0,
        })
        return
      }

      if (row.startTs < existingRow.firstStartTs) {
        existingRow.firstStartTs = row.startTs
      }

      if (row.endTs > existingRow.latestEndTs) {
        existingRow.latestEndTs = row.endTs
      }

      if ((row.daysAfterLastActive ?? 0) > existingRow.daysAfterLastActive) {
        existingRow.daysAfterLastActive = row.daysAfterLastActive ?? 0
      }
    })

    return [...groupedRows.values()].sort((left, right) => {
      // ECharts category rows render from bottom to top unless `yAxis.inverse`
      // is enabled, so these comparators are reversed from the visible label.
      if (timelineSortOrder.value === 'oldest') {
        return (
          right.firstStartTs - left.firstStartTs ||
          right.latestEndTs - left.latestEndTs ||
          right.bannerId - left.bannerId
        )
      }

      if (timelineSortOrder.value === 'longest_gap') {
        return (
          left.daysAfterLastActive - right.daysAfterLastActive ||
          right.latestEndTs - left.latestEndTs ||
          right.firstStartTs - left.firstStartTs ||
          right.bannerId - left.bannerId
        )
      }

      if (timelineSortOrder.value === 'shortest_gap') {
        return (
          right.daysAfterLastActive - left.daysAfterLastActive ||
          left.latestEndTs - right.latestEndTs ||
          left.firstStartTs - right.firstStartTs ||
          left.bannerId - right.bannerId
        )
      }

      return (
        left.firstStartTs - right.firstStartTs ||
        left.latestEndTs - right.latestEndTs ||
        left.bannerId - right.bannerId
      )
    })
  })

  const timelineTooltipBannerMap = computed(() => {
    const now = Date.now()
    const groupedBanners = new Map<number, TimelineTooltipBanner>()

    normalizedRows.value.forEach((row) => {
      const existingBanner = groupedBanners.get(row.bannerId)
      const isCurrentRun = row.startTs <= now && now < row.endTs

      if (!existingBanner) {
        groupedBanners.set(row.bannerId, {
          bannerId: row.bannerId,
          bannerName: row.bannerName,
          tooltipImageUrl: row.tooltipImageUrl,
          daysAfterLastActive: row.daysAfterLastActive ?? 0,
          isCurrentBanner: isCurrentRun,
          runs: [
            {
              key: row.rowId,
              versionFull: row.versionFull,
              versionMinor: row.versionMinor,
              startDate: row.startDate,
              endDate: row.endDate,
              isRerun: row.isRerun,
              gapDaysSincePrevious: null,
            },
          ],
        })
        return
      }

      const previousRun = existingBanner.runs[existingBanner.runs.length - 1]
      existingBanner.isCurrentBanner ||= isCurrentRun
      existingBanner.runs.push({
        key: row.rowId,
        versionFull: row.versionFull,
        versionMinor: row.versionMinor,
        startDate: row.startDate,
        endDate: row.endDate,
        isRerun: row.isRerun,
        gapDaysSincePrevious: previousRun
          ? getGapDaysBetweenRunPeriods(row.startDate, previousRun.endDate)
          : null,
      })
    })

    return groupedBanners
  })

  const bannerRowIndexMap = computed(() => {
    const map = new Map<number, number>()
    bannerRows.value.forEach((row, index) => {
      map.set(row.bannerId, index)
    })
    return map
  })

  const createDefaultZoomWindow = (): ZoomWindow => ({
    start: 0,
    end: 100,
  })

  const TIMELINE_MIN_VISIBLE_ROWS = {
    mobile: 4,
    desktop: 6,
  } as const

  const TIMELINE_MIN_VISIBLE_DAYS = {
    mobile: 90,
    desktop: 120,
  } as const

  const timelineMinYZoomSpan = computed(() =>
    clampPercent(
      (Math.min(
        bannerRows.value.length,
        isMobile.value
          ? TIMELINE_MIN_VISIBLE_ROWS.mobile
          : TIMELINE_MIN_VISIBLE_ROWS.desktop
      ) /
        Math.max(1, bannerRows.value.length)) *
        100
    )
  )

  const xZoomWindow = ref<ZoomWindow>(createDefaultZoomWindow())
  const yZoomWindow = ref<ZoomWindow>(createDefaultZoomWindow())

  const isZoomWindowAtDefault = (window: ZoomWindow) =>
    Math.abs(window.start) < 0.01 && Math.abs(window.end - 100) < 0.01

  const isTimelineZoomAtDefault = computed(
    () =>
      isZoomWindowAtDefault(xZoomWindow.value) &&
      isZoomWindowAtDefault(yZoomWindow.value)
  )

  const isTimelineMaxZoomRightAligned = computed(
    () =>
      timelineSortOrder.value === 'newest' ||
      timelineSortOrder.value === 'shortest_gap'
  )

  const timelineZoomButtonLabel = computed(() =>
    isTimelineZoomAtDefault.value
      ? t('timeline.max_zoom')
      : t('timeline.reset_zoom')
  )

  const timelineZoomButtonIcon = computed(() =>
    isTimelineZoomAtDefault.value ? SearchPlus : SearchMinus
  )

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

  const timelineMinXZoomSpan = computed(() => {
    const minVisibleDays = isMobile.value
      ? TIMELINE_MIN_VISIBLE_DAYS.mobile
      : TIMELINE_MIN_VISIBLE_DAYS.desktop
    const totalSpanMs = Math.max(
      DAY_IN_MS,
      timelineRange.value.max -
        timelineRange.value.min +
        timelinePaddingMs.value * 2
    )

    return clampPercent((minVisibleDays * DAY_IN_MS * 100) / totalSpanMs)
  })

  const timelineSeriesData = computed<TimelineSeriesDatum[]>(() =>
    normalizedRows.value
      .map((row): TimelineSeriesDatum | null => {
        const rowIndex = bannerRowIndexMap.value.get(row.bannerId)
        if (rowIndex === undefined) return null

        return {
          id: row.rowId,
          value: [row.startTs, row.endTs, rowIndex, row.bannerType, row.rowId],
          row,
        }
      })
      .filter((entry): entry is TimelineSeriesDatum => entry !== null)
  )

  const getBannerTypeColor = (type: number) => {
    const rarity = type === 2 ? 5 : 4
    const color = getQualityColor(rarity)
    return isDark.value ? `${color}cc` : color
  }

  const getTimelineTooltipAccentStyles = (bannerType: 2 | 3) => {
    const rarity = bannerType === 2 ? 5 : 4
    const theme = getQualityTextTheme(rarity)

    return {
      border: theme.borderColor,
      background: theme.color,
      text: theme.textColor,
      badgeBackground: theme.color,
    }
  }

  // Reuse the banner wish button's Font Awesome Heart shape in the tooltip.
  const TIMELINE_WISH_HEART_PATH =
    'M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z'

  const renderTimelineItem = (
    params: TimelineRenderParams,
    api: TimelineRenderApi,
    hoveredBannerId: number | null,
    savedBannerIds: Set<number>
  ): CustomSeriesRenderItemReturn => {
    if (!params.coordSys) return null

    const startCoord = api.coord([api.value(0), api.value(2)])
    const endCoord = api.coord([api.value(1), api.value(2)])
    const rowHeight = api.size([0, 1])[1]

    const row = timelineSeriesData.value[params.dataIndex]?.row
    const availableBarHeight = Math.max(2, rowHeight - 2)
    const preferredBarHeight = Math.min(
      rowHeight * (isMobile.value ? 0.66 : 0.74),
      isMobile.value ? 36 : 48
    )
    const minBarHeight = isMobile.value ? 5 : 7
    const barHeight = Math.min(
      availableBarHeight,
      Math.max(minBarHeight, preferredBarHeight)
    )
    const x = Math.min(startCoord[0], endCoord[0])
    const width = Math.max(Math.abs(endCoord[0] - startCoord[0]), 3)
    const y = startCoord[1]
    const barRadius = 4

    const chartLeft = params.coordSys.x
    const chartRight = params.coordSys.x + params.coordSys.width
    if (x > chartRight || x + width < chartLeft) {
      return null
    }

    const markerHeight = barHeight
    const markerWidth = markerHeight * 2
    const markerX = width < markerWidth ? (width - markerWidth) / 2 : 0
    const markerY = -barHeight / 2
    const minMarkerRenderHeight = isMobile.value ? 24 : 32
    const canRenderMarker = markerHeight >= minMarkerRenderHeight
    const isHoveredRow =
      row?.bannerId !== undefined && hoveredBannerId === row.bannerId
    const isSavedRow = !!row && savedBannerIds.has(row.bannerId)
    const wishAccentHeight = Math.max(2, barHeight - 4)
    const barShape = {
      x: 0,
      y: -barHeight / 2,
      width,
      height: barHeight,
      r: barRadius,
    }

    return {
      type: 'group',
      id: row?.rowId,
      x,
      y,
      transition: ['x', 'y'] as ['x', 'y'],
      diffChildrenByName: true,
      $mergeChildren: 'byName',
      children: [
        {
          type: 'rect',
          name: 'bar',
          z2: isHoveredRow ? 8 : 2,
          transition: ['shape', 'style'] as ['shape', 'style'],
          enterFrom: {
            shape: {
              ...barShape,
              width: 0,
            },
            style: {
              opacity: 0.35,
            },
          },
          shape: barShape,
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
            opacity: 1,
          },
        },
        ...(row && canRenderMarker
          ? [
              {
                type: 'image' as const,
                name: 'marker',
                z2: isHoveredRow ? 9 : 3,
                transition: ['style'] as ['style'],
                enterFrom: {
                  style: {
                    x: markerX + markerWidth / 2,
                    y: markerY,
                    width: 0,
                    height: markerHeight,
                    opacity: 0,
                  },
                },
                style: {
                  image: row.markerImageUrl,
                  x: markerX,
                  y: markerY,
                  width: markerWidth,
                  height: markerHeight,
                  opacity: 1,
                },
                clipPath: {
                  type: 'rect' as const,
                  transition: ['shape'] as ['shape'],
                  enterFrom: {
                    shape: {
                      ...barShape,
                      width: 0,
                    },
                  },
                  shape: barShape,
                },
                silent: true,
              },
            ]
          : []),
        ...(isSavedRow
          ? [
              {
                type: 'rect' as const,
                name: 'wish-accent',
                z2: 10,
                silent: true,
                transition: ['shape', 'style'] as ['shape', 'style'],
                enterFrom: {
                  style: { opacity: 0 },
                },
                // Reveal the accent within the growing bar, including its delay.
                clipPath: {
                  type: 'rect' as const,
                  transition: ['shape'] as ['shape'],
                  enterFrom: {
                    shape: { ...barShape, width: 0 },
                  },
                  shape: barShape,
                },
                shape: canRenderMarker
                  ? {
                      x: 0.75,
                      y: -barHeight / 2 + 0.75,
                      width: Math.min(markerWidth, width) - 1.5,
                      height: barHeight - 1.5,
                      r: barRadius - 0.75,
                    }
                  : {
                      x: Math.min(2, width / 4),
                      y: -wishAccentHeight / 2,
                      width: Math.min(3, width / 3),
                      height: wishAccentHeight,
                      r: 2,
                    },
                style: canRenderMarker
                  ? {
                      fill: 'transparent',
                      stroke: themeVars.value.primaryColor,
                      lineWidth: 1.5,
                      opacity: 1,
                    }
                  : {
                      fill: themeVars.value.primaryColor,
                      stroke: 'transparent',
                      lineWidth: 0,
                      opacity: 1,
                    },
              },
            ]
          : []),
      ],
    }
  }

  const timelineChartOption = computed(() => {
    const hoveredBannerId = timelineHoveredBannerId.value
    const shouldAnimate = timelineChartAnimationEnabled
    const savedIds = savedBannerIds.value

    return {
      animation: shouldAnimate,
      animationDuration: shouldAnimate ? 500 : 0,
      animationDurationUpdate: shouldAnimate ? 500 : 0,
      animationEasing: 'cubicOut' as const,
      animationEasingUpdate: 'cubicInOut' as const,
      animationDelay: shouldAnimate
        ? (index: number) => Math.min(index, 20) * 14
        : 0,
      animationDelayUpdate: 0,
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

          const banner = timelineTooltipBannerMap.value.get(row.bannerId)
          if (!banner) return ''

          const statusText = banner.isCurrentBanner
            ? t('default.current_banners')
            : t('timeline.banner_timer', {
                days: banner.daysAfterLastActive,
              })
          const accentStyles = getTimelineTooltipAccentStyles(row.bannerType)
          const wrapTextStyle =
            'white-space:normal;overflow-wrap:anywhere;word-break:break-word;'
          const containerStyle = `display:flex;flex-direction:column;gap:6px;width:200px;${wrapTextStyle}`
          const titleStyle = `font-weight:700;font-size:16px;${wrapTextStyle}`
          const subtitleStyle = `font-size:12px;font-weight:600;opacity:0.92;${wrapTextStyle}`
          const metaStyle = `font-size:10px;opacity:0.78;${wrapTextStyle}`
          const activeSubtitleStyle = `font-size:12px;font-weight:700;color:${accentStyles.text};${wrapTextStyle}`
          const activeMetaStyle = `font-size:10px;font-weight:600;color:${accentStyles.text};opacity:0.95;${wrapTextStyle}`
          const runsStyle =
            'display:flex;flex-direction:column;gap:6px;margin-top:2px;'
          const runBlockStyle = `display:flex;flex-direction:column;gap:1px;padding:6px 8px 7px;border:1px solid ${
            isDark.value
              ? 'rgba(148, 163, 184, 0.2)'
              : 'rgba(148, 163, 184, 0.28)'
          };border-radius:8px;background:${
            isDark.value
              ? 'rgba(255, 255, 255, 0.04)'
              : 'rgba(148, 163, 184, 0.08)'
          };`
          const activeRunBlockStyle = `display:flex;flex-direction:column;gap:1px;padding:6px 8px 7px;border:1px solid ${accentStyles.border};border-radius:8px;background:${accentStyles.background};`
          const gapSeparatorStyle =
            'display:flex;align-items:center;gap:8px;padding-top:4px;'
          const gapSeparatorLineStyle =
            'flex:1;height:1px;background:rgba(148, 163, 184, 0.22);'
          const gapBadgeStyle = `flex-shrink:0;padding:1px 6px;border-radius:999px;font-size:10px;line-height:1.5;opacity:0.82;background:${accentStyles.badgeBackground};`
          const statusHtml = statusText
            ? `<div style="${metaStyle}">${statusText}</div>`
            : ''
          const wishIndicatorHtml = savedIds.has(row.bannerId)
            ? `<svg width="12" height="12" viewBox="0 0 512 512" fill="currentColor" role="img" aria-label="${t('wishlist.title')}" style="flex-shrink:0;margin-top:6px;color:${
                themeVars.value.primaryColor
              };">
                <title>${t('wishlist.title')}</title>
                <path d="${TIMELINE_WISH_HEART_PATH}" />
              </svg>`
            : ''
          const runsHtml = banner.runs
            .map((run) => {
              const isHoveredRun = run.key === row.rowId
              const versionText = `${t('banner.version')} ${run.versionFull}`
              const seasonText = t(`version.${run.versionMinor}`)
              const hasSeasonText = seasonText !== `version.${run.versionMinor}`
              const startDateText = formatTimelineDate(run.startDate)
              const endDateText = formatTimelineDate(run.endDate)
              const runTitle = `${versionText}${hasSeasonText ? ` · ${seasonText}` : ''}`
              const gapHtml =
                run.gapDaysSincePrevious === null
                  ? ''
                  : `
              <div style="${gapSeparatorStyle}">
                <span style="${gapSeparatorLineStyle}"></span>
                <span style="${gapBadgeStyle}">
                  ${t('timeline.run_gap', {
                    days: run.gapDaysSincePrevious,
                  })}
                </span>
                <span style="${gapSeparatorLineStyle}"></span>
              </div>
            `

              return `
              ${gapHtml}
              <div style="${isHoveredRun ? activeRunBlockStyle : runBlockStyle}">
                <div style="${isHoveredRun ? activeSubtitleStyle : subtitleStyle}">
                  ${runTitle}
                </div>
                <div style="${isHoveredRun ? activeMetaStyle : metaStyle}">
                  ${startDateText} - ${endDateText}
                </div>
              </div>
            `
            })
            .join('')

          return `
          <div style="${containerStyle}">
            <div style="${titleStyle}display:flex;align-items:flex-start;gap:6px;">
              <span style="flex:1;min-width:0;">${banner.bannerName}</span>
              ${wishIndicatorHtml}
            </div>
            ${statusHtml}
            <div style="${runsStyle}">
              ${runsHtml}
            </div>
            <img
              src="${banner.tooltipImageUrl}"
              alt="${banner.bannerName}"
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
        top: 16,
        left: 10,
        right: 40,
        bottom: 60,
        outerBoundsMode: 'same',
        outerBoundsContain: 'axisLabel',
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
          hideOverlap: true,
          color: isDark.value ? '#CBD5E1' : '#475569',
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
          minSpan: timelineMinXZoomSpan.value,
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
          minSpan: timelineMinYZoomSpan.value,
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
          start: xZoomWindow.value.start,
          end: xZoomWindow.value.end,
          minSpan: timelineMinXZoomSpan.value,
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
          minSpan: timelineMinYZoomSpan.value,
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
            renderTimelineItem(params, api, hoveredBannerId, savedIds),
          encode: {
            x: [0, 1],
            y: 2,
            tooltip: [0, 1],
            itemId: 4,
          },
          data: timelineSeriesData.value,
        },
      ],
    }
  })

  const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

  const createClampedZoomWindow = (
    start: number,
    end: number,
    minSpan = 0
  ): ZoomWindow => {
    const boundedStart = clampPercent(start)
    const boundedEnd = clampPercent(end)
    const rawSpan = Math.max(0, boundedEnd - boundedStart)
    const span = Math.min(100, Math.max(minSpan, rawSpan))
    const center = rawSpan > 0 ? (boundedStart + boundedEnd) / 2 : boundedStart
    const maxStart = Math.max(0, 100 - span)
    const nextStart = clampPercent(
      Math.min(maxStart, Math.max(0, center - span / 2))
    )

    return {
      start: nextStart,
      end: clampPercent(nextStart + span),
    }
  }

  const createAnchoredZoomWindow = (
    span: number,
    anchor: 'start' | 'end'
  ): ZoomWindow => {
    const clampedSpan = Math.min(100, Math.max(0, span))

    if (anchor === 'end') {
      return {
        start: clampPercent(100 - clampedSpan),
        end: 100,
      }
    }

    return {
      start: 0,
      end: clampPercent(clampedSpan),
    }
  }

  const applyTimelineZoomWindows = (
    xWindow: ZoomWindow,
    yWindow: ZoomWindow
  ) => {
    clearTimelineHoveredRow()

    xZoomWindow.value = createClampedZoomWindow(
      xWindow.start,
      xWindow.end,
      timelineMinXZoomSpan.value
    )
    yZoomWindow.value = createClampedZoomWindow(
      yWindow.start,
      yWindow.end,
      timelineMinYZoomSpan.value
    )

    timelineChartRef.value?.dispatchAction({
      type: 'dataZoom',
      dataZoomId: 'timeline-x-slider-zoom',
      start: xZoomWindow.value.start,
      end: xZoomWindow.value.end,
    })
    timelineChartRef.value?.dispatchAction({
      type: 'dataZoom',
      dataZoomId: 'timeline-y-slider-zoom',
      start: yZoomWindow.value.start,
      end: yZoomWindow.value.end,
    })
  }

  const updateYZoomWindow = (start: number, end: number) => {
    disableTimelineChartAnimation()
    yZoomWindow.value = createClampedZoomWindow(
      start,
      end,
      timelineMinYZoomSpan.value
    )
  }

  const updateXZoomWindow = (start: number, end: number) => {
    disableTimelineChartAnimation()
    xZoomWindow.value = createClampedZoomWindow(
      start,
      end,
      timelineMinXZoomSpan.value
    )
  }

  const handleDataZoom = (params: DataZoomEventParams) => {
    const payloads = params.batch?.length ? params.batch : [params]
    const xPayload = payloads.find(
      (payload) =>
        payload.dataZoomId === 'timeline-x-slider-zoom' ||
        payload.dataZoomId === 'timeline-x-inside-zoom'
    )
    const yPayload = payloads.find(
      (payload) =>
        payload.dataZoomId === 'timeline-y-slider-zoom' ||
        payload.dataZoomId === 'timeline-y-inside-zoom'
    )

    if (xPayload?.start !== undefined && xPayload.end !== undefined) {
      updateXZoomWindow(xPayload.start, xPayload.end)
    }

    if (yPayload?.start !== undefined && yPayload.end !== undefined) {
      updateYZoomWindow(yPayload.start, yPayload.end)
    }
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
    disableTimelineChartAnimation()
    timelineHoveredBannerId.value = null
  }

  const handleTimelineMouseover = (params: ECElementEvent) => {
    if (!isTimelineSeriesDatum(params.data)) {
      return
    }

    disableTimelineChartAnimation()
    timelineHoveredBannerId.value = params.data.row.bannerId
  }

  const handleTimelineMouseout = () => {
    clearTimelineHoveredRow()
  }

  const handleTimelineClick = (params: ECElementEvent) => {
    if (isMobile.value || !isTimelineSeriesDatum(params.data)) {
      return
    }

    navigateTo(localePath(getBannerDetailPath(params.data.row.bannerId)))
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
      const minWindowSize = timelineMinYZoomSpan.value
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

  const resetTimelineZoom = () => {
    if (isTimelineZoomAtDefault.value) {
      applyTimelineZoomWindows(
        createAnchoredZoomWindow(
          timelineMinXZoomSpan.value,
          isTimelineMaxZoomRightAligned.value ? 'end' : 'start'
        ),
        createAnchoredZoomWindow(timelineMinYZoomSpan.value, 'end')
      )
      return
    }

    applyTimelineZoomWindows(
      createDefaultZoomWindow(),
      createDefaultZoomWindow()
    )
  }

  watch(
    timelineChartOption,
    (option) => {
      const chart = timelineChartRef.value?.chart
      if (!chart) return

      // Measure the updated container before animating the new rows.
      const container = chart.getDom()
      if (
        Math.round(chart.getWidth()) !== container.clientWidth ||
        Math.round(chart.getHeight()) !== container.clientHeight
      ) {
        chart.resize({ animation: { duration: 0 }, silent: true })
      }
      chart.setOption(option)
    },
    { flush: 'post' }
  )

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
