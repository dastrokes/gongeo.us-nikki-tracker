<template>
  <n-button
    text
    size="tiny"
    :aria-label="t('accessibility.search')"
    @click="toggleSearch"
  >
    <n-icon>
      <Search />
    </n-icon>
  </n-button>

  <n-modal v-model:show="showSearch">
    <n-auto-complete
      ref="searchAutoCompleteRef"
      v-model:value="searchQuery"
      class="fixed w-full sm:max-w-80 sm:right-[130px] top-1.5 rounded-xl bg-slate-900"
      :options="autoCompleteOptions"
      :render-label="renderLabel"
      :placeholder="t('search.placeholder')"
      :loading="isLoading"
      clear-after-select
      clearable
      @select="handleSelect"
      @update:value="handleSearch"
    >
      <template #empty>
        <div class="text-gray-500 text-center py-4">
          {{ t('search.noResults') }}
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

  const searchQuery = ref('')
  const showSearch = ref(false)
  const isLoading = ref(false)
  const searchResults = ref<SearchCategory[]>([])
  const isIndexBuilt = ref(false)
  const searchAutoCompleteRef = ref()

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

  // Custom render function for labels with colorized names and thumbnails for all result types
  const renderLabel = (option: AutoCompleteOption) => {
    const result = (option as AutoCompleteOption & { result?: SearchResult })
      .result

    if (!result) {
      return h('span', {}, String(option.label))
    }

    // Extract banner ID from route
    const bannerId = result.route.match(/banner\/(\d+)\/?/)?.[1] || '0'

    // Colorize the name based on rarity
    const colorClass =
      result.rarity === 5
        ? 'text-amber-500'
        : result.rarity === 4
          ? 'text-blue-500'
          : 'text-gray-900'

    return h('div', { class: 'flex items-center gap-2 w-full' }, [
      h('img', {
        src: `/images/banners/thumbnails/${bannerId}.webp`,
        alt: result.name,
        class: 'w-16 h-8 rounded object-cover flex-shrink-0',
        loading: 'lazy',
        onError: (e: Event) => {
          ;(e.target as HTMLImageElement).style.display = 'none'
        },
      }),
      h(
        'span',
        { class: `font-medium flex-1 ml-2 ${colorClass}` },
        result.name
      ),
    ])
  }

  const performSearch = async (query: string) => {
    if (query && query.length < searchOptions.minMatchCharLength) {
      searchResults.value = []
      return
    }

    isLoading.value = true
    try {
      searchResults.value = search(query)
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

    // Trigger search to show latest banners
    nextTick(() => {
      performSearch('')
    })
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
</script>
