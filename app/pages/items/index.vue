<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <!-- Filter Card -->
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

            <CatalogVariationToggle v-model:value="variationFilter" />

            <n-select
              v-model:value="pieceFilter"
              :options="pieceFilterOptions"
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
                      <Edit v-else />
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
            v-model:value="labelFilter"
            :options="labelOptions"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_label')"
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

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <n-select
            :value="typeFilter"
            :options="typeOptions"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_slot')"
            @update:value="updateTypeFilter"
          />

          <n-select
            v-model:value="categoryFilter"
            :options="categoryOptions"
            :fallback-option="getCategoryFallbackOption"
            :loading="isFacetOptionsRefreshing"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :disabled="!isCategoryFilterEnabled"
            :show-checkmark="false"
            :placeholder="t('compendium.filter_category')"
          />

          <n-select
            v-model:value="subcategoryFilter"
            :options="subcategoryOptions"
            :fallback-option="getSubcategoryFallbackOption"
            :loading="isFacetOptionsRefreshing"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :disabled="!isSubcategoryFilterEnabled"
            :show-checkmark="false"
            :placeholder="t('compendium.filter_subcategory')"
          />

          <n-button-group class="w-full">
            <n-button
              size="small"
              class="min-w-0 flex-1 justify-between"
              :disabled="!isAdvancedFiltersEnabled"
              data-advanced-filters-trigger
              @click="toggleAdvancedFiltersDrawer"
            >
              <span>{{ t('compendium.advanced_filters') }}</span>
              <span
                v-if="activeAdvancedFilterCount > 0"
                class="ml-1"
              >
                ({{ activeAdvancedFilterCount }})
              </span>
            </n-button>

            <n-tooltip
              v-if="activeAdvancedFilterCount > 0"
              trigger="hover"
            >
              <template #trigger>
                <n-button
                  size="small"
                  :disabled="!isAdvancedFiltersEnabled"
                  :aria-label="t('common.clear')"
                  @click="clearAdvancedFilters"
                >
                  <template #icon>
                    <n-icon>
                      <Times />
                    </n-icon>
                  </template>
                </n-button>
              </template>
              {{ t('common.clear') }}
            </n-tooltip>
          </n-button-group>
        </div>
      </div>
    </n-card>

    <WardrobeBatchToolbar
      v-if="editMode"
      v-model:scope="batchScope"
      :edit-mode="editMode"
      :selected-count="selectedItemIds.size"
      :page-count="entries.length"
      :all-matching-count="totalItems"
      :disabled="!isWardrobeReady || loading"
      @mark-owned="applyBatchOwnership(true)"
      @mark-unowned="applyBatchOwnership(false)"
      @clear-selection="clearSelection"
    />

    <!-- Grid Card -->
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
                @click="handleItemCardClick(entry.id, $event)"
              >
                <div
                  class="relative aspect-2/3 overflow-hidden rounded-lg bg-[url('/images/bg.webp')] bg-cover bg-center shadow-md transition-shadow duration-300 hover:shadow-xl"
                  :style="
                    isItemBatchSelected(entry.id)
                      ? getQualityRingStyle(entry.quality)
                      : undefined
                  "
                >
                  <!-- Tint overlay -->
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
                      v-if="entry.type && !editMode"
                      round
                      size="small"
                      :bordered="false"
                      type="warning"
                      class="bg-black/50 text-gray-200 backdrop-blur-xs"
                    >
                      {{ entry.type }}
                    </n-tag>
                    <n-checkbox
                      v-else-if="editMode"
                      :checked="isItemBatchSelected(entry.id)"
                      :theme-overrides="
                        getWardrobeSelectionCheckboxTheme(entry.quality)
                      "
                      :aria-label="t('common.select')"
                      @click.stop
                      @update:checked="
                        (checked) => updateItemSelection(entry.id, checked)
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
                      wardrobeInitialized && !editMode && isItemOwned(entry.id)
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
                      :owned="isItemOwned(entry.id)"
                      :disabled="!isWardrobeReady"
                      :loading="isItemToggleLoading(entry.id)"
                      :quality="entry.quality"
                      variant="overlay"
                      @toggle="toggleVisibleItemOwned(entry.id)"
                    />
                  </div>
                  <div
                    class="absolute right-0 bottom-0 left-0 z-20 bg-[url('/images/fade.png')] [background-size:100%_100%] bg-no-repeat"
                    :class="[
                      editMode ? 'p-2' : 'p-3',
                      wardrobeInitialized && editMode
                        ? 'pr-12'
                        : wardrobeInitialized &&
                            !editMode &&
                            isItemOwned(entry.id)
                          ? 'pr-10 sm:pr-12'
                          : '',
                    ]"
                  >
                    <p
                      class="line-clamp-2 text-xs font-semibold text-white sm:text-sm"
                    >
                      {{ entry.name }}
                    </p>
                    <div
                      v-if="!editMode && entry.styleLabel"
                      class="mt-1 hidden flex-wrap gap-1 sm:flex"
                    >
                      <n-tag
                        size="tiny"
                        :bordered="false"
                        type="default"
                        :color="getStyleTagTheme(entry.styleKey)"
                        class="text-xs font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
                      >
                        {{ entry.styleLabel }}
                      </n-tag>
                    </div>
                    <div
                      v-if="!editMode && entry.labelTags.length"
                      class="mt-1 hidden flex-wrap gap-0.5 sm:flex"
                    >
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
                      itemCount === 1
                        ? countLabels.singular
                        : countLabels.plural
                    }}
                  </span>
                </div>
              </template>
            </n-pagination>
          </div>
        </div>
      </div>
    </n-card>

    <AdvancedFiltersDrawer
      :show="isAdvancedFiltersDrawerOpen"
      :fields="advancedFilterFields"
      :filters="advancedFilters"
      :loading="isFacetOptionsRefreshing"
      :options="advancedFacetOptions"
      ignore-close-selector="[data-advanced-filters-trigger]"
      @update:show="isAdvancedFiltersDrawerOpen = $event"
      @update:filters="updateAdvancedFilters"
    />
  </div>
</template>

<script setup lang="ts">
  import {
    BookOpen,
    Edit,
    Star,
    Tshirt,
    ListAlt,
    PaintBrush,
    Paw,
    SortAmountDown,
    Times,
    CheckCircle,
    TimesCircle,
    DotCircle,
  } from '@vicons/fa'
  import { NIcon } from 'naive-ui'
  import type { SelectGroupOption, SelectOption } from 'naive-ui'

  definePageMeta({
    key: 'items-listing',
  })

  const { t, locale, getLocaleMessage } = useI18n()
  const dialog = useDialog()
  const message = useMessage()
  const { translateFilterToken } = useFilterToken()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()
  const { getImageSrc } = imageProvider()

  const routeListSlug = computed(() => getSeoListRouteSlug(route.path, 'items'))
  const routeItemType = computed(() =>
    resolveSeoItemTypeFromSlug(routeListSlug.value)
  )
  const routeSeoFilter = computed(() =>
    getSeoListRouteFilter(route.path, 'items')
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
  const routeLabelFilter = computed(() =>
    routeSeoFilter.value?.kind === 'tag'
      ? String(routeSeoFilter.value.value)
      : null
  )
  const routeSourceFilter = computed(() =>
    routeSeoFilter.value?.kind === 'source'
      ? String(routeSeoFilter.value.value)
      : null
  )

  const pageSize = 18
  const availableItemTypes = standardItemTypes
  type ItemListingPrimaryFilter =
    | 'type'
    | 'quality'
    | 'version'
    | 'style'
    | 'label'
    | 'source'
    | null
  type CompendiumSection = 'outfits' | 'items' | 'momo' | 'makeups'
  type IconSelectOption = SelectOption & { icon: Component }
  type BuildListingQueryOptions = {
    includeType?: boolean
    includeScopedFilters?: boolean
    includePiece?: boolean
    includePage?: boolean
    primaryFilter?: ItemListingPrimaryFilter
  }

  const resolveType = (value?: string | null) => {
    if (!value) return null
    if (value === 'all') return null
    if ((availableItemTypes as string[]).includes(value)) return value
    const seoType = resolveSeoItemTypeFromSlug(value)
    if (seoType && (availableItemTypes as string[]).includes(seoType)) {
      return seoType
    }
    return null
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
      .map((key) => {
        const parts = key.split('.')
        return Number(parts[1])
      })
      .filter((value) => !Number.isNaN(value))
  )

  const obtainOptions = computed(() => {
    const groupMap = new Map<string, { labelKey: string; ids: number[] }>()

    availableObtains.value.forEach((id) => {
      const groupKey = resolveObtainGroupKey(id)
      if (!groupKey) {
        return
      }
      const group = groupMap.get(groupKey)
      if (group) {
        group.ids.push(id)
      } else {
        const labelKey = resolveObtainGroupLabelKey(groupKey)
        if (!labelKey) {
          return
        }
        groupMap.set(groupKey, {
          labelKey,
          ids: [id],
        })
      }
    })

    return Array.from(groupMap.entries())
      .map(([groupKey, group]) => {
        const translated = t(group.labelKey)
        const fallback = group.labelKey.startsWith('obtain.')
          ? `Obtain ${group.ids[0]}`
          : group.labelKey
        const label = translated !== group.labelKey ? translated : fallback
        const enriched = group.ids.map((id) => ({
          id,
          version: getVersionFromId(id),
        }))
        const sortKey = getOldestVersion(
          enriched
            .map((entry) => entry.version)
            .filter((value): value is string => !!value)
        )
        return {
          label,
          value: groupKey,
          sortKey: sortKey ?? '',
        }
      })
      .sort((a, b) => {
        const versionComparison = compareOptionalVersionsAsc(
          a.sortKey,
          b.sortKey
        )
        if (versionComparison !== 0) return versionComparison
        return a.label.localeCompare(b.label)
      })
      .map(({ label, value }) => ({ label, value }))
  })

  const availableObtainValues = computed(() =>
    obtainOptions.value.map((option) => option.value as string)
  )

  const availableStyles = STYLE_DEFINITIONS.map((style) => style.key)
  const availableLabels = TAG_DEFINITIONS.map((tag) => tag.key)

  const resolveStyle = (value?: string | null) => {
    if (!value) return null
    const normalized = normalizeTraitKey(value)
    if (normalized === 'all') return null
    if (availableStyles.includes(normalized)) return normalized
    return null
  }

  const resolveLabel = (value?: string | null) => {
    if (!value) return null
    const normalized = normalizeTraitKey(value)
    if (normalized === 'all') return null
    if (availableLabels.includes(normalized)) return normalized
    return null
  }

  const resolveVersion = (value?: string | null) =>
    resolveVersionFilter(value, availableVersionFilters.value)

  const resolveObtain = (value?: string | null) => {
    if (!value) return null
    if (value === 'all') return null
    if (availableObtainValues.value.includes(value)) return value
    const ids = resolveObtainIdsFromValue(value)
    if (!ids) return null
    const groupKey = resolveObtainGroupKeyFromIds(ids)
    if (!groupKey) return null
    return availableObtainValues.value.includes(groupKey) ? groupKey : null
  }

  const resolveQuality = (value?: string | number | null) => {
    if (value === null || value === undefined || value === '') return null
    const parsed =
      typeof value === 'number' && Number.isFinite(value)
        ? value
        : Number(value)
    return resolveSeoItemQualitySlug(parsed) !== null ? parsed : null
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
    'glowup',
    'evo1',
    'evo2',
    'evo3',
    'all-evos',
  ])
  const resolveVariationFilter = (
    value?: string | null
  ): CatalogVariationFilter => {
    if (value === 'show' || value === 'true' || value === '1') return 'all'
    return variationFilterValues.has(value as CatalogVariationFilter)
      ? (value as CatalogVariationFilter)
      : 'base'
  }
  const resolveRouteQualityFilter = () =>
    routeQualityFilter.value ??
    resolveQuality(route.query.quality?.toString() ?? null)
  const qualityFilter = ref<number | null>(resolveRouteQualityFilter())
  const resolveRouteTypeFilter = () =>
    routeItemType.value ?? resolveType(route.query.type?.toString() ?? null)
  const resolveRouteVersionFilter = () =>
    resolveVersion(routeVersionFilter.value ?? route.query.version?.toString())
  const resolveRouteStyleFilter = () =>
    resolveStyle(routeStyleFilter.value ?? route.query.style?.toString())
  const resolveRouteLabelFilter = () =>
    resolveLabel(routeLabelFilter.value ?? route.query.label?.toString())
  const resolveRouteSourceFilter = () =>
    routeSourceFilter.value ??
    resolveObtain(
      (route.query.source ?? route.query.obtain)?.toString() ?? null
    )
  const initialTypeFilter = resolveRouteTypeFilter()
  const typeFilter = ref<string | null>(initialTypeFilter)

  const categoryFilter = ref<string | null>(
    initialTypeFilter
      ? normalizeItemSearchTokenKey(route.query.category?.toString() ?? null) ||
          null
      : null
  )
  const subcategoryFilter = ref<string | null>(
    initialTypeFilter
      ? normalizeItemSearchTokenKey(
          route.query.subcategory?.toString() ?? null
        ) || null
      : null
  )
  const versionFilter = ref<string | null>(resolveRouteVersionFilter())
  const styleFilter = ref<string | null>(resolveRouteStyleFilter())
  const labelFilter = ref<string | null>(resolveRouteLabelFilter())
  const obtainFilter = ref<string | null>(resolveRouteSourceFilter())
  const variationFilter = ref<CatalogVariationFilter>(
    resolveVariationFilter(route.query.variations?.toString() ?? null)
  )
  const pieceFilter = ref(
    resolveCatalogItemPieceFilter(route.query.piece?.toString() ?? null)
  )

  const activeTypeLabel = computed(() =>
    typeFilter.value ? t(`type.${typeFilter.value}`) : null
  )
  const getPieceFilterLabel = (piece?: string | null) => {
    if (piece === 'outfit') return t('compendium.item_piece_filter.outfit')
    if (piece === 'individual') {
      return t('compendium.item_piece_filter.individual')
    }
    return null
  }
  const getVersionFilterLabel = (version?: string | null) => {
    if (!version) return null
    const key = `version.${version}`
    const translated = t(key)
    return translated !== key ? `${version} - ${translated}` : version
  }
  const getQualityFilterLabel = (quality?: number | null) =>
    quality ? `${quality}★` : null
  const getSourceFilterLabel = (source?: string | null) => {
    if (!source) return null
    const labelKey = resolveObtainGroupLabelKey(source)
    if (!labelKey) return source
    const translated = t(labelKey)
    if (translated !== labelKey) return translated
    return labelKey.startsWith('obtain.') ? source : labelKey
  }
  const getStyleFilterLabel = (style?: string | null) => {
    if (!style) return null
    const definition = STYLE_BY_KEY.get(style)
    return definition ? t(definition.i18nKey) : null
  }
  const getTagFilterLabel = (tag?: string | null) => {
    if (!tag) return null
    const definition = TAG_BY_KEY.get(tag)
    return definition ? t(definition.i18nKey) : null
  }
  const activeListFilterLabel = computed(
    () =>
      activeTypeLabel.value ??
      getPieceFilterLabel(pieceFilter.value) ??
      getQualityFilterLabel(qualityFilter.value) ??
      getVersionFilterLabel(versionFilter.value) ??
      getStyleFilterLabel(styleFilter.value) ??
      getTagFilterLabel(labelFilter.value) ??
      getSourceFilterLabel(obtainFilter.value)
  )
  const pageTitle = computed(() => {
    const title = activeListFilterLabel.value
      ? `${t('navigation.item')} - ${activeListFilterLabel.value}`
      : t('navigation.item')
    return `${title} - ${t('meta.game_title')} - ${t('navigation.title')}`
  })
  const description = computed(() => {
    const baseDescription = t('meta.description.items')
    return activeListFilterLabel.value
      ? `${activeListFilterLabel.value} - ${baseDescription}`
      : baseDescription
  })

  useSeoMeta({
    title: () => pageTitle.value,
    description: () => description.value,
    ogTitle: () => pageTitle.value,
    ogDescription: () => description.value,
    twitterTitle: () => pageTitle.value,
    twitterDescription: () => description.value,
  })

  const advancedFilters = ref<ItemSearchAdvancedFilters>(
    normalizeItemSearchCompendiumAdvancedFilters(
      resolveItemSearchAdvancedFilters(
        route.query as Record<string, unknown>,
        typeFilter.value
      ),
      typeFilter.value
    )
  )
  const isAdvancedFiltersDrawerOpen = ref(false)
  const currentPage = ref(normalizeCatalogListingPage(route.query.page))
  type ItemWardrobeFilter = 'all' | 'owned' | 'missing'
  type BatchScope = 'selected' | 'page' | 'all'
  const resolveWardrobeFilter = (value?: string | null): ItemWardrobeFilter => {
    if (value === 'owned' || value === 'missing') return value
    return 'all'
  }
  const wardrobeFilter = ref<ItemWardrobeFilter>(
    resolveWardrobeFilter(route.query.wardrobe?.toString() ?? null)
  )
  const editMode = ref(false)
  const batchScope = ref<BatchScope>('selected')
  const selectedItemIds = ref<Set<number>>(new Set())
  const togglingItemIds = ref<Set<number>>(new Set())

  const {
    initialized: wardrobeInitialized,
    ownedItemIds,
    error: storageError,
    canMutate: isWardrobeReady,
    mutationVersion: wardrobeMutationVersion,
    init: initWardrobe,
    retry: retryWardrobeStorage,
    isItemOwned,
    toggleItemOwned,
    markItemsOwned,
  } = useWardrobe()
  const { activeRegionScope } = useWardrobeSettings()
  const wardrobeModeError = ref<Error | null>(null)
  const wardrobeError = computed(() =>
    wardrobeFilter.value !== 'all' || editMode.value
      ? (storageError.value ?? wardrobeModeError.value)
      : wardrobeModeError.value
  )

  const advancedFilterFields = computed(() =>
    getItemSearchCompendiumAdvancedFields(typeFilter.value)
  )
  const activeAdvancedFilters = computed(() =>
    getActiveItemSearchAdvancedFilters(advancedFilters.value, typeFilter.value)
  )
  const activeAdvancedFiltersKey = computed(() =>
    serializeItemSearchAdvancedFilters(advancedFilters.value, typeFilter.value)
  )
  const activeAdvancedFilterCount = computed(
    () =>
      advancedFilterFields.value.filter((field) =>
        hasActiveItemSearchAdvancedFilterValue(
          activeAdvancedFilters.value[field] ?? null
        )
      ).length
  )
  const supportsCategoryFilters = computed(() => !!typeFilter.value)
  const isCategoryFilterEnabled = computed(
    () => supportsCategoryFilters.value && categoryOptions.value.length > 0
  )
  const isSubcategoryFilterEnabled = computed(
    () =>
      supportsCategoryFilters.value &&
      !!categoryFilter.value &&
      subcategoryOptions.value.length > 0
  )
  const isAdvancedFiltersEnabled = computed(
    () => advancedFilterFields.value.length > 0
  )
  const hasActiveAdvancedFilters = computed(
    () => activeAdvancedFilterCount.value > 0
  )
  const shouldFetchFacets = computed(
    () =>
      Boolean(typeFilter.value) &&
      (!!typeFilter.value || isAdvancedFiltersEnabled.value)
  )
  const hasFilters = computed(
    () =>
      qualityFilter.value !== null ||
      typeFilter.value !== null ||
      categoryFilter.value !== null ||
      subcategoryFilter.value !== null ||
      versionFilter.value !== null ||
      styleFilter.value !== null ||
      labelFilter.value !== null ||
      obtainFilter.value !== null ||
      pieceFilter.value !== 'all' ||
      variationFilter.value !== 'base' ||
      wardrobeFilter.value !== 'all' ||
      activeAdvancedFilterCount.value > 0
  )
  const selectionFilterKey = computed(() =>
    JSON.stringify({
      quality: qualityFilter.value,
      type: typeFilter.value,
      category: categoryFilter.value,
      subcategory: subcategoryFilter.value,
      version: versionFilter.value,
      style: styleFilter.value,
      label: labelFilter.value,
      obtain: obtainFilter.value,
      piece: pieceFilter.value,
      variations: variationFilter.value,
      wardrobe: wardrobeFilter.value,
      advanced: activeAdvancedFiltersKey.value,
    })
  )

  const { fetchItemSearchFacets } = useSupabaseItems()

  type ItemFacetData = ItemSearchFacetResponse & {
    cacheKey: string
    resolved: boolean
  }

  const createEmptyFacetData = (cacheKey: string): ItemFacetData => ({
    categories: [],
    subcategories: [],
    advanced: {},
    cacheKey,
    resolved: true,
  })
  const createPendingFacetData = (cacheKey: string): ItemFacetData => ({
    ...createEmptyFacetData(cacheKey),
    resolved: false,
  })

  const facetCacheKey = computed(() =>
    shouldFetchFacets.value
      ? `item-facets-${qualityFilter.value ?? 'all'}-${typeFilter.value ?? 'all'}-${
          categoryFilter.value ?? 'all'
        }-${subcategoryFilter.value ?? 'all'}-${activeAdvancedFiltersKey.value || 'none'}-${
          styleFilter.value ?? 'all'
        }-${labelFilter.value ?? 'all'}-${
          versionFilter.value ?? 'all'
        }-${obtainFilter.value ?? 'all'}`
      : 'item-facets-disabled'
  )
  const cacheKey = computed(
    () =>
      `items-${qualityFilter.value ?? 'all'}-${typeFilter.value ?? 'all'}-${
        categoryFilter.value ?? 'all'
      }-${subcategoryFilter.value ?? 'all'}-${
        activeAdvancedFiltersKey.value || 'none'
      }-${
        styleFilter.value ?? 'all'
      }-${labelFilter.value ?? 'all'}-${versionFilter.value ?? 'all'}-${
        obtainFilter.value ?? 'all'
      }-${pieceFilter.value}-${variationFilter.value}-${
        wardrobeFilter.value
      }-${activeRegionScope.value}-${getListingWardrobeCacheKey(
        wardrobeFilter.value,
        wardrobeMutationVersion.value
      )}-${currentPage.value}-${pageSize}`
  )
  const buildItemFetchFilters = () => ({
    quality: qualityFilter.value,
    type: typeFilter.value,
    category: supportsCategoryFilters.value ? categoryFilter.value : null,
    subcategory: supportsCategoryFilters.value ? subcategoryFilter.value : null,
    version: versionFilter.value,
    style: styleFilter.value,
    label: labelFilter.value,
    source: obtainFilter.value,
    piece: pieceFilter.value,
    variations: variationFilter.value,
    ...activeAdvancedFilters.value,
  })

  const catalogListingQuery = computed(() => ({
    entity: 'item' as const,
    filters: buildItemFetchFilters(),
    page: currentPage.value,
    pageSize,
    ownershipMode: wardrobeFilter.value,
    regionScope: activeRegionScope.value,
  }))

  const [facetsAsyncData, itemsAsyncData] = await Promise.all([
    useAsyncData(
      'items-facets',
      async () => {
        const requestFacetCacheKey = facetCacheKey.value
        if (!shouldFetchFacets.value) {
          return createEmptyFacetData(requestFacetCacheKey)
        }

        const facets = await fetchItemSearchFacets({
          quality: qualityFilter.value,
          type: typeFilter.value,
          category: supportsCategoryFilters.value ? categoryFilter.value : null,
          subcategory: supportsCategoryFilters.value
            ? subcategoryFilter.value
            : null,
          version: versionFilter.value,
          style: styleFilter.value,
          label: labelFilter.value,
          source: obtainFilter.value,
          ...activeAdvancedFilters.value,
        })

        return {
          ...facets,
          cacheKey: requestFacetCacheKey,
          resolved: true,
        }
      },
      {
        default: () => createPendingFacetData(facetCacheKey.value),
        dedupe: 'cancel',
        deep: false,
        lazy: true,
        server: false,
        watch: [facetCacheKey],
      }
    ),
    useCatalogListing<ItemListEntry>({
      key: cacheKey,
      query: catalogListingQuery,
      wardrobe: {
        initialized: wardrobeInitialized,
        storageError,
        ownedItemIds,
        init: initWardrobe,
        isItemOwned,
      },
      onWardrobeModeError: (nextError) => {
        wardrobeModeError.value = nextError
      },
    }),
  ])

  const { data: itemSearchFacets } = facetsAsyncData
  const {
    data: compendiumData,
    pending: isListingPending,
    status: requestStatus,
    error,
    refresh: loadData,
    fetchMatchingIds: fetchMatchingItemIds,
  } = itemsAsyncData

  const entries = computed(() => {
    const data = (compendiumData.value?.data || []) as ItemListEntry[]

    return data.map((entry) => ({
      id: entry.id,
      quality: entry.quality,
      name: t(`item.${entry.id}.name`),
      image: getImageSrc('item', entry.id),
      type: entry.type ? t(`type.${entry.type}`) : null,
      styleLabel: entry.style ? t(entry.style) : null,
      styleKey: entry.style ? resolveStyleKeyFromI18nKey(entry.style) : null,
      labelTags: (entry.labels || []).map((label: string) => ({
        text: t(label),
        theme: getLabelTagTheme(label),
      })),
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

  const totalItems = computed(() => compendiumData.value?.total || 0)
  const wardrobeFilterOptions = computed<IconSelectOption[]>(() => [
    { label: t('common.all'), value: 'all', icon: DotCircle },
    { label: t('wardrobe.status.owned'), value: 'owned', icon: CheckCircle },
    {
      label: t('wardrobe.status.missing'),
      value: 'missing',
      icon: TimesCircle,
    },
  ])
  const renderIconSelectOptionLabel = (option: SelectOption) => {
    const { icon } = option as IconSelectOption
    return h('div', { class: 'flex items-center gap-2' }, [
      h(NIcon, { size: 16 }, { default: () => h(icon) }),
      h('span', null, String(option.label ?? '')),
    ])
  }
  const renderWardrobeFilterOptionLabel = renderIconSelectOptionLabel

  const countLabels = computed(() => ({
    singular: t('common.item'),
    plural: t('common.items'),
  }))
  const TIER_ENTRY_LIMIT = 200
  const isTierlistDisabled = computed(
    () =>
      editMode.value ||
      loading.value ||
      !!error.value ||
      totalItems.value > TIER_ENTRY_LIMIT
  )

  const buildAdvancedFilterQuery = () =>
    buildItemSearchAdvancedFilterQuery(
      advancedFilters.value,
      typeFilter.value,
      advancedFilterFields.value
    )

  const currentListingPath = computed(() => {
    const typeSlug = resolveSeoItemTypeSlug(typeFilter.value)
    if (typeSlug) {
      return {
        path: `/items/${typeSlug}`,
        primaryFilter: 'type' as ItemListingPrimaryFilter,
      }
    }

    const qualitySlug = resolveSeoItemQualitySlug(qualityFilter.value)
    if (qualitySlug) {
      return {
        path: `/items/quality/${qualitySlug}`,
        primaryFilter: 'quality' as ItemListingPrimaryFilter,
      }
    }

    const versionSlug = resolveSeoVersionSlug(versionFilter.value)
    if (versionSlug) {
      return {
        path: `/items/version/${versionSlug}`,
        primaryFilter: 'version' as ItemListingPrimaryFilter,
      }
    }

    const styleSlug = resolveSeoStyleSlug(styleFilter.value)
    if (styleSlug) {
      return {
        path: `/items/style/${styleSlug}`,
        primaryFilter: 'style' as ItemListingPrimaryFilter,
      }
    }

    const labelSlug = resolveSeoTagSlug(labelFilter.value)
    if (labelSlug) {
      return {
        path: `/items/tag/${labelSlug}`,
        primaryFilter: 'label' as ItemListingPrimaryFilter,
      }
    }

    const sourceSlug = resolveSeoItemSourceSlug(obtainFilter.value)
    if (sourceSlug) {
      return {
        path: `/items/source/${sourceSlug}`,
        primaryFilter: 'source' as ItemListingPrimaryFilter,
      }
    }

    return {
      path: '/items',
      primaryFilter: null,
    }
  })
  const compendiumSection = 'items' as const
  const compendiumSectionOptions = computed<IconSelectOption[]>(() => [
    { label: t('common.outfits'), value: 'outfits', icon: Tshirt },
    { label: t('common.items'), value: 'items', icon: ListAlt },
    { label: t('common.makeups'), value: 'makeups', icon: PaintBrush },
    { label: t('common.momo'), value: 'momo', icon: Paw },
  ])
  const renderCompendiumSectionOptionLabel = renderIconSelectOptionLabel

  const buildListingQuery = ({
    includeType = true,
    includeScopedFilters = includeType,
    includePiece = true,
    includePage = true,
    primaryFilter = null,
  }: BuildListingQueryOptions = {}) => ({
    ...(primaryFilter !== 'quality' &&
      qualityFilter.value && { quality: qualityFilter.value }),
    ...(primaryFilter !== 'type' &&
      includeType &&
      typeFilter.value && {
        type: typeFilter.value,
      }),
    ...(includeScopedFilters &&
      supportsCategoryFilters.value &&
      categoryFilter.value && {
        category: categoryFilter.value,
      }),
    ...(includeScopedFilters &&
      supportsCategoryFilters.value &&
      categoryFilter.value &&
      subcategoryFilter.value && {
        subcategory: subcategoryFilter.value,
      }),
    ...(primaryFilter !== 'version' &&
      versionFilter.value && { version: versionFilter.value }),
    ...(primaryFilter !== 'style' &&
      styleFilter.value && { style: styleFilter.value }),
    ...(primaryFilter !== 'label' &&
      labelFilter.value && { label: labelFilter.value }),
    ...(primaryFilter !== 'source' &&
      obtainFilter.value && { source: obtainFilter.value }),
    ...(includePiece &&
      pieceFilter.value !== 'all' && {
        piece: pieceFilter.value,
      }),
    ...(variationFilter.value !== 'base' && {
      variations: variationFilter.value,
    }),
    ...(includeScopedFilters && buildAdvancedFilterQuery()),
    ...(wardrobeFilter.value !== 'all' && { wardrobe: wardrobeFilter.value }),
    ...(includePage && currentPage.value > 1 && { page: currentPage.value }),
  })
  const buildTierlistQuery = () => ({
    mode: 'items',
    ...(qualityFilter.value !== null && { quality: qualityFilter.value }),
    ...(typeFilter.value && { type: typeFilter.value }),
    ...(supportsCategoryFilters.value &&
      categoryFilter.value && {
        category: categoryFilter.value,
      }),
    ...(supportsCategoryFilters.value &&
      categoryFilter.value &&
      subcategoryFilter.value && {
        subcategory: subcategoryFilter.value,
      }),
    ...(versionFilter.value && { version: versionFilter.value }),
    ...(styleFilter.value && { style: styleFilter.value }),
    ...(labelFilter.value && { label: labelFilter.value }),
    ...(obtainFilter.value && { source: obtainFilter.value }),
    ...(variationFilter.value !== 'base' && {
      variations: variationFilter.value,
    }),
    ...(wardrobeFilter.value !== 'all' && { wardrobe: wardrobeFilter.value }),
    ...buildAdvancedFilterQuery(),
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

  const isItemBatchSelected = (itemId: number) =>
    batchScope.value === 'selected' ? selectedItemIds.value.has(itemId) : true

  const materializeVisibleItemSelection = () => {
    selectedItemIds.value = new Set(entries.value.map((entry) => entry.id))
    batchScope.value = 'selected'
  }

  const updateItemSelection = (itemId: number, checked: boolean) => {
    if (batchScope.value !== 'selected') {
      materializeVisibleItemSelection()
    }

    const nextSelection = new Set(selectedItemIds.value)
    if (checked) {
      nextSelection.add(itemId)
    } else {
      nextSelection.delete(itemId)
    }
    selectedItemIds.value = nextSelection
  }

  const clearSelection = () => {
    selectedItemIds.value = new Set()
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

  const setItemToggleLoading = (itemId: number, loading: boolean) => {
    const nextIds = new Set(togglingItemIds.value)
    if (loading) {
      nextIds.add(itemId)
    } else {
      nextIds.delete(itemId)
    }
    togglingItemIds.value = nextIds
  }

  const isItemToggleLoading = (itemId: number) =>
    togglingItemIds.value.has(itemId)

  const toggleVisibleItemOwned = async (itemId: number) => {
    if (isItemToggleLoading(itemId)) return

    setItemToggleLoading(itemId, true)
    try {
      await toggleItemOwned(itemId)
    } catch {
      message.error(t('wardrobe.error.save'))
    } finally {
      setItemToggleLoading(itemId, false)
    }
  }

  const isListingCardControlClick = (event: MouseEvent) => {
    const target = event.target
    return (
      target instanceof HTMLElement &&
      Boolean(target.closest('button, input, label, [role="button"]'))
    )
  }

  const handleItemCardClick = (itemId: number, event: MouseEvent) => {
    if (isListingCardControlClick(event)) return

    if (editMode.value) {
      updateItemSelection(itemId, !isItemBatchSelected(itemId))
      return
    }

    navigateToDetail(itemId)
  }

  const getBatchItemIds = async () => {
    if (batchScope.value === 'selected') {
      return Array.from(selectedItemIds.value)
    }

    if (batchScope.value === 'page') {
      return entries.value.map((entry) => entry.id)
    }

    const idResponse = await fetchMatchingItemIds()
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
      const itemIds = await getBatchItemIds()
      if (itemIds.length === 0) return

      if (
        batchScope.value === 'all' &&
        !(await confirmAllMatching(owned, itemIds.length))
      ) {
        return
      }

      await markItemsOwned(itemIds, owned)
      if (batchScope.value === 'selected') {
        clearSelection()
      }
    } catch {
      message.error(t('wardrobe.error.save'))
    }
  }

  const handleCompendiumSectionChange = (value: string) => {
    const nextSection = value as CompendiumSection
    if (nextSection === 'items') return

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
        query: buildListingQuery({
          includeType: false,
          includeScopedFilters: false,
          includePiece: false,
          includePage: false,
        }),
      })
    )
  }

  const syncListingRoute = () => {
    const listingPath = currentListingPath.value
    router.replace({
      path: localePath(listingPath.path),
      query: buildListingQuery({
        includeType: false,
        includeScopedFilters: true,
        primaryFilter: listingPath.primaryFilter,
      }),
    })
  }

  const updateTypeFilter = (nextType: string | null) => {
    if (nextType === typeFilter.value) return

    categoryFilter.value = null
    subcategoryFilter.value = null
    advancedFilters.value = createEmptyItemSearchAdvancedFilters()
    isAdvancedFiltersDrawerOpen.value = false
    currentPage.value = 1
    typeFilter.value = nextType
  }

  watch(qualityFilter, () => {
    currentPage.value = 1
  })

  watch([routeItemType, () => route.query.type], () => {
    const nextType = resolveRouteTypeFilter()
    if (nextType !== typeFilter.value) {
      updateTypeFilter(nextType)
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

  watch([routeLabelFilter, () => route.query.label], () => {
    const nextLabel = resolveRouteLabelFilter()
    if (nextLabel !== labelFilter.value) {
      labelFilter.value = nextLabel
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
    () => route.query.piece,
    () => {
      const nextPieceFilter = resolveCatalogItemPieceFilter(
        route.query.piece?.toString() ?? null
      )
      if (nextPieceFilter !== pieceFilter.value) {
        pieceFilter.value = nextPieceFilter
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

  watch(supportsCategoryFilters, (isSupported) => {
    if (isSupported) return

    categoryFilter.value = null
    subcategoryFilter.value = null
  })

  watch(categoryFilter, () => {
    currentPage.value = 1
    subcategoryFilter.value = null
  })

  watch(subcategoryFilter, () => {
    currentPage.value = 1
  })

  watch(versionFilter, () => {
    currentPage.value = 1
  })

  watch(styleFilter, () => {
    currentPage.value = 1
  })

  watch(labelFilter, () => {
    currentPage.value = 1
  })

  watch(obtainFilter, () => {
    currentPage.value = 1
  })

  watch(variationFilter, () => {
    currentPage.value = 1
  })

  watch(pieceFilter, () => {
    currentPage.value = 1
  })

  watch(wardrobeFilter, () => {
    currentPage.value = 1
  })

  watch(activeAdvancedFiltersKey, () => {
    currentPage.value = 1
  })

  watch(selectionFilterKey, () => {
    if (editMode.value) {
      clearSelection()
    }
  })

  watch(
    [
      qualityFilter,
      typeFilter,
      categoryFilter,
      subcategoryFilter,
      versionFilter,
      styleFilter,
      labelFilter,
      obtainFilter,
      pieceFilter,
      variationFilter,
      wardrobeFilter,
      activeAdvancedFiltersKey,
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

  const retryWardrobeMode = () => {
    wardrobeModeError.value = null
    retryWardrobeStorage()
    loadData()
  }

  const toggleAdvancedFiltersDrawer = () => {
    if (!isAdvancedFiltersEnabled.value) return

    isAdvancedFiltersDrawerOpen.value = !isAdvancedFiltersDrawerOpen.value
  }

  const clearAdvancedFilters = () => {
    if (!hasActiveAdvancedFilters.value) return

    advancedFilters.value = createEmptyItemSearchAdvancedFilters()
  }

  const clearFilters = () => {
    qualityFilter.value = null
    updateTypeFilter(null)
    categoryFilter.value = null
    subcategoryFilter.value = null
    versionFilter.value = null
    styleFilter.value = null
    labelFilter.value = null
    obtainFilter.value = null
    pieceFilter.value = 'all'
    variationFilter.value = 'base'
    wardrobeFilter.value = 'all'
    advancedFilters.value = createEmptyItemSearchAdvancedFilters()
    isAdvancedFiltersDrawerOpen.value = false
    currentPage.value = 1
  }

  const availableTypes = computed(() => {
    const types = standardItemTypes.slice()
    return types.sort((a, b) => {
      const orderA = itemCategoryOrder[a] ?? 999
      const orderB = itemCategoryOrder[b] ?? 999
      return orderA - orderB
    })
  })

  const typeOptions = computed(() => {
    const types = availableTypes.value

    const grouped: Record<'clothes' | 'accessories' | 'other', ItemType[]> = {
      clothes: [],
      accessories: [],
      other: [],
    }

    types.forEach((type) => {
      const category = getItemTypeCategory(type)
      if (category === 'makeups') return
      grouped[category].push(type)
    })

    const options: Array<SelectOption | SelectGroupOption> = []

    if (grouped.clothes && grouped.clothes.length > 0) {
      options.push({
        type: 'group',
        label: t('tracker.items.category.clothes'),
        key: 'clothes',
        children: grouped.clothes.map((type) => ({
          label: t(`type.${type}`),
          value: type,
        })),
      })
    }

    if (grouped.accessories && grouped.accessories.length > 0) {
      options.push({
        type: 'group',
        label: t('tracker.items.category.accessories'),
        key: 'accessories',
        children: grouped.accessories.map((type) => ({
          label: t(`type.${type}`),
          value: type,
        })),
      })
    }

    if (grouped.other && grouped.other.length > 0) {
      options.push({
        type: 'group',
        label: t('common.other'),
        key: 'other',
        children: grouped.other.map((type) => ({
          label: t(`type.${type}`),
          value: type,
        })),
      })
    }

    return options
  })

  const isCurrentFacetDataReady = computed(
    () =>
      itemSearchFacets.value?.resolved === true &&
      itemSearchFacets.value.cacheKey === facetCacheKey.value
  )
  const isFacetOptionsRefreshing = computed(
    () => shouldFetchFacets.value && !isCurrentFacetDataReady.value
  )
  const lastReadyFacetData = shallowRef<ItemFacetData | null>(null)
  const lastReadyFacetType = ref<string | null>(null)

  watch(
    [itemSearchFacets, isCurrentFacetDataReady],
    ([nextFacets, isReady]) => {
      if (!isReady || !nextFacets) return
      lastReadyFacetData.value = nextFacets
      lastReadyFacetType.value = typeFilter.value
    },
    { immediate: true }
  )

  const currentAvailableCategories = computed(() =>
    isCurrentFacetDataReady.value
      ? (itemSearchFacets.value?.categories ?? [])
      : []
  )

  const currentAvailableSubcategories = computed(() =>
    isCurrentFacetDataReady.value
      ? (itemSearchFacets.value?.subcategories ?? [])
      : []
  )
  const currentAdvancedFacetOptions = computed<ItemSearchAdvancedFacetMap>(
    () =>
      isCurrentFacetDataReady.value
        ? (itemSearchFacets.value?.advanced ?? {})
        : {}
  )
  const displayFacetData = computed(() =>
    isCurrentFacetDataReady.value
      ? (itemSearchFacets.value ?? null)
      : lastReadyFacetType.value === typeFilter.value
        ? lastReadyFacetData.value
        : null
  )
  const availableCategories = computed(
    () => displayFacetData.value?.categories ?? []
  )
  const availableSubcategories = computed(
    () => displayFacetData.value?.subcategories ?? []
  )
  const advancedFacetOptions = computed<ItemSearchAdvancedFacetMap>(
    () => displayFacetData.value?.advanced ?? {}
  )

  watch(
    [currentAvailableCategories, isCurrentFacetDataReady],
    ([nextCategories, isReady]) => {
      if (!isReady) return
      if (!categoryFilter.value) return

      const resolved = resolveItemSearchFacetValue(
        categoryFilter.value,
        nextCategories
      )
      if (!resolved) {
        categoryFilter.value = null
        subcategoryFilter.value = null
        return
      }

      if (resolved !== categoryFilter.value) {
        categoryFilter.value = resolved
      }
    },
    { immediate: true }
  )

  watch(
    [currentAvailableSubcategories, isCurrentFacetDataReady],
    ([nextSubcategories, isReady]) => {
      if (!isReady) return
      if (!subcategoryFilter.value) return

      const resolved = resolveItemSearchFacetValue(
        subcategoryFilter.value,
        nextSubcategories
      )
      if (!resolved) {
        subcategoryFilter.value = null
        return
      }

      if (resolved !== subcategoryFilter.value) {
        subcategoryFilter.value = resolved
      }
    },
    { immediate: true }
  )

  const validateAdvancedFilters = () => {
    if (typeFilter.value && !isCurrentFacetDataReady.value) {
      return
    }

    const allowedFields = new Set(advancedFilterFields.value)
    const nextFilters = {
      ...createEmptyItemSearchAdvancedFilters(),
      ...advancedFilters.value,
    }
    let hasChanges = false

    ;(Object.keys(nextFilters) as ItemSearchAdvancedField[]).forEach(
      (field) => {
        const value = nextFilters[field]
        if (!hasActiveItemSearchAdvancedFilterValue(value ?? null)) return

        if (!allowedFields.has(field)) {
          nextFilters[field] = isItemSearchArrayField(field) ? [] : null
          hasChanges = true
          return
        }

        const resolved = getItemSearchAdvancedFacetValue(
          field,
          value,
          currentAdvancedFacetOptions.value
        )
        if (!hasActiveItemSearchAdvancedFilterValue(resolved)) {
          nextFilters[field] = isItemSearchArrayField(field) ? [] : null
          hasChanges = true
          return
        }

        if (JSON.stringify(resolved) !== JSON.stringify(value)) {
          nextFilters[field] = resolved
          hasChanges = true
        }
      }
    )

    if (hasChanges) {
      advancedFilters.value = nextFilters
    }
  }

  watch(
    [
      advancedFilterFields,
      () => JSON.stringify(currentAdvancedFacetOptions.value),
      isCurrentFacetDataReady,
    ],
    validateAdvancedFilters,
    { immediate: true }
  )

  const updateAdvancedFilters = (nextFilters: ItemSearchAdvancedFilters) => {
    advancedFilters.value = normalizeItemSearchCompendiumAdvancedFilters(
      {
        ...createEmptyItemSearchAdvancedFilters(),
        ...advancedFilters.value,
        ...nextFilters,
      },
      typeFilter.value
    )
  }

  const categoryOptions = computed<SelectOption[]>(() =>
    sortItemSearchFacetValues(availableCategories.value).map((value) => ({
      label:
        value === ITEM_SEARCH_UNCATEGORIZED_VALUE
          ? t('compendium.uncategorized')
          : translateFilterToken('category', value, typeFilter.value),
      value,
    }))
  )

  const subcategoryOptions = computed<SelectOption[]>(() =>
    sortItemSearchFacetValues(availableSubcategories.value).map((value) => ({
      label:
        value === ITEM_SEARCH_UNCATEGORIZED_VALUE
          ? t('compendium.uncategorized')
          : translateFilterToken('subcategory', value, typeFilter.value),
      value,
    }))
  )
  const getCategoryFallbackOption = (value: string | number) => {
    const normalizedValue = normalizeItemSearchTokenKey(String(value))
    return {
      label:
        normalizedValue === ITEM_SEARCH_UNCATEGORIZED_VALUE
          ? t('compendium.uncategorized')
          : translateFilterToken('category', normalizedValue, typeFilter.value),
      value,
    }
  }
  const getSubcategoryFallbackOption = (value: string | number) => {
    const normalizedValue = normalizeItemSearchTokenKey(String(value))
    return {
      label:
        normalizedValue === ITEM_SEARCH_UNCATEGORIZED_VALUE
          ? t('compendium.uncategorized')
          : translateFilterToken(
              'subcategory',
              normalizedValue,
              typeFilter.value
            ),
      value,
    }
  }

  const styleOptions = computed(() =>
    STYLE_DEFINITIONS.map((style) => ({
      label: t(style.i18nKey),
      value: style.key,
    }))
  )

  const pieceFilterOptions = computed<IconSelectOption[]>(() => [
    { label: t('common.all'), value: 'all', icon: DotCircle },
    {
      label: t('compendium.item_piece_filter.outfit'),
      value: 'outfit',
      icon: Tshirt,
    },
    {
      label: t('compendium.item_piece_filter.individual'),
      value: 'individual',
      icon: ListAlt,
    },
  ])

  const labelOptions = computed(() =>
    TAG_DEFINITIONS.map((tag) => ({
      label: t(tag.i18nKey),
      value: tag.key,
    }))
  )

  const versionOptions = computed<SelectOption[]>(() => {
    return createVersionFilterOptions(
      availableVersions.value,
      (version) => getVersionFilterLabel(version) ?? version
    )
  })
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
    navigateTo(localePath(`/items/${id}`))
  }
</script>
