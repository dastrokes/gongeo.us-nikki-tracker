<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-2 sm:p-4"
    >
      <div class="flex flex-col gap-2">
        <div class="flex items-start justify-between gap-2">
          <div
            class="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"
          >
            <n-select
              :value="compendiumSection"
              :options="compendiumSectionOptions"
              :render-label="renderCompendiumSectionOptionLabel"
              size="small"
              class="w-full max-w-40 self-start sm:w-40"
              :show-checkmark="false"
              :clearable="false"
              @update:value="handleCompendiumSectionChange"
            />

            <n-select
              v-model:value="wardrobeFilter"
              :options="wardrobeFilterOptions"
              :render-label="renderWardrobeFilterOptionLabel"
              size="small"
              class="w-full max-w-40 self-start sm:w-40"
              :show-checkmark="false"
              :clearable="false"
              :disabled="!isWardrobeReady"
            />

            <CatalogVariationToggle
              v-model:value="variationFilter"
              :options="variationFilterOptions"
            />

            <n-select
              v-model:value="makeupKindFilter"
              :options="makeupKindFilterOptions"
              :render-label="renderIconSelectOptionLabel"
              size="small"
              class="w-full max-w-40 self-start sm:w-40"
              :show-checkmark="false"
              :clearable="false"
            />

            <div class="hidden min-w-0 overflow-x-auto sm:block">
              <n-button-group class="min-w-max">
                <n-button
                  size="small"
                  :type="qualityFilter === null ? 'primary' : 'default'"
                  class="min-w-10"
                  @click="qualityFilter = null"
                >
                  {{ t('common.all') }}
                </n-button>
                <n-button
                  v-for="q in [5, 4, 3, 2]"
                  :key="q"
                  size="small"
                  v-bind="getQualityButtonTheme(q, qualityFilter === q)"
                  class="min-w-10"
                  :disabled="q === 2"
                  @click="qualityFilter = q"
                >
                  <span class="flex items-center gap-1">
                    {{ q }}
                    <n-icon>
                      <Star />
                    </n-icon>
                  </span>
                </n-button>
              </n-button-group>
            </div>

            <n-button
              v-if="hasFilters"
              size="small"
              class="hidden sm:inline-flex"
              @click="clearFilters"
            >
              {{ t('common.clear') }}
            </n-button>
          </div>

          <div class="flex shrink-0 items-center gap-2 self-start">
            <n-tooltip
              :disabled="totalItems <= TIER_ENTRY_LIMIT"
              trigger="hover"
            >
              <template #trigger>
                <n-button
                  size="small"
                  type="primary"
                  :disabled="isTierlistDisabled"
                  @click="goToTierlist"
                >
                  <template #icon>
                    <n-icon><SortAmountDown /></n-icon>
                  </template>
                  {{ t('navigation.tierlist') }}
                </n-button>
              </template>
              {{
                t('tierlist.over_limit.description', {
                  max: TIER_ENTRY_LIMIT,
                })
              }}
            </n-tooltip>

            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button
                  size="small"
                  text
                  :type="editMode ? 'primary' : 'default'"
                  :disabled="!isWardrobeReady"
                  class="w-8"
                  :aria-label="
                    editMode
                      ? t('wardrobe.actions.view_mode')
                      : t('wardrobe.actions.edit_mode')
                  "
                  @click="toggleEditMode"
                >
                  <template #icon>
                    <n-icon>
                      <BookOpen v-if="editMode" />
                      <UserEdit v-else />
                    </n-icon>
                  </template>
                </n-button>
              </template>
              {{
                editMode
                  ? t('wardrobe.actions.view_mode')
                  : t('wardrobe.actions.edit_mode')
              }}
            </n-tooltip>
          </div>
        </div>

        <div class="flex items-start gap-2 sm:hidden">
          <div class="min-w-0 flex-1 overflow-x-auto pb-1">
            <n-button-group class="min-w-max">
              <n-button
                size="small"
                :type="qualityFilter === null ? 'primary' : 'default'"
                class="min-w-10"
                @click="qualityFilter = null"
              >
                {{ t('common.all') }}
              </n-button>
              <n-button
                v-for="q in [5, 4, 3, 2]"
                :key="q"
                size="small"
                v-bind="getQualityButtonTheme(q, qualityFilter === q)"
                class="min-w-10"
                :disabled="q === 2"
                @click="qualityFilter = q"
              >
                <span class="flex items-center gap-1">
                  {{ q }}
                  <n-icon>
                    <Star />
                  </n-icon>
                </span>
              </n-button>
            </n-button-group>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <n-button
              v-if="hasFilters"
              size="small"
              @click="clearFilters"
            >
              {{ t('common.clear') }}
            </n-button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <n-select
            v-model:value="slotFilter"
            :options="slotOptions"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_slot')"
          />

          <n-select
            v-model:value="versionFilter"
            :options="versionOptions"
            :render-label="renderVersionOptionLabel"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_version')"
          />

          <n-select
            v-model:value="styleFilter"
            :options="styleOptions"
            size="small"
            class="min-w-0"
            clearable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_style')"
          />

          <n-select
            v-model:value="obtainFilter"
            :options="obtainOptions"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_obtain')"
          />
        </div>
      </div>
    </n-card>

    <WardrobeBatchToolbar
      v-if="editMode"
      v-model:scope="batchScope"
      :edit-mode="editMode"
      :selected-count="selectedMakeupIds.size"
      :page-count="entries.length"
      :all-matching-count="totalItems"
      :disabled="!isWardrobeReady || loading"
      @mark-owned="applyBatchOwnership(true)"
      @mark-unowned="applyBatchOwnership(false)"
      @clear-selection="clearSelection"
    />

    <n-card
      size="small"
      class="rounded-xl p-0 sm:flex sm:flex-1 sm:flex-col sm:p-2"
      content-class="p-2 sm:p-4 sm:flex-1 sm:flex sm:flex-col"
    >
      <div class="min-h-0 sm:flex sm:flex-1 sm:flex-col">
        <div class="space-y-3 sm:space-y-4">
          <div
            v-if="wardrobeError"
            class="py-12 text-center"
          >
            <n-result
              size="small"
              status="error"
              :title="t('wardrobe.error.mode_title')"
              :description="t('wardrobe.error.mode_description')"
            >
              <template #footer>
                <n-button
                  type="primary"
                  @click="retryWardrobeMode"
                >
                  {{ t('common.retry') }}
                </n-button>
              </template>
            </n-result>
          </div>

          <div
            v-else-if="error"
            class="py-12 text-center"
          >
            <n-result
              size="small"
              status="error"
              :title="t('compendium.error_title')"
              :description="t('compendium.error_description')"
            >
              <template #footer>
                <n-button
                  type="primary"
                  @click="retryFetch"
                >
                  {{ $t('common.retry') }}
                </n-button>
              </template>
            </n-result>
          </div>

          <div
            v-else-if="!loading && entries.length === 0"
            class="py-12 text-center"
          >
            <n-result
              size="small"
              status="info"
              :title="t('common.no_results_found')"
              :description="t('compendium.no_results_description')"
            >
              <template #icon>
                <NuxtImg
                  :src="getImageSrc('emote', 'think')"
                  class="mx-auto h-24 w-24 object-cover sm:h-32 sm:w-32"
                  preset="iconLg"
                  fit="cover"
                  sizes="160px sm:200px"
                />
              </template>
            </n-result>
          </div>

          <n-collapse-transition
            v-else
            mode="out-in"
            appear
          >
            <div
              v-if="!error && entries.length > 0"
              :key="listingAnimationKey"
              class="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:content-start sm:gap-3"
            >
              <div
                v-for="(entry, index) in entries"
                :key="entry.id"
                class="relative cursor-pointer"
                :class="getListingCardAnimationClass(index)"
                :style="getListingCardAnimationStyle(index)"
                @click="handleMakeupCardClick(entry.id, $event)"
              >
                <div
                  class="relative aspect-2/3 overflow-hidden rounded-lg bg-[url('/images/bg.webp')] bg-cover bg-center shadow-md transition-shadow duration-300 hover:shadow-xl"
                  :style="
                    isMakeupBatchSelected(entry.id)
                      ? getQualityRingStyle(entry.quality)
                      : undefined
                  "
                >
                  <div
                    class="absolute inset-0"
                    :class="getListingQualityOverlayClass(entry.quality)"
                  ></div>
                  <NuxtImg
                    :src="entry.image"
                    :alt="entry.name"
                    class="absolute inset-0 z-10 h-full w-full object-cover transition-transform duration-500 ease-out hover:scale-110"
                    preset="tallLg"
                    fit="cover"
                    :loading="getListingImageLoading(index)"
                    :fetchpriority="getListingImageFetchPriority(index)"
                    sizes="200px"
                  />

                  <div class="absolute top-2 left-2 z-20">
                    <n-tag
                      v-if="!editMode"
                      round
                      size="small"
                      :bordered="false"
                      type="warning"
                      class="bg-black/50 text-gray-200 backdrop-blur-xs"
                    >
                      {{ entry.type }}
                    </n-tag>
                    <n-checkbox
                      v-else
                      :checked="isMakeupBatchSelected(entry.id)"
                      :theme-overrides="
                        getWardrobeSelectionCheckboxTheme(entry.quality)
                      "
                      :aria-label="t('common.select')"
                      @click.stop
                      @update:checked="
                        (checked) => updateMakeupSelection(entry.id, checked)
                      "
                    />
                  </div>
                  <div class="absolute top-2 right-2 z-20">
                    <n-tag
                      round
                      size="small"
                      :bordered="false"
                      :color="getQualityTagTheme(entry.quality)"
                      class="backdrop-blur-xs"
                    >
                      <span class="flex items-center gap-1">
                        {{ entry.quality }}
                        <n-icon>
                          <Star />
                        </n-icon>
                      </span>
                    </n-tag>
                  </div>
                  <div
                    v-if="
                      wardrobeInitialized &&
                      !editMode &&
                      entry.progress?.status === 'owned'
                    "
                    class="absolute right-2 bottom-2 z-30"
                    @click.stop
                  >
                    <WardrobeStatusBadge
                      status="item-owned"
                      :quality="entry.quality"
                    />
                  </div>
                  <div
                    v-else-if="
                      wardrobeInitialized && !editMode && entry.progress
                    "
                    class="absolute right-2 bottom-2 z-30"
                    @click.stop
                  >
                    <WardrobeStatusBadge
                      :status="entry.progress.status"
                      :owned="entry.progress.owned"
                      :total="entry.progress.total"
                      :quality="entry.quality"
                    />
                  </div>
                  <div
                    v-else-if="wardrobeInitialized && editMode"
                    class="absolute right-2 bottom-2 z-30"
                    @click.stop
                  >
                    <WardrobeOwnedButton
                      :owned="entry.progress?.status === 'owned'"
                      :disabled="
                        !isWardrobeReady || entry.trackedMakeupIds.length === 0
                      "
                      :loading="isMakeupToggleLoading(entry.id)"
                      :quality="entry.quality"
                      variant="overlay"
                      @toggle="toggleVisibleMakeupOwned(entry.id)"
                    />
                  </div>
                  <div
                    class="absolute right-0 bottom-0 left-0 z-20 bg-linear-to-t from-black/90 to-transparent p-3"
                    :class="
                      wardrobeInitialized
                        ? editMode
                          ? 'pr-12'
                          : entry.progress
                            ? 'pr-10 sm:pr-12'
                            : ''
                        : ''
                    "
                  >
                    <p
                      class="line-clamp-2 text-xs font-semibold text-white sm:text-sm"
                    >
                      {{ entry.name }}
                    </p>
                    <div class="mt-1 flex flex-wrap gap-1">
                      <n-tag
                        v-if="entry.styleLabel"
                        size="tiny"
                        :bordered="false"
                        type="default"
                        :color="getStyleTagTheme(entry.styleKey)"
                        class="text-xs font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
                      >
                        {{ entry.styleLabel }}
                      </n-tag>
                    </div>
                    <div class="mt-1 flex flex-wrap gap-0.5">
                      <n-tag
                        v-for="label in entry.labelTags"
                        :key="label.text"
                        size="tiny"
                        type="default"
                        :color="label.theme"
                        round
                        class="text-xs font-semibold"
                      >
                        {{ label.text }}
                      </n-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-else-if="loading"
              key="loading"
              class="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:content-start sm:gap-3"
            >
              <div
                v-for="(i, index) in pageSize"
                :key="`skeleton-${i}`"
                class="relative aspect-3/4 animate-pulse overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700"
                :style="getListingCardAnimationStyle(index)"
              ></div>
            </div>
          </n-collapse-transition>

          <div class="flex items-center justify-center sm:pr-2">
            <n-pagination
              v-model:page="currentPage"
              :page-size="pageSize"
              :item-count="totalItems"
              :show-size-picker="false"
              :disabled="loading || !!error"
              :page-slot="5"
            >
              <template #prefix="{ itemCount }">
                <div
                  class="inline-flex items-baseline gap-1 text-sm text-gray-600 dark:text-gray-400"
                >
                  <span class="font-semibold text-gray-900 dark:text-white">{{
                    totalItems
                  }}</span>
                  <span>
                    {{
                      itemCount === 1 ? t('common.makeup') : t('common.makeups')
                    }}
                  </span>
                </div>
              </template>
            </n-pagination>
          </div>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import {
    Star,
    BookOpen,
    UserEdit,
    Tshirt,
    ListAlt,
    PaintBrush,
    Paw,
    SortAmountDown,
    CheckCircle,
    Adjust,
    TimesCircle,
    DotCircle,
  } from '@vicons/fa'
  import { NIcon } from 'naive-ui'
  import type { SelectOption } from 'naive-ui'

  definePageMeta({
    key: 'makeups-listing',
  })

  const { t, locale, getLocaleMessage } = useI18n()
  const dialog = useDialog()
  const message = useMessage()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()
  const { getImageSrc } = imageProvider()

  type MakeupSlot = (typeof makeupItemTypes)[number]
  type MakeupListingPrimaryFilter =
    | 'type'
    | 'quality'
    | 'version'
    | 'style'
    | 'source'
    | null
  type BuildListingQueryOptions = {
    primaryFilter?: MakeupListingPrimaryFilter
  }
  type BuildCrossCompendiumQueryOptions = {
    includePage?: boolean
  }
  type CompendiumSection = 'outfits' | 'items' | 'momo' | 'makeups'
  type IconSelectOption = SelectOption & { icon: Component }
  type MakeupWardrobeFilter = 'all' | 'owned' | 'partial' | 'missing'

  const pageSize = 18
  const routeListSlug = computed(() =>
    getSeoListRouteSlug(route.path, 'makeups')
  )
  const routeMakeupType = computed(() =>
    resolveSeoMakeupTypeFromSlug(routeListSlug.value)
  )
  const routeSeoFilter = computed(() =>
    getSeoListRouteFilter(route.path, 'makeups')
  )
  const routeQualityFilter = computed(() =>
    routeSeoFilter.value?.kind === 'quality'
      ? Number(routeSeoFilter.value.value)
      : null
  )
  const routeVersionFilter = computed(() =>
    routeSeoFilter.value?.kind === 'version'
      ? String(routeSeoFilter.value.value)
      : null
  )
  const routeStyleFilter = computed(() =>
    routeSeoFilter.value?.kind === 'style'
      ? String(routeSeoFilter.value.value)
      : null
  )
  const routeSourceFilter = computed(() =>
    routeSeoFilter.value?.kind === 'source'
      ? String(routeSeoFilter.value.value)
      : null
  )

  const resolveSlot = (value?: string | null): MakeupSlot | null => {
    if (!value || value === 'all') return null
    if ((makeupItemTypes as readonly string[]).includes(value)) {
      return value as MakeupSlot
    }
    const seoType = resolveSeoMakeupTypeFromSlug(value)
    return seoType && (makeupItemTypes as readonly string[]).includes(seoType)
      ? (seoType as MakeupSlot)
      : null
  }

  const messages = computed(
    () => getLocaleMessage(locale.value) as Record<string, string>
  )
  const availableVersions = computed(() =>
    getExactVersionsFromLocaleMessages(messages.value)
  )
  const availableVersionFilters = computed(() =>
    getVersionFilters(availableVersions.value)
  )
  const availableObtains = computed(() =>
    Object.keys(messages.value)
      .filter((key) => key.startsWith('obtain.') && key.endsWith('.name'))
      .map((key) => Number(key.split('.')[1]))
      .filter((value) => !Number.isNaN(value))
  )
  const obtainOptions = computed(() =>
    createObtainFilterOptions(availableObtains.value, t, {
      includeGroup: isObtainGroupVisibleInMakeups,
      fallbackLabel: (id) => `Obtain ${id}`,
    })
  )
  const availableObtainValues = computed(() =>
    obtainOptions.value.map((option) => option.value as string)
  )

  const availableStyles = STYLE_DEFINITIONS.map((style) => style.key)
  const resolveStyle = (value?: string | null) => {
    if (!value) return null
    const normalized = normalizeTraitKey(value)
    if (normalized === 'all') return null
    return availableStyles.includes(normalized) ? normalized : null
  }
  const resolveVersion = (value?: string | null) =>
    resolveVersionFilter(value, availableVersionFilters.value)
  const resolveObtain = (value?: string | null) =>
    resolveObtainFilterValue(value, availableObtainValues.value)
  const resolveQuality = (value?: string | number | null) => {
    if (value === null || value === undefined || value === '') return null
    const parsed =
      typeof value === 'number' && Number.isFinite(value)
        ? value
        : Number(value)
    return resolveSeoMakeupQualitySlug(parsed) !== null ? parsed : null
  }
  type CatalogVariationFilter =
    | 'base'
    | 'all'
    | 'glowup'
    | 'evo1'
    | 'evo2'
    | 'evo3'
    | 'all-evos'

  const variationFilterValues = new Set<CatalogVariationFilter>([
    'base',
    'all',
    'evo3',
  ])
  const variationFilterOptions: CatalogVariationFilter[] = [
    'base',
    'all',
    'evo3',
  ]
  const resolveVariationFilter = (
    value?: string | null
  ): CatalogVariationFilter => {
    if (value === 'show' || value === 'true' || value === '1') return 'all'
    return variationFilterValues.has(value as CatalogVariationFilter)
      ? (value as CatalogVariationFilter)
      : 'base'
  }
  const supportsPartialWardrobeFilter = (slot?: MakeupSlot | null) =>
    slot === null || slot === undefined || slot === 'fullMakeup'

  const resolveWardrobeFilter = (
    value?: string | null,
    slot?: MakeupSlot | null
  ): MakeupWardrobeFilter => {
    if (value === 'partial') {
      return supportsPartialWardrobeFilter(slot) ? 'partial' : 'all'
    }
    if (value === 'owned' || value === 'missing') {
      return value
    }
    return 'all'
  }

  const resolveRouteSlotFilter = () =>
    routeMakeupType.value ?? resolveSlot(route.query.type?.toString() ?? null)
  const resolveRouteQualityFilter = () =>
    routeQualityFilter.value ??
    resolveQuality(route.query.quality?.toString() ?? null)
  const resolveRouteVersionFilter = () =>
    resolveVersion(routeVersionFilter.value ?? route.query.version?.toString())
  const resolveRouteStyleFilter = () =>
    resolveStyle(routeStyleFilter.value ?? route.query.style?.toString())
  const resolveRouteSourceFilter = () =>
    routeSourceFilter.value ??
    resolveObtain(
      (route.query.source ?? route.query.obtain)?.toString() ?? null
    )

  const initialSlotFilter = resolveRouteSlotFilter()
  const slotFilter = ref<MakeupSlot | null>(initialSlotFilter)
  const qualityFilter = ref<number | null>(resolveRouteQualityFilter())
  const versionFilter = ref<string | null>(resolveRouteVersionFilter())
  const styleFilter = ref<string | null>(resolveRouteStyleFilter())
  const obtainFilter = ref<string | null>(resolveRouteSourceFilter())
  const variationFilter = ref<CatalogVariationFilter>(
    resolveVariationFilter(route.query.variations?.toString() ?? null)
  )
  const makeupKindFilter = ref(
    resolveCatalogMakeupKindFilter(route.query.kind?.toString() ?? null)
  )
  const wardrobeFilter = ref<MakeupWardrobeFilter>(
    resolveWardrobeFilter(
      route.query.wardrobe?.toString() ?? null,
      initialSlotFilter
    )
  )
  const currentPage = ref(Number(route.query.page) || 1)
  type BatchScope = 'selected' | 'page' | 'all'
  const editMode = ref(false)
  const batchScope = ref<BatchScope>('selected')
  const selectedMakeupIds = ref<Set<number>>(new Set())
  const togglingMakeupIds = ref<Set<number>>(new Set())
  const {
    initialized: wardrobeInitialized,
    ownedMakeupIds,
    error: storageError,
    canMutate: isWardrobeReady,
    mutationVersion: wardrobeMutationVersion,
    init: initWardrobe,
    retry: retryWardrobeStorage,
    isMakeupOwned,
    getFullMakeupProgress,
    markMakeupsOwned,
    toggleMakeupOwned,
  } = useWardrobe()
  const { activeRegionScope } = useWardrobeSettings()
  const wardrobeModeError = ref<Error | null>(null)
  const wardrobeError = computed(() =>
    wardrobeFilter.value !== 'all'
      ? (storageError.value ?? wardrobeModeError.value)
      : null
  )

  const activeSlotLabel = computed(() =>
    slotFilter.value ? t(`type.${slotFilter.value}`) : t('common.makeups')
  )
  const pageTitle = computed(() => {
    if (slotFilter.value) {
      return `${activeSlotLabel.value} - ${t('navigation.makeup')} - ${t('meta.game_title')} - ${t('navigation.title')}`
    }

    return `${t('navigation.makeup')} - ${t('meta.game_title')} - ${t('navigation.title')}`
  })
  const description = computed(() =>
    slotFilter.value
      ? `${activeSlotLabel.value} - ${t('meta.description.makeups')}`
      : t('meta.description.makeups')
  )

  useSeoMeta({
    title: () => pageTitle.value,
    description: () => description.value,
    ogTitle: () => pageTitle.value,
    ogDescription: () => description.value,
    twitterTitle: () => pageTitle.value,
    twitterDescription: () => description.value,
  })

  const hasFilters = computed(
    () =>
      slotFilter.value !== null ||
      qualityFilter.value !== null ||
      versionFilter.value !== null ||
      styleFilter.value !== null ||
      obtainFilter.value !== null ||
      makeupKindFilter.value !== 'all' ||
      variationFilter.value !== 'base' ||
      wardrobeFilter.value !== 'all'
  )

  const cacheKey = computed(
    () =>
      `makeups-${slotFilter.value}-${qualityFilter.value ?? 'all'}-${
        styleFilter.value ?? 'all'
      }-${versionFilter.value ?? 'all'}-${obtainFilter.value ?? 'all'}-${
        makeupKindFilter.value
      }-${variationFilter.value}-${wardrobeFilter.value}-${activeRegionScope.value}-${getListingWardrobeCacheKey(
        wardrobeFilter.value,
        wardrobeMutationVersion.value
      )}-${currentPage.value}-${pageSize}`
  )
  const {
    data: compendiumData,
    pending: isListingPending,
    status: requestStatus,
    error,
    refresh: loadData,
    fetchMatchingIds: fetchMatchingMakeupIds,
  } = await useStaticCatalogListing<ItemListEntry>({
    key: () => cacheKey.value,
    query: () => ({
      entity: 'makeup',
      filters: {
        quality: qualityFilter.value,
        type: slotFilter.value,
        version: versionFilter.value,
        style: styleFilter.value,
        source: obtainFilter.value,
        kind: makeupKindFilter.value,
        variations: variationFilter.value,
      },
      page: currentPage.value,
      pageSize,
      ownershipMode: wardrobeFilter.value,
      regionScope: activeRegionScope.value,
    }),
    wardrobe: {
      initialized: wardrobeInitialized,
      storageError,
      ownedMakeupIds,
      init: initWardrobe,
      getFullMakeupProgress,
    },
    onError: (nextError) => {
      wardrobeModeError.value = nextError
    },
  })

  const entries = computed(() => {
    const data = (compendiumData.value?.data || []) as ItemListEntry[]
    const makeupItems =
      (
        compendiumData.value as {
          wardrobeMakeupItems?: Record<string, number[]>
        } | null
      )?.wardrobeMakeupItems ?? {}

    return data.map((entry) => {
      const isFullMakeup = entry.type === 'fullMakeup'
      const componentIds = makeupItems[entry.id] ?? []
      const trackedMakeupIds = isFullMakeup ? componentIds : [entry.id]
      const progress = isFullMakeup
        ? componentIds.length > 0
          ? getFullMakeupProgress(componentIds)
          : null
        : {
            status: isMakeupOwned(entry.id) ? 'owned' : 'missing',
            owned: isMakeupOwned(entry.id) ? 1 : 0,
            total: 1,
          }
      return {
        id: entry.id,
        quality: entry.quality,
        trackedMakeupIds,
        progress,
        name: isFullMakeup
          ? t(`makeup.${entry.id}.name`)
          : t(`item.${entry.id}.name`),
        image: isFullMakeup
          ? getImageSrc('fullMakeup', entry.id)
          : getImageSrc('item', entry.id),
        type: entry.type ? t(`type.${entry.type}`) : activeSlotLabel.value,
        styleLabel: entry.style ? t(entry.style) : null,
        styleKey: entry.style ? resolveStyleKeyFromI18nKey(entry.style) : null,
        labelTags: (entry.labels || []).map((label: string) => ({
          text: t(label),
          theme: getLabelTagTheme(label),
        })),
      }
    })
  })
  const loading = computed(() =>
    isListingInitialLoading({
      error: error.value,
      entryCount: entries.value.length,
      pending: isListingPending.value,
      status: requestStatus.value,
    })
  )
  const listingAnimationKey = computed(() => cacheKey.value)

  const totalItems = computed(() => compendiumData.value?.total || 0)
  const TIER_ENTRY_LIMIT = 200
  const isTierlistDisabled = computed(
    () =>
      editMode.value ||
      loading.value ||
      !!error.value ||
      totalItems.value > TIER_ENTRY_LIMIT
  )
  const selectionFilterKey = computed(() =>
    JSON.stringify({
      slot: slotFilter.value,
      quality: qualityFilter.value,
      version: versionFilter.value,
      style: styleFilter.value,
      obtain: obtainFilter.value,
      kind: makeupKindFilter.value,
      variations: variationFilter.value,
      wardrobe: wardrobeFilter.value,
    })
  )

  const currentListingPath = computed(() => {
    const typeSlug = resolveSeoMakeupTypeSlug(slotFilter.value)
    if (typeSlug) {
      return {
        path: `/makeups/${typeSlug}`,
        primaryFilter: 'type' as MakeupListingPrimaryFilter,
      }
    }

    const qualitySlug = resolveSeoMakeupQualitySlug(qualityFilter.value)
    if (qualitySlug) {
      return {
        path: `/makeups/quality/${qualitySlug}`,
        primaryFilter: 'quality' as MakeupListingPrimaryFilter,
      }
    }

    const versionSlug = resolveSeoVersionSlug(versionFilter.value)
    if (versionSlug) {
      return {
        path: `/makeups/version/${versionSlug}`,
        primaryFilter: 'version' as MakeupListingPrimaryFilter,
      }
    }

    const styleSlug = resolveSeoStyleSlug(styleFilter.value)
    if (styleSlug) {
      return {
        path: `/makeups/style/${styleSlug}`,
        primaryFilter: 'style' as MakeupListingPrimaryFilter,
      }
    }

    const sourceSlug = resolveSeoMakeupSourceSlug(obtainFilter.value)
    if (sourceSlug) {
      return {
        path: `/makeups/source/${sourceSlug}`,
        primaryFilter: 'source' as MakeupListingPrimaryFilter,
      }
    }

    return {
      path: '/makeups',
      primaryFilter: null,
    }
  })
  const compendiumSection = 'makeups' as const
  const compendiumSectionOptions = computed<IconSelectOption[]>(() => [
    { label: t('common.outfits'), value: 'outfits', icon: Tshirt },
    { label: t('common.items'), value: 'items', icon: ListAlt },
    { label: t('common.makeups'), value: 'makeups', icon: PaintBrush },
    { label: t('common.momo'), value: 'momo', icon: Paw },
  ])
  const renderIconSelectOptionLabel = (option: SelectOption) => {
    const { icon } = option as IconSelectOption
    return h('div', { class: 'flex items-center gap-2' }, [
      h(NIcon, { size: 16 }, { default: () => h(icon) }),
      h('span', null, String(option.label ?? '')),
    ])
  }
  const renderCompendiumSectionOptionLabel = renderIconSelectOptionLabel
  const hasFullMakeupInResult = computed(() =>
    supportsPartialWardrobeFilter(slotFilter.value)
  )
  const wardrobeFilterOptions = computed<IconSelectOption[]>(() => {
    const options: IconSelectOption[] = [
      { label: t('common.all'), value: 'all', icon: DotCircle },
      { label: t('wardrobe.status.owned'), value: 'owned', icon: CheckCircle },
    ]

    if (hasFullMakeupInResult.value) {
      options.push({
        label: t('wardrobe.filters.partial'),
        value: 'partial',
        icon: Adjust,
      })
    }

    options.push({
      label: t('wardrobe.status.missing'),
      value: 'missing',
      icon: TimesCircle,
    })

    return options
  })
  const renderWardrobeFilterOptionLabel = renderIconSelectOptionLabel

  const buildListingQuery = ({
    primaryFilter = null,
  }: BuildListingQueryOptions = {}) => ({
    ...(primaryFilter !== 'quality' &&
      qualityFilter.value && { quality: qualityFilter.value }),
    ...(primaryFilter !== 'type' &&
      slotFilter.value && {
        type: slotFilter.value,
      }),
    ...(primaryFilter !== 'version' &&
      versionFilter.value && { version: versionFilter.value }),
    ...(primaryFilter !== 'style' &&
      styleFilter.value && { style: styleFilter.value }),
    ...(primaryFilter !== 'source' &&
      obtainFilter.value && { source: obtainFilter.value }),
    ...(makeupKindFilter.value !== 'all' && { kind: makeupKindFilter.value }),
    ...(variationFilter.value !== 'base' && {
      variations: variationFilter.value,
    }),
    ...(wardrobeFilter.value !== 'all' && { wardrobe: wardrobeFilter.value }),
    ...(currentPage.value > 1 && { page: currentPage.value }),
  })

  const buildTierlistQuery = () => ({
    mode: 'makeups',
    ...(slotFilter.value && { type: slotFilter.value }),
    ...(qualityFilter.value !== null && { quality: qualityFilter.value }),
    ...(versionFilter.value && { version: versionFilter.value }),
    ...(styleFilter.value && { style: styleFilter.value }),
    ...(obtainFilter.value && { source: obtainFilter.value }),
  })
  const buildCrossCompendiumQuery = ({
    includePage = true,
  }: BuildCrossCompendiumQueryOptions = {}) => ({
    ...(qualityFilter.value !== null && { quality: qualityFilter.value }),
    ...(versionFilter.value && { version: versionFilter.value }),
    ...(styleFilter.value && { style: styleFilter.value }),
    ...(obtainFilter.value && { source: obtainFilter.value }),
    ...(variationFilter.value !== 'base' && {
      variations: variationFilter.value,
    }),
    ...(wardrobeFilter.value !== 'all' && { wardrobe: wardrobeFilter.value }),
    ...(includePage && currentPage.value > 1 && { page: currentPage.value }),
  })

  const goToTierlist = () => {
    if (isTierlistDisabled.value) return

    navigateTo(
      localePath({
        path: '/tierlist',
        query: buildTierlistQuery(),
      })
    )
  }

  const toggleEditMode = () => {
    editMode.value = !editMode.value
    if (!editMode.value) {
      clearSelection()
    }
  }

  const isMakeupBatchSelected = (makeupId: number) =>
    batchScope.value === 'selected'
      ? selectedMakeupIds.value.has(makeupId)
      : true

  const materializeVisibleMakeupSelection = () => {
    selectedMakeupIds.value = new Set(entries.value.map((entry) => entry.id))
    batchScope.value = 'selected'
  }

  const updateMakeupSelection = (makeupId: number, checked: boolean) => {
    if (batchScope.value !== 'selected') {
      materializeVisibleMakeupSelection()
    }

    const nextSelection = new Set(selectedMakeupIds.value)
    if (checked) {
      nextSelection.add(makeupId)
    } else {
      nextSelection.delete(makeupId)
    }
    selectedMakeupIds.value = nextSelection
  }

  const clearSelection = () => {
    selectedMakeupIds.value = new Set()
    batchScope.value = 'selected'
  }

  const getWardrobeSelectionCheckboxTheme = (quality: number) => {
    const color = getQualityColor(quality)
    return {
      color: `${color}22`,
      colorChecked: color,
      border: `1px solid ${color}AA`,
      borderChecked: `1px solid ${color}`,
      borderFocus: `1px solid ${color}`,
      boxShadowFocus: 'none',
      checkMarkColor: '#ffffff',
    }
  }

  const setMakeupToggleLoading = (makeupId: number, loading: boolean) => {
    const nextIds = new Set(togglingMakeupIds.value)
    if (loading) {
      nextIds.add(makeupId)
    } else {
      nextIds.delete(makeupId)
    }
    togglingMakeupIds.value = nextIds
  }

  const isMakeupToggleLoading = (makeupId: number) =>
    togglingMakeupIds.value.has(makeupId)

  const toggleVisibleMakeupOwned = async (makeupId: number) => {
    if (isMakeupToggleLoading(makeupId)) return

    const entry = entries.value.find((candidate) => candidate.id === makeupId)
    if (!entry || entry.trackedMakeupIds.length === 0) return

    setMakeupToggleLoading(makeupId, true)
    try {
      if (
        entry.trackedMakeupIds.length === 1 &&
        entry.trackedMakeupIds[0] === makeupId
      ) {
        await toggleMakeupOwned(makeupId)
      } else {
        await markMakeupsOwned(
          entry.trackedMakeupIds,
          entry.progress?.status !== 'owned'
        )
      }
    } catch {
      message.error(t('wardrobe.error.save'))
    } finally {
      setMakeupToggleLoading(makeupId, false)
    }
  }

  const isListingCardControlClick = (event: MouseEvent) => {
    const target = event.target
    return (
      target instanceof HTMLElement &&
      Boolean(target.closest('button, input, label, [role="button"]'))
    )
  }

  const handleMakeupCardClick = (makeupId: number, event: MouseEvent) => {
    if (isListingCardControlClick(event)) return

    if (editMode.value) {
      updateMakeupSelection(makeupId, !isMakeupBatchSelected(makeupId))
      return
    }

    navigateToDetail(makeupId)
  }

  const getVisibleMakeupRows = () =>
    Object.fromEntries(entries.value.map((entry) => [String(entry.id), entry]))

  const getTrackedMakeupIdsFromRows = (
    makeupIds: number[],
    makeupItems: Record<string, number[]>
  ) =>
    normalizeWardrobeItemIds(
      makeupIds.flatMap((makeupId) => {
        const visibleEntry = getVisibleMakeupRows()[String(makeupId)]
        if (visibleEntry) return visibleEntry.trackedMakeupIds

        const componentIds = makeupItems[String(makeupId)]
        return componentIds?.length ? componentIds : [makeupId]
      })
    )

  const getBatchMakeupIds = async () => {
    if (batchScope.value === 'selected') {
      return getTrackedMakeupIdsFromRows(
        Array.from(selectedMakeupIds.value),
        {}
      )
    }

    if (batchScope.value === 'page') {
      return normalizeWardrobeItemIds(
        entries.value.flatMap((entry) => entry.trackedMakeupIds)
      )
    }

    const idResponse = await fetchMatchingMakeupIds()
    return getTrackedMakeupIdsFromRows(
      idResponse.ids,
      idResponse.wardrobeMakeupItems ?? {}
    )
  }

  const confirmAllMatching = (owned: boolean, count: number) =>
    new Promise<boolean>((resolve) => {
      dialog.warning({
        title: t('common.confirm'),
        content: t(
          owned ? 'wardrobe.confirm.all_owned' : 'wardrobe.confirm.all_unowned',
          { count }
        ),
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false),
        onClose: () => resolve(false),
      })
    })

  const applyBatchOwnership = async (owned: boolean) => {
    try {
      const makeupIds = await getBatchMakeupIds()
      if (makeupIds.length === 0) return

      if (
        batchScope.value === 'all' &&
        !(await confirmAllMatching(owned, makeupIds.length))
      ) {
        return
      }

      await markMakeupsOwned(makeupIds, owned)
      if (batchScope.value === 'selected') {
        clearSelection()
      }
    } catch {
      message.error(t('wardrobe.error.save'))
    }
  }

  const handleCompendiumSectionChange = (value: string) => {
    const nextSection = value as CompendiumSection
    if (nextSection === 'makeups') return

    if (nextSection === 'momo') {
      navigateTo(
        localePath({
          path: '/momo',
          query: {
            ...(qualityFilter.value !== null && {
              quality: qualityFilter.value,
            }),
            ...(versionFilter.value && { version: versionFilter.value }),
            ...(obtainFilter.value && { source: obtainFilter.value }),
          },
        })
      )
      return
    }

    navigateTo(
      localePath({
        path: `/${nextSection}`,
        query: buildCrossCompendiumQuery({ includePage: false }),
      })
    )
  }

  const syncListingRoute = () => {
    const listingPath = currentListingPath.value
    router.replace({
      path: localePath(listingPath.path),
      query: buildListingQuery({
        primaryFilter: listingPath.primaryFilter,
      }),
    })
  }

  watch([routeMakeupType, () => route.query.type], () => {
    const nextSlot = resolveRouteSlotFilter()
    if (nextSlot !== slotFilter.value) {
      slotFilter.value = nextSlot
    }
  })
  watch([routeQualityFilter, () => route.query.quality], () => {
    const nextQuality = resolveRouteQualityFilter()
    if (nextQuality !== qualityFilter.value) {
      qualityFilter.value = nextQuality
    }
  })
  watch([routeVersionFilter, () => route.query.version], () => {
    const nextVersion = resolveRouteVersionFilter()
    if (nextVersion !== versionFilter.value) {
      versionFilter.value = nextVersion
    }
  })
  watch([routeStyleFilter, () => route.query.style], () => {
    const nextStyle = resolveRouteStyleFilter()
    if (nextStyle !== styleFilter.value) {
      styleFilter.value = nextStyle
    }
  })
  watch(
    [routeSourceFilter, () => route.query.source, () => route.query.obtain],
    () => {
      const nextSource = resolveRouteSourceFilter()
      if (nextSource !== obtainFilter.value) {
        obtainFilter.value = nextSource
      }
    }
  )

  watch(
    () => route.query.variations,
    () => {
      const nextVariations = resolveVariationFilter(
        route.query.variations?.toString() ?? null
      )
      if (nextVariations !== variationFilter.value) {
        variationFilter.value = nextVariations
      }
    }
  )
  watch(
    () => route.query.kind,
    () => {
      const nextKindFilter = resolveCatalogMakeupKindFilter(
        route.query.kind?.toString() ?? null
      )
      if (nextKindFilter !== makeupKindFilter.value) {
        makeupKindFilter.value = nextKindFilter
      }
    }
  )
  watch(
    () => route.query.wardrobe,
    () => {
      const nextWardrobeFilter = resolveWardrobeFilter(
        route.query.wardrobe?.toString() ?? null,
        slotFilter.value
      )
      if (nextWardrobeFilter !== wardrobeFilter.value) {
        wardrobeFilter.value = nextWardrobeFilter
      }
    }
  )

  watch(slotFilter, () => {
    if (
      wardrobeFilter.value === 'partial' &&
      !supportsPartialWardrobeFilter(slotFilter.value)
    ) {
      wardrobeFilter.value = 'all'
    }
  })
  watch([slotFilter, qualityFilter, versionFilter, styleFilter], () => {
    currentPage.value = 1
  })
  watch(obtainFilter, () => {
    currentPage.value = 1
  })
  watch(variationFilter, () => {
    currentPage.value = 1
  })
  watch(makeupKindFilter, () => {
    currentPage.value = 1
  })
  watch(wardrobeFilter, () => {
    currentPage.value = 1
  })
  watch(selectionFilterKey, () => {
    if (editMode.value) {
      clearSelection()
    }
  })
  watch(
    [
      slotFilter,
      qualityFilter,
      versionFilter,
      styleFilter,
      obtainFilter,
      makeupKindFilter,
      variationFilter,
      wardrobeFilter,
      currentPage,
    ],
    () => {
      syncListingRoute()
    }
  )

  onMounted(() => {
    syncListingRoute()
  })

  const retryFetch = () => {
    loadData()
  }

  const clearFilters = () => {
    slotFilter.value = null
    qualityFilter.value = null
    versionFilter.value = null
    styleFilter.value = null
    obtainFilter.value = null
    makeupKindFilter.value = 'all'
    variationFilter.value = 'base'
    wardrobeFilter.value = 'all'
    currentPage.value = 1
  }

  const retryWardrobeMode = () => {
    wardrobeModeError.value = null
    retryWardrobeStorage()
    loadData()
  }

  const slotOptions = computed<SelectOption[]>(() =>
    makeupItemTypes.map((type) => ({
      label: t(`type.${type}`),
      value: type,
    }))
  )

  const styleOptions = computed(() =>
    STYLE_DEFINITIONS.map((style) => ({
      label: t(style.i18nKey),
      value: style.key,
    }))
  )
  const makeupKindFilterOptions = computed<IconSelectOption[]>(() => [
    { label: t('common.all'), value: 'all', icon: DotCircle },
    {
      label: t('common.makeups'),
      value: 'full',
      icon: PaintBrush,
    },
    {
      label: t('compendium.makeup_kind_filter.individual'),
      value: 'individual',
      icon: UserEdit,
    },
  ])
  const versionOptions = computed<SelectOption[]>(() =>
    createVersionFilterOptions(availableVersions.value, (version) => {
      const key = `version.${version}`
      const translated = t(key)
      return translated !== key ? `${version} - ${translated}` : version
    })
  )
  const renderVersionOptionLabel = (option: SelectOption) => {
    const label = String(option.label ?? option.value ?? '')
    const isMajor = Boolean((option as { isMajor?: boolean }).isMajor)

    if (!isMajor) return label

    return h(
      'span',
      {
        style: {
          fontWeight: '700',
        },
      },
      label
    )
  }

  const navigateToDetail = (id: number) => {
    navigateTo(localePath(`/makeups/${id}`))
  }
</script>
