<template>
  <n-modal
    v-model:show="show"
    :mask-closable="!exporting"
    :close-on-esc="!exporting"
  >
    <n-card
      class="flex h-dvh w-full max-w-none flex-col overflow-hidden rounded-2xl sm:h-auto sm:max-h-[calc(100dvh-24px)] sm:w-[calc(100vw-24px)] sm:max-w-4xl lg:max-h-[calc(100dvh-64px)]"
      content-class="app-layout-native-scrollbar min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-0 sm:max-h-[min(70dvh,48rem)]"
      size="small"
      :bordered="false"
      role="dialog"
      aria-modal="true"
      :aria-label="t('common.export_as_image')"
      :title="t('common.export_as_image')"
      :closable="!exporting"
      @close="show = false"
    >
      <div
        class="mx-auto grid max-w-5xl min-w-0 gap-4 p-4 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]"
      >
        <div class="space-y-4">
          <div
            class="flex flex-wrap gap-1.5"
            role="group"
            :aria-label="t('compendium.filter_obtain')"
          >
            <n-button
              v-for="sourcePreset in sourcePresets"
              :key="sourcePreset"
              size="small"
              secondary
              round
              :type="
                filters.sourcePreset === sourcePreset ? 'primary' : 'default'
              "
              :aria-pressed="filters.sourcePreset === sourcePreset"
              :disabled="exporting"
              @click="updateFilters({ sourcePreset })"
            >
              {{ t(OUTFIT_POSTER_SOURCE_LABEL_KEYS[sourcePreset]) }}
            </n-button>
          </div>
          <div
            class="flex flex-wrap items-center gap-2 md:flex-col md:items-start md:gap-4"
          >
            <CreationVersionSelect
              :model-value="filters.version ?? 'all'"
              :versions="versions"
              :disabled="exporting"
              class="flex-1 basis-36 md:flex-none"
              @update:model-value="selectVersion"
            />
            <n-radio-group
              :value="filters.ownership"
              name="outfit-export-ownership"
              role="radiogroup"
              :aria-label="t('eurekas.filters.status')"
              :disabled="exporting"
              @update:value="selectOwnership"
            >
              <n-radio-button value="owned">{{
                t('wardrobe.status.owned')
              }}</n-radio-button>
              <n-radio-button value="all">{{ t('common.all') }}</n-radio-button>
            </n-radio-group>
          </div>
          <n-alert
            v-if="!loading && !loadError && (previewError || exportError)"
            type="error"
          >
            {{
              t(
                previewError
                  ? 'compendium.image.image_error'
                  : 'wardrobe.share.error'
              )
            }}
            <n-button
              size="small"
              class="mt-2"
              @click="retryExport"
            >
              {{ t('common.retry') }}
            </n-button>
          </n-alert>
        </div>
        <div class="mx-auto w-full max-w-md min-w-0 space-y-3">
          <div
            v-if="loading"
            class="flex min-h-36 items-center justify-center"
            role="status"
          >
            <n-spin :description="t('common.loading')" />
          </div>
          <n-alert
            v-else-if="loadError"
            type="error"
          >
            {{ t('compendium.error_title') }}
            <n-button
              size="small"
              class="mt-2"
              @click="emit('retry')"
            >
              {{ t('common.retry') }}
            </n-button>
          </n-alert>
          <OutfitCollectionPoster
            v-else-if="snapshot && previewEntries.length"
            :key="`${previewPage}-${previewAttempt}`"
            :entries="previewEntries"
            :title-highlight="snapshot.titleHighlight"
            :version="snapshot.version"
            :page="previewPage"
            :page-count="pages.length"
            :show-progress="snapshot.showProgress"
            @image-error="previewError = true"
          />
          <n-empty
            v-else
            :description="t('common.no_results_found')"
          />
          <div
            v-if="snapshot && !loading && !loadError"
            class="flex flex-wrap items-center justify-center gap-3"
          >
            <span
              class="inline-flex items-baseline gap-1 text-sm font-medium text-gray-600 dark:text-gray-300"
              aria-live="polite"
            >
              <span class="font-semibold text-gray-900 dark:text-white">
                {{ n(entries.length) }}
              </span>
              <span>
                {{
                  t(entries.length === 1 ? 'common.outfit' : 'common.outfits')
                }}
              </span>
            </span>
            <n-pagination
              v-if="pages.length > 1"
              v-model:page="previewPage"
              class="flex-wrap justify-center gap-y-2"
              :page-count="pages.length"
              :page-slot="5"
              :disabled="exporting"
            />
          </div>
        </div>
      </div>
      <template
        v-if="snapshot"
        #footer
      >
        <div class="mx-auto flex max-w-5xl flex-wrap justify-end gap-2">
          <span
            v-if="exporting"
            class="self-center text-sm"
            role="status"
          >
            {{ t('tracker.export.in_progress') }}
            <template v-if="zipExport">
              {{ n(capturePage ?? 1) }} / {{ n(pages.length) }}
            </template>
          </span>
          <n-button
            :type="pages.length > 1 ? 'default' : 'primary'"
            :disabled="
              loading ||
              loadError ||
              exporting ||
              previewError ||
              !previewEntries.length
            "
            @click="download(false)"
          >
            {{ t('tracker.export.png') }}
          </n-button>
          <n-button
            v-if="pages.length > 1"
            type="primary"
            :disabled="loading || loadError || exporting || previewError"
            @click="download(true)"
          >
            {{ t('compendium.image.download_zip') }}
          </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
  <div
    v-if="snapshot && capturePage !== null"
    inert
    aria-hidden="true"
    class="pointer-events-none fixed top-0 left-[-10000px]"
  >
    <OutfitCollectionPoster
      :key="capturePage"
      ref="capturePoster"
      export-mode
      :entries="pages[capturePage - 1] ?? []"
      :title-highlight="snapshot.titleHighlight"
      :version="snapshot.version"
      :page="capturePage"
      :page-count="pages.length"
      :show-progress="snapshot.showProgress"
    />
  </div>
</template>

<script setup lang="ts">
  import type {
    OutfitCollectionPosterFilters,
    OutfitCollectionPosterSnapshot,
  } from '~/utils/outfitCollectionPoster'

  const props = defineProps<{
    filters: OutfitCollectionPosterFilters
    versions: readonly string[]
    snapshot: OutfitCollectionPosterSnapshot | null
    loading: boolean
    loadError: boolean
  }>()
  const emit = defineEmits<{
    retry: []
    'update:filters': [filters: OutfitCollectionPosterFilters]
  }>()
  const show = defineModel<boolean>('show', { required: true })
  const { t, n } = useI18n()
  const previewPage = ref(1)
  const previewAttempt = ref(0)
  const previewError = ref(false)
  const exportError = ref(false)
  const exporting = ref(false)
  const zipExport = ref(false)
  const capturePage = ref<number | null>(null)
  const capturePoster = ref<{ $el: HTMLElement } | null>(null)
  const sourcePresets = [
    'current',
    ...(Object.keys(
      OUTFIT_POSTER_SOURCE_PRESETS
    ) as (keyof typeof OUTFIT_POSTER_SOURCE_PRESETS)[]),
  ] as const
  const updateFilters = (change: Partial<OutfitCollectionPosterFilters>) => {
    if (change.sourcePreset === props.filters.sourcePreset) return
    emit('update:filters', { ...props.filters, ...change })
  }
  const selectVersion = (version: string) => {
    updateFilters({ version: version === 'all' ? null : version })
  }
  const selectOwnership = (ownership: unknown) => {
    if (ownership === 'all' || ownership === 'owned') {
      updateFilters({ ownership })
    }
  }

  watch(
    () => props.loading,
    (loading) => {
      if (!loading) return
      previewPage.value = 1
      retryImages()
    }
  )
  watch(previewPage, () => {
    previewError.value = false
    exportError.value = false
  })

  const entries = computed(() => props.snapshot?.entries ?? [])
  const pages = computed(() => paginateOutfitCollectionPoster(entries.value))
  const previewEntries = computed(
    () => pages.value[previewPage.value - 1] ?? []
  )
  function retryImages() {
    previewError.value = false
    exportError.value = false
    previewAttempt.value += 1
  }

  const retryExport = () => {
    if (previewError.value) retryImages()
    else void download(zipExport.value)
  }

  const download = async (allPages: boolean) => {
    if (
      props.loading ||
      props.loadError ||
      exporting.value ||
      previewError.value ||
      !previewEntries.value.length
    )
      return
    exporting.value = true
    zipExport.value = allPages
    exportError.value = false

    try {
      const pageNumbers = allPages
        ? pages.value.map((_, index) => index + 1)
        : [previewPage.value]
      const files: Record<string, Uint8Array<ArrayBuffer>> = {}
      for (const page of pageNumbers) {
        capturePage.value = page
        await nextTick()
        const element = capturePoster.value?.$el
        if (!element) throw new Error('Poster could not be mounted')

        const blob = await capturePngBlob(element)
        if (!show.value) return
        const name =
          pages.value.length > 1
            ? `gongeous-outfits-${String(page).padStart(2, '0')}.png`
            : 'gongeous-outfits.png'
        if (allPages) files[name] = new Uint8Array(await blob.arrayBuffer())
        else downloadImageExportBlob(blob, name)
      }

      if (allPages) {
        const { zip } = await import('fflate')
        const bytes = await new Promise<Uint8Array<ArrayBuffer>>(
          (resolve, reject) => {
            zip(files, { level: 0 }, (error, data) => {
              if (error) reject(error)
              else resolve(data)
            })
          }
        )
        if (show.value) {
          downloadImageExportBlob(
            new Blob([bytes], { type: 'application/zip' }),
            'gongeous-outfits.zip'
          )
        }
      }
    } catch (error) {
      console.error('Outfit poster export failed:', error)
      exportError.value = true
    } finally {
      capturePage.value = null
      exporting.value = false
    }
  }
</script>
