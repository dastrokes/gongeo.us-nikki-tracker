<template>
  <div
    class="flex flex-col items-center justify-center text-center min-h-[80vh]"
  >
    <h2 class="text-4xl font-bold font-sans my-8 transform scale-y-130">
      {{ $t('index.title') }}
    </h2>
    <h1 class="text-2xl font-bold mb-4">{{ $t('index.subtitle') }}</h1>
    <p
      class="text-lg mb-8"
      :class="isDark ? 'text-gray-300' : 'text-gray-600'"
    >
      {{ $t('index.description') }}
    </p>
    <div class="flex gap-4">
      <n-button
        v-if="loading"
        type="primary"
        size="large"
        :loading="loading"
      >
        {{ $t('index.loading') }}
      </n-button>
      <n-button
        v-if="!loading && hasData"
        type="primary"
        size="large"
        :loading="loading"
        @click="router.push(localePath('/tracker'))"
      >
        {{ $t('index.go_to_tracker') }}
      </n-button>
      <n-button
        v-if="!loading && !hasData"
        type="primary"
        size="large"
        :loading="loading"
        @click="router.push(localePath('/import'))"
      >
        {{ $t('index.import_data') }}
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { NButton } from 'naive-ui'
  import { useRouter } from 'vue-router'
  import { useIndexedDB } from '~/composables/useIndexedDB'
  import { usePullStore } from '~/stores/pull'
  import { onMounted, ref, computed } from 'vue'
  import { useUserStore } from '~/stores/user'

  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')

  const localePath = useLocalePath()

  const router = useRouter()
  const { data, hasData, loadPullData } = useIndexedDB()
  const loading = ref(true)

  onMounted(async () => {
    loading.value = true
    try {
      await loadPullData()
      usePullStore().processPullsData(data.value)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      loading.value = false
    }
  })
</script>
