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

    <!-- Item Detail Content -->
    <template v-else-if="item">
      <!-- Item Header Card -->
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
        content-class="p-2 sm:p-4"
      >
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr] lg:gap-6">
          <!-- Item Image -->
          <div class="flex items-start justify-center lg:justify-start">
            <div class="w-50 max-w-full shrink-0">
              <div
                class="group relative aspect-2/3 w-full overflow-hidden rounded-lg shadow-lg"
              >
                <div
                  class="absolute inset-0 bg-slate-100 bg-[url('/images/bg.webp')] bg-cover bg-center dark:bg-slate-300"
                ></div>
                <!-- Tint overlay -->
                <div
                  class="absolute inset-0"
                  :style="getQualityOverlayStyle(item.quality)"
                ></div>
                <NuxtImg
                  :src="getImageSrc(showIcon ? 'itemIcon' : 'item', item.id)"
                  :alt="itemName"
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

                <!-- Toggle Button -->
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

          <!-- Item Info -->
          <div class="space-y-4">
            <div class="flex flex-col gap-4 xl:flex-row xl:items-start">
              <div class="min-w-0 flex-1 space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <h1 class="text-xl leading-tight font-bold sm:text-2xl">
                    {{ itemName }}
                  </h1>
                  <NuxtLinkLocale
                    :to="itemQualityListLocation"
                    class="transition-opacity hover:opacity-80"
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
                    :to="itemTypeListLocation"
                    class="transition-opacity hover:opacity-80"
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
                  <WardrobeStatusBadge
                    v-if="wardrobeInitialized && currentItemWardrobeStatus"
                    :status="currentItemWardrobeStatus"
                    :quality="item.quality"
                    :evo-level="currentItemDisplayEvoLevel"
                    :glow-up-owned="currentItemDisplayGlowUpOwned"
                  />
                  <WardrobeOwnedButton
                    v-if="wardrobeInitialized"
                    :owned="currentItemActionOwned"
                    :disabled="!isWardrobeReady"
                    :loading="wardrobeSaving"
                    :quality="item.quality"
                    :evo-level="currentItemDisplayEvoLevel"
                    :menu-options="itemVariationMarkOptions"
                    variant="overlay"
                    @toggle="toggleCurrentItemOwned"
                    @menu-select="markCurrentItemVariantOwned"
                  />
                </div>

                <div class="flex flex-wrap gap-2">
                  <NuxtLinkLocale
                    v-if="itemStyleLabel"
                    :to="itemStyleListLocation"
                    class="transition-opacity hover:opacity-80"
                  >
                    <n-tag
                      size="small"
                      :bordered="false"
                      type="default"
                      :color="getStyleTagTheme(itemStyleKey)"
                      class="cursor-pointer text-xs font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
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
                      :to="getItemTagListLocation(label.tagKey)"
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
                    v-if="itemVersionDisplay"
                    :to="itemVersionListLocation"
                    class="transition-opacity hover:opacity-80"
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
                    :to="itemSourceListLocation"
                    class="transition-opacity hover:opacity-80"
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
                  class="text-sm leading-relaxed opacity-80"
                >
                  <p class="whitespace-pre-wrap">{{ itemDescription }}</p>
                </div>
              </div>

              <div
                v-if="showStyleScores"
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

            <div>
              <div
                v-for="outfitSet in outfitItemSets"
                :key="outfitSet.id"
                class="space-y-2"
              >
                <n-collapse>
                  <n-collapse-item
                    v-if="outfitSet.outfitItems.length > 0"
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
                            ? 'pointer-events-none rounded-md'
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
              </div>
            </div>

            <div
              v-if="supportsItemFeedback"
              class="rounded-lg border border-slate-200/70 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div class="flex flex-wrap items-center gap-2">
                <div
                  class="order-1 text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400"
                >
                  {{ t('feedback.current_tags') }}
                </div>
                <div
                  class="order-3 flex w-full flex-wrap items-center gap-2 sm:order-2 sm:w-auto"
                >
                  <n-button
                    type="info"
                    secondary
                    round
                    size="tiny"
                    @click="navigateTo(similarSearchPath)"
                  >
                    <template #icon>
                      <n-icon>
                        <Search />
                      </n-icon>
                    </template>
                    {{ t('search_page.find_similar') }}
                  </n-button>
                  <n-button
                    tertiary
                    round
                    size="tiny"
                    @click="showFeedbackModal = true"
                  >
                    <template #icon>
                      <n-icon>
                        <PencilAlt />
                      </n-icon>
                    </template>
                    {{ t('feedback.suggest_action') }}
                  </n-button>
                  <n-button
                    tertiary
                    round
                    size="tiny"
                    @click="navigateTo(feedbackQueuePath)"
                  >
                    <template #icon>
                      <n-icon>
                        <ClipboardList />
                      </n-icon>
                    </template>
                    {{ t('feedback.view_queue') }}
                  </n-button>
                </div>
                <div
                  v-if="showCurrentTagsToggle"
                  class="order-2 ml-auto flex justify-end sm:order-3"
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
      <div class="grid grid-cols-1 gap-2 sm:gap-4 lg:grid-cols-2">
        <!-- Item Variations Section -->
        <n-card
          v-if="itemVariations.length > 1"
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
              :to="getItemEntityDetailPath(variation.id)"
              class="group block"
              :class="[
                variation.id === itemId
                  ? 'pointer-events-none cursor-default'
                  : 'cursor-pointer',
              ]"
            >
              <div
                class="relative aspect-2/3 overflow-hidden rounded-lg shadow-md transition-all duration-200 ease-in-out"
                :class="[
                  variation.id === itemId ? '' : 'group-hover:scale-105',
                ]"
                :style="
                  variation.id === itemId
                    ? getQualityRingStyle(variation.quality)
                    : ''
                "
              >
                <div
                  class="absolute inset-0 bg-slate-100 bg-[url('/images/bg.webp')] bg-cover bg-center dark:bg-slate-300"
                ></div>
                <!-- Tint overlay -->
                <div
                  class="absolute inset-0"
                  :style="getQualityOverlayStyle(variation.quality)"
                ></div>
                <NuxtImg
                  :src="getImageSrc('item', variation.id)"
                  :alt="$t(`item.${variation.id}.name`)"
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

        <!-- Related Outfits Section -->
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
                :to="getEntityDetailPath('outfit', outfit.id)"
                class="group block"
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
                <p class="line-clamp-2 text-xs font-medium">
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
          class="flex h-full flex-col rounded-xl p-0 sm:p-2"
          content-class="p-2 sm:p-4 flex flex-col h-full"
        >
          <h2 class="mb-3 text-lg font-bold">
            {{ $t('common.banner') }}
          </h2>
          <NuxtLinkLocale
            :to="getEntityDetailPath('banner', inBanner.bannerId)"
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
  import {
    CaretDown,
    CaretUp,
    ClipboardList,
    Images,
    PencilAlt,
    Search,
    Star,
  } from '@vicons/fa'
  import type { DropdownOption } from 'naive-ui'

  type WardrobeVariantMarkKey =
    | VariantType
    | 'complete-set'
    | 'unmark-all'
    | 'mark-current-owned'
    | 'unmark-current'
  type WardrobeVariantMarkDividerKey = 'divider-glowup' | 'divider-bulk'
  type WardrobeVariantMarkOption = DropdownOption & {
    key: WardrobeVariantMarkKey | WardrobeVariantMarkDividerKey
  }
  const markCurrentVariantOption = (
    option: WardrobeVariantMarkOption,
    currentVariantType?: VariantType | null
  ): WardrobeVariantMarkOption =>
    currentVariantType && option.key === currentVariantType
      ? {
          ...option,
          label: () =>
            h('span', { class: 'font-semibold' }, String(option.label ?? '')),
        }
      : option

  type DetailItem = {
    id: number
    quality: number
    type: string
  }

  type OutfitItemSet = {
    id: number
    name: string
    outfitItems: DetailItem[]
  }

  const { t, te, locale } = useI18n()
  const message = useMessage()
  const localePath = useLocalePath()
  const router = useRouter()
  const requestEvent = useRequestEvent()

  // Get item ID from route
  const {
    entityId: itemId,
    canonicalUrl: canonicalItemUrl,
    redirectToCanonicalSlug,
  } = useEntityDetailRoute('item')

  await redirectToCanonicalSlug()

  // Composable
  const { fetchItemById } = useSupabaseItems()
  const catalogIndex = useCatalogIndex()
  const { getImageSrc } = imageProvider()
  const showFeedbackModal = ref(false)
  const showExpandedCurrentTags = ref(false)
  const showIcon = ref(false)
  const {
    initialized: wardrobeInitialized,
    saving: wardrobeSaving,
    canMutate: isWardrobeReady,
    isItemOwned,
    markItemsOwned,
  } = useWardrobe()

  if (import.meta.client) {
    void catalogIndex.load(['items']).catch(() => undefined)
  }

  const itemVariationIds = computed(
    () =>
      catalogIndex.index.value?.itemGroupIdsById.get(itemId.value) ?? [
        itemId.value,
      ]
  )
  const getCatalogItemVariantType = (id: number) =>
    getItemVariantType(
      id,
      catalogIndex.index.value?.itemById.get(id)?.catalogGroupRootId
    )
  const itemKey = computed(() => `item-${itemId.value}-${locale.value}`)

  const {
    data: item,
    pending: itemPending,
    status: itemStatus,
    error,
    refresh,
  } = await useAsyncData(
    () => itemKey.value,
    () => (Number.isFinite(itemId.value) ? fetchItemById(itemId.value) : null),
    {
      default: () => null,
      lazy: true,
      server: false,
    }
  )
  const loading = computed(
    () => itemPending.value || itemStatus.value === 'idle'
  )

  if (import.meta.server && requestEvent && !Number.isFinite(itemId.value)) {
    setResponseStatus(requestEvent, 404)
    applyPageCacheHeaders(requestEvent, 'noStore')
  }

  // Computed related outfits with names from i18n
  const relatedOutfits = computed(() => {
    if (!item.value) return []
    return ((item.value as ItemWithOutfits).outfit_items || []).map((sc) => ({
      ...sc.outfits,
      name: t(`outfit.${sc.outfits.id}.name`),
    }))
  })

  const baseOutfitId = computed(() =>
    Number(getOutfitIdFromItemId(String(itemId.value)))
  )

  const relatedOutfit = computed(() => {
    const outfits = (
      (item.value as ItemWithOutfits | null)?.outfit_items || []
    ).map((entry) => entry.outfits)
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

  const resolveItemType = (item: { id: number; type?: string }) =>
    item.type ? getItemType(item.type) : getItemType(item.id)

  const outfitItemSets = computed<OutfitItemSet[]>(() => {
    const outfit = relatedOutfit.value
    if (!outfit?.outfit_items?.length) return []
    const allItems = outfit.outfit_items.map((entry) => entry.items)
    const outfitItems = sortItemsByCategory(allItems)
    if (!outfitItems.length) return []

    return [
      {
        id: outfit.id,
        name: t(`outfit.${outfit.id}.name`),
        outfitItems,
      },
    ]
  })

  const getVariationDisplayRank = (variantType: VariantType) => {
    if (variantType === 'base') return 0
    if (variantType === 'evo1') return 1
    if (variantType === 'evo2') return 2
    if (variantType === 'evo3') return 3
    return 4
  }

  // Computed item variations with labels
  const itemVariations = computed(() => {
    if (!item.value) return []

    return itemVariationIds.value
      .map((id) => ({
        id,
        quality: item.value!.quality,
        type: getCatalogItemVariantType(id),
      }))
      .sort((a, b) => {
        return (
          getVariationDisplayRank(a.type) - getVariationDisplayRank(b.type) ||
          a.id - b.id
        )
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
          type: v.type,
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

    for (const variationId of itemVariationIds.value) {
      banner = getBannerForItem(variationId)
      if (banner) return banner
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
  const itemTypeListLocation = computed(() => {
    const slug = resolveSeoItemTypeSlug(itemType.value)
    return slug
      ? `/items/${slug}`
      : {
          path: '/items',
          query: { type: itemType.value },
        }
  })
  const itemQualityListLocation = computed(() => {
    if (!item.value) return '/items'

    const slug = resolveSeoItemQualitySlug(item.value.quality)
    return slug
      ? `/items/quality/${slug}`
      : {
          path: '/items',
          query: { quality: item.value.quality },
        }
  })
  const itemStyleListLocation = computed(() => {
    const styleKey = itemStyleKey.value
    if (!styleKey) return '/items'

    const slug = resolveSeoStyleSlug(styleKey)
    return slug
      ? `/items/style/${slug}`
      : {
          path: '/items',
          query: { style: styleKey },
        }
  })
  const getItemTagListLocation = (tagKey: string) => {
    const slug = resolveSeoTagSlug(tagKey)
    return slug
      ? `/items/tag/${slug}`
      : {
          path: '/items',
          query: { label: tagKey },
        }
  }
  const itemSearchMetadata = computed(() =>
    getItemSearchMetadataFromAttributes(
      (item.value as ItemWithOutfits | null)?.item_attributes ?? null
    )
  )
  const supportsItemFeedback = computed(
    () =>
      Boolean(itemSearchMetadata.value) &&
      isSupportedItemSearchItemType(itemType.value as ItemType)
  )

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
  const itemSeoName = computed(
    () => itemName.value || t('navigation.item_detail')
  )
  const itemSeoTitle = computed(() =>
    itemName.value
      ? `${itemName.value} - ${t('navigation.item_detail')}`
      : t('navigation.item_detail')
  )

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
  const itemVersionListLocation = computed(() => {
    if (!itemVersion.value) return '/items'

    const slug = resolveSeoVersionSlug(itemVersion.value)
    return slug
      ? `/items/version/${slug}`
      : {
          path: '/items',
          query: { version: itemVersion.value },
        }
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
  const itemSourceListLocation = computed(() => {
    const obtainType = itemObtainType.value
    if (obtainType === null || obtainType === undefined) {
      return '/items'
    }

    const groupKey = resolveObtainGroupKey(obtainType)
    const slug = resolveSeoItemSourceSlug(groupKey)
    return slug
      ? `/items/source/${slug}`
      : {
          path: '/items',
          query: { source: obtainType },
        }
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

  const showStyleScores = computed(() => styleScores.value.length > 0)

  const itemLabelTags = computed(() => {
    if (!item.value) return []
    const tags = 'tags' in item.value ? item.value.tags : null
    return resolveTagI18nKeys(tags).map((key) => {
      const tagDef = TAG_DEFINITIONS.find((t) => t.i18nKey === key)
      return {
        text: t(key),
        theme: getLabelTagTheme(key),
        tagKey: tagDef?.key || null,
      }
    })
  })

  const listingPath = computed(() => localePath('/items'))
  const feedbackQueuePath = computed(() => localePath('/feedback'))
  const similarSearchPath = computed(() =>
    localePath({
      path: '/search',
      query: { similar: itemId.value },
    })
  )
  const canNavigateBackToList = computed(() => {
    if (!import.meta.client) return false

    const back = window.history.state?.back
    return typeof back === 'string' && back.startsWith(listingPath.value)
  })

  const itemVariationMarkOptions = computed<WardrobeVariantMarkOption[]>(() => {
    if (!item.value) return []
    if (item.value.quality < 4) return []

    return [
      { key: 'base', label: t('wardrobe.actions.base_only') },
      { key: 'evo1', label: t('banner.outfit.level.2') },
      ...(item.value.quality >= 5
        ? [
            {
              key: 'evo2',
              label: t('banner.outfit.level.3'),
            },
            {
              key: 'evo3',
              label: t('banner.outfit.level.4'),
            },
          ]
        : []),
      { key: 'divider-glowup', type: 'divider' },
      {
        key: 'glowup',
        label: t(
          currentItemGlowUpOwned.value
            ? 'wardrobe.actions.unmark_glowup'
            : 'wardrobe.actions.mark_glowup'
        ),
      },
      { key: 'divider-bulk', type: 'divider' },
      { key: 'complete-set', label: t('wardrobe.actions.mark_all') },
      { key: 'unmark-all', label: t('wardrobe.actions.unmark_all') },
    ].map((option) =>
      markCurrentVariantOption(option, getCatalogItemVariantType(itemId.value))
    )
  })

  const getVariantMarkMaxRank = (key: WardrobeVariantMarkKey) => {
    if (key === 'base') return 0
    if (key === 'glowup') return 1
    if (key === 'evo1') return 2
    if (key === 'evo2') return 3
    if (key === 'evo3') return 4
    return 0
  }
  const getVariantRank = (variantType: VariantType) => {
    if (variantType === 'base') return 0
    if (variantType === 'glowup') return 1
    if (variantType === 'evo1') return 2
    if (variantType === 'evo2') return 3
    return 4
  }
  const getEvoLevel = (variantType: VariantType) => {
    if (variantType === 'evo1') return 1
    if (variantType === 'evo2') return 2
    if (variantType === 'evo3') return 3
    return null
  }

  const currentItemEvoLevel = computed(() => {
    if (!item.value) return null

    return itemVariationIds.value.reduce<number | null>((level, variation) => {
      const variantType = getCatalogItemVariantType(variation)
      const evoLevel = getEvoLevel(variantType)
      return evoLevel && isItemOwned(variation)
        ? Math.max(level ?? 0, evoLevel)
        : level
    }, null)
  })
  const currentItemGlowUpIds = computed(() => {
    if (!item.value) return []
    return itemVariationIds.value.filter(
      (relatedId) => getCatalogItemVariantType(relatedId) === 'glowup'
    )
  })
  const currentItemGlowUpOwned = computed(
    () =>
      currentItemGlowUpIds.value.length > 0 &&
      currentItemGlowUpIds.value.every(isItemOwned)
  )
  const currentItemVariantType = computed(() =>
    getCatalogItemVariantType(itemId.value)
  )
  const currentItemEffectiveOwned = computed(
    () => isItemOwned(itemId.value) || Boolean(currentItemEvoLevel.value)
  )
  const currentItemActionOwned = computed(() =>
    currentItemVariantType.value === 'base'
      ? currentItemEffectiveOwned.value
      : isItemOwned(itemId.value)
  )
  const currentItemWardrobeStatus = computed(() => {
    if (currentItemVariantType.value === 'base') {
      if (currentItemEvoLevel.value) return 'evo-owned'
      if (currentItemGlowUpOwned.value) return 'glowup-owned'
      return isItemOwned(itemId.value) ? 'item-owned' : null
    }
    if (currentItemVariantType.value === 'glowup') {
      return isItemOwned(itemId.value) ? 'glowup-owned' : null
    }
    return isItemOwned(itemId.value) ? 'item-owned' : null
  })
  const currentItemDisplayEvoLevel = computed(() =>
    currentItemVariantType.value === 'base' ? currentItemEvoLevel.value : null
  )
  const currentItemDisplayGlowUpOwned = computed(
    () =>
      currentItemVariantType.value === 'base' && currentItemGlowUpOwned.value
  )

  // Retry fetch
  const retryFetch = () => {
    refresh()
  }

  const toggleCurrentItemOwned = async () => {
    if (!item.value) return

    try {
      if (currentItemActionOwned.value) {
        if (currentItemVariantType.value !== 'base') {
          await markItemsOwned([itemId.value], false)
          return
        }

        const currentRank = getVariantRank(currentItemVariantType.value)
        const itemIds = itemVariationIds.value.filter(
          (relatedId) =>
            getVariantRank(getCatalogItemVariantType(relatedId)) >= currentRank
        )

        if (itemIds.length > 0) {
          await markItemsOwned(itemIds, false)
        }
        return
      }

      const itemIds =
        currentItemVariantType.value === 'glowup'
          ? itemVariationIds.value.filter((relatedId) => {
              const variantType = getCatalogItemVariantType(relatedId)
              return variantType === 'base' || relatedId === itemId.value
            })
          : [itemId.value]
      await markItemsOwned(itemIds, true)
    } catch {
      message.error(t('wardrobe.error.save'))
    }
  }

  const markCurrentItemVariantOwned = async (key: string) => {
    if (!item.value) return

    try {
      const variantKey = key as WardrobeVariantMarkKey
      const relatedIds = itemVariationIds.value
      const maxRank = getVariantMarkMaxRank(variantKey)
      if (variantKey === 'unmark-all') {
        const itemIds = relatedIds.filter(
          (relatedId) =>
            getVariantRank(getCatalogItemVariantType(relatedId)) >= 0
        )

        if (itemIds.length > 0) {
          await markItemsOwned(itemIds, false)
        }
        return
      }
      if (variantKey === 'complete-set') {
        const itemIds = relatedIds

        if (itemIds.length > 0) {
          await markItemsOwned(itemIds, true)
        }
        return
      }
      if (variantKey === 'glowup' && currentItemGlowUpOwned.value) {
        await markItemsOwned(currentItemGlowUpIds.value, false)
        return
      }

      const itemIds = relatedIds.filter((relatedId) => {
        const variantType = getCatalogItemVariantType(relatedId)
        return variantKey === 'glowup'
          ? variantType === 'base' || variantType === 'glowup'
          : variantType !== 'glowup' && getVariantRank(variantType) <= maxRank
      })
      const clearItemIds =
        Number.isFinite(maxRank) && variantKey !== 'glowup'
          ? relatedIds.filter((relatedId) => {
              const variantType = getCatalogItemVariantType(relatedId)
              return (
                variantType !== 'glowup' &&
                getVariantRank(variantType) > maxRank
              )
            })
          : []

      if (itemIds.length > 0) {
        await markItemsOwned(itemIds, true)
      }
      if (clearItemIds.length > 0) {
        await markItemsOwned(clearItemIds, false)
      }
    } catch {
      message.error(t('wardrobe.error.save'))
    }
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
    item.value ? getOgImageSrc('item', item.value.id) : undefined
  )

  useSeoMeta({
    title: () =>
      `${itemSeoTitle.value} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () =>
      t('meta.description.item_detail', {
        name: itemSeoName.value,
      }),
    ogTitle: () =>
      `${itemSeoTitle.value} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () =>
      t('meta.description.item_detail', {
        name: itemSeoName.value,
      }),
    ogImage: () => ogItemImage.value,
    twitterTitle: () =>
      `${itemSeoTitle.value} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () =>
      t('meta.description.item_detail', {
        name: itemSeoName.value,
      }),
    twitterImage: () => ogItemImage.value,
  })

  useHead({
    link: () =>
      canonicalItemUrl.value
        ? [{ rel: 'canonical', href: canonicalItemUrl.value }]
        : [],
  })
</script>
