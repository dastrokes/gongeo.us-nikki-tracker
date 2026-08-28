<template>
  <div class="mx-auto max-w-7xl space-y-3 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl"
      content-class="p-4 sm:p-5"
    >
      <div
        class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-stretch"
      >
        <div class="flex min-w-0 flex-col gap-4">
          <div class="flex flex-wrap items-center gap-2">
            <n-h1 class="m-0 text-2xl leading-tight font-bold sm:text-3xl">
              {{ t('navigation.eurekas') }}
            </n-h1>
            <n-tag
              v-if="showProfileTag"
              size="small"
              :bordered="false"
              type="info"
            >
              {{ activeProfileLabel }}
            </n-tag>
          </div>

          <div class="grid flex-1 gap-3 sm:grid-cols-2">
            <div class="rounded-lg bg-sky-50 p-3 dark:bg-sky-950/30">
              <div class="text-xs font-medium text-sky-700 dark:text-sky-300">
                {{ t('eurekas.progress.total_owned') }}
              </div>
              <div class="mt-1 h-8 text-2xl leading-8 font-bold tabular-nums">
                <n-skeleton
                  v-if="loading"
                  width="7ch"
                  height="100%"
                  :sharp="false"
                />
                <template v-else>
                  {{ totalOwnedColors }}/{{ totalColors }}
                </template>
              </div>
              <div
                class="mt-2 h-2 overflow-hidden rounded-full bg-sky-100 dark:bg-sky-900"
              >
                <div
                  class="h-full rounded-full bg-sky-500 transition-[width] duration-500"
                  :style="{ width: `${overallPercent}%` }"
                ></div>
              </div>
            </div>
            <div class="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
              <div
                class="text-xs font-medium text-emerald-700 dark:text-emerald-300"
              >
                {{ t('eurekas.progress.complete') }}
              </div>
              <div class="mt-1 h-8 text-2xl leading-8 font-bold tabular-nums">
                <n-skeleton
                  v-if="loading"
                  width="7ch"
                  height="100%"
                  :sharp="false"
                />
                <template v-else>
                  {{ completeCount }}/{{ totalEurekas }}
                </template>
              </div>
              <div
                class="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900"
              >
                <div
                  class="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
                  :style="{ width: `${completePercent}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-900/60"
        >
          <div class="flex items-center justify-between gap-3">
            <n-text class="block text-sm font-semibold">
              {{ t('eurekas.manage_title') }}
            </n-text>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button
                  size="small"
                  text
                  :type="editMode ? 'primary' : 'default'"
                  class="w-8"
                  :aria-label="
                    editMode
                      ? t('wardrobe.actions.view_mode')
                      : t('wardrobe.actions.edit_ownership')
                  "
                  @click="editMode = !editMode"
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
                  : t('wardrobe.actions.edit_ownership')
              }}
            </n-tooltip>
          </div>

          <n-button
            block
            type="primary"
            class="h-9 justify-center"
            @click="openPearpalImport"
          >
            <template #icon>
              <n-icon size="16"><Sync /></n-icon>
            </template>
            <span class="truncate leading-normal">
              {{ t('wardrobe.update_from_pearpal') }}
            </span>
          </n-button>

          <input
            ref="profileFileInputRef"
            type="file"
            accept="application/json,.json"
            class="hidden"
            @change="handleProfileFileSelected"
          />

          <div
            class="mt-auto border-t border-gray-200 pt-2 dark:border-gray-800"
          >
            <n-button-group
              size="small"
              class="w-full"
            >
              <n-button
                size="small"
                secondary
                class="flex-1 justify-center"
                :disabled="!dataReady"
                :aria-busy="exportingProfileJson"
                @click="exportProfileJSON"
              >
                <template #icon>
                  <n-icon size="16"><FileExport /></n-icon>
                </template>
                {{ t('eurekas.actions.export_data') }}
              </n-button>
              <n-button
                size="small"
                secondary
                class="flex-1 justify-center"
                :disabled="!canMutate || importingProfileFile"
                :aria-busy="importingProfileFile"
                @click="openProfileFilePicker"
              >
                <template #icon>
                  <n-icon size="16"><FileImport /></n-icon>
                </template>
                {{ t('eurekas.actions.import_data') }}
              </n-button>
            </n-button-group>
          </div>
        </div>
      </div>
    </n-card>

    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-2 sm:p-4"
    >
      <div
        class="grid grid-cols-2 items-start gap-2 sm:flex sm:flex-wrap sm:items-center"
      >
        <n-input
          v-model:value="search"
          size="small"
          clearable
          class="col-span-2 min-w-0 sm:w-64"
          :placeholder="t('common.search')"
        />
        <CompendiumQualityFilter
          v-model:value="quality"
          :quality-options="[5, 4, 3]"
        />
        <n-select
          v-model:value="position"
          size="small"
          clearable
          class="min-w-0 sm:w-40"
          :options="positionOptions"
          :show-checkmark="false"
          :placeholder="t('eurekas.filters.position')"
        />
        <n-select
          v-model:value="style"
          size="small"
          clearable
          class="min-w-0 sm:w-40"
          :options="styleOptions"
          :show-checkmark="false"
          :placeholder="t('common.style')"
        />
        <n-select
          v-model:value="ownershipStatus"
          size="small"
          clearable
          class="min-w-0 sm:w-40"
          :options="statusOptions"
          :show-checkmark="false"
          :placeholder="t('eurekas.filters.status')"
        />
        <n-button
          v-if="hasFilters"
          size="small"
          tertiary
          type="primary"
          class="w-full font-medium sm:w-auto"
          @click="clearFilters"
        >
          {{ t('common.clear') }}
        </n-button>
      </div>
    </n-card>

    <n-alert
      v-if="!loading && (catalogError || wardrobeError)"
      type="error"
      :title="t('eurekas.load_failed')"
    >
      <div class="flex flex-wrap items-center gap-3">
        <span>{{ (catalogError || wardrobeError)?.message }}</span>
        <n-button
          size="small"
          @click="retry"
        >
          {{ t('common.retry') }}
        </n-button>
      </div>
    </n-alert>

    <div
      v-if="loading"
      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <n-card
        v-for="index in 6"
        :key="index"
        size="small"
        class="rounded-xl"
        content-class="p-3 sm:p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <n-skeleton
              text
              width="45%"
              height="22px"
            />
            <div class="mt-1 flex items-center gap-1.5">
              <n-skeleton
                text
                width="56px"
                height="16px"
              />
              <n-skeleton
                round
                width="48px"
                height="22px"
              />
              <n-skeleton
                round
                width="52px"
                height="22px"
              />
            </div>
          </div>
          <n-skeleton
            round
            width="36px"
            height="22px"
          />
        </div>

        <div class="mt-3 grid grid-cols-5 gap-1.5">
          <div
            v-for="colorIndex in 5"
            :key="colorIndex"
            class="aspect-square overflow-hidden rounded-lg"
          >
            <n-skeleton
              width="100%"
              height="100%"
              :sharp="false"
            />
          </div>
        </div>
      </n-card>
    </div>

    <n-empty
      v-else-if="pageEntries.length === 0 && !catalogError"
      class="py-14"
      :description="t('eurekas.empty')"
    />

    <div
      v-else
      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <n-card
        v-for="eureka in pageEntries"
        :key="eureka.id"
        size="small"
        class="rounded-xl"
        content-class="p-3 sm:p-4"
      >
        <div class="min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <n-text class="block truncate text-base font-semibold">
                {{ eurekaName(eureka) }}
              </n-text>
              <div class="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                  class="text-xs font-semibold"
                  :style="{ color: getQualityColor(eureka.quality) }"
                >
                  {{ '★'.repeat(eureka.quality) }}
                </span>
                <n-tag
                  size="small"
                  :bordered="false"
                >
                  {{ t(`eurekas.positions.${eureka.position}`) }}
                </n-tag>
                <n-tag
                  size="small"
                  :bordered="false"
                  type="default"
                  :color="getStyleTagTheme(eureka.mainStyle)"
                  class="text-xs font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
                >
                  {{ t(`style.${eureka.mainStyle}`) }}
                </n-tag>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-1.5">
              <n-tooltip :show-arrow="false">
                <template #trigger>
                  <n-tag
                    size="small"
                    round
                    :bordered="false"
                    :type="eurekaStatusTagType(eureka)"
                    class="tabular-nums"
                  >
                    <template #icon>
                      <n-icon size="12">
                        <CheckCircle
                          v-if="progressFor(eureka).status === 'complete'"
                        />
                        <Adjust
                          v-else-if="progressFor(eureka).status === 'partial'"
                        />
                        <CircleRegular v-else />
                      </n-icon>
                    </template>
                    {{ progressFor(eureka).owned }}/{{
                      progressFor(eureka).total
                    }}
                  </n-tag>
                </template>
                {{ statusLabel(progressFor(eureka).status) }}
              </n-tooltip>
              <WardrobeOwnedButton
                v-if="editMode"
                :owned="progressFor(eureka).status === 'complete'"
                :disabled="!canMutate"
                :loading="savingEurekaIds.has(eureka.id)"
                variant="overlay"
                @toggle="toggleWholeEureka(eureka)"
              />
            </div>
          </div>

          <div class="mt-3 grid grid-cols-5 gap-1.5">
            <n-tooltip
              v-for="color in eureka.colors"
              :key="color.id"
              :show-arrow="false"
            >
              <template #trigger>
                <button
                  type="button"
                  class="relative aspect-square overflow-hidden rounded-lg border transition"
                  :class="colorButtonClass(color.id)"
                  :disabled="!editMode || !canMutate"
                  @click="toggleColor(color.id)"
                >
                  <NuxtImg
                    :src="getImageSrc('eureka', color.id)"
                    preset="iconLg"
                    sizes="60px"
                    fit="contain"
                    loading="lazy"
                    :alt="colorName(color.colorType)"
                    class="h-full w-full object-contain"
                  />
                  <span
                    v-if="isEurekaColorOwned(color.id)"
                    class="pointer-events-none absolute right-1 bottom-1 flex size-5 items-center justify-center"
                    :style="{ color: getQualityColor(eureka.quality) }"
                  >
                    <n-icon size="16"><CheckCircle /></n-icon>
                  </span>
                </button>
              </template>
              {{ colorName(color.colorType) }}
            </n-tooltip>
          </div>
        </div>
      </n-card>
    </div>

    <div
      v-if="filteredEntries.length > pageSize"
      class="flex items-center justify-center py-2 sm:pr-2"
    >
      <n-pagination
        v-model:page="page"
        :page-size="pageSize"
        :item-count="filteredEntries.length"
        :show-size-picker="false"
        :page-slot="5"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    Adjust,
    BookOpen,
    CheckCircle,
    CircleRegular,
    FileExport,
    FileImport,
    Sync,
    UserEdit,
  } from '@vicons/fa'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const message = useMessage()
  const { getImageSrc } = imageProvider()
  const { activeSlot, slots, getSlotLabel } = useProfileSlots()
  const catalog = useEurekaCatalog()
  const wardrobe = useWardrobe()
  const { loadData, loadWardrobe } = useIndexedDB()
  const { processJsonImport } = useBannerPullData()

  const editMode = ref(false)
  const search = ref('')
  const quality = ref<number | null>(null)
  const position = ref<EurekaPosition | null>(null)
  const style = ref<EurekaStyle | null>(null)
  const ownershipStatus = ref<EurekaOwnershipStatus | null>(null)
  const page = ref(1)
  const pageSize = 18
  const savingEurekaIds = ref(new Set<number>())
  const initialLoadPending = ref(true)
  const importingProfileFile = ref(false)
  const exportingProfileJson = ref(false)
  const profileFileInputRef = ref<HTMLInputElement | null>(null)

  const loading = computed(
    () =>
      initialLoadPending.value ||
      catalog.loading.value ||
      wardrobe.loading.value
  )
  const catalogError = computed(() => catalog.error.value)
  const wardrobeError = computed(() => wardrobe.error.value)
  const canMutate = computed(() => wardrobe.canMutate.value)
  const dataReady = computed(
    () => wardrobe.initialized.value && !wardrobe.loading.value
  )
  const activeProfileLabel = computed(() => getSlotLabel(activeSlot.value))
  const showProfileTag = computed(
    () => slots.value.filter((slot) => slot.exists).length > 1
  )
  const totalEurekas = computed(() => catalog.entries.value.length)
  const totalColors = computed(() => catalog.allColorIds.value.length)
  const totalOwnedColors = computed(
    () =>
      catalog.allColorIds.value.filter((colorId) =>
        wardrobe.ownedEurekaColorIdSet.value.has(colorId)
      ).length
  )
  const overallPercent = computed(() =>
    totalColors.value > 0
      ? Math.round((totalOwnedColors.value / totalColors.value) * 100)
      : 0
  )

  const progressFor = (entry: EurekaCatalogEntry) =>
    getEurekaOwnershipProgress(entry, wardrobe.ownedEurekaColorIdSet.value)
  const eurekaName = (entry: EurekaCatalogEntry) => t(`eureka.${entry.id}.name`)
  const eurekaPositionOrder: Record<EurekaPosition, number> = {
    head: 0,
    hands: 1,
    feet: 2,
  }
  const eurekaSetSortLabels = computed(() => {
    const labels = new Map<number, string>()
    catalog.entries.value.forEach((entry) => {
      if (!labels.has(entry.suitId) || entry.position === 'head') {
        labels.set(entry.suitId, eurekaName(entry))
      }
    })
    return labels
  })
  const completeCount = computed(
    () =>
      catalog.entries.value.filter(
        (entry) => progressFor(entry).status === 'complete'
      ).length
  )
  const completePercent = computed(() =>
    totalEurekas.value > 0
      ? Math.round((completeCount.value / totalEurekas.value) * 100)
      : 0
  )
  const positionOptions = computed(() => [
    ...(['head', 'hands', 'feet'] as EurekaPosition[]).map((value) => ({
      label: t(`eurekas.positions.${value}`),
      value,
    })),
    ...(SHOW_LISTING_MISSING_FILTER_OPTIONS
      ? [
          {
            label: t('compendium.missing_value'),
            value: LISTING_MISSING_FILTER_VALUE,
          },
        ]
      : []),
  ])
  const styleOptions = computed(() => [
    ...(['elegant', 'fresh', 'sweet', 'sexy', 'cool'] as EurekaStyle[]).map(
      (value) => ({ label: t(`style.${value}`), value })
    ),
    ...(SHOW_LISTING_MISSING_FILTER_OPTIONS
      ? [
          {
            label: t('compendium.missing_value'),
            value: LISTING_MISSING_FILTER_VALUE,
          },
        ]
      : []),
  ])
  const statusLabel = (status: EurekaOwnershipStatus) =>
    status === 'partial'
      ? t('wardrobe.filters.partial')
      : status === 'missing'
        ? t('wardrobe.status.missing')
        : t('eurekas.status.complete')
  const statusOptions = computed(() =>
    (['complete', 'partial', 'missing'] as EurekaOwnershipStatus[]).map(
      (value) => ({
        label: statusLabel(value),
        value,
      })
    )
  )

  const colorKeys: Record<number, string> = {
    1: 'color.white',
    2: 'color.blue',
    3: 'color.green',
    4: 'color.purple',
    5: 'color.pink',
    6: 'color.yellow',
    7: 'color.red',
    8: 'color.iridescent',
  }
  const colorName = (colorType: number) => {
    return t(colorKeys[colorType] || 'common.color')
  }

  const filteredEntries = computed(() => {
    const needle = search.value.trim().toLocaleLowerCase()
    return [...catalog.entries.value]
      .filter(
        (entry) =>
          (!needle || eurekaName(entry).toLocaleLowerCase().includes(needle)) &&
          (quality.value === null || entry.quality === quality.value) &&
          (position.value === null ||
            (isListingMissingFilterValue(position.value)
              ? isListingFieldMissing(entry.position)
              : entry.position === position.value)) &&
          (style.value === null ||
            (isListingMissingFilterValue(style.value)
              ? isListingFieldMissing(entry.mainStyle)
              : entry.mainStyle === style.value)) &&
          (ownershipStatus.value === null ||
            progressFor(entry).status === ownershipStatus.value)
      )
      .sort((left, right) => {
        if (right.quality !== left.quality) {
          return right.quality - left.quality
        }

        const setNameComparison = (
          eurekaSetSortLabels.value.get(left.suitId) ?? eurekaName(left)
        ).localeCompare(
          eurekaSetSortLabels.value.get(right.suitId) ?? eurekaName(right)
        )
        if (setNameComparison !== 0) return setNameComparison
        if (left.suitId !== right.suitId) return left.suitId - right.suitId

        return (
          eurekaPositionOrder[left.position] -
          eurekaPositionOrder[right.position]
        )
      })
  })
  const pageEntries = computed(() =>
    filteredEntries.value.slice(
      (page.value - 1) * pageSize,
      page.value * pageSize
    )
  )
  const hasFilters = computed(
    () =>
      search.value.length > 0 ||
      quality.value !== null ||
      position.value !== null ||
      style.value !== null ||
      ownershipStatus.value !== null
  )

  const isEurekaColorOwned = (colorId: number) =>
    wardrobe.isEurekaColorOwned(colorId)
  const colorButtonClass = (colorId: number) =>
    isEurekaColorOwned(colorId)
      ? 'border-transparent bg-gray-50 dark:bg-gray-900'
      : 'border-gray-200 bg-gray-50 hover:border-sky-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-sky-600'
  const eurekaStatusTagType = (entry: EurekaCatalogEntry) => {
    const status = progressFor(entry).status
    if (status === 'complete') return 'success'
    if (status === 'partial') return 'warning'
    return 'default'
  }

  const toggleColor = async (colorId: number) => {
    try {
      await wardrobe.toggleEurekaColorOwned(colorId)
    } catch (error) {
      console.error('Failed to update Eureka ownership:', error)
      message.error(t('eurekas.save_failed'))
    }
  }

  const toggleWholeEureka = async (entry: EurekaCatalogEntry) => {
    const nextSaving = new Set(savingEurekaIds.value)
    nextSaving.add(entry.id)
    savingEurekaIds.value = nextSaving
    try {
      await wardrobe.markEurekaColorsOwned(
        entry.colors.map((color) => color.id),
        progressFor(entry).status !== 'complete'
      )
    } catch (error) {
      console.error('Failed to update Eureka ownership:', error)
      message.error(t('eurekas.save_failed'))
    } finally {
      const done = new Set(savingEurekaIds.value)
      done.delete(entry.id)
      savingEurekaIds.value = done
    }
  }

  const clearFilters = () => {
    search.value = ''
    quality.value = null
    position.value = null
    style.value = null
    ownershipStatus.value = null
  }

  const openProfileFilePicker = () => {
    if (!canMutate.value || importingProfileFile.value) return
    profileFileInputRef.value?.click()
  }

  const handleProfileFileSelected = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    importingProfileFile.value = true
    try {
      const parsed = JSON.parse(await file.text()) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Invalid data file')
      }

      await processJsonImport(parsed as Parameters<typeof processJsonImport>[0])
      message.success(t('wardrobe.file_import_success'))
    } catch (error) {
      console.error('Profile data file import failed:', error)
      message.error(t('wardrobe.file_import_error'))
    } finally {
      importingProfileFile.value = false
    }
  }

  const exportProfileJSON = async () => {
    if (exportingProfileJson.value) return
    exportingProfileJson.value = true
    message.info(t('wardrobe.export.in_progress'))

    try {
      const {
        pulls: rawPullData,
        edits: rawEditData,
        evo: evoData,
        pearpal: rawPearpalData,
      } = await loadData(activeSlot.value)
      const wardrobeData = await loadWardrobe(activeSlot.value)
      const slotData = slots.value[activeSlot.value - 1]
      const trimmedLabel = slotData?.label?.trim()
      const profile =
        slotData?.exists && trimmedLabel ? { label: trimmedLabel } : undefined
      const exportData = createProfileDataExportPayload({
        pulls: rawPullData,
        edits: rawEditData,
        evo: evoData,
        pearpal: rawPearpalData,
        wardrobe: wardrobeData,
        profile,
      })

      if (!exportData) {
        message.info(t('wardrobe.export.empty'))
        return
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })
      const link = document.createElement('a')
      link.download = getProfileDataExportFileName(activeSlot.value)
      link.href = URL.createObjectURL(blob)
      link.click()
      URL.revokeObjectURL(link.href)

      message.success(t('wardrobe.export.success'))
    } catch (error) {
      console.error('Profile data export failed:', error)
      message.error(t('wardrobe.export.error'))
    } finally {
      exportingProfileJson.value = false
    }
  }

  const openPearpalImport = () =>
    navigateTo(
      localePath({
        path: '/import',
        query: { method: 'pearpal', returnTo: 'eurekas' },
      })
    )
  const retry = () => Promise.all([catalog.retry(), wardrobe.retry()])

  watch([search, quality, position, style, ownershipStatus], () => {
    page.value = 1
  })

  onMounted(() => {
    void Promise.all([catalog.load(), wardrobe.init()])
      .catch(() => undefined)
      .finally(() => {
        initialLoadPending.value = false
      })
  })

  useSeoMeta({
    title: () => t('navigation.eurekas'),
    description: () => t('meta.description.eurekas'),
  })
</script>
