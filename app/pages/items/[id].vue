<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <!-- Loading State -->
    <n-card
      v-if="loading"
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <div class="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4 lg:gap-6">
        <!-- Image Skeleton -->
        <div class="flex justify-center lg:justify-start">
          <div
            class="relative aspect-[2/3] w-full max-w-[180px] rounded-lg overflow-hidden"
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

    <!-- Error State -->
    <n-card
      v-else-if="error"
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
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

    <!-- Item Detail Content -->
    <template v-else-if="item">
      <!-- Item Header Card -->
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
        content-class="!p-2 sm:p-4"
      >
        <div class="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 lg:gap-6">
          <!-- Item Image -->
          <div class="flex justify-center lg:justify-start items-start">
            <div
              class="relative aspect-[2/3] w-[180px] max-w-full shrink-0 rounded-lg overflow-hidden shadow-lg"
            >
              <div
                class="absolute inset-0 bg-[url('/images/bg.webp')] bg-cover bg-center bg-slate-100 dark:bg-slate-300"
              ></div>
              <!-- Tint overlay -->
              <div
                class="absolute inset-0"
                :style="getQualityOverlayStyle(item.quality)"
              ></div>
              <NuxtImg
                :src="getImageSrc('item', item.id)"
                :alt="itemName"
                class="absolute inset-0 w-full h-full object-cover z-10"
                preset="tallLg"
                fit="cover"
                loading="eager"
                sizes="200px"
              />
            </div>
          </div>

          <!-- Item Info -->
          <div class="space-y-4">
            <div class="flex flex-col gap-4 xl:flex-row xl:items-start">
              <div class="min-w-0 flex-1 space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <h1 class="text-xl sm:text-2xl font-bold leading-tight">
                    {{ itemName }}
                  </h1>
                  <NuxtLinkLocale
                    :to="{
                      path: '/items',
                      query: { quality: item.quality },
                    }"
                    class="hover:opacity-80 transition-opacity"
                  >
                    <n-tag
                      :color="getQualityTextTheme(item.quality)"
                      :bordered="false"
                      round
                      size="small"
                      class="cursor-pointer"
                    >
                      <span class="flex items-center gap-1">
                        {{ item.quality }}
                        <n-icon class="text-xs">
                          <Star />
                        </n-icon>
                      </span>
                    </n-tag>
                  </NuxtLinkLocale>
                  <NuxtLinkLocale
                    :to="{
                      path: '/items',
                      query: { type: itemType },
                    }"
                    class="hover:opacity-80 transition-opacity"
                  >
                    <n-tag
                      type="default"
                      :bordered="false"
                      round
                      size="small"
                      class="cursor-pointer"
                    >
                      {{ $t(`type.${itemType}`) }}
                    </n-tag>
                  </NuxtLinkLocale>
                </div>

                <div class="flex flex-wrap gap-2">
                  <NuxtLinkLocale
                    v-if="itemStyleLabel"
                    :to="{
                      path: '/items',
                      query: { style: itemStyleKey },
                    }"
                    class="hover:opacity-80 transition-opacity"
                  >
                    <n-tag
                      size="small"
                      :bordered="false"
                      type="default"
                      :color="getStyleTagTheme(itemStyleKey)"
                      class="text-xs font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] cursor-pointer"
                    >
                      {{ itemStyleLabel }}
                    </n-tag>
                  </NuxtLinkLocale>
                  <template
                    v-for="label in itemLabelTags"
                    :key="label.text"
                  >
                    <NuxtLinkLocale
                      v-if="label.tagKey"
                      :to="{ path: '/items', query: { label: label.tagKey } }"
                      class="hover:opacity-80 transition-opacity"
                    >
                      <n-tag
                        size="small"
                        type="default"
                        :color="label.theme"
                        round
                        class="text-xs font-semibold cursor-pointer"
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
                    v-if="itemVersionDisplay"
                    :to="{
                      path: '/items',
                      query: { version: itemVersion },
                    }"
                    class="hover:opacity-80 transition-opacity"
                  >
                    <n-tag
                      type="default"
                      :bordered="false"
                      round
                      size="small"
                      class="cursor-pointer"
                    >
                      {{ itemVersionDisplay }}
                    </n-tag>
                  </NuxtLinkLocale>
                  <NuxtLinkLocale
                    v-if="itemObtainLabel && itemObtainType != null"
                    :to="{
                      path: '/items',
                      query: { source: itemObtainType },
                    }"
                    class="hover:opacity-80 transition-opacity"
                  >
                    <n-tag
                      type="default"
                      :bordered="false"
                      round
                      size="small"
                      class="cursor-pointer"
                    >
                      {{ itemObtainLabel }}
                    </n-tag>
                  </NuxtLinkLocale>
                </div>

                <div
                  v-if="itemDescription"
                  class="text-sm opacity-80 leading-relaxed"
                >
                  <p class="whitespace-pre-wrap">{{ itemDescription }}</p>
                </div>
              </div>

              <div
                v-if="showStyleScores"
                class="w-full shrink-0 xl:min-w-[160px] xl:max-w-[160px]"
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
                      class="text-sm font-semibold min-w-[90px] justify-center shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
                    >
                      {{ score.label }}
                    </n-tag>
                    <div
                      class="flex-1 rounded-md bg-black/5 dark:bg-white/10 px-2 py-0.5 text-sm font-semibold tabular-nums text-right opacity-80"
                    >
                      {{ score.value }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div
                v-for="outfitSet in outfitItemSets"
                :key="outfitSet.id"
                class="space-y-2"
              >
                <n-collapse>
                  <n-collapse-item
                    :title="
                      outfitItemSets.length > 1
                        ? `${$t('common.items')} (${outfitSet.outfitItems.length}) - ${outfitSet.name}`
                        : `${$t('common.items')} (${outfitSet.outfitItems.length})`
                    "
                    :name="`items-${outfitSet.id}`"
                  >
                    <div
                      class="grid grid-cols-5 gap-1.5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10"
                    >
                      <ItemCard
                        v-for="outfitItem in outfitSet.outfitItems"
                        :key="outfitItem.id"
                        :class="
                          outfitItem.id === itemId
                            ? 'rounded-md pointer-events-none'
                            : ''
                        "
                        :style="
                          outfitItem.id === itemId
                            ? getQualityRingStyle(outfitItem.quality)
                            : ''
                        "
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
                    v-if="outfitSet.makeupItems.length > 0"
                    :title="
                      outfitItemSets.length > 1
                        ? `${$t('common.makeup')} (${outfitSet.makeupItems.length}) - ${outfitSet.name}`
                        : `${$t('common.makeup')} (${outfitSet.makeupItems.length})`
                    "
                    :name="`makeup-${outfitSet.id}`"
                  >
                    <div
                      class="grid grid-cols-5 gap-1.5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10"
                    >
                      <ItemCard
                        v-for="makeupItem in outfitSet.makeupItems"
                        :key="makeupItem.id"
                        :class="
                          makeupItem.id === itemId
                            ? 'rounded-md pointer-events-none'
                            : ''
                        "
                        :style="
                          makeupItem.id === itemId
                            ? getQualityRingStyle(makeupItem.quality)
                            : ''
                        "
                        :item-id="makeupItem.id"
                        :quality="makeupItem.quality"
                        :type="resolveItemType(makeupItem)"
                        :name="$t(`item.${makeupItem.id}.name`)"
                        size="sm"
                      />
                    </div>
                  </n-collapse-item>
                </n-collapse>
              </div>
            </div>

            <div
              v-if="supportsItemFeedback"
              class="rounded-lg border border-slate-200/70 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div class="flex gap-2 flex-row items-center justify-between">
                <div class="flex flex-wrap items-center gap-2">
                  <div
                    class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400"
                  >
                    {{ t('feedback.current_tags') }}
                  </div>
                  <n-button
                    tertiary
                    size="tiny"
                    @click="showFeedbackModal = true"
                  >
                    {{ t('feedback.suggest_action') }}
                  </n-button>
                  <NuxtLinkLocale
                    to="/feedback"
                    class="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-300 dark:hover:text-rose-200"
                  >
                    {{ t('feedback.view_queue') }}
                  </NuxtLinkLocale>
                </div>
                <div
                  v-if="showCurrentTagsToggle"
                  class="flex justify-end"
                >
                  <n-button
                    secondary
                    circle
                    size="small"
                    @click="showExpandedCurrentTags = !showExpandedCurrentTags"
                  >
                    <span class="flex items-center gap-1">
                      <n-icon>
                        <component
                          :is="showExpandedCurrentTags ? CaretUp : CaretDown"
                        />
                      </n-icon>
                    </span>
                  </n-button>
                </div>
              </div>

              <div class="mt-3">
                <AttributeCard
                  v-if="hasCurrentTags"
                  :metadata="itemSearchMetadata"
                  :item-type="itemType"
                  display-mode="editable"
                  :collapsible="showCurrentTagsToggle"
                  :expanded="showExpandedCurrentTags"
                  @expand="showExpandedCurrentTags = true"
                />

                <p
                  v-else
                  class="text-xs opacity-70"
                >
                  {{ t('feedback.no_tags') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </n-card>

      <!-- Variations, Banner, and Outfits Grid (side by side on desktop) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
        <!-- Item Variations Section -->
        <n-card
          v-if="itemVariations.length > 1"
          size="small"
          class="rounded-xl p-0 sm:p-2"
          content-class="!p-2 sm:p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-bold">
              {{ $t('common.variations') }}
            </h2>
          </div>
          <div
            class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5 gap-2"
          >
            <NuxtLinkLocale
              v-for="variation in itemVariations"
              :key="variation.id"
              :to="`/items/${variation.id}`"
              class="block group"
              :class="[
                variation.id === itemId
                  ? 'cursor-default pointer-events-none'
                  : 'cursor-pointer',
              ]"
            >
              <div
                class="relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-200 ease-in-out shadow-md"
                :class="[
                  variation.id === itemId
                    ? 'ring-2 ring-primary/60 dark:ring-primary/40 ring-opacity-50'
                    : 'group-hover:scale-105',
                ]"
              >
                <div
                  class="absolute inset-0 bg-[url('/images/bg.webp')] bg-cover bg-center bg-slate-100 dark:bg-slate-300"
                ></div>
                <!-- Tint overlay -->
                <div
                  class="absolute inset-0"
                  :style="getQualityOverlayStyle(variation.quality)"
                ></div>
                <NuxtImg
                  :src="getImageSrc('item', variation.id)"
                  :alt="$t(`item.${variation.id}.name`)"
                  class="absolute inset-0 w-full h-full object-cover z-10"
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

        <!-- Related Outfits Section -->
        <n-card
          v-if="relatedOutfits.length > 0"
          size="small"
          class="rounded-xl p-0 sm:p-2"
          content-class="!p-2 sm:p-4"
        >
          <h2 class="text-lg font-bold mb-3">
            {{ $t('common.outfit') }}
          </h2>
          <div
            class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5 gap-2"
          >
            <div
              v-for="outfit in relatedOutfits"
              :key="outfit.id"
            >
              <NuxtLinkLocale
                :to="`/outfits/${outfit.id}`"
                class="block group"
              >
                <OutfitCard
                  :outfit-id="outfit.id"
                  :quality="outfit.quality"
                  :name="outfit.name"
                  size="sm"
                  :show-info="false"
                  class="transition-all duration-200 ease-in-out group-hover:scale-105 group-hover:shadow-xl"
                />
              </NuxtLinkLocale>
              <div class="mt-1 text-center">
                <p class="font-medium text-xs line-clamp-2">
                  {{ outfit.name }}
                </p>
              </div>
            </div>
          </div>
        </n-card>

        <!-- Banner Section -->
        <n-card
          v-if="inBanner"
          size="small"
          class="rounded-xl p-0 sm:p-2 h-full flex flex-col"
          content-class="!p-2 sm:p-4 flex flex-col h-full"
        >
          <h2 class="text-lg font-bold mb-3">
            {{ $t('common.banner') }}
          </h2>
          <NuxtLinkLocale
            :to="`/banners/${inBanner.bannerId}`"
            class="block group"
          >
            <div
              class="relative aspect-[2/1] max-h-[150px] rounded-lg overflow-hidden transition-all duration-200 ease-in-out shadow-md group-hover:scale-[1.02]"
            >
              <NuxtImg
                :src="getImageSrc('banner', inBanner.bannerId)"
                :alt="$t(`banner.${inBanner.bannerId}.name`)"
                class="w-full h-full object-cover"
                preset="bannerThumb"
                fit="cover"
                loading="lazy"
                sizes="200px"
              />
            </div>
            <div class="mt-2">
              <p class="font-medium text-sm line-clamp-2">
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
      content-class="!p-2 sm:p-4"
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
              class="mx-auto w-24 h-24 sm:w-32 sm:h-32 object-cover"
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

    <FeedbackSubmitModal
      v-if="item && supportsItemFeedback"
      v-model:show="showFeedbackModal"
      :item-id="itemId"
      :item-name="itemName"
      :item-type="itemType"
      :metadata="itemSearchMetadata"
    />
  </div>
</template>

<script setup lang="ts">
  import { CaretDown, CaretUp, Star } from '@vicons/fa'

  const { t, te, locale } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()
  const requestEvent = useRequestEvent()

  // Get item ID from route
  const itemId = computed(() => Number(route.params.id))

  // Composable
  const { fetchItemById } = useSupabaseItems()
  const { getImageSrc } = imageProvider()
  const nuxtImg = useImage()
  const showFeedbackModal = ref(false)
  const showExpandedCurrentTags = ref(false)

  const itemKey = computed(() => `item-${itemId.value}-${locale.value}`)

  const {
    data: item,
    pending: loading,
    error,
    refresh,
  } = await useAsyncData(
    () => itemKey.value,
    () => fetchItemById(itemId.value),
    {
      default: () => null,
      lazy: true,
    }
  )

  if (import.meta.server && requestEvent && !error.value && !item.value) {
    setResponseStatus(requestEvent, 404)
    applyPageCacheHeaders(requestEvent, 'noStore')
  }

  // Computed related outfits with names from i18n
  const relatedOutfits = computed(() => {
    if (!item.value?.outfit_items) return []
    return item.value.outfit_items.map((sc) => ({
      ...sc.outfits,
      name: t(`outfit.${sc.outfits.id}.name`),
    }))
  })

  const baseOutfitId = computed(() =>
    Number(getOutfitIdFromItemId(String(itemId.value)))
  )

  const relatedOutfit = computed(() => {
    const outfits =
      item.value?.outfit_items?.map((entry) => entry.outfits) ?? []
    if (!outfits.length) return null
    const baseId = baseOutfitId.value
    if (Number.isFinite(baseId)) {
      const baseMatch = outfits.find((outfit) => outfit.id === baseId)
      if (baseMatch) return baseMatch
    }
    return outfits.reduce((lowest, current) =>
      current.id < lowest.id ? current : lowest
    )
  })

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

  const outfitItemSets = computed(() => {
    const outfit = relatedOutfit.value
    if (!outfit?.outfit_items?.length) return []
    const allItems = outfit.outfit_items.map((entry) => entry.items)
    const outfitItems = sortItemsByCategory(
      allItems.filter((entry) => !makeupTypes.includes(resolveItemType(entry)))
    )
    const makeupItems = sortItemsByCategory(
      allItems.filter((entry) => makeupTypes.includes(resolveItemType(entry)))
    )
    if (!outfitItems.length && !makeupItems.length) return []

    return [
      {
        id: outfit.id,
        name: t(`outfit.${outfit.id}.name`),
        outfitItems,
        makeupItems,
      },
    ]
  })

  // Computed item variations with labels
  const itemVariations = computed(() => {
    if (!item.value?.variations) return []

    return [...item.value.variations]
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

  // Find banner for this item (including variations)
  const inBanner = computed(() => {
    if (!item.value) return null

    let banner = getBannerForItem(item.value.id)
    if (banner) return banner

    const linkedOutfitIds =
      item.value.outfit_items?.map((entry) => String(entry.outfits.id)) ?? []
    for (const outfitId of linkedOutfitIds) {
      banner = getBannerForOutfit(outfitId)
      if (banner) return banner
    }

    const derivedOutfitId = getOutfitIdFromItemId(String(item.value.id))
    banner = getBannerForOutfit(derivedOutfitId)
    if (banner) return banner

    if (item.value.variations) {
      for (const variation of item.value.variations) {
        banner = getBannerForItem(variation.id)
        if (banner) return banner

        const variationOutfitId = getOutfitIdFromItemId(String(variation.id))
        banner = getBannerForOutfit(variationOutfitId)
        if (banner) return banner
      }
    }

    return null
  })

  // Get item type
  const itemType = computed(() => {
    if (!item.value) return 'unknown'
    return item.value.type
      ? getItemType(item.value.type)
      : getItemType(item.value.id)
  })
  const itemSearchMetadata = computed(() =>
    getItemSearchMetadataFromAttributes(item.value?.item_attributes ?? null)
  )
  const supportsItemFeedback = computed(
    () =>
      Boolean(itemSearchMetadata.value) &&
      isSupportedItemSearchItemType(itemType.value)
  )

  const isMakeupItem = computed(() => makeupTypes.includes(itemType.value))
  const currentTagSections = computed(() =>
    supportsItemFeedback.value
      ? getItemSearchMetadataSections(
          itemSearchMetadata.value,
          itemType.value,
          {
            editableOnly: true,
          }
        )
      : []
  )
  const hasCurrentTags = computed(() => currentTagSections.value.length > 0)
  const showCurrentTagsToggle = computed(() =>
    currentTagSections.value.some((section) =>
      section.fields.some(
        (field) => field.field !== 'category' && field.field !== 'subcategory'
      )
    )
  )

  const hasStyleProps = computed(() => {
    if (!item.value?.props) return false
    return item.value.props.some((value) => Number(value) !== 0)
  })

  // Get item name from i18n
  const itemName = computed(() => {
    if (!item.value) return ''
    return t(`item.${itemId.value}.name`)
  })

  const itemVersion = computed(() => {
    if (!item.value) return null
    const obtainType = (item.value as ItemWithOutfits).obtain_type
    return getVersionFromId(obtainType)
  })

  const itemVersionDisplay = computed(() => {
    if (!itemVersion.value) return null
    const key = `version.${itemVersion.value}`
    const label = te(key) ? t(key) : null
    return label ? `${itemVersion.value} - ${label}` : itemVersion.value
  })

  const itemObtainType = computed(() => {
    if (!item.value) return null
    return (item.value as ItemWithOutfits).obtain_type
  })

  const itemObtainLabel = computed(() => {
    const obtainType = itemObtainType.value
    if (obtainType === null || obtainType === undefined) return null
    const key = `obtain.${obtainType}.name`
    const translated = t(key)
    return translated !== key ? translated : `${obtainType}`
  })

  // Get item description from database (if available in item_translations)
  const itemDescription = computed(() => {
    if (!item.value) return ''
    // Description comes from database item_translations table
    // The fetchItemById composable should fetch this
    return (
      (item.value as ItemWithOutfits & { description?: string }).description ||
      ''
    )
  })

  const itemStyleLabel = computed(() => {
    if (!item.value) return null
    const styleKey = itemStyleKey.value
    const style = styleKey ? STYLE_BY_KEY.get(styleKey) : null
    return style ? t(style.i18nKey) : null
  })

  const itemStyleKey = computed(() => {
    if (!item.value) return null
    return (
      item.value.style_key ||
      (hasStyleProps.value ? resolveStyleKeyFromProps(item.value.props) : null)
    )
  })

  const styleScores = computed(() => {
    if (!item.value?.props) return []
    if (!hasStyleProps.value) return []
    return STYLE_DEFINITIONS.map((style, index) => {
      const rawValue = item.value?.props?.[index]
      const value = Number(rawValue)
      return {
        key: style.key,
        label: t(style.i18nKey),
        value: Number.isFinite(value) ? value : 0,
        theme: getStyleTagTheme(style.key),
      }
    })
  })

  const showStyleScores = computed(
    () => !isMakeupItem.value && styleScores.value.length > 0
  )

  const itemLabelTags = computed(() => {
    if (!item.value) return []
    return resolveTagI18nKeys(item.value.tags).map((key) => {
      const tagDef = TAG_DEFINITIONS.find((t) => t.i18nKey === key)
      return {
        text: t(key),
        theme: getLabelTagTheme(key),
        tagKey: tagDef?.key || null,
      }
    })
  })

  const listingPath = computed(() => localePath('/items'))
  const canNavigateBackToList = computed(() => {
    if (!import.meta.client) return false

    const back = window.history.state?.back
    return typeof back === 'string' && back.startsWith(listingPath.value)
  })

  // Retry fetch
  const retryFetch = () => {
    refresh()
  }

  watch(itemId, () => {
    showExpandedCurrentTags.value = false
  })

  // Navigate to list
  const navigateToList = () => {
    if (canNavigateBackToList.value) {
      router.back()
      return
    }

    navigateTo(listingPath.value)
  }

  // SEO Meta Tags
  const ogItemImage = computed(() =>
    item.value
      ? nuxtImg(
          `/images/items/${item.value.id}.png`,
          {},
          {
            preset: 'tallLg',
          }
        )
      : undefined
  )

  useSeoMeta({
    title: () =>
      `${t(`item.${itemId.value}.name`)} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () =>
      t('meta.description.item_detail', {
        name: t(`item.${itemId.value}.name`) || '',
      }),
    ogTitle: () =>
      `${t(`item.${itemId.value}.name`)} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () =>
      t('meta.description.item_detail', {
        name: t(`item.${itemId.value}.name`) || '',
      }),
    ogImage: () => ogItemImage.value,
    twitterTitle: () =>
      `${t(`item.${itemId.value}.name`)} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () =>
      t('meta.description.item_detail', {
        name: t(`item.${itemId.value}.name`) || '',
      }),
    twitterImage: () => ogItemImage.value,
  })
</script>
