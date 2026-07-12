<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <n-card
      v-if="loading"
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-2 sm:p-4"
    >
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr] lg:gap-6">
        <div class="flex justify-center lg:justify-start">
          <div
            class="relative aspect-2/3 w-full max-w-50 overflow-hidden rounded-lg"
          >
            <n-skeleton
              :sharp="false"
              class="h-full w-full"
            />
          </div>
        </div>

        <div class="space-y-3">
          <div class="space-y-2">
            <n-skeleton
              text
              width="60%"
              height="32px"
            />
            <div class="flex gap-2">
              <n-skeleton
                width="60px"
                height="24px"
                :sharp="false"
                class="rounded-full"
              />
              <n-skeleton
                width="80px"
                height="24px"
                :sharp="false"
                class="rounded-full"
              />
            </div>
          </div>
          <n-skeleton
            text
            :repeat="2"
          />
        </div>
      </div>
    </n-card>

    <n-card
      v-else-if="error"
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-2 sm:p-4"
    >
      <n-result
        size="small"
        status="error"
        :title="t('compendium.error_title')"
        :description="t('compendium.error_description')"
      >
        <template #footer>
          <n-space>
            <n-button
              type="primary"
              @click="retryFetch"
            >
              {{ t('common.retry') }}
            </n-button>
            <n-button @click="navigateToList">
              {{ t('compendium.back_to_list') }}
            </n-button>
          </n-space>
        </template>
      </n-result>
    </n-card>

    <template v-else-if="momo">
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
        content-class="p-2 sm:p-4"
      >
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr] lg:gap-6">
          <div class="flex items-start justify-center lg:justify-start">
            <div class="w-50 max-w-full shrink-0">
              <div
                class="group relative aspect-2/3 w-full overflow-hidden rounded-lg shadow-lg"
              >
                <div
                  class="absolute inset-0 bg-slate-100 bg-[url('/images/momo_bg.webp')] bg-cover bg-center dark:bg-slate-300"
                ></div>
                <div
                  class="absolute inset-0"
                  :style="getQualityOverlayStyle(momo.quality)"
                ></div>
                <NuxtImg
                  :src="getImageSrc(showIcon ? 'momoIcon' : 'momo', momo.id)"
                  :alt="momoName"
                  class="absolute inset-0 z-10 h-full w-full transition-all duration-300"
                  :class="
                    showIcon
                      ? 'object-contain p-8'
                      : 'object-cover group-hover:scale-110'
                  "
                  :preset="showIcon ? 'iconLg' : 'tallLg'"
                  fit="cover"
                  loading="eager"
                  sizes="200px"
                />

                <div
                  class="absolute top-2 right-2 z-30 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                >
                  <button
                    class="flex items-center justify-center rounded-full border border-white/20 bg-black/30 p-1.5 text-white/90 opacity-70 backdrop-blur-md transition-colors hover:bg-black/50 hover:opacity-100 dark:bg-black/50 dark:hover:bg-black/70"
                    @click="showIcon = !showIcon"
                  >
                    <n-icon size="14"><Images /></n-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="min-w-0 flex-1 space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-xl leading-tight font-bold sm:text-2xl">
                  {{ momoName }}
                </h1>
                <NuxtLinkLocale
                  :to="momoQualityListLocation"
                  class="transition-opacity hover:opacity-80"
                >
                  <n-tag
                    :color="getQualityTextTheme(momo.quality)"
                    :bordered="false"
                    round
                    size="small"
                    class="cursor-pointer"
                  >
                    <span class="flex items-center gap-1">
                      {{ momo.quality }}
                      <n-icon class="text-xs">
                        <Star />
                      </n-icon>
                    </span>
                  </n-tag>
                </NuxtLinkLocale>
                <NuxtLinkLocale
                  to="/momo"
                  class="transition-opacity hover:opacity-80"
                >
                  <n-tag
                    type="default"
                    :bordered="false"
                    round
                    size="small"
                    class="cursor-pointer"
                  >
                    {{ t('common.momo_entry') }}
                  </n-tag>
                </NuxtLinkLocale>
                <WardrobeOwnedButton
                  :owned="isMomoTracked"
                  :disabled="!isWardrobeReady"
                  :loading="wardrobeToggleLoading"
                  :quality="momo.quality"
                  variant="overlay"
                  @toggle="toggleTrackedMomo"
                />
              </div>

              <div class="flex flex-wrap gap-2">
                <NuxtLinkLocale
                  v-if="momoVersionDisplay"
                  :to="momoVersionListLocation"
                  class="transition-opacity hover:opacity-80"
                >
                  <n-tag
                    type="default"
                    :bordered="false"
                    round
                    size="small"
                    class="cursor-pointer"
                  >
                    {{ momoVersionDisplay }}
                  </n-tag>
                </NuxtLinkLocale>
                <NuxtLinkLocale
                  v-if="momoObtainLabel && momoObtainType != null"
                  :to="momoSourceListLocation"
                  class="transition-opacity hover:opacity-80"
                >
                  <n-tag
                    type="default"
                    :bordered="false"
                    round
                    size="small"
                    class="cursor-pointer"
                  >
                    {{ momoObtainLabel }}
                  </n-tag>
                </NuxtLinkLocale>
              </div>

              <div
                v-if="momoDescription"
                class="text-sm leading-relaxed opacity-80"
              >
                <p class="whitespace-pre-wrap">{{ momoDescription }}</p>
              </div>
            </div>
          </div>
        </div>
      </n-card>

      <div class="grid grid-cols-1 gap-2 sm:gap-4 lg:grid-cols-2">
        <n-card
          v-if="relatedOutfits.length > 0"
          size="small"
          class="rounded-xl p-0 sm:p-2"
          content-class="p-2 sm:p-4"
        >
          <h2 class="mb-3 text-lg font-bold">
            {{ t('common.outfit') }}
          </h2>
          <div
            class="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5"
          >
            <div
              v-for="outfit in relatedOutfits"
              :key="outfit.id"
            >
              <NuxtLinkLocale
                :to="getOutfitDetailPath(outfit.id)"
                class="group block"
              >
                <OutfitCard
                  :outfit-id="outfit.id"
                  :quality="outfit.quality"
                  :name="getRelatedOutfitName(outfit.id)"
                  size="sm"
                  :show-info="false"
                  class="transition-all duration-200 ease-in-out group-hover:scale-105 group-hover:shadow-xl"
                />
                <div class="mt-1 text-center">
                  <p class="line-clamp-2 text-xs font-medium">
                    {{ getRelatedOutfitName(outfit.id) }}
                  </p>
                </div>
              </NuxtLinkLocale>
            </div>
          </div>
        </n-card>
      </div>
    </template>

    <n-card
      v-else
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-2 sm:p-4"
    >
      <n-result
        size="small"
        status="info"
        :title="t('compendium.not_found_item')"
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
            @click="navigateToList"
          >
            {{ t('compendium.back_to_list') }}
          </n-button>
        </template>
      </n-result>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { Images, Star } from '@vicons/fa'

  const { t, te, locale } = useI18n()
  const message = useMessage()
  const localePath = useLocalePath()
  const router = useRouter()
  const requestEvent = useRequestEvent()
  const { getImageSrc } = imageProvider()
  const { fetchMomoById } = useMomo()
  const showIcon = ref(false)
  const wardrobeToggleLoading = ref(false)
  const {
    canMutate: isWardrobeReady,
    init: initWardrobe,
    isMomoOwned,
    toggleMomoOwned,
  } = useWardrobe()

  const {
    entityId: momoId,
    canonicalUrl: canonicalMomoUrl,
    redirectToCanonicalSlug,
  } = useEntityDetailRoute(momoSlugHelpers)

  await redirectToCanonicalSlug()
  const momoKey = computed(() => `momo-detail-${momoId.value}-${locale.value}`)

  const {
    data: momo,
    pending: momoPending,
    status: momoStatus,
    error,
    refresh,
  } = await useAsyncData(
    () => momoKey.value,
    () => (Number.isFinite(momoId.value) ? fetchMomoById(momoId.value) : null),
    {
      default: () => null,
      lazy: true,
      server: false,
    }
  )
  const loading = computed(
    () => momoPending.value || momoStatus.value === 'idle'
  )

  if (import.meta.server && requestEvent && !Number.isFinite(momoId.value)) {
    setResponseStatus(requestEvent, 404)
    applyPageCacheHeaders(requestEvent, 'noStore')
  }

  const momoName = computed(() => {
    const key = `momo.${momoId.value}.name`
    return te(key) ? t(key) : (momo.value?.name ?? '')
  })
  const momoSeoName = computed(() => momoName.value || t('common.momo'))
  const momoSeoTitle = computed(() =>
    momoName.value
      ? `${momoName.value} - ${t('common.momo')}`
      : t('common.momo')
  )
  const momoDescription = computed(() => momo.value?.description ?? '')
  const isMomoTracked = computed(() =>
    momo.value ? isMomoOwned(momo.value.id) : false
  )
  const momoQualityListLocation = computed(() => {
    if (!momo.value) return '/momo'

    return {
      path: '/momo',
      query: { quality: momo.value.quality },
    }
  })

  const momoObtainType = computed(() => momo.value?.obtain_type ?? null)
  const momoVersion = computed(() => momo.value?.version ?? null)
  const momoVersionDisplay = computed(() => {
    if (!momoVersion.value) return null
    const key = `version.${momoVersion.value}`
    const label = te(key) ? t(key) : null
    return label ? `${momoVersion.value} - ${label}` : momoVersion.value
  })
  const momoVersionListLocation = computed(() => {
    if (!momoVersion.value) return '/momo'

    const slug = resolveSeoVersionSlug(momoVersion.value)
    return slug
      ? `/momo/version/${slug}`
      : {
          path: '/momo',
          query: { version: momoVersion.value },
        }
  })
  const relatedOutfits = computed(() => momo.value?.related_outfits ?? [])
  const getRelatedOutfitName = (outfitId: number) => {
    const key = `outfit.${outfitId}.name`
    return te(key) ? t(key) : `${outfitId}`
  }
  const momoObtainLabel = computed(() => {
    const obtainType = momoObtainType.value
    if (obtainType === null || obtainType === undefined) return null
    const groupKey = resolveMomoSourceGroupKeyFromIds([obtainType])
    const key = resolveMomoSourceGroupLabelKey(groupKey)
    if (!key) return `${obtainType}`
    const translated = t(key)
    return translated !== key ? translated : `${obtainType}`
  })
  const momoSourceListLocation = computed(() => {
    const obtainType = momoObtainType.value
    if (obtainType === null || obtainType === undefined) return '/momo'

    const groupKey = resolveMomoSourceGroupKeyFromIds([obtainType])
    const slug = resolveSeoMomoSourceSlug(groupKey)
    return slug
      ? `/momo/source/${slug}`
      : {
          path: '/momo',
          query: {
            source: groupKey ?? obtainType,
          },
        }
  })

  const listingPath = computed(() => localePath('/momo'))
  const canNavigateBackToList = computed(() => {
    if (!import.meta.client) return false

    const back = window.history.state?.back
    return typeof back === 'string' && back.startsWith(listingPath.value)
  })

  const retryFetch = () => {
    refresh()
  }

  const toggleTrackedMomo = async () => {
    if (!momo.value || wardrobeToggleLoading.value) return

    wardrobeToggleLoading.value = true
    try {
      await toggleMomoOwned(momo.value.id)
    } catch {
      message.error(t('wardrobe.error.save'))
    } finally {
      wardrobeToggleLoading.value = false
    }
  }

  const navigateToList = () => {
    if (canNavigateBackToList.value) {
      router.back()
      return
    }

    navigateTo(listingPath.value)
  }

  onMounted(() => {
    void initWardrobe()
  })

  const ogMomoImage = computed(() =>
    momo.value ? getOgImageSrc('momo', momo.value.id) : undefined
  )

  useSeoMeta({
    title: () =>
      `${momoSeoTitle.value} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () =>
      t('meta.description.momo_detail', {
        name: momoSeoName.value,
      }),
    ogTitle: () =>
      `${momoSeoTitle.value} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () =>
      t('meta.description.momo_detail', {
        name: momoSeoName.value,
      }),
    ogImage: () => ogMomoImage.value,
    twitterTitle: () =>
      `${momoSeoTitle.value} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () =>
      t('meta.description.momo_detail', {
        name: momoSeoName.value,
      }),
    twitterImage: () => ogMomoImage.value,
  })

  useHead({
    link: () =>
      canonicalMomoUrl.value
        ? [{ rel: 'canonical', href: canonicalMomoUrl.value }]
        : [],
  })
</script>
