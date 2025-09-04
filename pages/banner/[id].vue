<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <n-card
      v-if="banner"
      size="small"
      class="rounded-xl p-0 sm:p-2"
      :style="cardStyle"
    >
      <div>
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    size="small"
                    text
                    @click="
                      navigateTo(`${localePath('/banner')}#${banner.bannerId}`)
                    "
                  >
                    <template #icon>
                      <n-icon><ArrowLeft /></n-icon>
                    </template>
                  </n-button>
                </template>
                {{ t('navigation.banner') }}
              </n-tooltip>
              <n-gradient-text
                :size="18"
                class="m-0 font-medium break-words"
                :type="banner.bannerType === 2 ? 'warning' : 'info'"
              >
                {{ t(`banner.${banner.bannerId}.name`) }}
              </n-gradient-text>
            </div>

            <!-- Controls -->
            <div class="flex gap-4">
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
                      <n-icon depth="3"><Edit /></n-icon>
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
                      <n-icon depth="3">
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

          <div class="grid grid-cols-1 sm:grid-cols-[1fr_3fr] gap-4">
            <div class="space-y-4">
              <div
                class="w-full aspect-[2/1] relative overflow-hidden rounded-lg"
              >
                <NuxtImg
                  :src="`/images/banners/${banner.bannerId}.webp`"
                  :alt="t(`banner.${banner.bannerId}.name`)"
                  class="absolute inset-0 w-full h-full object-cover"
                  format="webp"
                  width="1000"
                  height="500"
                  fit="cover"
                  :quality="100"
                  loading="lazy"
                  sizes="400px sm:800px"
                />
              </div>
              <div class="space-y-2">
                <div
                  v-for="(run, index) in banner.runs"
                  :key="index"
                  class="flex items-center gap-2"
                >
                  <n-tag
                    round
                    size="small"
                    :bordered="false"
                    >{{ t('banner.version') }}
                    {{ run.version.slice(0, -2) }}</n-tag
                  >
                  <n-text depth="3">
                    <n-time
                      :time="new Date(run.start + 'T00:00:00')"
                      type="date"
                    />
                    -
                    <n-time
                      :time="new Date(run.end + 'T00:00:00')"
                      type="date"
                    />
                  </n-text>
                </div>
              </div>

              <!-- Pull Statistics -->
              <div
                size="small"
                :bordered="false"
                class="rounded-lg px-2"
                :style="cardStyle"
              >
                <div class="space-y-2">
                  <div
                    class="flex items-center justify-center text-base gap-2 text-gray-500"
                  >
                    <n-icon><ChartBarRegular /></n-icon>
                    <n-text class="font-medium text-gray-500">{{
                      t('tracker.stats.title')
                    }}</n-text>

                    <DiceAnimation
                      v-if="
                        bannerPulls &&
                        (banner.bannerType === 1 || banner.bannerType === 2) &&
                        bannerPulls.stats.avg5StarPulls > 0
                      "
                      :percentile="
                        getAvg5StarPercentile(bannerPulls.stats.avg5StarPulls)
                      "
                    />

                    <DiceAnimation
                      v-if="
                        bannerPulls &&
                        banner.bannerType === 3 &&
                        bannerPulls.stats.avg4StarOnlyPulls > 0
                      "
                      :percentile="
                        getAvg4StarType3Percentile(
                          bannerPulls.stats.avg4StarOnlyPulls
                        )
                      "
                    />
                  </div>
                  <div
                    v-if="loading"
                    class="space-y-2 px-8 text-base"
                  >
                    <div
                      v-for="i in banner.bannerType === 3 ? 4 : 6"
                      :key="i"
                      class="flex justify-between items-center"
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
                    v-else-if="bannerPulls && bannerPulls.stats.totalPulls > 0"
                    class="grid grid-cols-1 gap-2"
                  >
                    <div class="space-y-2 px-8 text-base">
                      <div class="flex justify-between">
                        <span class="text-sm">
                          {{ t('tracker.stats.total_pulls') }}
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
                    class="text-gray-400 text-center"
                  >
                    <span class="inline-flex items-center gap-1">
                      {{ t('tracker.stats.no_pulls') }}
                      <n-tooltip trigger="hover">
                        <template #trigger>
                          <n-button
                            text
                            size="small"
                            @click="router.push(localePath('/import'))"
                          >
                            <template #icon>
                              <n-icon
                                size="16"
                                depth="3"
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
              </div>
            </div>

            <div class="space-y-2">
              <!-- Traditional Card Mode -->
              <template v-if="!showItems">
                <div v-if="banner.outfit5StarId.length > 0">
                  <div class="space-y-2">
                    <OutfitCard
                      v-for="outfitId in banner.outfit5StarId"
                      :key="outfitId"
                      :banner-id="banner.bannerId"
                      :outfit-id="outfitId"
                      :rarity="5"
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
                    <OutfitCard
                      v-for="outfitId in banner.outfit4StarId"
                      :key="outfitId"
                      :banner-id="banner.bannerId"
                      :outfit-id="outfitId"
                      :rarity="4"
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
                    v-for="outfitId in banner.outfit5StarId"
                    :key="outfitId"
                    class="space-y-3"
                  >
                    <div class="flex items-center gap-2">
                      <n-tag
                        size="small"
                        type="warning"
                        :bordered="false"
                        round
                      >
                        {{ t(`outfit.${outfitId}.name`) }} 5<n-icon class="ml-1"
                          ><Star
                        /></n-icon>
                      </n-tag>
                    </div>

                    <!-- Outfit Images Carousel with Items Grid -->
                    <div class="flex flex-col lg:flex-row gap-4">
                      <!-- Carousel Container -->
                      <div class="w-full lg:w-auto flex-shrink-0">
                        <n-carousel
                          ref="carousel5Star"
                          effect="card"
                          :show-dots="true"
                          dot-placement="left"
                          :centered-slides="false"
                          :slides-per-view="2"
                          draggable
                          class="rounded-lg w-full sm:w-[400px] aspect-[4/3]"
                        >
                          <n-carousel-item
                            v-for="(image, index) in getOutfitImages(
                              outfitId,
                              5
                            )"
                            :key="index"
                            class="w-[60%]"
                          >
                            <div
                              class="relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-300 ease-in-out ring-1 w-full h-full"
                              :class="[
                                isDark
                                  ? 'bg-gradient-to-br from-[#713f12] to-[#451a03] hover:shadow-[0_0_15px_0_rgba(113,63,18,0.5)] ring-amber-900/30 hover:ring-amber-900/60'
                                  : 'bg-gradient-to-br from-[#fff8e1] to-[#ffcc80] hover:shadow-[0_0_15px_0_rgba(255,204,128,0.5)] ring-amber-200/30 hover:ring-amber-200/80',
                              ]"
                            >
                              <NuxtImg
                                :src="image.src"
                                :alt="image.alt"
                                class="absolute inset-0 w-full h-full object-contain z-10"
                                format="webp"
                                width="400"
                                height="600"
                                fit="cover"
                                :quality="100"
                                loading="lazy"
                                sizes="400px"
                              />
                              <div
                                class="absolute top-1 scale-90 sm:scale-100 z-20"
                                :class="[
                                  image.level === 'glow'
                                    ? 'left-1 origin-top-left'
                                    : 'right-1 origin-top-right',
                                ]"
                              >
                                <n-tag
                                  round
                                  size="small"
                                  :bordered="false"
                                  type="warning"
                                >
                                  {{
                                    t(
                                      `banner.outfit.level.${image.level === 0 ? '1' : image.level}`
                                    )
                                  }}
                                  <span
                                    v-if="
                                      getOutfitCompletionLevels(
                                        outfitId,
                                        5
                                      ).includes(image.level.toString())
                                    "
                                  >
                                    <n-icon><CheckCircle /></n-icon>
                                  </span>
                                </n-tag>
                              </div>
                            </div>
                          </n-carousel-item>
                        </n-carousel>
                      </div>

                      <!-- Outfit Items Grid -->
                      <div class="flex-1 min-w-0">
                        <div class="grid grid-cols-5 gap-2">
                          <ItemCard
                            v-for="item in getOutfitItems(outfitId)"
                            :key="item.itemId"
                            :item="item"
                            :info="false"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="banner.outfit4StarId.length > 0">
                  <div
                    v-for="outfitId in banner.outfit4StarId"
                    :key="outfitId"
                    class="space-y-3"
                  >
                    <div class="flex items-center gap-2">
                      <n-tag
                        size="small"
                        type="info"
                        :bordered="false"
                        round
                      >
                        {{ t(`outfit.${outfitId}.name`) }} 4<n-icon class="ml-1"
                          ><Star
                        /></n-icon>
                      </n-tag>
                    </div>

                    <!-- Outfit Images Carousel with Items Grid -->
                    <div class="flex flex-col lg:flex-row gap-4">
                      <!-- Carousel Container -->
                      <div class="w-full lg:w-auto flex-shrink-0">
                        <n-carousel
                          ref="carousel4Star"
                          effect="card"
                          :show-dots="true"
                          dot-placement="left"
                          :centered-slides="false"
                          :slides-per-view="2"
                          draggable
                          class="rounded-lg w-full sm:w-[400px] aspect-[4/3]"
                        >
                          <n-carousel-item
                            v-for="(image, index) in getOutfitImages(
                              outfitId,
                              4
                            )"
                            :key="index"
                            class="w-[40%]"
                          >
                            <div
                              class="relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-300 ease-in-out ring-1 w-full h-full"
                              :class="[
                                isDark
                                  ? 'bg-gradient-to-br from-[#334155] to-[#1e293b] hover:shadow-[0_0_15px_0_rgba(51,65,85,0.5)] ring-slate-400/20 hover:ring-slate-400/40'
                                  : 'bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb] hover:shadow-[0_0_15px_0_rgba(187,222,251,0.5)] ring-blue-200/30 hover:ring-blue-200/80',
                              ]"
                            >
                              <NuxtImg
                                :src="image.src"
                                :alt="image.alt"
                                class="absolute inset-0 w-full h-full object-contain z-10"
                                format="webp"
                                width="400"
                                height="600"
                                fit="cover"
                                :quality="100"
                                loading="lazy"
                                sizes="400px"
                              />
                              <div
                                class="absolute top-1 scale-90 sm:scale-100 z-20"
                                :class="[
                                  image.level === 'glow'
                                    ? 'left-1 origin-top-left'
                                    : 'right-1 origin-top-right',
                                ]"
                              >
                                <n-tag
                                  round
                                  size="small"
                                  :bordered="false"
                                  type="info"
                                >
                                  {{
                                    t(
                                      `banner.outfit.level.${image.level === 0 ? '1' : image.level}`
                                    )
                                  }}
                                  <span
                                    v-if="
                                      getOutfitCompletionLevels(
                                        outfitId,
                                        4
                                      ).includes(image.level.toString())
                                    "
                                  >
                                    <n-icon><CheckCircle /></n-icon>
                                  </span>
                                </n-tag>
                              </div>
                            </div>
                          </n-carousel-item>
                        </n-carousel>
                      </div>

                      <!-- Outfit Items Grid -->
                      <div class="flex-1 min-w-0">
                        <div class="grid grid-cols-5 gap-2">
                          <ItemCard
                            v-for="item in getOutfitItems(outfitId)"
                            :key="item.itemId"
                            :item="item"
                            :info="false"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </n-card>

    <n-card
      v-else
      class="text-center rounded-xl"
    >
      <n-empty>
        <template #default>
          <div class="text-xl text-neutral-500">
            {{ t('banner.not_found') }}
          </div>
        </template>
        <template #extra>
          <n-button
            type="primary"
            @click="router.push(localePath('/banner'))"
          >
            {{ t('navigation.banner') }}
          </n-button>
        </template>
      </n-empty>
    </n-card>

    <!-- Collection Editor Modal -->
    <n-modal
      v-model:show="showCollectionEditor"
      class="w-full max-w-5xl"
      size="small"
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
    ArrowLeft,
    ChartBarRegular,
    Edit,
    Star,
    CheckCircle,
    Th,
    ThLarge,
    FileImport,
  } from '@vicons/fa'
  import { BANNER_DATA } from '~/data/banners'
  import { useMessage } from 'naive-ui'
  import type { Outfit } from '~/types/outfit'
  import OUTFIT_DATA, { type OutfitKey } from '~/data/outfits'
  import type { PullItem } from '~/types/pull'

  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()
  const { cardStyle } = useCardStyle()
  const localePath = useLocalePath()
  const siteUrl = useRuntimeConfig().public.siteUrl
  const pullStore = usePullStore()
  const { processedPulls } = storeToRefs(pullStore)
  const loading = ref(true)
  const message = useMessage()
  const { loadData } = useIndexedDB()
  const showCollectionEditor = ref(false)
  const showItems = ref(true)

  const { getAvg5StarPercentile, getAvg4StarType3Percentile } = usePercentile()
  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')

  const banner = computed(() => {
    const bannerId = parseInt(route.params.id as string)
    return BANNER_DATA[bannerId]
  })

  const bannerPulls = computed(() => {
    if (!banner.value) return null
    return processedPulls.value[banner.value.bannerId]
  })

  // Helper function to get outfit images for carousel
  const getOutfitImages = (outfitId: string, rarity: number) => {
    const images = []
    images.push({
      src: `/images/outfits/${outfitId}.webp`,
      alt: `${t(`outfit.${outfitId}.name`)} Base`,
      level: 0,
    })

    // Add level variants based on rarity
    const maxLevel = rarity === 5 ? 4 : 2
    for (let i = 2; i <= maxLevel; i++) {
      images.push({
        src: `/images/outfits/${outfitId}_LV${i}.webp`,
        alt: `${t(`outfit.${outfitId}.name`)} LV${i}`,
        level: i,
      })
    }

    // Add LV1 (glowed up) image
    images.push({
      src: `/images/outfits/${outfitId}_LV1.webp`,
      alt: `${t(`outfit.${outfitId}.name`)} LV1`,
      level: 'glow',
    })

    return images
  }

  // Helper function to get outfit completion levels
  const getOutfitCompletionLevels = (outfitId: string, rarity: number) => {
    if (!bannerPulls.value) return []

    const levels = []
    const totalPulls = bannerPulls.value.stats.totalPulls
    const outfitCompletion =
      bannerPulls.value.outfits.find((outfit: Outfit) => outfit.id === outfitId)
        ?.completion || 0
    const manualEvoLevel = pullStore.getOutfitEvoLevel(
      banner.value!.bannerId,
      outfitId
    )

    if (rarity === 5) {
      if (outfitCompletion >= 1) {
        levels.push('0')
        levels.push('1')
      }
      if ((totalPulls >= 180 || manualEvoLevel >= 2) && outfitCompletion >= 1) {
        levels.push('2')
      }
      if ((totalPulls >= 230 || manualEvoLevel >= 3) && outfitCompletion >= 1) {
        levels.push('3')
      }
      if (outfitCompletion >= 2) {
        levels.push('4')
      }
    } else {
      if (outfitCompletion >= 1) {
        levels.push('0')
        levels.push('1')
      }
      if (outfitCompletion >= 2) levels.push('2')
    }

    return levels
  }

  // Helper function to get outfit items for ItemCard display
  const getOutfitItems = (outfitId: string): PullItem[] => {
    const outfit = OUTFIT_DATA[outfitId as OutfitKey]

    return outfit.items.map((itemId) => {
      return {
        itemId: itemId,
        outfitId: outfitId,
        rarity: banner.value!.outfit5StarId.includes(outfitId) ? 5 : 4,
        count: 1,
        pullIndex: 0,
        pullsToObtain: 0,
        obtainedAt: '',
        bannerId: banner.value!.bannerId,
      }
    })
  }

  onMounted(async () => {
    if (Object.keys(processedPulls.value).length > 0) {
      loading.value = false
      return
    }
    try {
      loading.value = true
      const {
        pulls: pullData,
        edits: editData,
        evo: evoData,
        pearpal: pearpalData,
      } = await loadData()

      // Decide which data source to prioritize
      const dataSource = useDataSource()
      const hasPearpal = Object.keys(pearpalData).length > 0
      const hasGame =
        Object.keys(pullData).length > 0 || Object.keys(editData).length > 0

      if (hasPearpal && hasGame) {
        if (dataSource.value === 'pearpal') {
          await pullStore.processPearpalData(pearpalData)
        } else if (dataSource.value === 'game') {
          await pullStore.processPullData(pullData, editData)
        } else {
          await pullStore.processAutoData(pullData, editData, pearpalData)
        }
      } else if (hasPearpal) {
        await pullStore.processPearpalData(pearpalData)
      } else if (hasGame) {
        await pullStore.processPullData(pullData, editData)
      }

      // Process evolution data
      if (Object.keys(evoData).length > 0) {
        pullStore.evoData = evoData
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      message.error(t('tracker.no_data.error'))
    } finally {
      loading.value = false
    }
  })

  useHead(() => ({
    title: banner.value
      ? `${t(`banner.${banner.value.bannerId}.name`)} - ${t('navigation.banner')} - ${t('navigation.subtitle')}`
      : `${t('navigation.banner')} - ${t('navigation.subtitle')}`,
    meta: [
      {
        name: 'description',
        content: t('meta.description.banner'),
      },
      {
        property: 'og:title',
        content: t('navigation.banner') + ' - ' + t('navigation.subtitle'),
      },
      {
        property: 'og:description',
        content: t('meta.description.banner'),
      },
      {
        property: 'twitter:title',
        content: t('navigation.banner') + ' - ' + t('navigation.subtitle'),
      },
      {
        property: 'twitter:description',
        content: t('meta.description.banner'),
      },
    ],
    link: [
      {
        rel: 'canonical',
        href: `${siteUrl}${localePath(`/banner/${route.params.id}`)}`,
      },
    ],
  }))
</script>
