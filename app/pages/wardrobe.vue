<template>
  <div class="mx-auto max-w-7xl space-y-4">
    <section
      class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950"
    >
      <div
        class="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
      >
        <div class="min-w-0 space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl leading-tight font-bold sm:text-3xl">
              {{ t('wardrobe.title') }}
            </h1>
            <n-tag
              size="small"
              :bordered="false"
              type="info"
            >
              {{ activeProfileLabel }}
            </n-tag>
          </div>

          <p class="max-w-2xl text-sm text-gray-600 dark:text-gray-300">
            {{ t('wardrobe.hub_subtitle') }}
          </p>

          <div class="grid gap-3 sm:grid-cols-3">
            <div
              v-for="metric in summaryMetrics"
              :key="metric.label"
              class="rounded-lg border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-900/70"
            >
              <div class="text-xs font-medium text-gray-500 dark:text-gray-400">
                {{ metric.label }}
              </div>
              <div class="mt-1 flex items-baseline gap-2">
                <n-skeleton
                  v-if="isSummaryLoading"
                  text
                  width="72px"
                />
                <template v-else>
                  <span class="text-2xl font-bold tabular-nums">
                    {{ metric.value }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ metric.detail }}
                  </span>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 lg:justify-end">
          <NuxtLinkLocale to="/profile">
            <n-button size="small">
              <template #icon>
                <n-icon><User /></n-icon>
              </template>
              {{ t('wardrobe.manage_profiles') }}
            </n-button>
          </NuxtLinkLocale>
          <n-button
            size="small"
            type="primary"
            :loading="importing"
            :disabled="!canMutate"
            @click="handleTrackerImport"
          >
            <template #icon>
              <n-icon><Upload /></n-icon>
            </template>
            {{ t('wardrobe.import_tracker') }}
          </n-button>
        </div>
      </div>
    </section>

    <n-alert
      v-if="wardrobeError"
      type="error"
      :title="t('wardrobe.storage_unavailable')"
    >
      <div class="space-y-3">
        <p>{{ wardrobeError.message }}</p>
        <n-button
          size="small"
          @click="retry"
        >
          {{ t('wardrobe.storage_recovery') }}
        </n-button>
      </div>
    </n-alert>

    <n-alert
      v-else-if="summaryError"
      type="error"
      :title="t('wardrobe.summary_unavailable')"
    >
      <div class="space-y-3">
        <p>{{ summaryError.message }}</p>
        <n-button
          size="small"
          @click="loadSummary"
        >
          {{ t('wardrobe.actions.retry') }}
        </n-button>
      </div>
    </n-alert>

    <section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="space-y-4">
        <div
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950"
        >
          <div
            class="flex flex-col gap-1 border-b border-gray-100 pb-3 dark:border-gray-800"
          >
            <h2 class="text-base font-semibold">
              {{ t('wardrobe.progress_title') }}
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('wardrobe.progress_description') }}
            </p>
          </div>

          <div class="mt-4 grid gap-5 xl:grid-cols-2">
            <div class="space-y-3">
              <div class="text-sm font-semibold">
                {{ t('wardrobe.by_quality') }}
              </div>
              <template v-if="summary">
                <NuxtLinkLocale
                  v-for="row in qualityRows"
                  :key="row.quality"
                  :to="{
                    path: '/items',
                    query: { quality: row.quality, wardrobe: 'missing' },
                  }"
                  class="block rounded-lg px-2 py-1.5 transition hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <WardrobeProgressRow
                    :label="
                      t('wardrobe.quality_label', { quality: row.quality })
                    "
                    :owned="row.owned"
                    :total="row.total"
                    :percent="row.completionPercent"
                  />
                </NuxtLinkLocale>
              </template>
              <WardrobeProgressSkeletonRows v-else />
            </div>

            <div class="space-y-3">
              <div class="text-sm font-semibold">
                {{ t('wardrobe.by_slot') }}
              </div>
              <template v-if="summary">
                <NuxtLinkLocale
                  v-for="row in typeRows"
                  :key="row.type"
                  :to="{
                    path: '/items',
                    query: { type: row.type, wardrobe: 'missing' },
                  }"
                  class="block rounded-lg px-2 py-1.5 transition hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <WardrobeProgressRow
                    :label="t(`type.${row.type}`)"
                    :owned="row.owned"
                    :total="row.total"
                    :percent="row.completionPercent"
                  />
                </NuxtLinkLocale>
              </template>
              <WardrobeProgressSkeletonRows v-else />
            </div>
          </div>
        </div>

        <div
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950"
        >
          <div
            class="flex flex-col gap-1 border-b border-gray-100 pb-3 dark:border-gray-800"
          >
            <h2 class="text-base font-semibold">
              {{ t('wardrobe.near_complete_title') }}
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('wardrobe.near_complete_description') }}
            </p>
          </div>

          <div
            v-if="summary && nearCompleteOutfits.length > 0"
            class="mt-4 divide-y divide-gray-100 dark:divide-gray-800"
          >
            <div
              v-for="outfit in nearCompleteOutfits"
              :key="outfit.id"
              class="group grid grid-cols-[64px_minmax(0,1fr)] gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[72px_minmax(0,1fr)_auto]"
            >
              <NuxtImg
                :src="outfit.image"
                :alt="outfit.name"
                class="aspect-2/3 rounded-lg object-cover"
                preset="tallSm"
                fit="cover"
                sizes="72px"
                loading="lazy"
              />
              <div class="min-w-0 space-y-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold">
                    {{ outfit.name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{
                      t('wardrobe.missing_items_count', {
                        count: outfit.missing,
                      })
                    }}
                  </p>
                </div>
                <WardrobeProgressRow
                  :label="
                    t('wardrobe.status.progress', {
                      owned: outfit.owned,
                      total: outfit.total,
                    })
                  "
                  :owned="outfit.owned"
                  :total="outfit.total"
                  :percent="outfit.completionPercent"
                  compact
                />
              </div>
              <div class="col-span-2 flex items-center gap-2 sm:col-span-1">
                <NuxtLinkLocale :to="`/outfits/${outfit.id}`">
                  <n-button size="small">
                    {{ t('wardrobe.view_outfit') }}
                  </n-button>
                </NuxtLinkLocale>
              </div>
            </div>
          </div>

          <n-result
            v-else-if="summary"
            size="small"
            status="info"
            :title="t('wardrobe.no_partial_outfits_title')"
            :description="t('wardrobe.no_partial_outfits_description')"
          />

          <div
            v-else
            class="mt-4 space-y-3"
          >
            <n-skeleton
              v-for="row in 3"
              :key="row"
              height="72px"
              round
            />
          </div>
        </div>
      </div>

      <aside class="space-y-4">
        <div
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950"
        >
          <h2 class="text-base font-semibold">
            {{ t('wardrobe.continue_title') }}
          </h2>
          <div class="mt-3 grid gap-2">
            <NuxtLinkLocale
              v-for="action in quickActions"
              :key="action.label"
              :to="action.to"
              class="group rounded-lg border border-gray-100 p-3 transition hover:border-sky-200 hover:bg-sky-50/70 dark:border-gray-800 dark:hover:border-sky-900 dark:hover:bg-sky-950/30"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <div class="text-sm font-semibold">
                    {{ action.label }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ action.detail }}
                  </div>
                </div>
                <n-icon
                  class="text-gray-400 transition group-hover:text-sky-500"
                >
                  <ExternalLinkAlt />
                </n-icon>
              </div>
            </NuxtLinkLocale>
          </div>
        </div>

        <div
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950"
        >
          <h2 class="text-base font-semibold">
            {{ t('wardrobe.import_panel_title') }}
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {{ t('wardrobe.import_tracker_description') }}
          </p>
          <div
            v-if="lastImportResult"
            class="mt-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-900"
          >
            {{
              t('wardrobe.import_last_result', {
                found: lastImportResult.found,
                imported: lastImportResult.imported,
              })
            }}
          </div>
          <n-button
            class="mt-3 w-full"
            type="primary"
            :loading="importing"
            :disabled="!canMutate"
            @click="handleTrackerImport"
          >
            <template #icon>
              <n-icon><Upload /></n-icon>
            </template>
            {{ t('wardrobe.import_tracker') }}
          </n-button>
        </div>

        <n-result
          v-if="initialized && ownedItemIds.length === 0"
          size="small"
          status="info"
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950"
          :title="t('wardrobe.empty_title')"
          :description="t('wardrobe.empty_description')"
        >
          <template #footer>
            <div class="flex justify-center gap-2">
              <NuxtLinkLocale to="/items">
                <n-button type="primary">
                  {{ t('wardrobe.open_items') }}
                </n-button>
              </NuxtLinkLocale>
              <NuxtLinkLocale to="/tracker">
                <n-button>
                  {{ t('navigation.tracker') }}
                </n-button>
              </NuxtLinkLocale>
            </div>
          </template>
        </n-result>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { ExternalLinkAlt, Upload, User } from '@vicons/fa'

  const { t } = useI18n()
  const message = useMessage()
  const { getImageSrc } = imageProvider()
  const { activeSlot, getSlotLabel } = useProfileSlots()
  const {
    ownedItemIds,
    initialized,
    loading: wardrobeLoading,
    error: wardrobeError,
    canMutate,
    retry,
    importOwnedItemsFromTracker,
  } = useWardrobe()
  const {
    summary,
    loading: summaryLoading,
    error: summaryError,
    load: loadSummary,
  } = useWardrobeSummary()

  const importing = ref(false)
  const lastImportResult = ref<{ found: number; imported: number } | null>(null)
  const activeProfileLabel = computed(() => getSlotLabel(activeSlot.value))
  const isSummaryLoading = computed(
    () => !summary.value && (summaryLoading.value || wardrobeLoading.value)
  )

  const formatCount = (value: number | undefined) =>
    new Intl.NumberFormat().format(value ?? 0)

  const summaryMetrics = computed(() => [
    {
      label: t('wardrobe.owned_items'),
      value: formatCount(
        summary.value?.items.owned ?? ownedItemIds.value.length
      ),
      detail: t('wardrobe.of_total_items', {
        total: formatCount(summary.value?.items.total),
      }),
    },
    {
      label: t('wardrobe.item_completion'),
      value: `${summary.value?.items.completionPercent ?? 0}%`,
      detail: t('wardrobe.missing_count', {
        count: formatCount(summary.value?.items.missing),
      }),
    },
    {
      label: t('wardrobe.outfit_completion'),
      value: `${summary.value?.outfits.completionPercent ?? 0}%`,
      detail: t('wardrobe.partial_count', {
        count: formatCount(summary.value?.outfits.partial),
      }),
    },
  ])

  const qualityRows = computed(() => summary.value?.qualityRows ?? [])
  const typeRows = computed(() => summary.value?.typeRows.slice(0, 8) ?? [])
  const nearCompleteOutfits = computed(() =>
    (summary.value?.nearCompleteOutfits ?? []).map((outfit) => ({
      ...outfit,
      name: t(`outfit.${outfit.id}.name`),
      image: getImageSrc('outfit', outfit.id),
    }))
  )
  const quickActions = computed(() => [
    {
      label: t('wardrobe.open_missing_items'),
      detail: t('wardrobe.open_missing_items_detail', {
        count: formatCount(summary.value?.items.missing),
      }),
      to: { path: '/items', query: { wardrobe: 'missing' } },
    },
    {
      label: t('wardrobe.open_owned_items'),
      detail: t('wardrobe.open_owned_items_detail', {
        count: formatCount(summary.value?.items.owned),
      }),
      to: { path: '/items', query: { wardrobe: 'owned' } },
    },
    {
      label: t('wardrobe.open_partial_outfits'),
      detail: t('wardrobe.open_partial_outfits_detail', {
        count: formatCount(summary.value?.outfits.partial),
      }),
      to: { path: '/outfits', query: { wardrobe: 'partial' } },
    },
    {
      label: t('wardrobe.open_missing_outfits'),
      detail: t('wardrobe.open_missing_outfits_detail', {
        count: formatCount(summary.value?.outfits.missing),
      }),
      to: { path: '/outfits', query: { wardrobe: 'missing' } },
    },
  ])

  const handleTrackerImport = async () => {
    importing.value = true
    try {
      const result = await importOwnedItemsFromTracker()
      lastImportResult.value = result
      if (result.found === 0) {
        message.info(t('wardrobe.import_empty'))
        return
      }
      message.success(
        t('wardrobe.import_success', {
          found: result.found,
          imported: result.imported,
        })
      )
    } catch {
      message.error(t('wardrobe.import_error'))
    } finally {
      importing.value = false
    }
  }

  onMounted(() => {
    void loadSummary()
  })

  useSeoMeta({
    title: () =>
      `${t('wardrobe.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('meta.description.wardrobe'),
  })
</script>
