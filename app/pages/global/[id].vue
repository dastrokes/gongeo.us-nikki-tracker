<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <template v-if="status === 'pending'">
      <n-card
        size="small"
        class="rounded-xl"
        content-class="p-2 sm:p-4"
      >
        <div class="grid grid-cols-2 gap-2 md:grid-cols-6">
          <n-card
            v-for="i in 6"
            :key="i"
            size="small"
            class="rounded-lg text-center"
          >
            <n-skeleton
              height="20px"
              width="80%"
              class="mx-auto mb-2"
            />
            <n-skeleton
              height="24px"
              width="60%"
              class="mx-auto"
            />
          </n-card>
        </div>
      </n-card>
      <n-card
        v-for="i in 2"
        :key="`chart-skeleton-${i}`"
        size="small"
        class="rounded-xl"
        content-class="p-2 sm:p-4"
      >
        <n-card size="small">
          <n-skeleton height="280px" />
        </n-card>
      </n-card>
    </template>

    <n-result
      v-else-if="!banner"
      status="404"
      :title="t('banner.not_found')"
      :description="t('error.404')"
    >
      <template #footer>
        <n-button
          type="primary"
          @click="navigateTo(localePath('/global'))"
        >
          {{ t('navigation.global') }}
        </n-button>
      </template>
    </n-result>

    <template v-else>
      <n-card
        v-show="!maximizedChart"
        size="small"
        class="rounded-xl"
        content-class="p-2 sm:p-4"
      >
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div class="flex flex-1 items-center gap-2">
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button
                  size="small"
                  text
                  @click="navigateTo(localePath('/global'))"
                >
                  <template #icon>
                    <n-icon :depth="3"><Globe /></n-icon>
                  </template>
                </n-button>
              </template>
              {{ t('navigation.global') }}
            </n-tooltip>
            <n-button
              v-if="prevBanner"
              size="small"
              text
              @click="navigateTo(createGlobalStatsPath(prevBanner.bannerId))"
            >
              <template #icon>
                <n-icon :depth="3"><ChevronLeft /></n-icon>
              </template>
            </n-button>
            <n-tooltip trigger="hover">
              <template #trigger>
                <NuxtLinkLocale
                  :to="getEntityDetailPath('banner', banner.bannerId)"
                  class="shrink-0 transition-opacity hover:opacity-80"
                >
                  <NuxtImg
                    :src="getImageSrc('bannerThumb', banner.bannerId)"
                    :alt="bannerName"
                    class="h-14 w-28 rounded-md object-cover"
                    preset="bannerThumb"
                    fit="cover"
                    sizes="112px"
                  />
                </NuxtLinkLocale>
              </template>
              {{ t('navigation.banner_detail') }}
            </n-tooltip>
            <div class="min-w-0">
              <n-gradient-text
                :size="18"
                class="font-medium wrap-break-word"
                :type="banner.bannerType === 2 ? 'warning' : 'info'"
              >
                {{ bannerName }}
              </n-gradient-text>
              <div class="text-sm text-gray-400">
                {{ t('global.banner_stats.title') }}
              </div>
            </div>
            <n-button
              v-if="nextBanner"
              size="small"
              text
              @click="navigateTo(createGlobalStatsPath(nextBanner.bannerId))"
            >
              <template #icon>
                <n-icon :depth="3"><ChevronRight /></n-icon>
              </template>
            </n-button>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-2">
            <n-tree-select
              v-if="scopeTreeOptions.length > 0"
              v-model:value="selectedScopeValue"
              v-model:expanded-keys="expandedScopeKeys"
              :consistent-menu-width="false"
              :options="scopeTreeOptions"
              :override-default-node-click-behavior="overrideScopeNodeClick"
              :render-label="renderScopeLabel"
              filterable
              :indent="16"
              size="small"
              class="w-56 sm:w-72"
              @update:show="handleScopeDropdownShow"
              @update:value="handleScopeSelect"
            />
          </div>
        </div>
      </n-card>

      <n-card
        v-show="!maximizedChart"
        size="small"
        class="rounded-xl"
        content-class="p-2 sm:p-4"
      >
        <div class="grid grid-cols-2 gap-2 md:grid-cols-6">
          <n-card
            size="small"
            class="rounded-lg text-center"
          >
            <div class="text-sm text-gray-400">
              {{ t('global.stats.unique_users') }}
            </div>
            <div class="mt-1 text-lg font-medium tabular-nums">
              {{ statsData?.users.toLocaleString() ?? '-' }}
            </div>
          </n-card>
          <n-card
            size="small"
            class="rounded-lg text-center"
          >
            <div class="text-sm text-gray-400">
              {{ t('common.stats.total_pulls') }}
            </div>
            <div class="mt-1 text-lg font-medium tabular-nums">
              {{
                statsData?.totalPulls
                  ? statsData.totalPulls.toLocaleString()
                  : '-'
              }}
            </div>
          </n-card>
          <n-card
            size="small"
            class="rounded-lg text-center"
          >
            <div class="text-sm text-gray-400">
              {{ t('global.banner_stats.completion_rate') }}
            </div>
            <div class="mt-1 text-lg font-medium tabular-nums">
              {{ formatPercent(displayCompletionRate) }}
            </div>
          </n-card>
          <n-card
            size="small"
            class="rounded-lg text-center"
          >
            <div class="text-sm text-gray-400">
              {{ t('global.banner_stats.completed_stylists') }}
            </div>
            <div class="mt-1 text-lg font-medium tabular-nums">
              {{ selectedScopeStats?.completedUsers?.toLocaleString() ?? '-' }}
            </div>
          </n-card>
          <n-card
            size="small"
            class="rounded-lg text-center"
          >
            <div class="text-sm text-gray-400">
              {{ t('global.banner_stats.median_completion_pulls') }}
            </div>
            <div class="mt-1 text-lg font-medium tabular-nums">
              {{ medianCompletionPulls || '-' }}
            </div>
          </n-card>
          <n-card
            size="small"
            class="rounded-lg text-center"
          >
            <div class="text-sm text-gray-400">
              {{ t('global.stats.data_as_of') }}
            </div>
            <div class="mt-1 text-lg font-medium tabular-nums">
              <n-time
                v-if="effectiveDate"
                :time="effectiveDate"
                type="date"
              />
              <span v-else>-</span>
            </div>
          </n-card>
        </div>
      </n-card>

      <n-card
        v-if="error"
        size="small"
        class="rounded-xl"
      >
        <n-result
          status="error"
          :title="t('common.error')"
          :description="t('global.banner_stats.load_failed')"
        />
      </n-card>

      <n-card
        v-else-if="!hasAnyStats"
        size="small"
        class="rounded-xl"
      >
        <n-empty :description="t('global.banner_stats.empty')" />
      </n-card>

      <template v-else>
        <n-card
          v-if="hasPullDistributionCharts"
          v-show="!maximizedChart || maximizedChart === 'pullDistribution'"
          size="small"
          class="rounded-xl"
          :class="{ 'mt-0 mb-0': Boolean(maximizedChart) }"
          content-class="p-2 sm:p-4"
        >
          <n-card
            size="small"
            class="transition-all duration-300"
          >
            <div :class="chartHeightClass('pullDistribution')">
              <n-select
                v-if="pullDistributionOptions.length > 1"
                v-model:value="selectedPullDistributionValue"
                :consistent-menu-width="false"
                :options="pullDistributionOptions"
                :show-checkmark="false"
                size="small"
                class="absolute top-2 right-12 z-10 w-40"
              />
              <ChartMaximizeButton
                chart-id="pullDistribution"
                :active-chart="maximizedChart"
                @toggle="toggleMaximize"
              />
              <VChart
                :option="pullDistributionChartOption"
                autoresize
              />
            </div>
          </n-card>
        </n-card>

        <n-card
          v-if="hasItemDistributionCharts"
          v-show="!maximizedChart || maximizedChart === 'itemDistribution'"
          size="small"
          class="rounded-xl"
          :class="{ 'mt-0 mb-0': Boolean(maximizedChart) }"
          content-class="p-2 sm:p-4"
        >
          <n-card
            size="small"
            class="transition-all duration-300"
          >
            <div :class="chartHeightClass('itemDistribution')">
              <n-select
                v-if="itemDistributionOptions.length > 1"
                v-model:value="selectedItemDistributionValue"
                :consistent-menu-width="false"
                :options="itemDistributionOptions"
                :show-checkmark="false"
                size="small"
                class="absolute top-2 right-12 z-10 w-40"
              />
              <ChartMaximizeButton
                chart-id="itemDistribution"
                :active-chart="maximizedChart"
                @toggle="toggleMaximize"
              />
              <VChart
                :option="itemDistributionChartOption"
                autoresize
              />
            </div>
          </n-card>
        </n-card>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
  import type { TreeSelectOption } from 'naive-ui'
  import {
    ChevronLeft,
    ChevronRight,
    CompressAlt,
    ExpandAlt,
    Globe,
  } from '@vicons/fa'
  import { breakpointsTailwind } from '@vueuse/core'
  import { NButton, NIcon } from 'naive-ui'
  import { BANNER_DATA } from '~~/data/banners'
  import { LATEST_BANNER_ID } from '~~/data/config'

  type GlobalBannerScopePayload = GlobalBannerPayload['scopes'][string]
  type GlobalBannerItemDistribution =
    GlobalBannerScopePayload['firstItemDistribution']
  type GlobalBannerHistogram = GlobalBannerPayload['overallPullDistribution']

  type ChartId = 'pullDistribution' | 'itemDistribution'
  type PullDistributionType = 'overall' | 'completion'
  type ItemDistributionType = 'first' | 'fifth'

  interface DistributionSelectOption<T extends string> {
    label: string
    title: string
    value: string
    type: T
    scopeKey?: string
  }

  const ChartMaximizeButton = defineComponent({
    props: {
      chartId: {
        type: String,
        required: true,
      },
      activeChart: {
        type: String,
        default: null,
      },
    },
    emits: ['toggle'],
    setup(props, { emit }) {
      return () =>
        h(
          NButton,
          {
            size: 'tiny',
            text: true,
            class: 'absolute top-4 right-4 z-10',
            type: props.activeChart === props.chartId ? 'primary' : 'default',
            onClick: () => emit('toggle', props.chartId),
          },
          {
            icon: () =>
              h(
                NIcon,
                { depth: 3 },
                {
                  default: () =>
                    h(
                      props.activeChart === props.chartId
                        ? CompressAlt
                        : ExpandAlt
                    ),
                }
              ),
          }
        )
    },
  })

  const route = useRoute()
  const requestEvent = useRequestEvent()
  const { t } = useI18n()
  const localePath = useLocalePath()
  const { getImageSrc } = imageProvider()
  const nuxtImg = useImage()
  const { isDark } = useTheme()
  const palette = usePalette()
  const themeVars = useThemeVars()
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const pullStore = usePullStore()
  const { processedPulls } = storeToRefs(pullStore)
  const { initFromIndexedDB } = usePullStoreData()

  const routeParam = computed(() =>
    Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  )
  const bannerId = computed(() =>
    resolveEntityRouteId('banner', routeParam.value)
  )
  const canonicalGlobalStatsPath = computed(() =>
    Number.isFinite(bannerId.value)
      ? localePath(`/global/${getEntitySlug('banner', bannerId.value)}`)
      : ''
  )
  const shouldRedirectToCanonicalSlug = computed(
    () =>
      Number.isFinite(bannerId.value) &&
      (String(routeParam.value ?? '') !==
        getEntitySlug('banner', bannerId.value) ||
        route.query.scope !== undefined)
  )

  const redirectToCanonicalGlobalStatsSlug = () => {
    if (
      !shouldRedirectToCanonicalSlug.value ||
      !canonicalGlobalStatsPath.value
    ) {
      return
    }

    return navigateTo(
      {
        path: canonicalGlobalStatsPath.value,
      },
      {
        redirectCode: 301,
        replace: true,
      }
    )
  }

  await redirectToCanonicalGlobalStatsSlug()

  const banner = computed(() => BANNER_DATA[bannerId.value] ?? null)

  if (import.meta.server && requestEvent && !banner.value) {
    setResponseStatus(requestEvent, 404)
    applyPageCacheHeaders(requestEvent, 'noStore')
  }

  const bannerName = computed(() =>
    banner.value ? t(`banner.${banner.value.bannerId}.name`) : ''
  )
  const gameVersionHeaders = getGameVersionRequestHeaders()
  const storedSelectedScopeValue = useState<string | null>(
    'global-banner-selected-scope',
    () => null
  )
  const selectedScopeValue = ref<string | null>(null)
  const expandedScopeKeys = ref<string[]>([])
  const selectedPullDistributionValue = ref('')
  const selectedItemDistributionValue = ref('')
  const maximizedChart = ref<ChartId | null>(null)
  const userMarkerColor = '#F43F5E'

  const {
    data: bannerPayload,
    status,
    error,
  } = await useAsyncData<GlobalBannerPayload | null>(
    () => `global-banner-detail-${bannerId.value}`,
    () =>
      banner.value
        ? $fetch<GlobalBannerPayload>(`/api/global/${banner.value.bannerId}`, {
            headers: gameVersionHeaders,
            query: { detail: '1' },
          })
        : Promise.resolve(null),
    {
      default: () => null,
      watch: [bannerId],
    }
  )

  const statsData = computed<GlobalBannerPayload | null>(() => {
    const activeBanner = banner.value
    const payload = bannerPayload.value
    if (!activeBanner || !payload) return null

    return {
      date: payload.date,
      bannerId: payload.bannerId ?? activeBanner.bannerId,
      bannerType: payload.bannerType ?? activeBanner.bannerType,
      users: payload.users,
      totalPulls: payload.totalPulls,
      overallPullDistribution: payload.overallPullDistribution,
      scopes: payload.scopes,
    }
  })

  interface BannerScopeOptionEntry {
    value: string
    bannerId: number
    quality: 4 | 5
    outfitId: string
    scopeKey: string
  }

  const createScopeKey = (quality: 4 | 5, outfitId: string) =>
    `${quality}:${outfitId}`
  const createScopeValue = (
    bannerIdValue: number,
    quality: 4 | 5,
    outfitId: string
  ) => `${bannerIdValue}:${createScopeKey(quality, outfitId)}`
  const createGlobalStatsPath = (bannerIdValue: number) =>
    localePath(`/global/${getEntitySlug('banner', bannerIdValue)}`)
  const statsBannerIds = computed(() =>
    Object.values(BANNER_DATA)
      .filter(
        (bannerData) =>
          bannerData?.bannerId &&
          bannerData.bannerType !== 1 &&
          bannerData.bannerId <= LATEST_BANNER_ID
      )
      .map((bannerData) => bannerData.bannerId)
      .sort((left, right) => left - right)
  )
  const currentBannerIndex = computed(() =>
    statsBannerIds.value.indexOf(bannerId.value)
  )
  const prevBannerId = computed(() => {
    const index = currentBannerIndex.value
    return index > 0 ? statsBannerIds.value[index - 1] : null
  })
  const nextBannerId = computed(() => {
    const index = currentBannerIndex.value
    return index >= 0 && index < statsBannerIds.value.length - 1
      ? statsBannerIds.value[index + 1]
      : null
  })
  const prevBanner = computed(() =>
    prevBannerId.value ? BANNER_DATA[prevBannerId.value] : null
  )
  const nextBanner = computed(() =>
    nextBannerId.value ? BANNER_DATA[nextBannerId.value] : null
  )

  const allScopeEntries = computed<BannerScopeOptionEntry[]>(() => {
    const entries: BannerScopeOptionEntry[] = []

    Object.values(BANNER_DATA).forEach((bannerData) => {
      if (
        !bannerData?.bannerId ||
        bannerData.bannerType === 1 ||
        bannerData.bannerId > LATEST_BANNER_ID
      ) {
        return
      }

      const addEntry = (quality: 4 | 5, outfitId: string) => {
        entries.push({
          value: createScopeValue(bannerData.bannerId, quality, outfitId),
          bannerId: bannerData.bannerId,
          quality,
          outfitId,
          scopeKey: createScopeKey(quality, outfitId),
        })
      }

      bannerData.outfit5StarId.forEach((outfitId) => addEntry(5, outfitId))
      bannerData.outfit4StarId.forEach((outfitId) => addEntry(4, outfitId))
    })

    return entries.sort(
      (left, right) =>
        right.bannerId - left.bannerId ||
        right.quality - left.quality ||
        left.outfitId.localeCompare(right.outfitId)
    )
  })

  const scopeEntryByValue = computed(
    () => new Map(allScopeEntries.value.map((entry) => [entry.value, entry]))
  )
  const currentBannerScopeEntries = computed(() =>
    allScopeEntries.value.filter((entry) => entry.bannerId === bannerId.value)
  )
  const defaultScopeEntry = computed(() => {
    const availableScopes = statsData.value?.scopes ?? {}

    return (
      currentBannerScopeEntries.value.find((entry) =>
        Boolean(availableScopes[entry.scopeKey])
      ) ??
      currentBannerScopeEntries.value[0] ??
      null
    )
  })

  const scopeTreeOptions = computed<TreeSelectOption[]>(() =>
    Object.values(BANNER_DATA)
      .filter(
        (bannerData) =>
          bannerData?.bannerId &&
          bannerData.bannerType !== 1 &&
          bannerData.bannerId <= LATEST_BANNER_ID
      )
      .sort((left, right) => right.bannerId - left.bannerId)
      .map((bannerData) => {
        const children = allScopeEntries.value
          .filter((entry) => entry.bannerId === bannerData.bannerId)
          .map((entry) => ({
            label: `${entry.quality}★ ${t(
              `outfit.${entry.outfitId}.name`,
              entry.outfitId
            )}`,
            value: entry.value,
            key: entry.value,
          }))

        return {
          label: t(`banner.${bannerData.bannerId}.name`),
          value: `banner_${bannerData.bannerId}`,
          key: `banner_${bannerData.bannerId}`,
          children,
        }
      })
      .filter((option) => option.children.length > 0)
  )

  const overrideScopeNodeClick = (info: { option: TreeSelectOption }) =>
    info.option.children ? 'toggleExpand' : 'default'

  const renderScopeLabel = ({ option }: { option: TreeSelectOption }) =>
    option.children
      ? h('span', option.label)
      : h('span', { class: '-ml-4' }, option.label)

  const handleScopeDropdownShow = (show: boolean) => {
    if (!show) {
      expandedScopeKeys.value = []
    }
  }

  const handleScopeSelect = (value: string | number | null) => {
    if (typeof value !== 'string') return

    const entry = scopeEntryByValue.value.get(value)
    if (!entry) return

    selectedScopeValue.value = value
    storedSelectedScopeValue.value = value

    if (entry.bannerId === bannerId.value) return

    navigateTo({
      path: createGlobalStatsPath(entry.bannerId),
    })
  }

  watch(
    [currentBannerScopeEntries, defaultScopeEntry, scopeEntryByValue],
    () => {
      const selectedEntry = selectedScopeValue.value
        ? scopeEntryByValue.value.get(selectedScopeValue.value)
        : null
      if (selectedEntry?.bannerId === bannerId.value) {
        storedSelectedScopeValue.value = selectedEntry.value
        return
      }

      const storedEntry = storedSelectedScopeValue.value
        ? scopeEntryByValue.value.get(storedSelectedScopeValue.value)
        : null
      selectedScopeValue.value =
        storedEntry?.bannerId === bannerId.value
          ? storedEntry.value
          : (defaultScopeEntry.value?.value ?? null)
    },
    { immediate: true }
  )

  watch(bannerId, () => {
    selectedPullDistributionValue.value = ''
    selectedItemDistributionValue.value = ''
  })

  const selectedScopeStats = computed(() => {
    const scopes = statsData.value?.scopes ?? {}
    const selectedEntry = selectedScopeValue.value
      ? scopeEntryByValue.value.get(selectedScopeValue.value)
      : null
    const selectedScopeKeyValue =
      selectedEntry?.bannerId === bannerId.value
        ? selectedEntry.scopeKey
        : defaultScopeEntry.value?.scopeKey

    return selectedScopeKeyValue
      ? (scopes[selectedScopeKeyValue] ?? Object.values(scopes)[0])
      : Object.values(scopes)[0]
  })

  const effectiveDate = computed(() =>
    statsData.value?.date ? new Date(statsData.value.date) : null
  )

  const isMobile = computed(() => !breakpoints.greater('sm').value)
  const chartTooltipExtraCssText = computed(
    () => `box-shadow: ${themeVars.value.boxShadow2}; border-radius: 8px;`
  )
  const hasHistogramData = (histogram?: GlobalBannerHistogram) =>
    Object.keys(histogram ?? {}).length > 0

  const hasDistributionData = (distribution?: GlobalBannerItemDistribution) =>
    (distribution?.length ?? 0) > 0

  const hasOverallPullDistribution = computed(() =>
    hasHistogramData(statsData.value?.overallPullDistribution)
  )
  const hasCompletionPullDistribution = computed(() =>
    hasHistogramData(selectedScopeStats.value?.completionPullDistribution)
  )
  const currentScopeStatsEntries = computed(() =>
    currentBannerScopeEntries.value
      .map((entry) => ({
        entry,
        stats: statsData.value?.scopes[entry.scopeKey],
      }))
      .filter((row) => Boolean(row.stats))
  )
  const createScopeLabel = (entry: BannerScopeOptionEntry) =>
    `${entry.quality}★ ${t(`outfit.${entry.outfitId}.name`, entry.outfitId)}`
  const createDistributionOptionLabel = (
    entry: BannerScopeOptionEntry,
    statLabel: string
  ) => `${createScopeLabel(entry)} - ${statLabel}`

  const pullDistributionOptions = computed<
    DistributionSelectOption<PullDistributionType>[]
  >(() => {
    const options: DistributionSelectOption<PullDistributionType>[] = []

    currentScopeStatsEntries.value.forEach(({ entry, stats }) => {
      if (!hasHistogramData(stats?.completionPullDistribution)) return

      options.push({
        label: createDistributionOptionLabel(
          entry,
          t('global.banner_stats.option_completed_set')
        ),
        title: t('global.banner_stats.completion_pull_distribution'),
        value: `completion:${entry.scopeKey}`,
        type: 'completion',
        scopeKey: entry.scopeKey,
      })
    })

    if (hasOverallPullDistribution.value) {
      options.push({
        label: t('common.all'),
        title: t('global.banner_stats.overall_pull_distribution'),
        value: 'overall',
        type: 'overall',
      })
    }

    return options
  })
  const itemDistributionOptions = computed<
    DistributionSelectOption<ItemDistributionType>[]
  >(() => {
    const options: DistributionSelectOption<ItemDistributionType>[] = []

    currentScopeStatsEntries.value.forEach(({ entry, stats }) => {
      if (hasDistributionData(stats?.firstItemDistribution)) {
        options.push({
          label: createDistributionOptionLabel(
            entry,
            t('global.banner_stats.option_first_item')
          ),
          title: t('global.charts.first_item_distribution'),
          value: `first:${entry.scopeKey}`,
          type: 'first',
          scopeKey: entry.scopeKey,
        })
      }

      if (hasDistributionData(stats?.fifthItemDistribution)) {
        options.push({
          label: createDistributionOptionLabel(
            entry,
            t('global.banner_stats.option_fifth_item')
          ),
          title: t('global.banner_stats.fifth_item_distribution'),
          value: `fifth:${entry.scopeKey}`,
          type: 'fifth',
          scopeKey: entry.scopeKey,
        })
      }
    })

    return options
  })
  const selectedPullDistributionOption = computed(
    () =>
      pullDistributionOptions.value.find(
        (option) => option.value === selectedPullDistributionValue.value
      ) ?? pullDistributionOptions.value[0]
  )
  const selectedItemDistributionOption = computed(
    () =>
      itemDistributionOptions.value.find(
        (option) => option.value === selectedItemDistributionValue.value
      ) ?? itemDistributionOptions.value[0]
  )
  const hasPullDistributionCharts = computed(
    () => pullDistributionOptions.value.length > 0
  )
  const hasItemDistributionCharts = computed(
    () => itemDistributionOptions.value.length > 0
  )
  const hasAnyStats = computed(
    () => hasPullDistributionCharts.value || hasItemDistributionCharts.value
  )

  watch(
    pullDistributionOptions,
    (options) => {
      if (
        !options.some(
          (option) => option.value === selectedPullDistributionValue.value
        )
      ) {
        selectedPullDistributionValue.value = options[0]?.value ?? ''
      }
    },
    { immediate: true }
  )

  watch(
    itemDistributionOptions,
    (options) => {
      if (
        !options.some(
          (option) => option.value === selectedItemDistributionValue.value
        )
      ) {
        selectedItemDistributionValue.value = options[0]?.value ?? ''
      }
    },
    { immediate: true }
  )

  const getChartTextStyle = () => ({
    fontFamily:
      "'Outfit', ui-sans-serif, system-ui, sans-serif, 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
    color: isDark.value ? palette.textDark : palette.textLight,
  })

  const chartHeightClass = (chartId: ChartId) => ({
    'relative transition-all duration-300': true,
    'h-[calc(100vh-156px)] sm:h-[calc(100vh-172px)]':
      maximizedChart.value === chartId,
    'h-80': maximizedChart.value !== chartId,
  })

  const toggleMaximize = (chartId: ChartId) => {
    maximizedChart.value = maximizedChart.value === chartId ? null : chartId
  }

  watch(maximizedChart, async (activeChart) => {
    if (!import.meta.client) return

    document.body.style.overflow = activeChart ? 'hidden' : ''
    await nextTick()
    window.dispatchEvent(new Event('resize'))
  })

  onBeforeUnmount(() => {
    if (!import.meta.client) return
    document.body.style.overflow = ''
  })

  const formatPercent = (value?: number) => {
    if (typeof value !== 'number') return '-'
    return `${(value * 100).toFixed(1)}%`
  }

  const medianFromHistogram = (histogram?: GlobalBannerHistogram) => {
    const entries = Object.entries(histogram ?? {})
      .map(([key, count]) => [Number.parseInt(key, 10), count] as const)
      .filter(([key, count]) => Number.isFinite(key) && count > 0)
      .sort(([left], [right]) => left - right)

    const total = entries.reduce((sum, [, count]) => sum + count, 0)
    if (total === 0) return 0

    const midpoint = Math.ceil(total / 2)
    let running = 0
    for (const [key, count] of entries) {
      running += count
      if (running >= midpoint) return key
    }

    return 0
  }

  const medianCompletionPulls = computed(() =>
    medianFromHistogram(selectedScopeStats.value?.completionPullDistribution)
  )
  const displayCompletionRate = computed(() =>
    hasCompletionPullDistribution.value
      ? selectedScopeStats.value?.completionRate
      : undefined
  )
  const userBannerPulls = computed(() => processedPulls.value[bannerId.value])
  const userPullMarkerValue = computed(() => {
    const selectedOption = selectedPullDistributionOption.value
    const currentPulls = userBannerPulls.value
    if (!selectedOption || !currentPulls?.stats.totalPulls) return null

    if (selectedOption.type === 'overall') return currentPulls.stats.totalPulls

    const scopeStats = selectedOption.scopeKey
      ? statsData.value?.scopes[selectedOption.scopeKey]
      : undefined
    if (!scopeStats) return null

    return (
      currentPulls.pulls
        .filter(
          (pull) =>
            pull.count > 0 &&
            pull.quality === scopeStats.quality &&
            pull.outfitId === scopeStats.outfitId &&
            pull.pullIndex > 0
        )
        .sort((left, right) => left.pullIndex - right.pullIndex)[
        scopeStats.itemCount - 1
      ]?.pullIndex ?? currentPulls.stats.totalPulls
    )
  })

  const createHistogramChartOption = (
    histogram: GlobalBannerHistogram | undefined,
    title: string,
    color: string,
    userPullValue?: number | null
  ) => {
    const entries = Object.entries(histogram ?? {})
      .map(([key, count]) => [Number.parseInt(key, 10), count] as const)
      .filter(([key, count]) => Number.isFinite(key) && count > 0)
      .sort(([left], [right]) => left - right)

    if (entries.length === 0) return {}

    const total = entries.reduce((sum, [, count]) => sum + count, 0)
    const minPull = Math.max(0, entries[0][0])
    const maxPull = Math.max(minPull + 1, entries.at(-1)![0])
    const textStyle = getChartTextStyle()
    const hasUserMarker =
      typeof userPullValue === 'number' &&
      Number.isFinite(userPullValue) &&
      userPullValue > 0

    return {
      textStyle,
      title: {
        text: title,
        left: 'center',
        top: isMobile.value ? 35 : 0,
        textStyle: {
          ...textStyle,
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: (
          params: {
            axisValue: string | number
            value: number | [number, number]
          }[]
        ) => {
          const barData = params[0]
          if (!barData) return ''
          const [pulls, count] = Array.isArray(barData.value)
            ? barData.value
            : [Number(barData.axisValue), barData.value]

          return `
            <div style="font-weight: bold; margin-bottom: 4px;">
              ${t('common.charts.number_of_pulls')}: ${pulls}
            </div>
            <div>${t('stats.charts.frequency')}: <strong>${count}</strong></div>
            <div>${t('common.charts.probability')}: <strong>${((count / total) * 100).toFixed(2)}%</strong></div>
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
        top: 58,
        bottom: 24,
        left: 36,
        right: 24,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        min: minPull,
        max: maxPull,
        minInterval: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          ...textStyle,
          hideOverlap: true,
          interval: 'auto',
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        splitLine: { show: false },
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: entries.map(([pulls, count]) => ({
            value: [pulls, count],
            itemStyle: {
              color: pulls === userPullValue ? userMarkerColor : color,
              borderColor:
                pulls === userPullValue
                  ? isDark.value
                    ? '#FFFFFF'
                    : '#881337'
                  : undefined,
              borderWidth: pulls === userPullValue ? 2 : 0,
              borderRadius: [4, 4, 0, 0],
            },
          })),
          markLine: hasUserMarker
            ? {
                symbol: 'none',
                silent: true,
                label: {
                  show: true,
                  color: userMarkerColor,
                  fontWeight: 'bold',
                  formatter: `${t('default.your_data')}: ${userPullValue}`,
                },
                lineStyle: {
                  color: userMarkerColor,
                  type: 'dashed',
                  width: 2,
                },
                data: [{ xAxis: userPullValue }],
              }
            : undefined,
        },
      ],
    }
  }

  const createItemDistributionChartOption = (
    distribution: GlobalBannerItemDistribution | undefined,
    title: string
  ) => {
    const entries = [...(distribution ?? [])]
    if (entries.length === 0) return {}

    const totalOccurrences = entries.reduce((sum, item) => sum + item.users, 0)
    const occurrenceValues = entries.map((item) => item.users)
    const minOccurrence = Math.min(...occurrenceValues)
    const maxOccurrence = Math.max(...occurrenceValues)
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
    const imageSize = isMobile.value ? 28 : 56
    const imageRequestSize = isMobile.value ? 60 : 120
    const textStyle = getChartTextStyle()
    const itemIds = entries.map((item) => item.itemId)
    const richLabels: Record<
      string,
      {
        height: number
        width: number
        backgroundColor: { image: string }
        align: string
      }
    > = {}

    itemIds.forEach((itemId) => {
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
      textStyle,
      title: {
        text: title,
        left: 'center',
        top: isMobile.value ? 35 : 0,
        textStyle: {
          ...textStyle,
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: (
          params: {
            data?: {
              itemId?: string
              value: number
              percentage: string
            }
          }[]
        ) => {
          const itemId = params[0]?.data?.itemId
          if (!itemId) return ''

          return `
            <div style="display: flex; flex-direction: column;">
              <div style="font-weight: bold; margin-bottom: 5px;">
                ${t(`item.${itemId}.name`, itemId)}
              </div>
              <div>${t('common.charts.occurrences')}: <strong>${params[0]?.data?.value ?? 0}</strong></div>
              <div>${t('common.charts.percentage')}: <strong>${params[0]?.data?.percentage ?? '0.00'}%</strong></div>
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
        bottom: 12,
        top: 64,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: itemIds,
        axisLabel: {
          show: true,
          formatter: (value: string) => `{img${value}|}`,
          rich: richLabels,
          interval: 0,
          margin: imageSize / 4,
        },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { show: false },
        axisTick: { show: false },
        axisLine: { show: false },
        splitLine: { show: false },
      },
      series: [
        {
          type: 'bar',
          barWidth: '60%',
          data: entries.map((item) => ({
            value: item.users,
            percentage:
              totalOccurrences > 0
                ? ((item.users / totalOccurrences) * 100).toFixed(2)
                : '0.00',
            itemId: item.itemId,
            itemStyle: {
              color: pickColor(item.users),
              borderRadius: [4, 4, 4, 4],
            },
          })),
        },
      ],
    }
  }

  const pullDistributionChartOption = computed(() => {
    const selectedOption = selectedPullDistributionOption.value
    if (!selectedOption) return {}

    if (selectedOption.type === 'completion') {
      const scopeStats = selectedOption.scopeKey
        ? statsData.value?.scopes[selectedOption.scopeKey]
        : undefined

      return createHistogramChartOption(
        scopeStats?.completionPullDistribution,
        selectedOption.title,
        getQualityColor(scopeStats?.quality ?? 5) + 'CC',
        userPullMarkerValue.value
      )
    }

    return createHistogramChartOption(
      statsData.value?.overallPullDistribution,
      selectedOption.title,
      getQualityColor(banner.value?.bannerType === 2 ? 5 : 4) + 'CC',
      userPullMarkerValue.value
    )
  })

  onMounted(async () => {
    if (Object.keys(processedPulls.value).length > 0) return

    try {
      await initFromIndexedDB()
    } catch (error) {
      console.error('Failed to load local pull data:', error)
    }
  })

  const itemDistributionChartOption = computed(() => {
    const selectedOption = selectedItemDistributionOption.value
    if (!selectedOption?.scopeKey) return {}

    const scopeStats = statsData.value?.scopes[selectedOption.scopeKey]
    if (selectedOption.type === 'fifth') {
      return createItemDistributionChartOption(
        scopeStats?.fifthItemDistribution,
        selectedOption.title
      )
    }

    return createItemDistributionChartOption(
      scopeStats?.firstItemDistribution,
      selectedOption.title
    )
  })

  useSeoMeta({
    title: () =>
      banner.value
        ? `${bannerName.value} - ${t('global.banner_stats.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`
        : `${t('global.banner_stats.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () =>
      banner.value
        ? t('meta.description.global_banner', { name: bannerName.value })
        : t('meta.description.global'),
    ogTitle: () =>
      banner.value
        ? `${bannerName.value} - ${t('global.banner_stats.title')}`
        : t('global.banner_stats.title'),
    ogDescription: () =>
      banner.value
        ? t('meta.description.global_banner', { name: bannerName.value })
        : t('meta.description.global'),
  })
</script>
