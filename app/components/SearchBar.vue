<template>
  <!-- Mobile: Show icon button -->
  <n-button
    text
    size="tiny"
    :aria-label="$t('common.search')"
    class="sm:hidden"
    @click="toggleSearch"
  >
    <n-icon>
      <Search />
    </n-icon>
  </n-button>

  <!-- Desktop: Show search input with hotkey hint -->
  <button
    type="button"
    class="hidden sm:flex items-center gap-2 px-2 py-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
    :aria-label="$t('common.search')"
    @click="toggleSearch"
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
    <n-auto-complete
      ref="searchAutoCompleteRef"
      v-model:value="searchQuery"
      class="fixed w-full sm:max-w-96 sm:right-44 top-1.5 rounded-2xl bg-slate-900 shadow-xl border border-gray-200 dark:border-white/10"
      :options="autoCompleteOptions"
      :render-label="renderLabel"
      :placeholder="$t('default.search.placeholder')"
      :loading="isLoading"
      clear-after-select
      clearable
      @select="handleSelect"
      @blur="closeSearch"
      @update:value="handleSearch"
    >
      <template #suffix>
        <n-button
          text
          type="primary"
          class="mr-1"
          @mousedown.prevent
          @click="goToWhimSearch"
        >
          <template #icon>
            <n-icon size="18"><Magic /></n-icon>
          </template>
          <span class="font-bold whitespace-nowrap">{{
            $t('search_page.title')
          }}</span>
        </n-button>
      </template>
      <template #empty>
        <div
          class="text-gray-500 text-center py-6 flex flex-col items-center gap-3"
        >
          <p>{{ $t('common.no_results_found') }}</p>
          <n-button
            size="small"
            type="primary"
            ghost
            class="!rounded-xl"
            @mousedown.prevent
            @click="goToWhimSearch"
          >
            <template #icon>
              <n-icon><Magic /></n-icon>
            </template>
            {{ $t('search_page.title') }}
          </n-button>
        </div>
      </template>
    </n-auto-complete>
  </n-modal>
</template>

<script setup lang="ts">
  import { Search, Magic } from '@vicons/fa'
  import type { AutoCompleteOption } from 'naive-ui'

  const { search, searchOptions, buildSearchIndex, isIndexBuilt } = useSearch()
  const { getImageSrc } = imageProvider()
  const localePath = useLocalePath()

  const goToWhimSearch = () => {
    navigateTo(localePath('/search'))
    closeSearch()
  }

  const searchQuery = ref('')
  const showSearch = ref(false)
  const isLoading = ref(false)
  const searchResults = ref<SearchCategory[]>([])
  const searchAutoCompleteRef = ref()

  const buildResultThumbnails = (
    result: SearchResult,
    bannerId: string
  ): VNode[] => {
    const imageProps = {
      alt: result.name,
      loading: 'lazy',
    }

    const nodes: VNode[] = []

    const imageConfig = (() => {
      switch (result.type) {
        case 'banner':
          return {
            src: getImageSrc('bannerThumb', bannerId),
            preset: 'bannerThumb',
            class: 'w-20 h-10 my-0.5 rounded object-cover flex-shrink-0',
          }
        case 'outfit':
          return {
            src: getImageSrc('outfit', result.id),
            preset: 'tallSm',
            class: 'w-8 h-12 my-0.5 rounded object-cover flex-shrink-0',
          }
        case 'item':
          return {
            src: getImageSrc('item', result.id),
            preset: 'tallSm',
            class: 'w-8 h-12 my-0.5 rounded object-cover flex-shrink-0',
          }
        default:
          return null
      }
    })()

    if (imageConfig) {
      nodes.push(
        h(resolveComponent('NuxtImg'), {
          ...imageProps,
          ...imageConfig,
        })
      )
    }

    return nodes
  }

  // Convert search results to autocomplete options
  const autoCompleteOptions = computed<AutoCompleteOption[]>(() => {
    const options: AutoCompleteOption[] = []

    searchResults.value.forEach((category) => {
      // Add category header
      options.push({
        type: 'group',
        label: category.label,
        key: `group-${category.type}`,
        children: category.results.map((result) => ({
          label: result.name,
          value: result.id,
          // Store the full result data for navigation
          result: result,
        })),
      })
    })

    return options
  })

  // Custom render function for labels with thumbnails for all result types
  const renderLabel = (option: AutoCompleteOption) => {
    const result = (option as AutoCompleteOption & { result?: SearchResult })
      .result

    if (!result) {
      return h('span', {}, String(option.label))
    }

    // Extract banner ID from route
    const bannerId = result.route.match(/\/banners?\/(\d+)\/?/i)?.[1] || '0'

    const labelChildren: VNode[] = [
      ...buildResultThumbnails(result, bannerId),
      h('span', { class: 'font-medium flex-1 ml-2 truncate' }, result.name),
    ]

    return h('div', { class: 'flex items-center gap-2 w-full' }, labelChildren)
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

  const handleSearch = async (query: string) => {
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
    searchAutoCompleteRef.value?.focus()
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

  const handleSelect = (value: string) => {
    for (const category of searchResults.value) {
      const result = category.results.find((r) => r.id === value)
      if (result) {
        selectResult(result)
        return
      }
    }
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
