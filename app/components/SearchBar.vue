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
    class="hidden cursor-pointer items-center gap-2 rounded-xl border border-gray-300 bg-white px-2 py-1 hover:border-gray-400 focus-visible:ring-1 focus-visible:ring-rose-500/80 focus-visible:outline-hidden lg:flex dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
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
      class="rounded-sm border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
    >
      /
    </kbd>
  </button>

  <n-modal v-model:show="showSearch">
    <div
      class="fixed inset-x-2 top-2 z-50 rounded-3xl sm:inset-x-0 sm:top-14 sm:w-full sm:max-w-2xl lg:mx-auto"
    >
      <div
        class="flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-3xl bg-white/90 shadow-[0_12px_48px_rgba(244,114,182,0.15)] ring-1 ring-black/5 backdrop-blur-2xl transition-all sm:max-h-[calc(100dvh-7rem)] dark:bg-slate-900/90 dark:shadow-[0_12px_48px_rgba(2,6,23,0.5)] dark:ring-white/10"
      >
        <!-- Search Input Header -->
        <div
          class="border-b border-gray-100 bg-white/50 px-4 pt-4 pb-3 sm:px-5 dark:border-white/5 dark:bg-slate-950/50"
        >
          <div class="flex items-center gap-3">
            <n-icon
              size="22"
              class="shrink-0 text-rose-500"
              ><Search
            /></n-icon>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              :placeholder="$t('default.search.placeholder')"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="global-search-results"
              :aria-expanded="showResultList"
              :aria-activedescendant="activeResultOptionId"
              class="min-w-0 flex-1 border-none bg-transparent p-0 text-lg text-slate-800 placeholder-slate-400 outline-hidden focus:ring-0 dark:text-slate-100"
              autocomplete="off"
              @focus="openAutocomplete"
              @input="handleInput"
              @compositionstart="handleSearchCompositionStart"
              @compositionend="handleSearchCompositionEnd"
              @keydown="handleSearchKeyDown"
            />
            <div class="flex shrink-0 items-center gap-2">
              <n-spin
                v-if="isLoading"
                size="small"
                class="opacity-50"
              />
              <kbd
                class="hidden rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400 sm:inline-block dark:border-slate-700 dark:bg-slate-800"
                >{{ $t('common.keys.esc') }}</kbd
              >
            </div>
          </div>

          <div class="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              class="group flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-rose-200/80 bg-rose-50/80 px-3 py-2 text-left text-sm text-slate-600 shadow-xs transition hover:border-rose-300 hover:bg-rose-100/80 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-rose-500/80 focus-visible:outline-hidden dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-slate-300 dark:hover:border-rose-800 dark:hover:bg-rose-950/50 dark:hover:text-slate-100"
              @click="goToWhimSearch"
            >
              <span class="min-w-0">
                <span
                  class="block truncate text-[11px] leading-snug font-medium text-slate-500 dark:text-slate-400"
                >
                  {{ $t('search_page.mode_search_description') }}
                </span>
                <span
                  class="mt-0.5 block truncate text-sm font-bold text-rose-500 group-hover:text-rose-600 dark:text-rose-400"
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
              <span
                class="hidden shrink-0 items-center text-[11px] text-slate-400/80 sm:flex"
              >
                <kbd
                  class="rounded-sm border border-slate-200 bg-white px-1.5 py-0.5 font-semibold text-slate-500 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                >
                  {{ $t('common.keys.enter') }}
                </kbd>
              </span>
            </button>
            <button
              type="button"
              class="group flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-left text-sm text-slate-600 shadow-xs transition hover:border-amber-300 hover:bg-amber-100/80 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-amber-500/80 focus-visible:outline-hidden dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-slate-300 dark:hover:border-amber-800 dark:hover:bg-amber-950/50 dark:hover:text-slate-100"
              @click="goToRandomSearch"
            >
              <span class="min-w-0">
                <span
                  class="block truncate text-[11px] leading-snug font-medium text-slate-500 dark:text-slate-400"
                >
                  {{ $t('search_page.mode_random_description') }}
                </span>
                <span
                  class="mt-0.5 block truncate text-sm font-bold text-amber-600 group-hover:text-amber-700 dark:text-amber-300"
                >
                  {{ $t('search_page.lucky_machine_title') }}
                  <span
                    v-if="searchQuery"
                    class="font-normal text-slate-500 dark:text-slate-400"
                  >
                    {{ $t('default.search.for_query', { query: searchQuery }) }}
                  </span>
                </span>
              </span>
              <span
                class="hidden shrink-0 items-center gap-1 text-[11px] text-slate-400/80 sm:flex"
              >
                <kbd
                  class="rounded-sm border border-slate-200 bg-white px-1.5 py-0.5 font-semibold text-slate-500 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                >
                  {{ $t('common.keys.shift') }} + {{ $t('common.keys.enter') }}
                </kbd>
              </span>
            </button>
          </div>
        </div>

        <!-- Quick Results Body -->
        <div
          v-if="showResultList"
          class="max-h-[calc(100dvh-10rem)] overflow-hidden sm:max-h-[calc(100dvh-15rem)]"
        >
          <n-scrollbar style="height: auto; max-height: inherit">
            <div
              id="global-search-results"
              role="listbox"
              class="p-2"
            >
              <template
                v-for="group in autocompleteGroupOrder"
                :key="group"
              >
                <section
                  v-if="group === 'names' && entitySuggestions.length"
                  role="group"
                  :aria-label="t('search_page.autocomplete_names')"
                >
                  <p
                    class="px-3 py-1 text-xs font-bold tracking-widest text-slate-400 uppercase"
                  >
                    {{ t('search_page.autocomplete_names') }}
                  </p>
                  <button
                    v-for="item in entitySuggestions"
                    :id="getEntityAutocompleteOptionId(item)"
                    :key="getEntityAutocompleteKey(item)"
                    role="option"
                    type="button"
                    :aria-selected="
                      highlightedAutocompleteKey ===
                      getEntityAutocompleteKey(item)
                    "
                    :aria-label="
                      t('search_page.autocomplete_open_entity', {
                        type: getAutocompleteEntityTypeLabel(item),
                        name: item.name,
                      })
                    "
                    :class="[
                      'group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-rose-50 dark:text-slate-200 dark:hover:bg-rose-950/40',
                      highlightedAutocompleteKey ===
                      getEntityAutocompleteKey(item)
                        ? 'bg-rose-50 dark:bg-rose-950/40'
                        : '',
                    ]"
                    @mousedown.prevent
                    @mouseenter="
                      highlightedAutocompleteKey =
                        getEntityAutocompleteKey(item)
                    "
                    @click="selectEntitySuggestion(item)"
                  >
                    <div class="flex shrink-0 items-center justify-center">
                      <template v-if="item.type === 'banner'">
                        <NuxtImg
                          :src="getImageSrc('bannerThumb', item.id)"
                          preset="bannerThumb"
                          class="h-8 w-16 rounded-md object-cover shadow-xs ring-1 ring-black/5 dark:ring-white/10"
                          :alt="item.name"
                          loading="lazy"
                        />
                      </template>
                      <template v-else-if="item.type === 'outfit'">
                        <NuxtImg
                          :src="getImageSrc('outfit', item.id)"
                          preset="tallSm"
                          class="h-10 w-7 rounded-md object-cover shadow-xs ring-1 ring-black/5 dark:ring-white/10"
                          :alt="item.name"
                          loading="lazy"
                        />
                      </template>
                      <template v-else-if="item.type === 'item'">
                        <NuxtImg
                          :src="getImageSrc('item', item.id)"
                          preset="tallSm"
                          class="h-10 w-7 rounded-md object-cover shadow-xs ring-1 ring-black/5 dark:ring-white/10"
                          :alt="item.name"
                          loading="lazy"
                        />
                      </template>
                    </div>
                    <span class="min-w-0">
                      <span
                        class="block truncate font-medium group-hover:text-rose-600 dark:group-hover:text-rose-300"
                      >
                        {{ item.name }}
                      </span>
                      <span class="block truncate text-xs text-slate-400">
                        {{ getAutocompleteEntityMetaLabel(item) }}
                      </span>
                    </span>
                  </button>
                </section>

                <section
                  v-else-if="group === 'terms' && termSuggestions.length"
                  role="group"
                  :aria-label="t('search_page.autocomplete_terms')"
                >
                  <p
                    class="px-3 py-1 text-xs font-bold tracking-widest text-slate-400 uppercase"
                  >
                    {{ t('search_page.autocomplete_terms') }}
                  </p>
                  <button
                    v-for="term in termSuggestions"
                    :id="getTermAutocompleteOptionId(term)"
                    :key="getTermAutocompleteKey(term)"
                    type="button"
                    role="option"
                    :aria-selected="
                      highlightedAutocompleteKey ===
                      getTermAutocompleteKey(term)
                    "
                    :aria-label="
                      t('search_page.autocomplete_add_term', {
                        term: term.value,
                      })
                    "
                    :class="[
                      'flex w-full cursor-pointer items-center rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-rose-50 dark:text-slate-200 dark:hover:bg-rose-950/40',
                      highlightedAutocompleteKey ===
                      getTermAutocompleteKey(term)
                        ? 'bg-rose-50 dark:bg-rose-950/40'
                        : '',
                    ]"
                    @mousedown.prevent
                    @mouseenter="
                      highlightedAutocompleteKey = getTermAutocompleteKey(term)
                    "
                    @click="selectTermSuggestion(term)"
                  >
                    <span
                      class="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600 dark:bg-rose-400/15 dark:text-rose-300"
                      aria-hidden="true"
                    >
                      +
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate font-medium">
                        {{ term.value }}
                      </span>
                      <span class="block truncate text-xs text-slate-400">
                        {{
                          t('search_page.autocomplete_add_term', {
                            term: term.value,
                          })
                        }}
                      </span>
                    </span>
                  </button>
                </section>
              </template>
            </div>
          </n-scrollbar>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
  import { Search } from '@vicons/fa'

  type GlobalSearchAutocompleteOption =
    | {
        key: string
        elementId: string
        kind: 'name'
        result: SearchResult
      }
    | {
        key: string
        elementId: string
        kind: 'term'
        term: SearchAutocompleteTerm
      }

  const { t } = useI18n()
  const {
    buildSearchIndex: buildAutocompleteEntityIndex,
    isIndexBuilt: isAutocompleteEntityIndexBuilt,
    searchEntities: searchAutocompleteEntities,
    searchTerms: searchAutocompleteTerms,
  } = useWhimSearchAutocomplete()
  const { getImageSrc } = imageProvider()
  const localePath = useLocalePath()
  const pendingLuckyAutoroll = useState(
    'whim-search-pending-lucky-autoroll',
    () => false
  )

  const searchQuery = ref('')
  const showSearch = ref(false)
  const isLoading = ref(false)
  const searchInputRef = ref<HTMLInputElement | null>(null)
  const isAutocompleteOpen = ref(false)
  const isAutocompleteComposing = ref(false)
  const autocompleteQuery = ref('')
  const highlightedAutocompleteKey = ref<string | null>(null)
  const areResultsDismissed = ref(false)
  let autocompleteEntityIndexPromise: Promise<void> | null = null

  const syncAutocompleteQuery = useDebounceFn(() => {
    autocompleteQuery.value = searchQuery.value.trim()
  }, 100)
  const entitySuggestions = computed(() =>
    isAutocompleteOpen.value &&
    !isAutocompleteComposing.value &&
    autocompleteQuery.value
      ? searchAutocompleteEntities(autocompleteQuery.value, 5)
      : []
  )
  const termSuggestions = computed(() =>
    isAutocompleteOpen.value &&
    !isAutocompleteComposing.value &&
    autocompleteQuery.value
      ? searchAutocompleteTerms(autocompleteQuery.value)
      : []
  )
  const normalizeAutocompleteValue = (value: string) =>
    value.trim().toLocaleLowerCase()
  const hasExactEntitySuggestion = computed(() => {
    const query = normalizeAutocompleteValue(autocompleteQuery.value)
    return entitySuggestions.value.some(
      (entry) =>
        normalizeAutocompleteValue(entry.name) === query ||
        (entry.matchedAlias
          ? normalizeAutocompleteValue(entry.matchedAlias) === query
          : false)
    )
  })
  const hasExactTermSuggestion = computed(() => {
    const query = normalizeAutocompleteValue(autocompleteQuery.value)
    return termSuggestions.value.some(
      (entry) => normalizeAutocompleteValue(entry.value) === query
    )
  })
  const autocompleteGroupOrder = computed(() =>
    getAutocompleteGroupOrder(
      hasExactEntitySuggestion.value,
      hasExactTermSuggestion.value
    )
  )

  const getEntityAutocompleteKey = (result: SearchResult) =>
    `name:${result.type}:${result.id}`
  const getTermAutocompleteKey = (term: SearchAutocompleteTerm) =>
    `term:${term.id}`
  const getEntityAutocompleteOptionId = (result: SearchResult) =>
    `global-search-name-${result.type}-${result.id}`
  const getTermAutocompleteOptionId = (term: SearchAutocompleteTerm) =>
    `global-search-term-${term.id.replaceAll(':', '-')}`
  const getAutocompleteEntityTypeLabel = (result: SearchResult) =>
    t(
      result.type === 'banner'
        ? 'common.banners'
        : result.type === 'outfit'
          ? 'common.outfits'
          : 'common.items'
    )
  const autocompleteOptions = computed<GlobalSearchAutocompleteOption[]>(() =>
    autocompleteGroupOrder.value.flatMap((group) =>
      group === 'names'
        ? entitySuggestions.value.map((result) => ({
            key: getEntityAutocompleteKey(result),
            elementId: getEntityAutocompleteOptionId(result),
            kind: 'name' as const,
            result,
          }))
        : termSuggestions.value.map((term) => ({
            key: getTermAutocompleteKey(term),
            elementId: getTermAutocompleteOptionId(term),
            kind: 'term' as const,
            term,
          }))
    )
  )
  const getAutocompleteEntityMetaLabel = (result: SearchResult) => {
    const alias = getAutocompleteDisplayAlias(result)
    if (!alias) return getAutocompleteEntityTypeLabel(result)

    return `${getAutocompleteEntityTypeLabel(result)} · ${t(
      getAutocompleteDisplayAliasKey(result),
      { alias }
    )}`
  }
  const showResultList = computed(
    () =>
      isAutocompleteOpen.value &&
      !areResultsDismissed.value &&
      autocompleteOptions.value.length > 0
  )
  const activeResultOptionId = computed(
    () =>
      autocompleteOptions.value.find(
        (option) => option.key === highlightedAutocompleteKey.value
      )?.elementId
  )

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

  const goToRandomSearch = () => {
    pendingLuckyAutoroll.value = true
    if (searchQuery.value.trim()) {
      navigateTo({
        path: localePath('/random'),
        query: { q: searchQuery.value.trim() },
      })
    } else {
      navigateTo(localePath('/random'))
    }
    closeSearch()
  }

  const closeAutocomplete = () => {
    isAutocompleteOpen.value = false
    autocompleteQuery.value = ''
    highlightedAutocompleteKey.value = null
  }

  const ensureAutocompleteEntityIndex = async () => {
    if (isAutocompleteEntityIndexBuilt.value) return
    if (autocompleteEntityIndexPromise) return autocompleteEntityIndexPromise

    isLoading.value = true
    autocompleteEntityIndexPromise = buildAutocompleteEntityIndex().finally(
      () => {
        autocompleteEntityIndexPromise = null
        isLoading.value = false
      }
    )
    return autocompleteEntityIndexPromise
  }

  const openAutocomplete = () => {
    if (isAutocompleteComposing.value) {
      closeAutocomplete()
      return
    }

    autocompleteQuery.value = searchQuery.value.trim()
    isAutocompleteOpen.value = Boolean(autocompleteQuery.value)
    if (autocompleteQuery.value && !isAutocompleteEntityIndexBuilt.value) {
      void ensureAutocompleteEntityIndex()
    }
  }

  const handleInput = (event?: Event) => {
    if ((event as InputEvent | undefined)?.isComposing) return

    const query = searchQuery.value.trim()
    highlightedAutocompleteKey.value = null
    areResultsDismissed.value = false

    if (!query) {
      closeAutocomplete()
      return
    }

    isAutocompleteOpen.value = true
    syncAutocompleteQuery()
    if (!isAutocompleteEntityIndexBuilt.value) {
      void ensureAutocompleteEntityIndex()
    }
  }

  const handleSearchCompositionStart = () => {
    isAutocompleteComposing.value = true
    closeAutocomplete()
  }

  const handleSearchCompositionEnd = () => {
    isAutocompleteComposing.value = false
    void nextTick(() => handleInput())
  }

  const moveResultHighlight = (direction: 1 | -1) => {
    const options = autocompleteOptions.value
    if (options.length === 0) return

    const currentIndex = options.findIndex(
      (option) => option.key === highlightedAutocompleteKey.value
    )
    const nextIndex =
      currentIndex < 0
        ? direction > 0
          ? 0
          : options.length - 1
        : (currentIndex + direction + options.length) % options.length
    const option = options[nextIndex]
    highlightedAutocompleteKey.value = option?.key ?? null

    void nextTick(() => {
      if (!option || !import.meta.client) return
      document.getElementById(option.elementId)?.scrollIntoView({
        block: 'nearest',
      })
    })
  }

  const selectEntitySuggestion = (result: SearchResult) => {
    navigateTo(result.route)
    closeSearch()
  }

  const selectTermSuggestion = async (term: SearchAutocompleteTerm) => {
    const input = searchInputRef.value
    const insertion = insertSearchTermAtCaret(
      searchQuery.value,
      term.value,
      input?.selectionStart ?? searchQuery.value.length,
      input?.selectionEnd ?? input?.selectionStart ?? searchQuery.value.length
    )

    searchQuery.value = insertion.value
    autocompleteQuery.value = insertion.value.trim()
    highlightedAutocompleteKey.value = null
    areResultsDismissed.value = false
    isAutocompleteOpen.value = true

    await nextTick()
    input?.focus()
    input?.setSelectionRange(insertion.caret, insertion.caret)
  }

  const handleSearchKeyDown = (event: KeyboardEvent) => {
    if (event.isComposing || isAutocompleteComposing.value) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!showResultList.value) return
      event.preventDefault()
      moveResultHighlight(event.key === 'ArrowDown' ? 1 : -1)
      return
    }

    if (event.key === 'Enter') {
      const highlightedOption = autocompleteOptions.value.find(
        (option) => option.key === highlightedAutocompleteKey.value
      )
      if (highlightedOption) {
        event.preventDefault()
        if (highlightedOption.kind === 'name') {
          selectEntitySuggestion(highlightedOption.result)
        } else {
          void selectTermSuggestion(highlightedOption.term)
        }
        return
      }

      if (event.shiftKey) {
        event.preventDefault()
        goToRandomSearch()
      } else if (!event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        goToWhimSearch()
      }
      return
    }

    if (event.key === 'Escape' && showResultList.value) {
      event.preventDefault()
      event.stopPropagation()
      areResultsDismissed.value = true
      closeAutocomplete()
    }
  }

  const toggleSearch = async () => {
    showSearch.value = true

    // Build search index on first open if not already built
    if (!isAutocompleteEntityIndexBuilt.value) {
      void ensureAutocompleteEntityIndex()
    }

    // Focus the search input after modal is rendered
    await nextTick()
    searchInputRef.value?.focus()
  }

  const closeSearch = () => {
    showSearch.value = false
    searchQuery.value = ''
    closeAutocomplete()
    areResultsDismissed.value = false
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
