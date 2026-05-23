<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl bg-gradient-to-r from-purple-50/50 via-pink-50/30 to-amber-50/40 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20"
      content-class="p-4 sm:p-5"
    >
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div class="min-w-0 space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <n-h1 class="m-0 text-2xl leading-tight font-bold sm:text-3xl">
              {{ t('wardrobe.title') }}
            </n-h1>
            <n-tag
              size="small"
              :bordered="false"
              type="info"
            >
              {{ activeProfileLabel }}
            </n-tag>
          </div>

          <n-text
            depth="3"
            class="block max-w-2xl text-sm"
          >
            {{ t('wardrobe.hub_subtitle') }}
          </n-text>

          <div class="grid gap-3 sm:grid-cols-3">
            <n-card
              v-for="metric in summaryMetrics"
              :key="metric.label"
              size="small"
              class="rounded-lg"
              embedded
            >
              <n-text
                depth="3"
                class="text-xs font-medium text-slate-500 uppercase dark:text-slate-400"
              >
                {{ metric.label }}
              </n-text>
              <div class="mt-1 flex items-baseline gap-2">
                <n-skeleton
                  v-if="isSummaryLoading"
                  text
                  width="72px"
                />
                <template v-else>
                  <n-text class="text-2xl font-bold tabular-nums">
                    {{ metric.value }}
                  </n-text>
                  <n-text
                    depth="3"
                    class="text-xs text-slate-500 dark:text-slate-400"
                  >
                    {{ metric.detail }}
                  </n-text>
                </template>
              </div>
            </n-card>
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
    </n-card>

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
        <n-card
          size="small"
          class="rounded-xl"
          content-class="p-4"
        >
          <template #header>
            <div class="flex flex-col gap-1 pb-1">
              <n-h2 class="m-0 text-base font-semibold">
                {{ t('wardrobe.progress_title') }}
              </n-h2>
              <n-text
                depth="3"
                class="text-sm"
              >
                {{ t('wardrobe.progress_description') }}
              </n-text>
            </div>
          </template>

          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div class="space-y-3">
              <n-text class="block text-sm font-semibold">
                {{ t('wardrobe.by_quality') }}
              </n-text>
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
              <n-text class="block text-sm font-semibold">
                {{ t('wardrobe.by_slot') }}
              </n-text>
              <template v-if="summary">
                <NuxtLinkLocale
                  v-for="row in apparelRows"
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

                <div
                  v-if="accessoryRows.length > 0"
                  class="mt-2"
                >
                  <n-collapse-transition :show="showAccessories">
                    <div class="space-y-3 pt-2">
                      <NuxtLinkLocale
                        v-for="row in accessoryRows"
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
                    </div>
                  </n-collapse-transition>

                  <div class="mt-3 flex justify-center">
                    <n-button
                      size="tiny"
                      text
                      type="primary"
                      class="flex items-center gap-1 font-medium transition hover:opacity-80"
                      @click="showAccessories = !showAccessories"
                    >
                      <template #icon>
                        <n-icon
                          class="text-[10px] transition-transform duration-300"
                          :class="{ 'rotate-180': showAccessories }"
                        >
                          <ChevronDown />
                        </n-icon>
                      </template>
                      {{
                        showAccessories
                          ? t('wardrobe.hide_accessories')
                          : t('wardrobe.show_accessories')
                      }}
                    </n-button>
                  </div>
                </div>
              </template>
              <WardrobeProgressSkeletonRows v-else />
            </div>

            <div class="space-y-3">
              <n-text class="block text-sm font-semibold">
                {{ t('wardrobe.by_version') }}
              </n-text>
              <template v-if="summary">
                <NuxtLinkLocale
                  v-for="row in versionRows"
                  :key="row.version"
                  :to="getVersionLink(row.version)"
                  class="block rounded-lg px-2 py-1.5 transition hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <WardrobeProgressRow
                    :label="
                      t('wardrobe.version_label', { version: row.version })
                    "
                    :owned="row.owned"
                    :total="row.total"
                    :percent="row.completionPercent"
                  />
                </NuxtLinkLocale>
              </template>
              <WardrobeProgressSkeletonRows v-else />
            </div>
          </div>
        </n-card>
      </div>

      <aside class="space-y-4">
        <n-card
          size="small"
          class="rounded-xl"
          content-class="p-4"
        >
          <template #header>
            <n-h2 class="m-0 text-base font-semibold">
              {{ t('wardrobe.continue_title') }}
            </n-h2>
          </template>

          <div class="grid gap-2">
            <NuxtLinkLocale
              v-for="action in quickActions"
              :key="action.label"
              :to="action.to"
              class="group block rounded-lg border border-gray-100 p-3 transition hover:border-sky-200 hover:bg-sky-50/70 dark:border-gray-800 dark:hover:border-sky-900 dark:hover:bg-sky-950/30"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <n-text class="block text-sm font-semibold">
                    {{ action.label }}
                  </n-text>
                  <n-text
                    depth="3"
                    class="block text-xs"
                  >
                    {{ action.detail }}
                  </n-text>
                </div>
                <n-icon
                  class="text-gray-400 transition group-hover:text-sky-500"
                >
                  <ExternalLinkAlt />
                </n-icon>
              </div>
            </NuxtLinkLocale>
          </div>
        </n-card>

        <n-card
          size="small"
          class="rounded-xl"
          content-class="p-4"
        >
          <template #header>
            <n-h2 class="m-0 text-base font-semibold">
              {{ t('wardrobe.import_panel_title') }}
            </n-h2>
          </template>

          <n-text
            depth="3"
            class="block text-sm"
          >
            {{ t('wardrobe.import_tracker_description') }}
          </n-text>

          <n-card
            v-if="lastImportResult"
            size="small"
            class="mt-3 rounded-lg"
            embedded
          >
            <n-text class="text-sm">
              {{
                t('wardrobe.import_last_result', {
                  found: lastImportResult.found,
                  imported: lastImportResult.imported,
                })
              }}
            </n-text>
          </n-card>

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
        </n-card>

        <n-card
          v-if="initialized && ownedItemIds.length === 0"
          size="small"
          class="rounded-xl"
          content-class="p-4"
        >
          <n-result
            size="small"
            status="info"
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
        </n-card>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { ChevronDown, ExternalLinkAlt, Upload, User } from '@vicons/fa'
  import { BANNER_DATA } from '~~/data/banners'

  const { t } = useI18n()
  const message = useMessage()
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

  const catalogIndex = useCatalogIndex()
  const showAccessories = ref(false)

  const qualityRows = computed(() => summary.value?.qualityRows ?? [])

  const apparelRows = computed(() => {
    if (!summary.value) return []
    return summary.value.typeRows.filter(
      (row) => getItemTypeCategory(row.type as ItemType) === 'clothes'
    )
  })

  const accessoryRows = computed(() => {
    if (!summary.value) return []
    return summary.value.typeRows.filter(
      (row) => getItemTypeCategory(row.type as ItemType) !== 'clothes'
    )
  })

  const getVersionPrefix = (version: string) => {
    const parts = version.split('.')
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[1]}`
    }
    return version
  }

  const getVersionLink = (version: string) => {
    const slug = resolveSeoVersionSlug(version)
    if (slug) {
      return { path: `/outfits/version/${slug}` }
    }
    return { path: '/outfits', query: { version } }
  }

  const versionRows = computed(() => {
    const index = catalogIndex.index.value
    if (!index || !ownedItemIds.value) return []

    const outfitsByVersion = new Map<string, Set<number>>()

    Object.values(BANNER_DATA).forEach((banner) => {
      if (!banner.runs || banner.runs.length === 0) return

      const releaseVersion = banner.runs[0].version
      const prefix = getVersionPrefix(releaseVersion)

      if (!outfitsByVersion.has(prefix)) {
        outfitsByVersion.set(prefix, new Set())
      }

      const outfitSet = outfitsByVersion.get(prefix)!

      const addOutfit = (outfitIdStr: string) => {
        const id = Number(outfitIdStr)
        if (!isNaN(id) && index.outfitItemsById.has(id)) {
          outfitSet.add(id)
        }
      }

      banner.outfit4StarId.forEach(addOutfit)
      banner.outfit5StarId.forEach(addOutfit)
    })

    const ownedSet = new Set(ownedItemIds.value)
    const rows: Array<{
      version: string
      owned: number
      total: number
      completionPercent: number
    }> = []

    outfitsByVersion.forEach((outfitIdSet, version) => {
      let completedCount = 0

      outfitIdSet.forEach((outfitId) => {
        const itemIds = index.outfitItemsById.get(outfitId) ?? []
        if (itemIds.length === 0) return

        const isCompleted = itemIds.every((id) => ownedSet.has(id))
        if (isCompleted) {
          completedCount++
        }
      })

      if (outfitIdSet.size > 0) {
        rows.push({
          version,
          owned: completedCount,
          total: outfitIdSet.size,
          completionPercent: Math.round(
            (completedCount / outfitIdSet.size) * 100
          ),
        })
      }
    })

    return rows.sort((a, b) => {
      const aParts = a.version.split('.').map(Number)
      const bParts = b.version.split('.').map(Number)

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = aParts[i] ?? 0
        const bVal = bParts[i] ?? 0
        if (aVal !== bVal) {
          return bVal - aVal
        }
      }
      return 0
    })
  })
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
