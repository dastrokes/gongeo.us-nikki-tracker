<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <!-- Hero / Search Header -->
    <div
      :class="[
        'transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col w-full z-10',
        hasSearched
          ? 'pt-4 pb-6 sm:pt-6 sm:pb-8 items-start'
          : 'flex-1 justify-center items-center pb-32 pt-16',
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
                ? 'text-2xl sm:text-3xl'
                : 'text-4xl sm:text-6xl mb-4 animate-fade-in-up motion-reduce:animate-none',
            ]"
          >
            Whim Search
          </h1>
          <p
            v-if="!hasSearched"
            class="text-slate-600 dark:text-slate-300 text-sm sm:text-lg animate-fade-in-up motion-reduce:animate-none"
            style="animation-delay: 0.1s"
          >
            Discover any item using natural language.
          </p>
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
                placeholder="Try 'long hair' or 'mermeid ballgown'..."
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
                Search
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
        title="Error"
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
      <div class="space-y-4">
        <div
          class="flex items-center justify-between text-sm text-slate-500 font-medium"
        >
          <span v-if="!loading && results.length > 0">
            Found
            <strong class="text-rose-500">{{ resultCount }}</strong> matching
            items
          </span>
          <span
            v-else-if="loading"
            class="animate-pulse"
            >Searching the magic index...</span
          >
          <span v-else>No matches</span>
        </div>

        <div
          v-if="loading"
          class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
        >
          <div
            v-for="i in 12"
            :key="`search-skeleton-${i}`"
            class="aspect-[2/3] rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse border border-slate-200 dark:border-slate-800"
          />
        </div>

        <div
          v-else-if="results.length > 0"
          class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
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
                :alt="`Item ${item.itemId}`"
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
                  {{
                    item.itemId ? `Item ${item.itemId}` : `Result ${item.id}`
                  }}
                </div>
                <div
                  v-if="item.metadata?.item_type"
                  class="mt-1 text-[9px] uppercase tracking-widest text-rose-300 font-semibold drop-shadow-md"
                >
                  {{ item.metadata.item_type }}
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
          <div
            class="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2"
          >
            The style magic faded... We couldn't find any items matching your
            vision.
          </div>
          <div class="text-sm text-slate-500">{{ emptyMessage }}</div>
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
                    class="absolute bottom-3 right-3 flex items-center justify-center gap-1.5 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 px-3 py-1.5 rounded-full shadow-lg border border-white/40 dark:border-slate-700/60"
                  >
                    <div
                      class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"
                    ></div>
                    <span
                      class="text-xs font-black text-slate-800 dark:text-slate-200"
                    >
                      {{ (activeResult.score * 100).toFixed(1) }}% MATCH
                    </span>
                  </div>
                </div>

                <!-- Info Content -->
                <div class="p-5 w-full flex flex-col gap-5">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <n-tag
                        v-if="activeResult.metadata?.item_type"
                        size="tiny"
                        round
                        :bordered="false"
                        type="warning"
                        class="font-bold tracking-widest uppercase !text-[9px]"
                      >
                        {{ activeResult.metadata.item_type }}
                      </n-tag>
                    </div>
                    <h2
                      class="text-xl font-black text-slate-800 dark:text-white leading-tight"
                    >
                      {{
                        activeResult.itemId
                          ? `Item ${activeResult.itemId}`
                          : `Item ${activeResult.id}`
                      }}
                    </h2>
                  </div>

                  <!-- Colors -->
                  <div
                    v-if="activeResult.metadata?.dominant_colors?.length"
                    class="space-y-2"
                  >
                    <h3
                      class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"
                    >
                      <n-icon><Palette /></n-icon> Colors
                    </h3>
                    <div class="flex flex-wrap gap-1.5">
                      <n-tag
                        v-for="c in activeResult.metadata.dominant_colors.slice(
                          0,
                          4
                        )"
                        :key="c"
                        size="small"
                        type="default"
                        :bordered="false"
                        class="capitalize font-medium !bg-slate-100 dark:!bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200/50 dark:border-slate-700/50"
                      >
                        {{ c.replace('_', ' ') }}
                      </n-tag>
                    </div>
                  </div>

                  <!-- Motifs -->
                  <div
                    v-if="activeResult.metadata?.motifs?.length"
                    class="space-y-2"
                  >
                    <h3
                      class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"
                    >
                      <n-icon><Magic /></n-icon> Motifs & Themes
                    </h3>
                    <div class="flex flex-wrap gap-1.5">
                      <n-tag
                        v-for="m in activeResult.metadata.motifs.slice(0, 8)"
                        :key="m"
                        size="small"
                        type="error"
                        :bordered="false"
                        class="capitalize font-medium bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50"
                      >
                        {{ m.replace('_', ' ') }}
                      </n-tag>
                    </div>
                  </div>

                  <!-- Subtypes -->
                  <div
                    v-if="activeResult.metadata?.subtypes?.length"
                    class="space-y-2"
                  >
                    <h3
                      class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"
                    >
                      <n-icon><Tags /></n-icon> Characteristics
                    </h3>
                    <div class="flex flex-wrap gap-1.5">
                      <n-tag
                        v-for="s in activeResult.metadata.subtypes.slice(0, 6)"
                        :key="s"
                        size="small"
                        type="success"
                        :bordered="false"
                        class="capitalize font-medium !bg-emerald-50 dark:!bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50"
                      >
                        {{ s.replace('_', ' ') }}
                      </n-tag>
                    </div>
                  </div>

                  <div class="pt-2 flex flex-col gap-3">
                    <n-button
                      type="primary"
                      block
                      size="large"
                      class="!rounded-xl shadow-md font-bold"
                      @click="navigateTo(`/items/${activeResult.itemId}`)"
                    >
                      View Compendium
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
  </div>
</template>

<script setup lang="ts">
  import { Search, Magic, Palette, Tags, Box, Ghost } from '@vicons/fa'

  type SearchMetadata = {
    item_id?: number | string
    item_type?: string
    dominant_colors?: string[]
    accent_colors?: string[]
    primary_color?: string
    secondary_color?: string
    motifs?: string[]
    patterns?: string[]
    subtypes?: string[]
    accepted_facets?: string[]
    review_facets?: string[]
    search_terms?: string[]
  }

  type SearchHit = {
    id: string
    itemId: number | null
    score: number
    metadata: (SearchMetadata & Record<string, unknown>) | null
    data?: string
  }

  type SearchApiResponse = {
    query: string
    total: number
    data: SearchHit[]
  }

  const route = useRoute()
  const router = useRouter()
  const { getImageSrc } = imageProvider()
  const isDev = import.meta.dev

  const searchQuery = ref(route.query.q?.toString() ?? '')
  const hasSearched = ref(!!route.query.q)
  const results = ref<SearchHit[]>([])
  const selectedId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref('')

  useSeoMeta({
    title: 'Whim Search',
    ogTitle: 'Whim Search',
    twitterTitle: 'Whim Search',
  })

  const resultCount = computed(() => results.value.length)

  const activeResult = computed(
    () =>
      results.value.find((item) => item.id === selectedId.value) ??
      results.value[0] ??
      null
  )

  const emptyMessage = computed(() =>
    searchQuery.value.trim()
      ? "The style magic faded... We couldn't find any items matching your vision."
      : 'What are you looking for today?'
  )

  const setSelected = (id: string) => {
    selectedId.value = id
  }

  const formatMetadata = (metadata: SearchMetadata | null) =>
    JSON.stringify(metadata ?? {}, null, 2)

  const runSearch = async (pushToUrl = false) => {
    const query = searchQuery.value.trim()

    if (!query) {
      results.value = []
      selectedId.value = null
      error.value = ''
      hasSearched.value = false

      if (pushToUrl) {
        await router.replace({ query: {} })
      }

      return
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
        },
      })

      results.value = response.data ?? []
      selectedId.value = results.value[0]?.id ?? null
    } catch (caughtError) {
      results.value = []
      selectedId.value = null
      error.value = toErrorMessage(caughtError, 'Failed to query search index')
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    if (searchQuery.value.trim()) {
      void runSearch(false)
    }
  })
</script>
