<template>
  <div class="flex min-h-[calc(100vh-24rem)] items-center justify-center">
    <n-result
      size="small"
      class="w-full max-w-xs"
      status="info"
      :title="$t('error.404')"
      :description="$t('error.notFound')"
    >
      <template #icon>
        <NuxtImg
          :src="getImageSrc('emote', 'think')"
          class="mx-auto h-24 w-24 object-cover sm:h-32 sm:w-32"
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
