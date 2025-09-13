<template>
  <div class="min-h-screen flex items-center justify-center">
    <n-result
      size="small"
      status="404"
      :title="t('error.404')"
      :description="t('error.notFound')"
    >
      <template #icon>
        <NuxtImg
          src="/images/404.webp"
          alt="404"
          class="w-2/3 h-2/3 object-cover"
          format="webp"
          width="400"
          height="400"
          fit="cover"
          :quality="100"
          sizes="400px sm:400px"
        />
      </template>
      <template #footer>
        <n-button
          round
          @click="handleError"
        >
          {{ t('error.returnHome') }}
        </n-button>
      </template>
    </n-result>
  </div>
</template>

<script setup lang="ts">
  const localePath = useLocalePath()
  const { t } = useI18n()

  const handleError = () => {
    navigateTo(localePath('/'))
  }
</script>
