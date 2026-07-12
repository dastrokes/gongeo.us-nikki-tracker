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
        :title="$t('compendium.error_title')"
        :description="$t('compendium.error_description')"
      >
        <template #footer>
          <n-space>
            <n-button
              type="primary"
              @click="retryFetch"
            >
              {{ $t('common.retry') }}
            </n-button>
            <n-button @click="navigateToList">
              {{ $t('compendium.back_to_list') }}
            </n-button>
          </n-space>
        </template>
      </n-result>
    </n-card>

    <template v-else-if="makeup">
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
        content-class="p-2 sm:p-4"
      >
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr] lg:gap-6">
          <div class="flex items-start justify-center lg:justify-start">
            <div class="w-50 max-w-full shrink-0">
              <div
                v-if="isFullMakeup"
                class="group relative aspect-2/3 w-full overflow-hidden rounded-lg shadow-lg"
              >
                <div
                  class="absolute inset-0 bg-slate-100 bg-[url('/images/bg.webp')] bg-cover bg-center dark:bg-slate-300"
                ></div>
                <div
                  class="absolute inset-0"
                  :style="getQualityOverlayStyle(makeup.quality)"
                ></div>
                <NuxtImg
                  :src="getImageSrc('fullMakeup', makeup.id)"
                  :alt="makeupName"
                  class="absolute inset-0 z-10 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  preset="tallLg"
                  fit="cover"
                  loading="eager"
                  sizes="200px"
                />
              </div>
              <div
                v-else
                class="group relative aspect-2/3 w-full overflow-hidden rounded-lg shadow-lg"
              >
                <div
                  class="absolute inset-0 bg-slate-100 bg-[url('/images/bg.webp')] bg-cover bg-center dark:bg-slate-300"
                ></div>
                <div
                  class="absolute inset-0"
                  :style="getQualityOverlayStyle(makeup.quality)"
                ></div>
                <NuxtImg
                  :src="getImageSrc(showIcon ? 'itemIcon' : 'item', makeup.id)"
                  :alt="makeupName"
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
            <div class="flex flex-col gap-4 xl:flex-row xl:items-start">
              <div class="min-w-0 flex-1 space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <h1 class="text-xl leading-tight font-bold sm:text-2xl">
                    {{ makeupName }}
                  </h1>
                  <NuxtLinkLocale
                    :to="makeupQualityListLocation"
                    class="transition-opacity hover:opacity-80"
                  >
                    <n-tag
                      :color="getQualityTextTheme(makeup.quality)"
                      :bordered="false"
                      round
                      size="small"
                      class="cursor-pointer"
                    >
                      <span class="flex items-center gap-1">
                        {{ makeup.quality }}
                        <n-icon class="text-xs">
                          <Star />
                        </n-icon>
                      </span>
                    </n-tag>
                  </NuxtLinkLocale>
                  <NuxtLinkLocale
                    :to="makeupTypeListLocation"
                    class="transition-opacity hover:opacity-80"
                  >
                    <n-tag
                      type="default"
                      :bordered="false"
                      round
                      size="small"
                      class="cursor-pointer"
                    >
                      {{ $t(`type.${makeup.type}`) }}
                    </n-tag>
                  </NuxtLinkLocale>
                  <WardrobeOwnedButton
                    :owned="isMakeupTracked"
                    :disabled="!canToggleMakeupTracked"
                    :loading="wardrobeToggleLoading"
                    :quality="makeup.quality"
                    variant="overlay"
                    @toggle="toggleTrackedMakeup"
                  />
                </div>

                <div class="flex flex-wrap gap-2">
                  <NuxtLinkLocale
                    v-if="makeupStyleLabel"
                    :to="makeupStyleListLocation"
                    class="transition-opacity hover:opacity-80"
                  >
                    <n-tag
                      size="small"
                      :bordered="false"
                      type="default"
                      :color="getStyleTagTheme(makeup.style_key)"
                      class="cursor-pointer text-xs font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
                    >
                      {{ makeupStyleLabel }}
                    </n-tag>
                  </NuxtLinkLocale>
                </div>

                <div class="flex flex-wrap gap-2">
                  <NuxtLinkLocale
                    v-if="makeupVersionDisplay"
                    :to="makeupVersionListLocation"
                    class="transition-opacity hover:opacity-80"
                  >
                    <n-tag
                      type="default"
                      :bordered="false"
                      round
                      size="small"
                      class="cursor-pointer"
                    >
                      {{ makeupVersionDisplay }}
                    </n-tag>
                  </NuxtLinkLocale>
                  <NuxtLinkLocale
                    v-if="makeupObtainLabel && makeupObtainType != null"
                    :to="makeupSourceListLocation"
                    class="transition-opacity hover:opacity-80"
                  >
                    <n-tag
                      type="default"
                      :bordered="false"
                      round
                      size="small"
                      class="cursor-pointer"
                    >
                      {{ makeupObtainLabel }}
                    </n-tag>
                  </NuxtLinkLocale>
                </div>

                <div
                  v-if="!isFullMakeup && makeupDescription"
                  class="text-sm leading-relaxed opacity-80"
                >
                  <p class="whitespace-pre-wrap">{{ makeupDescription }}</p>
                </div>
              </div>
            </div>

            <div
              v-if="componentMakeups.length > 0"
              class="space-y-2"
            >
              <n-collapse>
                <n-collapse-item
                  :title="`${$t('common.makeup')} (${componentMakeups.length})`"
                  name="makeup"
                >
                  <div
                    class="grid grid-cols-5 gap-1.5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10"
                  >
                    <ItemCard
                      v-for="item in componentMakeups"
                      :key="item.id"
                      :class="
                        item.id === makeupId
                          ? 'pointer-events-none rounded-md'
                          : ''
                      "
                      :style="
                        item.id === makeupId
                          ? getQualityRingStyle(item.quality)
                          : ''
                      "
                      :item-id="item.id"
                      :quality="item.quality"
                      :type="resolveMakeupType(item)"
                      :name="$t(`item.${item.id}.name`)"
                      :to="getMakeupDetailPath(item.id)"
                      size="sm"
                    />
                  </div>
                </n-collapse-item>
              </n-collapse>
            </div>
          </div>
        </div>
      </n-card>

      <div class="grid grid-cols-1 gap-2 sm:gap-4 lg:grid-cols-2">
        <n-card
          v-if="showVariationSection"
          size="small"
          class="rounded-xl p-0 sm:p-2"
          content-class="p-2 sm:p-4"
        >
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-lg font-bold">
              {{ $t('common.variations') }}
            </h2>
          </div>
          <div
            class="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5"
          >
            <NuxtLinkLocale
              v-for="variation in itemVariations"
              :key="variation.id"
              :to="getMakeupDetailPath(variation.id)"
              class="group block"
              :class="[
                variation.id === makeupId
                  ? 'pointer-events-none cursor-default'
                  : 'cursor-pointer',
              ]"
            >
              <div
                class="relative aspect-2/3 overflow-hidden rounded-lg shadow-md transition-all duration-200 ease-in-out"
                :class="[
                  variation.id === makeupId ? '' : 'group-hover:scale-105',
                ]"
                :style="
                  variation.id === makeupId
                    ? getQualityRingStyle(variation.quality)
                    : ''
                "
              >
                <div
                  class="absolute inset-0 bg-slate-100 bg-[url('/images/bg.webp')] bg-cover bg-center dark:bg-slate-300"
                ></div>
                <div
                  class="absolute inset-0"
                  :style="getQualityOverlayStyle(variation.quality)"
                ></div>
                <NuxtImg
                  :src="
                    variation.type === 'fullMakeup'
                      ? getImageSrc('fullMakeup', variation.id)
                      : getImageSrc('item', variation.id)
                  "
                  :alt="
                    variation.type === 'fullMakeup'
                      ? $t(`makeup.${variation.id}.name`)
                      : $t(`item.${variation.id}.name`)
                  "
                  class="absolute inset-0 z-10 h-full w-full object-cover"
                  preset="tallSm"
                  fit="cover"
                  loading="lazy"
                  sizes="100px"
                />
              </div>
              <div class="mt-1 text-center">
                <p class="text-xs font-medium opacity-80">
                  {{ variation.label }}
                </p>
              </div>
            </NuxtLinkLocale>
          </div>
        </n-card>

        <n-card
          v-if="relatedOutfits.length > 0"
          size="small"
          class="rounded-xl p-0 sm:p-2"
          content-class="p-2 sm:p-4"
        >
          <h2 class="mb-3 text-lg font-bold">
            {{ $t('common.outfit') }}
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
                  :name="$t(`outfit.${outfit.id}.name`)"
                  size="sm"
                  :show-info="false"
                  class="transition-all duration-200 ease-in-out group-hover:scale-105 group-hover:shadow-xl"
                />
              </NuxtLinkLocale>
              <div class="mt-1 text-center">
                <p class="line-clamp-2 text-xs font-medium">
                  {{ $t(`outfit.${outfit.id}.name`) }}
                </p>
              </div>
            </div>
          </div>
        </n-card>

        <n-card
          v-if="inBanner"
          size="small"
          class="flex h-full flex-col rounded-xl p-0 sm:p-2"
          content-class="p-2 sm:p-4 flex flex-col h-full"
        >
          <h2 class="mb-3 text-lg font-bold">
            {{ $t('common.banner') }}
          </h2>
          <NuxtLinkLocale
            :to="getBannerDetailPath(inBanner.bannerId)"
            class="group block"
          >
            <div
              class="relative aspect-2/1 max-h-40 overflow-hidden rounded-lg shadow-md transition-all duration-200 ease-in-out group-hover:scale-[1.02]"
            >
              <NuxtImg
                :src="getImageSrc('banner', inBanner.bannerId)"
                :alt="$t(`banner.${inBanner.bannerId}.name`)"
                class="h-full w-full object-cover"
                preset="bannerThumb"
                fit="cover"
                loading="lazy"
                sizes="200px"
              />
            </div>
            <div class="mt-2">
              <p class="line-clamp-2 text-sm font-medium">
                {{ $t(`banner.${inBanner.bannerId}.name`) }}
              </p>
            </div>
          </NuxtLinkLocale>
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
            {{ $t('compendium.back_to_list') }}
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
  const { fetchMakeupById } = useSupabaseItems()
  const catalogIndex = useCatalogIndex()
  const { getImageSrc } = imageProvider()
  const showIcon = ref(false)
  const wardrobeToggleLoading = ref(false)
  const {
    canMutate: isWardrobeReady,
    init: initWardrobe,
    isMakeupOwned,
    getFullMakeupProgress,
    markMakeupsOwned,
    toggleMakeupOwned,
  } = useWardrobe()

  const {
    entityId: makeupId,
    canonicalUrl: canonicalMakeupUrl,
    redirectToCanonicalSlug,
  } = useEntityDetailRoute(makeupSlugHelpers)

  await redirectToCanonicalSlug()
  if (import.meta.client) {
    void catalogIndex.load(['makeups']).catch(() => undefined)
  }

  const makeupVariationIds = computed(() =>
    getCatalogGroupIds(catalogIndex.index.value, 'makeup', makeupId.value)
  )
  const makeupKey = computed(() => `makeup-${makeupId.value}-${locale.value}`)

  const {
    data: makeup,
    pending: makeupPending,
    status: makeupStatus,
    error,
    refresh,
  } = await useAsyncData(
    () => makeupKey.value,
    () =>
      Number.isFinite(makeupId.value) ? fetchMakeupById(makeupId.value) : null,
    {
      default: () => null,
      lazy: true,
      server: false,
    }
  )
  const loading = computed(
    () => makeupPending.value || makeupStatus.value === 'idle'
  )

  if (import.meta.server && requestEvent && !Number.isFinite(makeupId.value)) {
    setResponseStatus(requestEvent, 404)
    applyPageCacheHeaders(requestEvent, 'noStore')
  }

  const isFullMakeup = computed(() => makeup.value?.type === 'fullMakeup')
  const makeupName = computed(() => {
    if (!makeup.value) return ''
    return isFullMakeup.value
      ? t(`makeup.${makeup.value.id}.name`)
      : t(`item.${makeup.value.id}.name`)
  })
  const makeupSeoName = computed(
    () => makeupName.value || t('navigation.makeup')
  )
  const makeupSeoTitle = computed(() =>
    makeupName.value
      ? `${makeupName.value} - ${t('navigation.makeup')}`
      : t('navigation.makeup')
  )
  const makeupDescription = computed(() =>
    isFullMakeup.value ? '' : makeup.value?.description || ''
  )
  const makeupObtainType = computed(() => makeup.value?.obtain_type ?? null)
  const makeupVersion = computed(() =>
    makeup.value ? getVersionFromId(makeupObtainType.value) : null
  )
  const makeupVersionDisplay = computed(() => {
    if (!makeupVersion.value) return null
    const key = `version.${makeupVersion.value}`
    const label = te(key) ? t(key) : null
    return label ? `${makeupVersion.value} - ${label}` : makeupVersion.value
  })
  const makeupVersionListLocation = computed(() => {
    if (!makeupVersion.value) return '/makeups'
    const slug = resolveSeoVersionSlug(makeupVersion.value)
    return slug
      ? `/makeups/version/${slug}`
      : {
          path: '/makeups',
          query: { version: makeupVersion.value },
        }
  })
  const makeupObtainLabel = computed(() => {
    const obtainType = makeupObtainType.value
    if (obtainType === null || obtainType === undefined) return null
    const key = `obtain.${obtainType}.name`
    const translated = t(key)
    return translated !== key ? translated : `${obtainType}`
  })
  const makeupSourceListLocation = computed(() => {
    const obtainType = makeupObtainType.value
    if (obtainType === null || obtainType === undefined) return '/makeups'
    const groupKey = resolveObtainGroupKey(obtainType)
    const slug = resolveSeoItemSourceSlug(groupKey)
    return slug
      ? `/makeups/source/${slug}`
      : {
          path: '/makeups',
          query: { source: obtainType },
        }
  })
  const makeupStyleLabel = computed(() => {
    const styleKey = makeup.value?.style_key
    const style = styleKey ? STYLE_BY_KEY.get(styleKey) : null
    return style ? t(style.i18nKey) : null
  })
  const makeupStyleListLocation = computed(() => {
    const styleKey = makeup.value?.style_key
    if (!styleKey) return '/makeups'
    const slug = resolveSeoStyleSlug(styleKey)
    return slug
      ? `/makeups/style/${slug}`
      : {
          path: '/makeups',
          query: { style: styleKey },
        }
  })
  const makeupTypeListLocation = computed(() => {
    const type = makeup.value?.type
    if (!type) return '/makeups'
    const slug = resolveSeoMakeupTypeSlug(type)
    return slug
      ? `/makeups/${slug}`
      : {
          path: '/makeups',
          query: { type },
        }
  })
  const makeupQualityListLocation = computed(() =>
    makeup.value
      ? {
          path: '/makeups',
          query: { quality: makeup.value.quality },
        }
      : '/makeups'
  )
  const componentMakeups = computed(() => makeup.value?.components ?? [])
  const trackedMakeupIds = computed(() =>
    isFullMakeup.value
      ? componentMakeups.value.map((item) => item.id)
      : makeup.value
        ? [makeup.value.id]
        : []
  )
  const isMakeupTracked = computed(() => {
    if (!makeup.value) return false
    if (!isFullMakeup.value) return isMakeupOwned(makeup.value.id)

    return (
      getFullMakeupProgress(trackedMakeupIds.value).status === 'owned' &&
      trackedMakeupIds.value.length > 0
    )
  })
  const canToggleMakeupTracked = computed(
    () => isWardrobeReady.value && trackedMakeupIds.value.length > 0
  )
  const relatedOutfits = computed(() => makeup.value?.related_outfits ?? [])
  const resolveMakeupType = (item: { id: number; type?: string }) =>
    item.type ? getItemType(item.type) : getItemType(item.id)
  const getVariantLevelKey = (variantType: string) => {
    if (variantType === 'glowup') return 'glow'
    if (variantType === 'evo1') return '2'
    if (variantType === 'evo2') return '3'
    if (variantType === 'evo3') return '4'
    return '1'
  }
  const getFullMakeupVariantLevelKey = (id: number) => {
    const suffix = id.toString().slice(-2)
    if (suffix === '03') return '4'
    return '1'
  }
  const formatFullMakeupVariantLabel = (id: number) => {
    const level = t(`banner.outfit.level.${getFullMakeupVariantLevelKey(id)}`)
    const separator = ['ja', 'ko', 'tw', 'zh'].includes(locale.value)
      ? '·'
      : ': '
    return `${level}${separator}${t('type.fullMakeup')}`
  }
  const itemVariations = computed(() => {
    if (!makeup.value) return []

    const catalogIds =
      isFullMakeup.value || makeupVariationIds.value.length > 1
        ? makeupVariationIds.value
        : []
    const parentFullMakeupIds = isFullMakeup.value
      ? []
      : (makeup.value.variations ?? []).map((variation) => variation.id)
    const parentFullMakeupIdSet = new Set(parentFullMakeupIds)
    const variationIds = [
      ...catalogIds,
      ...parentFullMakeupIds.filter((id) => !catalogIds.includes(id)),
    ]

    return variationIds.map((id) => {
      const isFullMakeupVariation =
        isFullMakeup.value || parentFullMakeupIdSet.has(id)
      const type = isFullMakeupVariation ? 'fullMakeup' : makeup.value!.type
      const variation = {
        id,
        quality: makeup.value!.quality,
        type,
      }

      if (isFullMakeupVariation && !isFullMakeup.value) {
        return {
          ...variation,
          label: formatFullMakeupVariantLabel(id),
        }
      }

      if (isFullMakeupVariation) {
        return {
          ...variation,
          label: t(`banner.outfit.level.${getFullMakeupVariantLevelKey(id)}`),
        }
      }

      const variantType = getItemVariantType(id)

      return {
        ...variation,
        label: t(`banner.outfit.level.${getVariantLevelKey(variantType)}`),
      }
    })
  })
  const showVariationSection = computed(() =>
    isFullMakeup.value
      ? itemVariations.value.length > 1
      : itemVariations.value.length > 0
  )
  const inBanner = computed(() => {
    if (!makeup.value) return null

    for (const outfit of relatedOutfits.value) {
      const outfitId = String(outfit.id)
      const banner =
        getBannerForOutfit(outfitId) ||
        getBannerForOutfit(getBaseOutfitId(outfitId))
      if (banner) return banner
    }

    return null
  })

  const listingPath = computed(() => localePath('/makeups'))
  const canNavigateBackToList = computed(() => {
    if (!import.meta.client) return false
    const back = window.history.state?.back
    return typeof back === 'string' && back.startsWith(listingPath.value)
  })
  const retryFetch = () => {
    refresh()
  }
  const toggleTrackedMakeup = async () => {
    if (!makeup.value || wardrobeToggleLoading.value) return

    wardrobeToggleLoading.value = true
    try {
      if (isFullMakeup.value) {
        await markMakeupsOwned(trackedMakeupIds.value, !isMakeupTracked.value)
      } else {
        await toggleMakeupOwned(makeup.value.id)
      }
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

  watch(makeupId, () => {
    showIcon.value = false
  })

  onMounted(() => {
    void initWardrobe()
  })

  const ogImage = computed(() =>
    makeup.value
      ? getOgImageSrc(
          isFullMakeup.value ? 'fullMakeup' : 'item',
          makeup.value.id
        )
      : undefined
  )

  useSeoMeta({
    title: () =>
      `${makeupSeoTitle.value} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () =>
      t('meta.description.item_detail', {
        name: makeupSeoName.value,
      }),
    ogTitle: () =>
      `${makeupSeoTitle.value} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () =>
      t('meta.description.item_detail', {
        name: makeupSeoName.value,
      }),
    ogImage: () => ogImage.value,
    twitterTitle: () =>
      `${makeupSeoTitle.value} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () =>
      t('meta.description.item_detail', {
        name: makeupSeoName.value,
      }),
    twitterImage: () => ogImage.value,
  })

  useHead({
    link: () =>
      canonicalMakeupUrl.value
        ? [{ rel: 'canonical', href: canonicalMakeupUrl.value }]
        : [],
  })
</script>
