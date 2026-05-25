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
                  v-for="quality in qualityOptions"
                  :key="quality"
                  size="small"
                  v-bind="
                    getQualityButtonTheme(quality, qualityFilter === quality)
                  "
                  class="min-w-10"
                  :disabled="quality === 2"
                  @click="qualityFilter = quality"
                >
                  <span class="flex items-center gap-1">
                    {{ quality }}
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
                v-for="quality in qualityOptions"
                :key="quality"
                size="small"
                v-bind="
                  getQualityButtonTheme(quality, qualityFilter === quality)
                "
                class="min-w-10"
                :disabled="quality === 2"
                @click="qualityFilter = quality"
              >
                <span class="flex items-center gap-1">
                  {{ quality }}
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
      :selected-count="selectedMomoIds.size"
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
                  {{ t('common.retry') }}
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
                class="group relative block cursor-pointer"
                :class="getListingCardAnimationClass(index)"
                :style="getListingCardAnimationStyle(index)"
                @click="handleMomoCardClick(entry.id, $event)"
              >
                <div
                  class="relative aspect-2/3 overflow-hidden rounded-lg bg-[url('/images/momo_bg.webp')] bg-cover bg-center shadow-md transition-shadow duration-300 group-hover:shadow-xl"
                  :style="
                    isMomoBatchSelected(entry.id)
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
                    class="absolute inset-0 z-10 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    preset="tallLg"
                    fit="cover"
                    :loading="getListingImageLoading(index)"
                    :fetchpriority="getListingImageFetchPriority(index)"
                    sizes="200px"
                  />
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
                  <div class="absolute top-2 left-2 z-20">
                    <n-checkbox
                      v-if="editMode"
                      :checked="isMomoBatchSelected(entry.id)"
                      :theme-overrides="
                        getWardrobeSelectionCheckboxTheme(entry.quality)
                      "
                      :aria-label="t('common.select')"
                      @click.stop
                      @update:checked="
                        (checked) => updateMomoSelection(entry.id, checked)
                      "
                    />
                  </div>
                  <div
                    v-if="
                      wardrobeInitialized && !editMode && isMomoOwned(entry.id)
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
                    v-else-if="wardrobeInitialized && editMode"
                    class="absolute right-2 bottom-2 z-30"
                    @click.stop
                  >
                    <WardrobeOwnedButton
                      :owned="isMomoOwned(entry.id)"
                      :disabled="!isWardrobeReady"
                      :loading="isMomoToggleLoading(entry.id)"
                      :quality="entry.quality"
                      variant="overlay"
                      @toggle="toggleVisibleMomoOwned(entry.id)"
                    />
                  </div>
                  <div
                    class="absolute right-0 bottom-0 left-0 z-20 bg-linear-to-t from-black/90 to-transparent p-3"
                    :class="
                      wardrobeInitialized
                        ? editMode
                          ? 'pr-12'
                          : isMomoOwned(entry.id)
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
                  <span class="font-semibold text-gray-900 dark:text-white">
                    {{ totalItems }}
                  </span>
                  <span>
                    {{
                      itemCount === 1
                        ? t('common.momo_entry')
                        : t('common.momo')
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
    TimesCircle,
    DotCircle,
  } from '@vicons/fa'
  import { NIcon } from 'naive-ui'
  import type { SelectOption } from 'naive-ui'
  import { h, type Component } from 'vue'

  definePageMeta({
    key: 'momo-listing',
  })

  const { t, locale, getLocaleMessage } = useI18n()
  const dialog = useDialog()
  const message = useMessage()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()
  const { getImageSrc } = imageProvider()

  const routeSeoFilter = computed(() =>
    getSeoListRouteFilter(route.path, 'momo')
  )
  const routeSourceFilter = computed(() =>
    routeSeoFilter.value?.kind === 'source'
      ? String(routeSeoFilter.value.value)
      : null
  )
  const routeVersionFilter = computed(() =>
    routeSeoFilter.value?.kind === 'version'
      ? String(routeSeoFilter.value.value)
      : null
  )

  const pageSize = 18
  const qualityOptions = [5, 4, 3, 2] as const
  type MomoListingPrimaryFilter = 'version' | 'source' | null
  type MomoWardrobeFilter = 'all' | 'owned' | 'missing'
  type CompendiumSection = 'outfits' | 'items' | 'momo' | 'makeups'
  type IconSelectOption = SelectOption & { icon: Component }
  type BuildListingQueryOptions = {
    primaryFilter?: MomoListingPrimaryFilter
    includePage?: boolean
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

  const parsePage = (value: unknown) => {
    const rawValue = Array.isArray(value) ? value[0] : value
    const page = Number(rawValue)
    return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  }

  const parseQuality = (value: unknown) => {
    const rawValue = Array.isArray(value) ? value[0] : value
    const quality = Number(rawValue)
    return qualityOptions.includes(quality as (typeof qualityOptions)[number])
      ? quality
      : null
  }
  const resolveWardrobeFilter = (value?: string | null): MomoWardrobeFilter => {
    if (value === 'owned' || value === 'missing') return value
    return 'all'
  }

  const obtainOptions = computed(() => createMomoSourceFilterOptions(t))
  const availableObtainValues = computed(() =>
    obtainOptions.value.map((option) => option.value as string)
  )

  const resolveObtain = (value?: string | null) =>
    resolveMomoSourceFilterValue(value, availableObtainValues.value)
  const resolveVersion = (value?: string | null) =>
    resolveVersionFilter(value, availableVersionFilters.value)
  const resolveRouteVersionFilter = () =>
    resolveVersion(routeVersionFilter.value ?? route.query.version?.toString())
  const resolveRouteSourceFilter = () =>
    routeSourceFilter.value ??
    resolveObtain(
      (route.query.source ?? route.query.obtain)?.toString() ?? null
    )
  const resolveRouteQualityFilter = () => parseQuality(route.query.quality)

  const currentPage = ref(parsePage(route.query.page))
  const qualityFilter = ref<number | null>(resolveRouteQualityFilter())
  const versionFilter = ref<string | null>(resolveRouteVersionFilter())
  const obtainFilter = ref<string | null>(resolveRouteSourceFilter())
  const wardrobeFilter = ref<MomoWardrobeFilter>(
    resolveWardrobeFilter(route.query.wardrobe?.toString() ?? null)
  )
  type BatchScope = 'selected' | 'page' | 'all'
  const editMode = ref(false)
  const batchScope = ref<BatchScope>('selected')
  const selectedMomoIds = ref<Set<number>>(new Set())
  const togglingMomoIds = ref<Set<number>>(new Set())
  const {
    initialized: wardrobeInitialized,
    ownedMomoIds,
    error: storageError,
    canMutate: isWardrobeReady,
    mutationVersion: wardrobeMutationVersion,
    init: initWardrobe,
    retry: retryWardrobeStorage,
    isMomoOwned,
    toggleMomoOwned,
    markMomoOwned,
  } = useWardrobe()
  const wardrobeModeError = ref<Error | null>(null)
  const wardrobeError = computed(() =>
    wardrobeFilter.value !== 'all'
      ? (storageError.value ?? wardrobeModeError.value)
      : null
  )

  const pageTitle = computed(
    () =>
      `${t('common.momo')} - ${t('meta.game_title')} - ${t('navigation.title')}`
  )

  useSeoMeta({
    title: () => pageTitle.value,
    description: () => t('meta.description.momo'),
    ogTitle: () => pageTitle.value,
    ogDescription: () => t('meta.description.momo'),
    twitterTitle: () => pageTitle.value,
    twitterDescription: () => t('meta.description.momo'),
  })

  const hasFilters = computed(
    () =>
      qualityFilter.value !== null ||
      versionFilter.value !== null ||
      obtainFilter.value !== null ||
      wardrobeFilter.value !== 'all'
  )

  const cacheKey = computed(
    () =>
      `momo-${qualityFilter.value ?? 'all'}-${
        versionFilter.value ?? 'all'
      }-${obtainFilter.value ?? 'all'}-${wardrobeFilter.value}-${
        wardrobeMutationVersion.value
      }-${currentPage.value}-${pageSize}`
  )
  const {
    data,
    pending: isListingPending,
    status: requestStatus,
    error,
    refresh: loadData,
    fetchMatchingIds: fetchMatchingMomoIds,
  } = await useStaticCatalogListing<MomoListEntry>({
    key: () => cacheKey.value,
    query: () => ({
      entity: 'momo',
      filters: {
        quality: qualityFilter.value,
        version: versionFilter.value,
        source: obtainFilter.value,
      },
      page: currentPage.value,
      pageSize,
      ownershipMode: wardrobeFilter.value,
    }),
    wardrobe: {
      initialized: wardrobeInitialized,
      storageError,
      ownedMomoIds,
      init: initWardrobe,
    },
    onError: (nextError) => {
      wardrobeModeError.value = nextError
    },
  })

  const entries = computed(() => {
    const rows = (data.value?.data || []) as MomoListEntry[]
    return rows.map((entry) => ({
      id: entry.id,
      quality: entry.quality,
      name: t(`momo.${entry.id}.name`),
      image: getImageSrc('momo', entry.id),
      version: entry.version ?? null,
    }))
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

  const totalItems = computed(() => data.value?.total || 0)
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
      quality: qualityFilter.value,
      version: versionFilter.value,
      obtain: obtainFilter.value,
      wardrobe: wardrobeFilter.value,
    })
  )
  const compendiumSection = 'momo' as const
  const compendiumSectionOptions = computed<IconSelectOption[]>(() => [
    { label: t('common.outfits'), value: 'outfits', icon: Tshirt },
    { label: t('common.items'), value: 'items', icon: ListAlt },
    { label: t('common.makeups'), value: 'makeups', icon: PaintBrush },
    { label: t('common.momo'), value: 'momo', icon: Paw },
  ])
  const renderCompendiumSectionOptionLabel = (option: SelectOption) => {
    const { icon } = option as IconSelectOption
    return h('div', { class: 'flex items-center gap-2' }, [
      h(NIcon, { size: 16 }, { default: () => h(icon) }),
      h('span', null, String(option.label ?? '')),
    ])
  }
  const wardrobeFilterOptions = computed<IconSelectOption[]>(() => [
    { label: t('common.all'), value: 'all', icon: DotCircle },
    { label: t('wardrobe.status.owned'), value: 'owned', icon: CheckCircle },
    {
      label: t('wardrobe.status.missing'),
      value: 'missing',
      icon: TimesCircle,
    },
  ])
  const renderWardrobeFilterOptionLabel = (option: SelectOption) => {
    const { icon } = option as IconSelectOption
    return h('div', { class: 'flex items-center gap-2' }, [
      h(NIcon, { size: 16 }, { default: () => h(icon) }),
      h('span', null, String(option.label ?? '')),
    ])
  }
  const buildListingQuery = ({
    includePage = true,
    primaryFilter = null,
  }: BuildListingQueryOptions = {}) => ({
    ...(qualityFilter.value !== null && { quality: qualityFilter.value }),
    ...(primaryFilter !== 'version' &&
      versionFilter.value && { version: versionFilter.value }),
    ...(primaryFilter !== 'source' &&
      obtainFilter.value && { source: obtainFilter.value }),
    ...(wardrobeFilter.value !== 'all' && { wardrobe: wardrobeFilter.value }),
    ...(includePage && currentPage.value > 1 && { page: currentPage.value }),
  })
  const buildTierlistQuery = () => ({
    mode: 'momo',
    ...(qualityFilter.value !== null && { quality: qualityFilter.value }),
    ...(versionFilter.value && { version: versionFilter.value }),
    ...(obtainFilter.value && { source: obtainFilter.value }),
  })

  const buildListingLocation = () => {
    const versionSlug = resolveSeoVersionSlug(versionFilter.value)
    if (versionSlug) {
      return {
        path: `/momo/version/${versionSlug}`,
        primaryFilter: 'version' as const,
      }
    }

    const sourceSlug = resolveSeoMomoSourceSlug(obtainFilter.value)
    if (sourceSlug) {
      return {
        path: `/momo/source/${sourceSlug}`,
        primaryFilter: 'source' as const,
      }
    }

    return {
      path: '/momo',
      primaryFilter: null,
    }
  }

  const handleCompendiumSectionChange = (value: string) => {
    const nextSection = value as CompendiumSection
    if (nextSection === 'momo') return

    navigateTo(
      localePath({
        path: `/${nextSection}`,
        query: buildListingQuery({ includePage: false }),
      })
    )
  }

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

  const isMomoBatchSelected = (momoId: number) =>
    batchScope.value === 'selected' ? selectedMomoIds.value.has(momoId) : true

  const materializeVisibleMomoSelection = () => {
    selectedMomoIds.value = new Set(entries.value.map((entry) => entry.id))
    batchScope.value = 'selected'
  }

  const updateMomoSelection = (momoId: number, checked: boolean) => {
    if (batchScope.value !== 'selected') {
      materializeVisibleMomoSelection()
    }

    const nextSelection = new Set(selectedMomoIds.value)
    if (checked) {
      nextSelection.add(momoId)
    } else {
      nextSelection.delete(momoId)
    }
    selectedMomoIds.value = nextSelection
  }

  const clearSelection = () => {
    selectedMomoIds.value = new Set()
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

  const setMomoToggleLoading = (momoId: number, loading: boolean) => {
    const nextIds = new Set(togglingMomoIds.value)
    if (loading) {
      nextIds.add(momoId)
    } else {
      nextIds.delete(momoId)
    }
    togglingMomoIds.value = nextIds
  }

  const isMomoToggleLoading = (momoId: number) =>
    togglingMomoIds.value.has(momoId)

  const toggleVisibleMomoOwned = async (momoId: number) => {
    if (isMomoToggleLoading(momoId)) return

    setMomoToggleLoading(momoId, true)
    try {
      await toggleMomoOwned(momoId)
    } catch {
      message.error(t('wardrobe.error.save'))
    } finally {
      setMomoToggleLoading(momoId, false)
    }
  }

  const isListingCardControlClick = (event: MouseEvent) => {
    const target = event.target
    return (
      target instanceof HTMLElement &&
      Boolean(target.closest('button, input, label, [role="button"]'))
    )
  }

  const handleMomoCardClick = (momoId: number, event: MouseEvent) => {
    if (isListingCardControlClick(event)) return

    if (editMode.value) {
      updateMomoSelection(momoId, !isMomoBatchSelected(momoId))
      return
    }

    navigateTo(localePath(`/momo/${momoId}`))
  }

  const getBatchMomoIds = async () => {
    if (batchScope.value === 'selected') {
      return Array.from(selectedMomoIds.value)
    }

    if (batchScope.value === 'page') {
      return entries.value.map((entry) => entry.id)
    }

    const idResponse = await fetchMatchingMomoIds()
    return idResponse.ids
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
      const momoIds = await getBatchMomoIds()
      if (momoIds.length === 0) return

      if (
        batchScope.value === 'all' &&
        !(await confirmAllMatching(owned, momoIds.length))
      ) {
        return
      }

      await markMomoOwned(momoIds, owned)
      if (batchScope.value === 'selected') {
        clearSelection()
      }
    } catch {
      message.error(t('wardrobe.error.save'))
    }
  }

  const syncListingRoute = () => {
    const listingLocation = buildListingLocation()
    router.replace({
      path: localePath(listingLocation.path),
      query: buildListingQuery({
        primaryFilter: listingLocation.primaryFilter,
      }),
    })
  }

  watch(qualityFilter, () => {
    currentPage.value = 1
  })
  watch(versionFilter, () => {
    currentPage.value = 1
  })
  watch(obtainFilter, () => {
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
    () => route.query.quality,
    () => {
      const nextQuality = resolveRouteQualityFilter()
      if (nextQuality !== qualityFilter.value) {
        qualityFilter.value = nextQuality
      }
    }
  )
  watch([routeVersionFilter, () => route.query.version], () => {
    const nextVersion = resolveRouteVersionFilter()
    if (nextVersion !== versionFilter.value) {
      versionFilter.value = nextVersion
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
    () => route.query.wardrobe,
    () => {
      const nextWardrobeFilter = resolveWardrobeFilter(
        route.query.wardrobe?.toString() ?? null
      )
      if (nextWardrobeFilter !== wardrobeFilter.value) {
        wardrobeFilter.value = nextWardrobeFilter
      }
    }
  )
  watch(
    [qualityFilter, versionFilter, obtainFilter, wardrobeFilter, currentPage],
    () => {
      syncListingRoute()
    }
  )

  onMounted(() => {
    syncListingRoute()
    if (wardrobeFilter.value !== 'all') {
      loadData()
    }
  })

  const clearFilters = () => {
    qualityFilter.value = null
    versionFilter.value = null
    obtainFilter.value = null
    wardrobeFilter.value = 'all'
    currentPage.value = 1
  }

  const retryFetch = () => {
    loadData()
  }

  const retryWardrobeMode = () => {
    wardrobeModeError.value = null
    retryWardrobeStorage()
    loadData()
  }

  const getVersionFilterLabel = (version?: string | null) => {
    if (!version) return null
    const key = `version.${version}`
    const translated = t(key)
    return translated !== key ? `${version} - ${translated}` : version
  }

  const versionOptions = computed(() =>
    createVersionFilterOptions(
      availableVersions.value,
      (version) => getVersionFilterLabel(version) ?? version
    )
  )

  const renderVersionOptionLabel = (option: {
    label?: string | number
    value?: string | number
    isMajor?: boolean
  }) => {
    const label = String(option.label ?? option.value ?? '')
    if (!option.isMajor) return label

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
</script>
