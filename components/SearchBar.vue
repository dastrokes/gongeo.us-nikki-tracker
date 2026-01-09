<template>
  <!-- Mobile: Show icon button -->
  <n-button
    text
    size="tiny"
    :aria-label="t('common.search')"
    class="sm:hidden"
    @click="toggleSearch"
  >
    <n-icon>
      <Search />
    </n-icon>
  </n-button>

  <!-- Desktop: Show search input with hotkey hint -->
  <div
    class="hidden sm:flex items-center gap-2 px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
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
  </div>

  <n-modal v-model:show="showSearch">
    <n-auto-complete
      ref="searchAutoCompleteRef"
      v-model:value="searchQuery"
      class="fixed w-full sm:max-w-80 sm:right-4 top-1.5 rounded-xl bg-slate-900"
      :options="autoCompleteOptions"
      :render-label="renderLabel"
      :placeholder="t('default.search.placeholder')"
      :loading="isLoading"
      clear-after-select
      clearable
      @select="handleSelect"
      @blur="closeSearch"
      @update:value="handleSearch"
    >
      <template #empty>
        <div class="text-gray-500 text-center py-4">
          {{ t('default.search.noResults') }}
        </div>
      </template>
    </n-auto-complete>
  </n-modal>
</template>

<script setup lang="ts">
  import { Search } from '@vicons/fa'
  import type { SearchResult, SearchCategory } from '~/types/search'
  import type { AutoCompleteOption } from 'naive-ui'

  const { t } = useI18n()
  const router = useRouter()
  const { search, searchOptions, buildSearchIndex } = useSearch()
  const { getImageSrc } = imageProvider()

  const searchQuery = ref('')
  const showSearch = ref(false)
  const isLoading = ref(false)
  const searchResults = ref<SearchCategory[]>([])
  const isIndexBuilt = ref(false)
  const searchAutoCompleteRef = ref()

  const buildResultThumbnails = (
    result: SearchResult,
    bannerId: string
  ): VNode[] => {
    const imageProps = {
      alt: result.name,
      quality: 80,
      format: 'webp',
      loading: 'lazy',
    }

    const nodes: VNode[] = []

    const imageConfig = (() => {
      switch (result.type) {
        case 'banner':
          return {
            src: getImageSrc('bannerThumb', bannerId),
            class: 'w-20 h-10 my-0.5 rounded object-cover flex-shrink-0',
          }
        case 'outfit':
          return {
            src: getImageSrc('outfit', result.id),
            class: 'w-8 h-12 my-0.5 rounded object-cover flex-shrink-0',
          }
        case 'item':
          return {
            src: getImageSrc('item', result.id),
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
          width: result.type === 'banner' ? 80 : 32,
          height: result.type === 'banner' ? 40 : 48,
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

  const handleSearch = (query: string) => {
    if (isIndexBuilt.value) {
      // Only perform search if index is built
      debouncedSearch(query)
    } else {
      // If index isn't built yet, queue the search for after it's built
      const checkIndex = () => {
        if (isIndexBuilt.value) {
          debouncedSearch(query)
        } else {
          setTimeout(checkIndex, 100)
        }
      }
      checkIndex()
    }
  }

  const toggleSearch = async () => {
    showSearch.value = true

    // Build search index on first open if not already built
    if (!isIndexBuilt.value) {
      await buildSearchIndex()
      isIndexBuilt.value = true
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
    router.push(result.route)
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
