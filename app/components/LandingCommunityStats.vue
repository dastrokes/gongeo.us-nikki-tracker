<template>
  <n-card
    size="small"
    class="rounded-xl p-0 sm:p-2"
  >
    <div class="mb-4 text-center">
      <n-h2 class="m-0 font-bold">
        {{ $t('default.community_stats') }}
      </n-h2>
    </div>
    <div
      class="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]"
    >
      <div class="flex flex-col gap-3">
        <div class="grid grid-cols-2 gap-3 text-center lg:grid-cols-1">
          <div class="rounded-xl bg-[#e8ddf9]/15 p-3 dark:bg-[#1e1b4b]/25">
            <div class="mb-1 text-sm text-gray-400">
              {{ $t('common.stats.total_pulls') }}
            </div>
            <div
              class="min-h-7 text-xl font-bold tabular-nums sm:min-h-8 sm:text-2xl"
            >
              <n-number-animation
                v-if="globalStats"
                show-separator
                :from="0"
                :to="globalStats.pulls ?? 0"
                :duration="5000"
              />
              <n-skeleton
                v-else-if="globalStatsStatus !== 'error'"
                text
                round
                class="mx-auto w-24 sm:w-32"
              />
              <span v-else>-</span>
            </div>
          </div>
          <div class="rounded-xl bg-[#e8ddf9]/15 p-3 dark:bg-[#1e1b4b]/25">
            <div class="mb-1 text-sm text-gray-400">
              {{ $t('global.stats.unique_users') }}
            </div>
            <div
              class="min-h-7 text-xl font-bold tabular-nums sm:min-h-8 sm:text-2xl"
            >
              <n-number-animation
                v-if="globalStats"
                show-separator
                :from="0"
                :to="globalStats.users ?? 0"
                :duration="3000"
              />
              <n-skeleton
                v-else-if="globalStatsStatus !== 'error'"
                text
                round
                class="mx-auto w-16 sm:w-20"
              />
              <span v-else>-</span>
            </div>
          </div>
        </div>
        <div class="flex justify-center">
          <n-button
            type="primary"
            quaternary
            size="medium"
            class="min-w-40"
            @click="navigateTo(localePath('/global'))"
          >
            {{ $t('default.view_all_stats') }} ->
          </n-button>
        </div>
      </div>
      <div class="rounded-xl bg-[#e8ddf9]/15 p-2 lg:p-4 dark:bg-[#1e1b4b]/25">
        <div
          v-if="globalStats"
          :style="{ height: communityFirstItemChartHeight }"
        >
          <VChart
            :option="communityFirstItemChartOption"
            autoresize
          />
        </div>
        <div
          v-else-if="globalStatsStatus !== 'error'"
          :style="{ height: communityFirstItemChartHeight }"
          class="flex flex-col justify-end"
        >
          <div class="grid flex-1 grid-cols-10 items-end gap-4 lg:gap-8">
            <div
              v-for="(height, index) in communityFirstItemSkeletonHeights"
              :key="`community-first-item-skeleton-bar-${index}`"
              class="flex min-w-0 items-end"
              :style="{ height: `${height}%` }"
            >
              <n-skeleton class="h-full w-full rounded-md" />
            </div>
          </div>
        </div>
        <div
          v-else
          class="flex h-40 items-center justify-center text-xl text-gray-400"
        >
          -
        </div>
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
  import { breakpointsTailwind } from '@vueuse/core'
  import { BANNER_DATA } from '~~/data/banners'
  import OUTFIT_DATA, { type OutfitKey } from '~~/data/outfits'

  interface ChartFormatterParam {
    data?: {
      itemId?: string
      value: number
      percentage: string
    }
  }

  interface SelectedBannerOutfit {
    quality: '4' | '5'
    outfitId: OutfitKey
  }

  const props = defineProps<{
    featuredCurrentBanners: Banner[]
  }>()

  const { t } = useI18n()
  const { getImageSrc } = imageProvider()
  const nuxtImg = useImage()
  const { isDark } = useTheme()
  const palette = usePalette()
  const themeVars = useThemeVars()
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const localePath = useLocalePath()

  const communityFirstItemSkeletonHeights = [
    80, 80, 80, 80, 60, 60, 60, 60, 40, 40,
  ] as const
  const gameVersionHeaders = getGameVersionRequestHeaders()

  const fetchGlobalData = () =>
    $fetch<GlobalBootstrapData | null>('/api/global', {
      headers: gameVersionHeaders,
    })

  const globalDataOptions = {
    default: () => null,
    server: false,
    lazy: true,
  }

  const { data: globalStats, status: globalStatsStatus } =
    useAsyncData<GlobalBootstrapData | null>(
      'global-data',
      fetchGlobalData,
      globalDataOptions
    )

  const hasOutfit = (id: string): id is OutfitKey =>
    Object.prototype.hasOwnProperty.call(OUTFIT_DATA, id)

  const communityFirstItemBanner = computed(() => {
    const bootstrapBannerId = globalStats.value?.bannerId
    if (bootstrapBannerId) {
      const matchingBanner = props.featuredCurrentBanners.find(
        (banner) => banner.bannerId === bootstrapBannerId
      )
      if (matchingBanner) return matchingBanner

      const bootstrapBanner = BANNER_DATA[bootstrapBannerId]
      if (bootstrapBanner) return bootstrapBanner
    }

    return props.featuredCurrentBanners[0] ?? null
  })

  const communitySelectedOutfit = computed<SelectedBannerOutfit | null>(() => {
    const banner = communityFirstItemBanner.value
    if (!banner) return null

    const firstFiveStarId = banner.outfit5StarId[0]
    if (firstFiveStarId && hasOutfit(firstFiveStarId)) {
      return {
        quality: '5',
        outfitId: firstFiveStarId,
      }
    }

    const firstFourStarId = banner.outfit4StarId[0]
    if (firstFourStarId && hasOutfit(firstFourStarId)) {
      return {
        quality: '4',
        outfitId: firstFourStarId,
      }
    }

    return null
  })

  const communityFirstItemEntries = computed<FirstItemDistribution[string]>(
    () => {
      const banner = communityFirstItemBanner.value
      const selectedOutfit = communitySelectedOutfit.value
      const distribution = globalStats.value?.firstItemDistribution

      if (!banner || !selectedOutfit || !distribution) return []

      let dataKey = banner.bannerId.toString()
      if (banner.bannerType === 2 && selectedOutfit.quality === '4') {
        dataKey = `${banner.bannerId}_4`
      }

      const bannerItems = distribution[dataKey]
      if (!bannerItems || bannerItems.length === 0) return []

      const outfitItems = OUTFIT_DATA[selectedOutfit.outfitId].items
      const bannerItemsMap = new Map(
        bannerItems.map((item) => [item.itemId, item])
      )
      const outfitItemsSet = new Set(outfitItems)

      const completeBannerItems = outfitItems.length
        ? [
            ...outfitItems.map((itemId) => ({
              users: bannerItemsMap.get(itemId)?.users ?? 0,
              itemId,
            })),
            ...bannerItems.filter((item) => !outfitItemsSet.has(item.itemId)),
          ]
        : [...bannerItems]

      completeBannerItems.sort((a, b) => b.users - a.users)
      return completeBannerItems
    }
  )

  const communityFirstItemImageSize = computed(() =>
    breakpoints.greater('sm').value ? 60 : 32
  )
  const communityFirstItemImageRequestSize = computed(() =>
    breakpoints.greater('sm').value ? 120 : 60
  )

  const communityFirstItemChartHeight = computed(() => '200px')
  const chartTooltipExtraCssText = computed(
    () => `box-shadow: ${themeVars.value.boxShadow2}; border-radius: 8px;`
  )

  const getChartTextStyle = () => ({
    fontFamily:
      "'Outfit', ui-sans-serif, system-ui, sans-serif, 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
    color: isDark.value ? palette.textDark : palette.textLight,
  })

  const communityFirstItemChartOption = computed(() => {
    const chartItems = communityFirstItemEntries.value
    if (chartItems.length === 0) return {}

    const textStyle = getChartTextStyle()
    const imageSize = communityFirstItemImageSize.value
    const imageRequestSize = communityFirstItemImageRequestSize.value
    const occurrenceValues = chartItems.map((item) => item.users)
    const minOccurrence = Math.min(...occurrenceValues)
    const maxOccurrence = Math.max(...occurrenceValues)
    const totalOccurrences = chartItems.reduce(
      (sum, item) => sum + item.users,
      0
    )
    const colorShades = isDark.value
      ? ['#6366F1', '#818CF8', '#A5B4FC']
      : ['#4338CA', '#4F46E5', '#8B5CF6']
    const pickColor = (value: number) => {
      const ratio =
        maxOccurrence === minOccurrence
          ? 0.5
          : (value - minOccurrence) / (maxOccurrence - minOccurrence)
      const index = Math.round(ratio * (colorShades.length - 1))
      return `${colorShades[index]}80`
    }

    const dataArr = chartItems.map((item) => ({
      value: item.users,
      percentage:
        totalOccurrences > 0
          ? ((item.users / totalOccurrences) * 100).toFixed(2)
          : '0.00',
      itemId: item.itemId,
      itemStyle: {
        color: pickColor(item.users),
      },
    }))
    const itemsData = chartItems.map((item) => item.itemId)
    const richLabels: Record<
      string,
      {
        height: number
        width: number
        backgroundColor: { image: string }
        align: string
      }
    > = {}

    itemsData.forEach((itemId) => {
      richLabels[`img${itemId}`] = {
        height: imageSize,
        width: imageSize,
        backgroundColor: {
          image: nuxtImg(
            getImageSrc('itemIcon', itemId),
            {},
            {
              preset: imageRequestSize === 60 ? 'iconSm' : 'iconLg',
            }
          ),
        },
        align: 'center',
      }
    })

    return {
      animationDuration: 500,
      textStyle,
      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: (params: ChartFormatterParam[]) => {
          const itemId = params[0]?.data?.itemId
          if (!itemId) return ''

          return `
                <div style="display: flex; flex-direction: column;">
                  <div style="font-weight: bold; margin-bottom: 5px;">
                    ${t(`item.${itemId}.name`, itemId)}
                  </div>
                  <div>
                    ${t('common.charts.occurrences')}: <strong>${params[0]?.data?.value ?? 0}</strong>
                  </div>
                  <div>
                    ${t('common.charts.percentage')}: <strong>${params[0]?.data?.percentage ?? '0.00'}%</strong>
                  </div>
                </div>
              `
        },
        backgroundColor: isDark.value ? palette.dark : palette.light,
        borderColor: isDark.value ? '#555' : '#ddd',
        borderWidth: 1,
        padding: 10,
        textStyle,
        extraCssText: chartTooltipExtraCssText.value,
      },
      grid: {
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
      },
      xAxis: {
        type: 'category',
        data: itemsData,
        axisLabel: {
          show: true,
          formatter: (value: string) => `{img${value}|}`,
          rich: richLabels,
          interval: 0,
          margin: imageSize / 4,
        },
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        splitLine: {
          show: false,
        },
      },
      series: [
        {
          type: 'bar',
          barWidth: '60%',
          data: dataArr,
          itemStyle: {
            borderRadius: [4, 4, 4, 4],
          },
        },
      ],
    }
  })
</script>
