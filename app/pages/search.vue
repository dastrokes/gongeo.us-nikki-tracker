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
          <div class="relative group">
            <div
              class="absolute -inset-1 bg-gradient-to-r from-rose-400 via-fuchsia-500 to-amber-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500 group-focus-within:opacity-50"
            ></div>
            <div
              class="relative flex items-center bg-white dark:bg-slate-900 rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 overflow-hidden text-lg"
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
                class="w-full bg-transparent border-none focus:outline-none py-4 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                @keyup.enter="runSearch(true)"
              />
              <n-button
                type="primary"
                size="large"
                class="m-1.5 !rounded-xl overflow-hidden after:content-[''] after:absolute after:inset-y-0 after:-left-full after:w-[60%] after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:animate-button-shimmer hover:shadow-md transition-shadow"
                :loading="loading"
                @click="runSearch(true)"
              >
                {{ t('common.search') }}
              </n-button>
            </div>
          </div>
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
        :title="t('search_page.error_title')"
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
          class="flex items-center justify-between text-sm text-slate-500 font-medium"
        >
          <span v-if="!loading && results.length > 0"> </span>
          <span v-else-if="!loading">{{ t('search_page.no_matches') }}</span>
        </div>

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
          v-else-if="results.length > 0"
          class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4"
        >
          <button
            v-for="(item, index) in results"
            :key="item.id"
            type="button"
            class="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer animate-fade-in-up"
            :style="{ animationDelay: `${Math.min(index, 15) * 0.05}s` }"
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
                v-if="item.itemId !== null"
                :src="getImageSrc('item', item.itemId)"
                :alt="getItemName(item)"
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                preset="tallSm"
                width="200"
                height="300"
                fit="cover"
                loading="lazy"
                sizes="100px"
                format="webp"
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
                  {{ getItemName(item) }}
                </div>
                <div
                  v-if="item.itemType || item.metadata?.item_type"
                  class="mt-1 text-[9px] uppercase tracking-widest text-rose-300 font-semibold drop-shadow-md"
                >
                  {{
                    getItemTypeLabel(item.itemType ?? item.metadata?.item_type)
                  }}
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
        v-if="results.length > 0"
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
                    v-if="activeResult.itemId !== null"
                    :src="getImageSrc('item', activeResult.itemId)"
                    class="w-full h-full object-cover"
                    preset="tallLg"
                    width="400"
                    height="600"
                    fit="cover"
                  />
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
                      {{ formatMatchScore(activeResult.score) }}
                    </span>
                  </div>
                </div>

                <!-- Info Content -->
                <div class="p-5 w-full flex flex-col gap-5">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <n-tag
                        v-if="
                          activeResult.itemType ||
                          activeResult.metadata?.item_type
                        "
                        size="tiny"
                        round
                        :bordered="false"
                        type="warning"
                        class="font-bold tracking-widest uppercase !text-[9px]"
                      >
                        {{
                          getItemTypeLabel(
                            activeResult.itemType ??
                              activeResult.metadata?.item_type
                          )
                        }}
                      </n-tag>
                      <n-tag
                        v-if="activeResult.category"
                        size="tiny"
                        round
                        :bordered="false"
                        type="default"
                        class="font-semibold"
                      >
                        {{
                          translateFilterToken(
                            'category',
                            activeResult.category,
                            activeResult.itemType ??
                              activeResult.metadata?.item_type
                          )
                        }}
                      </n-tag>
                      <n-tag
                        v-if="activeResult.subcategory"
                        size="tiny"
                        round
                        :bordered="false"
                        type="success"
                        class="font-semibold"
                      >
                        {{
                          translateFilterToken(
                            'subcategory',
                            activeResult.subcategory,
                            activeResult.itemType ??
                              activeResult.metadata?.item_type
                          )
                        }}
                      </n-tag>
                    </div>
                    <h2
                      class="text-xl font-black text-slate-800 dark:text-white leading-tight"
                    >
                      {{ getItemName(activeResult) }}
                    </h2>
                  </div>

                  <AttributeCard
                    :metadata="activeResult.metadata"
                    :item-type="activeResult.itemType"
                  />

                  <div class="pt-2 flex flex-col gap-3">
                    <n-button
                      v-if="activeResult.itemId !== null"
                      type="primary"
                      block
                      size="large"
                      class="!rounded-xl shadow-md font-bold"
                      @click="
                        navigateTo(localePath(`/items/${activeResult.itemId}`))
                      "
                    >
                      {{ t('search_page.view_compendium') }}
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
                        >{{ formatMetadata(activeResult.metadata) }}</pre
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
      class="w-[80%] max-w-[400px] !bg-transparent !shadow-none"
    >
      <div
        v-if="activeResult"
        class="relative rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-2xl overflow-hidden flex flex-col items-center"
      >
        <div class="w-full relative z-10">
          <!-- Header Image -->
          <div
            class="relative w-full aspect-[2/3] bg-slate-100 dark:bg-slate-950/50 border-b border-slate-200/50 dark:border-slate-800/50 flex overflow-hidden items-center justify-center"
          >
            <NuxtImg
              v-if="activeResult.itemId !== null"
              :src="getImageSrc('item', activeResult.itemId)"
              class="absolute inset-0 w-full h-full object-cover"
              preset="tallLg"
              width="400"
              height="600"
              fit="cover"
            />
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
                {{ formatMatchScore(activeResult.score) }}
              </span>
            </div>
          </div>

          <!-- Info Content -->
          <div class="p-5 w-full flex flex-col gap-5">
            <div>
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <n-tag
                  v-if="
                    activeResult.itemType || activeResult.metadata?.item_type
                  "
                  size="tiny"
                  round
                  :bordered="false"
                  type="warning"
                  class="font-bold tracking-widest uppercase !text-[9px]"
                >
                  {{
                    getItemTypeLabel(
                      activeResult.itemType ?? activeResult.metadata?.item_type
                    )
                  }}
                </n-tag>
                <n-tag
                  v-if="activeResult.category"
                  size="tiny"
                  round
                  :bordered="false"
                  type="default"
                  class="font-semibold"
                >
                  {{
                    translateFilterToken(
                      'category',
                      activeResult.category,
                      activeResult.itemType ?? activeResult.metadata?.item_type
                    )
                  }}
                </n-tag>
                <n-tag
                  v-if="activeResult.subcategory"
                  size="tiny"
                  round
                  :bordered="false"
                  type="success"
                  class="font-semibold"
                >
                  {{
                    translateFilterToken(
                      'subcategory',
                      activeResult.subcategory,
                      activeResult.itemType ?? activeResult.metadata?.item_type
                    )
                  }}
                </n-tag>
              </div>
              <h2
                class="text-xl font-black text-slate-800 dark:text-white leading-tight"
              >
                {{ getItemName(activeResult) }}
              </h2>
            </div>

            <AttributeCard
              :metadata="activeResult.metadata"
              :item-type="activeResult.itemType"
            />

            <div class="pt-1 flex flex-col gap-2">
              <n-button
                v-if="activeResult.itemId !== null"
                type="primary"
                block
                size="large"
                class="!rounded-xl shadow-md font-bold"
                @click="navigateTo(localePath(`/items/${activeResult.itemId}`))"
              >
                {{ t('search_page.view_compendium') }}
              </n-button>
            </div>
          </div>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
  import { Search, Box, Ghost } from '@vicons/fa'
  import type { ItemSearchMetadata } from '#shared/types/itemSearch'
  import { isItemSearchFieldKey } from '#shared/utils/itemSearch'

  type SearchHit = {
    id: string
    itemId: number | null
    itemType: string | null
    category: string | null
    subcategory: string | null
    score: number
    metadata: ItemSearchMetadata | null
    data?: string
  }

  type SearchApiResponse = {
    query: string
    total: number
    data: SearchHit[]
  }

  const { t, locale } = useI18n()
  const { translateFilterToken } = useFilterToken()
  const route = useRoute()
  const router = useRouter()
  const localePath = useLocalePath()
  const { getImageSrc } = imageProvider()
  const isDev = import.meta.dev
  const gameVersionHeaders = getGameVersionRequestHeaders()

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

  onMounted(() => {
    exampleIndex.value = Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)

    typeInterval = setInterval(() => {
      if (typedCharCount.value < targetPlaceholder.value.length) {
        typedCharCount.value++
      } else {
        isTypingFinished.value = true
        if (typeInterval) {
          clearInterval(typeInterval)
          typeInterval = null
        }
      }
    }, 50) // speed of typing
  })

  onUnmounted(() => {
    if (typeInterval) clearInterval(typeInterval)
  })

  const searchQuery = ref(route.query.q?.toString() ?? '')
  const hasSearched = ref(!!route.query.q)
  const results = ref<SearchHit[]>([])
  const selectedId = ref<string | null>(null)
  const isMobileModalOpen = ref(false)
  const loading = ref(false)
  const error = ref('')
  useSeoMeta({
    title: () => t('search_page.title'),
    ogTitle: () => t('search_page.title'),
    twitterTitle: () => t('search_page.title'),
  })

  const activeResult = computed(
    () =>
      results.value.find((item) => item.id === selectedId.value) ??
      results.value[0] ??
      null
  )

  const setSelected = (id: string) => {
    selectedId.value = id
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      isMobileModalOpen.value = true
    }
  }

  const resetSearchState = () => {
    results.value = []
    selectedId.value = null
    error.value = ''
    hasSearched.value = false
  }

  const clearSearch = async () => {
    searchQuery.value = ''
    resetSearchState()
    await router.replace({ query: {} })
  }

  const buildMetadataDisplayPayload = (metadata: ItemSearchMetadata) => {
    const payload: Record<string, unknown> = {}
    const itemType =
      typeof metadata.item_type === 'string' ? metadata.item_type.trim() : ''
    const schemaFields = new Set(
      getItemSearchSchemaFields(itemType || metadata.slot)
    )

    if (metadata.item_id !== null && metadata.item_id !== undefined) {
      payload.item_id = metadata.item_id
    }

    if (itemType) {
      payload.item_type = itemType
    }

    schemaFields.forEach((field) => {
      if (isItemSearchArrayField(field)) {
        payload[field] = Array.isArray(metadata[field])
          ? metadata[field]
              .filter((entry): entry is string => typeof entry === 'string')
              .map((entry) => entry.trim())
              .filter(Boolean)
          : []
        return
      }

      payload[field] =
        typeof metadata[field] === 'string'
          ? metadata[field].trim() || null
          : (metadata[field] ?? null)
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

  const formatMetadata = (metadata: ItemSearchMetadata | null) =>
    JSON.stringify(
      metadata ? buildMetadataDisplayPayload(metadata) : {},
      null,
      2
    )

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

  const runSearch = async (pushToUrl = false) => {
    let query = searchQuery.value.trim()

    if (!query) {
      if (!pushToUrl) return
      // Use current placeholder example as the query and cycle to the next
      query = currentExample.value
      searchQuery.value = query
      exampleIndex.value =
        (exampleIndex.value + 1) % PLACEHOLDER_EXAMPLES.length
      isTypingFinished.value = true
    }

    loading.value = true
    hasSearched.value = true
    error.value = ''

    try {
      if (pushToUrl && route.query.q?.toString() !== query) {
        await router.replace({ query: { q: query } })
      }

      const response = await $fetch<SearchApiResponse>('/api/search/items', {
        query: {
          q: query,
          lang: locale.value,
        },
        headers: gameVersionHeaders,
      })

      results.value = (response.data ?? []).filter((item) => item.score > 0.0)
      selectedId.value = results.value[0]?.id ?? null
    } catch (caughtError) {
      results.value = []
      selectedId.value = null
      error.value = toErrorMessage(
        caughtError,
        t('search_page.error_description')
      )
    } finally {
      loading.value = false
    }
  }

  watch(
    () => route.query.q?.toString() ?? '',
    (nextQuery, previousQuery) => {
      const normalizedNextQuery = nextQuery.trim()

      if (
        previousQuery !== undefined &&
        normalizedNextQuery === searchQuery.value.trim()
      ) {
        return
      }

      searchQuery.value = nextQuery

      if (!normalizedNextQuery) {
        resetSearchState()
        return
      }

      void runSearch(false)
    },
    { immediate: true }
  )
</script>
