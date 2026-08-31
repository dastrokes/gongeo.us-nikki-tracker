<template>
  <div class="space-y-3 sm:space-y-4">
    <template v-if="!activeScope">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          v-for="scope in scopeOptions"
          :key="scope.value"
          type="button"
          class="rounded-2xl text-left focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-hidden"
          @click="chooseScope(scope.value)"
        >
          <n-card
            size="small"
            class="h-full rounded-2xl transition-[border-color,box-shadow] hover:border-rose-300 hover:shadow-[0_4px_20px_rgb(15_23_42/0.05)]"
            content-class="p-3 sm:p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="font-semibold text-slate-900 dark:text-slate-50">
                  {{ scope.label }}
                </h3>
                <p
                  class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400"
                >
                  {{ scope.description }}
                </p>
              </div>
              <n-tag
                v-if="drafts[scope.value].selectedIds.length"
                round
                size="small"
                :bordered="false"
                type="info"
                >{{ drafts[scope.value].selectedIds.length }}/10</n-tag
              >
            </div>
            <div
              class="mt-3 grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <NuxtImg
                v-for="banner in scope.preview"
                :key="banner.bannerId"
                :src="banner.image"
                :alt="banner.name"
                preset="bannerThumb"
                sizes="300px"
                class="aspect-2/1 h-full w-full object-cover"
                :style="getBannerFocalPointStyle(banner.bannerId)"
                @load="applyBannerFocalPoint($event, banner.bannerId)"
              />
            </div>
          </n-card>
        </button>
      </div>
    </template>

    <template v-else-if="phase === 'select'">
      <div class="space-y-3 px-1">
        <div class="flex items-start justify-between gap-3">
          <div>
            <n-button
              size="small"
              quaternary
              class="mb-1 -ml-2"
              @click="activeScope = null"
              ><template #icon
                ><n-icon><ArrowLeft /></n-icon></template
              >{{ t('creation_hub.banner_ranking.change_scope') }}</n-button
            >
            <h2
              class="text-lg font-semibold text-slate-900 sm:text-xl dark:text-slate-50"
            >
              {{ t('creation_hub.banner_ranking.selection_title') }}
            </h2>
            <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {{ t('creation_hub.banner_ranking.selection_description') }}
            </p>
          </div>
          <n-tag
            round
            :bordered="false"
            class="shrink-0"
            :type="selectedIds.length === 10 ? 'success' : 'info'"
            >{{
              t('creation_hub.banner_ranking.selected', {
                count: selectedIds.length,
                total: 10,
              })
            }}</n-tag
          >
        </div>
        <div
          class="grid grid-cols-[minmax(0,1fr)_112px] gap-2 sm:grid-cols-[minmax(0,1fr)_180px]"
        >
          <n-input
            v-model:value="query"
            clearable
            :placeholder="t('creation_hub.banner_ranking.search')"
            ><template #prefix
              ><n-icon><Search /></n-icon></template
          ></n-input>
          <n-select
            v-model:value="version"
            clearable
            :options="versionOptions"
            :render-label="renderVersionOptionLabel"
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_version')"
          />
        </div>
      </div>

      <div class="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <n-card
          size="small"
          class="rounded-2xl"
          content-class="p-1.5 sm:p-4"
        >
          <div
            v-if="filteredCandidates.length"
            class="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4"
          >
            <button
              v-for="banner in filteredCandidates"
              :key="banner.bannerId"
              type="button"
              class="group relative aspect-2/1 min-w-0 overflow-hidden rounded-lg border bg-slate-100 text-left shadow-xs transition-[border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-hidden dark:bg-slate-800"
              :class="
                isSelected(banner.bannerId)
                  ? 'border-rose-400 ring-1 ring-rose-300'
                  : 'border-slate-200 hover:border-rose-300 hover:shadow-md dark:border-slate-700'
              "
              @click="toggleBanner(banner.bannerId)"
            >
              <NuxtImg
                :src="banner.image"
                :alt="banner.name"
                preset="bannerThumb"
                sizes="300px sm:600px"
                class="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transform-none"
                :style="getBannerFocalPointStyle(banner.bannerId)"
                loading="lazy"
                @load="applyBannerFocalPoint($event, banner.bannerId)"
              />
              <div
                class="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-900/10 to-slate-950/15"
              />
              <span
                v-if="isSelected(banner.bannerId)"
                class="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm"
                ><n-icon><Check /></n-icon
              ></span>
              <div class="absolute inset-x-0 bottom-0 p-2 text-white">
                <p class="truncate text-sm font-semibold">{{ banner.name }}</p>
              </div>
            </button>
          </div>
          <n-empty
            v-else
            :description="t('creation_hub.banner_ranking.empty')"
          />
        </n-card>
        <aside class="hidden space-y-3 lg:sticky lg:top-20 lg:block">
          <n-card
            size="small"
            class="rounded-2xl"
            content-class="p-3"
          >
            <div class="grid grid-cols-5 gap-1.5">
              <div
                v-for="slot in 10"
                :key="slot"
                class="relative aspect-2/1 overflow-hidden rounded-md border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
              >
                <NuxtImg
                  v-if="selectedBanners[slot - 1]"
                  :src="selectedBanners[slot - 1]!.image"
                  :alt="selectedBanners[slot - 1]!.name"
                  preset="bannerThumb"
                  sizes="300px"
                  class="h-full w-full object-cover"
                  :style="
                    getBannerFocalPointStyle(
                      selectedBanners[slot - 1]!.bannerId
                    )
                  "
                  @load="
                    applyBannerFocalPoint(
                      $event,
                      selectedBanners[slot - 1]!.bannerId
                    )
                  "
                />
              </div>
            </div>
          </n-card>
          <n-alert
            v-if="selectedIds.length === 10"
            type="success"
            :show-icon="false"
            >{{ t('creation_hub.banner_ranking.full') }}</n-alert
          >
          <n-button
            type="primary"
            block
            :disabled="selectedIds.length !== 10"
            @click="startRanking"
            >{{ t('creation_hub.banner_ranking.continue') }}</n-button
          >
        </aside>
      </div>

      <div
        class="sticky bottom-2 z-30 -mx-1 grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-2xl border border-slate-200/90 bg-white/94 p-2 shadow-[0_8px_30px_rgb(15_23_42/0.14)] backdrop-blur-md lg:hidden dark:border-slate-700 dark:bg-slate-900/94"
      >
        <div class="flex items-center justify-center px-2">
          <n-tag
            round
            :bordered="false"
            :type="selectedIds.length === 10 ? 'success' : 'info'"
            >{{
              t('creation_hub.banner_ranking.selected', {
                count: selectedIds.length,
                total: 10,
              })
            }}</n-tag
          >
        </div>
        <n-button
          type="primary"
          size="large"
          :disabled="selectedIds.length !== 10"
          @click="startRanking"
          >{{ t('creation_hub.banner_ranking.continue') }}</n-button
        >
      </div>
    </template>

    <template v-else>
      <div class="flex items-start justify-between gap-3 px-1">
        <div>
          <h2
            class="text-lg font-semibold text-slate-900 sm:text-xl dark:text-slate-50"
          >
            {{ t('creation_hub.banner_ranking.ranking_title') }}
          </h2>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {{ t('creation_hub.banner_ranking.ranking_description') }}
          </p>
        </div>
        <n-button
          size="small"
          secondary
          @click="phase = 'select'"
        >
          <template #icon
            ><n-icon><Edit /></n-icon
          ></template>
          {{ t('creation_hub.banner_ranking.edit_selection') }}
        </n-button>
      </div>
      <div class="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <n-card
          size="small"
          class="min-w-0 rounded-2xl"
          content-class="p-1.5 sm:p-4"
        >
          <div
            ref="rankList"
            class="min-w-0 space-y-2"
          >
            <div
              v-for="(banner, index) in rankedBanners"
              :key="banner.bannerId"
              :data-id="banner.bannerId"
              data-rank-item
              class="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-xs dark:border-slate-700 dark:bg-slate-900"
            >
              <span
                data-rank-number
                :data-rank="index + 1"
                class="flex size-8 shrink-0 items-center justify-center rounded-lg border text-base font-bold tabular-nums shadow-sm"
                :class="rankBadgeClass(index + 1)"
                >{{ index + 1 }}</span
              >
              <NuxtImg
                :src="banner.image"
                :alt="banner.name"
                preset="bannerThumb"
                sizes="300px"
                class="aspect-2/1 w-20 shrink-0 rounded-md object-cover sm:w-36"
                :style="getBannerFocalPointStyle(banner.bannerId)"
                @load="applyBannerFocalPoint($event, banner.bannerId)"
              />
              <div class="min-w-0 flex-1">
                <p
                  class="truncate text-xs font-semibold text-slate-900 sm:text-sm dark:text-slate-50"
                >
                  {{ banner.name }}
                </p>
                <p
                  class="truncate text-[10px] text-slate-500 sm:text-xs dark:text-slate-400"
                >
                  {{ banner.version }} · {{ banner.versionName }}
                </p>
              </div>
              <div class="hidden shrink-0 items-center gap-0.5 sm:flex">
                <n-button
                  size="small"
                  text
                  circle
                  class="size-11"
                  :disabled="index === 0"
                  :aria-label="
                    t('creation_hub.banner_ranking.move_up', {
                      name: banner.name,
                    })
                  "
                  @click="move(index, index - 1)"
                  ><template #icon
                    ><n-icon><ArrowUp /></n-icon></template
                ></n-button>
                <n-button
                  size="small"
                  text
                  circle
                  class="size-11"
                  :disabled="index === rankedBanners.length - 1"
                  :aria-label="
                    t('creation_hub.banner_ranking.move_down', {
                      name: banner.name,
                    })
                  "
                  @click="move(index, index + 1)"
                  ><template #icon
                    ><n-icon><ArrowDown /></n-icon></template
                ></n-button>
              </div>
              <span
                class="rank-handle flex size-11 shrink-0 cursor-grab touch-none items-center justify-center text-slate-400 active:cursor-grabbing"
                aria-hidden="true"
                ><n-icon><Bars /></n-icon
              ></span>
            </div>
          </div>
        </n-card>
        <aside class="hidden space-y-3 lg:sticky lg:top-20 lg:block">
          <BannerRankingPoster :banners="rankedBanners" />
          <div class="grid grid-cols-2 gap-2">
            <n-button @click="resetRanking">{{
              t('creation_hub.banner_ranking.reset')
            }}</n-button>
            <n-button
              type="primary"
              :loading="exporting"
              @click="downloadPoster"
              ><template #icon
                ><n-icon><Download /></n-icon></template
              >{{ t('common.export_as_image') }}</n-button
            >
          </div>
        </aside>
      </div>
      <div
        data-ranking-actions
        class="sticky bottom-2 z-30 -mx-1 grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-2xl border border-slate-200/90 bg-white/94 p-2 shadow-[0_8px_30px_rgb(15_23_42/0.14)] backdrop-blur-md lg:hidden dark:border-slate-700 dark:bg-slate-900/94"
      >
        <n-button
          size="large"
          @click="phase = 'select'"
        >
          <template #icon
            ><n-icon><Edit /></n-icon
          ></template>
          {{ t('creation_hub.banner_ranking.edit_selection') }}
        </n-button>
        <n-button
          type="primary"
          size="large"
          @click="showPreview = true"
          ><template #icon
            ><n-icon><Image /></n-icon></template
          >{{ t('creation_hub.banner_ranking.preview') }}</n-button
        >
      </div>
    </template>

    <n-modal
      v-model:show="showReplacement"
      @after-leave="replacementId = null"
    >
      <n-card
        role="dialog"
        :title="t('creation_hub.banner_ranking.replace_title')"
        class="flex max-h-dvh w-full max-w-none flex-col overflow-hidden rounded-2xl sm:max-h-[calc(100dvh-24px)] sm:w-[calc(100vw-24px)] sm:max-w-2xl lg:max-h-[calc(100dvh-64px)] lg:max-w-xl"
        content-class="min-h-0 min-w-0 flex-1 overflow-hidden p-0"
        closable
        @close="closeReplacement"
      >
        <div class="flex h-full min-h-0 flex-col overflow-hidden">
          <div
            v-if="replacementBanner"
            class="border-b border-slate-200 p-3 dark:border-slate-700"
          >
            <div class="mx-auto flex w-full max-w-2xl items-center gap-3">
              <NuxtImg
                :src="replacementBanner.image"
                :alt="replacementBanner.name"
                preset="bannerThumb"
                sizes="300px"
                class="aspect-2/1 w-28 shrink-0 rounded-lg object-cover sm:w-36"
                :style="getBannerFocalPointStyle(replacementBanner.bannerId)"
                @load="
                  applyBannerFocalPoint($event, replacementBanner.bannerId)
                "
              />
              <div class="min-w-0">
                <p
                  class="truncate font-semibold text-slate-900 dark:text-slate-50"
                >
                  {{ replacementBanner.name }}
                </p>
                <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {{
                    t('creation_hub.banner_ranking.replace_description', {
                      name: replacementBanner.name,
                    })
                  }}
                </p>
              </div>
            </div>
          </div>

          <n-scrollbar class="min-h-0 flex-1">
            <div
              class="mx-auto grid w-full max-w-2xl grid-cols-2 gap-2 p-3 sm:p-5"
            >
              <button
                v-for="banner in selectedBanners"
                :key="banner.bannerId"
                type="button"
                class="group relative aspect-2/1 min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-left shadow-xs transition-[border-color,box-shadow] hover:border-rose-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800"
                :aria-label="
                  t('creation_hub.banner_ranking.replace_with', {
                    name: banner.name,
                  })
                "
                @click="replaceBanner(banner.bannerId)"
              >
                <NuxtImg
                  :src="banner.image"
                  :alt="banner.name"
                  preset="bannerThumb"
                  sizes="300px"
                  class="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transform-none"
                  :style="getBannerFocalPointStyle(banner.bannerId)"
                  @load="applyBannerFocalPoint($event, banner.bannerId)"
                />
                <div
                  class="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-900/10 to-transparent"
                />
                <span
                  class="absolute inset-x-0 bottom-0 truncate p-2 text-sm font-semibold text-white"
                  >{{ banner.name }}</span
                >
              </button>
            </div>
          </n-scrollbar>
        </div>
      </n-card>
    </n-modal>

    <n-modal v-model:show="showPreview">
      <n-card
        role="dialog"
        :title="t('creation_hub.banner_ranking.preview')"
        class="flex max-h-dvh w-full max-w-none flex-col overflow-hidden rounded-2xl sm:max-h-[calc(100dvh-24px)] sm:w-[calc(100vw-24px)] sm:max-w-2xl lg:max-h-[calc(100dvh-64px)] lg:max-w-lg"
        content-class="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5"
        closable
        @close="showPreview = false"
      >
        <BannerRankingPoster :banners="rankedBanners" />
        <n-button
          type="primary"
          block
          class="mt-4"
          :loading="exporting"
          @click="downloadPoster"
          ><template #icon
            ><n-icon><Download /></n-icon></template
          >{{ t('common.export_as_image') }}</n-button
        >
      </n-card>
    </n-modal>

    <div
      inert
      class="pointer-events-none fixed top-0 left-[-10000px]"
      aria-hidden="true"
    >
      <BannerRankingPoster
        ref="exportPoster"
        export-mode
        :banners="rankedBanners"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    Bars,
    Check,
    Download,
    Edit,
    Image,
    Search,
  } from '@vicons/fa'
  import Sortable from 'sortablejs'
  import { BANNER_DATA } from '~~/data/banners'

  type RankingScope = 'limited' | 'five' | 'four'
  type RankingDraft = {
    selectedIds: number[]
    rankedIds: number[]
  }
  type RankingState = Record<RankingScope, RankingDraft>
  type BannerCandidate = {
    bannerId: number
    name: string
    image: string
    version: string
    versionName: string
    outfitNames: string[]
    bannerType: number
  }

  const STORAGE_KEY = 'gongeous-studio-ranking'
  const { t } = useI18n()
  const { getImageSrc } = imageProvider()
  const catalog = useCatalogIndex()
  const message = useMessage()
  const activeScope = ref<RankingScope | null>(null)
  const phase = ref<'select' | 'rank'>('select')
  const query = ref('')
  const version = ref<string | null>(null)
  const showPreview = ref(false)
  const showReplacement = ref(false)
  const replacementId = ref<number | null>(null)
  const exporting = ref(false)
  const rankList = ref<HTMLElement | null>(null)
  const rankBadgeClass = (rank: number) => {
    if (rank === 1) return 'border-amber-300 bg-amber-100 text-amber-800'
    if (rank === 2) return 'border-slate-300 bg-slate-100 text-slate-700'
    if (rank === 3) return 'border-orange-300 bg-orange-100 text-orange-800'
    return 'border-rose-200 bg-white text-rose-600'
  }
  const exportPoster = ref<{ $el: HTMLElement } | null>(null)
  let sortable: Sortable | null = null
  let sortableInitToken = 0
  let rankRefreshFrame: number | null = null
  let dragClientY: number | null = null
  let edgeScrollFrame = 0
  let edgeScrollActive = false
  let edgeScrollContainer: HTMLElement | null = null
  const drafts = reactive<RankingState>({
    limited: { selectedIds: [], rankedIds: [] },
    five: { selectedIds: [], rankedIds: [] },
    four: { selectedIds: [], rankedIds: [] },
  })

  const outfitNames = computed(
    () =>
      new Map(
        (catalog.index.value?.outfits ?? []).map((outfit) => [
          String(outfit.id),
          t(`outfit.${outfit.id}.name`),
        ])
      )
  )
  const allCandidates = computed<BannerCandidate[]>(() =>
    Object.values(BANNER_DATA)
      .filter((banner) => banner.bannerType !== 1 && banner.runs.length > 0)
      .map((banner) => {
        const version = toMajorMinorVersion(banner.runs[0]?.version ?? '') ?? ''
        return {
          bannerId: banner.bannerId,
          name: t(`banner.${banner.bannerId}.name`),
          image: getImageSrc('bannerThumb', banner.bannerId),
          version,
          versionName: t(`version.${version}`),
          outfitNames: [...banner.outfit5StarId, ...banner.outfit4StarId]
            .map((id) => outfitNames.value.get(String(id)))
            .filter((name): name is string => Boolean(name)),
          bannerType: banner.bannerType,
        }
      })
      .sort((left, right) => right.bannerId - left.bannerId)
  )
  const candidates = computed(() =>
    allCandidates.value.filter((banner) =>
      activeScope.value === 'five'
        ? banner.bannerType === 2
        : activeScope.value === 'four'
          ? banner.bannerType === 3
          : true
    )
  )
  const currentDraft = computed(() => drafts[activeScope.value ?? 'limited'])
  const selectedIds = computed(() => currentDraft.value.selectedIds)
  const selectedBanners = computed(() =>
    selectedIds.value
      .map((id) => candidates.value.find((banner) => banner.bannerId === id))
      .filter((banner): banner is BannerCandidate => Boolean(banner))
  )
  const replacementBanner = computed(() =>
    replacementId.value == null
      ? null
      : (candidates.value.find(
          (banner) => banner.bannerId === replacementId.value
        ) ?? null)
  )
  const rankedBanners = computed(() =>
    currentDraft.value.rankedIds
      .map((id) => candidates.value.find((banner) => banner.bannerId === id))
      .filter((banner): banner is BannerCandidate => Boolean(banner))
  )
  const availableVersions = computed(() =>
    getFirstRunVersions(Object.values(BANNER_DATA).map((banner) => banner.runs))
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
  const filteredCandidates = computed(() => {
    const needle = query.value.trim().toLocaleLowerCase()
    return candidates.value.filter(
      (banner) =>
        (!version.value ||
          matchesVersionFilter(banner.version, version.value)) &&
        (!needle ||
          `${banner.name} ${banner.outfitNames.join(' ')}`
            .toLocaleLowerCase()
            .includes(needle))
    )
  })
  const scopeOptions = computed(() =>
    (['limited', 'five', 'four'] as RankingScope[]).map((value) => {
      const scoped = allCandidates.value.filter((banner) =>
        value === 'five'
          ? banner.bannerType === 2
          : value === 'four'
            ? banner.bannerType === 3
            : true
      )
      return {
        value,
        label: t(`creation_hub.banner_ranking.scope_${value}`),
        description: t(
          `creation_hub.banner_ranking.scope_${value}_description`
        ),
        preview: scoped.slice(0, 3),
      }
    })
  )

  const persist = () => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
    } catch {
      // Storage can be unavailable in private or restricted browser contexts.
    }
  }
  const chooseScope = (scope: RankingScope) => {
    activeScope.value = scope
    phase.value = drafts[scope].rankedIds.length === 10 ? 'rank' : 'select'
    query.value = ''
    version.value = null
  }
  const isSelected = (id: number) => selectedIds.value.includes(id)
  const toggleBanner = (id: number) => {
    const ids = currentDraft.value.selectedIds
    const index = ids.indexOf(id)
    if (index >= 0) ids.splice(index, 1)
    else if (ids.length < 10) ids.push(id)
    else {
      replacementId.value = id
      showReplacement.value = true
      return
    }
    persist()
  }
  const closeReplacement = () => {
    showReplacement.value = false
  }
  const replaceBanner = (selectedId: number) => {
    const incomingId = replacementId.value
    if (incomingId == null || selectedId === incomingId) return

    const selectedIndex = currentDraft.value.selectedIds.indexOf(selectedId)
    if (selectedIndex < 0) return
    currentDraft.value.selectedIds.splice(selectedIndex, 1, incomingId)

    const rankedIndex = currentDraft.value.rankedIds.indexOf(selectedId)
    if (rankedIndex >= 0)
      currentDraft.value.rankedIds.splice(rankedIndex, 1, incomingId)

    persist()
    closeReplacement()
  }
  const startRanking = () => {
    if (selectedIds.value.length !== 10) return
    const retained = currentDraft.value.rankedIds.filter((id) =>
      selectedIds.value.includes(id)
    )
    currentDraft.value.rankedIds = retained.concat(
      selectedIds.value.filter((id) => !retained.includes(id))
    )
    phase.value = 'rank'
    persist()
  }
  const move = (from: number, to: number) => {
    if (to < 0 || to >= currentDraft.value.rankedIds.length) return
    const [id] = currentDraft.value.rankedIds.splice(from, 1)
    if (id != null) currentDraft.value.rankedIds.splice(to, 0, id)
    persist()
  }
  const resetRanking = () => {
    currentDraft.value.rankedIds = [...currentDraft.value.selectedIds]
    persist()
  }
  const refreshDragRanks = () => {
    rankRefreshFrame = null
    const items = Array.from(
      rankList.value?.querySelectorAll<HTMLElement>('[data-rank-item]') ?? []
    )
    items.forEach((item, index) => {
      const number = item.querySelector<HTMLElement>('[data-rank-number]')
      if (number) {
        const rank = String(index + 1)
        number.textContent = rank
        number.dataset.rank = rank
      }
    })

    const fallback = document.querySelector<HTMLElement>(
      '.\\!opacity-100[data-rank-item]'
    )
    const fallbackId = fallback?.dataset.id
    if (!fallback || !fallbackId) return
    const fallbackRank = items.findIndex(
      (item) => item.dataset.id === fallbackId
    )
    const fallbackNumber =
      fallback.querySelector<HTMLElement>('[data-rank-number]')
    if (fallbackNumber && fallbackRank >= 0) {
      const rank = String(fallbackRank + 1)
      fallbackNumber.textContent = rank
      fallbackNumber.dataset.rank = rank
    }
  }
  const scheduleDragRankRefresh = () => {
    if (rankRefreshFrame != null) cancelAnimationFrame(rankRefreshFrame)
    rankRefreshFrame = requestAnimationFrame(refreshDragRanks)
  }
  const pointerClientY = (event?: Event | null) => {
    if (!event) return null
    const touchEvent = event as TouchEvent
    const touch = touchEvent.touches?.[0] ?? touchEvent.changedTouches?.[0]
    if (touch) return touch.clientY
    const clientY = (event as MouseEvent).clientY
    return Number.isFinite(clientY) ? clientY : null
  }
  const updateDragClientY = (event: Event) => {
    const next = pointerClientY(event)
    if (next !== null) dragClientY = next
  }
  const findScrollContainer = () => {
    const layoutScrollContainer =
      rankList.value?.closest<HTMLElement>('.n-layout-scroll-container') ?? null
    if (layoutScrollContainer) return layoutScrollContainer

    let element = rankList.value?.parentElement ?? null
    while (element) {
      const overflowY = window.getComputedStyle(element).overflowY
      if (
        /auto|scroll|overlay/.test(overflowY) &&
        element.scrollHeight > element.clientHeight
      )
        return element
      element = element.parentElement
    }
    return null
  }
  const runEdgeScroll = () => {
    if (!edgeScrollActive) return
    if (dragClientY !== null) {
      const actionBar = document.querySelector<HTMLElement>(
        '[data-ranking-actions]'
      )
      const scrollBounds = edgeScrollContainer?.getBoundingClientRect()
      const visibleTop = Math.max(0, scrollBounds?.top ?? 0)
      const actionBarTop = actionBar?.getClientRects().length
        ? actionBar.getBoundingClientRect().top
        : window.innerHeight
      const visibleBottom = Math.min(
        window.innerHeight,
        scrollBounds?.bottom ?? window.innerHeight,
        actionBarTop
      )
      const threshold = 96
      const maxStep = 18
      let step = 0
      if (dragClientY < visibleTop + threshold) {
        const strength = Math.min(
          1,
          Math.max(0, (visibleTop + threshold - dragClientY) / threshold)
        )
        step = -Math.max(4, maxStep * strength)
      } else if (dragClientY > visibleBottom - threshold) {
        const strength = Math.min(
          1,
          Math.max(0, (dragClientY - visibleBottom + threshold) / threshold)
        )
        step = Math.max(4, maxStep * strength)
      }
      const rankingBounds = rankList.value?.getBoundingClientRect()
      if (step < 0 && rankingBounds) {
        step = -Math.min(-step, Math.max(0, visibleTop - rankingBounds.top))
      } else if (step > 0 && rankingBounds) {
        step = Math.min(step, Math.max(0, rankingBounds.bottom - visibleBottom))
      }
      if (step) {
        if (edgeScrollContainer) edgeScrollContainer.scrollTop += step
        else window.scrollBy(0, step)
      }
    }
    edgeScrollFrame = window.requestAnimationFrame(runEdgeScroll)
  }
  const stopEdgeScroll = () => {
    edgeScrollActive = false
    dragClientY = null
    edgeScrollContainer = null
    if (edgeScrollFrame) window.cancelAnimationFrame(edgeScrollFrame)
    edgeScrollFrame = 0
    document.removeEventListener('pointermove', updateDragClientY, true)
    document.removeEventListener('touchmove', updateDragClientY, true)
    document.removeEventListener('mousemove', updateDragClientY, true)
  }
  const startEdgeScroll = (event: { originalEvent?: Event }) => {
    stopEdgeScroll()
    scheduleDragRankRefresh()
    edgeScrollContainer = findScrollContainer()
    dragClientY = pointerClientY(event.originalEvent)
    edgeScrollActive = true
    document.addEventListener('pointermove', updateDragClientY, {
      capture: true,
      passive: true,
    })
    document.addEventListener('touchmove', updateDragClientY, {
      capture: true,
      passive: true,
    })
    document.addEventListener('mousemove', updateDragClientY, {
      capture: true,
      passive: true,
    })
    edgeScrollFrame = window.requestAnimationFrame(runEdgeScroll)
  }
  const destroySortable = () => {
    sortableInitToken += 1
    stopEdgeScroll()
    if (rankRefreshFrame != null) cancelAnimationFrame(rankRefreshFrame)
    rankRefreshFrame = null
    sortable?.destroy()
    sortable = null
  }
  const initSortable = async () => {
    const initToken = ++sortableInitToken
    await nextTick()
    if (
      initToken !== sortableInitToken ||
      !rankList.value ||
      !activeScope.value ||
      phase.value !== 'rank'
    )
      return

    sortable?.destroy()
    sortable = Sortable.create(rankList.value, {
      animation: 160,
      handle: '.rank-handle',
      draggable: '[data-rank-item]',
      forceFallback: true,
      fallbackOnBody: true,
      fallbackTolerance: 3,
      ghostClass: 'opacity-40',
      fallbackClass: '!opacity-100',
      scroll: false,
      onChoose: startEdgeScroll,
      onUnchoose: stopEdgeScroll,
      onMove: (_event, originalEvent) => {
        updateDragClientY(originalEvent)
        scheduleDragRankRefresh()
      },
      onChange: scheduleDragRankRefresh,
      onSort: scheduleDragRankRefresh,
      onEnd: ({ oldIndex, newIndex }) => {
        stopEdgeScroll()
        if (oldIndex != null && newIndex != null) move(oldIndex, newIndex)
        scheduleDragRankRefresh()
      },
    })
  }
  const downloadPoster = async () => {
    const element = exportPoster.value?.$el
    if (!element) return
    exporting.value = true
    try {
      await exportToPng(element, t('creation_hub.banner_ranking.export_name'))
    } catch {
      message.error(t('common.error'))
    } finally {
      exporting.value = false
    }
  }

  onMounted(async () => {
    let stored: string | null = null
    try {
      stored = localStorage.getItem(STORAGE_KEY)
    } catch {
      // Continue without persistence when browser storage is unavailable.
    }
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<RankingState>
        for (const scope of ['limited', 'five', 'four'] as RankingScope[]) {
          const storedDraft = parsed[scope]
          if (!storedDraft) continue
          const isInScope = (id: number) => {
            const banner = BANNER_DATA[id]
            if (!banner || banner.bannerType === 1 || !banner.runs.length)
              return false
            if (scope === 'five') return banner.bannerType === 2
            if (scope === 'four') return banner.bannerType === 3
            return true
          }
          const normalizeIds = (value: unknown) =>
            Array.isArray(value)
              ? Array.from(
                  new Set(
                    value.filter(
                      (id): id is number =>
                        Number.isInteger(id) && isInScope(id as number)
                    )
                  )
                ).slice(0, 10)
              : []
          const selectedIds = normalizeIds(storedDraft.selectedIds)
          const rankedIds = normalizeIds(storedDraft.rankedIds).filter((id) =>
            selectedIds.includes(id)
          )
          drafts[scope] = {
            selectedIds,
            rankedIds,
          }
        }
      } catch {
        // Ignore malformed or outdated local state and keep safe defaults.
      }
    }
    await catalog.load(['outfits'])
  })
  watch(
    [activeScope, phase],
    ([scope, currentPhase]) => {
      if (scope && currentPhase === 'rank') void initSortable()
      else destroySortable()
    },
    { flush: 'post' }
  )
  onBeforeUnmount(destroySortable)
</script>
