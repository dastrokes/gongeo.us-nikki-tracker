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

          <div class="grid grid-cols-1 sm:grid-cols-[1fr_3fr] gap-4">
            <div class="space-y-2">
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
                class="rounded-lg p-2"
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
                          bannerPulls.stats.avg4StarPulls
                        )
                      "
                    />

                    <n-button
                      text
                      size="small"
                      class="text-gray-500"
                      @click="showCollectionEditor = true"
                    >
                      <template #icon>
                        <n-icon><Edit /></n-icon>
                      </template>
                    </n-button>
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
                    class="text-sm text-gray-400 text-center"
                  >
                    {{ t('tracker.stats.no_pulls') }}
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-2">
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
          :banner-id="banner.bannerId"
          @close="showCollectionEditor = false"
        />
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { ArrowLeft, ChartBarRegular, Edit } from '@vicons/fa'
  import { BANNER_DATA } from '~/data/banners'
  import { useCardStyle } from '~/composables/useCardStyle'
  import { usePullStore } from '~/stores/pull'
  import { storeToRefs } from 'pinia'
  import { useMessage } from 'naive-ui'
  import { useIndexedDB } from '~/composables/useIndexedDB'
  import type { Outfit } from '~/types/outfit'

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

  const { getAvg5StarPercentile, getAvg4StarType3Percentile } = usePercentile()

  const banner = computed(() => {
    const bannerId = parseInt(route.params.id as string)
    return BANNER_DATA[bannerId]
  })

  const bannerPulls = computed(() => {
    if (!banner.value) return null
    return processedPulls.value[banner.value.bannerId]
  })

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

      // Process pearpal tracker data first if available
      if (Object.keys(pearpalData).length > 0) {
        await pullStore.processPearpalData(pearpalData)
      } else if (
        // Process pull and edit data if no pearpal data
        Object.keys(pullData).length > 0 ||
        Object.keys(editData).length > 0
      ) {
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
