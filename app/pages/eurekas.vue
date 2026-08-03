<template>
  <div class="mx-auto max-w-7xl space-y-3 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl"
      content-class="p-4 sm:p-5"
    >
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div class="min-w-0 flex-1">
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
        </div>

        <div class="flex flex-col gap-2 sm:flex-row">
          <n-button
            type="primary"
            secondary
            @click="openPearpalImport"
          >
            <template #icon
              ><n-icon><Sync /></n-icon
            ></template>
            {{ t('wardrobe.update_from_pearpal') }}
          </n-button>
          <n-button
            :type="editMode ? 'primary' : 'default'"
            class="sm:min-w-38"
            @click="editMode = !editMode"
          >
            <template #icon>
              <n-icon><Pen v-if="!editMode" /><Eye v-else /></n-icon>
            </template>
            {{
              editMode
                ? t('wardrobe.actions.view_mode')
                : t('wardrobe.actions.edit_ownership')
            }}
          </n-button>
        </div>
      </div>

      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <div class="rounded-lg bg-sky-50 p-3 dark:bg-sky-950/30">
          <div class="text-xs font-medium text-sky-700 dark:text-sky-300">
            {{ t('eurekas.progress.total_owned') }}
          </div>
          <div class="mt-1 text-2xl font-bold tabular-nums">
            {{ totalOwnedColors }}/{{ totalColors }}
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
          <div class="mt-1 text-2xl font-bold tabular-nums">
            {{ completeCount }}/{{ totalEurekas }}
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
      v-if="catalogError || wardrobeError"
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
        class="rounded-xl"
      >
        <n-skeleton
          text
          :repeat="4"
        />
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
        class="rounded-xl transition-shadow"
        :class="
          progressFor(eureka).status === 'complete'
            ? 'ring-1 ring-emerald-400/60 dark:ring-emerald-500/50'
            : ''
        "
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
                  type="info"
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
    CheckCircle,
    CircleRegular,
    Eye,
    Pen,
    Sync,
  } from '@vicons/fa'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const message = useMessage()
  const { getImageSrc } = imageProvider()
  const { activeSlot, slots, getSlotLabel } = useProfileSlots()
  const catalog = useEurekaCatalog()
  const wardrobe = useWardrobe()

  const editMode = ref(false)
  const search = ref('')
  const quality = ref<number | null>(null)
  const position = ref<EurekaPosition | null>(null)
  const style = ref<EurekaStyle | null>(null)
  const ownershipStatus = ref<EurekaOwnershipStatus | null>(null)
  const page = ref(1)
  const pageSize = 18
  const savingEurekaIds = ref(new Set<number>())

  const loading = computed(
    () => catalog.loading.value || wardrobe.loading.value
  )
  const catalogError = computed(() => catalog.error.value)
  const wardrobeError = computed(() => wardrobe.error.value)
  const canMutate = computed(() => wardrobe.canMutate.value)
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
  const positionOptions = computed(() =>
    (['head', 'hands', 'feet'] as EurekaPosition[]).map((value) => ({
      label: t(`eurekas.positions.${value}`),
      value,
    }))
  )
  const styleOptions = computed(() =>
    (['elegant', 'fresh', 'sweet', 'sexy', 'cool'] as EurekaStyle[]).map(
      (value) => ({ label: t(`style.${value}`), value })
    )
  )
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
          (position.value === null || entry.position === position.value) &&
          (style.value === null || entry.mainStyle === style.value) &&
          (ownershipStatus.value === null ||
            progressFor(entry).status === ownershipStatus.value)
      )
      .sort((left, right) =>
        right.quality !== left.quality
          ? right.quality - left.quality
          : eurekaName(left).localeCompare(eurekaName(right))
      )
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
    void Promise.all([catalog.load(), wardrobe.init()]).catch(() => undefined)
  })

  useSeoMeta({
    title: () => t('navigation.eurekas'),
    description: () => t('meta.description.eurekas'),
  })
</script>
