<template>
  <div class="space-y-3 sm:space-y-4">
    <div class="flex items-start justify-between gap-3 px-1">
      <div class="min-w-0">
        <h2
          class="truncate text-lg font-semibold text-slate-900 sm:text-xl dark:text-slate-50"
        >
          {{ activeTemplateName }}
        </h2>
        <p class="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
          {{ t('creation_hub.outfit_card.editor_description') }}
        </p>
      </div>
      <n-button
        size="small"
        secondary
        @click="showTemplateEditor = true"
      >
        <template #icon
          ><n-icon><Edit /></n-icon
        ></template>
        {{ t('common.customize') }}
      </n-button>
    </div>

    <div class="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
      <n-spin :show="loading">
        <div class="grid grid-cols-3 gap-1.5 sm:gap-3">
          <article
            v-for="(prompt, index) in prompts"
            :key="index"
            class="group relative aspect-[300/439] min-w-0 overflow-hidden rounded-xl border bg-slate-100 bg-[url('/images/bg.webp')] bg-cover bg-center shadow-xs transition-[border-color,box-shadow] dark:bg-slate-300"
            :class="outfitCardClass(index)"
            :style="outfitCardStyle(index)"
          >
            <div
              v-if="selectedOutfit(index)"
              class="pointer-events-none absolute inset-0"
              :style="
                getQualityOverlayStyle(Number(selectedOutfit(index)!.quality))
              "
            />
            <button
              type="button"
              class="absolute inset-0 text-left focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-hidden focus-visible:ring-inset"
              :aria-label="
                selectedOutfit(index)
                  ? t('creation_hub.outfit_card.change')
                  : t('creation_hub.outfit_card.choose')
              "
              @click="openPicker(index)"
            >
              <div
                v-if="selectedOutfit(index)"
                class="absolute inset-x-0 top-6 bottom-0 overflow-hidden"
              >
                <NuxtImg
                  :src="getImageSrc('outfit', selectedOutfit(index)!.id)"
                  :alt="selectedOutfit(index)!.name"
                  preset="tallLg"
                  sizes="120px sm:200px"
                  class="relative -top-px h-[calc(100%+1px)] w-full object-contain object-bottom"
                />
              </div>
              <div
                class="pointer-events-none absolute inset-x-0 top-0 z-10 grid h-[34px] place-items-center px-6 text-center"
              >
                <span
                  class="absolute top-2 left-2 text-[9px] font-semibold tracking-wide text-slate-400 tabular-nums"
                >
                  {{ String(index + 1).padStart(2, '0') }}
                </span>
                <span
                  class="line-clamp-2 text-[11px] leading-[1.25] font-semibold text-slate-800 sm:text-xs dark:text-slate-100"
                >
                  {{ prompt }}
                </span>
              </div>
              <div
                v-if="!selectedOutfit(index)"
                class="absolute inset-x-0 top-[34px] bottom-0 flex items-center justify-center"
              >
                <span
                  class="flex size-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50/70 text-rose-500 transition-colors group-hover:bg-rose-100 dark:border-rose-900/70 dark:bg-rose-950/25"
                >
                  <n-icon size="15"><Plus /></n-icon>
                </span>
              </div>
              <span
                v-else
                class="absolute bottom-1 left-1/2 z-10 w-max max-w-[calc(100%-8px)] min-w-[58%] -translate-x-1/2 truncate rounded-lg border border-white/60 bg-white/92 px-2 py-1 text-center text-[9px] font-semibold text-slate-800 shadow-sm backdrop-blur-xs sm:text-[11px] dark:border-slate-600/70 dark:bg-slate-900/92 dark:text-slate-100"
              >
                {{ selectedOutfit(index)!.name }}
              </span>
            </button>
            <n-button
              v-if="selectedOutfit(index)"
              circle
              quaternary
              size="small"
              class="absolute top-9 right-1 z-20 size-8 !min-w-8 !rounded-full !border !border-rose-200/90 !bg-white/94 !text-rose-500 !shadow-sm backdrop-blur-sm transition-[color,background-color,border-color,box-shadow,transform] before:absolute before:-inset-1.5 before:rounded-full before:content-[''] hover:!border-rose-300 hover:!bg-rose-50 hover:!text-rose-600 hover:!shadow-md active:scale-95 motion-reduce:transform-none dark:!border-rose-800/80 dark:!bg-slate-900/94 dark:!text-rose-300 dark:hover:!border-rose-700 dark:hover:!bg-rose-950/80 dark:hover:!text-rose-200"
              :aria-label="
                t('creation_hub.remove', {
                  name: selectedOutfit(index)!.name,
                })
              "
              @click.stop="clearSelection(index)"
            >
              <template #icon>
                <n-icon size="13"><Times /></n-icon>
              </template>
            </n-button>
          </article>
        </div>
      </n-spin>

      <aside class="hidden space-y-3 lg:sticky lg:top-20 lg:block">
        <ThemeCardPoster
          :prompts="prompts"
          :selected-ids="selectedIds"
          :outfits="outfitsById"
          :title="posterTitle"
        />
        <div class="grid grid-cols-2 gap-2">
          <n-popconfirm @positive-click="clearSelections">
            <template #trigger>
              <n-button :disabled="selectedCount === 0">{{
                t('creation_hub.outfit_card.clear')
              }}</n-button>
            </template>
            {{ t('creation_hub.outfit_card.clear_confirm') }}
          </n-popconfirm>
          <n-button
            type="primary"
            :disabled="selectedCount !== prompts.length"
            :loading="exporting"
            @click="downloadPoster"
          >
            <template #icon
              ><n-icon><Download /></n-icon
            ></template>
            {{ t('common.export_as_image') }}
          </n-button>
        </div>
      </aside>
    </div>

    <div
      class="sticky bottom-2 z-30 -mx-1 grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-2xl border border-slate-200/90 bg-white/94 p-2 shadow-[0_8px_30px_rgb(15_23_42/0.14)] backdrop-blur-md lg:hidden dark:border-slate-700 dark:bg-slate-900/94"
    >
      <n-popconfirm @positive-click="clearSelections">
        <template #trigger>
          <n-button
            size="large"
            :disabled="selectedCount === 0"
            >{{ t('creation_hub.outfit_card.clear') }}</n-button
          >
        </template>
        {{ t('creation_hub.outfit_card.clear_confirm') }}
      </n-popconfirm>
      <n-button
        type="primary"
        size="large"
        :disabled="selectedCount !== prompts.length"
        @click="showPreview = true"
      >
        <template #icon
          ><n-icon><Image /></n-icon
        ></template>
        {{ t('creation_hub.outfit_card.preview') }}
      </n-button>
    </div>

    <n-modal v-model:show="showPicker">
      <n-card
        role="dialog"
        :title="activePrompt"
        class="flex h-[calc(100dvh-24px)] w-[calc(100vw-24px)] max-w-4xl flex-col overflow-hidden rounded-2xl lg:h-[calc(100dvh-64px)] lg:max-w-3xl"
        content-class="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-5"
        closable
        @close="showPicker = false"
      >
        <div class="flex min-h-0 flex-1 flex-col gap-3">
          <div
            class="shrink-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/60"
          >
            <div class="grid grid-cols-2 gap-2 md:grid-cols-6">
              <CompendiumQualityFilter
                v-model:value="qualityFilter"
                :quality-options="activeQualityOptions"
                class="col-start-1 row-start-2 md:col-span-2 md:row-start-1"
              />
              <n-input
                v-model:value="query"
                class="col-span-2 row-start-1 md:col-span-4 md:col-start-3"
                clearable
                :placeholder="t('creation_hub.outfit_card.search')"
              >
                <template #prefix
                  ><n-icon><Search /></n-icon
                ></template>
              </n-input>
              <n-select
                v-model:value="versionFilter"
                class="col-start-2 row-start-2 md:col-span-2 md:col-start-1"
                :options="versionOptions"
                :render-label="renderVersionOptionLabel"
                size="small"
                clearable
                filterable
                :show-checkmark="false"
                :placeholder="t('compendium.filter_version')"
              />
              <n-select
                v-model:value="styleFilter"
                class="col-start-1 row-start-3 md:col-span-2 md:col-start-3 md:row-start-2"
                :options="styleOptions"
                size="small"
                clearable
                :show-checkmark="false"
                :placeholder="t('compendium.filter_style')"
              />
              <n-select
                v-model:value="sourceFilter"
                class="col-start-2 row-start-3 md:col-span-2 md:col-start-5 md:row-start-2"
                :options="sourceOptions"
                size="small"
                clearable
                filterable
                :show-checkmark="false"
                :placeholder="t('compendium.filter_obtain')"
              />
            </div>
            <div
              v-if="hasPickerFilters"
              class="mt-2 flex justify-end"
            >
              <n-button
                text
                size="small"
                @click="clearPickerFilters"
              >
                {{ t('common.clear') }}
              </n-button>
            </div>
          </div>
          <div class="min-h-0 flex-1 overflow-hidden">
            <n-scrollbar class="h-full pr-1">
              <div
                v-if="pagedOutfits.length"
                class="grid grid-cols-3 gap-2 p-1 sm:grid-cols-4 md:grid-cols-5"
              >
                <button
                  v-for="outfit in pagedOutfits"
                  :key="outfit.id"
                  type="button"
                  class="min-w-0 rounded-lg text-left focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-hidden"
                  :aria-label="outfit.name"
                  @click="selectOutfit(outfit.id)"
                >
                  <OutfitCard
                    :outfit-id="outfit.id"
                    :name="outfit.name"
                    :quality="outfit.quality"
                    size="sm"
                    show-info
                  />
                </button>
              </div>
              <n-empty
                v-else
                :description="t('creation_hub.outfit_card.empty')"
              />
            </n-scrollbar>
          </div>
          <div
            v-if="filteredOutfits.length > 0"
            class="shrink-0 overflow-hidden pt-1"
          >
            <n-pagination
              v-model:page="page"
              class="justify-center"
              :page-size="PAGE_SIZE"
              :item-count="filteredOutfits.length"
              :show-size-picker="false"
              :page-slot="5"
            />
          </div>
        </div>
      </n-card>
    </n-modal>

    <n-modal v-model:show="showPreview">
      <n-card
        role="dialog"
        :title="t('creation_hub.outfit_card.preview')"
        class="flex max-h-dvh w-full max-w-none flex-col overflow-hidden rounded-2xl sm:max-h-[calc(100dvh-24px)] sm:w-[calc(100vw-24px)] sm:max-w-2xl lg:max-h-[calc(100dvh-64px)] lg:max-w-lg"
        content-class="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5"
        closable
        @close="showPreview = false"
      >
        <ThemeCardPoster
          :prompts="prompts"
          :selected-ids="selectedIds"
          :outfits="outfitsById"
          :title="posterTitle"
        />
        <n-button
          type="primary"
          block
          class="mt-4"
          :loading="exporting"
          @click="downloadPoster"
        >
          <template #icon
            ><n-icon><Download /></n-icon
          ></template>
          {{ t('common.export_as_image') }}
        </n-button>
      </n-card>
    </n-modal>

    <ShareCardTemplateEditor
      v-model:show="showTemplateEditor"
      :active-template-id="activeTemplateId"
      :default-prompts="defaultPrompts"
      :custom-template="customTemplate"
      @use-default="useDefaultTemplate"
      @save-custom="saveCustomTemplate"
      @share-custom="openTemplateShare"
      @reset="resetCustomTemplate"
    />

    <n-modal
      v-model:show="showTemplateShare"
      @after-enter="selectShareLink"
    >
      <n-card
        role="dialog"
        :title="t('creation_hub.template.share')"
        class="w-full max-w-none overflow-hidden rounded-2xl sm:w-[calc(100vw-24px)] sm:max-w-2xl lg:max-w-lg"
        closable
        @close="showTemplateShare = false"
      >
        <div class="mx-auto max-w-2xl">
          <p class="mb-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {{ t('creation_hub.template.share_description') }}
          </p>
          <n-input
            ref="shareLinkInput"
            :value="templateShareUrl"
            readonly
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            @focus="selectShareLink"
          />
          <div
            class="mt-4 grid gap-2"
            :class="canNativeShare ? 'grid-cols-2' : 'grid-cols-1'"
          >
            <n-button
              secondary
              size="large"
              @click="copyTemplateLink"
            >
              <template #icon
                ><n-icon><Copy /></n-icon
              ></template>
              {{ t('tierlist.share.copy_link') }}
            </n-button>
            <n-button
              v-if="canNativeShare"
              type="primary"
              size="large"
              @click="shareTemplateLink"
            >
              <template #icon
                ><n-icon><ShareAlt /></n-icon
              ></template>
              {{ t('creation_hub.template.share_action') }}
            </n-button>
          </div>
        </div>
      </n-card>
    </n-modal>

    <n-modal
      :show="showSharedTemplate"
      @update:show="onSharedTemplateVisibility"
    >
      <n-card
        role="dialog"
        :title="t('creation_hub.template.shared_title')"
        class="w-full max-w-none overflow-hidden rounded-2xl sm:w-[calc(100vw-24px)] sm:max-w-2xl lg:max-w-lg"
        closable
        @close="dismissSharedTemplate"
      >
        <div
          v-if="sharedTemplate"
          class="mx-auto max-w-2xl"
        >
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ t('creation_hub.template.shared_description') }}
          </p>
          <h3
            class="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50"
          >
            {{ sharedTemplate.name }}
          </h3>
          <div class="mt-4 grid grid-cols-3 gap-2">
            <div
              v-for="(category, index) in sharedTemplate.prompts"
              :key="index"
              class="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800"
            >
              <span
                class="text-[10px] font-semibold text-slate-400 tabular-nums"
                >{{ String(index + 1).padStart(2, '0') }}</span
              >
              <p
                class="mt-0.5 line-clamp-2 text-xs font-medium text-slate-700 dark:text-slate-200"
              >
                {{ category }}
              </p>
            </div>
          </div>
          <div class="mt-5 grid grid-cols-2 gap-2">
            <n-button
              size="large"
              @click="dismissSharedTemplate"
            >
              {{ t('common.cancel') }}
            </n-button>
            <n-button
              type="primary"
              size="large"
              @click="useSharedTemplate"
            >
              {{ t('creation_hub.template.use_shared') }}
            </n-button>
          </div>
        </div>
      </n-card>
    </n-modal>

    <div
      inert
      class="pointer-events-none fixed top-0 left-[-10000px]"
      aria-hidden="true"
    >
      <ThemeCardPoster
        ref="exportPoster"
        export-mode
        :prompts="prompts"
        :selected-ids="selectedIds"
        :outfits="outfitsById"
        :title="posterTitle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    Copy,
    Download,
    Edit,
    Image,
    Plus,
    Search,
    ShareAlt,
    Times,
  } from '@vicons/fa'
  import type { InputInst } from 'naive-ui'
  import { BANNER_DATA } from '~~/data/banners'

  const STORAGE_KEY = 'gongeous-studio-theme'
  const PAGE_SIZE = 30
  const limitedFiveOutfitIds = new Set<string>()
  const limitedFourOutfitIds = new Set<string>()
  const companionFourOutfitIds = new Set<string>()
  const limitedOutfitIds = new Set<string>()
  for (const banner of Object.values(BANNER_DATA)) {
    if (banner.bannerType === 2) {
      for (const id of banner.outfit5StarId) {
        limitedFiveOutfitIds.add(String(id))
        limitedOutfitIds.add(String(id))
      }
      for (const id of banner.outfit4StarId) {
        companionFourOutfitIds.add(String(id))
        limitedFourOutfitIds.add(String(id))
        limitedOutfitIds.add(String(id))
      }
    } else if (banner.bannerType === 3) {
      for (const id of banner.outfit4StarId) {
        limitedFourOutfitIds.add(String(id))
        limitedOutfitIds.add(String(id))
      }
    }
  }
  type NamedOutfit = OutfitListEntry & {
    name: string
    searchText: string
    styleKey: string | null
    version: string | null
    sourceKey: string | null
  }
  const { t, tm, rt, locale, getLocaleMessage } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const { getImageSrc } = imageProvider()
  const catalog = useCatalogIndex()
  const message = useMessage()
  const { getOutfitAbilityAliases, getOutfitSearchAliases } = useSearchFields(
    () => locale.value === 'zh' || locale.value === 'tw'
  )

  const loading = ref(true)
  const query = ref('')
  const page = ref(1)
  const qualityFilter = ref<number | null>(null)
  const versionFilter = ref<string | null>(null)
  const styleFilter = ref<string | null>(null)
  const sourceFilter = ref<string | null>(null)
  const activeIndex = ref<number | null>(null)
  const showPicker = ref(false)
  const showPreview = ref(false)
  const showTemplateEditor = ref(false)
  const showTemplateShare = ref(false)
  const showSharedTemplate = ref(false)
  const exporting = ref(false)
  const templateShareUrl = ref('')
  const templateShareName = ref('')
  const sharedTemplate = ref<ShareCardTemplate | null>(null)
  const canNativeShare = ref(false)
  const shareLinkInput = ref<InputInst | null>(null)
  const exportPoster = ref<{ $el: HTMLElement } | null>(null)

  const defaultPrompts = computed(() =>
    (tm('creation_hub.outfit_card.prompts') as string[]).map((prompt) =>
      rt(prompt)
    )
  )
  const activeTemplateId = ref<ShareCardTemplateId>('default')
  const customTemplate = ref<ShareCardTemplate>({
    id: 'custom',
    name: '',
    prompts: [],
  })
  const selections = reactive<
    Record<ShareCardTemplateId, Array<string | number | null>>
  >({
    default: Array(9).fill(null),
    custom: Array(9).fill(null),
  })
  const prompts = computed(() =>
    activeTemplateId.value === 'custom'
      ? customTemplate.value.prompts
      : defaultPrompts.value
  )
  const selectedIds = computed(() => selections[activeTemplateId.value])
  const activeTemplateName = computed(() =>
    activeTemplateId.value === 'custom'
      ? customTemplate.value.name
      : t('creation_hub.template.default')
  )
  const posterTitle = computed(() =>
    activeTemplateId.value === 'custom'
      ? customTemplate.value.name
      : t('creation_hub.outfit_card.poster_title')
  )
  const normalizeSearchText = (value: string) =>
    value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase()

  const outfits = computed<NamedOutfit[]>(() => {
    const entries = (catalog.index.value?.outfits ?? [])
      .filter((outfit) => getOutfitVariantType(String(outfit.id)) === 'base')
      .map((outfit) => {
        const name = t(`outfit.${outfit.id}.name`)
        const aliasLocale = locale.value === 'tw' ? 'zh' : locale.value
        const searchValues = Array.from(
          new Set([
            name,
            ...getOutfitSearchAliases(aliasLocale, outfit.id),
            ...getOutfitSearchAliases('en', outfit.id),
            ...getOutfitAbilityAliases(aliasLocale, outfit.id),
            ...getOutfitAbilityAliases('en', outfit.id),
          ])
        )
        return {
          ...outfit,
          name,
          searchText: normalizeSearchText(searchValues.join(' ')),
          styleKey: resolveStyleKeyFromI18nKey(outfit.style),
          version: getVersionFromId(outfit.obtain_type),
          sourceKey:
            outfit.obtain_type == null
              ? null
              : resolveObtainGroupKey(outfit.obtain_type),
        }
      })
    const versionOrder = new Map(
      sortVersionsDesc(
        Array.from(
          new Set(
            entries
              .map((outfit) => outfit.version)
              .filter((version): version is string => Boolean(version))
          )
        )
      ).map((version, index) => [version, index])
    )
    return entries.sort((a, b) => {
      const versionDifference =
        (versionOrder.get(a.version ?? '') ?? Number.MAX_SAFE_INTEGER) -
        (versionOrder.get(b.version ?? '') ?? Number.MAX_SAFE_INTEGER)
      if (versionDifference !== 0) return versionDifference
      return String(b.id).localeCompare(String(a.id), undefined, {
        numeric: true,
      })
    })
  })
  const outfitsById = computed<Record<string, NamedOutfit>>(() =>
    Object.fromEntries(
      outfits.value.map((outfit) => [String(outfit.id), outfit])
    )
  )
  const selectedCount = computed(() => selectedIds.value.filter(Boolean).length)
  const activePrompt = computed(() =>
    activeIndex.value == null ? '' : (prompts.value[activeIndex.value] ?? '')
  )
  const activeQualityOptions = computed(() => {
    if (activeTemplateId.value !== 'default' || activeIndex.value == null)
      return [5, 4, 3]
    if (activeIndex.value === 0) return [5]
    if (activeIndex.value === 1 || activeIndex.value === 2) return [4]
    return [5, 4]
  })
  const activeCategoryOutfitIds = computed<Set<string> | null>(() => {
    if (activeTemplateId.value !== 'default' || activeIndex.value == null)
      return null
    if (activeIndex.value === 0) return limitedFiveOutfitIds
    if (activeIndex.value === 1) return limitedFourOutfitIds
    if (activeIndex.value === 2) return companionFourOutfitIds
    return limitedOutfitIds
  })
  const categoryOutfits = computed(() =>
    outfits.value.filter(
      (outfit) =>
        (!activeCategoryOutfitIds.value ||
          activeCategoryOutfitIds.value.has(String(outfit.id))) &&
        activeQualityOptions.value.includes(Number(outfit.quality))
    )
  )
  const styleOptions = computed(() =>
    STYLE_DEFINITIONS.map((style) => ({
      label: t(style.i18nKey),
      value: style.key,
    }))
  )
  const messages = computed(
    () => getLocaleMessage(locale.value) as Record<string, unknown>
  )
  const availableVersions = computed(() =>
    getExactVersionsFromLocaleMessages(messages.value)
  )
  const versionOptions = computed(() =>
    createVersionFilterOptions(availableVersions.value, (value) => {
      const key = `version.${value}`
      const translated = t(key)
      return translated !== key ? `${value} - ${translated}` : value
    })
  )
  const renderVersionOptionLabel = (option: {
    label?: string | number
    value?: string | number
    isMajor?: boolean
  }) => {
    const label = String(option.label ?? option.value ?? '')
    return option.isMajor
      ? h('span', { style: { fontWeight: '700' } }, label)
      : label
  }
  const sourceOptions = computed(() =>
    createObtainFilterOptions(
      getLocaleMessageNumericIds(messages.value, 'obtain'),
      t,
      {
        includeGroup: isObtainGroupVisibleInOutfits,
        fallbackLabel: (id) => `Obtain ${id}`,
      }
    )
  )
  const hasPickerFilters = computed(
    () =>
      qualityFilter.value !== null ||
      versionFilter.value !== null ||
      styleFilter.value !== null ||
      sourceFilter.value !== null
  )
  const filteredOutfits = computed(() => {
    const needle = normalizeSearchText(query.value.trim())
    return categoryOutfits.value.filter(
      (outfit) =>
        (!needle || outfit.searchText.includes(needle)) &&
        (qualityFilter.value === null ||
          outfit.quality === qualityFilter.value) &&
        (!versionFilter.value ||
          (outfit.version &&
            matchesVersionFilter(outfit.version, versionFilter.value))) &&
        (!styleFilter.value || outfit.styleKey === styleFilter.value) &&
        (!sourceFilter.value || outfit.sourceKey === sourceFilter.value)
    )
  })
  const pagedOutfits = computed(() =>
    filteredOutfits.value.slice(
      (page.value - 1) * PAGE_SIZE,
      page.value * PAGE_SIZE
    )
  )

  const selectedOutfit = (index: number) => {
    const id = selectedIds.value[index]
    return id == null ? null : (outfitsById.value[String(id)] ?? null)
  }
  const outfitCardClass = (index: number) => {
    const outfit = selectedOutfit(index)
    if (!outfit) {
      return 'border-slate-200 hover:border-rose-300 hover:shadow-sm dark:border-slate-700'
    }
    return 'hover:shadow-sm'
  }
  const outfitCardStyle = (index: number) => {
    const outfit = selectedOutfit(index)
    return outfit
      ? { borderColor: getQualityTextTheme(Number(outfit.quality)).borderColor }
      : undefined
  }
  const persist = () => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          activeTemplateId: activeTemplateId.value,
          customTemplate: customTemplate.value,
          selections,
        })
      )
    } catch {
      // Storage can be unavailable in private or restricted browser contexts.
    }
  }
  const openPicker = (index: number) => {
    activeIndex.value = index
    query.value = ''
    qualityFilter.value = null
    versionFilter.value = null
    styleFilter.value = null
    sourceFilter.value = null
    page.value = 1
    showPicker.value = true
  }
  const clearPickerFilters = () => {
    qualityFilter.value = null
    versionFilter.value = null
    styleFilter.value = null
    sourceFilter.value = null
  }
  const selectOutfit = (id: string | number) => {
    if (activeIndex.value == null) return
    selectedIds.value[activeIndex.value] = id
    persist()
    showPicker.value = false
  }
  const clearSelections = () => {
    selections[activeTemplateId.value] = Array(prompts.value.length).fill(null)
    persist()
  }
  const clearSelection = (index: number) => {
    selectedIds.value[index] = null
    persist()
  }
  const useDefaultTemplate = () => {
    activeTemplateId.value = 'default'
    persist()
  }
  const saveCustomTemplate = (template: ShareCardTemplate) => {
    customTemplate.value = template
    activeTemplateId.value = 'custom'
    persist()
  }
  const openTemplateShare = (template: ShareCardTemplate) => {
    if (!import.meta.client) return
    const url = new URL(window.location.href)
    url.hash = ''
    url.search = ''
    url.searchParams.set('t', encodeShareCardTemplateParam(template))
    templateShareUrl.value = url.toString()
    templateShareName.value = template.name
    showTemplateShare.value = true
  }
  const selectShareLink = async () => {
    await nextTick()
    shareLinkInput.value?.focus()
    const textarea = document.activeElement as HTMLTextAreaElement | null
    textarea?.select()
  }
  const copyTemplateLink = async () => {
    try {
      await navigator.clipboard.writeText(templateShareUrl.value)
      message.success(t('creation_hub.template.link_copied'))
    } catch {
      void selectShareLink()
      message.info(t('creation_hub.template.copy_fallback'))
    }
  }
  const shareTemplateLink = async () => {
    if (!navigator.share) return
    try {
      await navigator.share({
        title: t('creation_hub.template.share_title', {
          name: templateShareName.value,
        }),
        url: templateShareUrl.value,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      await copyTemplateLink()
    }
  }
  const clearSharedTemplateQuery = () => {
    const query = { ...route.query, mode: 'themes' }
    delete query.t
    void router.replace({ query })
  }
  const dismissSharedTemplate = () => {
    showSharedTemplate.value = false
    sharedTemplate.value = null
    clearSharedTemplateQuery()
  }
  const onSharedTemplateVisibility = (visible: boolean) => {
    if (!visible) dismissSharedTemplate()
  }
  const useSharedTemplate = () => {
    if (!sharedTemplate.value) return
    customTemplate.value = sharedTemplate.value
    selections.custom = Array(9).fill(null)
    activeTemplateId.value = 'custom'
    persist()
    showTemplateEditor.value = false
    dismissSharedTemplate()
    message.success(t('creation_hub.template.shared_applied'))
  }
  const resetCustomTemplate = () => {
    customTemplate.value = {
      id: 'custom',
      name: t('creation_hub.template.custom_default_name'),
      prompts: [...defaultPrompts.value],
    }
    selections.custom = Array(9).fill(null)
    activeTemplateId.value = 'custom'
    persist()
  }

  watch(
    [query, qualityFilter, versionFilter, styleFilter, sourceFilter],
    () => {
      page.value = 1
    }
  )
  const downloadPoster = async () => {
    const element = exportPoster.value?.$el
    if (!element) return
    exporting.value = true
    try {
      await exportToPng(element, t('creation_hub.outfit_card.export_name'))
    } catch {
      message.error(t('common.error'))
    } finally {
      exporting.value = false
    }
  }

  onMounted(async () => {
    try {
      canNativeShare.value = typeof navigator.share === 'function'
      customTemplate.value = {
        id: 'custom',
        name: t('creation_hub.template.custom_default_name'),
        prompts: [...defaultPrompts.value],
      }
      let stored: string | null = null
      try {
        stored = localStorage.getItem(STORAGE_KEY)
      } catch {
        // Continue without persistence when browser storage is unavailable.
      }
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as {
            activeTemplateId?: ShareCardTemplateId
            customTemplate?: ShareCardTemplate
            selections?: Partial<
              Record<ShareCardTemplateId, Array<string | number | null>>
            >
          }
          const storedTemplate = parsed.customTemplate
          const storedTemplateName = cleanShareCardTemplateText(
            storedTemplate?.name,
            40
          )
          const storedPrompts = Array.isArray(storedTemplate?.prompts)
            ? storedTemplate.prompts
                .slice(0, 9)
                .map((prompt) => cleanShareCardTemplateText(prompt, 32))
            : []
          const hasValidCustomTemplate =
            storedTemplateName.length > 0 &&
            storedPrompts.length === 9 &&
            storedPrompts.every(Boolean)
          if (hasValidCustomTemplate)
            customTemplate.value = {
              id: 'custom',
              name: storedTemplateName,
              prompts: storedPrompts,
            }
          if (
            parsed.activeTemplateId === 'default' ||
            (parsed.activeTemplateId === 'custom' && hasValidCustomTemplate)
          )
            activeTemplateId.value = parsed.activeTemplateId
          for (const id of ['default', 'custom'] as ShareCardTemplateId[]) {
            const storedSelections = parsed.selections?.[id]
            if (Array.isArray(storedSelections))
              selections[id] = storedSelections
                .slice(0, 9)
                .map((value) =>
                  typeof value === 'string' || typeof value === 'number'
                    ? value
                    : null
                )
                .concat(Array(9).fill(null))
                .slice(0, 9)
          }
        } catch {
          // Ignore malformed or outdated local state and keep safe defaults.
        }
      }
      const templateParam = Array.isArray(route.query.t)
        ? route.query.t[0]
        : route.query.t
      if (templateParam) {
        sharedTemplate.value = parseShareCardTemplateParam(templateParam)
        if (sharedTemplate.value) showSharedTemplate.value = true
        else {
          message.error(t('creation_hub.template.invalid_link'))
          clearSharedTemplateQuery()
        }
      }
      await catalog.load(['outfits'])
    } finally {
      loading.value = false
    }
  })
</script>
