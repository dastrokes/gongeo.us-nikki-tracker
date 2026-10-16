<template>
  <n-button
    text
    size="tiny"
    :loading="showSearch && !dialogReady"
    :aria-label="$t('common.search')"
    :title="$t('default.search.helper')"
    class="lg:hidden"
    @click.stop="openSearch"
  >
    <n-icon>
      <Search />
    </n-icon>
  </n-button>

  <button
    type="button"
    class="hidden cursor-pointer items-center gap-2 rounded-xl border border-gray-300 bg-white px-2 py-1 hover:border-gray-400 focus-visible:ring-1 focus-visible:ring-rose-500/80 focus-visible:outline-hidden lg:flex dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
    :aria-busy="showSearch && !dialogReady"
    :aria-label="$t('common.search')"
    :title="$t('default.search.helper')"
    @click.stop="openSearch"
  >
    <n-spin
      v-if="showSearch && !dialogReady"
      :size="14"
    />
    <n-icon
      v-else
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

  <LazySearchDialog
    v-if="hasOpened"
    :trigger="searchTrigger"
    @ready="dialogReady = true"
  />
</template>

<script setup lang="ts">
  import { Search } from '@vicons/fa'

  const { isOpen: showSearch, openSearch } = useGlobalSearch()
  const hasOpened = ref(false)
  const dialogReady = ref(false)
  const searchTrigger = shallowRef<HTMLElement | null>(null)

  watch(
    showSearch,
    (isOpen) => {
      if (!isOpen || !import.meta.client) return
      searchTrigger.value =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      hasOpened.value = true
    },
    { immediate: true, flush: 'sync' }
  )

  useEventListener('keydown', (event: KeyboardEvent) => {
    if (
      event.key === '/' &&
      !['INPUT', 'TEXTAREA'].includes(
        (event.target as HTMLElement)?.tagName || ''
      )
    ) {
      event.preventDefault()
      openSearch()
    }
    if (event.key === 'Escape' && showSearch.value) {
      showSearch.value = false
    }
  })
</script>
