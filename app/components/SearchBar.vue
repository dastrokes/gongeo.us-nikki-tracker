<template>
  <!-- Mobile: Show icon button -->
  <n-button
    text
    size="tiny"
    :aria-label="$t('common.search')"
    class="lg:hidden"
    @click.stop="toggleSearch"
  >
    <n-icon>
      <Search />
    </n-icon>
  </n-button>

  <!-- Desktop: Show search input with hotkey hint -->
  <button
    type="button"
    class="hidden lg:flex items-center gap-2 px-2 py-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-rose-500/80"
    :aria-label="$t('common.search')"
    @click.stop="toggleSearch"
  >
    <n-icon
      size="14"
      class="text-gray-400"
    >
      <Search />
    </n-icon>
    <kbd
      class="px-1.5 py-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-sm"
    >
      /
    </kbd>
  </button>

  <n-modal v-model:show="showSearch">
    <div
      class="fixed inset-x-2 sm:inset-x-0 sm:w-full sm:max-w-2xl top-2 sm:top-14 lg:mx-auto rounded-3xl z-50"
    >
      <div
        class="flex max-h-[calc(100dvh-1rem)] flex-col w-full overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl shadow-[0_12px_48px_rgba(244,114,182,0.15)] ring-1 ring-black/5 dark:bg-slate-900/90 dark:shadow-[0_12px_48px_rgba(2,6,23,0.5)] dark:ring-white/10 transition-all sm:max-h-[calc(100dvh-7rem)]"
      >
        <!-- Search Input Header -->
        <div
          class="border-b border-gray-100 bg-white/50 px-4 pb-3 pt-4 dark:border-white/5 dark:bg-slate-950/50 sm:px-5"
        >
          <div class="flex items-center gap-3">
            <n-icon
              size="22"
              class="text-rose-500 shrink-0"
              ><Search
            /></n-icon>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              :placeholder="$t('default.search.placeholder')"
              class="flex-1 min-w-0 bg-transparent text-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-hidden p-0 border-none focus:ring-0"
              autocomplete="off"
              @input="handleInput"
              @keydown.enter.prevent="goToWhimSearch"
            />
            <div class="flex items-center gap-2 shrink-0">
              <n-spin
                v-if="isLoading"
                size="small"
                class="opacity-50"
              />
              <kbd
                class="hidden sm:inline-block px-2 py-1 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700"
                >{{ $t('common.keys.esc') }}</kbd
              >
            </div>
          </div>

          <button
            type="button"
            class="group mt-3 flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-lg border border-rose-200/80 bg-rose-50/80 px-3 py-2 text-left text-sm text-slate-600 shadow-xs transition hover:border-rose-300 hover:bg-rose-100/80 hover:text-slate-900 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500/80 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-slate-300 dark:hover:border-rose-800 dark:hover:bg-rose-950/50 dark:hover:text-slate-100"
            @click="goToWhimSearch"
          >
            <span class="flex min-w-0 flex-1 items-center gap-3">
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-rose-500 shadow-xs ring-1 ring-rose-200 transition group-hover:bg-rose-500 group-hover:text-white dark:bg-slate-900 dark:text-rose-400 dark:ring-rose-900/50"
              >
                <n-icon size="14"><Magic /></n-icon>
              </span>
              <span class="min-w-0 flex-1">
                <span
                  class="block text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  {{ $t('default.search.whim_hint') }}
                </span>
                <span
                  class="block truncate font-bold text-rose-500 group-hover:text-rose-600 dark:text-rose-400"
                >
                  {{ $t('search_page.title') }}
                  <span
                    v-if="searchQuery"
                    class="font-normal text-slate-500 dark:text-slate-400"
                  >
                    {{ $t('default.search.for_query', { query: searchQuery }) }}
                  </span>
                </span>
              </span>
            </span>
            <span
              class="hidden shrink-0 items-center gap-2 text-xs text-slate-400/80 sm:flex"
            >
              <kbd
                class="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded-sm font-semibold border border-slate-200 dark:border-slate-700 shadow-xs text-slate-500 dark:text-slate-400"
              >
                {{ $t('common.keys.enter') }}
              </kbd>
              <span>{{ $t('default.search.to_search') }}</span>
            </span>
          </button>
        </div>

        <!-- Quick Results Body -->
        <div
          v-if="searchQuery"
          class="min-h-0 flex-1 overflow-y-auto px-2 py-3 custom-scrollbar"
        >
          <template v-if="searchResults.length > 0">
            <div
              v-for="category in searchResults"
              :key="category.type"
              class="mb-4 last:mb-0"
            >
              <div
                class="px-3 pb-1.5 text-xs font-bold uppercase tracking-widest text-slate-400"
              >
                {{ category.label }}
              </div>
              <div class="space-y-0.5">
                <button
                  v-for="item in category.results"
                  :key="item.id"
                  class="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200"
                  @click="selectResult(item)"
                >
                  <div class="shrink-0 flex items-center justify-center">
                    <template v-if="item.type === 'banner'">
                      <NuxtImg
                        :src="getImageSrc('bannerThumb', getBannerId(item))"
                        preset="bannerThumb"
                        class="w-16 h-8 rounded-md object-cover shadow-xs ring-1 ring-black/5 dark:ring-white/10"
                        :alt="item.name"
                        loading="lazy"
                      />
                    </template>
                    <template v-else-if="item.type === 'outfit'">
                      <NuxtImg
                        :src="getImageSrc('outfit', item.id)"
                        preset="tallSm"
                        class="w-7 h-10 rounded-md object-cover shadow-xs ring-1 ring-black/5 dark:ring-white/10"
                        :alt="item.name"
                        loading="lazy"
                      />
                    </template>
                    <template v-else-if="item.type === 'item'">
                      <NuxtImg
                        :src="getImageSrc('item', item.id)"
                        preset="tallSm"
                        class="w-7 h-10 rounded-md object-cover shadow-xs ring-1 ring-black/5 dark:ring-white/10"
                        :alt="item.name"
                        loading="lazy"
                      />
                    </template>
                  </div>
                  <span
                    class="font-medium truncate group-hover:text-rose-600 dark:group-hover:text-rose-300"
                    >{{ item.name }}</span
                  >
                </button>
              </div>
            </div>
          </template>
          <template v-else-if="!isLoading">
            <div
              class="flex flex-col items-center justify-center py-10 text-slate-400 gap-3"
            >
              <n-icon
                size="32"
                class="opacity-50"
                ><Search
              /></n-icon>
              <p>{{ $t('common.no_results_found') }}</p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
  import { Search, Magic } from '@vicons/fa'

  const { search, searchOptions, buildSearchIndex, isIndexBuilt } = useSearch()
  const { getImageSrc } = imageProvider()
  const localePath = useLocalePath()

  const searchQuery = ref('')
  const showSearch = ref(false)
  const isLoading = ref(false)
  const searchResults = ref<SearchCategory[]>([])
  const searchInputRef = ref<HTMLInputElement | null>(null)

  const getBannerId = (result: SearchResult) => {
    return result.route.match(/\/banners?\/(\d+)\/?/i)?.[1] || '0'
  }

  const goToWhimSearch = () => {
    if (searchQuery.value.trim()) {
      navigateTo({
        path: localePath('/search'),
        query: { q: searchQuery.value.trim() },
      })
    } else {
      navigateTo(localePath('/search'))
    }
    closeSearch()
  }

  const performSearch = async (query: string) => {
    const normalizedQuery = query?.trim() ?? ''

    if (!normalizedQuery) {
      searchResults.value = []
      return
    }

    if (normalizedQuery.length < searchOptions.minMatchCharLength) {
      searchResults.value = []
      return
    }

    isLoading.value = true
    try {
      searchResults.value = search(normalizedQuery)
    } finally {
      isLoading.value = false
    }
  }

  // Debounced search
  const debouncedSearch = useDebounceFn(performSearch, 300)

  const handleInput = async (event: Event) => {
    const query = (event.target as HTMLInputElement).value
    if (!isIndexBuilt.value) {
      await buildSearchIndex()
    }
    debouncedSearch(query)
  }

  const toggleSearch = async () => {
    showSearch.value = true

    // Build search index on first open if not already built
    if (!isIndexBuilt.value) {
      await buildSearchIndex()
    }

    // Focus the search input after modal is rendered
    await nextTick()
    searchInputRef.value?.focus()
  }

  const closeSearch = () => {
    showSearch.value = false
    searchQuery.value = ''
    searchResults.value = []
  }

  const selectResult = (result: SearchResult) => {
    navigateTo(result.route)
    closeSearch()
  }

  // Handle "/" hotkey to open search
  const handleKeyDown = (event: KeyboardEvent) => {
    // Check if "/" is pressed and not in an input/textarea
    if (
      event.key === '/' &&
      !['INPUT', 'TEXTAREA'].includes(
        (event.target as HTMLElement)?.tagName || ''
      )
    ) {
      event.preventDefault()
      toggleSearch()
    }
    // Handle Escape to close search
    if (event.key === 'Escape' && showSearch.value) {
      closeSearch()
    }
  }

  // Add keyboard event listener
  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  // Remove keyboard event listener
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })
</script>
