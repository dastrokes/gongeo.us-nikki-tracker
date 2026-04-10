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
    class="hidden lg:flex items-center gap-2 px-2 py-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500/80"
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
      class="px-1.5 py-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
    >
      /
    </kbd>
  </button>

  <n-modal v-model:show="showSearch">
    <div
      class="fixed inset-x-2 sm:inset-x-0 sm:w-full sm:max-w-2xl top-2 sm:top-16 lg:mx-auto rounded-3xl z-50"
    >
      <div
        class="flex flex-col w-full overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl shadow-[0_12px_48px_rgba(244,114,182,0.15)] ring-1 ring-black/5 dark:bg-slate-900/90 dark:shadow-[0_12px_48px_rgba(2,6,23,0.5)] dark:ring-white/10 transition-all"
      >
        <!-- Search Input Header -->
        <div
          class="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-slate-950/50"
        >
          <n-icon
            size="22"
            class="text-rose-500 shrink-0"
            ><Search
          /></n-icon>
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            :placeholder="$t('default.search.placeholder')"
            class="flex-1 min-w-0 bg-transparent text-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none p-0 border-none focus:ring-0"
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
              >ESC</kbd
            >
          </div>
        </div>

        <!-- Quick Results Body -->
        <div
          v-if="searchQuery"
          class="max-h-[60vh] overflow-y-auto px-2 py-3 custom-scrollbar"
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
                  class="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200"
                  @click="selectResult(item)"
                >
                  <div class="shrink-0 flex items-center justify-center">
                    <template v-if="item.type === 'banner'">
                      <NuxtImg
                        :src="getImageSrc('bannerThumb', getBannerId(item))"
                        preset="bannerThumb"
                        class="w-16 h-8 rounded-md object-cover shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                        :alt="item.name"
                        loading="lazy"
                      />
                    </template>
                    <template v-else-if="item.type === 'outfit'">
                      <NuxtImg
                        :src="getImageSrc('outfit', item.id)"
                        preset="tallSm"
                        class="w-7 h-10 rounded-md object-cover shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                        :alt="item.name"
                        loading="lazy"
                      />
                    </template>
                    <template v-else-if="item.type === 'item'">
                      <NuxtImg
                        :src="getImageSrc('item', item.id)"
                        preset="tallSm"
                        class="w-7 h-10 rounded-md object-cover shadow-sm ring-1 ring-black/5 dark:ring-white/10"
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

        <!-- Whim Search Footer -->
        <div
          class="bg-slate-50/50 dark:bg-slate-950/50 border-t border-gray-100 dark:border-white/5 px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between shrink-0"
        >
          <button
            class="group flex items-center gap-3 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            @click="goToWhimSearch"
          >
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white shadow-sm ring-1 ring-rose-200 dark:ring-rose-900/50"
            >
              <n-icon size="14"><Magic /></n-icon>
            </div>
            <span
              >Open
              <span
                class="font-bold text-rose-500 group-hover:text-rose-600 dark:text-rose-400"
                >Whim Search</span
              >
              <span
                v-if="searchQuery"
                class="opacity-75 font-normal ml-1"
                >for "{{ searchQuery }}"</span
              ></span
            >
          </button>
          <div
            class="hidden sm:flex items-center gap-2 text-xs text-slate-400/80"
          >
            <span>Press</span>
            <kbd
              class="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded font-semibold border border-slate-200 dark:border-slate-700 shadow-sm group-hover:border-rose-300 dark:group-hover:border-rose-700 text-slate-500 dark:text-slate-400"
              >Enter</kbd
            >
            <span>to search</span>
          </div>
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
