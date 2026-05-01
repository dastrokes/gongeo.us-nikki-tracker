<template>
  <div class="flex min-h-screen items-center justify-center">
    <n-result
      size="small"
      class="w-full max-w-xs"
      status="info"
      title="gongeo.us"
    >
      <template #icon>
        <NuxtImg
          :src="getImageSrc('emote', 'think')"
          class="h-2/3 w-2/3 object-cover"
          preset="iconLg"
          fit="cover"
          sizes="160px sm:200px"
        />
      </template>
      <template #footer>
        <n-button
          round
          @click="handleError"
        >
          <template #icon>
            <n-icon>
              <Home />
            </n-icon>
          </template>
          ↩︎ Home
        </n-button>
      </template>
    </n-result>
  </div>
</template>

<script setup lang="ts">
  import { Home } from '@vicons/fa'

  const localePath = useLocalePath()
  const { getImageSrc } = imageProvider()

  const handleError = () => clearError({ redirect: localePath('/') })
</script>
