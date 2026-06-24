<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <n-card
      v-if="banner"
      size="small"
      class="rounded-xl p-0 sm:p-2"
    >
      <div>
        <div class="flex flex-col gap-2">
          <div class="flex flex-col justify-between gap-3 sm:flex-row">
            <!-- Banner Navigation -->
            <div class="flex items-center justify-start gap-2">
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    size="small"
                    text
                    @click="
                      navigateTo(`${localePath('/banners')}#${banner.bannerId}`)
                    "
                  >
                    <template #icon>
                      <n-icon :depth="3"><CalendarAlt /></n-icon>
                    </template>
                  </n-button>
                </template>
                {{ t('navigation.banner') }}
              </n-tooltip>

              <!-- Previous Banner Navigation -->
              <n-button
                v-if="prevBanner"
                size="small"
                text
                @click="
                  navigateTo(
                    localePath(
                      getEntityDetailPath('banner', prevBanner.bannerId)
                    )
                  )
                "
              >
                <template #icon>
                  <n-icon :depth="3"><ChevronLeft /></n-icon>
                </template>
              </n-button>

              <n-gradient-text
                :size="18"
                class="m-0 font-medium wrap-break-word"
                :type="banner.bannerType === 2 ? 'warning' : 'info'"
              >
                {{ t(`banner.${banner.bannerId}.name`) }}
              </n-gradient-text>

              <!-- Next Banner Navigation -->
              <n-button
                v-if="nextBanner"
                size="small"
                text
                @click="
                  navigateTo(
                    localePath(
                      getEntityDetailPath('banner', nextBanner.bannerId)
                    )
                  )
                "
              >
                <template #icon>
                  <n-icon :depth="3"><ChevronRight /></n-icon>
                </template>
              </n-button>
            </div>

            <!-- Controls -->
            <div class="flex justify-end gap-4">
              <!-- Edit Button -->
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    text
                    size="small"
                    :type="showCollectionEditor ? 'primary' : 'default'"
                    @click="showCollectionEditor = true"
                  >
                    <template #icon>
                      <n-icon :depth="3"><Edit /></n-icon>
                    </template>
                  </n-button>
                </template>
                {{ $t('tracker.manual_log.open_editor') }}
              </n-tooltip>

              <!-- Display Mode Toggle -->
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    text
                    size="small"
                    @click="showItems = !showItems"
                  >
                    <template #icon>
                      <n-icon :depth="3">
                        <Th v-if="!showItems" />
                        <ThLarge v-else />
                      </n-icon>
                    </template>
                  </n-button>
                </template>
                {{
                  showItems
                    ? $t('tracker.banner.settings.outfit_display')
                    : $t('tracker.banner.settings.item_display')
                }}
              </n-tooltip>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_3fr]">
            <div class="space-y-2">
              <div
                class="relative aspect-2/1 w-full overflow-hidden rounded-lg"
              >
                <NuxtImg
                  :src="getImageSrc('banner', banner.bannerId)"
                  :alt="bannerName"
                  class="absolute inset-0 h-full w-full object-cover"
                  preset="bannerHero"
                  fit="cover"
                  loading="lazy"
                  sizes="300px sm:600px"
                />
              </div>
              <div
                v-for="(run, index) in banner.runs"
                :key="index"
                class="space-y-2"
              >
                <div class="flex flex-col items-center gap-1">
                  <div class="flex items-center gap-1">
                    <NuxtLinkLocale
                      :to="
                        getBannerVersionListLocation(getVersion(run.version))
                      "
                      class="transition-opacity hover:opacity-80"
                    >
                      <n-tag
                        :bordered="false"
                        class="cursor-pointer"
                      >
                        {{ t(`version.${getVersion(run.version)}`) }}
                      </n-tag>
                    </NuxtLinkLocale>
                    <NuxtLinkLocale
                      :to="
                        getBannerVersionListLocation(getVersion(run.version))
                      "
                      class="transition-opacity hover:opacity-80"
                    >
                      <n-tag
                        :bordered="false"
                        class="cursor-pointer"
                      >
                        {{ t('banner.version') }}
                        {{ getVersion(run.version) }}
                      </n-tag>
                    </NuxtLinkLocale>
                  </div>
                  <div class="flex items-center gap-1">
                    <n-tag :bordered="false">
                      <template #avatar>
                        <n-icon><CalendarDay /></n-icon>
                      </template>
                      <n-time
                        :time="new Date(run.start + 'T00:00:00')"
                        type="date"
                      />
                      -
                      <n-time
                        :time="new Date(run.end + 'T00:00:00')"
                        type="date"
                      />
                    </n-tag>
                    <n-tag
                      v-if="index > 0"
                      :bordered="false"
                    >
                      {{ t('default.rerun') }}
                    </n-tag>
                  </div>
                </div>
              </div>

              <n-divider />
              <!-- Pull Statistics -->
              <div
                size="small"
                :bordered="false"
                class="rounded-lg px-2"
              >
                <div
                  class="mb-2 flex items-center justify-center gap-2 text-base text-gray-500"
                >
                  <n-text class="font-medium text-gray-500">{{
                    t('tracker.stats.title')
                  }}</n-text>
                </div>
                <div class="space-y-3">
                  <div
                    class="rounded-lg border border-gray-200/70 px-3 py-2 dark:border-gray-700/70"
                  >
                    <div
                      class="mb-2 flex items-center justify-between gap-2 text-gray-500"
                    >
                      <div class="flex items-center gap-2 text-sm font-medium">
                        <n-tooltip trigger="hover">
                          <template #trigger>
                            <n-button
                              text
                              size="tiny"
                              @click="navigateTo(localePath('/tracker'))"
                            >
                              <template #icon>
                                <n-icon :depth="3"><Book /></n-icon>
                              </template>
                            </n-button>
                          </template>
                          {{ $t('navigation.tracker') }}
                        </n-tooltip>
                        <span>{{ t('default.your_data') }}</span>
                      </div>

                      <DiceAnimation
                        v-if="
                          bannerPulls &&
                          (banner.bannerType === 1 ||
                            banner.bannerType === 2) &&
                          bannerPulls.stats.avg5StarPulls > 0
                        "
                        :percentile="
                          getBannerAvg5StarPercentile(
                            bannerPulls.stats.avg5StarPulls
                          )
                        "
                      />

                      <DiceAnimation
                        v-if="
                          bannerPulls &&
                          banner.bannerType === 3 &&
                          bannerPulls.stats.avg4StarOnlyPulls > 0
                        "
                        :percentile="
                          getBannerAvg4StarType3Percentile(
                            bannerPulls.stats.avg4StarOnlyPulls
                          )
                        "
                      />
                    </div>
                    <div
                      v-if="loading"
                      class="space-y-2 text-base"
                    >
                      <div
                        v-for="i in banner.bannerType === 3 ? 4 : 6"
                        :key="i"
                        class="flex items-center justify-between"
                      >
                        <n-skeleton
                          text
                          :width="100"
                          :sharp="false"
                          size="small"
                        />
                        <n-skeleton
                          text
                          :width="40"
                          :sharp="false"
                          size="small"
                        />
                      </div>
                    </div>
                    <div
                      v-else-if="
                        bannerPulls && bannerPulls.stats.totalPulls > 0
                      "
                      class="grid grid-cols-1 gap-2"
                    >
                      <div class="space-y-2 text-base">
                        <div class="flex justify-between">
                          <span class="text-sm">
                            {{ t('common.stats.total_pulls') }}
                          </span>
                          <span class="font-medium">{{
                            bannerPulls.stats.totalPulls
                          }}</span>
                        </div>
                        <div
                          v-if="
                            banner.bannerType === 1 || banner.bannerType === 2
                          "
                          class="flex justify-between"
                        >
                          <span class="text-sm">
                            {{ t('tracker.banner.stats.total_5star') }}
                          </span>
                          <span class="font-medium text-amber-500">{{
                            bannerPulls.stats.total5StarItems
                          }}</span>
                        </div>
                        <div
                          v-if="
                            banner.bannerType === 1 || banner.bannerType === 2
                          "
                          class="flex justify-between"
                        >
                          <span class="text-sm">
                            {{ t('tracker.banner.stats.avg_5star') }}
                          </span>
                          <span class="font-medium text-amber-500">{{
                            bannerPulls.stats.avg5StarPulls.toFixed(2)
                          }}</span>
                        </div>
                        <div
                          v-if="
                            (banner.bannerType === 1 ||
                              banner.bannerType === 2) &&
                            bannerPulls.stats.completion < 2
                          "
                          class="flex justify-between"
                        >
                          <span class="text-sm">
                            {{ t('tracker.banner.stats.pity_5star') }}
                          </span>
                          <span class="font-medium">{{
                            bannerPulls.stats.pity5Star
                          }}</span>
                        </div>
                        <div
                          v-if="
                            banner.bannerType === 1 || banner.bannerType === 2
                          "
                          class="flex justify-between"
                        >
                          <span class="text-sm">
                            {{ t('tracker.banner.stats.total_4star') }}
                          </span>
                          <span class="font-medium text-blue-500">{{
                            bannerPulls.stats.total4StarItems
                          }}</span>
                        </div>
                        <div
                          v-if="
                            banner.bannerType === 1 || banner.bannerType === 2
                          "
                          class="flex justify-between"
                        >
                          <span class="text-sm">
                            {{ t('tracker.banner.stats.avg_4star') }}
                          </span>
                          <span class="font-medium text-blue-500">{{
                            bannerPulls.stats.avg4StarPulls.toFixed(2)
                          }}</span>
                        </div>
                        <div
                          v-if="banner.bannerType === 3"
                          class="flex justify-between"
                        >
                          <span class="text-sm">
                            {{ t('tracker.banner.stats.total_4star') }}
                          </span>
                          <span class="font-medium text-blue-500">{{
                            bannerPulls.stats.total4StarOnlyItems
                          }}</span>
                        </div>
                        <div
                          v-if="banner.bannerType === 3"
                          class="flex justify-between"
                        >
                          <span class="text-sm">
                            {{ t('tracker.banner.stats.avg_4star') }}
                          </span>
                          <span class="font-medium text-blue-500">{{
                            bannerPulls.stats.avg4StarOnlyPulls.toFixed(2)
                          }}</span>
                        </div>
                        <div
                          v-if="
                            banner.bannerType === 3 &&
                            bannerPulls.stats.completion < 2
                          "
                          class="flex justify-between"
                        >
                          <span class="text-sm">
                            {{ t('tracker.banner.stats.pity_4star') }}
                          </span>
                          <span class="font-medium">{{
                            bannerPulls.stats.pity4Star
                          }}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      v-else
                      class="text-center text-gray-400"
                    >
                      <span class="inline-flex items-center gap-1">
                        {{ t('tracker.stats.no_pulls') }}
                        <n-tooltip trigger="hover">
                          <template #trigger>
                            <n-button
                              text
                              size="small"
                              @click="navigateTo(localePath('/import'))"
                            >
                              <template #icon>
                                <n-icon
                                  size="16"
                                  :depth="3"
                                  ><FileImport
                                /></n-icon>
                              </template>
                            </n-button>
                          </template>
                          {{ $t('navigation.import') }}
                        </n-tooltip>
                      </span>
                    </div>
                  </div>

                  <button
                    v-if="bannerStatsPath"
                    type="button"
                    class="w-full cursor-pointer rounded-lg border border-gray-200/70 px-3 py-2 text-left transition-colors hover:border-pink-200 hover:bg-pink-50/40 focus-visible:ring-2 focus-visible:ring-pink-300/60 focus-visible:outline-none dark:border-gray-700/70 dark:hover:border-pink-900/50 dark:hover:bg-pink-950/10"
                    @click="navigateTo(bannerStatsPath)"
                  >
                    <div
                      class="flex w-full items-center justify-between gap-3 text-sm font-medium text-gray-500 transition-colors"
                    >
                      <span class="flex min-w-0 items-center gap-2">
                        <n-icon :depth="3"><ChartLine /></n-icon>
                        <span class="truncate">{{
                          t('navigation.global')
                        }}</span>
                      </span>
                      <n-icon
                        :depth="3"
                        class="shrink-0"
                      >
                        <ChevronRight />
                      </n-icon>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <!-- Traditional Card Mode -->
              <template v-if="!showItems">
                <div v-if="banner.outfit5StarId.length > 0">
                  <div class="space-y-2">
                    <OutfitDataCard
                      v-for="outfitId in banner.outfit5StarId"
                      :key="outfitId"
                      :banner-id="banner.bannerId"
                      :outfit-id="outfitId"
                      :quality="5"
                      :completion-data="{
                        completion:
                          bannerPulls?.outfits.find(
                            (outfit: Outfit) => outfit.id === outfitId
                          )?.completion || 0,
                        totalPulls: bannerPulls?.stats.totalPulls || 0,
                      }"
                    />
                  </div>
                </div>

                <div v-if="banner.outfit4StarId.length > 0">
                  <div class="space-y-2">
                    <OutfitDataCard
                      v-for="outfitId in banner.outfit4StarId"
                      :key="outfitId"
                      :banner-id="banner.bannerId"
                      :outfit-id="outfitId"
                      :quality="4"
                      :completion-data="{
                        completion:
                          bannerPulls?.outfits.find(
                            (outfit: Outfit) => outfit.id === outfitId
                          )?.completion || 0,
                        totalPulls: bannerPulls?.stats.totalPulls || 0,
                      }"
                    />
                  </div>
                </div>
              </template>

              <!-- Carousel Mode -->
              <template v-else>
                <div v-if="banner.outfit5StarId.length > 0">
                  <div
                    v-for="(outfitId, outfitIndex) in banner.outfit5StarId"
                    :key="outfitId"
                  >
                    <n-divider
                      v-if="outfitIndex > 0"
                      class="my-2"
                    />
                    <OutfitCarousel
                      :outfit-id="outfitId"
                      :quality="5"
                      :banner-id="banner.bannerId"
                      :completion-levels="
                        getOutfitCompletionLevels(outfitId, 5)
                      "
                    />
                  </div>
                </div>

                <n-divider
                  v-if="banner.bannerType === 1 || banner.bannerType === 2"
                  class="my-2"
                />

                <div v-if="banner.outfit4StarId.length > 0">
                  <div
                    v-for="(outfitId, outfitIndex) in banner.outfit4StarId"
                    :key="outfitId"
                  >
                    <n-divider
                      v-if="outfitIndex > 0"
                      class="my-2"
                    />
                    <OutfitCarousel
                      :outfit-id="outfitId"
                      :quality="4"
                      :banner-id="banner.bannerId"
                      :completion-levels="
                        getOutfitCompletionLevels(outfitId, 4)
                      "
                    />
                  </div>
                </div>
              </template>

              <!-- Deep Echoes -->
              <div
                v-if="banner.rewardIds && banner.rewardIds.length > 0"
                class="mt-4"
              >
                <n-divider class="my-4" />
                <div class="space-y-2">
                  <n-tag
                    type="warning"
                    :bordered="false"
                    round
                  >
                    <span class="flex items-center gap-1">
                      {{ t('banner.deep_echoes') }}
                      <n-icon>
                        <Star />
                      </n-icon>
                    </span>
                  </n-tag>
                  <div class="grid grid-cols-5 gap-2 lg:grid-cols-10">
                    <ItemDataCard
                      v-for="(rewardId, i) in banner.rewardIds"
                      :key="rewardId"
                      :item="{
                        itemId: rewardId,
                        quality: 5,
                        count: 1,
                        pullsToObtain: i * 10 + 5,
                        pullIndex: i * 10 + 5,
                        bannerId: banner.bannerId,
                        outfitId: '',
                        obtainedAt: '',
                      }"
                      :info="false"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </n-card>

    <n-card
      v-else
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-2 sm:p-4"
    >
      <n-result
        size="small"
        status="info"
        :title="t('banner.not_found')"
        :description="t('error.404')"
      >
        <template #icon>
          <div class="flex justify-center">
            <NuxtImg
              :src="getImageSrc('emote', 'think')"
              class="mx-auto h-24 w-24 object-cover sm:h-32 sm:w-32"
              preset="iconLg"
              fit="cover"
              sizes="160px sm:200px"
            />
          </div>
        </template>
        <template #footer>
          <n-button
            type="primary"
            @click="navigateTo(localePath('/banners'))"
          >
            {{ $t('navigation.banner') }}
          </n-button>
        </template>
      </n-result>
    </n-card>

    <!-- Collection Editor Modal -->
    <n-modal
      v-model:show="showCollectionEditor"
      class="w-full max-w-5xl"
      transform-origin="center"
    >
      <template #default>
        <CollectionEditor
          :banner-id="banner!.bannerId"
          @close="showCollectionEditor = false"
        />
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
  import {
    CalendarAlt,
    Book,
    Edit,
    Th,
    ThLarge,
    FileImport,
    Star,
    CalendarDay,
    ChevronLeft,
    ChevronRight,
    ChartLine,
  } from '@vicons/fa'
  import { BANNER_DATA } from '~~/data/banners'
  import { LATEST_BANNER_ID } from '~~/data/config'

  const { t } = useI18n()
  const { getImageSrc } = imageProvider()
  const requestEvent = useRequestEvent()

  const localePath = useLocalePath()
  const pullStore = usePullStore()
  const { processedPulls } = storeToRefs(pullStore)
  const loading = ref(true)
  const message = useMessage()
  const { initFromIndexedDB } = usePullStoreData()
  const showCollectionEditor = ref(false)
  const showItems = ref(true)

  // Get banner ID from route
  const {
    entityId: bannerId,
    canonicalUrl: canonicalBannerUrl,
    redirectToCanonicalSlug,
  } = useEntityDetailRoute('banner')

  await redirectToCanonicalSlug()

  // Import percentile functions from utils (pure functions)
  const { getBannerAvg5StarPercentile, getBannerAvg4StarType3Percentile } =
    await import('~/utils/percentile')

  const banner = computed(() => {
    return BANNER_DATA[bannerId.value]
  })

  if (import.meta.server && requestEvent && !banner.value) {
    setResponseStatus(requestEvent, 404)
    applyPageCacheHeaders(requestEvent, 'noStore')
  }

  const bannerName = computed(() => {
    if (!banner.value) return ''
    return t(`banner.${bannerId.value}.name`)
  })
  const bannerStatsPath = computed(() => {
    if (
      !banner.value ||
      banner.value.bannerType === 1 ||
      banner.value.bannerId > LATEST_BANNER_ID
    )
      return ''

    return localePath(
      `/global/${getEntitySlug('banner', banner.value.bannerId)}`
    )
  })
  const bannerSeoName = computed(
    () => bannerName.value || t('navigation.banner_detail')
  )
  const bannerSeoTitle = computed(() =>
    bannerName.value
      ? `${bannerName.value} - ${t('navigation.banner_detail')}`
      : t('navigation.banner_detail')
  )

  const bannerPulls = computed(() => {
    if (!banner.value) return null
    return processedPulls.value[banner.value.bannerId]
  })

  // Navigation computed properties
  const bannerIds = computed(() =>
    Object.keys(BANNER_DATA)
      .map(Number)
      .sort((a, b) => a - b)
  )

  const currentBannerIndex = computed(() => {
    if (!banner.value) return -1
    return bannerIds.value.indexOf(banner.value.bannerId)
  })

  const prevBannerId = computed(() => {
    const index = currentBannerIndex.value
    return index > 0 ? bannerIds.value[index - 1] : null
  })

  const nextBannerId = computed(() => {
    const index = currentBannerIndex.value
    return index >= 0 && index < bannerIds.value.length - 1
      ? bannerIds.value[index + 1]
      : null
  })

  const prevBanner = computed(() =>
    prevBannerId.value ? BANNER_DATA[prevBannerId.value] : null
  )
  const nextBanner = computed(() =>
    nextBannerId.value ? BANNER_DATA[nextBannerId.value] : null
  )

  const getVersion = (version: string) => {
    // Extract major.minor version for season lookup (e.g., "1.10" from "1.10.1")
    const parts = version.split('.')
    return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : version
  }
  const getBannerVersionListLocation = (version: string) => {
    const slug = resolveSeoBannerVersionSlug(version)
    return slug
      ? `/banners/version/${slug}`
      : {
          path: '/banners',
          query: { version },
        }
  }

  // Helper function to get outfit completion levels
  const getOutfitCompletionLevels = (outfitId: string, quality: number) => {
    if (!bannerPulls.value) return []

    const totalPulls = bannerPulls.value.stats.totalPulls
    const outfitCompletion =
      bannerPulls.value.outfits.find((outfit: Outfit) => outfit.id === outfitId)
        ?.completion || 0
    const manualEvoLevel = pullStore.getOutfitEvoLevel(
      banner.value!.bannerId,
      outfitId
    )

    return getBannerOutfitVariantLevels({
      quality,
      totalPulls,
      outfitCompletion,
      manualEvoLevel,
    }).map(toBannerDisplayLevelKey)
  }

  // Function to load and process data based on current data source
  const loadAndProcessData = async () => {
    try {
      loading.value = true
      await initFromIndexedDB()
    } catch (error) {
      console.error('Failed to load data:', error)
      message.error(t('tracker.no_data.error'))
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    if (Object.keys(processedPulls.value).length > 0) {
      loading.value = false
      return
    }
    await loadAndProcessData()
  })

  // SEO Meta Tags
  const ogItemImage = computed(() =>
    banner.value ? getOgImageSrc('banner', banner.value.bannerId) : undefined
  )

  useSeoMeta({
    title: () =>
      `${bannerSeoTitle.value} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () =>
      t('meta.description.banner_detail', {
        name: bannerSeoName.value,
      }),
    ogTitle: () =>
      `${bannerSeoTitle.value} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () =>
      t('meta.description.banner_detail', {
        name: bannerSeoName.value,
      }),
    ogImage: () => ogItemImage.value,
    twitterTitle: () =>
      `${bannerSeoTitle.value} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () =>
      t('meta.description.banner_detail', {
        name: bannerSeoName.value,
      }),
    twitterImage: () => ogItemImage.value,
  })

  useHead({
    link: () =>
      canonicalBannerUrl.value
        ? [{ rel: 'canonical', href: canonicalBannerUrl.value }]
        : [],
  })
</script>
