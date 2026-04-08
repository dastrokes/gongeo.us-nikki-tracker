<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <!-- Hero / Search Header -->
    <div
      :class="[
        'transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col w-full z-10',
        hasSearched
          ? 'pt-6 pb-6 sm:pt-8 md:pt-10 sm:pb-8 items-start'
          : 'flex-1 justify-center items-center pb-32 pt-24 sm:pt-32 md:pt-40',
      ]"
    >
      <div
        :class="[
          'transition-all duration-700 w-full',
          hasSearched
            ? 'max-w-full text-left flex flex-col sm:flex-row gap-4 items-center justify-between'
            : 'max-w-2xl text-center px-4',
        ]"
      >
        <div :class="[hasSearched ? 'flex-shrink-0' : 'mb-8']">
          <h1
            :class="[
              'font-black transition-all duration-700 bg-gradient-to-br from-[#c084fc] via-[#f472b6] to-[#fb923c] bg-clip-text text-transparent drop-shadow-sm',
              hasSearched
                ? 'text-2xl sm:text-3xl cursor-pointer'
                : 'text-4xl sm:text-6xl mb-4 animate-fade-in-up motion-reduce:animate-none',
            ]"
            :role="hasSearched ? 'button' : undefined"
            :tabindex="hasSearched ? 0 : undefined"
            @click="hasSearched && clearSearch()"
            @keydown.enter="hasSearched && clearSearch()"
          >
            {{ t('search_page.title') }}
          </h1>
        </div>

        <div
          :class="[
            'w-full transition-all duration-700 delay-100',
            hasSearched ? 'max-w-xl' : 'max-w-2xl animate-fade-in-up',
          ]"
        >
          <form
            class="relative group"
            @submit.prevent="runSearch(true)"
          >
            <div
              class="absolute -inset-1 bg-gradient-to-r from-rose-400 via-fuchsia-500 to-amber-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500 group-focus-within:opacity-50"
            ></div>
            <div
              class="relative flex items-center overflow-hidden rounded-2xl bg-white text-lg shadow-lg ring-1 ring-black/5 transition dark:bg-slate-900 dark:ring-white/10 focus-within:ring-2 focus-within:ring-rose-400/60"
            >
              <n-icon
                class="ml-4 mr-2 text-rose-400"
                size="20"
                ><Search
              /></n-icon>
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="currentPlaceholder"
                :aria-label="t('search_page.title')"
                enterkeyhint="search"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                class="w-full bg-transparent border-none py-4 text-slate-800 focus:outline-none dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                @keydown.esc.prevent="clearSearchQuery"
              />
              <n-button
                v-if="searchQuery"
                quaternary
                circle
                strong
                attr-type="button"
                size="large"
                class="mr-1 !text-slate-400 transition-colors hover:!text-slate-700 dark:!text-slate-500 dark:hover:!text-slate-200"
                :aria-label="t('search_page.clear_query')"
                @click="clearSearchQuery"
              >
                <template #icon>
                  <n-icon><Times /></n-icon>
                </template>
              </n-button>
              <n-button
                type="primary"
                attr-type="submit"
                size="large"
                class="m-1.5 !rounded-xl overflow-hidden after:content-[''] after:absolute after:inset-y-0 after:-left-full after:w-[60%] after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:animate-button-shimmer hover:shadow-md transition-shadow"
                :loading="loading"
              >
                {{ t('common.search') }}
              </n-button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-if="error"
      class="w-full animate-fade-in"
    >
      <n-alert
        type="error"
        :title="t('common.error')"
        :show-icon="true"
        class="rounded-xl shadow-sm"
      >
        {{ error }}
      </n-alert>
    </div>

    <!-- Main Content Area -->
    <div
      v-if="hasSearched && !error"
      class="flex-1 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] transition-all duration-500 animate-fade-in"
    >
      <!-- Results Grid -->
      <div class="gap-4">
        <div
          v-if="loading"
          class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4"
        >
          <div
            v-for="i in 12"
            :key="`search-skeleton-${i}`"
            class="aspect-[2/3] rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse border border-slate-200 dark:border-slate-800"
          />
        </div>

        <div
          v-else-if="hasResults"
          class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4"
        >
          <button
            v-for="(item, index) in displayResults"
            :key="item.id"
            type="button"
            class="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer animate-fade-in-up"
            :style="{ animationDelay: `${Math.min(index, 15) * 0.05}s` }"
            :aria-label="item.itemName"
            :aria-pressed="item.id === selectedId"
            :class="[
              item.id === selectedId
                ? 'ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950 shadow-lg shadow-rose-500/20'
                : '',
            ]"
            @click="setSelected(item.id)"
          >
            <!-- Image Area -->
            <div
              class="relative w-full aspect-[2/3] bg-slate-100 dark:bg-slate-950 overflow-hidden"
            >
              <NuxtImg
                v-if="item.imageSrc"
                :src="item.imageSrc"
                :alt="item.itemName"
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                preset="tallSm"
                fit="cover"
                loading="lazy"
                sizes="100px"
              />
              <div
                v-else
                class="absolute inset-0 flex items-center justify-center opacity-30"
              >
                <n-icon size="40"><Box /></n-icon>
              </div>

              <!-- Gradient & Text Bottom Overlay -->
              <div
                class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-8 pb-3"
              >
                <div
                  class="text-white font-bold leading-tight text-sm line-clamp-2 shadow-black drop-shadow-md"
                >
                  {{ item.itemName }}
                </div>
                <div
                  v-if="item.itemTypeLabel"
                  class="mt-1 text-[9px] uppercase tracking-widest text-rose-300 font-semibold drop-shadow-md"
                >
                  {{ item.itemTypeLabel }}
                </div>
              </div>
            </div>
          </button>
        </div>

        <div
          v-else
          class="flex flex-col min-h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300/60 dark:border-slate-800 bg-white/30 dark:bg-slate-900/40 p-12 text-center backdrop-blur-sm"
        >
          <n-icon
            size="48"
            class="text-slate-300 dark:text-slate-600 mb-4"
            ><Ghost
          /></n-icon>
          <div class="text-sm text-slate-500">
            {{ t('search_page.no_matches') }}
          </div>
        </div>
      </div>

      <!-- Side Details Panel -->
      <div
        v-if="hasResults"
        class="hidden xl:block"
      >
        <div class="sticky top-6">
          <transition
            name="fade"
            mode="out-in"
          >
            <div
              v-if="activeResult"
              :key="activeResult.id"
              class="relative rounded-3xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-2xl shadow-rose-500/5 overflow-hidden flex flex-col items-center"
            >
              <!-- Fancy blurred bg graphic -->
              <div
                class="absolute -top-24 -right-24 w-48 h-48 bg-rose-400/20 rounded-full blur-3xl pointer-events-none"
              ></div>
              <div
                class="absolute -bottom-24 -left-24 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none"
              ></div>

              <div class="w-full relative z-10">
                <!-- Header Image -->
                <div
                  class="relative w-full aspect-[2/3] bg-slate-100 dark:bg-slate-950/50 border-b border-slate-200/50 dark:border-slate-800/50"
                >
                  <NuxtImg
                    v-if="activeResult.imageSrc"
                    :src="activeResult.imageSrc"
                    class="w-full h-full object-cover"
                    preset="tallLg"
                    sizes="200px"
                    fit="cover"
                  />
                  <div
                    v-else
                    class="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600"
                  >
                    <n-icon size="56"><Box /></n-icon>
                  </div>
                  <!-- Confidence metric -->
                  <div
                    v-if="isDev"
                    class="absolute bottom-3 right-3 flex items-center justify-center gap-1.5 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 px-3 py-1.5 rounded-full shadow-lg border border-white/40 dark:border-slate-700/60"
                  >
                    <div
                      class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"
                    ></div>
                    <span
                      class="text-xs font-black text-slate-800 dark:text-slate-200"
                    >
                      {{ activeResult.matchScoreLabel }}
                    </span>
                  </div>
                </div>

                <!-- Info Content -->
                <div class="p-5 w-full flex flex-col gap-5">
                  <div>
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                      <n-tag
                        v-if="activeResult.itemTypeLabel"
                        size="tiny"
                        round
                        :bordered="false"
                        type="warning"
                        class="font-bold tracking-widest uppercase !text-[9px]"
                      >
                        {{ activeResult.itemTypeLabel }}
                      </n-tag>
                      <n-tag
                        v-if="activeResult.categoryLabel"
                        size="tiny"
                        round
                        :bordered="false"
                        type="default"
                        class="font-semibold"
                      >
                        {{ activeResult.categoryLabel }}
                      </n-tag>
                      <n-tag
                        v-if="activeResult.subcategoryLabel"
                        size="tiny"
                        round
                        :bordered="false"
                        type="success"
                        class="font-semibold"
                      >
                        {{ activeResult.subcategoryLabel }}
                      </n-tag>
                    </div>
                    <h2
                      class="text-xl font-black text-slate-800 dark:text-white leading-tight"
                    >
                      {{ activeResult.itemName }}
                    </h2>
                  </div>

                  <AttributeCard
                    :metadata="activeResult.metadata"
                    :item-type="activeResult.resolvedItemType"
                    layout="compact"
                  />

                  <div class="pt-2 flex flex-col gap-3">
                    <n-button
                      v-if="activeResult.compendiumPath"
                      type="primary"
                      block
                      size="large"
                      class="!rounded-xl shadow-md font-bold"
                      @click="openActiveCompendium"
                    >
                      {{ t('common.view_compendium') }}
                    </n-button>

                    <n-button
                      v-if="
                        activeResult.itemId !== null &&
                        activeResult.supportsFeedback
                      "
                      secondary
                      block
                      size="large"
                      class="!rounded-xl font-bold"
                      @click="openFeedbackModal"
                    >
                      {{ t('feedback.suggest_action') }}
                    </n-button>

                    <div
                      v-if="isDev"
                      class="space-y-2"
                    >
                      <h3
                        class="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                      >
                        JSON
                      </h3>
                      <pre
                        class="overflow-auto rounded-xl bg-slate-950 p-3 text-[10px] leading-4 text-slate-300 max-h-48 scrollbar-thin scrollbar-thumb-slate-800"
                        >{{ activeResult.metadataJson }}</pre
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- Mobile Details Modal -->
    <n-modal
      v-model:show="isMobileModalOpen"
      class="w-[calc(100vw-2rem)] max-w-[400px] !bg-transparent !shadow-none"
    >
      <div
        v-if="activeResult"
        class="relative grid h-[calc(100dvh-2rem)] max-h-[48rem] w-full grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-2xl dark:bg-slate-900/95"
      >
        <div class="absolute right-3 top-3 z-20">
          <n-button
            quaternary
            circle
            strong
            attr-type="button"
            size="small"
            class="!bg-white/80 !text-slate-600 shadow-md backdrop-blur transition-colors hover:!text-slate-900 dark:!bg-slate-900/80 dark:!text-slate-200 dark:hover:!text-white"
            :aria-label="t('search_page.close_details')"
            @click="closeMobileModal"
          >
            <template #icon>
              <n-icon><Times /></n-icon>
            </template>
          </n-button>
        </div>

        <!-- Scrollable Content Wrapper -->
        <div class="relative z-10 min-h-0 overflow-hidden">
          <n-scrollbar
            class="h-full"
            content-style="display: flex; flex-direction: column;"
          >
            <!-- Header Image -->
            <div
              class="relative w-full aspect-[2/3] bg-slate-100 dark:bg-slate-950/50 flex overflow-hidden items-center justify-center shrink-0"
            >
              <NuxtImg
                v-if="activeResult.imageSrc"
                :src="activeResult.imageSrc"
                class="absolute inset-0 w-full h-full object-cover"
                preset="tallLg"
                sizes="200px"
                fit="cover"
              />
              <div
                v-else
                class="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600"
              >
                <n-icon size="56"><Box /></n-icon>
              </div>
              <div
                v-if="isDev"
                class="absolute bottom-3 right-3 flex items-center justify-center gap-1.5 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 px-3 py-1.5 rounded-full shadow-lg border border-white/40 dark:border-slate-700/60"
              >
                <div
                  class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"
                ></div>
                <span
                  class="text-xs font-black text-slate-800 dark:text-slate-200"
                >
                  {{ activeResult.matchScoreLabel }}
                </span>
              </div>
            </div>

            <!-- Info Content -->
            <div class="p-5 w-full flex flex-col gap-5">
              <div>
                <div class="flex flex-wrap items-center gap-2 mb-1">
                  <n-tag
                    v-if="activeResult.itemTypeLabel"
                    size="tiny"
                    round
                    :bordered="false"
                    type="warning"
                    class="font-bold tracking-widest uppercase !text-[9px]"
                  >
                    {{ activeResult.itemTypeLabel }}
                  </n-tag>
                  <n-tag
                    v-if="activeResult.categoryLabel"
                    size="tiny"
                    round
                    :bordered="false"
                    type="default"
                    class="font-semibold"
                  >
                    {{ activeResult.categoryLabel }}
                  </n-tag>
                  <n-tag
                    v-if="activeResult.subcategoryLabel"
                    size="tiny"
                    round
                    :bordered="false"
                    type="success"
                    class="font-semibold"
                  >
                    {{ activeResult.subcategoryLabel }}
                  </n-tag>
                </div>
                <h2
                  class="text-xl font-black text-slate-800 dark:text-white leading-tight"
                >
                  {{ activeResult.itemName }}
                </h2>
              </div>

              <AttributeCard
                :metadata="activeResult.metadata"
                :item-type="activeResult.resolvedItemType"
                layout="compact"
              />
            </div>
          </n-scrollbar>
        </div>

        <!-- Fixed Bottom Action -->
        <div
          class="w-full p-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-20 shrink-0"
        >
          <div class="flex flex-col gap-3">
            <n-button
              v-if="activeResult.compendiumPath"
              type="primary"
              block
              size="large"
              class="!rounded-xl shadow-md font-bold"
              @click="openActiveCompendium"
            >
              {{ t('common.view_compendium') }}
            </n-button>

            <n-button
              v-if="
                activeResult.itemId !== null && activeResult.supportsFeedback
              "
              secondary
              block
              size="large"
              class="!rounded-xl font-bold"
              @click="openFeedbackModal"
            >
              {{ t('feedback.suggest_action') }}
            </n-button>
          </div>
        </div>
      </div>
    </n-modal>

    <FeedbackSubmitModal
      v-if="feedbackModalTarget"
      v-model:show="showFeedbackModal"
      :item-id="feedbackModalTarget.itemId"
      :item-name="feedbackModalTarget.itemName"
      :item-type="feedbackModalTarget.itemType"
      :metadata="feedbackModalTarget.metadata"
    />
  </div>
</template>

<script setup lang="ts">
  import { breakpointsTailwind } from '@vueuse/core'
  import { Search, Box, Ghost, Times } from '@vicons/fa'
  import type { ItemSearchMetadata } from '#shared/types/itemSearch'
  import { isItemSearchFieldKey } from '#shared/utils/itemSearch'
  import { normalizeSearchQuery } from '#shared/utils/searchQuery'

  type SearchHit = {
    id: string
    itemId: number | null
    itemType: string | null
    category: string | null
    subcategory: string | null
    score: number
    metadata: ItemSearchMetadata | null
  }

  type SearchApiResponse = {
    query: string
    total: number
    data: SearchHit[]
  }

  type SearchDisplayHit = SearchHit & {
    resolvedItemType: string | null
    itemName: string
    itemTypeLabel: string
    categoryLabel: string
    subcategoryLabel: string
    imageSrc: string | null
    matchScoreLabel: string
    compendiumPath: string | null
    metadataJson: string
    supportsFeedback: boolean
  }

  type FeedbackModalTarget = {
    itemId: number
    itemName: string
    itemType: string | null
    metadata: ItemSearchMetadata | null
  }

  type ActiveSearch = {
    key: string
    controller: AbortController
  }

  const { t, locale } = useI18n()
  const { translateFilterToken } = useFilterToken()
  const route = useRoute()
  const router = useRouter()
  const localePath = useLocalePath()
  const { fetchItemById } = useSupabaseItems()
  const { getImageSrc } = imageProvider()
  const isDev = import.meta.dev
  const gameVersionHeaders = getGameVersionRequestHeaders()
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const isDesktopDetails = breakpoints.greaterOrEqual('xl')

  // Rotating placeholder examples built from existing filter locale keys
  const PLACEHOLDER_EXAMPLES: string[][] = [
    ['sleeve_style.puff_sleeve', 'category.tops.blouse'],
    ['structure.pleated', 'bottom_length.mini', 'category.bottoms.skirt'],
    ['category.handhelds.handheld', 'category.handhelds.weapon'],
    ['ornament.bow', 'ornament.tie', 'category.headwear.hair_ornament'],
    ['dress_silhouette.mermaid', 'subcategory.dresses.gown'],
    ['ornament.flower', 'subcategory.hairAccessories.hairpin'],
    ['ornament.embroidery', 'category.shoes.flats'],
    ['bangs.wispy_bangs', 'category.hair.twin_tails'],
  ]

  const exampleIndex = ref(0)

  const currentExample = computed(() => {
    const isCJK = ['zh', 'tw', 'ja', 'ko'].includes(locale.value)
    return (PLACEHOLDER_EXAMPLES[exampleIndex.value] ?? [])
      .map((path) => t(`filter.${path}`))
      .join(isCJK ? '' : ' ')
  })

  const targetPlaceholder = computed(() =>
    t('search_page.placeholder', { example: currentExample.value })
  )

  const typedCharCount = ref(0)
  const isTypingFinished = ref(false)

  const currentPlaceholder = computed(() => {
    if (isTypingFinished.value) return targetPlaceholder.value
    return targetPlaceholder.value.substring(0, typedCharCount.value)
  })

  let typeInterval: ReturnType<typeof setInterval> | null = null
  let activeSearch: ActiveSearch | null = null
  let lastCompletedSearchKey: string | null = null

  const stopPlaceholderTyping = () => {
    if (!typeInterval) return
    clearInterval(typeInterval)
    typeInterval = null
  }

  const restartPlaceholderTyping = () => {
    stopPlaceholderTyping()
    typedCharCount.value = 0
    isTypingFinished.value = false

    typeInterval = setInterval(() => {
      if (typedCharCount.value < targetPlaceholder.value.length) {
        typedCharCount.value++
        return
      }

      isTypingFinished.value = true
      stopPlaceholderTyping()
    }, 50)
  }

  const cancelActiveSearch = () => {
    if (!activeSearch) return
    activeSearch.controller.abort()
    activeSearch = null
  }

  onMounted(() => {
    exampleIndex.value = Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)
    restartPlaceholderTyping()
  })

  onUnmounted(() => {
    stopPlaceholderTyping()
    cancelActiveSearch()
  })

  const searchQuery = ref(route.query.q?.toString() ?? '')
  const hasSearched = ref(!!route.query.q)
  const results = ref<SearchHit[]>([])
  const selectedId = ref<string | null>(null)
  const isMobileModalOpen = ref(false)
  const loading = ref(false)
  const error = ref('')
  const showFeedbackModal = ref(false)
  const feedbackModalTarget = ref<FeedbackModalTarget | null>(null)
  useSeoMeta({
    title: () =>
      `${t('search_page.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogTitle: () =>
      `${t('search_page.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterTitle: () =>
      `${t('search_page.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
  })

  const getResolvedItemType = (
    item: Pick<SearchHit, 'itemType' | 'metadata'>
  ) => item.itemType ?? item.metadata?.item_type ?? null

  const getItemName = (item: Pick<SearchHit, 'id' | 'itemId'>) => {
    if (item.itemId !== null) {
      return t(`item.${item.itemId}.name`)
    }

    return item.id
  }

  const getItemTypeLabel = (value?: string | null) => {
    if (!value) return ''
    const normalized = normalizeItemSearchItemType(value)
    const key = `type.${normalized}`
    const translated = t(key)
    return translated !== key ? translated : humanizeItemSearchToken(normalized)
  }

  const formatMatchScore = (score: number) =>
    t('search_page.match_score', {
      score: (Math.max(score, 0) * 100).toFixed(1),
    })

  const buildCompendiumPath = (itemId: number | null) =>
    itemId !== null ? localePath(`/items/${itemId}`) : null

  const displayResults = computed<SearchDisplayHit[]>(() =>
    results.value.map((item) => {
      const resolvedItemType = getResolvedItemType(item)

      return {
        ...item,
        resolvedItemType,
        itemName: getItemName(item),
        itemTypeLabel: getItemTypeLabel(resolvedItemType),
        categoryLabel: item.category
          ? translateFilterToken('category', item.category, resolvedItemType)
          : '',
        subcategoryLabel: item.subcategory
          ? translateFilterToken(
              'subcategory',
              item.subcategory,
              resolvedItemType
            )
          : '',
        imageSrc:
          item.itemId !== null ? getImageSrc('item', item.itemId) : null,
        matchScoreLabel: formatMatchScore(item.score),
        compendiumPath: buildCompendiumPath(item.itemId),
        metadataJson: isDev
          ? formatMetadata(item.metadata, resolvedItemType)
          : '',
        supportsFeedback:
          item.itemId !== null &&
          isSupportedItemSearchItemType(resolvedItemType),
      }
    })
  )

  const hasResults = computed(() => displayResults.value.length > 0)

  const activeResult = computed<SearchDisplayHit | null>(
    () =>
      displayResults.value.find((item) => item.id === selectedId.value) ??
      displayResults.value[0] ??
      null
  )

  const activeFeedbackResult = computed(() => {
    const currentResult = activeResult.value
    if (!currentResult || currentResult.itemId === null) {
      return null
    }

    return currentResult
  })

  const setSelected = (id: string) => {
    selectedId.value = id
    if (!isDesktopDetails.value) {
      isMobileModalOpen.value = true
    }
  }

  const resetSearchState = () => {
    cancelActiveSearch()
    lastCompletedSearchKey = null
    results.value = []
    selectedId.value = null
    loading.value = false
    error.value = ''
    hasSearched.value = false
    isMobileModalOpen.value = false
    showFeedbackModal.value = false
    feedbackModalTarget.value = null
  }

  const updateSearchRoute = async (query: string | null) => {
    const nextQuery = { ...route.query }

    if (query) {
      nextQuery.q = query
    } else {
      delete nextQuery.q
    }

    await router.replace({ query: nextQuery })
  }

  const clearSearch = async () => {
    searchQuery.value = ''
    resetSearchState()
    restartPlaceholderTyping()
    await updateSearchRoute(null)
  }

  const clearSearchQuery = async () => {
    if (!searchQuery.value && !hasSearched.value) return

    if (hasSearched.value || route.query.q) {
      await clearSearch()
      return
    }

    searchQuery.value = ''
    restartPlaceholderTyping()
  }

  const closeMobileModal = () => {
    isMobileModalOpen.value = false
  }

  const openFeedbackModal = async () => {
    const currentResult = activeFeedbackResult.value
    if (!currentResult || !currentResult.supportsFeedback) return

    const nextTarget: FeedbackModalTarget = {
      itemId: currentResult.itemId,
      itemName: currentResult.itemName,
      itemType: currentResult.resolvedItemType,
      metadata: currentResult.metadata,
    }

    try {
      const item = await fetchItemById(currentResult.itemId)
      if (item) {
        nextTarget.itemType = item.type ?? nextTarget.itemType
        nextTarget.metadata =
          getItemSearchMetadataFromAttributes(item.item_attributes ?? null) ??
          nextTarget.metadata
      }
    } catch (caughtError) {
      const message = toErrorMessage(
        caughtError,
        `Failed to hydrate feedback metadata for item ${currentResult.itemId}`
      )
      console.error(
        `Failed to hydrate feedback metadata for item ${currentResult.itemId}: ${message}`
      )
    }

    feedbackModalTarget.value = nextTarget
    isMobileModalOpen.value = false
    showFeedbackModal.value = true
  }

  const buildMetadataDisplayPayload = (
    metadata: ItemSearchMetadata,
    itemType?: string | null
  ) => {
    const payload: Record<string, unknown> = {}
    const resolvedItemType =
      typeof itemType === 'string' && itemType.trim()
        ? itemType.trim()
        : typeof metadata.item_type === 'string'
          ? metadata.item_type.trim()
          : ''
    const schemaFields = new Set(
      getItemSearchSchemaFields(resolvedItemType || metadata.slot)
    )

    schemaFields.forEach((field) => {
      if (isItemSearchArrayField(field)) {
        const normalized = Array.isArray(metadata[field])
          ? metadata[field]
              .filter((entry): entry is string => typeof entry === 'string')
              .map((entry) => entry.trim())
              .filter(Boolean)
          : []
        if (normalized.length > 0) {
          payload[field] = normalized
        }
        return
      }

      const normalized =
        typeof metadata[field] === 'string'
          ? metadata[field].trim() || null
          : (metadata[field] ?? null)
      if (normalized !== null && normalized !== undefined) {
        payload[field] = normalized
      }
    })

    Object.entries(metadata).forEach(([key, value]) => {
      if (key === 'item_id' || key === 'item_type' || key === 'slot') return
      if (isItemSearchFieldKey(key) && !schemaFields.has(key)) return
      if (value === null || value === undefined) return

      if (Array.isArray(value)) {
        const normalized = value
          .filter((entry): entry is string => typeof entry === 'string')
          .map((entry) => entry.trim())
          .filter(Boolean)

        if (normalized.length > 0) {
          payload[key] = normalized
        }
        return
      }

      if (typeof value === 'string') {
        const normalized = value.trim()
        if (normalized) {
          payload[key] = normalized
        }
        return
      }

      payload[key] = value
    })

    return payload
  }

  const formatMetadata = (
    metadata: ItemSearchMetadata | null,
    itemType?: string | null
  ) =>
    JSON.stringify(
      metadata ? buildMetadataDisplayPayload(metadata, itemType) : {},
      null,
      2
    )

  const openActiveCompendium = async () => {
    if (!activeResult.value?.compendiumPath) return

    closeMobileModal()
    await navigateTo(activeResult.value.compendiumPath)
  }

  const getSearchRequestKey = (query: string) => `${locale.value}:${query}`

  const shouldSkipSearch = (searchKey: string) =>
    searchKey === activeSearch?.key || searchKey === lastCompletedSearchKey

  const applySearchResults = (nextResults: SearchHit[]) => {
    results.value = nextResults
    selectedId.value =
      nextResults.find((item) => item.id === selectedId.value)?.id ??
      nextResults[0]?.id ??
      null
    isMobileModalOpen.value = false
    showFeedbackModal.value = false
    feedbackModalTarget.value = null
  }

  const resolveNormalizedSearchQuery = (pushToUrl: boolean) => {
    const normalizedQuery = normalizeSearchQuery(searchQuery.value)
    if (normalizedQuery) {
      return normalizedQuery
    }

    if (!pushToUrl) {
      return null
    }

    // Use current placeholder example as the query and cycle to the next.
    searchQuery.value = currentExample.value
    exampleIndex.value = (exampleIndex.value + 1) % PLACEHOLDER_EXAMPLES.length
    isTypingFinished.value = true

    return normalizeSearchQuery(searchQuery.value)
  }

  const runSearch = async (pushToUrl = false) => {
    const normalizedQuery = resolveNormalizedSearchQuery(pushToUrl)
    if (!normalizedQuery) {
      return
    }

    const searchKey = getSearchRequestKey(normalizedQuery)
    hasSearched.value = true
    error.value = ''

    if (shouldSkipSearch(searchKey)) {
      return
    }

    let search: ActiveSearch | null = null

    try {
      if (pushToUrl && route.query.q?.toString() !== normalizedQuery) {
        await updateSearchRoute(normalizedQuery)
      }

      if (shouldSkipSearch(searchKey)) {
        return
      }

      cancelActiveSearch()
      search = {
        key: searchKey,
        controller: new AbortController(),
      }
      activeSearch = search
      loading.value = true

      const response = await $fetch<SearchApiResponse>('/api/search/items', {
        query: {
          q: normalizedQuery,
          lang: locale.value,
        },
        headers: gameVersionHeaders,
        signal: search.controller.signal,
      })

      if (activeSearch !== search) return

      lastCompletedSearchKey = search.key
      applySearchResults((response.data ?? []).filter((item) => item.score > 0))
    } catch (caughtError) {
      if (
        !search ||
        search.controller.signal.aborted ||
        activeSearch !== search
      ) {
        return
      }

      applySearchResults([])
      error.value = toErrorMessage(
        caughtError,
        t('search_page.error_description')
      )
    } finally {
      if (activeSearch === search) {
        loading.value = false
        activeSearch = null
      }
    }
  }

  watch(targetPlaceholder, (nextPlaceholder, previousPlaceholder) => {
    if (
      nextPlaceholder !== previousPlaceholder &&
      !normalizeSearchQuery(searchQuery.value)
    ) {
      restartPlaceholderTyping()
    }
  })

  watch(isDesktopDetails, (isDesktop) => {
    if (isDesktop) {
      isMobileModalOpen.value = false
    }
  })

  watch(activeResult, (nextResult) => {
    if (!nextResult) {
      isMobileModalOpen.value = false
    }
  })

  watch(locale, () => {
    if (normalizeSearchQuery(searchQuery.value)) {
      void runSearch(false)
    }
  })

  watch(
    () => route.query.q?.toString() ?? '',
    (nextQuery, previousQuery) => {
      const normalizedNextQuery = normalizeSearchQuery(nextQuery)
      const normalizedCurrentQuery = normalizeSearchQuery(searchQuery.value)

      if (nextQuery && nextQuery !== normalizedNextQuery) {
        void updateSearchRoute(normalizedNextQuery)
      }

      // Keep the field text as entered when the URL sync only changes casing.
      if (
        previousQuery !== undefined &&
        normalizedNextQuery === normalizedCurrentQuery
      ) {
        return
      }

      searchQuery.value = nextQuery

      if (!normalizedNextQuery) {
        resetSearchState()
        restartPlaceholderTyping()
        return
      }

      void runSearch(false)
    },
    { immediate: true }
  )
</script>
