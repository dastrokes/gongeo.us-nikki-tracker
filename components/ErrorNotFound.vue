<template>
  <div class="flex min-h-[calc(100vh-16rem)] items-center justify-center">
    <n-result
      class="w-full max-w-xs"
      size="small"
      status="info"
      :title="$t('error.404')"
      :description="$t('error.notFound')"
    >
      <template #icon>
        <NuxtImg
          :src="getImageSrc('static', '/images/emotes/think.webp')"
          class="mx-auto w-32 h-32 sm:w-48 sm:h-48 object-cover"
          width="400"
          height="400"
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
          {{ $t('error.returnHome') }}
        </n-button>
      </template>
    </n-result>
  </div>
</template>

<script setup lang="ts">
  import { Home } from '@vicons/fa'

  const localePath = useLocalePath()
  const { getImageSrc } = imageProvider()

  const handleError = () => {
    navigateTo(localePath('/'))
  }
</script>
