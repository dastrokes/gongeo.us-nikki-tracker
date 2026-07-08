<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <div
      ref="listingExportRef"
      class="space-y-2 sm:space-y-4"
    >
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
        content-class="p-2 sm:p-4"
      >
        <div class="flex flex-col gap-2">
          <div
            class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
          >
            <div
              class="order-2 grid w-full min-w-0 grid-cols-2 gap-2 sm:order-1 sm:flex sm:w-auto sm:flex-wrap sm:items-center"
            >
              <slot name="filter-controls" />

              <n-button
                v-if="showClearFilters"
                size="small"
                class="w-full sm:w-auto"
                @click="emit('clear-filters')"
              >
                {{ t('common.clear') }}
              </n-button>
            </div>

            <div
              class="order-1 flex min-h-8 shrink-0 items-center justify-end gap-1 self-end sm:order-2 sm:self-start"
            >
              <div
                v-if="exporting"
                class="inline-flex h-8 items-center gap-2 rounded-lg px-2 text-sm leading-none font-medium text-gray-500 dark:text-gray-300"
              >
                <NuxtImg
                  src="images/logo.webp"
                  preset="iconSm"
                  fit="cover"
                  loading="lazy"
                  :alt="t('navigation.title')"
                  class="h-5 w-5 rounded"
                />
                <span>{{ t('navigation.title') }}</span>
              </div>

              <n-tooltip
                v-if="!exporting"
                :disabled="totalCount <= COMPENDIUM_TIER_ENTRY_LIMIT"
                trigger="hover"
              >
                <template #trigger>
                  <n-button
                    size="small"
                    type="primary"
                    :disabled="!preferencesReady || tierlistDisabled"
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

              <n-tooltip
                v-if="!exporting"
                trigger="hover"
              >
                <template #trigger>
                  <n-button
                    size="small"
                    text
                    class="w-8"
                    :disabled="editMode"
                    :aria-label="t('common.export_as_image')"
                    @click="exportListingPng"
                  >
                    <template #icon>
                      <n-icon :depth="3">
                        <FileImageRegular />
                      </n-icon>
                    </template>
                  </n-button>
                </template>
                {{ t('common.export_as_image') }}
              </n-tooltip>

              <n-popover
                v-if="!exporting"
                trigger="click"
                placement="bottom-end"
              >
                <template #trigger>
                  <n-button
                    size="small"
                    text
                    circle
                    :aria-label="t('compendium.listing_settings')"
                  >
                    <template #icon>
                      <n-icon :depth="3">
                        <Cog />
                      </n-icon>
                    </template>
                  </n-button>
                </template>
                <div class="min-w-50">
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <n-switch
                        :value="isThumbnailView"
                        @update:value="setThumbnailView"
                      />
                      <span class="ml-3 text-sm text-gray-400">
                        {{ t('compendium.settings.thumbnail_view') }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <n-switch
                        :value="!compactPageSize"
                        @update:value="setExpandedPageSize"
                      />
                      <span class="ml-3 text-sm text-gray-400">
                        {{ t('compendium.settings.compact_page_size') }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <n-switch
                        :value="hideOwnershipStatus"
                        @update:value="setHideOwnershipStatus"
                      />
                      <span class="ml-3 text-sm text-gray-400">
                        {{ t('compendium.settings.hide_ownership_status') }}
                      </span>
                    </div>
                  </div>
                </div>
              </n-popover>

              <n-tooltip
                v-if="!exporting"
                trigger="hover"
              >
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
                      <n-icon :depth="3">
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
              v-else-if="!preferencesReady"
              class="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3"
            >
              <div
                v-for="index in 12"
                :key="`preferences-placeholder-${index}`"
                class="relative aspect-2/3 animate-pulse overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700"
                :style="getListingCardAnimationStyle(index - 1)"
              ></div>
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

            <template v-else>
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
                  class="relative aspect-2/3 animate-pulse overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700"
                  :style="getListingCardAnimationStyle(index)"
                ></div>
              </div>
            </template>

            <div class="flex items-center justify-center sm:pr-2">
              <n-skeleton
                v-if="!preferencesReady || loading"
                width="min(100%, 28rem)"
                :height="28"
                round
              />
              <n-pagination
                v-else
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
    </div>

    <slot name="footer" />
  </div>
</template>

<script setup lang="ts">
  import {
    BookOpen,
    Cog,
    FileImageRegular,
    SortAmountDown,
    UserEdit,
  } from '@vicons/fa'
  import type { DropdownOption } from 'naive-ui'

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
      entryKey?: (entry: unknown, index: number) => string | number
      markOwnedMenuOptions?: WardrobeBatchMenuOption[]
    }>(),
    {
      showClearFilters: false,
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
  const message = useMessage()
  const { t } = useI18n()
  const { getImageSrc } = imageProvider()
  const {
    isThumbnailView,
    compactPageSize,
    hideOwnershipStatus,
    preferencesReady,
    setViewMode,
    setCompactPageSize,
    setHideOwnershipStatus,
    gridClass,
    pageSize,
  } = useCompendiumListingViewContext()
  const listingExportRef = ref<HTMLElement | null>(null)
  const exporting = ref(false)

  const setThumbnailView = (enabled: boolean) => {
    setViewMode(enabled ? 'thumbnail' : 'standard')
  }

  const setExpandedPageSize = (enabled: boolean) => {
    setCompactPageSize(!enabled)
  }

  const entryKey = (entry: unknown, index: number) => {
    if (props.entryKey) {
      return props.entryKey(entry, index)
    }

    if (entry && typeof entry === 'object' && 'id' in entry) {
      return (entry as { id: string | number }).id
    }

    return index
  }

  const exportListingPng = async () => {
    if (exporting.value || props.editMode) return

    message.info(t('tracker.export.in_progress'))
    exporting.value = true

    try {
      await nextTick()

      const exportElement = listingExportRef.value
      if (!exportElement) {
        throw new Error('Compendium listing export element not found')
      }

      const fileName = `gongeous-compendium-${
        new Date().toISOString().split('T')[0]
      }.png`
      await exportToPng(exportElement, fileName)

      message.success(t('tracker.export.success'))
    } catch (error) {
      console.error('Compendium listing export failed:', error)
      message.error(t('tracker.export.error'))
    } finally {
      exporting.value = false
    }
  }
</script>
