<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <!-- Loading State -->
    <n-card
      v-if="loading"
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-2 sm:p-4"
    >
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr] lg:gap-6">
        <!-- Image Skeleton -->
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

        <!-- Info Skeleton -->
        <div class="space-y-3">
          <div class="space-y-2">
            <n-skeleton
              text
              width="60%"
              height="32px"
            />
            <n-skeleton
              width="60px"
              height="24px"
              :sharp="false"
              class="rounded-full"
            />
          </div>
          <n-skeleton
            text
            :repeat="2"
          />

          <!-- Items Skeleton -->
          <div class="space-y-2">
            <n-skeleton
              text
              width="60px"
              height="20px"
            />
            <div
              class="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10"
            >
              <div
                v-for="i in 10"
                :key="i"
                class="aspect-square"
              >
                <n-skeleton
                  :sharp="false"
                  class="h-full w-full rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </n-card>

    <!-- Error State -->
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

    <!-- Outfit Detail Content -->
    <template v-else-if="outfit">
      <!-- Outfit Header Card -->
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
        content-class="p-2 sm:p-4"
      >
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr] lg:gap-6">
          <!-- Outfit Image -->
          <div class="flex items-start justify-center lg:justify-start">
            <div class="w-50 max-w-full shrink-0">
              <OutfitCard
                :outfit-id="outfit.id"
                :quality="outfit.quality"
                :name="outfitName"
                size="md"
                :show-info="false"
                class="w-full shadow-lg"
              />
            </div>
          </div>

          <!-- Outfit Info -->
          <div class="space-y-4">
            <div class="flex flex-col gap-4 xl:flex-row xl:items-start">
              <div class="min-w-0 flex-1 space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <h1 class="text-xl leading-tight font-bold sm:text-2xl">
                    {{ outfitName }}
                  </h1>
                  <NuxtLinkLocale
                    :to="outfitQualityListLocation"
                    class="transition-opacity hover:opacity-80"
                  >
                    <n-tag
                      :color="getQualityTextTheme(outfit.quality)"
                      :bordered="false"
                      round
                      size="small"
                      class="cursor-pointer"
                    >
                      <span class="flex items-center gap-1">
                        {{ outfit.quality }}
                        <n-icon class="text-xs">
                          <Star />
                        </n-icon>
                      </span>
                    </n-tag>
                  </NuxtLinkLocale>
                </div>

                <div class="flex flex-wrap gap-2">
                  <NuxtLinkLocale
                    v-for="label in outfitStyleLabels"
                    :key="`style-${label}`"
                    :to="outfitStyleListLocation"
                    class="transition-opacity hover:opacity-80"
                  >
                    <n-tag
                      size="small"
                      :bordered="false"
                      type="default"
                      :color="getStyleTagTheme(outfitStyleKey)"
                      class="cursor-pointer text-xs font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
                    >
                      {{ label }}
                    </n-tag>
                  </NuxtLinkLocale>
                  <template
                    v-for="label in outfitLabelTags"
                    :key="`label-${label.text}`"
                  >
                    <NuxtLinkLocale
                      v-if="label.tagKey"
                      :to="getOutfitTagListLocation(label.tagKey)"
                      class="transition-opacity hover:opacity-80"
                    >
                      <n-tag
                        size="small"
                        type="default"
                        :color="label.theme"
                        round
                        class="cursor-pointer text-xs font-semibold"
                      >
                        {{ label.text }}
                      </n-tag>
                    </NuxtLinkLocale>
                    <n-tag
                      v-else
                      size="small"
                      type="default"
                      :color="label.theme"
                      round
                      class="text-xs font-semibold"
                    >
                      {{ label.text }}
                    </n-tag>
                  </template>
                </div>

                <div class="flex flex-wrap gap-2">
                  <NuxtLinkLocale
                    v-if="outfitVersionDisplay"
                    :to="outfitVersionListLocation"
                    class="transition-opacity hover:opacity-80"
                  >
                    <n-tag
                      type="default"
                      :bordered="false"
                      round
                      size="small"
                      class="cursor-pointer"
                    >
                      {{ outfitVersionDisplay }}
                    </n-tag>
                  </NuxtLinkLocale>
                  <NuxtLinkLocale
                    v-if="outfitObtainLabel && outfitObtainType != null"
                    :to="outfitSourceListLocation"
                    class="transition-opacity hover:opacity-80"
                  >
                    <n-tag
                      type="default"
                      :bordered="false"
                      round
                      size="small"
                      class="cursor-pointer"
                    >
                      {{ outfitObtainLabel }}
                    </n-tag>
                  </NuxtLinkLocale>
                </div>

                <div
                  v-if="outfitDescription"
                  class="text-sm leading-relaxed opacity-80"
                >
                  <p class="whitespace-pre-wrap">{{ outfitDescription }}</p>
                </div>
              </div>

              <div
                v-if="styleScores.length"
                class="w-full shrink-0 xl:w-40"
              >
                <div class="flex flex-col gap-1">
                  <div
                    v-for="score in styleScores"
                    :key="score.key"
                    class="flex items-stretch gap-2"
                  >
                    <n-tag
                      size="small"
                      :bordered="false"
                      type="default"
                      :color="score.theme"
                      class="min-w-24 justify-center text-sm font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
                    >
                      {{ score.label }}
                    </n-tag>
                    <div
                      class="flex-1 rounded-md bg-black/5 px-2 py-0.5 text-right text-sm font-semibold tabular-nums opacity-80 dark:bg-white/10"
                    >
                      {{ score.value }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="outfitItems.length > 0 || makeupItems.length > 0"
              class="space-y-2"
            >
              <n-collapse>
                <n-collapse-item
                  v-if="outfitItems.length > 0"
                  :title="`${$t('common.items')} (${outfitItems.length})`"
                  name="items"
                >
                  <div
                    class="grid grid-cols-5 gap-1.5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10"
                  >
                    <ItemCard
                      v-for="outfitItem in outfitItems"
                      :key="outfitItem.id"
                      :item-id="outfitItem.id"
                      :quality="outfitItem.quality"
                      :type="resolveItemType(outfitItem)"
                      :name="$t(`item.${outfitItem.id}.name`)"
                      size="sm"
                    />
                  </div>
                </n-collapse-item>
              </n-collapse>
              <n-collapse>
                <n-collapse-item
                  v-if="makeupItems.length > 0"
                  :title="`${$t('common.makeup')} (${makeupItems.length})`"
                  name="makeup"
                >
                  <div
                    class="grid grid-cols-5 gap-1.5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10"
                  >
                    <ItemCard
                      v-for="item in makeupItems"
                      :key="item.id"
                      :item-id="item.id"
                      :quality="item.quality"
                      :type="resolveItemType(item)"
                      :name="$t(`item.${item.id}.name`)"
                      size="sm"
                    />
                  </div>
                </n-collapse-item>
              </n-collapse>
            </div>
          </div>
        </div>
      </n-card>

      <!-- Variations and Banner Grid (side by side on desktop) -->
      <div
        class="grid grid-cols-1 gap-2 sm:gap-4 lg:grid-cols-2 lg:items-stretch"
      >
        <!-- Outfit Variations Section -->
        <n-card
          v-if="outfitVariations.length > 1"
          size="small"
          class="h-full rounded-xl p-0 sm:p-2"
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
            <div
              v-for="variation in outfitVariations"
              :key="variation.id"
            >
              <NuxtLinkLocale
                :to="`/outfits/${variation.id}`"
                class="group block"
                :class="[
                  variation.id === outfitId
                    ? 'pointer-events-none cursor-default'
                    : 'cursor-pointer',
                ]"
              >
                <OutfitCard
                  :outfit-id="variation.id"
                  :quality="variation.quality"
                  :name="$t(`outfit.${variation.id}.name`)"
                  size="sm"
                  :show-info="false"
                  :class="[
                    'transition-all duration-200 ease-in-out group-hover:shadow-xl',
                    variation.id === outfitId ? '' : 'group-hover:scale-105',
                  ]"
                  :style="
                    variation.id === outfitId
                      ? getQualityRingStyle(variation.quality)
                      : ''
                  "
                />
              </NuxtLinkLocale>
              <div class="mt-1 text-center">
                <p class="text-xs font-medium opacity-80">
                  {{ variation.label }}
                </p>
              </div>
            </div>
          </div>
        </n-card>

        <!-- Banner Section -->
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
            :to="`/banners/${inBanner.bannerId}`"
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

    <!-- Not Found State -->
    <n-card
      v-else
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-2 sm:p-4"
    >
      <n-result
        size="small"
        status="info"
        :title="t('compendium.not_found_outfit')"
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
  import { Star } from '@vicons/fa'

  const { t, te, locale } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()
  const requestEvent = useRequestEvent()

  // Get outfit ID from route
  const outfitId = computed(() => Number(route.params.id))

  // Composable
  const { fetchOutfitById } = useSupabaseOutfits()
  const { getImageSrc } = imageProvider()
  const outfitKey = computed(() => `outfit-${outfitId.value}-${locale.value}`)

  const {
    data: outfit,
    pending: loading,
    error,
    refresh,
  } = await useAsyncData(
    () => outfitKey.value,
    () => fetchOutfitById(outfitId.value),
    {
      default: () => null,
      lazy: true,
    }
  )

  if (import.meta.server && requestEvent && !error.value && !outfit.value) {
    setResponseStatus(requestEvent, 404)
    applyPageCacheHeaders(requestEvent, 'noStore')
  }

  // Makeup types
  const makeupTypes: ItemType[] = [
    'baseMakeup',
    'eyebrows',
    'eyelashes',
    'contactLenses',
    'lips',
  ]

  const resolveItemType = (item: { id: number; type?: string }) =>
    item.type ? getItemType(item.type) : getItemType(item.id)

  // Computed component items (excluding makeup) sorted by category order
  const outfitItems = computed(() => {
    if (!outfit.value?.outfit_items) return []
    const items = outfit.value.outfit_items
      .map((oi) => oi.items)
      .filter((item) => !makeupTypes.includes(resolveItemType(item)))
    return sortItemsByCategory(items)
  })

  // Computed makeup items sorted by category order
  const makeupItems = computed(() => {
    if (!outfit.value?.outfit_items) return []
    const items = outfit.value.outfit_items
      .map((oi) => oi.items)
      .filter((item) => makeupTypes.includes(resolveItemType(item)))
    return sortItemsByCategory(items)
  })

  const outfitStyleLabels = computed(() => {
    const styleKey = outfitStyleKey.value
    if (!styleKey) return []
    const style = STYLE_DEFINITIONS.find((s) => s.key === styleKey)
    return style ? [t(style.i18nKey)] : []
  })

  const outfitStyleKey = computed(() => {
    if (!outfit.value) return null
    return (
      outfit.value.style_key ||
      (outfit.value.props ? resolveStyleKeyFromProps(outfit.value.props) : null)
    )
  })
  const outfitStyleListLocation = computed(() => {
    const styleKey = outfitStyleKey.value
    if (!styleKey) return '/outfits'

    const slug = resolveSeoStyleSlug(styleKey)
    return slug
      ? `/outfits/style/${slug}`
      : {
          path: '/outfits',
          query: { style: styleKey },
        }
  })
  const outfitQualityListLocation = computed(() => {
    if (!outfit.value) return '/outfits'

    const slug = resolveSeoOutfitQualitySlug(outfit.value.quality)
    return slug
      ? `/outfits/quality/${slug}`
      : {
          path: '/outfits',
          query: { quality: outfit.value.quality },
        }
  })

  const styleScores = computed(() => {
    if (!outfit.value?.props) return []
    return STYLE_DEFINITIONS.map((style, index) => {
      const rawValue = outfit.value?.props?.[index]
      const value = Number(rawValue)
      return {
        key: style.key,
        label: t(style.i18nKey),
        value: Number.isFinite(value) ? value : 0,
        theme: getStyleTagTheme(style.key),
      }
    })
  })

  const outfitLabelTags = computed(() => {
    if (!outfit.value?.tags) return []
    return resolveTagI18nKeys(outfit.value.tags).map((key) => {
      const tagDef = TAG_DEFINITIONS.find((t) => t.i18nKey === key)
      return {
        text: t(key),
        theme: getLabelTagTheme(key),
        tagKey: tagDef?.key || null,
      }
    })
  })
  const getOutfitTagListLocation = (tagKey: string) => {
    const slug = resolveSeoTagSlug(tagKey)
    return slug
      ? `/outfits/tag/${slug}`
      : {
          path: '/outfits',
          query: { label: tagKey },
        }
  }

  // Computed outfit variations with labels
  const outfitVariations = computed(() => {
    if (!outfit.value?.variations) return []

    return [...outfit.value.variations]
      .sort((a, b) => {
        if (a.type === 'glowup') return 1
        if (b.type === 'glowup') return -1
        return 0
      })
      .map((v) => {
        let levelKey = '1' // base
        if (v.type === 'glowup') {
          levelKey = 'glow'
        } else if (v.type === 'evo1') {
          levelKey = '2'
        } else if (v.type === 'evo2') {
          levelKey = '3'
        } else if (v.type === 'evo3') {
          levelKey = '4'
        }

        return {
          id: v.id,
          quality: v.quality,
          label: t(`banner.outfit.level.${levelKey}`),
        }
      })
  })

  // Find banner for this outfit
  const inBanner = computed(() => {
    if (!outfit.value) return null

    // Check current outfit ID
    let banner = getBannerForOutfit(String(outfit.value.id))
    if (banner) return banner

    // Check all variation IDs
    if (outfit.value.variations) {
      for (const variation of outfit.value.variations) {
        banner = getBannerForOutfit(String(variation.id))
        if (banner) return banner
      }
    }

    return null
  })

  // Get outfit name from i18n
  const outfitName = computed(() => {
    if (!outfit.value) return ''
    return t(`outfit.${outfitId.value}.name`)
  })

  const outfitVersion = computed(() => {
    if (!outfit.value) return null
    const obtainType = (outfit.value as OutfitWithItems).obtain_type
    return getVersionFromId(obtainType ?? outfit.value.id)
  })

  const outfitVersionDisplay = computed(() => {
    if (!outfitVersion.value) return null
    const key = `version.${outfitVersion.value}`
    const label = te(key) ? t(key) : null
    return label ? `${outfitVersion.value} - ${label}` : outfitVersion.value
  })
  const outfitVersionListLocation = computed(() => {
    if (!outfitVersion.value) return '/outfits'

    const slug = resolveSeoVersionSlug(outfitVersion.value)
    return slug
      ? `/outfits/version/${slug}`
      : {
          path: '/outfits',
          query: { version: outfitVersion.value },
        }
  })

  const outfitObtainType = computed(() => {
    if (!outfit.value) return null
    return (outfit.value as OutfitWithItems).obtain_type
  })

  const outfitObtainLabel = computed(() => {
    const obtainType = outfitObtainType.value
    if (obtainType === null || obtainType === undefined) return null
    const key = `obtain.${obtainType}.name`
    const translated = t(key)
    return translated !== key ? translated : `${obtainType}`
  })
  const outfitSourceListLocation = computed(() => {
    const obtainType = outfitObtainType.value
    if (obtainType === null || obtainType === undefined) {
      return '/outfits'
    }

    const groupKey = resolveObtainGroupKey(obtainType)
    const slug =
      groupKey && isObtainGroupVisibleInOutfits(groupKey)
        ? resolveSeoOutfitSourceSlug(groupKey)
        : null
    return slug
      ? `/outfits/source/${slug}`
      : {
          path: '/outfits',
          query: { source: obtainType },
        }
  })

  // Get outfit description from database (if available in outfit_translations)
  const outfitDescription = computed(() => {
    if (!outfit.value) return ''
    // Description comes from database outfit_translations table
    // The fetchOutfitById composable should fetch this
    return (
      (outfit.value as OutfitWithItems & { description?: string })
        .description || ''
    )
  })

  // Retry fetch
  const retryFetch = () => {
    refresh()
  }

  // Navigate to list
  const navigateToList = () => {
    navigateTo(localePath('/outfits'))
  }

  // SEO Meta Tags
  const ogOutfitImage = computed(() =>
    outfit.value ? getOgImageSrc('outfit', outfit.value.id) : undefined
  )

  useSeoMeta({
    title: () =>
      `${t(`outfit.${outfitId.value}.name`)} - ${t('navigation.outfit_detail')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () =>
      t('meta.description.outfit_detail', {
        name: t(`outfit.${outfitId.value}.name`) || '',
      }),
    ogTitle: () =>
      `${t(`outfit.${outfitId.value}.name`)} - ${t('navigation.outfit_detail')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () =>
      t('meta.description.outfit_detail', {
        name: t(`outfit.${outfitId.value}.name`) || '',
      }),
    ogImage: () => ogOutfitImage.value,
    twitterTitle: () =>
      `${t(`outfit.${outfitId.value}.name`)} - ${t('navigation.outfit_detail')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () =>
      t('meta.description.outfit_detail', {
        name: t(`outfit.${outfitId.value}.name`) || '',
      }),
    twitterImage: () => ogOutfitImage.value,
  })
</script>
