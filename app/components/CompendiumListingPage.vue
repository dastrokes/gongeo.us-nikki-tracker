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
            <slot name="filter-controls" />

            <div
              v-if="hasQualityFilter"
              class="hidden min-w-0 overflow-x-auto sm:block"
            >
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
                  :disabled="disabledQualities.includes(quality)"
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
              v-if="showClearFilters"
              size="small"
              class="hidden sm:inline-flex"
              @click="emit('clear-filters')"
            >
              {{ t('common.clear') }}
            </n-button>
          </div>

          <div class="flex shrink-0 items-center gap-2 self-start">
            <n-tooltip
              :disabled="totalCount <= COMPENDIUM_TIER_ENTRY_LIMIT"
              trigger="hover"
            >
              <template #trigger>
                <n-button
                  size="small"
                  type="primary"
                  :disabled="tierlistDisabled"
                  @click="emit('open-tierlist')"
                >
                  <template #icon>
                    <n-icon><SortAmountDown /></n-icon>
                  </template>
                  {{ t('navigation.tierlist') }}
                </n-button>
              </template>
              {{
                t('tierlist.over_limit.description', {
                  max: COMPENDIUM_TIER_ENTRY_LIMIT,
                })
              }}
            </n-tooltip>

            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button
                  size="small"
                  text
                  :type="isThumbnailView ? 'primary' : 'default'"
                  class="w-8"
                  :aria-label="viewModeLabel"
                  @click="toggleViewMode"
                >
                  <template #icon>
                    <n-icon>
                      <Th v-if="isThumbnailView" />
                      <ThLarge v-else />
                    </n-icon>
                  </template>
                </n-button>
              </template>
              {{ viewModeLabel }}
            </n-tooltip>

            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button
                  size="small"
                  text
                  :type="editMode ? 'primary' : 'default'"
                  :disabled="!wardrobeReady"
                  class="w-8"
                  :aria-label="
                    editMode
                      ? t('wardrobe.actions.view_mode')
                      : t('wardrobe.actions.edit_mode')
                  "
                  @click="emit('toggle-edit-mode')"
                >
                  <template #icon>
                    <n-icon>
                      <BookOpen v-if="editMode" />
                      <component
                        :is="editModeIcon"
                        v-else
                      />
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

        <div
          v-if="hasQualityFilter"
          class="flex items-start gap-2 sm:hidden"
        >
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
                :disabled="disabledQualities.includes(quality)"
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
              v-if="showClearFilters"
              size="small"
              @click="emit('clear-filters')"
            >
              {{ t('common.clear') }}
            </n-button>
          </div>
        </div>

        <div
          v-if="$slots['filter-row']"
          class="flex flex-col gap-2"
        >
          <slot name="filter-row" />
        </div>
      </div>
    </n-card>

    <WardrobeBatchToolbar
      v-if="editMode"
      v-model:scope="batchScope"
      :edit-mode="editMode"
      :selected-count="selectedCount"
      :page-count="entries.length"
      :all-matching-count="totalCount"
      :disabled="!wardrobeReady || loading"
      :mark-owned-menu-options="markOwnedMenuOptions"
      @mark-owned="emit('mark-owned')"
      @mark-unowned="emit('mark-unowned')"
      @mark-owned-menu-select="(key) => emit('mark-owned-menu-select', key)"
      @clear-selection="emit('clear-selection')"
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
                  @click="emit('retry-wardrobe-mode')"
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
                  @click="emit('retry')"
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
              :key="gridKey"
              :class="gridClass"
            >
              <template
                v-for="(entry, index) in entries"
                :key="entryKey(entry, index)"
              >
                <slot
                  name="entry"
                  :entry="entry"
                  :index="index"
                />
              </template>
            </div>
            <div
              v-else-if="loading"
              key="loading"
              :class="gridClass"
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
              v-model:page="page"
              :page-size="pageSize"
              :item-count="totalCount"
              :show-size-picker="false"
              :disabled="loading || !!error"
              :page-slot="5"
            >
              <template #prefix="{ itemCount }">
                <div
                  class="inline-flex items-baseline gap-1 text-sm text-gray-600 dark:text-gray-400"
                >
                  <span class="font-semibold text-gray-900 dark:text-white">
                    {{ totalCount }}
                  </span>
                  <span>
                    {{
                      itemCount === 1
                        ? entryCountLabels.singular
                        : entryCountLabels.plural
                    }}
                  </span>
                </div>
              </template>
            </n-pagination>
          </div>
        </div>
      </div>
    </n-card>

    <slot name="footer" />
  </div>
</template>

<script setup lang="ts">
  import { BookOpen, Edit, SortAmountDown, Star, Th, ThLarge } from '@vicons/fa'
  import type { DropdownOption } from 'naive-ui'
  import type { Component } from 'vue'

  type WardrobeBatchMenuOption = DropdownOption & { key: string }

  type EntryCountLabels = {
    singular: string
    plural: string
  }

  const props = withDefaults(
    defineProps<{
      entries: readonly unknown[]
      totalCount: number
      loading: boolean
      error: unknown
      wardrobeError: unknown
      gridKey: string | number
      entryCountLabels: EntryCountLabels
      editMode: boolean
      wardrobeReady: boolean
      tierlistDisabled: boolean
      selectedCount: number
      showClearFilters?: boolean
      qualityOptions?: number[]
      disabledQualities?: number[]
      editModeIcon?: Component
      entryKey?: (entry: unknown, index: number) => string | number
      markOwnedMenuOptions?: WardrobeBatchMenuOption[]
    }>(),
    {
      showClearFilters: false,
      qualityOptions: () => [5, 4, 3, 2],
      disabledQualities: () => [],
      editModeIcon: () => Edit,
      entryKey: undefined,
      markOwnedMenuOptions: () => [],
    }
  )

  const emit = defineEmits<{
    retry: []
    'retry-wardrobe-mode': []
    'toggle-edit-mode': []
    'open-tierlist': []
    'clear-filters': []
    'mark-owned': []
    'mark-owned-menu-select': [key: string]
    'mark-unowned': []
    'clear-selection': []
  }>()

  const page = defineModel<number>('page', { required: true })
  const batchScope = defineModel<'selected' | 'page' | 'all'>('batchScope', {
    required: true,
  })
  const qualityFilter = defineModel<number | null>('qualityFilter')

  const { t } = useI18n()
  const { getImageSrc } = imageProvider()
  const { isThumbnailView, toggleViewMode, gridClass, pageSize } =
    useCompendiumListingViewContext()

  const hasQualityFilter = computed(() => qualityFilter.value !== undefined)

  const viewModeLabel = computed(() =>
    isThumbnailView.value
      ? t('compendium.view_mode.standard')
      : t('compendium.view_mode.thumbnail')
  )

  const entryKey = (entry: unknown, index: number) => {
    if (props.entryKey) {
      return props.entryKey(entry, index)
    }

    if (entry && typeof entry === 'object' && 'id' in entry) {
      return (entry as { id: string | number }).id
    }

    return index
  }
</script>
