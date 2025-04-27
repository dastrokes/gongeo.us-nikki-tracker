<template>
  <div class="relative min-h-[80vh]">
    <div
      class="flex flex-col min-h-[80vh] items-center justify-center text-center"
    >
      <h2
        class="text-4xl font-bold font-serif italic my-8 transform scale-y-130"
      >
        gongeo.us
      </h2>
      <h1 class="text-2xl font-bold mb-4">Infinity Nikki Resonance Tracker</h1>
      <p class="text-lg text-gray-600 mb-8">
        Track your Infinity Nikki resonance history and statistics
      </p>
      <div class="flex gap-4">
        <n-button
          v-if="isLoading"
          type="primary"
          size="large"
          :loading="isLoading"
        >
          Loading...
        </n-button>
        <n-button
          v-if="!isLoading && hasData"
          type="primary"
          size="large"
          :loading="isLoading"
          @click="router.push('/tracker')"
        >
          Go to Tracker
        </n-button>
        <n-button
          v-if="!isLoading && !hasData"
          type="primary"
          size="large"
          :loading="isLoading"
          @click="router.push('/import')"
        >
          Import Your Data
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { NButton } from 'naive-ui'
  import { useRouter } from 'vue-router'
  import { useIndexedDB } from '~/composables/useIndexedDB'
  import { usePullStore } from '~/stores/pull'
  import { onMounted, ref } from 'vue'

  const router = useRouter()
  const { data, hasData, loadPullData } = useIndexedDB()
  const isLoading = ref(true)

  onMounted(async () => {
    isLoading.value = true
    try {
      await loadPullData()
      usePullStore().processPullsData(data.value, 'LOCAL')
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      isLoading.value = false
    }
  })
</script>
